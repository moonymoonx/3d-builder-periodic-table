// Patterns across the table: what each chart plots and the facts its callouts state, all computed from
// the data (REDESIGN-PLAN §2 "Patterns"). Pure logic: no DOM, no wording (strings-patterns.js has the
// words; places/patterns.js puts them together). A callout is only offered when the data bears it out,
// so a claim can never outlive the numbers it rests on (tests/patterns.test.mjs checks them all).
import { propValue, stateAt, isPred } from '../data.js';
import { fmtNum, fmtSci } from '../i18n.js';

// the same plain names and order as the home lenses (places/lenses.js): numbers only, no families/heat map
export const TOP = ['mp', 'density', 'rCov', 'ie1'];
export const MORE = ['en', 'year', 'abund', 'bp', 'ea', 'aw', 'rVdw', 'zeff'];
export const ALL = [...TOP, ...MORE];
export const has = id => ALL.includes(id);

const K0 = 273.15, ROOM = 293.15;
export const AIR_G_PER_L = 1.2041; // dry air at 20 °C, 1 atm (Wikipedia "Density of air"; QUESTIONS.md Q15)
const row = e => e.f.period[0];
const meas = v => !!v && !isPred(v);

// ---- one plotted point per element ------------------------------------------------------------------------
// y is in display units (°C for temperatures, kg per litre for heft, years, …); v is the sourced value
// ([value, source, flags]) that a tap opens; kind marks the special points the key explains.
const temp = key => e => {
  const v = propValue(e, key);
  if (v) return { y: v[0] - K0, v, kind: 'value' };
  // never melts at normal pressure: stands where it turns straight into gas (as on the table's lens)
  if (key === 'mp' && e.ph.sub && e.ph.sub[0] != null) return { y: e.ph.sub[0] - K0, v: e.ph.sub, kind: 'sub' };
  return null;
};
/** Gases are weighed at 20 °C (ideal-gas scaling of PubChem's 0 °C value), as on the element card. */
export const isGasAtRoom = e => stateAt(e, ROOM).s === 'gas';
const heft = e => {
  const v = propValue(e, 'density');
  if (!v) return null;
  if (!isGasAtRoom(e)) return { y: v[0], v, kind: 'value' };
  const y = (v[0] * K0) / ROOM;
  return { y, v, kind: 'gas' };
};
const plain = key => e => { const v = propValue(e, key); return v ? { y: v[0], v, kind: 'value' } : null; };
const year = e => {
  const v = e.f.year;
  if (v && typeof v[0] === 'number') return { y: v[0], v, kind: 'value' };
  if (v && v[0] === 'ancient') return { y: null, v, kind: 'ancient' };
  return null;
};

/**
 * How each pattern is drawn. scale: 'zero' (honest, from zero), 'temp' (from absolute zero, °C),
 * 'log' (each step ×10), 'year' (a range of years). room: draw the room-temperature line.
 */
const SPECS = {
  mp: { point: temp('mp'), scale: 'temp', room: true },
  bp: { point: temp('bp'), scale: 'temp', room: true },
  density: { point: heft, scale: 'zero' },
  rCov: { point: plain('rCov'), scale: 'zero' },
  rVdw: { point: plain('rVdw'), scale: 'zero' },
  ie1: { point: plain('ie1'), scale: 'zero' },
  en: { point: plain('en'), scale: 'zero' },
  ea: { point: plain('ea'), scale: 'zero' },
  aw: { point: plain('aw'), scale: 'zero' },
  abund: { point: plain('abund'), scale: 'log' },
  year: { point: year, scale: 'year', lines: false }, // discovery dates do not repeat by row: dots only
  zeff: { point: plain('zeff'), scale: 'zero' },
};
export const spec = id => SPECS[id] || SPECS.ie1;
export function points(id, els) {
  const sp = spec(id);
  const out = [];
  for (const e of els) { const p = sp.point(e); if (p) out.push({ Z: e.Z, e, ...p, pred: isPred(p.v) }); }
  return out;
}

