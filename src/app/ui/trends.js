// Trends view: one property against the number of protons, as an SVG chart (crisp, accessible).
// Lines join neighbours across a period (the pattern repeats each period) or down a group.
// Tap anywhere near a dot to pick that element (nearest-dot hit test = big targets).
import { h, replace, isPhone } from '../dom.js';
import { t, fmtNum, fmtSci } from '../i18n.js';
import { state, set } from '../state.js';
import { elements, byZ, name, PROPS, prop, propValue, propRange, fmtProp, isPred } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { matchesFilters } from '../views/table.js';

const NS = 'http://www.w3.org/2000/svg';
const S = (tag, attrs, text) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); if (text != null) el.textContent = text; return el; };

function niceTicks(lo, hi, n = 6) {
  const span = hi - lo || 1, step0 = span / n, p = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => s >= step0);
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

export function buildTrends(ui, left) {
  const box = h('section', { class: 'panel chart', hidden: true, 'aria-label': t('view.trends') });
  const head = h('div', { class: 'chart-head' });
  const svgWrap = h('div', { class: 'chart-svg' });
  const tip = h('div', { class: 'tooltip', hidden: true });
  box.append(head, svgWrap, tip);
  ui.append(box);
  const panel = h('section', { class: 'panel' });
  let pts = [];
  let geom = null;

  function controls() {
    const list = h('div', { class: 'prop-list' }, PROPS.map(p => h('button', {
      class: 'chip prop', 'aria-pressed': String(p.key === state.prop), onclick: () => set({ prop: p.key, log: !!p.log }),
    }, t('prop.' + p.key))));
    const log = h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: state.log, onchange: ev => set({ log: ev.target.checked }) }), t('ctl.log'));
    const seg = h('div', { class: 'seg' }, ['period', 'group'].map(m => h('button', { 'aria-pressed': String((state.trendLine || 'period') === m), onclick: () => set({ trendLine: m }) }, t('tr.by.' + m))));
    replace(panel,
      h('div', { class: 'sec' }, h('h3', null, t('tr.pick')), list),
      h('div', { class: 'sec' }, h('h3', null, t('tr.connect')), seg, h('div', { class: 'row', style: { marginTop: '8px' } }, log)),
      h('div', { class: 'sec' }, h('p', { class: 'small' }, t('tr.hint'))));
  }

  function render() {
    const p = prop(state.prop);
    const pal = state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS;
    replace(head, h('div', { class: 'chart-title' }, h('h2', null, `${t('prop.' + p.key)}${p.unit ? ` (${p.unit})` : ''}${state.log ? ` · ${t('ctl.log').toLowerCase()}` : ''}`),
      h('button', { class: 'btn', onclick: () => set({ view: 'table', layout: state.layout || 's18' }) }, t('tr.onTable'))), h('p', { class: 'why' }, t('why.' + p.key)));
    const W = Math.max(320, svgWrap.clientWidth || 800), H = Math.max(240, svgWrap.clientHeight || 420);
    const m = { l: isPhone() ? 46 : 70, r: 14, t: 14, b: 44 };
    const els = elements();
    const { lo, hi } = propRange(p.key, state.log);
    const yLo = state.log ? Math.log10(lo) : p.key === 'year' ? lo : Math.min(0, lo), yHi = state.log ? Math.log10(hi) : hi;
    const pad = (yHi - yLo) * 0.06;
    const y0 = yLo - (state.log || p.key === 'year' ? pad : 0), y1 = yHi + pad;
    const X = z => m.l + ((z - 0.5) / 118) * (W - m.l - m.r);
    const Y = v => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `${t('prop.' + p.key)} vs ${t('tr.x')}` });
    // period bands
    const starts = [1, 3, 11, 19, 37, 55, 87, 119];
    for (let i = 0; i < 7; i++) {
      const xa = X(starts[i] - 0.5), xb = X(starts[i + 1] - 0.5);
      if (i % 2 === 0) svg.append(S('rect', { x: xa, y: m.t, width: xb - xa, height: H - m.t - m.b, fill: 'rgba(255,255,255,0.035)' }));
      // full label only where the band is wide enough; otherwise just the period number
      const wide = xb - xa > 64;
      svg.append(S('text', { x: (xa + xb) / 2, y: m.t + 14, 'text-anchor': 'middle', fill: '#7f8db0', 'font-size': 13 }, wide ? `${t('period')} ${i + 1}` : String(i + 1)));
    }
    // y axis
    for (const v of niceTicks(y0, y1, isPhone() ? 4 : 6)) {
      const yy = Y(v);
      svg.append(S('line', { x1: m.l, x2: W - m.r, y1: yy, y2: yy, stroke: 'rgba(160,190,255,0.12)' }));
      const label = state.log ? fmtSci(10 ** v, 2) : p.key === 'year' ? String(Math.round(v)) : fmtNum(v, 3);
      svg.append(S('text', { x: m.l - 8, y: yy + 4, 'text-anchor': 'end', fill: '#a9b6d3', 'font-size': 13 }, label));
    }
    for (const z of W < 600 ? [1, 20, 40, 60, 80, 100, 118] : [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 118]) {
      svg.append(S('text', { x: X(z), y: H - m.b + 18, 'text-anchor': 'middle', fill: '#a9b6d3', 'font-size': 13 }, String(z)));
    }
    svg.append(S('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', fill: '#a9b6d3', 'font-size': 14 }, t('tr.x')));
    // points
    pts = [];
    for (const e of els) {
      const v = propValue(e, p.key);
      if (!v || (state.log && !(v[0] > 0))) continue;
      const yv = state.log ? Math.log10(v[0]) : v[0];
      pts.push({ e, v, x: X(e.Z), y: Y(yv), pred: isPred(v), dim: !matchesFilters(e) });
    }
    // lines: across each period, or down each group (gaps where data is missing)
    const mode = state.trendLine || 'period';
    const groups = new Map();
    for (const e of els) {
      const k = mode === 'period' ? `p${e.f.period[0]}` : e.f.group[0] ? `g${e.f.group[0]}` : null;
      if (!k) continue;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e.Z);
    }
    const byZp = new Map(pts.map(q => [q.e.Z, q]));
    const selE = byZ(state.Z);
    const selKey = mode === 'period' ? `p${selE.f.period[0]}` : selE.f.group[0] ? `g${selE.f.group[0]}` : null;
    // draw the selected element's period/group last and bright; the rest stay quiet (calm, readable)
    const order = [...groups.keys()].sort((x, y) => (x === selKey) - (y === selKey));
    for (const key of order) {
      const zs = groups.get(key), on = key === selKey;
      let d = '', pen = false;
      for (const z of zs.sort((a, b) => a - b)) {
        const q = byZp.get(z);
        if (!q) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`; pen = true;
      }
      if (d) svg.append(S('path', { d, fill: 'none', stroke: on ? '#ffcf6b' : mode === 'period' ? 'rgba(200,215,255,0.42)' : 'rgba(200,215,255,0.13)', 'stroke-width': on ? 2.6 : 1.4 }));
    }
    for (const q of pts) {
      const col = pal[q.e.f.cat[0]];
      const c = S('circle', { cx: q.x, cy: q.y, r: isPhone() ? 3.6 : 4.6, fill: q.pred ? 'transparent' : col, stroke: col, 'stroke-width': q.pred ? 1.6 : 1, 'stroke-dasharray': q.pred ? '2 2' : '', opacity: q.dim ? 0.15 : 1, 'data-z': q.e.Z });
      c.append(S('title', null, `${q.e.sym} ${name(q.e)}: ${fmtProp(p.key, q.v)}`));
      svg.append(c);
    }
    // selected element
    const sel = byZp.get(state.Z);
    if (sel) {
      svg.append(S('line', { x1: sel.x, x2: sel.x, y1: m.t, y2: H - m.b, stroke: 'rgba(255,207,107,0.5)', 'stroke-dasharray': '4 4' }));
      svg.append(S('circle', { cx: sel.x, cy: sel.y, r: 10, fill: 'none', stroke: '#ffcf6b', 'stroke-width': 2.5 }));
      const lx = Math.min(W - m.r - 4, Math.max(m.l + 4, sel.x + 14));
      const lbl = S('text', { x: lx, y: Math.max(m.t + 30, sel.y - 14), 'text-anchor': sel.x > W * 0.75 ? 'end' : 'start', fill: '#ffcf6b', 'font-size': 15, 'font-weight': 700, stroke: '#0d1526', 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, `${sel.e.sym} ${fmtProp(p.key, sel.v)}`);
      if (sel.x > W * 0.75) lbl.setAttribute('x', sel.x - 14);
      svg.append(lbl);
    } else {
      const e = byZ(state.Z);
      svg.append(S('text', { x: X(e.Z), y: H - m.b - 8, 'text-anchor': 'middle', fill: '#ffcf6b', 'font-size': 14 }, `${e.sym}: ${t('tip.nodata')}`));
    }
    replace(svgWrap, svg);
    geom = { W, H };
  }

  function nearest(ev) {
    const r = svgWrap.firstChild?.getBoundingClientRect();
    if (!r || !pts.length) return null;
    const x = ((ev.clientX - r.left) / r.width) * geom.W, y = ((ev.clientY - r.top) / r.height) * geom.H;
    let best = null, bd = Infinity;
    for (const q of pts) { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } }
    return bd < 34 ? best : null;
  }
  svgWrap.addEventListener('pointermove', ev => {
    const q = nearest(ev);
    if (!q || isPhone()) { tip.hidden = true; svgWrap.style.cursor = ''; return; }
    svgWrap.style.cursor = 'pointer';
    replace(tip, h('b', null, `${q.e.sym} `), name(q.e), ` · Z = ${q.e.Z}`, h('br'), fmtProp(state.prop, q.v), q.pred ? ` (${t('lg.hatch').toLowerCase()})` : '');
    const br = box.getBoundingClientRect();
    tip.style.left = ev.clientX - br.left + 'px'; tip.style.top = ev.clientY - br.top + 'px'; tip.hidden = false;
  });
  svgWrap.addEventListener('pointerleave', () => { tip.hidden = true; });
  svgWrap.addEventListener('click', ev => { const q = nearest(ev); if (q) set({ Z: q.e.Z }); });
  window.addEventListener('resize', () => { if (!box.hidden) render(); });

  return {
    panel, box,
    show(on) { box.hidden = !on; if (on) render(); },
    render() { controls(); if (!box.hidden) render(); },
  };
}
