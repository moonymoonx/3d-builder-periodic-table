// Element card: what you see after tapping an element (REDESIGN-PLAN §2). A side card on desktop,
// a bottom sheet on phones. Calm and plain first: name, one human line, three facts with human anchors
// computed from our data, three doors; every value is tappable for its source, and "All numbers &
// sources" holds the complete sourced data sheet (nothing removed, only demoted).
// Phones (hero review r1): the three facts sit in one compact strip and the doors follow at once, and
// the sheet stands exactly tall enough to show the doors; the facts' longer notes come below.
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, cap, oneLine } from '../i18n.js';
import { state } from '../state.js';
import { byZ, bySym, name, altName, stateAt, propValue, isPred } from '../data.js';
import { sheet, door, fact, disclosure } from '../ui/kit.js';
import { valueBtn, rowsFor } from '../ui/sheet.js';
import { showSource, closeSource } from '../ui/source.js';
import { pigment, pigmentCB } from '../../design/tokens.js';

const ROOM = 293.15;
// "Side by side" partners (DESIGN-STUDY §4.7; hero review r1: familiar or surprising, never a plain
// neighbour nobody knows). Why the pair is worth a look is computed from our data (pairHook). Elements
// not listed get the element below (or above) them.
const PAIRS = {
  H: 'Og', Og: 'H', He: 'Os', Os: 'He', Li: 'Fe', Na: 'Cl', Cl: 'Na', K: 'Na', C: 'Si', Si: 'C', N: 'O', O: 'N', P: 'N', S: 'O', I: 'Cl',
  Al: 'Fe', Ti: 'Fe', Fe: 'Au', Co: 'Fe', Ni: 'Cu', Cu: 'Au', Zn: 'Cu', Ga: 'Hg', Br: 'Hg', Ag: 'Au', Sn: 'Pb', W: 'Au', Pt: 'Au',
  Au: 'Hg', Hg: 'Au', Pb: 'Au', U: 'Pb',
};
const degC = K => `${fmtNum(K - 273.15, Math.abs(K - 273.15) < 100 ? 1 : 0)} °C`.replace(/^-/, '−');
// names inside a sentence: lower case; Vietnamese uses the 13 familiar GDPT-2018 names (đồng, chì…)
const inSentence = x => (getLang() === 'vi' && x.names.viAlt && x.names.viAlt[1] === 'gdpt' ? x.names.viAlt[0] : name(x)).toLowerCase();

/** The element's first line: our hand-written line if there is one, else a plain sentence from data. */
export function lineFor(e) {
  if (e.line) return e.line[0][getLang()] || e.line[0].en;
  const fam = cap(t('famOne.' + e.f.cat[0]));
  if (e.Z >= 100 || e.lat.kind === 'predicted') return t('card.genMade', { Fam: fam });
  const st = stateAt(e, ROOM);
  if (st.s === 'unknown') return `${fam}.`;
  return t('card.gen', { Fam: fam, state: t('stateAdj.' + st.s) + (st.p ? ` (${t('card.pred')})` : '') });
}
export function partnerOf(e, fallback) {
  const s = PAIRS[e.sym];
  return s ? bySym(s).Z : fallback(e.Z);
}

// what a litre weighs in kg (gases at 20 °C, ideal-gas scaled from PubChem's 0 °C value); null if not measured
const litreKg = e => {
  const d = e.f.density;
  if (!d || d[0] == null || isPred(d)) return null;
  return stateAt(e, ROOM).s === 'gas' ? (d[0] * 273.15) / 293.15 : d[0];
};
const meltK = e => (e.ph.mp && e.ph.mp[0] != null && !isPred(e.ph.mp) ? e.ph.mp[0] : null);
const ratioText = r => (r < 10 ? fmtNum(r, 1) : r < 1000 ? fmtNum(r, 0) : fmtNum(Number(r.toPrecision(3)), 0));
/** Why a pair is worth a look, in a few words computed from measured values (never predictions). */
export function pairHook(e, p) {
  if ((e.Z === 1 && p.Z === 118) || (e.Z === 118 && p.Z === 1)) return t('pair.firstLast');
  const se = stateAt(e, ROOM), sp = stateAt(p, ROOM);
  const le = litreKg(e), lp = litreKg(p);
  const ratio = le && lp ? Math.max(le, lp) / Math.min(le, lp) : null;
  const heavier = () => t('pair.heavier', { name: inSentence(le > lp ? e : p), r: ratioText(ratio) });
  const known = s => s.s !== 'unknown' && !s.p;
  if (known(se) && known(sp)) {
    if (se.s === 'liquid' && sp.s === 'liquid') return t('pair.bothLiquid');
    if (ratio >= 100) return heavier();
    if (se.s !== sp.s) return t('pair.states', { a: t('pairState.' + se.s), b: t('pairState.' + sp.s) });
  }
  if (ratio && ratio < 1.03) return t('pair.same');
  if (ratio && ratio >= 1.5) return heavier();
  const me = meltK(e), mq = meltK(p);
  if (me && mq && Math.abs(me - mq) >= 300) return t('pair.hotter', { name: inSentence(me > mq ? e : p), d: `${fmtNum(Math.abs(me - mq), 0)} °C` });
  if (Math.abs(e.Z - p.Z) === 1) return t('pair.next');
  if (e.f.group[0] && e.f.group[0] === p.f.group[0]) return t('pair.family');
  return null;
}

