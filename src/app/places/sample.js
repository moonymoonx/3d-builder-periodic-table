// Sample place: "Hold a sample · cool or heat it" (PARALLEL.md scope 2). Everything the forge
// (places/heat.js) does not take: liquids (mercury, bromine), gases, and the honest cards (crystals too
// complex or never measured, elements never made in bulk). It looks and feels like the forge: the same
// stage (views/sample.js, look 'forge', created by the router), one big thermometer to drag, a readout,
// one quiet caption that names each moment. The thermometer runs both ways here: cold to the left, hot to
// the right, so a gas can be cooled until it turns liquid and freezes.
// Every number comes from our data or is computed from it (the method is shown in "About this sample");
// nothing is drawn that our sources do not measure: where a crystal cannot be drawn, the vessel stands
// empty and the caption says why.
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, fmtSci, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, bySym, name, data, stateAt, isPred, fmtTemp, propValue, structText } from '../data.js';
import { animate } from '../engine.js';
import { sampleStateAt, eventsOf, blackbody, SLOWDOWN } from '../views/sample.js';
import { rmsSpeed } from '../../physics/lattice.js';
import { sheet, door } from '../ui/kit.js';
import { showSource, closeSource } from '../ui/source.js';
import { SAMPLE_KEYS } from '../content/strings-sample.js';

const ROOM = 293.15, K0 = 273.15;
// temperatures as the element card writes them (one decimal below 100 °C): "−38.8 °C", "−196 °C"
const NB = '\u00a0'; // a number never wraps away from its unit
const degC = K => `${fmtNum(K - K0, Math.abs(K - K0) < 100 ? 1 : 0)}${NB}°C`.replace(/^-/, '−');
// the live readout, as the forge shows it: whole degrees
const C = K => `${fmtNum(K - K0, 0)}${NB}°C`.replace(/^-/, '−');
// the details' "−7.2 °C (266 K)", with the units bound to their numbers
const fT = K => fmtTemp(K).replace(/ (?=°C|K\))/g, NB);

// ---- the element in words ----------------------------------------------------------------------------
// Vietnamese sentences use the 13 familiar GDPT-2018 names (thủy ngân, nitơ, lưu huỳnh), else the IUPAC name
const gdpt = e => getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
// the form drawn, where it has a name of its own (white phosphorus: our data's one form throughout)
const formOf = e => (e.ph.form ? (getLang() === 'vi' ? e.ph.form[2]?.vi || e.ph.form[0] : e.ph.form[0]) : null);
const Name = e => (formOf(e) ? cap(formOf(e)) : gdpt(e) ? cap(e.names.viAlt[0]) : name(e));
const nameIn = e => formOf(e) || (gdpt(e) ? e.names.viAlt[0] : name(e).toLowerCase());
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const formula = (e, n) => e.sym + String(n).split('').map(d => SUB[+d]).join('');
/** Atoms per particle in the fluid (our data: N₂, P₄, S₈…; 1 for single atoms). */
const perParticle = e => (e.ph.gas && e.ph.gas[0] > 1 ? e.ph.gas[0] : 1);
/** The particles in the vessel, plain words first and the formula after: "pairs of nitrogen atoms (N₂)",
 *  "rings of 8 sulfur atoms (S₈)", "single atoms". */
function what(e, kind) {
  // the atoms are the element's, whatever form they make ("4 phosphorus atoms", not "4 white phosphorus atoms")
  const n = perParticle(e), v = { name: gdpt(e) ? e.names.viAlt[0] : name(e).toLowerCase(), f: formula(e, n), n };
  if (n > 1) return t(n === 2 ? 'sample.what.pairs' : n === 4 ? 'sample.what.tetra' : 'sample.what.rings', v);
  return t(kind === 'gas' ? 'sample.what.single' : 'sample.what.atoms');
}
/** Once the molecules have been named: "molecules" or "atoms". */
const whatShort = e => t(perParticle(e) > 1 ? 'sample.what.molShort' : 'sample.what.atoms');
/** What a crystal we do not draw shows in its vessel (as views/sample.js specimenFor): 'mol', 'atom' or null. */
function shownOf(e, ss) {
  if (ss.kind !== 'card') return null;
  const room = stateAt(e, ROOM);
  if (!(ss.card === 'molecular' || ss.card === 'complex' || (ss.card === 'predicted' && room.s !== 'unknown' && !room.p))) return null;
  return ss.card === 'molecular' && perParticle(e) > 1 ? 'mol' : 'atom';
}
/** Typical (root-mean-square) speed of the gas particles at T: √(3RT/M), R from CODATA. */
function speedOf(e, T) {
  const n = perParticle(e), M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * n;
  return { ms: rmsSpeed(T, M, data().constants.R[0]), M, n };
}
const sig3 = x => Number(x.toPrecision(3));
/** A big number in words first ("330 billion"), for a human sense of scale; the power of ten follows. */
function bigWords(x) {
  const steps = [[1e12, 'sample.n.trillion'], [1e9, 'sample.n.billion'], [1e6, 'sample.n.million']];
  for (const [f, key] of steps) if (x >= f) return t(key, { v: fmtNum(Number((x / f).toPrecision(2)), 0) });
  return fmtNum(Number(x.toPrecision(2)), 0);
}
/** A crystal pattern in plain words, before its name ("a slanted cube" · rhombohedral, α-Hg type). */
const GLOSS = [[/^face-centred cubic/, 'fcc'], [/^body-centred cubic/, 'bcc'], [/^hexagonal close-packed/, 'hcp'], [/^rhombohedral/, 'rh'], [/^simple cubic/, 'sc']];
const glossOf = nm => { const g = GLOSS.find(([re]) => re.test(nm || '')); return g ? t(`sample.gloss.${g[1]}`) : null; };
/** A family's name on the table, on one line ("Noble gases"). */
const famName = e => t('fam.' + e.f.cat[0]).replace(/-\n/g, '-').replace(/\n/g, ' ');
const METAL = ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide'];
const kmh = ms => `${fmtNum(sig3(ms * 3.6), 0)}${NB}km/h`;

/**
 * What this place shows for an element (at room temperature):
 * 'gas' | 'liquid' | 'card' (a solid whose crystal we do not draw) | 'lattice' (a measured crystal: the
 * forge's own, reached here only by stepping through elements) | 'never' (never made in bulk).
 */
export function placeKind(e) {
  const st = stateAt(e, ROOM);
  if (st.s === 'unknown' || (e.lat.kind === 'predicted' && st.p)) return 'never';
  if (st.s === 'gas') return 'gas';
  if (st.s === 'liquid') return 'liquid';
  return e.lat.kind === 'lattice' ? 'lattice' : 'card';
}

/**
 * How the element card's second door reads when it leads here (the forge words its own): a promise this
 * place keeps, with the temperature that matters from our data. { title, sub } or null for the forge's.
 */
export function sampleDoor(e) {
  const k = placeKind(e), ph = e.ph;
  if (k === 'lattice') return null;
  if (k === 'never') return { title: t('sample.door.never'), sub: t('sample.door.neverSub') };
  if (k === 'gas') return { title: t('sample.door.coolOnly'), sub: t(ph.noSolid ? 'sample.door.he' : 'sample.door.gas', { T: degC(ph.bp[0]) }) };
  if (k === 'liquid') return { title: t('sample.door.cool'), sub: t('sample.door.liquid', { mp: degC(ph.mp[0]), bp: degC(ph.bp[0]) }) };
  if (ph.sub) return { title: t('sample.door.heat'), sub: t('sample.door.cardSub', { T: degC(ph.sub[0]) }) };
  return ph.mp && ph.mp[0] != null ? { title: t('sample.door.heat'), sub: t('sample.door.card', { T: degC(ph.mp[0]) }) } : null;
}

