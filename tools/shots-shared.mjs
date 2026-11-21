// --set=shared: the shared forge / sample fixes after the cold review reviews/sample-s2.md (main session):
// the hearth floor (no glass floor fighting the glaze), the forge's chrome as the sample place's (ink 20 °C,
// "Room temperature" only once away, "◀ Cool it" when hot, "About this sample ›"), mercury's finish in every
// state, a sparse vapour where every atom stays a sphere, and the oganesson card's predicted state.
// Loaded by the generic set loader in tools/shots.mjs.
export function cases({ SIZES }) {
  const D = SIZES.desk, P = SIZES.phone;
  // the card's second door leads to the forge or to the sample place, whatever its words for this element
  const forge = async page => { await page.locator('.ui-sheet:not([hidden]) .ui-door').nth(1).click(); await page.waitForTimeout(2600); };
  const hold = forge;
  const to = async (page, C, ms = 2400) => { await page.evaluate(T => window.__pt.set({ T }), C + 273.15); await page.waitForTimeout(ms); };
  const about = async page => { await page.locator('.heat-about').click(); await page.waitForTimeout(900); await page.mouse.move(4, 400); };
  return [
    { name: 'f01-forge-start-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: forge },
    { name: 'f01-forge-start-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: forge },
    { name: 'f02-forge-about-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await forge(page); await about(page); } },
    { name: 'f02-forge-about-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: async page => { await forge(page); await about(page); } },
    { name: 'f03-forge-1600C-molten-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await forge(page); await to(page, 1300); await to(page, 1600, 3200); } },
    { name: 'f03-forge-1600C-molten-phone', vp: P, hash: 'el=Fe&card=1', settle: 1500, touch: true, act: async page => { await forge(page); await to(page, 1300); await to(page, 1600, 3200); } },
    { name: 'f04-forge-2950C-gas-desktop', vp: D, hash: 'el=Fe&card=1', settle: 1500, act: async page => { await forge(page); await to(page, 1600); await to(page, 2950, 5000); } },
    { name: 'f05-mercury-frozen-desktop', vp: D, hash: 'el=Hg&card=1', settle: 1500, act: async page => { await hold(page); await to(page, -60, 3500); } },
    { name: 'f06-mercury-boiling-desktop', vp: D, hash: 'el=Hg&card=1', settle: 1500, act: async page => { await hold(page); await to(page, 380, 4500); } },
    { name: 'f07-oganesson-empty-desktop', vp: D, hash: 'el=Og&card=1', settle: 1500, act: hold },
    { name: 'f08-manganese-red-hot-phone', vp: P, hash: 'el=Mn&card=1', settle: 1500, touch: true, act: async page => { await hold(page); await to(page, 900, 3500); } },
    { name: 'f09-card-oganesson-phone', vp: P, hash: 'el=Og&card=1', settle: 2000, touch: true },
  ];
}
