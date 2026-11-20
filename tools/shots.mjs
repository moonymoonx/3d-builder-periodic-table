#!/usr/bin/env node
// Scripted screenshots + console-error check in headless Chromium (software WebGL via SwiftShader).
// Playwright is NOT a dependency of this repo: install it outside, e.g. ../tools-env (see README).
//   node tools/shots.mjs                 # full set (views x elements x EN/VI x desktop/phone)
//   node tools/shots.mjs --only=table-Fe # cases whose name contains the text
// Options for before/after design comparisons (all opt-in):
//   --set=views        one shot per view in its default state (landing/table, atom, sample, trends, compare)
//   --serve            load the page from a local HTTP server on 127.0.0.1 instead of file://
//   --desk=1440x900 --phone=390x844   viewport sizes      --out=DIR   output folder      --png   lossless PNG
//   --fps=4            after each shot, render continuously for 4 s and report the app's frame statistics
//   --query=q=med      add a query string to every page (e.g. force a quality tier for review images)
//   --set=hero         the redesign's hero slice (landing, hover / thumb-scrub, cards, lenses, zoom, VI)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PW = process.env.PLAYWRIGHT_DIR || path.resolve(ROOT, '../tools-env/node_modules/playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PT_BROWSERS || path.resolve(ROOT, '../tools-env/browsers');
const { chromium } = await import(path.join(PW, 'index.mjs'));

const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const only = opt('only') || '';
const OUT = opt('out') ? path.resolve(opt('out')) : path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const wh = (v, d) => { const m = /^(\d+)x(\d+)$/.exec(v || ''); return m ? { width: +m[1], height: +m[2] } : d; };
const PNG = args.includes('--png');
const FPS_S = +(opt('fps') || 0);
const QUERY = opt('query');

