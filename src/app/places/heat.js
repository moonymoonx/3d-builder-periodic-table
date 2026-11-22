// Heat place: "Hold a piece · heat it", the wow moment (STYLE.md §9, SPEC §0). The chrome around the
// forge view (views/sample.js, look 'forge'): one big thermometer to drag, its readout, one quiet caption
// that names each moment, "Heat it ▶" to play the whole sweep, "◀ Cool it" to play it back down,
// "Room temperature" (once away from it) to start again, and "About this sample ›" one tap deeper:
// the same chrome as the sample place (places/sample.js) until the kit's thermometer unifies them.
// The room dims to the kiln colour while the metal glows (sample view -> hooks.onKiln). Every
// temperature on screen comes from our data (transitions, melting and boiling points, landmark metals).
import { h, replace, isPhone } from '../dom.js';
import { t, fmtNum, getLang } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, bySym, name, propValue, data, stateAt, isPred, fmtTemp, structText } from '../data.js';
import { sheet } from '../ui/kit.js';
import { showSource, closeSource } from '../ui/source.js';
import { animate } from '../engine.js';
import { sampleStateAt, eventsOf } from '../views/sample.js';
import { rmsSpeed } from '../../physics/lattice.js';

const ROOM = 293.15;
const C = K => `${fmtNum(K - 273.15, 0)} °C`.replace(/^-/, '−');
const LANDMARKS = ['Ga', 'Pb', 'Al', 'Cu', 'Fe', 'W']; // familiar metals' melting points as flags

/** Can this element be heated in the forge? A measured crystal that is solid at room temperature. */
export function forgeable(e) {
  return e.lat.kind === 'lattice' && sampleStateAt(e, ROOM, null).kind === 'solid';
}
/** The thermometer's top: a little past the last event (boiling or sublimation), at least 1,000 °C. */
function topK(e) {
  const last = Math.max(...eventsOf(e).map(x => x.T), 1300);
  return 273.15 + Math.ceil(((last * 1.1) - 273.15) / 100) * 100;
}