/**
 * The thermometer's scale for an element: a little past its coldest and hottest events, room
 * temperature always inside. Things that never glow stop short of the glow (about 490 °C), so the room
 * never dims for them. Helium (it never freezes) runs down to 1 K, a whisker above absolute zero.
 */
export function rangeOf(e) {
  const ev = eventsOf(e);
  const below = ev.filter(x => x.T < ROOM - 0.5).map(x => x.T), above = ev.filter(x => x.T > ROOM + 0.5).map(x => x.T);
  let lo = ROOM, hi;
  if (below.length) { const c = Math.min(...below); lo = Math.max(1, c - Math.max(15, 0.1 * (ROOM - c))); }
  if (above.length) {
    const w = Math.max(...above);
    hi = w + Math.max(30, 0.1 * (w - ROOM));
    if (w < 720) hi = Math.min(hi, 740);
  } else hi = ROOM + Math.max(40, 0.15 * (ROOM - lo));
  const step = hi - K0 > 1000 ? 100 : 10; // tidy ends: whole tens of °C (hundreds above 1,000 °C)
  hi = K0 + Math.ceil((hi - K0) / step) * step;
  if (lo < ROOM - 0.5) lo = Math.max(1, K0 + Math.floor((lo - K0) / 10) * 10);
  return { lo, hi };
}

// ---- the thermometer --------------------------------------------------------------------------------
// It mirrors the forge's (places/heat.js, heat.css) so the two read as one instrument, and it is built
// as a self-contained factory so the kit's shared thermometer can replace it (PROPOSALS-sample.md §3).
// The fill grows from room temperature, where the bulb sits (the forge's left end is room temperature
// too): to the right in the forge's heated-metal colours, to the left in cold blues (the kit's
// heat-map slider). Colours follow the temperature itself, so the forge's ramp lands where it does on
// iron's scale (20 °C charcoal ... 3,200 °C yellow-white) and a 90 °C bromine stays charcoal.
const HOT = [[0, '#3B2B24'], [0.14, '#5A2414'], [0.28, '#8E2E12'], [0.40, '#B93E12'], [0.56, '#E5612B'], [0.72, '#F59A47'], [0.88, '#FFD796'], [1, '#FFF2C2']]
  .map(([f, c]) => [ROOM + f * 3180, c]); // the forge's gradient, placed on iron's scale (20 to 3,200 °C): the kiln's
