// Table view: 118 instanced columns; layouts 18-column, 32-column and helix (32 columns wrapped on
// a cylinder, Z continuous, groups aligned — after de Chancourtois' 1862 "telluric screw").
// Height = chosen property (linear from zero, or log); ghost = no data; stripes = predicted; dim = filtered.
import * as THREE from 'three';
import { E, invalidate, animate, raycastFrom, tierConfig, freeFov } from '../engine.js';
import { state, set } from '../state.js';
import { elements, propValue, propRange, prop, stateAt, fmtProp, name, isPred } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB, STATE_COLORS } from '../palette.js';
import { LabelLayer } from '../labels.js';
import { t } from '../i18n.js';

const COLW = 0.86, HMAX = 6, HMIN = 0.16, GHOST_H = 0.14;
const HELIX_R = (32 * 1.06) / (2 * Math.PI), HELIX_DY = 1.45, HELIX_H = 0.5; // radial columns are drawn at half height
const UP = new THREE.Vector3(0, 1, 0);

export function layoutPose(e, layout, out = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }) {
  if (layout === 'helix') {
    const a = (e.col32 / 32) * Math.PI * 2;
    const turn = e.f.period[0] - 1 + e.col32 / 32;
    out.pos.set(HELIX_R * Math.sin(a), 5.2 - turn * HELIX_DY, HELIX_R * Math.cos(a));
    out.quat.setFromUnitVectors(UP, new THREE.Vector3(Math.sin(a), 0, Math.cos(a)));
  } else if (layout === 's32') {
    out.pos.set(e.col32 - 15.5, 0, e.f.period[0] - 1 - 3);
    out.quat.identity();
  } else {
    const f = e.fIndex != null;
    const x = f ? e.fIndex + 2 : e.f.group[0] - 1;
    const z = f ? (e.f.period[0] === 6 ? 7.7 : 8.7) : e.f.period[0] - 1;
    out.pos.set(x - 8.5, 0, z - 4.35);
    out.quat.identity();
  }
  return out;
}

export function matchesFilters(e) {
  const F = state.filters;
  if (F.cats && !F.cats.has(e.f.cat[0])) return false;
  if (F.blocks && !F.blocks.has(e.f.block[0])) return false;
  if (F.group && e.f.group[0] !== F.group) return false;
  if (F.period && e.f.period[0] !== F.period) return false;
  if (F.state && stateAt(e, state.T).s !== F.state) return false;
  if (F.origin) {
    const o = e.f.natural[0];
    if (F.origin === 'natural' ? o === 'synthetic' : o !== F.origin) return false;
  }
  return true;
}

