// Patterns and Side by side: the words rest on the data. Every hook's premise (tungsten melts hottest,
// osmium is the densest measured element, chlorine is the most eager…) is checked here against
// data/elements.json, so a change in the data that breaks a sentence fails the tests instead of shipping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL, TOP, MORE, facts, points, fmtPoint, isGasAtRoom, AIR_G_PER_L } from '../src/app/places/patternSpecs.js';
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
  assert.equal(fmtPoint('mp', f.params.top), '3,422 °C');
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
  assert.equal(fmtPoint('density', f.params.au), '19.3 kg');
  assert.equal(fmtPoint('density', f.params.he), '0.17 g');
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
  assert.equal(fmtPoint('ie1', f.params.na), '5.14 eV');
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
