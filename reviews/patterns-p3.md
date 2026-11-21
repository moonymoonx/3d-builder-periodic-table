# First-Time-Visitor Review — Patterns & Side by Side (Round P3, merged build `60a2cde`)

Reviewed all 46 screenshots in `/workspace/out/redesign/patterns-r3-merged/` (desktop `1440×900` and phone `390×844`) cold, before consulting `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, `ref/VIDEO_NOTES.md`, or the FPS logs.

---

## 1. First 5 Seconds

- **What I think this is:** A sunlit museum monograph / interactive science essay about the elements—calm, warm linen paper, matte ceramic blocks, and *New York Times*-grade editorial charts and physical comparisons. Nothing about it feels like a homework sheet or a dark gamer dashboard.
- **What draws my eye:**
  - **Table (`b00`):** The tactile 3D pastel tiles and the serif prompt underneath (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds. Tap one to look inside."*).
  - **Patterns (`p`):** The bold curiosity-question headline (*"Why does tungsten glow in a light bulb without melting?"*), followed immediately by the repeating beaded wave across shaded period bands and italic annotations right on the peaks.
  - **Side by side (`c`):** The physical apothecary balance scale with 1-litre samples (cubes, liquid pools, gas boxes) tilting under weight, and the 3D graphite vs. diamond crystal lattices (`c05`).
- **What I think I should do:**
  - In **Patterns**, tap/hover dots along the wave, toggle **Across each row / Down each column**, switch properties via the bottom pills, or tap a value to inspect its source.
  - In **Side by side**, tap one of the **Surprising pairs** at the bottom, flip **A litre of each / One atom of each**, or tap `change ▾` / `Pick any two...` to swap elements.
- **What confuses me in the first 5 seconds:**
  - On `c06-hydrogen-oganesson-phone.png`, the right-hand purple striped cube has **no name or caption beneath it at all**, while Hydrogen on the left is clearly labelled (`Hydrogen · gas · 0.08 g`).
  - On `c01`, `c02`, and `c12`, Gold, Iron, Tungsten, and liquid Mercury are all the **exact same slate-blue colour**, so at a glance Gold looks like another blue block rather than gold, and Mercury looks like a blue disc rather than quicksilver.
  - On `p03` (Heft), the copy says *"osmium is the densest element anyone has measured"*, yet tall striped dots in Row 7 soar noticeably higher than Osmium with no callout explaining them.
  - Clicking `Pick any two...` (`c07`) opens a search box titled `INSTEAD OF GOLD` that only replaces one slot.

---

## 2. Scores (1–5, strict scale; target ≥ 4.0 everywhere, ≥ 4.5 beauty & delight)

### Patterns (`p` shots)
| Dimension | Score | Reason |
|---|---|---|
| **Clarity** | **4.0** | Question-first headlines, two-sentence plain answers, shaded row bands, and inline callouts make periodic waves legible in seconds, held back by inaccurate `no dot: not measured` wording on Electron appetite (`p16`) and Helium melting (`p01`), a stale Rows headline in Columns mode (`p14`), and unexplained Row 7 spikes (`p03`, `p15`). |
| **Ease** | **4.0** | Property switching, row/column toggling, thumb-scrubbing on phone (`p12`), and tap-to-source popovers feel natural and dead-end free, though the floating selected-element pill (`p01`) and mobile scrub card (`p12`) sit on top of nearby data points and inline `Source` pills are undersized for touch. |
| **Beauty** | **4.5** | Warm paper, crisp serif/sans hierarchy, beaded mineral-pigment curves, and editorial annotations look genuinely publication-grade, with only mobile annotation collisions (`p01`, `p03`, `p11-vi`) breaking the calm. |
| **Smoothness** | **4.0** | Every `p` view hits 59.9–60.0 FPS median (16.7–16.8 ms p95) even on CPU SwiftShader and `p13` confirms a graceful left-to-right ripple, but `ripple.txt` records 50.0 ms desktop / 33.3 ms phone p95 spikes during pattern switches and `fps.txt` only benchmarked `low` tier rather than `?q=med` or real GPU hardware. |
| **Delight** | **4.5** | Framing textbook trends as human questions (*"How rare is gold?"*, *"Why does sodium explode in water?"*) with Mendeleev's prediction line and instant row-to-column reframing creates genuine moments of wonder. |

### Side by side (`c` shots)
| Dimension | Score | Reason |
|---|---|---|
| **Clarity** | **4.0** | The physical balance scale, state-specific 1-litre vessels, to-scale spheres, and 3D graphite/diamond lattices communicate physical contrasts instantly, marred by the missing `Oganesson` label on phone (`c06-phone`), a balance-centric headline that ignores `One atom of each` mode (`c11`), and an unlabelled arbitrary-size dashed circle for Oganesson next to a `50 pm` scale bar (`c11`). |
| **Ease** | **4.0** | Curated surprising pairs, one-tap swap, sticky scrolled sheet headers (`c16`, `c17`), and ratio bars (`c08`, `c18`) make exploration effortless, but `Pick any two...` opens a single-slot picker (`c07`), mobile pair chips hard-clip on the left edge, and having both `← Element` and `×` blurs what closing the card does. |
| **Beauty** | **4.0** | The ceramic balance stand, soft shadows, clean cards, and sculpted graphite/diamond lattices (`c05`) are refined and calm, yet rendering Gold, Iron, Tungsten, and liquid Mercury in identical matte slate-blue (`c01`, `c02`, `c11`, `c12`)—missing `STYLE.md`'s quicksilver finish for Mercury—makes the 3D materials feel slightly generic. |
| **Smoothness** | **4.0** | Most `c` states lock to 59.9–60.0 FPS median on SwiftShader, with heavier 3D scenes dipping modestly (`c05` graphite/diamond avg 49.0 FPS, `c04` sodium/chlorine avg 52.2 FPS, p95 33.4 ms) and no Medium/High real-device pass recorded yet. |
| **Delight** | **4.5** | Watching Tungsten and Gold sit dead-level (`c12`), Gold vs. liquid Mercury (`c02`), Helium vs. Osmium (`c03`), and Graphite vs. Diamond (`c05`) side by side with human-scale ratios is genuinely memorable. |

### Overall (Patterns + Side by side)
| Dimension | Score | Reason |
|---|---|---|
| **Clarity** | **4.0** | Consistently puts plain human meaning before numbers and keeps sources one tap away, with a small set of concrete label/copy bugs to clean up. |
| **Ease** | **4.0** | Calm, obvious flows on both desktop and phone, needing only fixes to `Pick any two...`, mobile chip clipping, and small `Source` tap targets. |
| **Beauty** | **4.5** | Cohesive "Porcelain & Ink" editorial craft across both 2D and 3D views; fixing phone chart overlaps and Mercury's material will push it cleanly toward 5.0. |
| **Smoothness** | **4.0** | Impressive 60 FPS medians even on software SwiftShader under heavy host load (`load average: 11.02`), tempered by ripple p95 spikes and `low`-tier-only measurements. |
| **Delight** | **4.5** | Delivers sustained "calm wonder" across both views without ever feeling gimmicky or academic. |

### Honest comparison with Ryan Sael's `sael.net/periodic-table`
**Yes—this is clearly better on feel.** Sael's site (per `ref/VIDEO_NOTES.md`) is a dark, bloom-heavy dusk showroom whose scripted Demo dioramas make a flashy 28-second video, but in use it is heavy, slow/fiddly to click, lacks search, lacks a Trends/Patterns view, lacks Side-by-side comparison, and leans on small 3D labels. This redesign wins decisively on clarity, calm, legibility, mobile usability, cited data depth, and breadth of discovery. The only edge Sael's showroom aesthetic retains is tactile material richness on individual metals: on our balance scale, painting Gold, Iron, Tungsten, and liquid Mercury in the exact same flat slate-blue family glaze feels slightly schematic by comparison—especially where `STYLE.md` §6 explicitly specifies a quicksilver finish for Mercury.

---

## 3. Every Visible Problem

### Mobile & Layout Bugs
1. **Missing Oganesson stage label on phone (`c06-hydrogen-oganesson-phone.png`):** Under the left plate sits `Hydrogen / gas · 0.08 g`; under the right striped `118 Og` block there is **blank paper**—`Oganesson / solid (predicted) · weight not known` (visible on desktop `c06`) is completely absent.
2. **Chart annotation collisions on phone:**
   - `p01-from-card-melting-phone.png`: `Tungsten: 3,422 °C, the highest melting point` prints directly on top of the Tungsten dot and neighbouring Row 6 points; `In rows 2–6, the noble gas melts coldest` runs across Row 5/6 dots and the `room temperature, 20 °C` dashed line.
   - `p03-heft-gold-phone.png`: The vertical leader line from `Gases: a litre weighs only grams` cuts straight through the Row 2 nonmetal dots.
   - `p11-vi-grip-phone.png`: `Kim loại mềm, dễ phản ứng buông dễ nhất` collides with the bottom of Rows 2–3 and the highlighted Sodium dot.
   - `p14-columns-phone.png`: `Down this column: hydrogen 13.60 eV → francium 4.07 eV` crowds the `19`/`37` x-axis numbers directly under the curve.
3. **Hard left-edge clipping & mid-word right cutoff on mobile "Surprising pairs" rail (`c01`, `c02`, `c03`, `c05`, `c06`, `c10`, `c14`, `c16`, `c17` phone):** When scrolled, pills clip abruptly against the left viewport edge (`Mercury`, `lorine`, `mond`) with no left fade; in the default state, `Pick any two...` cuts `Helium · Osmi` mid-word under the right gradient.
4. **Desktop callout / popover overlaps:**
   - `p01-from-card-melting-desktop.png` & `p11-vi-melting-desktop.png`: The `Iron 1,538 °C` / `Sắt 1.538 °C` callout pill covers the Row 4 peak (V/Cr near 1,900 °C).
   - `p04-hover-gold-desktop.png`: Hovered `Gold 136 pm` pill sits directly over adjacent Row 6 dots.
   - `p12-scrub-phone.png`: The floating scrub card (`29 Cu Copper 7.73 eV`) sits squarely over Rows 3–5, hiding the scrubbed dot itself.
   - `c09-tap-value-source-desktop.png`: Tapping `–38.8 °C` opens a source popover that overflows past the right card's border to within ~10 px of the right viewport edge and covers the `melting point, normal pressure` row label. (Also minor precision jump: table shows `–38.8 °C`, popover shows `–38.83 °C (234 K)`.)
5. **Undersized touch targets:** Inline `Source` / `Nguồn` pills in `p01–p16` and `c02–c06` are ~24–26 px tall, below the `44 × 44 px` minimum in `STYLE.md` §5 and `DESIGN-RULES.md`.
6. **Scrolled mobile sheet drops column headers (`c16`, `c17` phone):** Collapsing the header to `Au Gold · Mercury Hg` removes the aligned `Gold` / `Mercury` column labels directly above the two value columns (still readable, slightly loose).
7. **Dual close affordances (`c01–c18`):** Showing both `← Iron` (top-left) and `×` (top-right of the Side-by-side card/sheet) leaves first-time visitors unsure whether `×` exits Side by side or only dismisses the card.

### Factual, Scientific & Copy Issues
8. **`no dot: not measured` is factually wrong for Electron appetite (`p16-appetite-desktop.png`) and Helium melting point (`p01`):**
   - On `p16` (Electron appetite / electron affinity), noble gases (He, Ne, Ar, Kr, Xe), N, Be, Mg, Zn, Cd, and Hg have no dots, and the legend labels all gaps `--- no dot: not measured`. Those elements are **not** unmeasured—their gas-phase anions are unstable (electron affinity ≤ 0, meaning adding an electron does not release energy). Source: [Chemistry LibreTexts — Electron Affinity](https://chem.libretexts.org/Bookshelves/Physical_and_Theoretical_Chemistry_Textbook_Maps/Supplemental_Modules_(Physical_and_Theoretical_Chemistry)/Physical_Properties_of_Matter/Atomic_and_Molecular_Properties/Electron_Affinity) and [PubChem Periodic Table](https://pubchem.ncbi.nlm.nih.gov/periodic-table/).
   - On `p01` (Melting point), Helium has no dot and is likewise bucketed under `no dot: not measured`, contradicting `c03` which correctly notes `never freezes`: at 1 atm, helium remains liquid down to 0 K and requires ~25 atm to solidify. Source: [Encyclopaedia Britannica — Helium](https://www.britannica.com/science/helium-chemical-element).
   - On `p10` (Electron pull / electronegativity), He, Ne, and Ar lack Pauling values because they do not form standard covalent bonds to define them on the Pauling scale—better described as *"not defined / not measured"* than purely *"not measured"*.
9. **Stale Rows headline in Columns mode & unmentioned Francium uptick (`p14-columns-phone.png`):**
   - Unlike `p06-columns-desktop.png` (which swaps to *"Why do atoms get bigger as you go down?"*), `p14` switches the body copy to Columns (*"Down each column..."*) while leaving the Rows headline (*"Why does sodium explode in water, while neon hardly reacts at all?"*) intact.
   - The body states *"Down each column ... the grip loosens: caesium lets go more easily (3.89 eV) than lithium (5.39 eV)"*, while the chart annotation below reads `hydrogen 13.60 eV → francium 4.07 eV` and the black line visibly bends *upward* from Cs (3.8939 eV) to Fr (4.0727 eV) due to relativistic effects—accurate numbers ([NIST Atomic Spectra Database — Ionization Energies](https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html)), but slightly jarring alongside a blanket "grip loosens" claim.
10. **Stale headline & misleading scale placeholder in `One atom of each` (`c11`):**
    - `c11-iron-gold-one-atom-desktop.png` keeps the 1-litre balance headline (*"A litre of gold weighs 2.4 times as much as a litre of iron."*) even though the stage is now showing atomic radii (where Iron at `142 pm` is *bigger* than Gold at `136 pm`).
    - `c11-hydrogen-oganesson-one-atom-desktop.png` draws Oganesson (`size not known`) as an empty dashed circle ~2.5× Hydrogen's diameter (~78 pm radius) right beside a `50 pm` scale bar and `drawn to scale, as when bonded`, with no `?` inside—making an arbitrary placeholder look like a scaled size.
11. **`Pick any two...` mismatch (`c07-pick-any-two-desktop.png`):** The button promises picking *two* elements, yet opens `INSTEAD OF GOLD` (only replacing the second slot) and partially overlaps Gold's `solid · 19.3 kg` label.
12. **Unexplained Row 7 predicted spikes (`p03-heft-gold-desktop.png`, `p03-phone`, `p15-boiling-desktop.png`):** On `p03`, striped predicted dots in Row 7 tower well above Osmium (`22.6 kg`) with no caption clarifying that they are theoretical estimates never weighed in bulk; similarly, a lone floating predicted dot sits near ~5,500 °C in Row 7 on `p15`.
13. **Log-scale cue & scientific notation (`p08-crust-log-desktop.png`):** Subtitle reads `each line up: ×10`, yet the prominent labelled gridlines step by ×1,000 (`1`, `1,000`, `1,000,000`) while the ×10 minor gridlines are nearly invisible on `--paper`. Also `10⁻⁶`, `10⁻⁹`, `10⁻¹²` use scientific notation without a plain-English hint (e.g., *"10⁻⁶ = a millionth"*).
14. **Vietnamese naming mix & minor wrap (`c10-vi-gold-mercury-desktop.png`, `p11-vi-grip-phone.png`, `p11-vi-melting-desktop.png`):** Mixing traditional Vietnamese and IUPAC/GDPT-2018 names in the same phrase (`Natri · Chlorine` in `c10-vi`, `beryllium và nitơ` in `p11-vi-grip-phone`) feels inconsistent. On `p11-vi-melting-desktop.png`, the right-aligned interaction hint wraps onto a second line right above the Mendeleev caption, slightly tightening spacing.

### 3D Material & Rendering Polish
15. **Mercury & metals on the balance scale (`c01`, `c02`, `c09`, `c10`, `c12`, `c13`, `c14`):** Liquid Mercury renders as a flat opaque slate-blue disc rather than the reflective **quicksilver** explicitly specified in `STYLE.md` §6. Solid Gold, Iron, Tungsten, and Osmium all share the exact same flat slate-blue family colour, which makes same-family comparisons (`c01`, `c11`, `c12`) look like identical blue blocks/balls. Liquid Bromine (`c13`) similarly reads as a flat pastel-pink puck.
16. **Minor balance wire aliasing / grazing:** On `c01` and `c08`, the thin matte-black suspension wires show slight stair-step aliasing at `?q=med`, and the rear-right wire visually kisses the outer rim curve of the tilted right pan.
17. **Performance measurement gap:** `fps.txt` was captured on software SwiftShader at `low` tier (not `?q=med` / `high` on real hardware); `ripple.txt` hits 50.0 ms p95 (max 83.3 ms) on desktop and 33.3 ms p95 on phone during rapid pattern switches, and `c05` (Graphite · Diamond) averages 49.0 FPS (p95 33.4 ms).

---

## 4. Ranked Fix List (Highest Impact on Feel First)

1. **Fix the missing Oganesson stage caption on phone (`c06-hydrogen-oganesson-phone.png`).**
   - Ensure the right-hand specimen label (`Oganesson / solid (predicted) · weight not known`) renders in the mobile layout whenever the balance beam is hidden (non-balance two-plate fallback), matching desktop `c06`.
2. **Give Mercury its `STYLE.md` §6 quicksilver finish and upgrade liquid/metal shading on the Side-by-side stage (`c02`, `c13`, `c14`, `c01`, `c12`).**
   - Apply the reflective studio-mirrored quicksilver shader (barely tinted by family colour) to liquid Mercury in the pan, add a crisp meniscus/edge highlight to liquids (Hg, Br), and give solid metal blocks/spheres subtle metallic sheen or tonal differentiation (e.g., warm gold glint or stronger edge catchlights) while keeping family-colour legibility intact.
3. **Eliminate phone chart annotation collisions (`p01-phone`, `p03-phone`, `p11-vi-grip-phone`, `p14-phone`) and desktop callout overlaps (`p01`, `p04`, `p12-phone`).**
   - Add simple bounding-box avoidance (or dedicated phone anchor coordinates) so `Tungsten: 3,422 °C`, `In rows 2–6, the noble gas melts coldest`, `Gases: a litre weighs only grams` leader line, and VI `Kim loại mềm...` never cross dots or axis labels.
   - Flip the desktop picked-element pill (`Iron 1,538 °C`) to the side/below when a taller neighbour peak sits immediately to its left, and anchor the mobile scrub readout (`p12-scrub-phone`) in a fixed top-of-chart strip (or cleanly above the curve) rather than floating directly over the active dot.
4. **Fix the `no dot: not measured` legend inaccuracies (`p16`, `p01`, `p10`).**
   - On **Electron appetite (`p16`)**, distinguish or reword the legend to `--- no dot: won't hold an extra electron (or not measured)` (or render negative/zero-affinity elements on a dedicated `0 / resists` baseline with a clear note).
   - On **Melting point (`p01`)**, add a quiet callout or legend note for Helium (`He: never freezes at normal pressure`), matching `c03`.
   - On **Electron pull (`p10`)**, use `--- no dot: not defined / not measured`.
