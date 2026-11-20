// Question bank for the Socratic quiz (SPEC §2). The questions are hand-written templates (wording
// in quiz/text.js); every value, name and right answer is read from the element data when a
// question is made, so the quiz can never disagree with the rest of the app. A template is only
// used where the data actually shows the pattern it teaches (e.g. "bigger down a column" is only
// asked for pairs whose measured radii really grow by ≥ 10 %).
// Each question carries: a smaller guiding question for a miss (with the stage that shows the
// clue), an explanation, and a "reveal" stage that shows the answer in 3D.
import { t, getLang, cap, fmtNum } from '../i18n.js';
import { elements, byZ, name, altName, propValue, fmtProp, stateAt, fmtTemp, structText, isPred } from '../data.js';
import { L_LETTERS, capacity } from '../../physics/config.js';
// text.js registers the quiz wording (EN/VI) when imported
import { QUIZ_KEYS } from './text.js';

export const ROOM = 293.15;
export const quizKeyCount = () => QUIZ_KEYS.length;
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const supCfg = s => String(s).replace(/([spdfg])(\d+)/g, (_, l, n) => l + [...n].map(c => SUP[+c]).join(''));

// ---- words --------------------------------------------------------------------------------
// element names are common nouns: lower case mid-sentence; Vietnamese adds the familiar name ("iron (sắt)")
const nm = e => { const n = name(e).toLowerCase(), alt = altName(e); return getLang() === 'vi' && alt && alt.toLowerCase() !== n ? `${n} (${alt})` : n; };
const Nm = e => cap(nm(e));
const catW = k => t('cat.' + k).toLowerCase();
const art = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const stW = s => t('state.' + s);
const yes = () => cap(t('qz.yes')), no = () => cap(t('qz.no'));
const andList = arr => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + t('qz.and') + arr[arr.length - 1]);
const degC = K => `${fmtNum(K - 273.15, 2)} °C`;
const ch = (id, label, ok, extra) => ({ id: String(id), label: typeof label === 'function' ? label : () => String(label), ok: !!ok, ...extra });

// ---- data helpers -------------------------------------------------------------------------
const P = e => e.f.period[0], G = e => e.f.group[0], CAT = e => e.f.cat[0], BLK = e => e.f.block[0];
const num = (e, k) => { const v = propValue(e, k); return v && !isPred(v) ? v[0] : null; };
const all = () => elements();
const rowOf = p => all().filter(e => P(e) === p);
const colOf = g => all().filter(e => G(e) === g).sort((a, b) => a.Z - b.Z);
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MAIN = [1, 2, 13, 14, 15, 16, 17, 18];
const CATS = ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'metalloid', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide'];
const METALS = new Set(['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide']);
const NONMETALS = new Set(['nonmetal', 'halogen', 'noble-gas']);
const rCovText = e => fmtProp('rCov', propValue(e, 'rCov'));

/** The crystal form at room temperature (the phase whose temperature range contains 20 °C). */
export function roomPhase(e) {
  const ph = e.lat?.phases;
  if (!ph) return null;
  return ph.find(p => p.T && ROOM >= p.T[0] && ROOM < (p.T[1] ?? Infinity)) || ph.find(p => p.id === e.lat.def) || null;
}
/** The subshell that gains an electron going from Z−1 to Z (same rule as the Atom view). */
export function newestSub(e) {
  if (e.Z === 1) return { n: 1, l: 0 };
  const prev = new Map(byZ(e.Z - 1).cfg.map(([n, l, o]) => [n * 10 + l, o]));
  const gained = e.cfg.filter(([n, l, o]) => o > (prev.get(n * 10 + l) || 0)).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  return gained.length ? { n: gained[0][0], l: gained[0][1] } : null;
}
/** Subshell that the Z-th electron enters by the (n + l, then n) filling rule — works beyond 118. */
export function fillingSubshell(Z) {
  const order = [];
  for (let n = 1; n <= 9; n++) for (let l = 0; l < n && l <= 4; l++) order.push([n, l]);
  order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[0] - b[0]);
  let left = Z;
  for (const [n, l] of order) { left -= capacity(l); if (left <= 0) return `${n}${L_LETTERS[l]}`; }
  return null;
}

// ---- stages (what the 3D view shows) ---------------------------------------------------------
const tableStage = (o = {}) => ({ view: 'table', ...o });
const atomStage = Z => ({ view: 'atom', Z, orbital: null, density: 'orbital' });
const sampleStage = (Z, T = ROOM, allotrope = null) => ({ view: 'sample', Z, T, allotrope });
const compareStage = (Z, Z2, cmpR = 'cov') => ({ view: 'compare', Z, Z2, cmpR });
const trendsStage = (prop, Z, trendLine = 'period') => ({ view: 'trends', prop, Z, trendLine, log: false });

