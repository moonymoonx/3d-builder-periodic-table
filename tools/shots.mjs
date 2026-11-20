#!/usr/bin/env node
// Scripted screenshots + console-error check in headless Chromium (software WebGL via SwiftShader).
// Playwright is NOT a dependency of this repo: install it outside, e.g. ../tools-env (see README).
//   node tools/shots.mjs                 # full set (views x elements x EN/VI x desktop/phone)
//   node tools/shots.mjs --only=table-Fe # cases whose name contains the text
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PW = process.env.PLAYWRIGHT_DIR || path.resolve(ROOT, '../tools-env/node_modules/playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PT_BROWSERS || path.resolve(ROOT, '../tools-env/browsers');
const { chromium } = await import(path.join(PW, 'index.mjs'));

const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith('--only=')) || '').slice(7);
const OUT = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = { desk: { width: 1920, height: 1080 }, phone: { width: 390, height: 844 } };
const cases = [];
for (const sym of ['H', 'C', 'Fe', 'Au', 'U']) for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) {
  cases.push({ name: `table-${sym}-${lang}-${sz}`, hash: `v=table&el=${sym}&p=ie1&lay=s18&lang=${lang}`, vp });
}
for (const sym of ['H', 'C', 'Fe', 'Au', 'U']) for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) {
  cases.push({ name: `atom-${sym}-${lang}-${sz}`, hash: `v=atom&el=${sym}&lang=${lang}`, vp });
}
cases.push({ name: 'atom-Fe-total-en-desk', hash: 'v=atom&el=Fe&den=total&lang=en', vp: SIZES.desk });
cases.push({ name: 'atom-Fe-3dz2-en-desk', hash: 'v=atom&el=Fe&orb=3d:0&lang=en', vp: SIZES.desk });
cases.push({ name: 'atom-C-2p-surface-med-en-desk', query: 'q=med', hash: 'v=atom&el=C&orb=2p:1&lang=en', vp: SIZES.desk });
cases.push({ name: 'atom-Au-5dxy-surface-high-vi-desk', query: 'q=high', hash: 'v=atom&el=Au&orb=5d:-2&lang=vi', vp: SIZES.desk });
for (const sym of ['H', 'C', 'Fe', 'Au', 'U']) for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) {
  cases.push({ name: `sample-${sym}-${lang}-${sz}`, hash: `v=sample&el=${sym}&T=293.15&lang=${lang}`, vp });
}
cases.push({ name: 'sample-Fe-gamma-1300K-en-desk', hash: 'v=sample&el=Fe&T=1300&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-Fe-liquid-2200K-en-desk', hash: 'v=sample&el=Fe&T=2200&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-Fe-gas-3600K-vi-desk', hash: 'v=sample&el=Fe&T=3600&lang=vi', vp: SIZES.desk });
cases.push({ name: 'sample-W-glow-3200K-en-desk', hash: 'v=sample&el=W&T=3200&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-C-diamond-en-desk', hash: 'v=sample&el=C&T=293.15&alt=p1&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-He-2K-en-desk', hash: 'v=sample&el=He&T=2&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-N-gas-en-phone', hash: 'v=sample&el=N&T=300&lang=en', vp: SIZES.phone });
cases.push({ name: 'sample-Pu-beta-card-en-desk', hash: 'v=sample&el=Pu&T=420&lang=en', vp: SIZES.desk });
cases.push({ name: 'sample-Og-card-vi-desk', hash: 'v=sample&el=Og&T=293.15&lang=vi', vp: SIZES.desk });
for (const sym of ['H', 'C', 'Fe', 'Au', 'U']) for (const lang of ['en', 'vi']) {
  cases.push({ name: `trends-${sym}-${lang}-desk`, hash: `v=trends&el=${sym}&p=ie1&lang=${lang}`, vp: SIZES.desk });
  cases.push({ name: `compare-${sym}-${lang}-desk`, hash: `v=compare&el=${sym}&lang=${lang}`, vp: SIZES.desk });
}
for (const lang of ['en', 'vi']) {
  cases.push({ name: `trends-Fe-${lang}-phone`, hash: `v=trends&el=Fe&p=rCov&lang=${lang}`, vp: SIZES.phone });
  cases.push({ name: `compare-Fe-${lang}-phone`, hash: `v=compare&el=Fe&el2=Cu&lang=${lang}`, vp: SIZES.phone });
}
cases.push({ name: 'trends-density-log-group-en-desk', hash: 'v=trends&el=Os&p=density&log=1&line=group&lang=en', vp: SIZES.desk });
cases.push({ name: 'compare-Na-Cs-vdw-en-desk', hash: 'v=compare&el=Na&el2=Cs&rad=vdw&lang=en', vp: SIZES.desk });
cases.push({ name: 'table-layout32-en-desk', hash: 'v=table&el=Fe&p=rCov&lay=s32&lang=en', vp: SIZES.desk });
cases.push({ name: 'table-helix-en-desk', hash: 'v=table&el=Fe&p=en&lay=helix&lang=en', vp: SIZES.desk });
cases.push({ name: 'table-state-vi-desk', hash: 'v=table&el=Hg&p=mp&lay=s18&col=state&T=300&lang=vi', vp: SIZES.desk });
// quiz: a fresh visitor's first question, a miss with its smaller question, and reveals
for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) cases.push({ name: `quiz-first-${lang}-${sz}`, hash: `v=quiz&lang=${lang}`, vp });
const Q = (skill, tier, prefix, steps) => `(() => { const q = window.__pt.quiz; q._ask('${skill}', ${tier}, '${prefix}'); ${steps} })()`;
cases.push({ name: 'quiz-hint-big-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('trends', 1, 'big:', 'q._answer(false);') });
cases.push({ name: 'quiz-retry-big-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('trends', 1, 'big:', 'q._answer(false); q._answer(true, true);') });
cases.push({ name: 'quiz-reveal-big-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('trends', 1, 'big:', 'q._answer(true);') });
cases.push({ name: 'quiz-reveal-heat-Fe-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('states', 2, 'heat:26:liquid', 'q._answer(true);') });
cases.push({ name: 'quiz-hint-ie-vi-desk', hash: 'v=quiz&lang=vi', vp: SIZES.desk, act: Q('trends', 2, 'ie1:', 'q._answer(false);') });
cases.push({ name: 'quiz-hint-findZ-en-phone', hash: 'v=quiz&lang=en', vp: SIZES.phone, act: Q('table', 1, 'findZ:', 'q._answer(false);') });
cases.push({ name: 'quiz-cat-vi-phone', hash: 'v=quiz&lang=vi', vp: SIZES.phone, act: Q('categories', 1, 'cat:', '') });
cases.push({ name: 'quiz-tr-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('crystals', 2, 'tr:', 'q._answer(false);') });
cases.push({ name: 'quiz-exc-en-desk', hash: 'v=quiz&lang=en', vp: SIZES.desk, act: Q('orbitals', 2, 'exc:', '') });
cases.push({ name: 'table-density-log-en-phone', hash: 'v=table&el=Os&p=density&log=1&lay=s18&lang=en', vp: SIZES.phone });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let problems = 0;
for (const c of cases.filter(c => !only || c.name.includes(only))) {
  const page = await browser.newPage({ viewport: c.vp, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => logs.push(`pageerror: ${e.message}`));
  const t0 = Date.now();
  await page.goto(`file://${ROOT}/index.html${c.query ? '?' + c.query : ''}#${c.hash}`);
  await page.waitForFunction(() => window.__pt && window.__pt.E.active, null, { timeout: 30000 }).catch(() => logs.push('timeout: app did not start'));
  await page.waitForFunction(() => { const E = window.__pt?.E; return E && !E.rig.tween && E.anims.size === 0; }, null, { timeout: 30000 }).catch(() => logs.push('timeout: animations did not settle'));
  if (c.act) { // scripted steps (quiz): run in the page, then let the camera and animations settle again
    await page.evaluate(c.act).catch(e => logs.push('act failed: ' + e.message));
    await page.waitForTimeout(300);
    await page.waitForFunction(() => { const E = window.__pt?.E; return E && !E.rig.tween && E.anims.size === 0; }, null, { timeout: 30000 }).catch(() => logs.push('timeout: animations did not settle'));
  }
  await page.waitForTimeout(400);
  const file = path.join(OUT, `${c.name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  const info = await page.evaluate(() => ({ tier: window.__pt?.E.tier, gpu: window.__pt?.E.gpu, labels: [...document.querySelectorAll('.lbl')].filter(l => l.style.visibility === 'visible').length }));
  console.log(`${logs.length ? 'WARN' : 'ok  '} ${c.name}  ${Date.now() - t0} ms  tier=${info.tier} labels=${info.labels}`);
  for (const l of logs) console.log('     ', l);
  if (logs.some(l => !/^warning: .*(GPU stall|GL Driver Message|swiftshader|Automatic fallback to software WebGL)/i.test(l))) problems++;
  await page.close();
}
await browser.close();
console.log(problems ? `${problems} case(s) with console errors/warnings` : 'no console errors');
process.exit(problems ? 1 : 0);
