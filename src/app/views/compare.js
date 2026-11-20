// Compare view: two atoms side by side at one true scale (covalent or van der Waals radius, pm).
import * as THREE from 'three';
import { E, invalidate, animate, freeFov } from '../engine.js';
import { state } from '../state.js';
import { byZ } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { LabelLayer } from '../labels.js';
import { t, fmtNum } from '../i18n.js';

export const radiusOf = (e, mode) => {
  const v = mode === 'vdw' ? e.f.rVdw : e.f.rCov;
  return v && v[0] != null ? v : null;
};

export function createCompareView() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x1d2638, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-2, 4, 3);
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.02, 64), new THREE.MeshStandardMaterial({ color: 0x101a2e, roughness: 0.9 }));
  scene.add(floor);
  const geo = new THREE.SphereGeometry(1, 48, 32);
  const mk = () => new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }));
  const A = mk(), B = mk();
  scene.add(A, B);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffcf6b }));
  scene.add(bar);
  const labels = new LabelLayer(document.getElementById('labels'));
  const lA = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'tag', priority: 10, anchor: 'center' });
  const lB = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'tag', priority: 10, anchor: 'center' });
  const lBar = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'axis', priority: 5, anchor: 'center' });
  let cur = { a: 100, b: 100 }, tween = null;

  function place(ra, rb) {
    const gap = Math.max(ra, rb) * 0.45;
    A.scale.setScalar(ra); B.scale.setScalar(rb);
    A.position.set(-(gap / 2 + ra), ra, 0); B.position.set(gap / 2 + rb, rb, 0);
    const w = 2 * ra + 2 * rb + gap;
    floor.scale.set(w * 0.62, 1, w * 0.36); floor.position.set(rb - ra, -0.01, 0);
    lA.pos.set(A.position.x, 2 * ra + Math.max(ra, rb) * 0.12, 0); lB.pos.set(B.position.x, 2 * rb + Math.max(ra, rb) * 0.12, 0);
    // scale bar: a round length close to the smaller radius, lying in front of the atoms
    const s = [10, 20, 50, 100, 200, 500].find(v => v >= Math.min(ra, rb) * 0.6) || 500;
    bar.scale.set(s, Math.max(ra, rb) * 0.02, Math.max(ra, rb) * 0.02);
    bar.position.set(rb - ra, 0.02 * Math.max(ra, rb), Math.max(ra, rb) * 1.15);
    lBar.pos.set(rb - ra, 0, Math.max(ra, rb) * 1.15 + Math.max(ra, rb) * 0.18);
    labels.setText(lBar, `${s} pm`);
    return w;
  }
  function frame(w, dur, cx = 0) {
    const fov = freeFov();
    const r = (w * 0.78) / Math.tan(Math.min(fov.h, fov.v * 1.3) / 2);
    E.camera.near = w / 500; E.camera.far = w * 60; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: w * 0.3, rMax: w * 10, phiMin: 0.2, phiMax: 1.5 };
    // aim at the middle of the pair (the atoms differ in size, so the pair is not centred on x = 0)
    E.rig.flyTo({ target: new THREE.Vector3(cx, w * 0.12, 0), r, theta: 0, phi: 1.2 }, dur);
  }
  function build(animated) {
    const a = byZ(state.Z), b = byZ(state.Z2);
    const mode = state.cmpR || 'cov';
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    A.material.color.set(pal[a.f.cat[0]]); B.material.color.set(pal[b.f.cat[0]]);
    const ra = radiusOf(a, mode), rb = radiusOf(b, mode);
    const fallback = Math.max(ra?.[0] || 0, rb?.[0] || 0) || 150;
    const ta = ra ? ra[0] : fallback, tb = rb ? rb[0] : fallback;
    A.material.transparent = !ra; A.material.opacity = ra ? 1 : 0.18; B.material.transparent = !rb; B.material.opacity = rb ? 1 : 0.18;
    labels.setText(lA, `${a.sym} · ${ra ? fmtNum(ta, 0) + ' pm' : t('tip.nodata')}`);
    labels.setText(lB, `${b.sym} · ${rb ? fmtNum(tb, 0) + ' pm' : t('tip.nodata')}`);
    if (tween) tween();
    const from = { ...cur };
    if (!animated || state.reduced) { cur = { a: ta, b: tb }; frame(place(ta, tb), 0, tb - ta); invalidate(); return; }
    let k = 0;
    frame(2 * ta + 2 * tb + Math.max(ta, tb) * 0.45, 0.5, tb - ta);
    tween = animate(dt => {
      k = Math.min(1, k + dt / 0.45);
      const s = 1 - (1 - k) ** 3;
      cur = { a: from.a + (ta - from.a) * s, b: from.b + (tb - from.b) * s };
      place(cur.a, cur.b);
      if (k >= 1) { tween = null; return false; }
      return true;
    });
  }
  const view = {
    scene,
    init() {},
    enter() { labels.enabled = true; build(false); },
    exit() { labels.enabled = false; labels.hideAll(); E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix(); },
    resize() { if (E.active === view) frame(2 * cur.a + 2 * cur.b + Math.max(cur.a, cur.b) * 0.45, 0, cur.b - cur.a); },
    afterRender() { labels.update(); },
    onState(ch) { if (E.active === view && ['Z', 'Z2', 'cmpR', 'cb'].some(k => k in ch)) build(true); },
  };
  return view;
}
