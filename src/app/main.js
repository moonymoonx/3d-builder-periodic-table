// Boot: data -> state (URL hash) -> engine -> views -> places; keyboard; the free-area framing.
// Places (redesign): home = the table (places/home.js) with the element card (places/elementCard.js).
// The card's doors lead into the views that have not been rebuilt yet (atom, sample, trends, compare);
// those keep their own panels on a dark stage (body.legacy) with a back link to the card.
import * as THREE from 'three';
import { loadData, bySym, byZ, elements, name, altName } from './data.js';
import { state, set, on, readHash, initHash, LAYOUTS } from './state.js';
import { setLang, t } from './i18n.js';
import { createEngine, registerView, switchView, E, invalidate, setSafe } from './engine.js';
import { createTableView } from './views/table.js';
import { createAtomView } from './views/atom.js';
import { buildAtomPanel } from './ui/atomPanel.js';
import { buildSpectrum } from './ui/spectrum.js';
import { createSampleView } from './views/sample.js';
import { buildSampleUI } from './ui/samplePanel.js';
import { buildTrends } from './ui/trends.js';
import { createCompareView } from './views/compare.js';
import { buildComparePanel, defaultPartner } from './ui/comparePanel.js';
import { buildShell } from './ui/shell.js';
import { buildSheet } from './ui/sheet.js';
import { buildHome } from './places/home.js';
import { buildElementCard } from './places/elementCard.js';
import { TOP as TOP_LENSES, lensSettings } from './places/lenses.js';
import { h, isPhone } from './dom.js';

function fatal(msg) {
  document.getElementById('ui').append(h('div', { class: 'modal-back' }, h('div', { class: 'modal' }, h('h2', null, 'Periodic Table 3D'), h('p', null, msg))));
}
const stubView = () => ({ scene: new THREE.Scene(), enter() {}, exit() {} });

function neighbour(e, dPeriod) {
  const els = elements();
  if (e.fIndex != null) return els.find(x => x.fIndex === e.fIndex && x.f.period[0] === e.f.period[0] + dPeriod) || null;
  return els.find(x => x.fIndex == null && x.f.group[0] === e.f.group[0] && x.f.period[0] === e.f.period[0] + dPeriod) || null;
}