/** The value as people read it: °C first, a litre's weight in kg (gases in g), grams per tonne, … */
export function fmtPoint(id, p) {
  const y = p.y;
  const pre = p.pred ? '≈ ' : '';
  switch (id) {
    case 'mp': case 'bp': { const c = y; return `${pre}${fmtNum(c, Math.abs(c) < 100 ? 1 : 0)} °C`.replace('-', '−'); }
    case 'density': return p.kind === 'gas' ? `${pre}${fmtNum(y * 1000, y * 1000 < 1 ? 2 : 1)} g` : `${pre}${fmtNum(y, y < 10 ? 2 : 1)} kg`;
    case 'rCov': case 'rVdw': return `${pre}${fmtNum(y, 0)} pm`;
    case 'ie1': case 'ea': return `${pre}${fmtNum(y, 2, { minDigits: 2 })} eV`;
    case 'en': case 'zeff': return `${pre}${fmtNum(y, 2, { minDigits: 2 })}`;
    case 'aw': return p.v[2] && p.v[2].mass ? `[${y}]` : `${pre}${fmtNum(y, y < 10 ? 3 : y < 100 ? 2 : 1)}`;
    case 'abund': return y >= 0.01 ? `${fmtNum(y, y < 1 ? 3 : y < 100 ? 1 : 0)} g` : `${fmtSci(y, 2)} g`;
    case 'year': return p.kind === 'ancient' ? null : String(y);
    default: return `${pre}${fmtNum(y, 2)}`;
  }
}

// ---- facts behind the words: extremes, row patterns, dips ------------------------------------------------
const byRow = pts => { const m = new Map(); for (const p of pts) { const r = row(p.e); if (!m.has(r)) m.set(r, []); m.get(r).push(p); } return m; };
const measured = pts => pts.filter(p => meas(p.v) && p.kind !== 'ancient' && p.y != null);
const maxOf = pts => pts.reduce((a, b) => (b.y > a.y ? b : a), pts[0]);
const minOf = pts => pts.reduce((a, b) => (b.y < a.y ? b : a), pts[0]);
/** Rows (from..to) whose highest (or lowest) measured point belongs to a family: the points where it holds. */
function rowExtremes(pts, { from, to, pick, cat }) {
  const rows = byRow(measured(pts)), out = [];
  for (let r = from; r <= to; r++) {
    const rp = rows.get(r);
    if (!rp || rp.length < 2) continue;
    const x = pick === 'max' ? maxOf(rp) : minOf(rp);
    if (!cat || cat.includes(x.e.f.cat[0])) out.push(x);
  }
  return out;
}
const Zs = pts => pts.map(p => p.Z);
const at = (pts, sym) => pts.find(p => p.e.sym === sym) || null;

/**
 * The facts each chart's words rest on. Returns { params, callouts }:
 *  params   numbers and elements the question and answer quote (raw; the place formats them);
 *  callouts [{ key, anchors: [Z], lead: Z, params }]: a note pointing at the points it is about.
 * A callout appears only when the data bears it out (e.g. at least four rows really start with their
 * biggest atom).
 */