// by day the same heat reads on the cream panel: muted terracotta, the kit's warm orange, ember (--ember)
// where metals begin to glow (about 500 °C), then the colours of glowing metal (the forge's own stops)
const HOT_DAY = [[ROOM, '#E3A27A'], [473.15, '#E8955A'], [773.15, '#B93E12'], [1273.15, '#E5612B'], [1773.15, '#F59A47'], [2473.15, '#FFD796'], [3473.15, '#FFF2C2']];
const COLD = [[ROOM, '#A9CBD6'], [ROOM - 120, '#6E8FBF']]; // pale ice at room temperature, deeper blue as it gets colder
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
function rampAt(ramp, T) { // ramp: [[K, colour]] in order of distance from room temperature
  for (let i = 1; i < ramp.length; i++) {
    const [T0, c0] = ramp[i - 1], [T1, c1] = ramp[i];
    if ((T - T0) * (T - T1) <= 0) {
      const f = (T - T0) / (T1 - T0), a = hex(c0), b = hex(c1);
      return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * f)).join(',')})`;
    }
  }
  return Math.abs(T - ramp[0][0]) < Math.abs(T - ramp[ramp.length - 1][0]) ? ramp[0][1] : ramp[ramp.length - 1][1];
}
let ctx2d = null;
/** Width of a label in CSS pixels, measured in the page's own fonts at 13 px (ticks: sans; flags: italic serif). */
function textW(text, weight, serif = false) {
  if (!ctx2d) ctx2d = document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(document.documentElement);
  const fam = (serif ? cs.getPropertyValue('--font-serif') : cs.getPropertyValue('--font-sans')).trim() || 'sans-serif';
  ctx2d.font = `${serif ? 'italic ' : ''}${weight} 13px ${fam}`;
  return ctx2d.measureText(text).width;
}

/**
 * Place the event labels above the rail, in up to three rows. A stem rises from the rail to its own
 * label, so it crosses every lower row: no label may cover another's stem, and none may overlap in a row.
 * Groups are tried in a few orders (importance, right to left, left to right); the first order that
 * places every label wins. A label that fits nowhere keeps its number only.
 */
function placeTicks(groups, W, x) {
  const rank = g => Math.min(...g.items.map(ev => ({ melt: 0, boil: 1, sub: 1, trans: 2 })[ev.key] ?? 3));
  const at = g => g.items.reduce((s, ev) => s + x(ev.T), 0) / g.items.length;
  const width = parts => parts.reduce((s, p, i) => s + textW(p.num, 600) + (p.word ? 4 + textW(p.word, 400) : 0) + (i ? textW(' · ', 400) : 0), 0) + 4;
  const orders = [[...groups].sort((a, b) => rank(a) - rank(b) || at(a) - at(b)), [...groups].sort((a, b) => at(b) - at(a)), [...groups].sort((a, b) => at(a) - at(b))];
  let best = null;
  for (const order of orders) {
    const placed = []; // { x, r, a, b }
    const fitsAt = (px, r, a, b) => a >= -4 && b <= W + 4 && placed.every(p =>
      (p.r !== r || b + 8 < p.a || a - 8 > p.b) && // same row: no overlap
      (p.r <= r || p.x < a - 5 || p.x > b + 5) && // p sits higher: its stem crosses my row, so my text must not cover it
      (p.r >= r || px < p.a - 5 || px > p.b + 5)); // p sits lower: my stem crosses its row, so its text must not cover my stem
    const spots = new Map();
    let misses = 0;
    /** Two events closer than a finger (neon's −249 and −246 °C): each keeps its own label, fanned away from
     *  the other on a short angled leader that clears the knob; apart in one row, else both to one side. */
    const placeFan = g => {
      const [A, B] = g.items, xa = x(A.T), xb = x(B.T), F = 16;
      const wA = width([{ num: A.num, word: A.word }]), wB = width([{ num: B.num, word: B.word }]);
      const layouts = [
        r => [{ ev: A, r, a: xa - F - wA, b: xa - F, side: -1 }, { ev: B, r, a: xb + F, b: xb + F + wB, side: 1 }],
        r => [{ ev: B, r, a: xb + F, b: xb + F + wB, side: 1 }, { ev: A, r: r + 1, a: xb + F, b: xb + F + wA, side: 1 }],
        r => [{ ev: A, r, a: xa - F - wA, b: xa - F, side: -1 }, { ev: B, r: r + 1, a: xa - F - wB, b: xa - F, side: -1 }],
      ];
      for (const lay of layouts) for (let r = 0; r < 2; r++) {
        const boxes = lay(r), n0 = placed.length;
        let ok = boxes.every(bx => bx.r <= 2);
        for (const bx of boxes) {
          if (!ok) break;
          ok = fitsAt(x(bx.ev.T), bx.r, bx.a, bx.b);
          if (ok) placed.push({ x: x(bx.ev.T), r: bx.r, a: bx.a, b: bx.b });
        }
        if (ok) return { fan: boxes, r: Math.max(...boxes.map(bx => bx.r)), px: (xa + xb) / 2, dx: 0, parts: [] };
        placed.length = n0;
      }
      return null;
    };
    for (const g of order) {
      if (g.items.length === 2) { const fan = placeFan(g); if (fan) { spots.set(g, fan); continue; } }
      const px = at(g);
      const others = groups.filter(o => o !== g).map(at);
      const left = Math.min(...others.filter(o => o < px).map(o => px - o), 1e9), right = Math.min(...others.filter(o => o > px).map(o => o - px), 1e9);
      const aligns = right < left ? ['end', 'center', 'start'] : ['start', 'center', 'end']; // extend away from the nearer neighbour
      let done = null;
      for (const parts of [g.items.map(ev => ({ num: ev.num, word: ev.word })), g.items.map(ev => ({ num: ev.num, word: '' }))]) {
        const w = width(parts);
        for (let r = 0; r < 3 && !done; r++) for (const al of aligns) {
          let a = al === 'center' ? px - w / 2 : al === 'start' ? px - 6 : px - w + 6;
          a = Math.max(-4, Math.min(W - w + 4, a));
          if (fitsAt(px, r, a, a + w)) { done = { r, dx: a + w / 2 - px, parts }; placed.push({ x: px, r, a, b: a + w }); break; }
        }
        if (done) break;
      }
      if (!done) { misses++; done = { r: 2, dx: 0, parts: g.items.map(ev => ({ num: ev.num, word: '' })) }; }
      spots.set(g, { ...done, px });
    }
    if (!best || misses < best.misses) best = { misses, spots };
    if (!misses) break;
  }
  return best.spots;
}

/**
 * One big thermometer, as the forge's: events labelled above the rail, landmarks below, a bulb, a fill
 * and a drawn knob that all share one scale (the native thumb is invisible and only takes the drag).
 * Every event is labelled, never an unexplained mark; ticks closer than a finger's width share one label
 * ("−249 °C freezes · −246 °C turns liquid") and keep a stem each; no label ever covers another's stem.
 * Returns { el, input, layout({ lo, hi, anchor, events, marks }), show(T), valueAt(v) }.
 */
function thermometer() {
  const fillDay = h('div', { class: 'sample-fill__layer' }), fillKiln = h('div', { class: 'sample-fill__layer is-kiln' });
  const fill = h('div', { class: 'sample-fill' }, fillDay, fillKiln); // by day and in the kiln (cross-fading)
  const rail = h('div', { class: 'sample-rail' }, fill);
  const bulb = h('div', { class: 'sample-bulb', 'aria-hidden': 'true' });
  const knob = h('div', { class: 'sample-knob', 'aria-hidden': 'true' });
  const ticks = h('div', { class: 'sample-ticks', 'aria-hidden': 'true' });
  const flags = h('div', { class: 'sample-flags', 'aria-hidden': 'true' });
  const input = h('input', { type: 'range', class: 'sample-range', min: '0', max: '1000', step: '1' });
  const el = h('div', { class: 'sample-track' }, ticks, rail, bulb, knob, input, flags);
  let lo = ROOM, hi = ROOM + 100, anchor = ROOM, lastShown = '', flagAt = [], trackW = 620;
  const pct = T => Math.max(0, Math.min(100, ((T - lo) / (hi - lo)) * 100));

  function layout({ lo: l, hi: hh, anchor: a, events, marks }) {
    lo = l; hi = hh; anchor = a;
    const W = Math.max(220, el.clientWidth || (isPhone() ? 330 : 620));
    const x = T => (pct(T) / 100) * W;
    // the fill: cold blues left of the anchor, heat's colours right of it, by temperature
    const pa = pct(anchor);
    const grad = hot => {
      const stops = [];
      if (pa > 0) stops.push([0, rampAt(COLD, lo)], ...COLD.filter(([T]) => T > lo && T < anchor).reverse().map(([T, c]) => [pct(T), c]), [pa, rampAt(COLD, anchor)]);
      stops.push([pa, rampAt(hot, anchor)], ...hot.filter(([T]) => T > anchor && T < hi).map(([T, c]) => [pct(T), c]), [100, rampAt(hot, hi)]);
      return `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${p.toFixed(2)}%`).join(', ')})`;
    };
    fillDay.style.background = grad(HOT_DAY); fillKiln.style.background = grad(HOT);
    // the bulb, the thermometer's reservoir, at the anchor: at the left end it sits as the forge's does
    bulb.style.left = pa < 0.01 ? '-13px' : `calc(${pa.toFixed(2)}% - 9px)`;
    // ticks: events closer than 14 px fan out on leaders (or, failing room, share one label); labels never cover a stem
    const sorted = [...events].sort((a, b) => a.T - b.T);
    const groups = [];
    for (const ev of sorted) {
      const g = groups[groups.length - 1];
      if (g && x(ev.T) - x(g.items[g.items.length - 1].T) < 14) g.items.push(ev); else groups.push({ items: [ev] });
    }
    const spots = placeTicks(groups, W, x);
    const NS = 'http://www.w3.org/2000/svg', leaders = document.createElementNS(NS, 'svg');
    leaders.setAttribute('class', 'sample-leaders'); leaders.setAttribute('width', String(W)); leaders.setAttribute('height', '48');
    replace(ticks, leaders, groups.flatMap(g => {
      const sp = spots.get(g);
      if (sp.fan) return sp.fan.map(bx => { // its own label beside its leader: rail, knee, then out to the label
        const ex = x(bx.ev.T), lx = bx.side < 0 ? bx.b + 3 : bx.a - 3, ly = 19 - 17 * bx.r;
        const line = document.createElementNS(NS, 'polyline');
        line.setAttribute('points', `${ex.toFixed(1)},46 ${ex.toFixed(1)},37 ${lx.toFixed(1)},${ly}`);
        if (bx.ev.p) line.setAttribute('class', 'is-pred');
        leaders.append(line);
        const node = h('span', { class: `sample-tick is-fan${bx.ev.p ? ' is-pred' : ''}`, style: { left: `${((((bx.a + bx.b) / 2) / W) * 100).toFixed(2)}%` } },
          h('span', null, h('b', null, bx.ev.num), bx.ev.word ? h('small', null, bx.ev.word) : null));
        node.style.setProperty('--row', String(bx.r)); node.style.setProperty('--dx', '0px');
        return node;
      });
      const label = h('span', null, sp.parts.map((p, i) => [i ? h('small', { class: 'sample-tick__sep' }, ' · ') : null,
        h('b', null, p.num), p.word ? h('small', null, p.word) : null]));
      const node = h('span', { class: `sample-tick${g.items.some(ev => ev.p) ? ' is-pred' : ''}`, style: { left: `${((sp.px / W) * 100).toFixed(2)}%` } }, label);
      node.style.setProperty('--row', String(sp.r)); node.style.setProperty('--dx', `${sp.dx.toFixed(1)}px`);
      // a shared label keeps one stem per event, so each still points at its own temperature
      const extra = g.items.length > 1 ? g.items.map(ev => {
        const st = h('span', { class: 'sample-tick is-stem', style: { left: `${pct(ev.T).toFixed(2)}%` } });
        st.style.setProperty('--row', String(sp.r)); return st;
      }) : [];
      if (extra.length) node.classList.add('is-shared');
      return [node, ...extra];
    }));
    el.style.setProperty('--rows', String(Math.max(0, ...[...spots.values()].map(s => s.r)))); // room for the upper rows
    // flags below the rail, in order of importance (room temperature first); a flag near an end shifts
    // inward rather than vanish, its mark staying on its temperature; one that would overlap is left out
    const taken = [];
    const fl = [];
    for (const m of marks) {
      if (!m.end && (m.T < lo - 0.01 || m.T > hi + 0.01)) continue;
      const px = x(m.T), w = textW(m.text, 400, true) + 6;
      const a = Math.max(-8, Math.min(W - w + 8, px - w / 2));
      if (taken.some(p => a < p.b + 12 && a + w > p.a - 12)) continue;
      taken.push({ a, b: a + w });
      fl.push({ ...m, dx: a + w / 2 - px });
    }
    flagAt = [];
    replace(flags, fl.map(m => {
      const f = h('span', { class: `sample-flag${m.room ? ' is-room' : ''}`, style: { left: `${pct(m.T).toFixed(2)}%` } }, m.text);
      f.style.setProperty('--dx', `${m.dx.toFixed(1)}px`);
      if (!m.room) flagAt.push({ f, T: m.T, a: x(m.T) + m.dx - (textW(m.text, 400, true) + 6) / 2, b: x(m.T) + m.dx + (textW(m.text, 400, true) + 6) / 2 });
      return f;
    }));
    trackW = W; lastShown = '';
  }
  function show(T) {
    // the fill runs from the bulb (room temperature) to the knob, which is drawn exactly where it ends
    const p = pct(T), pa = pct(anchor), key = `${p.toFixed(2)}|${pa.toFixed(2)}`;
    if (key !== lastShown) {
      lastShown = key;
      fill.style.clipPath = `inset(0 ${(100 - Math.max(p, pa)).toFixed(2)}% 0 ${Math.min(p, pa).toFixed(2)}% round 6px)`;
      knob.style.left = `${p.toFixed(2)}%`;
      // a landmark under the knob steps back, so it never seems to mark the knob's own temperature, unless it
      // does (helium a whisker above absolute zero); room temperature always stays
      const kx = (p / 100) * trackW, near1 = 0.01 * (hi - lo);
      for (const g of flagAt) g.f.classList.toggle('is-near', kx > g.a - 16 && kx < g.b + 16 && Math.abs(T - g.T) > near1);
    }
    const v = String(Math.round(p * 10));
    if (input.value !== v && document.activeElement !== input) input.value = v;
  }
  const valueAt = v => lo + (v / 1000) * (hi - lo);
  return { el, input, layout, show, valueAt };
}

