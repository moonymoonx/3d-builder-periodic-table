// Patterns and Side by side: the words rest on the data. Every hook's premise (tungsten melts hottest,
// osmium is the densest measured element, chlorine is the most eager…) is checked here against
// data/elements.json, so a change in the data that breaks a sentence fails the tests instead of shipping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL, TOP, MORE, facts, points, fmtPoint, isGasAtRoom, AIR_G_PER_L, columnFacts, PERIODIC } from '../src/app/places/patternSpecs.js';
import { PROPS } from '../src/app/data.js';
import { STRINGS } from '../src/app/i18n.js';
import { REFS, PATTERN_REFS } from '../src/app/content/patterns-refs.js';
import '../src/app/content/strings-patterns.js';

const D = JSON.parse(fs.readFileSync(new URL('../data/elements.json', import.meta.url), 'utf8'));
const E = D.elements;
const sym = Z => E[Z - 1].sym;
const syms = Zs => Zs.map(sym);
const F = id => facts(id, E);
const callout = (id, key) => F(id).callouts.find(c => c.key === key);

test('patterns: one per numbers lens, in the lenses\' order', () => {
  assert.deepEqual(TOP, ['mp', 'density', 'rCov', 'ie1']);
  assert.deepEqual(MORE, ['en', 'year', 'abund', 'bp', 'ea', 'aw', 'rVdw', 'zeff']);
  for (const id of ALL) assert.ok(PROPS.some(p => p.key === id), id);
  for (const id of ALL) assert.ok(points(id, E).length >= 57, `${id} has points`);
});

test('patterns: melting point — tungsten melts hottest; carbon never melts but stands tallest', () => {
  const f = F('mp');
  assert.equal(f.params.top.e.sym, 'W');
  assert.equal(fmtPoint('mp', f.params.top), '3,422\u00a0°C');
  assert.equal(sym(callout('mp', 'sub').lead), 'C');
  assert.equal(points('mp', E).find(p => p.e.sym === 'C').kind, 'sub');
  assert.ok(!points('mp', E).some(p => p.e.sym === 'He'), 'helium never freezes: no dot');
  assert.deepEqual(syms(callout('mp', 'cold').anchors), ['Ne', 'Ar', 'Kr', 'Xe', 'Rn']);
});

test('patterns: boiling point — helium boils first, rhenium last', () => {
  const f = F('bp');
  assert.equal(f.params.low.e.sym, 'He');
  assert.equal(Math.round(f.params.low.y + 273.15), 4);
  assert.equal(f.params.top.e.sym, 'Re');
});

test('patterns: heft — osmium is the densest measured element; gases weighed at 20 °C', () => {
  const f = F('density');
  assert.equal(f.params.top.e.sym, 'Os');
  assert.equal(fmtPoint('density', f.params.au), '19.3\u00a0kg');
  assert.equal(fmtPoint('density', f.params.he), '0.17\u00a0g');
  assert.ok(f.params.he.kind === 'gas' && isGasAtRoom(E[1]));
  assert.ok(AIR_G_PER_L / (f.params.he.y * 1000) > 7, 'helium is about 7 times lighter than air');
  assert.ok(callout('density', 'gases').anchors.length >= 10);
});

