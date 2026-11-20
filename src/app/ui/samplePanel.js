// Sample view UI: the temperature dock (hero control) + a quieter detail panel + honest cards.
import { h, replace, toast } from '../dom.js';
import { t, fmtNum, fmtSci } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, name, data, fmtTemp, K0 } from '../data.js';
import { eventsOf, SLOWDOWN, sampleStateAt } from '../views/sample.js';
import { rmsSpeed } from '../../physics/lattice.js';
import { valueButton } from './source.js';
import { structText } from '../data.js';

const T_MIN = 1, T_MAX = 6000;
const toS = T => Math.log(T / T_MIN) / Math.log(T_MAX / T_MIN);
const fromS = s => T_MIN * Math.pow(T_MAX / T_MIN, s);

export function buildSampleUI(ui, left) {
  // ---- dock --------------------------------------------------------------------------------------
  const readK = h('b', { class: 'dock-temp' }), readC = h('span', { class: 'dock-c' }), badge = h('span', { class: 'dock-state' });
  const phaseLbl = h('span', { class: 'dock-phase' });
  const slider = h('input', { type: 'range', min: 0, max: 1000, step: 1, class: 'thermo', 'aria-label': t('ctl.temp') });
  const marks = h('div', { class: 'marks', 'aria-hidden': 'true' });
  const roomBtn = h('button', { class: 'btn' });
  const playBtn = h('button', { class: 'btn primary' });
  const hint = h('p', { class: 'dock-hint' });
  const chips = h('div', { class: 'ev-chips' });
  const dock = h('section', { class: 'panel dock', 'aria-label': t('ctl.temp') },
    h('div', { class: 'dock-top' }, h('div', null, readK, readC), h('div', { class: 'dock-mid' }, badge, phaseLbl), h('div', { class: 'dock-btns' }, roomBtn, playBtn)),
    h('div', { class: 'thermo-wrap' }, marks, slider), chips, hint);
  dock.hidden = true;
  ui.append(dock);
  const card = h('section', { class: 'panel sample-card', hidden: true });
  ui.append(card);
  const panel = h('section', { class: 'panel' });
  let touched = false, playing = 0;

  slider.addEventListener('input', () => {
    touched = true; stopPlay();
    const T = fromS(+slider.value / 1000);
    set({ T: Math.abs(T - 293.15) < 3 ? 293.15 : Math.round(T * 100) / 100 });
  });
  roomBtn.addEventListener('click', () => { stopPlay(); set({ T: 293.15 }); });
  playBtn.addEventListener('click', () => { if (playing) stopPlay(); else startPlay(); });
  function startPlay() {
    touched = true;
    const e = byZ(state.Z);
    const ev = eventsOf(e);
    const top = Math.min(T_MAX, Math.max(...ev.map(x => x.T), 400) * 1.25);
    let s = toS(state.T >= top * 0.98 ? 20 : state.T);
    const s1 = toS(top);
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      s = Math.min(s1, s + dt * 0.055);
      set({ T: Math.round(fromS(s) * 100) / 100 });
      if (s < s1 && playing) playing = requestAnimationFrame(tick); else stopPlay();
    };
    playing = requestAnimationFrame(tick);
    renderDock();
  }
  function stopPlay() { if (playing) cancelAnimationFrame(playing); playing = 0; renderDock(); }

  let lastInfo = null;
  function renderDock() {
    const e = byZ(state.Z);
    slider.value = String(Math.round(toS(state.T) * 1000));
    readK.textContent = `${fmtNum(state.T, state.T < 30 ? 2 : 0)} K`;
    readC.textContent = ` ${fmtNum(state.T - K0, state.T < 30 ? 2 : 0)} °C`;
    const cur = lastInfo || sampleStateAt(e, state.T, state.allotrope);
    const kind = cur.kind === 'card' ? (cur.card === 'predicted' ? 'unknown' : cur.card === 'phase' ? 'solid' : 'solid') : cur.kind;
    badge.textContent = cur.card === 'predicted' ? t('state.unknown') : t('state.' + kind);
    badge.className = `dock-state s-${cur.card === 'predicted' ? 'unknown' : kind}${cur.predicted ? ' pred' : ''}`;
    phaseLbl.textContent = cur.phase ? `${cur.phase.label || ''}${cur.phase.label ? ' · ' : ''}${structText(cur.phase.name || cur.phase.card || '')}` : '';
    roomBtn.textContent = t('smp.room');
    playBtn.textContent = playing ? t('smp.stop') : t('smp.play');
    hint.textContent = touched ? '' : t('smp.hint');
    hint.hidden = touched;
    // ticks on the track + one tappable chip per event (jumps just past it)
    const evs = eventsOf(e).filter(ev => ev.T > T_MIN && ev.T < T_MAX);
    replace(marks, ...evs.map(ev => h('span', { class: `mark m-${ev.key}${ev.p ? ' pred' : ''}`, style: { left: `${(toS(ev.T) * 100).toFixed(2)}%` } }, h('i'))));
    replace(chips, ...evs.map(ev => {
      const past = state.T >= ev.T;
      const label = `${ev.key === 'trans' ? t('smp.ev.trans', { name: ev.label }) : t('smp.ev.' + ev.key)} ${fmtTemp(ev.T, { both: false })}`;
      return h('button', { class: `chip ev m-${ev.key}${ev.p ? ' pred' : ''}`, 'aria-pressed': String(past),
        title: fmtTemp(ev.T), onclick: () => { touched = true; stopPlay(); set({ T: Math.round(Math.min(T_MAX, ev.T * 1.02 + 1) * 100) / 100 }); } }, label);
    }));
  }

  function renderCard() {
    const e = byZ(state.Z);
    const cur = lastInfo;
    if (!cur || cur.kind !== 'card') { card.hidden = true; return; }
    const nm = name(e);
    let title, body;
    if (cur.card === 'predicted') { title = t('smp.card.predicted.t', { name: nm }); body = t('smp.card.predicted.b'); }
    else if (cur.card === 'molecular') { title = t('smp.card.molecular.t', { name: nm }); body = t('smp.card.molecular.b'); }
    else if (cur.card === 'complex') { title = t('smp.card.complex.t', { name: nm }); body = t('smp.card.complex.b', { n: e.lat.atoms || '>16' }); }
    else if (cur.card === 'phase') { title = cur.phase.label; body = `${structText(cur.phase.card)}. ${t('smp.card.phase.b')}`; }
    else { title = t('smp.card.unknown.t'); body = t('smp.card.unknown.b'); }
    replace(card, h('h3', null, title), h('p', null, body));
    card.hidden = false;
  }

  function renderPanel(stats) {
    const e = byZ(state.Z);
    const cur = lastInfo;
    const secs = [h('div', { class: 'sec' }, h('h3', null, t('smp.title', { name: name(e) })), h('p', { class: 'why' }, t('smp.what.' + (cur ? (cur.kind === 'card' ? 'card' : cur.kind) : 'solid'))))];
    if (cur && cur.kind === 'solid') {
      const p = cur.phase;
      const rows = [];
      const cellV = [p.cell.a, p.cellSrc, { n: [p.cond ? `measured at ${p.cond}` : null, p.cellNote].filter(Boolean).join(' · ') }];
      const latText = p.cell.gamma === 120 ? `a = ${fmtNum(p.cell.a, 2)} pm, c = ${fmtNum(p.cell.c, 2)} pm` : Math.abs(p.cell.a - p.cell.b) < 1e-6 && Math.abs(p.cell.a - p.cell.c) < 1e-6 ? `a = ${fmtNum(p.cell.a, 2)} pm` : `a = ${fmtNum(p.cell.a, 1)}, b = ${fmtNum(p.cell.b, 1)}, c = ${fmtNum(p.cell.c, 1)} pm`;
      rows.push([t('smp.structure'), valueButton(`${p.label ? p.label + ': ' : ''}${structText(p.name)}`, t('smp.structure'), [p.name, p.sitesSrc, { n: `atomic positions: ${p.sitesSrc === 'sym' ? 'fixed by symmetry' : 'from the COD entry'}` }], e)]);
      rows.push([t('smp.cell'), valueButton(latText + (p.cond ? ` (${p.cond})` : ''), t('smp.cell'), cellV, e)]);
      rows.push([t('smp.perCell'), String(p.sites.length)]);
      rows.push([t('smp.neighbours'), t('smp.neighboursV', { cn: p.cn, d: fmtNum(p.dNN, 0) })]);
      const Tm = e.ph.mp?.[0] ?? e.ph.sub?.[0];
      if (Tm) {
        const pct = 100 * data().model.lindemann[0] * Math.sqrt(Math.min(state.T, Tm) / Tm);
        rows.push([t('smp.wobble'), valueButton(t('smp.wobbleV', { p: fmtNum(pct, 1) }), t('smp.wobble'), data().model.lindemann, e)]);
      }
      secs.push(h('div', { class: 'sec' }, h('dl', { class: 'facts' }, rows.flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)]))));
      const alts = e.lat.phases.filter(x => x.alt || (x.id === e.lat.def && e.lat.phases.some(y => y.alt)));
      if (alts.length > 1) secs.push(h('div', { class: 'sec' }, h('h3', null, t('smp.allotrope')), h('div', { class: 'seg' }, alts.map(x => h('button', {
        'aria-pressed': String((state.allotrope || e.lat.def) === x.id), onclick: () => set({ allotrope: x.id === e.lat.def ? null : x.id }),
      }, x.label || structText(x.name)))), e.lat.defNote ? h('p', { class: 'small' }, e.lat.defNote[0]) : null));
    }
    if (cur && cur.kind === 'gas') {
      const gasN = e.ph.gas ? e.ph.gas[0] : 1;
      const M = (e.f.aw?.[0] || e.f.massNumber?.[0] || 2 * e.Z) * gasN;
      const v = rmsSpeed(state.T, M, data().constants.R[0]);
      secs.push(h('div', { class: 'sec' }, h('dl', { class: 'facts' },
        h('dt', null, t('smp.speed')), h('dd', null, valueButton(`${fmtNum(v, 0)} m/s`, t('smp.speed'), [v, 'calc', { n: `√(3RT/M) with M = ${fmtNum(M, 3)} g/mol${gasN > 1 ? ` (${gasN}-atom molecules)` : ''} and R from CODATA` }], e)),
        h('dt', null, t('smp.particles')), h('dd', null, gasN > 1 ? t('smp.molecules', { n: gasN }) : t('smp.atoms'))),
      h('p', { class: 'small' }, t('smp.slow', { x: fmtSci(SLOWDOWN, 1) })), h('p', { class: 'small' }, t('smp.gasScale'))));
    }
    if (cur && cur.kind === 'liquid') secs.push(h('div', { class: 'sec' }, h('p', { class: 'small' }, t('smp.liquidNote'))));
    const notes = [];
    if (e.ph.noSolid) notes.push(t('smp.note.he'));
    if (e.ph.sub) notes.push(t('smp.note.sub', { T: fmtTemp(e.ph.sub[0]) }));
    if (e.lat.hiNote) notes.push(t('smp.note.hiT'));
    if (e.lat.kind === 'lattice' && !(e.ph.trans || []).length && !e.lat.hiNote) notes.push(t('smp.note.oneForm'));
    notes.push(t('smp.note.expansion'));
    secs.push(h('div', { class: 'sec' }, notes.map(n => h('p', { class: 'small' }, n))));
    replace(panel, ...secs);
  }

  return {
    panel, dock, card,
    show(on) { dock.hidden = !on; if (!on) { card.hidden = true; stopPlay(); } },
    render(info, stats) { if (info) lastInfo = info; renderDock(); renderCard(); renderPanel(stats); },
    onEvent(kind, to, e) {
      // small reward for progress: say what just happened
      if (kind === 'phase') toast(t('smp.toast.phase', { name: to.label || structText(to.name || '') }));
      else if (to === 'liquid' && kind === 'solid') toast(t('smp.toast.melt', { name: name(e), T: fmtTemp(state.T) }));
      else if (to === 'gas' && kind === 'liquid') toast(t('smp.toast.boil', { name: name(e) }));
      else if (to === 'gas' && kind === 'solid') toast(t('smp.toast.sub', { name: name(e) }));
      else if (to === 'solid' && kind === 'liquid') toast(t('smp.toast.freeze', { name: name(e) }));
      else if (to === 'liquid' && kind === 'gas') toast(t('smp.toast.condense', { name: name(e) }));
    },
  };
}
