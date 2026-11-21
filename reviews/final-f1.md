# Final First-Time-Visitor Review — Round F1

**Build reviewed:** master `7993c35` (`index.html` commit `c7dd7d8`), 142 screenshots in `/workspace/out/redesign/final` (desktop `1440×900` and phone `390×844`, EN + VI) plus `fps.txt`.  
**Reviewer stance:** Curious adult who left chemistry decades ago / software developer, inspecting every screenshot cold before checking `STYLE.md`, `SPEC.md` (Feel), `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`.

---

## 1. First 5 Seconds

- **What I think this is:** An interactive, tactile 3D Periodic Table presented like a museum specimen tray or an illustrated science book on warm cream paper (`h-01-first-load-desktop.png`, `h-01-first-load-phone.png`). It immediately feels calm, editorial, and inviting—nothing like a cluttered school chart or a neon sci-fi dashboard.
- **What I think I should do:** Tap an element tile. On desktop, the bottom prompt (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds." / "Tap one to look inside."*) and the gentle `"Try iron"` callout (`h-02-try-iron-hint-desktop.png`) make the first click unmistakable. On phone, `"Touch and slide across the table — lift to open."` explains how to target tiny tiles without squinting, and the thumb-scrubbing loupe (`h-03-thumb-scrub-phone.png`) pays that promise off immediately.
- **What draws my eye:** On desktop, the soft-lit ceramic blocks in gentle perspective draw the eye dead-centre first, followed by the serif sentence and the verdigris `Families` pill at the bottom. On close zoom (`h-10-zoom-in-desktop.png`), the bevelled porcelain glaze and soft shadows make the tiles look genuinely touchable.
- **Anything confusing in the first 5 seconds:**
  1. On desktop (`h-01-first-load-desktop.png`), the floating label *`Mineral metals`* sits right next to green `H` (above `Be`), so for half a second it looks like it could be labelling Hydrogen rather than column 2.
  2. On phone (`h-01-first-load-phone.png`), the table occupies only a thin horizontal band in the middle of two huge empty cream voids, while the bottom half is dominated by a 4-row swatch legend plus **three** rows of lens chips (with `More ▾` orphaned alone on row 3, contrary to `STYLE.md` §5's two-row rule). The visual balance feels slightly bottom-heavy and sparse in the middle.
  3. On first glance, `"Heft"` and `"Grip on electrons"` are refreshingly human, though a visitor may briefly wonder if `"Heft"` means atomic weight or bulk density until they tap it (the banner immediately clarifies `"density"`).

---

## 2. Scores (1–5, half points allowed; strict: 4 = genuinely good, 5 = exceptional)

Target: **≥ 4.0 everywhere** and **4.5+ on beauty and delight**.

### Part 1: Table and Element Card (`h-`)

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **4.5** | Plain family names printed directly on the table, a clear 3-fact + 3-door card, and instant heat-map / melting-point lenses make the home surface understandable in seconds, with only minor ambiguity around *Mineral metals* sitting beside `H`. |
| **Ease** | **4.5** | One obvious action on desktop, a smart thumb-scrubbing loupe on phone (`h-03-thumb-scrub-phone.png`), and persistent `← All elements` / `⌂ Whole table` returns make navigation effortless, slightly marred by `All numbers & sources` clipping into the footer fade on Gold (`h-05-card-gold-desktop.png`). |
| **Beauty** | **4.5** | Tactile matte-glazed ceramic tiles, soft baked shadows, and disciplined paper-and-ink typography shine on desktop (`h-01`, `h-10`), held back from 5 by the phone landing's awkward vertical whitespace / 3-row chip stack (`h-01-phone`) and uneven fact font weights (`h-04`, `h-05`). |
| **Smoothness** | **4.5** | `fps.txt` reports 59.9 FPS median on desktop and a locked 60.0 FPS avg (p95 16.8 ms) on phone even under SwiftShader software rendering, with desktop p95 rising to 33.3–33.4 ms under heavy host load. |
| **Delight** | **4.5** | The porcelain materiality, `"Try iron"` invitation, whole-table 1,000 °C melting/boiling map (`h-08`), and 3D melting-point towers (`h-09`) reward curiosity from the very first tap. |

### Part 2: Patterns Across the Table (`p-`)

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **4.0** | Question-led headlines, shaded period bands, and row-vs-column connectors make periodicity genuinely graspable, but phone charts drop unit explanations (`pm`, `eV`) and the `---` legend icon wrongly means both "no dot" and the dashed 20 °C line (`p-01`). |
| **Ease** | **4.0** | Scrubbing along the chart on phone (`p-12`), tapping values for instant provenance (`p-05`), and jumping straight to `See it on the table →` feel natural, though mobile callouts collide with dots (`p-01-phone`, `p-11-vi-grip-phone.png`). |
| **Beauty** | **4.0** | Editorial Tufte-like typography and pastel ceramic dots look refined on desktop, but fall short of 4.5 because mobile callout placement overlaps data series (`p-01-phone`, `p-03-phone`) and a long diagonal leader line slashes across two rows on Vietnamese phone (`p-11-vi-grip-phone.png`). |
| **Smoothness** | **4.5** | Locked 60.0 FPS avg and 16.7 ms p95 on SwiftShader (`p01-from-card-melting-desktop`), with clean mid-ripple transition frames (`p-13`). |
| **Delight** | **4.0** | Flipping from `Across each row` to `Down each column` (`p-06`, `p-14`) and seeing Mendeleev's repeating wave jump off the page creates a real intellectual spark, slightly dampened by mobile chart crowding. |

### Part 3: Side by Side (`c-`)

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **4.5** | The ceramic balance (`A litre of each`), to-scale spheres (`One atom of each`), flat dishes when Oganesson's weight is unknown (`c-06`), dashed `?` unknown radius (`c-11`), and Graphite vs Diamond lattices (`c-05`) communicate contrasts effortlessly, lacking only brief unit glosses for `pm` and `eV` inside the card. |
| **Ease** | **4.5** | Curated surprising pairs, instant swap, inline `change ▾` / `Pick any two...` pickers (`c-07`, `c-15`), and sticky scrolled sheet headers (`c-08`, `c-16`) make comparisons frictionless, with only an abrupt left crop on scrolled phone pair chips (`c-05-phone`). |
| **Beauty** | **4.5** | Sculptural porcelain balance pans, crisp ink wires, glass gas cubes, and clean ball-and-stick crystal networks feel museum-grade, with minor dings for `118` crowding `Og` in the badge (`c-06`) and mercury's lone realistic silver puddle contrasting against family-coloured cubes/liquids (`c-02`, `c-13`). |
| **Smoothness** | **5.0** | Locked 60.0 FPS avg and 16.7 ms p95 on SwiftShader phone (`c02-gold-mercury-phone`), with effortless layout continuity across balance, atom-size, and crystal modes. |
| **Delight** | **4.5** | Tungsten and Gold balancing dead-level at 19.3 kg (`c-12`), Helium's wispy cube versus Osmium (`c-03`), and Graphite vs Diamond (`c-05`) deliver memorable, shareable surprises. |

### Part 4: Hold a Sample (`s-`)

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **3.5** | **Blocks ≥ 4:** Iron's forge (`s-13`–`s-17`), Mercury's crystal (`s-06`), Helium never freezing (`s-08`), and Oganesson's empty case (`s-12`) are crystal-clear, but **Phosphorus (`s-19`) mixes two incompatible allotropes into a factual error** (P₄ pyramids with red phosphorus's 416 °C sublimation point) and thermometer landmarks fade to near-invisible contrast (`s-11`, `s-16`, `s-17-phone`, `s-20`). |
| **Ease** | **4.0** | Direct thermometer dragging, `Cool it` / `Heat it ▶` auto-play with `Pause`, `Room temperature` reset, and adaptive card doors work smoothly, though Iron's phone card breaks layout consistency with every other element's phone card (`s-13-phone` vs `s-06-phone`). |
| **Beauty** | **4.0** | The room dimming into `--kiln` as Iron glows cherry-red to molten orange and incandescent vapour (`s-14`–`s-17`) is extraordinary, but beauty drops below 4.5 due to atoms escaping outside the glass walls in `s-16-neon-condensing-desktop.png` and stark single-molecule/single-marble fallbacks (`s-04`, `s-17-manganese-room`, `s-18-iodine`). |
| **Smoothness** | **3.5** | **Blocks ≥ 4:** `fps.txt` shows clear frame-rate drops on liquid/molten/condensing stages (`16-forge-1600C-molten-desktop` avg **39.5 FPS**, `s16-neon-condensing-desktop` avg **44.0 FPS**, `s05-mercury-liquid-desktop` avg **50.2 FPS**, all with p95 **33.4 ms**), plus a jarring visual jump from ~200 molecules in liquid Nitrogen (`s-03`) to one giant dimer when frozen (`s-04`). |
| **Delight** | **4.5** | Watching iron heat into a glowing forge, snap from 8 to 12 neighbours at 912 °C, melt, and boil—plus Oganesson's poignant empty glass display case (`s-12`)—deliver genuine emotional and scientific delight. |

### Part 5: Look Inside the Atom (`a-`)

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **4.0** | Stippled probability clouds, honest nucleus enlargement labels, Chromium's surprise callout (`a-04`), and `Its light`'s starlight framing demystify quantum orbitals, but clarity is dulled by the generic headline repeated on every element, awkward `Source of the first line` text, unexplained `nm`, Iron's contradictory `2,542` vs `651` lines copy (`a-07`), and a stray orphan period on Uranium (`a-12`). |
| **Ease** | **4.0** | The `− proton` / `+ proton` stepper, `Whole atom / One cloud / Its light` tabs, and tappable emission lines are intuitive, but dark-mode active tab contrast is weak (`a-07`, `a-08`), `Source of the first line` stops looking clickable in dark mode, and cards clip controls/legends (`a-05-phone`, `a-12b`, `a-14-phone`). |
| **Beauty** | **4.5** | The translucent stippled vermilion-and-cobalt orbitals with rice-paper nodal planes (`a-05`, `a-06`, `a-11`, `a-12b`) and CIE-mixed spectral glows (`a-08b`, `a-16`, `a-17`) are genuinely 5/5 scientific art, trimmed to 4.5 only by card-bottom clipping and tight phone label crowding (`a-02-phone`, `a-04-phone`). |
| **Smoothness** | **5.0** | Locked 60.2 FPS avg and 16.7–16.8 ms p95 on both desktop and phone SwiftShader (`atom-02-iron-desktop`, `atom-07-light-iron-phone`), with clear scale-dive (`a-01a`/`a-01b`), Chromium electron-hop (`a-04b`), and spectral-ripple (`a-08b`) motion cues. |
| **Delight** | **5.0** | Seeing 4s's concentric radial nodes (`a-06`), spinning an 8-lobe 5f cloud (`a-12b`), watching Chromium pull an electron inward (`a-04b`), and tapping a red neon spectral line to launch a glowing ripple (`a-08b`) are unforgettable. |

### OVERALL

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **4.0** | Consistently plain-spoken, honest about approximations, and clear within 5 seconds across five distinct views, held back from 4.5 by the Phosphorus allotrope error (`s-19`), low-contrast faded thermometer landmarks, Iron's `2,542`-vs-`651` spectral copy mismatch (`a-07`), and missing mobile unit captions. |
| **Ease** | **4.0** | Coherent "places, not tabs" navigation, reliable back/reset controls, and strong phone scrubbing make the whole app welcoming, needing fixes for card-bottom clipping (`h-05`, `a-05-phone`, `a-12b`, `a-14-phone`), weak dark-mode affordances (`a-07`), and inconsistent Iron phone sample layout. |
| **Beauty** | **4.5** | "Porcelain & Ink" succeeds as a cohesive, original museum-book aesthetic that balances daylight porcelain with dark-room fire and starlight—meeting the 4.5+ goal despite isolated polish blemishes (escaped neon atoms, phone landing voids, mobile chart collisions). |
| **Smoothness** | **4.0** | Most views hold a silky 60 FPS even on software-rendered SwiftShader (`fps.txt`), pulled down from 4.5 by 39.5–50.2 avg FPS (33.4 ms p95) frame drops in molten/liquid/condensing sample simulations. |
| **Delight** | **4.5** | Between the glazed tiles, Iron's glowing forge re-stacking, Oganesson's empty glass case, Tungsten-vs-Gold balance, and rice-paper quantum orbitals + emission ripples, this genuinely achieves "calm wonder" and hits the 4.5+ delight target. |

### Comparison vs Ryan Sael's `sael.net/periodic-table` (on feel)
**Yes — decisively better on feel, readability, scientific honesty, and usability.** Compared against `ref/VIDEO_NOTES.md`, Ryan Sael's dusk photoreal showroom relies on heavy bloom, small 3D labels, generic cubic sample grids, no search, no trends/compare views, and heavy frame times that struggle on modest devices. This redesign feels calmer, far easier to read (crisp paper contrast, ≥ 14 px screen-space typography, thumb-scrubbing loupes on phone), far more informative (real BCC/FCC/rhombohedral crystals, true ψ(n,l,m) lobes with nodal planes, NIST emission lines, one-tap sources on every number), and dramatically smoother on low-end/software renderers. The only charm advantage Ryan Sael retains is his separate **Demo** tab of tangible everyday dioramas (alkali + water, flame tests, neon tubes, iron filings + magnet — intentionally scoped to "Later" in `SPEC.md` §5). Once the `Hold a sample` clarity/smoothness blockers below are fixed, this outperforms Ryan Sael's on feel across the board.

### Does every view answer "why should I care?" for a non-expert?
- **Table & Element card (`h-`): Yes.** The landing line (*"Everything you have ever touched is made of atoms..."*) and element hooks (Iron = steel & haemoglobin; Gold = corrosion-free coins & jewellery; Oxygen = every breath & half of Earth's crust) ground every element in daily life.
- **Patterns (`p-`): Yes.** Every chart opens with an everyday question (*"Why does tungsten glow in a light bulb without melting?"*, *"Why does sodium explode in water?"*, *"How rare is gold?"*, *"Which atoms hog the electrons they share?"* -> why water dissolves salt).
- **Side by side (`c-`): Mostly yes.** Curated pairs all have strong hooks (relativity making mercury liquid, helium balloons vs osmium, table salt, pencil graphite vs diamond). Arbitrary pairs are flatter: e.g. `c-11-iron-gold-one-atom-desktop.png` says *"Iron and gold atoms are about the same size."* without highlighting *why* that's mind-bending (gold packs 79 protons vs iron's 26 into almost the same width, which is why a litre of gold weighs 2.4× more!).
- **Hold a sample (`s-`): Mostly yes.** Heating iron through its forge re-stacking, helium refusing to freeze, and Oganesson's empty glass box are compelling; however, single-molecule/single-atom room-temperature captions (`s-17-manganese-room`, `s-18-iodine`, `s-19-phosphorus`) jump straight into structural mechanics without a human "why you know it" anchor.
- **Look inside the atom (`a-`): Partial.** `Its light` nails it (*"Every element glows its own colours: it is how we know what the stars are made of."*), but `Whole atom` and `One cloud` repeat the exact same abstract 6-word slogan (*"Cloud shapes decide how atoms join."*) on **every single element** from Hydrogen to Oganesson (`a-02`, `a-03`, `a-04`, `a-10`, `a-11`, `a-12`, `a-15`). A non-expert looking inside Iron, Carbon, Gold, or Oganesson gets no element-specific reason why *these* electron clouds matter (e.g. unpaired 3d electrons -> magnetism in iron; 4-way bonding in carbon; relativistic 6s/5d gap -> gold's yellow colour).

---

## 3. Every Visible Problem

### Factual Errors & Data Contradictions
1. **Phosphorus allotrope contradiction (`s-19-phosphorus-room-desktop.png` vs `p-01-from-card-melting-desktop.png`):** `Hold a sample` renders **P₄ tetrahedral pyramids** (*"a crystal of little pyramids of 4 phosphorus atoms (P₄)"*)—which is **white phosphorus**—yet its thermometer shows **`416 °C turns to gas`** with no melting point, which is the sublimation temperature of **red phosphorus** (a covalent polymeric network, *not* P₄ pyramids). White phosphorus (P₄) melts at **44.15 °C** and boils at **280.5 °C**, and indeed `p-01-from-card-melting-desktop.png` plots Phosphorus at ~44 °C (not ringed as subliming). Mixing white phosphorus's molecular geometry with red phosphorus's sublimation temperature is a factual error and contradicts the Patterns chart.  
   - Sources: [PubChem — Phosphorus](https://pubchem.ncbi.nlm.nih.gov/element/Phosphorus) (white P: mp 44.15 °C, bp 280.5 °C); [Royal Society of Chemistry — Phosphorus](https://www.rsc.org/periodic-table/element/15/phosphorus) (white P₄ molecular solid vs red polymeric P subliming at ~416 °C).
2. **Contradictory spectral line counts on Iron (`a-07-light-iron-desktop.png`):** Immediately below **`Its 8 brightest lines to the eye, out of 2,542 measured lines`**, the next sentence reads: **`Why blue? The glow mixes all 651 lines in our source, not only the brightest...`**. Showing two unexplained totals (`2,542` vs `651`) in consecutive lines looks like a bug/contradiction to any attentive reader (presumably 2,542 total NIST lines vs 651 *visible* lines in 380–750 nm—if so, say *"all 651 visible lines"*).

### Overlapping or Clipped Text / Controls
3. **Element card clips `"All numbers & sources"` on Gold (`h-05-card-gold-desktop.png`):** Because Gold's `"Side by side"` subtitle wraps to 2 lines, `"All numbers & sources"` is pushed almost completely into the bottom fade/clip right above `‹ Platinum  Mercury ›`, leaving only the top 2–3 pixels of the letters visible.
4. **`One cloud` clips `"all 5"` button on phone (`a-05-one-cloud-3d-phone.png`):** Under `Which one`, the `all 5` pill button is sliced in half horizontally at the bottom edge of the sheet above the footer divider.
5. **`One cloud` clips colour-phase legend on Uranium 5f (`a-12b-uranium-5f-cloud-desktop.png`):** With 7 shells and 7 orbitals wrapping to two rows each, the line `● Vermilion and ● cobalt are the two opposite signs` is half-clipped at the bottom of the right card above the footer divider.
6. **Vietnamese Sodium `Its light` clips text above footer (`a-14-vi-light-sodium-phone.png`):** Tops of clipped letters peek out immediately above the bottom divider line.
7. **Patterns mobile callouts collide with data dots/lines:**
   - `p-01-from-card-melting-phone.png`: *`In rows 2–6, the noble gas melts coldest`* sits directly on top of the Row 6 data curves/dots, and *`Tungsten: 3,422 °C, the highest melting point`* overlaps the top of the tungsten dot.
   - `p-03-heft-gold-phone.png`: *`Gases: a litre weighs only grams`* touches the rising Row 5 blue dots, and its vertical leader cuts straight through the Row 2–3 dots.
   - `p-11-vi-grip-phone.png`: The leader line for *`Kim loại mềm, dễ phản ứng buông dễ nhất`* slashes diagonally across the entire width of Row 4 and Row 5, crossing over dozens of dots and lines (while the English version `p-12-scrub-phone.png` places the label cleanly underneath Row 4 with no crossing line).
8. **Stray orphan period on its own line (`a-12-uranium-desktop.png`):** The Uranium exception text ends with `instead of shell 5's many-lobed clouds (5f)` followed by a lone `.` wrapped onto the next line.
9. **3-digit atomic number `118` crowds `Og` inside small element badges (`c-06-hydrogen-oganesson-phone.png`, `c-06-desktop`, `s-00-card-oganesson-door-phone.png`, `a-15-oganesson-desktop.png`):** `118` nearly touches the top of the `O` in `Og` (especially tight on phone).
10. **Atoms escape outside the glass container walls (`s-16-neon-condensing-desktop.png`):** Two purple neon spheres float visibly **outside** the left and right edges of the glass cube during condensation.

### Low Contrast & Weak Affordances
11. **Faded thermometer landmarks drop to unreadable contrast:**
    - Dark kiln cards: *`iron melts`* in `s-11-manganese-molten-kiln-desktop.png` and *`copper melts`* in `s-11-manganese-molten-kiln-phone.png` and `s-17-manganese-red-hot-phone.png` fade to faint dark-grey text on dark brown, failing WCAG contrast (`STYLE.md` §3 specifies `--kiln-text-2` at 8.5:1).
    - Light paper cards: *`absolute zero`* in `s-16-neon-condensing-desktop.png` and *`liquid nitrogen`* in `s-20-neon-close-events-phone.png` fade to near-invisible pale grey even when `liquid nitrogen` isn't overlapping the slider thumb.
12. **Weak active state and invisible link affordance in `Its light` dark mode (`a-07`, `a-08`, `a-14`, `a-16`, `a-17`):** Unlike light mode—where active tabs use solid `--verdigris` fill (`a-02`, `a-05`) and `Source of the first line` is teal—in dark mode the active `Its light` pill loses its fill (just a thin white outline, barely distinct from inactive pills) and `Source of the first line` turns plain bold white text that does not look tappable.

### Jargon Without a Human Phrase / Confusing Symbols
13. **`---` legend glyph wrongly labelled `"no dot"` (`p-01`, `p-02`, `p-03`, `p-08`, `p-10`, `p-11`, `p-12`, `p-16`):** Patterns uses a dashed-line symbol `---` for *"no dot: helium never freezes..."* and *"no dot: no value in our sources"*, right beside the exact same `---` dashed-line symbol for *"room temperature, 20 °C"* (`p-01-from-card-melting-phone.png`). Missing values have *blank gaps*, not dashed lines—reusing `---` is genuinely confusing.
14. **Missing unit explanations on phone and in Side by Side / Its light:**
    - Patterns phone omits the subtitle explaining `pm` (*"a picometre is a trillionth of a metre"*) and `eV` (*"electronvolts"*) that desktop shows (`p-02-size-iron-phone.png`, `p-12-scrub-phone.png`, `p-11-vi-grip-phone.png`).
    - `Inside the atom` phone omits *"a picometre is a trillionth of a metre"* under the `200 pm` / `50 pm` / `100 pm` scale bar (`a-02-phone`, `a-05-phone`, `a-10-phone`).
    - `Side by side` shows `pm` and `eV` (`c-01`–`c-18`) with no plain-English unit gloss anywhere in the card.
    - `Its light` shows `538.3 nm`, `614.3 nm`, `656.3 nm` (`a-07`, `a-08`, `a-17`) without ever saying what `nm` stands for (*nanometres — billionths of a metre, the wavelength of light*).
15. **Awkward meta-label `"Source of the first line"` (`a-02`–`a-17`):** Every other view (Element card, Patterns, Side by side) places a clean inline `Source` pill right after the claim. `Inside the atom` breaks that pattern with a separate line reading `"Source of the first line"` directly under `"Tap underlined values for sources."` (also translated literally as `"Nguồn của câu đầu"` in VI `a-13`, `a-14`), which reads like an internal spec note rather than museum copy.

### Inconsistent Spacing, Layout & Typography Between Views
16. **Inconsistent font weights on desktop Element Card values (`h-04`, `h-05`, `s-00-mercury` vs `h-04-phone`, `h-07`):** On `h-04-card-iron-desktop.png` and `h-05-card-gold-desktop.png`, `Solid` and `1,538 °C` / `1,064 °C` render bold, while the density value right below (`7.9 kg`, `19.3 kg`) renders visibly thinner/regular weight; on `s-00-card-mercury-door-desktop.png`, both `−38.8 °C` and `13.5 kg` look lighter than `Liquid`. Meanwhile on phone (`h-04-phone`, `h-05-phone`) all three values render uniformly bold.
17. **Inconsistent phone card layout between Iron forge and other samples (`s-13-forge-start-phone.png`, `s-14-forge-700C-glow-phone.png`, `s-16-forge-1600C-molten-phone.png`):** On Iron's phone card, `solid · 8 neighbours each` sits *inline* beside `20 °C` and `About this sample ›` drops onto a new row on the left; on every other element's phone card (`s-02`, `s-03`, `s-05`, `s-06`, `s-08`, `s-09`, `s-11`, `s-17-manganese`, `s-18-iodine`, `s-20-neon`), the status sits under the temperature on the left and `About this sample ›` aligns cleanly on the right.
18. **Missing `nucleus` label on Vietnamese Sodium `Its light` phone (`a-14-vi-light-sodium-phone.png`):** Unlike `a-07-light-iron-phone.png` and `a-17-light-hydrogen-phone.png`, no `hạt nhân` callout appears on the glowing sodium atom.

### Cheap-Looking / Sparse 3D & Mobile Issues
19. **Stark single-molecule / single-atom fallback in an oversized empty glass box (`s-04-nitrogen-frozen-desktop.png`, `s-17-manganese-room-desktop.png`, `s-17-manganese-red-hot-phone.png`, `s-18-iodine-room-phone.png`):** Going from ~200 condensing N₂ pairs in liquid nitrogen (`s-03`) to **one giant floating green dumbbell** in an empty glass cube when it freezes (`s-04`), or one lonely glossy blue marble for room-temp manganese (`s-17`), looks sparse and placeholder-like next to Iron's and Mercury's rich multi-atom crystal lattices. Even a modest 2×2×2 or 3×3×3 cluster of N₂/I₂ pairs (or a clearly zoomed-in "microscope inset" frame rather than the same big glass cube) would feel far less jarring.
20. **Phone first-load framing & 3-row chip wrap (`h-01-first-load-phone.png`):** The table sits small in the middle of excessive vertical cream space, and the bottom lens chips wrap into 3 rows (`3 + 3 + 1`) instead of 2 balanced rows (`STYLE.md` §5 explicitly specifies *"two rows, never cut mid-word"*).
21. **Abrupt left-edge crop on phone `"Surprising pairs"` rail (`c-05-graphite-diamond-phone.png`, `c-06-phone`):** The horizontal pill strip fades cleanly on the right under `Pick any two...`, but hard-clips words like `hlorine` and `amond` at the left viewport edge with no fade mask.
22. **Tight overlapping callout badges on phone `Whole atom` (`a-02-iron-phone.png`, `a-04-chromium-surprise-phone.png`, `a-13-vi-iron-phone.png`):** `clover cloud · shell 3` and `nucleus` stack tightly on the right side of the atom with semi-opaque boxes touching the outer shell ring.
23. **Subtle material-rule surprise in `Side by side` (`c-02`, `c-13`):** While intentional per `STYLE.md` §6 (mercury wears quicksilver while other elements wear family glazes), seeing realistic silvery mercury next to a flat slate-blue Gold cube (`c-02`) and dusty-pink Bromine puddle (`c-13`) makes a first-time visitor briefly wonder why only mercury gets its real colour (and unlike `Hold a sample`'s `About this sample`, `Side by side` never explains the family-glaze convention).

---

## 4. Ranked Fix List (Most Impact on Feel First)

Items marked **`[BLOCKS ≥ 4]`** must be fixed to reach ≥ 4.0 on every criterion across every part (specifically `Hold a sample` Clarity 3.5 and Smoothness 3.5).

1. **`[BLOCKS ≥ 4]` Fix the Phosphorus allotrope factual error (`s-19-phosphorus-room-desktop.png`):** Pick one consistent allotrope across both `Hold a sample` and `Patterns`. Recommended: keep **white phosphorus (P₄ pyramids)** to match `Patterns` (where P is already plotted at ~44 °C) and update the `Hold a sample` thermometer to **`44 °C melts`** and **`281 °C boils`** (explicitly naming *"White phosphorus (P₄)"* in the caption and noting in `About this sample` that red phosphorus is a polymeric chain that sublimes at 416 °C).
2. **`[BLOCKS ≥ 4]` Fix molten / liquid / condensing sample frame drops (`fps.txt` — `16-forge-1600C-molten`, `s16-neon-condensing`, `s05-mercury-liquid`):** On the automatic Low tier, average FPS drops to 39.5–50.2 FPS with 33.4 ms p95 spikes. Profile the per-frame update and draw cost of the liquid/condensing particle sim (especially the instanced incandescent glow pass + point-light + O(N²) or dense neighbour loop in molten iron and condensing neon), reduce particle count / glow overdraw on Low tier, and cap per-frame physics substeps so molten/condensing stages hold ≥ 55 avg FPS and ≤ 20 ms p95.
3. **`[BLOCKS ≥ 4]` Stop thermometer landmarks from fading to unreadable contrast (`s-11`, `s-16`, `s-17-phone`, `s-20`):** Remove or clamp the thumb-proximity opacity fade on secondary thermometer flags (`iron melts`, `copper melts`, `absolute zero`, `liquid nitrogen`) so text never drops below `--kiln-text-2` (`#B9AC9C`, ≥ 4.5:1) on dark kiln cards or `--ink-2` on light cards. If a flag genuinely collides with the knob, hide it cleanly (`opacity: 0`) rather than leaving ghosted low-contrast text, and only when within ~18 px of the knob centre.
4. **Keep condensing atoms strictly inside the glass vessel (`s-16-neon-condensing-desktop.png`):** Clamp particle positions (accounting for sphere radius + glass wall thickness) to the interior bounds of the glass cube during condensation transitions so no atoms clip or float outside the walls.
5. **Fix card-bottom clipping across desktop & phone (`h-05-card-gold-desktop.png`, `a-05-one-cloud-3d-phone.png`, `a-12b-uranium-5f-cloud-desktop.png`, `a-14-vi-light-sodium-phone.png`):**
   - Tighten vertical spacing slightly on the desktop Element Card (or add bottom padding + a clearer scroll shadow/chevron) so `All numbers & sources ▼` fits cleanly above the footer even when the `"Side by side"` subtitle wraps to 2 lines (Gold).
   - Give the `Inside the atom` card/sheet body adequate bottom padding and a subtle fade mask (or slightly more compact pill row spacing for `Shell / Clouds / Which one`) so `all 5` on phone (`a-05-phone`) and the vermilion/cobalt legend on Uranium 5f (`a-12b`) never get hard-sliced mid-line.
6. **Fix Patterns mobile callout collisions & Vietnamese leader line (`p-01-phone`, `p-03-phone`, `p-11-vi-grip-phone.png`):**
   - Fix the anchor placement logic on Vietnamese `Grip on electrons` phone (`p-11-vi-grip-phone.png`) so *`Kim loại mềm, dễ phản ứng buông dễ nhất`* sits cleanly beneath Row 4 like its English counterpart (`p-12-scrub-phone.png`) instead of drawing a diagonal line across two periods.
   - Reposition *`In rows 2–6, the noble gas melts coldest`* and *`Tungsten: 3,422 °C...`* on `p-01-phone` (and *`Gases: a litre weighs only grams`* on `p-03-phone`) into open whitespace above/below the curves, shortening copy on narrow viewports where needed.
7. **Resolve the `2,542` vs `651` spectral line discrepancy on Iron (`a-07-light-iron-desktop.png`) and remove the orphan period on Uranium (`a-12-uranium-desktop.png`):**
   - Clarify Iron's `Its light` copy to *"Its 8 brightest lines to the eye, out of 2,542 measured lines"* -> *"Why blue? The glow mixes all 651 **visible** lines in our source..."* (or align both numbers to the exact same visible-range subset).
   - Remove the stray space/inline-block break before `.` in Uranium's filling-order sentence (`a-12-uranium-desktop.png`) so the period never wraps onto its own line.
8. **Restore clear active-tab & link affordances in `Its light` dark mode (`a-07`, `a-08`, `a-14`, `a-16`, `a-17`) and replace `"Source of the first line"`:**
   - Give the active `Its light` tab pill a distinct filled state in dark mode (e.g. warm cream/kiln-text fill with dark ink text, matching the `+ proton` contrast, or bright verdigris tint) so active vs inactive tabs read at a glance.
   - Replace the clunky `"Source of the first line"` text link across all `Inside the atom` cards with the same inline `Source` pill used on Element cards, Patterns, and Side by side—making provenance visually unified and immediately clickable in both light and dark themes.
9. **Fix the `"--- no dot"` legend icon in Patterns (`p-01`–`p-16`):** Replace `---` for missing dots with a visually distinct empty/gap glyph (e.g., `◌` dashed circle or `(no dot)` without a dashed-line icon) so `---` belongs exclusively to dashed reference lines like `room temperature, 20 °C`.
10. **Give `Whole atom` / `One cloud` an element-specific "why should I care?" hook (`a-02`–`a-15`):** Instead of repeating *"Cloud shapes decide how atoms join."* verbatim on every element, surface a 1-line element- or family-specific electron hook (e.g. Iron: *"Four unpaired electrons in shell 3 are what make iron magnetic."* / Carbon: *"Four outer electrons in shell 2 let carbon build chains, rings, and DNA."* / Gold: *"Fast inner electrons pull shell 6 closer, giving gold its yellow gleam."*) while keeping the general rule as fallback.
11. **Add compact plain-English unit captions everywhere (`pm`, `eV`, `nm`):**
    - Keep a short unit gloss (`pm = trillionth of a metre`, `eV = electronvolt`, `nm = billionth of a metre, light wavelength`) visible on phone Patterns (`p-02`, `p-11`, `p-12`), phone Atom scale bars (`a-02`, `a-05`, `a-10`), `Side by side` (`c-01`+), and `Its light` (`a-07`+)—at least as a quiet one-line footer caption or inside the first tap-for-source popover.
12. **Upgrade the single-molecule frozen solid view (`s-04-nitrogen-frozen-desktop.png`, `s-18-iodine-room-phone.png`):** Instead of cutting abruptly from ~200 N₂ pairs in liquid nitrogen (`s-03`) to a single oversized green dimer in an empty glass cube (`s-04`), either render a small tidy 3×3×3 molecular crystal of N₂ / I₂ pairs on the hearth, or visually frame the single-molecule showcase as an intentional close-up plinth (tighter camera / smaller vessel, per `STYLE.md` §6 *"in a vessel sized to it"*) so the container doesn't look 90 % empty.
13. **Unify desktop Element Card value font weights (`h-04`, `h-05`, `s-00-mercury`) and Iron's phone sample header (`s-13-phone`–`s-16-phone`):**
    - Ensure all three headline values on the desktop Element Card (`Solid`, `1,538 °C`, `7.9 kg`, and negative temperatures like `−38.8 °C`) share the exact same font family and semibold weight (`600`), matching the clean phone card.
    - Align Iron's phone sample card (`s-13-phone`, `s-14-phone`, `s-16-phone`) with the standard two-column header used by all other samples (temperature + state stacked on the left, `About this sample ›` aligned on the right).
14. **Polish phone home composition & minor visual nits (`h-01-phone`, `c-05-phone`, `c-06`, `a-14-phone`):**
    - On `h-01-first-load-phone.png`, tighten chip padding/gaps slightly or group into a clean 2-row grid (`STYLE.md` §5: *"two rows, never cut mid-word"*) and slightly increase the table's vertical framing so it doesn't sit tiny between wide empty bands.
    - Add a left-edge fade gradient to the horizontally scrollable `"Surprising pairs"` rail on phone (`c-05-phone`, `c-06-phone`).
    - Slightly reduce or reposition the 3-digit atomic number (`118`) inside 40–44 px element badges (`c-06`, `s-00-oganesson`, `a-15`) so `118` has breathing room above `Og`.
    - Nudge desktop *`Mineral metals`* (`h-01-first-load-desktop.png`) a few pixels right so it sits squarely over column 2 (`Be`) rather than beside `H`.
    - Restore the missing `hạt nhân` label on Vietnamese Sodium `Its light` phone (`a-14-vi-light-sodium-phone.png`).
