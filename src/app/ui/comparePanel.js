// Side by side: the logic behind the place (places/compare.js) and its stage (views/compare.js). No DOM.
// Curated surprising pairs first (DESIGN-STUDY §4.7, REDESIGN-PLAN §2), a partner for any element, the
// facts compared and the takeaway sentence's ingredients. Every number comes from our data; the curated
// takeaways' premises are checked against it in tests/compare.test.mjs.
import { elements, byZ, bySym, propValue, stateAt, isPred, data } from '../data.js';
import { cellVolume } from '../../physics/lattice.js';

const ROOM = 293.15, K0 = 273.15;

/** Neighbours of an element in the table: [{dir, e}] (above, below, before, after). */
export function neighbours(e) {
  const els = elements(), out = [];
  const g = e.f.group[0], p = e.f.period[0];
  const find = dp => (e.fIndex != null ? els.find(x => x.fIndex === e.fIndex && x.f.period[0] === p + dp) : els.find(x => x.fIndex == null && x.f.group[0] === g && x.f.period[0] === p + dp));
  const up = find(-1), down = find(1);
  if (up) out.push({ dir: 'above', e: up });
  if (down) out.push({ dir: 'below', e: down });
  if (e.Z > 1) out.push({ dir: 'left', e: byZ(e.Z - 1) });
  if (e.Z < 118) out.push({ dir: 'right', e: byZ(e.Z + 1) });
  return out;
}
/** The partner when none is chosen: the element below (or above) it. */
export function defaultPartner(Z) {
  const n = neighbours(byZ(Z));
  return (n.find(x => x.dir === 'below') || n.find(x => x.dir === 'above') || n[0]).e.Z;
}

/** Surprising pairs, offered first. `forms`: one element's two measured solid forms side by side. */
export const CURATED = [
  { id: 'au-hg', a: 'Au', b: 'Hg', refs: ['chemworld-hg', 'rsc-hg'] },
  { id: 'he-os', a: 'He', b: 'Os', refs: ['density-of-air', 'rsc-he', 'pubchem'] },
  { id: 'na-cl', a: 'Na', b: 'Cl', refs: ['ionic-bonding', 'electron-affinity', 'nist'] },
  { id: 'c-c', a: 'C', b: 'C', forms: ['graphite', 'diamond'], refs: ['allotropes-of-carbon', 'rsc-c', 'cod'] },
  { id: 'h-og', a: 'H', b: 'Og', refs: ['synthetic', 'nubase'] },
];
const zOf = s => bySym(s).Z;
export function curatedOf(Za, Zb) {
  return CURATED.find(c => (zOf(c.a) === Za && zOf(c.b) === Zb) || (zOf(c.a) === Zb && zOf(c.b) === Za)) || null;
}
/** Can this element stand beside itself (its two solid forms)? Only the curated carbon pair. */
export const twoForms = Z => CURATED.some(c => c.forms && zOf(c.a) === Z);

// ---- one element's facts, as the card states them ----------------------------------------------------------
/** What a litre weighs, in kg (gases at 20 °C, ideal-gas scaled from PubChem's 0 °C value), with its source. */
export function litre(e) {
  const d = e.f.density;
  if (!d || d[0] == null) return null;
  const gas = stateAt(e, ROOM).s === 'gas';
  return { kg: gas ? (d[0] * K0) / ROOM : d[0], gas, v: d, pred: isPred(d) };
}
export const radiusOf = (e, mode) => { const v = mode === 'vdw' ? e.f.rVdw : e.f.rCov; return v && v[0] != null ? v : null; };
export const meltK = e => (e.ph.mp && e.ph.mp[0] != null && !isPred(e.ph.mp) ? e.ph.mp[0] : null);

/**
 * The takeaway for any pair, decided like the card's "Side by side" door (places/elementCard.js pairHook),
 * so the door's promise and the place agree: the first and the last; both liquid; a litre 100× heavier;
 * a solid next to a gas; litre for litre the same; 1.5× heavier; melting 300 °C apart; next-door
 * neighbours; the same family; else their sizes. Measured values only, never predictions.
 */
