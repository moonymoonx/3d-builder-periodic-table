// Atom view, "Look inside the atom" (STYLE.md §6): the atom as a stippled engraving on paper.
// Electron clouds are hydrogen-like orbitals psi(n,l,m) scaled by each subshell's effective nuclear
// charge (Clementi–Raimondi; Slater's rules where they have no value), sampled from |psi|^2, so every
// dot is a place an electron could be found.
//   whole atom (default): every electron as ink stipple; each shell's 90 % sphere as a glass globe (a fine
//                         ink line on its silhouette, a veil toward the rim, a soft highlight) with its
//                         electron count; the cloud that took the newest electron in vermilion ink
//   one cloud:            one orbital (or all of a subshell) in its two phase inks (vermilion +, cobalt −)
//                         inside its 90 % surface, drawn as a thin glaze (not on the low tier: s clouds as
//                         true spheres); a paper sheet marks each flat surface where the electron is never found
//   its light:            the room dims (places/atom.js); the outer cloud glows in the colour of the
//                         element's lines mixed as the eye sees them; picking a line sends a ripple of its
//                         colour down onto the outer shell (an electron dropping to a lower level)
// The nucleus is a cluster of matte beads (protons in the element's glaze, neutrons in porcelain). It is
// drawn enlarged by a round factor (1, 2 or 5 × a power of ten), never smaller than a few pixels and never
// outside the first shell; the factor is shown. A scale bar gives the size in picometres.
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
/** Changes in a configuration, plainly: "one electron sits in 6d instead of 5f" ("5f: 4→3", "6d: 0→1"). */
export function movePhrase(changes) {
  const named = code => subPhrase({ n: Number(code[0]), l: 'spdf'.indexOf(code[1]) });
  const parsed = changes.map(c => (typeof c === 'string' ? (/^(\d[spdf]):\s*(\d+)\s*→\s*(\d+)$/.exec(c) || []).slice(1) : [`${c.n}${'spdf'[c.l]}`, c.from, c.to])).filter(x => x.length === 3).map(([code, a, b]) => ({ sub: named(code), d: Number(b) - Number(a) }));
  const up = parsed.filter(x => x.d > 0), down = parsed.filter(x => x.d < 0);
  if (up.length === 1 && down.length === 1 && up[0].d === -down[0].d && up[0].d <= 3) {
    const k = up[0].d;
    return t(k === 1 ? 'atom.exc.one' : 'atom.exc.many', { k: t('atom.num.' + k), up: up[0].sub, down: down[0].sub });
  }
  return down.length ? t('atom.exc.mixed', { up: up.map(x => x.sub).join(', '), down: down.map(x => x.sub).join(', ') }) : up.map(x => x.sub).join(', ');
}
/** A cloud named plainly first, its code after it: "shell 3's clover clouds (3d)" (STYLE.md §4). */
export const subPhrase = s => t('atom.sub', { n: s.n, kind: t((s.l === 0 ? 'atom.kind1.' : 'atom.kinds.') + s.l), code: `${s.n}${'spdf'[s.l]}` });
/** One cloud of a subshell in plain words, for labels: "upright dumbbell", "lying-flat clover"… (the axis
 *  names, xz or y(3x²−y²), stay in the source details). */
