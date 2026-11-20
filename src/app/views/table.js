// Table view (home): 118 porcelain tiles on warm paper (STYLE.md §6). Layouts 18-column (home),
// 32-column and helix (32 columns wrapped on a cylinder, after de Chancourtois' 1862 helix).
// Lenses (places/lenses.js) set colour (family / state at T) and height (flat, or one property).
// The symbol and number are printed on each tile's glaze (atlas texture); family names are written
// on the table (region labels); the hovered tile lifts and shows its name; the selected tile lifts
// and gets a verdigris outline. Everything renders on demand.
import * as THREE from 'three';
import { E, invalidate, animate, raycastFrom, tierConfig, freeFov, toScreen } from '../engine.js';
import { state } from '../state.js';
import { elements, propValue, propRange, prop, stateAt, isPred, name } from '../data.js';
import { LabelLayer } from '../labels.js';
import { t } from '../i18n.js';
import { pigment, pigmentCB, stateColor, color as TOK, light as LIGHT, tile as TILE, motion, font } from '../../design/tokens.js';
import { roundedBox, softRectTexture, symbolAtlas, roundedOutline, luminance } from './tableArt.js';
import { REGIONS } from './tableRegions.js';

const W = TILE.width, H0 = TILE.thickness, HMAX = 4.6;
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
  if (state.marks && !state.marks.has(e.Z)) return false;
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

  // ---- daylight studio --------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.hemi));
  const key = new THREE.DirectionalLight(LIGHT.key, LIGHT.keyIntensity);
  key.position.set(...LIGHT.keyPos);
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  const rim = new THREE.DirectionalLight(LIGHT.rim, LIGHT.rimIntensity);
  rim.position.set(...LIGHT.rimPos);
  scene.add(key, rim);

  // ---- porcelain tiles: one instanced rounded block; the shader stretches the middle for tall
  // columns (bevels keep their shape), darkens the sides, prints the symbol on the glaze ----------
  const atlas = symbolAtlas(els, { font: font.sans });
  // anisotropic filtering keeps tilted symbols crisp; costly on software renderers, so it follows the tier
  const aniso = tier => Math.min({ low: 1, med: 4, high: 8 }[tier] || 4, E.renderer.capabilities.getMaxAnisotropy());
  atlas.tex.anisotropy = aniso(E.tier);
  const geo = roundedBox(W, H0, W, TILE.bevel, E.tier === 'low' ? 1 : E.tier === 'med' ? 2 : 3);
  geo.translate(0, H0 / 2, 0);
  const aH = new THREE.InstancedBufferAttribute(new Float32Array(N).fill(H0), 1);
  const aLift = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
  const aCell = new THREE.InstancedBufferAttribute(new Float32Array(els.map((_, i) => i)), 1);
  const aFx = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); // hatch, dim, hover, selected
  const aInk = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  for (const [k, a] of Object.entries({ aH, aLift, aCell, aFx, aInk })) { a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, a); }
  const uni = {
    uAtlas: { value: atlas.tex }, uGrid: { value: new THREE.Vector2(atlas.cols, atlas.rows) }, uH0: { value: H0 }, uW: { value: W },
    uSide: { value: TILE.sideDarken }, uTopRough: { value: TILE.topRoughness }, uSideRough: { value: TILE.sideRoughness },
    uPaper: { value: new THREE.Color(TOK.paper) }, uSweep: { value: -99 }, uSweepAmp: { value: 0 },
  };
  const mat = new THREE.MeshStandardMaterial({ roughness: TILE.sideRoughness, metalness: 0 });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aH; attribute float aLift; attribute float aCell; attribute vec4 aFx; attribute vec3 aInk;
        uniform float uH0;
        varying vec3 vLocal; varying float vTop; varying vec4 vFx; varying vec3 vInk; varying float vCell; varying vec3 vWP;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLocal = position; vTop = normal.y; vFx = aFx; vInk = aInk; vCell = aCell;
        if (position.y > uH0 * 0.5) transformed.y += max(aH - uH0, 0.0);
        transformed.y += aLift;
        vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uAtlas; uniform vec2 uGrid; uniform float uW; uniform float uSide; uniform float uTopRough; uniform float uSideRough;
        uniform vec3 uPaper; uniform float uSweep; uniform float uSweepAmp;
        varying vec3 vLocal; varying float vTop; varying vec4 vFx; varying vec3 vInk; varying float vCell; varying vec3 vWP;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float top = smoothstep(0.55, 0.95, vTop);
        diffuseColor.rgb *= mix(1.0 - uSide, 1.0, top);
        if (vFx.x > 0.5) { float s = step(0.5, fract((vWP.x - vWP.z) * 4.0)); diffuseColor.rgb *= mix(1.0, 0.8, s * top); }
        if (vTop > 0.97) {
          vec2 uv = vec2(vLocal.x / uW + 0.5, 0.5 - vLocal.z / uW);
          float cy = floor((vCell + 0.5) / uGrid.x);
          vec2 cell = vec2(vCell - cy * uGrid.x, cy);
          vec2 auv = vec2((cell.x + uv.x) / uGrid.x, 1.0 - (cell.y + 1.0 - uv.y) / uGrid.y);
          float ink = texture2D(uAtlas, auv).a;
          diffuseColor.rgb = mix(diffuseColor.rgb, vInk, ink * 0.94);
        }
        diffuseColor.rgb = mix(diffuseColor.rgb, uPaper, vFx.y * 0.66);
        diffuseColor.rgb += uSweepAmp * 0.16 * exp(-pow((vWP.x - uSweep) / 1.8, 2.0)) * top;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(uSideRough, uTopRough, smoothstep(0.55, 0.95, vTop));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * (vFx.z * 0.08 + vFx.w * 0.05);`);
  };
  const tiles = new THREE.InstancedMesh(geo, mat, N);
  tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tiles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  tiles.castShadow = true; tiles.receiveShadow = true;
  tiles.frustumCulled = false; // the shader moves vertices, so the CPU bounds are not exact
  scene.add(tiles);

  // invisible boxes of the true column size, for picking (the GPU stretch is unknown to raycasts)
  const pickGeo = new THREE.BoxGeometry(W, 1, W); pickGeo.translate(0, 0.5, 0);
  const pick = new THREE.InstancedMesh(pickGeo, new THREE.MeshBasicMaterial(), N);
  pick.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // ---- soft contact shadows (instanced gradient quads) + one soft ground shadow -------------------
  const shTex = softRectTexture();
  const shGeo = new THREE.PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
  const aShade = new THREE.InstancedBufferAttribute(new Float32Array(N).fill(1), 1);
  aShade.setUsage(THREE.DynamicDrawUsage);
  shGeo.setAttribute('aShade', aShade);
  const shMat = new THREE.MeshBasicMaterial({ color: TOK.shadow, map: shTex, transparent: true, opacity: TILE.shadowOpacity, depthWrite: false });
  shMat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aShade;\nvarying float vShade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShade = aShade;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vShade;')
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.a *= vShade;');
  };
  const shadows = new THREE.InstancedMesh(shGeo, shMat, N);
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadows.renderOrder = -1;
  shadows.frustumCulled = false;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: TOK.shadow, map: softRectTexture(256, 0.36, 0.14), transparent: true, opacity: 0.1, depthWrite: false }));
  ground.renderOrder = -2;
  scene.add(ground, shadows);

  // helix core (other shapes of the table)
  const core = new THREE.Mesh(new THREE.CylinderGeometry(HELIX_R - 0.6, HELIX_R - 0.6, 11.2, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: TOK.paperDeep, roughness: 0.9, side: THREE.DoubleSide }));
  scene.add(core);

  // selection outline (verdigris) at the base of the selected tile
  const sel = new THREE.Mesh(roundedOutline(W + 0.12, 0.1, 0.035), new THREE.MeshBasicMaterial({ color: TOK.verdigris, transparent: true, opacity: 0.9, depthWrite: false }));
  sel.renderOrder = -1;
  scene.add(sel);

  // ---- per-element pose, height and lift --------------------------------------------------------
  const cur = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0 }));
  const tgt = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0, ghost: false }));
  const from = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0 }));
  const lift = new Float32Array(N), liftTo = new Float32Array(N);
  let tween = null, initialised = false, hovered = 0, breathZ = 0, breathT = 0, scrubbing = false;
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), sv = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), col = new THREE.Color(), q0 = new THREE.Quaternion();
  const INK = new THREE.Color(TOK.ink), CARD = new THREE.Color(TOK.card), L_INK = luminance(TOK.ink), L_CARD = luminance(TOK.card);

  // ---- labels: family names on the table, the hovered tile's name, the "try" hint ---------------------
  const labels = new LabelLayer(document.getElementById('labels'));
  const regionLabels = REGIONS.map(r => ({ r, it: labels.add({ pos: new THREE.Vector3(r.x, 0.02, r.z), text: '', cls: `region ${r.anchor}`, priority: 5, anchor: r.anchor }) }));
  const pop = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'pop', priority: 100, anchor: 'bottom', dy: 8 });
  const hint = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'pop hint', priority: 90, anchor: 'bottom', dy: 8 });
  pop.priority = -1; hint.priority = -1;

  function heightFor(e) {
    if (state.flat) return H0;
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
    return H0 + Math.max(0, Math.min(1, f)) * (HMAX - H0);
  }
  const ranges = new Map();
  function rangeCache(k, log) { const id = k + log; if (!ranges.has(id)) ranges.set(id, propRange(k, log)); return ranges.get(id); }

  function computeTargets() {
    for (let i = 0; i < N; i++) {
      const e = els[i];
      layoutPose(e, state.layout, tgt[i]);
      const h = heightFor(e);
      tgt[i].ghost = h == null;
      const hh = h == null ? H0 : h;
      tgt[i].h = state.layout === 'helix' ? H0 + (hh - H0) * HELIX_H : hh;
    }
  }
  function writeInstances() {
    for (let i = 0; i < N; i++) {
      const c = cur[i];
      m4.compose(c.pos, c.quat, sc);
      tiles.setMatrixAt(i, m4);
      aH.setX(i, c.h); aLift.setX(i, lift[i]);
      // picking box: true height and lift
      v3.set(0, lift[i], 0).applyQuaternion(c.quat).add(c.pos);
      m4.compose(v3, c.quat, sv.set(1, c.h, 1));
      pick.setMatrixAt(i, m4);
      // contact shadow on the paper (flat layouts only), fading as the tile lifts
      if (state.layout === 'helix') { m4.makeScale(0, 0, 0); aShade.setX(i, 0); }
      else {
        const s = W * (1.46 + lift[i] * 1.2);
        m4.compose(v3.set(c.pos.x + 0.05, 0.003, c.pos.z + 0.07), q0, sv.set(s, 1, s));
        aShade.setX(i, Math.max(0, 1 - lift[i] * 2.2));
      }
      shadows.setMatrixAt(i, m4);
    }
    tiles.instanceMatrix.needsUpdate = true; pick.instanceMatrix.needsUpdate = true; shadows.instanceMatrix.needsUpdate = true;
    aH.needsUpdate = true; aLift.needsUpdate = true; aShade.needsUpdate = true;
    pick.computeBoundingSphere();
    placeSelection();
  }
  function writeColours() {
    const pal = state.cb ? pigmentCB : pigment;
    const selZ = state.hideSel ? 0 : state.Z;
    for (let i = 0; i < N; i++) {
      const e = els[i];
      const st = state.color === 'state' ? stateAt(e, state.T) : null;
      const hex = st ? stateColor[st.s] : pal[e.f.cat[0]];
      col.set(hex);
      tiles.setColorAt(i, col);
      // printed symbol: dark ink, unless light text has more contrast on this glaze (e.g. "liquid" blue)
      const L = luminance(hex);
      const inkC = (L + 0.05) / (L_INK + 0.05) >= (L_CARD + 0.05) / (L + 0.05) ? INK : CARD;
      aInk.setXYZ(i, inkC.r, inkC.g, inkC.b);
      const v = propValue(e, state.prop);
      const hatch = (!state.flat && v && isPred(v)) || (st && st.p) ? 1 : 0;
      const dim = matchesFilters(e) ? (tgt[i].ghost && !state.flat ? 0.55 : 0) : 1;
      aFx.setXYZW(i, hatch, dim, hovered === e.Z ? 1 : 0, e.Z === selZ ? 1 : 0);
    }
    tiles.instanceColor.needsUpdate = true; aFx.needsUpdate = true; aInk.needsUpdate = true;
    // family names on the table: home layout, families lens only; phones show the ones that fit
    const phone = !!(hooks.isPhone && hooks.isPhone());
    for (const { r, it } of regionLabels) {
      labels.setText(it, t('fam.' + r.cat));
      const show = state.layout === 's18' && state.color === 'cat' && state.flat && (!phone || r.phone !== false);
      it.priority = show ? r.priority : -1;
      const at = phone && r.phonePos ? r.phonePos : [r.x, r.z];
      it.pos.set(at[0], 0.02, at[1]);
    }
  }
  function placeSelection() {
    const i = state.Z - 1, c = cur[i];
    sel.visible = !state.hideSel && state.layout !== 'helix';
    sel.position.set(c.pos.x, 0.004, c.pos.z);
  }
  function setLiftTargets() {
    for (let i = 0; i < N; i++) {
      const Z = i + 1;
      liftTo[i] = (Z === state.Z && !state.hideSel ? TILE.selectLift : 0) + (Z === hovered ? TILE.hoverLift : 0);
    }
    invalidate();
  }

  // ---- transitions --------------------------------------------------------------------------
  function morph() {
    computeTargets();
    const dur = state.reduced ? 0 : motion.lens / 1000;
    for (let i = 0; i < N; i++) { from[i].pos.copy(cur[i].pos); from[i].quat.copy(cur[i].quat); from[i].h = cur[i].h; }
    layoutDecor();
    if (!dur || !initialised) {
      for (let i = 0; i < N; i++) { cur[i].pos.copy(tgt[i].pos); cur[i].quat.copy(tgt[i].quat); cur[i].h = tgt[i].h; }
      writeInstances(); invalidate(); initialised = true; return;
    }
    if (tween) tween();
    let k = 0;
    const stag = motion.lensStagger / motion.lens;
    tween = animate(dt => {
      k = Math.min(1, k + dt / dur);
      for (let i = 0; i < N; i++) {
        const d0 = Math.min(1, Math.max(0, (k - (i / N) * stag) / (1 - stag)));
        const d = d0 < 0.5 ? 4 * d0 ** 3 : 1 - (-2 * d0 + 2) ** 3 / 2;
        cur[i].pos.lerpVectors(from[i].pos, tgt[i].pos, d);
        cur[i].quat.slerpQuaternions(from[i].quat, tgt[i].quat, d);
        cur[i].h = from[i].h + (tgt[i].h - from[i].h) * d;
      }
      writeInstances();
      if (k >= 1) { tween = null; return false; }
      return true;
    });
  }
  function layoutDecor() {
    const flat = state.layout !== 'helix';
    ground.visible = flat; core.visible = !flat;
    if (flat) {
      const w = state.layout === 's32' ? 36 : 22, d = state.layout === 's32' ? 11 : 14;
      ground.scale.set(w, 1, d);
      ground.position.set(0.3, 0.001, state.layout === 's32' ? 0.3 : 0.5);
    }
  }

  // ---- camera ------------------------------------------------------------------------------------
  let overview = null;
  function frame(dur = motion.glide) {
    const fov = freeFov();
    const portrait = fov.aspect < 0.8;
    if (state.layout === 'helix') {
      const r = Math.max(10.5 / Math.tan(Math.min(fov.v, fov.h) / 2), 18);
      E.rig.lim = { rMin: 6, rMax: 120, phiMin: 0.2, phiMax: Math.PI - 0.2 };
      overview = { target: new THREE.Vector3(0, 0.2, 0), r, theta: 0.35, phi: 1.12 };
      E.rig.flyTo(overview, state.reduced ? 0 : dur);
      return;
    }
    const s32 = state.layout === 's32';
    const halfW = s32 ? 17.4 : 9.9, halfD = s32 ? 4.4 : 5.3;
    const tall = !state.flat ? HMAX * 0.5 : 0;
    // flat tiles: a low, museum-like angle; columns: look more from above so front rows hide less
    const phi = portrait ? 0.36 : s32 ? 0.62 : state.flat ? 0.78 : 0.56;
    const rW = halfW / Math.tan(fov.h / 2);
    const rD = (halfD * Math.cos(phi) + (tall + 0.4) * Math.sin(phi)) / Math.tan(fov.v / 2) + halfD * Math.sin(phi);
    const r = Math.max(rW, rD) * 1.03;
    E.rig.lim = { rMin: 6.5, rMax: 140, phiMin: 0.08, phiMax: 1.35 };
    overview = { target: new THREE.Vector3(0, tall * 0.35, s32 ? 0.1 : 0.15), r, theta: 0, phi };
    E.rig.flyTo(overview, state.reduced ? 0 : dur);
  }
  /** Glide to an element so it sits in the middle of the free area (beside the card). */
  function focus(Z, dur = motion.glide) {
    const c = cur[Z - 1];
    const top = new THREE.Vector3(0, c.h + TILE.selectLift, 0).applyQuaternion(c.quat).add(c.pos);
    if (!overview) frame(0);
    if (state.layout === 'helix') { E.rig.flyTo({ target: top, r: Math.min(E.rig.r, 12) }, state.reduced ? 0 : dur); return; }
    const phone = hooks.isPhone && hooks.isPhone();
    if (phone) { frame(dur); return; } // phones keep the whole table in view above the sheet
    const r = Math.max(7.5, overview.r * 0.7);
    E.rig.flyTo({ target: top, r, theta: overview.theta + (c.pos.x / 9) * 0.1, phi: Math.min(overview.phi, 0.86) }, state.reduced ? 0 : dur);
  }

  // ---- picking / hover / phone scrub ------------------------------------------------------------
  function pickAt(x, y) {
    const hits = raycastFrom(x, y, [pick]);
    for (const hgt of hits) if (hgt.instanceId != null) return els[hgt.instanceId];
    return null;
  }
  function setHover(Z) {
    if (Z === hovered) return;
    hovered = Z;
    setLiftTargets(); writeColours();
    // phones show the loupe instead; the open card already names the selected element
    if (!Z || scrubbing || (state.card && !state.hideSel && Z === state.Z)) { pop.priority = -1; return; }
    const e = els[Z - 1];
    labels.setText(pop, name(e), `${e.sym} · ${t('card.number', { Z: e.Z })}`);
    pop.priority = 100;
  }
  const scrub = {
    start(x, y) { scrubbing = true; const e = pickAt(x, y); setHover(e ? e.Z : 0); if (hooks.loupe) hooks.loupe(e, x, y); },
    move(x, y) { const e = pickAt(x, y); setHover(e ? e.Z : 0); if (hooks.loupe) hooks.loupe(e, x, y); },
    end(x, y, cancelled) {
      scrubbing = false;
      const e = cancelled ? null : pickAt(x, y);
      setHover(0); if (hooks.loupe) hooks.loupe(null);
      if (e) hooks.onSelect(e);
    },
    cancel() { scrubbing = false; setHover(0); if (hooks.loupe) hooks.loupe(null); },
  };

  // ---- the "try" hint and the intro sweep ---------------------------------------------------------
  function showHint(Z, text) {
    if (!Z) { hint.priority = -1; invalidate(); return; }
    labels.setText(hint, text);
    hint.data = Z; hint.priority = 90; invalidate();
  }
  let sweepT = -1;
  function introSweep() {
    if (state.reduced) return;
    sweepT = 0;
    invalidate();
  }

  const view = {
    scene,
    init() { computeTargets(); morph(); writeColours(); },
    enter() {
      labels.enabled = true;
      key.castShadow = tierConfig().shadows;
      frame(state.reduced ? 0 : 0.8);
      E.rig.parallaxOn = !hooks.isPhone || !hooks.isPhone();
      E.rig.scrub = hooks.isPhone && hooks.isPhone() ? scrub : null;
      writeColours(); setLiftTargets(); invalidate();
    },
    exit() { labels.enabled = false; labels.hideAll(); E.rig.parallaxOn = false; E.rig.scrub = null; E.rig.parallax(0, 0, 0); setHover(0); },
    onTier(tier, cfg) { key.castShadow = cfg.shadows; atlas.tex.anisotropy = aniso(tier); atlas.tex.needsUpdate = true; mat.needsUpdate = true; invalidate(); },
    resize() {
      if (!view.ready) return;
      E.rig.scrub = hooks.isPhone && hooks.isPhone() && E.active === view ? scrub : null;
      E.rig.parallaxOn = (!hooks.isPhone || !hooks.isPhone()) && E.active === view;
      writeColours();
      if (state.card && !state.hideSel) focus(state.Z, 0); else frame(0);
    },
    update(dt) {
      let busy = false;
      // lifts ease toward their targets (hover 160 ms feel, selection a little slower)
      const k = 1 - Math.exp(-dt / 0.07);
      let moved = false;
      for (let i = 0; i < N; i++) {
        let goal = liftTo[i];
        if (breathZ === i + 1) goal += 0.05 * (0.5 - 0.5 * Math.cos((breathT * Math.PI * 2) / 2.6));
        const d = goal - lift[i];
        if (Math.abs(d) > 1e-4) { lift[i] += d * k; moved = true; }
      }
      if (breathZ) { breathT += dt; busy = true; }
      if (sweepT >= 0) {
        sweepT += dt;
        const p = Math.min(1, sweepT / 1.3);
        uni.uSweep.value = -12 + 24 * p;
        uni.uSweepAmp.value = Math.sin(Math.PI * p);
        if (p >= 1) { sweepT = -1; uni.uSweepAmp.value = 0; }
        busy = true;
      }
      if (moved) { writeInstances(); busy = true; }
      return busy;
    },
    afterRender() {
      if (hovered) { const c = cur[hovered - 1]; pop.pos.set(0, c.h + lift[hovered - 1], 0).applyQuaternion(c.quat).add(c.pos); }
      if (hint.priority >= 0 && hint.data) { const i = hint.data - 1, c = cur[i]; hint.pos.set(0, c.h + lift[i], 0).applyQuaternion(c.quat).add(c.pos); }
      labels.update();
    },
    onState(ch) {
      if ('layout' in ch) { morph(); frame(); writeColours(); }
      else if ('prop' in ch || 'log' in ch || 'flat' in ch) { morph(); writeColours(); if (!state.card) frame(); }
      if (['Z', 'color', 'T', 'filters', 'cb', 'lang', 'marks', 'hideSel'].some(x => x in ch)) { writeColours(); setLiftTargets(); placeSelection(); }
      if (['Z', 'card', 'hideSel'].some(x => x in ch) && hovered) { const z = hovered; hovered = 0; setHover(z); } // re-decide the hover label
      invalidate();
    },
    tap(x, y) {
      const e = pickAt(x, y);
      if (e) hooks.onSelect(e); else if (hooks.onEmpty) hooks.onEmpty();
    },
    hover(x, y) {
      if (x != null && E.rig.parallaxOn) E.rig.parallax(x / window.innerWidth - 0.5, y / window.innerHeight - 0.5, (motion.parallaxMaxDeg * Math.PI) / 180);
      const e = x == null ? null : pickAt(x, y);
      E.canvas.style.cursor = e ? 'pointer' : '';
      setHover(e ? e.Z : 0);
      invalidate();
    },
    focus, frame, introSweep, showHint,
    setBreath(Z) { breathZ = Z || 0; breathT = 0; invalidate(); },
    columnTop(Z) { const c = cur[Z - 1]; return new THREE.Vector3(0, c.h + lift[Z - 1], 0).applyQuaternion(c.quat).add(c.pos); },
    screenOf(Z) { return toScreen(view.columnTop(Z)); },
    pickAt,
  };
  return view;
}