export function buildHeat(ui, hooks) {
  const caption = h('p', { class: 'heat-caption', role: 'status', 'aria-live': 'polite' });
  const read = h('div', { class: 'heat-read' });
  const word = h('div', { class: 'heat-word' });
  const input = h('input', { type: 'range', class: 'heat-range', min: '0', max: '1000', step: '1' });
  const fill = h('div', { class: 'heat-fill' });
  const ticks = h('div', { class: 'heat-ticks', 'aria-hidden': 'true' });
  const flags = h('div', { class: 'heat-flags', 'aria-hidden': 'true' });
  const knob = h('div', { class: 'heat-knob', 'aria-hidden': 'true' });
  const track = h('div', { class: 'heat-track' }, ticks, h('div', { class: 'heat-rail' }, fill), knob, input, flags);
  const play = h('button', { type: 'button', class: 'ui-btn ui-btn--primary heat-play', onclick: () => toggle(1) });
  const cool = h('button', { type: 'button', class: 'ui-btn ui-btn--secondary heat-cool', onclick: () => toggle(-1) });
  const room = h('button', { type: 'button', class: 'ui-btn ui-btn--quiet heat-room', onclick: () => { stop(); setT(ROOM); } });
  const aboutBtn = h('button', { type: 'button', class: 'heat-about', 'aria-haspopup': 'dialog', onclick: () => toggleAbout() });
  const actions = h('div', { class: 'heat-actions' });
  const panel = h('section', { class: 'heat-panel', hidden: true },
    caption,
    h('div', { class: 'heat-row' }, h('div', { class: 'heat-readbox' }, h('div', { class: 'heat-readline' }, read, word), aboutBtn), track),
    actions);
  // "About this sample": the kit's sheet (a card on the right on desktop, a bottom sheet on phones)
  const about = sheet({ label: t('forge.about'), onClose: () => closeAbout(), closeLabel: t('card.close') });
  about.el.classList.add('heat-sheet');
  ui.append(panel, about.el);

  let lo = ROOM, hi = 3000, events = [], playing = null, dir = 0, el = null, lastCaption = '';
  const toV = T => Math.round(((T - lo) / (hi - lo)) * 1000);
  const fromV = v => lo + (v / 1000) * (hi - lo);
  const pct = T => `${Math.max(0, Math.min(100, ((T - lo) / (hi - lo)) * 100)).toFixed(2)}%`;
  function setT(T) { set({ T: Math.round(Math.max(lo, Math.min(hi, T)) * 100) / 100 }); }
  // [[…]] marks words coloured like the part of the sample they name (STYLE §2), as in the sample place
  function say(text) { if (text && text !== lastCaption) { lastCaption = text; replace(caption, text.split(/\[\[(.+?)\]\]/).map((part, i) => (i % 2 ? h('span', { class: 'sample-cell-word' }, part) : part))); caption.classList.remove('is-new'); void caption.offsetWidth; caption.classList.add('is-new'); } }

  function startCaption() {
    const ss = sampleStateAt(el, ROOM, null);
    const cn = ss.phase && ss.phase.cn;
    return cn ? t('forge.start', { name: name(el), cn }) : t('forge.startPlain', { name: name(el) });
  }
  /** Build the scale for this element: events above the track, familiar metals' melting points below. */
  function layout() {
    el = byZ(state.Z);
    lo = ROOM; hi = topK(el);
    events = eventsOf(el).filter(x => x.T > lo && x.T < hi);
    // every event is labelled, never an unexplained mark: one line each ("912 °C re-stacks"). Each label
    // extends away from its nearest neighbouring tick; rows are used bottom-up, and no label may cover
    // another tick's leader line (a stem rises from the rail to its own row). Shortened to the number
    // only if no row fits.
    const W = Math.max(240, track.clientWidth || (isPhone() ? 320 : 620));
    const pos = x => ((x.T - lo) / (hi - lo)) * W;
    const rank = { melt: 0, boil: 1, sub: 1, trans: 2 };
    const placed = []; // {x, r, a, b}
    const fitsAt = (x, r, a, b) => placed.every(p =>
      (p.r !== r || b + 8 < p.a || a - 8 > p.b) && // same row: no overlap
      (p.r >= r || x < p.a - 5 || x > p.b + 5) &&  // p sits below my row: my stem rises through it, so must miss p's text
      (p.r <= r || p.x < a - 5 || p.x > b + 5));   // p sits above my row: its stem rises through mine, so my text must miss it
    const spots = new Map();
    // phones: close re-stack ticks share one label below the rail ("912 · 1,394 °C re-stacks"), so the
    // row above keeps only melting and boiling (no stacked, hard-to-trace labels)
    const trans = events.filter(x => x.key === 'trans');
    const below = isPhone() && trans.length >= 2 && (trans[trans.length - 1].T - trans[0].T) / (hi - lo) < 0.35;
    if (below) for (const x of trans) spots.set(x, { r: 0, dx: 0, word: '', below: true });
    const sorted = [...events].filter(x => !spots.has(x)).sort((a, b) => rank[a.key] - rank[b.key] || a.T - b.T);
    for (const x of sorted) {
      const px = pos(x), others = events.filter(o => o !== x).map(pos);
      const left = Math.min(...others.filter(o => o < px).map(o => px - o), 1e9), right = Math.min(...others.filter(o => o > px).map(o => o - px), 1e9);
      const word = t(`forge.tick.${x.key}`), num = C(x.T);
      let done = null;
      for (const [text, w] of [[`${num} ${word}`, (num.length + word.length + 1) * 7.3 + 6], [num, num.length * 7.6 + 6]]) {
        // preferred: extend away from the nearer neighbour; then centred; then the other way
        const aligns = right < left ? ['right-edge', 'center', 'left-edge'] : ['left-edge', 'center', 'right-edge'];
        for (let r = 0; r < 3 && !done; r++) for (const al of aligns) {
          let a = al === 'center' ? px - w / 2 : al === 'left-edge' ? px - 6 : px - w + 6;
          a = Math.max(-4, Math.min(W - w + 4, a));
          if (fitsAt(px, r, a, a + w)) { done = { r, dx: a + w / 2 - px, word: text === num ? '' : word }; placed.push({ x: px, r, a, b: a + w }); break; }
        }
        if (done) break;
      }
      spots.set(x, done || { r: 2, dx: 0, word: '' });
    }
    replace(ticks, events.map(x => {
      const sp = spots.get(x);
      if (sp.below) return h('span', { class: `heat-tick is-${x.key} is-below`, style: { left: pct(x.T) } });
      const el2 = h('span', { class: `heat-tick is-${x.key}`, style: { left: pct(x.T) } }, h('span', null, h('b', null, C(x.T)), sp.word ? h('small', null, sp.word) : null));
      el2.style.setProperty('--row', String(sp.r)); el2.style.setProperty('--dx', `${sp.dx.toFixed(1)}px`);
      return el2;
    }));
    track.style.marginTop = `${17 * Math.max(0, ...[...spots.values()].map(v => v.r))}px`; // room for the upper rows
    const flagsAt = []; // landmark flags below the rail: their own row, never overlapping
    const fits = (T, chars) => {
      const x = ((T - lo) / (hi - lo)) * W, half = (chars * 7.4 + 14) / 2;
      if (x - half < -12 || x + half > W + 12 || flagsAt.some(p => Math.abs(p.x - x) < p.half + half)) return false;
      flagsAt.push({ x, half }); return true;
    };
    const marks = LANDMARKS.map(s => bySym(s)).filter(x => x.Z !== el.Z).map(x => ({ x, T: propValue(x, 'mp')[0] }))
      .map(m => ({ ...m, text: t('forge.landmark', { name: name(m.x).toLowerCase(), T: C(m.T) }) }))
      .filter(m => (m.T - lo) / (hi - lo) > 0.03 && m.T < hi * 0.98 && fits(m.T, m.text.length));
    if (below) { // the shared re-stack label takes the row below the rail (no landmark flags on phones then)
      const mid = (trans[0].T + trans[trans.length - 1].T) / 2;
      const nums = trans.map((x, i) => (i < trans.length - 1 ? fmtNum(x.T - 273.15, 0) : C(x.T))).join(' · ');
      replace(flags, h('span', { class: 'heat-flag heat-flag--events', style: { left: pct(mid) } }, h('b', null, nums), ' ', t('forge.tick.trans')));
    } else replace(flags, marks.map(m => h('span', { class: 'heat-flag', style: { left: pct(m.T) } }, m.text)));
    input.setAttribute('aria-label', t('forge.label'));
  }
  let lastRead = '', lastWord = '', lastClip = '';
  function update() {
    if (!el) return;
    const rd = C(state.T);
    if (rd !== lastRead) { lastRead = rd; replace(read, rd); read.classList.toggle('is-hot', state.T > ROOM + 0.5); } // ink at 20 °C, ember once heated
    const ss = sampleStateAt(el, state.T, null);
    // a gas gives its typical speed, as in the sample place (√(3RT/M), R from CODATA)
    const gasV = () => { const ms = rmsSpeed(state.T, el.f.aw?.[0] || 2 * el.Z, data().constants.R[0]); return `${fmtNum(Number((ms * 3.6).toPrecision(3)), 0)}\u00A0km/h`; };
    const wd = ss.kind === 'card' ? '' : ss.kind === 'solid' && ss.phase && ss.phase.cn ? t('forge.solidCn', { cn: ss.phase.cn }) : ss.kind === 'gas' ? t('forge.gas', { v: gasV() }) : t('state.' + ss.kind);
    if (wd !== lastWord) { lastWord = wd; replace(word, wd); }
    // the thermometer fills up to the temperature, coloured like heated metal along the way
    const clip = `inset(0 ${(100 - parseFloat(pct(state.T))).toFixed(1)}% 0 0 round 6px)`;
    if (clip !== lastClip) { lastClip = clip; fill.style.clipPath = clip; knob.style.left = pct(state.T); } // knob, fill and ticks share one scale
    const v = String(toV(state.T));
    if (input.value !== v && document.activeElement !== input) input.value = v;
    if (state.T <= lo + 0.5 && !playing) say(startCaption());
    else if (state.T > lo + 40 && lastCaption === startCaption()) say(t('forge.warming')); // never "at room temperature" at 396 °C
    if (about.isOpen()) renderAbout();
  }
  let lastBtn = '';
  /** As in the sample place: "Room temperature" only once away from it ("Back to 20 °C" on phones), "◀ Cool it"
   *  once there is somewhere to cool to; the main action is heating until the top of the scale, then cooling. */
  function renderButtons() {
    const atRoom = state.T <= lo + 0.5, top = state.T >= hi - 1, phone = isPhone();
    const gas = sampleStateAt(el, state.T, null).kind === 'gas'; // boiled: cooling is the way on (as mercury in the sample place)
    const key = `${dir}|${atRoom}|${top}|${gas}|${phone}|${getLang()}`;
    if (key === lastBtn) return;
    lastBtn = key;
    replace(play, dir > 0 ? t('forge.pause') : top ? t('forge.again') : t('forge.play'));
    replace(cool, dir < 0 ? t('forge.pause') : t('forge.cool'));
    replace(room, phone ? t('forge.roomShort', { T: C(ROOM) }) : t('forge.room'));
    room.setAttribute('aria-label', t('forge.room'));
    const coolMain = dir < 0 || ((top || gas) && dir === 0);
    play.classList.toggle('ui-btn--primary', !coolMain); play.classList.toggle('ui-btn--secondary', coolMain);
    cool.classList.toggle('ui-btn--primary', coolMain); cool.classList.toggle('ui-btn--secondary', !coolMain);
    const keep = [atRoom ? null : cool, atRoom ? null : room, play].filter(Boolean);
    // the focused button stays in the page (a keyboard user keeps their place)
    if (keep.length !== actions.childNodes.length || keep.some((b, i) => actions.childNodes[i] !== b)) replace(actions, keep);
    replace(aboutBtn, t('forge.about'));
    aboutBtn.setAttribute('aria-expanded', String(about.isOpen()));
  }

  // "Heat it ▶" / "◀ Cool it": sweep through the whole range, stopping just past each event so its caption is read
  function toggle(d) { const was = dir; stop(); if (was !== d) start(d); }
  function start(d) {
    if (d > 0 && state.T >= hi - 1) setT(lo);
    let T = state.T, hold = 0;
    const speed = (hi - lo) / 10;
    hooks.onInteract && hooks.onInteract();
    dir = d;
    playing = animate(dt => {
      if (hold > 0) { hold -= dt; return true; }
      const next = d > 0 ? events.find(x => x.T > T + 0.5) : [...events].reverse().find(x => x.T < T - 0.5);
      let T2 = T + d * speed * Math.min(dt, 0.25); // wall-clock pace, also on slow frames
      if (next && (d > 0 ? T2 >= next.T : T2 <= next.T)) { T2 = next.T + 2 * d; hold = 1.8; }
      T = Math.max(lo, Math.min(hi, T2)); setT(T);
      if (d > 0 ? T >= hi : T <= lo) { playing = null; dir = 0; renderButtons(); return false; }
      return true;
    });
    renderButtons();
  }
  function stop() { if (playing) { playing(); playing = null; dir = 0; renderButtons(); } }

  // ---- "About this sample": the science one tap deeper, every value with its source ---------------------
  let aboutSig = '';
  function toggleAbout() { if (about.isOpen()) closeAbout(); else openAbout(); }
  function openAbout() { aboutSig = ''; renderAbout(); about.open(); panel.classList.add('is-beside'); aboutBtn.setAttribute('aria-expanded', 'true'); hooks.onLayout && hooks.onLayout(); }
  function closeAbout() { closeSource(); about.close(); panel.classList.remove('is-beside'); aboutBtn.setAttribute('aria-expanded', 'false'); hooks.onLayout && hooks.onLayout(); }
  function renderAbout() {
    const e = el, T = state.T, ss = sampleStateAt(e, T, null), st = stateAt(e, T), ph = e.ph;
    const sig = `${e.Z}|${getLang()}|${ss.kind}|${ss.phase ? ss.phase.id : ''}|${C(T)}`;
    if (sig === aboutSig) return;
    aboutSig = sig;
    const rows = [];
    const row = (label, node, sub = null) => rows.push(h('dt', null, label), h('dd', null, node, sub ? h('small', { class: 'heat-sub' }, sub) : null));
    const val = (text, label, v) => (v && v[0] != null
      ? h('button', { type: 'button', class: 'heat-v' + (isPred(v) ? ' is-est' : ''), onclick: ev => showSource(ev.currentTarget, label, v, e, text) }, text)
      : h('span', { class: 'heat-v is-none' }, t('card.notKnownShort')));
    row(t('forge.d.now'), val(cap(t('state.' + st.s)), t('forge.d.now'), [st.s, 'calc', { n: t('forge.d.nowN'), p: st.p ? 1 : undefined }]));
    if (ph.mp && ph.mp[0] != null) row(t('forge.d.mp'), val(fmtTemp(ph.mp[0]), t('f.mp'), ph.mp));
    if (ph.bp && ph.bp[0] != null) row(t('forge.d.bp'), val(fmtTemp(ph.bp[0]), t('f.bp'), ph.bp));
    if (ss.kind === 'solid' && ss.phase) {
      const p = ss.phase, c = p.cell, cubic = Math.abs(c.a - c.b) < 1e-6 && Math.abs(c.a - c.c) < 1e-6;
      const side = cubic ? `${fmtNum(c.a, 2)} pm` : c.gamma === 120 ? `a = ${fmtNum(c.a, 2)} pm, c = ${fmtNum(c.c, 2)} pm` : `a = ${fmtNum(c.a, 1)}, b = ${fmtNum(c.b, 1)}, c = ${fmtNum(c.c, 1)} pm`;
      row(t('forge.d.pattern'), val(`${p.label ? p.label + ': ' : ''}${structText(p.name)}`, t('forge.d.pattern'), [p.name, p.sitesSrc, { n: t('forge.d.patternN') }]));
      row(t('forge.d.cell'), val(side, t('forge.d.cell'), [c.a, p.cellSrc, { n: [p.cond ? t('forge.d.measuredAt', { c: p.cond }) : null, p.cellNote].filter(Boolean).join(' · ') }]), t('forge.d.cellSub'));
      row(t('forge.d.neighbours'), val(t('forge.d.neighboursV', { cn: p.cn, d: fmtNum(p.dNN, 0) }), t('forge.d.neighbours'), [p.dNN, 'calc', { n: t('forge.d.neighboursN') }]));
      const Tm = ph.mp?.[0], L = data().model.lindemann;
      if (Tm && L) row(t('forge.d.wobble'), val(t('forge.d.wobbleV', { p: fmtNum(100 * L[0] * Math.sqrt(Math.min(T, Tm) / Tm), 1) }), t('forge.d.wobble'), L));
    }
    // the sample place's template: title with the element and temperature, one plain sentence, then the values
    const meta = `${name(e)} · ${C(T)}`;
    replace(about.body,
      h('div', { class: 'sample-d-head' }, h('h2', { class: 'sample-d-title' }, t('forge.about')), h('p', { class: 'sample-d-meta' }, meta)),
      h('p', { class: 'sample-d-hook' }, t(`sample.d.hook.${ss.kind}`)),
      h('p', { class: 'heat-hint' }, t('card.tapSource')),
      h('dl', { class: 'heat-facts' }, rows),
      h('p', { class: 'heat-note' }, t('forge.d.note')));
    about.setBar(h('span', { class: 'sample-d-bar' }, h('b', null, t('forge.about')), h('span', null, meta)));
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  window.addEventListener('resize', () => { if (!panel.hidden) { layout(); renderButtons(); } });
  input.addEventListener('pointerdown', stop);
  input.addEventListener('input', () => { stop(); setT(fromV(+input.value)); });
  input.addEventListener('keydown', ev => ev.stopPropagation()); // arrows move the thermometer, not the element

  return {
    panel,
    about,
    aboutOpen: () => about.isOpen(),
    closeAbout,
    show(on) {
      panel.hidden = !on;
      if (!on) { stop(); if (about.isOpen()) closeAbout(); return; }
      layout(); lastCaption = ''; say(startCaption()); update(); renderButtons();
      requestAnimationFrame(layout);
    },
    onState(ch) {
      if (panel.hidden) return;
      if ('lang' in ch || 'Z' in ch) { layout(); lastCaption = ''; say(startCaption()); }
      if ('T' in ch || 'lang' in ch || 'Z' in ch) { update(); renderButtons(); }
    },
    /** Events from the forge view: name each moment in one quiet caption (numbers from the data). */
    onEvent(a, b, e) {
      if (panel.hidden) return;
      const at = key => { const x = eventsOf(e).filter(v => v.key === key); return x.length ? C(x[0].T) : C(state.T); };
      if (a === 'phase') {
        const bound = eventsOf(e).filter(v => v.key === 'trans').sort((p, q) => Math.abs(p.T - state.T) - Math.abs(q.T - state.T))[0];
        say(t('forge.restack', { T: bound ? C(bound.T) : C(state.T), cn: b.cn }));
      } else if (a === 'solid' && b === 'liquid') say(t('forge.melt', { T: at('melt') }));
      else if (a === 'liquid' && b === 'gas') say(t('forge.boil', { T: at('boil') }));
      else if (a === 'solid' && b === 'gas') say(t('forge.sub', { T: at('sub') }));
      else if (a === 'liquid' && b === 'solid') say(t('forge.freeze', { T: at('melt') }));
      else if (a === 'gas' && b === 'liquid') say(t('forge.condense', { T: at('boil') }));
      else if (b === 'card') say(t('forge.card', { T: C(state.T) })); // a phase our sources cannot draw (e.g. β-uranium)
    },
    onKiln(on) { if (on && !panel.hidden && state.T < (events[0] ? events[0].T : hi)) say(t('forge.glow')); },
    stop,
  };
}
