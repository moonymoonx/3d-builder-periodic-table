// --set=pass3: finishing pass 3, the four layout fixes from reviews/final-f4.md §2 (items 1–4):
// the forge's About drawer beside the thermometer (desktop), the atom's scale-bar note on phones (360–430 px),
// One cloud's rows at the bottom of the card / sheet, and the phone table landing.
// Run with --desk=1440x900 --phone=390x844; the 360×740 and 430×932 phones are fixed here.
// Loaded by the generic set loader in tools/shots.mjs.
export function cases({ SIZES }) {
  const D = SIZES.desk, P = SIZES.phone, S = { width: 360, height: 740 }, L = { width: 430, height: 932 };
  const tag = vp => `${vp.width}x${vp.height}`;
  const forge = async page => { await page.locator('.ui-sheet:not([hidden]) .ui-door').nth(1).click(); await page.waitForTimeout(2600); };
  const about = async page => { await page.locator('.heat-about').click(); await page.waitForTimeout(900); await page.mouse.move(4, 400); };
  const intoAtom = async page => {
    await page.locator('.ui-door', { hasText: /Look inside the atom|Nhìn vào bên trong/ }).click();
    await page.waitForFunction(() => window.__pt.state.view === 'atom', null, { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.mouse.move(4, 400);
  };
  const mode = (page, id) => page.locator(`.atom-modes [data-mode="${id}"]`).click();
  const plus = page => page.locator('.atom-step [data-step="1"]').click();
  const settle = async page => { await page.mouse.move(4, 400); await page.waitForTimeout(1600); };
  const cloud = async page => { await intoAtom(page); await mode(page, 'cloud'); await settle(page); };
  /** One cloud with its card / sheet scrolled to the end: every row must be reachable above the footer. */
  const cloudEnd = async page => {
    await cloud(page);
    await page.evaluate(() => document.querySelectorAll('.ui-sheet:not([hidden]) .ui-sheet__body').forEach(n => { if (n.scrollHeight > n.clientHeight + 2) n.scrollTop = n.scrollHeight; }));
    await page.waitForTimeout(500);
  };
  const out = [];
  // 1. forge About (desktop: the drawer and the thermometer side by side; phones: no regression)
  for (const vp of [D, P, S]) {
    out.push({ name: `1-forge-about-${tag(vp)}`, vp, touch: vp !== D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await forge(page); await about(page); } });
    out.push({ name: `1-forge-about-hot-${tag(vp)}`, vp, touch: vp !== D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await forge(page); await page.evaluate(() => window.__pt.set({ T: 1873.15 })); await page.waitForTimeout(3000); await about(page); } });
  }
  out.push({ name: `1-forge-start-${tag(D)}`, vp: D, hash: 'el=Fe&card=1', settle: 1500, act: forge });
  // 2. the atom's scale-bar note on phones (Whole atom: iron, chromium, VI iron; 360 / 390 / 430 wide) + desktop
  for (const vp of [P, S, L]) {
    out.push({ name: `2-atom-iron-${tag(vp)}`, vp, touch: true, hash: 'el=Fe&card=1', settle: 1500, act: intoAtom });
    out.push({ name: `2-atom-chromium-${tag(vp)}`, vp, touch: true, hash: 'el=V&card=1', settle: 1500, act: async page => { await intoAtom(page); await plus(page); await settle(page); } });
  }
  out.push({ name: `2-atom-vi-iron-${tag(S)}`, vp: S, touch: true, hash: 'el=Fe&card=1&lang=vi', settle: 1500, act: intoAtom });
  out.push({ name: `2-atom-uranium-${tag(S)}`, vp: S, touch: true, hash: 'el=U&card=1', settle: 1500, act: intoAtom });
  out.push({ name: `2-atom-iron-${tag(D)}`, vp: D, hash: 'el=Fe&card=1', settle: 1500, act: intoAtom });
  // 3. One cloud: top and scrolled to the end (phones and desktop)
  for (const vp of [D, P, S]) {
    out.push({ name: `3-one-cloud-${tag(vp)}`, vp, touch: vp !== D, hash: 'el=Fe&card=1', settle: 1500, act: cloud });
    out.push({ name: `3-one-cloud-end-${tag(vp)}`, vp, touch: vp !== D, hash: 'el=Fe&card=1', settle: 1500, act: cloudEnd });
  }
  out.push({ name: `3-one-cloud-vi-end-${tag(S)}`, vp: S, touch: true, hash: 'el=Fe&card=1&lang=vi', settle: 1500, act: cloudEnd });
  // 4. the table landing (phones: legible; desktop: unchanged) + a tap on a phone tile opens its card
  for (const vp of [D, P, S]) out.push({ name: `4-table-landing-${tag(vp)}`, vp, touch: vp !== D, hash: '', settle: 2600 });
  out.push({ name: `4-table-landing-vi-${tag(P)}`, vp: P, touch: true, hash: 'lang=vi', settle: 2600 });
  out.push({ name: `4-table-heat-${tag(P)}`, vp: P, touch: true, hash: 'lens=heat&T=1273.15', settle: 2600 });
  out.push({ name: `4-table-landscape-844x390`, vp: { width: 844, height: 390 }, touch: true, hash: '', settle: 2600 });
  return out;
}
