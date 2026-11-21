# PROPOSALS — from the sample session (branches `view-sample`, merged, and `view-sample-r2`)

Changes to shared files that this place needs or that I found while building it. Code changes to shared
files are separate `PROPOSAL: …` commits in the branch (§0–§2); the rest are suggestions for the main
session, who decides. Nothing here is required for the place to work, except where marked.

## 0a. Round 3 (`view-sample-r3`): answers to `reviews/sample-s2.md`

**PROPOSAL commits on `views/sample.js`** (one concern each; the forge's heating path is untouched):

| Commit | What | Review item |
|---|---|---|
| sample view: every bead stays inside the glass | walls a particle's reach inside the glass (a molecule: half its width) plus 1.2 % for the rounded edges; every bead clamped again after the liquid's push-apart, which could carry an edge bead through the wall | A1 (neon through the glass) |
| sample view: molecules read as joined; S₈ is a crown | beads overlap (0.62 of a bond for pairs and P₄, 0.54 for a ring, so its hole stays open); S₈ drawn as its crown (S–S–S about 108°) | A4 (air between atoms), E20 |
| sample view: the building block rests in a vessel sized to it | at rest on the hearth (a pair lying, P₄ on a face, S₈ on its rim), about half the vessel's width (an atom two fifths), turning about the vertical, on a baked contact shadow that fades in the kiln | A4 (floating giant ball) |

**For the main session (shared files it is handling; text only, no code here):**
- **Hearth floor: acne, the diagonal seam, the band on the glowing hearth (A2, A3).** Decals on the hearth
  are lifted by hand: the glass foot at +0.1 % of the vessel's height, the glow decal at +0.2 %, and (new)
  the specimen's contact shadow at +0.3 %. Two hypotheses, neither verified: (1) the lifts lose to depth
  precision (with near R/200, a 24-bit depth buffer leaves them about ten steps; a 16-bit one, none), which
  would stripe the floor; `material.polygonOffset` (factor −1, units −4) on these decals would rule it out.
  If you switch, switch `specShadow` too; it was built like the glass foot. (2) The diagonal seam is the
  hearth's top lit per triangle under the point light. I did not change the hearth.
- **Frozen mercury and the forge's metals (A5):** solid mercury turns from quicksilver to family blue. Left
  to the decision you scheduled together with iron (`DECISIONS.md`). The liquid's mirror lives in
  `applyLook` (`uMirror`, `uBody`) and could take a weaker mirror for any metal by day.
- **The forge's controls (B7, B8):** the rules in `places/sample.js` are ready to lift into the kit's
  shared thermometer, 1:1: an About link under the readout; ink at and below 20 °C (`.sample-read.is-hot`
  only above); "Room temperature" hidden at 20 °C ("Back to 20 °C" on phones); "◀ Cool it" whenever there
  is somewhere to cool to (`renderButtons`, `endOf`).
- **The card (C10, C15):** Gold's expanded card cuts a row mid-glyph above its footer (the kit's 22 px
  fade; the sample sheet now uses 44 px); faint desktop underlines; oganesson's card "At 20 °C: Solid"
  without the italic/≈ of a prediction.
- **Sweep hitches (Smoothness, s16 and the forge's "Heat it"): the engine's adaptive resolution, not the
  place.** A CPU profile of neon's "Cool it" sweep: the main thread is idle 92 % of the time, and the
  place's own code (thermometer, buttons, captions, fluid step) costs under 30 ms in 8 s. The long frames
  line up with `adaptResolution` (engine.js) changing the pixel ratio. Each step (0.75 → 0.34 → 0.3)
  reallocates the canvas and is followed by a 50–67 ms frame, two in a 9 s sweep. Proposal: during a
  sweep or a drag, only step down (never back up) and at most once per 3 s; step back up once the scene
  is idle. Or require two slow windows in a row before stepping. Some 70–250 ms frames at the start of a
  sweep showed an idle main thread: the software renderer under this machine's load (load average about
  8), not page work.

## 0. Round 2 (`view-sample-r2`): PROPOSAL commits, one concern each
Each answers an item of `reviews/sample-s1.md`; the commit message carries the reason.

