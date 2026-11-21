// Visible light of an atom: a handful of NIST lines of the neutral atom (380–750 nm, air wavelengths),
// each in the colour of its wavelength (CIE 1931 fit), and the colour they mix to.
// The data (tools/build-data.mjs) keeps the 8 lines that look brightest and gives each its strength
// (radiant power relative to the strongest kept line): from NIST's transition probabilities for a gas at
// 1 eV where NIST grades them, else NIST's relative intensities. How bright a line *looks* is that
// strength × the eye's sensitivity V(λ) (CIE 1931 ȳ). The glow is the CIE chromaticity of all its lines.
//   spectrumStrip(e, { onPick })  the atom place's "Its light" (STYLE.md: a dark room for light): a
//                                 spectroscope band across the stage, one glowing slit per line, as bright as
//                                 it looks; colour words under it; tap or arrow keys pick a line
import { h } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { data } from '../data.js';
import { toHex, cmfAt, mul3, gammaEncode } from '../../physics/color.js';
// the hue is held at these ends, as physics/color.js does (HUE_VIOLET, HUE_RED; not imported: the bundler
// exports only the first name of `export const HUE_VIOLET = 400, HUE_RED = 680`, PROPOSALS-atom.md r2)
const HUE_VIOLET = 400, HUE_RED = 680;

const SVGNS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); return el; };
const LO = 380, HI = 750;

/** Colour word for a wavelength (bands as in Wikipedia "Visible spectrum": violet to 450 nm, blue to 485,
 *  cyan to 500, green to 565, yellow to 590, orange to 625, red beyond). */
export function colourWord(nm) {
  return nm < 450 ? 'violet' : nm < 485 ? 'blue' : nm < 500 ? 'teal' : nm < 565 ? 'green' : nm < 590 ? 'yellow' : nm < 625 ? 'orange' : 'red';
}
/** The element's visible lines [[nm, strength]], one per wavelength. */
export function uniqueLines(e) {
  if (e.lines.none) return [];
  const m = new Map();
  for (const [lam, I] of e.lines.v) { const k = lam.toFixed(3); if (!m.has(k) || m.get(k)[1] < I) m.set(k, [lam, I]); }
  return [...m.values()].sort((a, b) => a[0] - b[0]);
}
/** Display colour of a wavelength (sRGB 0..1), as in physics/color.js (the hue held at 400 and 680 nm, where
 *  the CIE fit's tails drift; dimmed toward the ends of the visible range), except that the channels outside
 *  sRGB are clipped instead of lifted with white: spectral light lies outside sRGB, and adding white turned
 *  the deep reds crimson (640 nm came out #ff0a46, pink beside neon's red-orange glow). PROPOSALS-atom.md r2. */
export function lineColour(nm) {
  const { cmfFit: { v: fit }, srgb: { v: M } } = data();
  const rgb = mul3(M, cmfAt(fit, Math.min(HUE_RED, Math.max(HUE_VIOLET, nm)))).map(c => Math.max(0, c));
  const mx = Math.max(...rgb);
  if (!(mx > 0)) return [0, 0, 0];
  const fade = Math.min(1, 0.25 + 3 * Math.max(0, cmfAt(fit, nm)[1]));
  return rgb.map(c => gammaEncode((c / mx) * fade));
}
/** The eye's sensitivity at a wavelength (CIE 1931 ȳ, the fit in the data; 1 near 555 nm). */
export const eyeAt = nm => Math.max(0, cmfAt(data().cmfFit.v, nm)[1]);
/** The lines with how bright each looks (strength × V(λ)), relative to the brightest-looking one (0..1). */
export function looks(e) {
  const ln = uniqueLines(e).map(([lam, I]) => ({ lam, I, B: I * eyeAt(lam) }));
  const mx = Math.max(...ln.map(x => x.B), 1e-30);
  for (const x of ln) x.b = x.B / mx;
  return ln;
}
/** The colour the element's lines mix to, as the eye sees them (the data's CIE 1931 x, y), for display:
 *  sRGB 0..1 at full strength (white is added to bring it inside the sRGB gamut). Null without lines. */
export function glowRGB(e) {
  const xy = e.lines && e.lines.glow;
  if (!xy) return null;
  const [x, y] = xy;
  let rgb = mul3(data().srgb.v, [x / y, 1, (1 - x - y) / y]);
  const mn = Math.min(...rgb);
  if (mn < 0) rgb = rgb.map(c => c - mn);
  const mx = Math.max(...rgb);
  return mx > 0 ? rgb.map(c => gammaEncode(c / mx)) : null;
}

