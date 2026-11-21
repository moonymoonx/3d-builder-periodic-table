// Side by side, the stage: two atoms at one true scale, as glazed porcelain beads standing on the paper
// (STYLE.md §6: daylight is for matter). Their sizes are the covalent radius ("when bonded") or the van der
// Waals radius ("when touching"), in picometres; a soft contact shadow under each, an ink scale bar in front.
// A size our sources do not give is an empty dashed ring, never a guess. Carbon beside carbon shows its two
// solid forms instead, built from the measured crystals: graphite's flat sheets and diamond's network, with
// ink bonds between touching atoms. Scene units: picometres. Renders on demand; one continuous camera move.
import * as THREE from 'three';
import { E, invalidate, animate, freeFov } from '../engine.js';
import { state } from '../state.js';
import { byZ, name } from '../data.js';
import { t, fmtNum, getLang } from '../i18n.js';
import { LabelLayer } from '../labels.js';
import { pigment, pigmentCB, color as TOK, light as LIGHT, tile as TILE, motion } from '../../design/tokens.js';
import { GLAZE, softRectCanvas } from './tableArt.js';
import { supercell } from '../../physics/lattice.js';
import { radiusOf, twoForms, forms } from '../ui/comparePanel.js';

export { radiusOf };
const gdptName = e => (getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt' ? e.names.viAlt[0].charAt(0).toUpperCase() + e.names.viAlt[0].slice(1) : name(e));

/** Porcelain glaze on a bead: roughness 0.35 (STYLE.md §6) and the table's soft studio in the reflection. */
function glazedMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uGlaze = { value: TILE.glaze };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uGlaze;\n${GLAZE}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectSpecular += uGlaze * glazeStudio(inverseTransformDirection(normal, viewMatrix), inverseTransformDirection(geometryViewDir, viewMatrix), material.roughness);`);
  };
  return m;
}
/** A soft round contact shadow (white with alpha falloff), tinted by the material colour. */
function shadowTexture() {
  const c = softRectCanvas(128, 0.0, 0.5); // inner 0: a soft disc
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function createCompareView() {
  const scene = new THREE.Scene();
  // daylight studio, as on the table (tokens)
  scene.add(new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.hemi));
  const key = new THREE.DirectionalLight(LIGHT.key, LIGHT.keyIntensity);
  key.position.set(-1, 2.2, 1.6);
  const rim = new THREE.DirectionalLight(LIGHT.rim, LIGHT.rimIntensity);
  rim.position.set(1.2, 0.8, -1.6);
  scene.add(key, rim);

  // fewer facets where every pixel costs (software renderers, the low tier); the glaze hides them
  const sphere = E.tier === 'low' ? new THREE.SphereGeometry(1, 40, 26) : new THREE.SphereGeometry(1, 64, 40);
  const shadowTex = shadowTexture();
  const mkShadow = () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, color: TOK.shadow, transparent: true, opacity: 0.5, depthWrite: false }));
    m.renderOrder = -1; return m;
  };
  // two atoms
  const beads = [0, 1].map(() => {
    const mesh = new THREE.Mesh(sphere, glazedMaterial());
    const shadow = mkShadow();
    // a size we do not know: an empty dashed ring on the paper
    const ringGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos((i / 96) * Math.PI * 2), 0, Math.sin((i / 96) * Math.PI * 2))));
    const ring = new THREE.Line(ringGeo, new THREE.LineDashedMaterial({ color: TOK.ink3, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.8 }));
    ring.computeLineDistances();
    scene.add(mesh, shadow, ring);
    return { mesh, shadow, ring, r: 100, rTo: 100, rFrom: 100, known: true, col: new THREE.Color(), colFrom: new THREE.Color(), colTo: new THREE.Color() };
  });
  // the scale bar: an ink line with end ticks, lying on the paper in front of the atoms
  const barMat = new THREE.MeshBasicMaterial({ color: TOK.ink });
  const bar = new THREE.Group();
  const barLine = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat), tickL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat), tickR = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), barMat);
  bar.add(barLine, tickL, tickR);
  scene.add(bar);
  // two solid forms (carbon): instanced beads and ink bonds per form
  const formGroups = [0, 1].map(() => {
    const g = new THREE.Group();
    const atoms = new THREE.InstancedMesh(E.tier === 'low' ? new THREE.SphereGeometry(1, 16, 11) : new THREE.SphereGeometry(1, 28, 18), glazedMaterial(), 200);
    atoms.count = 0;
    const bonds = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: TOK.ink, transparent: true, opacity: 0.55 }));
    const shadow = mkShadow(); shadow.material.opacity = 0.35;
    g.add(atoms, bonds, shadow);
    g.visible = false;
    scene.add(g);
    return { g, atoms, bonds, shadow, w: 0, h: 0 };
  });

  const labels = new LabelLayer(document.getElementById('labels'));
  const lbl = [0, 1].map(() => labels.add({ pos: new THREE.Vector3(), text: '', cls: 'compare-name', priority: 20, anchor: 'top' }));
  const lblBar = labels.add({ pos: new THREE.Vector3(), text: '', cls: 'compare-scale', priority: 10, anchor: 'top' });
  let tween = null, mode = 'atoms', framed = null;

  // ---- atoms ---------------------------------------------------------------------------------------------
  function placeAtoms() {
    const [A, B] = beads;
    const ra = A.r, rb = B.r, gap = Math.max(ra, rb) * 0.5;
    const xa = -(gap / 2 + ra), xb = gap / 2 + rb;
    for (const [b, x] of [[A, xa], [B, xb]]) {
      b.mesh.visible = b.known; b.shadow.visible = b.known; b.ring.visible = !b.known;
      b.mesh.scale.setScalar(b.r); b.mesh.position.set(x, b.r, 0);
      b.shadow.scale.set(b.r * 2.3, 1, b.r * 2.3); b.shadow.position.set(x + b.r * 0.08, 0.2, b.r * 0.1);
      b.ring.scale.setScalar(b.r); b.ring.position.set(x, 0.5, 0);
      b.mesh.material.color.copy(b.col);
    }
    // a round scale length close to the smaller atom
    const small = Math.min(ra, rb), big = Math.max(ra, rb);
    const L = [10, 20, 25, 50, 100, 200, 250, 500].filter(v => v <= small * 1.25).pop() || 10;
    const th = big * 0.012, z = big * 1.3, cx = (xa + xb) / 2;
    barLine.scale.set(L, th, th); barLine.position.set(cx, th / 2, z);
    for (const [tk, s] of [[tickL, -1], [tickR, 1]]) { tk.scale.set(th, th, big * 0.08); tk.position.set(cx + (s * L) / 2, th / 2, z); }
    lblBar.pos.set(cx, 0, z + big * 0.06);
    labels.setText(lblBar, `${fmtNum(L, 0)} pm`);
    lbl[0].pos.set(xa, 0, big * 1.08); lbl[1].pos.set(xb, 0, big * 1.08); // one line, under both
    return { w: 2 * ra + 2 * rb + gap, h: 2 * big, cx, depth: z };
  }
  function atomLabel(i, e, v) {
    const size = v ? `${fmtNum(v[0], 0)} pm` : t('compare.unknownSize');
    labels.setText(lbl[i], gdptName(e), size);
  }

  // ---- two solid forms ----------------------------------------------------------------------------------------
  // positions in pm, three.js y up: the crystal's c axis stands vertical, so graphite's sheets lie flat
  const toThree = p => new THREE.Vector3(p[0], p[2], p[1]);
  /** The atoms within `depth` bonds of the one nearest the middle (bonds: closer than 1.06 × the neighbour distance). */
  function cluster(all, dNN, depth) {
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
    if (kind === 'graphite') {
      // a round flake of two sheets: a block of cells cropped to a disc around the middle
      pts = supercell(ph.cell, ph.sites, 4, 4, 1, { closeFaces: false }).map(toThree);
      const R = form.dNN * 2.6;
      const c = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(pts.length);
      pts = pts.map(p => p.sub(c)).filter(p => Math.hypot(p.x, p.z) <= R);
    } else {
      // a ball of the network: the atom nearest the middle, then every atom within three bonds of it
      pts = cluster(supercell(ph.cell, ph.sites, 3, 3, 3, { closeFaces: false }).map(toThree), form.dNN, 3);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(beadR, beadR, beadR);
    let minY = Infinity, maxY = -Infinity, w = 0;
    for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); w = Math.max(w, Math.abs(p.x), Math.abs(p.z)); }
    const lift = -minY + beadR; // rests on the paper
    fg.atoms.count = Math.min(pts.length, 200);
    fg.atoms.material.color.set(colour);
    pts.slice(0, 200).forEach((p, i) => { m4.compose(new THREE.Vector3(p.x, p.y + lift, p.z), q, s); fg.atoms.setMatrixAt(i, m4); });
    fg.atoms.instanceMatrix.needsUpdate = true;
    fg.atoms.computeBoundingSphere();
    // bonds: every pair of atoms that touch (within 6 % of the nearest-neighbour distance)
    const seg = [];
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = pts[i].distanceTo(pts[j]);
      if (d < form.dNN * 1.06) seg.push(pts[i].x, pts[i].y + lift, pts[i].z, pts[j].x, pts[j].y + lift, pts[j].z);
    }
    fg.bonds.geometry.dispose();
    fg.bonds.geometry = new THREE.BufferGeometry();
    fg.bonds.geometry.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
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
    const big = Math.max(G0.w, G1.w);
    lbl[0].pos.set(G0.g.position.x, 0, big * 0.62); lbl[1].pos.set(G1.g.position.x, 0, big * 0.62);
    labels.setText(lbl[0], t('compare.form.graphite'), t('compare.cnEach', { n: F[0].cn }));
    labels.setText(lbl[1], t('compare.form.diamond'), t('compare.cnEach', { n: F[1].cn }));
    // the same scale bar as for atoms: the forms are drawn at their true size too
    const cx = (G1.g.position.x + G0.g.position.x) / 2, L = 100, th = big * 0.008, z = big * 0.7;
    barLine.scale.set(L, th, th); barLine.position.set(cx, th / 2, z);
    for (const [tk, sgn] of [[tickL, -1], [tickR, 1]]) { tk.scale.set(th, th, big * 0.05); tk.position.set(cx + (sgn * L) / 2, th / 2, z); }
    lblBar.pos.set(cx, 0, z + big * 0.04); labels.setText(lblBar, `${fmtNum(L, 0)} pm`);
    bar.visible = true; lblBar.priority = 10;
    return { w: G0.w + G1.w + gap, h: Math.max(G0.h, G1.h), cx, depth: big * 0.6 };
  }

  // ---- framing: both specimens in the free area beside (or above) the sheet ---------------------------------------
  function frame(box, dur) {
    const fov = freeFov();
    const r = Math.max((box.w * 0.62) / Math.tan(fov.h / 2), (box.h * 0.95) / Math.tan(fov.v / 2)) * 1.08;
    E.camera.near = box.w / 400; E.camera.far = box.w * 80; E.camera.updateProjectionMatrix();
    E.rig.lim = { rMin: box.w * 0.35, rMax: box.w * 8, phiMin: 0.35, phiMax: 1.45 };
    const phi = mode === 'forms' ? 1.08 : 1.22;
    E.rig.flyTo({ target: new THREE.Vector3(box.cx, box.h * (mode === 'forms' ? 0.42 : 0.5), box.depth * 0.18), r, theta: 0, phi }, state.reduced ? 0 : dur);
    framed = box;
  }

  function build(animated) {
    const a = byZ(state.Z), b = byZ(state.Z2 || state.Z);
    const pal = state.cb ? pigmentCB : pigment;
    const formsNow = a.Z === b.Z && twoForms(a.Z);
    mode = formsNow ? 'forms' : 'atoms';
    for (const fg of formGroups) fg.g.visible = formsNow;
    for (const bd of beads) { bd.mesh.visible = !formsNow; bd.shadow.visible = !formsNow; bd.ring.visible = false; }
    if (tween) { tween(); tween = null; }
    if (formsNow) {
      const box = placeForms(forms(a), pal[a.f.cat[0]]);
      frame(box, animated ? motion.glide : 0); invalidate();
      return;
    }
    bar.visible = true; lblBar.priority = 10;
    const m = state.cmpR === 'vdw' ? 'vdw' : 'cov';
    const va = radiusOf(a, m), vb = radiusOf(b, m);
    const fallback = Math.max(va ? va[0] : 0, vb ? vb[0] : 0) || 150;
    const goals = [va ? va[0] : fallback, vb ? vb[0] : fallback];
    [a, b].forEach((e, i) => {
      const bd = beads[i];
      bd.known = !![va, vb][i];
      bd.rFrom = bd.r; bd.rTo = goals[i];
      bd.colFrom.copy(bd.col); bd.colTo.set(pal[e.f.cat[0]]);
      atomLabel(i, e, [va, vb][i]);
    });
    const end = () => { for (const bd of beads) { bd.r = bd.rTo; bd.col.copy(bd.colTo); } return placeAtoms(); };
    if (!animated || state.reduced) { frame(end(), 0); invalidate(); return; }
    // the camera glides to the new pair's framing while the beads grow or shrink (one continuous move)
    const goal = (() => { const save = beads.map(bd => [bd.r, bd.col.clone()]); const box = end(); beads.forEach((bd, i) => { bd.r = save[i][0]; bd.col.copy(save[i][1]); }); return box; })();
    frame(goal, motion.glide);
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

  const view = {
    scene,
    init() {},
    enter() { labels.enabled = true; E.rig.parallaxOn = false; build(false); },
    exit() { labels.enabled = false; labels.hideAll(); if (tween) { tween(); tween = null; } E.camera.near = 0.05; E.camera.far = 3000; E.camera.updateProjectionMatrix(); },
    resize() { if (E.active === view && framed) frame(framed, 0); },
    afterRender() { labels.update(); },
    onState(ch) {
      if (E.active !== view) return;
      if (['Z', 'Z2', 'cmpR', 'cb'].some(k => k in ch)) build(true);
      else if ('lang' in ch) build(false);
    },
  };
  return view;
}
