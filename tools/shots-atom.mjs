// --set=atom: "Look inside the atom" (PARALLEL.md scope 1), reached the real way: tap the card's door.
// Loaded by the generic set loader in tools/shots.mjs (moved out of shots.mjs at the merge).
export function cases({ SIZES }) {
  const D = SIZES.desk, P = SIZES.phone;
  const intoAtom = async page => {
    await page.locator('.ui-door', { hasText: /Look inside the atom|Nhìn vào bên trong/ }).click();
    await page.waitForFunction(() => window.__pt.state.view === 'atom', null, { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.mouse.move(4, 400); // pointer off the card: no hover colour in the shot
  };
  const mode = (page, id) => page.locator(`.atom-modes [data-mode="${id}"]`).click();
  const plus = page => page.locator('.atom-step [data-step="1"]').click();
  const at = (page, Z) => page.evaluate(z => window.__pt.set({ Z: z }), Z);
  const settle = async page => { await page.mouse.move(4, 400); await page.waitForTimeout(1600); }; // pointer off the controls: no hover colour
  /** Tap the band at a wavelength (a pointer pick: no keyboard focus ring). */
  const tapLine = async (page, nm) => {
    const b = await page.locator('.atom-band .atom-spec__strip').boundingBox();
    await page.mouse.click(b.x + ((nm - 380) / 370) * b.width, b.y + b.height / 2);
  };
  return [
    { name: 'atom-01a-dive-into-tile-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, now: true, clockAt: 500, act: page => page.locator('.ui-door', { hasText: 'Look inside the atom' }).click() },
    { name: 'atom-01b-dive-out-through-shells-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, now: true, clockAt: 1450, act: page => page.locator('.ui-door', { hasText: 'Look inside the atom' }).click() },
    { name: 'atom-02-iron-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: intoAtom },
    { name: 'atom-02-iron-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: intoAtom },
    { name: 'atom-03-plus-proton-cobalt-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await intoAtom(page); await plus(page); await settle(page); } },
    { name: 'atom-04-chromium-surprise-desktop', vp: D, hash: 'el=V&card=1', settle: 1500, act: async page => { await intoAtom(page); await plus(page); await settle(page); } },
    { name: 'atom-04-chromium-surprise-phone', vp: P, hash: 'el=V&card=1', settle: 1500, touch: true, act: async page => { await intoAtom(page); await plus(page); await settle(page); } },
    { name: 'atom-04b-chromium-electron-moves-desktop', vp: D, hash: 'el=V&card=1', settle: 1500, clockAt: 700, act: async page => { await page.clock.resume(); await intoAtom(page); const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(now + 50); await plus(page); } },
    { name: 'atom-05-one-cloud-3d-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'cloud'); await settle(page); } },
    { name: 'atom-05-one-cloud-3d-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: async page => { await intoAtom(page); await mode(page, 'cloud'); await settle(page); } },
    { name: 'atom-06-one-cloud-4s-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'cloud'); await page.locator('.atom-pick [data-shell="4"]').click(); await settle(page); } },
    { name: 'atom-07-light-iron-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
    { name: 'atom-07-light-iron-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
    { name: 'atom-08-light-neon-line-desktop', vp: D, hash: 'el=Ne&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); await tapLine(page, 585.25); await settle(page); } },
    { name: 'atom-08b-light-neon-ripple-desktop', vp: D, hash: 'el=Ne&card=1', settle: 1500, clockAt: 380, act: async page => { await page.clock.resume(); await intoAtom(page); await mode(page, 'light'); await settle(page); const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(now + 50); await tapLine(page, 614.31); } },
    { name: 'atom-09-about-gold-desktop', vp: D, hash: 'el=Au&card=1', settle: 1500, act: async page => { await intoAtom(page); await page.locator('.atom-about .ui-disclosure__summary').click(); await page.locator('.atom-sheet .ui-sheet__body').evaluate(el => { el.scrollTop = el.scrollHeight; }); await page.mouse.move(700, 120); await page.waitForTimeout(400); } },
    { name: 'atom-09b-about-gold-midscroll-desktop', vp: D, hash: 'el=Au&card=1', settle: 1500, act: async page => { await intoAtom(page); await page.locator('.atom-about .ui-disclosure__summary').click(); await page.locator('.atom-sheet .ui-sheet__body').evaluate(el => { el.scrollTop = Math.round(el.scrollHeight * 0.33); }); await page.mouse.move(700, 120); await page.waitForTimeout(400); } },
    { name: 'atom-09-about-gold-phone', vp: P, hash: 'el=Au&card=1', settle: 1500, touch: true, act: async page => { await intoAtom(page); await page.locator('.atom-about .ui-disclosure__summary').click(); await page.locator('.atom-sheet .ui-sheet__body').evaluate(el => { el.scrollTop = el.scrollHeight; }); await page.waitForTimeout(400); } },
    { name: 'atom-10-hydrogen-desktop', vp: D, hash: 'el=H&card=1', settle: 1500, act: intoAtom },
    { name: 'atom-10-hydrogen-phone', vp: P, hash: 'el=H&card=1', settle: 1500, touch: true, act: intoAtom },
    { name: 'atom-11-carbon-one-cloud-desktop', vp: D, hash: 'el=C&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'cloud'); await settle(page); } },
    { name: 'atom-12-uranium-desktop', vp: D, hash: 'el=U&card=1', settle: 1500, act: intoAtom },
    { name: 'atom-12b-uranium-5f-cloud-desktop', vp: D, hash: 'el=U&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'cloud'); await settle(page); } },
    { name: 'atom-13-vi-iron-desktop', vp: D, hash: 'el=Fe&card=1&lang=vi', settle: 1500, act: intoAtom },
    { name: 'atom-13-vi-iron-phone', vp: P, hash: 'el=Fe&card=1&lang=vi', settle: 1500, touch: true, act: intoAtom },
    { name: 'atom-14-vi-light-sodium-phone', vp: P, hash: 'el=Na&card=1&lang=vi', settle: 1500, touch: true, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
    { name: 'atom-15-oganesson-desktop', vp: D, hash: 'el=Og&card=1', settle: 1500, act: async page => { await intoAtom(page); await at(page, 118); await settle(page); } },
    { name: 'atom-16-light-argon-desktop', vp: D, hash: 'el=Ar&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
    { name: 'atom-17-light-hydrogen-desktop', vp: D, hash: 'el=H&card=1', settle: 1500, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
    { name: 'atom-17-light-hydrogen-phone', vp: P, hash: 'el=H&card=1', settle: 1500, touch: true, act: async page => { await intoAtom(page); await mode(page, 'light'); await settle(page); } },
  ];
}
