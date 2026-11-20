// Left panel for the Table view: column height (property, log), layout, colour mode, temperature,
// and the complete legend + filters (category, block, group, period, state at T, origin).
import { h, replace } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { state, set } from '../state.js';
import { elements, PROPS, fmtTemp, stateAt } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB, STATE_COLORS } from '../palette.js';

// temperature slider: log scale 1 K ... 6000 K
const T_MIN = 1, T_MAX = 6000;
export const sliderToT = s => T_MIN * Math.pow(T_MAX / T_MIN, s / 1000);
export const TToSlider = T => Math.round((1000 * Math.log(T / T_MIN)) / Math.log(T_MAX / T_MIN));

export function tempControl(onInput) {
  const out = h('span', { class: 'small' });
  const input = h('input', { type: 'range', min: 0, max: 1000, step: 1, 'aria-label': t('ctl.temp') });
  const sync = () => { input.value = String(TToSlider(state.T)); out.textContent = fmtTemp(state.T); };
  input.addEventListener('input', () => { const T = sliderToT(+input.value); set({ T: Math.abs(T - 293.15) < 4 ? 293.15 : Math.round(T * 100) / 100 }); onInput && onInput(); });
  const room = h('button', { class: 'chip', onclick: () => set({ T: 293.15 }) }, t('ctl.room'));
  sync();
  return { el: h('div', null, h('div', { class: 'row' }, h('b', { class: 'small', style: { color: 'var(--text)' } }, t('ctl.temp')), out, room), input), sync };
}

export function buildTablePanel(container) {
  const panel = h('section', { class: 'panel' });
  container.append(panel);
  let temp = null;

  function render() {
    const els = elements();
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    // ---- height
    const sel = h('select', { 'aria-label': t('ctl.height'), onchange: ev => { const p = PROPS.find(x => x.key === ev.target.value); set({ prop: p.key, log: !!p.log }); } },
      PROPS.map(p => h('option', { value: p.key, selected: p.key === state.prop }, t('prop.' + p.key))));
    const log = h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: state.log, onchange: ev => set({ log: ev.target.checked }) }), t('ctl.log'));
    const height = h('div', { class: 'sec' }, h('h3', null, t('ctl.height')), h('label', { class: 'field' }, sel), h('div', { class: 'row' }, log), h('p', { class: 'why' }, t('why.' + state.prop)));
    // ---- layout + colour
    const seg = (items, cur, key) => h('div', { class: 'seg', role: 'group' }, items.map(v => h('button', { 'aria-pressed': String(cur === v), onclick: () => set({ [key]: v }) }, t((key === 'layout' ? 'lay.' : 'col.') + v))));
    temp = tempControl();
    const look = h('div', { class: 'sec' },
      h('h3', null, t('ctl.layout')), seg(['s18', 's32', 'helix'], state.layout, 'layout'),
      h('h3', { style: { marginTop: '12px' } }, t('ctl.color')), seg(['cat', 'state'], state.color, 'color'),
      (state.color === 'state' || state.filters.state) ? h('div', { style: { marginTop: '10px' } }, temp.el) : null);
    // ---- legend + filters
    const F = state.filters;
    const setF = patch => set({ filters: { ...state.filters, ...patch } });
    const counts = {};
    for (const e of els) counts[e.f.cat[0]] = (counts[e.f.cat[0]] || 0) + 1;
    let legendItems;
    if (state.color === 'state') {
      const sc = {};
      for (const e of els) { const s = stateAt(e, state.T).s; sc[s] = (sc[s] || 0) + 1; }
      legendItems = ['solid', 'liquid', 'gas', 'unknown'].map(s => h('button', {
        class: 'lg', 'aria-pressed': String(!F.state || F.state === s), onclick: () => setF({ state: F.state === s ? '' : s }),
      }, h('span', { class: 'sw', style: { background: STATE_COLORS[s] } }), t('state.' + s), h('span', { class: 'n' }, String(sc[s] || 0))));
    } else {
      legendItems = ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'metalloid', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide'].map(c => h('button', {
        class: 'lg', 'aria-pressed': String(!F.cats || F.cats.has(c)),
        onclick: () => {
          let cats = F.cats ? new Set(F.cats) : null;
          if (!cats) cats = new Set([c]);
          else if (cats.has(c)) cats.delete(c); else cats.add(c);
          setF({ cats: cats.size ? cats : null });
        },
      }, h('span', { class: 'sw', style: { background: pal[c] } }), t('cat.' + c), h('span', { class: 'n' }, String(counts[c] || 0))));
    }
    const extras = [['ghost', 'lg.ghost'], ['hatch', 'lg.hatch'], ['dimmed', 'lg.dim']].map(([k, l]) => h('div', { class: 'lg', style: { cursor: 'default' } }, h('span', { class: 'sw ' + k }), t(l)));
    const chip = (label, on, onclick) => h('button', { class: 'chip', 'aria-pressed': String(on), onclick }, label);
    const blocks = h('div', { class: 'row' }, h('span', { class: 'small' }, t('flt.block')), ...['s', 'p', 'd', 'f'].map(b => chip(b, !!F.blocks?.has(b), () => {
      const s = F.blocks ? new Set(F.blocks) : new Set();
      if (s.has(b)) s.delete(b); else s.add(b);
      setF({ blocks: s.size ? s : null });
    })));
    const selRow = (label, value, opts, onchange) => h('label', { class: 'field' }, label, h('select', { onchange: ev => onchange(ev.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(value) === String(v) }, l))));
    const grp = selRow(t('flt.group'), F.group, [[0, t('any')], ...Array.from({ length: 18 }, (_, i) => [i + 1, String(i + 1)])], v => setF({ group: +v }));
    const per = selRow(t('flt.period'), F.period, [[0, t('any')], ...Array.from({ length: 7 }, (_, i) => [i + 1, String(i + 1)])], v => setF({ period: +v }));
    const stt = selRow(`${t('flt.state')} (${fmtTemp(state.T, { both: false })})`, F.state, [['', t('any')], ['solid', t('state.solid')], ['liquid', t('state.liquid')], ['gas', t('state.gas')]], v => setF({ state: v }));
    const ori = selRow(t('flt.origin'), F.origin, [['', t('any')], ['natural', t('nat.natural')], ['trace', t('nat.trace')], ['synthetic', t('nat.synthetic')]], v => setF({ origin: v }));
    const active = F.cats || F.blocks || F.group || F.period || F.state || F.origin;
    const legend = h('div', { class: 'sec' },
      h('h3', null, t('lg.title'), active ? h('button', { class: 'chip', onclick: () => set({ filters: { cats: null, blocks: null, group: 0, period: 0, state: '', origin: '' } }) }, t('lg.reset')) : null),
      h('div', { class: 'legend' }, legendItems, extras),
      h('div', { style: { marginTop: '10px' } }, blocks),
      h('div', { class: 'row' }, grp, per), h('div', { class: 'row' }, stt, ori));
    replace(panel, height, look, legend);
  }
  return { render, panel, syncTemp: () => temp && temp.sync() };
}
