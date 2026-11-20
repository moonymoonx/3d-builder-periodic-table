// Element card: what you see after tapping an element (REDESIGN-PLAN §2). A side card on desktop,
// a bottom sheet on phones. Calm and plain first: name, one human line, three facts with human anchors
// computed from our data, three doors; every value is tappable for its source, and "All numbers &
// sources" holds the complete sourced data sheet (nothing removed, only demoted).
import { h, replace, isPhone } from '../dom.js';
import { t, getLang, fmtNum, cap } from '../i18n.js';
import { state, set } from '../state.js';
import { byZ, bySym, name, altName, stateAt, fmtTemp, propValue, isPred } from '../data.js';
import { sheet, door, fact, disclosure } from '../ui/kit.js';
import { valueBtn, rowsFor } from '../ui/sheet.js';
import { showSource, closeSource } from '../ui/source.js';
import { pigment, pigmentCB } from '../../design/tokens.js';

const ROOM = 293.15;
// curated "surprising pairs" (DESIGN-STUDY §4.7); otherwise the element below or above
const PAIRS = { Au: 'Hg', Hg: 'Au', He: 'Os', Os: 'He', Na: 'Cl', Cl: 'Na', H: 'Og', Og: 'H' };
const degC = K => `${fmtNum(K - 273.15, Math.abs(K - 273.15) < 100 ? 1 : 0)} °C`.replace(/^-/, '−');

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
    // Vietnamese: the 13 familiar names kept by GDPT-2018 (đồng, chì, nhôm…), otherwise the IUPAC name
    const nm = x => (getLang() === 'vi' && x.names.viAlt && x.names.viAlt[1] === 'gdpt' ? x.names.viAlt[0] : name(x)).toLowerCase();
    const lbl = m => `${nm(m.x)} (${degC(m.K)})`;
    if (e.sym === 'W') return t('card.hottest');
    const lo = [...lm].reverse().find(m => m.K < mpK), hi = lm.find(m => m.K > mpK);
    if (!lo) return t('card.coldest', { t: degC(lm[0].K) });
    if (!hi) return t('card.above', { lo: lbl(lo) });
    return t('card.hotCool', { lo: lbl(lo), hi: lbl(hi) });
  }

  function facts(e) {
    const out = [];
    // 1. state at room temperature
    const st = stateAt(e, ROOM);
    const stV = [st.s, 'calc', { n: getLang() === 'vi' ? 'suy ra từ nhiệt độ nóng chảy / sôi ở 1 atm' : 'from the 1-atm melting and boiling points', p: st.p ? 1 : undefined }];
    out.push(fact({ label: t('card.state'), value: st.s === 'unknown' ? h('span', { class: 'card-v is-none' }, t('card.notKnown')) : valBtn(cap(t('state.' + st.s)) + (st.p ? ` (${t('card.pred')})` : ''), t('f.state'), stV, e) }));
    // 2. melting (or never freezes / sublimes)
    const ph = e.ph;
    const across = prop => h('button', { type: 'button', class: 'card-across', title: t('card.acrossLabel'), 'aria-label': t('card.acrossLabel'), onclick: () => hooks.onPattern(prop) }, `↗ ${t('card.across')}`);
    if (ph.noSolid) out.push(fact({ label: t('card.melts'), value: valBtn(t('card.neverFreezes'), t('f.mp'), ph.noSolid, e), note: t('card.boilsAt', { bp: degC(ph.bp[0]) }) }));
    else if (ph.sub) out.push(fact({ label: t('card.melts'), value: valBtn(t('card.sublimes', { T: degC(ph.sub[0]) }), t('f.sub'), ph.sub, e) }));
    else if (ph.mp && ph.mp[0] != null) {
      const est = isPred(ph.mp) ? ` (${t('card.est')})` : '';
      out.push(fact({ label: t('card.melts'), value: valBtn(`${isPred(ph.mp) ? '≈ ' : ''}${degC(ph.mp[0])}${est}`, t('f.mp'), ph.mp, e), link: across('mp'),
        note: [ph.bp && ph.bp[0] != null ? t('card.boilsAt', { bp: `${isPred(ph.bp) ? '≈ ' : ''}${degC(ph.bp[0])}` }) : null, meltAnchor(e, ph.mp[0])].filter(Boolean).join(' · ') }));
    } else out.push(fact({ label: t('card.melts'), value: h('span', { class: 'card-v is-none' }, t('card.notKnown')) }));
    // 3. heft: what a litre weighs (gases at 20 °C, ideal-gas scaled from PubChem's 0 °C values)
    const d = e.f.density;
    if (d && d[0] != null) {
      const gas = st.s === 'gas';
      const est = isPred(d) ? '≈ ' : '';
      let text;
      if (gas) { const g = d[0] * 1000 * (273.15 / 293.15); text = `${est}${fmtNum(g, g < 1 ? 2 : 1)} g`; }
      else text = `${est}${fmtNum(d[0], d[0] < 10 ? 1 : 1)} kg`;
      const v = gas ? [d[0], d[1], { ...(d[2] || {}), n: `${(d[2] && d[2].n) ? d[2].n + '; ' : ''}${getLang() === 'vi' ? 'đổi sang 20 °C theo định luật khí lí tưởng từ giá trị ở 0 °C' : 'scaled from the 0 °C value to 20 °C with the ideal-gas law'}` }] : d;
      out.push(fact({ label: gas ? t('card.litreGas') : t('card.litre'), value: valBtn(text, t('f.density'), v, e), link: across('density') }));
    } else out.push(fact({ label: t('card.litre'), value: h('span', { class: 'card-v is-none' }, t('card.notKnown')) }));
    return out;
  }

  function doors(e) {
    const shells = new Set(e.cfg.filter(x => x[2] > 0).map(x => x[0])).size;
    const nE = e.cfg.reduce((s, x) => s + x[2], 0);
    const st = stateAt(e, ROOM);
    const glows = e.lat.kind === 'lattice' && e.ph.mp && e.ph.mp[0] > 1000;
    const heatSub = e.lat.kind !== 'lattice' && st.s !== 'gas' ? t('card.heatCard') : st.s === 'gas' ? t('card.heatGas') : glows ? t('card.heatGlow') : t('card.heatSub');
    const partner = byZ(partnerOf(e, hooks.defaultPartner));
    const inSentence = x => (getLang() === 'vi' && x.names.viAlt && x.names.viAlt[1] === 'gdpt' ? x.names.viAlt[0] : name(x)); // GDPT-2018 familiar names
    return h('div', { class: 'card-doors' },
      door({ title: t('card.inside'), sub: t('card.insideSub', { n: nE, s: shells }), onClick: () => hooks.onDoor('atom') }),
      door({ title: t('card.heat'), sub: heatSub, onClick: () => hooks.onDoor('sample') }),
      door({ title: t('card.pair'), sub: t('card.pairSub', { name: inSentence(partner) }), onClick: () => hooks.onDoor('compare', partner.Z) }));
  }

  function render() {
    closeSource();
    const e = byZ(state.Z);
    const pal = state.cb ? pigmentCB : pigment;
    const alt = altName(e);
    const head = h('div', { class: 'card-head' },
      h('div', { class: 'card-tile', style: { background: pal[e.f.cat[0]] }, 'aria-hidden': 'true' }, h('small', null, String(e.Z)), e.sym),
      h('div', { class: 'card-title' },
        h('h2', { class: 'card-name' }, name(e)),
        h('p', { class: 'card-meta' }, [alt, `${e.sym} · ${t('card.number', { Z: e.Z })}`].filter(Boolean).join(' · ')),
        h('p', { class: 'card-family' }, h('span', { class: 'ui-swatch', style: { background: pal[e.f.cat[0]] } }), h('span', null, t('fam.' + e.f.cat[0]).replace(/\n/g, ' ')), h('span', { class: 'card-family__cap' }, t('famCap.' + e.f.cat[0])))));
    const lead = h('p', { class: 'card-line' }, lineFor(e));
    if (e.line) lead.append(' ', h('button', { type: 'button', class: 'card-src', 'aria-label': t('card.sourceOf'), title: t('card.sourceOf'), onclick: src(t('card.sourceOf'), e.line, e, lineFor(e)) }, '†'));
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
    replace(sh.body, head, lead, h('div', { class: 'card-factlist' }, facts(e)), doors(e), all, nav);
    if (e.Z !== lastZ) { sh.body.scrollTop = 0; lastZ = e.Z; }
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
