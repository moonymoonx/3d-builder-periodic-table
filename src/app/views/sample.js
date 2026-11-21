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
import { glassMaterial, glowSprites, moltenPool } from './forgeArt.js';
import { roundedBox } from './tableArt.js';
import { rng32 } from '../../physics/orbitals.js';

const SPEED_SCALE = 3; // display pm/s per real m/s (the real motion is ~3 x 10^11 times faster)
export const SLOWDOWN = 1e12 / SPEED_SCALE;

// ---- what is in the box at temperature T -----------------------------------------------------
/** { kind: 'solid'|'liquid'|'gas'|'card', phase, card, predicted, why } */
export function sampleStateAt(e, T, allotrope) {
  const lat = e.lat;
  if (lat.kind === 'predicted') return { kind: 'card', card: 'predicted' };
  const st = stateAt(e, T);
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
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), FORGE ? glassMat : new THREE.MeshStandardMaterial({ color: 0x8fb0ff, transparent: true, opacity: 0.05, roughness: 0.1, depthWrite: false, side: THREE.BackSide }));
  // forge: a glazed ceramic hearth (rebuilt to size in setBox) instead of a flat slab
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: FORGE ? '#CBBAA4' : 0x101a2e, roughness: FORGE ? 0.4 : 0.9 }));
  box.visible = !FORGE; // the forge's vessel shows only at its glass edges
  world.add(box, glass, floor);
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
  const atomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: FORGE ? 0.35 : 0.38, metalness: FORGE ? 0 : 0.15 });
  const uni = { uTime: { value: 0 }, uAmp: { value: 0 } };
  const glowU = { uGlowCol: { value: new THREE.Color() }, uGlowK: { value: 0 }, uHot: { value: 0 },
    uCore: { value: new THREE.Vector3() }, uCoreR: { value: 1000 }, uRimCol: { value: new THREE.Color('#FFC98A') }, uCellCol: { value: new THREE.Color(TOK.verdigris) } };
  atomMat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uni.uTime; sh.uniforms.uAmp = uni.uAmp;
    Object.assign(sh.uniforms, glowU);
    // forge: hot beads glow brightest where they face you and darker toward the rim, whitening at the
    // core as the temperature rises, so every atom still reads as a sphere while incandescent
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGlowCol; uniform float uGlowK; uniform float uHot; uniform vec3 uCore; uniform float uCoreR; uniform vec3 uRimCol; uniform vec3 uCellCol; varying float vHi; varying vec3 vWorldP;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        #ifdef FORGE_GLOW
          // a glowing metal's own light outshines its glaze; by day the unit cell's atoms are verdigris
          float lit = clamp(uGlowK * 2.0, 0.0, 1.0);
          diffuseColor.rgb *= 1.0 - 0.7 * lit;
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
  // forge: a soft incandescent glow around every hot atom, the molten pool, the glow pooling on the
  // hearth, and spokes from one atom to the neighbours it touches
  let glow = null, pool = null, decal = null, spk = null, spokeC = -1, poolK = 0;
  if (FORGE) {
    glow = glowSprites(atoms, seeds, uni); world.add(glow.mesh);
    pool = moltenPool(); world.add(pool.mesh);
    decal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    decal.renderOrder = 2; world.add(decal);
    // the unit cell made visible: depth-tested rods from one atom to each neighbour it touches
    const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false); rodGeo.translate(0, 0.5, 0);
    spk = { rods: new THREE.InstancedMesh(rodGeo, new THREE.MeshStandardMaterial({ color: TOK.ink, roughness: 0.4 }), 12) };
    spk.rods.count = 0; spk.rods.frustumCulled = false; world.add(spk.rods);
    atomMat.defines = { FORGE_GLOW: '' };
  }

  // simulation state
  let P = new Float32Array(MAX * 3), Vv = new Float32Array(MAX * 3), Q = new Float32Array(MAX * 3); // positions, velocities, morph targets
  let n = 0, mode = 'none', boxL = [1000, 1000, 1000], radius = 50, dNN = 200, phaseKey = '', element = 0, molN = 1, bond = 0;
  let morph = null, current = null, lastKind = null, puddleR = 0;
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), sv = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
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
  }

  function writeMatrices() {
    if (FORGE) updateCluster();
    for (let i = 0; i < n; i++) {
      v3.set(P[3 * i], P[3 * i + 1], P[3 * i + 2]);
      const sc = occl[i] ? 0 : radius;
      m4.compose(v3, q, sv.set(sc, sc, sc));
      atoms.setMatrixAt(i, m4);
      if (molN === 2) {
        const o = 3 * i; // second atom of the molecule, along a tumbling axis stored in Q
        v3.set(P[o] + Q[o] * bond, P[o + 1] + Q[o + 1] * bond, P[o + 2] + Q[o + 2] * bond);
        m4.compose(v3, q, sv.set(radius, radius, radius));
        atoms.setMatrixAt(n + i, m4);
      }
    }
    atoms.count = molN === 2 ? 2 * n : n;
    // forge: a hot gas is sparse; draw a share of the particles so it reads as atoms flying apart
    if (FORGE && current && current.kind === 'gas') atoms.count = Math.ceil(atoms.count * 0.4);
    atoms.instanceMatrix.needsUpdate = true;
    if (glow) glow.mesh.count = atoms.count;
    if (FORGE) { // the glow's centre and reach follow the lump, pool or vapour
      let cx = 0, cy = 0, cz = 0; for (let i = 0; i < n; i++) { cx += P[3 * i]; cy += P[3 * i + 1]; cz += P[3 * i + 2]; }
      cx /= n || 1; cy /= n || 1; cz /= n || 1;
      let rmax = 0; for (let i = 0; i < n; i += 3) rmax = Math.max(rmax, Math.hypot(P[3 * i] - cx, P[3 * i + 1] - cy, P[3 * i + 2] - cz));
      glowU.uCore.value.set(cx, cy, cz); glowU.uCoreR.value = rmax + radius;
    }
  }

  function setBox(L) {
    boxL = L;
    box.scale.set(L[0], L[1], L[2]); glass.scale.set(L[0], L[1], L[2]);
    if (FORGE) { // a rounded ceramic hearth, glazed, a little wider than the vessel
      const w = L[0] * 1.32, hgt = L[1] * 0.07;
      floor.geometry.dispose();
      floor.geometry = roundedBox(w, hgt, w, Math.min(hgt * 0.45, w * 0.04), 3);
      floor.scale.set(1, 1, 1); floor.position.set(0, -L[1] / 2 - hgt / 2, 0);
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
  function prepareFluid(e, kind) {
    const gasN = e.ph.gas ? e.ph.gas[0] : 1;
    const rc = e.f.rCov?.[0] || e.f.rVdw?.[0] * 0.6 || 120;
    if (n === 0) { // no solid shown before (molecular, card, or starting hot): make particles
      const cnt = Math.min(MAX / 2, Math.round(budget() * 0.45));
      // spacing from this element's own radii (van der Waals for noble gases and molecules, else covalent)
      const rv = e.f.rVdw?.[0] || 2 * rc;
      dNN = gasN > 1 || e.f.cat[0] === 'noble-gas' ? 1.6 * rv : 2.2 * rc;
      n = cnt;
      const side = Math.cbrt(n) * dNN * 2.1;
      setBox([side, side, side]);
      const spread = kind === 'gas' ? 0.9 : 0.6, h0 = kind === 'gas' ? 0.9 : 0.35;
      for (let i = 0; i < n; i++) { P[3 * i] = (rand() - 0.5) * boxL[0] * spread; P[3 * i + 1] = -boxL[1] / 2 + rand() * boxL[1] * h0 + dNN * 0.5; P[3 * i + 2] = (rand() - 0.5) * boxL[2] * spread; }
      setAtomGeometry(gasN === 2 ? Math.min(rc * 0.95, dNN * 0.3) : 0.46 * dNN);
    }
    molN = gasN === 2 ? 2 : 1;
    bond = molN === 2 ? 2 * rc : 0; // bond length ~ two covalent radii (approximation)
    if (molN === 2) for (let i = 0; i < n; i++) { const a = rand() * 2 * Math.PI, z = 2 * rand() - 1, s = Math.sqrt(1 - z * z); Q[3 * i] = s * Math.cos(a); Q[3 * i + 1] = z; Q[3 * i + 2] = s * Math.sin(a); }
    if (kind === 'gas') {
      const M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * gasN;
      const vr = rmsSpeed(state.T, M, data().constants.R[0]) * SPEED_SCALE;
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) Vv[3 * i + k] = gauss() * vr / Math.sqrt(3);
    } else for (let i = 0; i < 3 * n; i++) Vv[i] *= 0.2;
    cellLines.visible = false;
    morph = null;
    if (FORGE) setAtomGeometry(kind === 'gas' ? 0.26 * dNN : 0.57 * dNN); // liquid: beads overlap a little and blend into one glowing mass
    // a puddle with the solid's volume: radius from n particles at spacing ~d_NN in a layer ~half as high as wide
    puddleR = FORGE ? boxL[0] * 0.44 : Math.cbrt((n * dNN ** 3) / Math.PI) * 0.9;
  }

  const grid = new Map();
  function stepFluid(dt, kind, e) {
    const L = boxL, r = radius, dmin = molN === 2 ? (bond + 2 * r) * 0.75 : dNN * 0.98;
    const gasN = e.ph.gas ? e.ph.gas[0] : 1;
    const M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * gasN;
    const vrms = rmsSpeed(state.T, M, data().constants.R[0]) * SPEED_SCALE;
    const hx = L[0] / 2 - r, hy = L[1] / 2 - r, hz = L[2] / 2 - r;
    if (kind === 'gas') {
      // ideal gas: straight lines, elastic walls; rescale speeds smoothly toward the current temperature
      let s2 = 0; for (let i = 0; i < 3 * n; i++) s2 += Vv[i] * Vv[i];
      const cur = Math.sqrt(s2 / Math.max(1, n)), f = cur > 0 ? 1 + (vrms / cur - 1) * Math.min(1, dt * 2) : 1;
      for (let i = 0; i < n; i++) {
        const o = 3 * i;
        for (let k = 0; k < 3; k++) { Vv[o + k] *= f; P[o + k] += Vv[o + k] * dt; }
        if (P[o] > hx || P[o] < -hx) { P[o] = Math.max(-hx, Math.min(hx, P[o])); Vv[o] *= -1; }
        if (P[o + 1] > hy || P[o + 1] < -hy) { P[o + 1] = Math.max(-hy, Math.min(hy, P[o + 1])); Vv[o + 1] *= -1; }
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
        if (rr > Rp) { const pull = (rr - Rp) * 6 * dt / rr; Vv[o] -= rx * pull * 4; Vv[o + 2] -= rz * pull * 4; }
        if (FORGE && rr > Rp * 1.02) { const f = (Rp * 1.02) / rr; P[o] = cx + rx * f; P[o + 2] = cz + rz * f; Vv[o] *= 0.5; Vv[o + 2] *= 0.5; } // a round pool, never the crucible's corners
        if (FORGE && rr > 1) { const sw = dNN * 2.2 * dt / rr; Vv[o] -= rz * sw; Vv[o + 2] += rx * sw; } // a slow swirl, as in a stirred melt
        const damp = Math.exp(-4 * dt);
        for (let k = 0; k < 3; k++) { Vv[o + k] *= damp; P[o + k] += Vv[o + k] * dt; }
        if (P[o] > hx || P[o] < -hx) { P[o] = Math.max(-hx, Math.min(hx, P[o])); Vv[o] *= -0.3; }
        if (P[o + 1] < -hy) { P[o + 1] = -hy; Vv[o + 1] *= -0.2; }
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
    }
    if (molN === 2) for (let i = 0; i < n; i++) { // tumbling molecules
      const o = 3 * i, w = dt * (kind === 'gas' ? 4 : 1.5);
      const x = Q[o], y = Q[o + 1], z = Q[o + 2];
      Q[o] = x + w * (y - z * 0.5); Q[o + 1] = y + w * (z - x); Q[o + 2] = z + w * (x * 0.5 - y);
      const l = Math.hypot(Q[o], Q[o + 1], Q[o + 2]) || 1; Q[o] /= l; Q[o + 1] /= l; Q[o + 2] /= l;
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
      const g = bb.glow, on = kind !== 'card' ? g : 0;
      const col = new THREE.Color().setRGB(bb.rgb[0], bb.rgb[1], bb.rgb[2], THREE.SRGBColorSpace);
      atomMat.emissiveIntensity = 0;
      glowU.uGlowCol.value.copy(col);
      glowU.uGlowK.value = kind === 'gas' ? on * 1.7 : on * 1.35;
      glowU.uHot.value = Math.min(0.9, Math.max(0, (state.T - 1500) / 1900));
      const to = state.T > 760 && g > 0.01 && kind !== 'card' ? 1 : 0;
      if (to !== kilnTo) { kilnTo = to; if (hooks.onKiln) hooks.onKiln(!!to); }
      const k = kilnK;
      hemi.intensity = 1.0 * (1 - 0.86 * k); key.intensity = 2.0 * (1 - 0.8 * k);
      heatLight.color.copy(col); heatLight.intensity = on * 1.8;
      heatLight.position.set(0, (world.userData.lift || 0) * 0.4, 0);
      // one soft aura behind the crystal (depth-tested: it shows around it, not through it)
      halo.material.color.copy(col); halo.material.opacity = Math.min(0.32, on * 0.34);
      halo.material.depthTest = true;
      halo.scale.setScalar(boxL[0] * 2.2);
      halo.position.set(0, (world.userData.lift || 0) * 0.5, 0);
      // a glow around every hot atom; larger and sparser in the vapour
      glow.mat.uniforms.uCol.value.copy(col);
      glow.mat.uniforms.uK.value = kind === 'gas' ? on * 0.6 : on * 0.5;
      glow.mat.uniforms.uSize.value = radius * (kind === 'gas' ? 7.5 : 3.4);
      // per-atom glows are a fill cost software renderers cannot afford (low tier): there the beads'
      // own incandescence and a stronger aura carry the glow
      const sprites = tierConfig().points >= 0.7;
      glow.mesh.visible = sprites && on > 0.02;
      if (!sprites) halo.material.opacity = Math.min(0.5, on * 0.55);
      // the glow pools on the hearth; the molten pool and the glass take its colour
      decal.material.color.copy(col); decal.material.opacity = Math.min(kind === 'gas' ? 0.55 : 0.85, on * 0.95);
      pool.uni.uCol.value.copy(col); pool.uni.uK.value = on * 1.5;
      glassMat.uniforms.uCol.value.copy(INK).lerp(KILN_TEXT, k); glassMat.uniforms.uK.value = 0.2 - 0.06 * k;
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
      const prevKind = lastKind;
      if (ss.kind === 'solid') {
        buildSolid(e, ss.phase, !elementChanged && prevKind === 'solid');
        atoms.visible = true;
      } else if (ss.kind === 'liquid' || ss.kind === 'gas') {
        if (prevKind !== 'liquid' && prevKind !== 'gas') prepareFluid(e, ss.kind);
        else if (ss.kind === 'gas' && prevKind === 'liquid') prepareFluid(e, 'gas');
        atoms.visible = true;
      } else {
        atoms.visible = false; cellLines.visible = false;
        if (n === 0 || elementChanged) setBox([1200, 1200, 1200]);
      }
      if (!elementChanged && prevKind && prevKind !== ss.kind && hooks.onEvent) hooks.onEvent(prevKind, ss.kind, e);
      if (!elementChanged && ss.kind === 'solid' && prevKind === 'solid' && current && current.phase && ss.phase && current.phase.id !== ss.phase.id && hooks.onEvent) hooks.onEvent('phase', ss.phase, e);
      phaseKey = key2; lastKind = ss.kind; element = e.Z;
      current = { Z: e.Z, ...ss };
      if (elementChanged || force) frame();
    }
    applyLook(e, ss.kind);
    writeMatrices();
    setContinuous(CK, atoms.visible && !state.reduced || !!morph);
    if (hooks.onState) hooks.onState(current, { dNN, n, molN });
    invalidate();
  }

  function frameGoal() {
    const fov = freeFov();
    const R = Math.hypot(...boxL) * (FORGE ? 0.5 : 0.62);
    const r = R / Math.sin(Math.min(fov.v, fov.h) / 2);
    E.camera.near = R / 200; E.camera.far = R * 50; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: R * 0.4, rMax: R * 12, phiMin: 0.15, phiMax: 1.55 };
    return { target: new THREE.Vector3(0, -boxL[1] * 0.05, 0), r, theta: FORGE ? 0.6 : 0.65, phi: FORGE ? 1.04 : 1.12 };
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
      return atoms.visible && !state.reduced;
    },
    current: () => current,
    stats: () => ({ dNN, n, molN }),
  };
  return view;
}
