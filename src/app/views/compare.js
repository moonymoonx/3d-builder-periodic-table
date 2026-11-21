// Side by side, the stage (STYLE.md §6: daylight is for matter). Three ways to set two specimens side by side:
//  • "A litre of each" (the default): one litre of each element as it is at 20 °C, on the pans of a porcelain
//    balance with an ink beam. A solid is a glazed block in its family glaze with its symbol printed in ink (a
//    giant version of its tile); a liquid is a glossy pool resting in the pan; a gas is a litre of clear glass
//    with a few atoms drifting in it; a predicted state is striped, as on the table. The beam tips toward the
//    heavier litre (more for bigger ratios, up to a stop). A weight our sources do not give: no balance, the
//    specimens stand on plain porcelain plinths. So gold beside mercury is a solid block beside a liquid pool,
//    and the beam drops hard toward osmium beside a litre of helium. (Scene units: centimetres.)
//  • "One atom of each": two glazed beads at their true relative size (covalent radius "when bonded", or van
//    der Waals "when touching"), with an ink scale bar; an unknown size is an empty dashed ring. (Picometres.)
//  • Carbon beside carbon: its two measured solid forms, graphite's sheets and diamond's network. (Picometres.)
// Every number comes from our data (comparePanel.js). Renders on demand; only drifting gas atoms keep frames coming.
import * as THREE from 'three';
import { E, invalidate, animate, freeFov } from '../engine.js';
import { state } from '../state.js';
import { byZ, name } from '../data.js';
import { t, fmtNum, getLang } from '../i18n.js';
import { LabelLayer } from '../labels.js';
import { pigment, pigmentCB, color as TOK, light as LIGHT, tile as TILE, motion, font } from '../../design/tokens.js';
import { GLAZE, softRectCanvas, roundedBox } from './tableArt.js';
import { glassMaterial } from './forgeArt.js';
import { supercell } from '../../physics/lattice.js';
import { rng32 } from '../../physics/orbitals.js';
import { radiusOf, twoForms, forms, specimenOf, balanceTilt, getStage, onStage, litreText } from '../ui/comparePanel.js';

export { radiusOf };
const gdptName = e => (getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt' ? e.names.viAlt[0].charAt(0).toUpperCase() + e.names.viAlt[0].slice(1) : name(e));
const NB = ' ';

/**
 * A softer studio for round things: the room, the long softbox and a broad window, but no small key softbox
 * (on a sphere it focuses into a hard white dot). Same inputs as the table's glazeStudio.
 */
const SOFT_STUDIO = `
  vec3 softStudio(vec3 n, vec3 v, float r) {
    vec3 R = reflect(-v, n);
    float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);
    vec3 room = mix(vec3(0.42, 0.39, 0.35), vec3(0.70, 0.66, 0.58), smoothstep(0.05, -0.3, R.y));
    float back = smoothstep(-0.05, 0.3, -R.z);
    float strip = (1.0 - smoothstep(0.08, 0.5, abs(R.y - 0.5))) * back;
    float win = smoothstep(0.35, 1.0, dot(R, normalize(vec3(-0.55, 0.6, 0.58))));
    return fres * (room + vec3(1.0, 0.97, 0.92) * (strip * 1.1 + win * 1.4));
  }`;
/**
 * The balance's studio: the room, a tall window front-left (on anything turned about a vertical axis, the column and
 * the pans' walls, it draws one crisp vertical catchlight, as on glazed ware) and the long softbox low behind (a sheen
 * along rims and the beam). Bright sources, so the catchlights still read on a pale glaze.
 */
const BALANCE_STUDIO = `
  vec3 balanceStudio(vec3 n, vec3 v, float r) {
    vec3 R = reflect(-v, n);
    float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);
    float soft = 0.05 + 0.45 * r;
    vec3 room = mix(vec3(0.70, 0.66, 0.58), vec3(0.42, 0.39, 0.35), smoothstep(-0.3, 0.05, R.y));
    vec2 az = normalize(R.xz + vec2(1e-5, 0.0));
    float win = smoothstep(1.0 - 0.012 - 0.2 * soft, 1.0, dot(az, normalize(vec2(-0.62, 0.78)))) * smoothstep(-0.3, 0.0, R.y) * (1.0 - smoothstep(0.55, 0.85, R.y));
    float strip = (1.0 - smoothstep(0.08, 0.08 + soft, abs(R.y - 0.5))) * smoothstep(-0.05, 0.3, -R.z);
    return fres * (room + vec3(1.0, 0.97, 0.92) * (win * 12.0 + strip * 2.2));
  }`;
function balanceGlaze({ color, roughness = 0.14, glaze = 1 }) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uGlaze = { value: glaze };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uGlaze;\n${BALANCE_STUDIO}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectSpecular += uGlaze * balanceStudio(inverseTransformDirection(normal, viewMatrix), inverseTransformDirection(geometryViewDir, viewMatrix), material.roughness);`);
  };
  return m;
}
/** Glazed porcelain for round shapes (atoms, balance parts): a broad, soft sheen, never a pin-point highlight. */
function softGlaze({ color = 0xffffff, roughness = 0.42, glaze = 0.7 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uGlaze = { value: glaze };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uGlaze;\n${SOFT_STUDIO}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectSpecular += uGlaze * softStudio(inverseTransformDirection(normal, viewMatrix), inverseTransformDirection(geometryViewDir, viewMatrix), material.roughness);`);
  };
  return m;
}
/**
 * A specimen's glaze, as on the table's tiles (their soft studio, sides a little darker than the top), with
 * stripes when the state is predicted and, on a solid block, its symbol printed in ink on the front.
 */
