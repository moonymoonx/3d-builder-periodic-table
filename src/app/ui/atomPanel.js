// Left panel for the Atom view.
import { h, replace } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, name, source } from '../data.js';
import { subshellsOf, parseOrbital, orbitalName, L_COLORS } from '../views/atom.js';
import { configDiff } from '../../physics/config.js';
import * as O from '../../physics/orbitals.js';

const SUP = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');

/** Hund's rule: fill each orbital with one electron (↑) before pairing (↓). */
export function hundBoxes(l, occ) {
  const k = 2 * l + 1;
  return Array.from({ length: k }, (_, i) => (occ > i ? '↑' : '') + (occ > k + i ? '↓' : ''));
}

export function buildAtomPanel(container) {
  const panel = h('section', { class: 'panel' });
  container.append(panel);
  let lastStep = null; // message after +/- proton

  function stepTo(Z) {
    const from = byZ(state.Z), to = byZ(Z);
    const d = configDiff(from.cfg.map(([n, l, occ]) => ({ n, l, occ })), to.cfg.map(([n, l, occ]) => ({ n, l, occ })));
    const fmt = x => `${x.n}${'spdf'[x.l]}${SUP(x.from)}→${SUP(x.to)}`;
    if (Z === from.Z + 1 && d.length === 1 && d[0].to === d[0].from + 1) lastStep = t('atom.newE', { sub: `${d[0].n}${'spdf'[d[0].l]}` });
    else if (Z === from.Z - 1 && d.length === 1 && d[0].to === d[0].from - 1) lastStep = t('atom.lostE', { sub: `${d[0].n}${'spdf'[d[0].l]}` });
    else lastStep = t('atom.rearr', { d: d.map(fmt).join(', ') });
    set({ Z, orbital: null });
  }

  function render(info) {
    const e = byZ(state.Z);
    const subs = subshellsOf(e);
    const A = e.f.nucA ? e.f.nucA[0] : null;
    const outerN = Math.max(...subs.map(s => s.n));
    const outer = subs.filter(s => s.n === outerN).reduce((a, s) => a + s.occ, 0);
    const stat = (label, v) => h('div', { class: 'stat' }, h('span', null, label), h('b', null, String(v)));
    const stats = h('div', { class: 'stats' }, stat(t('atom.protons'), e.Z), stat(t('atom.neutrons'), A ? A - e.Z : '—'), stat(t('atom.electrons'), e.Z), stat(t('atom.outer'), outer));
    const seg = h('div', { class: 'seg' }, ['orbital', 'total'].map(m => h('button', { 'aria-pressed': String(state.density === m), onclick: () => set({ density: m }) }, t('atom.mode.' + m))));
    const sel = parseOrbital(e, state.orbital);
    const chips = h('div', { class: 'row' }, subs.map(s => h('button', {
      class: 'chip', 'aria-pressed': String(state.density === 'orbital' && sel.sub.key === s.key),
      style: { borderColor: L_COLORS[s.l] }, onclick: () => set({ density: 'orbital', orbital: s.l === 0 ? s.key : `${s.key}:all` }),
    }, `${s.key}${SUP(s.occ)}`)));
    const stepper = h('div', { class: 'sec' }, h('h3', null, t('atom.stepper')),
      h('div', { class: 'row' },
        h('button', { class: 'btn', disabled: e.Z <= 1, onclick: () => stepTo(e.Z - 1) }, t('atom.remP')),
        h('b', null, `Z = ${e.Z}`),
        h('button', { class: 'btn primary', disabled: e.Z >= 118, onclick: () => stepTo(e.Z + 1) }, t('atom.addP'))),
      lastStep ? h('p', { class: 'why' }, lastStep) : null);
    const parts = [h('div', { class: 'sec' }, h('h3', null, t('atom.title', { name: name(e) })), stats, h('div', { style: { marginTop: '10px' } }, seg)),
      stepper, h('div', { class: 'sec' }, h('h3', null, t('atom.config')), chips)];
    if (state.density === 'orbital') {
      const s = sel.sub;
      const ms = O.mValues(s.l);
      const orbChips = s.l === 0 ? null : h('div', { class: 'row' },
        h('button', { class: 'chip', 'aria-pressed': String(sel.m == null), onclick: () => set({ orbital: `${s.key}:all` }) }, t('atom.all')),
        ms.map(m => h('button', { class: 'chip', 'aria-pressed': String(sel.m === m), onclick: () => set({ orbital: `${s.key}:${m}` }) }, O.ORBITAL_SUFFIX[s.l][m])));
      const boxes = h('div', { class: 'boxes', 'aria-label': t('atom.boxes', { sub: s.key }) }, hundBoxes(s.l, s.occ).map(b => h('span', { class: 'box' }, b || ' ')));
      const radial = s.n - s.l - 1, angular = s.l;
      const zSrc = s.zSrc ? source(s.zSrc[1]) : null;
      parts.push(h('div', { class: 'sec' },
        h('h3', null, t('atom.orbitals', { sub: s.key })), orbChips,
        h('p', { class: 'small', style: { margin: '8px 0 4px' } }, t('atom.boxes', { sub: s.key })), boxes,
        h('p', { class: 'why' }, t('atom.nodes', { name: orbitalName(s, sel.m), r: radial, a: angular })),
        s.l > 0 && sel.m == null ? null : h('label', { class: 'check', style: { marginTop: '8px' } },
          h('input', { type: 'checkbox', checked: state.surf && state.tier !== 'low', disabled: state.tier === 'low', onchange: ev => set({ surf: ev.target.checked }) }),
          t('atom.surface'), state.tier === 'low' ? h('span', { class: 'small' }, ` (${t('atom.surfaceLow')})`) : null),
        h('p', { class: 'small' }, t('atom.approx', { z: fmtNum(s.Zeff, 2), src: zSrc ? (s.zSrc[1] === 'calc' ? "Slater's rules" : 'Clementi–Raimondi') : '—' }))));
    } else {
      parts.push(h('div', { class: 'sec' }, h('p', { class: 'why' }, t('atom.totalWhat')),
        h('div', { class: 'legend' }, [0, 1, 2, 3].filter(l => subs.some(s => s.l === l)).map(l => h('div', { class: 'lg', style: { cursor: 'default' } }, h('span', { class: 'sw', style: { background: L_COLORS[l] } }), t('atom.l' + l))))));
    }
    if (info && info.factor) parts.push(h('div', { class: 'sec' }, h('p', { class: 'small' }, t('atom.scale', { x: fmtNum(info.factor, 0, { sig: 2 }), r: fmtNum(e.f.rNuc[0], 2) }))));
    replace(panel, ...parts);
  }
  return { panel, render, clearStep: () => { lastStep = null; } };
}
