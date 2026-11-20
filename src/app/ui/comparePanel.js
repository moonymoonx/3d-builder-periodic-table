// Compare panel: the two elements, partner suggestions, swap, plain sentences and ratio bars.
import { h, replace } from '../dom.js';
import { t, fmtNum, cap, getLang } from '../i18n.js';
import { state, set } from '../state.js';
import { elements, byZ, name, altName, propValue, fmtProp, stateAt } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { valueButton } from './source.js';

const ROWS = [['rCov', 'rCov'], ['rVdw', 'rVdw'], ['aw', 'aw'], ['ie1', 'ie1'], ['en', 'en'], ['ea', 'ea'], ['mp', 'mp'], ['bp', 'bp'], ['density', 'density']];

/** Neighbours of an element in the table: [{dir, e}] */
export function neighbours(e) {
  const els = elements(), out = [];
  const g = e.f.group[0], p = e.f.period[0];
  const find = (dp) => (e.fIndex != null ? els.find(x => x.fIndex === e.fIndex && x.f.period[0] === p + dp) : els.find(x => x.fIndex == null && x.f.group[0] === g && x.f.period[0] === p + dp));
  const up = find(-1), down = find(1);
  if (up) out.push({ dir: 'above', e: up });
  if (down) out.push({ dir: 'below', e: down });
  if (e.Z > 1) out.push({ dir: 'left', e: byZ(e.Z - 1) });
  if (e.Z < 118) out.push({ dir: 'right', e: byZ(e.Z + 1) });
  return out;
}
export function defaultPartner(Z) {
  const n = neighbours(byZ(Z));
  return (n.find(x => x.dir === 'below') || n.find(x => x.dir === 'above') || n[0]).e.Z;
}

const ratioText = (a, b) => {
  const r = Math.max(a, b) / Math.min(a, b);
  return r < 1.05 ? null : fmtNum(r, r < 10 ? 2 : 1, { sig: r < 10 ? 3 : 2 });
};

/** Plain sentences for the most telling differences. */
export function sentences(a, b, mode = 'cov') {
  const out = [];
  const v = (e, k) => propValue(e, k)?.[0];
  const pair = (k) => [v(a, k), v(b, k)];
  // element names are common nouns: lower case mid-sentence; in Vietnamese add the familiar name, e.g. "iron (sắt)"
  const nm = e => { const n = name(e).toLowerCase(), alt = altName(e); return getLang() === 'vi' && alt && alt.toLowerCase() !== n ? `${n} (${alt})` : n; };
  const push = s => out.push(cap(s));
  const big = (x, y) => (x >= y ? [a, b] : [b, a]);
  let [x, y] = pair(mode === 'vdw' ? 'rVdw' : 'rCov');
  if (x && y) { const r = ratioText(x, y); const [B, Sm] = big(x, y); push(r ? t('cmp.s.size', { big: nm(B), small: nm(Sm), r }) : t('cmp.s.sameSize', { a: nm(a), b: nm(b) })); }
  [x, y] = pair('aw');
  if (x && y) { const r = ratioText(x, y); const [B, Sm] = big(x, y); if (r) push(t('cmp.s.mass', { big: nm(B), small: nm(Sm), r })); }
  [x, y] = pair('ie1');
  if (x && y) { const r = ratioText(x, y); const [B, Sm] = big(x, y); if (r) push(t('cmp.s.ie', { big: nm(B), small: nm(Sm), r })); }
  [x, y] = pair('en');
  if (x && y && Math.abs(x - y) >= 0.1) { const [B, Sm] = big(x, y); push(t('cmp.s.en', { big: nm(B), small: nm(Sm), a: fmtNum(Math.max(x, y), 2), b: fmtNum(Math.min(x, y), 2) })); }
  const sa = stateAt(a, 293.15).s, sb = stateAt(b, 293.15).s;
  [x, y] = pair('density');
  if (x && y && sa !== 'gas' && sb !== 'gas' && sa !== 'unknown' && sb !== 'unknown') { const r = ratioText(x, y); const [B, Sm] = big(x, y); if (r) push(t('cmp.s.density', { big: nm(B), small: nm(Sm), r })); }
  if (sa !== sb && sa !== 'unknown' && sb !== 'unknown') push(t('cmp.s.state', { a: nm(a), sa: t('state.' + sa), b: nm(b), sb: t('state.' + sb) }));
  return out;
}

