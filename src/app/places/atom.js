// Atom place, "Look inside the atom" (REDESIGN-PLAN §2, STYLE.md §6): the chrome around the atom view.
// The kit sheet: a card on the right on desktop, a bottom sheet on phones. In reading order:
//   the hook (why it matters, one line, with its sources) -> three ways to look (whole atom · one cloud ·
//   its light) -> what that way shows: a plain caption computed from the configuration (NIST), its numbers
//   tappable for their source; one cloud's picker first; its light's picked line first -> "About this atom ▾".
// The one visible control is the stepper in the always-visible footer: − proton / + proton.
// "Its light" dims the room like the forge (#kiln, body.kiln); the atom's NIST lines spread across the
// stage as a spectroscope band, and the outer cloud glows in the colour they mix to.
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, name, isPred } from '../data.js';
import { sheet, chip, button, disclosure } from '../ui/kit.js';
import { showSource, closeSource } from '../ui/source.js';
import { pigment, pigmentCB } from '../../design/tokens.js';
import { subshellsOf, shellCounts, shapeOf, leadM, turnOrder, nodalPlanes, parseOrbital, movePhrase, STAGE_FOOT } from '../views/atom.js';
import { spectrumStrip, looks, lineColour, colourWord, glowRGB } from '../ui/spectrum.js';
import { ATOM_KEYS } from '../content/strings-atom.js';
import * as O from '../../physics/orbitals.js';
import { toHex } from '../../physics/color.js';

