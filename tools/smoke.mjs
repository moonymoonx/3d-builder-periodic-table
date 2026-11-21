#!/usr/bin/env node
// Interaction smoke test in headless Chromium (SwiftShader). Fails on any console error or failed step.
//   node tools/smoke.mjs
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PW = process.env.PLAYWRIGHT_DIR || path.resolve(ROOT, '../tools-env/node_modules/playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PT_BROWSERS || path.resolve(ROOT, '../tools-env/browsers');
const { chromium } = await import(path.join(PW, 'index.mjs'));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
const results = [];
const step = async (name, fn) => {
  try { const r = await fn(); results.push([true, name, r ?? '']); } catch (e) { results.push([false, name, e.message.split('\n')[0]]); }
};
const settle = () => page.waitForFunction(() => { const E = window.__pt?.E; return E && !E.rig.tween && E.anims.size === 0; }, null, { timeout: 20000 });
const Z = () => page.evaluate(() => window.__pt.state.Z);

await page.goto(`file://${ROOT}/index.html#v=table&lang=en`);
await page.waitForFunction(() => window.__pt && window.__pt.E.active, null, { timeout: 30000 });
await settle();

const tileTop = Zt => page.evaluate(z => { const s = window.__pt.table.screenOf(z); return { x: s.x, y: s.y + 3 }; }, Zt);
const S = () => page.evaluate(() => ({ Z: window.__pt.state.Z, card: window.__pt.state.card, view: window.__pt.state.view, lens: window.__pt.state.lens }));

await step('landing: one prompt, lens chips; no tabs, legend or data sheet', async () => {
  const n = await page.evaluate(() => ({ tabs: document.querySelectorAll('.tab').length, legend: document.querySelectorAll('.legend').length,
    prompt: !!document.querySelector('.hero-prompt:not([hidden])'), chips: document.querySelectorAll('.hero-lenses .ui-chip').length,
    sheet: !document.querySelector('.side.right') || document.querySelector('.side.right').hidden }));
  if (n.tabs || n.legend || !n.prompt || n.chips !== 7 || !n.sheet) throw new Error(JSON.stringify(n));
  return `${n.chips} lens chips`;
});
await step('hover a tile shows its name', async () => {
  const p = await tileTop(79);
  await page.mouse.move(p.x, p.y); await page.waitForTimeout(250);
  const txt = await page.evaluate(() => [...document.querySelectorAll('.lbl.pop')].find(l => l.style.visibility === 'visible')?.textContent || '');
  if (!/Gold/.test(txt)) throw new Error('pop: ' + txt);
  return txt;
});
await step('tap a tile opens the element card (H)', async () => {
  const p = await tileTop(1);
  await page.mouse.click(p.x, p.y); await settle(); await page.waitForTimeout(300);
  const st = await S(); const nm = await page.locator('.card-name').textContent();
  if (st.Z !== 1 || !st.card || nm !== 'Hydrogen') throw new Error(JSON.stringify({ ...st, nm }));
  return `clicked at ${Math.round(p.x)},${Math.round(p.y)}`;
});
await step('accent-insensitive search: "sat" -> iron (sắt)', async () => {
  await page.locator('.hero-find input').fill('sat');
  const first = await page.locator('.hero-result').first().textContent();
  if (!/Iron/.test(first)) throw new Error(first);
  await page.locator('.hero-find input').press('Enter'); await settle();
  if ((await S()).Z !== 26) throw new Error('enter did not open iron');
});
await step('search "natri" -> sodium', async () => {
  await page.locator('.hero-find input').fill('natri');
  const first = await page.locator('.hero-result').first().textContent();
  await page.locator('.hero-find input').fill('');
  if (!/Sodium/.test(first)) throw new Error(first);
});
await step('search "79" -> gold', async () => {
  await page.locator('.hero-find input').fill('79');
  const first = await page.locator('.hero-result').first().textContent();
  await page.locator('.hero-find input').press('Escape');
  if (!/Gold/.test(first)) throw new Error(first);
});
await step('keyboard → next element updates the card', async () => {
  await page.locator('#gl').focus();
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
  const st = await S(); const nm = await page.locator('.card-name').textContent();
  if (st.Z !== 27 || nm !== 'Cobalt') throw new Error(JSON.stringify({ ...st, nm }));
});
await step('tap a card value shows its source', async () => {
  await page.locator('.card-v').nth(1).click();
  const txt = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape');
  if (!/Source/.test(txt)) throw new Error(txt.slice(0, 80));
  return txt.slice(0, 60);
});
await step('"All numbers & sources" keeps every sourced field', async () => {
  await page.locator('.ui-disclosure__summary').click(); await page.waitForTimeout(150);
  const n = await page.locator('.card-facts .v').count();
  if (n < 15) throw new Error(`${n} values`);
  return `${n} sourced values`;
});
await step('lens chips: heat map follows the temperature, melting point raises columns', async () => {
  if (await page.locator('[data-back=home]').count()) { await page.locator('[data-back=home]').click(); await settle(); } // chips live on the table without a card
  await page.locator('.hero-lenses .ui-chip', { hasText: 'Solid, liquid, gas' }).click(); await settle();
  await page.evaluate(() => window.__pt.set({ T: 2000 }));
  const a = await page.evaluate(() => ({ lens: window.__pt.state.lens, color: window.__pt.state.color, T: window.__pt.state.T, slider: !!document.querySelector('.hero-heat input[type=range]') }));
  await page.locator('.hero-lenses .ui-chip', { hasText: 'Melting point' }).click(); await settle();
  const b = await page.evaluate(() => ({ lens: window.__pt.state.lens, flat: window.__pt.state.flat, prop: window.__pt.state.prop, T: window.__pt.state.T }));
  await page.locator('.hero-lenses .ui-chip', { hasText: 'Families' }).click(); await settle();
  if (a.lens !== 'heat' || a.color !== 'state' || !a.slider || b.lens !== 'mp' || b.flat || b.prop !== 'mp' || b.T !== 293.15) throw new Error(JSON.stringify({ a, b }));
});
await step('menu: other shapes of the table (32 columns, helix) without errors', async () => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: '32 columns (wide)' }).click(); await settle();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Helix/ }).click(); await settle();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: '18 columns (standard)' }).click(); await settle();
});
await step('back link closes the card', async () => {
  if (!(await page.locator('[data-back=home]').count())) { const p = await tileTop(26); await page.mouse.click(p.x, p.y); await settle(); }
  await page.locator('[data-back=home]').click(); await settle();
  const st = await S();
  if (st.card) throw new Error(JSON.stringify(st));
});
await step('switch to Vietnamese and back', async () => {
  await page.locator('.hero-lang button', { hasText: 'VI' }).click(); await page.waitForTimeout(200);
  const w = await page.locator('.hero-word b').textContent();
  await page.locator('.hero-lang button', { hasText: 'EN' }).click(); await page.waitForTimeout(200);
  if (w !== 'Bảng tuần hoàn') throw new Error(w);
  return w;
});
await step('credits (menu) list the sources', async () => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Sources & credits' }).click();
  const rows = await page.locator('.modal tr').count();
  await page.keyboard.press('Escape');
  if (rows < 10) throw new Error(`${rows} rows`);
  return `${rows - 1} sources`;
});
await step('URL hash is shareable (lens + open card)', async () => {
  await page.evaluate(() => window.__pt.set({ lens: 'heat', color: 'state', T: 1000 }));
  await page.waitForTimeout(250); await settle(); // the heat banner changes the free area; the table is re-framed
  const p = await tileTop(79); await page.mouse.click(p.x, p.y); await page.waitForTimeout(600);
  const hash = await page.evaluate(() => location.hash);
  await page.evaluate(() => window.__pt.set({ lens: 'families', color: 'cat', T: 293.15 }));
  if (!/lens=heat/.test(hash) || !/card=1/.test(hash) || !/el=Au/.test(hash)) throw new Error(hash);
  return hash;
});
await step('sample view: Fe chips jump past each transition (γ-Fe, melts) and reset works', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'sample', Z: 26, T: 293.15, allotrope: null }));
  await settle();
  await page.locator('.chip.ev', { hasText: 'γ-Fe' }).click(); await page.waitForTimeout(300);
  const ph = await page.locator('.dock-phase').textContent();
  if (!/γ-Fe/.test(ph)) throw new Error('phase label: ' + ph);
  await page.locator('.chip.ev', { hasText: 'melts' }).click(); await page.waitForTimeout(300);
  const badge = await page.locator('.dock-state').textContent();
  if (!/liquid/i.test(badge)) throw new Error('badge: ' + badge);
  await page.getByRole('button', { name: 'Room temperature' }).click(); await page.waitForTimeout(200);
  if (await page.evaluate(() => window.__pt.state.T) !== 293.15) throw new Error('reset');
  return ph;
});
await step('sample view: carbon graphite <-> diamond toggle', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 6, T: 293.15 }));
  await page.waitForTimeout(300);
  await page.locator('.side.left .seg button', { hasText: 'diamond' }).click(); await page.waitForTimeout(300);
  const ph = await page.locator('.dock-phase').textContent();
  if (!/diamond/i.test(ph)) throw new Error(ph);
  await page.locator('.side.left .seg button', { hasText: 'graphite' }).click();
});
await step('sample view: helium stays liquid near 0 K, boils at 4.22 K', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 2, T: 2, allotrope: null })); await page.waitForTimeout(300);
  const a = await page.locator('.dock-state').textContent();
  await page.evaluate(() => window.__pt.set({ T: 10 })); await page.waitForTimeout(300);
  const b = await page.locator('.dock-state').textContent();
  if (!/liquid/i.test(a) || !/gas/i.test(b)) throw new Error(`${a} / ${b}`);
});
await step('sample view: "Heat it" raises the temperature', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 80, T: 293.15 })); await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Heat it/ }).click(); await page.waitForTimeout(1500);
  const T = await page.evaluate(() => window.__pt.state.T);
  await page.getByRole('button', { name: /Stop/ }).click();
  if (!(T > 300)) throw new Error('T=' + T);
  return `T rose to ${Math.round(T)} K`;
});

