// Lenses: the ways to look at the home table (REDESIGN-PLAN §2). A lens decides colour (family or
// state at a temperature) and height (flat, or one property), and opens with a one-line hook whose
// numbers are read from the data. Pure logic: no DOM, no three.js.
import { t, fmtNum } from '../i18n.js';
import { bySym, propValue, elements, name } from '../data.js';

// top row of chips (Gemini critique: physical wonder first; "grip" and "pull" never side by side)
export const TOP = ['families', 'heat', 'mp', 'density', 'rCov', 'ie1'];
export const MORE = ['en', 'year', 'abund', 'bp', 'ea', 'aw', 'rVdw', 'zeff'];
export const ALL = [...TOP, ...MORE];
const LOG = new Set(['density', 'abund']);

/** State changes a lens makes to the table (colour mode, flat or property heights, log scale). */
export function lensSettings(id) {
  if (id === 'families') return { color: 'cat', flat: true };
  if (id === 'heat') return { color: 'state', flat: true };
  return { color: 'cat', flat: false, prop: id, log: LOG.has(id) };
}

const C = K => `${fmtNum(K - 273.15, Math.abs(K - 273.15) < 100 ? 1 : 0)} °C`.replace(/^-/, '−');
/** The hook line for a lens, with its numbers filled from our data. */
export function lensHook(id) {
  const v = (sym, key) => propValue(bySym(sym), key);
  const p = {};
  if (id === 'mp') { p.w = C(v('W', 'mp')[0]); p.ga = C(v('Ga', 'mp')[0]); }
  if (id === 'density') p.au = `${fmtNum(v('Au', 'density')[0], 1)} kg`;
  if (id === 'rCov') p.li = `${fmtNum(v('Li', 'rCov')[0], 0)} pm`;
  if (id === 'en') p.f = fmtNum(v('F', 'en')[0], 2);
  return t(`lens.${id}.hook`, p);
}
/** Elements that never melt at 1 atm (they turn straight into gas), read from the data. */
export const sublimers = () => elements().filter(e => e.ph.sub && !propValue(e, 'mp'));
export function lensCaption(id) {
  if (id !== 'mp') return t(`lens.${id}.cap`);
  const names = sublimers().map(e => name(e));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} ${t('and')} ${names[names.length - 1].toLowerCase()}` : names[0] || '';
  return t('lens.mp.cap', { subs: list });
}
export const lensName = id => t('lens.' + id);
