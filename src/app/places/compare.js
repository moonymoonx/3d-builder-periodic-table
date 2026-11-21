// Side by side place (REDESIGN-PLAN §2, SPEC §0): the card's third door. Two specimens on the stage
// (views/compare.js): by default a litre of each at 20 °C on a balance, so their states and their heft show at a
// glance; or one atom of each at true scale. Beside the stage a sheet says, in one plain sentence, why this pair
// is worth a look, then compares them in plain rows (every value opens its source). Curated surprising pairs
// come first, as chips under the stage; "pick any two" second. All numbers & sources (with ratio bars) sit one
// tap away.
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, fmtSci, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, bySym, name, search, propValue, stateAt, isPred, fmtTemp, source, structText } from '../data.js';
import { sheet, chip, iconButton, disclosure, segmented } from '../ui/kit.js';
import { showSource, closeSource } from '../ui/source.js';
import { CURATED, curatedOf, twoForms, pairStory, ratioValue, curatedFacts, forms, litre, neighbours, getStage, setStage, onStage, tempC, litreText, specimenOf, radiusOf } from '../ui/comparePanel.js';
import { REFS } from '../content/patterns-refs.js';
import { pigment, pigmentCB } from '../../design/tokens.js';
import { PATTERNS_KEYS } from '../content/strings-patterns.js';

const ROOM = 293.15, K0 = 273.15, NB = ' ';
const gdpt = e => getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
const inSentence = e => (gdpt(e) ? e.names.viAlt[0] : name(e)).toLowerCase();
const atStart = e => cap(gdpt(e) ? e.names.viAlt[0] : name(e));
/**
 * °C as precise as the source: a tenth of a degree when the kelvin value has decimals (chlorine −101.5 °C),
 * whole degrees for whole kelvin, above 1,000 °C and for predictions (oganesson ≈ 52 °C, not 51.9).
 */
const ratioText = r => fmtNum(ratioValue(r), r < 10 ? 1 : 0);

