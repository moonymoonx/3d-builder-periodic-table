// Source popover for any [value, sourceKey, flags] — shared by the data sheet and the panels.
import { h } from '../dom.js';
import { t } from '../i18n.js';
import { source } from '../data.js';

let pop = null;
export function closeSource() { if (pop) { pop.remove(); pop = null; } }
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSource(); });
document.addEventListener('pointerdown', ev => { if (pop && !pop.contains(ev.target) && !ev.target.closest('.v')) closeSource(); }, true);

/** Show where a value comes from, anchored to the element that was tapped. */
export function showSource(anchor, label, v, e, shown) {
  closeSource();
  const [value, key, fl = {}] = v;
  const src = source(key);
  const body = [h('button', { class: 'close', 'aria-label': t('sh.close'), onclick: closeSource }, '×'), h('h4', null, label)];
  if (value != null) body.push(h('p', null, h('b', null, shown ?? anchor.textContent)));
  if (key === 'placeholder') body.push(h('p', { class: 'badge' }, t('src.placeholder')));
  if (fl.p) body.push(h('p', null, '≈ ', t('src.pred')));
  if (fl.th) body.push(h('p', null, t('src.th')));
  if (fl.n) body.push(h('p', null, h('b', null, t('src.note') + ': '), Array.isArray(fl.d) ? `${fl.n} (${fl.d.join(', ')})` : fl.n));
  if (fl.alt) body.push(h('p', null, h('b', null, t('src.other') + ': '), fl.alt));
  if (fl.u != null) body.push(h('p', null, `${t('src.unc')}: ± ${fl.u}`));
  if (fl.r) body.push(h('p', null, `${t('src.ref')}: ${fl.r}`));
  body.push(h('p', null, h('b', null, t('src.source') + ': '), src.name));
  if (src.url) body.push(h('p', null, h('a', { href: src.url, target: '_blank', rel: 'noopener noreferrer' }, t('src.open'))));
  if (key === 'wp' && e && e.wpRev) body.push(h('p', null, h('a', { href: `https://en.wikipedia.org/w/index.php?oldid=${e.wpRev}`, target: '_blank', rel: 'noopener noreferrer' }, `Wikipedia revision ${e.wpRev}`)));
  if (src.accessed) body.push(h('p', { class: 'small' }, `${t('src.accessed')}: ${src.accessed}`));
  if (src.licence) body.push(h('p', { class: 'small' }, `${t('src.licence')}: ${src.licence}`));
  pop = h('div', { class: 'popover', role: 'dialog' }, body);
  document.getElementById('ui').append(pop);
  const r = anchor.getBoundingClientRect();
  const pw = Math.min(420, window.innerWidth - 20);
  pop.style.left = Math.min(Math.max(10, r.left - pw / 2), window.innerWidth - pw - 10) + 'px';
  const below = r.bottom + 8;
  pop.style.top = below + 'px';
  const ph = pop.offsetHeight;
  if (below + ph > window.innerHeight - 10) pop.style.top = Math.max(10, r.top - ph - 8) + 'px';
  pop.querySelector('.close').focus();
}

/** A tappable value: shows `text`, opens its source on click. */
export function valueButton(text, label, v, e) {
  if (!v) return h('span', { class: 'v none' }, '—');
  const b = h('button', { class: 'v' + (v[2]?.p ? ' pred' : '') + (v[0] == null ? ' none' : ''), type: 'button' }, text);
  b.addEventListener('click', () => showSource(b, label, v, e, text));
  return b;
}
