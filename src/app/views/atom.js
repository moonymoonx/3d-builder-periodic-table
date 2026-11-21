// Atom view, "Look inside the atom" (STYLE.md §6): the atom as a stippled engraving on paper.
// Electron clouds are hydrogen-like orbitals psi(n,l,m) scaled by each subshell's effective nuclear
// charge (Clementi–Raimondi; Slater's rules where they have no value), sampled from |psi|^2, so every
// dot is a place an electron could be found.
//   whole atom (default): every electron as ink stipple; each shell's 90 % sphere as a fine ink ring with
//                         its electron count (the "4 shells (2, 8, 14, 2)" of the caption, made visible);
//                         the cloud that took the newest electron in its phase inks (vermilion +, cobalt −)
//   one cloud:            one orbital (or all of a subshell) in its phase inks, inside its 90 % surface
//                         drawn as a thin glaze (medium and high quality)
//   its light:            the room dims (places/atom.js) and the atom glows in the colour of its lines
// The nucleus is a cluster of matte beads (protons in the element's glaze, neutrons in porcelain). It is
// drawn enlarged, never smaller than a few pixels and never outside the first shell; the factor is shown.
// Scene units: picometres; orbital z is drawn upward. Renders on demand: a change animates briefly.
import * as THREE from 'three';
import { E, invalidate, freeFov, tierConfig, animate, toScreen } from '../engine.js';
import { state } from '../state.js';
import { byZ, data } from '../data.js';
import * as O from '../../physics/orbitals.js';
import { polygonise } from '../../physics/isosurface.js';
import { configDiff } from '../../physics/config.js';
import { LabelLayer } from '../labels.js';
import { t, fmtNum } from '../i18n.js';
import { color as TOK, light as LIGHT, phaseInk, pigment, pigmentCB, motion } from '../../design/tokens.js';


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
/** Shells (n) with their electrons and the radius (pm) holding 90 % of those electrons together. */
export function shellsOf(e) {
  const a0 = data().constants.a0_pm[0], subs = subshellsOf(e);
  return [...new Set(subs.map(s => s.n))].sort((a, b) => a - b).map(n => {
    const mine = subs.filter(s => s.n === n), occ = mine.reduce((a, s) => a + s.occ, 0);
    const cdfs = mine.map(s => ({ s, c: O.radialCDF(s.n, s.l, s.Zeff, 1024) }));
    const P = r => cdfs.reduce((a, { s, c }) => { const x = r / c.dr; const i = Math.min(c.cdf.length - 1, Math.floor(x)); const j = Math.min(c.cdf.length - 1, i + 1); return a + (s.occ * (c.cdf[i] + (c.cdf[j] - c.cdf[i]) * (x - i))) / c.total; }, 0) / occ;
    let lo = 0, hi = Math.max(...cdfs.map(x => x.c.rmax));
    for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (P(mid) < 0.9) lo = mid; else hi = mid; }
    return { n, occ, r90: hi * a0 };
  });
}
const cfgList = e => e.cfg.map(([n, l, occ]) => ({ n, l, occ }));
/** Subshell that received the newest electron (vs the previous element); falls back to the outermost. */
export function newestSubshell(e) {
  const subs = subshellsOf(e);
  if (e.Z > 1) {
    const d = configDiff(cfgList(byZ(e.Z - 1)), cfgList(e)).filter(x => x.to > x.from).sort((a, b) => (b.to - b.from) - (a.to - a.from) || b.n - a.n || b.l - a.l);
    if (d.length) return subs.find(s => s.n === d[0].n && s.l === d[0].l);
  }
  return subs.slice().sort((a, b) => b.n - a.n || b.l - a.l)[0];
}
/** What adding the last proton did to the electrons: 'first' (hydrogen), 'add' (one more electron in
 *  one subshell) or 'rearr' (electrons also moved: the element breaks the usual filling order). */
export function stepChange(e) {
  if (e.Z === 1) return { kind: 'first', sub: newestSubshell(e), diff: [] };
  const diff = configDiff(cfgList(byZ(e.Z - 1)), cfgList(e));
  const simple = diff.length === 1 && diff[0].to === diff[0].from + 1;
  return { kind: simple ? 'add' : 'rearr', sub: newestSubshell(e), diff };
}
/** Electrons in each shell, from the configuration: [[n, electrons], …] by n. */
export function shellCounts(e) {
  const m = new Map();
  for (const [n, , occ] of e.cfg) m.set(n, (m.get(n) || 0) + occ);
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}
/** The orbital shown first for a subshell: the round s cloud, p_z (a dumbbell standing upright), d_xz
 *  (a cloverleaf in the plane facing you; four of the five d clouds are cloverleaves) and f_xyz. */
export const leadM = l => [0, 0, 1, -2][l];
/** The shape of one cloud, for words: ball, dumbbell, clover, ring (d_z²: a dumbbell with a ring),
 *  rings2 (f_z³: two lobes and two rings), six or eight (lobes). Follows from its angular nodes. */
export function shapeOf(l, m) {
  if (l === 0) return 'ball';
  if (l === 1) return 'dumbbell';
  if (l === 2) return m === 0 ? 'ring' : 'clover';
  const a = Math.abs(m);
  return a === 0 ? 'rings2' : a === 2 ? 'eight' : 'six';
}
export function parseOrbital(e, str) {
  const subs = subshellsOf(e);
  if (str) {
    const [key, m] = String(str).split(':');
    const s = subs.find(x => x.key === key);
    if (s) return { sub: s, m: m === 'all' ? null : m == null ? leadM(s.l) : Math.max(-s.l, Math.min(s.l, Number(m) | 0)) };
  }
  const s = newestSubshell(e);
  return { sub: s, m: leadM(s.l) };
}
export function orbitalName(sub, m) {
  if (m == null) return sub.l === 0 ? sub.key : `${sub.key} (${2 * sub.l + 1})`;
  const suf = O.ORBITAL_SUFFIX[sub.l][m];
  return suf ? `${sub.key} ${suf}` : sub.key;
}

