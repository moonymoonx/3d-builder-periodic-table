// Data sheet: element header, kid-first summary, ~30 sourced facts ("More" for adults).
// Every value is a button: tap it to see its source, note, flags and what other sources say.
import { h, replace, clear, isPhone } from '../dom.js';
import { t, getLang, fmtNum, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { data, byZ, name, altName, fmtField, fmtTemp, stateAt, outerZeff } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { glowColour, toHex } from '../../physics/color.js';
import { showSource, closeSource } from './source.js';

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const prettyConfig = s => String(s).replace(/([spdf])(\d+)/g, (_, l, n) => l + n.split('').map(c => SUP[c]).join(''));
export const prettyTerm = s => String(s).replace(/^(\d+)([A-Z])(\*?)<?([\d/]+)>?$/, (_, m, L, odd, J) => `${m.split('').map(c => SUP[c]).join('')}${L}${odd ? '°' : ''}${J.replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]).replace('/', '⁄')}`);

/** Kid-first summary sentences generated from the data (our own words). */
export function summary(e) {
  const nm = name(e);
  let s = t(e.Z === 1 ? 'sum.proton1' : 'sum.protons', { name: nm, Z: e.Z });
  const A = e.f.nucA?.[0];
  if (A) s += A - e.Z === 0 ? t('sum.neutron0') : A - e.Z === 1 ? t('sum.neutron1') : t('sum.neutrons', { N: A - e.Z });
  const st = stateAt(e, 293.15);
  if (st.s !== 'unknown') s += t(st.p ? 'sum.stateP' : 'sum.state', { state: t('state.' + st.s) });
  const ph = e.ph;
  if (ph.noSolid) s += t('sum.nosolid', { bp: fmtTemp(ph.bp?.[0]) });
  else if (ph.sub) s += t('sum.sublimes', { sub: fmtTemp(ph.sub[0]) });
  else if (ph.mp?.[0] != null && ph.bp?.[0] != null) s += t('sum.melts', { mp: fmtTemp(ph.mp[0]), bp: fmtTemp(ph.bp[0]) });
  else if (ph.mp?.[0] != null) s += t('sum.meltsOnly', { mp: fmtTemp(ph.mp[0]) });
  const cat = t('cat.' + e.f.cat[0]).toLowerCase();
  const a = /^[aeiou]/i.test(cat) ? 'an' : 'a';
  s += e.f.group[0] ? t('sum.family', { a, cat, g: e.f.group[0], p: e.f.period[0] }) : t('sum.familyF', { a, cat, p: e.f.period[0] });
  if (e.f.madelung[0] === 'exception') s += t('sum.exception');
  if (e.lat.kind === 'predicted' && e.Z >= 100) s += t('sum.fewAtoms');
  return s;
}

export function buildSheet(container, { onView }) {
  const panel = h('section', { class: 'panel', 'aria-label': t('sh.data') });
  container.append(panel);
  const openSource = (btn, label, v, e) => showSource(btn, label, v, e);
  const closePop = closeSource;

  const valueBtn = (label, v, e, text) => {
    if (!v) return h('span', { class: 'v none' }, '—');
    const shown = text ?? (v[0] == null ? (v[2]?.n ? '—' : t('src.none')) : fmtField(label.key, v));
    const b = h('button', { class: 'v' + (v[2]?.p ? ' pred' : '') + (v[0] == null ? ' none' : ''), type: 'button' }, shown);
    b.addEventListener('click', () => openSource(b, label.text, v, e));
    if (v[0] == null && v[2]?.n) b.title = v[2].n;
    return b;
  };

  function rowsFor(e) {
    const f = e.f;
    const st = stateAt(e, 293.15);
    const rows = [];
    const add = (key, v, opts = {}) => rows.push({ key, label: opts.label || t('f.' + key), v, text: opts.text, more: !!opts.more, extra: opts.extra });
    add('Z', [e.Z, 'pc'], { text: String(e.Z) });
    add('cat', f.cat);
    add('place', f.period, { text: [f.group[0] ? `${t('group')} ${f.group[0]}` : null, `${t('period')} ${f.period[0]}`, `${t('block')} ${f.block[0]}`].filter(Boolean).join(' · ') });
    if (f.aw[0] != null) add('aw', f.aw); else if (f.massNumber) add('massNumber', f.massNumber);
    add('config', f.config, { text: prettyConfig(f.config[0]), extra: f.madelung[0] === 'exception' ? h('span', { class: 'badge', title: f.madelung[2].n }, t('madelung.exception', { d: f.madelung[2].d.join(', ') })) : null });
    const stV = [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
    add('state', stV, { text: t('state.' + st.s) });
    add('mp', f.mp); add('bp', f.bp);
    if (f.sub) add('sub', f.sub);
    add('density', f.density);
    add('en', f.en); add('ie1', f.ie1);
    add('rCov', f.rCov);
    add('crystal', f.crystal);
    add('year', f.year);
    add('natural', f.natural);
    // adult details
    if (f.term) add('term', f.term, { more: true, text: prettyTerm(f.term[0]) });
    add('madelung', f.madelung, { more: true, text: f.madelung[0] === 'exception' ? t('madelung.exception', { d: f.madelung[2].d.join(', ') }) : t('madelung.follows') });
    if (f.ie2) add('ie2', f.ie2, { more: true });
    if (f.ie3) add('ie3', f.ie3, { more: true });
    add('ea', f.ea, { more: true });
    add('rVdw', f.rVdw, { more: true });
    add('ox', f.ox, { more: true });
    if (f.latticeText) add('latticeText', f.latticeText, { more: true });
    add('abund', f.abund, { more: true });
    if (f.discoverers) add('discoverers', f.discoverers, { more: true });
    add('nStable', f.nStable, { more: true });
    if (f.isoMain) add('isoMain', f.isoMain, { more: true });
    if (f.halfLife) add('halfLife', f.halfLife, { more: true });
    if (f.rNuc) add('rNuc', f.rNuc, { more: true });
    const zo = outerZeff(e);
    if (zo) add('zeff', zo, { more: true, text: `${fmtNum(zo[0], 2)} (${zo[2].n.split(' ')[0]})` });
    if (f.awStd) add('awStd', f.awStd, { more: true, label: `${t('f.aw')} (CIAAW)` });
    const ln = e.lines;
    const lv = ln.none ? [null, 'none', { n: ln.none }] : [ln.v.length, 'nist-lines', { n: `${ln.n} lines listed by NIST in 380–750 nm; the ${ln.v.length} strongest are used` }];
    let sw = null;
    if (!ln.none) {
      const g = glowColour(ln.v, data().cmfFit.v, data().srgb.v);
      if (g.ok) sw = h('span', { class: 'sw', style: { display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px', background: toHex(g.rgb) }, title: 'approximate glow colour' });
    }
    add('lines', lv, { more: true, text: ln.none ? t('lines.none') : t('lines.count', { n: ln.n, k: ln.v.length }), extra: sw });
    return rows;
  }

  function render() {
    closePop();
    const e = byZ(state.Z);
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    const alt = altName(e);
    const head = h('div', { class: 'el-head' },
      h('div', { class: 'el-sym', style: { background: pal[e.f.cat[0]] } }, h('small', null, String(e.Z)), e.sym),
      h('div', { class: 'el-name' }, h('b', null, name(e)), alt ? h('span', null, alt) : null, h('span', null, t('cat.' + e.f.cat[0]))),
      h('div', { class: 'nav' },
        h('button', { 'aria-label': t('sh.prev'), onclick: () => set({ Z: e.Z > 1 ? e.Z - 1 : 118 }) }, '‹'),
        h('button', { 'aria-label': t('sh.next'), onclick: () => set({ Z: e.Z < 118 ? e.Z + 1 : 1 }) }, '›')));
    const cta = h('div', { class: 'cta' },
      h('button', { class: 'btn primary', onclick: () => onView('atom') }, t('sh.atom')),
      h('button', { class: 'btn', onclick: () => onView('sample') }, t('sh.sample')),
      h('button', { class: 'btn', onclick: () => onView('compare') }, t('sh.compare')));
    const dl = h('dl', { class: 'facts' });
    for (const r of rowsFor(e)) {
      if (r.more && !state.more) continue;
      dl.append(h('dt', null, r.label), h('dd', null, valueBtn({ key: r.key, text: r.label }, r.v, e, r.text), r.extra || null));
    }
    replace(panel, head, h('p', { class: 'summary' }, summary(e)), cta, h('p', { class: 'hint', style: { padding: '0 14px' } }, t('sh.tap')), dl,
      h('button', { class: 'btn more-toggle', onclick: () => set({ more: !state.more }) }, state.more ? t('sh.less') : t('sh.more')));
  }
  return { render, panel, closePop };
}
