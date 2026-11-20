// Atom view: hydrogen-like orbitals psi(n,l,m) scaled with each subshell's effective nuclear charge.
// Mode "orbital": the chosen subshell, one orbital or all of them, as point clouds sampled from |psi|^2
// coloured by the sign of psi (phase), plus the 90 % probability surface on Medium/High.
// Mode "total": every occupied subshell, points in proportion to its electrons, coloured by s/p/d/f.
// Scene units: picometres. The nucleus is drawn enlarged; the factor is computed and shown.
import * as THREE from 'three';
import { E, invalidate, freeFov, tierConfig } from '../engine.js';
import { state, set } from '../state.js';
import { byZ, data } from '../data.js';
import * as O from '../../physics/orbitals.js';
import { polygonise } from '../../physics/isosurface.js';
import { configDiff, madelungConfig } from '../../physics/config.js';
import { PHASE_POS, PHASE_NEG } from '../palette.js';
import { LabelLayer } from '../labels.js';
import { t, fmtNum } from '../i18n.js';

export const L_COLORS = ['#8fd3ff', '#a6e88a', '#ffd27f', '#f4a3d6'];
const SUBSCRIPT = s => s;

/** Occupied subshells of an element with Z_eff and 90 % radius (pm). */
export function subshellsOf(e) {
  const a0 = data().constants.a0_pm[0];
  return e.cfg.map(([n, l, occ]) => {
    const key = `${n}${'spdf'[l]}`;
    const zv = e.zeff[key];
    const Zeff = zv ? zv[0] : 1;
    return { n, l, occ, key, Zeff, zSrc: zv, r90: O.radiusForFraction(n, l, Zeff, 0.9) * a0 };
  });
}
/** Subshell that received the newest electron (vs the previous element); falls back to the outermost. */
export function newestSubshell(e) {
  const subs = subshellsOf(e);
  if (e.Z > 1) {
    const prev = byZ(e.Z - 1).cfg.map(([n, l, occ]) => ({ n, l, occ }));
    const d = configDiff(prev, e.cfg.map(([n, l, occ]) => ({ n, l, occ }))).filter(x => x.to > x.from).sort((a, b) => b.n - a.n || b.l - a.l);
    if (d.length) return subs.find(s => s.n === d[0].n && s.l === d[0].l);
  }
  return subs.slice().sort((a, b) => b.n - a.n || b.l - a.l)[0];
}
export function parseOrbital(e, str) {
  const subs = subshellsOf(e);
  if (str) {
    const [key, m] = String(str).split(':');
    const s = subs.find(x => x.key === key);
    if (s) return { sub: s, m: m == null || m === 'all' ? null : Math.max(-s.l, Math.min(s.l, Number(m) | 0)) };
  }
  const s = newestSubshell(e);
  return { sub: s, m: 0 }; // default: the m = 0 orbital (p_z, d_z², f_z³) — axially symmetric, easy to read
}

function niceRadius(x) {
  const p = 10 ** Math.floor(Math.log10(x));
  for (const k of [1, 2, 5, 10]) if (k * p >= x) return k * p;
  return 10 * p;
}