const SIZES = { desk: wh(opt('desk'), { width: 1920, height: 1080 }), phone: wh(opt('phone'), { width: 390, height: 844 }) };
let cases = [];
for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) cases.push({ name: `home-${lang}-${sz}`, hash: `v=table&lang=${lang}`, vp, settle: 2600 });
for (const sym of ['H', 'C', 'Fe', 'Au', 'U']) for (const lang of ['en', 'vi']) for (const [sz, vp] of Object.entries(SIZES)) {
  cases.push({ name: `table-${sym}-${lang}-${sz}`, hash: `v=table&el=${sym}&card=1&lang=${lang}`, vp, settle: 1200 });
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
cases.push({ name: 'table-layout32-en-desk', hash: 'v=table&lens=rCov&lay=s32&lang=en', vp: SIZES.desk });
cases.push({ name: 'table-helix-en-desk', hash: 'v=table&lens=en&lay=helix&lang=en', vp: SIZES.desk });
cases.push({ name: 'table-heatmap-300K-vi-desk', hash: 'v=table&lens=heat&T=300&lang=vi', vp: SIZES.desk });
cases.push({ name: 'table-heft-en-phone', hash: 'v=table&lens=density&lang=en', vp: SIZES.phone });
cases.push({ name: 'heat-Fe-700C-en-desk', hash: 'v=heat&el=Fe&T=973.15&lang=en', vp: SIZES.desk, settle: 2400 });
cases.push({ name: 'heat-Fe-1600C-vi-phone', hash: 'v=heat&el=Fe&T=1873.15&lang=vi', vp: SIZES.phone, settle: 3200 });

if (opt('set') === 'views') { // default state of each view, as a first-time visitor sees it
  const tag = sz => `${sz === 'desk' ? 'desktop' : 'phone'}-${SIZES[sz].width}x${SIZES[sz].height}`;
  cases = [];
  for (const sz of ['desk', 'phone']) {
    cases.push({ name: `1-table-landing-${tag(sz)}`, hash: '', vp: SIZES[sz] });
    for (const [i, v] of ['atom', 'sample', 'trends', 'compare'].entries()) cases.push({ name: `${i + 2}-${v}-${tag(sz)}`, hash: `v=${v}`, vp: SIZES[sz] });
  }
}

if (opt('set') === 'hero') { // the redesign's hero slice: landing, table, first interaction (review set)
  const D = SIZES.desk, P = SIZES.phone;
  const top = (page, Z) => page.evaluate(z => { const s = window.__pt.table.screenOf(z); return { x: s.x, y: s.y + (window.innerWidth < 761 ? 2 : 10) }; }, Z);
  const touch = (page, type, x, y) => page.evaluate(([ty, px, py]) => {
    document.getElementById('gl').dispatchEvent(new PointerEvent(ty, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: px, clientY: py, bubbles: true, button: 0, buttons: ty === 'pointerup' ? 0 : 1 }));
  }, [type, x, y]);
  const tapTouch = async (page, Z) => { const p = await top(page, Z); await touch(page, 'pointerdown', p.x, p.y); await touch(page, 'pointerup', p.x, p.y); };
  const click = async (page, Z) => { const p = await top(page, Z); await page.mouse.move(p.x, p.y); await page.mouse.click(p.x, p.y); };
  const chipBtn = (page, label) => page.locator('.hero-lenses .ui-chip', { hasText: label }).first().click();
  const door = async page => { await page.locator('.ui-door', { hasText: /Hold a piece|Cầm một mẩu/ }).click(); };
  const heatTo = async (page, C, ms = 2200) => { await page.waitForTimeout(2400); await page.evaluate(T => window.__pt.set({ T }), C + 273.15); await page.waitForTimeout(ms); };
  cases = [
    { name: '01-first-load-desktop', vp: D, hash: '', settle: 2600 },
    { name: '01-first-load-phone', vp: P, hash: '', settle: 2600, touch: true },
    { name: '02-try-iron-hint-desktop', vp: D, hash: '', settle: 5600 },
    { name: '03-hover-gold-desktop', vp: D, hash: '', settle: 1600, act: async page => { const p = await top(page, 79); await page.mouse.move(p.x - 160, p.y - 90); await page.mouse.move(p.x, p.y, { steps: 10 }); } },
    { name: '03-thumb-scrub-phone', vp: P, hash: '', touch: true, settle: 1200, act: async page => {
      const a = await top(page, 22), b = await top(page, 26); await touch(page, 'pointerdown', a.x, a.y);
      for (let i = 1; i <= 6; i++) await touch(page, 'pointermove', a.x + ((b.x - a.x) * i) / 6, a.y + ((b.y - a.y) * i) / 6);
    } },
    { name: '04-card-iron-desktop', vp: D, hash: '', settle: 1900, act: page => click(page, 26) },
    { name: '04-card-iron-phone', vp: P, hash: '', touch: true, settle: 1900, act: page => tapTouch(page, 26) },
    { name: '05-card-gold-desktop', vp: D, hash: '', settle: 1900, act: page => click(page, 79) },
    { name: '05-card-gold-phone', vp: P, hash: '', touch: true, settle: 1900, act: page => tapTouch(page, 79) },
    { name: '06-card-gold-all-numbers-desktop', vp: D, hash: '', settle: 1600, act: async page => { await click(page, 79); await page.waitForTimeout(400); await page.locator('.ui-disclosure__summary').click(); await page.locator('.ui-sheet__body').evaluate(el => { el.scrollTop = 420; }); await page.mouse.move(700, 120); } }, // pointer off the card: no hover colour in the shot
    { name: '07-card-oxygen-gas-desktop', vp: D, hash: '', settle: 1900, act: page => click(page, 8) },
    { name: '08-lens-heat-1000C-desktop', vp: D, hash: '', settle: 1900, act: async page => { await chipBtn(page, 'Heat map'); await page.evaluate(() => window.__pt.set({ T: 1273.15 })); } },
    { name: '08-lens-heat-1000C-phone', vp: P, hash: '', touch: true, settle: 1900, act: async page => { await chipBtn(page, 'Heat map'); await page.evaluate(() => window.__pt.set({ T: 1273.15 })); } },
    { name: '09-lens-melting-desktop', vp: D, hash: '', settle: 2200, act: page => chipBtn(page, 'Melting point') },
    { name: '09-lens-heft-phone', vp: P, hash: '', touch: true, settle: 2200, act: page => chipBtn(page, 'Heft') },
    { name: '10-zoom-in-desktop', vp: D, hash: '', settle: 1500, act: async page => { const p = await top(page, 27); await page.mouse.move(p.x, p.y); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(60); } } },
    { name: '10-zoom-in-phone', vp: P, hash: '', touch: true, settle: 1500, act: page => page.evaluate(() => { window.__pt.E.rig.zoom(0.5); }) },
    { name: '11-vi-landing-desktop', vp: D, hash: 'lang=vi', settle: 2600 },
    { name: '11-vi-card-iron-phone', vp: P, hash: 'lang=vi', touch: true, settle: 1900, act: page => tapTouch(page, 26) },
    // the forge (Hold a piece · heat it), reached from the iron card's door with the scale dive
    // real in-flight frames of the dive: the page runs on Playwright's fake clock, paused, and is
    // advanced exactly clockAt ms after the tap (headless rendering is too slow to catch it otherwise)
    { name: '12a-forge-dive-into-tile-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, now: true, clockAt: 450, act: door },
    { name: '12b-forge-dive-out-of-crystal-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, now: true, clockAt: 1400, act: door },
    { name: '13-forge-start-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await door(page); await page.waitForTimeout(2600); } },
    { name: '13-forge-start-phone', vp: P, hash: 'el=Fe&card=1', touch: true, settle: 1500, act: async page => { await door(page); await page.waitForTimeout(2600); } },
    { name: '14-forge-700C-glow-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await door(page); await heatTo(page, 700); } },
    { name: '14-forge-700C-glow-phone', vp: P, hash: 'el=Fe&card=1', touch: true, settle: 1500, act: async page => { await door(page); await heatTo(page, 700); } },
    { name: '15-forge-930C-restacked-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await door(page); await heatTo(page, 930, 2800); } },
    { name: '16-forge-1600C-molten-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await door(page); await heatTo(page, 1300); await heatTo(page, 1600, 3200); } },
    { name: '16-forge-1600C-molten-phone', vp: P, hash: 'el=Fe&card=1', touch: true, settle: 1500, act: async page => { await door(page); await heatTo(page, 1300); await heatTo(page, 1600, 3200); } },
    { name: '17-forge-2950C-gas-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await door(page); await heatTo(page, 1600); await heatTo(page, 2950, 2500); } },
    { name: '18-forge-heat-it-playing-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, now: true, act: async page => { await door(page); await page.locator('.heat-play').click(); await page.waitForTimeout(6500); } },
  ];
}

// --serve: a tiny static server for index.html only, bound to this machine
let BASE = `file://${ROOT}`, server = null;
if (args.includes('--serve')) {
  server = http.createServer((req, res) => {
    const p = new URL(req.url, 'http://localhost').pathname;
    if (p !== '/' && p !== '/index.html') { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(ROOT, 'index.html')).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  BASE = `http://127.0.0.1:${server.address().port}`;
  console.log(`serving ${path.join(ROOT, 'index.html')} at ${BASE}/index.html`);
}
const fpsRows = [];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let problems = 0;
for (const c of cases.filter(c => !only || c.name.includes(only))) {
  const page = await browser.newPage({ viewport: c.vp, deviceScaleFactor: 1, hasTouch: !!c.touch });
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => logs.push(`pageerror: ${e.message}`));
  const t0 = Date.now();
  const qs = [c.query, QUERY].filter(Boolean).join('&');
  if (c.clockAt != null) await page.clock.install(); // time runs normally until paused
  await page.goto(`${BASE}/index.html${qs ? '?' + qs : ''}${c.hash ? '#' + c.hash : ''}`);
  await page.waitForFunction(() => window.__pt && window.__pt.E.active, null, { timeout: 30000 }).catch(() => logs.push('timeout: app did not start'));
  await page.waitForFunction(() => { const E = window.__pt?.E; return E && !E.rig.tween && E.anims.size === 0; }, null, { timeout: 30000 }).catch(() => logs.push('timeout: animations did not settle'));
  if (c.act && c.clockAt != null) { // pause time, act, advance exactly clockAt ms, shoot
    await page.waitForTimeout(c.settle || 400);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 50);
    await c.act(page).catch(e => logs.push('act failed: ' + e.message));
    await page.clock.runFor(c.clockAt);
  } else if (c.act) { // scripted steps: a function of the page (Playwright API) or a string run in the page
    await (typeof c.act === 'function' ? c.act(page) : page.evaluate(c.act)).catch(e => logs.push('act failed: ' + e.message));
  }
  if (c.act && !c.now && c.clockAt == null) { // c.now: shoot at once (mid-motion: the dive, "Heat it" playing)
    await page.waitForTimeout(300);
    await page.waitForFunction(() => { const E = window.__pt?.E; return E && !E.rig.tween && E.anims.size === 0; }, null, { timeout: 30000 }).catch(() => logs.push('timeout: animations did not settle'));
  }
  await page.waitForTimeout(c.now ? 0 : c.settle || 400);
  const file = path.join(OUT, `${c.name}.${PNG ? 'png' : 'jpg'}`);
  await page.screenshot(PNG ? { path: file, type: 'png' } : { path: file, type: 'jpeg', quality: 82 });
  if (FPS_S && c.clockAt != null) await page.clock.resume(); // real time again for the frame statistics
  if (FPS_S) { // the same numbers as the in-app meter (F key / ?stats): engine frame times while rendering continuously
    const st = await page.evaluate(async secs => {
      const E = window.__pt.E;
      E.frames.length = 0;
      const f0 = E.renderer.info.render.frame, t0 = performance.now();
      E.continuous.add('fps-probe');
      window.__pt.set({ fps: !window.__pt.state.fps }); // any state change wakes the render-on-demand loop
      await new Promise(r => setTimeout(r, secs * 1000));
      E.continuous.delete('fps-probe');
      const frames = E.renderer.info.render.frame - f0, dt = (performance.now() - t0) / 1000;
      const s = [...E.frames].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
      return { tier: E.tier, gpu: E.gpu || '', n: s.length, median: s.length ? q(0.5) : null, p95: s.length ? q(0.95) : null, avgFps: frames / dt };
    }, FPS_S).catch(e => { logs.push('fps probe failed: ' + e.message); return null; });
    if (st) fpsRows.push({ name: c.name, ...st });
  }
  const info = await page.evaluate(() => ({ tier: window.__pt?.E.tier, gpu: window.__pt?.E.gpu, labels: [...document.querySelectorAll('.lbl')].filter(l => l.style.visibility === 'visible').length }));
  console.log(`${logs.length ? 'WARN' : 'ok  '} ${c.name}  ${Date.now() - t0} ms  tier=${info.tier} labels=${info.labels}`);
  for (const l of logs) console.log('     ', l);
  if (logs.some(l => !/^warning: .*(GPU stall|GL Driver Message|swiftshader|Automatic fallback to software WebGL)/i.test(l))) problems++;
  await page.close();
}
await browser.close();
if (server) server.close();
if (fpsRows.length) {
  const fmt = x => (x == null ? '—' : x.toFixed(1));
  const lines = [`FPS (${FPS_S} s of continuous rendering per view; headless Chromium, ${fpsRows[0].gpu || 'unknown GPU'})`,
    'view'.padEnd(36) + 'tier  median ms  p95 ms  FPS (1000/median)  avg FPS',
    ...fpsRows.map(r => r.name.padEnd(36) + r.tier.padEnd(6) + fmt(r.median).padStart(9) + fmt(r.p95).padStart(8) + (r.median ? fmt(1000 / r.median) : '—').padStart(19) + fmt(r.avgFps).padStart(9))];
  console.log(lines.join('\n'));
  fs.writeFileSync(path.join(OUT, 'fps.txt'), lines.join('\n') + '\n');
}
console.log(problems ? `${problems} case(s) with console errors/warnings` : 'no console errors');
process.exit(problems ? 1 : 0);
