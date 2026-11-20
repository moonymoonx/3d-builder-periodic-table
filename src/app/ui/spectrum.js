// Visible emission spectrum strip: the strongest NIST lines of the neutral atom (380–750 nm, air),
// colour from the CIE 1931 fit, tap a line for its wavelength and source; approximate glow colour.
import { h, replace } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { data, source } from '../data.js';
import { wavelengthToRGB, glowColour, toHex } from '../../physics/color.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); return el; };

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
        const col = toHex(wavelengthToRGB(lam, fit, M));
        const g = s('g', { class: 'specline', tabindex: '0', role: 'button', 'aria-label': `${fmtNum(lam, 3)} nm` });
        g.append(s('rect', { x: x(lam) - 1.5, y: H - hgt, width: 3, height: hgt, fill: col }));
        const show = () => {
          replace(note, h('b', null, `${fmtNum(lam, 3)} nm`), ` · ${t('spec.rel')} ${I}/1000`, h('br'),
            h('span', { class: 'small' }, `${t('src.source')}: ${source('nist-lines').name}`),
            lines.basis === 'gA' ? h('span', { class: 'small' }, h('br'), t('spec.basisGA')) : null);
        };
        g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); show(); } });
        shows.push([lam, show, g]);
        svg.append(g);
      }
      // a tap selects the line nearest to it (close lines would otherwise steal each other's taps)
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
