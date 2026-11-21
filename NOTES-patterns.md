# NOTES — patterns (Patterns across the table + Side by side), 21 Nov 2026

Decisions of the "patterns" session (PARALLEL.md scope 3), for the main session to move into DECISIONS.md.
Who proposed each: **plan** (REDESIGN-PLAN / DESIGN-STUDY / PLAN-CRITIQUE, already approved) or **Claude** (this
session's craft call, with the reason). Review set: `/workspace/out/redesign/patterns/` (33 PNG at 1440×900 and
390×844, `?q=med`), frame statistics in `/workspace/out/redesign/patterns/fps/fps.txt` (automatic quality path).

## Patterns across the table (`places/patterns.js`, `places/patternSpecs.js`, `ui/trends.js`)
- **Each chart opens with a question, then a plain answer** (plan). Twelve patterns, one per numbers lens, with the
  same plain names and order as the home lenses (Melting point, Heft, Atom size, Grip on electrons; More: Electron
  pull, Discovered, How common in Earth's crust, Boiling point, Electron appetite, Weight of one atom, Atom size when
  touching, Felt pull of the nucleus). *Why:* one vocabulary across the app; every number the legacy chart offered stays.
  Examples: "Why does tungsten glow in a light bulb without melting?", "Why do atoms get smaller as you go right?",
  "Why does sodium explode in water, while neon hardly reacts at all?", "How rare is gold?".
- **Jargon as a caption after the plain axis name** (plan): "Grip on electrons · eV / first ionization energy (NIST)".
  The x axis reads "Number of protons · atomic number →"; row bands are "Row 4", their caption names "periods".
- **Sources of the words:** a quiet "Source" pill after each answer lists the pages the sentence rests on
  (`content/patterns-refs.js`; REDESIGN-PLAN §4 hooks). Every dot's value opens its own data source (the shared
  source popover, kelvin shown there). Claude had the unverified claims checked against the pages first:
  Periodic trends, Atomic radius, Electron affinity (chlorine highest; "filled valence shell"), Effective nuclear
  charge, Ionic bonding (table salt is sodium chloride, Na loses / Cl gains an electron), RSC gallium (Mendeleev
  predicted it), Density of air (1.2041 kg/m³ at 20 °C).
