// Patterns place: "how does this change across the table?" (REDESIGN-PLAN §2, SPEC §0). Reached from the
// element card's "↗ across the table" links. One hero, the chart; one main action, pick a dot.
//   head    — a question that answers "why should I care?", then the plain answer and its sources
//   figure  — the plain axis name with its jargon caption, the chart (ui/trends.js), its key
//   foot    — the same chips as the home lenses (one per pattern), "join the dots" and "see it on the table"
// Every number comes from our data (places/patternSpecs.js) and every dot opens its own source.
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { elements, byZ, name, source, fmtTemp } from '../data.js';
import { chip, segmented, button } from '../ui/kit.js';
import { showSource, closeSource } from '../ui/source.js';
import { createChart } from '../ui/trends.js';
import { TOP, MORE, ALL, has, spec, facts, fmtPoint, lineGroups, lineKey, ROW_STARTS, AIR_G_PER_L } from './patternSpecs.js';
import { lensSettings } from './lenses.js';
import { REFS, PATTERN_REFS } from '../content/patterns-refs.js';
import { pigment, pigmentCB } from '../../design/tokens.js';
import { PATTERNS_KEYS } from '../content/strings-patterns.js';

const K0 = 273.15;
// names inside a sentence: lower case; Vietnamese uses the 13 familiar GDPT-2018 names (as the card does)
const gdpt = e => getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
const inSentence = e => (gdpt(e) ? e.names.viAlt[0] : name(e)).toLowerCase();
const atStart = e => cap(gdpt(e) ? e.names.viAlt[0] : name(e));

function niceTicks(lo, hi, n) {
  const span = hi - lo || 1, step0 = span / n, p = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => s >= step0);
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = k => `10${String(k).split('').map(c => SUP[c]).join('')}`;
// tick labels: plain figures where they stay short; powers of ten on phones and for the tiny ones
const pow10 = (k, phone) => (k === 0 ? '1' : phone ? sup(k) : k > 0 && k <= 6 ? fmtNum(10 ** k, 0) : k < 0 && k >= -3 ? fmtNum(10 ** k, -k) : sup(k));
const big = x => (x >= 1e9 ? t('patterns.billion', { n: fmtNum(x / 1e9, 0) }) : x >= 1e6 ? t('patterns.million', { n: fmtNum(x / 1e6, 0) }) : fmtNum(x, 0));

