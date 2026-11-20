import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../src/physics/orbitals.js';
import { parseConfig, expandConfig, madelungConfig, configDiff, formatConfig, slaterZeff, MADELUNG_ORDER } from '../src/physics/config.js';
import { PROTOTYPES, nearestNeighbour, coordination, supercell, cellVolume, lindemannRms, rmsSpeed } from '../src/physics/lattice.js';

test('orbitals: all 19 occupied subshells normalised with correct node counts', () => {
  for (const [n, l] of O.OCCUPIED_SUBSHELLS) {
    assert.ok(Math.abs(O.radialNormIntegral(n, l, 1) - 1) < 1e-6, `${n},${l} norm`);
    assert.equal(O.countRadialNodes(n, l, 1), n - l - 1, `${n},${l} radial nodes`);
    for (const m of O.mValues(l)) assert.equal(O.countAngularNodes(l, m).total, l, `${n},${l},${m} angular`);
  }
});

test('orbitals: hydrogen 1s analytic forms', () => {
  for (const r of [0, 0.5, 1, 2, 5]) assert.ok(Math.abs(O.radial(1, 0, 1, r) - 2 * Math.exp(-r)) < 1e-12);
  // radius enclosing 90 % probability of hydrogen 1s solves 1 - e^{-2r}(1 + 2r + 2r^2) = 0.9
  const r90 = O.radiusForFraction(1, 0, 1, 0.9);
  const P = 1 - Math.exp(-2 * r90) * (1 + 2 * r90 + 2 * r90 * r90);
  assert.ok(Math.abs(P - 0.9) < 1e-3, `P(r90)=${P}`);
});

test('orbitals: sampled mean radius matches <r> = (3n^2 - l(l+1))/2Z', () => {
  for (const [n, l, m, Z] of [[1, 0, 0, 1], [2, 1, 1, 1], [3, 2, 0, 2], [4, 3, -2, 3]]) {
    const { pos, sign } = O.sampleOrbital(n, l, m, Z, 40000);
    let s = 0;
    for (let i = 0; i < 40000; i++) s += Math.hypot(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
    const mean = s / 40000, want = O.meanRadius(n, l, Z);
    assert.ok(Math.abs(mean - want) / want < 0.02, `${n}${l}${m}: ${mean} vs ${want}`);
    if (l > 0) { // phases: lobes of both signs
      let pos1 = 0; for (const x of sign) if (x > 0) pos1++;
      assert.ok(pos1 > 8000 && pos1 < 32000);
    }
  }
});

test('orbitals: p_x lobes lie along x, d_z2 along z', () => {
  const g = O.gridPsi(2, 1, 1, 1, 31, 10);
  const at = (i, j, k) => g.f[i + 31 * (j + 31 * k)];
  assert.ok(Math.abs(at(22, 15, 15)) > 10 * Math.abs(at(15, 22, 15)));
  const d = O.gridPsi(3, 2, 0, 1, 31, 20);
  const dz = (i, j, k) => d.f[i + 31 * (j + 31 * k)];
  assert.ok(dz(15, 15, 22) > 0 && dz(22, 15, 15) < 0, 'd_z2: + along z, - torus in xy');
});

test('config: parsing NIST and PubChem notations', () => {
  assert.deepEqual(parseConfig('[Ar].3d5.4s'), { core: 'Ar', subs: [{ n: 3, l: 2, occ: 5 }, { n: 4, l: 0, occ: 1 }] });
  assert.deepEqual(parseConfig('[Rn]7s2 7p6 5f14 6d10 (predicted)').subs.length, 4);
  const cores = { He: parseConfig('1s2'), Ne: parseConfig('[He].2s2.2p6'), Ar: parseConfig('[Ne].3s2.3p6') };
  const cr = expandConfig(parseConfig('[Ar].3d5.4s'), cores);
  assert.equal(cr.reduce((s, x) => s + x.occ, 0), 24);
  assert.equal(formatConfig(cr, { core: 'Ar', coreSubs: expandConfig(cores.Ar, cores) }), '[Ar] 3d5 4s1');
  assert.deepEqual(configDiff(madelungConfig(24), cr).map(d => `${d.n}${'spdf'[d.l]}${d.from}>${d.to}`), ['3d4>5', '4s2>1']);
});

test('config: Madelung order and Slater textbook examples', () => {
  assert.deepEqual(MADELUNG_ORDER.slice(0, 8).map(([n, l]) => `${n}${'spdf'[l]}`), ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p']);
  assert.equal(MADELUNG_ORDER.length, 19);
  const N = madelungConfig(7); // 1s2 2s2 2p3: S(2p) = 4*0.35 + 2*0.85 = 3.1
  assert.ok(Math.abs(slaterZeff(7, N, 2, 1) - 3.9) < 1e-9);
  const Zn = madelungConfig(30); // S(4s) = 0.35 + 18*0.85 + 10*1 = 25.65 ; S(3d) = 9*0.35 + 18 = 21.15
  assert.ok(Math.abs(slaterZeff(30, Zn, 4, 0) - 4.35) < 1e-9);
  assert.ok(Math.abs(slaterZeff(30, Zn, 3, 2) - 8.85) < 1e-9);
});

test('lattice: prototype coordination numbers and nearest-neighbour distances', () => {
  const cub = a => ({ a, b: a, c: a, alpha: 90, beta: 90, gamma: 90 });
  assert.equal(coordination(cub(300), PROTOTYPES.bcc.sites), 8);
  assert.ok(Math.abs(nearestNeighbour(cub(300), PROTOTYPES.bcc.sites) - 150 * Math.sqrt(3)) < 1e-9);
  assert.equal(coordination(cub(400), PROTOTYPES.fcc.sites), 12);
  assert.equal(coordination(cub(543), PROTOTYPES.diamond.sites), 4);
  assert.equal(coordination(cub(330), PROTOTYPES.sc.sites), 6);
  const hex = { a: 320.9, b: 320.9, c: 320.9 * Math.sqrt(8 / 3), alpha: 90, beta: 90, gamma: 120 };
  assert.equal(coordination(hex, PROTOTYPES.hcp.sites), 12);
  assert.equal(coordination({ a: 246.1, b: 246.1, c: 670.9, alpha: 90, beta: 90, gamma: 120 }, PROTOTYPES.graphite.sites), 3);
  assert.ok(Math.abs(cellVolume(cub(2)) - 8) < 1e-9);
  assert.equal(supercell(cub(1), PROTOTYPES.bcc.sites, 2).length, 27 + 8); // corners 3^3 + 2^3 centres
});

test('lattice: Lindemann vibration and gas speed', () => {
  assert.equal(lindemannRms(0, 1000, 250), 0);
  assert.ok(Math.abs(lindemannRms(1000, 1000, 250, 0.1) - 25) < 1e-12);
  assert.ok(Math.abs(lindemannRms(250, 1000, 250, 0.1) - 12.5) < 1e-12);
  // N2-like gas at 300 K: sqrt(3*8.314*300/0.028) ~ 517 m/s
  assert.ok(Math.abs(rmsSpeed(300, 28, 8.314462618) - 517) < 1);
});