function boot() {
  loadData();
  initHash(Z => byZ(Z).sym, s => bySym(s)?.Z);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Object.assign(state, { reduced }, readHash());
  // the lens decides the table's colour and heights
  Object.assign(state, lensPatch(state.lens));
  if (state.card) state.hideSel = false;
  const qs = new URLSearchParams(location.search);
  if (qs.has('stats')) state.fps = true;
  if (['low', 'med', 'high'].includes(qs.get('q'))) state.quality = qs.get('q');
  setLang(state.lang);
  document.body.classList.toggle('reduced', state.reduced);
  try { createEngine(document.getElementById('gl')); }
  catch (err) { fatal('WebGL is not available in this browser, so the 3D view cannot start. (' + (err && err.message) + ')'); return; }
  E.rig.reduced = state.reduced;
  const ui = document.getElementById('ui');

  // ---- legacy views (rebuilt later against the same tokens and kit) ----------------------------------
  const shell = buildShell();
  const sheet = buildSheet(shell.right, { onView: v => set({ view: v }) });
  const atomPanel = buildAtomPanel(shell.left);
  const spectrum = buildSpectrum(ui); spectrum.box.hidden = true;
  const sampleUI = buildSampleUI(ui, shell.left);
  const trends = buildTrends(ui, shell.left);
  const comparePanel = buildComparePanel(shell.left, ui); comparePanel.panel.remove();
  const atom = createAtomView({ onBuilt: info => { if (state.view === 'atom') atomPanel.render(info); } });
  const sample = createSampleView({
    onState: info => { if (state.view === 'sample') sampleUI.render(info); },
    onEvent: (a, b, e) => { if (state.view === 'sample') sampleUI.onEvent(a, b, e); },
  });

  // ---- home: the table, its chrome and the element card ----------------------------------------------
  let interacted = false, hintTimer = 0, breathTimer = 0;
  const firstTouch = () => {
    if (interacted) return;
    interacted = true;
    clearTimeout(hintTimer); clearTimeout(breathTimer);
    table.setBreath(0); table.showHint(0);
  };
  const table = createTableView({
    onSelect: e => { firstTouch(); openCard(e.Z); },
    onEmpty: () => { if (state.card && !isPhone()) closeCard(); },
    loupe: (e, x, y) => { firstTouch(); home.loupe(e, x, y); },
    onAway: a => home.setAway(a),
    isPhone,
  });
  const home = buildHome(ui, {
    onPick: e => { firstTouch(); openCard(e.Z, true); },
    onBack: () => goBack(),
    onInteract: firstTouch,
    onReset: () => table.frame(),
    openModal: k => shell.openModal(k),
  });
  const card = buildElementCard(ui, {
    onClose: () => closeCard(),
    onStep: d => { const Z = state.Z + d; openCard(Z < 1 ? 118 : Z > 118 ? 1 : Z, true); },
    onDoor: (v, Z2) => { set({ view: v, ...(v === 'compare' ? { Z2 } : {}), ...(v === 'sample' ? { T: 293.15, allotrope: null } : {}) }); },
    onPattern: prop => set({ view: 'trends', prop, log: prop === 'density' }),
    defaultPartner,
  });
  registerView('table', table);
  registerView('atom', atom);
  registerView('sample', sample);
  registerView('compare', createCompareView());
  registerView('trends', stubView());

  function lensPatch(id) {
    const s = lensSettings(id);
    return { color: s.color, flat: s.flat, ...(s.flat ? {} : { prop: s.prop, log: s.log }) };
  }
  function openCard(Z, fly = true) {
    set({ Z, card: true, hideSel: false });
    if (!card.isOpen()) card.open(); else card.render();
    updateSafe();
    if (fly && E.active === table) table.focus(Z);
  }
  function closeCard() {
    if (!state.card) return;
    set({ card: false, hideSel: true });
    card.close();
    updateSafe();
    if (E.active === table) table.frame();
  }
  function goBack() {
    if (state.view !== 'table') { set({ view: 'table', card: true, hideSel: false }); return; }
    closeCard();
  }

  // ---- legacy panels per view --------------------------------------------------------------------
  const leftPanels = { atom: atomPanel, sample: { panel: sampleUI.panel, render: () => sampleUI.render() }, trends: { panel: trends.panel, render: () => trends.render() }, compare: comparePanel };
  function renderLegacy() {
    const v = state.view;
    for (const [k, p] of Object.entries(leftPanels)) if (k !== v && p.panel.parentNode) p.panel.remove();
    spectrum.box.hidden = v !== 'atom';
    sampleUI.show(v === 'sample');
    trends.show(v === 'trends');
    comparePanel.show(v === 'compare');
    if (v === 'atom') spectrum.render(byZ(state.Z));
    if (leftPanels[v]) {
      const p = leftPanels[v];
      if (!p.panel.parentNode) shell.left.append(p.panel);
      p.render(v === 'atom' ? atom.info() : undefined);
    }
    if (v !== 'table') sheet.render();
  }
  function applyPlace() {
    const homeNow = state.view === 'table';
    document.body.classList.toggle('legacy', !homeNow);
    document.body.classList.toggle('place-home', homeNow);
    shell.left.hidden = homeNow; shell.right.hidden = homeNow;
    document.querySelector('.mobile-bar').hidden = homeNow;
    if (homeNow && state.card) { if (!card.isOpen()) card.open(); else card.render(); }
    if (!homeNow && card.isOpen()) card.close();
  }
  function renderAll() { shell.relabel(); home.render(); renderLegacy(); applyPlace(); if (card.isOpen()) card.render(); }

  on(ch => {
    if (('view' in ch || 'Z' in ch) && state.view === 'compare' && (!state.Z2 || state.Z2 === state.Z)) set({ Z2: defaultPartner(state.Z) }, { silent: true });
    if ('lens' in ch) Object.assign(state, lensPatch(state.lens)); // (already set by the chip; keeps hash loads consistent)
    if ('lang' in ch) setLang(state.lang);
    if ('reduced' in ch) { document.body.classList.toggle('reduced', state.reduced); E.rig.reduced = state.reduced; }
    if ('view' in ch) { switchView(state.view); shell.closePanels(); home.closeMenu(); }
    for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
    home.onState(ch);
    if ('lang' in ch || 'view' in ch) renderAll();
    else {
      if (state.view !== 'table' && ['prop', 'log', 'layout', 'cb', 'T', 'Z', 'Z2', 'density', 'orbital', 'surf', 'tier', 'allotrope', 'trendLine', 'cmpR'].some(k => k in ch)) renderLegacy();
      if (state.view !== 'table' && ['Z', 'more', 'cb', 'T'].some(k => k in ch)) sheet.render();
      if (state.view === 'table' && state.card && ['Z', 'cb'].some(k => k in ch)) card.render();
    }
    if ('view' in ch) { applyPlace(); updateSafe(); }
    invalidate();
  });

  // ---- keyboard ---------------------------------------------------------------------------------------
  window.addEventListener('keydown', ev => {
    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key;
    if (k === 'Escape') {
      if (shell.modalOpen()) { shell.closeModal(); return; }
      if (home.menuOpen()) { home.closeMenu(); return; }
      if (state.view !== 'table' || state.card) { goBack(); return; }
      shell.closePanels(); return;
    }
    if (shell.modalOpen()) return;
    firstTouch();
    const e = byZ(state.Z);
    const step = Z => { if (state.view === 'table') openCard(Z, true); else set({ Z }); };
    if (k === 'ArrowRight' || k === ']') { step(e.Z < 118 ? e.Z + 1 : 1); ev.preventDefault(); }
    else if (k === 'ArrowLeft' || k === '[') { step(e.Z > 1 ? e.Z - 1 : 118); ev.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { const n = neighbour(e, k === 'ArrowUp' ? -1 : 1); if (n) step(n.Z); ev.preventDefault(); }
    else if (k === '/') { home.focusFind(); ev.preventDefault(); }
    else if (k === 'Enter' && state.view === 'table' && !state.card) openCard(state.Z, true);
    else if ((k === 'l' || k === 'L') && state.view === 'table') set({ layout: LAYOUTS[(LAYOUTS.indexOf(state.layout) + 1) % LAYOUTS.length] });
    else if ((k === 'h' || k === 'H') && state.view === 'table') home.pickLens(TOP_LENSES[(TOP_LENSES.indexOf(state.lens) + 1) % TOP_LENSES.length]);
    else if (k === 'f' || k === 'F') set({ fps: !state.fps });
  });

  // ---- frame the 3D view in the area not covered by chrome ----------------------------------------------
  /** Where a panel will rest: its box without the slide-in transform it may still be animating. */
  function restingRect(el) {
    const r = el.getBoundingClientRect(), tf = getComputedStyle(el).transform;
    const m = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf) : null;
    return m ? { left: r.left - m.m41, top: r.top - m.m42, right: r.right - m.m41, bottom: r.bottom - m.m42 } : r;
  }
  function updateSafe() {
    const W = window.innerWidth, H = window.innerHeight;
    const tb = home.top.getBoundingClientRect();
    if (state.view === 'table') {
      const bottomEl = home.bottom.hidden ? null : home.bottom.getBoundingClientRect();
      const cardEl = card.isOpen() ? restingRect(card.el) : null;
      if (isPhone()) {
        const bottom = cardEl ? H - cardEl.top + 8 : bottomEl ? H - bottomEl.top + 8 : 16;
        const headEl = home.head.hidden || cardEl ? null : home.head.getBoundingClientRect();
        setSafe({ left: 0, right: 0, top: Math.max(tb.bottom + 4, headEl ? headEl.bottom + 6 : 0), bottom });
      } else {
        setSafe({ left: 0, right: cardEl ? W - cardEl.left + 12 : 0, top: tb.bottom + 8, bottom: bottomEl ? H - bottomEl.top + 8 : 16 });
      }
      return;
    }
    if (isPhone()) { setSafe({ left: 0, right: 0, top: tb.bottom + 4, bottom: 64 }); return; }
    const L = shell.left.getBoundingClientRect(), R = shell.right.getBoundingClientRect();
    const show = el => !el.hidden && getComputedStyle(el).display !== 'none' && el.children.length;
    setSafe({ left: show(shell.left) ? L.right + 8 : 0, right: show(shell.right) ? W - R.left + 8 : 0, top: tb.bottom + 6, bottom: 0 });
  }
  const ro = new ResizeObserver(() => updateSafe());
  for (const el of [shell.left, shell.right, home.top, home.bottom, home.head, card.el]) ro.observe(el);
  window.addEventListener('resize', () => { home.render(); updateSafe(); });

  renderAll();
  updateSafe();
  switchView(state.view);
  if (state.view === 'table' && state.card) table.focus(state.Z, 0);
  if (!isPhone() && state.view !== 'table') shell.openPanel('right');

  // first five seconds: a light sweep, iron breathes, a "Try iron" tag after 4 s without a touch
  const loading = document.getElementById('loading');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (loading) { loading.classList.add('done'); setTimeout(() => loading.remove(), 450); }
    if (state.view === 'table' && !state.card) {
      table.introSweep();
      breathTimer = setTimeout(() => { if (!interacted) table.setBreath(26); }, 1400);
      hintTimer = setTimeout(() => { if (!interacted && state.view === 'table' && !state.card) { const fe = byZ(26); table.showHint(26, t('home.try', { name: state.lang === 'vi' ? (altName(fe) || name(fe)) : name(fe).toLowerCase() })); } }, 4000);
      setTimeout(() => table.setBreath(0), 22000);
    }
  }));
  for (const evName of ['pointerdown', 'wheel']) E.canvas.addEventListener(evName, firstTouch, { passive: true });
  window.__pt = { state, set, E, table, home, card }; // debugging / scripted screenshots
}

boot();