// =============================================================================================
// Finding your way in the table
// =============================================================================================
function findZ(r) {
  const e = pick(r, all().filter(x => x.Z <= 86 && x.fIndex == null));
  const p = P(e), first = rowOf(p)[0];
  if (first.Z === e.Z) return null;
  return {
    id: 'findZ:' + e.Z, skill: 'table', tier: 1, kind: 'tap',
    q: () => t('q.findZ', { Z: e.Z }),
    ok: Z => Z === e.Z, target: [e.Z], answer: () => `${e.sym} · ${nm(e)}`,
    stage: tableStage({ focus: 'frame' }),
    hint: () => ({ kind: 'tap', q: () => t('q.findZ.h', { p }), ok: Z => Z === first.Z, target: [first.Z],
      stage: tableStage({ marks: rowOf(p).map(x => x.Z), focus: 'frame' }),
      then: () => t('q.findZ.t', { Name: Nm(first), p, Z0: first.Z, Z: e.Z }) }),
    explain: () => t('q.findZ.x', { Name: Nm(e), Z: e.Z }),
    reveal: tableStage({ marks: [e.Z], focus: e.Z }),
  };
}
function row(r) {
  const e = pick(r, all().filter(x => x.Z < 100 && rowOf(P(x))[0].Z !== x.Z));
  const p = P(e), first = rowOf(p)[0];
  const opts = shuffle(r, [1, 2, 3, 4, 5, 6, 7].filter(x => x !== p)).slice(0, 3).concat(p).sort((a, b) => a - b);
  return {
    id: 'row:' + e.Z, skill: 'table', tier: 1, kind: 'choice',
    q: () => t('q.row', { name: nm(e), Name: Nm(e) }),
    choices: opts.map(x => ch(x, String(x), x === p)),
    stage: tableStage({ marks: [e.Z], focus: 'frame' }),
    hint: () => ({ kind: 'tap', q: () => t('q.row.h', { name: nm(e) }), ok: Z => Z === first.Z, target: [first.Z],
      stage: tableStage({ marks: rowOf(p).map(x => x.Z), focus: 'frame' }), then: () => t('q.row.t', { first: nm(first) }) }),
    explain: () => t('q.row.x', { Name: Nm(e), p }),
    reveal: tableStage({ marks: rowOf(p).map(x => x.Z), focus: 'frame' }),
  };
}
function col(r) {
  const e = pick(r, all().filter(x => x.Z < 104 && G(x) && colOf(G(x)).filter(y => y.Z < 104).length >= 3));
  const g = G(e), members = colOf(g).filter(x => x.Z !== e.Z);
  const opts = shuffle(r, [g - 2, g - 1, g + 1, g + 2].filter(x => x >= 1 && x <= 18)).slice(0, 3).concat(g).sort((a, b) => a - b);
  const other = members.find(x => P(x) === P(e) + 1) || members[0];
  return {
    id: 'col:' + e.Z, skill: 'table', tier: 2, kind: 'tap',
    q: () => t('q.col', { name: nm(e), Name: Nm(e) }),
    ok: Z => Z !== e.Z && G(byZ(Z)) === g, target: members.map(x => x.Z), answer: () => t('qz.anyIn', { g }),
    stage: tableStage({ marks: [e.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.col.h', { name: nm(e) }), choices: opts.map(x => ch(x, () => cap(t('qz.c.col', { g: x })), x === g)),
      stage: tableStage({ marks: [e.Z], focus: 'frame' }), then: () => t('q.col.t', { g }) }),
    explain: ctx => {
      const tz = ctx && ctx.tapped;
      const o = tz && tz !== e.Z && G(byZ(tz)) === g ? byZ(tz) : other;
      return t('q.col.x', { Name: Nm(e), other: nm(o), g });
    },
    reveal: tableStage({ marks: colOf(g).map(x => x.Z), focus: 'frame' }),
  };
}
function next(r) {
  const e = pick(r, all().filter(x => CAT(x) === 'noble-gas' && P(x) <= 6));
  const n = byZ(e.Z + 1);
  return {
    id: 'next:' + e.Z, skill: 'table', tier: 2, kind: 'tap',
    q: () => t('q.next', { Name: Nm(e), name: nm(e), Z: e.Z, Z1: n.Z }),
    ok: Z => Z === n.Z, target: [n.Z], answer: () => `${n.sym} · ${nm(n)}`,
    stage: tableStage({ marks: [e.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.next.h'),
      choices: shuffle(r, [ch('l', () => cap(t('qz.c.leftNext')), true), ch('r', () => cap(t('qz.c.rightSame')), false), ch('m', () => cap(t('qz.c.middleNext')), false)]),
      stage: tableStage({ marks: [e.Z], focus: 'frame' }), then: () => t('q.next.t') }),
    explain: () => t('q.next.x', { Name2: Nm(n), Z1: n.Z, p: P(n) }),
    reveal: tableStage({ marks: [e.Z, n.Z], focus: 'frame' }),
  };
}
function len(r) {
  const p = 2 + Math.floor(r() * 6);
  const rw = rowOf(p), n = rw.length, a = rw[0], b = rw[rw.length - 1], d = b.Z - a.Z;
  const lens = [1, 2, 3, 4, 5, 6, 7].map(x => rowOf(x).length).join(', ');
  const opts = shuffle(r, [...new Set([2, 8, 18, 32, n - 1, n + 1].filter(x => x !== n && x > 0))]).slice(0, 3).concat(n).sort((x, y) => x - y);
  const hopts = shuffle(r, [d - 1, d + 1, d + 2]).slice(0, 2).concat(d).sort((x, y) => x - y);
  return {
    id: 'len:' + p, skill: 'table', tier: 2, kind: 'choice',
    q: () => t('q.len', { p }), choices: opts.map(x => ch(x, String(x), x === n)),
    stage: tableStage({ focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.len.h', { p, a: nm(a), b: nm(b), Za: a.Z, Zb: b.Z }), choices: hopts.map(x => ch(x, String(x), x === d)),
      stage: tableStage({ marks: rw.map(x => x.Z), focus: 'frame' }), then: () => t('q.len.t', { Za: a.Z, Zb: b.Z, d, n }) }),
    explain: () => t('q.len.x', { p, n, lens }),
    reveal: tableStage({ marks: rw.map(x => x.Z), focus: 'frame' }),
  };
}
function e119() {
  // the answer is the column every row of our data starts in
  const starts = [1, 2, 3, 4, 5, 6, 7].map(p => rowOf(p)[0]);
  const g = G(starts[0]);
  if (!starts.every(s => G(s) === g)) return null;
  return {
    id: 'e119', skill: 'table', tier: 3, kind: 'choice',
    q: () => t('q.e119'), choices: [1, 2, 17, 18].map(x => ch(x, () => cap(t('qz.c.col', { g: x })), x === g)),
    stage: tableStage({ marks: [118], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.e119.h'),
      choices: [ch('1', () => cap(t('qz.c.col1')), g === 1), ch('18', () => cap(t('qz.c.col18')), g === 18), ch('m', () => cap(t('qz.c.mid')), false)],
      stage: tableStage({ marks: starts.map(s => s.Z), focus: 'frame' }), then: () => t('q.e119.t') }),
    explain: () => t('q.e119.x'),
    reveal: tableStage({ marks: [87, 118], focus: 'frame' }),
  };
}

// =============================================================================================
// Families
// =============================================================================================
function cat(r) {
  const e = pick(r, all().filter(x => x.Z < 100 && CATS.includes(CAT(x))));
  const k = CAT(e);
  const opts = shuffle(r, [k, ...shuffle(r, CATS.filter(x => x !== k)).slice(0, 3)]);
  const kind = METALS.has(k) ? 'm' : NONMETALS.has(k) ? 'n' : 'b';
  const fam = kind === 'm' ? METALS : kind === 'n' ? NONMETALS : new Set(['metalloid']);
  return {
    id: 'cat:' + e.Z, skill: 'categories', tier: 1, kind: 'choice',
    q: () => t('q.cat', { name: nm(e), Name: Nm(e) }),
    choices: opts.map(x => ch(x, () => t('cat.' + x), x === k, { swatch: x })),
    stage: tableStage({ marks: [e.Z], focus: e.Z }),
    hint: () => ({ kind: 'choice', q: () => t('q.cat.h', { name: nm(e), Name: Nm(e) }),
      choices: [ch('m', yes, kind === 'm'), ch('n', no, kind === 'n'), ch('b', () => cap(t('qz.c.between')), kind === 'b')],
      stage: tableStage({ marks: [e.Z], focus: e.Z }),
      retry: tableStage({ marks: all().filter(x => fam.has(CAT(x))).map(x => x.Z), focus: 'frame' }),
      then: () => t('q.cat.t.' + kind) }),
    explain: () => { const w = catW(k); return t('q.cat.x', { Name: Nm(e), a: art(w), cat: w }); },
    reveal: tableStage({ marks: all().filter(x => CAT(x) === k).map(x => x.Z), focus: 'frame' }),
  };
}
const WHERE = { alkali: 'left', 'alkaline-earth': 'left', halogen: 'right', 'noble-gas': 'right', transition: 'middle', lanthanide: 'bottom' };
function tapcat(r) {
  const k = pick(r, Object.keys(WHERE));
  const members = all().filter(e => CAT(e) === k && e.Z < 100), w = WHERE[k];
  return {
    id: 'tapcat:' + k, skill: 'categories', tier: 1, kind: 'tap',
    q: () => { const c = catW(k); return t('q.tapcat', { a: art(c), cat: c }); },
    ok: Z => CAT(byZ(Z)) === k, target: members.map(x => x.Z), answer: () => `${andList(members.slice(0, 3).map(nm))} …`,
    stage: tableStage({ focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.tapcat.h', { cats: t('qz.cats.' + k) }),
      choices: ['left', 'right', 'middle', 'bottom'].map(x => ch(x, () => cap(t('qz.where.' + x)), x === w)),
      stage: tableStage({ focus: 'frame' }), retry: tableStage({ marks: members.map(x => x.Z), focus: 'frame' }),
      then: () => t('q.tapcat.t', { where: t('qz.where.' + w) }) }),
    explain: ctx => {
      const tz = ctx && ctx.tapped;
      const e = tz && CAT(byZ(tz)) === k ? byZ(tz) : members[0];
      const c = catW(k);
      return t('q.tapcat.x', { Name: Nm(e), a: art(c), cat: c });
    },
    reveal: tableStage({ marks: members.map(x => x.Z), focus: 'frame' }),
  };
}
function odd(r) {
  const k = pick(r, ['alkali', 'alkaline-earth', 'halogen', 'noble-gas', 'transition']);
  const three = shuffle(r, all().filter(e => CAT(e) === k && e.Z < 100)).slice(0, 3);
  if (three.length < 3) return null;
  const cands = three.flatMap(m => [m.Z - 1, m.Z + 1]).filter(z => z >= 1 && z < 100).map(byZ).filter(x => CAT(x) !== k);
  if (!cands.length) return null;
  const oddOne = pick(r, cands);
  const opts = shuffle(r, [...three, oddOne]);
  return {
    id: `odd:${k}:${opts.map(x => x.Z).sort((a, b) => a - b).join('-')}`, skill: 'categories', tier: 2, kind: 'choice',
    q: () => { const c = catW(k); return t('q.odd', { a: art(c), cat: c }); },
    choices: opts.map(x => ch(x.Z, () => `${x.sym} · ${nm(x)}`, x === oddOne)),
    stage: tableStage({ marks: opts.map(x => x.Z), focus: 'frame' }),
    hint: wrong => {
      const w = byZ(+wrong) || three[0];
      const other = three.find(x => x.Z !== w.Z);
      return { kind: 'choice', q: () => t('q.odd.h', { pick: nm(w), Pick: Nm(w), other: nm(other) }),
        choices: [ch('y', yes, CAT(w) === CAT(other)), ch('n', no, CAT(w) !== CAT(other))],
        stage: tableStage({ marks: [w.Z, other.Z], focus: 'frame' }), retry: tableStage({ marks: opts.map(x => x.Z), focus: 'frame' }),
        then: () => t('q.odd.t') };
    },
    explain: () => { const c2 = catW(CAT(oddOne)); return t('q.odd.x', { Odd: Nm(oddOne), a2: art(c2), cat2: c2, cats: t('qz.cats.' + k) }); },
    reveal: tableStage({ marks: [oddOne.Z], focus: oddOne.Z }),
  };
}
function pcat(r) {
  const pool = all().filter(e => e.Z >= 104 && G(e)).filter(e => {
    const lighter = colOf(G(e)).filter(x => x.Z < e.Z);
    const above = lighter[lighter.length - 1];
    return above && CAT(above) === CAT(e) && lighter.filter(x => CAT(x) === CAT(e)).length >= Math.ceil(lighter.length * 0.75);
  });
  if (!pool.length) return null;
  const e = pick(r, pool), k = CAT(e), lighter = colOf(G(e)).filter(x => x.Z < e.Z), above = lighter[lighter.length - 1];
  const opts = shuffle(r, [k, ...shuffle(r, CATS.filter(x => x !== k)).slice(0, 3)]);
  return {
    id: 'pcat:' + e.Z, skill: 'categories', tier: 3, kind: 'choice',
    q: () => t('q.pcat', { name: nm(e), Name: Nm(e), Z: e.Z, g: G(e), list: andList(lighter.slice(-3).map(nm)) }),
    choices: opts.map(x => ch(x, () => t('cat.' + x), x === k, { swatch: x })),
    stage: tableStage({ marks: [e.Z], focus: e.Z }),
    hint: () => ({ kind: 'choice', q: () => t('q.pcat.h', { above: nm(above), Above: Nm(above) }),
      choices: opts.map(x => ch(x, () => t('cat.' + x), x === CAT(above), { swatch: x })),
      stage: tableStage({ marks: [above.Z, e.Z], focus: above.Z }), then: () => t('q.pcat.t') }),
    explain: () => { const w = catW(k); return t('q.pcat.x', { name: nm(e), a: art(w), cat: w, g: G(e) }); },
    reveal: tableStage({ marks: colOf(G(e)).map(x => x.Z), focus: 'frame' }),
  };
}

// =============================================================================================
// Electrons and shells
// =============================================================================================
function el(r) {
  const e = pick(r, all().filter(x => x.Z >= 3 && x.Z <= 54));
  const opts = [...new Set([e.Z, e.Z + 1, e.Z - 1, 2 * e.Z])].sort((a, b) => a - b);
  return {
    id: 'el:' + e.Z, skill: 'orbitals', tier: 1, kind: 'choice',
    q: () => t('q.el', { name: nm(e), Name: Nm(e) }), choices: opts.map(x => ch(x, String(x), x === e.Z)),
    stage: atomStage(e.Z),
    hint: () => ({ kind: 'choice', q: () => t('q.el.h'), choices: [1, 3, 6].map(x => ch(x, String(x), x === 3)),
      stage: tableStage({ marks: [e.Z], focus: e.Z }), retry: atomStage(e.Z), then: () => t('q.el.t', { Name: Nm(e), Z: e.Z }) }),
    explain: () => t('q.el.x', { name: nm(e), Z: e.Z }),
    reveal: atomStage(e.Z),
  };
}
function cap2() {
  const rw = rowOf(2), n = rw.length;
  const opts = [...new Set([2, 6, n, 18])].sort((a, b) => a - b);
  return {
    id: 'cap2', skill: 'orbitals', tier: 1, kind: 'choice', q: () => t('q.cap2'), choices: opts.map(x => ch(x, String(x), x === n)),
    stage: atomStage(10),
    hint: () => ({ kind: 'choice', q: () => t('q.cap2.h'), choices: opts.map(x => ch(x, String(x), x === n)),
      stage: tableStage({ marks: rw.map(x => x.Z), focus: 'frame' }), then: () => t('q.cap2.t', { n }) }),
    explain: () => t('q.cap2.x', { n }), reveal: atomStage(10),
  };
}
function block(r) {
  const pool = all().filter(e => e.Z < 100 && Array.isArray(e.cfg) && (() => { const s = newestSub(e); return s && L_LETTERS[s.l] === BLK(e); })());
  const e = pick(r, pool), b = BLK(e);
  const pos = { s: 'bs', p: 'bp', d: 'bd', f: 'bf' };
  return {
    id: 'block:' + e.Z, skill: 'orbitals', tier: 2, kind: 'choice',
    q: () => t('q.block', { name: nm(e), Name: Nm(e) }), choices: ['s', 'p', 'd', 'f'].map(x => ch(x, x, x === b)),
    stage: atomStage(e.Z),
    hint: () => ({ kind: 'choice', q: () => t('q.block.h', { name: nm(e), Name: Nm(e) }),
      choices: ['s', 'p', 'd', 'f'].map(x => ch(x, () => cap(t('qz.c.' + pos[x])), x === b)),
      stage: tableStage({ marks: [e.Z], focus: 'frame' }), retry: tableStage({ marks: all().filter(x => BLK(x) === b).map(x => x.Z), focus: 'frame' }),
      then: () => t('q.block.t', { b }) }),
    explain: () => t('q.block.x', { Name: Nm(e), b }), reveal: atomStage(e.Z),
  };
}
function exc(r) {
  const pool = ['Cr', 'Cu', 'Mo', 'Ag', 'Au', 'Pd'].map(s => all().find(e => e.sym === s)).filter(e => e && e.f.madelung && e.f.madelung[0] === 'exception');
  if (!pool.length) return null;
  const e = pick(r, pool);
  const real = e.f.config[0];
  const m = /predicts (.+)$/.exec((e.f.madelung[2] && e.f.madelung[2].n) || '');
  if (!m) return null;
  const pred = m[1].trim();
  const ds = [...real.matchAll(/\dd(\d+)/g)];
  const dOcc = ds.length ? +ds[ds.length - 1][1] : null;
  const kind = dOcc === 5 ? 'half' : dOcc === 10 ? 'full' : null;
  if (!kind) return null;
  // third choice: the real d count but one electron too many in s (the total gives it away)
  const sm = [...real.matchAll(/(\d)s(\d)/g)];
  const wrongTotal = sm.length ? real.replace(/(\d)s(\d)(?!.*\ds\d)/, (_, n, o) => `${n}s${+o + 1}`) : `${real} ${P(e)}s2`;
  const opts = shuffle(r, [ch('real', supCfg(real), true), ch('pred', supCfg(pred), false), ch('extra', supCfg(wrongTotal), false)]);
  return {
    id: 'exc:' + e.Z, skill: 'orbitals', tier: 2, kind: 'choice',
    q: () => t('q.exc', { name: nm(e), Name: Nm(e) }), choices: opts, stage: atomStage(e.Z),
    hint: () => ({ kind: 'choice', q: () => t('q.exc.h'), choices: opts.filter(c => c.id !== 'extra'), stage: atomStage(e.Z), then: () => t('q.exc.t', { kind: t('qz.' + kind) }) }),
    explain: () => t('q.exc.x', { pred: supCfg(pred), real: supCfg(real), kind: t('qz.' + kind) }), reveal: atomStage(e.Z),
  };
}
function n2() {
  const n = 2 * 5 * 5;
  const og = byZ(118);
  const m = og.cfg.filter(([nn]) => nn === 5).reduce((s, x) => s + x[2], 0);
  return {
    id: 'n2', skill: 'orbitals', tier: 3, kind: 'choice', q: () => t('q.n2'), choices: [40, 50, 64, 72].map(x => ch(x, String(x), x === n)),
    stage: tableStage({ focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.n2.h'), choices: [10, 25, 55].map(x => ch(x, String(x), x === 25)), stage: tableStage({ focus: 'frame' }), then: () => t('q.n2.t', { n }) }),
    explain: () => t('q.n2.x', { n, m }), reveal: tableStage({ marks: [118], focus: 118 }),
  };
}
function s8(r) {
  const s = fillingSubshell(119);
  const starts = [1, 2, 3, 4, 5, 6, 7].map(p => rowOf(p)[0].Z);
  return {
    id: 's8', skill: 'orbitals', tier: 3, kind: 'choice', q: () => t('q.s8'),
    choices: shuffle(r, ['8s', '7d', '8p', '5g']).map(x => ch(x, x, x === s)),
    stage: tableStage({ marks: [118], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.s8.h'), choices: ['7s', '8s', '1s'].map(x => ch(x, x, x === s)), stage: tableStage({ marks: starts, focus: 'frame' }), then: () => t('q.s8.t', { s }) }),
    explain: () => t('q.s8.x', { s }), reveal: tableStage({ marks: starts, focus: 'frame' }),
  };
}

// =============================================================================================
// Patterns (trends)
// =============================================================================================
function big(r) {
  const g = pick(r, MAIN);
  const c = colOf(g).filter(e => e.Z < 87 && num(e, 'rCov'));
  if (c.length < 2) return null;
  const i = Math.floor(r() * (c.length - 1)), j = i + 1 + Math.floor(r() * (c.length - 1 - i));
  const a = c[i], b = c[j];
  if (!(num(b, 'rCov') / num(a, 'rCov') >= 1.1)) return null;
  const [A, B] = r() < 0.5 ? [a, b] : [b, a];
  return {
    id: `big:${a.Z}-${b.Z}`, skill: 'trends', tier: 1, kind: 'choice',
    q: () => t('q.big', { a: nm(A), b: nm(B) }), choices: [A, B].map(x => ch(x.Z, () => cap(nm(x)), x === b)),
    stage: tableStage({ marks: [a.Z, b.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.big.h'), choices: [A, B].map(x => ch(x.Z, () => cap(nm(x)), x === b)),
      stage: tableStage({ marks: [a.Z, b.Z], focus: 'frame' }), then: () => t('q.big.t', { Low: Nm(b) }) }),
    explain: () => t('q.big.x', { Big: Nm(b), small: nm(a), rb: rCovText(b), rs: rCovText(a) }),
    reveal: compareStage(a.Z, b.Z),
  };
}
function across(r) {
  const p = 2 + Math.floor(r() * 4);
  const a = rowOf(p).find(e => G(e) === 1), b = rowOf(p).find(e => G(e) === 17);
  if (!a || !b || !(num(a, 'rCov') > num(b, 'rCov'))) return null;
  return {
    id: 'across:' + p, skill: 'trends', tier: 1, kind: 'choice',
    q: () => t('q.across', { p, a: nm(a), b: nm(b) }),
    choices: [ch('grow', () => cap(t('qz.w.grow')), false), ch('shrink', () => cap(t('qz.w.shrink')), true)],
    stage: tableStage({ marks: rowOf(p).map(x => x.Z), focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.across.h'), choices: [ch('b', () => cap(t('qz.w.bigger')), false), ch('s', () => cap(t('qz.w.smaller')), true)],
      stage: tableStage({ marks: rowOf(p).map(x => x.Z), focus: 'frame' }), then: () => t('q.across.t') }),
    explain: () => t('q.across.x', { A: Nm(a), b: nm(b), ra: rCovText(a), rb: rCovText(b) }),
    reveal: trendsStage('rCov', a.Z, 'period'),
  };
}
/** Two main-group elements in one row or one column where the smaller atom has the larger value. */
function pairFor(r, key, minRatio) {
  for (let k = 0; k < 24; k++) {
    let pool;
    if (r() < 0.5) { const p = 2 + Math.floor(r() * 4); pool = rowOf(p).filter(e => MAIN.includes(G(e))); }
    else { const g = pick(r, MAIN); pool = colOf(g).filter(e => e.Z < 87); }
    const a = pick(r, pool), b = pick(r, pool);
    if (!a || !b || a === b) continue;
    const ka = num(a, key), kb = num(b, key), ra = num(a, 'rCov'), rb = num(b, 'rCov');
    if (ka == null || kb == null || ra == null || rb == null || ra === rb) continue;
    if (Math.max(ka, kb) / Math.min(ka, kb) < minRatio) continue;
    if ((ka > kb) !== (ra < rb)) continue;
    return [a, b];
  }
  return null;
}
function pairQ(r, key, k, minRatio) {
  const pr = pairFor(r, key, minRatio);
  if (!pr) return null;
  const [a, b] = pr;
  const hi = num(a, key) > num(b, key) ? a : b, lo = hi === a ? b : a;
  const small = num(a, 'rCov') < num(b, 'rCov') ? a : b;
  return {
    id: `${key}:${Math.min(a.Z, b.Z)}-${Math.max(a.Z, b.Z)}`, skill: 'trends', tier: 2, kind: 'choice',
    q: () => t(k, { a: nm(a), b: nm(b) }), choices: [a, b].map(x => ch(x.Z, () => cap(nm(x)), x === hi)),
    stage: tableStage({ marks: [a.Z, b.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t(k + '.h'), choices: [a, b].map(x => ch(x.Z, () => cap(nm(x)), x === small)),
      stage: compareStage(a.Z, b.Z), then: () => t(k + '.t', { Small: Nm(small) }) }),
    explain: () => t(k + '.x', { Hi: Nm(hi), Lo: Nm(lo), vhi: fmtProp(key, propValue(hi, key)), vlo: fmtProp(key, propValue(lo, key)) }),
    reveal: trendsStage(key, hi.Z, G(a) === G(b) ? 'group' : 'period'),
  };
}
const ie = r => pairQ(r, 'ie1', 'q.ie', 1.15);
const en = r => pairQ(r, 'en', 'q.en', 1.12);
function pg(r) {
  const g = pick(r, MAIN);
  const c = colOf(g).filter(e => e.Z < 87 && num(e, 'rCov'));
  if (c.length < 3) return null;
  const i = Math.floor(r() * (c.length - 2));
  const [a, b, d] = c.slice(i, i + 3);
  if (!(num(a, 'rCov') < num(b, 'rCov') && num(b, 'rCov') < num(d, 'rCov'))) return null;
  return {
    id: 'pg:' + d.Z, skill: 'trends', tier: 3, kind: 'choice',
    q: () => t('q.pg', { g, a: nm(a), b: nm(b), c: nm(d), va: rCovText(a), vb: rCovText(b) }),
    choices: [ch('big', () => cap(t('qz.w.bigger')), true), ch('small', () => cap(t('qz.w.smaller')), false)],
    stage: tableStage({ marks: [a.Z, b.Z, d.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.pg.h', { c: nm(d), C: Nm(d), b: nm(b) }),
      choices: [ch('above', () => cap(t('qz.w.above')), false), ch('below', () => cap(t('qz.w.below')), true)],
      stage: tableStage({ marks: [b.Z, d.Z], focus: 'frame' }), then: () => t('q.pg.t') }),
    explain: () => t('q.pg.x', { C: Nm(d), vc: rCovText(d) }),
    reveal: compareStage(b.Z, d.Z),
  };
}
function pp(r) {
  const p = 2 + Math.floor(r() * 4);
  const rw = rowOf(p).filter(e => MAIN.includes(G(e)) && G(e) <= 17 && num(e, 'rCov')).sort((x, y) => x.Z - y.Z);
  const triples = [];
  for (let i = 0; i + 2 < rw.length; i++) {
    const [a, b, d] = rw.slice(i, i + 3);
    if (b.Z === a.Z + 1 && d.Z === b.Z + 1 && num(a, 'rCov') > num(b, 'rCov') && num(b, 'rCov') > num(d, 'rCov')) triples.push([a, b, d]);
  }
  if (!triples.length) return null;
  const [a, b, d] = pick(r, triples);
  return {
    id: 'pp:' + d.Z, skill: 'trends', tier: 3, kind: 'choice',
    q: () => t('q.pp', { p, a: nm(a), b: nm(b), c: nm(d), va: rCovText(a), vb: rCovText(b) }),
    choices: [ch('big', () => cap(t('qz.w.bigger')), false), ch('small', () => cap(t('qz.w.smaller')), true)],
    stage: tableStage({ marks: [a.Z, b.Z, d.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.pp.h', { c: nm(d), C: Nm(d), b: nm(b) }),
      choices: [ch('l', () => cap(t('qz.w.left')), false), ch('r', () => cap(t('qz.w.right')), true)],
      stage: tableStage({ marks: [b.Z, d.Z], focus: 'frame' }), then: () => t('q.pp.t') }),
    explain: () => t('q.pp.x', { C: Nm(d), vc: rCovText(d) }),
    reveal: compareStage(b.Z, d.Z),
  };
}

// =============================================================================================
// Solid, liquid, gas
// =============================================================================================
const known = (e, T) => { const s = stateAt(e, T); return s.s !== 'unknown' && !s.p ? s.s : null; };
function room(r) {
  const pool = all().filter(e => e.Z < 100 && !e.ph.sub && known(e, ROOM) && (e.ph.noSolid || (e.ph.mp && e.ph.mp[0] != null)) && e.ph.bp && e.ph.bp[0] != null);
  const e = pick(r, pool), st = known(e, ROOM);
  const mp = e.ph.mp ? e.ph.mp[0] : null, bp = e.ph.bp[0];
  const colder = () => cap(t('qz.w.colder')), hotter = () => cap(t('qz.w.hotter'));
  const h = st === 'solid' ? { q: () => t('q.room.h.s', { Name: Nm(e), mp: fmtTemp(mp) }), choices: [ch('c', colder, true), ch('h', hotter, false)], then: () => t('q.room.t.s') }
    : st === 'gas' ? { q: () => t('q.room.h.g', { Name: Nm(e), bp: fmtTemp(bp) }), choices: [ch('c', colder, false), ch('h', hotter, true)], then: () => t('q.room.t.g') }
      : { q: () => t('q.room.h.l', { Name: Nm(e), mp: fmtTemp(mp), bp: fmtTemp(bp) }), choices: [ch('y', yes, true), ch('n', no, false)], then: () => t('q.room.t.l') };
  return {
    id: 'room:' + e.Z, skill: 'states', tier: 1, kind: 'choice',
    q: () => t('q.room', { name: nm(e) }), choices: ['solid', 'liquid', 'gas'].map(s => ch(s, () => cap(stW(s)), s === st)),
    stage: tableStage({ marks: [e.Z], focus: e.Z }),
    hint: () => ({ kind: 'choice', ...h, stage: tableStage({ marks: [e.Z], focus: e.Z }) }),
    explain: () => { const w = stW(st); return t('q.room.x', { name: nm(e), a: art(w), state: w }); },
    reveal: sampleStage(e.Z, ROOM),
  };
}
function heat(r) {
  const pool = all().filter(e => e.Z < 100 && e.lat.kind === 'lattice' && !e.ph.sub && !e.ph.noSolid && e.ph.mp && e.ph.bp && e.ph.mp[0] != null && e.ph.bp[0] != null && !isPred(e.ph.mp) && !isPred(e.ph.bp));
  const e = pick(r, pool), mp = e.ph.mp[0], bp = e.ph.bp[0];
  const want = pick(r, ['solid', 'liquid', 'gas']);
  let T;
  if (want === 'solid') { if (mp < 500) return null; T = Math.round((mp * 0.6) / 100) * 100; }
  else if (want === 'liquid') { const lo = mp * 1.08, hi = bp * 0.92; if (hi <= lo) return null; T = Math.round((lo + hi) / 200) * 100; if (T <= lo || T >= hi) T = Math.round((lo + hi) / 2); }
  else { T = Math.ceil((bp * 1.12) / 100) * 100; if (T > 6000) return null; }
  const st = known(e, T);
  if (st !== want) return null;
  const where = want === 'solid' ? 'below' : want === 'liquid' ? 'between2' : 'above';
  return {
    id: `heat:${e.Z}:${want}`, skill: 'states', tier: 2, kind: 'choice',
    q: () => t('q.heat', { name: nm(e), T: fmtTemp(T) }), choices: ['solid', 'liquid', 'gas'].map(s => ch(s, () => cap(stW(s)), s === st)),
    stage: sampleStage(e.Z, ROOM),
    hint: () => ({ kind: 'choice', q: () => t('q.heat.h', { Name: Nm(e), mp: fmtTemp(mp), bp: fmtTemp(bp), T: fmtTemp(T) }),
      choices: ['below', 'between2', 'above'].map(w => ch(w, () => cap(t('qz.c.' + w)), w === where)),
      stage: sampleStage(e.Z, ROOM), then: () => t('q.heat.t', { T: fmtTemp(T), where: t('qz.c.' + where) }) }),
    explain: () => { const w = stW(st); return t('q.heat.x', { T: fmtTemp(T), name: nm(e), a: art(w), state: w }); },
    reveal: sampleStage(e.Z, T),
  };
}
function liq() {
  const liquids = all().filter(e => known(e, ROOM) === 'liquid');
  if (!liquids.length) return null;
  const m = liquids[0];
  return {
    id: 'liq', skill: 'states', tier: 2, kind: 'tap',
    q: () => t('q.liq', { n: liquids.length }), ok: Z => liquids.some(x => x.Z === Z), target: liquids.map(x => x.Z),
    answer: () => andList(liquids.map(nm)),
    stage: tableStage({ focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.liq.h', { M: Nm(m), mp: fmtTemp(m.ph.mp[0]) }), choices: [ch('y', yes, m.ph.mp[0] < ROOM), ch('n', no, m.ph.mp[0] >= ROOM)],
      stage: tableStage({ marks: [m.Z], focus: m.Z }), retry: tableStage({ color: 'state', T: ROOM, focus: 'frame' }), then: () => t('q.liq.t', { m: nm(m) }) }),
    explain: () => t('q.liq.x', { list: cap(andList(liquids.map(nm))) }),
    reveal: tableStage({ marks: liquids.map(x => x.Z), color: 'state', T: ROOM, focus: 'frame' }),
  };
}
function warm(r) {
  const T = 308.15; // a 35 °C summer day
  const pool = all().filter(e => e.Z < 100 && e.lat.kind === 'lattice' && e.ph.mp && e.ph.mp[0] > ROOM && e.ph.mp[0] < 360 && !isPred(e.ph.mp));
  if (!pool.length) return null;
  const e = pick(r, pool), mp = e.ph.mp[0], st = known(e, T);
  if (st !== 'solid' && st !== 'liquid') return null;
  const hot = T > mp ? '35 °C' : degC(mp);
  return {
    id: 'warm:' + e.Z, skill: 'states', tier: 3, kind: 'choice',
    q: () => t('q.warm', { Name: Nm(e), name: nm(e), mp: fmtTemp(mp) }), choices: ['solid', 'liquid'].map(s => ch(s, () => cap(stW(s)), s === st)),
    stage: tableStage({ marks: [e.Z], focus: e.Z }),
    hint: () => ({ kind: 'choice', q: () => t('q.warm.h', { mpC: degC(mp) }), choices: [ch('35', '35 °C', T > mp), ch('mp', degC(mp), mp > T)],
      stage: tableStage({ marks: [e.Z], focus: e.Z }), then: () => t('q.warm.t', { hot }) }),
    explain: () => { const w = stW(st); return t('q.warm.x', { name: nm(e), a: art(w), state: w }); },
    reveal: sampleStage(e.Z, T),
  };
}
function he() {
  const e = byZ(2);
  if (!e.ph.noSolid || known(e, 2) !== 'liquid') return null;
  return {
    id: 'he', skill: 'states', tier: 3, kind: 'choice', q: () => t('q.he'), choices: [ch('y', yes, false), ch('n', no, true)],
    stage: tableStage({ marks: [2], focus: 2 }),
    hint: () => ({ kind: 'choice', q: () => t('q.he.h', { bp: fmtTemp(e.ph.bp[0]) }), choices: [ch('y', yes, false), ch('n', no, true)], stage: sampleStage(2, 2), then: () => t('q.he.t') }),
    explain: () => t('q.he.x'), reveal: sampleStage(2, 2),
  };
}
function sub() {
  const e = byZ(6), s = e.ph.sub && e.ph.sub[0];
  if (!s || (e.ph.mp && e.ph.mp[0] != null)) return null;
  return {
    id: 'sub', skill: 'states', tier: 3, kind: 'choice', q: () => t('q.sub'),
    choices: [ch('subl', () => cap(t('qz.c.subl')), true), ch('melt', () => cap(t('qz.c.melt1000')), false), ch('never', () => cap(t('qz.c.never')), false)],
    stage: sampleStage(6, ROOM),
    hint: () => ({ kind: 'choice', q: () => t('q.sub.h'), choices: [ch('y', yes, false), ch('n', no, true)], stage: sampleStage(6, ROOM), then: () => t('q.sub.t') }),
    explain: () => t('q.sub.x', { sub: fmtTemp(s) }), reveal: sampleStage(6, Math.ceil((s * 1.05) / 100) * 100),
  };
}

// =============================================================================================
// Crystals
// =============================================================================================
const CN = { bcc: 8, fcc: 12, diamond: 4 };
const CN_HINT = { bcc: [4, 6, 8], fcc: [8, 10, 12], diamond: [3, 4, 5] };
function cn(r) {
  const pool = all().filter(e => e.Z < 100 && e.lat.kind === 'lattice' && known(e, ROOM) === 'solid' && (() => { const ph = roomPhase(e); return ph && CN[ph.proto] === ph.cn; })());
  const e = pick(r, pool), ph = roomPhase(e), n = ph.cn;
  return {
    id: 'cn:' + e.Z, skill: 'crystals', tier: 1, kind: 'choice',
    q: () => t('q.cn', { name: nm(e) }), choices: [4, 6, 8, 12].map(x => ch(x, String(x), x === n)),
    stage: sampleStage(e.Z, ROOM),
    hint: () => ({ kind: 'choice', q: () => t('q.cn.h.' + ph.proto), choices: CN_HINT[ph.proto].map(x => ch(x, String(x), x === n)), stage: sampleStage(e.Z, ROOM), then: () => t('q.cn.t', { n }) }),
    explain: () => t('q.cn.x', { Name: Nm(e), struct: structText(ph.name), n }), reveal: sampleStage(e.Z, ROOM),
  };
}
function tr(r) {
  const OK = { bcc: 8, fcc: 12, hcp: 12 };
  const pool = all().filter(e => e.Z < 100 && e.lat.kind === 'lattice' && e.lat.phases && e.lat.phases.length >= 2 && e.ph.mp && e.ph.mp[0] != null).map(e => {
    const [p0, p1] = e.lat.phases;
    if (!p0.T || !p1.T || OK[p0.proto] !== p0.cn || OK[p1.proto] !== p1.cn || p1.card || p1.proto === p0.proto) return null;
    if (!(p1.T[0] < e.ph.mp[0])) return null;
    return { e, p0, p1 };
  }).filter(Boolean);
  if (!pool.length) return null;
  const { e, p0, p1 } = pick(r, pool);
  const top = Math.min(p1.T[1] ?? e.ph.mp[0], e.ph.mp[0]);
  const Tshow = Math.round(Math.min((p1.T[0] + top) / 2, e.ph.mp[0] * 0.97));
  const pats = { 8: 'qz.c.p8', 12: 'qz.c.p12', 4: 'qz.c.p4' };
  return {
    id: 'tr:' + e.Z, skill: 'crystals', tier: 2, kind: 'choice',
    q: () => t('q.tr', { Name: Nm(e), name: nm(e), s1: structText(p0.name), Tt: fmtTemp(p1.T[0]) }),
    choices: ['bcc', 'fcc', 'hcp'].map(s => ch(s, () => t('qz.st.' + s), s === p1.proto)),
    stage: sampleStage(e.Z, ROOM),
    hint: () => ({ kind: 'choice', q: () => t('q.tr.h', { name: nm(e), cn1: p0.cn, cn2: p1.cn }),
      choices: [8, 12, 4].map(x => ch(x, () => t(pats[x]), x === p1.cn)),
      stage: sampleStage(e.Z, ROOM), then: () => t('q.tr.t', { cn2: p1.cn, pats: t(pats[p1.cn]) }) }),
    explain: () => t('q.tr.x', { Tt: fmtTemp(p1.T[0]), name: nm(e), label: p1.label, s2: structText(p1.name) }),
    reveal: sampleStage(e.Z, Tshow),
  };
}
function carbon() {
  const C = byZ(6);
  const g = C.lat.phases && C.lat.phases.find(p => p.proto === 'graphite'), d = C.lat.phases && C.lat.phases.find(p => p.proto === 'diamond');
  if (!g || !d || d.cn !== 4 || g.cn === 4) return null;
  return {
    id: 'carbon', skill: 'crystals', tier: 2, kind: 'choice', q: () => t('q.carbon'),
    choices: [ch('g', () => cap(t('qz.c.graphite')), false), ch('d', () => cap(t('qz.c.diamond')), true)],
    stage: sampleStage(6, ROOM, null),
    hint: () => ({ kind: 'choice', q: () => t('q.carbon.h'), choices: [2, 3, 6].map(x => ch(x, String(x), x === g.cn)), stage: sampleStage(6, ROOM, null), then: () => t('q.carbon.t', { n: g.cn }) }),
    explain: () => t('q.carbon.x', { cnD: d.cn, cnG: g.cn }), reveal: sampleStage(6, ROOM, d.id),
  };
}
function ps(r) {
  const cands = [];
  for (const g of new Set(all().map(G).filter(Boolean))) {
    const by = {};
    for (const e of colOf(g)) {
      if (e.Z >= 100 || e.lat.kind !== 'lattice' || known(e, ROOM) !== 'solid') continue;
      const ph = roomPhase(e);
      if (ph && ['bcc', 'fcc', 'hcp'].includes(ph.proto)) (by[ph.proto] = by[ph.proto] || []).push(e);
    }
    for (const [proto, es] of Object.entries(by)) if (es.length >= 3) cands.push({ g, proto, es });
  }
  if (!cands.length) return null;
  const { g, proto, es } = pick(r, cands);
  const c = es[2 + Math.floor(r() * (es.length - 2))];
  const [a, b] = es.filter(e => e !== c);
  const struct = () => t('qz.st.' + proto);
  return {
    id: 'ps:' + c.Z, skill: 'crystals', tier: 3, kind: 'choice',
    q: () => t('q.ps', { g, a: nm(a), b: nm(b), c: nm(c), struct: struct() }),
    choices: ['bcc', 'fcc', 'hcp'].map(s => ch(s, () => t('qz.st.' + s), s === proto)),
    stage: tableStage({ marks: [a.Z, b.Z, c.Z], focus: 'frame' }),
    hint: () => ({ kind: 'choice', q: () => t('q.ps.h'), choices: [ch('y', yes, true), ch('n', no, false)], stage: tableStage({ marks: colOf(g).map(x => x.Z), focus: 'frame' }), then: () => t('q.ps.t') }),
    explain: () => t('q.ps.x', { C: Nm(c), struct: struct() }), reveal: sampleStage(c.Z, ROOM),
  };
}

// =============================================================================================
export const FAMILIES = {
  table: { 1: [findZ, row], 2: [col, next, len], 3: [e119] },
  categories: { 1: [cat, tapcat], 2: [odd], 3: [pcat] },
  orbitals: { 1: [el, cap2], 2: [block, exc], 3: [n2, s8] },
  trends: { 1: [big, across], 2: [ie, en], 3: [pg, pp] },
  states: { 1: [room], 2: [heat, liq], 3: [warm, he, sub] },
  crystals: { 1: [cn], 2: [tr, carbon], 3: [ps] },
};

/** Make a question for a skill at (or near) a tier, avoiding recently asked ids when possible. */
export function makeItem(skill, tier, rng = Math.random, avoid = new Set()) {
  const tiers = [tier, tier - 1, tier + 1, tier - 2, tier + 2].filter((x, i, a) => x >= 1 && x <= 3 && a.indexOf(x) === i);
  let fallback = null;
  for (const tr0 of tiers) {
    const fams = FAMILIES[skill][tr0] || [];
    if (!fams.length) continue;
    for (let i = 0; i < 40; i++) {
      const it = fams[Math.floor(rng() * fams.length)](rng);
      if (!it) continue;
      if (!avoid.has(it.id)) return it;
      fallback = fallback || it;
    }
  }
  return fallback;
}
/** Text of the right answer (for "The answer: …"). */
export const answerText = it => (it.kind === 'tap' ? it.answer() : it.choices.filter(c => c.ok).map(c => c.label()).join(' / '));
