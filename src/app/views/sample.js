// Sample view: the element's measured crystal lattice in a glass box, heated by one slider.
// Solid: atoms vibrate with rms amplitude ratio·d_NN·sqrt(T/T_melt) (Lindemann model, ratio from the data).
// Phase changes use the measured cells of each phase; bcc <-> fcc follows the Bain distortion path.
// Liquid: the lattice collapses into a jostling liquid. Gas: particles fly with Maxwell-distributed
// speeds whose rms is sqrt(3RT/M) (shown, slowed down). Hot solids and liquids glow with the colour of
// a blackbody at T (Planck's law x CIE 1931 fit). Scene units: picometres.
import * as THREE from 'three';
import { E, invalidate, freeFov, tierConfig, setContinuous } from '../engine.js';
import { state, set } from '../state.js';
import { byZ, data, stateAt } from '../data.js';
import { cellVectors, fracToCart, lindemannRms, rmsSpeed } from '../../physics/lattice.js';
import { cmfAt, mul3, gammaEncode } from '../../physics/color.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { pigment, pigmentCB, color as TOK, light as LIGHT } from '../../design/tokens.js';
import { glassMaterial, glassFootCanvas, glowSprites, moltenPool } from './forgeArt.js';
import { roundedBox, softRectCanvas, GLAZE } from './tableArt.js';
import { rng32 } from '../../physics/orbitals.js';

const SPEED_SCALE = 3; // display pm/s per real m/s (the real motion is ~3 x 10^11 times faster)
const METALS = ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide'];
/** Quicksilver: a metal that is liquid at room temperature (mercury). Its finish belongs to the element, not
 *  its state: frozen, liquid or boiling it stays a mirror of the studio (STYLE.md §6); every other metal keeps
 *  its family glaze through every change of state, so nothing snaps from one finish to another. */
const quickZ = new Map();
const quicksilver = e => { if (!quickZ.has(e.Z)) quickZ.set(e.Z, METALS.includes(e.f.cat[0]) && stateAt(e, 293.15).s === 'liquid'); return quickZ.get(e.Z); };
/** Flat decals lying on the hearth win the depth test against it (no striping where two surfaces meet). */
const ON_TOP = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 };
/** The vessel stands open on the hearth: drop the glass box's flat bottom (its face lay exactly on the
 *  hearth's top and z-fought with it: diagonal striping and a seam, most visible in an empty vessel). */
function openFloor(g) {
  const p = g.attributes.position, flat = i => Math.abs(p.getY(i) + 0.5) < 1e-5;
  if (g.index) {
    const ix = g.index.array, keep = [];
    for (let k = 0; k < ix.length; k += 3) if (!(flat(ix[k]) && flat(ix[k + 1]) && flat(ix[k + 2]))) keep.push(ix[k], ix[k + 1], ix[k + 2]);
    g.setIndex(keep);
  } else {
    const keep = [];
    for (let i = 0; i < p.count; i += 3) if (!(flat(i) && flat(i + 1) && flat(i + 2))) keep.push(i, i + 1, i + 2);
    g.setIndex(keep);
  }
  return g;
}
export const SLOWDOWN = 1e12 / SPEED_SCALE;

// ---- what is in the box at temperature T -----------------------------------------------------
/** { kind: 'solid'|'liquid'|'gas'|'card', phase, card, predicted, why } */
export function sampleStateAt(e, T, allotrope) {
  const lat = e.lat;
  const st = stateAt(e, T);
  // a predicted crystal is not drawn; but radon's gas and liquid are measured (only its crystal is a
  // prediction), so they are drawn like any other gas and liquid
  if (lat.kind === 'predicted' && (st.s === 'unknown' || st.s === 'solid' || st.p)) return { kind: 'card', card: 'predicted' };
  const s = st.s === 'unknown' ? (e.ph.mp && e.ph.mp[0] != null && T >= e.ph.mp[0] ? 'liquid' : 'card') : st.s;
  if (s === 'card') return { kind: 'card', card: 'unknown' };
  if (s !== 'solid') return { kind: s, predicted: st.p };
  if (lat.kind !== 'lattice') return { kind: 'card', card: lat.kind, predicted: st.p };
  const seq = lat.phases.filter(p => p.T);
  let phase = null;
  if (allotrope) phase = lat.phases.find(p => p.id === allotrope && (p.alt || p.id === lat.def));
  if (!phase && seq.length) phase = seq.find(p => T >= p.T[0] && (p.T[1] == null || T < p.T[1])) || seq[seq.length - 1];
  if (!phase) phase = lat.phases.find(p => p.id === lat.def) || lat.phases[0];
  if (phase.card) return { kind: 'card', card: 'phase', phase, predicted: st.p };
  return { kind: 'solid', phase, predicted: st.p };
}

/** Temperatures where something changes (for slider markers): [{T, key, label}] */
export function eventsOf(e) {
  const out = [];
  for (const tr of e.ph.trans || []) {
    const to = e.lat.phases?.find(p => p.id === tr.to);
    out.push({ T: tr.T[0], key: 'trans', label: to?.label || '' });
  }
  if (e.ph.mp?.[0] != null) out.push({ T: e.ph.mp[0], key: 'melt', p: !!e.ph.mp[2]?.p });
  if (e.ph.bp?.[0] != null) out.push({ T: e.ph.bp[0], key: 'boil', p: !!e.ph.bp[2]?.p });
  if (e.ph.sub?.[0] != null) out.push({ T: e.ph.sub[0], key: 'sub' });
  return out.sort((a, b) => a.T - b.T);
}

// ---- blackbody glow (Planck x CIE fit) --------------------------------------------------------
const bbCache = new Map();
export function blackbody(T) {
  const k = Math.round(T / 10) * 10;
  if (bbCache.has(k)) return bbCache.get(k);
  const D = data(), C = D.constants;
  const h = C.h[0], c = C.c[0], kB = C.kB[0];
  let X = 0, Y = 0, Zs = 0;
  for (let lam = 380; lam <= 780; lam += 5) {
    const L = lam * 1e-9;
    const B = (2 * h * c * c) / (L ** 5) / Math.expm1((h * c) / (L * kB * Math.max(T, 1)));
    const [x, y, z] = cmfAt(D.cmfFit.v, lam);
    X += B * x; Y += B * y; Zs += B * z;
  }
  let rgb = Y > 0 ? mul3(D.srgb.v, [X / Y, 1, Zs / Y]) : [0, 0, 0];
  const mn = Math.min(...rgb); if (mn < 0) rgb = rgb.map(v => v - mn);
  const mx = Math.max(...rgb) || 1;
  rgb = rgb.map(v => gammaEncode(v / mx));
  // visible brightness: luminance relative to 750 K (barely visible) .. 3000 K (bright), log scale
  const lum = T > 300 ? Y * 5e-9 : 0;
  const ref = T0 => { let s = 0; for (let lam = 380; lam <= 780; lam += 5) { const L = lam * 1e-9; s += (2 * h * c * c) / (L ** 5) / Math.expm1((h * c) / (L * kB * T0)) * cmfAt(D.cmfFit.v, lam)[1]; } return s * 5e-9; };
  const lo = Math.log10(ref(750)), hi = Math.log10(ref(3000));
  const glow = lum > 0 ? Math.max(0, Math.min(1, (Math.log10(lum) - lo) / (hi - lo))) : 0;
  const out = { rgb, glow };
  bbCache.set(k, out);
  return out;
}

