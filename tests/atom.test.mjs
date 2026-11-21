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

test('its light: one line per wavelength, colour words, and no olive or teal at the ends of the spectrum', () => {
  assert.equal(S.uniqueLines(bySym('He')).length, 3, 'helium lists 388.865 and 587.562 nm more than once');
  assert.deepEqual([405, 470, 495, 540, 589, 610, 656].map(S.colourWord), ['violet', 'blue', 'teal', 'green', 'yellow', 'orange', 'red']);
  for (const nm of [690, 720, 749]) { const [r, g, b] = S.lineColour(nm); assert.ok(r > 2 * g && r > 2 * b, `${nm} nm reads red: ${[r, g, b]}`); }
  for (const nm of [380, 390]) { const [r, g, b] = S.lineColour(nm); assert.ok(b > g && r > g, `${nm} nm reads violet: ${[r, g, b]}`); }
  assert.equal(S.uniqueLines(bySym('Og')).length, 0);
});
