// Quiz: skill model rules and the question bank (every generated question must be well-formed and
// its right answer must agree with the data).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// the app modules read the embedded dataset from the page; give them the same JSON
globalThis.document = { getElementById: () => ({ textContent: fs.readFileSync(new URL('../data/elements.json', import.meta.url), 'utf8') }), documentElement: {} };
const { loadData, byZ, bySym, stateAt } = await import('../src/app/data.js');
const { setLang, STRINGS } = await import('../src/app/i18n.js');
const { SKILLS, blankSkills, record, tierFor, pickSkill, loadSkills, saveSkills } = await import('../src/app/quiz/skills.js');
const { FAMILIES, makeItem, answerText, fillingSubshell, newestSub, roomPhase, ROOM } = await import('../src/app/quiz/bank.js');
const { QUIZ_KEYS, QUIZ_VI_KEYS } = await import('../src/app/quiz/text.js');
loadData();

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test('skills: levels follow SPEC (0 unseen … 3 alone … 5 predicts) and never drop', () => {
  const sk = blankSkills();
  assert.equal(sk.trends.lvl, 0);
  assert.deepEqual(record(sk, 'trends', 1, 'missed'), { from: 0, to: 1 });
  assert.deepEqual(record(sk, 'trends', 1, 'helped'), { from: 1, to: 2 });
  record(sk, 'trends', 1, 'alone');
  assert.equal(sk.trends.lvl, 2);
  record(sk, 'trends', 1, 'alone');
  assert.equal(sk.trends.lvl, 3, 'two first-try answers in a row = solves alone');
  record(sk, 'trends', 3, 'alone');
  assert.equal(sk.trends.lvl, 4, 'harder item, third in a row');
  record(sk, 'trends', 1, 'missed');
  assert.equal(sk.trends.lvl, 4, 'a miss never lowers a level');
  record(sk, 'trends', 3, 'alone');
  assert.equal(sk.trends.lvl, 5, 'a prediction after level 4 = predicts new cases');
  assert.equal(tierFor(0), 1); assert.equal(tierFor(3), 2); assert.equal(tierFor(4), 3);
  // the least-practised skill comes next, not the one just asked
  const s2 = blankSkills(); for (const k of SKILLS) s2[k].lvl = 3; s2.states.lvl = 1; s2.crystals.lvl = 1;
  for (let i = 0; i < 20; i++) assert.equal(pickSkill(s2, 'crystals', rng(i)), 'states');
  // storage round trip with a fake store; garbage is ignored
  const mem = new Map(); const store = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  saveSkills(sk, store);
  assert.equal(loadSkills(store).trends.lvl, 5);
  mem.set('pt3d.skills.v1', '{"trends":{"lvl":99},"x":1}');
  assert.equal(loadSkills(store).trends.lvl, 5, 'clamped to 0–5');
  mem.set('pt3d.skills.v1', 'not json');
  assert.equal(loadSkills(store).table.lvl, 0);
});

test('quiz text: every English key has a Vietnamese one', () => {
  const missing = QUIZ_KEYS.filter(k => !QUIZ_VI_KEYS.includes(k));
  assert.deepEqual(missing, []);
});

