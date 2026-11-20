// Quiz view (DESIGN-RULES Layer 1): one question card is the hero, the skill map sits quietly on the
// left, and the 3D view behind is the stage that shows the clue. Flow per question:
//   ask → (miss) smaller guiding question + camera flies to the clue → retry → done (reveal in 3D)
// Answers are tapped in the scene (table questions) or chosen (big buttons, keys A–D).
import { h, replace, isPhone, toast } from '../dom.js';
import { t } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, name } from '../data.js';
import { CATEGORY_COLORS, CATEGORY_COLORS_CB } from '../palette.js';
import { SKILLS, MAX_LEVEL, loadSkills, saveSkills, record, blankSkills, pickSkill, tierFor } from '../quiz/skills.js';
import { makeItem, answerText, ROOM } from '../quiz/bank.js';

// state keys the quiz may change while staging; restored when you leave the quiz
const SNAP_KEYS = ['Z', 'Z2', 'T', 'prop', 'log', 'layout', 'color', 'orbital', 'density', 'allotrope', 'cmpR', 'trendLine'];
const LETTERS = 'ABCD';

export function buildQuiz(ui, hooks) {
  let sk = loadSkills();
  const card = h('section', { class: 'panel quiz-card', hidden: true, 'aria-label': t('qz.title') });
  ui.append(card);
  const panel = h('section', { class: 'panel quiz-skills' });

  let item = null, phase = 'ask', hint = null, outcome = null;
  let mainMarks = new Map(), hintMarks = new Map(), mainTap = null, hintTap = null, hintOk = null;
  let lastSkill = null, asked = 0, snapshot = null, active = false;
  const recent = [];
  let resetArmed = 0, undo = null, flash = null;

  // ---- staging: put the right thing in the 3D view ---------------------------------------
  function stage(st) {
    if (!st) return;
    const patch = { marks: st.marks ? new Set(st.marks) : null, flat: st.view === 'table', hideSel: true };
    for (const k of ['Z', 'Z2', 'T', 'prop', 'log', 'allotrope', 'cmpR', 'trendLine', 'orbital', 'density']) if (st[k] !== undefined) patch[k] = st[k];
    if (st.view === 'table') { patch.layout = 's18'; patch.color = st.color || 'cat'; if (st.T === undefined) patch.T = ROOM; }
    set(patch);
    hooks.switchStage(st.view);
    if (st.view === 'table') {
      const f = st.focus;
      if (typeof f === 'number') hooks.focusTable([f]);
      else if (Array.isArray(f)) hooks.focusTable(f);
      else hooks.frameTable();
    }
  }

  // ---- flow -------------------------------------------------------------------------------
  function next() {
    const first = asked === 0 && SKILLS.every(k => sk[k].lvl === 0);
    const skill = first ? 'table' : pickSkill(sk, lastSkill);
    const it = makeItem(skill, tierFor(sk[skill].lvl), Math.random, new Set(recent));
    if (it) show(it);
  }
  function show(it) {
    const skill = it.skill;
    item = it; phase = 'ask'; hint = null; outcome = null; hintOk = null;
    mainMarks = new Map(); hintMarks = new Map(); mainTap = null; hintTap = null;
    lastSkill = skill; asked++;
    recent.push(it.id); if (recent.length > 16) recent.shift();
    render();          // the card first (its height sets the free area on phones) …
    stage(item.stage); // … then the camera move, so a resize cannot cut it short
    focusFirst();
  }
  const okOf = (q, v) => (q.kind === 'tap' ? !!q.ok(+v) : !!(q.choices.find(c => c.id === String(v)) || {}).ok);

  function answerMain(v) {
    if (!item || (phase !== 'ask' && phase !== 'retry')) return;
    const ok = okOf(item, v);
    if (item.kind === 'tap') mainTap = +v; else { if (mainMarks.has(String(v))) return; mainMarks.set(String(v), ok ? 'ok' : 'no'); }
    if (ok) return finish(phase === 'ask' ? 'alone' : 'helped');
    if (phase === 'ask') {
      hint = item.hint ? item.hint(String(v)) : null;
      phase = hint ? 'hint' : 'retry';
      render();
      if (hint) stage(hint.stage || item.stage);
      focusFirst();
    } else finish('missed');
  }
  function answerHint(v) {
    if (phase !== 'hint' || !hint) return;
    const ok = okOf(hint, v);
    if (hint.kind === 'tap') hintTap = +v; else { if (hintMarks.size) return; hintMarks.set(String(v), ok ? 'ok' : 'no'); }
    hintOk = ok;
    phase = 'retry';
    render();
    if (hint.retry) stage(hint.retry);
    focusFirst();
  }
  function finish(o) {
    phase = 'done'; outcome = o;
    const { from, to } = record(sk, item.skill, item.tier, o);
    saveSkills(sk);
    render();
    stage(typeof item.reveal === 'function' ? item.reveal({ tapped: mainTap }) : item.reveal);
    if (item.kind === 'tap' && mainTap) set({ Z: mainTap, hideSel: false });
    if (to > from) {
      flash = item.skill;
      toast(t('qz.levelUp', { skill: t('qz.sk.' + item.skill), n: to, what: t('qz.lvl.' + to) }), 3200);
    }
    renderSkills();
    flash = null;
    card.querySelector('.qz-next')?.focus({ preventScroll: true });
  }
  function giveUp() { if (phase === 'hint' || phase === 'retry') finish('missed'); }

  // ---- rendering ----------------------------------------------------------------------------
  const pal = () => (state.cb ? CATEGORY_COLORS_CB : CATEGORY_COLORS);
  function choiceButtons(q, marks, onPick, live, revealRight) {
    return h('div', { class: 'qz-choices', role: 'group' }, q.choices.map((c, i) => {
      const m = marks.get(c.id) || (revealRight && c.ok ? 'ok' : null);
      return h('button', {
        class: `choice${m ? ' ' + m : ''}`, disabled: !live || !!m, 'data-id': c.id,
        'aria-label': `${LETTERS[i] || ''}: ${c.label()}${m === 'ok' ? ' ✓' : m === 'no' ? ' ✗' : ''}`,
        onclick: () => onPick(c.id),
      }, h('kbd', null, LETTERS[i] || ''), c.swatch ? h('span', { class: 'sw', style: { background: pal()[c.swatch] } }) : null,
      h('span', { class: 'qz-lbl' }, c.label()), m ? h('span', { class: 'qz-mark', 'aria-hidden': 'true' }, m === 'ok' ? '✓' : '✗') : null);
    }));
  }
  const tapPrompt = () => h('p', { class: 'qz-tap' }, h('span', { 'aria-hidden': 'true' }, '☝ '), t('qz.tapHint'), h('br'), h('span', { class: 'small' }, t('qz.keys')));
  const tapped = Z => (Z ? h('p', { class: 'small' }, t('qz.tapped', { name: `${byZ(Z).sym} · ${name(byZ(Z))}` })) : null);

  function render() {
    if (!item) { replace(card); return; }
    const kids = [];
    kids.push(h('div', { class: 'qz-top' },
      h('span', { class: 'qz-skill' }, t('qz.levelOf', { skill: t('qz.sk.' + item.skill), n: sk[item.skill].lvl })),
      phase !== 'done' ? h('button', { class: 'btn quiet qz-skip', onclick: () => next() }, t('qz.skip')) : null));
    if (asked === 1 && phase === 'ask') kids.push(h('p', { class: 'small qz-intro' }, t('qz.intro')));
    kids.push(h('h2', { class: 'qz-q', id: 'qz-q' }, item.q()));
    const mainLive = phase === 'ask' || phase === 'retry';
    if (item.kind === 'choice') kids.push(choiceButtons(item, mainMarks, answerMain, mainLive, phase === 'done'));
    else if (mainLive) kids.push(tapPrompt());
    if (item.kind === 'tap' && phase !== 'ask') kids.push(tapped(mainTap));
    // feedback for the first answer
    if (phase === 'hint' || phase === 'retry' || (phase === 'done' && outcome !== 'alone')) {
      if (phase !== 'done') kids.push(h('p', { class: 'qz-fb no', role: 'status' }, h('span', { 'aria-hidden': 'true' }, '✗ '), t('qz.notQuite')));
    }
    // the smaller question
    if (hint && (phase === 'hint' || phase === 'retry')) {
      const box = h('div', { class: 'qz-hint' }, h('h3', null, t('qz.smaller')), h('p', { class: 'qz-q2' }, hint.q()));
      if (hint.kind === 'choice') box.append(choiceButtons(hint, hintMarks, answerHint, phase === 'hint', phase === 'retry'));
      else if (phase === 'hint') box.append(tapPrompt());
      if (phase === 'retry') {
        if (hint.kind === 'tap') { const tp = tapped(hintTap); if (tp) box.append(tp); }
        box.append(h('p', { class: 'qz-then' }, h('b', null, hintOk ? '✓ ' : ''), hint.then()), h('p', { class: 'qz-again' }, t('qz.again')));
      }
      kids.push(box);
    }
    if (phase === 'done') {
      const right = outcome !== 'missed';
      kids.push(h('p', { class: `qz-fb ${right ? 'ok' : 'no'}`, role: 'status' },
        h('span', { 'aria-hidden': 'true' }, right ? '✓ ' : '✗ '), right ? t('qz.right') : t('qz.answer', { a: answerText(item) })));
      kids.push(h('p', { class: 'qz-x' }, item.explain({ tapped: mainTap })));
    }
    const actions = h('div', { class: 'qz-actions' });
    if (phase === 'done') actions.append(h('button', { class: 'btn primary qz-next', onclick: () => next() }, `${t('qz.next')} →`));
    else if (phase === 'hint' || phase === 'retry') actions.append(h('button', { class: 'btn quiet', onclick: giveUp }, t('qz.showMe')));
    kids.push(actions);
    replace(card, ...kids);
    hooks.layoutChanged();
  }
  function focusFirst() {
    if (isPhone()) return;
    const b = card.querySelector('.qz-hint .choice:not([disabled])') || card.querySelector('.choice:not([disabled])');
    if (b) b.focus({ preventScroll: true });
  }

  function renderSkills() {
    const rows = SKILLS.map(k => {
      const s = sk[k];
      return h('div', { class: `skill-row${flash === k ? ' up' : ''}`, role: 'listitem', 'aria-label': `${t('qz.sk.' + k)}: ${t('qz.level', { n: s.lvl })}, ${t('qz.lvl.' + s.lvl)}` },
        h('span', { class: 'sk-name' }, t('qz.sk.' + k)),
        h('span', { class: 'pips', 'aria-hidden': 'true' }, Array.from({ length: MAX_LEVEL }, (_, i) => h('i', { class: `pip${i < s.lvl ? ' on' : ''}` }))),
        h('span', { class: 'sk-lvl' }, `${t('qz.level', { n: s.lvl })} · ${t('qz.lvl.' + s.lvl)}`));
    });
    const resetBtn = undo
      ? h('button', { class: 'btn', onclick: () => { sk = undo; undo = null; saveSkills(sk); renderSkills(); render(); } }, `↶ ${t('qz.undo')}`)
      : h('button', { class: 'btn quiet', onclick: () => {
        const now = Date.now();
        if (now - resetArmed > 4000) { resetArmed = now; renderSkills(); return; }
        resetArmed = 0;
        undo = JSON.parse(JSON.stringify(sk));
        sk = blankSkills(); saveSkills(sk);
        toast(t('qz.cleared'));
        renderSkills(); render();
        setTimeout(() => { if (undo) { undo = null; renderSkills(); } }, 8000);
      } }, Date.now() - resetArmed < 4000 ? t('qz.resetSure') : t('qz.reset'));
    replace(panel,
      h('div', { class: 'sec' }, h('h3', null, t('qz.skills')), h('div', { role: 'list' }, rows)),
      h('div', { class: 'sec' }, h('p', { class: 'small' }, t('qz.saved')), resetBtn));
  }

  return {
    panel, card,
    get active() { return active; },
    /** called when the Quiz tab opens */
    enter() {
      if (!active) { snapshot = Object.fromEntries(SNAP_KEYS.map(k => [k, state[k]])); active = true; }
      card.hidden = false;
      renderSkills();
      if (!item) next();
      else {
        render();
        stage(phase === 'hint' ? (hint && hint.stage) || item.stage
          : phase === 'retry' ? (hint && (hint.retry || hint.stage)) || item.stage
            : phase === 'done' ? (typeof item.reveal === 'function' ? item.reveal({ tapped: mainTap }) : item.reveal) : item.stage);
      }
    },
    /** called when another tab opens: give the explore views back exactly as they were */
    exit() {
      if (!active) return;
      active = false;
      card.hidden = true;
      set({ ...snapshot, marks: null, flat: false, hideSel: false });
    },
    render() { renderSkills(); render(); },
    renderSkills,
    /** a tap on a table column while the quiz is open */
    tap(Z) {
      if (phase === 'hint' && hint && hint.kind === 'tap') { set({ Z, hideSel: false }); answerHint(Z); }
      else if ((phase === 'ask' || phase === 'retry') && item && item.kind === 'tap') { set({ Z, hideSel: false }); answerMain(Z); }
      else set({ Z, hideSel: false });
    },
    /** keyboard: A–D choose, Enter answers a tap question with the selected element or goes on */
    onKey(ev) {
      const k = ev.key;
      if (/^[a-dA-D]$/.test(k)) {
        const live = card.querySelectorAll('.qz-hint .choice:not([disabled])').length ? card.querySelectorAll('.qz-hint .qz-choices .choice') : card.querySelectorAll(':scope > .qz-choices .choice');
        const b = live[k.toUpperCase().charCodeAt(0) - 65];
        if (b && !b.disabled) { b.click(); return true; }
        return false;
      }
      if (k === 'Enter') {
        if (phase === 'done') { next(); return true; }
        if (phase === 'hint' && hint && hint.kind === 'tap' && !state.hideSel) { answerHint(state.Z); return true; }
        if ((phase === 'ask' || phase === 'retry') && item && item.kind === 'tap' && !state.hideSel) { answerMain(state.Z); return true; }
        return true; // Enter never leaves the quiz
      }
      return false;
    },
    // for tests / scripted screenshots: ask a particular question, answer right or wrong
    _debug: () => ({ item, phase, outcome, skills: sk }),
    _ask(skill, tier, prefix) {
      for (let i = 0; i < 600; i++) { const it = makeItem(skill, tier, Math.random); if (it && it.id.startsWith(prefix)) { show(it); return it.id; } }
      return null;
    },
    _answer(right, inHint = false) {
      const q = inHint ? hint : item;
      if (!q) return;
      const marks = inHint ? hintMarks : mainMarks;
      let v;
      if (q.kind === 'tap') { for (let Z = 1; Z <= 118; Z++) if (!!q.ok(Z) === right) { v = Z; break; } }
      else v = (q.choices.find(c => c.ok === right && !marks.has(c.id)) || {}).id;
      if (v == null) return;
      if (q.kind === 'tap') this.tap(v); else if (inHint) answerHint(v); else answerMain(v);
    },
  };
}
