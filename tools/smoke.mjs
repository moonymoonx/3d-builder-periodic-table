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
  await page.locator('.hero-lenses .ui-chip', { hasText: 'Heat map' }).click(); await settle();
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

await step('trends: pick a property, tap a dot to select that element', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'trends', Z: 26, lang: 'en' }));
  await settle();
  await page.locator('.chip.prop', { hasText: 'Melting point' }).click(); await page.waitForTimeout(200);
  const title = await page.locator('.chart-head h2').textContent();
  if (!/Melting point/.test(title)) throw new Error('title: ' + title);
  const box = await page.locator('.chart-svg circle[data-z="79"]').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(200);
  const Z = await page.evaluate(() => window.__pt.state.Z);
  if (Z !== 79) throw new Error('Z=' + Z);
  return title;
});
await step('trends: "See it as heights on the table" keeps the property', async () => {
  await page.getByRole('button', { name: 'See it as heights on the table' }).click(); await page.waitForTimeout(300);
  const st = await page.evaluate(() => ({ v: window.__pt.state.view, p: window.__pt.state.prop }));
  if (st.v !== 'table' || st.p !== 'mp') throw new Error(JSON.stringify(st));
});
await step('compare: partner chip, swap, radius toggle and sentences', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'compare', Z: 11, Z2: 29, cmpR: 'cov' }));
  await settle();
  await page.locator('.side.left .chip', { hasText: 'below K' }).click(); await page.waitForTimeout(250);
  let st = await page.evaluate(() => ({ Z: window.__pt.state.Z, Z2: window.__pt.state.Z2 }));
  if (st.Z2 !== 19) throw new Error('chip: ' + JSON.stringify(st));
  const s1 = await page.locator('.side.left p.why').first().textContent();
  if (!/Potassium atoms are 1\.\d+ times as wide as sodium atoms\./.test(s1)) throw new Error('sentence: ' + s1);
  await page.getByRole('button', { name: 'Swap' }).click(); await page.waitForTimeout(250);
  st = await page.evaluate(() => ({ Z: window.__pt.state.Z, Z2: window.__pt.state.Z2 }));
  if (st.Z !== 19 || st.Z2 !== 11) throw new Error('swap: ' + JSON.stringify(st));
  await page.locator('.side.left .seg button', { hasText: 'van der Waals' }).click(); await page.waitForTimeout(250);
  const s2 = await page.locator('.side.left p.why').first().textContent();
  if (s2 === s1) throw new Error('radius toggle did not change the size sentence');
  return s2;
});
await step('compare (VI): sentences use the familiar Vietnamese name too', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'compare', Z: 26, Z2: 29, cmpR: 'cov', lang: 'vi' }));
  await page.waitForTimeout(300);
  const s = await page.locator('.side.left p.why').first().textContent();
  await page.evaluate(() => window.__pt.set({ lang: 'en' }));
  if (!/iron \(sắt\)/.test(s) || !/copper \(đồng\)/.test(s)) throw new Error(s);
  return s;
});

await step('forge: the iron card door dives into the crystal; 930 °C re-stacks to 12 neighbours; back returns to the card', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'table', Z: 26, card: true, hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15 }));
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

// ---- atom ----
// "Look inside the atom" (PARALLEL.md scope 1): the porcelain place that replaces the old atom panels
const A = () => page.evaluate(() => ({ view: window.__pt.state.view, Z: window.__pt.state.Z, orbital: window.__pt.state.orbital, card: window.__pt.state.card,
  kiln: document.body.classList.contains('kiln'), title: document.querySelector('.atom-title')?.textContent || '', cap: document.querySelector('.atom-caption')?.textContent || '' }));