- **Dropped:** "Mendeleev put tellurium before iodine although it is heavier" (Claude). *Why:* not found on the
  pages fetched. The weight chart says only what our data shows ("the table is ordered by protons, not by weight,
  so in a few places the weight steps back, as from argon to potassium"; Periodic trends: "organizing the
  elements by atomic number instead of atomic weight").
- **Callouts are computed, and only shown when the data bears them out** (plan: "two or three callouts per chart
  come from the data"; Claude: the rule). E.g. "Each row starts big…" appears because rows 2–7 really start with
  their biggest atom (Li, Na, K, Rb, Cs, Fr); "Little dips just after beryllium and nitrogen" because B < Be and
  O < N in the NIST values. Every element a note is about wears a fine ink ring. The question/answer hooks quote
  particular elements (tungsten, rhenium, osmium, chlorine…); `tests/patterns.test.mjs` pins each premise to the
  data, so a data change that breaks a sentence fails the tests.
- **Bug caught while building:** carbon's sublimation point (3,642 °C) was counted as the highest melting point.
  A sublimation point is not a melting point: tungsten (3,422 °C) is the top, carbon is a hollow ring that stands
  taller with "Carbon never melts: it turns to gas at 3,642 °C" (as on the Melting point lens).
- **Scales** (plan: "log scale is automatic, with an 'each step = ×10' note"; Claude: the rest):
  - heights from zero (honest), like the lenses;
  - temperatures in °C from absolute zero (−273 °C), with a dashed **room temperature (20 °C)** line, the app's
    room temperature: what sits below it is liquid or gas in the room;
  - Heft linear (as the lens decided), gases weighed at 20 °C like the card ("0.17 g");
  - crustal abundance on a log scale in **grams per tonne of rock** (= mg/kg), "each step up: ×10";
  - discovery years as a range, the elements known in ancient times in a band under the axis, and **no lines**:
    discovery dates do not repeat by row, so joining them only drew noise (the join toggle hides there).
- **Selected element:** the verdigris ring (the one interactive accent) and a pinned label whose value is the
  dotted, tappable source button; its row (or column) is drawn in ink, the others in faint ink-3; the row band's
  label turns bold. A note that would only repeat the pinned label is hidden while that element is picked.
- **Join the dots** (plan: secondary toggle): "Across each row | Down each column" (phones: "Rows | Columns").
- **Motion** (STYLE §7, the lens-change values): beads ripple left→right by atomic number (650 ms, 250 ms stagger),
  then the lines are drawn in like a pen stroke, then the notes fade in. A pattern change morphs the beads to their
  new heights the same way. Reduced motion: instant. The animation runs in the engine's loop (`animate`), so the
  shot and smoke tools wait for it.
- **Why SVG, not 3D** (M5 decision kept, Claude): a flat plate reads faster and stays crisp at any size; the 3D
  canvas behind is empty paper. The beads borrow the porcelain look (a radial glaze in the family pigment, a rim
  38 % darker, like the tile sides); predicted values carry the same diagonal hatch as the table.
- **Phones** (Claude): the chart keeps the height. One "Other patterns ▾" pill opens all twelve (three rows of chips
  in Vietnamese ate a third of the chart); the y ticks drop "°C" (it is in the axis name); the room-temperature
  label moves into the key; touch and slide along the chart for a loupe (like the table's), lift to pick; the
  picked element and its tappable value sit under the chart.
- **Targets:** on desktop each element's hit area is its whole column (nearest-column picking, ~11 px × the plot
  height) with an instant hover ring and tip; ←/→ step through the elements (main.js keys). Narrower than 44 px is
  inherent to 118 columns; phones get the 44 px-equivalent loupe, as the table does. Noted for the review.
- **"See it on the table →"** switches to the matching lens (heights and colours set in one `set`, so the table morphs).

## Side by side (`places/compare.js`, `ui/comparePanel.js`, `views/compare.js`)
- **The stage** (plan: "the atoms are drawn to scale"; Claude: the look): two glazed porcelain beads (roughness 0.35
  and the table's computed studio glaze) standing on the paper at their true relative size, soft contact shadows,
  an ink scale bar ("100 pm") and the names and sizes written in ink under them. Daylight: it is matter.
  "Draw the atoms: when bonded | when touching" (covalent / van der Waals) sits in "All numbers & sources".
- **A size our sources do not give is an empty dashed ring** on the paper with "size not known" (e.g. oganesson),
  never a guessed sphere (the legacy view drew a fallback-sized ghost).
- **Curated surprising pairs first, "pick any two" second** (plan): chips under the stage — gold · mercury,
  helium · osmium, sodium · chlorine, graphite · diamond, hydrogen · oganesson — then "Pick any two…", a small finder
  (search, or the neighbours above / below / before / after). Each curated takeaway's premise is checked in
  `tests/compare.test.mjs` (mercury is gold + 1 proton and liquid; osmium the densest measured; chlorine the
  highest electron affinity; carbon's two forms; oganesson ≈ 290 hydrogen atoms).
- **The takeaway for any other pair follows the card door's decision** (Claude): same order and thresholds as
  `pairHook`, written as a full sentence ("A litre of gold weighs 2.4 times as much as a litre of iron."), so the
  door's promise and the place agree (tested: iron→gold 2.4×, tungsten≈gold, bromine+mercury both liquid).
- **Graphite · diamond** (plan pair; Claude: how): carbon beside carbon (`el=C&el2=C`) shows its two measured solid
  forms instead of two identical atoms: a two-sheet graphite flake and a ball of the diamond network (every atom
  within three bonds of the middle one), built from our cells (Arblaster via Wikipedia) and positions (COD), ink
  bonds between touching atoms, the same bead for both ("the same carbon atoms"). Rows: pattern, neighbours per atom
  (3 vs 4), distance to a neighbour (142 vs 154 pm) and what a litre weighs, **computed** from the cell
  (atoms × atomic weight ÷ (Avogadro × cell volume)): 2.3 vs 3.5 kg, with the method in the source popover; it
  reproduces PubChem's carbon (graphite) density within 0.5 %. Swap is disabled for this pair.
- **Rows** (Claude): plain short labels — the card's phone-strip labels ("At 20 °C", "Melts at", "1 litre weighs")
  plus lens names — each with its jargon caption; two value columns, every value tappable for its source.
  **All numbers & sources** holds nine more rows with bars in proportion and "×1.5" ratio pills (plan: "the ratio
  bars move into details").
- **Layout** (Claude): the sheet sits where the card sits (right on desktop, a bottom sheet on phones), so the place
  reads like the card's continuation; × and the back link both return to the card. Vietnamese uses the GDPT
  familiar names in the header, the stage labels and the sentences ("Sắt nóng chảy ở nhiệt độ cao hơn đồng 453 °C.").

## Tests, tools
- `tests/patterns.test.mjs` (10) and `tests/compare.test.mjs` (6): every hook premise, every string in EN and VI,
  every cited source exists. All 33 unit tests pass; the validator passes.
- `tools/smoke.mjs`: the `// ---- patterns ----` block (7 steps). With WIRING applied and the four legacy
  trends/compare steps retired (WIRING part 2): 31/31.
- `tools/shots.mjs`: a generic loader for `tools/shots-<set>.mjs` (6 lines), so each view session keeps its review
  set in its own file; mine is `tools/shots-patterns.mjs` (also an A/B baseline case, the table landing).

## Frame rate (software renderer, automatic quality path; the machine was shared, load average 10–19)
- Every state of both places: 60 FPS median (16.7 ms); the baseline table landing under the same load: 60 median,
  p95 33 ms. Graphite · diamond desktop p95 33 ms, average 43 FPS, the same as the baseline's 40; sphere facets
  are fewer on the low tier.
- The chart's SVG ripple (the engine meter cannot see it), 4 pattern switches: desktop median 16.7 ms, p95 33 ms,
  max 67 ms (the first frame of a switch, building the model); phone median 16.7, max 16.8 ms. The pinned label's
  size is measured once per content (reading it every frame forced a layout; max was 117 ms before).

## Open questions (for the main session / moony)
- Vietnamese: all new strings are drafts (e.g. "Quy luật trên cả bảng", "Độ giữ electron", "Những cặp bất ngờ").
- A dot's source takes two taps on the chart (pick the dot, tap its value), like the card ("Tap a value to see where
  it comes from"). One tap straight to the source would cover the chart with a popover at every pick.
- The "Patterns" and "Side by side" places are reached from the card only (plan). A menu entry would need home.js.