export const TURN_WORD = { 1: { 1: 'across', '-1': 'deep', 0: 'up' }, 2: { 1: 'facing', '-1': 'side', '-2': 'flat', 2: 'flatAxes', 0: 'ring' } };
export function turnWords(l, m) {
  if (l === 0) return t('atom.shape.ball');
  const w = TURN_WORD[l] && TURN_WORD[l][m];
  return w ? t(`atom.turn.${l}.${w}`) : t('atom.shape.' + shapeOf(l, m));
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
/** The turns of a subshell in the order people name them: p x, y, z; d xy, xz, yz, x²−y², z²; f by m. */
export const turnOrder = l => (l === 1 ? [1, -1, 0] : l === 2 ? [-2, 1, -1, 2, 0] : O.mValues(l));
/** The shape of one cloud, for words: ball, dumbbell, clover, ring (d_z²: a dumbbell with a ring),
 *  rings2 (f_z³: two lobes and two rings), six or eight (lobes). Follows from its angular nodes. */
export function shapeOf(l, m) {
  if (l === 0) return 'ball';
  if (l === 1) return 'dumbbell';
  if (l === 2) return m === 0 ? 'ring' : 'clover';
  const a = Math.abs(m);
  return a === 0 ? 'rings2' : a === 2 ? 'eight' : 'six';
}
/** The flat surfaces through the nucleus where a real orbital is zero (its nodal planes), as unit
 *  normals in orbital axes (x, y, z). Y_lm ∝ P_l^|m|(cos θ)·cos(mφ) or sin(|m|φ): the φ factor vanishes
 *  on |m| planes through the z axis, and P_l^|m| vanishes at θ = 90° (the xy plane) when l − |m| is odd.
 *  The other zeros of P_l^|m| are cones (d_z², most f clouds), which are not planes. */
export function nodalPlanes(l, m) {
  const out = [], a = Math.abs(m);
  if ((l - a) % 2 === 1) out.push([0, 0, 1]);
  for (let k = 0; k < a; k++) {
    const phi = m > 0 ? ((2 * k + 1) * Math.PI) / (2 * a) : (k * Math.PI) / a; // cos(mφ) = 0 or sin(|m|φ) = 0
    out.push([-Math.sin(phi), Math.cos(phi), 0]);
  }
  return out;
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
/** A round factor near f: 1, 2 or 5 × a power of ten (so "drawn 2,000× bigger" does not twitch). */
export function niceFactor(f) {
  const e = Math.floor(Math.log10(f));
  let best = 1;
  for (const k of [e - 1, e, e + 1]) for (const m of [1, 2, 5]) { const v = m * 10 ** k; if (Math.abs(Math.log(v / f)) < Math.abs(Math.log(best / f))) best = v; }
  return best;
}
const NICE_STEP = v => { const e = Math.floor(Math.log10(v) + 1e-9), m = Math.round(v / 10 ** e); return { up: (m === 1 ? 2 : m === 2 ? 5 : 10) * 10 ** e, down: (m === 1 ? 0.5 : m === 2 ? 1 : 2) * 10 ** e }; };
/** The 90 % surface of an s cloud at unit charge, exactly: the spheres where |psi| crosses the level that
 *  encloses 90 % of the probability. Each radius (a0) comes with the sign of psi on the side inside it. */
export function sSpheres(n, f = 0.9) {
  const rmax = O.extentRadius(n, 0, 1), N = 6000, dr = rmax / N;
  const R = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) R[i] = O.radial(n, 0, 1, i * dr);
  const prob = c => { let p = 0; for (let i = 1; i <= N; i++) if (Math.abs(R[i]) > c) { const r = i * dr; p += R[i] * R[i] * r * r * dr; } return p; };
  const total = prob(-1);
  let lo = 0, hi = Math.abs(R[0]);
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (prob(mid) > f * total) lo = mid; else hi = mid; }
  const out = [];
  for (let i = 1; i <= N; i++) {
    const a = Math.abs(R[i - 1]) - lo, b = Math.abs(R[i]) - lo;
    if (a * b < 0) out.push({ r: (i - 1 + a / (a - b)) * dr, sign: Math.sign(R[a > 0 ? i - 1 : i]) });
  }
  return out;
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
// 90 % surfaces at unit charge (scaled the same way), cached per orbital and grid size: the lobes of each
// sign are taken from psi itself (psi > +level, psi < −level), so they can never cross a nodal surface
const SURF = new Map();
function unitSurface(n, l, m, res) {
  const k = `${n},${l},${m},${res}`;
  if (!SURF.has(k)) {
    const L = O.radiusForFraction(n, l, 1, 0.9) * 1.25;
    const grid = O.gridPsi(n, l, m, 1, res, L);
    const level = O.isoLevelForFraction(grid, 0.9);
    SURF.set(k, [1, -1].map(sign => polygonise(grid, level, sign)));
  }
  return SURF.get(k);
}
const SPH = new Map();
const unitSpheres = n => { if (!SPH.has(n)) SPH.set(n, sSpheres(n)); return SPH.get(n); };

// colours are written as display (sRGB) values: the stipple is composited over the CSS paper like ink
const srgb = h => { const x = parseInt(h.slice(1), 16); return new THREE.Vector3(((x >> 16) & 255) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255); };
const INK = srgb(TOK.ink), PLUS = srgb(phaseInk.plus), MINUS = srgb(phaseInk.minus), KILN_TEXT = srgb(TOK.kilnText2), CARD = srgb(TOK.card);

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
  size *= 1.0 - 0.18 * uLight;
  gl_PointSize = clamp(size, 1.0, 14.0);
  vSize = gl_PointSize;
  vA = aTone * (1.0 - smoothstep(uReveal - uRevealW, uReveal, length(position)));
  vA *= clamp(1.0 - uDepthK * (-mv.z - uFocus) / max(uFocus, 1e-3), 0.55, 1.3);
  vec3 ink = aSign < 0.0 ? uNeg : uPos;
  // its light: each outer dot takes the colour of one of the element's lines (chosen in proportion to
  // the lines' strengths), sparks inside the glow; the inner shells dim to a faint warm grey
  float pick = fract(h * 13.73 + 0.217);
  vec3 lc = uLineCol[0];
  for (int i = 1; i < 8; i++) { if (pick > uLineCum[i - 1]) lc = uLineCol[i]; }
  vCol = mix(ink, mix(uDim, lc, aOuter), uLight);
  vA *= mix(1.0, mix(0.4, 1.15, aOuter), uLight);
}`;
const STIPPLE_FS = `uniform float uAlpha;
varying float vA; varying vec3 vCol; varying float vSize;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float aa = min(0.8, 1.8 / max(vSize, 1.0)); // a soft edge that never eats a small dot's ink
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

// a shell's 90 % sphere as a glass globe seen from outside: one quad facing the camera on the sphere's
// silhouette (from distance d a sphere of radius r shows a circle of radius r·sqrt(1 − r²/d²), r²/d nearer
// to you). In daylight: a fine ink line on the silhouette (about 1.2 px), a veil that thickens toward the
// rim, the side away from the key light a touch deeper and a small soft highlight at the upper left. In the
// dark room: only a faint warm rim.
const SHELL_VS = `varying vec2 vQ; uniform float uR;
void main() { vQ = position.xy * 1.06; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * 1.06 * uR, 0.0, 1.0); }`;
const SHELL_FS = `uniform float uPxQ; uniform float uAlpha; uniform float uLight; uniform vec3 uInk; uniform vec3 uHi; uniform vec3 uRim;
varying vec2 vQ;
void main() {
  float rho = length(vQ);
  if (rho > 1.0 + 2.5 * uPxQ) discard;
  float inside = 1.0 - smoothstep(1.0 - uPxQ, 1.0, rho);
  float nz = sqrt(max(0.0, 1.0 - rho * rho));
  vec3 n = vec3(vQ, nz);
  float line = 1.0 - smoothstep(0.55 * uPxQ, 1.5 * uPxQ, abs(rho - 1.0));
  float fres = pow(1.0 - nz, 3.0) * inside;
  vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
  float shade = max(0.0, -dot(n, L)) * inside;
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 60.0) * inside;
  float day = 1.0 - uLight;
  float aInk = (0.42 * line + 0.13 * fres + 0.06 * shade) * day;
  float aHi = 0.75 * spec * day;
  float aRim = (0.3 * line + 0.07 * fres) * uLight;
  float a = aInk + aHi + aRim;
  if (a * uAlpha < 0.003) discard;
  vec3 col = (uInk * aInk + uHi * aHi + uRim * aRim) / max(a, 1e-4);
  gl_FragColor = vec4(col, min(1.0, a) * uAlpha);
}`;
// its light: the outer cloud as glowing gas. The brightness across it is the cloud's density summed
// along the line of sight (from its own radial functions), with a faint aura beyond it; the brightest part
// whitens a little, as a lamp's core does. One additive draw, like the forge's incandescent glow.
const GLOW_VS = `varying vec2 vQ; uniform float uR;
void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * uR, 0.0, 1.0); }`;
const GLOW_FS = `uniform sampler2D uProf; uniform vec3 uCol; uniform vec3 uTint; uniform float uTintK; uniform float uK;
varying vec2 vQ;
void main() {
  float rho = length(vQ);
  if (rho >= 1.0) discard;
  float I = texture2D(uProf, vec2(rho, 0.5)).r;
  float aura = 0.18 * exp(-3.5 * rho) * (1.0 - smoothstep(0.75, 1.0, rho));
  float e = (0.62 * I * I * (3.0 - 2.0 * I) + 0.2 * I + aura) * uK;
  vec3 c = mix(uCol, uTint, uTintK);
  c = mix(c, vec3(1.0), 0.3 * smoothstep(0.5, 1.0, I));
  gl_FragColor = vec4(c, min(1.0, e));
}`;
// the ripple when a line is picked: a soft ring of the line's colour closing in on the outer shell
const RIPPLE_FS = `uniform vec3 uCol; uniform float uRad; uniform float uW; uniform float uA;
varying vec2 vQ;
void main() { float d = abs(length(vQ) - uRad); float a = exp(-(d * d) / (uW * uW)) * uA; if (a < 0.003) discard; gl_FragColor = vec4(uCol, a); }`;