export function facts(id, els) {
  const pts = points(id, els), m = measured(pts);
  const params = {}, callouts = [];
  const note = (key, anchors, lead, p = {}) => { if (anchors.length) callouts.push({ key, anchors, lead: lead ?? anchors[0], params: p }); };
  const top = m.length ? maxOf(m) : null, low = m.length ? minOf(m) : null;
  switch (id) {
    case 'rCov': case 'rVdw': {
      const big = rowExtremes(pts, { from: 2, to: 7, pick: 'max', cat: ['alkali'] });
      if (big.length >= 4) note('start', Zs(big), (big.find(p => row(p.e) === 4) || big[0]).Z);
      if (id === 'rCov') {
        const small = rowExtremes(pts, { from: 2, to: 5, pick: 'min' });
        if (small.length >= 3) note('shrink', Zs(small), (small.find(p => row(p.e) === 3) || small[0]).Z);
        if (low) note('smallest', [low.Z], low.Z, { name: low.Z, v: low });
      } else {
        if (top) note('biggest', [top.Z], top.Z, { name: top.Z, v: top });
        if (low) note('smallest', [low.Z], low.Z, { name: low.Z, v: low });
      }
      params.big = top; params.small = low;
      break;
    }
    case 'ie1': {
      const hold = rowExtremes(pts, { from: 1, to: 6, pick: 'max', cat: ['noble-gas'] });
      const loose = rowExtremes(pts, { from: 2, to: 7, pick: 'min', cat: ['alkali'] });
      if (hold.length >= 4) note('hold', Zs(hold), hold[1] ? hold[1].Z : hold[0].Z);
      if (loose.length >= 4) note('loose', Zs(loose), (loose.find(p => row(p.e) === 4) || loose[0]).Z);
      // the little dips after beryllium and nitrogen (Wikipedia "Ionization energy"): read from the data
      const dip = (a, b) => { const pa = at(m, a), pb = at(m, b); return pa && pb && pb.y < pa.y ? [pa, pb] : null; };
      const d1 = dip('Be', 'B'), d2 = dip('N', 'O');
      if (d1 && d2) note('dips', [d1[1].Z, d2[1].Z], d2[1].Z, { a: d1[0].Z, b: d2[0].Z });
      params.na = at(pts, 'Na'); params.ne = at(pts, 'Ne'); params.top = top;
      params.neSecond = !!(params.ne && m.filter(p => p.y > params.ne.y).length === 1);
      break;
    }
    case 'en': {
      if (top) note('top', [top.Z], top.Z, { name: top.Z, v: top });
      const weak = rowExtremes(pts, { from: 2, to: 7, pick: 'min', cat: ['alkali'] });
      if (weak.length >= 4) note('weak', Zs(weak), (weak.find(p => row(p.e) === 5) || weak[0]).Z);
      const o = at(m, 'O');
      if (o) note('oxygen', [o.Z], o.Z, { name: o.Z, v: o });
      params.top = top;
      break;
    }
    case 'mp': case 'bp': {
      // a sublimation point is not a melting point: carbon stands tallest but never melts
      const melt = m.filter(p => p.kind === 'value');
      const hot = melt.length ? maxOf(melt) : null, cold1 = melt.length ? minOf(melt) : null;
      if (id === 'mp') {
        const subs = m.filter(p => p.kind === 'sub');
        const tallest = subs.length ? maxOf(subs) : null;
        if (tallest && hot && tallest.y > hot.y) note('sub', [tallest.Z], tallest.Z, { name: tallest.Z, v: tallest });
        if (hot) note('top', [hot.Z], hot.Z, { name: hot.Z, v: hot });
      } else {
        if (hot) note('top', [hot.Z], hot.Z, { name: hot.Z, v: hot });
        if (cold1) note('low', [cold1.Z], cold1.Z, { name: cold1.Z, v: cold1 });
      }
      const cold = rowExtremes(melt, { from: 2, to: 6, pick: 'min', cat: ['noble-gas'] });
      if (cold.length >= 4) note('cold', Zs(cold), (cold.find(p => row(p.e) === 5) || cold[0]).Z);
      params.top = hot; params.low = cold1;
      break;
    }
    case 'density': {
      if (top) note('top', [top.Z], top.Z, { name: top.Z, v: top });
      const gases = pts.filter(p => p.kind === 'gas' && meas(p.v));
      if (gases.length >= 4) note('gases', Zs(gases), (at(gases, 'Kr') || gases[gases.length - 1]).Z);
      const au = at(m, 'Au');
      if (au && au !== top) note('gold', [au.Z], au.Z, { name: au.Z, v: au });
      params.top = top; params.au = au; params.he = at(pts, 'He');
      break;
    }
    case 'ea': {
      if (top) note('top', [top.Z], top.Z, { name: top.Z, v: top });
      const salt = rowExtremes(pts, { from: 2, to: 6, pick: 'max', cat: ['halogen'] });
      if (salt.length >= 4) note('salt', Zs(salt), (salt.find(p => row(p.e) === 4) || salt[0]).Z);
      params.top = top;
      break;
    }
    case 'aw': {
      // the weight steps back where the order (protons) and the weight disagree; measured weights only
      const sorted = [...m].sort((a, b) => a.Z - b.Z), back = [];
      for (let i = 1; i < sorted.length; i++) if (sorted[i].Z === sorted[i - 1].Z + 1 && sorted[i].y < sorted[i - 1].y && !(sorted[i].v[2] && sorted[i].v[2].mass)) back.push([sorted[i - 1], sorted[i]]);
      if (back.length) note('back', back.map(([, b]) => b.Z), back[0][1].Z, { a: back[0][0].Z, b: back[0][1].Z });
      const heaviest = maxOf(pts);
      if (heaviest) note('top', [heaviest.Z], heaviest.Z, { name: heaviest.Z, v: heaviest });
      if (low) note('low', [low.Z], low.Z, { name: low.Z, v: low });
      params.back = back.length;
      break;
    }
    case 'abund': {
      const o = at(m, 'O'), si = at(m, 'Si'), au = at(m, 'Au'), fe = at(m, 'Fe');
      // oxygen and silicon lead by far: they are the top two
      const two = [...m].sort((a, b) => b.y - a.y).slice(0, 2);
      if (o && si && two.includes(o) && two.includes(si)) note('lead', [o.Z, si.Z], si.Z, { pct: (o.y + si.y) / 1e4 });
      if (au) note('gold', [au.Z], au.Z, { name: au.Z, v: au });
      params.o = o; params.si = si; params.au = au; params.fe = fe;
      params.feGold = au && fe ? fe.y / au.y : null;
      params.pct = o && si ? (o.y + si.y) / 1e4 : null;
      break;
    }
    case 'year': {
      if (low) note('first', [low.Z], low.Z, { name: low.Z, v: low });
      if (top) note('last', [top.Z], top.Z, { name: top.Z, v: top });
      params.ancient = pts.filter(p => p.kind === 'ancient').length;
      params.first = low; params.last = top;
      break;
    }
    case 'zeff': {
      const climb = rowExtremes(pts, { from: 2, to: 4, pick: 'max', cat: ['noble-gas'] });
      if (climb.length >= 3) note('climb', Zs(climb), climb[1].Z);
      const drop = rowExtremes(pts, { from: 2, to: 6, pick: 'min', cat: ['alkali'] });
      if (drop.length >= 4) note('drop', Zs(drop), (drop.find(p => row(p.e) === 4) || drop[0]).Z);
      break;
    }
    default: break;
  }
  return { params, callouts, points: pts };
}

/** Lines that join the dots: across each row (period), or down each column (group). */
export function lineGroups(mode, els) {
  const m = new Map();
  for (const e of els) {
    const k = mode === 'group' ? (e.f.group[0] ? `g${e.f.group[0]}` : null) : `p${row(e)}`;
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(e.Z);
  }
  for (const zs of m.values()) zs.sort((a, b) => a - b); // by Z: across a row, or down a column
  return m;
}
export const lineKey = (mode, e) => (mode === 'group' ? (e.f.group[0] ? `g${e.f.group[0]}` : null) : `p${row(e)}`);
/** The first atomic number of each row: 1, 3, 11, 19, 37, 55, 87 (and 119 to close the last). */
export const ROW_STARTS = [1, 3, 11, 19, 37, 55, 87, 119];
