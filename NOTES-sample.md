# NOTES — sample place (branch `view-sample`, 21 Nov 2026)

Decisions taken while building "Hold a sample · cool or heat it" (PARALLEL.md scope 2), for the main
session to move into DECISIONS.md if accepted. Proposed by **Claude (sample session)** unless noted;
the scope and the "look like the forge" rule are **moony's / the main session's** (PARALLEL.md).

## What the place is
- **Everything the forge does not take, in the forge's look.** 39 elements: 10 gases plus radon, 2 liquids
  (mercury, bromine), 5 solids whose crystal we do not draw (P, S, I molecular; B, Mn complex), and 21
  never made in bulk (At, Fr, Fm–Og). The split is computed (`placeKind`), the same rule as the forge's
  `forgeable`, and checked: no element has an undrawable crystal form at room temperature.
  *Why:* one place per question; the router sends the card's door to the right one.
- **Its own instance of the forge view** (`createSampleView(hooks, { look: 'forge' })`, view `'hold'`),
  with the same scale dive from the tile. *Why:* PARALLEL.md; and its own hooks (the kiln, the glow).
- **"Why should I care?" first, from our data.** The first caption is a plain sentence about what you are
  holding, with a number you can feel: "Nitrogen at room temperature: a gas of N₂ molecules flying at
  about 1,840 km/h. Drag the thermometer to cool it." Speeds are √(3RT/M) (CODATA R, CIAAW masses), shown
  in km/h; the method is one tap away. *Why:* a human anchor computed from our own numbers, no outside
  landmark needed (REDESIGN-PLAN §1.4).

## The thermometer runs both ways
- **Cold to the left, hot to the right, room temperature always on the scale.** A gas is cooled until it
  turns liquid and freezes; mercury is frozen (−38.8 °C) and boiled (357 °C). The forge's runs from room
  temperature up. *Why:* the events of these elements are mostly cold.
- **Linear in °C, like the forge.** Helium's liquid range is 4 K wide on a 340 K scale (the honest
  picture: it must get very cold), so "◀ Cool it" stops just past each event (as "Heat it ▶" does in
  the forge) and holds about 2 s; a stop never passes the next event (neon's liquid range is 2.5 K).
  *Rejected:* a log-kelvin scale (the legacy dock) or tappable event labels: harder to read, or targets
  under 44 px.
- **The scale:** a little past the coldest and hottest events, ends on whole tens of °C; things that do
  not glow stop below 740 K so the room never dims for them (sulfur vapour stays in daylight); helium,
  neon and hydrogen run to 1 K, "a whisker above absolute zero". *Why:* the kiln is only for fire
  (STYLE §1).
- **Fill coloured by temperature** (cold blue, paper at room temperature, ember, then glowing white),
  rising from the bulb like a real thermometer's column; the bulb takes the coldest colour. The colours
  are the kit's heat-map slider and the forge's thermometer (no new colours; a token is proposed).
- **Event labels say what happens in the direction you travel from room temperature:** below it
  "freezes" and "turns liquid", above it "melts", "boils", "turns to gas". Ticks closer than 14 px share
  one stem and one label. Labels sit 6 px higher than the forge's so the thumb never covers the event it
  has just reached. Predicted events read "≈" in whole degrees.
- **Flags below the rail, most useful first:** room temperature (always), liquid nitrogen, absolute zero
  (first for helium), mercury freezing, familiar metals melting (lead, aluminium, copper, iron,
  tungsten). All from our data. A flag at an end shifts inward rather than vanish.
- **Buttons:** "◀ Cool it" left, "Room temperature" centre, "Heat it ▶" right; the element's main story is
  the ink one (cooling for gases and liquids, heating for the rest). "Pause ❚❚" while playing; "… again"
  at the end. One row on phones.

## Honest cards
- **A crystal we do not draw: the vessel stands empty and the caption says why**, in plain words: "a
  crystal of molecules. We do not draw molecular crystals yet, so the vessel stands empty." Manganese:
  "its crystal repeats a box of 58 atoms, too many to draw honestly". Heat it and the liquid appears
  (sulfur's S₈ molecules, manganese's glowing melt, with the kiln). *Why:* never draw what our sources do
  not measure (SPEC §5); an empty specimen vessel is honest and reads as intended with its caption.
  *Rejected:* freezing the liquid's last positions (it would show a disordered solid, which is wrong).
- **Never made in bulk: no thermometer** (nothing would change), an honest panel instead: "Nobody has ever
  held a piece of oganesson." The three facts we have, each with its source: how long its atoms last
  (NUBASE2020 half-life, "≈" where NUBASE estimates it), the predicted state, the predicted melting point
  (whole degrees: "≈ 52 °C", never "≈ 51.9"). A door: "Look inside one of its atoms". *Why:* no dead
  end, no fake data.
  - Wording kept to what our data says: "so little has ever been made at once that no one has seen it as
    a solid, a liquid or a gas" (the notes on At and Fr say "never made in bulk"; for Fm–Og every state
    is flagged as a prediction). The legacy card's stronger "only a few atoms have ever existed at once"
    is not supported by our data for all of them, so it was not reused.