// ---- samples of |psi|^2 at unit charge, cached per orbital ------------------------------------------
// A hydrogen-like orbital of charge Z is the Z = 1 orbital shrunk by 1/Z (psi_Z(r) = Z^1.5 psi_1(Zr)),
// so each orbital is sampled once and rescaled for every element. The stream is seeded per orbital and
// only ever extended, so the first k dots of an orbital are always the same (reproducible screenshots).
const UNIT = new Map();
function unitSamples(n, l, m, count) {
  const k = `${n},${l},${m}`;
  let u = UNIT.get(k);
  if (!u) UNIT.set(k, (u = { pos: new Float32Array(0), sign: new Int8Array(0), count: 0, rand: O.rng32(n * 1000 + l * 100 + (m + 10) * 7 + 13) }));
  if (u.count < count) {
    const add = Math.max(count - u.count, 1024);
    const s = O.sampleOrbital(n, l, m, 1, add, u.rand);
    const pos = new Float32Array((u.count + add) * 3); pos.set(u.pos); pos.set(s.pos, u.count * 3);
    const sign = new Int8Array(u.count + add); sign.set(u.sign); sign.set(s.sign, u.count);
    Object.assign(u, { pos, sign, count: u.count + add });
  }
  return u;
}
// 90 % surfaces at unit charge (scaled the same way), cached per orbital and grid size
const SURF = new Map();
function unitSurface(n, l, m, res) {
  const k = `${n},${l},${m},${res}`;
  if (!SURF.has(k)) {
    const L = O.radiusForFraction(n, l, 1, 0.9) * 1.25;
    const grid = O.gridPsi(n, l, m, 1, res, L);
    const level = O.isoLevelForFraction(grid, 0.9);
    // s clouds: their innermost shells, smaller than about two grid cells, would show as blocky specks
    // (p, d and f lobes meet at the nucleus, so nothing is dropped there)
    const minR = l === 0 ? 2.2 * grid.h : 0;
    SURF.set(k, [1, -1].map(sign => {
      const p = polygonise(grid, level, sign), keep = [];
      for (let i = 0; i < p.positions.length; i += 9) if (Math.hypot((p.positions[i] + p.positions[i + 3] + p.positions[i + 6]) / 3, (p.positions[i + 1] + p.positions[i + 4] + p.positions[i + 7]) / 3, (p.positions[i + 2] + p.positions[i + 5] + p.positions[i + 8]) / 3) > minR) keep.push(i);
      const P = new Float32Array(keep.length * 9), N = new Float32Array(keep.length * 9);
      keep.forEach((i, j) => { P.set(p.positions.subarray(i, i + 9), j * 9); N.set(p.normals.subarray(i, i + 9), j * 9); });
      return { positions: P, normals: N };
    }));
  }
  return SURF.get(k);
}

// colours are written as display (sRGB) values: the stipple is composited over the CSS paper like ink
const srgb = h => { const x = parseInt(h.slice(1), 16); return new THREE.Vector3(((x >> 16) & 255) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255); };
const INK = srgb(TOK.ink), PLUS = srgb(phaseInk.plus), MINUS = srgb(phaseInk.minus), KILN_TEXT = srgb(TOK.kilnText2);

