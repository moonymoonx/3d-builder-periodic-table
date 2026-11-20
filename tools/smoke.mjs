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

await page.goto(`file://${ROOT}/index.html#v=table&el=Fe&lang=en`);
await page.waitForFunction(() => window.__pt && window.__pt.E.active, null, { timeout: 30000 });
await settle();

await step('tap a column selects it (H)', async () => {
  const pt = await page.evaluate(() => {
    const v = window.__pt.E.views.table, cam = window.__pt.E.camera;
    const p = v.columnTop(1).clone(); p.y -= 0.4; p.project(cam);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
  });
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(200);
  const z = await Z();
  if (z !== 1) throw new Error(`state.Z = ${z} after clicking H at ${Math.round(pt.x)},${Math.round(pt.y)}`);
  return `clicked at ${Math.round(pt.x)},${Math.round(pt.y)}`;
});
await step('hover shows a tooltip', async () => {
  const pt = await page.evaluate(() => {
    const v = window.__pt.E.views.table, cam = window.__pt.E.camera;
    const p = v.columnTop(79).clone(); p.y -= 0.3; p.project(cam);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
  });
  await page.mouse.move(pt.x, pt.y);
  await page.waitForTimeout(150);
  const tip = await page.evaluate(() => { const t = document.querySelector('.tooltip'); return t && !t.hidden ? t.textContent : null; });
  if (!tip || !/Au/.test(tip)) throw new Error('tooltip: ' + tip);
  return tip;
});
await step('accent-insensitive search: "sat" -> iron (sắt)', async () => {
  await page.fill('.search input', 'sat');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  if (await Z() !== 26) throw new Error('Z=' + await Z());
});
await step('search "natri" -> sodium', async () => {
  await page.fill('.search input', 'natri');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  if (await Z() !== 11) throw new Error('Z=' + await Z());
});
await step('search "79" -> gold', async () => {
  await page.fill('.search input', '79');
  await page.keyboard.press('Enter');
  if (await Z() !== 79) throw new Error('Z=' + await Z());
});
await step('keyboard → next element', async () => {
  await page.locator('#gl').focus();
  await page.keyboard.press('ArrowRight');
  if (await Z() !== 80) throw new Error('Z=' + await Z());
  await page.keyboard.press('ArrowUp');
  if (await Z() !== 48) throw new Error('ArrowUp: Z=' + await Z());
});
await step('tap a value shows its source', async () => {
  await page.locator('dl.facts button.v').nth(6).click();
  const txt = await page.locator('.popover').textContent();
  if (!/Source/.test(txt)) throw new Error(txt);
  await page.keyboard.press('Escape');
  return txt.slice(0, 80);
});
await step('layout 32 columns + helix morph without errors', async () => {
  await page.getByRole('button', { name: '32 columns' }).click(); await settle();
  await page.getByRole('button', { name: 'Helix' }).click(); await settle();
  const lay = await page.evaluate(() => window.__pt.state.layout);
  if (lay !== 'helix') throw new Error(lay);
  await page.getByRole('button', { name: '18 columns' }).click(); await settle();
});
await step('category filter dims others', async () => {
  await page.getByRole('button', { name: /Noble gas/ }).click();
  const f = await page.evaluate(() => [...(window.__pt.state.filters.cats || [])]);
  if (f.join() !== 'noble-gas') throw new Error(JSON.stringify(f));
  await page.getByRole('button', { name: 'Show all' }).click();
});
await step('switch to Vietnamese', async () => {
  await page.click('#btn-lang');
  await page.waitForTimeout(150);
  const lang = await page.evaluate(() => document.documentElement.lang);
  const tab = await page.locator('.tab').first().textContent();
  if (lang !== 'vi' || tab !== 'Bảng') throw new Error(`${lang} ${tab}`);
});
await step('credits modal lists sources', async () => {
  await page.click('#btn-credits');
  const rows = await page.locator('.modal tr').count();
  await page.keyboard.press('Escape');
  if (rows < 10) throw new Error('rows ' + rows);
  return `${rows - 1} sources`;
});
await step('URL hash is shareable', async () => {
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => location.hash);
  if (!/el=Cd/.test(h) || !/lang=vi/.test(h)) throw new Error(h);
  return h;
});

await step('atom view: open from the data sheet', async () => {
  await page.click('#btn-lang'); // back to English
  await page.evaluate(() => window.__pt.set({ Z: 23 }));
  await page.getByRole('button', { name: 'See its atom' }).click();
  await page.waitForFunction(() => window.__pt.E.active === window.__pt.E.views.atom, null, { timeout: 10000 });
  await settle();
});
await step('atom view: + proton V -> Cr reports the 3d/4s exception', async () => {
  await page.getByRole('button', { name: '+ proton' }).click();
  await page.waitForTimeout(300);
  const msg = await page.locator('.side.left .why').first().textContent();
  if (await Z() !== 24 || !/Surprise/.test(msg)) throw new Error(`Z=${await Z()} msg=${msg}`);
  await page.getByRole('button', { name: '+ proton' }).click(); // Mn: normal filling
  await page.waitForTimeout(300);
  const msg2 = await page.locator('.side.left .why').first().textContent();
  if (!/new electron goes into 4s/.test(msg2)) throw new Error(msg2); // Mn = [Ar] 3d5 4s2
  return msg.slice(0, 70);
});
await step('atom view: orbital chips and total density', async () => {
  await page.locator('.side.left .chip', { hasText: /^3d/ }).first().click(); await settle();
  await page.getByRole('button', { name: 'x²−y²' }).click(); await settle();
  if (!/3d:2/.test(await page.evaluate(() => window.__pt.state.orbital))) throw new Error(await page.evaluate(() => window.__pt.state.orbital));
  await page.getByRole('button', { name: 'All electrons' }).click(); await settle();
  if (await page.evaluate(() => window.__pt.state.density) !== 'total') throw new Error('density mode');
  await page.getByRole('button', { name: 'Orbitals' }).click(); await settle();
});
await step('atom view: tap a spectrum line shows its wavelength', async () => {
  const box = await page.locator('.specline').first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 3);
  const txt = await page.locator('.spectrum p').textContent();
  if (!/nm/.test(txt)) throw new Error(txt);
  return txt.slice(0, 60);
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

for (const [ok, name, info] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
await browser.close();
process.exit(results.every(r => r[0]) && !errors.length ? 0 : 1);
