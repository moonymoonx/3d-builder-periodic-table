// Review set for the "patterns" scope (PARALLEL.md): Patterns across the table and Side by side, in their key
// states, at the sizes given (1440×900 and 390×844 for review). Loaded by tools/shots.mjs --set=patterns:
//   node tools/shots.mjs --set=patterns --serve --desk=1440x900 --phone=390x844 --png --query=q=med --out=/workspace/out/redesign/patterns
//   node tools/shots.mjs --set=patterns --serve --desk=1440x900 --phone=390x844 --fps=4 --out=/workspace/out/redesign/patterns/fps
const at = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('missing ' + s); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
const bead = (page, Z) => at(page, `.patterns-bead[data-z="${Z}"]`);
const touch = (page, sel, type, x, y) => page.evaluate(([s, ty, px, py]) => {
  document.querySelector(s).dispatchEvent(new PointerEvent(ty, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: px, clientY: py, bubbles: true, button: 0, buttons: ty === 'pointerup' ? 0 : 1 }));
}, [sel, type, x, y]);

export function cases({ SIZES }) {
  const D = SIZES.desk, P = SIZES.phone;
  const fromCard = async (page, phone) => { await page.locator(phone ? '.card-across-row' : '.card-across').first().click(); };
  return [
    // A/B baseline under the same machine load: the hero table's landing (FPS runs share a busy machine)
    { name: 'b00-baseline-table-landing-desktop', vp: D, hash: '', settle: 2000 },
    { name: 'b00-baseline-table-landing-phone', vp: P, hash: '', touch: true, settle: 2000 },
    // Patterns: reached from the card's "↗ across the table" link (melting point), and each kind of chart
    { name: 'p01-from-card-melting-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1600, act: page => fromCard(page, false) },
    { name: 'p01-from-card-melting-phone', vp: P, hash: 'el=Fe&card=1', touch: true, settle: 1600, act: page => fromCard(page, true) },
    { name: 'p02-grip-iron-desktop', vp: D, hash: 'v=trends&el=Fe&p=ie1', settle: 1400 },
    { name: 'p02-size-iron-phone', vp: P, hash: 'v=trends&el=Fe&p=rCov', touch: true, settle: 1400 },
    { name: 'p03-heft-gold-desktop', vp: D, hash: 'v=trends&el=Au&p=density', settle: 1400 },
    { name: 'p03-heft-gold-phone', vp: P, hash: 'v=trends&el=Au&p=density', touch: true, settle: 1400 },
    { name: 'p04-hover-gold-desktop', vp: D, hash: 'v=trends&el=Fe&p=rCov', settle: 1400, act: async page => { const b = await bead(page, 79); await page.mouse.move(b.x - 80, b.y - 60); await page.mouse.move(b.x, b.y, { steps: 6 }); } },
    { name: 'p05-tap-value-source-desktop', vp: D, hash: 'v=trends&el=Fe&p=mp', settle: 1400, act: async page => { await page.locator('.patterns-pin .patterns-v').click(); } },
    { name: 'p06-columns-desktop', vp: D, hash: 'v=trends&el=Na&p=rCov&line=group', settle: 1400 },
    { name: 'p07-more-menu-desktop', vp: D, hash: 'v=trends&el=Fe&p=ie1', settle: 1400, act: async page => { await page.locator('.patterns-more').click(); } },
    { name: 'p08-crust-log-desktop', vp: D, hash: 'v=trends&el=Au&p=abund', settle: 1400 },
    { name: 'p09-discovered-desktop', vp: D, hash: 'v=trends&el=P&p=year', settle: 1400 },
    { name: 'p10-pull-desktop', vp: D, hash: 'v=trends&el=O&p=en', settle: 1400 },
    { name: 'p11-vi-melting-desktop', vp: D, hash: 'v=trends&el=Fe&p=mp&lang=vi', settle: 1400 },
    { name: 'p11-vi-grip-phone', vp: P, hash: 'v=trends&el=Na&p=ie1&lang=vi', touch: true, settle: 1400 },
    { name: 'p12-scrub-phone', vp: P, hash: 'v=trends&el=Fe&p=ie1', touch: true, settle: 1400, now: true, act: async page => {
      const a = await bead(page, 19), b = await bead(page, 29);
      await touch(page, '.patterns-plot', 'pointerdown', a.x, a.y + 30);
      for (let i = 1; i <= 6; i++) await touch(page, '.patterns-plot', 'pointermove', a.x + ((b.x - a.x) * i) / 6, a.y + 30);
      await page.waitForTimeout(250);
    } },
    // Side by side: from the iron card's door, the curated pairs, pick any two, the details
    { name: 'c01-from-card-iron-gold-desktop', vp: D, hash: 'el=Fe&card=1', settle: 2200, act: async page => { await page.locator('.ui-door', { hasText: /Side by side/ }).click(); } },
    { name: 'c01-from-card-iron-gold-phone', vp: P, hash: 'el=Fe&card=1', touch: true, settle: 2200, act: async page => { await page.locator('.ui-door', { hasText: /Side by side/ }).click(); } },
    { name: 'c02-gold-mercury-desktop', vp: D, hash: 'v=compare&el=Au&el2=Hg', settle: 2200 },
    { name: 'c02-gold-mercury-phone', vp: P, hash: 'v=compare&el=Au&el2=Hg', touch: true, settle: 2200 },
    { name: 'c03-helium-osmium-desktop', vp: D, hash: 'v=compare&el=He&el2=Os', settle: 2200 },
    { name: 'c04-sodium-chlorine-desktop', vp: D, hash: 'v=compare&el=Na&el2=Cl', settle: 2200 },
    { name: 'c05-graphite-diamond-desktop', vp: D, hash: 'v=compare&el=C&el2=C', settle: 2200 },
    { name: 'c05-graphite-diamond-phone', vp: P, hash: 'v=compare&el=C&el2=C', touch: true, settle: 2200 },
    { name: 'c06-hydrogen-oganesson-desktop', vp: D, hash: 'v=compare&el=H&el2=Og', settle: 2200 },
    { name: 'c07-pick-any-two-desktop', vp: D, hash: 'v=compare&el=Fe&el2=Au', settle: 2000, act: async page => { await page.locator('.compare-pick').click(); await page.locator('.compare-find').fill('sod'); } },
    { name: 'c08-all-numbers-desktop', vp: D, hash: 'v=compare&el=Na&el2=Cs', settle: 2000, act: async page => { await page.locator('.compare-sheet .ui-disclosure__summary').click(); await page.locator('.compare-sheet .ui-sheet__body').evaluate(el => { el.scrollTop = 380; }); await page.mouse.move(300, 300); } },
    { name: 'c09-tap-value-source-desktop', vp: D, hash: 'v=compare&el=Au&el2=Hg', settle: 2000, act: async page => { await page.locator('.compare-row .compare-v').nth(3).click(); } },
    { name: 'c10-vi-iron-copper-phone', vp: P, hash: 'v=compare&el=Fe&el2=Cu&lang=vi', touch: true, settle: 2200 },
    { name: 'c10-vi-gold-mercury-desktop', vp: D, hash: 'v=compare&el=Au&el2=Hg&lang=vi', settle: 2200 },
    { name: 'p13-switch-pattern-mid-ripple-desktop', vp: D, hash: 'v=trends&el=Fe&p=rCov', settle: 1400, now: true, clockAt: 380, act: async page => { await page.locator('.patterns-chips .ui-chip', { hasText: 'Grip on electrons' }).click(); } },
  ];
}