test('patterns: atom size — every row starts with its biggest atom; helium is the smallest', () => {
  assert.deepEqual(syms(callout('rCov', 'start').anchors), ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr']);
  assert.equal(sym(callout('rCov', 'smallest').lead), 'He');
  // atoms that only touch are bigger than when they bond (the rVdw answer)
  for (const e of E) if (e.f.rVdw[0] != null && e.f.rCov[0] != null) assert.ok(e.f.rVdw[0] > e.f.rCov[0], e.sym);
  assert.equal(sym(callout('rVdw', 'biggest').lead), 'Cs');
  assert.equal(sym(callout('rVdw', 'smallest').lead), 'H');
});

test('patterns: grip — noble gases hold hardest, soft reactive metals let go, dips after Be and N', () => {
  const f = F('ie1');
  assert.deepEqual(syms(callout('ie1', 'hold').anchors), ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn']);
  assert.deepEqual(syms(callout('ie1', 'loose').anchors), ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr']);
  const dips = callout('ie1', 'dips');
  assert.deepEqual(syms(dips.anchors), ['B', 'O']);
  assert.deepEqual([sym(dips.params.a), sym(dips.params.b)], ['Be', 'N']);
  assert.ok(f.params.neSecond, 'neon holds on harder than any atom except helium');
  assert.equal(fmtPoint('ie1', f.params.na), '5.14\u00a0eV');
});

test('patterns: pull, appetite, felt pull', () => {
  assert.equal(F('en').params.top.e.sym, 'F');
  assert.equal(fmtPoint('en', F('en').params.top), '3.98');
  assert.equal(F('ea').params.top.e.sym, 'Cl');
  assert.deepEqual(syms(callout('ea', 'salt').anchors), ['F', 'Cl', 'Br', 'I', 'At']);
  assert.deepEqual(syms(callout('zeff', 'climb').anchors), ['Ne', 'Ar', 'Kr']);
  assert.ok(callout('zeff', 'drop'));
});

test('patterns: weight steps back from argon to potassium; crust; discovery', () => {
  const back = callout('aw', 'back');
  assert.deepEqual([sym(back.params.a), sym(back.params.b)], ['Ar', 'K']);
  assert.deepEqual(syms(back.anchors), ['K', 'Ni', 'I', 'Pa']);
  const a = F('abund').params;
  assert.ok(a.feGold > 1e7 && a.feGold < 2e7, `iron/gold ${a.feGold}`);
  assert.equal(Math.round(a.pct), 74);
  const y = F('year').params;
  assert.equal(y.first.e.sym, 'P'); assert.equal(y.first.y, 1669);
  assert.equal(y.last.e.sym, 'Ts');
  assert.equal(y.ancient, 11);
});

test('patterns: every string in English and Vietnamese', () => {
  const en = STRINGS.en, vi = STRINGS.vi;
  for (const id of ALL) {
    for (const k of ['q', 'a', 'axis', 'cap']) { assert.ok(en[`patterns.${id}.${k}`], `en ${id}.${k}`); assert.ok(vi[`patterns.${id}.${k}`], `vi ${id}.${k}`); }
    for (const c of F(id).callouts) { assert.ok(en[`patterns.${id}.c.${c.key}`], `en ${id}.c.${c.key}`); assert.ok(vi[`patterns.${id}.c.${c.key}`], `vi ${id}.c.${c.key}`); }
  }
  const missing = Object.keys(en).filter(k => (k.startsWith('patterns.') || k.startsWith('compare.')) && !(k in vi));
  assert.deepEqual(missing, []);
});

test('patterns: every hook names sources that exist', () => {
  for (const [id, keys] of Object.entries(PATTERN_REFS)) {
    assert.ok(keys.length, id);
    for (const k of keys) {
      const r = REFS[k];
      assert.ok(r, `${id}: ${k}`);
      if (r.data) assert.ok(D.sources[r.data], `${k} -> data source ${r.data}`);
      else assert.match(r.url, /^https:\/\//, k);
    }
  }
});

test('patterns: the row claims name the rows they hold in', () => {
  // the noble gas is the coldest of its row in rows 2–6 (helium never freezes; oganesson is a prediction)
  const cold = callout('mp', 'cold');
  assert.deepEqual(syms(cold.anchors), ['Ne', 'Ar', 'Kr', 'Xe', 'Rn']);
  assert.equal(cold.params.rows, '2–6');
  assert.equal(cold.rows, true);
  assert.equal(callout('bp', 'cold').params.rows, '1–6'); // helium boils first in row 1 too
  assert.equal(callout('ea', 'salt').params.rows, '2–6');
  // row claims step aside down the columns; the facts about one element stay
  assert.equal(callout('mp', 'top').rows, false);
});

test('patterns: down a column, its first and last measured members', () => {
  const c = columnFacts('rCov', E, 11); // sodium's column
  assert.equal(c.first.e.sym, 'H');
  assert.equal(c.last.e.sym, 'Fr');
  assert.ok(c.first.y < c.last.y); // atoms grow down the column
  const g = columnFacts('ie1', E, 55);
  assert.ok(g.first.y > g.last.y); // and let go more easily
  assert.equal(columnFacts('rCov', E, 58), null); // the f-block has no column number
});

test('patterns: only the periodic properties claim the repeating wave; units never part from numbers', () => {
  assert.ok(PERIODIC.includes('mp') && PERIODIC.includes('ie1'));
  for (const id of ['year', 'abund', 'aw']) assert.ok(!PERIODIC.includes(id), id);
  for (const id of ALL) for (const p of points(id, E).slice(0, 40)) assert.ok(!/\d [a-z°]/.test(fmtPoint(id, p)), `${id} ${fmtPoint(id, p)}`);
  const au = points('abund', E).find(p => p.e.sym === 'Au');
  assert.equal(fmtPoint('abund', au), '0.004\u00a0g per tonne');
  // as precise as the source: chlorine melts at 171.6 K, so a tenth of a degree; iron at 1811 K, whole degrees
  assert.equal(fmtPoint('mp', points('mp', E).find(p => p.e.sym === 'Cl')), '−101.5\u00a0°C');
});

test('patterns: down the columns, every claim the column words make holds in the data', () => {
  const val = (id, s) => { const p = points(id, E).find(x => x.e.sym === s && !x.pred && x.kind === 'value'); assert.ok(p, `${id} ${s}`); return p.y; };
  const falls = (id, list) => list.slice(1).every((s, i) => val(id, s) < val(id, list[i]));
  const rises = (id, list) => list.slice(1).every((s, i) => val(id, s) > val(id, list[i]));
  const alkali = ['Li', 'Na', 'K', 'Rb', 'Cs'], halogens = ['F', 'Cl', 'Br', 'I'], noble = ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'];
  // melting: the soft, reactive metals melt lower at every step down, the salt-makers higher
  assert.ok(falls('mp', alkali)); assert.ok(rises('mp', halogens));
  // boiling: the noble gases boil higher at every step, the soft, reactive metals lower
  assert.ok(rises('bp', noble)); assert.ok(falls('bp', alkali));
  // pull: fluorine to iodine weakens; "most columns": top beats bottom in most columns
  assert.ok(falls('en', halogens));
  const byGroup = id => { const m = new Map(); for (const p of points(id, E)) { const g = p.e.f.group[0]; if (!g || p.pred || p.kind !== 'value') continue; if (!m.has(g)) m.set(g, []); m.get(g).push(p); } return [...m.values()].filter(l => l.length >= 2).map(l => l.sort((a, b) => a.Z - b.Z)); };
  const enCols = byGroup('en'), weaker = enCols.filter(l => l[l.length - 1].y < l[0].y).length;
  assert.ok(weaker > enCols.length / 2, `${weaker} of ${enCols.length}`);
  // heft: every column ends heavier than it starts
  for (const l of byGroup('density')) assert.ok(l[l.length - 1].y > l[0].y, `${l[0].e.sym}…${l[l.length - 1].e.sym}`);
  // felt pull: grows down every column
  for (const l of byGroup('zeff')) assert.ok(l[l.length - 1].y > l[0].y, `zeff ${l[0].e.sym}…${l[l.length - 1].e.sym}`);
  assert.ok(rises('zeff', alkali));
});