/** How far a cloud's 90 % surface reaches from the nucleus (pm), from the surface itself (medium grid). */
const REACH = new Map();
function reachOf(sub, ms, a0) {
  let r = 0;
  for (const m of ms) {
    const k = `${sub.n},${sub.l},${m}`;
    if (!REACH.has(k)) {
      let mx = 0;
      if (sub.l === 0) for (const s of unitSpheres(sub.n)) mx = Math.max(mx, s.r);
      else for (const piece of unitSurface(sub.n, sub.l, m, 32)) for (let i = 0; i < piece.positions.length; i += 3) mx = Math.max(mx, Math.hypot(piece.positions[i], piece.positions[i + 1], piece.positions[i + 2]));
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

const THETA = 0.38, PHI = 1.2; // a three-quarter view from a little above: d_xz faces you, p_z stands up
const easeOut = x => 1 - (1 - x) ** 3;
const easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const TONE_OUT = 0.4, TONE_MIN = 0.07; // ink strength of the outermost shell's dots; the floor for dense inner shells
const SHELL_ALPHA = 1;
/** The strip the place keeps free under the atom for the scale bar (and the shells' legend), px. */
export const STAGE_FOOT = { desk: 54, phone: 30 };
const quad = new THREE.PlaneGeometry(2, 2);

export function createAtomView(hooks = {}) {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.hemi);
  const key = new THREE.DirectionalLight(LIGHT.key, LIGHT.keyIntensity);
  const rim = new THREE.DirectionalLight(LIGHT.rim, LIGHT.rimIntensity);
  key.position.set(...LIGHT.keyPos); rim.position.set(...LIGHT.rimPos);
  scene.add(hemi, key, rim);
  const root = new THREE.Group();
  scene.add(root);
  const labelRoot = document.getElementById('labels');
  const labels = new LabelLayer(labelRoot);
  // labels stand outside the drawing, joined to what they name by a hairline, like an engraved plate
  const lblNuc = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'atom-tag atom-tag--left', priority: 50, anchor: 'left' });
  const lblCloud = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'atom-tag atom-tag--right', priority: 40, anchor: 'right' });
  const SVGNS = 'http://www.w3.org/2000/svg';
  const leaderSvg = document.createElementNS(SVGNS, 'svg');
  leaderSvg.setAttribute('class', 'atom-leaders'); leaderSvg.setAttribute('aria-hidden', 'true');
  const leaders = [0, 1].map(() => { const g = document.createElementNS(SVGNS, 'g'), l = document.createElementNS(SVGNS, 'line'), c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('r', '2'); g.append(l, c); leaderSvg.append(g); return { g, l, c }; });
  labelRoot.append(leaderSvg);
  leaderSvg.style.display = 'none';
  // the scale bar (an engraved ruler) and, the first time, how to turn the atom
  const ruler = document.createElement('div');
  ruler.className = 'atom-ruler'; ruler.setAttribute('aria-hidden', 'true');
  const rulerBar = document.createElement('span'), rulerTxt = document.createElement('span'), rulerText = document.createElement('b'), rulerCap = document.createElement('small');
  rulerBar.className = 'atom-ruler__bar'; rulerTxt.className = 'atom-ruler__txt';
  const legend = document.createElement('span'); legend.className = 'atom-legend';
  rulerTxt.append(rulerText, rulerCap);
  ruler.append(rulerBar, rulerTxt, legend);
  const hint = document.createElement('div'); hint.className = 'atom-hint-drag'; hint.setAttribute('aria-hidden', 'true');
  labelRoot.append(ruler, hint);
  ruler.style.display = hint.style.display = 'none';
  let hintShown = false, hintTimer = 0;
  try { hintShown = sessionStorage.getItem('atom.hint') === '1'; } catch { /* storage may be blocked: show it once per visit */ }
  const nucAt = new THREE.Vector3(), cloudAt = new THREE.Vector3();
  let ringLbls = [];

  // beads by their size on screen: a nucleus a few pixels wide needs no smooth spheres (uranium has 330 beads)
  const beadGeo = { hi: new THREE.SphereGeometry(1, 16, 12), lo: new THREE.SphereGeometry(1, 10, 7), min: new THREE.IcosahedronGeometry(1, 0) };
  // the beads are drawn after the dots (transparent list, render order 4), so dots never veil the nucleus
  const protonMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, metalness: 0, transparent: true });
  const neutronMat = new THREE.MeshStandardMaterial({ color: TOK.paperDeep, roughness: 0.66, metalness: 0, transparent: true });
  const glowTex = new THREE.DataTexture(new Uint8Array(64), 64, 1, THREE.RedFormat, THREE.UnsignedByteType);
  glowTex.magFilter = glowTex.minFilter = THREE.LinearFilter; glowTex.wrapS = THREE.ClampToEdgeWrapping; glowTex.needsUpdate = true;
  const glow = new THREE.Mesh(quad, new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uProf: { value: glowTex }, uCol: { value: KILN_TEXT.clone() }, uTint: { value: KILN_TEXT.clone() }, uTintK: { value: 0 }, uK: { value: 0 } },
    vertexShader: GLOW_VS, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }));
  glow.renderOrder = 0; glow.frustumCulled = false; glow.visible = false;
  const ripple = new THREE.Mesh(quad, new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uCol: { value: KILN_TEXT.clone() }, uRad: { value: 0.8 }, uW: { value: 0.03 }, uA: { value: 0 } },
    vertexShader: GLOW_VS, fragmentShader: RIPPLE_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }));
  ripple.renderOrder = 5; ripple.frustumCulled = false; ripple.visible = false;
  // a filling-order surprise (vanadium -> chromium): one electron travels from the outer cloud into the newest one
  const bead = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: phaseInk.plus, transparent: true, opacity: 0, depthTest: false }));
  bead.renderOrder = 6; bead.frustumCulled = false; bead.visible = false;
  scene.add(glow, ripple, bead);
  let beadAnim = null;
  function surprise(fromR) {
    if (beadAnim) { beadAnim(); beadAnim = null; }
    const cam = E.camera, start = new THREE.Vector3(), end = cloudAt.clone(), rr = new THREE.Vector3(), uu = new THREE.Vector3();
    rr.setFromMatrixColumn(cam.matrixWorld, 0); uu.setFromMatrixColumn(cam.matrixWorld, 1);
    start.copy(rr).multiplyScalar(fromR * 0.72).addScaledVector(uu, fromR * 0.69); // on the outer cloud, up and to the right
    let t0 = 0;
    const T = 1.4;
    bead.visible = true;
    beadAnim = animate(dt => {
      t0 += dt;
      const k = Math.min(1, t0 / T), e = easeInOut(k);
      bead.position.lerpVectors(start, end, e);
      const d = cam.position.length(), px = (2 * Math.tan((cam.fov * Math.PI) / 360) * d) / window.innerHeight;
      bead.scale.setScalar(4.5 * px);
      bead.material.opacity = Math.min(1, k * 6) * (k > 0.85 ? (1 - k) / 0.15 : 1);
      invalidate();
      if (k >= 1) { bead.visible = false; beadAnim = null; return false; }
      return true;
    });
  }

  let info = null, built = '', layers = null, anim = null, lightK = 0, lightTo = 0, lastGoal = null, entering = false, factorShown = 0, factorNow = 0;
  const glowCol = KILN_TEXT.clone(), glowEmit = new THREE.Color();

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
  /** The 90 % surface of one orbital as a thin glaze: back faces, then the dots, then front faces.
   *  s clouds are exact spheres; the others come from the grid, each sign's lobes on their own. */
  function glaze(sub, m, a0, res) {
    const grp = new THREE.Group();
    const k = a0 / sub.Zeff;
    const add = (g, sign) => {
      const col = sign > 0 ? phaseInk.plus : phaseInk.minus;
      const back = new THREE.Mesh(g, glazeMaterial(col, THREE.BackSide)); back.renderOrder = 1;
      const front = new THREE.Mesh(g, glazeMaterial(col, THREE.FrontSide)); front.renderOrder = 3;
      grp.add(back, front);
    };
    if (sub.l === 0) {
      for (const s of unitSpheres(sub.n)) add(new THREE.SphereGeometry(s.r * k, 72, 48), s.sign);
      return grp;
    }
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
      add(g, i === 0 ? 1 : -1);
    });
    return grp;
  }
  /** Each flat surface where the cloud is zero, as a thin paper sheet through the nucleus with an ink edge.
   *  It hides what lies behind it, so the two inks read as two separate lobes. */
  const sheetMat = new THREE.MeshBasicMaterial({ color: TOK.card, transparent: true, opacity: 0.8, depthWrite: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const sheetEdgeMat = new THREE.LineBasicMaterial({ color: TOK.ink2, transparent: true, opacity: 0.45 });
  function sheets(l, m, R) {
    const grp = new THREE.Group();
    const disc = new THREE.CircleGeometry(R, 96);
    const ringPts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0)); }
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    for (const [x, y, z] of nodalPlanes(l, m)) {
      const nrm = new THREE.Vector3(x, z, y).normalize(); // orbital (x, y, z) -> scene (x, z, y)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm);
      const s = new THREE.Mesh(disc, sheetMat); s.quaternion.copy(q); s.renderOrder = 1.5;
      const e = new THREE.Line(edgeGeo, sheetEdgeMat); e.quaternion.copy(q); e.renderOrder = 1.6;
      grp.add(s, e);
    }
    grp.userData.shared = [disc, edgeGeo];
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
  /** One glass globe per shell, with its electron count as a label. */
  function shellsLayer(shells) {
    const grp = new THREE.Group();
    for (const s of shells) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uR: { value: s.r90 }, uPxQ: { value: 0.01 }, uAlpha: { value: SHELL_ALPHA }, uLight: { value: 0 }, uInk: { value: INK.clone() }, uHi: { value: CARD.clone() }, uRim: { value: KILN_TEXT.clone() } },
        vertexShader: SHELL_VS, fragmentShader: SHELL_FS, transparent: true, depthWrite: false, depthTest: false,
      });
      const m = new THREE.Mesh(quad, mat);
      m.frustumCulled = false; m.renderOrder = 1;
      m.userData = { r: s.r90, n: s.n, occ: s.occ };
      grp.add(m);
    }
    return grp;
  }
  function dispose(L) {
    if (!L) return;
    for (const o of [L.ink, L.orb, L.surf, L.nuc, L.rings, L.sheets]) {
      if (!o) continue;
      root.remove(o);
      o.traverse(x => {
        if (x.geometry && !Object.values(beadGeo).includes(x.geometry) && x.geometry !== quad) x.geometry.dispose();
        if (x.material && x.material !== protonMat && x.material !== neutronMat && x.material !== sheetMat && x.material !== sheetEdgeMat) x.material.dispose();
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
      L.rings = shellsLayer(shells);
      sel = { sub: newest, m: leadM(newest.l) };
      // the newest cloud in vermilion ink (the phase inks are explained in "one cloud"); if it lies in the
      // outer shell it also lights up in "its light"
      L.orbOuter = newest.n === nOut;
      frameR = shells[shells.length - 1].r90 * 1.06;
      // a big newest cloud (oganesson's 7p fills the atom) gets more dots, so it reads as densely as a small one
      const spread = Math.min(2.5, Math.max(1, (newest.r90 / (0.4 * frameR)) ** 2));
      L.orb = cloud([{ n: newest.n, l: newest.l, m: sel.m, Z: newest.Zeff, count: Math.round(Math.max(B.orb * 0.8 * spread, inColour * 0.85)), outer: L.orbOuter }], a0, false);
    } else {
      sel = parseOrbital(e, state.orbital);
      const s = sel.sub, ms = sel.m == null ? O.mValues(s.l) : [sel.m];
      const per = Math.round(ms.length > 1 ? B.orb * 0.5 : B.orb);
      L.orb = cloud(ms.map(m => ({ n: s.n, l: s.l, m, Z: s.Zeff, count: per })), a0, true);
      if (state.surf && E.tier !== 'low' && ms.length === 1) L.surf = glaze(s, ms[0], a0, E.tier === 'high' ? 56 : 44);
      // frame the whole glaze: a lobe's 90 % surface reaches further along its axis than the radial 90 % radius
      frameR = Math.max(s.r90, reachOf(s, ms, a0)) * 1.1;
      if (ms.length === 1 && s.l > 0) L.sheets = sheets(s.l, ms[0], frameR * 0.68);
    }
    L.nuc = nucleus(e);
    const pal = state.cb ? pigmentCB : pigment;
    protonMat.color.set(pal[e.f.cat[0]]);
    const ou = L.orb.material.uniforms;
    ou.uPos.value.copy(PLUS); ou.uNeg.value.copy(mode === 'atom' ? PLUS : MINUS); ou.uAlpha.value = mode === 'atom' ? 0.6 : 0.5;
    if (L.ink) L.ink.renderOrder = 2;
    L.orb.renderOrder = 2;
    for (const o of [L.rings, L.ink, L.surf, L.sheets, L.orb, L.nuc]) if (o) root.add(o);
    const prev = layers;
    layers = L;
    // the nucleus: about 3 % of the frame, inside the first shell (its true size is far too small to see)
    const rBase = Math.min(frameR * 0.03, shells[0].r90 * 0.55);
    const rTrue = e.f.rNuc ? e.f.rNuc[0] * 1e-3 : null; // fm -> pm
    info = { e, subs, shells, newest, sel, mode, frameR, rBase, rDraw: rBase, rTrue, factor: rTrue ? niceFactor(rBase / rTrue) : null, change: stepChange(e) };
    factorShown = 0; factorNow = 0;
    // labels: the shells' counts (whole atom), the cloud, the nucleus
    for (const it of ringLbls) { it.priority = -1; it.el.remove(); }
    labels.items = labels.items.filter(it => !ringLbls.includes(it));
    ringLbls = mode === 'atom' ? shells.map((s, i) => labels.add({ pos: new THREE.Vector3(), text: fmtNum(s.occ, 0), cls: 'atom-tag atom-ring', priority: 30 + i, anchor: 'left' })) : [];
    placeLabels();
    if (lightTo > 0) glowFor(info);
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
    // the surprise of a filling-order exception, seen and not only read: the moved electron flies in
    if (prev && mode === 'atom' && !state.reduced && info.change.kind === 'rearr' && e.Z > 1) {
      const dn = info.change.diff.find(x => x.to < x.from), donor = dn && subshellsOf(byZ(e.Z - 1)).find(x => x.n === dn.n && x.l === dn.l);
      if (donor) surprise(donor.r90);
    }
    if (hooks.onBuilt) hooks.onBuilt(info);
    invalidate();
  }

  // where the cloud's leader lands: on a lobe of the shape that is drawn (scene coordinates, z up)
  const LOBE = { ball: [-0.34, 0.34, 0.2], dumbbell: [0, 0.62, 0], clover: [-0.45, 0.45, 0], ring: [0, 0.6, 0], rings2: [0, 0.62, 0], six: [-0.42, 0.42, 0.2], eight: [-0.38, 0.38, 0.38] };
  function placeLabels() {
    const { e, sel, mode } = info;
    labels.setText(lblNuc, t('atom.lbl.nucleus'), info.factor ? t('atom.lbl.drawn', { x: fmtNum(info.factor, 0) }) : '');
    const s = sel.sub, lobe = LOBE[sel.m == null ? (s.l === 0 ? 'ball' : 'clover') : shapeOf(s.l, sel.m)];
    cloudAt.set(lobe[0], lobe[1], lobe[2]).multiplyScalar(s.r90);
    const named = t('atom.lbl.cloud', { kind: t('atom.kind1.' + s.l), n: s.n });
    if (mode === 'atom') labels.setText(lblCloud, named, e.Z === 1 ? t('atom.lbl.only') : t('atom.lbl.newest'));
    else labels.setText(lblCloud, named, sel.m == null ? t('atom.lbl.allOf', { k: 2 * s.l + 1 }) : turnWords(s.l, sel.m));
    hint.textContent = t(window.innerWidth <= 760 ? 'atom.hint.dragTouch' : 'atom.hint.drag');
    rulerCap.replaceChildren(Object.assign(document.createElement('span'), { className: 'atom-ruler__long', textContent: t('atom.scale.cap') }), Object.assign(document.createElement('span'), { className: 'atom-ruler__short', textContent: t('units.pm') }));
    countsShown = '';
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
      if (prev.sheets) prev.sheets.visible = false;
      const alphas = [prev.ink, prev.orb].filter(Boolean).map(o => [o.material.uniforms.uAlpha, o.material.uniforms.uAlpha.value]);
      const glazes = [];
      if (prev.surf) prev.surf.traverse(x => { if (x.material) glazes.push([x.material, x.material.opacity]); });
      fading.push({ L: prev, t: 0, alphas, glazes });
    }
    const reveal = [L.ink, L.orb].filter(Boolean).map(p => p.material.uniforms);
    const fadeIn = [];
    if (L.surf) L.surf.traverse(x => { if (x.material) fadeIn.push([x.material, 'opacity', x.material.opacity]); });
    if (L.rings) for (const m of L.rings.children) fadeIn.push([m.material.uniforms.uAlpha, 'value', m.material.uniforms.uAlpha.value]);
    if (L.sheets) { sheetMat.opacity = 0; sheetEdgeMat.opacity = 0; fadeIn.push([sheetMat, 'opacity', 0.8], [sheetEdgeMat, 'opacity', 0.45]); }
    if (anim) { anim(); anim = null; }
    if (state.reduced) {
      if (L.sheets) { sheetMat.opacity = 0.8; sheetEdgeMat.opacity = 0.45; }
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
      for (const [o, key, v] of fadeIn) o[key] = v * fk;
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

  // ---- its light: the room dims and the outer cloud glows in the colour of its own lines ---------------
  const BASE = { hemi: LIGHT.hemi, key: LIGHT.keyIntensity, rim: LIGHT.rimIntensity };
  /** The glow's brightness from the centre out to its edge (1.7 × the outer shell's 90 % radius): the outer
   *  electrons' density (their radial functions, by occupancy) summed along the line of sight. */
  const GLOWS = new Map();
  function glowFor(inf) {
    const a0 = data().constants.a0_pm[0], outer = inf.shells[inf.shells.length - 1];
    const k = inf.e.Z;
    if (!GLOWS.has(k)) {
      const subs = inf.subs.filter(s => s.n === outer.n), Rg = outer.r90 * 1.7, K = 64, M = 160;
      const dens = r => subs.reduce((a, s) => { const R = O.radial(s.n, s.l, s.Zeff, r / a0); return a + s.occ * R * R; }, 0);
      const prof = new Float32Array(K);
      let mx = 0;
      for (let i = 0; i < K; i++) {
        const rho = (i / (K - 1)) * Rg;
        let sum = 0;
        for (let j = 0; j < M; j++) { const z = ((j + 0.5) / M) * Rg * 1.3; sum += dens(Math.hypot(rho, z)); }
        prof[i] = sum; mx = Math.max(mx, sum);
      }
      // a lamp's tone curve (square root): the glow fills the cloud instead of only its dense centre
      GLOWS.set(k, { Rg, bytes: Uint8Array.from(prof, v => Math.round(255 * Math.sqrt(v / (mx || 1)))) });
    }
    const g = GLOWS.get(k);
    glowTex.image.data.set(g.bytes); glowTex.needsUpdate = true;
    glowR = g.Rg;
    glow.material.uniforms.uR.value = g.Rg;
    ripple.material.uniforms.uR.value = g.Rg;
    rippleShell = outer.r90 / g.Rg;
  }
  let rippleShell = 0.6, rippleAnim = null, glowR = 1;
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
    if (layers.orb && layers.mode === 'atom') layers.orb.material.uniforms.uAlpha.value = layers.orbOuter ? 0.6 * (1 - 0.35 * k) : 0.6 * (1 - k);
    if (layers.rings) for (const m of layers.rings.children) m.material.uniforms.uLight.value = k;
    glow.visible = k > 0.001 && hasGlow;
    // the nucleus sits inside the glow: lit by it, not a dark hole in it
    for (const mt of [protonMat, neutronMat]) mt.emissive.copy(hasGlow ? glowEmit.setRGB(glowCol.x, glowCol.y, glowCol.z, THREE.SRGBColorSpace) : glowEmit.setRGB(0.6, 0.55, 0.5, THREE.SRGBColorSpace)).multiplyScalar(0.55 * k);
    glow.material.uniforms.uCol.value.copy(glowCol);
    glow.material.uniforms.uK.value = 0.95 * k;
    lblCloud.priority = k > 0.5 ? -1 : 40;
    for (const it of ringLbls) it.priority = k > 0.5 ? -1 : 30 + ringLbls.indexOf(it);
  }
  let lightAnim = null, lineCols = [], lineCum = [], hasGlow = false;
  /** spec: { cols: [[r, g, b] display colours], w: [strengths], glow: [r, g, b] | null } of the element's
   *  visible lines, or null */
  function setLight(on, spec) {
    lightTo = on ? 1 : 0;
    if (spec && spec.cols.length) {
      lineCols = spec.cols.map(c => new THREE.Vector3(c[0], c[1], c[2]));
      const tot = spec.w.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      lineCum = spec.w.map(w => (acc += w / tot));
      hasGlow = !!spec.glow;
      if (spec.glow) glowCol.set(...spec.glow);
    } else if (on) { lineCols = [KILN_TEXT.clone()]; lineCum = [1]; hasGlow = false; }
    if (on && info) glowFor(info);
    if (lightAnim) { lightAnim(); lightAnim = null; }
    if (!on) { ripple.visible = false; if (rippleAnim) { rippleAnim(); rippleAnim = null; } }
    if (state.reduced) { lightK = lightTo; applyLight(); invalidate(); return; }
    lightAnim = animate(dt => {
      lightK += Math.sign(lightTo - lightK) * Math.min(Math.abs(lightTo - lightK), dt / (motion.kiln / 1000));
      applyLight(); invalidate();
      if (Math.abs(lightK - lightTo) < 1e-4) { lightK = lightTo; applyLight(); lightAnim = null; return false; }
      return true;
    });
  }
  /** A line was picked: a ring of its colour closes in on the outer shell (an electron dropping to a lower
   *  level gives off that colour) and the glow leans toward it for a moment. Reduced motion: no ripple. */
  function pulse(rgb) {
    if (!(lightTo > 0) || !info) return;
    const u = ripple.material.uniforms, gu = glow.material.uniforms;
    u.uCol.value.set(rgb[0], rgb[1], rgb[2]); gu.uTint.value.set(rgb[0], rgb[1], rgb[2]);
    if (rippleAnim) { rippleAnim(); rippleAnim = null; }
    if (state.reduced) { ripple.visible = false; gu.uTintK.value = 0; invalidate(); return; }
    const T = motion.glide; // seconds
    let t0 = 0;
    ripple.visible = true;
    rippleAnim = animate(dt => {
      t0 += dt;
      const k = Math.min(1, t0 / T), e = easeInOut(k);
      const r0 = Math.min(0.96, rippleShell * 1.3, (info.frameR * 0.97) / glowR); // from a little outside the outer shell (a higher level) down onto it, inside the frame
      u.uRad.value = r0 - (r0 - rippleShell) * e;
      u.uW.value = 0.016 - 0.007 * e; // a fine ring of light, not a neon edge (STYLE §10)
      u.uA.value = 0.32 * Math.sin(Math.PI * Math.min(1, k * 1.05)) * lightK;
      gu.uTintK.value = 0.35 * Math.sin(Math.PI * k);
      invalidate();
      if (k >= 1) { ripple.visible = false; gu.uTintK.value = 0; rippleAnim = null; return false; }
      return true;
    });
  }

  // ---- every frame: stipple size, the shells on their silhouettes, the nucleus's drawn size ---------------
  const camDir = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let countsShown = '';
  const scr = {};
  /** Keep a label's anchor point inside the free stage: if the label would run past its edge (14 px), it
   *  turns to the other side of the point. */
  function keepIn(lb, pref) {
    const s = toScreen(lb.pos, scr);
    if (!s) return;
    const W = window.innerWidth, sf = E.safe || {}, w = lb.w || lb.el.offsetWidth || 80;
    const maxX = W - (sf.right || 0) - 14, minX = (sf.left || 0) + 14;
    if (pref === 'left') lb.anchor = s.x + 6 + w > maxX ? 'right' : 'left';
    else lb.anchor = s.x - 6 - w < minX ? 'left' : 'right';
  }
  function perFrame() {
    if (!layers || !info) return;
    const cam = E.camera, H = window.innerHeight, tanH = Math.tan((cam.fov * Math.PI) / 360);
    const d = cam.position.length(); // the nucleus sits at the origin
    const pxAt = depth => (2 * tanH * depth) / H; // scene units per CSS pixel at a depth
    const dpr = E.renderer.getPixelRatio();
    // dots at least ~2.4 device pixels, and a little bigger where the atom has more room (a desktop draws the
    // same dots over several times the area of a phone, so the cloud would read paler: review F3)
    const sa = E.safe, room = Math.min(window.innerWidth - (sa.left || 0) - (sa.right || 0), H - (sa.top || 0) - (sa.bottom || 0));
    const dot = Math.max(2.4, 1.9 * dpr * Math.min(1.45, Math.max(1, Math.sqrt(room / 400))));
    for (const L of [layers, ...fading.map(f => f.L)]) for (const o of [L.ink, L.orb]) if (o) { const u = o.material.uniforms; u.uPx.value = dot; u.uFocus.value = d; }
    right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
    camDir.copy(cam.position).normalize();
    // its light: the glow and the ripple face the camera on the glowing sphere's silhouette (as the shells do)
    if (glow.visible || ripple.visible) {
      const Rg = glowR, out = d > Rg * 1.02, c = out ? (Rg * Rg) / d : 0, rs = out ? Rg * Math.sqrt(1 - (Rg * Rg) / (d * d)) : Rg;
      for (const m of [glow, ripple]) { m.position.copy(camDir).multiplyScalar(c); m.quaternion.copy(cam.quaternion); m.material.uniforms.uR.value = rs; }
    }
    // the nucleus: drawn a round factor bigger (1, 2 or 5 × a power of ten), at least about 3 px across the
    // radius, and inside the first shell once that shows; the factor only changes when it has to
    const px = pxAt(d), s1 = info.shells[0].r90;
    const cap = s1 / px >= 12 ? 0.6 * s1 : Infinity;
    let r;
    if (info.rTrue) {
      const want = Math.min(Math.max(info.rBase, 4 * px), cap);
      let f = factorNow || niceFactor(want / info.rTrue);
      const ok = v => v * info.rTrue >= 3.2 * px && v * info.rTrue <= cap && v * info.rTrue <= want * 1.9 && v * info.rTrue >= want * 0.5;
      for (let i = 0; i < 6 && !ok(f); i++) f = f * info.rTrue < want ? NICE_STEP(f).up : NICE_STEP(f).down;
      factorNow = f;
      r = f * info.rTrue;
    } else r = Math.min(Math.max(info.rBase, 4 * px), cap);
    info.rDraw = r;
    layers.nuc.scale.setScalar(r);
    const rPx = r / px, geo = rPx < 9 ? beadGeo.min : rPx < 40 || info.e.Z > 60 ? beadGeo.lo : beadGeo.hi;
    for (const im of layers.nuc.children) if (im.geometry !== geo) im.geometry = geo;
    if (info.rTrue && factorNow !== factorShown) { factorShown = factorNow; info.factor = factorNow; labels.setText(lblNuc, t('atom.lbl.nucleus'), t('atom.lbl.drawn', { x: fmtNum(factorNow, 0) })); }
    // the labels sit outside what they name, on a paper ground: the nucleus's to the lower right of the newest
    // cloud, the cloud's to its upper left; each turns to the other side rather than run off the stage
    const sNew = info.sel.sub.r90, reach = Math.max(sNew * 1.12, 30 * px);
    lblNuc.pos.set(0, 0, 0).addScaledVector(right, reach * 0.84).addScaledVector(up, -reach * 0.66);
    keepIn(lblNuc, 'left');
    if (lblNuc.anchor === 'right') lblNuc.pos.set(0, 0, 0).addScaledVector(right, -reach * 0.84).addScaledVector(up, -reach * 0.66);
    const away = Math.max(sNew * 0.62, 30 * px);
    lblCloud.pos.copy(cloudAt).addScaledVector(right, -away * 0.7).addScaledVector(up, away * 0.62);
    keepIn(lblCloud, 'right');
    if (lblCloud.anchor === 'left') lblCloud.pos.copy(cloudAt).addScaledVector(right, away * 0.7).addScaledVector(up, away * 0.62);
    // shells: each globe on its silhouette; its count just outside the line, up and to the right. Counts too
    // small to place are not dropped: they are listed in a legend beside the scale bar
    const hidden = [];
    if (layers.rings) {
      const kids = layers.rings.children;
      kids.forEach((m, i) => {
        const R = m.userData.r, inside = d <= R * 1.02;
        m.visible = !inside;
        const lb = ringLbls[i];
        if (inside) { if (lb) lb.priority = -1; return; }
        const c = (R * R) / d, rs = R * Math.sqrt(1 - (R * R) / (d * d)), pxc = pxAt(d - c);
        m.position.copy(camDir).multiplyScalar(c);
        m.quaternion.copy(cam.quaternion);
        m.material.uniforms.uR.value = rs;
        m.material.uniforms.uPxQ.value = (1.05 * pxc) / rs;
        if (lb) {
          const out = rs + 7 * pxc;
          lb.pos.copy(m.position).addScaledVector(right, out * 0.8).addScaledVector(up, out * 0.6);
          const big = rs / pxc > 26;
          lb.priority = lightK > 0.5 || !big ? -1 : 30 + i;
          if (!big) hidden.push(m.userData.occ);
          if (i === kids.length - 1) labels.setText(lb, m.userData.occ === 1 ? t('atom.lbl.electron1') : t('atom.lbl.electrons', { n: fmtNum(m.userData.occ, 0) }));
        }
      });
    }
    // the scale bar: a round length (1, 2 or 5 × a power of ten picometres) about 70–170 px long, at the depth
    // of the nucleus; with it, when some counts are too small to write on their shells, the whole list
    // (they stand in the strip the place keeps free under the atom: STAGE_FOOT)
    const sf = E.safe || {}, phone = window.innerWidth <= 760;
    const showStage = labels.enabled && lightK < 0.5 && !document.body.classList.contains('diving');
    if (showStage) {
      let len = 10 ** Math.floor(Math.log10(110 * px));
      for (const m of [1, 2, 5, 10]) if ((m * len) / px <= 170) { if ((m * len) / px >= 60) { len = m * len; break; } }
      ruler.style.display = '';
      ruler.style.left = `${Math.round((sf.left || 0) + (phone ? 16 : 24))}px`;
      ruler.style.bottom = `${Math.round(Math.max(8, (sf.bottom || 0) - STAGE_FOOT[phone ? 'phone' : 'desk'] + (phone ? 4 : 8)))}px`;
      rulerBar.style.width = `${(len / px).toFixed(1)}px`;
      const txt = `${fmtNum(len, 0)} pm`;
      if (rulerText.textContent !== txt) rulerText.textContent = txt;
      const list = hidden.length && info.mode === 'atom' ? info.shells.map(s => fmtNum(s.occ, 0)).join(' · ') : '';
      if (list !== countsShown || legend.dataset.phone !== String(phone)) { countsShown = list; legend.dataset.phone = String(phone); legend.textContent = list ? t(phone ? 'atom.lbl.legendShort' : 'atom.lbl.legend', { list }) : ''; }
      legend.style.display = list ? '' : 'none';
      if (!hintShown) {
        if (!hintTimer) hintTimer = setTimeout(dropHint, 12000); // it also goes by itself after a while
        // beside the back link, in the top bar's row
        const back = document.querySelector('.hero-top .ui-back'), br = back && back.getBoundingClientRect();
        hint.style.display = '';
        if (br && br.width) { hint.style.left = `${Math.round(br.right + 12)}px`; hint.style.top = `${Math.round(br.top + (br.height - (hint.offsetHeight || 30)) / 2)}px`; }
        else { hint.style.left = `${Math.round((sf.left || 0) + 16)}px`; hint.style.top = `${Math.round((sf.top || 0) + 8)}px`; }
      }
    } else { ruler.style.display = 'none'; hint.style.display = 'none'; }
  }
  // the hint goes for good once the visitor turns or zooms the atom (or after a while)
  const dropHint = () => { if (hintShown) return; hintShown = true; hint.classList.add('is-gone'); try { sessionStorage.setItem('atom.hint', '1'); } catch { /* fine */ } };
  const canvas = E.renderer && E.renderer.domElement;
  if (canvas) { canvas.addEventListener('pointerdown', () => { if (E.active === view) dropHint(); }); canvas.addEventListener('wheel', () => { if (E.active === view) dropHint(); }, { passive: true }); }

  /** Hairlines from each label to what it names (hidden with the label when it gives way). */
  const s0 = {}, s1 = {};
  function drawLeaders() {
    if (!info || !labels.enabled) { leaderSvg.style.display = 'none'; return; }
    leaderSvg.style.display = '';
    [[lblNuc, nucAt], [lblCloud, cloudAt]].forEach(([lb, at], i) => {
      const L = leaders[i];
      const a = toScreen(at, s0), b = lb.visible && toScreen(lb.pos, s1);
      if (!a || !b) { L.g.style.display = 'none'; return; }
      L.g.style.display = '';
      // the hairline ends on the label's ground, at the edge facing the point (never across its words)
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(lb.el.style.transform || '');
      let bx = b.x + (lb.anchor === 'left' ? 2 : -2), by = b.y;
      if (m) {
        const x0 = +m[1] - 2, y0 = +m[2] - 2, x1 = +m[1] + (lb.w || 0) + 2, y1 = +m[2] + (lb.h || 0) + 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const dx = cx - a.x, dy = cy - a.y;
        // where the ray from the point to the label's centre enters its box (slab method)
        const tx = dx ? ((dx > 0 ? x0 : x1) - a.x) / dx : -Infinity, ty = dy ? ((dy > 0 ? y0 : y1) - a.y) / dy : -Infinity;
        let tt = Math.max(tx, ty);
        if (a.x > x0 && a.x < x1 && a.y > y0 && a.y < y1) tt = 0; // the point itself under the label: no line
        tt = Math.max(0, Math.min(1, tt));
        bx = a.x + dx * tt; by = a.y + dy * tt;
      }
      const len = Math.hypot(bx - a.x, by - a.y) || 1, ux = (bx - a.x) / len, uy = (by - a.y) / len;
      const start = i === 0 ? Math.max(4, (info.rDraw / ((2 * Math.tan((E.camera.fov * Math.PI) / 360) * E.camera.position.length()) / window.innerHeight)) + 3) : 0;
      L.l.setAttribute('x1', (a.x + ux * start).toFixed(1)); L.l.setAttribute('y1', (a.y + uy * start).toFixed(1));
      L.l.setAttribute('x2', bx.toFixed(1)); L.l.setAttribute('y2', by.toFixed(1));
      if (len < 6) { L.g.style.display = 'none'; return; }
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
      ruler.style.display = hint.style.display = 'none';
      if (anim) { anim(); anim = null; }
      if (lightAnim) { lightAnim(); lightAnim = null; }
      if (rippleAnim) { rippleAnim(); rippleAnim = null; }
      if (beadAnim) { beadAnim(); beadAnim = null; bead.visible = false; }
      for (const f of fading) dispose(f.L);
      fading = [];
      lightK = lightTo = 0; applyLight(); glow.visible = false; ripple.visible = false;
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
    pulse,
    lightOn: () => lightTo > 0,
    info: () => info,
  };
  return view;
}
