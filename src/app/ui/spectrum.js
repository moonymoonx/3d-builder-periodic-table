// Visible light of an atom: the strongest NIST lines of the neutral atom (380–750 nm, air wavelengths),
// each in the colour of its wavelength (CIE 1931 fit).
//   spectrumStrip(e, { onPick })  the atom place's "Its light" (STYLE.md: a dark room for light): a
//                                 spectroscope band across the stage, one bright line per wavelength
//                                 (brighter = stronger), colour words under it; tap or arrow keys pick a line
// (The legacy strip of the old dark stage and its "glow colour" were retired at the merge: DECISIONS.md.)
import { h } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { data } from '../data.js';
import { wavelengthToRGB, toHex } from '../../physics/color.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); return el; };
const LO = 380, HI = 750;

/** Colour word for a wavelength (bands as in Wikipedia "Visible spectrum": violet to 450 nm, blue to 485,
 *  cyan to 500, green to 565, yellow to 590, orange to 625, red beyond). */
export function colourWord(nm) {
  return nm < 450 ? 'violet' : nm < 485 ? 'blue' : nm < 500 ? 'teal' : nm < 565 ? 'green' : nm < 590 ? 'yellow' : nm < 625 ? 'orange' : 'red';
}
/** The element's visible lines, one per wavelength (NIST sometimes lists one wavelength more than once). */
export function uniqueLines(e) {
  if (e.lines.none) return [];
  const m = new Map();
  for (const [lam, I] of e.lines.v) { const k = lam.toFixed(3); if (!m.has(k) || m.get(k)[1] < I) m.set(k, [lam, I]); }
  return [...m.values()].sort((a, b) => a[0] - b[0]);
}
/** Display colour of a wavelength (sRGB 0..1). The shared physics/color.js holds the hue at 400 and 680 nm
 *  (the CIE fit's tails drift toward teal and olive) and dims toward the ends of the visible range. */
export function lineColour(nm) {
  const D = data();
  return wavelengthToRGB(nm, D.cmfFit.v, D.srgb.v);
}

export function spectrumStrip(e, { onPick } = {}) {
  const lines = uniqueLines(e);
  const W = 600, H = 84, x = lam => ((lam - LO) / (HI - LO)) * W;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'atom-spec__svg', 'aria-hidden': 'true' });
  const defs = s('defs');
  const id = `atomspec${e.Z}`;
  const grad = s('linearGradient', { id, x1: '0', x2: '1', y1: '0', y2: '0' });
  for (let lam = LO; lam <= HI; lam += 10) grad.append(s('stop', { offset: String((lam - LO) / (HI - LO)), 'stop-color': toHex(lineColour(lam)) }));
  defs.append(grad); svg.append(defs);
  svg.append(s('rect', { x: 0, y: 0, width: W, height: H, rx: 8, class: 'atom-spec__band' }));
  svg.append(s('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: `url(#${id})`, opacity: '0.12' }));
  const marks = [];
  for (const [lam, I] of lines) {
    const rgb = lineColour(lam), col = toHex(rgb), core = toHex(rgb.map(c => c + (1 - c) * 0.32)), k = Math.sqrt(Math.max(I, 1) / 1000);
    const g = s('g', { opacity: (0.42 + 0.58 * k).toFixed(3) });
    g.append(s('rect', { x: x(lam) - 6, y: 2, width: 12, height: H - 4, fill: col, opacity: '0.3', rx: 6 })); // the glow around the line
    g.append(s('rect', { x: x(lam) - 1.5, y: 3, width: 3, height: H - 6, fill: core, rx: 1.5 })); // its bright core
    svg.append(g);
    marks.push({ lam, I, col, rgb, g });
  }
  const sel = s('rect', { x: -10, y: 1, width: 10, height: H - 2, rx: 4, class: 'atom-spec__sel', fill: 'none' });
  svg.append(sel);
  // colour words under the band, placed at the middle of their wavelength band
  const words = [['violet', 415], ['blue', 467], ['green', 532], ['yellow', 577], ['red', 690]];
  const axis = h('div', { class: 'atom-spec__axis', 'aria-hidden': 'true' }, words.map(([w, lam]) => h('span', { style: { left: `${(((lam - LO) / (HI - LO)) * 100).toFixed(2)}%` } }, t('atom.col.' + w))));
  const band = h('div', { class: 'atom-spec__strip', tabindex: lines.length ? '0' : null, role: lines.length ? 'slider' : null,
    'aria-label': t('atom.light.tap'), 'aria-valuemin': lines.length ? String(Math.round(lines[0][0])) : null, 'aria-valuemax': lines.length ? String(Math.round(lines[lines.length - 1][0])) : null }, svg);
  const el = h('div', { class: 'atom-spec' }, band, axis);
  let cur = -1;
  function pick(i, focus = false) {
    if (!marks.length) return;
    cur = Math.max(0, Math.min(marks.length - 1, i));
    const m = marks[cur], w = 14;
    sel.setAttribute('x', String(x(m.lam) - w / 2)); sel.setAttribute('width', String(w));
    band.setAttribute('aria-valuenow', String(Math.round(m.lam)));
    band.setAttribute('aria-valuetext', t('atom.light.line', { nm: fmtNum(m.lam, 1, { minDigits: 1 }), colour: t('atom.col.' + colourWord(m.lam)) }));
    if (focus) band.focus({ preventScroll: true });
    if (onPick) onPick(m);
  }
  // a tap picks the nearest line (lines a few nanometres apart would otherwise steal each other's taps)
  band.addEventListener('click', ev => {
    if (!marks.length) return;
    const r = svg.getBoundingClientRect(), lx = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    marks.forEach((m, i) => { if (Math.abs(x(m.lam) - lx) < Math.abs(x(marks[best].lam) - lx)) best = i; });
    if (Math.abs(x(marks[best].lam) - lx) < 40) pick(best);
  });
  band.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { pick(cur + 1); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { pick(cur < 0 ? 0 : cur - 1); ev.preventDefault(); }
    else if (ev.key === 'Home') { pick(0); ev.preventDefault(); }
    else if (ev.key === 'End') { pick(marks.length - 1); ev.preventDefault(); }
    ev.stopPropagation(); // arrows pick a line here, not the next element
  });
  return { el, lines: marks, pick };
}