export function spectrumStrip(e, { onPick } = {}) {
  const lines = looks(e);
  const W = 600, H = 84, x = lam => ((lam - LO) / (HI - LO)) * W;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'atom-spec__svg', 'aria-hidden': 'true' });
  const defs = s('defs');
  const id = `atomspec${e.Z}`;
  const grad = s('linearGradient', { id, x1: '0', x2: '1', y1: '0', y2: '0' });
  for (let lam = LO; lam <= HI; lam += 10) grad.append(s('stop', { offset: String((lam - LO) / (HI - LO)), 'stop-color': toHex(lineColour(lam)) }));
  // each slit's glow: its colour fading out to both sides; its core a little whiter, like light through a slit
  const slit = s('linearGradient', { id: `${id}g`, x1: '0', x2: '1', y1: '0', y2: '0' });
  [[0, 0], [0.32, 0.22], [0.5, 0.6], [0.68, 0.22], [1, 0]].forEach(([o, a]) => slit.append(s('stop', { offset: String(o), 'stop-color': '#fff', 'stop-opacity': String(a) })));
  const mask = s('mask', { id: `${id}m`, maskContentUnits: 'objectBoundingBox' });
  mask.append(s('rect', { x: 0, y: 0, width: 1, height: 1, fill: `url(#${id}g)` }));
  defs.append(grad, slit, mask); svg.append(defs);
  svg.append(s('rect', { x: 0, y: 0, width: W, height: H, rx: 8, class: 'atom-spec__band' }));
  svg.append(s('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: `url(#${id})`, opacity: '0.1' }));
  const marks = [];
  for (const ln of lines) {
    const rgb = lineColour(ln.lam), m = Math.max(...rgb, 1e-3), hue = rgb.map(c => c / m);
    const col = toHex(hue), core = toHex(hue.map(c => c + (1 - c) * 0.45));
    const k = Math.sqrt(Math.max(ln.b, 0.002)); // brightness as it looks (square root: faint lines stay visible)
    const g = s('g', { opacity: (0.3 + 0.7 * k).toFixed(3) });
    g.append(s('rect', { x: x(ln.lam) - 9, y: 4, width: 18, height: H - 8, fill: col, mask: `url(#${id}m)`, rx: 6 })); // the glow around the line
    g.append(s('rect', { x: x(ln.lam) - 1.25, y: 6, width: 2.5, height: H - 12, fill: core, rx: 1.25 })); // its bright core
    svg.append(g);
    marks.push({ ...ln, col, rgb, hue, g });
  }
  const sel = s('rect', { x: -10, y: 2, width: 10, height: H - 4, rx: 5, class: 'atom-spec__sel', fill: 'none' });
  svg.append(sel);
  // colour words under the band, placed at the middle of their wavelength band
  const words = [['violet', 415], ['blue', 467], ['green', 532], ['yellow', 577], ['red', 690]];
  const axis = h('div', { class: 'atom-spec__axis', 'aria-hidden': 'true' }, words.map(([w, lam]) => h('span', { style: { left: `${(((lam - LO) / (HI - LO)) * 100).toFixed(2)}%` } }, t('atom.col.' + w))));
  const band = h('div', { class: 'atom-spec__strip', tabindex: lines.length ? '0' : null, role: lines.length ? 'slider' : null,
    'aria-label': t('atom.light.tap'), 'aria-valuemin': lines.length ? String(Math.round(lines[0].lam)) : null, 'aria-valuemax': lines.length ? String(Math.round(lines[lines.length - 1].lam)) : null }, svg);
  const el = h('div', { class: 'atom-spec' }, band, axis);
  let cur = -1;
  function pick(i, focus = false, user = false) {
    if (!marks.length) return;
    cur = Math.max(0, Math.min(marks.length - 1, i));
    const m = marks[cur], w = 16;
    // the selection stays inside the band's rounded ends
    sel.setAttribute('x', String(Math.max(3, Math.min(W - 3 - w, x(m.lam) - w / 2)))); sel.setAttribute('width', String(w));
    marks.forEach((o, j) => o.g.classList.toggle('is-picked', j === cur));
    band.setAttribute('aria-valuenow', String(Math.round(m.lam)));
    band.setAttribute('aria-valuetext', t('atom.light.line', { nm: fmtNum(m.lam, 1, { minDigits: 1 }), colour: t('atom.col.' + colourWord(m.lam)) }));
    if (focus) band.focus({ preventScroll: true });
    if (onPick) onPick(m, user);
  }
  // a tap picks the nearest line (lines a few nanometres apart would otherwise steal each other's taps)
  band.addEventListener('click', ev => {
    if (!marks.length) return;
    const r = svg.getBoundingClientRect(), lx = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    marks.forEach((m, i) => { if (Math.abs(x(m.lam) - lx) < Math.abs(x(marks[best].lam) - lx)) best = i; });
    if (Math.abs(x(marks[best].lam) - lx) < 40) pick(best, false, true);
  });
  band.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { pick(cur + 1, false, true); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { pick(cur < 0 ? 0 : cur - 1, false, true); ev.preventDefault(); }
    else if (ev.key === 'Home') { pick(0, false, true); ev.preventDefault(); }
    else if (ev.key === 'End') { pick(marks.length - 1, false, true); ev.preventDefault(); }
    ev.stopPropagation(); // arrows pick a line here, not the next element
  });
  return { el, lines: marks, pick };
}
