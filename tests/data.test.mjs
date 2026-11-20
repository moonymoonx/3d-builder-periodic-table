import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runValidation } from '../tools/validate.mjs';
import { parseOp, parseCIF, expandSites } from '../tools/lib/cif.mjs';
import { parseCSV, nistCell } from '../tools/lib/csv.mjs';
import { parseLattice, infoboxFields } from '../tools/lib/wikitext.mjs';

test('validator: all data checks pass', () => {
  const { fails } = runValidation({ quiet: true });
  assert.deepEqual(fails.map(f => `${f.name}: ${f.detail}`), []);
});

test('csv: NIST excel-safe cells', () => {
  const rows = parseCSV('a,b\n"=""1""","=""x, y"""\n');
  assert.deepEqual(rows[1].map(nistCell), ['1', 'x, y']);
});

test('cif: symmetry operators', () => {
  assert.deepEqual(parseOp('-x+1/2,y,-z')(0.1, 0.2, 0.3).map(v => +v.toFixed(6)), [0.4, 0.2, -0.3]);
  assert.deepEqual(parseOp('x-y,x,z+1/6')(0.5, 0.25, 0).map(v => +v.toFixed(6)), [0.25, 0.5, 0.166667]);
});

test('cif: every committed COD file expands to its formula-unit count', () => {
  const dir = 'data/raw/cod';
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.cif'))) {
    const cif = parseCIF(fs.readFileSync(`${dir}/${f}`, 'utf8'));
    assert.equal(expandSites(cif).length, cif.Z, f);
  }
});

test('wikitext: lattice constants in pm, nm and rhombohedral forms', () => {
  assert.deepEqual(parseLattice("''a''&nbsp;=&nbsp;286.65&nbsp;pm (at&nbsp;20&nbsp;°C)"), { text: 'a = 286.65 pm (at 20 °C)', a: 286.65, cond: 'at 20 °C' });
  const sb = parseLattice("''a''&nbsp;=&nbsp;0.45066&nbsp;nm<br />α&nbsp;=&nbsp;57.112°<br />''a''<sub>h</sub>&nbsp;=&nbsp;0.43084&nbsp;nm<br />''c''<sub>h</sub>&nbsp;=&nbsp;1.12736&nbsp;nm (at&nbsp;20&nbsp;°C)");
  assert.ok(Math.abs(sb.ah - 430.84) < 1e-9 && Math.abs(sb.ch - 1127.36) < 1e-9 && sb.alpha === 57.112);
  assert.equal(infoboxFields('{{infobox element\n|name=iron\n|crystal structure=x |crystal structure comment=(predicted)\n}}')['crystal structure comment'], '(predicted)');
});

test('colour: analytic CIE 1931 fit (embedded) stays close to the CIE table (raw file, test only)', async () => {
  const { cmfAt } = await import('../src/physics/color.js');
  const D = JSON.parse(fs.readFileSync('data/elements.json', 'utf8'));
  const rows = fs.readFileSync('data/raw/cie/CIE_xyz_1931_2deg.csv', 'utf8').trim().split(/\r?\n/).map(l => l.split(',').map(Number)).filter(r => r[0] >= 380 && r[0] <= 750);
  let worst = 0;
  for (const [l, x, y, z] of rows) { const f = cmfAt(D.cmfFit.v, l); worst = Math.max(worst, Math.abs(f[0] - x), Math.abs(f[1] - y), Math.abs(f[2] - z)); }
  assert.ok(worst < 0.05, `max |fit - table| = ${worst}`);
  assert.equal(D.cmf, undefined, 'the CIE table itself must not be embedded');
});
