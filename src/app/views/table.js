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
import { t, fmtNum, oneLine } from '../i18n.js';
import { pigment, pigmentCB, stateColor, color as TOK, light as LIGHT, tile as TILE, motion, font } from '../../design/tokens.js';
import { roundedBox, symbolAtlas, roundedOutline, luminance, bakeContactShadows, GLAZE } from './tableArt.js';
import { REGIONS } from './tableRegions.js';

const W = TILE.width, H0 = TILE.thickness, HMAX = 3.0; // tallest column: lower = fewer rows hidden behind it
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
  // the glaze reflects a soft studio (glazeStudio in the tile shader), so bevels catch light and the
  // far tops shine like glazed ware rather than matte plastic

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
  // instance slot of each element: front rows are drawn first, so tiles hidden behind them cost no shading
  const slotOf = Int32Array.from(els, (_, i) => i);
  const aFx = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); // hatch, dim, hover, selected
  const aInk = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  for (const [k, a] of Object.entries({ aH, aLift, aCell, aFx, aInk })) { a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, a); }
  const uni = {
    uAtlas: { value: atlas.tex }, uGrid: { value: new THREE.Vector2(atlas.cols, atlas.rows) }, uH0: { value: H0 }, uW: { value: W },
    uSide: { value: TILE.sideDarken }, uTopRough: { value: TILE.topRoughness }, uSideRough: { value: TILE.sideRoughness },
    uPaper: { value: new THREE.Color(TOK.paper) }, uSweep: { value: -99 }, uSweepAmp: { value: 0 }, uJitter: { value: TILE.tintJitter }, uHatch: { value: 0.8 }, uHatchF: { value: 4 }, uGlaze: { value: TILE.glaze }, uFloorAO: { value: 1 },
  };
  const mat = new THREE.MeshStandardMaterial({ roughness: TILE.sideRoughness, metalness: 0 });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aH; attribute float aLift; attribute float aCell; attribute vec4 aFx; attribute vec3 aInk;
        uniform float uH0;
        varying vec3 vLocal; varying float vTop; varying vec4 vFx; varying vec3 vInk; varying float vCell; varying vec3 vWP; varying float vH;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLocal = position; vTop = normal.y; vFx = aFx; vInk = aInk; vCell = aCell; vH = aH;
        if (position.y > uH0 * 0.5) transformed.y += max(aH - uH0, 0.0);
        transformed.y += aLift;
        vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uAtlas; uniform vec2 uGrid; uniform float uW; uniform float uSide; uniform float uTopRough; uniform float uSideRough;
        uniform vec3 uPaper; uniform float uSweep; uniform float uSweepAmp; uniform float uJitter; uniform float uHatch; uniform float uHatchF; uniform float uGlaze; uniform float uFloorAO;
        ${GLAZE}
        varying vec3 vLocal; varying float vTop; varying vec4 vFx; varying vec3 vInk; varying float vCell; varying vec3 vWP; varying float vH;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float top = smoothstep(0.55, 0.95, vTop);
        // each tile a touch different, like handmade ware
        diffuseColor.rgb *= 1.0 + (fract(sin(vCell * 12.9898 + 4.1) * 43758.5453) - 0.5) * uJitter;
        diffuseColor.rgb *= mix(1.0 - uSide, 1.0, top);
        // a little occlusion where a resting tile meets the paper (fades as it lifts)
        diffuseColor.rgb *= mix(1.0 - 0.2 * uFloorAO * (1.0 - smoothstep(0.0, 0.16, vWP.y)), 1.0, top);
        // tall columns: the walls darken gently toward the base, like a carved block
        diffuseColor.rgb *= mix(1.0, mix(0.78, 1.0, smoothstep(0.0, vH * 0.85, vWP.y)), (1.0 - top) * step(1.0, vH) * uFloorAO);
        // predicted values: stripes on every face of the column, not only its small top
        if (vFx.x > 0.5) { float s = step(0.5, fract((vWP.x - vWP.z + vWP.y * 0.7) * uHatchF)); diffuseColor.rgb *= mix(1.0, uHatch, s * mix(0.8, 1.0, top)); }
        // unknown values: the glaze fades toward the paper, the ink stays readable (ink-2, >= 4.5:1)
        diffuseColor.rgb = mix(diffuseColor.rgb, uPaper, vFx.y * 0.66);
        if (vTop > 0.97) {
          vec2 uv = vec2(vLocal.x / uW + 0.5, 0.5 - vLocal.z / uW);
          float cy = floor((vCell + 0.5) / uGrid.x);
          vec2 cell = vec2(vCell - cy * uGrid.x, cy);
          vec2 auv = vec2((cell.x + uv.x) / uGrid.x, 1.0 - (cell.y + 1.0 - uv.y) / uGrid.y);
          float ink = texture2D(uAtlas, auv).a;
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vInk, vec3(0.095, 0.085, 0.07), step(0.01, vFx.y) * 0.5), ink * 0.94 * (1.0 - 0.6 * step(0.99, vFx.y)));
        }
        diffuseColor.rgb += uSweepAmp * 0.16 * exp(-pow((vWP.x - uSweep) / 1.8, 2.0)) * top;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(uSideRough, uTopRough, smoothstep(0.55, 0.95, vTop));`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectSpecular += uGlaze * glazeStudio(inverseTransformDirection(normal, viewMatrix), inverseTransformDirection(geometryViewDir, viewMatrix), material.roughness);`)
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

  // ---- soft contact shadows, baked into one texture under the table (one blended layer, no seams) -----
  const shade = bakeContactShadows({ W, color: TOK.shadow, opacity: TILE.shadowOpacity });
  scene.add(shade.mesh);
  let shadeSig = '';
  /** Re-bake when the layout or the lifted (selected) tile changes; tiles at their target places. */
  function bakeShade() {
    if (state.layout === 'helix') { shadeSig = 'helix'; shade.setFade(0); return; }
    const up = state.hideSel ? 0 : state.Z;
    const sig = `${state.layout}|${up}`;
    if (sig === shadeSig) return;
    shadeSig = sig;
    shade.bake(tgt.map((x, i) => ({ x: x.pos.x, z: x.pos.z, up: i + 1 === up ? TILE.selectLift : 0 })));
  }

  // helix core (other shapes of the table)
  const core = new THREE.Mesh(new THREE.CylinderGeometry(HELIX_R - 0.6, HELIX_R - 0.6, 11.2, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: TOK.paperDeep, roughness: 0.9, side: THREE.DoubleSide }));
  scene.add(core);

  // selection outline (verdigris) at the base of the selected tile
  // it rings the lifted tile's top edge (a floor ring under a lifted tile read as a stray wireframe)
  const ringGeo = roundedOutline(W + 0.05, 0.09, 0.04);
  const sel = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: TOK.verdigris, transparent: true, opacity: 0.95, depthWrite: false }));
  const scrubRing = new THREE.Mesh(ringGeo, sel.material); // the tile under a scrubbing thumb (phones)
  scene.add(sel, scrubRing);

  // ---- per-element pose, height and lift --------------------------------------------------------
  const cur = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0 }));
  const tgt = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0, ghost: false }));
  const from = els.map(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), h: H0 }));
  const lift = new Float32Array(N), liftTo = new Float32Array(N), liftV = new Float32Array(N);
  let tween = null, initialised = false, hovered = 0, breathZ = 0, breathT = 0, scrubbing = false;
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), sv = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
  const INK = new THREE.Color(TOK.ink), CARD = new THREE.Color(TOK.card), L_INK = luminance(TOK.ink), L_CARD = luminance(TOK.card);

  // ---- labels: family names on the table, the hovered tile's name, the "try" hint ---------------------
  const labels = new LabelLayer(document.getElementById('labels'));
  const regionLabels = REGIONS.map(r => ({ r, it: labels.add({ pos: new THREE.Vector3(r.x, 0.02, r.z), text: '', cls: `region ${r.anchor}`, priority: 5, anchor: r.anchor }) }));
  // the hovered tile's name and the "try" tag hang above the tile's back edge (never over its number)
  const pop = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'pop', priority: 100, anchor: 'bottom', dy: 6 });
  const hint = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'pop hint', priority: 90, anchor: 'bottom', dy: 6 });
  pop.priority = -1; hint.priority = -1;
  // melting-point lens: elements that never melt at 1 atm stand at the temperature where they turn
  // straight into gas, and say so
  // (the caption names them all; only the tallest gets a tag, so tags never cover the columns)
  const SUBLIME = els.filter(e => e.ph.sub && !propValue(e, 'mp'));
  // helium never freezes at 1 atm: its flat tile says so instead of passing for "not measured"
  const subTags = [...SUBLIME.filter(e => e.ph.sub[0] === Math.max(...SUBLIME.map(x => x.ph.sub[0]))), ...els.filter(e => e.ph.noSolid)]
    .map(e => ({ e, it: labels.add({ pos: new THREE.Vector3(), text: '', cls: e.ph.noSolid ? 'pop note left' : 'pop note right', priority: -1, anchor: e.ph.noSolid ? 'bottomleft' : 'bottomright', dy: 6 }) }));
  const backTop = (i, out) => out.set(0, cur[i].h + lift[i], -W / 2).applyQuaternion(cur[i].quat).add(cur[i].pos);

  function heightFor(e) {
    if (state.flat) return H0;
    const v = propValue(e, state.prop) || (state.prop === 'mp' && !state.log && e.ph.sub && SUBLIME.includes(e) ? e.ph.sub : null);
    if (!v) return null;
    const p = prop(state.prop);
    const log = state.log;
    const { lo, hi } = rangeCache(state.prop, log);
    const x = v[0];
    let f;
    if (log) { if (!(x > 0)) return null; f = (Math.log10(x) - Math.log10(lo)) / Math.max(1e-9, Math.log10(hi) - Math.log10(lo)); }
    else if (p.key === 'year') f = (x - lo) / Math.max(1e-9, hi - lo);
    else { const base = Math.min(0, lo); f = (x - base) / Math.max(1e-9, hi - base); }
    // phones see columns from lower down, so they stand taller there to read as heights
    const hm = hooks.isPhone && hooks.isPhone() ? 2.6 : HMAX;
    return H0 + Math.max(0, Math.min(1, f)) * (hm - H0);
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
    orderSlots();
  }
  /** Front rows first (the camera looks from +z), then outward from the middle. */
  function orderSlots() {
    if (state.layout === 'helix') return;
    const idx = els.map((_, i) => i).sort((a, b) => tgt[b].pos.z - tgt[a].pos.z || Math.abs(tgt[a].pos.x) - Math.abs(tgt[b].pos.x));
    idx.forEach((i, k) => { slotOf[i] = k; aCell.setX(k, i); });
    aCell.needsUpdate = true;
  }
  function writeInstances() {
    for (let i = 0; i < N; i++) {
      const c = cur[i], k = slotOf[i];
      m4.compose(c.pos, c.quat, sc);
      tiles.setMatrixAt(k, m4);
      aH.setX(k, c.h); aLift.setX(k, lift[i]);
      // picking box: true height and lift (indexed by element)
      v3.set(0, lift[i], 0).applyQuaternion(c.quat).add(c.pos);
      m4.compose(v3, c.quat, sv.set(1, c.h, 1));
      pick.setMatrixAt(i, m4);
    }
    tiles.instanceMatrix.needsUpdate = true; pick.instanceMatrix.needsUpdate = true;
    aH.needsUpdate = true; aLift.needsUpdate = true;
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
      const k = slotOf[i];
      tiles.setColorAt(k, col);
      // printed symbol: dark ink, unless light text has more contrast on this glaze (e.g. "liquid" blue)
      const L = luminance(hex);
      const inkC = (L + 0.05) / (L_INK + 0.05) >= (L_CARD + 0.05) / (L + 0.05) ? INK : CARD;
      aInk.setXYZ(k, inkC.r, inkC.g, inkC.b);
      const v = propValue(e, state.prop);
      const hatch = (!state.flat && v && isPred(v)) || (st && st.p) ? 1 : 0;
      // predicted columns are a little ghosted too, so a guess never stands like a measured monolith
      const dim = matchesFilters(e) ? (tgt[i].ghost && !state.flat ? 0.55 : !state.flat && v && isPred(v) ? 0.3 : 0) : 1;
      aFx.setXYZW(k, hatch, dim, hovered === e.Z ? 1 : 0, e.Z === selZ ? 1 : 0);
    }
    // stripes: stronger in the heat map; on phones (tiles ~20 px) wider and softer so symbols stay legible
    const ph = !!(hooks.isPhone && hooks.isPhone());
    uni.uHatch.value = ph ? (state.color === 'state' ? 0.78 : 0.86) : state.color === 'state' ? 0.62 : 0.8;
    uni.uHatchF.value = ph ? 2.4 : 4;
    tiles.instanceColor.needsUpdate = true; aFx.needsUpdate = true; aInk.needsUpdate = true;
    // family names on the table: home layout, families lens only; phones show the ones that fit
    const phone = !!(hooks.isPhone && hooks.isPhone());
    for (const { r, it } of regionLabels) {
      labels.setText(it, r.oneLine ? oneLine(t('fam.' + r.cat)) : t('fam.' + r.cat));
      const show = state.layout === 's18' && state.color === 'cat' && state.flat && (!phone || r.phone !== false);
      it.priority = show ? r.priority : -1;
      const at = phone && r.phonePos ? r.phonePos : [r.x, r.z];
      it.pos.set(at[0], 0.02, at[1]);
    }
  }
  function placeSelection() {
    const flat = state.layout !== 'helix';
    const ring = (m, i, on) => { m.visible = on && flat; if (on && flat) { const c = cur[i]; m.position.set(c.pos.x, c.h + lift[i] + 0.004, c.pos.z); } };
    ring(sel, state.Z - 1, !state.hideSel && !diving); // the ring steps aside for the plunge into the tile
    ring(scrubRing, Math.max(0, hovered - 1), scrubbing && hovered > 0 && (state.hideSel || hovered !== state.Z));
  }
  function setLiftTargets() {
    for (let i = 0; i < N; i++) {
      const Z = i + 1;
      liftTo[i] = (Z === state.Z && !state.hideSel ? TILE.selectLift : 0) + (Z === hovered ? (scrubbing ? TILE.selectLift * 0.85 : TILE.hoverLift) : 0);
    }
    invalidate();
  }

  // ---- transitions --------------------------------------------------------------------------
  function morph() {
    computeTargets();
    const dur = state.reduced ? 0 : motion.lens / 1000;
    for (let i = 0; i < N; i++) { from[i].pos.copy(cur[i].pos); from[i].quat.copy(cur[i].quat); from[i].h = cur[i].h; }
    layoutDecor();
    // contact shadows stay put while tiles only change height; when the tiles travel (new shape), the
    // shadows leave with them and come back, re-baked, once everything has landed
    const travel = shadeSig.split('|')[0] !== state.layout;
    if (!dur || !initialised || !travel) { bakeShade(); if (state.layout !== 'helix') shade.setFade(1); }
    else shade.setFade(0);
    if (!dur || !initialised) {
      for (let i = 0; i < N; i++) { cur[i].pos.copy(tgt[i].pos); cur[i].quat.copy(tgt[i].quat); cur[i].h = tgt[i].h; }
      writeInstances(); invalidate(); initialised = true; return;
    }
    if (tween) tween();
    let k = 0;
    const stag = motion.lensStagger / motion.lens;
    const landed = () => {
      bakeShade();
      if (state.layout === 'helix') return;
      let f = 0;
      animate(dt2 => { f = Math.min(1, f + dt2 / 0.3); shade.setFade(f); return f < 1; });
    };
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
      if (k >= 1) { tween = null; if (travel) landed(); return false; }
      return true;
    });
  }
  function layoutDecor() { core.visible = state.layout === 'helix'; }

  // ---- camera ------------------------------------------------------------------------------------
  let overview = null;
  // dur 0 while a glide is under way (e.g. the card sheet settling and changing the free area) moves
  // the glide's goal instead of jumping, so the glide still lands smoothly
  const fly = (goal, dur) => (dur > 0 ? E.rig.flyTo(goal, dur) : E.rig.retarget(goal));
  function frame(dur = motion.glide, keepCamera = false, whole = false) {
    const fov = freeFov();
    const portrait = fov.aspect < 0.8;
    if (state.layout === 'helix') {
      const r = Math.max(10.5 / Math.tan(Math.min(fov.v, fov.h) / 2), 18);
      E.rig.lim = { rMin: 6, rMax: 120, phiMin: 0.2, phiMax: Math.PI - 0.2 };
      overview = { target: new THREE.Vector3(0, 0.2, 0), r, theta: 0.35, phi: 1.12 };
      if (!keepCamera) fly(overview, state.reduced ? 0 : dur);
      return;
    }
    const s32 = state.layout === 's32';
    const halfW = s32 ? 17.4 : portrait ? 9.4 : 9.9, halfD = s32 ? 4.4 : 5.3;
    const tall = !state.flat ? HMAX * 0.5 : 0;
    // flat tiles: a low, museum-like angle (phones: enough to see the tiles' glazed fronts);
    // columns: look more from above so the tall ones hide less of the rows behind them
    const phi = portrait ? (state.flat ? 0.5 : 0.45) : s32 ? 0.62 : state.flat ? 0.78 : 0.33;
    const rW = halfW / Math.tan(fov.h / 2);
    const rD = (halfD * Math.cos(phi) + (tall + 0.4) * Math.sin(phi)) / Math.tan(fov.v / 2) + halfD * Math.sin(phi);
    const r = Math.max(rW, rD) * 1.03;
    E.rig.lim = { rMin: 6.5, rMax: 140, phiMin: 0.08, phiMax: 1.35 };
    overview = { target: new THREE.Vector3(0, tall * 0.35, s32 ? 0.1 : 0.15), r, theta: 0, phi };
    E.homeR = r; // the engine lowers a software renderer's resolution early when the camera gets much closer
    if (whole) band = false;
    if (!keepCamera) {
      const goal = !s32 && band && phoneNow() && window.innerHeight > window.innerWidth ? bandGoal(fov, phi, tall, rD) : overview;
      fly(goal, state.reduced ? 0 : dur);
      if (goal !== overview) panCue(state.reduced ? 0 : dur);
    }
  }
  // portrait phones (F4): all 18 columns squeezed to the width made a thin strip of ~20 px tiles between bands
  // of empty paper. The landing fills the free height instead, about ten columns across (tiles ~37 px, easy
  // to read and to tap), from the left edge as a page is read; a one-finger drag pans along the rows, and
  // "⌂ Whole table" shows all 18 columns (where the thumb's loupe takes over). After a card, the band
  // comes back where the camera was.
  let band = true, bandFresh = true;
  const phoneNow = () => !!(hooks.isPhone && hooks.isPhone());
  const bandMaxX = r => Math.max(0, 9.4 - r * Math.tan(freeFov().h / 2));
  function bandGoal(fov, phi, tall, rD) {
    const r = Math.max(rD * 1.03, 5.2 / Math.tan(fov.h / 2)), m = bandMaxX(r);
    const x = bandFresh ? -m : THREE.MathUtils.clamp(E.rig.target.x, -m, m);
    if (bandFresh) cueDue = true;
    bandFresh = false;
    return { target: new THREE.Vector3(x, tall * 0.35, 0.15), r, theta: 0, phi };
  }
  // the band's pan cue (pass 4): a soft paper fade at each screen edge with more table beyond it, and on a
  // phone's first landing one slow look along the rows and back (once per device; never with reduced motion,
  // never once the reader is already moving, and not in automated screenshot runs, which must be repeatable)
  let cueDue = false, edgeL = false, edgeR = false;
  function panCue(dur) {
    if (!cueDue) return;
    cueDue = false;
    let seen = true;
    try { seen = localStorage.getItem('pt.panCue') === '1'; } catch { /* storage off: skip */ }
    if (seen || state.reduced || navigator.webdriver) return;
    setTimeout(() => { // measured when it plays: the landing has settled into the measured chrome by then
      const m = bandMaxX(E.rig.r), x = E.rig.target.x;
      if (E.active !== view || state.card || E.rig.tween || E.rig.moving || !(E.rig.touchPan && E.rig.touchPan()) || m < 0.5) return;
      try { localStorage.setItem('pt.panCue', '1'); } catch { /* fine */ }
      // two soft flicks of the rig's own inertia, as a finger would (a view re-frame cannot cut them short):
      // about one column the way there is more table, then back to where the reader landed
      const s = x + 1.2 <= m ? 1 : -1, flick = d => { E.rig.v.px = d * 1.2 * E.rig.damping; invalidate(); };
      flick(s);
      setTimeout(() => { if (E.active === view && !state.card && !E.rig.tween && !E.rig.pointers.size) flick(-s); }, 1100);
    }, dur * 1000 + 1400);
  }
  function edges() {
    const on = E.active === view && phoneNow() && !state.card && state.layout !== 'helix';
    const m = on ? bandMaxX(E.rig.r) : 0, x = E.rig.target.x;
    const l = m > 0.3 && x > -m + 0.3, r = m > 0.3 && x < m - 0.3;
    if (l !== edgeL) document.body.classList.toggle('pan-l', (edgeL = l));
    if (r !== edgeR) document.body.classList.toggle('pan-r', (edgeR = r));
  }
  /** Has the user zoomed or turned the table away from its home framing? (shows "Whole table") */
  let away = false, diving = false;
  function checkAway() {
    const o = overview, rg = E.rig;
    const now = !!o && !state.card && state.view === 'table' && !rg.tween &&
      (rg.r < o.r * 0.8 || rg.r > o.r * 1.4 || rg.target.distanceTo(o.target) > 2 || Math.abs(rg.theta - o.theta) > 0.3 || Math.abs(rg.phi - o.phi) > 0.25);
    if (now !== away) { away = now; if (hooks.onAway) hooks.onAway(away); }
  }
  /** Glide to an element so it sits in the middle of the free area (beside the card). */
  function focus(Z, dur = motion.glide) {
    const c = cur[Z - 1];
    const top = new THREE.Vector3(0, c.h + TILE.selectLift, 0).applyQuaternion(c.quat).add(c.pos);
    if (!overview) frame(0);
    if (state.layout === 'helix') { fly({ target: top, r: Math.min(E.rig.r, 12) }, state.reduced ? 0 : dur); return; }
    const phone = hooks.isPhone && hooks.isPhone();
    if (phone) {
      // the payoff on phones too: glide in above the sheet until about five tiles fill the width,
      // angled so the lifted tile reads as an object with its neighbours around it
      const r = THREE.MathUtils.clamp(2.7 / Math.tan(freeFov().h / 2), 8, 30);
      fly({ target: top, r, theta: (c.pos.x / 9) * 0.16, phi: 0.66 }, state.reduced ? 0 : dur);
      return;
    }
    const r = Math.max(7.5, overview.r * 0.7);
    fly({ target: top, r, theta: overview.theta + (c.pos.x / 9) * 0.1, phi: Math.min(overview.phi, 0.86) }, state.reduced ? 0 : dur);
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
    if (Z && hooks.onHoverTile) hooks.onHoverTile(); // the first hover dismisses "Try iron"
    setLiftTargets(); writeColours();
    // phones show the loupe instead; the open card already names the selected element
    if (!Z || scrubbing || (state.card && !state.hideSel && Z === state.Z)) { pop.priority = -1; return; }
    const e = els[Z - 1];
    labels.setText(pop, name(e)); // one line: the symbol and number are already printed on the tile
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
  function placeSubTags() {
    const on = state.prop === 'mp' && !state.flat && !state.log && state.layout !== 'helix';
    for (const { e, it } of subTags) {
      labels.setText(it, e.ph.noSolid ? t('lens.mp.heTag', { name: name(e) }) : t('lens.mp.subTag', { name: name(e), T: `${fmtNum(e.ph.sub[0] - 273.15, 0)} °C` }));
      it.priority = on ? 60 - e.Z / 200 : -1;
    }
    invalidate();
  }
  let sweepT = -1;
  function introSweep() {
    if (state.reduced) return;
    sweepT = 0;
    invalidate();
  }

  const view = {
    scene,
    init() { computeTargets(); morph(); writeColours(); placeSubTags(); },
    enter() {
      diving = false;
      labels.enabled = true;
      band = bandFresh = true;
      // phones: while the tiles are big enough to tap, a drag pans (kept on the table); zoomed out, the loupe
      E.rig.touchPan = () => phoneNow() && !state.card && !!overview && E.rig.r < overview.r * 0.8;
      E.rig.bounds = (t, v) => {
        if (!phoneNow() || state.card || state.layout === 'helix') return;
        const m = bandMaxX(E.rig.r), x = THREE.MathUtils.clamp(t.x, -m, m);
        if (x !== t.x) { t.x = x; v.px = 0; }
        t.z = THREE.MathUtils.clamp(t.z, -5.5, 5.8);
      };
      key.castShadow = tierConfig().shadows;
      frame(state.reduced ? 0 : 0.8);
      E.rig.parallaxOn = !hooks.isPhone || !hooks.isPhone();
      E.rig.scrub = hooks.isPhone && hooks.isPhone() ? scrub : null;
      writeColours(); setLiftTargets(); invalidate();
    },
    exit() { E.rig.touchPan = E.rig.bounds = null; edgeL = edgeR = false; document.body.classList.remove('pan-l', 'pan-r'); labels.enabled = false; labels.hideAll(); E.rig.parallaxOn = false; E.rig.scrub = null; E.rig.parallax(0, 0, 0); setHover(0); },
    onTier(tier, cfg) { key.castShadow = cfg.shadows; atlas.tex.anisotropy = aniso(tier); atlas.tex.needsUpdate = true; mat.needsUpdate = true; invalidate(); },
    resize() {
      if (!view.ready) return;
      E.rig.scrub = hooks.isPhone && hooks.isPhone() && E.active === view ? scrub : null;
      E.rig.parallaxOn = (!hooks.isPhone || !hooks.isPhone()) && E.active === view;
      writeColours();
      // keep a camera the user has zoomed or turned (only the home framing is recomputed); never steer a dive
      if (diving) return;
      if (state.card && !state.hideSel) focus(state.Z, 0); else frame(0, away);
    },
    update(dt) {
      let busy = false;
      edges();
      // lifts are springs: a picked tile rises with a small overshoot and settles (like lifting a
      // piece from a tray); everything else (hover, landing, reduced motion) is critically damped
      let moved = false;
      const w = 2 * Math.PI * 3, steps = Math.ceil(Math.min(dt, 0.05) / 0.008), hh = Math.min(dt, 0.05) / steps;
      for (let i = 0; i < N; i++) {
        let goal = liftTo[i];
        if (breathZ === i + 1) goal += 0.05 * (0.5 - 0.5 * Math.cos((breathT * Math.PI * 2) / 2.6));
        if (Math.abs(goal - lift[i]) < 1e-4 && Math.abs(liftV[i]) < 1e-3) { if (lift[i] !== goal) { lift[i] = goal; liftV[i] = 0; moved = true; } continue; }
        const z = !state.reduced && goal >= TILE.selectLift * 0.5 && goal > lift[i] - 0.03 ? 0.6 : 1;
        for (let n = 0; n < steps; n++) { liftV[i] += (-w * w * (lift[i] - goal) - 2 * z * w * liftV[i]) * hh; lift[i] = Math.max(0, lift[i] + liftV[i] * hh); }
        moved = true;
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
      if (hovered) backTop(hovered - 1, pop.pos);
      if (hint.priority >= 0 && hint.data) backTop(hint.data - 1, hint.pos);
      for (const { e, it } of subTags) if (it.priority >= 0) backTop(e.Z - 1, it.pos);
      labels.update();
      checkAway();
    },
    onState(ch) {
      if (E.active !== view && Object.keys(ch).every(k => k === 'T')) return; // the forge's thermometer: nothing to do here (enter() repaints)
      if ('layout' in ch) { morph(); frame(); writeColours(); }
      else if ('prop' in ch || 'log' in ch || 'flat' in ch) { morph(); writeColours(); if (!state.card) frame(); }
      if (['Z', 'color', 'T', 'filters', 'cb', 'lang', 'marks', 'hideSel'].some(x => x in ch)) { writeColours(); setLiftTargets(); placeSelection(); }
      if (['Z', 'hideSel'].some(x => x in ch)) bakeShade();
      if (['prop', 'flat', 'layout', 'lang', 'log'].some(x => x in ch)) placeSubTags();
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
    /** The first half of the scale dive: straight down into the tile's glaze until it fills the screen.
     *  While diving, re-framing (the card closing changes the free area) must not steer the camera. */
    dive(Z, dur = 1.0, r = 0.75, phi = 0.06) {
      const i = Z - 1, c = cur[i];
      const top = new THREE.Vector3(0, c.h + lift[i], 0).applyQuaternion(c.quat).add(c.pos);
      diving = true; placeSelection();
      E.rig.lim = { ...E.rig.lim, rMin: 0.4, phiMin: 0.02 };
      E.rig.flyTo({ target: top, r, theta: E.rig.theta, phi }, dur);
    },
    setBreath(Z) { breathZ = Z || 0; breathT = 0; invalidate(); },
    columnTop(Z) { const c = cur[Z - 1]; return new THREE.Vector3(0, c.h + lift[Z - 1], 0).applyQuaternion(c.quat).add(c.pos); },
    screenOf(Z) { return toScreen(view.columnTop(Z)); },
    pickAt,
  };
  return view;
}
