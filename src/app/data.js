// Access to the embedded dataset (<script type="application/json" id="pt-data">).
import { t, getLang, fmtNum, fmtSci, cap } from './i18n.js';

let D = null;
const bySymbol = new Map();
export function loadData() {
  D = JSON.parse(document.getElementById('pt-data').textContent);
  for (const e of D.elements) {
    bySymbol.set(e.sym.toLowerCase(), e);
    e.search = [e.sym, e.names.en[0], e.names.alias?.[0], e.names.vi[0], e.names.viAlt?.[0]].filter(Boolean).map(fold);
  }
  return D;
}
export const data = () => D;
export const elements = () => D.elements;
export const byZ = Z => D.elements[Z - 1];
export const bySym = s => bySymbol.get(String(s).toLowerCase());
export const source = key => D.sources[key] || { name: key };

/** Accent-insensitive folding for search (Vietnamese đ -> d). */
export const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function name(e, lang = getLang()) { return cap(lang === 'vi' ? e.names.vi[0] : e.names.en[0]); }
export function altName(e, lang = getLang()) {
  if (lang === 'vi') return e.names.viAlt ? e.names.viAlt[0] : null;
  return null;
}

/** Ranked search over symbol, Z, EN/VI names (accent-insensitive). */
export function search(q, limit = 8) {
  const f = fold(q);
  if (!f) return [];
  const scored = [];
  for (const e of D.elements) {
    let s = 0;
    if (/^\d+$/.test(f)) s = String(e.Z) === f ? 100 : String(e.Z).startsWith(f) ? 20 : 0;
    else if (fold(e.sym) === f) s = 90;
    else if (e.search.some(x => x === f)) s = 80;
    else if (e.search.some(x => x.startsWith(f))) s = 60 - Math.min(20, e.Z / 10);
    else if (f.length >= 2 && e.search.some(x => x.includes(f))) s = 30;
    if (s) scored.push([s, e]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].Z - b[1].Z).slice(0, limit).map(x => x[1]);
}

// ---- values -------------------------------------------------------------------------------
export const val = (e, key) => e.f[key] || null;
export const num = (e, key) => { const v = e.f[key]; return v && typeof v[0] === 'number' ? v[0] : null; };
export const isPred = v => !!(v && v[2] && v[2].p);

/** Effective nuclear charge felt by the outermost electron (highest n, then highest l). */
export function outerZeff(e) {
  let best = null;
  for (const [k, v] of Object.entries(e.zeff)) {
    const n = +k[0], l = 'spdf'.indexOf(k[1]);
    if (!best || n > best.n || (n === best.n && l > best.l)) best = { n, l, v, k };
  }
  return best ? [best.v[0], best.v[1], { ...(best.v[2] || {}), n: `${best.k} electron${best.v[2]?.n ? ' · ' + best.v[2].n : ''}` }] : null;
}

/** Column-height properties. get(e) -> [value, source, flags] | null */
export const PROPS = [
  { key: 'rCov', unit: 'pm', digits: 0 },
  { key: 'ie1', unit: 'eV', digits: 2 },
  { key: 'en', unit: '', digits: 2 },
  { key: 'mp', unit: 'K', digits: 0, temp: true },
  { key: 'bp', unit: 'K', digits: 0, temp: true },
  { key: 'density', unit: 'g/cm³', digits: 3, log: true },
  { key: 'rVdw', unit: 'pm', digits: 0 },
  { key: 'ea', unit: 'eV', digits: 2 },
  { key: 'aw', unit: '', digits: 3, get: e => (e.f.aw && e.f.aw[0] != null ? e.f.aw : e.f.massNumber ? [e.f.massNumber[0], e.f.massNumber[1], { ...(e.f.massNumber[2] || {}), mass: 1 }] : null) },
  { key: 'abund', unit: 'mg/kg', digits: 3, log: true, sci: true },
  { key: 'year', unit: '', digits: 0, get: e => (e.f.year && typeof e.f.year[0] === 'number' ? e.f.year : null) },
  { key: 'zeff', unit: '', digits: 2, get: outerZeff },
];
export const prop = key => PROPS.find(p => p.key === key) || PROPS[0];
export function propValue(e, key) {
  const p = prop(key);
  const v = p.get ? p.get(e) : e.f[key];
  return v && typeof v[0] === 'number' ? v : null;
}
/** min/max over all elements (positive values only when log scale). */
export function propRange(key, log) {
  let lo = Infinity, hi = -Infinity;
  for (const e of D.elements) {
    const v = propValue(e, key);
    if (!v) continue;
    const x = v[0];
    if (log && !(x > 0)) continue;
    lo = Math.min(lo, x); hi = Math.max(hi, x);
  }
  return { lo, hi };
}

