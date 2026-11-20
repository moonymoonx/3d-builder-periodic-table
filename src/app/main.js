// Boot: data -> state (URL hash) -> engine -> views -> UI; keyboard shortcuts.
import * as THREE from 'three';
import { loadData, bySym, byZ, elements, PROPS } from './data.js';
import { state, set, on, readHash, initHash, VIEWS, LAYOUTS } from './state.js';
import { setLang, t } from './i18n.js';
import { createEngine, registerView, switchView, E, invalidate, setSafe } from './engine.js';
import { createTableView } from './views/table.js';
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
  if (new URLSearchParams(location.search).has('stats')) state.fps = true;
  setLang(state.lang);
  document.body.classList.toggle('reduced', state.reduced);
  try { createEngine(document.getElementById('gl')); }
  catch (err) { fatal('WebGL is not available in this browser, so the 3D view cannot start. (' + (err && err.message) + ')'); return; }
  E.rig.reduced = state.reduced;

  const shell = buildShell({ onPick: e => select(e.Z, true) });
  const sheet = buildSheet(shell.right, { onView: v => set({ view: v }) });
  const tablePanel = buildTablePanel(shell.left);
  const stubPanel = h('section', { class: 'panel' });

  const table = createTableView({
    onSelect: e => select(e.Z),
    onOpen: () => set({ view: 'atom' }),
    tooltip: shell.tooltip,
  });
  registerView('table', table);
  for (const v of VIEWS) if (v !== 'table') registerView(v, stubView(v));

  function select(Z, fly = false) {
    set({ Z });
    if (fly && state.view === 'table' && E.active === table) table.focus(Z);
    shell.openPanel('right');
  }

  function renderLeft() {
    if (state.view === 'table') {
      if (stubPanel.parentNode) stubPanel.remove();
      if (!tablePanel.panel.parentNode) shell.left.append(tablePanel.panel);
      tablePanel.render();
    } else {
      tablePanel.panel.remove();
      replace(stubPanel, h('div', { class: 'sec' }, h('h3', null, t('view.' + state.view)),
        h('p', null, state.lang === 'vi' ? 'Chế độ xem này đang được xây dựng ở mốc tiếp theo.' : 'This view is being built in the next milestone.')));
      if (!stubPanel.parentNode) shell.left.append(stubPanel);
    }
  }
  function renderAll() { shell.relabel(); renderLeft(); sheet.render(); }

  on(ch => {
    if ('lang' in ch) setLang(state.lang);
    if ('reduced' in ch) { document.body.classList.toggle('reduced', state.reduced); E.rig.reduced = state.reduced; }
    if ('view' in ch) { switchView(state.view); shell.closePanels(); }
    for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
    if ('lang' in ch || 'view' in ch) renderAll();
    else {
      if (['prop', 'log', 'layout', 'color', 'filters', 'cb', 'T'].some(k => k in ch)) renderLeft();
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
    if (isPhone()) { setSafe({ left: 0, right: 0, top: tb.bottom + 4, bottom: 64 }); return; }
    const L = shell.left.getBoundingClientRect(), R = shell.right.getBoundingClientRect();
    const show = el => getComputedStyle(el).display !== 'none' && el.children.length;
    setSafe({ left: show(shell.left) ? L.right + 8 : 0, right: show(shell.right) ? W - R.left + 8 : 0, top: tb.bottom + 6, bottom: 0 });
  }
  const ro = new ResizeObserver(updateSafe);
  ro.observe(shell.left); ro.observe(shell.right); ro.observe(document.querySelector('.topbar'));
  window.addEventListener('resize', updateSafe);

  renderAll();
  updateSafe();
  switchView(state.view);
  if (!isPhone()) shell.openPanel('right');
  window.__pt = { state, set, E }; // debugging / scripted screenshots
}

boot();