export function createTableView(hooks) {
  const scene = new THREE.Scene();
  const els = elements();
  const N = els.length;
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x1b2236, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-9, 22, 15);
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  const fill = new THREE.DirectionalLight(0x9cc2ff, 0.7);
  fill.position.set(14, 9, -12);
  scene.add(key, fill);

  // ---- columns -------------------------------------------------------------------------
  const geo = new THREE.BoxGeometry(COLW, 1, COLW);
  geo.translate(0, 0.5, 0);
  const fx = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  geo.setAttribute('aFx', fx);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.06 });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aFx;\nvarying vec3 vFx;\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFx = aFx;\nvWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFx;\nvarying vec3 vWP;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vFx.x > 0.5) { float s = step(0.5, fract((vWP.x + vWP.y + vWP.z) * 3.2)); diffuseColor.rgb *= mix(1.0, 0.42, s); }
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.11, 0.135, 0.19), vFx.y * 0.85);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vFx.z * 0.45;');
  };
  const solid = new THREE.InstancedMesh(geo, mat, N);
  solid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  solid.castShadow = true; solid.receiveShadow = true;
  solid.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  const ghostGeo = new THREE.BoxGeometry(COLW, 1, COLW); ghostGeo.translate(0, 0.5, 0);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xc5d4ff, transparent: true, opacity: 0.17, depthWrite: false });
  const ghost = new THREE.InstancedMesh(ghostGeo, ghostMat, N);
  ghost.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(solid, ghost);

  // base slab (flat layouts) and core cylinder (helix)
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x0f1a30, roughness: 0.9, metalness: 0.0 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), slabMat);
  slab.receiveShadow = true;
  scene.add(slab);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(HELIX_R - 0.55, HELIX_R - 0.55, 11.2, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x16243f, roughness: 0.85, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  scene.add(core);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 40), new THREE.MeshBasicMaterial({ color: 0xffcf6b, side: THREE.DoubleSide }));
  scene.add(ring);

  // ---- per-element animated pose -------------------------------------------------------
  const cur = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: 0.0001, ghost: false }));
  const tgt = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: 0.0001, ghost: false }));
  const from = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: 0 }));
  let tween = null;
  const m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), col = new THREE.Color();

  const labels = new LabelLayer(document.getElementById('labels'));
  const elLabels = els.map(e => labels.add({ pos: new THREE.Vector3(), text: e.sym, priority: 1, data: e }));
  const axisLabels = [];

  function heightFor(e) {
    const v = propValue(e, state.prop);
    if (!v) return null;
    const p = prop(state.prop);
    const log = state.log;
    const { lo, hi } = rangeCache(state.prop, log);
    const x = v[0];
    let f;
    if (log) { if (!(x > 0)) return null; f = (Math.log10(x) - Math.log10(lo)) / Math.max(1e-9, Math.log10(hi) - Math.log10(lo)); }
    else if (p.key === 'year') f = (x - lo) / Math.max(1e-9, hi - lo);
    else { const base = Math.min(0, lo); f = (x - base) / Math.max(1e-9, hi - base); }
    return HMIN + Math.max(0, Math.min(1, f)) * (HMAX - HMIN);
  }
  const ranges = new Map();
  function rangeCache(key, log) { const k = key + log; if (!ranges.has(k)) ranges.set(k, propRange(key, log)); return ranges.get(k); }

  function computeTargets() {
    for (let i = 0; i < N; i++) {
      const e = els[i];
      layoutPose(e, state.layout, tgt[i]);
      const h = heightFor(e);
      tgt[i].ghost = h == null;
      tgt[i].h = h == null ? GHOST_H : state.layout === 'helix' ? h * HELIX_H : h;
    }
  }
  function writeInstances() {
    for (let i = 0; i < N; i++) {
      const c = cur[i];
      sc.set(1, Math.max(0.0001, c.h), 1);
      m4.compose(c.pos, c.quat, sc);
      if (c.ghost) { ghost.setMatrixAt(i, m4); m4.makeScale(0, 0, 0); solid.setMatrixAt(i, m4); }
      else { solid.setMatrixAt(i, m4); m4.makeScale(0, 0, 0); ghost.setMatrixAt(i, m4); }
      // label anchor: top of the column (outer end for the helix)
      const lb = elLabels[i];
      lb.pos.set(0, c.h + 0.12, 0).applyQuaternion(c.quat).add(c.pos);
      (lb.nrm || (lb.nrm = new THREE.Vector3())).set(0, 1, 0).applyQuaternion(c.quat);
    }
    solid.instanceMatrix.needsUpdate = true; ghost.instanceMatrix.needsUpdate = true;
    solid.computeBoundingSphere(); ghost.computeBoundingSphere();
  }
  function writeColours() {
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    for (let i = 0; i < N; i++) {
      const e = els[i];
      const st = state.color === 'state' ? stateAt(e, state.T) : null;
      col.set(st ? STATE_COLORS[st.s] : pal[e.f.cat[0]]);
      solid.setColorAt(i, col);
      const v = propValue(e, state.prop);
      const hatch = (v && isPred(v)) || (st && st.p) ? 1 : 0;
      const dim = matchesFilters(e) ? 0 : 1;
      const sel = e.Z === state.Z ? 1 : hovered === e.Z ? 0.5 : 0;
      fx.setXYZ(i, hatch, dim, sel);
      const lbl = elLabels[i];
      labels.setClass(lbl, (e.Z === state.Z ? 'sel' : '') + (dim ? ' dim' : ''));
      lbl.priority = e.Z === state.Z ? 100 : hovered === e.Z ? 90 : dim ? 0.5 : 1 + (e.f.group[0] ? 0 : -0.1);
      if (e.Z === state.Z) labels.setText(lbl, e.sym, v ? fmtProp(state.prop, v) : t('tip.nodata'));
      else labels.setText(lbl, e.sym, '');
    }
    solid.instanceColor.needsUpdate = true; fx.needsUpdate = true;
  }
  function placeSelectionRing() {
    const i = state.Z - 1;
    const c = cur[i];
    ring.position.copy(c.pos).add(new THREE.Vector3(0, 0.02, 0).applyQuaternion(c.quat));
    ring.quaternion.copy(c.quat).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
  }
  function rebuildAxisLabels() {
    for (const a of axisLabels) { a.el.remove(); labels.items.splice(labels.items.indexOf(a), 1); }
    axisLabels.length = 0;
    if (state.layout === 'helix') return;
    // group numbers along the back edge, period numbers along the left edge
    const xs = new Map();
    let zBack = Infinity, xLeft = Infinity;
    for (const e of els) {
      const p = layoutPose(e, state.layout).pos;
      if (e.fIndex == null) { zBack = Math.min(zBack, p.z); xLeft = Math.min(xLeft, p.x); }
      if (e.fIndex == null && e.f.group[0] && !xs.has(e.f.group[0])) xs.set(e.f.group[0], p.x);
    }
    for (const [g, x] of xs) axisLabels.push(labels.add({ pos: new THREE.Vector3(x, 0.02, zBack - 0.95), text: String(g), cls: 'axis', priority: 0.2, anchor: 'center' }));
    for (let per = 1; per <= 7; per++) {
      const e = els.find(x => x.f.period[0] === per && x.f.group[0] === 1);
      const p = layoutPose(e, state.layout).pos;
      axisLabels.push(labels.add({ pos: new THREE.Vector3(xLeft - 1.0, 0.02, p.z), text: String(per), cls: 'axis', priority: 0.2, anchor: 'center' }));
    }
  }
  function layoutDecor() {
    const flat = state.layout !== 'helix';
    slab.visible = flat; core.visible = !flat;
    if (flat) {
      const w = state.layout === 's32' ? 33.4 : 19.4, d = state.layout === 's32' ? 8.6 : 11.2;
      slab.scale.set(w, 1, d);
      slab.position.set(0, -0.15, state.layout === 's32' ? 0 : 0.15);
    }
  }

  // ---- transitions --------------------------------------------------------------------
  function morph() {
    computeTargets();
    const dur = state.reduced ? 0 : 0.75;
    for (let i = 0; i < N; i++) { from[i].pos.copy(cur[i].pos); from[i].quat.copy(cur[i].quat); from[i].h = cur[i].h; cur[i].ghost = tgt[i].ghost; }
    layoutDecor();
    if (!dur || !initialised) {
      for (let i = 0; i < N; i++) { cur[i].pos.copy(tgt[i].pos); cur[i].quat.copy(tgt[i].quat); cur[i].h = tgt[i].h; }
      writeInstances(); placeSelectionRing(); invalidate(); initialised = true; return;
    }
    if (tween) tween();
    let k = 0;
    tween = animate(dt => {
      k = Math.min(1, k + dt / dur);
      const s = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      for (let i = 0; i < N; i++) {
        const d = Math.min(1, Math.max(0, s * 1.25 - (i / N) * 0.25)); // slight wave by Z
        cur[i].pos.lerpVectors(from[i].pos, tgt[i].pos, d);
        cur[i].quat.slerpQuaternions(from[i].quat, tgt[i].quat, d);
        cur[i].h = from[i].h + (tgt[i].h - from[i].h) * d;
      }
      writeInstances(); placeSelectionRing();
      if (k >= 1) { tween = null; return false; }
      return true;
    });
  }
  let initialised = false;
  let hovered = 0;

  // ---- camera framing --------------------------------------------------------------------
  function frame(dur = 0.9) {
    const fov = freeFov();
    const vfov = fov.v, hfov = fov.h;
    const portrait = fov.aspect < 0.8;
    if (state.layout === 'helix') {
      const r = Math.max(10.5 / Math.tan(Math.min(vfov, hfov) / 2), 18);
      E.rig.lim = { rMin: 6, rMax: 120, phiMin: 0.2, phiMax: Math.PI - 0.2 };
      E.rig.flyTo({ target: new THREE.Vector3(0, 0.2, 0), r, theta: 0.35, phi: 1.12 }, dur);
      return;
    }
    const halfW = state.layout === 's32' ? 17.6 : 10.4;
    const halfD = state.layout === 's32' ? 4.8 : 6.2;
    const phi = portrait ? 0.62 : state.layout === 's32' ? 0.62 : 0.95;
    // fit both the width and the (foreshortened) depth into the view
    const rW = halfW / Math.tan(hfov / 2);
    const rD = (halfD * Math.cos(phi) + HMAX * 0.5 * Math.sin(phi)) / Math.tan(vfov / 2) + halfD * Math.sin(phi);
    const r = Math.max(rW, rD) * 1.02;
    E.rig.lim = { rMin: 3, rMax: 140, phiMin: 0.08, phiMax: 1.45 };
    E.rig.flyTo({ target: new THREE.Vector3(0, portrait ? 0.4 : 1.0, state.layout === 's32' ? 0.2 : 0.6), r, theta: 0, phi }, dur);
  }

  // ---- picking -------------------------------------------------------------------------
  function pickAt(x, y) {
    const hits = raycastFrom(x, y, [solid, ghost]);
    for (const h of hits) if (h.instanceId != null) {
      const c = cur[h.instanceId];
      if ((h.object === ghost) !== c.ghost) continue; // skip zero-scaled twin
      return els[h.instanceId];
    }
    return null;
  }

  const view = {
    scene,
    init() { computeTargets(); morph(); rebuildAxisLabels(); writeColours(); },
    enter() {
      labels.enabled = true;
      key.castShadow = tierConfig().shadows;
      frame(state.reduced ? 0 : 0.8);
      writeColours(); invalidate();
    },
    exit() { labels.enabled = false; labels.hideAll(); hooks.tooltip(null); },
    onTier(tier, cfg) { key.castShadow = cfg.shadows; mat.needsUpdate = true; invalidate(); },
    resize() { if (view.ready) frame(0); },
    afterRender() {
      if (state.layout === 'helix') { // hide labels on the far side of the cylinder
        const cam = E.camera.position;
        for (const lb of elLabels) {
          const back = lb.nrm && (cam.x - lb.pos.x) * lb.nrm.x + (cam.z - lb.pos.z) * lb.nrm.z < 0;
          if (back) lb.priority = -1;
          else if (lb.priority < 0) lb.priority = lb.data.Z === state.Z ? 100 : 1;
        }
      } else for (const lb of elLabels) if (lb.priority < 0) lb.priority = lb.data.Z === state.Z ? 100 : 1;
      labels.update();
    },
    onState(ch) {
      if ('layout' in ch) { morph(); rebuildAxisLabels(); frame(); writeColours(); }
      else if ('prop' in ch || 'log' in ch) { morph(); writeColours(); }
      if ('Z' in ch || 'color' in ch || 'T' in ch || 'filters' in ch || 'cb' in ch || 'lang' in ch) { writeColours(); placeSelectionRing(); }
      invalidate();
    },
    tap(x, y) {
      const e = pickAt(x, y);
      if (e) { if (e.Z === state.Z && hooks.onOpen) hooks.onOpen(e); else hooks.onSelect(e); }
    },
    hover(x, y) {
      const e = x == null ? null : pickAt(x, y);
      const z = e ? e.Z : 0;
      E.canvas.style.cursor = e ? 'pointer' : '';
      if (z !== hovered) { hovered = z; writeColours(); invalidate(); }
      hooks.tooltip(e ? { x, y, e, text: fmtProp(state.prop, propValue(e, state.prop)) } : null);
    },
    focus(Z, dur = 0.7) {
      const c = cur[Z - 1];
      const top = new THREE.Vector3(0, c.h * 0.5, 0).applyQuaternion(c.quat).add(c.pos);
      E.rig.flyTo({ target: top, r: Math.min(E.rig.r, 9) }, dur);
    },
    frame,
    poseOf: Z => cur[Z - 1],
    columnTop(Z) { const c = cur[Z - 1]; return new THREE.Vector3(0, c.h, 0).applyQuaternion(c.quat).add(c.pos); },
  };
  return view;
}