function specimenGlaze({ roughness = 0.2, glaze = TILE.glaze, shade = 0.86 } = {}) {
  const uni = { uSym: { value: null }, uHasSym: { value: 0 }, uInk: { value: new THREE.Color(TOK.ink) }, uStripe: { value: 0 }, uGlaze: { value: glaze }, uShade: { value: shade }, uHalf: { value: 5 }, uSheen: { value: 0 }, uPoolR: { value: 10 } };
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLoc; varying vec3 vNo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position; vNo = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uSym; uniform float uHasSym; uniform vec3 uInk; uniform float uStripe; uniform float uGlaze; uniform float uShade; uniform float uHalf;
        uniform float uSheen; uniform float uPoolR;
        varying vec3 vLoc; varying vec3 vNo;
        ${GLAZE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float top = smoothstep(0.55, 0.95, vNo.y);
        diffuseColor.rgb *= mix(uShade, 1.0, top);
        if (uStripe > 0.5) { float s = step(0.5, fract((vLoc.x - vLoc.y + vLoc.z) * 0.42)); diffuseColor.rgb *= mix(1.0, 0.8, s); }
        if (uHasSym > 0.5 && vNo.z > 0.97) {
          vec2 uv = vec2(vLoc.x / (2.0 * uHalf) + 0.5, vLoc.y / (2.0 * uHalf)); // the block stands on y = 0
          float ink = texture2D(uSym, uv).a;
          diffuseColor.rgb = mix(diffuseColor.rgb, uInk, ink * 0.9);
        }`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectSpecular += uGlaze * glazeStudio(inverseTransformDirection(normal, viewMatrix), inverseTransformDirection(geometryViewDir, viewMatrix), material.roughness);
        if (uSheen > 0.0 && vNo.y > 0.9) { // a liquid's still surface (the pool's top; x to the right, y toward the viewer)
          vec2 q = vLoc.xz / uPoolR;
          float inside = 1.0 - smoothstep(0.84, 0.96, length(q));
          // a window reflected across the far half: a broad pane with soft edges, never a spot
          float pane = smoothstep(0.24, 0.40, -q.y) * (1.0 - smoothstep(0.78, 0.95, -q.y)) * (1.0 - smoothstep(0.40, 0.58, abs(q.x + 0.06)));
          float room = 0.3 * smoothstep(-0.7, 0.95, -q.y); // the room grazing the surface, lighter toward the back
          reflectedLight.indirectSpecular += uSheen * inside * (pane + room) * vec3(1.0, 0.97, 0.92);
          // depth: deeper toward the viewer and toward the rim, as a liquid looks and a disc does not
          float deep = 1.0 - 0.22 * smoothstep(0.0, 0.95, q.y) - 0.12 * smoothstep(0.5, 0.95, length(q));
          reflectedLight.directDiffuse *= deep; reflectedLight.indirectDiffuse *= deep;
        }`);
  };
  return { m, uni };
}
/** The symbol (and its number) drawn on a canvas, printed on a block's front. */
function symbolTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return { c, tex, draw(sym, Z) {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 256); ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `600 104px ${font.sans}`; ctx.fillText(sym, 128, 166);
    ctx.textAlign = 'left'; ctx.font = `600 36px ${font.sans}`; ctx.fillText(String(Z), 26, 58);
    tex.needsUpdate = true;
  } };
}
function shadowTexture(inner = 0, soft = 0.5) {
  const tex = new THREE.CanvasTexture(softRectCanvas(128, inner, soft));
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
const lathe = (pts, seg = 56) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const rodBetween = (mesh, a, b) => { // a cylinder of height 1 along y, stretched from a to b
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  mesh.scale.set(1, len, 1);
};

// ---- the balance (cm) -------------------------------------------------------------------------------------------
const PIVOT = 38, ARM = 32, HANG = 24, PAN_R = 12.5, PAN_D = 3.3, PAN_FLOOR = 0.45, CUBE = 10, FOOT_R = 10;
const BONE = 0xe9e2d4; // the balance's glaze: a bone cream a shade deeper than the paper, so its catchlights read

export function createCompareView() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.hemi));
  const key = new THREE.DirectionalLight(LIGHT.key, LIGHT.keyIntensity);
  key.position.set(-1, 2.2, 1.6);
  const rim = new THREE.DirectionalLight(LIGHT.rim, LIGHT.rimIntensity);
  rim.position.set(1.2, 0.8, -1.6);
  scene.add(key, rim);
  const low = E.tier === 'low';
  const shadowTex = shadowTexture(), plinthShadowTex = shadowTexture(0.0, 0.5);
  const mkShadow = (opacity = 0.5, tex = shadowTex) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: TOK.shadow, transparent: true, opacity, depthWrite: false }));
    m.renderOrder = -1; return m;
  };
  const labels = new LabelLayer(document.getElementById('labels'));
  const lbl = [0, 1].map(() => labels.add({ pos: new THREE.Vector3(), text: '', cls: 'compare-name', priority: 20, anchor: 'top' }));
  const lblBar = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'compare-scale', priority: 10, anchor: 'top' });

  // ================================ A litre of each ================================================================
  const litre = new THREE.Group();
  scene.add(litre);
  // the balance is glazed bone porcelain with a lacquered ink beam (its own studio: catchlights down the column and
  // along every rim); round things (atoms) keep the soft studio, where a small bright source would be a hard white dot
  const porcelain = balanceGlaze({ color: BONE, roughness: 0.14 });
  const inkMat = balanceGlaze({ color: TOK.ink, roughness: 0.26, glaze: 0.6 }); // lacquer: a sheen, not a light outline
  const seg = low ? 32 : 56;
  // the stand: a low rounded foot, a slim column, an ink pivot and beam
  const stand = new THREE.Group();
  const foot = new THREE.Mesh(lathe([[0, 0], [FOOT_R - 0.6, 0], [FOOT_R, 0.6], [FOOT_R - 0.4, 1.5], [3.2, 2.4], [1.6, 3.2], [0, 3.3]], seg), porcelain);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, PIVOT - 3.2 - 1.2, seg / 2), porcelain);
  column.position.y = 3.2 + (PIVOT - 3.2 - 1.2) / 2;
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 18), inkMat);
  pivot.position.y = PIVOT;
  const footShadow = mkShadow(0.42); footShadow.scale.set(FOOT_R * 2.6, 1, FOOT_R * 2.6); footShadow.position.set(0.6, 0.05, 0.6);
  stand.add(foot, column, pivot, footShadow);
  const beam = new THREE.Group(); beam.position.y = PIVOT;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, ARM * 2, 18), inkMat); rod.rotation.z = Math.PI / 2;
  beam.add(rod);
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), inkMat); k.position.x = s * ARM; beam.add(k); }
  stand.add(beam);
  litre.add(stand);
  // the pans hang level from the beam's ends, each on three ink rods; a specimen stands in each
  const panGeo = lathe([[0, 0], [PAN_R - 2.2, 0], [PAN_R - 0.7, 0.5], [PAN_R, PAN_D - 0.1], [PAN_R - 0.3, PAN_D + 0.05], [PAN_R - 0.75, PAN_D - 0.3], [PAN_R - 1.3, 0.9], [PAN_R - 2.6, PAN_FLOOR], [0, PAN_FLOOR]], seg);
  const rodGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
  const pans = [-1, 1].map(side => {
    const g = new THREE.Group();
    const dish = new THREE.Mesh(panGeo, porcelain);
    const rods = [0, 1, 2].map(() => new THREE.Mesh(rodGeo, inkMat));
    const apex = new THREE.Vector3(0, HANG, 0);
    // one rod at the back and two at the front corners: they frame the specimen instead of crossing it
    rods.forEach((m, i) => { const a = [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2][i]; rodBetween(m, new THREE.Vector3(Math.cos(a) * (PAN_R - 0.3), PAN_D, Math.sin(a) * (PAN_R - 0.3)), apex); });
    const slot = new THREE.Group(); slot.position.y = PAN_FLOOR;
    g.add(dish, ...rods, slot);
    const shadow = mkShadow(0.24); shadow.scale.set(PAN_R * 2.4, 1, PAN_R * 2.4);
    litre.add(g, shadow);
    return { side, g, slot, shadow, rods, dish };
  });
  // plinths: where a weight is not known, the specimens stand on the paper without a balance
  const plinthGeo = lathe([[0, 0], [11.5, 0], [12, 0.6], [11.6, 1.6], [0, 1.8]], seg);
  const plinths = [-1, 1].map(() => { const m = new THREE.Mesh(plinthGeo, porcelain); const s = mkShadow(0.4, plinthShadowTex); s.scale.set(30, 1, 30); litre.add(m, s); return { m, s }; });

  // the specimens: one litre each
  const blockGeo = roundedBox(CUBE, CUBE, CUBE, 0.7, low ? 2 : 3); blockGeo.translate(0, CUBE / 2, 0);
  const poolGeo = (() => { // a litre poured into the pan: flat on top, its edge rolled over like a meniscus
    const r = PAN_R - 1.25, depth = 1000 / (Math.PI * (r - 0.25) ** 2); // ≈ 2.6 cm deep, just under the rim
    return lathe([[0, 0], [r - 0.5, 0], [r, depth * 0.35], [r - 0.05, depth * 0.7], [r - 0.35, depth * 0.93], [r - 0.9, depth], [0, depth]], seg);
  })();
  const glassGeo = roundedBox(CUBE, CUBE, CUBE, 0.5, 3); glassGeo.translate(0, CUBE / 2, 0);
  const dashedBox = (() => { const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE)); g.translate(0, CUBE / 2, 0); return g; })();
  const GAS_N = low ? 12 : 18;
  let specimensMade = 0;
  const specimens = [0, 1].map(() => {
    const sym = symbolTexture();
    const blk = specimenGlaze({ roughness: 0.22 }); blk.uni.uSym.value = sym.tex; blk.uni.uHasSym.value = 1;
    const liq = specimenGlaze({ roughness: 0.06, glaze: 1.1, shade: 1 }); liq.uni.uSheen.value = 0.42; liq.uni.uPoolR.value = PAN_R - 1.25;
    const block = new THREE.Mesh(blockGeo, blk.m);
    const pool = new THREE.Mesh(poolGeo, liq.m);
    const glassMat = glassMaterial(); glassMat.uniforms.uCol.value.set(TOK.ink); glassMat.uniforms.uK.value = 0.34; // ink edges by day, as the forge's vessel
    const glass = new THREE.Mesh(glassGeo, glassMat);
    const gas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.62, 16, 10), softGlaze({ roughness: 0.4, glaze: 0.6 }), GAS_N);
    const dashed = new THREE.LineSegments(dashedBox, new THREE.LineDashedMaterial({ color: TOK.ink3, dashSize: 0.8, gapSize: 0.6 }));
    dashed.computeLineDistances();
    const g = new THREE.Group(); g.add(block, pool, glass, gas, dashed);
    // the gas atoms drift slowly in their litre (each on its own smooth path)
    const rnd = rng32(7 + specimensMade++);
    const seeds = Array.from({ length: GAS_N }, () => [rnd(), rnd(), rnd()]);
    return { g, sym, blk, liq, block, pool, glass, gas, dashed, seeds, kind: 'none', k: 1 };
  });
  pans.forEach((p, i) => p.slot.add(specimens[i].g));
  let tilt = 0, tiltTo = 0, tiltFrom = 0, onBalance = true, gasT = 0, anyGas = false, arm = ARM;
  const knobs = beam.children.slice(1);
  function setArm(a) { arm = a; rod.scale.y = a / ARM; knobs.forEach((k, i) => { k.position.x = (i ? 1 : -1) * a; }); }

  function setSpecimen(i, e, sp) {
    const s = specimens[i], pal = state.cb ? pigmentCB : pigment, col = pal[e.f.cat[0]];
    const kind = sp.state === 'unknown' ? 'unknown' : sp.state; // solid | liquid | gas | unknown
    s.kind = kind;
    s.block.visible = kind === 'solid'; s.pool.visible = kind === 'liquid'; s.glass.visible = kind === 'gas'; s.gas.visible = kind === 'gas'; s.dashed.visible = kind === 'unknown';
    s.block.material.color.set(col); s.pool.material.color.set(col); s.gas.material.color.set(col);
    s.blk.uni.uStripe.value = sp.pred ? 1 : 0; s.liq.uni.uStripe.value = sp.pred ? 1 : 0;
    s.sym.draw(e.sym, e.Z);
    placeGas(i, 0);
  }
  function placeGas(i, time) {
    const s = specimens[i];
    if (!s.gas.visible) return;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    const H = CUBE / 2 - 1.1;
    s.seeds.forEach(([a, b, c], j) => { // each atom wanders on its own slow, smooth path through the whole litre
      const w = 0.22 + 0.3 * a;
      p.set(Math.sin(time * w + a * 40) * H * (0.55 + 0.45 * b), CUBE / 2 + Math.sin(time * w * 0.83 + b * 53) * H * (0.55 + 0.45 * c), Math.sin(time * w * 0.91 + c * 71 + 1.3) * H * (0.55 + 0.45 * a));
      m4.compose(p, q, one); s.gas.setMatrixAt(j, m4);
    });
    s.gas.instanceMatrix.needsUpdate = true;
  }
  /** Beam, pans and specimens for the current tilt (radians; positive: B is heavier and goes down). */
  function placeBalance() {
    beam.rotation.z = -tilt; // positive tilt: the right-hand end (B) goes down
    pans.forEach(p => {
      const x = p.side * arm * Math.cos(tilt), yEnd = PIVOT - p.side * arm * Math.sin(tilt);
      p.g.position.set(x, yEnd - HANG, 0); // pans hang level under the beam's ends
      p.shadow.position.set(x + 1.5, 0.05, 1.5);
      p.shadow.material.opacity = 0.3 * Math.max(0.25, 1 - (yEnd - HANG) / 40); // a higher pan casts a lighter shadow
    });
  }
  function balanceLabels(a, b, sa, sb) {
    const words = (e, sp) => {
      const st = sp.state === 'unknown' ? t('compare.stateUnknown') : `${t('compare.state.' + sp.state)}${sp.pred ? ` (${t('card.pred')})` : ''}`;
      const w = sp.kg == null ? t('compare.weightUnknown') : litreText(sp.kg, sp.kgPred); // as the sheet writes it
      return `${st} · ${w}`;
    };
    labels.setText(lbl[0], gdptName(a), words(a, sa));
    labels.setText(lbl[1], gdptName(b), words(b, sb));
  }

  // ================================ One atom of each ==============================================================
  const atomsG = new THREE.Group(); scene.add(atomsG);
  const sphere = low ? new THREE.SphereGeometry(1, 40, 26) : new THREE.SphereGeometry(1, 64, 40);
  const beads = [0, 1].map(() => {
    const mesh = new THREE.Mesh(sphere, softGlaze({ roughness: 0.44, glaze: 0.75 }));
    const shadow = mkShadow(0.45);
    const ringGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2), Math.sin((i / 96) * Math.PI * 2), 0)));
    const ring = new THREE.Line(ringGeo, new THREE.LineDashedMaterial({ color: TOK.ink3, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.8 }));
    ring.computeLineDistances();
    atomsG.add(mesh, shadow, ring);
    return { mesh, shadow, ring, r: 100, rTo: 100, rFrom: 100, known: true, col: new THREE.Color(), colFrom: new THREE.Color(), colTo: new THREE.Color() };
  });
  const barMat = new THREE.MeshBasicMaterial({ color: TOK.ink });
  const bar = new THREE.Group();
  const barLine = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat), tickL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat), tickR = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat);
  bar.add(barLine, tickL, tickR);
  scene.add(bar);
  function placeBar(cx, L, th, z, tickLen) {
    barLine.scale.set(L, th, th); barLine.position.set(cx, th / 2, z);
    for (const [tk, s] of [[tickL, -1], [tickR, 1]]) { tk.scale.set(th, th, tickLen); tk.position.set(cx + (s * L) / 2, th / 2, z); }
    lblBar.pos.set(cx, 0, z + tickLen * 0.9);
    labels.setText(lblBar, `${fmtNum(L, 0)}${NB}pm`);
  }
  // small atoms look small: the framing never shrinks below a pair of this size (pm)
  const ATOM_FLOOR = 150;
  function placeAtoms() {
    const [A, B] = beads;
    const ra = A.r, rb = B.r, big = Math.max(ra, rb, ATOM_FLOOR * 0.6), gap = big * 0.5;
    const xa = -(gap / 2 + ra), xb = gap / 2 + rb;
    for (const [b, x] of [[A, xa], [B, xb]]) {
      b.mesh.visible = b.known; b.shadow.visible = b.known; b.ring.visible = !b.known;
      b.mesh.scale.setScalar(b.r); b.mesh.position.set(x, b.r, 0);
      b.shadow.scale.set(b.r * 2.3, 1, b.r * 2.3); b.shadow.position.set(x + b.r * 0.08, 0.2, b.r * 0.1);
      b.ring.scale.setScalar(b.r); b.ring.position.set(x, b.r, 0); // standing, facing the viewer: a sphere's outline
      b.mesh.material.color.copy(b.col);
    }
    const small = Math.min(ra, rb);
    const L = [10, 20, 25, 50, 100, 200, 250, 500].filter(v => v <= Math.max(small, 40) * 1.25).pop() || 10;
    const cx = (xa + xb) / 2;
    placeBar(cx, L, big * 0.012, big * 1.75, big * 0.08); // in front of and below the names, never behind them
    lbl[0].pos.set(xa, 0, big * 1.08); lbl[1].pos.set(xb, 0, big * 1.08);
    const span = Math.max(2 * ra + 2 * rb + gap, ATOM_FLOOR * 2.6);
    return { w: span, h: Math.max(2 * big, ATOM_FLOOR * 1.2), cx, depth: big * 1.3, ty: Math.max(big, ATOM_FLOOR * 0.6) * 0.95, air: 1.22 };
  }

  // ================================ Carbon's two solid forms =====================================================
  const formGroups = [0, 1].map(() => {
    const g = new THREE.Group();
    const atoms = new THREE.InstancedMesh(low ? new THREE.SphereGeometry(1, 16, 11) : new THREE.SphereGeometry(1, 28, 18), softGlaze({ roughness: 0.4, glaze: 0.7 }), 200);
    atoms.count = 0;
    const bonds = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: TOK.ink, transparent: true, opacity: 0.55 }));
    const shadow = mkShadow(0.35);
    g.add(atoms, bonds, shadow);
    g.visible = false;
    scene.add(g);
    return { g, atoms, bonds, shadow, w: 0, h: 0 };
  });
  const toThree = p => new THREE.Vector3(p[0], p[2], p[1]); // the crystal's c axis stands vertical: graphite's sheets lie flat
  function cluster(all, dNN, depth) { // the atoms within `depth` bonds of the one nearest the middle
    const c = all.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(all.length);
    let start = 0;
    all.forEach((p, i) => { if (p.distanceTo(c) < all[start].distanceTo(c)) start = i; });
    const seen = new Set([start]);
    let ring = [start];
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const i of ring) all.forEach((p, j) => { if (!seen.has(j) && p.distanceTo(all[i]) < dNN * 1.06) { seen.add(j); next.push(j); } });
      ring = next;
    }
    const o = all[start].clone();
    return [...seen].map(i => all[i].clone().sub(o));
  }
  function buildForm(fg, form, kind, beadR, colour) {
    const ph = form.phase;
    let pts;
    if (kind === 'graphite') { // a round flake of two sheets
      pts = supercell(ph.cell, ph.sites, 4, 4, 1, { closeFaces: false }).map(toThree);
      const R = form.dNN * 2.6, c = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(pts.length);
      pts = pts.map(p => p.sub(c)).filter(p => Math.hypot(p.x, p.z) <= R);
    } else pts = cluster(supercell(ph.cell, ph.sites, 3, 3, 3, { closeFaces: false }).map(toThree), form.dNN, 3); // a ball of the network
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(beadR, beadR, beadR);
    let minY = Infinity, maxY = -Infinity, w = 0;
    for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); w = Math.max(w, Math.abs(p.x), Math.abs(p.z)); }
    const lift = -minY + beadR;
    fg.atoms.count = Math.min(pts.length, 200);
    fg.atoms.material.color.set(colour);
    pts.slice(0, 200).forEach((p, i) => { m4.compose(new THREE.Vector3(p.x, p.y + lift, p.z), q, s); fg.atoms.setMatrixAt(i, m4); });
    fg.atoms.instanceMatrix.needsUpdate = true; fg.atoms.computeBoundingSphere();
    const segs = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (pts[i].distanceTo(pts[j]) < form.dNN * 1.06) segs.push(pts[i].x, pts[i].y + lift, pts[i].z, pts[j].x, pts[j].y + lift, pts[j].z);
    fg.bonds.geometry.dispose();
    fg.bonds.geometry = new THREE.BufferGeometry();
    fg.bonds.geometry.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    fg.shadow.scale.set((w + beadR) * 2.6, 1, (w + beadR) * 2.6); fg.shadow.position.set(0, 0.2, 0);
    fg.w = 2 * (w + beadR); fg.h = maxY - minY + 2 * beadR;
  }
  function placeForms(F, colour) {
    const beadR = F[0].dNN * 0.27; // the same atom, the same bead, in both forms
    buildForm(formGroups[0], F[0], 'graphite', beadR, colour);
    buildForm(formGroups[1], F[1], 'diamond', beadR, colour);
    const [G0, G1] = formGroups, gap = Math.max(G0.w, G1.w) * 0.4;
    G0.g.position.set(-(gap / 2 + G0.w / 2), 0, 0); G1.g.position.set(gap / 2 + G1.w / 2, 0, 0);
    G0.g.rotation.y = 0.35; G1.g.rotation.y = 0.55;
    const big = Math.max(G0.w, G1.w), cx = (G1.g.position.x + G0.g.position.x) / 2;
    lbl[0].pos.set(G0.g.position.x, 0, big * 0.62); lbl[1].pos.set(G1.g.position.x, 0, big * 0.62);
    labels.setText(lbl[0], t('compare.form.graphite'), t('compare.cnEach', { n: F[0].cn }));
    labels.setText(lbl[1], t('compare.form.diamond'), t('compare.cnEach', { n: F[1].cn }));
    // the same scale bar as for atoms, on the paper between the two crystals (clear of their names)
    placeBar(cx, 100, big * 0.008, big * 0.26, big * 0.05);
    return { w: G0.w + G1.w + gap, h: Math.max(G0.h, G1.h), cx, depth: big * 1.05, ty: Math.max(G0.h, G1.h) * 0.42 };
  }

  // ================================ framing and building =========================================================
  let mode = 'litre', framed = null, tween = null;
  function frame(box, dur) {
    const fov = freeFov();
    const r = Math.max((box.w * 0.6) / Math.tan(fov.h / 2), (box.h * (box.fitV || 0.92)) / Math.tan(fov.v / 2)) * 1.08 * (box.air || 1);
    E.camera.near = box.w / 400; E.camera.far = box.w * 80; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: box.w * 0.35, rMax: box.w * 8, phiMin: 0.35, phiMax: 1.45 };
    const phi = mode === 'forms' ? 1.08 : mode === 'litre' ? 1.2 : 1.22;
    E.rig.flyTo({ target: new THREE.Vector3(box.cx, box.ty, box.depth * 0.18), r, theta: 0, phi }, state.reduced ? 0 : dur);
    framed = box;
  }
  function showOnly(which) {
    litre.visible = which === 'litre'; atomsG.visible = which === 'atoms';
    for (const fg of formGroups) fg.g.visible = which === 'forms';
    bar.visible = which !== 'litre'; lblBar.priority = which === 'litre' ? -1 : 10;
  }
  function build(animated) {
    const a = byZ(state.Z), b = byZ(state.Z2 || state.Z);
    const pal = state.cb ? pigmentCB : pigment;
    const formsNow = a.Z === b.Z && twoForms(a.Z);
    mode = formsNow ? 'forms' : getStage();
    showOnly(mode);
    if (tween) { tween(); tween = null; }
    const glide = animated && !state.reduced ? motion.glide : 0;
    if (mode === 'forms') { frame(placeForms(forms(a), pal[a.f.cat[0]]), glide); invalidate(); return; }
    if (mode === 'litre') return buildLitre(a, b, animated);
    // one atom of each
    const m = state.cmpR === 'vdw' ? 'vdw' : 'cov';
    const va = radiusOf(a, m), vb = radiusOf(b, m);
    const fallback = Math.max(va ? va[0] : 0, vb ? vb[0] : 0, 60);
    const goals = [va ? va[0] : fallback, vb ? vb[0] : fallback];
    [a, b].forEach((e, i) => {
      const bd = beads[i];
      bd.known = !![va, vb][i];
      bd.rFrom = bd.r; bd.rTo = goals[i];
      bd.colFrom.copy(bd.col); bd.colTo.set(pal[e.f.cat[0]]);
      labels.setText(lbl[i], gdptName(e), [va, vb][i] ? `${fmtNum([va, vb][i][0], 0)}${NB}pm` : t('compare.unknownSize'));
    });
    const end = () => { for (const bd of beads) { bd.r = bd.rTo; bd.col.copy(bd.colTo); } return placeAtoms(); };
    if (!glide) { frame(end(), 0); invalidate(); return; }
    const goal = (() => { const save = beads.map(bd => [bd.r, bd.col.clone()]); const box = end(); beads.forEach((bd, i) => { bd.r = save[i][0]; bd.col.copy(save[i][1]); }); return box; })();
    frame(goal, glide);
    let k = 0;
    tween = animate(dt => {
      k = Math.min(1, k + dt / 0.5);
      const s = 1 - (1 - k) ** 3;
      for (const bd of beads) { bd.r = bd.rFrom + (bd.rTo - bd.rFrom) * s; bd.col.copy(bd.colFrom).lerp(bd.colTo, s); }
      placeAtoms();
      if (k >= 1) { tween = null; return false; }
      return true;
    });
  }
  function buildLitre(a, b, animated) {
    const sa = specimenOf(a), sb = specimenOf(b);
    setSpecimen(0, a, sa); setSpecimen(1, b, sb);
    onBalance = sa.kg != null && sb.kg != null;
    anyGas = sa.state === 'gas' || sb.state === 'gas';
    stand.visible = onBalance; for (const p of pans) { p.dish.visible = onBalance; p.shadow.visible = onBalance; for (const r of p.rods) r.visible = onBalance; }
    for (const pl of plinths) { pl.m.visible = !onBalance; pl.s.visible = !onBalance; }
    balanceLabels(a, b, sa, sb);
    setArm(window.innerWidth - E.safe.left - E.safe.right < 640 ? 24 : ARM);
    const restX = side => side * arm;
    if (!onBalance) { // no balance: the specimens stand on plinths, level
      tilt = 0; tiltTo = 0;
      pans.forEach((p, i) => { p.g.position.set(restX(p.side), 1.8 - PAN_FLOOR, 0); plinths[i].m.position.set(restX(p.side), 0, 0); plinths[i].s.position.set(restX(p.side) + 1.2, 0.04, 1.2); });
    }
    lbl[0].pos.set(-arm, 0, PAN_R + 4); lbl[1].pos.set(arm, 0, PAN_R + 4);
    // on plinths the specimens are all there is: frame them closer
    const narrow = arm < ARM; // phones: a short, wide strip above the sheet, so the balance may fill more of its height
    const box = onBalance ? { w: 2 * (arm + PAN_R) + 6, h: PIVOT + 6, cx: 0, depth: PAN_R + 4, ty: PIVOT * (narrow ? 0.44 : 0.48), fitV: narrow ? 0.76 : 0.92 } : { w: 2 * (arm + PAN_R) + 4, h: 20, cx: 0, depth: PAN_R + 4, ty: 7 };
    // springs are only for picking things up (STYLE.md §7): the beam glides to its new angle and settles
    tiltFrom = tilt; tiltTo = onBalance ? balanceTilt(sa.kg, sb.kg) : 0;
    for (const s of specimens) s.k = animated && !state.reduced ? 0 : 1;
    const settle = () => { for (const s of specimens) s.g.scale.setScalar(Math.max(0.001, s.k)); };
    if (!animated || state.reduced) { tilt = tiltTo; if (onBalance) placeBalance(); settle(); frame(box, 0); invalidate(); return; }
    frame(box, framed && framed.litre ? 0.5 : motion.glide); box.litre = true;
    let k = 0;
    tween = animate(dt => {
      k = Math.min(1, k + dt / 1.1);
      const e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      tilt = tiltFrom + (tiltTo - tiltFrom) * e;
      for (const s of specimens) s.k = Math.min(1, k / 0.4);
      settle();
      if (onBalance) placeBalance();
      if (k >= 1) { tween = null; return false; }
      return true;
    });
  }
  onStage(() => { if (E.active === view) build(true); });

  const view = {
    scene,
    init() {},
    enter() { labels.enabled = true; E.rig.parallaxOn = false; framed = null; build(false); },
    exit() { labels.enabled = false; labels.hideAll(); if (tween) { tween(); tween = null; } E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix(); },
    resize() { if (E.active === view && framed) frame(framed, 0); },
    // gas atoms drift (slowly, on smooth paths) while a litre of gas is on the stage; otherwise nothing moves
    update(dt) {
      if (mode !== 'litre' || !anyGas || state.reduced) return false;
      gasT += dt;
      specimens.forEach((s, i) => { if (s.kind === 'gas') placeGas(i, gasT); });
      return true;
    },
    afterRender() { labels.update(); },
    onState(ch) {
      if (E.active !== view) return;
      if (['Z', 'Z2', 'cmpR', 'cb'].some(k => k in ch)) build(true);
      else if ('lang' in ch) build(false);
      else if ('reduced' in ch) invalidate();
    },
  };
  return view;
}
