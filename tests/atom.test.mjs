// Atom place (PARALLEL.md scope 1): the pure helpers behind the caption, the clouds and its light.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// data.js reads the embedded dataset from the page; give it the JSON file instead
globalThis.document = { getElementById: () => ({ textContent: fs.readFileSync('data/elements.json', 'utf8') }) };
const { loadData, bySym } = await import('../src/app/data.js');
loadData();
const V = await import('../src/app/views/atom.js');
const S = await import('../src/app/ui/spectrum.js');
const O = await import('../src/physics/orbitals.js');

test('atom: electrons per shell come from the configuration (iron 2, 8, 14, 2; uranium 7 shells)', () => {
  assert.deepEqual(V.shellCounts(bySym('Fe')), [[1, 2], [2, 8], [3, 14], [4, 2]]);
  assert.deepEqual(V.shellCounts(bySym('U')).map(x => x[1]), [2, 8, 18, 32, 21, 9, 2]);
  for (const sym of ['H', 'C', 'Fe', 'Au', 'U', 'Og']) {
    const e = bySym(sym);
    assert.equal(V.shellCounts(e).reduce((a, x) => a + x[1], 0), e.Z, `${sym}: neutral atom`);
  }
});

test('atom: the newest electron and what the last proton did', () => {
  const newest = s => V.newestSubshell(bySym(s)).key;
  assert.deepEqual(['H', 'K', 'Ga', 'Fe', 'Mn', 'Cr', 'Ce', 'Lr'].map(newest), ['1s', '4s', '4p', '3d', '4s', '3d', '4f', '7p']);
  assert.equal(V.stepChange(bySym('H')).kind, 'first');
  assert.equal(V.stepChange(bySym('Fe')).kind, 'add');
  const cr = V.stepChange(bySym('Cr'));
  assert.equal(cr.kind, 'rearr');
  assert.deepEqual(cr.diff.map(d => `${d.n}${'spdf'[d.l]}:${d.from}>${d.to}`), ['3d:3>5', '4s:2>1']);
});

test('atom: the first d cloud shown is a cloverleaf; shapes follow the angular nodes', () => {
  assert.equal(V.shapeOf(2, V.leadM(2)), 'clover');
  assert.deepEqual([-2, -1, 0, 1, 2].map(m => V.shapeOf(2, m)), ['clover', 'clover', 'ring', 'clover', 'clover']);
  assert.deepEqual([-3, -2, -1, 0, 1, 2, 3].map(m => V.shapeOf(3, m)), ['six', 'eight', 'six', 'rings2', 'six', 'eight', 'six']);
  assert.equal([-3, -2, -1, 0, 1, 2, 3].filter(m => ['six', 'eight'].includes(V.shapeOf(3, m))).length, 6, 'six of the seven f clouds');
  assert.equal(V.parseOrbital(bySym('Fe'), null).m, 1, 'iron opens on d_xz, the cloverleaf facing you');
  assert.equal(V.parseOrbital(bySym('Fe'), '3p:all').m, null);
});

test('atom: shells sit inside one another (90 % radii grow with n)', () => {
  for (const sym of ['Na', 'Fe', 'Au', 'U']) {
    const r = V.shellsOf(bySym(sym)).map(x => x.r90);
    for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1], `${sym}: shell ${i + 1} outside shell ${i}`);
  }
  // one subshell alone: the shell radius is that subshell's 90 % radius
  const h = V.shellsOf(bySym('H'))[0].r90, s = V.subshellsOf(bySym('H'))[0].r90;
  assert.ok(Math.abs(h - s) / s < 0.01, `${h} vs ${s}`);
});

test('atom: a cloud of charge Z is the Z = 1 cloud shrunk by 1/Z (the cached samples are rescaled)', () => {
  const Z = 5.43, u = O.sampleOrbital(4, 0, 0, 1, 30000, O.rng32(3));
  let s = 0;
  for (let i = 0; i < 30000; i++) s += Math.hypot(u.pos[3 * i], u.pos[3 * i + 1], u.pos[3 * i + 2]) / Z;
  const want = O.meanRadius(4, 0, Z);
  assert.ok(Math.abs(s / 30000 - want) / want < 0.02, `${s / 30000} vs ${want}`);
});

