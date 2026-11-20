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

for (const [ok, name, info] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
await browser.close();
process.exit(results.every(r => r[0]) && !errors.length ? 0 : 1);