| Commit | Shared files | What | Review item |
|---|---|---|---|
| data: carry NUBASE2020's half-life uncertainty | `tools/build-data.mjs`, `data/elements.json` | every measured NUBASE half-life gets `u` and a note ("NUBASE2020: 680 ± 540 ms for Og-295") | A1 (**required** for the "± 540" and the smoke step) |
| element card: oganesson is no "unreactive gas" | `places/elementCard.js`, `content/strings-home.js` | a noble gas that is not a gas at 20 °C gets "predicted to be a solid, unlike the other noble gases" | A3 |
| sample view: atoms keep their size from liquid to gas | `views/sample.js` | one bead size per element, solid to gas (STYLE §6) | D17 |
| sample view: molecules of any size (P₄ tetrahedra, S₈ rings) | `views/sample.js` | molecules drawn as their atoms, tumbling; S₈ rings, P₄ tetrahedra | A2 (**required** for "S₈ molecules") |
| sample view: a specimen for the crystals we do not draw | `views/sample.js` | one molecule or one atom turns in the vessel instead of an empty box | D20 (**required** for the captions) |
| sample view: daylight glass that reads as glass | `views/sample.js`, `views/forgeArt.js` | stronger edges, faint body, a contact line on the hearth; the kiln unchanged | D18 |
| sample view: crisper glaze; a liquid metal is quicksilver | `views/sample.js`, `views/tableArt.js` | the tiles' studio light on the beads; a liquid metal by day is a mirror of it | D19 |
| sample view: condensing vapour rains into the pool | `views/sample.js` | no snapping to the pool's rim in mid-air | D22 |
| sample view: condensing drops fall, then the pool gathers them | `views/sample.js` | the pool's pull only near the floor; less drag in the air | D22 |

The forge shares `views/sample.js`. What reaches it: the vapour of a boiled metal keeps the bead size
(STYLE §6), the crisper glaze and the daylight glass; molecules, specimens and the condensation never
occur there. Its smoke step passes unchanged; compare its shots with `--set=hero --only=forge`.

## 1. `views/sample.js` (PROPOSAL commits, one concern each)
Each commit message carries the reason; all are small and leave the forge's heating path unchanged.

| PROPOSAL commit ("sample view: …") | What | Needed for |
|---|---|---|
| draw radon's measured gas and liquid | `sampleStateAt` gives the "predicted" card only to a predicted or unknown state, or to a solid whose crystal is predicted | **Required:** radon (its −71 °C / −61.7 °C are measured; today it shows "never made in bulk") |
| keep whole molecules in the sparse forge gas | a molecule's two atoms are adjacent in the instance list; the 40 % sparse count keeps whole pairs | **Required:** N₂, O₂, H₂, F₂, Cl₂, Br₂ gas showed as single beads |
| a cool liquid is drawn as its atoms | the molten pool forms only while the melt glows | Mercury and bromine at 20 °C were a dark brown disc. Moot if the in-progress forge (every melt drawn as atoms) lands first |
| glide to the vessel when it changes size | re-frame (0.7 s) when the vessel's size changes by over a fifth | Boron and manganese melting from an honest card (camera was far too close) |
| a condensing gas becomes a liquid of touching beads | on gas → liquid, the beads take the liquid size | Every cooled gas (liquid nitrogen looked porous) |

## 2. `places/elementCard.js` (PROPOSAL commit "element card: the sample place words its own door")
The card's second door asks `hooks.sampleDoor(e)` for its words and keeps today's when it returns null
(every forgeable element). Today mercury reads "Hold a piece · heat it / Watch its atoms as it melts and
boils" (it is already liquid), and the 21 never-made-in-bulk elements are promised a piece to hold. The
words live in `strings-sample.js` (`sample.door.*`); one router line passes the hook (WIRING-sample.md).

## 3. A shared thermometer for the kit (`ui/kit.js`, `styles/kit.css`)
Two places draw the same big thermometer (`places/heat.js`, `places/sample.js`). Round 2 rebuilt the
sample's as a copy of the forge's: the same drawn knob over an invisible native thumb, bulb, rail, tick
and flag geometry, panel and kiln values (`sample.css` mirrors `heat.css` value for value). It stays a
self-contained factory, `thermometer()` → `{ el, input, layout({ lo, hi, anchor, events, marks }),
show(T), valueAt(v) }`, so the kit's component can replace it with a one-line change. What the unified
component needs from each:
- from the sample's: **an anchor** (`anchor`: where the bulb sits and the fill grows from; the forge's
  is its left end, room temperature) and **fill colours by temperature** on both sides of it (the
  forge's gradient placed on iron's 20 → 3,200 °C scale, the kit's cold blues below room temperature);
  **one stem per event** under a shared label; **rows push the track down** (`--rows`) instead of
  reaching into the readout above.
- **phones:** at the ends the knob sits 6 px from the panel's edge (both places; review C11, s09). A
  16 px track margin on phones would give it room; I kept the forge's 6 px so the two stay identical.
- **buttons:** the sample hides a button with nowhere to go and reads "Warm it ▶" below room
  temperature; the forge keeps "Heat it again ▶" at its hot end. The kit should pick one rule.
- **"About this … ›"** under the readout (the review asks the forge for it too, B7).
- **Round 3, also ready to lift:**
  - two fill layers: by day the heat reads terracotta → kit orange → `--ember` by 500 °C → glowing
    metal (`HOT_DAY`); the kiln cross-fades to the forge's dark-to-bright gradient (`HOT`);
  - events closer than a finger fan out on angled leaders (one SVG) instead of sharing a label;
  - a play/pause pressed with a mouse holds the row's layout until the pointer leaves (the pressed
    button stays under it as "Pause");
  - a landmark under the knob fades, so it never seems to mark the knob's own temperature.

