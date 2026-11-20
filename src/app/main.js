// Boot: data -> state (URL hash) -> engine -> views -> UI; keyboard shortcuts.
import * as THREE from 'three';
import { loadData, bySym, byZ, elements, PROPS } from './data.js';
import { state, set, on, readHash, initHash, VIEWS, LAYOUTS } from './state.js';
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
import { buildQuiz } from './ui/quiz.js';
import { buildShell } from './ui/shell.js';
import { buildSheet } from './ui/sheet.js';
import { buildTablePanel } from './ui/tablePanel.js';
import { h, replace, isPhone } from './dom.js';

function fatal(msg) {
  document.getElementById('ui').append(h('div', { class: 'modal-back' }, h('div', { class: 'modal' }, h('h2', null, 'Periodic Table 3D'), h('p', null, msg))));
}

function stubView(name) {
  // Placeholder until the view's milestone lands (atom M3, sample M4, trends/compare M5, quiz M6).
  return { scene: new THREE.Scene(), panel: true, enter() {}, exit() {} };
}

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
  const qs = new URLSearchParams(location.search);
  if (qs.has('stats')) state.fps = true;
  if (['low', 'med', 'high'].includes(qs.get('q'))) state.quality = qs.get('q'); // force a quality tier
  setLang(state.lang);
  document.body.classList.toggle('reduced', state.reduced);
  try { createEngine(document.getElementById('gl')); }
  catch (err) { fatal('WebGL is not available in this browser, so the 3D view cannot start. (' + (err && err.message) + ')'); return; }
  E.rig.reduced = state.reduced;

  const shell = buildShell({ onPick: e => select(e.Z, true) });
  const sheet = buildSheet(shell.right, { onView: v => set({ view: v }) });
  const tablePanel = buildTablePanel(shell.left);
  const atomPanel = buildAtomPanel(shell.left);
  const stubPanel = h('section', { class: 'panel' });
  const spectrum = buildSpectrum(document.getElementById('ui'));
  spectrum.box.hidden = true;
  const sampleUI = buildSampleUI(document.getElementById('ui'), shell.left);
  const trends = buildTrends(document.getElementById('ui'), shell.left);
  const comparePanel = buildComparePanel(shell.left, document.getElementById('ui'));
  comparePanel.panel.remove();

  const table = createTableView({
    onSelect: e => (state.view === 'quiz' ? quiz.tap(e.Z) : select(e.Z)),
    onOpen: e => (state.view === 'quiz' ? quiz.tap(e.Z) : set({ view: 'atom' })),
    tooltip: shell.tooltip,
  });
  registerView('table', table);
  const atom = createAtomView({ onBuilt: info => { if (state.view === 'atom') atomPanel.render(info); } });
  registerView('atom', atom);
  const sample = createSampleView({
    onState: info => { if (state.view === 'sample') sampleUI.render(info); },
    onEvent: (a, b, e) => { if (state.view === 'sample') sampleUI.onEvent(a, b, e); },
  });
  registerView('sample', sample);
  registerView('compare', createCompareView());
  for (const v of VIEWS) if (!E.views[v]) registerView(v, stubView(v));

  // Quiz: its own tab; the 3D view behind it is whichever view shows the current clue ("stage")
  let quizStage = 'table';
  const quiz = buildQuiz(document.getElementById('ui'), {
    switchStage(v) { quizStage = v; switchView(v); trends.show(v === 'trends'); updateSafe(); },
    focusTable(Zs) { if (E.active === table) table.focusMany(Zs); },
    frameTable() { if (E.active === table) table.frame(state.reduced ? 0 : 0.9); },
    layoutChanged: () => updateSafe(),
  });

  function select(Z, fly = false) {
    if (state.view === 'quiz') { set({ Z, hideSel: false }); if (fly && E.active === table) table.focus(Z); return; }
    set({ Z });
    if (fly && state.view === 'table' && E.active === table) table.focus(Z);
    shell.openPanel('right');
  }

  const leftPanels = { table: tablePanel, atom: atomPanel, sample: { panel: sampleUI.panel, render: () => sampleUI.render() }, trends: { panel: trends.panel, render: () => trends.render() }, compare: comparePanel, quiz: { panel: quiz.panel, render: () => quiz.renderSkills() } };
  function renderLeft() {
    for (const [v, p] of Object.entries(leftPanels)) if (v !== state.view && p.panel.parentNode) p.panel.remove();
    spectrum.box.hidden = state.view !== 'atom';
    sampleUI.show(state.view === 'sample');
    trends.show(state.view === 'trends' || (state.view === 'quiz' && quizStage === 'trends'));
    comparePanel.show(state.view === 'compare');
    if (state.view === 'atom') spectrum.render(byZ(state.Z));
    if (leftPanels[state.view]) {
      if (stubPanel.parentNode) stubPanel.remove();
      const p = leftPanels[state.view];
      if (!p.panel.parentNode) shell.left.append(p.panel);
      p.render(state.view === 'atom' ? atom.info() : undefined);
    } else {
      replace(stubPanel, h('div', { class: 'sec' }, h('h3', null, t('view.' + state.view)),
        h('p', null, state.lang === 'vi' ? 'Chế độ xem này đang được xây dựng ở mốc tiếp theo.' : 'This view is being built in the next milestone.')));
      if (!stubPanel.parentNode) shell.left.append(stubPanel);
    }
  }
  function renderAll() { shell.relabel(); renderLeft(); sheet.render(); }

  on(ch => {
    if (('view' in ch || 'Z' in ch) && state.view === 'compare' && (!state.Z2 || state.Z2 === state.Z)) set({ Z2: defaultPartner(state.Z) }, { silent: true });
    if ('lang' in ch) setLang(state.lang);
    if ('reduced' in ch) { document.body.classList.toggle('reduced', state.reduced); E.rig.reduced = state.reduced; }
    if ('view' in ch) {
      document.body.classList.toggle('quiz-mode', state.view === 'quiz');
      if (state.view === 'quiz') quiz.enter(); else { quiz.exit(); switchView(state.view); }
      shell.closePanels();
    }
    if (('lang' in ch || 'cb' in ch) && state.view === 'quiz' && !('view' in ch)) quiz.render();
    for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
    if ('lang' in ch || 'view' in ch) renderAll();
    else {
      if (['prop', 'log', 'layout', 'color', 'filters', 'cb', 'T', 'Z', 'Z2', 'density', 'orbital', 'surf', 'tier', 'allotrope', 'trendLine', 'cmpR'].some(k => k in ch)) renderLeft();
      if (['Z', 'more', 'cb', 'T'].some(k => k in ch)) sheet.render();
    }
    invalidate();
  });

  // ---- keyboard -------------------------------------------------------------------------------
  window.addEventListener('keydown', ev => {
    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const e = byZ(state.Z);
    const k = ev.key;
    if (k === 'Escape') { shell.closeModal(); shell.closePanels(); return; }
    if (shell.modalOpen()) return;
    if (state.view === 'quiz') {
      if (quiz.onKey(ev)) { ev.preventDefault(); return; }
      if (/^[lLhH]$/.test(k)) return; // layout and height keys would undo the quiz staging
    }
    if (k === 'ArrowRight' || k === ']') { select(e.Z < 118 ? e.Z + 1 : 1, true); ev.preventDefault(); }
    else if (k === 'ArrowLeft' || k === '[') { select(e.Z > 1 ? e.Z - 1 : 118, true); ev.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { const n = neighbour(e, k === 'ArrowUp' ? -1 : 1); if (n) select(n.Z, true); ev.preventDefault(); }
    else if (/^[1-6]$/.test(k)) set({ view: VIEWS[+k - 1] });
    else if (k === '/') { shell.search.focus(); ev.preventDefault(); }
    else if (k === 'l' || k === 'L') set({ layout: LAYOUTS[(LAYOUTS.indexOf(state.layout) + 1) % LAYOUTS.length] });
    else if (k === 'h' || k === 'H') { const i = PROPS.findIndex(p => p.key === state.prop); const p = PROPS[(i + 1) % PROPS.length]; set({ prop: p.key, log: !!p.log }); }
    else if (k === 'Enter') set({ view: 'atom' });
    else if (k === 'f' || k === 'F') set({ fps: !state.fps });
  });

  // frame the 3D view in the area not covered by panels
  function updateSafe() {
    const W = window.innerWidth;
    const tb = document.querySelector('.topbar').getBoundingClientRect();
    const inQuiz = state.view === 'quiz' && !quiz.card.hidden;
    if (isPhone()) {
      const bottom = inQuiz ? Math.max(64, window.innerHeight - quiz.card.getBoundingClientRect().top + 8) : 64;
      setSafe({ left: 0, right: 0, top: tb.bottom + 4, bottom });
      return;
    }
    const L = shell.left.getBoundingClientRect(), R = shell.right.getBoundingClientRect();
    const show = el => getComputedStyle(el).display !== 'none' && el.children.length;
    const right = inQuiz ? W - quiz.card.getBoundingClientRect().left + 8 : show(shell.right) ? W - R.left + 8 : 0;
    setSafe({ left: show(shell.left) ? L.right + 8 : 0, right, top: tb.bottom + 6, bottom: 0 });
  }
  const ro = new ResizeObserver(updateSafe);
  ro.observe(shell.left); ro.observe(shell.right); ro.observe(document.querySelector('.topbar')); ro.observe(quiz.card);
  window.addEventListener('resize', updateSafe);

  renderAll();
  updateSafe();
  document.body.classList.toggle('quiz-mode', state.view === 'quiz');
  if (state.view === 'quiz') quiz.enter(); else switchView(state.view);
  if (!isPhone()) shell.openPanel('right');
  window.__pt = { state, set, E, quiz }; // debugging / scripted screenshots
}

boot();
