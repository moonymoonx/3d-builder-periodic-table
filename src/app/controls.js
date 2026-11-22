// Orbit / pan / zoom camera rig for mouse, touch (one-finger rotate, two-finger pinch+pan) and wheel.
// Emits tap(x, y) for short clicks and hover(x, y) for mouse moves. Damped; render-on-demand friendly.
import * as THREE from 'three';

export class OrbitRig {
  constructor(camera, dom, { onChange, onTap, onHover } = {}) {
    this.camera = camera; this.dom = dom;
    this.target = new THREE.Vector3(); this.r = 20; this.theta = 0; this.phi = 1.0;
    this.v = { theta: 0, phi: 0, r: 0, px: 0, py: 0 };
    this.lim = { rMin: 0.5, rMax: 200, phiMin: 0.05, phiMax: Math.PI - 0.05 };
    this.enabled = true; this.onChange = onChange; this.onTap = onTap; this.onHover = onHover;
    this.pointers = new Map(); this.tween = null; this.damping = 6; this.reduced = false;
    // pointer parallax (a depth cue on desktop, STYLE.md §6) and an optional one-finger "scrub" mode
    // for touch screens (the phone loupe): { start(x, y), move(x, y), end(x, y), cancel() }
    this.par = { x: 0, y: 0, tx: 0, ty: 0 }; this.parallaxOn = false; this.scrub = null;
    this._attach();
    this.apply();
  }
  set(o) { Object.assign(this, o); this.apply(); }
  _attach() {
    const d = this.dom;
    let down = null, pinch = null;
    d.addEventListener('contextmenu', e => e.preventDefault());
    d.addEventListener('pointerdown', e => {
      if (!this.enabled) return;
      try { d.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.tween = null;
      if (this.pointers.size === 1) {
        down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, button: e.button, shift: e.shiftKey, scrub: false };
        if (this.scrub && e.pointerType === 'touch') { if (this.touchPan && this.touchPan()) down.pan = true; else { down.scrub = true; this.scrub.start(e.clientX, e.clientY); } }
      }
      if (this.pointers.size === 2) { if (down && down.scrub && this.scrub) this.scrub.cancel(); pinch = this._pinchState(); down = null; }
    });
    d.addEventListener('pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!p) { if (e.pointerType === 'mouse' && this.onHover) this.onHover(e.clientX, e.clientY); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 1 && down) {
        down.moved += Math.abs(dx) + Math.abs(dy);
        if (down.scrub) { this.scrub.move(e.clientX, e.clientY); return; }
        if (down.button === 2 || down.shift || down.pan) this.pan(dx, dy); else this.rotate(dx, dy);
      } else if (this.pointers.size === 2 && pinch) {
        const s = this._pinchState();
        if (s.dist > 0 && pinch.dist > 0) this.zoom(pinch.dist / s.dist);
        this.pan(s.cx - pinch.cx, s.cy - pinch.cy);
        pinch = s;
      }
    });
    const up = e => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (down && down.scrub && this.pointers.size === 0) { this.scrub.end(e.clientX, e.clientY, e.type === 'pointercancel'); down = null; return; }
      if (down && this.pointers.size === 0 && down.moved < 7 && performance.now() - down.t < 600 && this.onTap) this.onTap(e.clientX, e.clientY, e);
      if (this.pointers.size < 2) pinch = null;
      if (this.pointers.size === 0) down = null;
    };
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
    d.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && this.onHover) this.onHover(null, null); });
    d.addEventListener('wheel', e => {
      if (!this.enabled) return;
      e.preventDefault();
      const k = e.deltaMode === 1 ? 0.05 : 0.0015;
      this.zoom(Math.exp(e.deltaY * k));
    }, { passive: false });
  }
  _pinchState() {
    const [a, b] = [...this.pointers.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  }
  rotate(dx, dy) {
    const k = 5.5 / Math.max(300, this.dom.clientHeight);
    this.v.theta -= dx * k * 60; this.v.phi -= dy * k * 60;
    this._kick();
  }
  pan(dx, dy) {
    const h = this.dom.clientHeight || 600;
    const s = (2 * this.r * Math.tan((this.camera.fov * Math.PI) / 360)) / h;
    this.v.px -= dx * s * 60; this.v.py += dy * s * 60;
    this._kick();
  }
  zoom(f) {
    this.r = THREE.MathUtils.clamp(this.r * f, this.lim.rMin, this.lim.rMax);
    this.apply(); this._kick();
  }
  _kick() { this.moving = true; if (this.onChange) this.onChange(); }
  /** Lean the camera slightly toward the pointer: nx, ny in [-0.5, 0.5]; max in radians. */
  parallax(nx, ny, max) {
    if (!this.parallaxOn || this.reduced) { this.par.tx = this.par.ty = 0; } else { this.par.tx = -nx * 2 * max; this.par.ty = -ny * 2 * max * 0.6; }
    this._kick();
  }
  /** Advance damping; returns true while still moving. */
  update(dt) {
    const pa = this.par;
    let parMoving = false;
    if (Math.abs(pa.tx - pa.x) + Math.abs(pa.ty - pa.y) > 1e-5) {
      const k = 1 - Math.exp(-dt / 0.1);
      pa.x += (pa.tx - pa.x) * k; pa.y += (pa.ty - pa.y) * k;
      parMoving = true;
      if (!this.tween) this.apply();
    }
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - (-2 * tw.t + 2) ** 3 / 2;
      this.target.lerpVectors(tw.from.target, tw.to.target, k);
      this.r = tw.from.r + (tw.to.r - tw.from.r) * k;
      this.theta = tw.from.theta + (tw.to.theta - tw.from.theta) * k;
      this.phi = tw.from.phi + (tw.to.phi - tw.from.phi) * k;
      this.apply();
      if (tw.t >= 1) { this.tween = null; if (tw.done) tw.done(); }
      return true;
    }
    const v = this.v;
    const decay = Math.exp(-this.damping * dt);
    const any = Math.abs(v.theta) + Math.abs(v.phi) + Math.abs(v.px) + Math.abs(v.py) > 1e-5;
    if (!any) { this.moving = false; return parMoving; }
    this.theta += v.theta * dt; this.phi += v.phi * dt;
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
    const upv = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    this.target.addScaledVector(right, v.px * dt).addScaledVector(upv, v.py * dt);
    if (this.bounds) this.bounds(this.target, v); // a view may keep the target over its scene
    for (const k of ['theta', 'phi', 'px', 'py']) v[k] *= decay;
    this.apply();
    return true;
  }
  apply() {
    this.phi = THREE.MathUtils.clamp(this.phi, this.lim.phiMin, this.lim.phiMax);
    this.r = THREE.MathUtils.clamp(this.r, this.lim.rMin, this.lim.rMax);
    if (this.lim.box) this.target.clamp(this.lim.box.min, this.lim.box.max);
    const th = this.theta + this.par.x, ph = THREE.MathUtils.clamp(this.phi + this.par.y, 0.02, Math.PI - 0.02);
    const sp = Math.sin(ph);
    this.camera.position.set(
      this.target.x + this.r * sp * Math.sin(th),
      this.target.y + this.r * Math.cos(ph),
      this.target.z + this.r * sp * Math.cos(th));
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }
  stop() { this.v = { theta: 0, phi: 0, r: 0, px: 0, py: 0 }; this.tween = null; }
  /** Move the goal of the glide under way (its timing and easing carry on); with no glide, jump there. */
  retarget(to, done) {
    if (!this.tween) { this.flyTo(to, 0, done); return; }
    const g = this.tween.to;
    if (to.target) g.target.copy(to.target);
    if (to.r != null) g.r = to.r;
    if (to.phi != null) g.phi = to.phi;
    if (to.theta != null) {
      g.theta = to.theta;
      while (g.theta - this.tween.from.theta > Math.PI) g.theta -= 2 * Math.PI;
      while (g.theta - this.tween.from.theta < -Math.PI) g.theta += 2 * Math.PI;
    }
    if (done) this.tween.done = done;
  }
  flyTo(to, dur = 0.9, done) {
    const goal = { target: (to.target || this.target).clone(), r: to.r ?? this.r, theta: to.theta ?? this.theta, phi: to.phi ?? this.phi };
    // shortest way round in theta
    while (goal.theta - this.theta > Math.PI) goal.theta -= 2 * Math.PI;
    while (goal.theta - this.theta < -Math.PI) goal.theta += 2 * Math.PI;
    this.stop();
    if (this.reduced || dur <= 0) {
      this.target.copy(goal.target); this.r = goal.r; this.theta = goal.theta; this.phi = goal.phi; this.apply();
      if (done) done(); if (this.onChange) this.onChange(); return;
    }
    this.tween = { t: 0, dur, from: { target: this.target.clone(), r: this.r, theta: this.theta, phi: this.phi }, to: goal, done };
    if (this.onChange) this.onChange();
  }
}