// ---- the place -------------------------------------------------------------------------------------
export function buildSample(ui, hooks = {}) {
  if (!SAMPLE_KEYS.length) throw new Error('sample strings missing');
  const caption = h('p', { class: 'sample-caption', role: 'status', 'aria-live': 'polite' });
  const read = h('div', { class: 'sample-read' });
  const word = h('div', { class: 'sample-word' });
  const aboutBtn = h('button', { type: 'button', class: 'sample-about', 'aria-haspopup': 'dialog', onclick: () => toggleAbout() });
  const thermo = thermometer();
  const coolBtn = h('button', { type: 'button', class: 'ui-btn sample-play', onclick: () => toggle(-1) });
  const heatBtn = h('button', { type: 'button', class: 'ui-btn sample-play', onclick: () => toggle(1) });
  const roomBtn = h('button', { type: 'button', class: 'ui-btn ui-btn--quiet sample-room', onclick: () => { release(); stop(); setT(ROOM); } });
  const actions = h('div', { class: 'sample-actions' });
  const row = h('div', { class: 'sample-row' }, h('div', { class: 'sample-readbox' }, h('div', { class: 'sample-readline' }, read, word), aboutBtn), thermo.el);
  const never = h('div', { class: 'sample-never' });
  const panel = h('section', { class: 'sample-panel', hidden: true }, caption, row, actions, never);
  // "About this sample": the kit's sheet (a card on the right on desktop, a bottom sheet on phones)
  const about = sheet({ label: t('sample.d.title'), onClose: () => closeAbout(), closeLabel: t('sample.d.close') });
  about.el.classList.add('sample-sheet');
  ui.append(panel, about.el);

  let el = null, kind = 'gas', lo = ROOM, hi = ROOM + 100, events = [], dirs = { cool: true, heat: true };
  let playing = null, lastCaption = '', lastSig = '', lastT = ROOM, lastRead = '', lastWord = '', lastVt = '', lastBtns = '', aboutSig = '';
  // what the caption says now: 'room' (the invitation), 'state' (the sample at a temperature), 'stretch'
  // (on the way to the next event) or 'moment' (an event just crossed, which stays until the next one)
  let capKind = '';
  const setT = T => set({ T: Math.round(Math.max(lo, Math.min(hi, T)) * 100) / 100 });
  function say(text, kindOf = 'moment') {
    if (!text) return;
    capKind = kindOf;
    if (text === lastCaption) return;
    lastCaption = text;
    // [[…]] marks words coloured like the part of the sample they name (STYLE §2)
    replace(caption, text.split(/\[\[(.+?)\]\]/).map((part, i) => (i % 2 ? h('span', { class: 'sample-cell-word' }, part) : part)));
    caption.classList.remove('is-new'); void caption.offsetWidth; caption.classList.add('is-new');
  }
  /** By day a solid shows its unit cell (a dark atom, its neighbours in green); in the kiln it does not. */
  const cellShown = T => blackbody(T).glow <= 0.01 || T <= 760;
  const ssAt = T => sampleStateAt(el, T, state.allotrope);
  const sigOf = ss => `${ss.kind}|${ss.card || ''}|${ss.phase ? ss.phase.id : ''}`;

  /** One sentence for the sample at T; at room temperature an invitation follows (what to do here). */
  function describe(T) {
    const ss = ssAt(T), room = Math.abs(T - ROOM) < 0.5;
    const at = room ? t('sample.at.room', { Name: Name(el) }) : t('sample.at.T', { Name: Name(el), T: degC(T) });
    let s;
    if (ss.kind === 'gas') s = t('sample.cap.gas', { at, what: what(el, 'gas'), v: kmh(speedOf(el, T).ms) });
    else if (ss.kind === 'liquid') s = t('sample.cap.liquid', { at, what: what(el, 'liquid') });
    else if (ss.kind === 'solid') s = t(cellShown(T) ? 'sample.cap.solidCnDay' : 'sample.cap.solidCn', { at, cn: ss.phase.cn });
    else s = t(cardKey(ss), { at, n: el.lat.atoms, what: what(el, 'solid') });
    if (!room) return s;
    const inv = kind === 'card' ? (el.ph.sub ? 'sample.invite.sub' : 'sample.invite.melt')
      : dirs.cool && dirs.heat ? 'sample.invite.both' : dirs.cool ? 'sample.invite.cool' : 'sample.invite.heat';
    return `${s} ${t(inv)}`;
  }
  /** What stands in the vessel for a solid we do not draw: one molecule, or one atom. */
  function cardKey(ss) {
    if (ss.card === 'molecular') return perParticle(el) > 1 ? 'sample.cap.molecular' : 'sample.cap.complexPlain';
    if (ss.card === 'complex') return el.lat.atoms ? 'sample.cap.complex' : 'sample.cap.complexPlain';
    if (ss.card === 'phase') return 'sample.cap.phase';
    return 'sample.cap.predictedCrystal';
  }
  /** Between moments: the sample as it is now and what happens next on the way (never a stale
   *  "at room temperature" at −100 °C). up: the direction the thermometer last moved. */
  function stretch(T, ss, up) {
    const k = ss.kind === 'card' ? 'card' : ss.kind;
    const now = t(`sample.stretch.${k}.${up ? 'warm' : 'cool'}`, { what: whatShort(el) });
    const next = up ? events.find(x => x.T > T + 0.05) : events.filter(x => x.T < T - 0.05).pop();
    if (!next) return !up && el.ph.noSolid && ss.kind === 'liquid' ? `${now} ${t('sample.next.never')}` : now;
    return `${now} ${t(`sample.next.${tickKey(next)}`, { T: next.p ? `≈${NB}${C(next.T)}` : degC(next.T) })}`;
  }
  /** The moment the sample changes: the event just crossed, in the direction of travel (null: none). */
  function moment(T0, T1, ss) {
    const up = T1 > T0;
    const crossed = events.filter(x => (x.T - T0) * (x.T - T1) < 0).sort((a, b) => Math.abs(a.T - T1) - Math.abs(b.T - T1))[0];
    if (!crossed) return null;
    const at = degC(crossed.T), w = what(el, 'liquid');
    if (crossed.key === 'trans') return ss.kind === 'solid' ? t(cellShown(T1) ? 'sample.ev.restackDay' : 'sample.ev.restack', { T: at, cn: ss.phase.cn }) : t('sample.ev.restackCard', { T: at });
    if (crossed.key === 'sub') return up ? t('sample.ev.sub', { T: at, what: what(el, 'gas') }) : t('sample.ev.deposit', { T: at });
    if (crossed.key === 'boil') return t(up ? 'sample.ev.boil' : 'sample.ev.condense', { T: at, what: whatShort(el) });
    // melting point
    if (up) {
      if (ss.kind !== 'liquid') return null;
      if (blackbody(crossed.T).glow > 0.05) return t('sample.ev.meltGlow', { T: at });
      return lastSig.startsWith('card') ? t('sample.ev.meltCard', { T: at, what: w }) : t('sample.ev.melt', { T: at });
    }
    if (ss.kind === 'solid') return t(cellShown(T1) ? 'sample.ev.freezeCnDay' : 'sample.ev.freezeCn', { T: at, cn: ss.phase.cn });
    if (ss.card === 'molecular') return t(perParticle(el) > 1 ? 'sample.ev.freezeMol' : 'sample.ev.freezeComplex', { T: at, what: what(el, 'solid') });
    if (ss.card === 'complex') return t('sample.ev.freezeComplex', { T: at });
    if (ss.card === 'phase' || ss.card === 'unknown') return t('sample.ev.freezePhase', { T: at });
    return t('sample.ev.freezePred', { T: at });
  }

  // ---- the scale: events above the rail, landmarks below -------------------------------------------
  /** An event in the words of its direction from room temperature: below it things freeze and turn
   *  liquid as you cool; above it they melt and boil as you heat. */
  function tickKey(x) {
    const cold = x.T < ROOM;
    return x.key === 'melt' ? (cold ? 'freeze' : 'melt') : x.key === 'boil' ? (cold ? 'condense' : 'boil') : x.key === 'sub' ? (cold ? 'deposit' : 'sub') : 'trans';
  }
  /** Where "◀ Cool it" and "Heat it ▶" stop: the end of the scale, or room temperature when nothing
   *  happens beyond it (a gas only cools; a solid we heat only cools back to where it started). */
  const endOf = dir => (dir < 0 ? (dirs.cool ? lo : ROOM) : dirs.heat ? hi : ROOM);
  function layout() {
    el = byZ(state.Z);
    kind = placeKind(el);
    ({ lo, hi } = rangeOf(el));
    events = eventsOf(el).filter(x => x.T > lo && x.T < hi);
    dirs = { cool: lo < ROOM - 0.5, heat: hi > ROOM + 0.5 && events.some(x => x.T > ROOM) };
    const tick = x => ({ T: x.T, key: x.key, p: x.p, num: x.p ? `≈ ${C(x.T)}` : degC(x.T), word: t(`sample.tick.${tickKey(x)}`) });
    // landmarks from our data, most useful first: room temperature (where every sample starts), liquid
    // nitrogen, absolute zero (helium's story), mercury freezing, familiar metals melting
    const marks = [];
    if (ROOM > lo + 1 && ROOM < hi - 1) marks.push({ T: ROOM, text: t('sample.flag.room'), room: true });
    const zero = lo <= 2 ? { T: 0, text: t('sample.flag.zero'), end: true } : null; // the scale stops a whisker above it
    if (zero && el.ph.noSolid) marks.push(zero);
    const N = bySym('N'), Hg = bySym('Hg');
    if (el.Z !== N.Z) marks.push({ T: N.ph.bp[0], text: t('sample.flag.ln2') });
    if (zero && !el.ph.noSolid) marks.push(zero);
    if (el.Z !== Hg.Z) marks.push({ T: Hg.ph.mp[0], text: t('sample.flag.hg') });
    for (const s of ['Pb', 'Al', 'Cu', 'Fe', 'W']) {
      const m = bySym(s); if (m.Z === el.Z) continue;
      marks.push({ T: propValue(m, 'mp')[0], text: t('sample.flag.melts', { name: nameIn(m) }) });
    }
    thermo.layout({ lo, hi, anchor: Math.min(Math.max(ROOM, lo), hi), events: events.map(tick), marks: marks.filter(m => m.room || m.end || ((m.T - lo) / (hi - lo) > 0.03 && (hi - m.T) / (hi - lo) > 0.02)) });
    thermo.input.setAttribute('aria-label', t('sample.thermo'));
    panel.setAttribute('aria-label', t('sample.label'));
    lastBtns = '';
  }

  function update() {
    if (!el) return;
    const T = state.T, ss = ssAt(T);
    const rd = C(T);
    if (rd !== lastRead) { lastRead = rd; replace(read, rd); read.classList.toggle('is-hot', T > ROOM + 0.5); }
    let wd = '';
    if (ss.kind === 'gas') wd = t('sample.word.gas', { v: kmh(speedOf(el, T).ms) });
    else if (ss.kind === 'liquid') wd = t('sample.word.liquid');
    else if (ss.kind === 'solid') wd = t('sample.word.solidCn', { cn: ss.phase.cn });
    else if (kind !== 'never') { const sh = shownOf(el, ss); wd = t(sh === 'mol' ? 'sample.word.solidMol' : sh === 'atom' ? 'sample.word.solidAtom' : 'sample.word.solidCard'); }
    if (wd !== lastWord) { lastWord = wd; replace(word, wd); }
    const vt = wd ? `${rd} · ${wd}` : rd; // what a screen reader says for the thermometer (not 0–1000)
    if (vt !== lastVt) { lastVt = vt; thermo.input.setAttribute('aria-valuetext', vt); }
    thermo.show(T);
    // name the moment when the sample changes; between moments, the stretch it is on and what comes
    // next; at room temperature (not playing) the invitation returns
    const sg = sigOf(ss), atRoom = Math.abs(T - ROOM) < 0.5;
    if (sg !== lastSig) {
      const m = lastSig ? moment(lastT, T, ss) : null;
      if (m) say(m); else if (lastSig) say(describe(T), 'state');
      lastSig = sg;
    }
    else if (!atRoom && Math.abs(T - lastT) > 0.004 && capKind !== 'moment') say(stretch(T, ss, T > lastT), 'stretch');
    if (atRoom && !playing) say(describe(T), 'room'); // back at room temperature: what to do here
    if (el.ph.noSolid && T <= lo + 0.6) say(t('sample.ev.neverFreezes'));
    lastT = T;
    if (about.isOpen()) renderAbout();
  }
  /**
   * The buttons: cold to the left, hot to the right, and only those with somewhere to go. The ink one
   * is the way with something still to happen (at room temperature, the element's main story: a gas or
   * a liquid cools, a solid heats). Below room temperature "Heat it" is "Warm it". "Room temperature"
   * appears once the sample has left it.
   */
  function renderButtons() {
    const T = state.T, p = playing ? playing.dir : 0;
    const canCool = p < 0 || T > endOf(-1) + 0.5, canHeat = p > 0 || T < endOf(1) - 0.5, away = Math.abs(T - ROOM) >= 0.5;
    const evCool = events.some(x => x.T < T - 0.05), evHeat = events.some(x => x.T > T + 0.05 && x.T <= endOf(1));
    const ink = canCool && canHeat ? (evCool && !evHeat ? -1 : evHeat && !evCool ? 1 : kind === 'gas' || kind === 'liquid' ? -1 : 1) : canCool ? -1 : 1;
    const key = `${p}|${canCool}|${canHeat}|${away}|${ink}|${T < ROOM - 0.5}|${getLang()}`;
    if (key === lastBtns) return;
    lastBtns = key;
    replace(coolBtn, p < 0 ? t('sample.pause') : t('sample.cool'));
    replace(heatBtn, p > 0 ? t('sample.pause') : t(T < ROOM - 0.5 ? 'sample.warm' : 'sample.heat'));
    replace(roomBtn, h('span', { class: 'sample-room__long' }, t('sample.room')), h('span', { class: 'sample-room__short' }, t('sample.roomShort', { T: C(ROOM) })));
    roomBtn.setAttribute('aria-label', t('sample.room'));
    for (const [b, d] of [[coolBtn, -1], [heatBtn, 1]]) {
      b.classList.toggle('ui-btn--primary', ink === d);
      b.classList.toggle('ui-btn--secondary', ink !== d);
    }
    const keep = [canCool ? coolBtn : null, away ? roomBtn : null, canHeat ? heatBtn : null].filter(Boolean);
    // the focused button stays in the page (a keyboard user keeps their place); after a play or pause
    // pressed with a mouse the row keeps its buttons where they are, so the pressed one stays under the
    // pointer as "Pause" (re-centring slid "Room temperature" under it); it settles when the pointer leaves
    if (keep.length !== actions.childNodes.length || keep.some((b, i) => actions.childNodes[i] !== b)) {
      if (holdRow && actions.childNodes.length) heldRow = true; else replace(actions, keep);
    }
    replace(aboutBtn, t('sample.about'));
  }

  // ---- "◀ Cool it" / "Heat it ▶": sweep to the end, stopping just past each event so its caption is read
  function toggle(dir) { holdRow = mouseOnRow; if (playing && playing.dir === dir) stop(); else start(dir); }
  function start(dir) {
    stop();
    const end = endOf(dir);
    if ((end - state.T) * dir < 0.5) return; // nowhere to go that way (its button is hidden)
    let T = state.T, hold = 0;
    const speed = (hi - lo) / 10; // the whole scale in about ten seconds, as in the forge
    const ahead = () => (dir > 0 ? events.filter(x => x.T > T + 0.05 && x.T < end) : events.filter(x => x.T < T - 0.05 && x.T > end).reverse());
    if (hooks.onInteract) hooks.onInteract();
    playing = { dir, cancel: null };
    playing.cancel = animate(dt => {
      if (hold > 0) { hold -= dt; return true; }
      const [next, after] = ahead();
      let T2 = T + dir * speed * Math.min(dt, 0.25); // wall-clock pace, also on slow frames
      if (next && (dir > 0 ? T2 >= next.T : T2 <= next.T)) {
        const gap = Math.abs((after ? after.T : end) - next.T); // stop just past it, never past the next one
        T2 = next.T + dir * Math.min(2, gap / 3); hold = 1.8;
      }
      T = dir > 0 ? Math.min(end, T2) : Math.max(end, T2);
      setT(T);
      if (T === end) { playing = null; holdRow = false; heldRow = false; lastBtns = ''; renderButtons(); return false; } // the sweep is over: the row settles
      return true;
    });
    renderButtons();
  }
  function stop() { if (playing) { playing.cancel(); playing = null; renderButtons(); } }

  // ---- never made in bulk: what we know, and a way on -------------------------------------------------
  const valBtn = (text, label, v, cls = 'sample-v') => (v && v[0] != null
    ? h('button', { type: 'button', class: cls + (isPred(v) ? ' is-est' : ''), onclick: ev => showSource(ev.currentTarget, label, v, el, text) }, text)
    : h('span', { class: `${cls} is-none` }, text || t('sample.notKnown')));
  /** "8.1 h" (NUBASE) -> "8.1 hours"; estimated half-lives keep NUBASE's flag and read "≈". A large
   *  measured uncertainty stays with the number, in its unit: oganesson-295's "680 ± 540 milliseconds". */
  const UNIT_S = { ms: 1e-3, s: 1, m: 60, h: 3600, d: 86400, y: 365.25 * 86400 }; // as tools/build-data.mjs
  function lifeText(v) {
    const m = /^([\d.]+)\s*(ms|s|m|h|d|y)$/.exec(v[2]?.t || '');
    const pre = isPred(v) ? '≈ ' : '';
    if (!m) return `${pre}${fmtSci(v[0], 3)}${NB}s`;
    const vi = getLang() === 'vi', n = vi ? m[1].replace('.', ',') : m[1];
    // NUBASE's own digits when its note has them ("3.8 ± 3.0 m"), else from the uncertainty in seconds
    const nu = /±\s*([\d.]+)\s*(ms|s|m|h|d|y)\b/.exec(v[2]?.n || '');
    const u = v[2]?.u && v[2].u / v[0] >= 0.1 ? (nu && nu[2] === m[2] ? nu[1] : String(Number((v[2].u / UNIT_S[m[2]]).toPrecision(3)))) : null;
    const num = u != null ? `${n}${NB}±${NB}${vi ? u.replace('.', ',') : u}` : n;
    return pre + t(`sample.${+m[1] === 1 && u == null ? 'unit1' : 'unit'}.${m[2]}`, { v: num });
  }
  /** Which atoms that half-life belongs to: "radon-222, its longest-lived kind on record", or, when a
   *  longer-lived kind is listed but not yet confirmed, "oganesson-294, the only confirmed kind". */
  const lifeKey = v => (v?.[2]?.conf ? 'Conf' : '');
  const lifeSub = v => (v?.[2]?.A ? h('span', { class: 'sample-strip__sub' }, t('sample.never.lifeSub' + lifeKey(v), { name: nameIn(el), A: v[2].A })) : null);
  /** A longer-lived kind that is listed (NUBASE2020) but not yet confirmed: oganesson-295, as a note with its own source. */
  const tentNote = e => {
    const v = e.f.halfLifeTent, A = v?.[2]?.A || '';
    return v ? h('p', { class: 'sample-never__note' }, t('sample.never.tentPre', { name: nameIn(e), A }), valBtn(lifeText(v), t('sample.never.tentSrc', { name: nameIn(e), A }), v), t('sample.never.tentPost')) : null;
  };
  function renderNever() {
    const e = el, life = e.f.halfLife, st = stateAt(e, ROOM), mp = e.ph.mp;
    const stV = e.f.state && isPred(e.f.state) ? e.f.state : [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
    const cells = [
      [t('sample.never.life'), life ? valBtn(lifeText(life), t('sample.never.lifeSrc' + lifeKey(life), { name: nameIn(e), A: life[2]?.A || '' }), life) : valBtn(null), lifeSub(life)],
      [t('sample.never.state'), st.s === 'unknown' ? valBtn(null) : valBtn(t('state.' + st.s), t('f.state'), stV)],
      [t('sample.never.melts'), mp && mp[0] != null ? valBtn(isPred(mp) ? `≈ ${C(mp[0])}` : degC(mp[0]), t('f.mp'), mp) : valBtn(null)], // a prediction: whole degrees
    ];
    const shells = new Set(e.cfg.filter(x => x[2] > 0).map(x => x[0])).size, nE = e.cfg.reduce((s, x) => s + x[2], 0);
    replace(never,
      h('h2', { class: 'sample-never__title' }, t('sample.never.title', { name: nameIn(e) })),
      h('p', { class: 'sample-never__body' }, t('sample.never.body')),
      h('div', { class: 'sample-strip' }, cells.map(([l, v, sub]) => h('div', { class: 'sample-strip__cell' }, h('span', { class: 'sample-strip__label' }, l), v, sub || null))),
      tentNote(e),
      h('p', { class: 'sample-hint' }, t('sample.d.tap')),
      hooks.onDoor ? door({ title: t('sample.never.atom'), sub: t('sample.never.atomSub', { n: nE, s: shells }), onClick: () => hooks.onDoor('atom') }) : null);
  }

  // ---- "About this sample": the science one tap deeper, every number with its source ------------------
  function toggleAbout() { if (about.isOpen()) closeAbout(); else openAbout(); }
  function openAbout() {
    aboutSig = ''; renderAbout(); about.open();
    panel.classList.add('is-aside');
    aboutBtn.setAttribute('aria-expanded', 'true');
    if (isPhone()) about.setPeek(Math.round(window.innerHeight * 0.62));
    setTimeout(about.updateMore, 400); // once the sheet has risen: the fade says when more waits below
    if (hooks.onLayout) requestAnimationFrame(hooks.onLayout);
  }
  function closeAbout() {
    if (!about.isOpen()) return;
    closeSource(); about.close();
    panel.classList.remove('is-aside');
    aboutBtn.setAttribute('aria-expanded', 'false');
    if (hooks.onLayout) requestAnimationFrame(hooks.onLayout);
  }
  /** Where a cell was measured, in words: "the triple point" needs a sentence; numbers stay numbers. */
  const condText = c => (c === 'triple point' ? t('sample.d.cellAtTP') : t('sample.d.cellAt', { c: c === 'room temperature' ? t('sample.flag.room') : c }));
  function renderAbout() {
    const e = el, T = state.T, ss = ssAt(T), st = stateAt(e, T), ph = e.ph;
    const sp = ss.kind === 'gas' ? speedOf(e, T) : null;
    const sg = `${e.Z}|${getLang()}|${sigOf(ss)}|${C(T)}|${sp ? sig3(sp.ms) : ''}`;
    if (sg === aboutSig) return;
    aboutSig = sg;
    const rows = [];
    const row = (label, node, sub = null) => rows.push(h('dt', null, label), h('dd', null, node, sub ? h('small', { class: 'sample-sub' }, sub) : null));
    const vi = getLang() === 'vi';
    const hookKey = ss.kind === 'card' ? 'card' : ss.kind;
    row(t('sample.d.now'), valBtn(t('sample.d.nowV', { s: t('state.' + (st.s === 'unknown' ? 'unknown' : st.s)) }), t('sample.d.now'),
      [st.s, 'calc', { n: vi ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }]));
    if (ph.noSolid) row(t('sample.d.noSolid'), valBtn(t('sample.d.never'), t('sample.d.noSolid'), ph.noSolid));
    else if (ph.sub) row(t('sample.d.sub'), valBtn(fT(ph.sub[0]), t('f.sub'), ph.sub));
    else if (ph.mp) row(t('sample.d.mp'), valBtn(ph.mp[0] != null ? `${isPred(ph.mp) ? '≈ ' : ''}${fT(ph.mp[0])}` : null, t('f.mp'), ph.mp));
    if (ph.bp && ph.bp[0] != null) row(t('sample.d.bp'), valBtn(`${isPred(ph.bp) ? '≈ ' : ''}${fT(ph.bp[0])}`, t('f.bp'), ph.bp));
    if (ss.kind === 'solid') {
      const p = ss.phase, hexAxes = p.cell.gamma === 120, rh = /^rhombohedral/.test(p.name);
      const latText = hexAxes ? `a = ${fmtNum(p.cell.a, 2)} pm, c = ${fmtNum(p.cell.c, 2)} pm`
        : Math.abs(p.cell.a - p.cell.b) < 1e-6 && Math.abs(p.cell.a - p.cell.c) < 1e-6 ? `a = ${fmtNum(p.cell.a, 2)} pm`
          : `a = ${fmtNum(p.cell.a, 1)}, b = ${fmtNum(p.cell.b, 1)}, c = ${fmtNum(p.cell.c, 1)} pm`;
      const gloss = glossOf(p.name), tech = `${p.label ? p.label + ': ' : ''}${structText(p.name)}`;
      const posNote = vi ? `vị trí nguyên tử: ${p.sitesSrc === 'sym' ? 'do đối xứng quy định' : 'theo mục COD'}` : `atomic positions: ${p.sitesSrc === 'sym' ? 'fixed by symmetry' : 'from the COD entry'}`;
      row(t('sample.d.pattern'), valBtn(gloss || tech, t('sample.d.pattern'), [p.name, p.sitesSrc, { n: posNote }]), gloss ? tech : null);
      // the cell's sides; where it was measured goes to the source (a "triple point" needs a sentence)
      const measured = [p.cond ? condText(p.cond) : null, p.cellNote].filter(Boolean).join(' · ');
      if (rh && hexAxes && p.sites.length % 3 === 0) {
        // a rhombohedral crystal is listed on hexagonal axes (3 atoms); shown here as the slanted cube it
        // is (1 atom), computed from the measured cell, with the measured cell itself on its own row
        const A = p.cell.a, Cc = p.cell.c, side = Math.sqrt((A * A) / 3 + (Cc * Cc) / 9);
        const ang = (Math.acos((2 * Cc * Cc - 3 * A * A) / (2 * Cc * Cc + 6 * A * A)) * 180) / Math.PI;
        row(t('sample.d.cell'), valBtn(t('sample.d.cellRhV', { a: fmtNum(side, 1), ang: fmtNum(ang, 1) }), t('sample.d.cell'),
          [side, 'calc', { n: t('sample.d.cellRhN', { ha: fmtNum(A, 2), hc: fmtNum(Cc, 2) }) }]), t('sample.d.cellSub'));
        row(t('sample.d.perCell'), valBtn(String(p.sites.length / 3), t('sample.d.perCell'), [p.sites.length / 3, 'calc', { n: t('sample.d.perCellRhN', { k3: p.sites.length }) }]));
        row(t('sample.d.hex'), valBtn(t('sample.d.hexV', { a: fmtNum(A, 2), c: fmtNum(Cc, 2), k: p.sites.length }), t('sample.d.hex'), [A, p.cellSrc, { n: measured }]), t('sample.d.hexSub'));
      } else {
        row(t('sample.d.cell'), valBtn(latText, t('sample.d.cell'), [p.cell.a, p.cellSrc, { n: measured }]), t(hexAxes ? 'sample.d.cellSubHex' : 'sample.d.cellSub'));
        row(t('sample.d.perCell'), valBtn(String(p.sites.length), t('sample.d.perCell'), [p.sites.length, p.sitesSrc, { n: posNote }]));
      }
      row(t('sample.d.neighbours'), valBtn(t('sample.d.neighboursV', { cn: p.cn, d: fmtNum(p.dNN, 0) }), t('sample.d.neighbours'), [p.dNN, 'calc', { n: t('sample.d.neighboursN') }]),
        cellShown(T) ? h('span', { class: 'sample-cell-word' }, t('sample.d.neighboursSub')) : null);
      const Tm = ph.mp?.[0] ?? ph.sub?.[0];
      if (Tm) {
        const pc = 100 * data().model.lindemann[0] * Math.sqrt(Math.min(T, Tm) / Tm);
        row(t('sample.d.wobble'), valBtn(t('sample.d.wobbleV', { p: fmtNum(pc, 1) }), t('sample.d.wobble'), data().model.lindemann));
      }
    }
    if (ss.kind === 'card') {
      const cr = e.f.crystal;
      row(t('sample.d.crystal'), valBtn(cr && cr[0] ? structText(cr[0]) : null, t('f.crystal'), cr));
      const sh = shownOf(e, ss), whyKey = !sh ? 'sample.d.whyEmpty' : sh === 'mol' ? 'sample.d.whyMol' : 'sample.d.why';
      row(t(whyKey), valBtn(t('sample.d.whyV'), t(whyKey), [1, 'spec', { n: t('sample.d.whyN') }]));
    }
    if (sp) {
      const k = data().constants.kB[0], gap = Math.cbrt((k * T) / 101325) * 1e9, rv = e.f.rVdw?.[0];
      row(t('sample.d.speed'), valBtn(t('sample.d.speedV', { ms: fmtNum(sig3(sp.ms), 0), kmh: fmtNum(sig3(sp.ms * 3.6), 0) }), t('sample.d.speed'),
        [sp.ms, 'calc', { n: t('sample.d.speedN', { T: fT(T), M: fmtNum(sp.M, 3), mol: sp.n > 1 ? t('sample.d.speedMol', { n: sp.n }) : '' }) }]));
      row(t('sample.d.flying'), ph.gas ? valBtn(what(e, 'gas'), t('sample.d.flying'), ph.gas) : h('span', { class: 'sample-v is-plain' }, what(e, 'gas')));
      if (rv) row(t('sample.d.gap'), valBtn(t('sample.d.gapV', { d: fmtNum(gap, 1), x: fmtNum(Math.round((gap * 1000) / (2 * rv)), 0) }), t('sample.d.gap'),
        [gap, 'calc', { n: t('sample.d.gapN', { T: fT(T), r: fmtNum(rv, 0) }) }]));
      row(t('sample.d.slow'), valBtn(t('sample.d.slowV', { w: bigWords(SLOWDOWN), x: fmtSci(SLOWDOWN, 2) }), t('sample.d.slow'), [SLOWDOWN, 'model', { n: t('sample.d.slowN') }]));
    }
    if (e.f.halfLife) row(t('sample.d.life'), valBtn(lifeText(e.f.halfLife), t('sample.never.lifeSrc' + lifeKey(e.f.halfLife), { name: nameIn(e), A: e.f.halfLife[2]?.A || '' }), e.f.halfLife),
      e.f.halfLife[2]?.A ? t('sample.never.lifeSub' + lifeKey(e.f.halfLife), { name: nameIn(e), A: e.f.halfLife[2].A }) : null);
    const tent = e.f.halfLifeTent; // a longer-lived kind listed but not yet confirmed (oganesson-295)
    if (tent) row(t('sample.d.life'), valBtn(lifeText(tent), t('sample.never.tentSrc', { name: nameIn(e), A: tent[2]?.A || '' }), tent), t('sample.never.tentSub', { name: nameIn(e), A: tent[2]?.A || '' }));
    // notes: what the drawing simplifies
    const notes = [];
    if (ss.kind === 'gas') notes.push(t('sample.d.n.notScale'));
    if (ss.kind === 'liquid') notes.push(t('sample.d.n.liquid'));
    const nMol = perParticle(e), fluidOrMol = ss.kind === 'gas' || ss.kind === 'liquid' || (ss.kind === 'card' && ss.card === 'molecular' && nMol > 1);
    if (fluidOrMol && nMol > 1) notes.push(t(nMol === 2 ? 'sample.d.n.pairs' : nMol === 4 ? 'sample.d.n.tetra' : 'sample.d.n.ring', { f: formula(e, nMol), n: nMol }));
    if (ss.kind === 'solid') notes.push(t('sample.d.n.expansion'));
    if (ss.kind === 'solid') notes.push(t('sample.d.n.pm'));
    if (ss.kind === 'gas' || ss.kind === 'liquid') notes.push(t('sample.d.n.slow', { w: bigWords(SLOWDOWN) }));
    // the colours: the table's family colours, so the sample is recognisably the tile it came from; by day
    // quicksilver (a metal liquid at room temperature: mercury) is a mirror, frozen, liquid or boiling
    const mirror = METAL.includes(e.f.cat[0]) && stateAt(e, ROOM).s === 'liquid' && cellShown(T);
    notes.push(t(mirror ? 'sample.d.n.mirror' : 'sample.d.n.colour', { fam: famName(e), name: nameIn(e), Name: Name(e) }));
    replace(about.body,
      h('div', { class: 'sample-d-head' }, h('h2', { class: 'sample-d-title' }, t('sample.d.title')), h('p', { class: 'sample-d-meta' }, `${Name(e)} · ${C(T)}`)),
      h('p', { class: 'sample-d-hook' }, t(`sample.d.hook.${hookKey}`)),
      h('p', { class: 'sample-hint' }, t('sample.d.tap')),
      h('dl', { class: 'sample-facts' }, rows),
      notes.length ? h('div', { class: 'sample-notes' }, notes.map(n => h('p', null, n))) : null);
    about.setBar(h('span', { class: 'sample-d-bar' }, h('b', null, t('sample.d.title')), h('span', null, `${Name(e)} · ${C(T)}`)));
    requestAnimationFrame(() => requestAnimationFrame(about.updateMore)); // after the sheet has its height
  }

  function enter() {
    holdRow = false; heldRow = false;
    el = byZ(state.Z);
    layout();
    const neverNow = kind === 'never';
    panel.classList.toggle('is-never', neverNow);
    caption.hidden = row.hidden = actions.hidden = neverNow;
    never.hidden = !neverNow;
    if (neverNow) renderNever();
    lastCaption = ''; lastSig = ''; lastRead = ''; lastWord = ''; lastT = state.T;
    lastSig = sigOf(ssAt(state.T));
    if (!neverNow) { say(describe(state.T), Math.abs(state.T - ROOM) < 0.5 ? 'room' : 'state'); update(); renderButtons(); }
    if (about.isOpen()) { aboutSig = ''; renderAbout(); }
  }
  // a play or pause pressed with a mouse holds the row's layout (holdRow) until the pointer leaves it or the
  // sweep ends; a change it would have made waits (heldRow). Anything else re-lays it out at once.
  let mouseOnRow = false, holdRow = false, heldRow = false;
  function release() { holdRow = false; if (heldRow) { heldRow = false; lastBtns = ''; renderButtons(); } }
  actions.addEventListener('pointerover', ev => { mouseOnRow = ev.pointerType === 'mouse'; });
  actions.addEventListener('pointerleave', () => { mouseOnRow = false; release(); });
  // arriving by the scale dive, the panel steps aside until the camera has drawn back (STYLE §7)
  let arriving = null;
  function arrive(wait) {
    if (arriving) { arriving.obs.disconnect(); clearTimeout(arriving.t1); clearTimeout(arriving.t2); arriving = null; }
    panel.classList.toggle('is-arriving', wait);
    if (!wait) return;
    const a = arriving = { obs: null, t1: 0, t2: setTimeout(() => arrive(false), 4000) }; // never stuck hidden
    a.obs = new MutationObserver(() => {
      if (document.body.classList.contains('diving')) return;
      a.obs.disconnect();
      a.t1 = setTimeout(() => arrive(false), 900); // the camera's draw-back (1.2 s) is nearly done
    });
    a.obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  window.addEventListener('resize', () => { if (!panel.hidden && kind !== 'never') { layout(); renderButtons(); thermo.show(state.T); } });
  thermo.input.addEventListener('pointerdown', () => stop());
  thermo.input.addEventListener('input', () => { stop(); setT(thermo.valueAt(+thermo.input.value)); });
  thermo.input.addEventListener('keydown', ev => ev.stopPropagation()); // arrows move the thermometer, not the element

  return {
    panel, about,
    aboutOpen: () => about.isOpen(),
    closeAbout,
    show(on) {
      panel.hidden = !on;
      if (!on) { stop(); closeAbout(); arrive(false); return; }
      enter();
      arrive(document.body.classList.contains('diving') && !state.reduced);
      requestAnimationFrame(() => { if (!panel.hidden && kind !== 'never') { layout(); thermo.show(state.T); } });
    },
    onState(ch) {
      if (panel.hidden) return;
      if ('lang' in ch) { about.el.setAttribute('aria-label', t('sample.d.title')); }
      if ('Z' in ch || 'lang' in ch) { stop(); enter(); return; }
      if ('T' in ch || 'allotrope' in ch) { update(); renderButtons(); }
    },
    /** The forge view says the room has dimmed (hot enough to glow): name it, unless a moment just did. */
    onKiln(on) { if (on && !panel.hidden && kind !== 'never' && state.T < (events.find(x => x.T > ROOM) || { T: hi }).T) say(t('sample.ev.glow')); },
    stop,
  };
}