export function buildCompare(ui, hooks = {}) {
  if (!PATTERNS_KEYS.length) throw new Error('patterns strings missing');
  const sh = sheet({ label: t('compare.label'), onClose: () => hooks.onBack && hooks.onBack(), closeLabel: t('card.close') });
  sh.el.classList.add('compare-sheet');
  // the stage's own control: a litre of each (state and heft) or one atom of each (size, to scale)
  const stageSeg = h('div', { class: 'compare-stage__seg' });
  const stageCap = h('p', { class: 'compare-stage__cap' });
  const stageBar = h('div', { class: 'compare-stage', hidden: true }, stageSeg, stageCap);
  const pairsLbl = h('span', { class: 'compare-pairs__lbl' });
  const pairs = h('div', { class: 'compare-pairs', role: 'toolbar' });
  const pickSlot = h('span', { class: 'compare-pairs__pick' }); // "Pick any two…": never scrolled out of view
  const pairsBox = h('div', { class: 'compare-pairsbox', hidden: true }, pairsLbl, h('div', { class: 'compare-pairs__row' }, pairs, pickSlot));
  ui.append(stageBar, pairsBox, sh.el);
  const pal = () => (state.cb ? pigmentCB : pigment);
  const A = () => byZ(state.Z), B = () => byZ(state.Z2 || state.Z);
  const formsNow = () => state.Z2 === state.Z && twoForms(state.Z);

  // ---- values: tappable, each opens its own source ---------------------------------------------------------
  const vBtn = (text, label, v, e, shown, pred) => h('button', { type: 'button', class: 'compare-v' + (pred ? ' is-est' : ''), onclick: ev => { closeRefs(); closePicker(); showSource(ev.currentTarget, label, v, e, shown ?? text); } }, text);
  const none = () => h('span', { class: 'compare-v is-none' }, t('card.notKnown'));
  const gasNote = d => [d[0], d[1], { ...(d[2] || {}), n: `${(d[2] && d[2].n) ? d[2].n + '; ' : ''}${getLang() === 'vi' ? `đổi sang 20${NB}°C theo định luật khí lí tưởng từ giá trị ở 0${NB}°C` : `scaled from the 0${NB}°C value to 20${NB}°C with the ideal-gas law`}` }];
  const stateV = (e, st) => [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
  /** One element's cell in a row: the plain value as the card writes it. */
  function cell(row, e) {
    const lab = `${atStart(e)} · ${rowLabel(row)}`;
    if (row === 'state') {
      const st = stateAt(e, ROOM);
      return st.s === 'unknown' ? none() : vBtn(cap(t('state.' + st.s)) + (st.p ? ` (${t('card.pred')})` : ''), lab, stateV(e, st), e, null, st.p);
    }
    if (row === 'melt') {
      const ph = e.ph;
      if (ph.noSolid) return vBtn(t('compare.neverFreezes'), lab, ph.noSolid, e, t('card.neverFreezes'));
      if (ph.sub && !propValue(e, 'mp')) return vBtn(t('compare.neverMelts'), `${atStart(e)} · ${t('f.sub')}`, ph.sub, e, `${t('card.sublimes', { T: tempC(ph.sub[0]) })} (${fmtTemp(ph.sub[0])})`);
      const v = propValue(e, 'mp');
      return v ? vBtn(tempC(v[0], isPred(v)), lab, v, e, fmtTemp(v[0]), isPred(v)) : none();
    }
    if (row === 'litre') {
      const l = litre(e);
      return l ? vBtn(litreText(l.kg, l.pred), lab, l.gas ? gasNote(l.v) : l.v, e, null, l.pred) : none();
    }
    const key = { size: 'rCov', touch: 'rVdw', grip: 'ie1', pull: 'en', appetite: 'ea', boil: 'bp', weight: 'aw', crust: 'abund', year: 'year' }[row];
    if (row === 'year') { const y = e.f.year; return y && y[0] != null ? vBtn(typeof y[0] === 'number' ? String(y[0]) : t('ancient'), lab, y, e) : none(); }
    const v = propValue(e, key);
    if (!v) return none();
    return vBtn(fmtRow(row, v), lab, v, e, row === 'boil' ? fmtTemp(v[0]) : null, isPred(v));
  }
  function fmtRow(row, v) {
    const x = v[0], pre = isPred(v) ? `≈${NB}` : '';
    switch (row) {
      case 'size': case 'touch': return `${pre}${fmtNum(x, 0)}${NB}pm`;
      case 'grip': case 'appetite': return `${pre}${fmtNum(x, 2, { minDigits: 2 })}${NB}eV`;
      case 'pull': return `${pre}${fmtNum(x, 2, { minDigits: 2 })}`;
      case 'boil': return tempC(x, isPred(v));
      case 'weight': return v[2] && v[2].mass ? `[${x}]` : fmtNum(x, x < 10 ? 3 : 2);
      case 'crust': return `${x >= 0.01 ? fmtNum(x, x < 1 ? 3 : x < 100 ? 1 : 0) : fmtSci(x, 2)}${NB}${t('compare.perTonne')}`;
      default: return `${pre}${fmtNum(x, 2)}`;
    }
  }
  const rowLabel = row => ({ state: t('card.sState'), melt: t('card.sMelts'), litre: t('card.sLitre'), size: t('lens.rCov'), touch: t('lens.rVdw'), grip: t('lens.ie1'), pull: t('lens.en'),
    appetite: t('lens.ea'), boil: t('lens.bp'), weight: t('lens.aw'), crust: t('lens.abund'), year: t('lens.year'), pattern: t('compare.row.pattern'), cn: t('compare.row.cn'), dnn: t('compare.row.dnn') }[row]);
  /** The jargon after the plain label; "gases at 20 °C" only when one of the two is a gas. */
  const rowCap = (row, a, b) => (row === 'litre' && a && b && [a, b].some(e => stateAt(e, ROOM).s === 'gas') ? t('compare.cap.litreGas') : t(`compare.cap.${row}`));

  // ---- the two solid forms of one element (carbon) ---------------------------------------------------------------
  function formCell(row, f, e) {
    const ph = f.phase, lab = r => `${t(`compare.form.${f.label}`)} · ${rowLabel(r)}`;
    if (row === 'pattern') return vBtn(cap(structText(f.name)), lab(row), [f.name, ph.cellSrc, { n: ph.cellNote }], e);
    if (row === 'cn') return vBtn(String(f.cn), lab(row), [f.cn, ph.sitesSrc, { n: t('compare.cnNote') }], e);
    if (row === 'dnn') return vBtn(`${fmtNum(f.dNN, 0)}${NB}pm`, lab(row), [f.dNN, ph.sitesSrc, { n: t('compare.dnnNote', { cell: ph.cellNote || '' }) }], e);
    const v = [f.kg, 'calc', { n: t('compare.calcDensity', { n: f.atoms, v: fmtNum(f.vol, 1), src: ph.cellNote || '' }) }];
    return vBtn(litreText(f.kg), lab('litre'), v, e);
  }

  // ---- the takeaway: why this pair is worth a look -----------------------------------------------------------------
  /** On "One atom of each" a litre sentence would describe what is not on screen: say how wide the atoms are
   *  instead (in the radius drawn), or that one size is not known (patterns review p3, c11). */
  function sizeLead(a, b) {
    const k = state.cmpR === 'vdw' ? 'vdw' : 'cov', ra = radiusOf(a, k), rb = radiusOf(b, k);
    if (!ra || !rb) return t('compare.s.sizeUnknown', { Name: atStart(!ra ? a : b) });
    const r = Math.max(ra[0], rb[0]) / Math.min(ra[0], rb[0]), big = ra[0] >= rb[0] ? a : b, small = big === a ? b : a;
    if (r < 1.05) return t('cmp.s.sameSize', { a: inSentence(a), b: inSentence(b) }).replace(/^./, c => c.toUpperCase());
    return t('compare.s.size', { Big: atStart(big), big: inSentence(big), small: inSentence(small), r: fmtNum(r, 1) });
  }
  const LITRE_LEADS = new Set(['heavier', 'same']); // stories told in litres
  function takeaway(a, b) {
    const cur = curatedOf(a.Z, b.Z);
    if (getStage() === 'atoms' && !formsNow() && ((cur && cur.id === 'he-os') || (!cur && LITRE_LEADS.has(pairStory(a, b).kind)))) return { lead: sizeLead(a, b), more: null, refs: null, cur: null };
    if (cur) {
      const f = curatedFacts(cur.id);
      const p = {};
      if (cur.id === 'he-os') { p.he = litreText(f.he.kg); p.os = litreText(f.os.kg); p.r = ratioText(f.r); p.air = fmtNum(Math.round(f.air), 0); }
      if (cur.id === 'na-cl') { p.na = `${fmtNum(f.na[0], 2, { minDigits: 2 })}${NB}eV`; p.cl = `${fmtNum(f.cl[0], 2, { minDigits: 2 })}${NB}eV`; }
      if (cur.id === 'c-c') { p.a = String(f.forms[0].cn); p.b = String(f.forms[1].cn); }
      if (cur.id === 'h-og') p.r = fmtNum(Number(f.r.toPrecision(2)), 0);
      return { lead: t(`compare.${cur.id}.lead`, p), more: t(`compare.${cur.id}.more`, p), refs: cur.refs, cur };
    }
    const s = pairStory(a, b);
    const q = { a: inSentence(a), b: inSentence(b), A: atStart(a) };
    let lead;
    switch (s.kind) {
      case 'firstLast': lead = t('compare.s.firstLast'); break;
      case 'bothLiquid': lead = t('compare.s.bothLiquid', q); break;
      case 'heavier': lead = t('compare.s.heavier', { heavy: inSentence(s.heavy), light: inSentence(s.light), r: ratioText(s.r) }); break;
      case 'states': lead = t('compare.s.states', { ...q, sa: t('pairState.' + s.sa), sb: t('pairState.' + s.sb) }); break;
      case 'same': lead = t('compare.s.same', q); break;
      case 'hotter': lead = t('compare.s.hotter', { Hot: atStart(s.hot), hot: inSentence(s.hot), cold: inSentence(s.cold), d: `${fmtNum(s.d, 0)}${NB}°C` }); break;
      case 'next': lead = t('compare.s.next', q); break;
      case 'family': lead = t('compare.s.family', q); break;
      case 'size': lead = s.r < 1.05 ? t('cmp.s.sameSize', { a: inSentence(a), b: inSentence(b) }).replace(/^./, c => c.toUpperCase()) : t('compare.s.size', { Big: atStart(s.big), big: inSentence(s.big), small: inSentence(s.small), r: fmtNum(s.r, 1) }); break;
      default: lead = t('compare.s.none', q);
    }
    return { lead, more: null, refs: null, cur: null };
  }

  // ---- sources of the sentences ----------------------------------------------------------------------------------
  let refPop = null;
  function closeRefs() { if (refPop) { refPop.remove(); refPop = null; } }
  document.addEventListener('pointerdown', ev => { if (refPop && !refPop.contains(ev.target) && !ev.target.closest('.compare-src')) closeRefs(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && refPop) { closeRefs(); ev.stopPropagation(); } });
  function showRefs(anchor, keys) {
    if (refPop) { closeRefs(); return; }
    closeSource(); closePicker();
    const items = keys.map(k => REFS[k]).filter(Boolean).map(r => {
      const s = r.data ? source(r.data) : r;
      return h('li', null, s.url ? h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name) : s.name);
    });
    refPop = h('div', { class: 'popover patterns-refs', role: 'dialog' }, h('button', { class: 'close', 'aria-label': t('sh.close'), onclick: closeRefs }, '×'),
      h('h4', null, t('patterns.refs')), h('ul', null, items), h('p', { class: 'patterns-refs__note' }, t('compare.refsData')));
    ui.append(refPop);
    const r = anchor.getBoundingClientRect(), pw = Math.min(420, window.innerWidth - 20);
    refPop.style.left = `${Math.min(Math.max(10, r.left - pw / 2), window.innerWidth - pw - 10)}px`;
    refPop.style.top = `${r.bottom + 8}px`;
    const ph = refPop.offsetHeight;
    if (r.bottom + 8 + ph > window.innerHeight - 10) refPop.style.top = `${Math.max(10, r.top - ph - 8)}px`;
    refPop.querySelector('.close').focus();
  }

  // ---- pick any two: a small finder for one side of the pair -------------------------------------------------------
  let picker = null;
  function closePicker() { if (picker) { picker.remove(); picker = null; } pairsBox.classList.remove('is-under'); }
  document.addEventListener('pointerdown', ev => { if (picker && !picker.contains(ev.target) && !ev.target.closest('.compare-slot,.compare-pick')) closePicker(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && picker) { closePicker(); ev.stopPropagation(); } });
  /** step 0: one slot ("change ▾": instead of this one); "Pick any two…" asks for both: step 1, then step 2. */
  function openPicker(anchor, slot, step = 0) {
    if (picker) { const was = picker.dataset.slot; closePicker(); if (was === slot) return; }
    closeRefs(); closeSource();
    const cur = slot === 'a' ? A() : B(), other = slot === 'a' ? B() : A();
    const input = h('input', { type: 'search', class: 'compare-find', autocomplete: 'off', spellcheck: 'false', placeholder: t('home.find'), 'aria-label': t('home.find') });
    const list = h('div', { class: 'compare-results', role: 'listbox' });
    const choose = e => {
      closePicker();
      if (slot === 'a') set({ Z: e.Z, ...(e.Z === state.Z2 && !twoForms(e.Z) ? { Z2: cur.Z } : {}) }); else set({ Z2: e.Z });
      // "Pick any two…": the first chosen, ask at once for the second (the rail has been re-rendered: find its chip again)
      if (step === 1) requestAnimationFrame(() => { const a2 = document.querySelector('.compare-pick'); if (a2) openPicker(a2, 'b', 2); });
    };
    const item = (e, extra) => h('button', { type: 'button', class: 'compare-result', role: 'option', onclick: () => choose(e) },
      h('span', { class: 'compare-result__sym', style: { background: pal()[e.f.cat[0]] } }, e.sym), h('span', { class: 'compare-result__name' }, atStart(e)), h('span', { class: 'compare-result__meta' }, extra || String(e.Z)));
    const fill = () => {
      const q = input.value.trim();
      if (q) { const found = search(q, 6).filter(e => e.Z !== other.Z || twoForms(e.Z)); replace(list, found.length ? found.map(e => item(e)) : h('p', { class: 'compare-results__none' }, t('search.none'))); return; }
      replace(list, h('p', { class: 'compare-results__lbl' }, t('compare.near', { name: atStart(other) })),
        neighbours(other).filter(n => n.e.Z !== cur.Z).map(n => item(n.e, t(`cmp.dir.${n.dir}`).replace(/\s+\S+$/, '')))); // the arrow only: ↑ ↓ ← →
    };
    input.addEventListener('input', fill);
    input.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { const first = list.querySelector('.compare-result'); if (first) first.click(); } if (ev.key === 'Escape') closePicker(); });
    const title = step === 1 ? t('compare.pickFirst') : step === 2 ? t('compare.pickSecond', { name: inSentence(other) }) : t('compare.instead', { name: atStart(cur) });
    picker = h('div', { class: 'ui-menu compare-picker', role: 'dialog', 'data-slot': slot }, h('h4', null, title), input, list);
    ui.append(picker);
    fill();
    // the finder opens beside the sheet, never over the rows it changes: to its left on desktop, above it on phones
    const W = window.innerWidth, H = window.innerHeight, sr = restRect(sh.el), r = anchor.getBoundingClientRect();
    if (isPhone()) {
      const w = W - 16;
      picker.style.width = `${w}px`; picker.style.left = '8px';
      picker.style.top = ''; picker.style.bottom = `${Math.round(H - sr.top + 8)}px`;
      picker.style.maxHeight = `${Math.round(sr.top - 70)}px`;
      pairsBox.classList.add('is-under'); // the rail would peek out beside it
    } else {
      const w = 320, hh = picker.offsetHeight;
      picker.style.width = `${w}px`;
      picker.style.left = `${Math.max(8, Math.round(sr.left - w - 14))}px`;
      if (anchor.closest('.compare-sheet')) { // from a tile: beside it, growing down
        picker.style.top = `${Math.round(Math.max(76, Math.min(r.top - 8, H - hh - 12)))}px`;
      } else { // from the rail: standing on its chip, so as the results narrow it shrinks toward the chip, off the stage's labels
        picker.style.top = ''; picker.style.bottom = `${Math.round(H - r.top + 10)}px`;
        picker.style.maxHeight = `${Math.round(r.top - 10 - 76)}px`;
      }
      input.focus({ preventScroll: true });
    }
  }
  /** Where a sliding panel will rest: its box without the slide-in transform it may still be animating. */
  function restRect(el) {
    const r = el.getBoundingClientRect(), tf = getComputedStyle(el).transform;
    const m = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf) : null;
    return m ? { left: r.left - m.m41, top: r.top - m.m42, right: r.right - m.m41, bottom: r.bottom - m.m42 } : r;
  }

  // ---- render --------------------------------------------------------------------------------------------------------
  function slot(e, which, label) {
    return h('button', { type: 'button', class: 'compare-slot', 'aria-label': t('compare.change', { name: label }), title: t('compare.change', { name: label }), onclick: ev => openPicker(ev.currentTarget, which) },
      h('span', { class: 'compare-slot__tile', style: { background: pal()[e.f.cat[0]] }, 'aria-hidden': 'true' }, h('small', null, String(e.Z)), e.sym),
      h('span', { class: 'compare-slot__name' }, label), h('span', { class: 'compare-slot__change', 'aria-hidden': 'true' }, `${t('compare.changeShort')}${NB}▾`));
  }
  function renderStage() {
    const fm = formsNow();
    stageBar.hidden = fm;
    if (fm) return;
    const m = getStage();
    replace(stageSeg, segmented({ label: t('compare.stage'), value: m, options: [{ id: 'litre', label: t('compare.stage.litre') }, { id: 'atoms', label: t('compare.stage.atoms') }], onPick: v => setStage(v) }));
    const els = [A(), B()], unknown = els.filter(e => specimenOf(e).kg == null);
    const litreCap = unknown.length // no weight, no balance: the specimens stand on plinths
      ? t(isPhone() ? 'compare.stage.noScaleShort' : 'compare.stage.noScale', { names: unknown.map(inSentence).join(t('compare.and')) })
      : t(isPhone() ? 'compare.stage.litreCapShort' : 'compare.stage.litreCap');
    replace(stageCap, m === 'litre' ? litreCap : t(state.cmpR === 'vdw' ? 'compare.stage.atomsCapVdw' : 'compare.stage.atomsCap'));
    if (modeRow) modeRow.hidden = m !== 'atoms'; // "draw the atoms" only where atoms are drawn
  }
  // the sheet rests on whole rows (CSS scroll snapping, patterns.css); its very end must be such a rest too, or a fling
  // to the bottom leaves the top row half under the compact title bar: pad the end by at most one row
  const SNAP = ':scope > *, .compare-row, .compare-bars, .ui-disclosure__summary';
  function alignEnd() {
    const b = sh.body;
    b.style.paddingBottom = '';
    const cs = getComputedStyle(b), base = parseFloat(cs.paddingBottom) || 0, pad = parseFloat(cs.scrollPaddingTop) || 0;
    const M = b.scrollHeight - b.clientHeight;
    if (M <= 0) return;
    const o = b.getBoundingClientRect().top - b.scrollTop;
    const next = [...b.querySelectorAll(SNAP)].map(el => el.getBoundingClientRect().top - o - pad).filter(v => v >= M - 0.5).sort((x, y) => x - y)[0];
    if (next != null && next - M > 0.5) b.style.paddingBottom = `${(base + next - M).toFixed(1)}px`;
  }
  const endRO = new ResizeObserver(() => requestAnimationFrame(alignEnd)); // the disclosure opening, the sheet pulled up
  endRO.observe(sh.body);
  let modeRow = null; // "Draw the atoms: when bonded | when touching", in All numbers (atom stage only)
  function render() {
    closeSource(); modeRow = null;
    const a = A(), b = B(), fm = formsNow();
    const F = fm ? forms(a) : null;
    const la = fm ? t(`compare.form.${F[0].label}`) : atStart(a), lb = fm ? t(`compare.form.${F[1].label}`) : atStart(b);
    const head = h('div', { class: 'compare-head' },
      slot(a, 'a', la),
      iconButton({ glyph: '⇄', label: t('compare.swap'), onClick: () => { if (!fm) set({ Z: b.Z, Z2: a.Z }); }, attrs: { class: 'ui-icon compare-swap', disabled: fm ? true : null } }),
      slot(b, 'b', lb));
    const tk = takeaway(a, b);
    const lead = h('p', { class: 'compare-lead' }, tk.lead);
    if (tk.refs) lead.append(' ', h('button', { type: 'button', class: 'compare-src', onclick: ev => showRefs(ev.currentTarget, tk.refs) }, t('patterns.source')));
    const more = tk.more ? h('p', { class: 'compare-more' }, tk.more) : null;
    // the plain rows: label (and its jargon), then each side
    const rows = fm ? ['pattern', 'cn', 'dnn', 'litre'] : ['state', 'melt', 'litre', 'size', 'grip'];
    const grid = h('div', { class: 'compare-rows', role: 'table' },
      h('div', { class: 'compare-row compare-row--head', role: 'row' }, h('span', { role: 'columnheader' }), h('span', { role: 'columnheader' }, la), h('span', { role: 'columnheader' }, lb)),
      rows.map(r => h('div', { class: 'compare-row', role: 'row' },
        h('span', { class: 'compare-row__lbl', role: 'rowheader' }, rowLabel(r), h('small', null, fm ? t(`compare.cap.${r === 'litre' ? 'litre' : r}`) : rowCap(r, a, b))),
        h('span', { role: 'cell' }, fm ? formCell(r, F[0], a) : cell(r, a)),
        h('span', { role: 'cell' }, fm ? formCell(r, F[1], a) : cell(r, b)))));
    const hint = h('p', { class: 'compare-hint' }, t('card.tapSource'));
    const all = fm ? null : disclosure({
      summary: t('card.all'),
      build: body => {
        // the size the stage draws: when bonded (covalent) or when touching (van der Waals)
        modeRow = h('div', { class: 'compare-mode', hidden: getStage() !== 'atoms' }, h('span', null, t('compare.drawn')),
          segmented({ label: t('compare.drawn'), value: state.cmpR === 'vdw' ? 'vdw' : 'cov', options: [{ id: 'cov', label: t('compare.bonded') }, { id: 'vdw', label: t('compare.touching') }], onPick: m => set({ cmpR: m }) }));
        body.append(modeRow);
        for (const r of ['size', 'touch', 'weight', 'grip', 'pull', 'appetite', 'boil', 'crust', 'year']) body.append(barRow(r, a, b));
      },
    });
    replace(sh.body, h('p', { class: 'compare-eyebrow' }, t('compare.eyebrow')), head, lead, more, grid, hint, all);
    for (const el of sh.body.children) endRO.observe(el);
    sh.setBar(h('span', { class: 'compare-bar' }, h('span', { class: 'compare-bar__tile', style: { background: pal()[a.f.cat[0]] } }, a.sym), h('b', null, `${la} · ${lb}`), h('span', { class: 'compare-bar__tile', style: { background: pal()[b.f.cat[0]] } }, b.sym)));
    requestAnimationFrame(sh.updateMore);
    renderStage();
    renderPairs(tk.cur);
    // phones: the sheet stands tall enough for the pair, the takeaway and the first rows (at most 52 % of the
    // screen); the rest scrolls, and pulling the handle up shows it all
    if (isPhone()) requestAnimationFrame(() => { if (sh.isOpen()) sh.setPeek(Math.min(grid.offsetTop + grid.offsetHeight + 34, window.innerHeight * 0.44)); placePairs(); sh.updateMore(); if (hooks.onLayout) hooks.onLayout(); });
    else { sh.setPeek(null); placePairs(); }
  }
  /** A row of "All numbers": both values with bars in proportion (the bigger one fills the track). */
  function barRow(row, a, b) {
    const key = { size: 'rCov', touch: 'rVdw', weight: 'aw', grip: 'ie1', pull: 'en', appetite: 'ea', boil: 'bp', crust: 'abund', year: 'year' }[row];
    const va = key === 'year' ? (typeof a.f.year[0] === 'number' ? a.f.year : null) : propValue(a, key), vb = key === 'year' ? (typeof b.f.year[0] === 'number' ? b.f.year : null) : propValue(b, key);
    const log = key === 'abund', sc = v => (v ? (log ? Math.log10(v[0]) + 14 : v[0]) : 0);
    const mx = Math.max(sc(va), sc(vb)) || 1;
    const w = v => (v ? `${Math.max(2, (100 * sc(v)) / mx).toFixed(1)}%` : '0');
    const ratio = va && vb && va[0] > 0 && vb[0] > 0 && key !== 'year' && key !== 'bp' ? Math.max(va[0], vb[0]) / Math.min(va[0], vb[0]) : null;
    const line = (e, v) => h('div', { class: 'compare-bars__line' }, h('span', { class: 'compare-bars__sym' }, e.sym),
      h('span', { class: 'compare-bars__track' }, h('span', { class: 'compare-bars__fill' + (v && isPred(v) ? ' is-pred' : ''), style: { width: key === 'year' ? (v ? '100%' : '0') : w(v), background: pal()[e.f.cat[0]] } })),
      cell(row, e));
    return h('div', { class: 'compare-bars' }, h('div', { class: 'compare-bars__lbl' }, h('span', null, rowLabel(row), h('small', null, rowCap(row))), ratio && ratio >= 1.05 ? h('span', { class: 'compare-bars__ratio' }, `×${ratioText(ratio)}`) : null),
      line(a, va), line(b, vb));
  }
  function renderPairs(cur) {
    replace(pairsLbl, t('compare.pairs'));
    const chips = CURATED.map(c => chip({ label: c.forms ? t('compare.c-c.chip') : `${atStart(bySym(c.a))} · ${atStart(bySym(c.b))}`, pressed: !!cur && cur.id === c.id,
      onClick: () => { closePicker(); closeRefs(); set({ Z: bySym(c.a).Z, Z2: bySym(c.b).Z }); } }));
    replace(pairs, ...chips);
    replace(pickSlot, chip({ label: `${t('compare.pick')}…`, attrs: { class: 'ui-chip compare-pick' }, onClick: ev => openPicker(ev.currentTarget, 'a', 1) }));
    pairs.setAttribute('aria-label', t('compare.pairs'));
    requestAnimationFrame(() => {
      // the chosen pair is always in view on a scrolling rail
      const on = pairs.querySelector('[aria-pressed="true"]');
      if (on && pairs.scrollWidth > pairs.clientWidth + 2) {
        const pad = 30, l = on.offsetLeft - pairs.offsetLeft, rr = l + on.offsetWidth;
        if (l - pad < pairs.scrollLeft) pairs.scrollLeft = Math.max(0, l - pad);
        else if (rr + pad > pairs.scrollLeft + pairs.clientWidth) pairs.scrollLeft = rr + pad - pairs.clientWidth;
      }
      fades();
    });
  }
  function fades() {
    const more = pairs.scrollWidth > pairs.clientWidth + 2;
    // a rail that scrolls fades at both ends, always: a chip never meets a hard edge (its padding keeps the first clear)
    pairs.classList.toggle('fade-l', more);
    pairs.classList.toggle('fade-r', more);
  }
  pairs.addEventListener('scroll', fades, { passive: true });
  /** Phones: the pair chips ride just above the sheet, whatever its height. */
  function placePairs() {
    if (!isPhone()) { pairsBox.style.removeProperty('bottom'); return; }
    pairsBox.style.bottom = `${Math.round(window.innerHeight - restRect(sh.el).top + 8)}px`;
  }
  const ro = new ResizeObserver(() => { if (sh.isOpen()) { placePairs(); if (hooks.onLayout) hooks.onLayout(); } });
  ro.observe(sh.el); ro.observe(pairsBox); ro.observe(stageBar);
  window.addEventListener('resize', () => { if (sh.isOpen()) { closePicker(); render(); } });
  onStage(() => { if (sh.isOpen()) { render(); if (hooks.onLayout) hooks.onLayout(); } }); // the headline follows the stage too

  /** The part of the screen the two specimens can use: beside the sheet (desktop) or above it (phones). */
  function safeArea() {
    const W = window.innerWidth, H = window.innerHeight;
    const topBar = (document.querySelector('.hero-top')?.getBoundingClientRect().bottom || 64) + 6;
    const top = stageBar.hidden ? topBar : Math.max(topBar, stageBar.getBoundingClientRect().bottom + 4);
    const rest = restRect(sh.el), pb = pairsBox.getBoundingClientRect();
    if (isPhone()) return { left: 0, right: 0, top, bottom: H - Math.min(rest.top, pb.top) + 6 };
    return { left: 0, right: W - rest.left + 12, top, bottom: H - pb.top + 10 };
  }

  return {
    el: sh.el,
    show(on) {
      if (!on) { if (sh.isOpen()) { sh.close(); closePicker(); closeRefs(); } pairsBox.hidden = true; stageBar.hidden = true; document.body.classList.remove('place-compare'); return; }
      document.body.classList.add('place-compare');
      pairsBox.hidden = false;
      render();
      if (!sh.isOpen()) sh.open();
    },
    onState(ch) {
      if (!sh.isOpen()) return;
      if (['Z', 'Z2', 'cmpR', 'cb', 'lang'].some(k => k in ch)) render();
    },
    safeArea,
  };
}