await step('atom place: the card door dives into the atom; its own card, no legacy panels', async () => {
  await page.evaluate(() => window.__pt.set({ view: 'table', Z: 26, card: true, hideSel: false, lens: 'families', color: 'cat', flat: true, T: 293.15, lang: 'en' }));
  await page.waitForTimeout(700);
  await page.locator('.ui-door', { hasText: 'Look inside the atom' }).click();
  await page.waitForFunction(() => window.__pt.state.view === 'atom', null, { timeout: 8000 });
  await settle(); await page.waitForTimeout(500);
  const a = await A();
  const chrome = await page.evaluate(() => ({ legacy: document.body.classList.contains('legacy'), place: document.body.classList.contains('place-atom'),
    side: !document.querySelector('.side.left') || document.querySelector('.side.left').hidden, sheet: !!document.querySelector('.atom-sheet:not([hidden])'), dots: window.__pt.E.active.info()?.mode }));
  if (a.title !== 'Inside iron' || !/26 electrons sit in 4 shells \(2, 8, 14, 2\)/.test(a.cap) || !/newest went into a 3d cloud/.test(a.cap)) throw new Error(JSON.stringify(a));
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
  if (cr.Z !== 24 || !/one more moved there from 4s/.test(cr.cap)) throw new Error(JSON.stringify(cr));
  await page.locator('.atom-step [data-step="1"]').click(); await page.waitForTimeout(400);
  const mn = await A();
  if (mn.Z !== 25 || !/newest went into a 4s cloud/.test(mn.cap)) throw new Error(JSON.stringify(mn));
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
  if (a !== '3d:1' || b !== '3p:1' || c.orbital !== '3p:all' || !/orb=3p%3Aall|orb=3p:all/.test(hash) || d.orbital !== null || !/All 3 3p clouds/.test(c.cap)) throw new Error(JSON.stringify({ a, b, c, hash, d }));
  return `${a} → ${b} → ${c.orbital}`;
});
await step('atom place: its light dims the room; the brightest line is described with its source; daylight returns', async () => {
  await page.locator('.atom-modes [data-mode="light"]').click(); await page.waitForTimeout(800);
  const on = await page.evaluate(() => ({ kiln: document.body.classList.contains('kiln'), band: !!document.querySelector('.atom-band:not([hidden]) .atom-spec__strip'), detail: document.querySelector('.atom-light__detail')?.textContent || '' }));
  if (!on.kiln || !on.band || !/387\.9 nm: violet light/.test(on.detail)) throw new Error(JSON.stringify(on));
  await page.locator('.atom-light__detail .atom-v').click();
  const pop = await page.locator('.popover').textContent();
  await page.keyboard.press('Escape');
  if (!/NIST/.test(pop)) throw new Error('source: ' + pop.slice(0, 80));
  await page.locator('.atom-band .atom-spec__strip').focus(); await page.keyboard.press('End'); await page.waitForTimeout(150);
  const last = await page.locator('.atom-light__detail').textContent();
  if (!/527\.0 nm: green light/.test(last)) throw new Error('arrow keys: ' + last);
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(700);
  const off = await page.evaluate(() => ({ kiln: document.body.classList.contains('kiln'), band: !document.querySelector('.atom-band') || document.querySelector('.atom-band').hidden }));
  if (off.kiln || !off.band) throw new Error(JSON.stringify(off));
  return on.detail.slice(0, 40);
});
await step('atom place: "About this atom" shows the arrangement and the nucleus, each value with its source', async () => {
  await page.locator('.atom-about .ui-disclosure__summary').click(); await page.waitForTimeout(200);
  const txt = await page.locator('.atom-facts').textContent();
  if (!/\[Ar\] 3d⁶ 4s²/.test(txt) || !/26 protons, 30 neutrons/.test(txt) || !/iron-56/.test(txt) || !/about 5\.4 of 26 protons \(4s\)/.test(txt)) throw new Error(txt.slice(0, 160));
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
    return { top: Math.round(s.top), h: Math.round(s.height), bandBottom: Math.round(b.bottom), bandW: Math.round(b.width), wide, scrollW: document.documentElement.scrollWidth };
  });
  await page.locator('.atom-modes [data-mode="atom"]').click(); await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1600, height: 900 }); await page.waitForTimeout(500);
  if (m.h > 844 * 0.62 || m.bandBottom > m.top || m.bandW > 390 || m.wide.length || m.scrollW > 390) throw new Error(JSON.stringify(m));
  return `sheet ${m.h}px from ${m.top}px; band ${m.bandW}px wide`;
});

for (const [ok, name, info] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
await browser.close();
process.exit(results.every(r => r[0]) && !errors.length ? 0 : 1);
