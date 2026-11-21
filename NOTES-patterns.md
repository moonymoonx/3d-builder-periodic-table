# NOTES — patterns (Patterns across the table + Side by side), 21 Nov 2026

Decisions of the "patterns" session (PARALLEL.md scope 3), for the main session to move into DECISIONS.md.
Who proposed each: **plan** (REDESIGN-PLAN / DESIGN-STUDY / PLAN-CRITIQUE, already approved) or **Claude** (this
session's craft call, with the reason). Review set: `/workspace/out/redesign/patterns/` (33 PNG at 1440×900 and
390×844, `?q=med`), frame statistics in `/workspace/out/redesign/patterns/fps/fps.txt` (automatic quality path).
Round 2 (below, after the cold review `reviews/merged-m1.md`): `/workspace/out/redesign/patterns-r2/` (44 PNG) and
`/workspace/out/redesign/patterns-r2/fps/` (fps.txt, ripple.txt, the load average before and after). Round 3 (Side
by side, after `reviews/patterns-p2.md`): `/workspace/out/redesign/patterns-r3/` (47 PNG) and its `fps/`.

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

## Round 2: the cold review's points, each checked first (code wins on code, sources on facts)
### Patterns
- **The noble-gas note pointed at caesium (55), not xenon (54)**: real. The leader stopped a bead short of xenon, on
  the side where caesium sits. Fix (Claude): one layout pass places the picked label, the reference labels, then the
  notes, by a cost over every bead, curve segment and label (indexed by x, so thousands of candidate spots stay
  cheap). A leader may not pass within a bead's width of any element its note is not about, and leaders crossing
  curves cost more. Notes hug their text: a balanced wrap left each box at its full max-width, stranding the leader
  on empty paper; the lines now lean toward their leader.
- **"×10" on a ×1,000 grid (p08)**: real (labelled lines every third power of ten). Fix: a faint line at every power
  of ten, so "each line up: ×10" is literally true; labels stay every third.
- **Row copy in column mode, the cobweb (p06)**: real. "Down each column" now draws only the picked element's column;
  the row notes step aside for the column's own ("Down this column: hydrogen 31 pm → francium 260 pm"); the question
  and answer switch to column words wherever the row words would mislead (atom sizes, felt pull: new questions;
  melting, boiling, heft, pull, grip: new answers). Each column claim is checked against the data in
  `tests/patterns.test.mjs` (e.g. "every column ends heavier than it starts", "the felt pull grows down every column").
- **The "repeating wave" footer on Discovered and crust (p09)**: agreed; it shows for the nine periodic properties only.
- **Pills hiding peaks, labels crossing curves**: the picked element's label chooses among ten spots around its bead
  (above, below, beside; the caret on the side facing it) by the fewest beads and curves covered, its own row's
  curve counting double, and keeps off the row names. The room-temperature label does the same along its line.
- **Crisscrossing Vietnamese phone leaders**: phones draw one leader per note; the ink rings mark the rest.
- **Phone: no "See it on the table"**: "On the table →" now sits beside "Other patterns ▾".
- **Phone scrub left the dashed guide on the old element (p12)**: the guide follows the thumb; the picked ring dims.
- **"More ▾" without sublabels**: each pattern carries its jargon as a caption (electronegativity…).
- **Stranded °C**: a no-break space between every number and its unit (chart, sheet, stage, strings). Temperatures are
  as precise as the source: a tenth of a degree only where the kelvin value has one (chlorine −101.5 °C, iron
  1,538 °C). Crust values say "g per tonne".

### Side by side
- **"Two bare glossy plastic marbles with harsh hotspots"**: agreed. The default stage is now **a litre of each, as
  it is at 20 °C, on a balance** (Claude, from the review's suggestion; every number is the sheet's own). A solid is a
  glazed porcelain block with its symbol printed on the front like its tile; a liquid is a pool in the pan (a soft
  window sheen across its far half, never a spot); a gas is a litre of clear glass with ink edges, like the forge's
  vessel, a few atoms drifting slowly inside; a state we do not know is a dashed outline; stripes mark predictions.
  The beam tips toward the heavier litre by `0.2·tanh(0.55·ln ratio)` rad: 2.4× reads clearly, 136,000× stops at
  about 11.5°, tungsten beside gold hangs level. Without a weight in our sources (oganesson) the specimens stand on
  plinths, with no balance. The beam glides 1.1 s ease-in-out, no bounce (STYLE.md §7).