export function pairStory(a, b) {
  if ((a.Z === 1 && b.Z === 118) || (a.Z === 118 && b.Z === 1)) return { kind: 'firstLast' };
  const sa = stateAt(a, ROOM), sb = stateAt(b, ROOM);
  const la = litre(a), lb = litre(b);
  const ok = l => l && !l.pred;
  const ratio = ok(la) && ok(lb) ? Math.max(la.kg, lb.kg) / Math.min(la.kg, lb.kg) : null;
  const heavy = ratio ? (la.kg > lb.kg ? [a, b] : [b, a]) : null;
  const known = s => s.s !== 'unknown' && !s.p;
  if (known(sa) && known(sb)) {
    if (sa.s === 'liquid' && sb.s === 'liquid') return { kind: 'bothLiquid' };
    if (ratio >= 100) return { kind: 'heavier', heavy: heavy[0], light: heavy[1], r: ratio };
    if (sa.s !== sb.s) return { kind: 'states', sa: sa.s, sb: sb.s };
  }
  if (ratio && ratio < 1.03) return { kind: 'same' };
  if (ratio && ratio >= 1.5) return { kind: 'heavier', heavy: heavy[0], light: heavy[1], r: ratio };
  const ma = meltK(a), mb = meltK(b);
  if (ma && mb && Math.abs(ma - mb) >= 300) return { kind: 'hotter', hot: ma > mb ? a : b, cold: ma > mb ? b : a, d: Math.abs(ma - mb) };
  if (Math.abs(a.Z - b.Z) === 1) return { kind: 'next' };
  if (a.f.group[0] && a.f.group[0] === b.f.group[0]) return { kind: 'family' };
  const ra = radiusOf(a, 'cov'), rb = radiusOf(b, 'cov');
  if (ra && rb) return { kind: 'size', big: ra[0] >= rb[0] ? a : b, small: ra[0] >= rb[0] ? b : a, r: Math.max(ra[0], rb[0]) / Math.min(ra[0], rb[0]) };
  return { kind: 'none' };
}
/** The ratio as the card writes it: 2.4, 136, 136,000 (three significant figures above 1,000). */
export const ratioValue = r => (r < 10 ? Math.round(r * 10) / 10 : r < 1000 ? Math.round(r) : Number(r.toPrecision(3)));

// ---- the curated pairs' numbers -----------------------------------------------------------------------------
/** Numbers the curated takeaways quote (raw), plus whether each premise holds in the data. */
export function curatedFacts(id) {
  const g = s => bySym(s);
  if (id === 'au-hg') {
    const au = g('Au'), hg = g('Hg');
    return { holds: hg.Z === au.Z + 1 && stateAt(au, ROOM).s === 'solid' && stateAt(hg, ROOM).s === 'liquid' };
  }
  if (id === 'he-os') {
    const he = litre(g('He')), os = litre(g('Os'));
    const densest = elements().filter(e => e.f.density && e.f.density[0] != null && !isPred(e.f.density)).every(e => e.f.density[0] <= os.kg);
    return { he, os, r: os.kg / he.kg, air: 1.2041 / (he.kg * 1000), holds: he.gas && densest };
  }
  if (id === 'na-cl') {
    const na = g('Na'), cl = g('Cl');
    const top = elements().filter(e => e.f.ea && e.f.ea[0] != null).every(e => e.f.ea[0] <= cl.f.ea[0]);
    return { na: propValue(na, 'ie1'), cl: propValue(cl, 'ea'), holds: top && na.f.cat[0] === 'alkali' };
  }
  if (id === 'c-c') { const f = forms(g('C')); return { forms: f, holds: f.length === 2 && f[0].cn < f[1].cn }; }
  if (id === 'h-og') {
    const h = propValue(g('H'), 'aw'), og = propValue(g('Og'), 'aw');
    return { r: og[0] / h[0], og, h, holds: !!(h && og) };
  }
  return { holds: false };
}

// ---- one element, two solid forms (carbon: graphite and diamond), from the measured crystals ------------------
/**
 * The two room-temperature forms drawn side by side: name, neighbours per atom and their distance (from the
 * COD positions and the Arblaster cell), and what a litre weighs, computed from the cell and the atomic
 * weight (atoms × weight ÷ (Avogadro × cell volume)). Ordered by neighbours (graphite 3, diamond 4).
 */
export function forms(e) {
  const NA = data().constants.NA[0], aw = e.f.aw[0];
  return (e.lat.phases || []).filter(p => p.cell && p.sites && p.cn).map(p => {
    const vol = cellVolume(p.cell) * 1e-30; // pm³ -> cm³
    const kg = (p.sites.length * aw) / (NA * vol); // g/cm³ = kg per litre
    return { id: p.id, label: p.label, name: p.name, cn: p.cn, dNN: p.dNN, kg, phase: p, atoms: p.sites.length, vol: cellVolume(p.cell) / 1e6 };
  }).sort((x, y) => x.cn - y.cn);
}