export function createAtomView(hooks) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x223044, 1.4));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2);
  dl.position.set(3, 5, 4);
  scene.add(dl, dl.target);
  const root = new THREE.Group();
  scene.add(root);
  const labels = new LabelLayer(document.getElementById('labels'));
  const lblNucleus = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'tag', priority: 50, anchor: 'center' });
  const lblRing = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'tag', priority: 40, anchor: 'center' });
  const lblSub = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'tag', priority: 60, anchor: 'center' });

  const pointMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 1 }, uScale: { value: 600 }, uOpacity: { value: 0.55 } },
    vertexShader: `attribute vec3 color; uniform float uSize; uniform float uScale; varying vec3 vColor;
      void main() { vColor = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSize * uScale / -mv.z, 1.6, 9.0); }`,
    fragmentShader: `varying vec3 vColor; uniform float uOpacity;
      void main() { vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); if (d > 0.25) discard;
        float a = smoothstep(0.25, 0.05, d) * uOpacity; gl_FragColor = vec4(vColor, a); }`,
    blending: THREE.NormalBlending, depthWrite: false, transparent: true,
  });
  const surfMat = sign => new THREE.MeshStandardMaterial({ color: sign > 0 ? PHASE_POS : PHASE_NEG, roughness: 0.4, metalness: 0.0, transparent: true, opacity: 0.62, side: THREE.FrontSide, depthWrite: true });
  const protonMat = new THREE.MeshStandardMaterial({ color: 0xff6b5a, roughness: 0.5 });
  const neutronMat = new THREE.MeshStandardMaterial({ color: 0xb8c4d6, roughness: 0.5 });
  const sphereGeo = new THREE.SphereGeometry(1, 14, 10);

  let info = null; // what is on screen, for the panel
  let built = '';

  function disposeRoot() {
    for (const c of [...root.children]) {
      root.remove(c);
      c.traverse(o => { if (o.geometry && o.geometry !== sphereGeo) o.geometry.dispose(); });
    }
  }

  function cloudFor(list, colourOf, a0) {
    let total = 0;
    for (const it of list) total += it.count;
    const pos = new Float32Array(total * 3), col = new Float32Array(total * 3);
    let o = 0;
    const c = new THREE.Color();
    for (const it of list) {
      const s = O.sampleOrbital(it.n, it.l, it.m, it.Z, it.count, O.rng32(it.n * 1000 + it.l * 100 + (it.m + 10) * 7 + 13));
      for (let i = 0; i < it.count; i++, o++) {
        pos[3 * o] = s.pos[3 * i] * a0; pos[3 * o + 1] = s.pos[3 * i + 2] * a0; pos[3 * o + 2] = s.pos[3 * i + 1] * a0; // z up
        c.set(colourOf(it, s.sign[i]));
        col[3 * o] = c.r; col[3 * o + 1] = c.g; col[3 * o + 2] = c.b;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, pointMat);
  }

  function surfaceFor(sub, m, a0, res) {
    const Lg = Math.max(sub.r90 / a0 * 1.25, 1e-6);
    const grid = O.gridPsi(sub.n, sub.l, m, sub.Zeff, res, Lg);
    const level = O.isoLevelForFraction(grid, 0.9);
    const grp = new THREE.Group();
    for (const sign of [1, -1]) {
      const { positions, normals } = polygonise(grid, level, sign);
      if (!positions.length) continue;
      for (let i = 0; i < positions.length; i += 3) { // grid (x,y,z) -> scene (x, z, y), scale to pm
        const y = positions[i + 1], z = positions[i + 2];
        positions[i] *= a0; positions[i + 1] = z * a0; positions[i + 2] = y * a0;
        const ny = normals[i + 1], nz = normals[i + 2];
        normals[i + 1] = nz; normals[i + 2] = ny;
      }
      for (let t = 0; t < positions.length; t += 9) for (const arr of [positions, normals]) for (let k = 0; k < 3; k++) { const tmp = arr[t + 3 + k]; arr[t + 3 + k] = arr[t + 6 + k]; arr[t + 6 + k] = tmp; } // y<->z swap mirrors: restore winding
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      const mesh = new THREE.Mesh(g, surfMat(sign));
      mesh.renderOrder = 2;
      grp.add(mesh);
    }
    return grp;
  }

  function nucleus(e, radius) {
    const A = e.f.nucA ? e.f.nucA[0] : Math.round(e.f.aw[0] || 2 * e.Z);
    const Zp = e.Z, N = Math.max(0, A - Zp);
    const total = Zp + N;
    const rNuc = radius / Math.cbrt(total) * 0.62;
    const grp = new THREE.Group();
    const pm = new THREE.InstancedMesh(sphereGeo, protonMat, Zp), nm = new THREE.InstancedMesh(sphereGeo, neutronMat, Math.max(1, N));
    nm.count = N;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(rNuc, rNuc, rNuc), p = new THREE.Vector3();
    let ip = 0, iN = 0;
    const rand = O.rng32(e.Z * 31 + 7);
    for (let i = 0; i < total; i++) {
      // Fibonacci points filling the ball (deterministic), protons and neutrons interleaved
      const f = (i + 0.5) / total, r = radius * Math.cbrt(f) * 0.86;
      const th = Math.acos(1 - 2 * ((i * 0.618034) % 1)), ph = 2 * Math.PI * ((i * 0.7548777) % 1);
      p.set(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph));
      m4.compose(p, q, sc);
      const isP = ip < Zp && (iN >= N || rand() < Zp / total);
      if (isP) pm.setMatrixAt(ip++, m4); else nm.setMatrixAt(iN++, m4);
    }
    pm.count = ip; nm.count = iN;
    grp.add(pm, nm);
    return grp;
  }

  function build(force = false) {
    const e = byZ(state.Z);
    const tier = E.tier;
    const key = [e.Z, state.density, state.orbital, state.surf, tier].join('|');
    if (!force && key === built) return;
    built = key;
    disposeRoot();
    const a0 = data().constants.a0_pm[0];
    const subs = subshellsOf(e);
    const cfgPts = tierConfig().points;
    let extent, sel = null;
    if (state.density === 'total') {
      const budget = Math.round(70000 * cfgPts);
      const totalE = subs.reduce((s, x) => s + x.occ, 0);
      const list = [];
      for (const s of subs) {
        const per = Math.max(120, Math.round((budget * s.occ) / totalE / (2 * s.l + 1)));
        for (const m of O.mValues(s.l)) list.push({ n: s.n, l: s.l, m, Z: s.Zeff, count: per });
      }
      root.add(cloudFor(list, it => L_COLORS[it.l], a0));
      extent = Math.max(...subs.map(s => s.r90));
    } else {
      sel = parseOrbital(e, state.orbital);
      const s = sel.sub;
      const ms = sel.m == null ? O.mValues(s.l) : [sel.m];
      const per = Math.round((ms.length > 1 ? 11000 : 26000) * cfgPts);
      root.add(cloudFor(ms.map(m => ({ n: s.n, l: s.l, m, Z: s.Zeff, count: per })), (it, sign) => (sign > 0 ? PHASE_POS : PHASE_NEG), a0));
      if (state.surf && tier !== 'low' && ms.length === 1) root.add(surfaceFor(s, ms[0], a0, tier === 'high' ? 60 : 44));
      extent = s.r90 * 1.15;
    }
    // nucleus drawn at 2.5 % of the shown extent (at least visible); report the enlargement factor
    const rDraw = Math.max(extent * 0.025, 0.004);
    const rTrue = e.f.rNuc ? e.f.rNuc[0] * 1e-3 : null; // fm -> pm
    root.add(nucleus(e, rDraw));
    const factor = rTrue ? rDraw / rTrue : null;
    // scale ring in the equatorial plane
    const S = niceRadius(extent * 0.7);
    const ringGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, i) => new THREE.Vector3(S * Math.cos((i / 128) * 2 * Math.PI), 0, S * Math.sin((i / 128) * 2 * Math.PI))));
    root.add(new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.45 })));
    lblRing.pos.set(S, 0, 0);
    labels.setText(lblRing, `${fmtNum(S, 3)} pm`);
    lblNucleus.pos.set(0, -rDraw * 1.6, 0);
    labels.setText(lblNucleus, factor ? t('atom.nucleusX', { x: fmtNum(factor, 0, { sig: 2 }) }) : t('atom.nucleus'));
    if (sel) { lblSub.pos.set(0, Math.min(sel.sub.r90, extent) * 0.95, 0); labels.setText(lblSub, orbitalName(sel.sub, sel.m)); lblSub.priority = 60; }
    else lblSub.priority = -1;
    pointMat.uniforms.uSize.value = extent / (state.density === 'total' ? 140 : 110);
    info = { e, subs, sel, extent, rDraw, rTrue, factor, S };
    frame(extent);
    if (hooks.onBuilt) hooks.onBuilt(info);
    invalidate();
  }

  function frame(extent, dur = state.reduced ? 0 : 0.6) {
    const fov = freeFov();
    const r = (extent * 1.1) / Math.tan(Math.min(fov.v, fov.h) / 2);
    E.camera.near = Math.max(extent / 2000, 1e-4); E.camera.far = extent * 400; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: extent * 0.05, rMax: extent * 40, phiMin: 0.05, phiMax: Math.PI - 0.05 };
    E.rig.flyTo({ target: new THREE.Vector3(0, 0, 0), r, theta: E.rig.theta || 0.6, phi: 1.15 }, dur);
  }

  const view = {
    scene,
    init() {},
    enter() { labels.enabled = true; built = ''; build(true); },
    exit() { labels.enabled = false; labels.hideAll(); E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix(); },
    resize() { pointMat.uniforms.uScale.value = window.innerHeight / (2 * Math.tan((E.camera.fov * Math.PI) / 360)); if (info) frame(info.extent, 0); },
    afterRender() { labels.update(); },
    onTier() { if (E.active === view) build(true); },
    onState(ch) {
      if (E.active !== view) return;
      if (['Z', 'density', 'orbital', 'surf'].some(k => k in ch)) build();
      if ('lang' in ch && info) { built = ''; build(true); }
    },
    info: () => info,
  };
  pointMat.uniforms.uScale.value = window.innerHeight / (2 * Math.tan((38 * Math.PI) / 360));
  return view;
}

export function orbitalName(sub, m) {
  if (m == null) return sub.l === 0 ? sub.key : `${sub.key} (${2 * sub.l + 1})`;
  const suf = O.ORBITAL_SUFFIX[sub.l][m];
  return suf ? `${sub.key} ${suf}` : sub.key;
}
