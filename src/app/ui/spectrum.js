// Visible light of an atom: the strongest NIST lines of the neutral atom (380–750 nm, air wavelengths),
// each in the colour of its wavelength (CIE 1931 fit).
//   spectrumStrip(e, { onPick })  the atom place's "Its light" (STYLE.md: a dark room for light): a
//                                 spectroscope band across the stage, one bright line per wavelength
//                                 (brighter = stronger), colour words under it; tap or arrow keys pick a line
//   buildSpectrum(container)      the legacy strip of the old dark stage (unused once the atom place is
//                                 wired; kept so the router builds until then)
import { h, replace } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { data, source } from '../data.js';
import { wavelengthToRGB, glowColour, toHex } from '../../physics/color.js';

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
/** Display colour of a wavelength (sRGB 0..1): the CIE fit's colour, its hue held at 680 nm beyond and at
 *  400 nm below (the analytic fit's tails drift toward olive and teal there), dimmed toward the ends. */
export function lineColour(nm) {
  const D = data();
  let rgb = wavelengthToRGB(Math.max(400, Math.min(680, nm)), D.cmfFit.v, D.srgb.v);
  if (nm > 680) rgb = rgb.map(c => c * Math.max(0.55, 1 - (nm - 680) / 160));
  if (nm < 400) rgb = rgb.map(c => c * Math.max(0.6, 1 - (400 - nm) / 50));
  return rgb;
}
/** Approximate glow colour of the lines together (legacy; the atom place does not show it, see NOTES-atom.md). */
export function glowOf(e) {
  if (e.lines.none) return null;
  const D = data(), g = glowColour(e.lines.v, D.cmfFit.v, D.srgb.v);
  return g.ok ? { rgb: g.rgb, hex: toHex(g.rgb) } : null;
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

// ---- legacy strip (old dark stage) ---------------------------------------------------------------------
export function buildSpectrum(container) {
  const box = h('section', { class: 'panel spectrum', 'aria-label': t('spec.title') });
  container.append(box);
  let note = null;
  function render(e) {
    const D = data();
    const fit = D.cmfFit.v, M = D.srgb.v;
    const W = 640, H = 70, x = lam => ((lam - 380) / (750 - 380)) * W;
    const svg = s('svg', { viewBox: `0 -4 ${W} ${H + 24}`, width: '100%', role: 'img', 'aria-label': t('spec.title') });
    const defs = s('defs');
    const grad = s('linearGradient', { id: 'specbg', x1: '0', x2: '1', y1: '0', y2: '0' });
    for (let lam = 380; lam <= 750; lam += 10) grad.append(s('stop', { offset: String((lam - 380) / 370), 'stop-color': toHex(wavelengthToRGB(lam, fit, M)) }));
    defs.append(grad); svg.append(defs);
    svg.append(s('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#specbg)', opacity: '0.22', rx: 6 }));
    for (const lam of [400, 500, 600, 700]) {
      svg.append(s('line', { x1: x(lam), x2: x(lam), y1: H, y2: H + 5, stroke: '#a9b6d3', 'stroke-width': 1 }));
      const tx = s('text', { x: x(lam), y: H + 18, 'text-anchor': 'middle', fill: '#a9b6d3', 'font-size': 13 }); tx.textContent = `${lam} nm`; svg.append(tx);
    }
    const lines = e.lines;
    let glow = null;
    const shows = [];
    if (!lines.none) {
      for (const [lam, I] of lines.v) {
        const hgt = 10 + (H - 12) * Math.sqrt(Math.max(I, 1) / 1000);
        const g = s('g', { class: 'specline', tabindex: '0', role: 'button', 'aria-label': `${fmtNum(lam, 3)} nm` });
        g.append(s('rect', { x: x(lam) - 1.5, y: H - hgt, width: 3, height: hgt, fill: toHex(wavelengthToRGB(lam, fit, M)) }));
        const show = () => {
          replace(note, h('b', null, `${fmtNum(lam, 3)} nm`), ` · ${t('spec.rel')} ${I}/1000`, h('br'),
            h('span', { class: 'small' }, `${t('src.source')}: ${source('nist-lines').name}`),
            lines.basis === 'gA' ? h('span', { class: 'small' }, h('br'), t('spec.basisGA')) : null);
        };
        g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); show(); } });
        shows.push([lam, show, g]);
        svg.append(g);
      }
      svg.addEventListener('click', ev => {
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const lx = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
        let best = null;
        for (const it of shows) if (!best || Math.abs(x(it[0]) - lx) < Math.abs(x(best[0]) - lx)) best = it;
        if (best && Math.abs(x(best[0]) - lx) < 24) { best[1](); best[2].focus({ preventScroll: true }); }
      });
      svg.style.cursor = 'pointer';
      const gc = glowColour(lines.v, fit, M);
      if (gc.ok) glow = toHex(gc.rgb);
    }
    note = h('p', { class: 'small', style: { margin: '4px 2px 0', minHeight: '20px' } }, lines.none ? t('spec.none') : t('spec.tap'));
    replace(box,
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('b', { style: { fontSize: '14px' } }, t('spec.title')),
        glow ? h('span', { class: 'row small' }, t('spec.glow'), h('span', { class: 'sw', style: { width: '28px', height: '16px', background: glow, boxShadow: `0 0 12px ${glow}` }, title: t('spec.glowWhat') })) : null),
      svg, note);
  }
  return { box, render };
}