Older notes from round 1, still open for the forge's copy:
- **Bug in today's `heat.js` tick placement** (committed and in-progress versions): the stem test is
  swapped. A tick in a *higher* row has its stem pass through lower rows, but the code checks the
  *lower* tick's stem against the higher label. Visible as nitrogen's "−196 °C" stem cutting "freezes".
  Correct form: `(p.r <= r || p.x < a - 5 || p.x > b + 5) && (p.r >= r || px < p.a - 5 || px > p.b + 5)`.
  `placeTicks` in `places/sample.js` also tries three orders (importance, right to left, left to right)
  and keeps the first that places every label.
- **Ticks closer than 14 px share one label** ("−249 °C freezes · −246 °C turns liquid": neon's liquid
  range is 2.5 K wide), each keeping its own stem.
- **Flags shift inward instead of vanishing** at the ends; their mark stays on the temperature
  (`--dx`). Room temperature is a flag, never dropped.
- Widths measured with the page's fonts (canvas `measureText`) instead of a per-character estimate.

## 4. Tokens (`design/tokens.js`)
Values used by both `heat.css` and `sample.css` that STYLE.md names but tokens.js does not hold:
- the kiln: ember text on dark `#F0874F` (STYLE §9: 7 : 1), its lighter link `#F0A070`, the knob on dark
  `#FFF6E8`, the bulb `#5A2414`, the panel `rgba(30,23,17,.88)`; by day the knob `#FFFDF8` and bulb `#3B2B24`;
- the thermometer's colours: the forge's gradient (heat.css `.heat-fill`, `HOT` in `places/sample.js`)
  and the cold blues (kit.css `.ui-temp`, `COLD` in `places/sample.js`).

## 5. Retiring the legacy sample view (`ui/samplePanel.js`, view `'sample'`)
The new place covers what the legacy panel did for liquids, gases and cards. Retiring it changes four
smoke steps outside this session's block; what replaces each:
| Legacy step | Covered by |
|---|---|
| `sample view: Fe chips jump past each transition` | the forge step (`930 °C re-stacks…`) |
| `sample view: carbon graphite <-> diamond toggle` | **nothing yet**: the forge has no allotrope switch ("About this crystal ▾", REDESIGN-PLAN §2) |
| `sample view: helium stays liquid near 0 K` | `sample: helium never freezes…` |
| `sample view: "Heat it" raises the temperature` (mercury) | `sample: mercury … "◀ Cool it" sweeps down` |
So the legacy view can go once the forge has carbon's switch. Then `'hold'` can be renamed `'sample'`.

## 6. Smaller things seen from here
- **Desktop cards lack the source hint** phones show ("Tap a value to see where it comes from"; review
  C15), and "Half-\nmetals" breaks inside the word above boron (C16). Both are the card's / table's.
- **Vietnamese back link** (`places/home.js` `renderBack`): it uses `name()` ("Mercury", "Iron") while the
  card leads with the familiar GDPT-2018 name ("Thuỷ ngân", "Sắt"). The card's title rule would match.
- **Numbers and units wrap apart** in shared formatters (`fmtTemp`, the card's `degC`: "1,840 / km/h",
  "20 / °C" at phone width). The sample place binds them with a no-break space (` `).
- **Phone framing** (`frameGoal`): it fits the vessel's bounding sphere, but the hearth is 1.32× wider, so
  on phones the hearth's corners leave the screen (forge and sample alike).
- **Forge by URL for a non-forgeable element** (`#v=heat&el=N`): the caption says "its atoms in their
  measured pattern" and predicted events show without "≈". Moot once the router sends them here, but
  `heat.js` could guard.
- **Mercury's card (bug):** its melting note reads "Lower than mercury (29.8 °C), the lowest-melting
  metal". `meltAnchor` drops mercury from its own ladder, so the coldest landmark left is gallium, but
  `card.coldest` names mercury: gallium's temperature under mercury's name. For mercury itself the note
  could say it is the lowest-melting metal.
- **Card, never-made elements on phones:** "≈ 51.9 °C" (a prediction with a decimal) and "not in our
  sour…" clipped in the fact strip.
