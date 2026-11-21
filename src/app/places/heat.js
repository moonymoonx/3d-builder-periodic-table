// Heat place: "Hold a piece · heat it", the wow moment (STYLE.md §9, SPEC §0). The chrome around the
// forge view (views/sample.js, look 'forge'): one big thermometer to drag, its readout, one quiet caption
// that names each moment, "Heat it ▶" to play the whole sweep, "Room temperature" to start again.
// The room dims to the kiln colour while the metal glows (sample view -> hooks.onKiln). Every
// temperature on screen comes from our data (transitions, melting and boiling points, landmark metals).
import { h, replace, isPhone } from '../dom.js';
import { t, fmtNum } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, bySym, name, propValue } from '../data.js';
import { animate } from '../engine.js';
import { sampleStateAt, eventsOf } from '../views/sample.js';

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
  const track = h('div', { class: 'heat-track' }, ticks, h('div', { class: 'heat-rail' }, fill), input, flags);
  const play = h('button', { type: 'button', class: 'ui-btn ui-btn--primary heat-play', onclick: () => toggle() });
  const room = h('button', { type: 'button', class: 'ui-btn ui-btn--quiet heat-room', onclick: () => { stop(); setT(ROOM); } });
  const panel = h('section', { class: 'heat-panel', hidden: true },
    caption,
    h('div', { class: 'heat-row' }, h('div', { class: 'heat-readbox' }, read, word), track),
    h('div', { class: 'heat-actions' }, play, room));
  ui.append(panel);

  let lo = ROOM, hi = 3000, events = [], playing = null, el = null, lastCaption = '';
  const toV = T => Math.round(((T - lo) / (hi - lo)) * 1000);
  const fromV = v => lo + (v / 1000) * (hi - lo);
  const pct = T => `${Math.max(0, Math.min(100, ((T - lo) / (hi - lo)) * 100)).toFixed(2)}%`;
  function setT(T) { set({ T: Math.round(Math.max(lo, Math.min(hi, T)) * 100) / 100 }); }
  function say(text) { if (text && text !== lastCaption) { lastCaption = text; replace(caption, text); caption.classList.remove('is-new'); void caption.offsetWidth; caption.classList.add('is-new'); } }

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
      (p.r <= r || x < p.a - 5 || x > p.b + 5) &&  // my stem passes below p's row: must not cross p's text
      (p.r >= r || p.x < a - 5 || p.x > b + 5));   // p's stem passes below my row: my text must not cover it
    const spots = new Map();
    const sorted = [...events].sort((a, b) => rank[a.key] - rank[b.key] || a.T - b.T);
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
    replace(flags, marks.map(m => h('span', { class: 'heat-flag', style: { left: pct(m.T) } }, m.text)));
    input.setAttribute('aria-label', t('forge.label'));
  }
  let lastRead = '', lastWord = '', lastClip = '';
  function update() {
    if (!el) return;
    const rd = C(state.T);
    if (rd !== lastRead) { lastRead = rd; replace(read, rd); } // only what changed: no DOM churn while playing
    const ss = sampleStateAt(el, state.T, null);
    const wd = ss.kind === 'card' ? '' : ss.kind === 'solid' && ss.phase && ss.phase.cn ? t('forge.solidCn', { cn: ss.phase.cn }) : t('state.' + ss.kind);
    if (wd !== lastWord) { lastWord = wd; replace(word, wd); }
    // the thermometer fills up to the temperature, coloured like heated metal along the way
    const clip = `inset(0 ${(100 - parseFloat(pct(state.T))).toFixed(1)}% 0 0 round 6px)`;
    if (clip !== lastClip) { lastClip = clip; fill.style.clipPath = clip; }
    const v = String(toV(state.T));
    if (input.value !== v && document.activeElement !== input) input.value = v;
    if (state.T <= lo + 0.5 && !playing) say(startCaption());
  }
  let lastBtn = '';
  function renderButtons() {
    const key = `${playing ? 'p' : state.T >= hi - 1 ? 'a' : 'h'}|${state.T <= lo + 0.5}|${t('forge.room')}`;
    if (key === lastBtn) return;
    lastBtn = key;
    replace(play, playing ? t('forge.pause') : state.T >= hi - 1 ? t('forge.again') : t('forge.play'));
    replace(room, t('forge.room'));
    room.disabled = state.T <= lo + 0.5;
  }

  // "Heat it ▶": sweep up through the whole range, stopping just past each event so its caption is read
  function toggle() { if (playing) stop(); else start(); }
  function start() {
    if (state.T >= hi - 1) setT(lo);
    let T = state.T, hold = 0;
    const speed = (hi - lo) / 10;
    hooks.onInteract && hooks.onInteract();
    playing = animate(dt => {
      if (hold > 0) { hold -= dt; return true; }
      const next = events.find(x => x.T > T + 0.5);
      let T2 = T + speed * Math.min(dt, 0.25); // wall-clock pace, also on slow frames
      if (next && T2 >= next.T) { T2 = next.T + 2; hold = 1.8; }
      T = Math.min(hi, T2); setT(T);
      if (T >= hi) { playing = null; renderButtons(); return false; }
      return true;
    });
    renderButtons();
  }
  function stop() { if (playing) { playing(); playing = null; renderButtons(); } }

  window.addEventListener('resize', () => { if (!panel.hidden) layout(); });
  input.addEventListener('pointerdown', stop);
  input.addEventListener('input', () => { stop(); setT(fromV(+input.value)); });
  input.addEventListener('keydown', ev => ev.stopPropagation()); // arrows move the thermometer, not the element

  return {
    panel,
    show(on) {
      panel.hidden = !on;
      if (!on) { stop(); return; }
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