await step('forge chrome as the sample place\'s: ink 20 °C, no room button there; hot: ◀ Cool it and Room temperature; About this sample with sources; Escape closes it', async () => {
  await page.evaluate(() => { const p = window.__pt; p.set({ view: 'table', hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15 }); p.openCard(26); });
  await page.waitForTimeout(700);
  await page.locator('.ui-door', { hasText: 'Hold a piece' }).click();
  await page.waitForFunction(() => window.__pt.state.view === 'heat', null, { timeout: 8000 });
  await page.waitForTimeout(1400);
  const btns = () => page.evaluate(() => [...document.querySelectorAll('.heat-actions button')].map(b => b.textContent.trim()));
  const cold = await btns(), hotRead = await page.evaluate(() => document.querySelector('.heat-read').classList.contains('is-hot'));
  await page.evaluate(() => window.__pt.set({ T: 1873.15 })); await page.waitForTimeout(600);
  const hot = await btns();
  await page.locator('.heat-about').click(); await page.waitForTimeout(500);
  const rows = await page.locator('.heat-sheet .heat-facts').textContent();
  await page.locator('.heat-sheet .heat-v').nth(1).click(); await page.waitForTimeout(200);
  const pop = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ view: window.__pt.state.view, about: window.__pt.heat.aboutOpen() }));
  await page.locator('[data-back=card]').click(); await page.waitForTimeout(900);
  if (cold.join('|') !== 'Heat it ▶' || hotRead) throw new Error('at 20 °C: ' + JSON.stringify({ cold, hotRead }));
  if (!/Cool it/.test(hot.join('|')) || !/Room temperature/.test(hot.join('|'))) throw new Error('hot: ' + hot.join('|'));
  if (!/Melts at\D*1,538/.test(rows) || !/Source/.test(pop) || st.view !== 'heat' || st.about) throw new Error(JSON.stringify({ rows: rows.slice(0, 120), st }));
  return `${cold.join('|')} → ${hot.join('|')}`;
});
// (four legacy trends/compare steps retired at the patterns merge: the // ---- patterns ---- block covers them)
await step('forge: the iron card door dives into the crystal; 930 °C re-stacks to 12 neighbours; back returns to the card', async () => {
  await page.evaluate(() => { const p = window.__pt; p.set({ view: 'table', hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15 }); p.openCard(26); }); // the router's own way: a set({ card: true }) alone opens no card unless the view changes
  await page.waitForTimeout(700);
  await page.locator('.ui-door', { hasText: 'Hold a piece' }).click();
  await page.waitForFunction(() => window.__pt.state.view === 'heat', null, { timeout: 8000 });
  await page.waitForTimeout(1400);
  const start = await page.locator('.heat-caption').textContent();
  if (!/8 neighbours/.test(start)) throw new Error('start: ' + start);
  await page.evaluate(() => window.__pt.set({ T: 1203.15 })); // 930 °C, past the 912 °C transition
  await page.waitForTimeout(700);
  const cap = await page.locator('.heat-caption').textContent();
  const kiln = await page.evaluate(() => document.body.classList.contains('kiln'));
  if (!/912 °C/.test(cap) || !/12 neighbours/.test(cap)) throw new Error('caption: ' + cap);
  if (!kiln) throw new Error('the room did not dim');
  await page.locator('[data-back=card]').click(); await page.waitForTimeout(900);
  const v = await page.evaluate(() => ({ view: window.__pt.state.view, card: window.__pt.state.card, kiln: document.body.classList.contains('kiln') }));
  if (v.view !== 'table' || !v.card || v.kiln) throw new Error(JSON.stringify(v));
  return cap;
});