export function buildPatterns(ui, hooks = {}) {
  if (!PATTERNS_KEYS.length) throw new Error('patterns strings missing');
  // ---- head -------------------------------------------------------------------------------------------
  const eyebrow = h('p', { class: 'patterns-eyebrow' });
  const question = h('h1', { class: 'patterns-q' });
  const answer = h('p', { class: 'patterns-a' });
  const head = h('header', { class: 'patterns-head' }, eyebrow, question, answer);
  // ---- figure -----------------------------------------------------------------------------------------
  const axis = h('div', { class: 'patterns-axis' });
  const join = h('div', { class: 'patterns-join' });
  const toTable = button({ label: '', kind: 'quiet', onClick: () => seeOnTable(), attrs: { class: 'ui-btn ui-btn--quiet patterns-totable' } });
  const figHead = h('div', { class: 'patterns-fighead' }, axis, h('div', { class: 'patterns-figctl' }, join, toTable));
  const chart = createChart({
    onPick: Z => { closeRefs(); set({ Z }); },
    onScrub: (Z, x, y) => showLoupe(Z, x, y),
    pinNode: Z => labelNode(Z, true),
    tipNode: Z => labelNode(Z, false),
  });
  const key = h('div', { class: 'patterns-key' });
  const wave = h('p', { class: 'patterns-wave' });
  const caption = h('figcaption', { class: 'patterns-caption' }, key, wave);
  const readout = h('div', { class: 'patterns-readout' }); // phones: the picked element, under the chart
  const figure = h('figure', { class: 'patterns-fig' }, figHead, chart.el, readout, caption);
  // ---- foot: the patterns as chips (the same names and order as the home lenses) ---------------------------
  const chips = h('div', { class: 'patterns-chips', role: 'toolbar' });
  const foot = h('footer', { class: 'patterns-foot' }, chips);
  const loupe = h('div', { class: 'patterns-loupe', hidden: true, 'aria-hidden': 'true' });
  const live = h('p', { class: 'patterns-live', 'aria-live': 'polite' });
  const root = h('section', { class: 'patterns', hidden: true }, head, figure, foot, live);
  ui.append(root, loupe);

  const id = () => (has(state.prop) ? state.prop : 'ie1');
  const mode = () => (state.trendLine === 'group' ? 'group' : 'period');
  const pal = () => (state.cb ? pigmentCB : pigment);
  let F = null, shownId = null;

  // ---- the words ---------------------------------------------------------------------------------------
  /** The question's and answer's numbers, filled from the data. */
  function params(pid) {
    const P = F.params, p = {};
    const v = pt => (pt ? fmtPoint(pid, pt) : '—');
    if (pid === 'mp') p.w = v(P.top);
    if (pid === 'bp') { p.he = v(P.low); p.k = P.low ? fmtNum(P.low.y + K0, 0) : '—'; p.re = v(P.top); }
    if (pid === 'density') { p.au = v(P.au); p.he = v(P.he); p.air = `${fmtNum(AIR_G_PER_L, 2, { minDigits: 2 })} g`; }
    if (pid === 'ie1') { p.na = v(P.na); p.ne = v(P.ne); }
    if (pid === 'en') p.f = v(P.top);
    if (pid === 'ea') p.cl = v(P.top);
    if (pid === 'abund') { p.x = P.feGold ? big(Number(P.feGold.toPrecision(2))) : '—'; p.pct = P.pct ? `${fmtNum(P.pct, 0)} %` : '—'; }
    if (pid === 'year') { p.n = String(P.ancient); p.p = P.first ? String(P.first.y) : '—'; p.last = P.last ? String(P.last.y) : '—'; }
    return p;
  }
  function calloutText(pid, c) {
    const q = {};
    for (const [k, x] of Object.entries(c.params || {})) {
      if (k === 'name') q.name = atStart(byZ(x));
      else if (k === 'v') q.v = fmtPoint(pid, x);
      else if (k === 'a' || k === 'b') q[k] = c.key === 'back' && k === 'a' ? atStart(byZ(x)) : inSentence(byZ(x));
      else if (k === 'pct') q.pct = `${fmtNum(x, 0)} %`;
    }
    return t(`patterns.${pid}.c.${c.key}`, q);
  }
  const unitOf = pid => (spec(pid).scale === 'temp' ? '°C' : t(`patterns.${pid}.unit`) === `patterns.${pid}.unit` ? '' : t(`patterns.${pid}.unit`));
  const axisName = pid => t(`patterns.${pid}.axis`);

  // ---- the chart's model --------------------------------------------------------------------------------
  function yScale(pid, pts) {
    const sp = spec(pid), ys = pts.filter(p => p.kind !== 'ancient' && p.y != null).map(p => p.y);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    const phone = isPhone();
    if (sp.scale === 'log') {
      const a = Math.floor(Math.log10(lo)), b = Math.ceil(Math.log10(hi));
      const step = phone ? 4 : 3, ticks = [];
      for (let k = Math.ceil(a / step) * step; k <= b; k += step) ticks.push({ v: k, label: pow10(k, phone) });
      return { log: true, min: a - 0.3, max: b + 0.2, ticks };
    }
    if (sp.scale === 'year') {
      const min = Math.floor((lo - 12) / 50) * 50, max = hi + 12;
      return { min, max, ticks: niceTicks(min, max, phone ? 4 : 7).filter(v => v % 50 === 0).map(v => ({ v, label: String(v) })) };
    }
    if (sp.scale === 'temp') {
      // phones drop the unit from the ticks (it is in the axis name) to keep the plot wide
      const max = hi * 1.06, deg = phone ? '' : ' °C', ticks = [{ v: -K0, label: `−273${deg}`, base: true }];
      for (const v of niceTicks(0, max, phone ? 3 : 4)) ticks.push({ v, label: `${fmtNum(v, 0)}${deg}` });
      return { min: -K0, max, ticks };
    }
    const max = hi * 1.07;
    return { min: 0, max, ticks: niceTicks(0, max, phone ? 4 : 5).map((v, i) => ({ v, label: fmtNum(v, 2), base: i === 0 })) };
  }
  function model() {
    const pid = id(), els = elements();
    F = facts(pid, els);
    const P = pal(), sel = byZ(state.Z), lm = mode();
    const points = F.points.map(p => ({ Z: p.Z, y: p.y, kind: p.kind, pred: p.pred, color: P[p.e.f.cat[0]] }));
    const rows = [];
    for (let i = 0; i < 7; i++) rows.push({ z0: ROW_STARTS[i], z1: ROW_STARTS[i + 1] - 1, label: t('patterns.row', { n: i + 1 }), short: String(i + 1), sel: lm === 'period' && sel.f.period[0] === i + 1 });
    const sp = spec(pid);
    const ref = sp.room ? [{ y: 20, label: t('patterns.room') }] : [];
    return {
      label: t('patterns.chart', { axis: axisName(pid) }),
      points, y: yScale(pid, points), ref, rows,
      groups: sp.lines === false ? new Map() : lineGroups(lm, els), lineMode: lm, selZ: state.Z, selKey: lineKey(lm, sel),
      callouts: F.callouts.map(c => ({ ...c, text: calloutText(pid, c) })),
      ancient: sp.scale === 'year' ? t('patterns.ancient') : null,
      xTicks: isPhone() ? [1, 11, 19, 37, 55, 87, 118] : [1, 3, 11, 19, 37, 55, 87, 118],
      xTitle: [t('patterns.x'), t('patterns.xCap')],
    };
  }

  // ---- labels: pinned value (desktop), hover tip, phone readout and loupe ----------------------------------
  const pointOf = Z => F && F.points.find(p => p.Z === Z);
  function sourceValue(pid, p) {
    // the popover shows the value with kelvin for temperatures (details), and how gases were weighed
    if (pid === 'density' && p.kind === 'gas') {
      const d = p.v;
      return [d[0], d[1], { ...(d[2] || {}), n: `${(d[2] && d[2].n) ? d[2].n + '; ' : ''}${getLang() === 'vi' ? 'đổi sang 20 °C theo định luật khí lí tưởng từ giá trị ở 0 °C' : 'scaled from the 0 °C value to 20 °C with the ideal-gas law'}` }];
    }
    return p.v;
  }
  const shownFull = (pid, p) => ((pid === 'mp' || pid === 'bp') ? `${p.pred ? '≈ ' : ''}${fmtTemp(p.v[0])}` : fmtPoint(pid, p));
  function openSource(anchor, Z) {
    const pid = id(), p = pointOf(Z), e = byZ(Z);
    if (!p || p.kind === 'ancient') return;
    closeRefs();
    const label = `${atStart(e)} · ${p.kind === 'sub' ? t('f.sub') : axisName(pid)}`;
    showSource(anchor, label, sourceValue(pid, p), e, shownFull(pid, p));
  }
  function valueText(pid, p) { return p ? (p.kind === 'ancient' ? t('ancient') : fmtPoint(pid, p)) : t('patterns.none'); }
  function labelNode(Z, pinned) {
    const pid = id(), p = pointOf(Z), e = byZ(Z);
    const sw = h('span', { class: 'patterns-lbl__sw', style: { background: pal()[e.f.cat[0]] }, 'aria-hidden': 'true' });
    const nm = h('b', null, atStart(e)); // Vietnamese: the familiar name for the 13 that keep one (Sắt), as on the card
    if (!pinned || !p || p.kind === 'ancient') return [sw, nm, h('span', { class: 'patterns-lbl__v' + (p ? '' : ' is-none') }, valueText(pid, p))];
    const btn = h('button', { type: 'button', class: 'patterns-v' + (p.pred ? ' is-est' : ''), onclick: ev => openSource(ev.currentTarget, Z), title: t('card.tapSource') }, valueText(pid, p));
    return [sw, nm, btn];
  }
  function renderReadout() {
    const pid = id(), Z = state.Z, p = pointOf(Z), e = byZ(Z);
    const tile = h('span', { class: 'patterns-readout__tile', style: { background: pal()[e.f.cat[0]] }, 'aria-hidden': 'true' }, h('small', null, String(Z)), e.sym);
    const val = p && p.kind !== 'ancient'
      ? h('button', { type: 'button', class: 'patterns-v' + (p.pred ? ' is-est' : ''), onclick: ev => openSource(ev.currentTarget, Z) }, valueText(pid, p))
      : h('span', { class: 'patterns-lbl__v is-none' }, valueText(pid, p));
    replace(readout, tile, h('span', { class: 'patterns-readout__txt' }, h('b', null, atStart(e)), val), h('span', { class: 'patterns-readout__hint' }, t('patterns.hintPhone')));
    replace(live, `${atStart(e)}: ${valueText(pid, p)}`);
  }
  function showLoupe(Z, x, y) {
    if (!Z) { loupe.hidden = true; return; }
    const pid = id(), p = pointOf(Z), e = byZ(Z);
    replace(loupe, h('span', { class: 'patterns-loupe__tile', style: { background: pal()[e.f.cat[0]] } }, h('small', null, String(Z)), e.sym),
      h('span', { class: 'patterns-loupe__name' }, atStart(e), h('small', null, valueText(pid, p))));
    loupe.hidden = false;
    const w = loupe.offsetWidth || 180, hh = loupe.offsetHeight || 76;
    const lx = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2));
    const ly = y - hh - 56 < 64 ? y + 44 : y - hh - 56;
    loupe.style.transform = `translate(${lx}px, ${ly}px)`;
  }

  // ---- sources of the words (the data has its own, one tap on any value) --------------------------------------
  let refPop = null;
  function closeRefs() { if (refPop) { refPop.remove(); refPop = null; } }
  document.addEventListener('pointerdown', ev => { if (refPop && !refPop.contains(ev.target) && !ev.target.closest('.patterns-src')) closeRefs(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && refPop) { closeRefs(); ev.stopPropagation(); } });
  function showRefs(anchor, keys) {
    if (refPop) { closeRefs(); return; }
    closeSource();
    const items = keys.map(k => REFS[k]).filter(Boolean).map(r => {
      const s = r.data ? source(r.data) : r;
      return h('li', null, s.url ? h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name) : s.name);
    });
    refPop = h('div', { class: 'popover patterns-refs', role: 'dialog' },
      h('button', { class: 'close', 'aria-label': t('sh.close'), onclick: closeRefs }, '×'),
      h('h4', null, t('patterns.refs')), h('ul', null, items), h('p', { class: 'small' }, t('patterns.refsData')));
    ui.append(refPop);
    const r = anchor.getBoundingClientRect(), pw = Math.min(420, window.innerWidth - 20);
    refPop.style.left = `${Math.min(Math.max(10, r.left - pw / 2), window.innerWidth - pw - 10)}px`;
    refPop.style.top = `${r.bottom + 8}px`;
    const ph = refPop.offsetHeight;
    if (r.bottom + 8 + ph > window.innerHeight - 10) refPop.style.top = `${Math.max(10, r.top - ph - 8)}px`;
    refPop.querySelector('.close').focus();
  }
  const srcPill = keys => h('button', { type: 'button', class: 'patterns-src', onclick: ev => showRefs(ev.currentTarget, keys) }, t('patterns.source'));

  // ---- chips, "more" menu, join, see it on the table --------------------------------------------------------
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  document.addEventListener('pointerdown', ev => { if (menu && !menu.contains(ev.target) && !ev.target.closest('.patterns-more')) closeMenu(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && menu) { closeMenu(); ev.stopPropagation(); } });
  function pick(pid) { closeMenu(); closeRefs(); closeSource(); if (pid !== state.prop) set({ prop: pid }); }
  function toggleMore(anchor, list = MORE) {
    if (menu) { closeMenu(); return; }
    menu = h('div', { class: 'ui-menu patterns-menu', role: 'menu' }, h('h4', null, t('patterns.patterns')),
      ...list.map(pid => h('button', { type: 'button', 'aria-pressed': String(state.prop === pid), onclick: () => pick(pid) }, t(`lens.${pid}`))));
    ui.append(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - menu.offsetWidth / 2, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.bottom = `${window.innerHeight - r.top + 8}px`;
    const first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function renderChips() {
    if (isPhone()) { // phones: one pill opens every pattern, so the chart keeps the height
      replace(chips, chip({ label: `${t('patterns.patterns')} ▾`, attrs: { class: 'ui-chip patterns-more', 'aria-haspopup': 'menu' }, onClick: ev => toggleMore(ev.currentTarget, ALL) }));
      chips.setAttribute('aria-label', t('patterns.patterns'));
      return;
    }
    const moreOn = MORE.includes(id());
    replace(chips, ...TOP.map(pid => chip({ label: t(`lens.${pid}`), pressed: id() === pid, onClick: () => pick(pid) })),
      chip({ label: moreOn ? `${t(`lens.${id()}`)} ▾` : `${t('lens.more')} ▾`, pressed: moreOn, attrs: { class: 'ui-chip patterns-more', 'aria-haspopup': 'menu' }, onClick: ev => toggleMore(ev.currentTarget) }));
    chips.setAttribute('aria-label', t('patterns.patterns'));
  }
  function seeOnTable() {
    const pid = id(), s = lensSettings(pid);
    closeMenu(); closeRefs(); closeSource();
    set({ view: 'table', card: false, hideSel: true, lens: pid, color: s.color, flat: s.flat, prop: pid, log: s.log });
  }

  // ---- render ------------------------------------------------------------------------------------------------
  function renderWords() {
    const pid = id();
    replace(eyebrow, t('patterns.eyebrow'));
    replace(question, t(`patterns.${pid}.q`, params(pid)));
    replace(answer, t(`patterns.${pid}.a`, params(pid)), ' ', srcPill(PATTERN_REFS[pid] || []));
    const unit = unitOf(pid);
    replace(axis, h('b', null, axisName(pid)), unit ? h('span', { class: 'patterns-axis__unit' }, unit) : null,
      h('small', null, t(`patterns.${pid}.cap`), spec(pid).scale === 'log' ? ` · ${t('patterns.logStep')}` : ''));
    const ph = isPhone();
    join.hidden = spec(pid).lines === false;
    replace(join, h('span', { class: 'patterns-join__lbl' }, t('patterns.join')),
      segmented({ label: t('patterns.join'), value: mode(), onPick: m => set({ trendLine: m }),
        options: [{ id: 'period', label: t(ph ? 'patterns.byRowShort' : 'patterns.byRow'), title: t('patterns.byRow') }, { id: 'group', label: t(ph ? 'patterns.byColShort' : 'patterns.byCol'), title: t('patterns.byCol') }] }));
    replace(toTable.lastChild, `${t('patterns.onTable')} →`);
    // the key: everything a mark on the chart can mean
    const items = [];
    if (F.points.some(p => p.pred)) items.push(h('span', null, h('i', { class: 'patterns-key__bead is-pred' }), t('key.pred')));
    if (F.points.some(p => p.kind === 'sub')) items.push(h('span', null, h('i', { class: 'patterns-key__bead is-sub' }), t('patterns.key.sub')));
    if (F.points.length < 118) items.push(h('span', null, h('i', { class: 'patterns-key__gap' }), t('patterns.key.gap')));
    if (spec(pid).room) items.push(h('span', { class: 'patterns-key__ref' }, h('i', { class: 'patterns-key__gap is-ref' }), t('patterns.room')));
    items.push(h('span', { class: 'patterns-key__rows' }, h('i', { class: 'patterns-key__band' }), t('patterns.rowsCap')));
    replace(key, ...items, h('span', { class: 'patterns-key__hint' }, t('patterns.hint')));
    replace(wave, t('patterns.wave'), ' ', srcPill(PATTERN_REFS.wave));
    renderChips();
  }
  function render(motionMode) {
    if (root.hidden) return;
    const m = model();
    renderWords();
    renderReadout();
    chart.set(m, motionMode);
    shownId = id();
  }

  const ro = new ResizeObserver(() => { if (!root.hidden) chart.relayout(); });
  ro.observe(chart.el);
  window.addEventListener('resize', () => { if (!root.hidden) { closeMenu(); render('none'); } });

  return {
    el: root,
    show(on) {
      if (on === !root.hidden) { if (on) render('none'); return; }
      root.hidden = !on;
      document.body.classList.toggle('place-patterns', on);
      if (!on) { closeMenu(); closeRefs(); loupe.hidden = true; shownId = null; return; }
      render('enter');
    },
    onState(ch) {
      if (root.hidden) return;
      if ('lang' in ch || 'cb' in ch) { render('none'); return; }
      if ('prop' in ch && id() !== shownId) { render('morph'); return; }
      if ('trendLine' in ch) { render('none'); return; }
      if ('Z' in ch && F) {
        const sel = byZ(state.Z), lm = mode();
        const rows = chart.model.rows.map((r, i) => ({ ...r, sel: lm === 'period' && sel.f.period[0] === i + 1 }));
        chart.select(state.Z, lineKey(lm, sel), rows);
        chart.refreshLabels();
        renderReadout();
      }
    },
    /** The 3D view behind is empty here: the chart owns the screen. */
    safeArea: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
    close() { closeMenu(); closeRefs(); },
  };
}
export { ALL as PATTERN_IDS };