- **One atom of each** stays, as the second stage ("A litre of each | One atom of each"): beads in a soft glaze
  (the table's studio minus the small key softbox, which focuses into a hard white dot on a sphere), with more paper
  around them and the scale bar below the names.
- Phones: "change ▾" under both tiles (they replace the "Pick any two" chip there); the active pair chip scrolls into
  view; the sheet peeks at 44 % (was 52 %) so the balance fills about 70 % of the width; while peeking the sheet fades
  at its bottom edge, and rows slide under the compact header through a soft paper edge (c08's clipped °C). Touch
  scrolling checked headless: 0 → 236 px.
- "gases at 20 °C" appears only when the pair has a gas. Desktop's picker opens beside the sheet, never over the table.

### Frame rate (round 2; software renderer, automatic quality path, load average 1.4–7)
- All 44 states (`fps/fps.txt`): median 16.7 ms (60 FPS), p95 ≤ 16.8 ms, the drifting-gas stages included.
- The chart's SVG ripple (`fps/ripple.txt`, 4 switches): desktop median 16.7 ms, p95 33.4, max 83 (the first frame
  of a switch: 10–27 ms of model and layout, then the SVG's first paint; 100 ms before the x-index); phone median
  16.7, p95 16.8, max 33.4.
- Tests: 39 unit tests (6 new), smoke 32/32 (a new step: the balance's words and the atom toggle), validator passes.

## Round 3: Side by side (review `reviews/patterns-p2.md`, each point checked first)
- **Rows sliced under the compact header when the phone sheet scrolls (c16)**: real. The header covers the body's
  top 36 px on phones (68 px on desktop), so a scroll that stops mid-row leaves the row's top half beneath it, and
  round 2's soft edge made that cut look smeared. Now the sheet comes to rest on whole rows: CSS scroll snapping,
  with `scroll-padding-top` = the header's overlap + 8 px; the rows, the takeaway, the hint, the All numbers summary
  and each bar row are rest points. Its very end is padded by at most one row, so a fling to the bottom rests on a
  whole row too. Checked headless with programmatic scrolls, slow drags and flings: every rest leaves a row's top
  8 px under the header (Claude).
- **Phone rail: no "Surprising pairs" label; "Pick any two…" out of view (c01–c06)**: real (round 2 dropped both on
  phones). The label is back, and "Pick any two…" stands at the right of the rail, outside the scrolling pairs, so
  it is always in view; the pairs scroll under a fade.
- **"weighed on a balance" with no balance (c06)**: real. Where a weight is not in our sources, the caption says so:
  "as they are at room temperature (20 °C); no weight known for oganesson".
- **Dotted underlines across the whole cell on wrapped values (c03, c06)**: real (a border spans the button's box).
  Values use a dotted text underline now, which follows each line.
- **Chalky balance, liquids like flat discs**: agreed. The balance is glazed bone porcelain under its own small
  studio: a tall window front-left draws one crisp catchlight down the column and the pans' walls, the long softbox
  a sheen along the rims; the beam and its pivot are lacquered ink. A liquid reflects a window across its far half
  (a soft-edged pane, never a spot) and deepens toward the viewer and its rim (Claude).
- Also from the review's Side by side sections (cheap and in style):
  - "Draw the atoms" showed on the litre stage, where it changed what was not on screen (c08): atom stage only.
  - An atom of unknown size (oganesson, c11) is an upright dashed outline where the atom would stand, not an oval
    on the floor.
  - On phones the rail hides behind the picker (the stray "h", c15). On desktop the picker opened from the rail
    stands on its chip and shrinks toward it as the results narrow, so the pan's label stays visible (c07).
  - No sticky hover after a tap (the teal "Solid", c01): hover colours only where a pointer can hover.
  - "Weight of one atom" says what it is weighed against: "atomic weight, against one twelfth of a carbon-12 atom".
  - Carbon's 100 pm bar sits a little in front of the crystals, clear of graphite on phones (c05).
- Checked and left: copper's litre is 8.9 kg because our cited source, PubChem, gives 8.933 g/cm³ (the review's
  8.96 is another compilation's); chlorine's 3.62 eV is PubChem's 3.617 (NIST's photodetachment value rounds to
  3.61; switching sources is a data decision, `data/**`). "Natri · Chlorine" follows GDPT-2018: the familiar name
  for the 13 elements that keep one (natri is one), the international name for the rest.
- Frame rate (round 3): the capture in `patterns-r3/fps/` ran while other sessions held 12 headless browsers (load
  average 6.8 → 23.7): every state kept a 60 FPS median except carbon's crystals on desktop (30), but p95 rose to
  33–50 ms on most stages and the baseline table landing degraded too (p95 33 ms, avg 49 FPS), so those numbers are
  load, not the change. A clean re-measure on a quiet machine is still to do.
- Patterns: one sentence only. "neon holds on harder than any atom except helium (21.56 eV)" read as helium's value;
  now "neon (21.56 eV) holds on harder than any atom except helium (24.59 eV)", in both languages.

## Open questions (for the main session / moony)
- Round 2: specimens wear their family pigment (STYLE.md: data colours only on specimens), so gold and mercury are the
  same blue; form (block or pool), the beam and the words tell them apart. Real colours (yellow gold, silver mercury,
  red-brown bromine) would tell more but break "one colour, one meaning". Keep the pigments?
- Round 2: the stage choice is not in the link (P7).
- Vietnamese: all new strings are drafts (e.g. "Quy luật trên cả bảng", "Độ giữ electron", "Những cặp bất ngờ").
- A dot's source takes two taps on the chart (pick the dot, tap its value), like the card ("Tap a value to see where
  it comes from"). One tap straight to the source would cover the chart with a popover at every pick.
- The "Patterns" and "Side by side" places are reached from the card only (plan). A menu entry would need home.js.
