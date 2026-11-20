// Shell for the views not yet rebuilt (side panels, phone bottom bar, tooltip) plus the dialogs
// (help/keys, credits, settings) and the FPS meter. The top bar now lives in places/home.js.
import { h, $, clear, replace, toast, isPhone } from '../dom.js';
import { t, getLang, fmtNum } from '../i18n.js';
import { state, set, VIEWS, shareURL } from '../state.js';
import { search, name, altName, data, source } from '../data.js';
import { E, frameStats, setTier } from '../engine.js';

export function buildShell() {
  const ui = $('#ui');
  const S = {};

  // ---- side panels + phone bar ------------------------------------------------------------
  S.left = h('aside', { class: 'side left', 'aria-label': 'Controls' });
  S.right = h('aside', { class: 'side right', 'aria-label': 'Data sheet' });
  const mb = h('nav', { class: 'mobile-bar' });
  S.mobBtns = {
    left: h('button', { class: 'btn', onclick: () => togglePanel('left') }),
    right: h('button', { class: 'btn', onclick: () => togglePanel('right') }),
  };
  mb.append(S.mobBtns.left, S.mobBtns.right);
  ui.append(S.left, S.right, mb);
  function togglePanel(which) {
    const p = which === 'left' ? S.left : S.right, o = which === 'left' ? S.right : S.left;
    o.classList.remove('open');
    p.classList.toggle('open');
  }
  S.closePanels = () => { S.left.classList.remove('open'); S.right.classList.remove('open'); };
  S.openPanel = which => { if (isPhone()) { S.closePanels(); (which === 'left' ? S.left : S.right).classList.add('open'); } };

  // ---- tooltip ------------------------------------------------------------------------------
  const tip = h('div', { class: 'tooltip', hidden: true });
  ui.append(tip);
  S.tooltip = info => {
    if (!info || isPhone()) { tip.hidden = true; return; }
    replace(tip, h('b', null, `${info.e.sym} `), name(info.e), h('br'), info.text || '');
    tip.style.left = info.x + 'px'; tip.style.top = info.y + 'px'; tip.hidden = false;
  };

  // ---- modals ---------------------------------------------------------------------------------
  let modal = null;
  function openModal(kind) {
    closeModal();
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const back = h('div', { class: 'modal-back', onclick: ev => { if (ev.target === back) closeModal(); } }, box);
    const close = h('button', { class: 'btn', style: { float: 'right' }, onclick: closeModal }, t('sh.close'));
    if (kind === 'help') fillHelp(box, close);
    if (kind === 'credits') fillCredits(box, close);
    if (kind === 'settings') fillSettings(box, close);
    ui.append(back);
    modal = back;
    close.focus();
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }
  S.closeModal = closeModal;
  S.modalOpen = () => !!modal;
  S.openModal = openModal;

  function fillHelp(box, close) {
    box.append(close, h('h2', null, t('help.title')));
    for (const p of t('help.body')) box.append(h('p', null, p));
    box.append(h('h3', null, t('help.keys')));
    const keys = [['← →  [ ]', t('key.prevnext')], ['↑ ↓', t('key.updown')], ['/', t('key.search')],
      ['H', t('key.height')], ['L', t('key.layout')], ['Enter', t('key.enter')], ['Esc', t('key.esc')], ['F', t('key.fps')]];
    box.append(h('table', null, keys.map(([k, d]) => h('tr', null, h('td', null, ...k.split('  ').map(x => h('kbd', null, x))), h('td', null, d)))));
  }
  function fillCredits(box, close) {
    const D = data();
    box.append(close, h('h2', null, t('cr.title')), h('p', null, t('cr.intro')), h('p', null, t('cr.inspired')),
      h('p', null, t('cr.three', { v: D.build?.three?.split('.')[1] || '170' })),
      h('h3', null, t('cr.sources')));
    const used = new Set();
    const mark = v => { if (Array.isArray(v) && typeof v[1] === 'string') used.add(v[1]); };
    for (const e of D.elements) { Object.values(e.f).forEach(mark); Object.values(e.zeff).forEach(mark); Object.values(e.names).forEach(mark); if (e.lat.phases) for (const p of e.lat.phases) { used.add(p.cellSrc); used.add(p.sitesSrc); } if (!e.lines.none) used.add('nist-lines'); }
    used.add('cie'); used.add('w3c'); used.add('codata');
    const rows = Object.entries(D.sources).filter(([k]) => used.has(k) && !['none'].includes(k));
    box.append(h('table', null, h('tr', null, h('th', null, t('cr.th.name')), h('th', null, t('cr.th.lic')), h('th', null, t('cr.th.date'))),
      rows.map(([k, s]) => h('tr', null,
        h('td', null, s.url ? h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name) : s.name),
        h('td', null, s.licence || ''), h('td', null, s.accessed || '')))));
    box.append(h('p', { class: 'small' }, t('cr.placeholders')), h('p', { class: 'small' }, t('cr.build', { date: D.build?.date || '', commit: D.build?.commit || '' })));
  }
  function fillSettings(box, close) {
    box.append(close, h('h2', null, t('set.title')));
    const seg = (items, cur, onpick) => h('div', { class: 'seg' }, items.map(([v, l]) => h('button', { 'aria-pressed': String(cur === v), onclick: () => { onpick(v); openModal('settings'); } }, l)));
    box.append(h('h3', null, t('set.lang')), seg([['en', 'English'], ['vi', 'Tiếng Việt']], getLang(), v => set({ lang: v })));
    box.append(h('h3', null, t('set.quality')), seg([['auto', t('q.auto')], ['low', t('q.low')], ['med', t('q.med')], ['high', t('q.high')]], state.quality, v => { set({ quality: v }); if (v !== 'auto') setTier(v); }),
      h('span', { class: 'small', style: { marginLeft: '10px' } }, t('set.tierNow', { tier: t('q.' + E.tier) }) + (E.gpu ? ` · ${E.gpu}` : '')));
    const chk = (label, key) => h('label', { class: 'check', style: { display: 'flex', margin: '10px 0' } },
      h('input', { type: 'checkbox', checked: state[key], onchange: ev => set({ [key]: ev.target.checked }) }), label);
    box.append(h('h3', null, '—'), chk(t('set.motion'), 'reduced'), chk(t('set.cb'), 'cb'), chk(t('set.fps'), 'fps'));
    box.append(h('button', { class: 'btn primary', onclick: async () => {
      const url = shareURL();
      try { await navigator.clipboard.writeText(url); toast(t('set.copied')); } catch { toast(url, 6000); }
    } }, t('set.share')));
  }

  // ---- FPS meter -------------------------------------------------------------------------------
  const fps = h('div', { class: 'fps', hidden: true });
  ui.append(fps);
  setInterval(() => {
    if (!state.fps) { fps.hidden = true; return; }
    const st = frameStats();
    fps.hidden = false;
    fps.textContent = st ? `FPS ${fmtNum(st.fps, 0)}  median ${st.median.toFixed(1)} ms  p95 ${st.p95.toFixed(1)} ms\ntier ${E.tier}${E.continuous.size || E.anims.size ? '' : '  (idle: renders on demand)'}`
      : `tier ${E.tier}  (idle: renders on demand)`;
  }, 500);

  S.relabel = () => {
    S.mobBtns.left.textContent = t('btn.controls'); S.mobBtns.right.textContent = t('btn.data');
  };
  S.relabel();
  return S;
}