export function buildComparePanel(container, ui) {
  const panel = h('section', { class: 'panel' });
  container.append(panel);
  // phone: the main sentence sits under the two atoms, so the view explains itself without opening Controls
  const caption = h('p', { class: 'cmp-caption', hidden: true });
  ui.append(caption);
  let shown = false;
  function render() {
    const a = byZ(state.Z);
    if (!state.Z2 || state.Z2 === state.Z) state.Z2 = defaultPartner(state.Z);
    const b = byZ(state.Z2);
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    const tile = e => h('div', { class: 'cmp-tile' }, h('div', { class: 'el-sym', style: { background: pal[e.f.cat[0]] } }, h('small', null, String(e.Z)), e.sym), h('b', null, name(e)));
    const head = h('div', { class: 'sec' }, h('h3', null, t('cmp.title')),
      h('div', { class: 'cmp-pair' }, tile(a), h('button', { class: 'btn cmp-swap', 'aria-label': t('cmp.swap'), title: t('cmp.swap'), onclick: () => set({ Z: b.Z, Z2: a.Z }) }, '⇄'), tile(b)));
    const sugg = h('div', { class: 'sec' }, h('h3', null, t('cmp.with', { name: name(a) })),
      h('div', { class: 'row' }, neighbours(a).map(n => h('button', { class: 'chip', 'aria-pressed': String(n.e.Z === b.Z), onclick: () => set({ Z2: n.e.Z }) }, `${t('cmp.dir.' + n.dir)} ${n.e.sym}`))),
      h('label', { class: 'field', style: { marginTop: '8px' } }, t('cmp.any'), h('select', { onchange: ev => set({ Z2: +ev.target.value }) },
        elements().map(e => h('option', { value: e.Z, selected: e.Z === b.Z }, `${e.Z} ${e.sym} · ${name(e)}`)))));
    const mode = state.cmpR || 'cov';
    const seg = h('div', { class: 'seg' }, [['cov', 'cmp.rCov'], ['vdw', 'cmp.rVdw']].map(([k, l]) => h('button', { 'aria-pressed': String(mode === k), onclick: () => set({ cmpR: k }) }, t(l))));
    const said = sentences(a, b, mode);
    const says = h('div', { class: 'sec' }, h('h3', null, t('cmp.size')), seg, ...said.map(s => h('p', { class: 'why' }, s)));
    caption.textContent = said[0] || '';
    caption.hidden = !shown || !said.length;
    const rows = [];
    for (const [k] of ROWS) {
      const va = propValue(a, k), vb = propValue(b, k);
      if (!va && !vb) continue;
      const mx = Math.max(Math.abs(va?.[0] || 0), Math.abs(vb?.[0] || 0)) || 1;
      const barRow = (e, v) => h('div', { class: 'cmp-bar' },
        h('span', { class: 'cmp-sym' }, e.sym),
        h('span', { class: 'cmp-track' }, h('span', { class: 'cmp-fill' + (v?.[2]?.p ? ' pred' : ''), style: { width: `${v ? Math.max(2, (100 * Math.abs(v[0])) / mx) : 0}%`, background: pal[e.f.cat[0]] } })),
        v ? valueButton(fmtProp(k, v), t('prop.' + k), v, e) : h('span', { class: 'v none' }, t('tip.nodata')));
      const r = va && vb && va[0] > 0 && vb[0] > 0 ? ratioText(va[0], vb[0]) : null;
      rows.push(h('div', { class: 'cmp-row' }, h('div', { class: 'cmp-label' }, t('prop.' + k), r ? h('span', { class: 'badge' }, `×${r}`) : null), barRow(a, va), barRow(b, vb)));
    }
    replace(panel, head, sugg, says, h('div', { class: 'sec' }, rows));
  }
  return { panel, render, show(on) { shown = on; caption.hidden = !on || !caption.textContent; } };
}
