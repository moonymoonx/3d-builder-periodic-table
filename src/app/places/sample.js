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
// Vietnamese sentences use the 13 familiar GDPT-2018 names (thuỷ ngân, nitơ, lưu huỳnh), else the IUPAC name
const gdpt = e => getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
const Name = e => (gdpt(e) ? cap(e.names.viAlt[0]) : name(e));
const nameIn = e => (gdpt(e) ? e.names.viAlt[0] : name(e).toLowerCase());
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const formula = (e, n) => e.sym + String(n).split('').map(d => SUB[+d]).join('');
/** Atoms per particle in the fluid (our data: N₂, P₄, S₈…; 1 for single atoms). */
const perParticle = e => (e.ph.gas && e.ph.gas[0] > 1 ? e.ph.gas[0] : 1);
/** The particles in the vessel, in words: "single atoms", "N₂ molecules". */
function what(e, kind) {
  const n = perParticle(e);
  if (n > 1) return t('sample.what.mol', { f: formula(e, n) });
  return t(kind === 'gas' ? 'sample.what.single' : 'sample.what.atoms');
}
/** Typical (root-mean-square) speed of the gas particles at T: √(3RT/M), R from CODATA. */
function speedOf(e, T) {
  const n = perParticle(e), M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * n;
  return { ms: rmsSpeed(T, M, data().constants.R[0]), M, n };
}
const sig3 = x => Number(x.toPrecision(3));
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
  if (k === 'gas') return { title: t('sample.door.cool'), sub: t(ph.noSolid ? 'sample.door.he' : 'sample.door.gas', { T: degC(ph.bp[0]) }) };
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
// Coloured by temperature itself: cold blue, paper at room temperature, the ember of heat, then the
// colours of glowing metal (the kit's heat-map slider and the forge's thermometer use the same colours).
const RAMP = [[73.15, '#6E8FBF'], [233.15, '#A9CBD6'], [293.15, '#E8D9B5'], [473.15, '#E8955A'], [873.15, '#B93E12'],
  [1273.15, '#E5612B'], [1773.15, '#F59A47'], [2473.15, '#FFD796'], [3273.15, '#FFF2C2']];
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
function rampAt(T) {
  if (T <= RAMP[0][0]) return RAMP[0][1];
  for (let i = 1; i < RAMP.length; i++) {
    if (T <= RAMP[i][0]) {
      const [T0, c0] = RAMP[i - 1], [T1, c1] = RAMP[i], f = (T - T0) / (T1 - T0), a = hex(c0), b = hex(c1);
      return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * f)).join(',')})`;
    }
  }
  return RAMP[RAMP.length - 1][1];
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
    for (const g of order) {
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
 * One big thermometer: events labelled above the rail, landmarks below, the fill coloured by
 * temperature from the cold end (the bulb) up to the thumb. Returns { el, input, layout(scale), show(T) }.
 * Every event is labelled, never an unexplained mark; ticks closer than a finger's width share one stem
 * and one label ("−249 °C freezes · −246 °C turns liquid"), and no label ever covers another's stem.
 */
function thermometer() {
  const fill = h('div', { class: 'sample-fill' });
  const rail = h('div', { class: 'sample-rail' }, fill);
  const ticks = h('div', { class: 'sample-ticks', 'aria-hidden': 'true' });
  const flags = h('div', { class: 'sample-flags', 'aria-hidden': 'true' });
  const input = h('input', { type: 'range', class: 'sample-range', min: '0', max: '1000', step: '1' });
  const el = h('div', { class: 'sample-track' }, ticks, rail, input, flags);
  let lo = ROOM, hi = ROOM + 100, lastClip = '';
  const pct = T => Math.max(0, Math.min(100, ((T - lo) / (hi - lo)) * 100));

  function layout({ lo: l, hi: hh, events, marks }) {
    lo = l; hi = hh;
    const W = Math.max(220, el.clientWidth || (isPhone() ? 330 : 620));
    const x = T => (pct(T) / 100) * W;
    // the fill: the colour of each temperature along the rail; the bulb takes the cold end's colour
    const stops = [[0, rampAt(lo)], ...RAMP.filter(([T]) => T > lo && T < hi).map(([T, c]) => [pct(T), c]), [100, rampAt(hi)]];
    fill.style.background = `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${p.toFixed(1)}%`).join(', ')})`;
    el.style.setProperty('--bulb', rampAt(lo));
    // ticks: those closer than 14 px share one stem and one label; labels never cover a stem
    const sorted = [...events].sort((a, b) => a.T - b.T);
    const groups = [];
    for (const ev of sorted) {
      const g = groups[groups.length - 1];
      if (g && x(ev.T) - x(g.items[g.items.length - 1].T) < 14) g.items.push(ev); else groups.push({ items: [ev] });
    }
    const spots = placeTicks(groups, W, x);
    replace(ticks, groups.map(g => {
      const sp = spots.get(g);
      const label = h('span', null, sp.parts.map((p, i) => [i ? h('small', { class: 'sample-tick__sep' }, ' · ') : null,
        h('b', null, p.num), p.word ? h('small', null, p.word) : null]));
      const node = h('span', { class: `sample-tick${g.items.some(ev => ev.p) ? ' is-pred' : ''}`, style: { left: `${((sp.px / W) * 100).toFixed(2)}%` } }, label);
      node.style.setProperty('--row', String(sp.r)); node.style.setProperty('--dx', `${sp.dx.toFixed(1)}px`);
      return node;
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
    replace(flags, fl.map(m => {
      const f = h('span', { class: `sample-flag${m.room ? ' is-room' : ''}`, style: { left: `${pct(m.T).toFixed(2)}%` } }, m.text);
      f.style.setProperty('--dx', `${m.dx.toFixed(1)}px`);
      return f;
    }));
    lastClip = '';
  }
  function show(T) {
    // the column rises from the bulb to the temperature, like a real thermometer's
    const clip = `inset(0 ${(100 - pct(T)).toFixed(1)}% 0 0 round 6px)`;
    if (clip !== lastClip) { lastClip = clip; fill.style.clipPath = clip; }
    const v = String(Math.round(pct(T) * 10));
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
  const roomBtn = h('button', { type: 'button', class: 'ui-btn ui-btn--quiet sample-room', onclick: () => { stop(); setT(ROOM); } });
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
  const setT = T => set({ T: Math.round(Math.max(lo, Math.min(hi, T)) * 100) / 100 });
  function say(text) {
    if (!text || text === lastCaption) return;
    lastCaption = text; replace(caption, text);
    caption.classList.remove('is-new'); void caption.offsetWidth; caption.classList.add('is-new');
  }
  const ssAt = T => sampleStateAt(el, T, state.allotrope);
  const sigOf = ss => `${ss.kind}|${ss.card || ''}|${ss.phase ? ss.phase.id : ''}`;

  /** One sentence for the sample at T; at room temperature an invitation follows (what to do here). */
  function describe(T) {
    const ss = ssAt(T), room = Math.abs(T - ROOM) < 0.5;
    const at = room ? t('sample.at.room', { Name: Name(el) }) : t('sample.at.T', { Name: Name(el), T: degC(T) });
    let s;
    if (ss.kind === 'gas') s = t('sample.cap.gas', { at, what: what(el, 'gas'), v: kmh(speedOf(el, T).ms) });
    else if (ss.kind === 'liquid') s = t('sample.cap.liquid', { at, what: what(el, 'liquid') });
    else if (ss.kind === 'solid') s = t('sample.cap.solidCn', { at, cn: ss.phase.cn });
    else s = t(cardKey(ss), { at, n: el.lat.atoms });
    if (!room) return s;
    const inv = kind === 'card' ? (el.ph.sub ? 'sample.invite.sub' : 'sample.invite.melt')
      : dirs.cool && dirs.heat ? 'sample.invite.both' : dirs.cool ? 'sample.invite.cool' : 'sample.invite.heat';
    return `${s} ${t(inv)}`;
  }
  /** Why the vessel stands empty, for a solid we do not draw. */
  function cardKey(ss) {
    if (ss.card === 'molecular') return 'sample.cap.molecular';
    if (ss.card === 'complex') return el.lat.atoms ? 'sample.cap.complex' : 'sample.cap.complexPlain';
    if (ss.card === 'phase') return 'sample.cap.complexPlain';
    return 'sample.cap.predictedCrystal';
  }
  /** The moment the sample changes: the event just crossed, in the direction of travel. */
  function moment(T0, T1, ss) {
    const up = T1 > T0;
    const crossed = events.filter(x => (x.T - T0) * (x.T - T1) < 0).sort((a, b) => Math.abs(a.T - T1) - Math.abs(b.T - T1))[0];
    if (!crossed) return describe(T1);
    const at = degC(crossed.T), w = what(el, ss.kind);
    if (crossed.key === 'trans') return ss.kind === 'solid' ? t('sample.ev.restack', { T: at, cn: ss.phase.cn }) : t('sample.ev.freezeComplex', { T: at });
    if (crossed.key === 'sub') return up ? t('sample.ev.sub', { T: at, what: what(el, 'gas') }) : t('sample.ev.deposit', { T: at });
    if (crossed.key === 'boil') return t(up ? 'sample.ev.boil' : 'sample.ev.condense', { T: at, what: what(el, 'liquid') });
    // melting point
    if (up) {
      if (ss.kind !== 'liquid') return describe(T1);
      if (blackbody(crossed.T).glow > 0.05) return t('sample.ev.meltGlow', { T: at });
      return lastSig.startsWith('card') ? t('sample.ev.meltCard', { T: at, what: w }) : t('sample.ev.melt', { T: at });
    }
    if (ss.kind === 'solid') return t('sample.ev.freezeCn', { T: at, cn: ss.phase.cn });
    if (ss.card === 'molecular') return t('sample.ev.freezeMol', { T: at });
    if (ss.card === 'complex' || ss.card === 'phase') return t('sample.ev.freezeComplex', { T: at });
    return t('sample.ev.freezePred', { T: at });
  }

  // ---- the scale: events above the rail, landmarks below -------------------------------------------
  function layout() {
    el = byZ(state.Z);
    kind = placeKind(el);
    ({ lo, hi } = rangeOf(el));
    events = eventsOf(el).filter(x => x.T > lo && x.T < hi);
    dirs = { cool: lo < ROOM - 0.5, heat: hi > ROOM + 0.5 && events.some(x => x.T > ROOM) };
    const tick = x => {
      const cold = x.T < ROOM;
      const key = x.key === 'melt' ? (cold ? 'freeze' : 'melt') : x.key === 'boil' ? (cold ? 'condense' : 'boil') : x.key === 'sub' ? (cold ? 'deposit' : 'sub') : 'trans';
      return { T: x.T, key: x.key, p: x.p, num: x.p ? `≈ ${C(x.T)}` : degC(x.T), word: t(`sample.tick.${key}`) };
    };
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
    thermo.layout({ lo, hi, events: events.map(tick), marks: marks.filter(m => m.room || m.end || ((m.T - lo) / (hi - lo) > 0.03 && (hi - m.T) / (hi - lo) > 0.02)) });
    thermo.input.setAttribute('aria-label', t('sample.thermo'));
    panel.setAttribute('aria-label', t('sample.label'));
    // the buttons: cold to the left, hot to the right; the element's main story is the ink one
    coolBtn.classList.toggle('ui-btn--primary', kind === 'gas' || kind === 'liquid');
    coolBtn.classList.toggle('ui-btn--secondary', !(kind === 'gas' || kind === 'liquid'));
    heatBtn.classList.toggle('ui-btn--primary', !(kind === 'gas' || kind === 'liquid'));
    heatBtn.classList.toggle('ui-btn--secondary', kind === 'gas' || kind === 'liquid');
    replace(actions, dirs.cool && dirs.heat ? [coolBtn, roomBtn, heatBtn] : dirs.cool ? [coolBtn, roomBtn] : [heatBtn, roomBtn]);
    lastBtns = '';
  }

  function update() {
    if (!el) return;
    const T = state.T, ss = ssAt(T);
    const rd = C(T);
    if (rd !== lastRead) { lastRead = rd; replace(read, rd); }
    let wd = '';
    if (ss.kind === 'gas') wd = t('sample.word.gas', { v: kmh(speedOf(el, T).ms) });
    else if (ss.kind === 'liquid') wd = t('sample.word.liquid');
    else if (ss.kind === 'solid') wd = t('sample.word.solidCn', { cn: ss.phase.cn });
    else if (kind !== 'never') wd = t('sample.word.solidCard');
    if (wd !== lastWord) { lastWord = wd; replace(word, wd); }
    const vt = wd ? `${rd} · ${wd}` : rd; // what a screen reader says for the thermometer (not 0–1000)
    if (vt !== lastVt) { lastVt = vt; thermo.input.setAttribute('aria-valuetext', vt); }
    thermo.show(T);
    // name the moment when the sample changes; at room temperature (not playing) the invitation returns
    const sg = sigOf(ss);
    if (sg !== lastSig) { if (lastSig) say(moment(lastT, T, ss)); lastSig = sg; }
    if (Math.abs(T - ROOM) < 0.5 && !playing) say(describe(T)); // back at room temperature: what to do here
    if (el.ph.noSolid && T <= lo + 0.6) say(t('sample.ev.neverFreezes'));
    lastT = T;
    if (about.isOpen()) renderAbout();
  }
  function renderButtons() {
    const key = `${playing ? playing.dir : 0}|${state.T <= lo + 0.5}|${state.T >= hi - 0.5}|${Math.abs(state.T - ROOM) < 0.5}|${getLang()}`;
    if (key === lastBtns) return;
    lastBtns = key;
    replace(coolBtn, playing && playing.dir < 0 ? t('sample.pause') : state.T <= lo + 0.5 ? t('sample.coolAgain') : t('sample.cool'));
    replace(heatBtn, playing && playing.dir > 0 ? t('sample.pause') : state.T >= hi - 0.5 ? t('sample.heatAgain') : t('sample.heat'));
    replace(roomBtn, t('sample.room'));
    roomBtn.disabled = Math.abs(state.T - ROOM) < 0.5;
    replace(aboutBtn, t('sample.about'));
  }

  // ---- "◀ Cool it" / "Heat it ▶": sweep to the end, stopping just past each event so its caption is read
  function toggle(dir) { if (playing && playing.dir === dir) stop(); else start(dir); }
  function start(dir) {
    stop();
    const end = dir < 0 ? lo : hi;
    if (Math.abs(state.T - end) < 1) setT(ROOM); // at the end already: start again from room temperature
    let T = state.T, hold = 0;
    const speed = (hi - lo) / 10; // the whole scale in about ten seconds, as in the forge
    const ahead = () => (dir > 0 ? events.filter(x => x.T > T + 0.05) : events.filter(x => x.T < T - 0.05).reverse());
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
      T = dir > 0 ? Math.min(hi, T2) : Math.max(lo, T2);
      setT(T);
      if (T === end) { playing = null; renderButtons(); return false; }
      return true;
    });
    renderButtons();
  }
  function stop() { if (playing) { playing.cancel(); playing = null; renderButtons(); } }

  // ---- never made in bulk: what we know, and a way on -------------------------------------------------
  const valBtn = (text, label, v, cls = 'sample-v') => (v && v[0] != null
    ? h('button', { type: 'button', class: cls + (isPred(v) ? ' is-est' : ''), onclick: ev => showSource(ev.currentTarget, label, v, el, text) }, text)
    : h('span', { class: `${cls} is-none` }, text || t('sample.notKnown')));
  /** "8.1 h" (NUBASE) -> "8.1 hours"; estimated half-lives keep NUBASE's flag and read "≈". */
  function lifeText(v) {
    const m = /^([\d.]+)\s*(ms|s|m|h|d|y)$/.exec(v[2]?.t || '');
    const pre = isPred(v) ? '≈ ' : '';
    if (!m) return `${pre}${fmtSci(v[0], 3)}${NB}s`;
    const n = getLang() === 'vi' ? m[1].replace('.', ',') : m[1];
    return pre + t(`sample.${+m[1] === 1 ? 'unit1' : 'unit'}.${m[2]}`, { v: n });
  }
  function renderNever() {
    const e = el, life = e.f.halfLife, st = stateAt(e, ROOM), mp = e.ph.mp;
    const stV = e.f.state && isPred(e.f.state) ? e.f.state : [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
    const cells = [
      [t('sample.never.life'), life ? valBtn(lifeText(life), t('sample.never.lifeSrc', { name: nameIn(e), A: life[2]?.A || '' }), life) : valBtn(null)],
      [t('sample.never.state'), st.s === 'unknown' ? valBtn(null) : valBtn(t('state.' + st.s), t('f.state'), stV)],
      [t('sample.never.melts'), mp && mp[0] != null ? valBtn(isPred(mp) ? `≈ ${C(mp[0])}` : degC(mp[0]), t('f.mp'), mp) : valBtn(null)], // a prediction: whole degrees
    ];
    const shells = new Set(e.cfg.filter(x => x[2] > 0).map(x => x[0])).size, nE = e.cfg.reduce((s, x) => s + x[2], 0);
    replace(never,
      h('h2', { class: 'sample-never__title' }, t('sample.never.title', { name: nameIn(e) })),
      h('p', { class: 'sample-never__body' }, t('sample.never.body')),
      h('div', { class: 'sample-strip' }, cells.map(([l, v]) => h('div', { class: 'sample-strip__cell' }, h('span', { class: 'sample-strip__label' }, l), v))),
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
    if (hooks.onLayout) requestAnimationFrame(hooks.onLayout);
  }
  function closeAbout() {
    if (!about.isOpen()) return;
    closeSource(); about.close();
    panel.classList.remove('is-aside');
    aboutBtn.setAttribute('aria-expanded', 'false');
    if (hooks.onLayout) requestAnimationFrame(hooks.onLayout);
  }
  function renderAbout() {
    const e = el, T = state.T, ss = ssAt(T), st = stateAt(e, T), ph = e.ph;
    const sp = ss.kind === 'gas' ? speedOf(e, T) : null;
    const sg = `${e.Z}|${getLang()}|${sigOf(ss)}|${C(T)}|${sp ? sig3(sp.ms) : ''}`;
    if (sg === aboutSig) return;
    aboutSig = sg;
    const rows = [];
    const row = (label, node) => rows.push(h('dt', null, label), h('dd', null, node));
    const vi = getLang() === 'vi';
    const hookKey = ss.kind === 'card' ? 'card' : ss.kind;
    row(t('sample.d.now'), valBtn(t('sample.d.nowV', { s: t('state.' + (st.s === 'unknown' ? 'unknown' : st.s)) }), t('sample.d.now'),
      [st.s, 'calc', { n: vi ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }]));
    if (ph.noSolid) row(t('sample.d.noSolid'), valBtn(t('sample.d.never'), t('sample.d.noSolid'), ph.noSolid));
    else if (ph.sub) row(t('sample.d.sub'), valBtn(fT(ph.sub[0]), t('f.sub'), ph.sub));
    else if (ph.mp) row(t('sample.d.mp'), valBtn(ph.mp[0] != null ? `${isPred(ph.mp) ? '≈ ' : ''}${fT(ph.mp[0])}` : null, t('f.mp'), ph.mp));
    if (ph.bp && ph.bp[0] != null) row(t('sample.d.bp'), valBtn(`${isPred(ph.bp) ? '≈ ' : ''}${fT(ph.bp[0])}`, t('f.bp'), ph.bp));
    if (ss.kind === 'solid') {
      const p = ss.phase;
      const latText = p.cell.gamma === 120 ? `a = ${fmtNum(p.cell.a, 2)} pm, c = ${fmtNum(p.cell.c, 2)} pm`
        : Math.abs(p.cell.a - p.cell.b) < 1e-6 && Math.abs(p.cell.a - p.cell.c) < 1e-6 ? `a = ${fmtNum(p.cell.a, 2)} pm`
          : `a = ${fmtNum(p.cell.a, 1)}, b = ${fmtNum(p.cell.b, 1)}, c = ${fmtNum(p.cell.c, 1)} pm`;
      row(t('sample.d.pattern'), valBtn(`${p.label ? p.label + ': ' : ''}${structText(p.name)}`, t('sample.d.pattern'),
        [p.name, p.sitesSrc, { n: `atomic positions: ${p.sitesSrc === 'sym' ? 'fixed by symmetry' : 'from the COD entry'}` }]));
      row(t('sample.d.cell'), valBtn(latText + (p.cond ? ` (${p.cond})` : ''), t('sample.d.cell'),
        [p.cell.a, p.cellSrc, { n: [p.cond ? `measured at ${p.cond}` : null, p.cellNote].filter(Boolean).join(' · ') }]));
      row(t('sample.d.perCell'), h('span', { class: 'sample-v is-plain' }, String(p.sites.length)));
      row(t('sample.d.neighbours'), h('span', { class: 'sample-v is-plain' }, t('sample.d.neighboursV', { cn: p.cn, d: fmtNum(p.dNN, 0) })));
      const Tm = ph.mp?.[0] ?? ph.sub?.[0];
      if (Tm) {
        const pc = 100 * data().model.lindemann[0] * Math.sqrt(Math.min(T, Tm) / Tm);
        row(t('sample.d.wobble'), valBtn(t('sample.d.wobbleV', { p: fmtNum(pc, 1) }), t('sample.d.wobble'), data().model.lindemann));
      }
    }
    if (ss.kind === 'card') {
      const cr = e.f.crystal;
      row(t('sample.d.crystal'), valBtn(cr && cr[0] ? structText(cr[0]) : null, t('f.crystal'), cr));
      row(t('sample.d.why'), valBtn(t('sample.d.whyV'), t('sample.d.why'), [1, 'spec', { n: t('sample.d.whyN') }]));
    }
    if (sp) {
      const k = data().constants.kB[0], gap = Math.cbrt((k * T) / 101325) * 1e9, rv = e.f.rVdw?.[0];
      row(t('sample.d.speed'), valBtn(t('sample.d.speedV', { ms: fmtNum(sig3(sp.ms), 0), kmh: fmtNum(sig3(sp.ms * 3.6), 0) }), t('sample.d.speed'),
        [sp.ms, 'calc', { n: t('sample.d.speedN', { T: fT(T), M: fmtNum(sp.M, 3), mol: sp.n > 1 ? t('sample.d.speedMol', { n: sp.n }) : '' }) }]));
      row(t('sample.d.flying'), ph.gas ? valBtn(what(e, 'gas'), t('sample.d.flying'), ph.gas) : h('span', { class: 'sample-v is-plain' }, what(e, 'gas')));
      if (rv) row(t('sample.d.gap'), valBtn(t('sample.d.gapV', { d: fmtNum(gap, 1), x: fmtNum(Math.round((gap * 1000) / (2 * rv)), 0) }), t('sample.d.gap'),
        [gap, 'calc', { n: t('sample.d.gapN', { T: fT(T), r: fmtNum(rv, 0) }) }]));
      row(t('sample.d.slow'), valBtn(t('sample.d.slowV', { x: fmtSci(SLOWDOWN, 2) }), t('sample.d.slow'), [SLOWDOWN, 'model', { n: t('sample.d.slowN') }]));
    }
    if (e.f.halfLife) row(t('sample.d.life'), valBtn(lifeText(e.f.halfLife), t('sample.never.lifeSrc', { name: nameIn(e), A: e.f.halfLife[2]?.A || '' }), e.f.halfLife));
    // notes: what the drawing simplifies
    const notes = [];
    if (ss.kind === 'gas') notes.push(t('sample.d.n.notScale'));
    if (ss.kind === 'liquid') notes.push(t('sample.d.n.liquid'));
    if ((ss.kind === 'gas' || ss.kind === 'liquid') && perParticle(e) > 2) notes.push(t('sample.d.n.bead', { f: formula(e, perParticle(e)) }));
    if ((ss.kind === 'gas' || ss.kind === 'liquid') && perParticle(e) === 2) notes.push(t('sample.d.n.pairs', { f: formula(e, 2) }));
    if (ss.kind === 'solid') notes.push(t('sample.d.n.expansion'));
    if (ss.kind === 'gas' || ss.kind === 'liquid') notes.push(t('sample.d.n.slow', { x: fmtSci(SLOWDOWN, 2) }));
    replace(about.body,
      h('div', { class: 'sample-d-head' }, h('h2', { class: 'sample-d-title' }, t('sample.d.title')), h('p', { class: 'sample-d-meta' }, `${Name(e)} · ${C(T)}`)),
      h('p', { class: 'sample-d-hook' }, t(`sample.d.hook.${hookKey}`)),
      h('p', { class: 'sample-hint' }, t('sample.d.tap')),
      h('dl', { class: 'sample-facts' }, rows),
      notes.length ? h('div', { class: 'sample-notes' }, notes.map(n => h('p', null, n))) : null);
    about.setBar(h('span', { class: 'sample-d-bar' }, h('b', null, t('sample.d.title')), h('span', null, `${Name(e)} · ${C(T)}`)));
    requestAnimationFrame(about.updateMore);
  }

  function enter() {
    el = byZ(state.Z);
    layout();
    const neverNow = kind === 'never';
    panel.classList.toggle('is-never', neverNow);
    caption.hidden = row.hidden = actions.hidden = neverNow;
    never.hidden = !neverNow;
    if (neverNow) renderNever();
    lastCaption = ''; lastSig = ''; lastRead = ''; lastWord = ''; lastT = state.T;
    lastSig = sigOf(ssAt(state.T));
    if (!neverNow) { say(describe(state.T)); update(); renderButtons(); }
    if (about.isOpen()) { aboutSig = ''; renderAbout(); }
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
      if (!on) { stop(); closeAbout(); return; }
      enter();
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