test('its light: the lines that look brightest, one per wavelength, and no olive, teal or crimson', () => {
  // round 2: neon shows its orange-red lines (not near-infrared ones), sodium its D doublet and 568.8 nm pair
  const has = (sym, ...nm) => nm.every(w => S.uniqueLines(bySym(sym)).some(([l]) => Math.abs(l - w) < 0.06));
  assert.ok(has('Ne', 585.25, 614.31, 640.22), 'neon: 585.2, 614.3 and 640.2 nm');
  assert.ok(!S.uniqueLines(bySym('Ne')).some(([l]) => l > 690), 'neon: no near-infrared line among the 8');
  assert.ok(has('Na', 589.0, 589.59, 568.82), 'sodium: D lines and the 568.8 nm pair');
  assert.ok(!S.uniqueLines(bySym('Na')).some(([l]) => l < 450), 'sodium: none of the core-excited violet lines');
  assert.ok(S.uniqueLines(bySym('Fe')).every(([l]) => l > 400), 'iron: no near-ultraviolet stack');
  const ne = S.looks(bySym('Ne')), top = ne.reduce((a, b) => (b.b > a.b ? b : a));
  assert.ok(Math.abs(top.lam - 640.22) < 0.1, `neon looks brightest at 640.2 nm (got ${top.lam})`);
  assert.deepEqual([405, 470, 495, 540, 589, 610, 656].map(S.colourWord), ['violet', 'blue', 'teal', 'green', 'yellow', 'orange', 'red']);
  for (const nm of [640, 656, 690, 720, 749]) { const [r, g, b] = S.lineColour(nm); assert.ok(r > 4 * g && r > 4 * b, `${nm} nm reads red, not crimson: ${[r, g, b]}`); }
  for (const nm of [380, 390]) { const [r, g, b] = S.lineColour(nm); assert.ok(b > g && r > g, `${nm} nm reads violet: ${[r, g, b]}`); }
  assert.equal(S.uniqueLines(bySym('Og')).length, 0);
  // the glow: neon red-orange, sodium orange-yellow (R > G > B), argon violet (B the largest)
  const [nr, ng, nb] = S.glowRGB(bySym('Ne')); assert.ok(nr > 0.9 && ng < 0.45 && nb < 0.1, `neon glow ${[nr, ng, nb]}`);
  const [sr, sg, sb] = S.glowRGB(bySym('Na')); assert.ok(sr > sg && sg > sb && sg > 0.4, `sodium glow ${[sr, sg, sb]}`);
  const [ar, ag, ab] = S.glowRGB(bySym('Ar')); assert.ok(ab >= ar && ab > ag, `argon glow ${[ar, ag, ab]}`);
  assert.equal(S.glowRGB(bySym('Og')), null);
});

test('one cloud: flat surfaces where it is zero, true spheres for s clouds, turns in the usual order', () => {
  const planes = (l, m) => V.nodalPlanes(l, m).map(v => v.map(x => Math.round(x * 1000) / 1000 + 0));
  assert.deepEqual(planes(1, 0), [[0, 0, 1]], 'p_z: the xy plane');
  assert.deepEqual(planes(1, 1), [[-1, 0, 0]], 'p_x: the yz plane');
  assert.equal(V.nodalPlanes(2, 1).length, 2, 'd_xz: two planes');
  assert.equal(V.nodalPlanes(2, 0).length, 0, 'd_z²: cones, no plane');
  assert.equal(V.nodalPlanes(3, -2).length, 3, 'f_xyz: three planes');
  // every plane really is a zero of psi
  for (const [l, m] of [[1, -1], [1, 0], [1, 1], [2, -2], [2, -1], [2, 1], [2, 2], [3, -3], [3, -2], [3, 0], [3, 2], [3, 3]]) {
    for (const [a, b, c] of V.nodalPlanes(l, m)) {
      const u = Math.abs(c) > 0.9 ? [1, 0, 0] : [0, 0, 1], w = [b * u[2] - c * u[1], c * u[0] - a * u[2], a * u[1] - b * u[0]];
      for (const t of [0.7, 2.3]) { const p = w.map((x, i) => t * x + 0.4 * t * (i === 2 && Math.abs(c) < 0.9 ? 1 : 0)); assert.ok(Math.abs(O.psi(l + 1, l, m, 1, p[0], p[1], p[2])) < 1e-9, `psi(${l},${m}) is zero on its plane`); }
    }
  }
  // 1s: one sphere; 4s: nested spheres alternating in sign, the outermost the 4s cloud's 90 % reach
  assert.equal(V.sSpheres(1).length, 1);
  const s4 = V.sSpheres(4);
  assert.ok(s4.length >= 3, `4s: ${s4.length} spheres`);
  assert.ok(s4.every((x, i) => !i || x.r > s4[i - 1].r));
  assert.deepEqual(V.turnOrder(1), [1, -1, 0], 'p: x, y, z');
  assert.deepEqual(V.turnOrder(2).map(m => O.ORBITAL_SUFFIX[2][m]), ['xy', 'xz', 'yz', 'x²−y²', 'z²']);
});

test('the nucleus is drawn a round factor bigger; filling-order surprises in plain words', async () => {
  assert.deepEqual([850, 1300, 1800, 3400, 7600].map(V.niceFactor), [1000, 1000, 2000, 5000, 10000]);
  await import('../src/app/content/strings-atom.js');
  assert.equal(V.movePhrase(['5f: 4→3', '6d: 0→1']), 'one electron sits in 6d instead of 5f', 'uranium');
  assert.equal(V.movePhrase(['4d: 8→10', '5s: 2→0']), 'two electrons sit in 4d instead of 5s', 'palladium');
  assert.equal(V.movePhrase(bySym('Th').f.madelung[2].d), 'two electrons sit in 6d instead of 5f', 'thorium, from the data');
  // every filling-order exception in the data reads as one plain phrase (no raw "5f: 4 → 3" shorthand)
  for (const Z of Array.from({ length: 118 }, (_, i) => i + 1)) {
    const e = (await import('../src/app/data.js')).byZ(Z), md = e.f.madelung;
    if (md[0] === 'exception') assert.match(V.movePhrase(md[2].d), /^(one|two|three) electrons? sits? in \d[spdf] instead of \d[spdf]$|^its electrons sit in [\d\w, ]+ instead of [\d\w, ]+$/, `${e.sym}: ${V.movePhrase(md[2].d)}`);
  }
});