// stipple: crisp round dots, a little uneven like hand stippling; aTone is the ink strength of the dot's
// shell; dots behind the nucleus a touch lighter, ahead of it a touch darker; uReveal draws the layer out
// from the nucleus.
const STIPPLE_VS = `attribute float aSign; attribute float aTone; attribute float aOuter;
uniform float uPx; uniform float uFocus; uniform float uReveal; uniform float uRevealW; uniform float uDepthK;
uniform vec3 uPos; uniform vec3 uNeg; uniform vec3 uDim; uniform float uLight; uniform vec3 uLineCol[8]; uniform float uLineCum[8];
varying float vA; varying vec3 vCol; varying float vSize;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float h = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  float size = uPx * (0.72 + 0.56 * h) * pow(clamp(uFocus / max(-mv.z, 1e-3), 0.4, 3.0), 0.6);
  gl_PointSize = clamp(size, 1.0, 14.0);
  vSize = gl_PointSize;
  vA = aTone * (1.0 - smoothstep(uReveal - uRevealW, uReveal, length(position)));
  vA *= clamp(1.0 - uDepthK * (-mv.z - uFocus) / max(uFocus, 1e-3), 0.55, 1.3);
  vec3 ink = aSign < 0.0 ? uNeg : uPos;
  // its light: each outer dot takes the colour of one of the element's lines (chosen in proportion to
  // the lines' intensities); the inner shells dim to a faint warm grey
  float pick = fract(h * 13.73 + 0.217);
  vec3 lc = uLineCol[0];
  for (int i = 1; i < 8; i++) { if (pick > uLineCum[i - 1]) lc = uLineCol[i]; }
  vCol = mix(ink, mix(uDim, lc, aOuter), uLight);
  vA *= mix(1.0, mix(0.55, 1.8, aOuter), uLight);
}`;
const STIPPLE_FS = `uniform float uAlpha;
varying float vA; varying vec3 vCol; varying float vSize;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float aa = 2.4 / max(vSize, 1.0);
  float a = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  if (a * vA * uAlpha <= 0.002) discard;
  gl_FragColor = vec4(vCol, min(1.0, a * uAlpha * vA));
}`;
function stippleMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPx: { value: 2 }, uFocus: { value: 1000 }, uReveal: { value: 1e9 }, uRevealW: { value: 1 }, uDepthK: { value: 0.35 },
      uPos: { value: INK.clone() }, uNeg: { value: INK.clone() }, uAlpha: { value: 1 },
      uDim: { value: KILN_TEXT.clone() }, uLight: { value: 0 },
      uLineCol: { value: Array.from({ length: 8 }, () => KILN_TEXT.clone()) }, uLineCum: { value: new Array(8).fill(1) },
    },
    vertexShader: STIPPLE_VS, fragmentShader: STIPPLE_FS,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
}
// a shell's 90 % sphere seen from outside: a fine ink circle on its silhouette (an annulus that always
// faces the camera; its band is set in pixels each frame, so the line stays about 1.2 px wide)
const RING_VS = `attribute float aEdge; uniform float uR; uniform float uHalf; varying float vE;
void main() { vE = aEdge; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * (uR + aEdge * uHalf), 0.0, 1.0); }`;
const RING_FS = `uniform vec3 uCol; uniform float uAlpha; varying float vE;
void main() { float a = 1.0 - smoothstep(0.3, 1.0, abs(vE)); gl_FragColor = vec4(uCol, a * uAlpha); }`;
function ringGeometry(seg = 192) {
  const pos = new Float32Array((seg + 1) * 2 * 3), edge = new Float32Array((seg + 1) * 2), idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    pos.set([c, s, 0, c, s, 0], i * 6); edge[2 * i] = -1; edge[2 * i + 1] = 1;
    if (i < seg) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1));
  g.setIndex(idx);
  return g;
}

/** How far a cloud's 90 % surface reaches from the nucleus (pm), from the surface itself (medium grid). */
const REACH = new Map();
function reachOf(sub, ms, a0) {
  let r = 0;
  for (const m of ms) {
    const k = `${sub.n},${sub.l},${m}`;
    if (!REACH.has(k)) {
      let mx = 0;
      for (const piece of unitSurface(sub.n, sub.l, m, 32)) for (let i = 0; i < piece.positions.length; i += 3) mx = Math.max(mx, Math.hypot(piece.positions[i], piece.positions[i + 1], piece.positions[i + 2]));
      REACH.set(k, mx);
    }
    r = Math.max(r, REACH.get(k) * a0 / sub.Zeff);
  }
  return r;
}