// ---- patterns ----
// Patterns across the table (places/patterns.js) and Side by side (places/compare.js), reached from the card.
const opened = sel => page.waitForFunction(s => { const el = document.querySelector(s); return el && !el.hidden; }, sel, { timeout: 8000 });
const beadAt = z => page.evaluate(n => { const r = document.querySelector(`.patterns-bead[data-z="${n}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, z);
await step('patterns: the card\'s "↗ across the table" opens a question-led chart; tungsten melts hottest', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'table', Z: 26, card: true, hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15, lang: 'en' }));
  await page.waitForTimeout(600);
  await page.locator('.card-across').first().click();
  await opened('.patterns'); await settle();
  const r = await page.evaluate(() => ({ view: window.__pt.state.view, prop: window.__pt.state.prop, q: document.querySelector('.patterns-q').textContent, a: document.querySelector('.patterns-a').textContent,
    beads: [...document.querySelectorAll('.patterns-bead')].filter(b => +b.getAttribute('opacity') > 0.5).length, notes: [...document.querySelectorAll('.patterns-note')].filter(n => !n.hidden).length,
    back: document.querySelector('[data-back=card]')?.textContent || '' }));
  if (r.view !== 'trends' || r.prop !== 'mp' || !/tungsten/.test(r.q) || !/3,422\s°C/.test(r.a) || r.beads < 100 || r.notes < 2 || !/Iron/.test(r.back)) throw new Error(JSON.stringify(r));
  return `${r.beads} dots, ${r.notes} notes`;
});
await step('patterns: tap a dot to pick it; its value opens its source', async () => {
  const b = await beadAt(79); await page.mouse.click(b.x, b.y); await page.waitForTimeout(250);
  if (await Z() !== 79) throw new Error('Z=' + await Z());
  const v = await page.locator('.patterns-pin .patterns-v').textContent();
  await page.locator('.patterns-pin .patterns-v').click();
  const txt = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape');
  if (!/1,064\s°C/.test(v) || !/Source/.test(txt) || !/1,337 K/.test(txt)) throw new Error(`${v} / ${txt.slice(0, 80)}`);
  return v;
});
await step('patterns: switch pattern, join down the columns, "More" holds the rest', async () => {
  await page.locator('.patterns-chips .ui-chip', { hasText: 'Grip on electrons' }).click(); await settle();
  const q = await page.locator('.patterns-q').textContent();
  const notes = await page.evaluate(() => [...document.querySelectorAll('.patterns-note')].map(n => n.textContent).join(' | '));
  await page.getByRole('button', { name: 'Down each column' }).click(); await page.waitForTimeout(200);
  const line = await page.evaluate(() => window.__pt.state.trendLine);
  await page.locator('.patterns-more').click();
  const items = await page.locator('.patterns-menu button').count();
  await page.locator('.patterns-menu button', { hasText: 'Electron pull' }).click(); await settle();
  const prop = await page.evaluate(() => window.__pt.state.prop);
  await page.getByRole('button', { name: 'Across each row' }).click();
  if (!/sodium/.test(q) || !/beryllium and nitrogen/.test(notes) || line !== 'group' || items !== 8 || prop !== 'en') throw new Error(JSON.stringify({ q, notes, line, items, prop }));
  return notes;
});
await step('patterns: "See it on the table" opens the matching lens; back from a chart restores the card', async () => {
  await page.locator('.patterns-totable').click(); await settle();
  const a = await page.evaluate(() => ({ view: window.__pt.state.view, lens: window.__pt.state.lens, prop: window.__pt.state.prop, flat: window.__pt.state.flat, card: window.__pt.state.card }));
  await page.evaluate(() => window.__pt.set({ view: 'trends', Z: 26, prop: 'density' })); await opened('.patterns'); await settle();
  await page.locator('[data-back=card]').click(); await settle();
  const b = await page.evaluate(() => ({ view: window.__pt.state.view, card: window.__pt.state.card, prop: window.__pt.state.prop, lens: window.__pt.state.lens }));
  if (a.view !== 'table' || a.lens !== 'en' || a.prop !== 'en' || a.flat || a.card || b.view !== 'table' || !b.card || b.prop !== 'en') throw new Error(JSON.stringify({ a, b }));
  await page.evaluate(() => window.__pt.set({ lens: 'families', color: 'cat', flat: true }));
});
await step('side by side: the iron card\'s door shows iron and gold, and says why', async () => {
  await page.evaluate(() => { const p = window.__pt; p.set({ view: 'table', hideSel: false }); p.openCard(26); }); // the router's own way: a set({ card: true }) alone opens no card unless the view changes
  await page.waitForTimeout(500);
  await page.locator('.ui-door', { hasText: 'Side by side' }).click();
  await opened('.compare-sheet'); await settle();
  const r = await page.evaluate(() => ({ view: window.__pt.state.view, Z2: window.__pt.state.Z2, lead: document.querySelector('.compare-lead').textContent, values: document.querySelectorAll('.compare-row .compare-v:not(.is-none)').length,
    names: [...document.querySelectorAll('.lbl.compare-name')].filter(l => l.style.visibility === 'visible').map(l => l.textContent) }));
  await page.locator('.compare-row .compare-v').nth(2).click();
  const src = await page.locator('.popover').textContent(); await page.keyboard.press('Escape');
  if (r.view !== 'compare' || r.Z2 !== 79 || !/gold/.test(r.lead) || !/2\.4/.test(r.lead) || r.values < 10 || r.names.length !== 2 || !/Source/.test(src)) throw new Error(JSON.stringify(r));
  return r.lead;
});
await step('side by side: curated pairs, swap, carbon\'s two forms, pick any two', async () => {
  await page.locator('.compare-pairs .ui-chip', { hasText: 'Gold · Mercury' }).click(); await settle();
  const lead = await page.locator('.compare-lead').textContent();
  await page.locator('.compare-swap').click(); await settle();
  const sw = await page.evaluate(() => [window.__pt.state.Z, window.__pt.state.Z2]);
  await page.locator('.compare-pairs .ui-chip', { hasText: 'Graphite · diamond' }).click(); await settle();
  const cc = await page.evaluate(() => ({ Z: window.__pt.state.Z, Z2: window.__pt.state.Z2, rows: [...document.querySelectorAll('.compare-row')].map(r => r.textContent).join(' | ') }));
  // "Pick any two…" asks for both: the first, then at once the second (patterns review p3)
  await page.locator('.compare-pick').click();
  const t1 = await page.locator('.compare-picker h4').textContent();
  await page.locator('.compare-find').fill('sod');
  await page.locator('.compare-result').first().click(); await page.waitForTimeout(400);
  const t2 = await page.locator('.compare-picker h4').textContent();
  await page.locator('.compare-find').fill('chl');
  await page.locator('.compare-result').first().click(); await settle();
  const z2 = await page.evaluate(() => (window.__pt.state.Z === 11 && window.__pt.state.Z2 === 17 ? 11 : [window.__pt.state.Z, window.__pt.state.Z2]));
  if (!/first of two/.test(t1) || !/second/.test(t2)) throw new Error(JSON.stringify({ t1, t2 }));
  if (!/One more proton/.test(lead) || sw[0] !== 80 || sw[1] !== 79 || cc.Z !== 6 || cc.Z2 !== 6 || !/Neighbours per atom\D*3\D*4/.test(cc.rows) || z2 !== 11) throw new Error(JSON.stringify({ lead, sw, cc, z2 }));
  return 'carbon: graphite 3, diamond 4 neighbours';
});
await step('side by side: a litre of each on a balance (state and heft), or one atom of each to scale', async () => {
  await page.locator('.compare-pairs .ui-chip', { hasText: 'Gold · Mercury' }).click(); await settle();
  const names = () => page.evaluate(() => [...document.querySelectorAll('.lbl.compare-name')].filter(l => l.style.visibility === 'visible').map(l => l.textContent).join(' | '));
  const litre = await names();
  await page.locator('.compare-stage button', { hasText: 'One atom of each' }).click(); await settle();
  const atoms = await names();
  await page.locator('.compare-stage button', { hasText: 'A litre of each' }).click(); await settle();
  if (!/solid\D*19\.3\skg/.test(litre) || !/liquid\D*13\.5\skg/.test(litre) || !/136\spm/.test(atoms)) throw new Error(JSON.stringify({ litre, atoms }));
  return litre;
});
await step('side by side (VI): sentences use the familiar Vietnamese names; sizes drawn when touching', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 26, Z2: 29, lang: 'vi' })); await settle();
  const lead = await page.locator('.compare-lead').textContent();
  await page.evaluate(() => window.__pt.set({ lang: 'en' })); await settle();
  // "Draw the atoms" lives with the atom stage (on the litre stage it would change what is not on screen)
  const hiddenOnLitre = await page.evaluate(() => { const m = document.querySelector('.compare-sheet .compare-mode'); return !m || m.hidden; });
  await page.locator('.compare-stage button', { hasText: 'One atom of each' }).click(); await settle();
  await page.locator('.compare-sheet .ui-disclosure__summary').click();
  await page.getByRole('button', { name: 'when touching' }).click(); await settle();
  const r = await page.evaluate(() => window.__pt.state.cmpR);
  await page.locator('.compare-stage button', { hasText: 'A litre of each' }).click(); await settle();
  if (!hiddenOnLitre) throw new Error('"Draw the atoms" shown on the litre stage');
  await page.locator('[data-back=card]').click(); await settle();
  const back = await page.evaluate(() => ({ view: window.__pt.state.view, card: window.__pt.state.card, Z: window.__pt.state.Z }));
  if (!/Sắt/.test(lead) || !/đồng/.test(lead) || r !== 'vdw' || back.view !== 'table' || !back.card || back.Z !== 26) throw new Error(JSON.stringify({ lead, r, back }));
  await page.evaluate(() => window.__pt.set({ cmpR: 'cov' }));
  return lead;
});
// ---- sample ----
// The sample place (places/sample.js, view 'hold'): liquids, gases and the honest cards in the forge's
// look. Needs the router lines in WIRING-sample.md.
const holdCaption = () => page.locator('.sample-caption').textContent();
const holdAt = async (patch, ms = 500) => { await page.evaluate(p => window.__pt.set(p), patch); await page.waitForTimeout(ms); };
await step('sample: the nitrogen card ("cool it") dives into the sample place; knob, bulb and room mark share one scale; cooled it turns liquid at −196 °C and freezes at −210 °C into one shown molecule; back returns to the card', async () => {
  await page.evaluate(() => { const p = window.__pt; p.set({ view: 'table', hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15 }); p.openCard(7); }); // the router's own way: a set({ card: true }) alone opens no card unless the view changes
  await page.waitForTimeout(700);
  await page.locator('.ui-door', { hasText: 'Hold a sample · cool it' }).click();
  await page.waitForFunction(() => window.__pt.state.view === 'hold', null, { timeout: 8000 });
  await page.waitForTimeout(300);
  const early = await page.evaluate(() => document.querySelector('.sample-panel').classList.contains('is-arriving')); // steps aside during the dive
  await page.waitForFunction(() => !document.querySelector('.sample-panel').classList.contains('is-arriving'), null, { timeout: 6000 });
  const start = await holdCaption();
  // plain words before the formula: "pairs of nitrogen atoms (N₂)"
  if (!early || !/pairs of nitrogen atoms \(N₂\)/.test(start) || !/km\/h/.test(start)) throw new Error(`arriving ${early}: ${start}`);
  // the knob, the bulb and the "room temperature" mark: one scale (the round-1 thumb sat ~12 px off)
  const al = await page.evaluate(() => {
    const tr = document.querySelector('.sample-track').getBoundingClientRect();
    const mid = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return r.left + r.width / 2 - tr.left; };
    return { knob: mid('.sample-knob'), bulb: mid('.sample-bulb'), room: (parseFloat(document.querySelector('.sample-flag.is-room').style.left) / 100) * tr.width };
  });
  if (Math.abs(al.knob - al.room) > 1.5 || Math.abs(al.bulb - al.room) > 1.5) throw new Error('alignment ' + JSON.stringify(al));
  await holdAt({ T: 73 });
  const liquid = await holdCaption();
  if (!/−196\s°C/.test(liquid) || !/turns liquid/.test(liquid)) throw new Error('liquid: ' + liquid);
  await holdAt({ T: 55 });
  const frozen = await holdCaption();
  const frozenWord = await page.locator('.sample-word').textContent();
  if (!/−210\s°C/.test(frozen) || !/freezes/.test(frozen) || !/One of them is shown/.test(frozen) || !/one molecule shown/.test(frozenWord)) throw new Error(`frozen: ${frozen} / ${frozenWord}`);
  // cold and frozen: the way up is the ink button, and below room temperature it reads "Warm it"
  const ink = await page.locator('.sample-actions .ui-btn--primary').textContent();
  const hot = await page.evaluate(() => document.querySelector('.sample-read').classList.contains('is-hot'));
  if (!/Warm it/.test(ink) || hot) throw new Error(`ink button ${ink}, ember readout ${hot}`);
  await page.locator('[data-back=card]').click(); await page.waitForTimeout(900);
  const v = await page.evaluate(() => ({ view: window.__pt.state.view, card: window.__pt.state.card, Z: window.__pt.state.Z }));
  if (v.view !== 'table' || !v.card || v.Z !== 7) throw new Error(JSON.stringify(v));
  return frozen.slice(0, 70);
});
await step('sample: mercury, a liquid at room temperature, freezes into its 6-neighbour crystal at −38.8 °C; "◀ Cool it" sweeps down', async () => {
  await holdAt({ view: 'hold', Z: 80, T: 293.15 }, 900);
  const word = await page.locator('.sample-word').textContent();
  if (!/liquid/.test(word)) throw new Error('word: ' + word);
  await holdAt({ T: 230 });
  const cap = await holdCaption();
  const kind = await page.evaluate(() => window.__pt.holdView.current().kind);
  const green = await page.locator('.sample-caption .sample-cell-word').textContent(); // the words name the green atoms
  if (!/−38\.8\s°C/.test(cap) || !/6 neighbours/.test(green) || kind !== 'solid') throw new Error(`${kind}: ${cap}`);
  await page.getByRole('button', { name: 'Room temperature' }).click(); await page.waitForTimeout(200);
  const roomGone = await page.getByRole('button', { name: 'Room temperature' }).count(); // nothing to return to at 20 °C
  const cool = page.getByRole('button', { name: /Cool it/ }), at = await cool.boundingBox();
  await cool.click(); await page.waitForTimeout(1200);
  const T = await page.evaluate(() => window.__pt.state.T), on = await holdCaption();
  // the pressed button stays under the mouse as "Pause" (the row does not re-centre beneath it)
  const under = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.textContent || '', [at.x + at.width / 2, at.y + at.height / 2]);
  await page.getByRole('button', { name: /Pause/ }).click();
  // on the way, the caption says what comes next (never a stale "at room temperature")
  if (!(T < 293) || roomGone || !/It freezes at −38\.8\s°C/.test(on) || !/Pause/.test(under)) throw new Error(`T=${T}, room button ${roomGone}, under the mouse "${under}": ${on}`);
  return `T fell to ${Math.round(T)} K: ${on}`;
});
await step('sample: helium never freezes: a whisker above absolute zero it is still liquid', async () => {
  await holdAt({ Z: 2, T: 3 }, 600);
  await holdAt({ T: 1.5 }, 600);
  const word = await page.locator('.sample-word').textContent(), cap = await holdCaption();
  if (!/liquid/.test(word) || !/never freezes/.test(cap)) throw new Error(`${word} / ${cap}`);
});
await step('sample: sulfur\'s crystal is not drawn: one ring of 8 atoms rests in its vessel; past 115 °C it melts into rings', async () => {
  await holdAt({ Z: 16, T: 293.15 }, 700);
  const start = await holdCaption(), word = await page.locator('.sample-word').textContent();
  const btns = await page.locator('.sample-actions .ui-btn').count();
  if (!/rings of 8 sulfur atoms \(S₈\)\. One of them is shown/.test(start) || !/one molecule shown/.test(word) || btns !== 1) throw new Error(`${word} / ${start} / ${btns} buttons`);
  await holdAt({ T: 400 });
  const cap = await holdCaption(), kind = await page.evaluate(() => window.__pt.holdView.current().kind);
  if (!/115\s°C/.test(cap) || !/rings of 8 sulfur atoms \(S₈\)/.test(cap) || kind !== 'liquid') throw new Error(`${kind}: ${cap}`);
});
await step('sample: manganese melts into a glowing liquid and the room dims like the forge', async () => {
  await holdAt({ Z: 25, T: 293.15 }, 600);
  await holdAt({ T: 1700 }, 900);
  const s = await page.evaluate(() => ({ kiln: document.body.classList.contains('kiln'), kind: window.__pt.holdView.current().kind }));
  const cap = await holdCaption();
  await holdAt({ T: 293.15 }, 700);
  const after = await page.evaluate(() => document.body.classList.contains('kiln'));
  if (!s.kiln || s.kind !== 'liquid' || !/glowing/.test(cap) || after) throw new Error(JSON.stringify({ ...s, cap, after }));
});
await step('sample: "About this sample" shows the gas speed with its method; Escape closes the source, then the card', async () => {
  await holdAt({ Z: 7, T: 293.15 }, 600);
  await page.locator('.sample-about').click(); await page.waitForTimeout(400);
  const v = page.locator('.sample-sheet .sample-v', { hasText: 'm/s' });
  const txt = await v.textContent();
  await v.click();
  const pop = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  const still = await page.evaluate(() => window.__pt.hold.aboutOpen());
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  const s = await page.evaluate(() => ({ open: window.__pt.hold.aboutOpen(), view: window.__pt.state.view }));
  const slow = await page.locator('.sample-sheet .sample-v', { hasText: 'billion' }).count(); // a human scale first: "about 330 billion times"
  if (!/511 m\/s/.test(txt) || !/3RT\/M/.test(pop) || !still || s.open || s.view !== 'hold' || !slow) throw new Error(JSON.stringify({ txt, pop: pop.slice(0, 60), still, slow, ...s }));
  return txt;
});
await step('sample: radon is drawn as a gas (only its crystal is a prediction)', async () => {
  await holdAt({ Z: 86, T: 293.15 }, 700);
  const kind = await page.evaluate(() => window.__pt.holdView.current().kind);
  if (kind !== 'gas') throw new Error(kind);
});
await step('sample: oganesson, never made in bulk: an honest card with sourced values and a door to its atom', async () => {
  await holdAt({ Z: 118, T: 293.15 }, 700);
  const title = await page.locator('.sample-never__title').textContent();
  const thermo = await page.locator('.sample-track').isVisible();
  if (!/Nobody has ever held a piece of oganesson/.test(title) || thermo) throw new Error(`${title} / thermometer ${thermo}`);
  // NUBASE2020: oganesson-294 (0.7 ± 0.3 ms) is the only confirmed kind; oganesson-295 (680 ± 540 ms) is listed
  // but not yet confirmed (data/curated/tentative-isotopes.json): the confirmed kind first, the other as a note
  const life = await page.locator('.sample-strip__cell').first().textContent();
  const note = await page.locator('.sample-never__note').textContent();
  if (!/0\.7\s±\s0\.3\smilliseconds/.test(life) || !/oganesson-294, the only confirmed kind/.test(life)) throw new Error('half-life: ' + life);
  if (!/oganesson-295/.test(note) || !/680\s±\s540\smilliseconds/.test(note) || !/not yet confirmed/.test(note)) throw new Error('note: ' + note);
  for (const sel of ['.sample-strip__cell .sample-v', '.sample-never__note .sample-v']) {
    await page.locator(sel).first().click();
    const pop = await page.locator('.popover').textContent();
    await page.keyboard.press('Escape');
    if (!/NUBASE/.test(pop)) throw new Error('source: ' + pop.slice(0, 80));
  }
  await page.locator('.sample-never .ui-door').click(); await page.waitForTimeout(500);
  const view = await page.evaluate(() => window.__pt.state.view);
  if (view !== 'atom') throw new Error('door: ' + view);
});
await step('sample (VI): the caption uses the familiar name (thuỷ ngân)', async () => {
  await holdAt({ view: 'hold', Z: 80, T: 293.15, lang: 'vi' }, 900);
  const cap = await holdCaption();
  await holdAt({ lang: 'en', view: 'table', card: false, T: 293.15 }, 500);
  if (!/^Thuỷ ngân ở nhiệt độ phòng/.test(cap)) throw new Error(cap);
  return cap.slice(0, 60);
});
// ---- atom ----
// "Look inside the atom" (PARALLEL.md scope 1): the porcelain place that replaces the old atom panels
const A = () => page.evaluate(() => ({ view: window.__pt.state.view, Z: window.__pt.state.Z, orbital: window.__pt.state.orbital, card: window.__pt.state.card,
  kiln: document.body.classList.contains('kiln'), title: document.querySelector('.atom-title')?.textContent || '', cap: document.querySelector('.atom-modebody')?.textContent || '' })); // round 3: one cloud's first sentence stands above its picker
await step('atom place: the card door dives into the atom; its own card, no legacy panels', async () => {
  await page.evaluate(() => { const p = window.__pt; p.set({ view: 'table', hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15, lang: 'en' }); p.openCard(26); }); // the router's own way: a set({ card: true }) alone opens no card unless the view changes
  await page.waitForTimeout(700);
  await page.locator('.ui-door', { hasText: 'Look inside the atom' }).click();
  await page.waitForFunction(() => window.__pt.state.view === 'atom', null, { timeout: 8000 });
  await settle(); await page.waitForTimeout(500);
  const a = await A();
  const chrome = await page.evaluate(() => ({ legacy: document.body.classList.contains('legacy'), place: document.body.classList.contains('place-atom'),
    side: !document.querySelector('.side.left') || document.querySelector('.side.left').hidden, sheet: !!document.querySelector('.atom-sheet:not([hidden])'), dots: window.__pt.E.active.info()?.mode }));
  if (a.title !== 'Inside iron' || !/26 electrons sit in 4 shells \(2, 8, 14, 2\)/.test(a.cap) || !/newest electron went into shell 3’s clover clouds \(3d\)/.test(a.cap)) throw new Error(JSON.stringify(a));
  if (chrome.legacy || !chrome.place || !chrome.side || !chrome.sheet || chrome.dots !== 'atom') throw new Error(JSON.stringify(chrome));
  return a.cap.slice(0, 70);
});
await step('atom place: + proton makes cobalt; vanadium to chromium explains the moved electron', async () => {
  await page.locator('.atom-step [data-step="1"]').click(); await page.waitForTimeout(400);
  const co = await A();
  if (co.Z !== 27 || co.title !== 'Inside cobalt' || !/\(2, 8, 15, 2\)/.test(co.cap)) throw new Error(JSON.stringify(co));
  await page.evaluate(() => window.__pt.set({ Z: 23 })); await page.waitForTimeout(300);
  await page.locator('.atom-step [data-step="1"]').click(); await page.waitForTimeout(400);
  const cr = await A();
  if (cr.Z !== 24 || !/A surprise: .*one more moved in from shell 4’s round cloud \(4s\)/.test(cr.cap)) throw new Error(JSON.stringify(cr));
  await page.locator('.atom-step [data-step="1"]').click(); await page.waitForTimeout(400);
  const mn = await A();
  if (mn.Z !== 25 || !/newest electron went into shell 4’s round cloud \(4s\)/.test(mn.cap)) throw new Error(JSON.stringify(mn));
  return cr.cap.slice(cr.cap.indexOf('The newest'), cr.cap.indexOf('The newest') + 70);
});
await step('atom place: one cloud picks a subshell and a turn; the link keeps it; whole atom returns', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 26 })); await page.waitForTimeout(300);
  await page.locator('.atom-modes [data-mode="cloud"]').click(); await page.waitForTimeout(400);
  const a = (await A()).orbital;
  await page.locator('.atom-pick [data-key="3p"]').click(); await page.waitForTimeout(300);
  await page.locator('.atom-pick [data-m="1"]').click(); await page.waitForTimeout(300);
  const b = (await A()).orbital;
  await page.locator('.atom-pick [data-m="all"]').click(); await page.waitForTimeout(400);
  const c = await A(); const hash = await page.evaluate(() => location.hash);
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(300);
  const d = await A();
  if (a !== '3d:1' || b !== '3p:1' || c.orbital !== '3p:all' || !/orb=3p%3Aall|orb=3p:all/.test(hash) || d.orbital !== null || !/All 3 of shell 3’s dumbbell clouds \(3p\)/.test(c.cap)) throw new Error(JSON.stringify({ a, b, c, hash, d }));
  return `${a} → ${b} → ${c.orbital}`;
});
await step('atom place: every shell count shows (on its globe or in the legend), a scale bar, a round nucleus factor', async () => {
  const w = await page.evaluate(() => ({ rings: [...document.querySelectorAll('.lbl.atom-ring')].filter(l => l.style.visibility === 'visible').map(l => l.textContent),
    legend: document.querySelector('.atom-legend')?.style.display !== 'none' ? document.querySelector('.atom-legend').textContent : '',
    ruler: document.querySelector('.atom-ruler b')?.textContent || '', nuc: [...document.querySelectorAll('.lbl.atom-tag')].map(l => l.textContent).find(x => /nucleus/.test(x)) || '' }));
  const all = w.legend ? /2 · 8 · 14 · 2/.test(w.legend) : ['2', '8', '14'].every(n => w.rings.includes(n)) && w.rings.some(x => /2 electrons/.test(x));
  const f = Number((/drawn ([\d,]+)× bigger/.exec(w.nuc) || [])[1]?.replace(/,/g, ''));
  if (!all || !/^\d[\d,]* pm$/.test(w.ruler) || !(f > 0) || !/^[125]0*$/.test(String(f))) throw new Error(JSON.stringify(w));
  return `${w.ruler}; ${w.nuc.replace('nucleus', '')}; ${w.legend || w.rings.join(' ')}`;
});
await step('atom place: one cloud of carbon: turns 1–3, named in words; a paper sheet where the 2p cloud is never found; uranium in plain words', async () => {
  await page.evaluate(() => window.__pt.set({ Z: 6 })); await page.waitForTimeout(400);
  await page.locator('.atom-modes [data-mode="cloud"]').click(); await page.waitForTimeout(500);
  const c = await page.evaluate(() => ({ turns: [...document.querySelectorAll('.atom-pick__turns [data-m]')].map(b => b.textContent), cap: document.querySelector('.atom-caption').textContent,
    sheets: (() => { let n = 0; window.__pt.E.active.scene.traverse(o => { if (o.isMesh && o.material.type === 'MeshBasicMaterial' && o.visible) n++; }); return n; })() }));
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(300);
  await page.evaluate(() => window.__pt.set({ Z: 92 })); await page.waitForTimeout(500);
  const u = await A();
  await page.evaluate(() => window.__pt.set({ Z: 26 })); await page.waitForTimeout(400);
  if (c.turns.join(' ') !== '1 2 3 all 3' || c.sheets !== 1 || !/paper sheet between them/.test(c.cap) || !/one electron sits in shell 6’s clover clouds \(6d\) instead of shell 5’s many-lobed clouds \(5f\)/.test(u.cap) || /→/.test(u.cap)) throw new Error(JSON.stringify({ c, u: u.cap }));
  return u.cap.slice(u.cap.indexOf('Uranium breaks'), u.cap.indexOf('Uranium breaks') + 120);
});
await step('atom place: its light dims the room; the brightest line is described with its source; daylight returns', async () => {
  await page.locator('.atom-modes [data-mode="light"]').click(); await page.waitForTimeout(800);
  const on = await page.evaluate(() => ({ kiln: document.body.classList.contains('kiln'), band: !!document.querySelector('.atom-band:not([hidden]) .atom-spec__strip'), detail: document.querySelector('.atom-light__detail')?.textContent || '',
    glow: window.__pt.E.active.scene.children.some(o => o.isMesh && o.visible && o.material.uniforms && o.material.uniforms.uProf) }));
  // round 2: the line that looks brightest (NIST transition rates × the eye's sensitivity), and the glow on
  if (!on.kiln || !on.band || !on.glow || !/538\.3 nm: green light/.test(on.detail) || !/its brightest line to the eye/.test(on.detail)) throw new Error(JSON.stringify(on));
  await page.locator('.atom-light__detail .atom-v').click();
  const pop = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape');
  if (!/NIST/.test(pop)) throw new Error('source: ' + pop.slice(0, 80));
  await page.locator('.atom-band .atom-spec__strip').focus(); await page.keyboard.press('End'); await page.waitForTimeout(150);
  const last = await page.locator('.atom-light__detail').textContent();
  if (!/561\.6 nm: yellow-green light/.test(last) || !/as bright to the eye as its brightest line/.test(last)) throw new Error('arrow keys: ' + last);
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(700);
  const off = await page.evaluate(() => ({ kiln: document.body.classList.contains('kiln'), band: !document.querySelector('.atom-band') || document.querySelector('.atom-band').hidden }));
  if (off.kiln || !off.band) throw new Error(JSON.stringify(off));
  return on.detail.slice(0, 40);
});
await step('atom place: "About this atom" shows the arrangement and the nucleus, each value with its source', async () => {
  await page.locator('.atom-about .ui-disclosure__summary').click(); await page.waitForTimeout(200);
  const txt = await page.locator('.atom-facts').textContent();
  if (!/\[Ar\] 3d⁶ 4s²/.test(txt) || !/26 protons, 30 neutrons/.test(txt) || !/iron-56/.test(txt) || !/about 5\.4 of 26 protons, in shell 4’s round cloud \(4s\)/.test(txt) || !/3\.74 fm \(measured\)/.test(txt)) throw new Error(txt.slice(0, 240));
  await page.locator('.atom-facts .atom-v').first().click();
  const pop = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape');
  if (!/Source/.test(pop)) throw new Error(pop.slice(0, 80));
  await page.locator('.atom-about .ui-disclosure__summary').click();
  return `${await page.locator('.atom-facts dd').count()} values`;
});
await step('atom place: → steps the atom, Esc returns to the card of the element on screen', async () => {
  await page.locator('#gl').focus();
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
  const a = await A();
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const b = await A();
  if (a.Z !== 27 || a.view !== 'atom' || b.view !== 'table' || !b.card || b.Z !== 27) throw new Error(JSON.stringify({ a, b }));
});
await step('atom place (VI): the familiar name, and every string translated', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'atom', Z: 26, orbital: null, lang: 'vi' })); await page.waitForTimeout(800);
  const v = await page.evaluate(() => ({ title: document.querySelector('.atom-title').textContent, all: document.querySelector('.atom-sheet').textContent, lbls: [...document.querySelectorAll('.lbl')].filter(l => l.style.visibility === 'visible').map(l => l.textContent).join(' | ') }));
  await page.evaluate(() => window.__pt.set({ lang: 'en' })); await page.waitForTimeout(300);
  if (!/sắt/.test(v.title) || /atom\.[a-z]/.test(v.all + v.lbls) || !/hạt nhân/.test(v.lbls)) throw new Error(JSON.stringify(v).slice(0, 200));
  return v.title;
});
await step('atom place (phone): the sheet stands under the atom, the band above it, nothing wider than the screen', async () => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(900);
  await page.locator('.atom-modes [data-mode="light"]').click(); await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const s = document.querySelector('.atom-sheet').getBoundingClientRect(), b = document.querySelector('.atom-band').getBoundingClientRect();
    const wide = [...document.querySelectorAll('#ui *')].filter(el => el.offsetParent && el.getBoundingClientRect().right > window.innerWidth + 1).map(el => el.className).slice(0, 3);
    const d = document.querySelector('.atom-light__detail').getBoundingClientRect(), f = document.querySelector('.atom-sheet .ui-sheet__foot').getBoundingClientRect();
    return { top: Math.round(s.top), h: Math.round(s.height), bandBottom: Math.round(b.bottom), bandW: Math.round(b.width), wide, scrollW: document.documentElement.scrollWidth, detail: Math.round(d.bottom), foot: Math.round(f.top) };
  });
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1600, height: 900 }); await page.waitForTimeout(500);
  if (m.h > 844 * 0.62 || m.bandBottom > m.top || m.bandW > 390 || m.wide.length || m.scrollW > 390 || m.detail > m.foot) throw new Error(JSON.stringify(m));
  return `sheet ${m.h}px from ${m.top}px; band ${m.bandW}px wide`;
});

for (const [ok, name, info] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
await browser.close();
process.exit(results.every(r => r[0]) && !errors.length ? 0 : 1);