5. **Update headlines and placeholders to match active modes (`p14`, `c11`).**
   - Give **Grip on electrons — Columns** (`p14`) a column-specific headline (e.g., *"Why does caesium react even harder than lithium?"*) just as Atom size does in `p06`, and mention in one clause that francium ticks slightly back up (or anchor the arrow at `lithium 5.39 eV → caesium 3.89 eV`).
   - In **Side by side — One atom of each (`c11-iron-gold`)**, adapt the summary line when non-curated pairs are viewed in atom mode (e.g., *"An iron atom (142 pm) is slightly wider than a gold atom (136 pm), yet a litre of gold weighs 2.4 times as much."*).
   - In **`c11-hydrogen-oganesson-one-atom`**, put a subtle `?` inside Oganesson's dashed circle and label `size not known (not to scale)` so it cannot be read against the `50 pm` scale bar.
6. **Make `Pick any two...` actually pick two—or rename it (`c07`).**
   - Either step cleanly through `FIRST ELEMENT` → `SECOND ELEMENT` when opened from `Pick any two...` (and offset the popover slightly so it doesn't cover the right pan's weight caption), or rename the pill `Change elements...` / open a dual-slot picker.
7. **Fix mobile "Surprising pairs" edge fades (`c01–c17` phone) and desktop source popover bounds (`c09`).**
   - Add a matching soft `--paper` left fade on the scrollable pair rail whenever `scrollLeft > 0` so chips never hard-clip mid-word on the left, and give the right fade a few extra pixels before `Pick any two...`.
   - Constrain the Side-by-side source popover (`c09`) inside the 392 px card width (or open it to the left of the card with ≥16 px viewport margin) so it doesn't crowd the screen edge.