/** A soft round contact shadow (alpha falloff) for a specimen resting on the hearth. */
function contactShadowTexture(size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
/** Soft round glow (white, alpha falloff) for the halo around hot metal. */
function haloTexture(size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/**
 * look: 'legacy' (the old dark stage) or 'forge' (Hold a piece · heat it, STYLE.md §6 and §9): glazed
 * beads in the family pigment inside a hairline glass cube with an ink unit-cell outline, in daylight;
 * as the metal starts to glow the room dims to the kiln colour (hooks.onKiln) and the glow lights it.
 */
export function createSampleView(hooks, { look = 'legacy' } = {}) {
  const FORGE = look === 'forge';
  const CK = FORGE ? 'forge' : 'sample'; // continuous-render key
  const scene = new THREE.Scene();
  const hemi = FORGE ? new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, 1.0) : new THREE.HemisphereLight(0xe6eeff, 0x1d2638, 1.3);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(FORGE ? LIGHT.key : 0xffffff, 2.0);
  key.position.set(-1, 2.2, 1.6);
  scene.add(key, key.target);
  const world = new THREE.Group();
  scene.add(world);

  // glass box + floor
  const boxMat = new THREE.LineBasicMaterial({ color: FORGE ? TOK.ink : 0x9fbcff, transparent: true, opacity: FORGE ? 0.22 : 0.35 });
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), boxMat);
  const glassMat = FORGE ? glassMaterial() : null;
  const glass = new THREE.Mesh(FORGE ? openFloor(roundedBox(1, 1, 1, 0.035, 4)) : new THREE.BoxGeometry(1, 1, 1), FORGE ? glassMat : new THREE.MeshStandardMaterial({ color: 0x8fb0ff, transparent: true, opacity: 0.05, roughness: 0.1, depthWrite: false, side: THREE.BackSide }));
  // forge: a glazed ceramic hearth (rebuilt to size in setBox) instead of a flat slab
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: FORGE ? '#CBBAA4' : 0x101a2e, roughness: FORGE ? 0.4 : 0.9 }));
  box.visible = !FORGE; // the forge's vessel shows only at its glass edges
  world.add(box, glass, floor);
  let hearthShadow = null, glassFoot = null;
  if (FORGE) { // the hearth sits on the paper: a soft contact shadow under it
    const tx = new THREE.CanvasTexture(softRectCanvas(128, 0.32, 0.18));
    hearthShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TOK.shadow, map: tx, transparent: true, opacity: 0.38, depthWrite: false }));
    hearthShadow.renderOrder = -1; world.add(hearthShadow);
    // by day the glass stands on the hearth: a thin line where its foot meets the glaze
    glassFoot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: TOK.shadow, map: new THREE.CanvasTexture(glassFootCanvas()), transparent: true, opacity: 0.32, depthWrite: false, ...ON_TOP }));
    glassFoot.renderOrder = 1; world.add(glassFoot);
  }
  const cellMat = new THREE.LineBasicMaterial({ color: FORGE ? TOK.ink : 0xffcf6b, transparent: true, opacity: FORGE ? 0.5 : 0.9 });
  const cellLines = new THREE.LineSegments(new THREE.BufferGeometry(), cellMat);
  world.add(cellLines);
  // forge: the hot metal lights its surroundings and blooms softly (one light, one sprite)
  let heatLight = null, halo = null, kilnK = 0, kilnTo = 0;
  const INK = new THREE.Color(TOK.ink), KILN_TEXT = new THREE.Color(TOK.kilnText);
  if (FORGE) {
    heatLight = new THREE.PointLight(0xffffff, 0, 0, 0);
    halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
    halo.renderOrder = 5;
    world.add(heatLight, halo);
  }

  // atoms: instanced spheres; the solid vibrates in the vertex shader, liquid/gas positions are CPU-driven
  const MAX = 3200;
  const atomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: FORGE ? 0.24 : 0.38, metalness: FORGE ? 0 : 0.15 });
  const uni = { uTime: { value: 0 }, uAmp: { value: 0 } };
  const glowU = { uGlowCol: { value: new THREE.Color() }, uGlowK: { value: 0 }, uHot: { value: 0 }, uGlaze: { value: 0.8 }, uBody: { value: 1 }, uMirror: { value: 0 },
    uCore: { value: new THREE.Vector3() }, uCoreR: { value: 1000 }, uRimCol: { value: new THREE.Color('#FFC98A') }, uCellCol: { value: new THREE.Color(TOK.verdigris) } };
  atomMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime; sh.uniforms.uAmp = uni.uAmp;
    Object.assign(sh.uniforms, glowU);
    // forge: hot beads glow brightest where they face you and darker toward the rim, whitening at the
    // core as the temperature rises, so every atom still reads as a sphere while incandescent
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGlowCol; uniform float uGlowK; uniform float uHot; uniform vec3 uCore; uniform float uCoreR; uniform vec3 uRimCol; uniform vec3 uCellCol; uniform float uGlaze; uniform float uBody; uniform float uMirror; varying float vHi; varying vec3 vWorldP;\n' + (FORGE ? GLAZE : ''))
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        #ifdef FORGE_GLOW
          // glazed beads: the same soft studio the table's tiles reflect
          vec3 wN = inverseTransformDirection(normal, viewMatrix), wV = inverseTransformDirection(geometryViewDir, viewMatrix);
          // quicksilver is a mirror of that studio, barely tinted by its family colour; the unit cell's
          // atoms keep the glaze, so the ink atom and its verdigris neighbours stay legible on it
          float cellA = step(0.5, vHi);
          reflectedLight.indirectSpecular += (uGlaze + 0.8 * uMirror * cellA) * glazeStudio(wN, wV, material.roughness);
          float mF = 0.72 + 0.28 * pow(1.0 - clamp(dot(wN, wV), 0.0, 1.0), 5.0);
          reflectedLight.indirectSpecular += uMirror * (1.0 - cellA) * mF * studioLight(reflect(-wV, wN), material.roughness) * mix(vec3(1.0), diffuseColor.rgb / max(uBody, 1e-3), 0.3);
        #endif`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        #ifdef FORGE_GLOW
          // a glowing metal's own light outshines its glaze; by day the unit cell's atoms are verdigris
          float lit = clamp(uGlowK * 2.0, 0.0, 1.0);
          diffuseColor.rgb *= uBody * (1.0 - 0.7 * lit); // a liquid metal's body is darker: its reflections carry it
          diffuseColor.rgb *= mix(0.74, 1.0, smoothstep(0.25, 0.95, length(vWorldP - uCore) / max(uCoreR, 1.0))); // deeper atoms a little shaded
          if (vHi > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vHi > 1.5 ? vec3(0.03, 0.028, 0.025) : uCellCol, 0.85 * (1.0 - lit));
        #endif`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        #ifdef FORGE_GLOW
          float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          vec3 hot = mix(uGlowCol, vec3(1.0, 0.95, 0.86), uHot * pow(facing, 2.0));
          totalEmissiveRadiance = hot * uGlowK * (0.28 + 0.72 * pow(facing, 1.3));
          // hotter inside, a little cooler at the outer edges of the lump or pool
          totalEmissiveRadiance *= 1.0 - 0.32 * smoothstep(0.3, 1.05, length(vWorldP - uCore) / max(uCoreR, 1.0));
          // the unit-cell atoms (one atom and the neighbours it touches) wear a glowing rim
          totalEmissiveRadiance += uRimCol * pow(1.0 - facing, 2.2) * step(0.5, vHi) * (vHi > 1.5 ? 0.9 : 0.6) * clamp(uGlowK * 2.0, 0.0, 1.0);
        #endif`);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aSeed;\nattribute float aHi;\nuniform float uTime;\nuniform float uAmp;\nvarying float vHi;\nvarying vec3 vWorldP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 w = vec3(7.1, 8.3, 9.7) + aSeed * 3.0;
        transformed += uAmp * vec3(sin(uTime * w.x + aSeed.x * 40.0), sin(uTime * w.y + aSeed.y * 40.0), sin(uTime * w.z + aSeed.z * 40.0));
        vHi = aHi;
        #ifdef USE_INSTANCING
          vWorldP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
  };
  let geo = new THREE.SphereGeometry(1, 20, 14);
  const hiAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX), 1); // 0 plain, 1 neighbour, 2 the chosen atom
  hiAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aHi', hiAttr);
  const seeds = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
  { const r = rng32(99); for (let i = 0; i < MAX * 3; i++) seeds.array[i] = r(); }
  geo.setAttribute('aSeed', seeds);
  const atoms = new THREE.InstancedMesh(geo, atomMat, MAX);
  atoms.count = 0;
  atoms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(atoms);
  // forge: a crystal we do not draw (a molecular or complex solid, radon's predicted crystal) still shows
  // its building block: one molecule or one atom rests on the hearth in a vessel sized to it, slowly
  // turning about the vertical, with a soft contact shadow (elements never made in bulk keep an empty
  // vessel: there is nothing to show)
  const specimen = new THREE.InstancedMesh(atoms.geometry, atomMat, 8);
  specimen.count = 0; specimen.visible = false; specimen.frustumCulled = false;
  world.add(specimen);
  let spec = null; // { n, T (template, resting), bond, r, foot, lo, hi, y, yaw }
  const specQ = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  const specShadow = FORGE ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: TOK.shadow, map: contactShadowTexture(), transparent: true, opacity: 0.4, depthWrite: false })) : null;
  if (specShadow) { specShadow.renderOrder = 1; specShadow.visible = false; world.add(specShadow); }
  // forge: a soft incandescent glow around every hot atom, the molten pool, the glow pooling on the
  // hearth, and spokes from one atom to the neighbours it touches
  let glow = null, pool = null, decal = null, spk = null, spokeC = -1, poolK = 0;
  if (FORGE) {
    glow = glowSprites(atoms, seeds, uni); world.add(glow.mesh);
    pool = moltenPool(); world.add(pool.mesh);
    decal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ ...ON_TOP, map: haloTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    decal.renderOrder = 2; world.add(decal);
    // the unit cell made visible: depth-tested rods from one atom to each neighbour it touches
    const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false); rodGeo.translate(0, 0.5, 0);
    spk = { rods: new THREE.InstancedMesh(rodGeo, new THREE.MeshStandardMaterial({ color: TOK.ink, roughness: 0.4 }), 12) };
    spk.rods.count = 0; spk.rods.frustumCulled = false; world.add(spk.rods);
    atomMat.defines = { FORGE_GLOW: '' };
  }

  // simulation state
  let P = new Float32Array(MAX * 3), Vv = new Float32Array(MAX * 3), Q = new Float32Array(MAX * 3); // positions, velocities, morph targets
  // molecules (N₂, P₄, S₈…): each particle is a molecule's centre, with an orientation and a steady spin
  const Qr = new Float32Array(MAX * 4), Wr = new Float32Array(MAX * 4); // quaternion; spin axis (xyz) and rate (w)
  let n = 0, mode = 'none', boxL = [1000, 1000, 1000], radius = 50, dNN = 200, phaseKey = '', element = 0, molN = 1, bond = 0, molT = null, molSize = 0;
  let morph = null, current = null, lastKind = null, puddleR = 0;
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), sv = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
  const q4 = new THREE.Quaternion(), dq = new THREE.Quaternion(), ax = new THREE.Vector3(), c3 = new THREE.Vector3();
  const rand = rng32(7);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  function budget() { return Math.round((tierConfig().points >= 1 ? 1500 : tierConfig().points >= 0.7 ? 800 : 330)); }

  /** Lattice block: positions of an n1 x n2 x n3 block centred on the origin. */
  function latticeBlock(cell, sites, nmax) {
    const V = cellVectors(cell);
    const len = V.map(v => Math.hypot(...v));
    const vol = Math.abs(V[0][0] * (V[1][1] * V[2][2] - V[1][2] * V[2][1]) - V[0][1] * (V[1][0] * V[2][2] - V[1][2] * V[2][0]) + V[0][2] * (V[1][0] * V[2][1] - V[1][1] * V[2][0]));
    const Lt = Math.cbrt((nmax / sites.length) * vol);
    const ns = len.map(l => Math.max(1, Math.round(Lt / l)));
    const pts = [];
    const close = cell.gamma === 90 && cell.beta === 90;
    for (let i = 0; i < ns[0] + (close ? 1 : 0); i++) for (let j = 0; j < ns[1] + (close ? 1 : 0); j++) for (let k = 0; k < ns[2] + (close ? 1 : 0); k++) {
      for (const s of sites) {
        const f = [s[0] + i, s[1] + j, s[2] + k];
        if (f[0] > ns[0] + 1e-6 || f[1] > ns[1] + 1e-6 || f[2] > ns[2] + 1e-6) continue;
        pts.push(fracToCart(V, f));
      }
    }
    const c = fracToCart(V, [ns[0] / 2, ns[1] / 2, ns[2] / 2]);
    return { pts: pts.map(p => [p[0] - c[0], p[2] - c[2], p[1] - c[1]]), V, ns, origin: c }; // crystal z -> scene up
  }

  // Bain path: bcc and fcc described as one body-centred tetragonal lattice (a_t, c_t)
  function bainParams(phase) {
    const a = phase.cell.a;
    return phase.proto === 'bcc' ? { at: a, ct: a } : { at: a / Math.SQRT2, ct: a };
  }
  function bainBlock(at, ct, ns) {
    const pts = [];
    for (let i = 0; i <= ns[0]; i++) for (let j = 0; j <= ns[1]; j++) for (let k = 0; k <= ns[2]; k++) {
      pts.push([i * at, k * ct, j * at]);
      if (i < ns[0] && j < ns[1] && k < ns[2]) pts.push([(i + 0.5) * at, (k + 0.5) * ct, (j + 0.5) * at]);
    }
    const cx = (ns[0] * at) / 2, cy = (ns[2] * ct) / 2, cz = (ns[1] * at) / 2;
    return pts.map(p => [p[0] - cx, p[1] - cy, p[2] - cz]);
  }

  // one unit sphere per quality tier; the radius is applied as each instance's scale, so phase changes
  // (912 °C, melting, boiling) never rebuild geometry mid-playback
  let geoTier = '';
  function setAtomGeometry(r) {
    radius = r;
    const tierKey = tierConfig().points >= 0.7 ? 'hi' : 'lo';
    if (tierKey === geoTier && atoms.geometry) return;
    geoTier = tierKey;
    const g = new THREE.SphereGeometry(1, tierKey === 'hi' ? 20 : 12, tierKey === 'hi' ? 14 : 9);
    g.setAttribute('aSeed', seeds);
    g.setAttribute('aHi', hiAttr);
    atoms.geometry.dispose();
    atoms.geometry = g;
    if (specimen) specimen.geometry = g;
  }

  function writeMatrices() {
    if (FORGE) updateCluster();
    for (let i = 0; i < n; i++) {
      if (molN > 1) { // a molecule's atoms sit side by side in the list, around its centre, as it tumbles
        c3.set(P[3 * i], P[3 * i + 1], P[3 * i + 2]); q4.fromArray(Qr, 4 * i);
        for (let k = 0; k < molN; k++) {
          v3.set(molT[k][0] * bond, molT[k][1] * bond, molT[k][2] * bond).applyQuaternion(q4).add(c3);
          m4.compose(v3, q, sv.set(radius, radius, radius));
          atoms.setMatrixAt(molN * i + k, m4);
        }
        continue;
      }
      v3.set(P[3 * i], P[3 * i + 1], P[3 * i + 2]);
      const sc = occl[i] ? 0 : radius;
      m4.compose(v3, q, sv.set(sc, sc, sc));
      atoms.setMatrixAt(i, m4);
    }
    atoms.count = molN * n;
    // forge: a hot gas is sparse; draw a share of the particles so it reads as atoms flying apart
    // (whole molecules, never some of a molecule's atoms without the others)
    if (FORGE && current && current.kind === 'gas') atoms.count = molN * Math.ceil(n * 0.24); // sparse: atoms flying apart, never a cloud
    atoms.instanceMatrix.needsUpdate = true;
    if (glow) glow.mesh.count = atoms.count;
    if (FORGE) { // the glow's centre and reach follow the lump, pool or vapour
      let cx = 0, cy = 0, cz = 0; for (let i = 0; i < n; i++) { cx += P[3 * i]; cy += P[3 * i + 1]; cz += P[3 * i + 2]; }
      cx /= n || 1; cy /= n || 1; cz /= n || 1;
      let rmax = 0; for (let i = 0; i < n; i += 3) rmax = Math.max(rmax, Math.hypot(P[3 * i] - cx, P[3 * i + 1] - cy, P[3 * i + 2] - cz));
      glowU.uCore.value.set(cx, cy, cz); glowU.uCoreR.value = rmax + radius;
    }
  }

  /** The specimen for a crystal we do not draw (null: draw nothing, as for an element never made in bulk). */
  function specimenFor(e, ss) {
    if (!FORGE || ss.kind !== 'card') return null;
    const room = stateAt(e, 293.15);
    const measured = room.s !== 'unknown' && !room.p; // its matter is real: only its crystal is not drawn
    if (!(ss.card === 'molecular' || ss.card === 'complex' || (ss.card === 'predicted' && measured))) return null;
    const rc = e.f.rCov?.[0] || e.f.rVdw?.[0] * 0.6 || 120, gasN = e.ph.gas ? e.ph.gas[0] : 1;
    let sp;
    if (ss.card === 'molecular' && gasN > 1) { // one molecule, as the fluid draws them, at rest: a pair lying
      // down, the tetrahedron on a face, a ring standing on its rim (lying flat, seen from above the hearth,
      // its far atoms hid its hole); the turning shows the ring face-on, then its crown edge-on
      let T = molTemplate(gasN), q0 = null;
      if (gasN === 4) q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), UP);
      else if (gasN > 4) q0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      if (q0) T = T.map(p => new THREE.Vector3(...p).applyQuaternion(q0).toArray());
      sp = { n: gasN, T, bond: 2 * rc, r: rc * molR(gasN) };
    } else { // one atom, the liquid's size
      const rv = e.f.rVdw?.[0] || 2 * rc;
      sp = { n: 1, T: [[0, 0, 0]], bond: 0, r: 0.57 * (e.f.cat[0] === 'noble-gas' ? 1.6 * rv : 2.2 * rc) };
    }
    // its reach: across the floor (it turns about the vertical, so a circle) and from bottom to top
    sp.foot = Math.max(...sp.T.map(p => Math.hypot(p[0], p[2]))) * sp.bond + sp.r;
    sp.lo = Math.min(...sp.T.map(p => p[1])) * sp.bond - sp.r; sp.hi = Math.max(...sp.T.map(p => p[1])) * sp.bond + sp.r;
    sp.yaw = 0; // the sway's phase; it faces the camera's bearing (0.6): a ring face-on, a pair across the view
    return sp;
  }
  function writeSpecimen() {
    specimen.visible = !!spec;
    if (specShadow) specShadow.visible = !!spec;
    if (!spec) { specimen.count = 0; return; }
    specQ.setFromAxisAngle(UP, 0.6 + 0.65 * Math.sin(spec.yaw)); // a gentle sway about facing the visitor
    for (let k = 0; k < spec.n; k++) {
      v3.set(spec.T[k][0] * spec.bond, spec.T[k][1] * spec.bond, spec.T[k][2] * spec.bond).applyQuaternion(specQ);
      v3.y += spec.y;
      m4.compose(v3, q, sv.set(spec.r, spec.r, spec.r));
      specimen.setMatrixAt(k, m4);
    }
    specimen.count = spec.n; specimen.instanceMatrix.needsUpdate = true;
    hiAttr.array.fill(0, 0, 8); hiAttr.needsUpdate = true; // plain beads, no unit-cell colours
    glowU.uCore.value.set(0, spec.y, 0); glowU.uCoreR.value = 1; // no inner shading for a lone specimen
  }

  function setBox(L) {
    boxL = L;
    box.scale.set(L[0], L[1], L[2]); glass.scale.set(L[0], L[1], L[2]);
    if (FORGE) { // a rounded ceramic hearth, glazed, a little wider than the vessel
      const w = L[0] * 1.32, hgt = L[1] * 0.07;
      floor.geometry.dispose();
      floor.geometry = roundedBox(w, hgt, w, Math.min(hgt * 0.45, w * 0.04), 3);
      floor.scale.set(1, 1, 1); floor.position.set(0, -L[1] / 2 - hgt / 2, 0);
      hearthShadow.scale.set(w * 1.22, 1, w * 1.22); hearthShadow.position.set(L[0] * 0.03, -L[1] / 2 - hgt - L[1] * 0.002, L[2] * 0.04);
      glassFoot.scale.set(L[0] / 0.88, 1, L[2] / 0.88); glassFoot.position.set(0, -L[1] / 2 + L[1] * 0.001, 0); // its line falls on the glass walls
      decal.scale.set(L[0] * 1.5, 1, L[2] * 1.5); decal.position.set(0, -L[1] / 2 + L[1] * 0.002, 0);
    } else { floor.scale.set(L[0] * 1.25, L[1] * 0.04, L[2] * 1.25); floor.position.set(0, -L[1] / 2 - L[1] * 0.02, 0); }
  }
  /**
   * The unit cell made visible (solid, forge): one atom a little inside the front corner and the
   * neighbours it touches (8 in bcc, 12 in fcc, counted from positions). They wear a glowing rim, rods
   * join them, and the atoms in front of them shrink back like a cutaway, so you can count them.
   */
  const occl = new Uint8Array(MAX);
  function updateCluster() {
    occl.fill(0, 0, n); hiAttr.array.fill(0, 0, Math.max(n, 1));
    // by day only: in the kiln the opened cell read as a fiery cavity (hero review r5)
    const solid = !!spk && current && current.kind === 'solid' && n > 12 && kilnTo !== 1;
    if (spk) spk.rods.count = 0;
    if (!solid) { hiAttr.needsUpdate = true; return; }
    const lift0 = world.userData.lift || 0;
    if (spokeC < 0 || spokeC >= n) {
      const mx = [0, 0, 0];
      for (let i = 0; i < n; i++) { mx[0] = Math.max(mx[0], Math.abs(P[3 * i])); mx[1] = Math.max(mx[1], Math.abs(P[3 * i + 1] - lift0)); mx[2] = Math.max(mx[2], Math.abs(P[3 * i + 2])); }
      const tx = mx[0] * 0.45, ty = lift0 + mx[1] * 0.45, tz = mx[2] * 0.45;
      let best = 1e30;
      for (let i = 0; i < n; i++) { const d = (P[3 * i] - tx) ** 2 + (P[3 * i + 1] - ty) ** 2 + (P[3 * i + 2] - tz) ** 2; if (d < best) { best = d; spokeC = i; } }
    }
    const c = 3 * spokeC, cx = P[c], cy = P[c + 1], cz = P[c + 2];
    const d2 = new Float32Array(n); let dmin = 1e30;
    for (let i = 0; i < n; i++) { if (i === spokeC) { d2[i] = 1e30; continue; } d2[i] = (P[3 * i] - cx) ** 2 + (P[3 * i + 1] - cy) ** 2 + (P[3 * i + 2] - cz) ** 2; if (d2[i] < dmin) dmin = d2[i]; }
    const lim = dmin * 1.12 * 1.12;
    // the default view's direction (frameGoal): atoms between it and the cell step back
    const th = 0.6, ph = 1.04, vx = Math.sin(ph) * Math.sin(th), vy = Math.cos(ph), vz = Math.sin(ph) * Math.cos(th);
    const rr = (1.8 * Math.sqrt(dmin)) ** 2;
    let m = 0;
    hiAttr.array[spokeC] = 2;
    for (let i = 0; i < n; i++) {
      const dx = P[3 * i] - cx, dy = P[3 * i + 1] - cy, dz = P[3 * i + 2] - cz;
      if (d2[i] <= lim && m < 12) {
        hiAttr.array[i] = 1;
        const len = Math.sqrt(d2[i]);
        v3.set(dx / len, dy / len, dz / len); q.setFromUnitVectors(UPV, v3);
        m4.compose(v3.set(cx, cy, cz), q, sv.set(radius * 0.16, len, radius * 0.16));
        spk.rods.setMatrixAt(m++, m4);
        q.identity();
        continue;
      }
      if (i === spokeC) continue;
      const along = dx * vx + dy * vy + dz * vz;
      if (along > 0.3 * Math.sqrt(dmin) && dx * dx + dy * dy + dz * dz - along * along < rr) occl[i] = 1;
    }
    spk.rods.count = m; spk.rods.instanceMatrix.needsUpdate = true;
    hiAttr.needsUpdate = true;
  }
  function drawCell(phase, block) {
    if (!phase || !block) { cellLines.visible = false; return; }
    const V = block.V;
    const corner = f => { const p = fracToCart(V, f); return [p[0] - block.origin[0], p[2] - block.origin[2], p[1] - block.origin[1]]; };
    const cs = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]].map(corner);
    const E2 = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]];
    const arr = new Float32Array(E2.length * 6);
    E2.forEach(([a, b], i) => { arr.set(cs[a], 6 * i); arr.set(cs[b], 6 * i + 3); });
    cellLines.geometry.dispose();
    cellLines.geometry = new THREE.BufferGeometry();
    cellLines.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    cellLines.visible = true;
  }

  // ---- build the solid for the current phase (with Bain morph between bcc and fcc) ---------
  let bain = null; // { ns, from:{at,ct}, to:{at,ct}, k }
  function buildSolid(e, phase, animateFrom) {
    const nmax = Math.min(budget(), MAX);
    molN = 1;
    dNN = phase.dNN;
    const isBain = ['bcc', 'fcc'].includes(phase.proto) && (e.lat.phases.filter(p => p.T && ['bcc', 'fcc'].includes(p.proto)).length > 1);
    let pts, block = null;
    if (isBain) {
      const bp = bainParams(phase);
      if (!bain || bain.Z !== e.Z) {
        const per = 2; const cnt = nmax / per; const nn = Math.max(2, Math.round(Math.cbrt(cnt)));
        bain = { Z: e.Z, ns: [nn, nn, Math.max(2, Math.round(nn * bp.at / bp.ct))], cur: bp };
      }
      const from = bain.cur, to = bp;
      pts = bainBlock(to.at, to.ct, bain.ns);
      if (animateFrom && !state.reduced && (from.at !== to.at || from.ct !== to.ct) && n === pts.length) {
        morph = { kind: 'bain', from, to, t: 0, dur: 1.4 };
      } else morph = null;
      bain.cur = to;
      cellLines.visible = false;
    } else {
      bain = null;
      block = latticeBlock(phase.cell, phase.sites, nmax);
      pts = block.pts;
      if (animateFrom && !state.reduced && n > 0) {
        // crossfade: atoms gather at the old positions then move to the nearest new site
        morph = { kind: 'move', t: 0, dur: 0.9, from: P.slice(0, 3 * n), nOld: n };
      } else morph = null;
      drawCell(phase, block);
    }
    n = Math.min(pts.length, MAX);
    if (!morph || morph.kind !== 'bain') spokeC = -1; // a new block: choose the spoke atom again (a Bain morph keeps it)
    for (let i = 0; i < n; i++) { Q[3 * i] = pts[i][0]; Q[3 * i + 1] = pts[i][1]; Q[3 * i + 2] = pts[i][2]; }
    if (!morph || morph.kind === 'bain') for (let i = 0; i < 3 * n; i++) P[i] = Q[i];
    setAtomGeometry(0.46 * dNN);
    // box: a little larger than the block, cubic-ish
    let mx = [0, 0, 0];
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) mx[k] = Math.max(mx[k], Math.abs(Q[3 * i + k]));
    const side = Math.max(mx[0], mx[1], mx[2]) * 2 + 2.2 * radius;
    // forge: a wider crucible, so the melt can spread into a low pool (about 40 % of the crystal's height)
    const vf = FORGE ? 1.6 : 1.3;
    if (!current || current.Z !== e.Z || Math.abs(side * vf - boxL[0]) / boxL[0] > 0.25) setBox([side * vf, side * vf, side * vf]);
    // stand the block on the floor
    const lift = -boxL[1] / 2 + mx[1] + radius * 1.05;
    for (let i = 0; i < n; i++) { Q[3 * i + 1] += lift; if (!morph || morph.kind === 'bain') P[3 * i + 1] += lift; }
    world.userData.lift = lift;
    cellLines.position.set(0, lift, 0);
  }

  // ---- liquid and gas -------------------------------------------------------------------------
  /**
   * A molecule's atoms around its centre, in bond lengths (our data names the molecule: N₂, P₄, S₈):
   * a pair; a regular tetrahedron (P₄); S₈ as the crown it is (every S–S–S angle about 108°, alternate
   * atoms a little above and below the ring: the shape of cyclo-octasulfur); any other ring flat.
   */
  function molTemplate(nAt) {
    if (nAt === 2) return [[-0.5, 0, 0], [0.5, 0, 0]];
    if (nAt === 4) { const s = 1 / (2 * Math.SQRT2); return [[s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]]; }
    const ang = k => (2 * Math.PI * k) / nAt;
    if (nAt === 8) { // the crown: next-but-one atoms (same height) fix the ring's radius, neighbours one bond apart
      const R = Math.sin((108 * Math.PI) / 360) / Math.sin((2 * Math.PI) / nAt);
      const hh = 0.5 * Math.sqrt(Math.max(0, 1 - (2 * R * Math.sin(Math.PI / nAt)) ** 2));
      return Array.from({ length: nAt }, (_, k) => [R * Math.cos(ang(k)), k % 2 ? hh : -hh, R * Math.sin(ang(k))]);
    }
    const R = 0.5 / Math.sin(Math.PI / nAt);
    return Array.from({ length: nAt }, (_, k) => [R * Math.cos(ang(k)), 0, R * Math.sin(ang(k))]);
  }
  // forge: a molecule's atoms overlap, so it reads as one joined body (the bond is about two covalent
  // radii, an approximation): a pair or a tetrahedron's beads are 0.62 of a bond, a ring's 0.54 (joined,
  // with its hole still open); the legacy look keeps its touching beads. In covalent radii:
  const molR = nAt => (!FORGE ? 0.95 : nAt >= 6 ? 1.08 : 1.24);
  function prepareFluid(e, kind) {
    const gasN = e.ph.gas ? e.ph.gas[0] : 1;
    const rc = e.f.rCov?.[0] || e.f.rVdw?.[0] * 0.6 || 120;
    if (n === 0) { // no solid shown before (molecular, card, or starting hot): make particles
      // fewer, larger particles for big molecules (an S₈ ring is as wide as four atoms)
      const cnt = Math.min(Math.floor(MAX / Math.max(1, gasN)), MAX / 2, Math.round((budget() * 0.45) / (gasN > 2 ? Math.sqrt(gasN) : 1)));
      // spacing from this element's own radii (van der Waals for noble gases and molecules, else covalent)
      const rv = e.f.rVdw?.[0] || 2 * rc;
      dNN = gasN > 1 || e.f.cat[0] === 'noble-gas' ? 1.6 * rv : 2.2 * rc;
      if (gasN > 1) { // a molecule is the particle: space them by its width (two touching atoms per bond)
        const t0 = molTemplate(gasN), reach = Math.max(...t0.map(p => Math.hypot(p[0], p[1], p[2])));
        dNN = Math.max(dNN, 2 * reach * 2 * rc + 2 * rc * molR(gasN));
      }
      n = cnt;
      const side = Math.cbrt(n) * dNN * 2.1;
      setBox([side, side, side]);
      const spread = kind === 'gas' ? 0.9 : 0.6, h0 = kind === 'gas' ? 0.9 : 0.35;
      for (let i = 0; i < n; i++) { P[3 * i] = (rand() - 0.5) * boxL[0] * spread; P[3 * i + 1] = -boxL[1] / 2 + rand() * boxL[1] * h0 + dNN * 0.5; P[3 * i + 2] = (rand() - 0.5) * boxL[2] * spread; }
      setAtomGeometry(gasN > 1 ? rc * molR(gasN) : 0.46 * dNN);
    }
    molN = gasN > 1 ? gasN : 1;
    bond = molN > 1 ? 2 * rc : 0; // bond length ~ two covalent radii (approximation)
    molT = molN > 1 ? molTemplate(molN) : null;
    if (molN > 1) {
      molSize = 2 * Math.max(...molT.map(p => Math.hypot(p[0], p[1], p[2]))) * bond + 2 * rc * molR(molN); // the molecule's width
      for (let i = 0; i < n; i++) { // a random orientation and a steady spin about a random axis
        q4.set(gauss(), gauss(), gauss(), gauss()).normalize().toArray(Qr, 4 * i);
        ax.set(gauss(), gauss(), gauss()).normalize();
        Wr[4 * i] = ax.x; Wr[4 * i + 1] = ax.y; Wr[4 * i + 2] = ax.z; Wr[4 * i + 3] = 0.6 + rand() * 1.2;
      }
    }
    if (kind === 'gas') {
      const M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * gasN;
      const vr = rmsSpeed(state.T, M, data().constants.R[0]) * SPEED_SCALE;
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) Vv[3 * i + k] = gauss() * vr / Math.sqrt(3);
    } else for (let i = 0; i < 3 * n; i++) Vv[i] *= 0.2;
    cellLines.visible = false;
    morph = null;
    // forge: atoms from liquid to gas, never a change of scale (STYLE §6): the liquid's beads overlap a
    // little and blend into one glowing mass, and the vapour keeps them; molecules keep their touching atoms
    if (FORGE) setAtomGeometry(molN > 1 ? rc * molR(molN) : 0.57 * dNN);
    // a puddle with the solid's volume: radius from n particles at spacing ~d_NN in a layer ~half as high as wide
    puddleR = FORGE ? boxL[0] * 0.44 : Math.cbrt((n * dNN ** 3) / Math.PI) * 0.9;
  }

  const grid = new Map();
  function stepFluid(dt, kind, e) {
    const L = boxL, r = radius, dmin = molN > 2 ? molSize * 0.95 : molN > 1 ? molSize * 0.75 : dNN * 0.98; // rings and tetrahedra touch, not interpenetrate
    const gasN = e.ph.gas ? e.ph.gas[0] : 1;
    const M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * gasN;
    const vrms = rmsSpeed(state.T, M, data().constants.R[0]) * SPEED_SCALE;
    // the walls keep every bead inside the glass: a particle's reach is its own radius, or a molecule's
    // outermost atom (its centre tumbles freely); the forge's glass has rounded edges, so a little more
    // (the floor is flat: beads rest on it at their own reach)
    const reach = FORGE && molN > 1 ? molSize / 2 : r, inset = FORGE ? reach + L[0] * 0.012 : r;
    const hx = L[0] / 2 - inset, hy = L[1] / 2 - inset, hz = L[2] / 2 - inset, fy = L[1] / 2 - reach;
    if (kind === 'gas') {
      // ideal gas: straight lines, elastic walls; rescale speeds smoothly toward the current temperature
      let s2 = 0; for (let i = 0; i < 3 * n; i++) s2 += Vv[i] * Vv[i];
      const cur = Math.sqrt(s2 / Math.max(1, n)), f = cur > 0 ? 1 + (vrms / cur - 1) * Math.min(1, dt * 2) : 1;
      for (let i = 0; i < n; i++) {
        const o = 3 * i;
        for (let k = 0; k < 3; k++) { Vv[o + k] *= f; P[o + k] += Vv[o + k] * dt; }
        if (P[o] > hx || P[o] < -hx) { P[o] = Math.max(-hx, Math.min(hx, P[o])); Vv[o] *= -1; }
        if (P[o + 1] > hy || P[o + 1] < -fy) { P[o + 1] = Math.max(-fy, Math.min(hy, P[o + 1])); Vv[o + 1] *= -1; }
        if (P[o + 2] > hz || P[o + 2] < -hz) { P[o + 2] = Math.max(-hz, Math.min(hz, P[o + 2])); Vv[o + 2] *= -1; }
      }
    } else {
      // liquid: jostling particles under gravity with short-range repulsion (keeps them about d_NN apart)
      // and a weak cohesive pull toward a puddle about the size of the melted block (a liquid keeps together)
      const jig = Math.min(vrms, dNN * 2.5) * (FORGE ? 0.4 : 0.9); // forge: a calmer pool, no beads flung above it
      let cx = 0, cz = 0; for (let i = 0; i < n; i++) { cx += P[3 * i]; cz += P[3 * i + 2]; } cx /= n || 1; cz /= n || 1;
      const Rp = puddleR || boxL[0] * 0.3;
      for (let i = 0; i < n; i++) {
        const o = 3 * i;
        Vv[o] += gauss() * jig * dt * 6; Vv[o + 1] += gauss() * jig * dt * 6 - dNN * (FORGE ? 22 : 6) * dt; Vv[o + 2] += gauss() * jig * dt * 6; // forge: it visibly slumps into a puddle
        const rx = P[o] - cx, rz = P[o + 2] - cz, rr = Math.hypot(rx, rz);
        // forge look: the pool gathers what reaches the floor; a drop still in the air falls like rain
        // (pulling it in at every height drew the condensing vapour into a tall column)
        const wy = FORGE ? Math.max(0, Math.min(1, 1 - (P[o + 1] + fy - dNN * 4) / (dNN * 3))) : 1;
        if (rr > Rp && wy > 0) { const pull = (wy * (rr - Rp) * 6 * dt) / rr; Vv[o] -= rx * pull * 4; Vv[o + 2] -= rz * pull * 4; }
        // a round pool, never the crucible's corners; only at the floor, so condensing droplets fall freely
        // and drift in (snapping them in mid-air stood them in columns on the pool's rim)
        if (FORGE && rr > Rp * 1.02 && P[o + 1] < -fy + dNN * 3) { const f = (Rp * 1.02) / rr; P[o] = cx + rx * f; P[o + 2] = cz + rz * f; Vv[o] *= 0.5; Vv[o + 2] *= 0.5; }
        if (FORGE && rr > 1 && wy > 0) { const sw = (wy * dNN * 2.2 * dt) / rr; Vv[o] -= rz * sw; Vv[o + 2] += rx * sw; } // a slow swirl, as in a stirred melt
        const damp = Math.exp(-(wy > 0 ? 4 : 1.2) * dt); // less drag in the air: the drops fall, then settle
        for (let k = 0; k < 3; k++) { Vv[o + k] *= damp; P[o + k] += Vv[o + k] * dt; }
        if (P[o] > hx || P[o] < -hx) { P[o] = Math.max(-hx, Math.min(hx, P[o])); Vv[o] *= -0.3; }
        if (P[o + 1] < -fy) { P[o + 1] = -fy; Vv[o + 1] *= -0.2; }
        if (P[o + 1] > hy) { P[o + 1] = hy; Vv[o + 1] = 0; }
        if (P[o + 2] > hz || P[o + 2] < -hz) { P[o + 2] = Math.max(-hz, Math.min(hz, P[o + 2])); Vv[o + 2] *= -0.3; }
      }
      // repulsion with a uniform grid
      grid.clear();
      const cs = dmin;
      const hk = (a, b, c) => (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); // numeric grid keys: no string garbage per frame
      const keyOf = (x, y, z) => hk(Math.floor(x / cs), Math.floor(y / cs), Math.floor(z / cs));
      for (let i = 0; i < n; i++) { const kk = keyOf(P[3 * i], P[3 * i + 1], P[3 * i + 2]); let a = grid.get(kk); if (!a) grid.set(kk, (a = [])); a.push(i); }
      for (let i = 0; i < n; i++) {
        const o = 3 * i, gx = Math.floor(P[o] / cs), gy = Math.floor(P[o + 1] / cs), gz = Math.floor(P[o + 2] / cs);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
          const list = grid.get(hk(gx + a, gy + b, gz + c));
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const p = 3 * j;
            const dx = P[p] - P[o], dy = P[p + 1] - P[o + 1], dz = P[p + 2] - P[o + 2];
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 >= dmin * dmin || d2 === 0) continue;
            const d = Math.sqrt(d2), push = (dmin - d) * 0.5 / d;
            P[o] -= dx * push; P[o + 1] -= dy * push; P[o + 2] -= dz * push;
            P[p] += dx * push; P[p + 1] += dy * push; P[p + 2] += dz * push;
          }
        }
      }
      // the push apart can carry a bead at the edge of the pool back through the glass: walls last
      if (FORGE) for (let i = 0; i < 3 * n; i += 3) {
        P[i] = Math.max(-hx, Math.min(hx, P[i])); P[i + 1] = Math.max(-fy, Math.min(hy, P[i + 1])); P[i + 2] = Math.max(-hz, Math.min(hz, P[i + 2]));
      }
    }
    if (molN > 1) for (let i = 0; i < n; i++) { // tumbling molecules: each spins about its own axis
      ax.set(Wr[4 * i], Wr[4 * i + 1], Wr[4 * i + 2]);
      dq.setFromAxisAngle(ax, Wr[4 * i + 3] * dt * (kind === 'gas' ? 3 : 1));
      q4.fromArray(Qr, 4 * i).multiply(dq).toArray(Qr, 4 * i);
    }
  }

  // ---- colour, glow, vibration ----------------------------------------------------------------
  function applyLook(e, kind) {
    const pal = FORGE ? (state.cb ? pigmentCB : pigment) : state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    atomMat.color.set(pal[e.f.cat[0]]);
    const bb = blackbody(state.T);
    const glowing = kind === 'solid' || kind === 'liquid';
    if (FORGE) atomMat.emissive.setRGB(bb.rgb[0], bb.rgb[1], bb.rgb[2], THREE.SRGBColorSpace); // the blackbody colour is display-encoded
    else atomMat.emissive.setRGB(bb.rgb[0], bb.rgb[1], bb.rgb[2]);
    if (FORGE) {
      // the room dims while the metal is hot enough to glow. The glow only grows with temperature
      // (solid, liquid and the hot vapour alike): colour from Planck, brightness from the visible output.
      const g = bb.glow, on = kind !== 'card' || spec ? g : 0; // a hot specimen glows too
      const col = new THREE.Color().setRGB(bb.rgb[0], bb.rgb[1], bb.rgb[2], THREE.SRGBColorSpace);
      atomMat.emissiveIntensity = 0;
      glowU.uGlowCol.value.copy(col);
      glowU.uGlowK.value = kind === 'gas' ? on * 1.05 : on * 1.35; // a vapour atom keeps its shading: a sphere, not a disc
      glowU.uHot.value = Math.min(kind === 'gas' ? 0.55 : 0.9, Math.max(0, (state.T - 1500) / 1900));
      const to = state.T > 760 && g > 0.01 && (kind !== 'card' || spec) ? 1 : 0;
      if (to !== kilnTo) { kilnTo = to; if (hooks.onKiln) hooks.onKiln(!!to); }
      const k = kilnK;
      hemi.intensity = 1.0 * (1 - 0.86 * k); key.intensity = 2.0 * (1 - 0.8 * k);
      // glazed beads catch the same soft studio as the table's tiles; a liquid metal by day (mercury) is
      // a mirror: a crisper, stronger glaze over a darker body. The reflections fade with the room light.
      const quick = quicksilver(e); // mercury: a mirror frozen, liquid or boiling (STYLE.md §6)
      atomMat.roughness = quick ? 0.1 : 0.24;
      glowU.uBody.value = quick ? 0.22 : 1;
      glowU.uGlaze.value = quick ? 0 : 0.8 * (1 - k);
      glowU.uMirror.value = quick ? 1 - k : 0;
      heatLight.color.copy(col); heatLight.intensity = on * 1.8;
      heatLight.position.set(0, (world.userData.lift || 0) * 0.4, 0);
      // one soft aura behind the crystal (depth-tested: it shows around it, not through it)
      halo.material.color.copy(col); halo.material.opacity = Math.min(0.32, on * 0.34);
      halo.material.depthTest = true;
      halo.scale.setScalar(boxL[0] * 2.2);
      halo.position.set(0, (world.userData.lift || 0) * 0.5, 0);
      // a glow around every hot atom; larger and sparser in the vapour
      glow.mat.uniforms.uCol.value.copy(col);
      glow.mat.uniforms.uK.value = kind === 'gas' ? on * 0.26 : on * 0.5;
      glow.mat.uniforms.uSize.value = radius * (kind === 'gas' ? 3.2 : 3.4); // each vapour atom its own small glow (no blob)
      // per-atom glows are a fill cost software renderers cannot afford (low tier): there the beads'
      // own incandescence and a stronger aura carry the glow
      const sprites = tierConfig().points >= 0.7;
      glow.mesh.visible = sprites && on > 0.02;
      if (!sprites) halo.material.opacity = Math.min(0.5, on * 0.55);
      // the glow pools on the hearth; the molten pool and the glass take its colour
      decal.material.color.copy(col); decal.material.opacity = Math.min(kind === 'gas' ? 0.28 : 0.85, on * 0.95);
      pool.uni.uCol.value.copy(col); pool.uni.uK.value = on * 1.5;
      // by day the glass edges catch more light on the cream paper; in the kiln they stay as they were
      glassMat.uniforms.uCol.value.copy(INK).lerp(KILN_TEXT, k); glassMat.uniforms.uK.value = 0.34 - 0.2 * k; glassMat.uniforms.uBase.value = 0.022 - 0.016 * k;
      glassFoot.material.opacity = 0.32 * (1 - k);
      if (specShadow) specShadow.material.opacity = 0.4 * (1 - k);
      // the unit cell: verdigris atoms by day; warm-gold rims once the metal glows
      boxMat.color.copy(INK).lerp(KILN_TEXT, k); cellMat.color.copy(boxMat.color);
    } else {
      atomMat.emissiveIntensity = glowing ? bb.glow * 2.2 : 0;
      key.intensity = 2.0 * (1 - 0.5 * (glowing ? bb.glow : 0));
    }
    const ratio = data().model.lindemann[0];
    const Tm = e.ph.mp?.[0] ?? e.ph.sub?.[0];
    const rms = kind === 'solid' && Tm ? lindemannRms(state.T, Tm, dNN, ratio) : 0;
    // per-axis amplitude so the 3D rms matches; in units of the atom radius (instances are scaled by it)
    uni.uAmp.value = (state.reduced ? rms * 0.35 : rms / Math.sqrt(1.5)) / Math.max(radius, 1e-6);
  }

  // ---- main entry: go to the current temperature/element --------------------------------------
  function sync(force = false) {
    const e = byZ(state.Z);
    const ss = sampleStateAt(e, state.T, state.allotrope);
    const key2 = `${e.Z}|${ss.kind}|${ss.phase ? ss.phase.id : ''}|${ss.card || ''}|${E.tier}`;
    const elementChanged = element !== e.Z;
    if (elementChanged) { n = 0; bain = null; current = null; morph = null; }
    if (force || key2 !== phaseKey) {
      const prevKind = lastKind, box0 = boxL[0];
      spec = specimenFor(e, ss);
      if (ss.kind === 'solid') {
        buildSolid(e, ss.phase, !elementChanged && prevKind === 'solid');
        atoms.visible = true;
      } else if (ss.kind === 'liquid' || ss.kind === 'gas') {
        if (prevKind !== 'liquid' && prevKind !== 'gas') prepareFluid(e, ss.kind);
        else if (ss.kind === 'gas' && prevKind === 'liquid') prepareFluid(e, 'gas');
        else if (FORGE && ss.kind === 'liquid' && prevKind === 'gas') { // condensing: droplets rain down at different speeds, not as one block
          for (let i = 0; i < n; i++) { Vv[3 * i] *= 0.3; Vv[3 * i + 2] *= 0.3; Vv[3 * i + 1] = -rand() * dNN * 6; }
        }
        atoms.visible = true;
      } else {
        atoms.visible = false; cellLines.visible = false;
        if (spec) { // a vessel sized to the specimen; the fluid it froze from is forgotten (a melt starts afresh)
          n = 0;
          // about half the vessel's width, like an object in a museum case; it rests on the hearth
          const side = Math.max((spec.n === 1 ? 5 : 4) * spec.foot, 1.9 * (spec.hi - spec.lo)); // a lone atom: two fifths
          setBox([side, side, side]);
          spec.y = -side / 2 - spec.lo; world.userData.lift = spec.y;
          if (specShadow) { // under it, as wide as it is, just above the glaze
            const w = 2 * spec.foot * 1.35;
            specShadow.scale.set(w, 1, w); specShadow.position.set(0, -side / 2 + side * 0.003, 0);
          }
        } else if (n === 0 || elementChanged) setBox([1200, 1200, 1200]);
      }
      if (!elementChanged && prevKind && prevKind !== ss.kind && hooks.onEvent) hooks.onEvent(prevKind, ss.kind, e);
      if (!elementChanged && ss.kind === 'solid' && prevKind === 'solid' && current && current.phase && ss.phase && current.phase.id !== ss.phase.id && hooks.onEvent) hooks.onEvent('phase', ss.phase, e);
      phaseKey = key2; lastKind = ss.kind; element = e.Z;
      current = { Z: e.Z, ...ss };
      if (elementChanged || force) frame();
      else if (Math.abs(boxL[0] - box0) > 0.2 * box0) frame(); // the vessel changed size (a card melts into a liquid): glide to it
    }
    applyLook(e, ss.kind);
    writeMatrices();
    writeSpecimen();
    setContinuous(CK, (atoms.visible || !!spec) && !state.reduced || !!morph);
    if (hooks.onState) hooks.onState(current, { dNN, n, molN });
    invalidate();
  }

  function frameGoal() {
    const fov = freeFov();
    const R = Math.hypot(...boxL) * (FORGE ? 0.57 : 0.62);
    const r = R / Math.sin(Math.min(fov.v, fov.h) / 2);
    E.camera.near = R / 200; E.camera.far = R * 50; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: R * 0.4, rMax: R * 12, phiMin: 0.15, phiMax: 1.55 };
    return { target: new THREE.Vector3(0, -boxL[1] * (FORGE ? 0.12 : 0.05), 0), r, theta: FORGE ? 0.6 : 0.65, phi: FORGE ? 1.04 : 1.12 };
  }
  function frame(dur = state.reduced ? 0 : 0.7) { E.rig.flyTo(frameGoal(), dur); }

  let t = 0;
  const view = {
    scene,
    init() {},
    enter() { phaseKey = ''; element = 0; kilnK = 0; kilnTo = -1; sync(true); },
    exit() { setContinuous(CK, false); kilnK = 0; if (FORGE && hooks.onKiln) hooks.onKiln(false); E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix(); },
    /** The end of the scale dive: start inside the crystal, then draw back to see the whole lump. */
    diveIn(dur = 1.1) {
      const g = frameGoal();
      if (state.reduced || dur <= 0) { E.rig.flyTo(g, 0); return; }
      E.rig.flyTo({ target: g.target, r: g.r * 0.3, theta: g.theta + 0.5, phi: g.phi - 0.55 }, 0);
      E.rig.flyTo(g, dur);
    },
    resize() { if (current) frame(0); },
    onTier() { if (E.active === view) sync(true); },
    onState(ch) { if (E.active === view && ['Z', 'T', 'allotrope', 'cb', 'reduced'].some(k => k in ch)) sync(); },
    update(dt) {
      if (E.active !== view) return false;
      t += dt; uni.uTime.value = t;
      const e = byZ(state.Z);
      if (FORGE && Math.abs(kilnK - Math.max(0, kilnTo)) > 1e-3) { // the room dims and returns over ~600 ms
        kilnK += Math.sign(Math.max(0, kilnTo) - kilnK) * Math.min(Math.abs(Math.max(0, kilnTo) - kilnK), dt / 0.6);
        applyLook(e, current ? current.kind : 'solid');
        if (!atoms.visible || state.reduced) return true;
      }
      if (morph) {
        morph.t = Math.min(1, morph.t + dt / morph.dur);
        const s = morph.t < 0.5 ? 2 * morph.t * morph.t : 1 - (-2 * morph.t + 2) ** 2 / 2;
        if (morph.kind === 'bain') {
          const at = morph.from.at + (morph.to.at - morph.from.at) * s, ct = morph.from.ct + (morph.to.ct - morph.from.ct) * s;
          const pts = bainBlock(at, ct, bain.ns);
          const lift = world.userData.lift || 0;
          for (let i = 0; i < n; i++) { P[3 * i] = pts[i][0]; P[3 * i + 1] = pts[i][1] + lift; P[3 * i + 2] = pts[i][2]; }
        } else {
          for (let i = 0; i < n; i++) {
            const j = i % morph.nOld;
            for (let k = 0; k < 3; k++) P[3 * i + k] = morph.from[3 * j + k] + (Q[3 * i + k] - morph.from[3 * j + k]) * s;
          }
        }
        if (morph.t >= 1) { morph = null; for (let i = 0; i < 3 * n; i++) P[i] = Q[i]; }
        writeMatrices();
        return true;
      }
      if (current && (current.kind === 'liquid' || current.kind === 'gas') && !state.reduced) {
        // keep the fluid near wall-clock time when frames are slow (up to 2 steps of 1/30 s; one at 60 fps)
        let rem = FORGE ? Math.min(dt, 2 / 30) : Math.min(dt, 1 / 30); // at most two steps: slow frames must not get slower
        while (rem > 1e-4) { const hstep = Math.min(rem, 1 / 30); stepFluid(hstep, current.kind, e); rem -= hstep; }
        writeMatrices();
      }
      if (pool) pool.mesh.visible = false; // the melt is drawn as its atoms (continuity from solid to gas)
      if (spec && !state.reduced) { spec.yaw += dt * 0.45; writeSpecimen(); return true; }
      return atoms.visible && !state.reduced;
    },
    current: () => current,
    stats: () => ({ dNN, n, molN }),
  };
  return view;
}
