// Side by side: the curated takeaways rest on our data, and the takeaway for any pair says what the element
// card's door promised ("with gold: a litre of gold weighs 2.4× more"). The data module reads the page's
// embedded JSON, so a minimal document stand-in hands it data/elements.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const json = fs.readFileSync(new URL('../data/elements.json', import.meta.url), 'utf8');
globalThis.document = { getElementById: () => ({ textContent: json }) };
const { loadData, bySym, byZ } = await import('../src/app/data.js');
loadData();
const { CURATED, curatedOf, curatedFacts, pairStory, ratioValue, forms, twoForms, defaultPartner, litre, tempC, litreText, balanceTilt, specimenOf } = await import('../src/app/ui/comparePanel.js');
const D = JSON.parse(json);
const E = s => bySym(s);

test('side by side: the curated pairs, and every premise holds in the data', () => {
  assert.deepEqual(CURATED.map(c => c.id), ['au-hg', 'he-os', 'na-cl', 'c-c', 'h-og']);
  for (const c of CURATED) assert.ok(curatedFacts(c.id).holds, c.id);
  assert.equal(curatedOf(80, 79).id, 'au-hg'); // either order
  assert.equal(curatedOf(6, 6).id, 'c-c');
  assert.equal(curatedOf(26, 79), null);
});

test('side by side: helium and osmium — 136,000 times, helium about 7 times lighter than air', () => {
  const f = curatedFacts('he-os');
  assert.equal(ratioValue(f.r), 136000);
  assert.equal(Math.round(f.air), 7);
  assert.ok(f.he.gas && !f.os.gas);
});

test('side by side: hydrogen and oganesson — one oganesson atom weighs about 290 hydrogen atoms', () => {
  assert.equal(Number(curatedFacts('h-og').r.toPrecision(2)), 290);
});

test('side by side: graphite and diamond from the measured crystals', () => {
  const [g, d] = forms(E('C'));
  assert.equal(g.label, 'graphite'); assert.equal(d.label, 'diamond');
  assert.equal(g.cn, 3); assert.equal(d.cn, 4);
  assert.equal(Math.round(g.dNN), 142); assert.equal(Math.round(d.dNN), 154);
  // the method reproduces PubChem's carbon (graphite) density within 0.5 %; diamond comes out at 3.5 kg a litre
  assert.ok(Math.abs(g.kg / E('C').f.density[0] - 1) < 0.005, `graphite ${g.kg}`);
  assert.equal(Math.round(d.kg * 10) / 10, 3.5);
  assert.ok(twoForms(6) && !twoForms(26) && !twoForms(50));
});

test('side by side: any pair gets the takeaway its card door promised', () => {
  const s = (a, b) => pairStory(E(a), E(b));
  const feAu = s('Fe', 'Au');
  assert.equal(feAu.kind, 'heavier'); assert.equal(feAu.heavy.sym, 'Au'); assert.equal(ratioValue(feAu.r), 2.4);
  assert.equal(s('W', 'Au').kind, 'same'); // "almost exactly as heavy, litre for litre"
  assert.equal(s('Br', 'Hg').kind, 'bothLiquid');
  assert.equal(s('O', 'N').kind, 'next');
  assert.equal(s('H', 'Og').kind, 'firstLast');
  const naCl = s('Na', 'Cl');
  assert.equal(naCl.kind, 'heavier'); // a solid next to a gas, a litre of sodium about 300 times heavier
  assert.ok(litre(E('Cl')).gas && !litre(E('Na')).gas);
});

test('side by side: the default partner is the element below (or above)', () => {
  assert.equal(byZ(defaultPartner(26)).sym, 'Ru');
  assert.equal(byZ(defaultPartner(118)).sym, 'Rn');
  assert.ok(D.elements.length === 118);
});

test('side by side: the stage shows each litre as it is at 20 °C, on a balance that tips by the weight ratio', () => {
  assert.equal(specimenOf(E('Au')).state, 'solid');
  assert.equal(specimenOf(E('Hg')).state, 'liquid');
  assert.equal(specimenOf(E('Br')).state, 'liquid');
  const he = specimenOf(E('He'));
  assert.equal(he.state, 'gas'); assert.ok(he.gas && he.kg < 0.001);
  assert.equal(specimenOf(E('Og')).kg, null); // no weight in our sources: plinths, not a balance
  // tips toward the heavier litre, more for a bigger ratio, and never past about 11.5°
  assert.ok(balanceTilt(7.87, 19.3) > 0 && balanceTilt(19.3, 7.87) < 0);
  assert.ok(balanceTilt(1, 2.4) < balanceTilt(1, 136000));
  assert.ok(Math.abs(balanceTilt(1.6e-4, 22.6)) <= 0.2);
  assert.ok(Math.abs(balanceTilt(19.25, 19.3)) < 0.002); // tungsten and gold: level
});

test('side by side: numbers as people read them, never split from their unit', () => {
  assert.equal(litreText(litre(E('He')).kg), '0.17\u00a0g');
  assert.equal(litreText(litre(E('Cl')).kg), '3.0\u00a0g');
  assert.equal(litreText(0.968), '0.97\u00a0kg');
  assert.equal(litreText(19.3), '19.3\u00a0kg');
  assert.equal(tempC(234.32), '−38.8\u00a0°C'); // mercury
  assert.equal(tempC(1811), '1,538\u00a0°C'); // iron: whole kelvin, whole degrees
  assert.equal(tempC(325, true), '≈\u00a052\u00a0°C'); // a prediction stays rounded
});