8. **Clarify Row 7 predicted peaks (`p03`, `p15`) and log-scale minor gridlines (`p08`).**
   - Add one brief italic annotation on `p03` near Row 7's predicted peak (*"Row 7: predicted, never weighed in bulk"*) so readers don't doubt the Osmium claim.
   - Slightly increase contrast on the ×10 minor gridlines in `p08` (so `each line up: ×10` is visually true) and add a tiny parenthetical on the smallest tick or caption (*"10⁻¹² = a trillionth"*).
9. **Bring inline `Source` pills to ≥44 px touch height and polish minor VI / chrome details.**
   - Expand the invisible hit padding on `Source` / `Nguồn` buttons to 44 × 44 px while keeping the visual pill compact.
   - Audit Vietnamese element-name consistency (`Natri · Chlorine`, `beryllium và nitơ`) against the project's GDPT-2018 rule.
   - Either make the Side-by-side card's `×` collapse only the sheet/card (with a clear tooltip/aria label) or remove it on desktop where `← Element` already provides the clean return path.
   - Smooth the balance suspension wires (higher segment/AA thickness) and run a quick real-GPU Medium-tier FPS + ripple check on `c05` (Graphite · Diamond) and `p` pattern switches to confirm p95 ≤ 20 ms per `SPEC.md` §6.
