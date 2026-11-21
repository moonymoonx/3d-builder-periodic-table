// Review set for the sample place (PARALLEL.md scope 2): node tools/shots.mjs --set=sample
// Key states at desktop and phone size: a gas cooled until it turns liquid and freezes, the liquid metal
// frozen and boiled, helium near absolute zero, the honest cards (a crystal we do not draw, an element
// never made in bulk), a glowing melt in the kiln, "About this sample", and Vietnamese.
// Start states are reached the way a visitor does: from the element card's door, with the scale dive.
export function sampleCases(SIZES) {
  const D = SIZES.desk, P = SIZES.phone;
  const door = async page => { await page.locator('.card-doors .ui-door').nth(1).click(); await page.waitForTimeout(2600); }; // the card's second door
  const to = (T, ms = 1800) => async page => { await page.waitForTimeout(600); await page.evaluate(x => window.__pt.set({ T: x }), T); await page.waitForTimeout(ms); };
  const steps = (...Ts) => async page => { await page.waitForTimeout(600); for (const T of Ts) { await page.evaluate(x => window.__pt.set({ T: x }), T); await page.waitForTimeout(1300); } };
  const about = async page => { await page.waitForTimeout(600); await page.locator('.sample-about').click(); await page.waitForTimeout(700); };
  return [
    // the card's second door, in the sample place's words (PROPOSAL on elementCard.js)
    { name: 's00-card-mercury-door-desktop', vp: D, hash: 'el=Hg&card=1', settle: 1900 },
    { name: 's00-card-nitrogen-door-phone', vp: P, hash: 'el=N&card=1', touch: true, settle: 1900 },
    { name: 's00-card-oganesson-door-phone', vp: P, hash: 'el=Og&card=1', touch: true, settle: 1900 },
    { name: 's01-nitrogen-dive-desktop', vp: D, hash: 'el=N&card=1', settle: 1500, now: true, clockAt: 1400, act: async page => { await page.locator('.ui-door', { hasText: 'Hold a sample' }).click(); } },
    { name: 's02-nitrogen-gas-desktop', vp: D, hash: 'el=N&card=1', settle: 1500, act: door },
    { name: 's02-nitrogen-gas-phone', vp: P, hash: 'el=N&card=1', touch: true, settle: 1500, act: door },
    { name: 's03-nitrogen-liquid-desktop', vp: D, hash: 'v=hold&el=N', settle: 800, act: to(73, 2600) },
    { name: 's03-nitrogen-liquid-phone', vp: P, hash: 'v=hold&el=N', touch: true, settle: 800, act: to(73, 2600) },
    { name: 's04-nitrogen-frozen-desktop', vp: D, hash: 'v=hold&el=N', settle: 800, act: steps(73, 55) },
    { name: 's05-mercury-liquid-desktop', vp: D, hash: 'el=Hg&card=1', settle: 1500, act: door },
    { name: 's05-mercury-liquid-phone', vp: P, hash: 'el=Hg&card=1', touch: true, settle: 1500, act: door },
    { name: 's06-mercury-frozen-desktop', vp: D, hash: 'v=hold&el=Hg', settle: 800, act: to(225, 2200) },
    { name: 's06-mercury-frozen-phone', vp: P, hash: 'v=hold&el=Hg', touch: true, settle: 800, act: to(225, 2200) },
    { name: 's07-mercury-boiling-desktop', vp: D, hash: 'v=hold&el=Hg', settle: 800, act: to(650, 2400) },
    { name: 's08-helium-near-zero-desktop', vp: D, hash: 'v=hold&el=He', settle: 800, act: steps(3, 1.5) },
    { name: 's08-helium-near-zero-phone', vp: P, hash: 'v=hold&el=He', touch: true, settle: 800, act: steps(3, 1.5) },
    { name: 's09-sulfur-honest-card-desktop', vp: D, hash: 'el=S&card=1', settle: 1500, act: door },
    { name: 's09-sulfur-honest-card-phone', vp: P, hash: 'el=S&card=1', touch: true, settle: 1500, act: door },
    { name: 's10-sulfur-molten-desktop', vp: D, hash: 'v=hold&el=S', settle: 800, act: to(423.15, 2400) },
    { name: 's11-manganese-molten-kiln-desktop', vp: D, hash: 'v=hold&el=Mn', settle: 800, act: to(1700, 2600) },
    { name: 's11-manganese-molten-kiln-phone', vp: P, hash: 'v=hold&el=Mn', touch: true, settle: 800, act: to(1700, 2600) },
    { name: 's12-oganesson-never-desktop', vp: D, hash: 'el=Og&card=1', settle: 1500, act: door },
    { name: 's12-oganesson-never-phone', vp: P, hash: 'el=Og&card=1', touch: true, settle: 1500, act: door },
    { name: 's13-about-nitrogen-desktop', vp: D, hash: 'v=hold&el=N', settle: 800, act: about },
    { name: 's13-about-mercury-frozen-phone', vp: P, hash: 'v=hold&el=Hg&T=225', touch: true, settle: 800, act: about },
    { name: 's14-bromine-liquid-desktop', vp: D, hash: 'el=Br&card=1', settle: 1500, act: door },
    { name: 's15-vi-mercury-desktop', vp: D, hash: 'v=hold&el=Hg&lang=vi', settle: 1600 },
    { name: 's15-vi-oganesson-phone', vp: P, hash: 'v=hold&el=Og&lang=vi', touch: true, settle: 1600 },
    { name: 's15-vi-nitrogen-liquid-phone', vp: P, hash: 'v=hold&el=N&lang=vi', touch: true, settle: 800, act: to(73, 2600) },
    { name: 's16-neon-cool-it-playing-desktop', vp: D, hash: 'v=hold&el=Ne', settle: 1200, now: true, act: async page => { await page.locator('.sample-play', { hasText: 'Cool it' }).click(); await page.waitForTimeout(9000); } },
  ];
}