// the hooks' sources (REDESIGN-PLAN §4; the light hook: how spectra tell what stars are made of)
const NIST_ASD = ['NIST Atomic Spectra Database (Kramida, Ralchenko, Reader and NIST ASD Team)', 'https://physics.nist.gov/PhysRefData/ASD/lines_form.html'];
const HOOK_SOURCES = {
  clouds: [['Wikipedia: Atomic orbital', 'https://en.wikipedia.org/wiki/Atomic_orbital'], ['Wikipedia: Chemical bond', 'https://en.wikipedia.org/wiki/Chemical_bond']],
  light: [NIST_ASD, ['Wikipedia: Astronomical spectroscopy', 'https://en.wikipedia.org/wiki/Astronomical_spectroscopy'],
    ['Wikipedia: Helium (first seen as a yellow line in sunlight, 1868)', 'https://en.wikipedia.org/wiki/Helium']],
};
const SUP = d => String(d).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
/** "[Ar] 3d6 4s2" -> "[Ar] 3d⁶ 4s²" */
export const prettyCfg = s => String(s).replace(/([spdf])(\d+)/g, (_, l, n) => l + SUP(n));
const subName = x => `${x.n}${'spdf'[x.l]}`;
/** Names inside a sentence: lower case; Vietnamese uses the 13 familiar GDPT-2018 names (sắt, đồng…). */
const gdpt = e => getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
const inName = e => (gdpt(e) ? e.names.viAlt[0] : name(e)).toLowerCase();
/** The name as the card shows it: Vietnamese leads with the familiar GDPT-2018 name (Sắt), as the card does. */
const shownName = e => (gdpt(e) ? cap(e.names.viAlt[0]) : name(e));
/** A translated sentence whose {placeholders} may be DOM nodes (tappable values). */
function tn(key, params) {
  const out = [];
  String(t(key)).split(/(\{\w+\})/).forEach(part => {
    const m = /^\{(\w+)\}$/.exec(part);
    if (!m) { if (part) out.push(part); return; }
    const v = params[m[1]];
    out.push(v == null ? '' : v);
  });
  return out;
}
/** A word coloured like the ink it names: a small swatch of the ink, the word in text colour (contrast). */
const inkWord = (which, capital = false) => h('span', { class: 'atom-ink' }, h('i', { class: `atom-ink__dot atom-ink__dot--${which}`, 'aria-hidden': 'true' }), capital ? cap(t('atom.ink.' + which)) : t('atom.ink.' + which));
export function buildAtom(ui, hooks) {
  if (!ATOM_KEYS.length) throw new Error('atom strings missing');
  const view = hooks.view;
  const sh = sheet({ label: t('atom.label'), onClose: () => hooks.onBack(), closeLabel: t('atom.close') });
  sh.el.classList.add('atom-sheet');
  ui.append(sh.el);

  // ---- persistent parts (updated in place, so focus and the live caption survive a step) -------------
  const tile = h('div', { class: 'atom-tile', 'aria-hidden': 'true' });
  const title = h('h2', { class: 'atom-title' });
  const counts = h('p', { class: 'atom-counts' });
  const head = h('div', { class: 'atom-head' }, tile, h('div', { class: 'atom-head__text' }, title, counts));
  const hookText = h('span');
  const hookSrc = h('button', { type: 'button', class: 'atom-src', onclick: ev => openHookSources(ev.currentTarget) });
  const hook = h('p', { class: 'atom-hook' }, hookText, ' ', hookSrc);
  const modeBtns = {};
  for (const id of ['atom', 'cloud', 'light']) modeBtns[id] = chip({ label: '', onClick: () => setMode(id), attrs: { 'data-mode': id } });
  const modes = h('div', { class: 'atom-modes', role: 'group' }, Object.values(modeBtns));
  const pre = h('div', { class: 'atom-pre' }); // one cloud's picker, its light's picked line
  const caption = h('div', { class: 'atom-caption', 'aria-live': 'polite' });
  const modeBody = h('div', { class: 'atom-modebody' }, pre, caption);
  const aboutSlot = h('div', { class: 'atom-about' });
  const stepLabel = (txt, to) => [h('span', { class: 'atom-step__do' }, txt), h('small', null, to)];
  const minus = button({ label: '', kind: 'secondary', onClick: () => step(-1), attrs: { class: 'ui-btn ui-btn--secondary atom-step__btn', 'data-step': '-1' } });
  const plus = button({ label: '', kind: 'primary', onClick: () => step(1), attrs: { class: 'ui-btn ui-btn--primary atom-step__btn', 'data-step': '1' } });
  const readB = h('b'), readS = h('span');
  const read = h('div', { class: 'atom-step__read' }, readB, readS); // the caption (a live region) announces each step
  const foot = h('div', { class: 'atom-step' }, minus, read, plus);
  sh.setFoot(foot);
  replace(sh.body, head, hook, modes, modeBody, aboutSlot);
  // its light: the spectroscope band on the stage, under the atom
  const band = h('div', { class: 'atom-band', hidden: true });
  ui.append(band);

  let shown = false, light = false, aboutOpen = false, pending = false, picked = null;

  // ---- the hook's sources: a small popover (one at a time with the value sources) ---------------------
  let pop = null;
  function closeHookSources() { if (pop) { pop.remove(); pop = null; } }
  function openHookSources(anchor) {
    closeSource(); closeHookSources();
    const list = HOOK_SOURCES[light ? 'light' : 'clouds'];
    pop = h('div', { class: 'popover atom-pop', role: 'dialog', 'aria-label': t('atom.sources') },
      h('button', { type: 'button', class: 'close', 'aria-label': t('sh.close'), onclick: closeHookSources }, '×'),
      h('h4', null, t('atom.why')), h('p', null, hookText.textContent),
      h('p', null, h('b', null, `${t('atom.source')}: `)),
      list.map(([nm, url]) => h('p', null, h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, nm))));
    ui.append(pop);
    const r = anchor.getBoundingClientRect(), pw = Math.min(420, window.innerWidth - 20);
    pop.style.left = `${Math.min(Math.max(10, r.left - pw / 2), window.innerWidth - pw - 10)}px`;
    pop.style.top = `${r.bottom + 8}px`;
    const ph = pop.offsetHeight;
    if (r.bottom + 8 + ph > window.innerHeight - 10) pop.style.top = `${Math.max(10, r.top - ph - 8)}px`;
    pop.querySelector('.close').focus();
  }
  document.addEventListener('pointerdown', ev => { if (pop && !pop.contains(ev.target) && ev.target !== hookSrc) closeHookSources(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && pop) { closeHookSources(); hookSrc.focus(); ev.stopPropagation(); } });

  // ---- a tappable value (dotted underline): opens its source ------------------------------------------
  const val = (text, label, v, e, shown2) => (v
    ? h('button', { type: 'button', class: 'atom-v' + (isPred(v) ? ' is-est' : ''), onclick: ev => { closeHookSources(); showSource(ev.currentTarget, label, v, e, shown2 ?? text); } }, text)
    : h('span', null, text));

  // ---- modes: whole atom · one cloud · its light ---------------------------------------------------------
  const mode = () => (light ? 'light' : state.orbital ? 'cloud' : 'atom');
  function setMode(id) {
    if (id === mode()) return;
    closeSource(); closeHookSources();
    if (id === 'light') { set({ orbital: null }); setLight(true); }
    else {
      setLight(false);
      if (id === 'atom') set({ orbital: null });
      else { const s = parseOrbital(byZ(state.Z), null).sub; set({ orbital: `${s.key}:${leadM(s.l)}` }); }
    }
    render();
    // phones: the sheet grows to show what the new way to look starts with (peek), from its top: nothing
    // half-faded under the compact title
    if (isPhone()) sh.body.scrollTop = 0;
  }
  /** The element's lines for the stage: each line's hue at full strength, how bright it looks (how many of
   *  the outer dots take its colour) and the colour they all mix to (the glow). */
  const lightSpec = e => { const ln = looks(e); return { cols: ln.map(x => { const c = lineColour(x.lam), m = Math.max(...c, 1e-3); return c.map(v => v / m); }), w: ln.map(x => x.b), glow: glowRGB(e) }; };
  function setLight(on) {
    if (light === on) return;
    light = on;
    document.body.classList.toggle('kiln', on); // the room dims like the forge (STYLE.md §1: a dark room is for light)
    view.setLight(on, on ? lightSpec(byZ(state.Z)) : null);
    if (!on) { band.hidden = true; replace(band); }
  }
  function step(d) {
    const Z = state.Z + d;
    if (Z < 1 || Z > 118) return;
    closeSource(); closeHookSources();
    set({ Z });
  }

  // ---- the caption ------------------------------------------------------------------------------
  function shellSentence(e) {
    const sc = shellCounts(e), k = sc.length, Name = cap(inName(e)), nm = inName(e);
    const cfg = e.f.config;
    // "(2, 8, 14, 2)" never breaks after its opening bracket
    const list = h('span', { class: 'atom-nowrap' }, '(', val(sc.map(([, c]) => fmtNum(c, 0)).join(', '), t('f.config'), cfg, e, prettyCfg(cfg[0])), ')');
    if (e.Z === 1) return tn('atom.cap.one', { Name, name: nm });
    if (k === 1) return tn('atom.cap.shell1', { Name, name: nm, n: fmtNum(e.Z, 0) });
    return tn(isPred(cfg) ? 'atom.cap.shellsP' : 'atom.cap.shells', { Name, name: nm, n: fmtNum(e.Z, 0), k: fmtNum(k, 0), list });
  }
  function atomCaption(e, info) {
    const out = [h('p', null, shellSentence(e))];
    const ch = info.change, sub = ch.sub, shape = t('atom.cap.l' + sub.l);
    const prev = e.Z > 1 ? byZ(e.Z - 1) : null;
    const how = prev ? `${shownName(prev)} ${prettyCfg(prev.f.config[0])} → ${shownName(e)} ${prettyCfg(e.f.config[0])}` : prettyCfg(e.f.config[0]);
    const subV = val(sub.key, t('f.config'), e.f.config, e, how);
    if (ch.kind === 'add') out.push(h('p', null, tn('atom.cap.add', { sub: subV, shape, plus: inkWord('plus') })));
    else if (ch.kind === 'rearr') {
      const down = ch.diff.filter(x => x.to < x.from), up = ch.diff.filter(x => x.to > x.from);
      if (down.length === 1 && up.length === 1 && up[0].to - up[0].from === 2 && down[0].from - down[0].to === 1) out.push(h('p', null, tn('atom.cap.moved', { sub: subV, from: subName(down[0]), shape, plus: inkWord('plus') })));
      else out.push(h('p', null, tn('atom.cap.rearr', { phrase: val(movePhrase(ch.diff), t('f.config'), e.f.config, e, how), sub: subV, shape, plus: inkWord('plus') })));
    }
    const md = e.f.madelung;
    if (md[0] === 'exception' && ch.kind !== 'rearr') out.push(h('p', null, tn('atom.cap.except', { Name: cap(inName(e)), name: inName(e), phrase: val(movePhrase(md[2].d || []), t('f.madelung'), md, e) })));
    return out;
  }
  function cloudCaption(e, info) {
    const { sub, m } = info.sel, Name = cap(inName(e)), nm = inName(e), k = 2 * sub.l + 1;
    const lines = [m == null ? t('atom.cloud.all', { k, sub: sub.key }) : t('atom.cloud.' + shapeOf(sub.l, m), { sub: sub.key })];
    const gaps = sub.n - sub.l - 1;
    if (gaps > 0) lines.push(gaps === 1 ? t('atom.cloud.gap1') : t('atom.cloud.gaps', { k: gaps }));
    const nE = sub.occ;
    const occV = val(fmtNum(nE, 0), t('f.config'), e.f.config, e, prettyCfg(e.f.config[0]));
    const cnt = sub.l === 0 ? tn(nE === 1 ? 'atom.cloud.countS1' : 'atom.cloud.countS', { Name, name: nm, n: occV, sub: sub.key })
      : tn(nE === 1 ? 'atom.cloud.count1' : 'atom.cloud.count', { Name, name: nm, n: occV, k, sub: sub.key });
    const planes = m != null && sub.l > 0 ? nodalPlanes(sub.l, m).length : 0;
    const phase = [...tn('atom.cloud.phase', { Plus: inkWord('plus', true), plus: inkWord('plus'), minus: inkWord('minus') }), ' ',
      planes ? t(planes === 1 ? 'atom.cloud.sheet1' : 'atom.cloud.sheets') : sub.l > 0 ? t('atom.cloud.meet') : ''];
    const out = [h('p', null, lines.join(' ')), h('p', null, cnt), h('p', { class: 'atom-caption__quiet' }, phase)];
    if (state.surf && state.tier !== 'low' && m != null) out.push(h('p', { class: 'atom-caption__quiet' }, t('atom.cloud.glaze')));
    return out;
  }

  // ---- one cloud: shells and their clouds, then the turns of the chosen one -----------------------------
  function picker(e, info) {
    const subs = subshellsOf(e), sel = info.sel;
    const shells = [...new Set(subs.map(s => s.n))];
    const elLabel = n => (n === 1 ? t('atom.pick.electron1') : t('atom.pick.electrons', { n: fmtNum(n, 0) }));
    const rows = shells.map(n => h('div', { class: 'atom-pick__row' },
      h('span', { class: 'atom-pick__shell' }, t('atom.pick.shell', { n })),
      h('div', { class: 'atom-pick__chips' }, subs.filter(s => s.n === n).map(s => chip({
        label: [s.key, h('small', { class: 'atom-pick__n' }, fmtNum(s.occ, 0))], pressed: s.key === sel.sub.key,
        onClick: () => set({ orbital: `${s.key}:${leadM(s.l)}` }),
        attrs: { 'data-key': s.key, 'aria-label': `${t('atom.pick.shell', { n })}: ${s.key}, ${elLabel(s.occ)}`, title: elLabel(s.occ) },
      })))));
    const box = h('div', { class: 'atom-pick', role: 'group', 'aria-label': t('atom.pick') }, rows);
    const s = sel.sub;
    if (s.l > 0) {
      const k = 2 * s.l + 1;
      box.append(h('div', { class: 'atom-pick__row atom-pick__turns' },
        h('span', { class: 'atom-pick__shell' }, t('atom.pick.turn', { k })),
        h('div', { class: 'atom-pick__chips' },
          turnOrder(s.l).map(m => chip({ label: O.ORBITAL_SUFFIX[s.l][m], pressed: sel.m === m, onClick: () => set({ orbital: `${s.key}:${m}` }), attrs: { 'data-m': String(m), title: t('atom.shape.' + shapeOf(s.l, m)) } })),
          chip({ label: t('atom.pick.all', { k }), pressed: sel.m == null, onClick: () => set({ orbital: `${s.key}:all` }), attrs: { 'data-m': 'all' } }))),
        h('p', { class: 'atom-pick__axes' }, t('atom.pick.axes')));
    }
    return box;
  }

  // ---- its light: the lines across the stage, the picked one described in the card --------------------
  let detail = null;
  const basisNote = e => (e.lines.basis === 'model' ? 'strength estimated from NIST transition probabilities (graded within 18 %) for a gas at 1 eV, the default of NIST\'s LIBS spectrum tool'
    : e.lines.basis === 'gA' ? 'strength from NIST transition probabilities (g·A)' : 'strength: NIST relative intensity');
  function lightBody(e) {
    const ln = looks(e);
    if (!ln.length) { band.hidden = true; replace(band); return [h('p', { class: 'atom-light__none' }, t('atom.light.none', { name: inName(e) }))]; }
    detail = h('p', { class: 'atom-light__detail', 'aria-live': 'polite' }, t('atom.light.tap'));
    const strip = spectrumStrip(e, {
      onPick: (m, user) => {
        picked = { Z: e.Z, lam: m.lam };
        const text = t('atom.light.line', { nm: fmtNum(m.lam, 1, { minDigits: 1 }), colour: t('atom.col.' + colourWord(m.lam)) });
        const v = [m.lam, 'nist-lines', { n: `${fmtNum(m.lam, 3)} nm (air wavelength). How bright it looks: ${basisNote(e)}, times the eye's sensitivity (CIE 1931); ${Math.round(m.b * 1000)}/1000 of its brightest line to the eye` }];
        const p = m.b * 100, bright = m.b >= 0.995 ? t('atom.light.brightest') : p < 1 ? t('atom.light.faint') : t('atom.light.bright', { p: fmtNum(p >= 10 ? Math.round(p / 5) * 5 : Math.round(p), 0) });
        replace(detail, h('span', { class: 'atom-light__swatch', style: { background: toHex(m.hue) }, 'aria-hidden': 'true' }), val(text, t('f.lines'), v, e, `${fmtNum(m.lam, 3)} nm`),
          h('span', { class: 'atom-light__bright' }, bright));
        if (user) view.pulse(m.hue);
      },
    });
    replace(band, strip.el);
    band.hidden = false;
    layoutBand();
    // start on the line picked before (same element), else on the one that looks brightest
    let i = picked && picked.Z === e.Z ? strip.lines.findIndex(m => Math.abs(m.lam - picked.lam) < 1e-6) : -1;
    if (i < 0) strip.lines.forEach((m, j) => { if (i < 0 || m.b > strip.lines[i].b) i = j; });
    strip.pick(i);
    return [detail, h('p', { class: 'atom-light__title' }, tn('atom.light.lines', { k: fmtNum(ln.length, 0),
      n: val(fmtNum(e.lines.n, 0), t('f.lines'), [e.lines.n, 'nist-lines', { n: `${e.lines.n} lines of the neutral atom listed by NIST between 380 and 750 nm; shown: the ${ln.length} that look brightest (${basisNote(e)}, times the eye's sensitivity, CIE 1931)` }], e) }))];
  }
  function lightNotes(e) {
    if (!looks(e).length) return [];
    return [h('p', { class: 'atom-caption__quiet' }, t('atom.light.how'), glowRGB(e) ? [' ', t('atom.light.glow')] : null),
      e.lines.basis === 'gA' ? h('p', { class: 'atom-caption__quiet' }, t('atom.light.gA')) : null];
  }
  /** The band spans the free stage: beside the card on desktop, just above the sheet on phones. */
  function layoutBand() {
    if (band.hidden) return;
    const r = resting(), H = window.innerHeight;
    if (isPhone()) Object.assign(band.style, { left: '14px', right: '14px', width: '', bottom: `${Math.round(H - r.top + 10)}px` });
    else Object.assign(band.style, { left: '32px', right: '', width: `${Math.max(240, Math.round(r.left - 64))}px`, bottom: '24px' });
  }

  // ---- about this atom -------------------------------------------------------------------------------
  function aboutRows(body, e, info) {
    const dl = h('dl', { class: 'atom-facts' });
    const row = (label, capt, value, note) => dl.append(
      h('dt', null, label, capt ? h('span', { class: 'atom-facts__cap' }, capt) : null),
      h('dd', null, value, note ? h('span', { class: 'atom-facts__note' }, note) : null));
    const f = e.f;
    row(t('atom.row.config'), t('atom.row.configCap'), val(prettyCfg(f.config[0]), t('f.config'), f.config, e));
    const md = f.madelung;
    const pred = md[0] === 'exception' && /predicts\s+(.+)$/.exec(md[2]?.n || '');
    row(t('atom.row.order'), null, val(md[0] === 'exception' ? cap(movePhrase(md[2].d || [])) : t('madelung.follows'), t('f.madelung'), md, e),
      pred ? t('atom.row.orderPred', { cfg: prettyCfg(pred[1]) }) : null);
    // the nucleus: protons and neutrons of the most common (or longest-lived) kind (NUBASE2020)
    const A = f.nucA ? f.nucA[0] : null;
    if (A) {
      const N = A - e.Z;
      const txt = e.Z === 1 && N === 0 ? t('atom.row.nucVal0') : e.Z === 1 ? t('atom.row.nucVal1', { n: fmtNum(N, 0) }) : N === 1 ? t('atom.row.nucValN1', { p: fmtNum(e.Z, 0) }) : t('atom.row.nucVal', { p: fmtNum(e.Z, 0), n: fmtNum(N, 0) });
      const pct = f.isoMain && /([\d.]+)\s*%/.exec(f.isoMain[2]?.n || '');
      const note = f.isoMain ? t('atom.row.nucCommon', { iso: `${inName(e)}-${A}`, pct: pct ? `${fmtNum(+pct[1], 3)} %` : '', name: inName(e) }) : t('atom.row.nucLong', { A: fmtNum(A, 0) });
      row(t('atom.row.nucleus'), null, val(txt, t('f.isoMain'), f.isoMain || f.nucA, e), note);
    }
    // the pull felt by the outermost electrons (Clementi–Raimondi; Slater's rules beyond)
    const outer = info.subs.slice().sort((a, b) => b.n - a.n || b.l - a.l)[0];
    if (outer.zSrc) row(t('atom.row.pull'), t('atom.row.pullCap'), val(t('atom.row.pullVal', { z: fmtNum(outer.Zeff, 1), Z: fmtNum(e.Z, 0), sub: outer.key }), t('f.zeff'), outer.zSrc, e), t('atom.row.pullNote'));
    // the size of the nucleus: measured (Angeli & Marinova 2013) where the data has it, else the estimate
    if (f.rNuc && info.factor) {
      const measured = !isPred(f.rNuc);
      row(t('atom.row.size'), t('atom.row.sizeCap'), val(measured ? t('atom.row.sizeValM', { r: fmtNum(f.rNuc[0], 2, { minDigits: 2 }) }) : t('atom.row.sizeVal', { r: fmtNum(f.rNuc[0], 1) }), t('f.rNuc'), f.rNuc, e),
        t('atom.row.sizeNote', { x: fmtNum(info.factor, 0) }));
    }
    const r90 = Math.max(...info.subs.map(s => s.r90));
    const rV = [Math.round(r90), 'calc', { n: `radius holding 90 % of the ${outer.key} electron's probability in the hydrogen-like model with Z_eff = ${fmtNum(outer.Zeff, 2)} (Bohr radius 52.918 pm, CODATA 2022)` }];
    row(t('atom.row.cloud'), null, val(t('atom.row.cloudVal', { r: fmtNum(Math.round(r90 / 10) * 10, 0) }), t('atom.row.cloud'), rV, e), t('atom.row.cloudNote'));
    const slater = outer.zSrc && outer.zSrc[1] === 'calc';
    const rc = f.rCov && f.rCov[0];
    row(t('atom.row.model'), null, h('span', null, t('atom.row.modelVal'), slater && rc ? ` ${t('atom.row.modelSlater', { rc: fmtNum(rc, 0) })}` : '', state.surf && state.tier !== 'low' ? ` ${t('atom.row.glaze')}` : ''));
    body.append(h('p', { class: 'atom-hint' }, t('atom.tapValue')), dl);
  }

  // ---- render -----------------------------------------------------------------------------------------
  function render() {
    if (!shown) return;
    const info = view.info();
    const e = byZ(state.Z);
    if (!info || info.e.Z !== e.Z) return; // the view builds first; it calls back (onBuilt)
    const focused = document.activeElement;
    const keep = focused && sh.el.contains(focused) ? { key: focused.dataset.key, m: focused.dataset.m, mode: focused.dataset.mode, step: focused.dataset.step, about: focused.classList.contains('ui-disclosure__summary') } : null;
    const pal = state.cb ? pigmentCB : pigment;
    const md = mode();
    replace(tile, h('small', null, String(e.Z)), e.sym);
    tile.style.background = pal[e.f.cat[0]];
    replace(title, t('atom.inside', { name: inName(e) }));
    replace(counts, e.Z === 1 ? t('atom.counts1') : t('atom.counts', { p: fmtNum(e.Z, 0), e: fmtNum(e.Z, 0) }));
    replace(hookText, t(md === 'light' ? 'atom.light.hook' : 'atom.hook'));
    replace(hookSrc, t('atom.source'));
    hookSrc.setAttribute('aria-label', `${t('atom.source')}: ${t('atom.why')}`);
    for (const [id, b] of Object.entries(modeBtns)) { replace(b.lastChild, t('atom.mode.' + id)); b.setAttribute('aria-pressed', String(id === md)); }
    modes.setAttribute('aria-label', t('atom.modes'));
    if (md !== 'light') { band.hidden = true; replace(band); }
    replace(pre, md === 'cloud' ? picker(e, info) : md === 'light' ? lightBody(e) : null);
    replace(caption, md === 'cloud' ? cloudCaption(e, info) : md === 'light' ? lightNotes(e) : atomCaption(e, info));
    modeBody.dataset.mode = md;
    // about this atom: rebuilt for each element, opening state kept
    replace(aboutSlot, disclosure({ summary: t('atom.about'), open: aboutOpen, build: body => aboutRows(body, e, info), onToggle: o => { aboutOpen = o; requestAnimationFrame(sh.updateMore); } }));
    // the stepper: where each button leads
    const prev = e.Z > 1 ? byZ(e.Z - 1) : null, next = e.Z < 118 ? byZ(e.Z + 1) : null;
    replace(minus.lastChild, stepLabel(t('atom.remove'), prev ? shownName(prev) : ''));
    replace(plus.lastChild, stepLabel(t('atom.add'), next ? shownName(next) : ''));
    minus.disabled = !prev; plus.disabled = !next;
    minus.title = prev ? t('atom.removeTo', { name: shownName(prev) }) : ''; plus.title = next ? t('atom.addTo', { name: shownName(next) }) : '';
    replace(readB, e.Z === 1 ? t('atom.proton1') : t('atom.protons', { n: fmtNum(e.Z, 0) }));
    replace(readS, shownName(e));
    sh.setBar(h('span', { class: 'atom-bar' }, h('span', { class: 'atom-bar__tile', style: { background: pal[e.f.cat[0]] } }, h('small', null, String(e.Z)), e.sym), h('b', null, t('atom.inside', { name: inName(e) }))));
    sh.el.setAttribute('aria-label', t('atom.label'));
    // focus stays on the control the visitor used
    if (keep) {
      const sel = keep.key ? `[data-key="${keep.key}"]` : keep.m ? `[data-m="${keep.m}"]` : keep.mode ? `[data-mode="${keep.mode}"]` : keep.step ? `[data-step="${keep.step}"]` : keep.about ? '.ui-disclosure__summary' : null;
      const target = sel && sh.el.querySelector(sel);
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }
    requestAnimationFrame(() => { sh.updateMore(); peek(); });
  }
  /** Phones: the sheet stands tall enough for the hook, the ways to look and what the chosen way starts
   *  with (the whole atom's caption and the "About" row; one cloud's picker; its light's picked line),
   *  ending on empty paper; at most 60 % of the screen. */
  function peek() {
    if (!isPhone() || !sh.isOpen()) { sh.setPeek(null); return; }
    const md = mode();
    const last = md === 'cloud' ? (pre.querySelector('.atom-pick__axes') || pre.querySelector('.atom-pick') || modes)
      : md === 'light' ? (pre.querySelector('.atom-light__title') || pre.firstChild || modes)
        : (aboutSlot.querySelector('.ui-disclosure__summary') || modes);
    const top = last.getBoundingClientRect().bottom - sh.body.getBoundingClientRect().top + sh.body.scrollTop;
    const bar = sh.el.querySelector('.ui-sheet__handle');
    const want = top + 18 + foot.offsetHeight + (bar ? bar.offsetHeight : 0);
    sh.setPeek(Math.min(window.innerHeight * 0.6, want));
  }
  const schedule = () => { if (!pending) { pending = true; queueMicrotask(() => { pending = false; render(); }); } };

  /** Where the sheet will rest (without the slide-in transform it may still be animating). */
  function resting() {
    const r = sh.el.getBoundingClientRect(), tf = getComputedStyle(sh.el).transform;
    const m = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf) : null;
    return m ? { left: r.left - m.m41, top: r.top - m.m42 } : r;
  }

  window.addEventListener('resize', () => { if (shown) requestAnimationFrame(() => { peek(); layoutBand(); }); });

  return {
    el: sh.el,
    show(on) {
      if (on === shown) { if (on) schedule(); return; }
      shown = on;
      if (on) { light = false; aboutOpen = false; picked = null; sh.body.scrollTop = 0; sh.open(); schedule(); }
      else { closeSource(); closeHookSources(); if (light) setLight(false); sh.close(); }
    },
    onState(ch) {
      if (!shown) return;
      if (light && 'Z' in ch) view.setLight(true, lightSpec(byZ(state.Z)));
      if (['Z', 'lang', 'orbital', 'cb', 'tier', 'surf', 'reduced'].some(k => k in ch)) schedule();
    },
    onBuilt() { if (shown) schedule(); },
    /** The free area for the atom: beside the card (desktop), above the sheet (phone). */
    safe(topBarBottom) {
      if (!sh.isOpen()) return { left: 0, right: 0, top: topBarBottom + 8, bottom: 16 };
      const r = resting(), W = window.innerWidth, H = window.innerHeight;
      layoutBand();
      const bandH = band.hidden ? 0 : band.offsetHeight + 14; // its light: the atom stands above the band
      const foot = light ? 0 : STAGE_FOOT[isPhone() ? 'phone' : 'desk']; // daylight: the scale bar's strip under the atom
      return isPhone() ? { left: 0, right: 0, top: topBarBottom + 4, bottom: H - r.top + 8 + bandH + foot } : { left: 0, right: W - r.left + 12, top: topBarBottom + 8, bottom: 16 + bandH + (bandH ? 10 : 0) + foot };
    },
    band,
    isLight: () => light,
    setMode,
  };
}