- **Radon is a gas, not "never made in bulk".** Only its crystal is a prediction (Wikipedia: fcc,
  predicted); its melting and boiling points are measured. Its frozen state gets the honest card
  "its crystal pattern has only been predicted, never measured". (PROPOSAL commit for the view.)

## Captions and words
- **One quiet caption names each moment**, as in the forge, detected by the place itself from the state
  before and after (the event crossed, in the direction of travel), so it always matches what is drawn.
  Freezing names the new neighbour count from the phase data ("Each atom now touches 6 neighbours").
- **Vietnamese** uses the familiar GDPT-2018 names in sentences (Thuỷ ngân, Nitơ, Lưu huỳnh) and the IUPAC
  name otherwise. Every string is in `strings-sample.js` (`sample.*`), English first, Vietnamese a draft
  for moony.
- **Numbers never wrap away from their units** (no-break spaces in every formatter of this place).

## "About this sample"
- **Every number with its source, one tap deeper:** state at this temperature (1 atm), melting and
  boiling points with K, the crystal (pattern, repeating box, atoms per box, neighbours, Lindemann
  wobble), the gas (typical speed with its formula, the particles, the real gap between them, how much
  slower it is drawn), half-life for radioactive elements, and what the drawing simplifies. The kit's
  sheet: a card on the right on desktop (the panel steps left, the sample re-frames), a bottom sheet on
  phones (the panel steps aside). *Why:* keeps every fact of the legacy panel, behind a tap.
- **The real gap between gas particles is computed** ((kT/p)^⅓ at 1 atm, CODATA k; width = twice the van
  der Waals radius): nitrogen at 20 °C, about 3.4 nm, 10 times their width. It replaces the legacy note
  "hundreds of times further apart", which was wrong (about 10 times in distance).

## Views and router (proposals, decided by the main session)
- View name `'hold'`; legacy `'sample'` stays reachable by URL because four smoke steps outside this
  session's block drive it (PROPOSALS-sample.md §5 lists what replaces each).
- Five small PROPOSAL commits to `views/sample.js` and one to `places/elementCard.js` (PROPOSALS-sample.md).

## Checks
- Smoke: 37 steps pass (28 existing, 9 new in `// ---- sample ----`), no console errors. Unit tests 17/17.
  Validator passes. Build 1,525 KB (< 2 MB).
- Screens: `node tools/shots.mjs --set=sample` (27 cases, desktop 1440×900 and phone 390×844, `?q=med`) in
  `/workspace/out/redesign/sample/`.
- FPS on the automatic path (`--fps=4`, software renderer, low tier), on a shared machine (load 6–17
  from another session's browser), measured back to back with the forge:
  - 60 FPS median: gases (nitrogen, helium), liquids at room temperature (mercury, bromine), every honest
    card (sulfur, oganesson, frozen nitrogen), the glowing melt in the kiln (manganese), "About this
    sample", the cooling sweep, the dive (23 of 30 shots).
  - 30: liquid nitrogen, boiling mercury. 20: frozen mercury, which is the forge's own crystal rendering
    (the forge measured 15–30 for its solid states in the same run).
  - A per-frame split shows the place's own cost is small: the fluid simulation ≤ 1.1 ms, the render call
    0.2–0.3 ms; the rest is SwiftShader's rasterising, which the load swings.
  - Results: `/workspace/out/redesign/sample/fps/fps.txt` (forge: `…/fps-forge/fps.txt`).

## Log
- 2026-11-21: place, strings, CSS, smoke block, shot set, wiring, proposals; screens r1–r3 reviewed
  against STYLE.md (fixes: stems crossing labels, flags dropped at the ends, the phone readout cut off,
  units wrapping, labels under the thumb, buttons wrapping on phones, porous condensed liquids).