/** Glaze for a 90 % surface: thin and translucent face-on, denser where you look along it. */
function glazeMaterial(col, side) {
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0, transparent: true, opacity: 0.075, depthWrite: false, side });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', `#include <lights_fragment_begin>
      float fres = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2);
      diffuseColor.a = clamp(diffuseColor.a * (0.6 + 3.4 * fres), 0.0, 0.5);`);
  };
  return m;
}

/** A soft round glow (white, alpha falloff) for the light the atom gives off. */
function haloTexture(size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.32)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

const THETA = 0.38, PHI = 1.2; // a three-quarter view from a little above: d_xz faces you, p_z stands up
const easeOut = x => 1 - (1 - x) ** 3;
const TONE_OUT = 0.3, TONE_MIN = 0.06; // ink strength of the outermost shell's dots; the floor for dense inner shells
const RING_ALPHA = 0.42;

export function createAtomView(hooks = {}) {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.hemi);
  const key = new THREE.DirectionalLight(LIGHT.key, LIGHT.keyIntensity);
  const rim = new THREE.DirectionalLight(LIGHT.rim, LIGHT.rimIntensity);
  key.position.set(...LIGHT.keyPos); rim.position.set(...LIGHT.rimPos);
  scene.add(hemi, key, rim);
  const root = new THREE.Group();
  scene.add(root);
  const labels = new LabelLayer(document.getElementById('labels'));
  // labels stand outside the drawing, joined to what they name by a hairline, like an engraved plate
  const lblNuc = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'atom-tag atom-tag--left', priority: 50, anchor: 'left' });
  const lblCloud = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'atom-tag atom-tag--right', priority: 40, anchor: 'right' });
  const SVGNS = 'http://www.w3.org/2000/svg';
  const leaderSvg = document.createElementNS(SVGNS, 'svg');
  leaderSvg.setAttribute('class', 'atom-leaders'); leaderSvg.setAttribute('aria-hidden', 'true');
  const leaders = [0, 1].map(() => { const g = document.createElementNS(SVGNS, 'g'), l = document.createElementNS(SVGNS, 'line'), c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('r', '2'); g.append(l, c); leaderSvg.append(g); return { g, l, c }; });
  document.getElementById('labels').append(leaderSvg);
  leaderSvg.style.display = 'none';
  const nucAt = new THREE.Vector3(), cloudAt = new THREE.Vector3();
  let ringLbls = [];

  // beads by their size on screen: a nucleus a few pixels wide needs no smooth spheres (uranium has 330 beads)
  const beadGeo = { hi: new THREE.SphereGeometry(1, 16, 12), lo: new THREE.SphereGeometry(1, 10, 7), min: new THREE.IcosahedronGeometry(1, 0) };
  // the beads are drawn after the dots (transparent list, render order 4), so dots never veil the nucleus
  const protonMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, metalness: 0, transparent: true });
  const neutronMat = new THREE.MeshStandardMaterial({ color: TOK.paperDeep, roughness: 0.66, metalness: 0, transparent: true });
  const ringGeo = ringGeometry();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  halo.renderOrder = 0;
  scene.add(halo);

  let info = null, built = '', layers = null, anim = null, lightK = 0, lightTo = 0, lastGoal = null, entering = false, factorShown = 0;
  const glowCol = KILN_TEXT.clone();

  // ---- layers ----------------------------------------------------------------------------------
  /** Dots for a list of orbitals [{ n, l, m, Z, count, tone }] (scene pm; orbital z drawn up). */
  function cloud(list, a0, signed) {
    let total = 0;
    for (const it of list) total += it.count;
    const pos = new Float32Array(total * 3), sg = new Float32Array(total), tone = new Float32Array(total), outer = new Float32Array(total);
    let o = 0;
    for (const it of list) {
      const u = unitSamples(it.n, it.l, it.m, it.count), k = a0 / it.Z;
      for (let i = 0; i < it.count; i++, o++) {
        pos[3 * o] = u.pos[3 * i] * k; pos[3 * o + 1] = u.pos[3 * i + 2] * k; pos[3 * o + 2] = u.pos[3 * i + 1] * k;
        sg[o] = signed ? u.sign[i] : 1;
        tone[o] = it.tone ?? 1; outer[o] = it.outer ? 1 : 0;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSign', new THREE.BufferAttribute(sg, 1));
    g.setAttribute('aTone', new THREE.BufferAttribute(tone, 1));
    g.setAttribute('aOuter', new THREE.BufferAttribute(outer, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9); // never culled
    const pts = new THREE.Points(g, stippleMaterial());
    pts.frustumCulled = false;
    return pts;
  }
  /** The 90 % surface of one orbital as a thin glaze: back faces, then the dots, then front faces. */
  function glaze(sub, m, a0, res) {
    const grp = new THREE.Group();
    const k = a0 / sub.Zeff;
    unitSurface(sub.n, sub.l, m, res).forEach((s, i) => {
      if (!s.positions.length) return;
      const P = new Float32Array(s.positions.length), N = new Float32Array(s.normals.length);
      for (let j = 0; j < P.length; j += 3) { // grid (x, y, z) -> scene (x, z, y), in pm; the swap mirrors, so the winding flips
        P[j] = s.positions[j] * k; P[j + 1] = s.positions[j + 2] * k; P[j + 2] = s.positions[j + 1] * k;
        N[j] = s.normals[j]; N[j + 1] = s.normals[j + 2]; N[j + 2] = s.normals[j + 1];
      }
      for (let j = 0; j < P.length; j += 9) for (const arr of [P, N]) for (let c = 0; c < 3; c++) { const tmp = arr[j + 3 + c]; arr[j + 3 + c] = arr[j + 6 + c]; arr[j + 6 + c] = tmp; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      const col = i === 0 ? phaseInk.plus : phaseInk.minus;
      const back = new THREE.Mesh(g, glazeMaterial(col, THREE.BackSide)); back.renderOrder = 1;
      const front = new THREE.Mesh(g, glazeMaterial(col, THREE.FrontSide)); front.renderOrder = 3;
      grp.add(back, front);
    });
    return grp;
  }
  /** Protons and neutrons as matte beads, packed in a ball of radius 1 (scaled each frame). */
  function nucleus(e) {
    const A = e.f.nucA ? e.f.nucA[0] : Math.round(e.f.aw[0] || 2 * e.Z);
    const Zp = e.Z, N = Math.max(0, A - Zp), total = Zp + N;
    const bead = (1 / Math.cbrt(total)) * 0.64;
    const geo = beadGeo.min;
    const pm = new THREE.InstancedMesh(geo, protonMat, Zp), nm = new THREE.InstancedMesh(geo, neutronMat, Math.max(1, N));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(bead, bead, bead), p = new THREE.Vector3();
    let ip = 0, iN = 0;
    const rand = O.rng32(e.Z * 31 + 7);
    for (let i = 0; i < total; i++) { // Fibonacci points filling the ball, protons and neutrons interleaved
      const f = (i + 0.5) / total, r = Math.cbrt(f) * 0.84;
      const th = Math.acos(1 - 2 * ((i * 0.618034) % 1)), ph = 2 * Math.PI * ((i * 0.7548777) % 1);
      p.set(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph));
      m4.compose(p, q, sc);
      if (ip < Zp && (iN >= N || rand() < Zp / total)) pm.setMatrixAt(ip++, m4); else nm.setMatrixAt(iN++, m4);
    }
    pm.count = ip; nm.count = iN;
    pm.renderOrder = 4; nm.renderOrder = 4;
    pm.frustumCulled = false; nm.frustumCulled = false;
    const grp = new THREE.Group();
    grp.add(pm, nm);
    return grp;
  }
  /** One fine ink circle per shell, with its electron count as a label. */
  function rings(shells) {
    const grp = new THREE.Group();
    for (const s of shells) {
      const mat = new THREE.ShaderMaterial({ uniforms: { uR: { value: s.r90 }, uHalf: { value: 1 }, uCol: { value: INK.clone() }, uAlpha: { value: RING_ALPHA } },
        vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(ringGeo, mat);
      m.frustumCulled = false; m.renderOrder = 1;
      m.userData = { r: s.r90, n: s.n, occ: s.occ };
      grp.add(m);
    }
    return grp;
  }
  function dispose(L) {
    if (!L) return;
    for (const o of [L.ink, L.orb, L.surf, L.nuc, L.rings]) {
      if (!o) continue;
      root.remove(o);
      o.traverse(x => {
        if (x.geometry && !Object.values(beadGeo).includes(x.geometry) && x.geometry !== ringGeo) x.geometry.dispose();
        if (x.material && x.material !== protonMat && x.material !== neutronMat) x.material.dispose();
      });
    }
  }

  // ---- build what the state asks for -------------------------------------------------------------
  function budgets() {
    const p = tierConfig().points; // 0.35 low, 0.7 medium, 1 high
    return { ink: Math.round(52000 * p), orb: Math.round(21000 * p) };
  }
  function build(force = false) {
    const e = byZ(state.Z);
    const mode = state.orbital ? 'cloud' : 'atom';
    const keyNow = [e.Z, mode, state.orbital, state.surf, E.tier, state.cb].join('|');
    if (!force && keyNow === built) return;
    built = keyNow;
    const a0 = data().constants.a0_pm[0];
    const subs = subshellsOf(e), shells = shellsOf(e);
    const newest = newestSubshell(e);
    const B = budgets();
    const L = { mode };
    let sel, frameR;
    if (mode === 'atom') {
      // every electron in ink: dots in proportion to each subshell's electrons (the outermost shell gets
      // at least 30 % of the dots, so its reach shows), spread over its orbitals. Dense inner shells take
      // lighter ink so the core never turns into a black blot (an engraver's choice; positions stay true).
      const totalE = subs.reduce((s, x) => s + x.occ, 0), nOut = shells[shells.length - 1].n;
      const outE = shells[shells.length - 1].occ, outShare = shells.length === 1 ? 1 : Math.max(outE / totalE, 0.3);
      const dots = s => (s.n === nOut ? (B.ink * outShare * s.occ) / outE : (B.ink * (1 - outShare) * s.occ) / Math.max(1, totalE - outE));
      const dens = new Map(shells.map(sh => [sh.n, subs.filter(s => s.n === sh.n).reduce((a, s) => a + dots(s), 0) / (sh.r90 * sh.r90)]));
      const dOut = dens.get(nOut);
      const tone = n => Math.max(TONE_MIN, Math.min(TONE_OUT, TONE_OUT * (dOut / dens.get(n)) ** 0.55));
      const list = [];
      let inColour = 0;
      for (const s of subs) {
        // an s cloud that is shown in colour is that whole subshell: no second, grey copy under it (its dots
        // go to the coloured cloud instead)
        if (s.key === newest.key && s.l === 0) { inColour = dots(s); continue; }
        const per = Math.max(60, Math.round(dots(s) / (2 * s.l + 1)));
        for (const m of O.mValues(s.l)) list.push({ n: s.n, l: s.l, m, Z: s.Zeff, count: per, tone: tone(s.n), outer: s.n === nOut });
      }
      L.ink = list.length ? cloud(list, a0, false) : null;
      L.rings = rings(shells);
      sel = { sub: newest, m: leadM(newest.l) };
      // the newest cloud, in its phase inks; if it lies in the outer shell it also lights up in "its light"
      L.orbOuter = newest.n === nOut;
      L.orb = cloud([{ n: newest.n, l: newest.l, m: sel.m, Z: newest.Zeff, count: Math.round(Math.max(B.orb * 0.8, inColour * 0.85)), outer: L.orbOuter }], a0, true);
      frameR = shells[shells.length - 1].r90 * 1.06;
    } else {
      sel = parseOrbital(e, state.orbital);
      const s = sel.sub, ms = sel.m == null ? O.mValues(s.l) : [sel.m];
      const per = Math.round(ms.length > 1 ? B.orb * 0.5 : B.orb);
      L.orb = cloud(ms.map(m => ({ n: s.n, l: s.l, m, Z: s.Zeff, count: per })), a0, true);
      if (state.surf && E.tier !== 'low' && ms.length === 1) L.surf = glaze(s, ms[0], a0, E.tier === 'high' ? 52 : 40);
      // frame the whole glaze: a lobe's 90 % surface reaches further along its axis than the radial 90 % radius
      frameR = Math.max(s.r90, reachOf(s, ms, a0)) * 1.1;
    }
    L.nuc = nucleus(e);
    const pal = state.cb ? pigmentCB : pigment;
    protonMat.color.set(pal[e.f.cat[0]]);
    const ou = L.orb.material.uniforms;
    ou.uPos.value.copy(PLUS); ou.uNeg.value.copy(MINUS); ou.uAlpha.value = mode === 'atom' ? 0.6 : 0.5;
    if (L.ink) L.ink.renderOrder = 2;
    L.orb.renderOrder = 2;
    for (const o of [L.rings, L.ink, L.surf, L.orb, L.nuc]) if (o) root.add(o);
    const prev = layers;
    layers = L;
    // the nucleus: about 3 % of the frame, inside the first shell (its true size is far too small to see)
    const rBase = Math.min(frameR * 0.03, shells[0].r90 * 0.55);
    const rTrue = e.f.rNuc ? e.f.rNuc[0] * 1e-3 : null; // fm -> pm
    info = { e, subs, shells, newest, sel, mode, frameR, rBase, rDraw: rBase, rTrue, factor: rTrue ? rBase / rTrue : null, change: stepChange(e) };
    factorShown = 0;
    // labels: the shells' counts (whole atom), the cloud, the nucleus
    for (const it of ringLbls) { it.priority = -1; it.el.remove(); }
    labels.items = labels.items.filter(it => !ringLbls.includes(it));
    ringLbls = mode === 'atom' ? shells.map((s, i) => labels.add({ pos: new THREE.Vector3(), text: fmtNum(s.occ, 0), cls: 'atom-tag atom-ring', priority: 30 + i, anchor: 'left' })) : [];
    placeLabels();
    applyLight();
    const g = goal();
    E.camera.near = Math.max(shells[0].r90 / 50, frameR / 2000, 1e-4); E.camera.far = frameR * 40; E.camera.updateProjectionMatrix();
    // a visitor may zoom right in to the first shell (hydrogen: into its only cloud)
    E.rig.lim = { rMin: Math.min(shells[0].r90 * 2.2, frameR * 0.5), rMax: frameR * 9, phiMin: 0.08, phiMax: Math.PI - 0.08 };
    if (entering) { entering = false; E.rig.flyTo(g, 0); } // a new place: the default three-quarter view
    else if (E.rig.tween) E.rig.retarget({ target: g.target, r: g.r }); // a glide under way (the dive) aims at the new size
    else E.rig.flyTo({ ...g, theta: E.rig.theta, phi: E.rig.phi }, state.reduced ? 0 : motion.glide); // keep the visitor's angle
    lastGoal = g;
    transition(prev);
    if (hooks.onBuilt) hooks.onBuilt(info);
    invalidate();
  }

  // where the cloud's leader lands: on a lobe of the shape that is drawn (scene coordinates, z up)
  const LOBE = { ball: [-0.34, 0.34, 0.2], dumbbell: [0, 0.62, 0], clover: [-0.45, 0.45, 0], ring: [0, 0.6, 0], rings2: [0, 0.62, 0], six: [-0.42, 0.42, 0.2], eight: [-0.38, 0.38, 0.38] };
  function placeLabels() {
    const { e, sel, mode } = info;
    labels.setText(lblNuc, t('atom.lbl.nucleus'), info.factor ? t('atom.lbl.drawn', { x: fmtNum(info.factor, 0, { sig: 2 }) }) : '');
    const s = sel.sub, lobe = LOBE[sel.m == null ? (s.l === 0 ? 'ball' : 'clover') : shapeOf(s.l, sel.m)];
    cloudAt.set(lobe[0], lobe[1], lobe[2]).multiplyScalar(s.r90);
    if (ringLbls.length) { const k = info.shells[info.shells.length - 1].occ; labels.setText(ringLbls[ringLbls.length - 1], k === 1 ? t('atom.lbl.electron1') : t('atom.lbl.electrons', { n: fmtNum(k, 0) })); }
    if (mode === 'atom') labels.setText(lblCloud, t('atom.lbl.cloud', { sub: s.key }), e.Z === 1 ? t('atom.lbl.only') : t('atom.lbl.newest'));
    else labels.setText(lblCloud, t('atom.lbl.cloud', { sub: s.key }), sel.m == null ? t('atom.lbl.allOf', { k: 2 * s.l + 1 }) : t('atom.shape.' + shapeOf(s.l, sel.m)) + (O.ORBITAL_SUFFIX[s.l][sel.m] ? ` · ${O.ORBITAL_SUFFIX[s.l][sel.m]}` : ''));
  }

  /** Camera goal: the frame sphere fits the free area (beside the card, above the sheet). */
  function goal(R = info ? info.frameR : 300) {
    const fov = freeFov();
    return { target: new THREE.Vector3(0, 0, 0), r: R / Math.sin(Math.min(fov.v, fov.h) / 2), theta: THETA, phi: PHI };
  }

  // ---- motion: the new layers draw out from the nucleus while the old ones fade ------------------------
  let fading = [];
  function transition(prev) {
    const L = layers, R = info.frameR;
    if (prev) {
      if (prev.nuc) prev.nuc.visible = false; // one nucleus at a time
      if (prev.rings) prev.rings.visible = false;
      const alphas = [prev.ink, prev.orb].filter(Boolean).map(o => [o.material.uniforms.uAlpha, o.material.uniforms.uAlpha.value]);
      const glazes = [];
      if (prev.surf) prev.surf.traverse(x => { if (x.material) glazes.push([x.material, x.material.opacity]); });
      fading.push({ L: prev, t: 0, alphas, glazes });
    }
    const reveal = [L.ink, L.orb].filter(Boolean).map(p => p.material.uniforms);
    const fadeIn = [];
    if (L.surf) L.surf.traverse(x => { if (x.material) fadeIn.push([x.material, 'opacity', x.material.opacity]); });
    if (L.rings) for (const m of L.rings.children) fadeIn.push([m.material.uniforms.uAlpha, 'value', m.material.uniforms.uAlpha.value]);
    if (anim) { anim(); anim = null; }
    if (state.reduced) {
      for (const f of fading) dispose(f.L);
      fading = [];
      return;
    }
    for (const u of reveal) { u.uReveal.value = 0; u.uRevealW.value = R * 0.45; }
    for (const [o, k] of fadeIn) o[k] = 0;
    const T = motion.lens / 1000, F = motion.cardOut / 1000; // the clouds draw out like a lens change; the old fade like a card
    let t0 = 0;
    anim = animate(dt => {
      t0 += dt;
      const k = Math.min(1, t0 / T);
      for (const u of reveal) u.uReveal.value = easeOut(k) * R * 2.6;
      const fk = Math.max(0, Math.min(1, (t0 - T * 0.35) / (T * 0.65)));
      for (const [o, key, v] of fadeIn) o[key] = v * fk * (key === 'value' ? 1 - lightK : 1);
      for (const f of fading) {
        f.t += dt;
        const a = Math.max(0, 1 - f.t / F);
        for (const [u, v] of f.alphas) u.value = v * a;
        for (const [m, o] of f.glazes) m.opacity = o * a;
      }
      for (const f of fading) if (f.t >= F) dispose(f.L);
      fading = fading.filter(f => f.t < F);
      invalidate();
      if (k >= 1 && !fading.length) { anim = null; for (const u of reveal) u.uReveal.value = 1e9; return false; }
      return true;
    });
  }

  // ---- its light: the room dims and the atom glows in the colour of its own lines ---------------------
  const BASE = { hemi: LIGHT.hemi, key: LIGHT.keyIntensity, rim: LIGHT.rimIntensity };
  function applyLight() {
    const k = lightK;
    hemi.intensity = BASE.hemi * (1 - 0.82 * k); key.intensity = BASE.key * (1 - 0.86 * k); rim.intensity = BASE.rim * (1 - 0.5 * k);
    if (!layers) return;
    for (const o of [layers.ink, layers.mode === 'atom' ? layers.orb : null]) {
      if (!o) continue;
      const u = o.material.uniforms;
      u.uLight.value = k;
      for (let i = 0; i < 8; i++) { u.uLineCol.value[i].copy(lineCols[Math.min(i, lineCols.length - 1)] || KILN_TEXT); u.uLineCum.value[i] = lineCum[i] ?? 1; }
    }
    // an inner newest cloud steps back in the dark (its light comes from the outer electrons); an outer one glows
    if (layers.orb && layers.mode === 'atom') layers.orb.material.uniforms.uAlpha.value = layers.orbOuter ? 0.6 * (1 - 0.45 * k) : 0.6 * (1 - k);
    if (layers.rings && !anim) for (const m of layers.rings.children) m.material.uniforms.uAlpha.value = RING_ALPHA * (1 - k);
    halo.material.color.setRGB(glowCol.x, glowCol.y, glowCol.z, THREE.SRGBColorSpace);
    halo.material.opacity = 0.3 * k;
    halo.scale.setScalar((info ? info.frameR : 300) * 3.0);
    lblCloud.priority = k > 0.5 ? -1 : 40;
    for (const it of ringLbls) it.priority = k > 0.5 ? -1 : 30 + ringLbls.indexOf(it);
  }
  let lightAnim = null, lineCols = [], lineCum = [];
  /** spec: { cols: [[r, g, b] display colours], w: [intensities] } of the element's visible lines, or null */
  function setLight(on, spec) {
    lightTo = on ? 1 : 0;
    if (spec && spec.cols.length) {
      lineCols = spec.cols.map(c => new THREE.Vector3(c[0], c[1], c[2]));
      const tot = spec.w.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      lineCum = spec.w.map(w => (acc += w / tot));
      glowCol.set(0, 0, 0);
      spec.cols.forEach((c, i) => glowCol.add(new THREE.Vector3(c[0], c[1], c[2]).multiplyScalar(spec.w[i] / tot)));
    } else if (on) { lineCols = [KILN_TEXT.clone()]; lineCum = [1]; glowCol.copy(KILN_TEXT).multiplyScalar(0.4); }
    if (lightAnim) { lightAnim(); lightAnim = null; }
    if (state.reduced) { lightK = lightTo; applyLight(); invalidate(); return; }
    lightAnim = animate(dt => {
      lightK += Math.sign(lightTo - lightK) * Math.min(Math.abs(lightTo - lightK), dt / (motion.kiln / 1000));
      applyLight(); invalidate();
      if (Math.abs(lightK - lightTo) < 1e-4) { lightK = lightTo; applyLight(); lightAnim = null; return false; }
      return true;
    });
  }

  // ---- every frame: stipple size, the rings on their silhouettes, the nucleus's drawn size ---------------
  const camDir = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  function perFrame() {
    if (!layers || !info) return;
    const cam = E.camera, H = window.innerHeight, tanH = Math.tan((cam.fov * Math.PI) / 360);
    const d = cam.position.length(); // the nucleus sits at the origin
    const pxAt = depth => (2 * tanH * depth) / H; // scene units per CSS pixel at a depth
    const dpr = E.renderer.getPixelRatio();
    for (const L of [layers, ...fading.map(f => f.L)]) for (const o of [L.ink, L.orb]) if (o) { const u = o.material.uniforms; u.uPx.value = 1.9 * dpr; u.uFocus.value = d; }
    // the nucleus: at least about 3 px across the radius, and inside the first shell once that shows
    const px = pxAt(d), s1 = info.shells[0].r90;
    let r = Math.max(info.rBase, 3 * px);
    if (s1 / px >= 12) r = Math.min(r, 0.6 * s1);
    info.rDraw = r;
    layers.nuc.scale.setScalar(r);
    const rPx = r / px, geo = rPx < 9 ? beadGeo.min : rPx < 40 || info.e.Z > 60 ? beadGeo.lo : beadGeo.hi;
    for (const im of layers.nuc.children) if (im.geometry !== geo) im.geometry = geo;
    // the labels sit outside what they name: the nucleus's to the lower right, the cloud's to the upper left
    const sNew = info.sel.sub.r90, reach = Math.max(sNew * 1.08, 26 * px);
    lblNuc.pos.set(0, 0, 0).addScaledVector(right.setFromMatrixColumn(cam.matrixWorld, 0), reach * 0.82).addScaledVector(up.setFromMatrixColumn(cam.matrixWorld, 1), -reach * 0.62);
    const away = Math.max(sNew * 0.62, 30 * px);
    lblCloud.pos.copy(cloudAt).addScaledVector(right, -away * 0.7).addScaledVector(up, away * 0.62);
    if (info.rTrue) {
      const f = Number((r / info.rTrue).toPrecision(2));
      if (f !== factorShown) { factorShown = f; info.factor = f; labels.setText(lblNuc, t('atom.lbl.nucleus'), t('atom.lbl.drawn', { x: fmtNum(f, 0) })); }
    }
    // rings: a sphere seen from distance d shows a circle of radius r·sqrt(1 − r²/d²), r²/d nearer to you
    if (layers.rings) {
      camDir.copy(cam.position).normalize();
      const kids = layers.rings.children;
      kids.forEach((m, i) => {
        const R = m.userData.r, inside = d <= R * 1.02;
        m.visible = !inside;
        const lb = ringLbls[i];
        if (inside) { if (lb) lb.priority = -1; return; }
        const c = (R * R) / d, rs = R * Math.sqrt(1 - (R * R) / (d * d));
        m.position.copy(camDir).multiplyScalar(c);
        m.lookAt(cam.position);
        m.material.uniforms.uR.value = rs;
        m.material.uniforms.uHalf.value = 1.1 * pxAt(d - c);
        // the count sits on the circle, up and to the right; hidden when the circle is too small to read
        if (lb) {
          const out = rs + 5 * pxAt(d - c); // just outside the line
          lb.pos.copy(m.position).addScaledVector(right, out * 0.77).addScaledVector(up, out * 0.64);
          const big = rs / pxAt(d - c) > 22;
          lb.priority = lightK > 0.5 || !big ? -1 : 30 + i;
        }
      });
    }
  }

  /** Hairlines from each label to what it names (hidden with the label when it gives way). */
  const s0 = {}, s1 = {};
  function drawLeaders() {
    if (!info || !labels.enabled) { leaderSvg.style.display = 'none'; return; }
    leaderSvg.style.display = '';
    [[lblNuc, nucAt, 1], [lblCloud, cloudAt, -1]].forEach(([lb, at, side], i) => {
      const L = leaders[i];
      const a = toScreen(at, s0), b = lb.visible && toScreen(lb.pos, s1);
      if (!a || !b) { L.g.style.display = 'none'; return; }
      L.g.style.display = '';
      const bx = b.x + side * 2, len = Math.hypot(bx - a.x, b.y - a.y) || 1, ux = (bx - a.x) / len, uy = (b.y - a.y) / len;
      const start = i === 0 ? Math.max(4, (info.rDraw / ((2 * Math.tan((E.camera.fov * Math.PI) / 360) * E.camera.position.length()) / window.innerHeight)) + 3) : 0;
      L.l.setAttribute('x1', (a.x + ux * start).toFixed(1)); L.l.setAttribute('y1', (a.y + uy * start).toFixed(1));
      L.l.setAttribute('x2', bx.toFixed(1)); L.l.setAttribute('y2', b.y.toFixed(1));
      L.c.setAttribute('cx', a.x.toFixed(1)); L.c.setAttribute('cy', a.y.toFixed(1));
      L.c.style.display = i === 0 ? 'none' : '';
    });
  }

  const view = {
    scene,
    init() {},
    enter() { labels.enabled = true; entering = true; lightK = 0; lightTo = 0; E.rig.parallaxOn = false; build(true); },
    exit() {
      labels.enabled = false; labels.hideAll(); leaderSvg.style.display = 'none';
      if (anim) { anim(); anim = null; }
      if (lightAnim) { lightAnim(); lightAnim = null; }
      for (const f of fading) dispose(f.L);
      fading = [];
      lightK = lightTo = 0; applyLight();
      E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix();
    },
    resize() {
      if (!info || E.active !== view) return;
      const g = goal();
      // keep a camera the visitor has zoomed; otherwise follow the free area (card or sheet changes)
      const userZoomed = lastGoal && Math.abs(E.rig.r - lastGoal.r) / lastGoal.r > 0.04 && !E.rig.tween;
      if (E.rig.tween) E.rig.retarget({ target: g.target, r: g.r });
      else if (!userZoomed) E.rig.flyTo({ ...g, theta: E.rig.theta, phi: E.rig.phi }, state.reduced ? 0 : motion.cardIn / 1000);
      lastGoal = g;
    },
    update() { perFrame(); return false; },
    afterRender() { labels.update(); drawLeaders(); },
    onTier() { if (E.active === view) build(true); },
    onState(ch) {
      if (E.active !== view) return;
      if (['Z', 'orbital', 'surf', 'cb'].some(k => k in ch)) build();
      if ('lang' in ch && info) { placeLabels(); factorShown = 0; invalidate(); }
    },
    /** The end of the scale dive: start close to the nucleus, then draw back out through the shells. */
    diveIn(dur = 1.2) {
      const g = goal();
      if (state.reduced || dur <= 0) { E.rig.flyTo(g, 0); return; }
      E.rig.flyTo({ target: g.target, r: g.r * 0.1, theta: g.theta - 0.55, phi: g.phi - 0.22 }, 0);
      E.rig.flyTo(g, dur);
      lastGoal = g;
    },
    setLight,
    lightOn: () => lightTo > 0,
    info: () => info,
  };
  return view;
}
