// Home place: the chrome around the table (SPEC §0, STYLE.md). One hero (the table), one obvious
// action (tap an element), everything else quieter:
//   top bar  — wordmark (or a back link), "Find an element", EN | VI, menu
//   bottom   — the one prompt; a quiet row of lens chips; a lens banner (hook + caption + control)
//   on top   — the phone loupe while a thumb scrubs across the table
import { h, replace, clear, isPhone, toast } from '../dom.js';
import { t, getLang, fmtNum } from '../i18n.js';
import { state, set, shareURL } from '../state.js';
import { search, name, altName, byZ } from '../data.js';
import { chip, backLink, iconButton, segmented, banner } from '../ui/kit.js';
import { TOP, MORE, lensHook, lensCaption, lensName, lensSettings } from './lenses.js';
import { pigment, pigmentCB, stateColor } from '../../design/tokens.js';
import { HOME_KEYS } from '../content/strings-home.js';

const T_MIN = 1, T_MAX = 6000, ROOM = 293.15;
const toS = T => Math.log(T / T_MIN) / Math.log(T_MAX / T_MIN);
const fromS = s => T_MIN * (T_MAX / T_MIN) ** s;
const degC = K => `${fmtNum(K - 273.15, Math.abs(K - 273.15) < 10 ? 1 : 0)} °C`.replace(/^-/, '−');

