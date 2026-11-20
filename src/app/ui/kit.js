// UI kit: the shared components every place uses (STYLE.md §5, DESIGN-RULES Layer 1).
// Each factory returns a DOM element (or a small handle); styles live in src/styles/kit.css with the
// "ui-" prefix, so they can never clash with the legacy view classes. Targets are >= 44 px.
import { h, replace } from '../dom.js';

/** Pill button. kind: 'primary' (ink fill) | 'secondary' (outline) | 'quiet' (text only). */
export function button({ label, kind = 'secondary', icon = null, onClick, attrs = {} }) {
  return h('button', { type: 'button', class: `ui-btn ui-btn--${kind}`, onclick: onClick, ...attrs },
    icon ? h('span', { class: 'ui-btn__icon', 'aria-hidden': 'true' }, icon) : null,
    h('span', { class: 'ui-btn__label' }, label));
}

/** Toggle chip (aria-pressed), optionally with a colour swatch. */
export function chip({ label, pressed = false, swatch = null, onClick, attrs = {} }) {
  return h('button', { type: 'button', class: 'ui-chip', 'aria-pressed': String(!!pressed), onclick: onClick, ...attrs },
    swatch ? h('span', { class: 'ui-swatch', style: { background: swatch }, 'aria-hidden': 'true' }) : null,
    h('span', null, label));
}

/** The always-visible way back: "← label". */
export function backLink({ label, onClick, attrs = {} }) {
  return h('button', { type: 'button', class: 'ui-back', onclick: onClick, ...attrs }, h('span', { 'aria-hidden': 'true' }, '←'), h('span', null, label));
}

/** Round icon button with an accessible name. */
export function iconButton({ glyph, label, onClick, attrs = {} }) {
  return h('button', { type: 'button', class: 'ui-icon', 'aria-label': label, title: label, onclick: onClick, ...attrs }, h('span', { 'aria-hidden': 'true' }, glyph));
}

/** Segmented control: options [{ id, label, title? }]; value = selected id. */
export function segmented({ options, value, onPick, label }) {
  return h('div', { class: 'ui-seg', role: 'group', 'aria-label': label },
    options.map(o => h('button', { type: 'button', 'aria-pressed': String(o.id === value), title: o.title || null, onclick: () => onPick(o.id) }, o.label)));
}

/** A big door to another place, with a one-line subtitle. */
export function door({ title, sub, onClick, attrs = {} }) {
  return h('button', { type: 'button', class: 'ui-door', onclick: onClick, ...attrs },
    h('span', { class: 'ui-door__text' }, h('span', { class: 'ui-door__title' }, title), sub ? h('span', { class: 'ui-door__sub' }, sub) : null),
    h('span', { class: 'ui-door__arrow', 'aria-hidden': 'true' }, '→'));
}

/** One plain fact: label, value (string or node), optional note line and extra node (e.g. a ruler). */
export function fact({ label, value, note = null, extra = null, link = null }) {
  return h('div', { class: 'ui-fact' },
    h('div', { class: 'ui-fact__label' }, label),
    h('div', { class: 'ui-fact__value' }, value, link),
    note ? h('div', { class: 'ui-fact__note' }, note) : null,
    extra);
}

/** Disclosure with a lazily built body (built the first time it opens). */
export function disclosure({ summary, open = false, build, onToggle }) {
  const body = h('div', { class: 'ui-disclosure__body' });
  let built = false;
  const btn = h('button', { type: 'button', class: 'ui-disclosure__summary', 'aria-expanded': String(open) },
    h('span', null, summary), h('span', { class: 'ui-disclosure__chev', 'aria-hidden': 'true' }, '▾'));
  const el = h('div', { class: 'ui-disclosure' + (open ? ' is-open' : '') }, btn, body);
  const set = o => {
    el.classList.toggle('is-open', o);
    btn.setAttribute('aria-expanded', String(o));
    body.hidden = !o;
    if (o && !built && build) { build(body); built = true; }
  };
  btn.addEventListener('click', () => { const o = !el.classList.contains('is-open'); set(o); if (onToggle) onToggle(o); });
  set(open);
  return el;
}

/** A one-line banner: title (the hook), caption (the plain name of the science) and an optional control. */
export function banner({ title, caption = null, control = null, attrs = {} }) {
  return h('div', { class: 'ui-banner', ...attrs },
    h('p', { class: 'ui-banner__title' }, title),
    caption ? h('p', { class: 'ui-banner__caption' }, caption) : null,
    control);
}

/**
 * Responsive "sheet": a card on the right on desktop, a bottom sheet on phones (peek / full).
 * Returns { el, body, open(), close(), setFull(bool) }.
 */
export function sheet({ label, onClose, closeLabel = 'Close' }) {
  const body = h('div', { class: 'ui-sheet__body' });
  const handle = h('button', { type: 'button', class: 'ui-sheet__handle', 'aria-label': label }, h('span', { 'aria-hidden': 'true' }));
  const close = h('button', { type: 'button', class: 'ui-icon ui-sheet__close', 'aria-label': closeLabel, title: closeLabel, onclick: () => onClose && onClose() }, h('span', { 'aria-hidden': 'true' }, '×'));
  // a compact title bar that slides in once the body scrolls, so content never runs under the close button
  const bar = h('div', { class: 'ui-sheet__bar', 'aria-hidden': 'true' });
  const foot = h('div', { class: 'ui-sheet__foot', hidden: true }); // always-visible footer (e.g. previous / next)
  const el = h('section', { class: 'ui-sheet', 'aria-label': label, hidden: true }, handle, bar, close, body, foot);
  // a soft fade at the bottom edge whenever more content waits below
  const more = () => el.classList.toggle('has-more', body.scrollHeight - body.scrollTop - body.clientHeight > 8);
  body.addEventListener('scroll', () => { el.classList.toggle('is-scrolled', body.scrollTop > 6); more(); }, { passive: true });
  new ResizeObserver(more).observe(body);
  const api = {
    el, body,
    isOpen: () => !el.hidden,
    open() { el.hidden = false; requestAnimationFrame(() => el.classList.add('is-in')); },
    close() { el.classList.remove('is-in', 'is-full', 'is-scrolled'); el.hidden = true; },
    setFull(f) { el.classList.toggle('is-full', !!f); },
    setBar(node) { replace(bar, node); },
    setFoot(node) { replace(foot, node); foot.hidden = !node; },
    updateMore: more,
    /** Phone: how tall the sheet stands before it is pulled up (px; null = the default). */
    setPeek(px) { if (px == null) el.style.removeProperty('--peek'); else el.style.setProperty('--peek', `${Math.round(px)}px`); },
  };
  // phone: tap the handle or swipe up/down on it to switch between peek and full
  let y0 = null;
  handle.addEventListener('click', () => api.setFull(!el.classList.contains('is-full')));
  handle.addEventListener('pointerdown', e => { y0 = e.clientY; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointerup', e => {
    if (y0 == null) return;
    const dy = e.clientY - y0; y0 = null;
    if (dy < -30) api.setFull(true);
    else if (dy > 30) { if (el.classList.contains('is-full')) api.setFull(false); else if (onClose) onClose(); }
  });
  return api;
}