// ---- state of matter at temperature T (1 atm) ------------------------------------------
export function stateAt(e, T) {
  const ph = e.ph;
  const P = v => isPred(v);
  if (ph.noSolid) {
    if (!ph.bp || ph.bp[0] == null) return { s: 'unknown' };
    return { s: T < ph.bp[0] ? 'liquid' : 'gas', p: P(ph.bp) };
  }
  if (ph.sub) return { s: T < ph.sub[0] ? 'solid' : 'gas', p: P(ph.sub) };
  const mp = ph.mp && ph.mp[0], bp = ph.bp && ph.bp[0];
  if (mp == null) return { s: 'unknown' };
  if (T < mp) return { s: 'solid', p: P(ph.mp) };
  if (bp == null) return { s: 'unknown' };
  return { s: T < bp ? 'liquid' : 'gas', p: P(ph.mp) || P(ph.bp) };
}

// ---- formatting ---------------------------------------------------------------------------
export const K0 = 273.15;
export function fmtTemp(K, { both = true } = {}) {
  if (K == null) return '—';
  const c = K - K0;
  const kStr = `${fmtNum(K, K < 30 ? 2 : 0)} K`;
  return both ? `${kStr} (${fmtNum(c, K < 30 ? 2 : Math.abs(c) < 100 ? 2 : 0)} °C)` : kStr;
}
/** Human string for a [value, src, flags] of field `key`. */
export function fmtField(key, v) {
  if (!v || v[0] == null) return null;
  const x = v[0];
  const unit = D.fields[key]?.unit;
  switch (key) {
    case 'mp': case 'bp': case 'sub': return fmtTemp(x);
    case 'aw': return v[2]?.t ? `${v[2].t.replace('.', getLang() === 'vi' ? ',' : '.')}${v[2].u ? ` ± ${fmtNum(v[2].u, 6)}` : ''}` : fmtNum(x, 6);
    case 'density': return `${x < 0.01 ? fmtSci(x, 4) : fmtNum(x, 4)} g/cm³`;
    case 'abund': return `${fmtSci(x, 3)} mg/kg`;
    case 'halfLife': return v[2]?.t ? `${v[2].t.replace(/\bY\b/, getLang() === 'vi' ? 'năm' : 'years')}` : `${fmtSci(x)} s`;
    case 'year': return typeof x === 'number' ? String(x) : t('ancient');
    case 'state': return t('state.' + x);
    case 'natural': return t('nat.' + x);
    case 'cat': return t('cat.' + x);
    case 'ie1': case 'ie2': case 'ie3': case 'ea': return `${fmtNum(x, 4)} eV`;
    case 'rCov': case 'rVdw': return `${fmtNum(x, 1)} pm`;
    case 'rNuc': return `${fmtNum(x, 3)} fm`;
    case 'en': return fmtNum(x, 2);
    case 'massNumber': return `[${x}]`;
    default:
      if (typeof x === 'number') return `${fmtNum(x, 4)}${unit ? ' ' + unit : ''}`;
      return String(x);
  }
}
export function fmtProp(key, v) {
  if (!v) return t('tip.nodata');
  const p = prop(key);
  if (p.temp) return fmtTemp(v[0]);
  if (key === 'aw' && v[2]?.mass) return `[${v[0]}]`;
  const s = p.sci ? fmtSci(v[0], 3) : fmtNum(v[0], p.digits);
  return p.unit ? `${s} ${p.unit}` : s;
}