test('bank: every family makes well-formed questions whose answers match the data', () => {
  let made = 0;
  for (const lang of ['en', 'vi']) {
    setLang(lang);
    for (const [skill, tiers] of Object.entries(FAMILIES)) {
      for (const [tier, fams] of Object.entries(tiers)) {
        for (const fam of fams) {
          let ok = 0;
          for (let i = 0; i < 60; i++) {
            const it = fam(rng(1000 * i + fam.name.length));
            if (!it) continue;
            ok++; made++;
            const where = `${skill}/${fam.name}/${it.id} (${lang})`;
            assert.equal(it.skill, skill, where); assert.equal(it.tier, +tier, where);
            const q = it.q();
            assert.ok(q && !/\{\w+\}|undefined|NaN|null/.test(q), `${where}: question text "${q}"`);
            assert.ok(['table', 'atom', 'sample', 'trends', 'compare'].includes(it.stage.view), where);
            if (it.kind === 'choice') {
              const ids = it.choices.map(c => c.id);
              assert.equal(new Set(ids).size, ids.length, `${where}: duplicate choice ids`);
              assert.ok(it.choices.filter(c => c.ok).length >= 1, `${where}: no right choice`);
              assert.ok(it.choices.length >= 2 && it.choices.length <= 4, `${where}: ${it.choices.length} choices`);
              const labels = it.choices.map(c => c.label());
              assert.equal(new Set(labels).size, labels.length, `${where}: duplicate labels ${labels}`);
              for (const l of labels) assert.ok(l && !/\{\w+\}|undefined|NaN/.test(l), `${where}: label "${l}"`);
            } else {
              assert.equal(it.kind, 'tap', where);
              assert.ok(it.target.length >= 1 && it.target.every(Z => it.ok(Z)), `${where}: every target must be accepted`);
            }
            const ans = answerText(it);
            assert.ok(ans && !/undefined|NaN/.test(ans), `${where}: answer "${ans}"`);
            // the guiding question for a wrong first answer
            const wrong = it.kind === 'choice' ? it.choices.find(c => !c.ok)?.id : '1';
            const h = it.hint(wrong);
            assert.ok(h, `${where}: no hint`);
            const hq = h.q();
            assert.ok(hq && !/\{\w+\}|undefined|NaN/.test(hq), `${where}: hint "${hq}"`);
            if (h.kind === 'choice') assert.ok(h.choices.some(c => c.ok), `${where}: hint without a right choice`);
            else assert.ok(h.target.every(Z => h.ok(Z)), `${where}: hint target`);
            const then = h.then();
            assert.ok(then && !/\{\w+\}|undefined|NaN/.test(then), `${where}: then "${then}"`);
            const x = it.explain({ tapped: it.kind === 'tap' ? it.target[0] : null });
            assert.ok(x && !/\{\w+\}|undefined|NaN/.test(x), `${where}: explanation "${x}"`);
            const rv = typeof it.reveal === 'function' ? it.reveal({}) : it.reveal;
            assert.ok(rv && rv.view, `${where}: reveal`);
          }
          assert.ok(ok > 0, `${skill}/${fam.name}: never produced a question`);
        }
      }
    }
  }
  setLang('en');
  assert.ok(made > 500, `only ${made} questions made`);
});

test('bank: facts behind the hand-written questions come from the data', () => {
  setLang('en');
  const one = (fam, seed = 1) => fam(rng(seed));
  const right = it => it.choices.filter(c => c.ok).map(c => c.id);
  // element 119: rows start in column 1 → column 1
  assert.deepEqual(right(one(FAMILIES.table[3][0])), ['1']);
  // shell 5 could hold 2·5² = 50 electrons
  assert.deepEqual(right(one(FAMILIES.orbitals[3][0])), ['50']);
  // the filling order puts electron 119 in 8s
  assert.equal(fillingSubshell(119), '8s');
  assert.equal(fillingSubshell(21), '3d');
  assert.equal(fillingSubshell(19), '4s');
  // the only elements known to be liquid at 20 °C are bromine and mercury
  const liq = FAMILIES.states[2].find(f => f.name === 'liq')();
  assert.deepEqual(liq.target.slice().sort((a, b) => a - b), [35, 80]);
  // helium never freezes at 1 atm: answer "no"
  assert.deepEqual(right(FAMILIES.states[3].find(f => f.name === 'he')()), ['n']);
  // carbon sublimes
  assert.deepEqual(right(FAMILIES.states[3].find(f => f.name === 'sub')()), ['subl']);
  // diamond has 4 neighbours, graphite 3
  assert.deepEqual(right(FAMILIES.crystals[2].find(f => f.name === 'carbon')()), ['d']);
  // iron: bcc at room temperature, fcc (γ) above 912 °C
  assert.equal(roomPhase(bySym('Fe')).proto, 'bcc');
  for (let i = 0; i < 200; i++) {
    const it = FAMILIES.crystals[2].find(f => f.name === 'tr')(rng(i));
    if (it && it.id === 'tr:26') { assert.deepEqual(right(it), ['fcc']); break; }
  }
  // newest electron: iron's goes into 3d, gallium's into 4p
  assert.deepEqual(newestSub(bySym('Fe')), { n: 3, l: 2 });
  assert.deepEqual(newestSub(bySym('Ga')), { n: 4, l: 1 });
  // room-temperature states used by the quiz agree with the app
  for (let i = 0; i < 100; i++) {
    const it = FAMILIES.states[1][0](rng(i));
    const Z = +it.id.split(':')[1];
    assert.deepEqual(right(it), [stateAt(byZ(Z), ROOM).s]);
  }
});

test('makeItem: finds a question for every skill and tier, and avoids recent ones', () => {
  for (const skill of SKILLS) for (const tier of [1, 2, 3]) assert.ok(makeItem(skill, tier, rng(tier)), `${skill} tier ${tier}`);
  const seen = new Set();
  for (let i = 0; i < 12; i++) { const it = makeItem('trends', 1, rng(i + 7), seen); seen.add(it.id); }
  assert.ok(seen.size >= 10, `only ${seen.size} different trend questions in 12 draws`);
  assert.ok(STRINGS.en['q.findZ'] && STRINGS.vi['q.findZ']);
});
