// Global app state + shareable URL hash (#v=table&el=Fe&p=ie1&lay=s18&lang=vi ...).
const listeners = new Set();
export const VIEWS = ['table', 'atom', 'sample', 'trends', 'compare', 'quiz'];
export const LAYOUTS = ['s18', 's32', 'helix'];

export const state = {
  view: 'table', Z: 26, Z2: 29,
  prop: 'ie1', log: false, layout: 's18', color: 'cat', T: 293.15,
  lang: 'en', more: false,
  filters: { cats: null, blocks: null, group: 0, period: 0, state: '', origin: '' },
  quality: 'auto', tier: 'med', reduced: false, cb: false, fps: false,
  orbital: null, density: 'orbital', surf: true, allotrope: null, trendLine: 'period', cmpR: 'cov',
  // quiz staging (never in the URL): highlighted elements, equal column heights, selection ring hidden
  marks: null, flat: false, hideSel: false,
};

export function set(patch, { silent = false } = {}) {
  const changed = {};
  for (const [k, v] of Object.entries(patch)) if (state[k] !== v) { state[k] = v; changed[k] = v; }
  if (!Object.keys(changed).length) return;
  if (!silent) for (const fn of listeners) fn(changed);
  scheduleHash();
}
export function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ---- URL hash ---------------------------------------------------------------------------
const HASH_KEYS = { v: 'view', el: 'Z', el2: 'Z2', p: 'prop', log: 'log', lay: 'layout', col: 'color', T: 'T', lang: 'lang', orb: 'orbital', den: 'density', alt: 'allotrope', line: 'trendLine', rad: 'cmpR' };
let hashTimer = 0, symOf = Z => Z, zOf = s => s;
export function initHash(symbolOf, zFromSymbol) { symOf = symbolOf; zOf = zFromSymbol; }
export function readHash() {
  const q = new URLSearchParams(location.hash.replace(/^#/, ''));
  const out = {};
  for (const [h, k] of Object.entries(HASH_KEYS)) {
    if (!q.has(h)) continue;
    const raw = q.get(h);
    if (k === 'Z' || k === 'Z2') { const z = zOf(raw); if (z) out[k] = z; }
    else if (k === 'log') out.log = raw === '1';
    else if (k === 'T') { const T = Number(raw); if (T > 0 && T < 7000) out.T = T; }
    else if (k === 'view') { if (VIEWS.includes(raw)) out.view = raw; }
    else if (k === 'layout') { if (LAYOUTS.includes(raw)) out.layout = raw; }
    else if (k === 'lang') { if (raw === 'vi' || raw === 'en') out.lang = raw; }
    else if (k === 'density') { if (raw === 'total' || raw === 'orbital') out.density = raw; }
    else if (k === 'trendLine') { if (raw === 'period' || raw === 'group') out.trendLine = raw; }
    else if (k === 'cmpR') { if (raw === 'cov' || raw === 'vdw') out.cmpR = raw; }
    else out[k] = raw;
  }
  return out;
}
function writeHash() {
  const q = new URLSearchParams();
  q.set('v', state.view); q.set('el', symOf(state.Z));
  if (state.view === 'compare') q.set('el2', symOf(state.Z2));
  if (state.view === 'table' || state.view === 'trends') { q.set('p', state.prop); if (state.log) q.set('log', '1'); }
  if (state.view === 'table') { q.set('lay', state.layout); if (state.color !== 'cat') q.set('col', state.color); }
  if (state.view === 'sample' || state.color === 'state') q.set('T', String(Math.round(state.T * 100) / 100));
  if (state.view === 'atom') { if (state.orbital) q.set('orb', state.orbital); if (state.density !== 'orbital') q.set('den', state.density); }
  if (state.view === 'sample' && state.allotrope) q.set('alt', state.allotrope);
  if (state.view === 'trends' && state.trendLine !== 'period') q.set('line', state.trendLine);
  if (state.view === 'compare' && state.cmpR !== 'cov') q.set('rad', state.cmpR);
  q.set('lang', state.lang);
  const h = '#' + q.toString();
  if (location.hash !== h) history.replaceState(null, '', h);
}
function scheduleHash() { clearTimeout(hashTimer); hashTimer = setTimeout(writeHash, 250); }
export const shareURL = () => { writeHash(); return location.href; };
