// Renderer, camera, render-on-demand loop, quality tiers (Low/Med/High, auto + manual), FPS meter, views.
import * as THREE from 'three';
import { OrbitRig } from './controls.js';
import { state, set } from './state.js';

const TIERS = {
  low: { pixelRatio: 1, shadows: false, points: 0.35, maxDpr: 1 },
  med: { pixelRatio: 1.5, shadows: false, points: 0.7, maxDpr: 1.5 },
  high: { pixelRatio: 2, shadows: true, points: 1, maxDpr: 2 },
};

export const E = {
  renderer: null, camera: null, rig: null, canvas: null, views: {}, active: null,
  needs: true, anims: new Set(), continuous: new Set(), raf: 0, last: 0,
  frames: [], lastFrame: 0, tier: 'med', software: false, afterRender: new Set(),
};

function detectSoftware(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    E.gpu = String(name);
    return /swiftshader|llvmpipe|software|basic render/i.test(E.gpu);
  } catch { return false; }
}
function guessTier() {
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (E.software) return 'low';
  if (mobile) return cores <= 4 || mem <= 3 ? 'low' : 'med';
  return cores >= 8 ? 'high' : 'med';
}

/** Ask a throwaway WebGL context which renderer we will get (before the real one picks antialiasing). */
function probeRenderer() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    return name;
  } catch { return ''; }
}

export function createEngine(canvas) {
  E.canvas = canvas;
  const startTier = state.quality === 'auto' ? 'med' : state.quality;
  // software renderers (SwiftShader, llvmpipe) pay several times over for multisampling: skip it there
  const soft = /swiftshader|llvmpipe|software|basic render/i.test(probeRenderer());
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: startTier !== 'low' && !(soft && state.quality === 'auto'), alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  E.renderer = renderer;
  E.software = detectSoftware(renderer);
  E.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 3000);
  E.rig = new OrbitRig(E.camera, canvas, {
    onChange: () => invalidate(),
    onTap: (x, y, ev) => E.active && E.active.tap && E.active.tap(x, y, ev),
    onHover: (x, y) => E.active && E.active.hover && E.active.hover(x, y),
  });
  setTier(state.quality === 'auto' ? guessTier() : state.quality);
  window.addEventListener('resize', resize);
  resize();
  return E;
}

export function setTier(tier) {
  if (!TIERS[tier]) tier = 'med';
  E.tier = tier;
  const cfg = TIERS[tier];
  E.renderer.setPixelRatio(pixelRatioFor(cfg));
  E.renderer.shadowMap.enabled = cfg.shadows;
  document.body.classList.toggle('tier-low', tier === 'low');
  if (state.tier !== tier) set({ tier });
  for (const v of Object.values(E.views)) if (v.onTier) v.onTier(tier, cfg);
  resize();
}
export const tierConfig = () => TIERS[E.tier];
/** Device pixel ratio for a tier. A software renderer on the low tier also lowers the internal
 *  resolution of big windows (to about 0.75 megapixels), so it can keep its frame rate. */
function pixelRatioFor(cfg) {
  const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
  if (!(E.software && E.tier === 'low')) return dpr;
  const mp = (window.innerWidth * window.innerHeight * dpr * dpr) / 1e6;
  return mp > 0.75 ? Math.max(0.6, dpr * Math.sqrt(0.75 / mp)) : dpr;
}

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  if (E.software && E.tier === 'low') E.renderer.setPixelRatio(pixelRatioFor(TIERS.low));
  E.renderer.setSize(w, h, false);
  E.camera.aspect = w / h;
  applyViewOffset();
  if (E.active && E.active.resize) E.active.resize(w, h);
  invalidate();
}