export function buildElementCard(ui, hooks) {
  const sh = sheet({ label: t('card.label'), onClose: () => hooks.onClose(), closeLabel: t('card.close') });
  ui.append(sh.el);
  let lastZ = 0;

  const src = (label, v, e, shown) => ev => showSource(ev.currentTarget, label, v, e, shown);
  const valBtn = (text, label, v, e) => (v ? h('button', { type: 'button', class: 'card-v' + (isPred(v) ? ' is-est' : ''), onclick: src(label, v, e, text) }, text) : h('span', { class: 'card-v is-none' }, text));

  /** Where this melting point sits among familiar metals (all values from our data). */
  function meltAnchor(e, mpK) {
    const lm = ['Hg', 'Ga', 'Pb', 'Al', 'Cu', 'Fe', 'W'].map(sym => bySym(sym)).filter(x => x.Z !== e.Z)
      .map(x => ({ x, K: propValue(x, 'mp')[0] })).sort((a, b) => a.K - b.K);
    const lbl = m => `${inSentence(m.x)} (${degC(m.K)})`;
    if (e.sym === 'W') return t('card.hottest');
    const lo = [...lm].reverse().find(m => m.K < mpK), hi = lm.find(m => m.K > mpK);
    if (!lo) return t('card.coldest', { t: degC(lm[0].K) });
    if (!hi) return t('card.above', { lo: lbl(lo) });
    return t('card.hotCool', { lo: lbl(lo), hi: lbl(hi) });
  }
  /** Gases: where they turn liquid, next to liquid nitrogen (the cold most people have seen). */
  function ln2Anchor(e) {
    const n = bySym('N');
    if (e.Z === n.Z || !e.ph.bp || e.ph.bp[0] == null) return null;
    const d = e.ph.bp[0] - n.ph.bp[0];
    if (d < 0) return t('card.colderLN2', { t: degC(n.ph.bp[0]) });
    return d <= 20 ? t('card.warmerLN2', { t: degC(n.ph.bp[0]) }) : null;
  }

  /** The three facts as data: label/value/source for the card, a short label for the phone strip. */
  function factData(e) {
    const st = stateAt(e, ROOM), ph = e.ph;
    const out = [];
    // 1. state at room temperature
    const stV = [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
    out.push(st.s === 'unknown' ? { label: t('card.state'), short: t('card.sState'), none: t('card.notKnown') }
      : { label: t('card.state'), short: t('card.sState'), text: cap(t('state.' + st.s)) + (st.p ? ` (${t('card.pred')})` : ''), sText: cap(t('state.' + st.s)), v: stV, src: t('f.state') });
    // 2. melting (gases: where they turn liquid; some never melt or never freeze)
    if (ph.noSolid) {
      out.push({ label: t('card.melts'), text: t('card.neverFreezes'), v: ph.noSolid, src: t('f.mp'), note: t('card.boilsAt', { bp: degC(ph.bp[0]) }),
        short: t('card.sLiquid'), sText: degC(ph.bp[0]), sV: ph.bp, sSrc: t('f.bp'), phoneNote: t('card.neverFreezes') + '.', across: 'bp' });
    } else if (ph.sub) {
      out.push({ label: t('card.melts'), text: t('card.sublimes', { T: degC(ph.sub[0]) }), v: ph.sub, src: t('f.sub'),
        short: t('card.sGas'), sText: degC(ph.sub[0]), phoneNote: t('card.sublimes', { T: degC(ph.sub[0]) }) + '.', across: 'mp' });
    } else if (st.s === 'gas' && ph.bp && ph.bp[0] != null) {
      const pre = isPred(ph.bp) ? '≈ ' : '';
      out.push({ label: t('card.liquidAt'), text: pre + degC(ph.bp[0]), v: ph.bp, src: t('f.bp'), short: t('card.sLiquid'), across: 'bp',
        note: [ph.mp && ph.mp[0] != null ? t('card.freezesAt', { t: degC(ph.mp[0]) }) : null, ln2Anchor(e)].filter(Boolean).join(' · ') });
    } else if (ph.mp && ph.mp[0] != null) {
      const pre = isPred(ph.mp) ? '≈ ' : '', est = isPred(ph.mp) ? ` (${t('card.est')})` : '';
      out.push({ label: t('card.melts'), text: `${pre}${degC(ph.mp[0])}${est}`, sText: `${pre}${degC(ph.mp[0])}`, v: ph.mp, src: t('f.mp'), short: t('card.sMelts'), across: 'mp',
        note: [ph.bp && ph.bp[0] != null ? t('card.boilsAt', { bp: `${isPred(ph.bp) ? '≈ ' : ''}${degC(ph.bp[0])}` }) : null, meltAnchor(e, ph.mp[0])].filter(Boolean).join(' · ') });
    } else out.push({ label: t('card.melts'), short: t('card.sMelts'), none: t('card.notKnown') });
    // 3. heft: what a litre weighs
    const d = e.f.density, gas = st.s === 'gas';
    if (d && d[0] != null) {
      const est = isPred(d) ? '≈ ' : '';
      let text;
      if (gas) { const g = (d[0] * 1000 * 273.15) / 293.15; text = `${est}${fmtNum(g, g < 1 ? 2 : 1)} g`; }
      else text = `${est}${fmtNum(d[0], 1)} kg`;
      const v = gas ? [d[0], d[1], { ...(d[2] || {}), n: `${(d[2] && d[2].n) ? d[2].n + '; ' : ''}${getLang() === 'vi' ? 'đổi sang 20 °C theo định luật khí lí tưởng từ giá trị ở 0 °C' : 'scaled from the 0 °C value to 20 °C with the ideal-gas law'}` }] : d;
      out.push({ label: gas ? t('card.litreGas') : t('card.litre'), short: t('card.sLitre'), text, v, src: t('f.density'), across: 'density' });
    } else out.push({ label: t('card.litre'), short: t('card.sLitre'), none: t('card.notKnown') });
    return out;
  }
  const acrossKey = { mp: 'card.acrossMp', bp: 'card.acrossBp', density: 'card.acrossDensity' };

  function doors(e) {
    const shells = new Set(e.cfg.filter(x => x[2] > 0).map(x => x[0])).size;
    const nE = e.cfg.reduce((s, x) => s + x[2], 0);
    const st = stateAt(e, ROOM);
    const glows = e.lat.kind === 'lattice' && e.ph.mp && e.ph.mp[0] > 1000;
    const heatSub = e.lat.kind !== 'lattice' && st.s !== 'gas' ? t('card.heatCard') : st.s === 'gas' ? t('card.heatGas') : glows ? t('card.heatGlow') : t('card.heatSub');
    const partner = byZ(partnerOf(e, hooks.defaultPartner));
    const hook = pairHook(e, partner);
    return h('div', { class: 'card-doors' },
      door({ title: t('card.inside'), sub: t('card.insideSub', { n: nE, s: shells }), onClick: () => hooks.onDoor('atom') }),
      door({ title: st.s === 'gas' ? t('card.heatGasTitle') : t('card.heat'), sub: heatSub, onClick: () => hooks.onDoor('sample') }),
      door({ title: t('card.pair'), sub: hook ? t('card.pairSubHook', { name: inSentence(partner), hook }) : t('card.pairSub', { name: inSentence(partner) }), onClick: () => hooks.onDoor('compare', partner.Z) }));
  }

  function render() {
    closeSource();
    const e = byZ(state.Z);
    const phone = isPhone();
    const pal = state.cb ? pigmentCB : pigment;
    const swatch = pal[e.f.cat[0]];
    // Vietnamese: the 13 familiar names kept by GDPT-2018 head the card (Sắt), the international name follows
    const gdpt = getLang() === 'vi' && e.names.viAlt && e.names.viAlt[1] === 'gdpt';
    const title = gdpt ? cap(e.names.viAlt[0]) : name(e);
    const alt = gdpt ? name(e) : altName(e);
    const famName = oneLine(t('fam.' + e.f.cat[0]));
    const meta = [alt, `${e.sym} · ${t('card.number', { Z: e.Z })}`].filter(Boolean).join(' · ');
    const head = h('div', { class: 'card-head' },
      h('div', { class: 'card-tile', style: { background: swatch }, 'aria-hidden': 'true' }, h('small', null, String(e.Z)), e.sym),
      h('div', { class: 'card-title' },
        h('h2', { class: 'card-name' }, title),
        phone
          ? [h('p', { class: 'card-meta' }, `${meta} · `, h('span', { class: 'card-meta__fam' }, h('span', { class: 'ui-swatch', style: { background: swatch } }), famName)),
            h('p', { class: 'card-meta card-meta__cap' }, t('famCap.' + e.f.cat[0]))]
          : [h('p', { class: 'card-meta' }, meta),
            h('p', { class: 'card-family' }, h('span', { class: 'ui-swatch', style: { background: swatch } }), h('span', null, famName), h('span', { class: 'card-family__cap' }, t('famCap.' + e.f.cat[0])))]));
    const lead = h('p', { class: 'card-line' }, lineFor(e));
    if (e.line) lead.append(' ', h('button', { type: 'button', class: 'card-src', title: t('card.sourceOf'), onclick: src(t('card.sourceOf'), e.line, e, lineFor(e)) }, t('card.sourceOf')));
    const F = factData(e);
    const across = (prop, label) => h('button', { type: 'button', class: label ? 'ui-btn ui-btn--quiet card-across-row' : 'card-across', title: t('card.acrossLabel'), 'aria-label': label || t('card.acrossLabel'), onclick: () => hooks.onPattern(prop) }, label ? `↗ ${label}` : `↗ ${t('card.across')}`);
    const valueOf = (f, short) => (f.none ? h('span', { class: 'card-v is-none' }, f.none)
      : valBtn(short ? (f.sText || f.text) : f.text, short ? (f.sSrc || f.src) : f.src, short ? (f.sV || f.v) : f.v, e));
    const all = disclosure({
      summary: t('card.all'),
      build: body => {
        const dl = h('dl', { class: 'card-facts' });
        for (const r of rowsFor(e)) dl.append(h('dt', null, r.label), h('dd', null, valueBtn({ key: r.key, text: r.label }, r.v, e, r.text), r.extra || null));
        body.append(h('p', { class: 'card-hint' }, t('card.tapValue')), dl);
      },
    });
    const nav = h('div', { class: 'card-nav' },
      h('button', { type: 'button', class: 'ui-btn ui-btn--quiet', 'aria-label': t('card.prev'), onclick: () => hooks.onStep(-1) }, `‹ ${name(byZ(e.Z > 1 ? e.Z - 1 : 118))}`),
      h('button', { type: 'button', class: 'ui-btn ui-btn--quiet', 'aria-label': t('card.next'), onclick: () => hooks.onStep(1) }, `${name(byZ(e.Z < 118 ? e.Z + 1 : 1))} ›`));
    const doorBox = doors(e);
    if (phone) {
      const strip = h('div', { class: 'card-strip' }, F.map(f => h('div', { class: 'card-strip__cell' }, h('span', { class: 'card-strip__label' }, f.short), valueOf(f, true))));
      const tapHint = h('p', { class: 'card-hint card-hint--strip' }, t('card.tapSource'));
      const notes = F.map(f => f.phoneNote || f.note).filter(Boolean).map(n => h('p', { class: 'card-note' }, n));
      const links = [...new Set(F.map(f => f.across).filter(Boolean))].map(p => across(p, t(acrossKey[p])));
      replace(sh.body, head, lead, strip, tapHint, doorBox, h('div', { class: 'card-notes' }, notes, links), all, nav);
      sh.setFoot(null);
    } else {
      const list = h('div', { class: 'card-factlist' }, F.map(f => fact({ label: f.label, value: valueOf(f, false), note: f.note || null, link: f.across ? across(f.across) : null })));
      replace(sh.body, head, lead, list, doorBox, all);
      sh.setFoot(nav); // previous / next stay visible however long the card is
    }
    sh.setBar(h('span', { class: 'card-bar' }, h('span', { class: 'card-bar__tile', style: { background: swatch } }, e.sym), h('b', null, title), h('span', null, `${e.Z}`)));
    requestAnimationFrame(sh.updateMore);
    if (e.Z !== lastZ) { sh.body.scrollTop = 0; sh.el.classList.remove('is-scrolled'); lastZ = e.Z; }
    // phones: stand the sheet exactly tall enough to show the three doors (at most 62 % of the screen)
    if (phone) requestAnimationFrame(() => { if (sh.isOpen()) sh.setPeek(Math.min(doorBox.offsetTop + doorBox.offsetHeight + 40, window.innerHeight * 0.64)); });
    else sh.setPeek(null);
  }

  return {
    el: sh.el,
    open() { render(); sh.open(); },
    close() { closeSource(); sh.close(); },
    render,
    isOpen: sh.isOpen,
    setFull: sh.setFull,
  };
}