export function buildHome(ui, hooks) {
  if (!HOME_KEYS.length) throw new Error('home strings missing');
  // ---- top bar ----------------------------------------------------------------------------------
  const wordB = h('b'), wordS = h('span');
  const word = h('div', { class: 'hero-word' }, wordB, wordS);
  const backSlot = h('div', { class: 'hero-backslot' });
  const input = h('input', { type: 'search', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'go' });
  const results = h('div', { class: 'hero-results', role: 'listbox', hidden: true });
  const find = h('div', { class: 'hero-find' }, h('span', { class: 'hero-find__icon', 'aria-hidden': 'true' }, '⌕'), input, results);
  const langSlot = h('div', { class: 'hero-lang' });
  const menuBtn = iconButton({ glyph: '≡', label: t('home.menu'), onClick: () => toggleMenu() });
  const top = h('header', { class: 'hero-top' }, h('div', { class: 'hero-top__left' }, word, backSlot), h('div', { class: 'hero-top__right' }, find, langSlot, menuBtn));

  // ---- bottom: prompt, banner, lens chips --------------------------------------------------------
  const line = h('p', { class: 'hero-prompt__line' }), tap = h('p', { class: 'hero-prompt__tap' });
  const prompt = h('div', { class: 'hero-prompt' }, line, tap);
  const bannerSlot = h('div', { class: 'hero-banner' });
  const chips = h('div', { class: 'hero-lenses', role: 'toolbar' });
  const bottom = h('div', { class: 'hero-bottom' }, prompt, bannerSlot, chips);
  const loupe = h('div', { class: 'hero-loupe', hidden: true, 'aria-hidden': 'true' });
  const scrims = [h('div', { class: 'hero-scrim is-top', 'aria-hidden': 'true' }), h('div', { class: 'hero-scrim is-bottom', 'aria-hidden': 'true' })];
  ui.prepend(...scrims);
  ui.append(top, bottom, loupe);

  // ---- find ------------------------------------------------------------------------------------
  let active = 0, found = [];
  const renderResults = () => {
    clear(results);
    if (!input.value.trim()) { results.hidden = true; return; }
    found = search(input.value);
    if (!found.length) results.append(h('div', { class: 'hero-result is-empty' }, t('search.none')));
    found.forEach((e, i) => results.append(h('button', {
      type: 'button', class: 'hero-result' + (i === active ? ' is-active' : ''), role: 'option', onmousedown: ev => { ev.preventDefault(); choose(e); },
    }, h('span', { class: 'hero-result__sym', style: { background: (state.cb ? pigmentCB : pigment)[e.f.cat[0]] } }, e.sym),
    h('span', { class: 'hero-result__name' }, name(e)), h('span', { class: 'hero-result__meta' }, `${altName(e) ? altName(e) + ' · ' : ''}${e.Z}`))));
    results.hidden = false;
  };
  const choose = e => { input.value = ''; results.hidden = true; input.blur(); hooks.onPick(e); };
  input.addEventListener('input', () => { active = 0; renderResults(); });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowDown') { active = Math.min(found.length - 1, active + 1); renderResults(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); renderResults(); ev.preventDefault(); }
    else if (ev.key === 'Enter') { if (found[active]) choose(found[active]); }
    else if (ev.key === 'Escape') { input.value = ''; results.hidden = true; input.blur(); }
    ev.stopPropagation();
  });
  input.addEventListener('blur', () => setTimeout(() => { results.hidden = true; }, 150));

  // ---- menu --------------------------------------------------------------------------------------
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; menuBtn.setAttribute('aria-expanded', 'false'); } }
  function toggleMenu(kind = 'main', anchor = menuBtn) {
    if (menu) { const was = menu.dataset.kind; closeMenu(); if (was === kind) return; }
    const item = (label, onclick, pressed) => h('button', { type: 'button', 'aria-pressed': pressed == null ? null : String(!!pressed), onclick: () => { onclick(); } }, label);
    const box = h('div', { class: 'ui-menu', role: 'menu', 'data-kind': kind });
    if (kind === 'more') {
      box.append(h('h4', null, t('lens.more')), ...MORE.map(id => item(lensName(id), () => { closeMenu(); pickLens(id); }, state.lens === id)));
    } else {
      box.append(h('h4', null, t('menu.shapes')),
        item(t('menu.s18'), () => { set({ layout: 's18' }); closeMenu(); }, state.layout === 's18'),
        item(t('menu.s32'), () => { set({ layout: 's32' }); closeMenu(); }, state.layout === 's32'),
        item(t('menu.helix'), () => { set({ layout: 'helix' }); closeMenu(); }, state.layout === 'helix'),
        h('hr'),
        item(t('menu.cb'), () => { set({ cb: !state.cb }); closeMenu(); }, state.cb),
        item(t('menu.motion'), () => { set({ reduced: !state.reduced }); closeMenu(); }, state.reduced),
        h('hr'),
        item(t('menu.share'), async () => { closeMenu(); const url = shareURL(); try { await navigator.clipboard.writeText(url); toast(t('set.copied')); } catch { toast(url, 6000); } }),
        item(t('menu.keys'), () => { closeMenu(); hooks.openModal('help'); }),
        item(t('menu.settings'), () => { closeMenu(); hooks.openModal('settings'); }),
        item(t('menu.sources'), () => { closeMenu(); hooks.openModal('credits'); }));
    }
    ui.append(box);
    menu = box;
    const r = anchor.getBoundingClientRect();
    if (kind === 'main') { box.style.right = `${Math.max(8, window.innerWidth - r.right)}px`; box.style.top = `${r.bottom + 8}px`; }
    else { box.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - box.offsetWidth - 8))}px`; box.style.bottom = `${window.innerHeight - r.top + 8}px`; }
    menuBtn.setAttribute('aria-expanded', String(kind === 'main'));
    const first = box.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  document.addEventListener('pointerdown', ev => { if (menu && !menu.contains(ev.target) && !ev.target.closest('.ui-icon,.hero-more')) closeMenu(); }, true);

  // ---- lenses --------------------------------------------------------------------------------------
  function pickLens(id) {
    const s = lensSettings(id);
    const patch = { lens: id, color: s.color, flat: s.flat };
    if (!s.flat) { patch.prop = s.prop; patch.log = s.log; }
    if (id !== 'heat' && state.lens === 'heat') patch.T = ROOM;
    set(patch);
    hooks.onInteract();
  }
  function renderChips() {
    const moreActive = MORE.includes(state.lens);
    replace(chips, ...TOP.map(id => chip({ label: lensName(id), pressed: state.lens === id, onClick: () => pickLens(id) })),
      chip({ label: moreActive ? `${lensName(state.lens)} ▾` : `${t('lens.more')} ▾`, pressed: moreActive, attrs: { class: 'ui-chip hero-more', 'aria-haspopup': 'menu' }, onClick: ev => toggleMenu('more', ev.currentTarget) }));
    chips.setAttribute('aria-label', t('home.lenses'));
  }
  let heatInput = null, heatRead = null;
  function renderBanner() {
    if (state.lens === 'families') { replace(bannerSlot); bannerSlot.hidden = true; return; }
    bannerSlot.hidden = false;
    let control = null;
    if (state.lens === 'heat') {
      heatRead = h('div', { class: 'ui-temp__read' });
      heatInput = h('input', { type: 'range', min: '0', max: '1000', step: '1', value: String(Math.round(toS(state.T) * 1000)), 'aria-label': t('heat.label') });
      heatInput.addEventListener('input', () => set({ T: Math.round(fromS(heatInput.value / 1000) * 100) / 100 }));
      const room = h('button', { type: 'button', class: 'ui-btn ui-btn--quiet', onclick: () => set({ T: ROOM }) }, t('heat.room'));
      const legend = h('div', { class: 'ui-legend' }, ['solid', 'liquid', 'gas'].map(s => h('span', null, h('i', { class: 'ui-swatch', style: { background: stateColor[s] } }), t('state.' + s))));
      control = h('div', { class: 'hero-heat' }, h('div', { class: 'ui-temp' }, heatRead, heatInput, room), legend);
      updateHeat();
    }
    replace(bannerSlot, banner({ title: lensHook(state.lens), caption: lensCaption(state.lens), control }));
  }
  function updateHeat() {
    if (!heatRead) return;
    replace(heatRead, degC(state.T), h('small', null, `${fmtNum(state.T, state.T < 30 ? 1 : 0)} K`));
    const v = String(Math.round(toS(state.T) * 1000));
    if (heatInput.value !== v && document.activeElement !== heatInput) heatInput.value = v;
  }

  // ---- loupe (phone thumb-scrub) ----------------------------------------------------------------------
  function showLoupe(e, x, y) {
    if (!e) { loupe.hidden = true; return; }
    const pal = state.cb ? pigmentCB : pigment;
    replace(loupe, h('span', { class: 'hero-loupe__tile', style: { background: pal[e.f.cat[0]] } }, h('small', null, String(e.Z)), e.sym),
      h('span', { class: 'hero-loupe__name' }, name(e), altName(e) ? h('small', null, altName(e)) : null));
    loupe.hidden = false;
    const w = loupe.offsetWidth || 180, hgt = loupe.offsetHeight || 80;
    const lx = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2));
    const ly = y - hgt - 56 < 70 ? y + 48 : y - hgt - 56;
    loupe.style.transform = `translate(${lx}px, ${ly}px)`;
  }

  // ---- text ---------------------------------------------------------------------------------------------
  let opened = false;
  function render() {
    replace(wordB, t('home.word')); replace(wordS, t('home.wordSub'));
    input.placeholder = isPhone() ? t('home.findShort') : t('home.find'); input.setAttribute('aria-label', t('home.find'));
    menuBtn.setAttribute('aria-label', t('home.menu')); menuBtn.title = t('home.menu');
    replace(langSlot, segmented({ label: t('btn.lang'), value: getLang(), options: [{ id: 'en', label: 'EN', title: 'English' }, { id: 'vi', label: 'VI', title: 'Tiếng Việt' }], onPick: id => set({ lang: id }) }));
    replace(line, t('home.prompt'));
    replace(tap, isPhone() ? t('home.tapPhone') : opened ? t('home.tapAgain') : t('home.tap'));
    renderChips(); renderBanner();
    renderBack();
    const home = state.view === 'table';
    bottom.hidden = !home;
    for (const sc of scrims) sc.hidden = !home;
    prompt.hidden = state.lens !== 'families' || state.card;
    chips.hidden = state.card && isPhone();
    bottom.classList.toggle('is-card', state.card && !isPhone());
    word.hidden = !(home && !state.card) && isPhone();
  }
  function renderBack() {
    let b = null;
    if (state.view === 'table' && state.card) b = backLink({ label: t('card.back'), onClick: () => hooks.onBack(), attrs: { 'data-back': 'home' } });
    else if (state.view !== 'table') b = backLink({ label: name(byZ(state.Z)), onClick: () => hooks.onBack(), attrs: { 'data-back': 'card' } });
    replace(backSlot, b);
  }

  return {
    top, bottom,
    render,
    renderBack,
    onState(ch) {
      if ('lens' in ch) { renderChips(); renderBanner(); render(); }
      else if ('T' in ch) updateHeat();
      if ('card' in ch && state.card) opened = true;
      if (['card', 'view', 'Z'].some(k => k in ch)) render();
    },
    loupe: showLoupe,
    closeMenu,
    menuOpen: () => !!menu,
    focusFind() { input.focus(); },
    pickLens,
  };
}