// ---- safe area: the part of the screen not covered by panels ---------------------------------
// The projection centre is shifted (camera view offset) so scenes are framed in the free area.
E.safe = { left: 0, right: 0, top: 0, bottom: 0 };
function applyViewOffset() {
  const W = window.innerWidth, H = window.innerHeight, s = E.safe;
  E.camera.setViewOffset(W, H, -(s.left - s.right) / 2, -(s.top - s.bottom) / 2, W, H);
  E.camera.updateProjectionMatrix();
}
export function setSafe(s) {
  const same = ['left', 'right', 'top', 'bottom'].every(k => Math.abs((E.safe[k] || 0) - (s[k] || 0)) < 1);
  E.safe = { left: 0, right: 0, top: 0, bottom: 0, ...s };
  applyViewOffset();
  if (!same && E.active && E.active.resize) E.active.resize(window.innerWidth, window.innerHeight);
  invalidate();
}
/** Field of view (radians) of the free area: {h, v, aspect}. */
export function freeFov() {
  const W = window.innerWidth, H = window.innerHeight, s = E.safe;
  const t = Math.tan((E.camera.fov * Math.PI) / 360);
  const wf = Math.max(120, W - s.left - s.right), hf = Math.max(120, H - s.top - s.bottom);
  return { h: 2 * Math.atan((t * wf) / H), v: 2 * Math.atan((t * hf) / H), aspect: wf / hf };
}

export function registerView(name, view) { E.views[name] = view; view.name = name; }
export function switchView(name) {
  const next = E.views[name];
  if (!next || next === E.active) return;
  if (E.active && E.active.exit) E.active.exit();
  E.continuous.clear();
  E.active = next;
  if (!next.ready && next.init) { next.init(); next.ready = true; }
  if (next.enter) next.enter();
  resize();
}

export function invalidate() { E.needs = true; schedule(); }
function schedule() { if (!E.raf) E.raf = requestAnimationFrame(frame); }
/** Run fn(dt) every frame until it returns false. */
export function animate(fn) { E.anims.add(fn); schedule(); return () => E.anims.delete(fn); }
export function setContinuous(key, on) { if (on) E.continuous.add(key); else E.continuous.delete(key); schedule(); }

function frame(now) {
  E.raf = 0;
  const dt = Math.min(0.1, (now - (E.last || now)) / 1000);
  E.last = now;
  let busy = false;
  for (const a of [...E.anims]) { if (a(dt, now) === false) E.anims.delete(a); else busy = true; }
  if (E.rig.update(dt)) busy = true;
  if (E.active && E.active.update && E.active.update(dt, now)) busy = true;
  if (E.continuous.size) busy = true;
  if (E.needs || busy) {
    if (E.active) {
      E.renderer.render(E.active.scene, E.camera);
      if (E.active.afterRender) E.active.afterRender();
      for (const f of E.afterRender) f();
    }
    E.needs = false;
    // frame-time statistics only while rendering continuously
    if (E.lastFrame && now - E.lastFrame < 250) { E.frames.push(now - E.lastFrame); if (E.frames.length > 240) E.frames.shift(); autoTier(); }
    E.lastFrame = now;
  } else E.lastFrame = 0;
  if (busy) schedule();
}

/** Median and 95th-percentile frame time (ms) over the recent continuous frames. */
export function frameStats() {
  if (E.frames.length < 10) return null;
  const s = [...E.frames].sort((a, b) => a - b);
  const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, median: q(0.5), p95: q(0.95), fps: 1000 / q(0.5) };
}
let tierChecked = 0;
function autoTier() {
  if (state.quality !== 'auto' || E.frames.length < 90 || performance.now() - tierChecked < 4000) return;
  tierChecked = performance.now();
  const st = frameStats();
  if (!st) return;
  const order = ['low', 'med', 'high'];
  const i = order.indexOf(E.tier);
  if (st.p95 > 34 && i > 0) { setTier(order[i - 1]); E.frames.length = 0; }
  else if (st.median < 9 && st.p95 < 14 && i < 2 && !E.software) { setTier(order[i + 1]); E.frames.length = 0; }
}

// ---- picking ------------------------------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
export function raycastFrom(x, y, objects) {
  const r = E.canvas.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, E.camera);
  return ray.intersectObjects(objects, false);
}
const tmp = new THREE.Vector3();
/** World -> CSS pixel coordinates; null if behind the camera. */
export function toScreen(v, out = {}) {
  tmp.copy(v).project(E.camera);
  if (tmp.z > 1 || tmp.z < -1) return null;
  out.x = (tmp.x * 0.5 + 0.5) * window.innerWidth;
  out.y = (-tmp.y * 0.5 + 0.5) * window.innerHeight;
  out.z = tmp.z;
  return out;
}
