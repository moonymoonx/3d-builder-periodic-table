# First-Time-Visitor Review — Patterns Across the Table & Side by Side (Round P2, Merged Build `00cee2fb5e5455f0e9fb833bfc94427bd2aec5a1`)

Reviewed cold from all 44 desktop (`1440×900`) and phone (`390×844`) screenshots plus `fps.txt` in `/workspace/out/redesign/patterns-r2-merged` before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, or `ref/VIDEO_NOTES.md`. No prior reviews were read.

---

## 1. First 5 Seconds

### Patterns across the table (`p01`–`p16`)
- **What I think this is:** An interactive data-journalism chart essay — like a museum wall graphic or *New York Times* / Tufte feature — that reveals why the periodic table repeats in waves instead of being an arbitrary wall of boxes.
- **What draws my eye:** The bold serif question headline (*"Why does tungsten glow in a light bulb without melting?"*, *"Why does sodium explode in water, while neon hardly reacts at all?"*), the dark highlighted row connecting dots inside the active shaded band (`Row 4`), the floating callout pill (`Iron 1,538 °C`), and the italic hand-placed notes directly on the curve.
- **What I think I should do:** Tap other dots on the chart, flip through the bottom property pills (`Melting point`, `Heft`, `Atom size`, `Grip on electrons`, `More ▾`), toggle `Across each row` / `Down each column`, or tap `See it on the table →` / `← Iron`.
- **Anything confusing in the first 5 seconds:**
  - On `p01` (`Melting point`), the `Iron 1,538 °C` callout pill sits directly over the top peak of Row 4, hiding Chromium's peak underneath it.
  - On `p03` (`Heft`), Row 7 has striped dots climbing *higher* than the labeled `"Osmium: a litre would weigh 22.6 kg"` peak — at first glance it looks like an unlabeled denser element contradicts the headline until you notice the small `"striped: predicted"` key at the bottom left (and on phone `p03-phone`, the stripes are nearly invisible).
  - On `p01-phone`, both `"no dot: not measured"` and `"room temperature, 20 °C"` use the exact same `---` dashed symbol in the legend.

### Side by side (`c01`–`c16`)
- **What I think this is:** A tactile museum comparison table where two elements are placed on a real balance beam (one litre of each at room temperature) — or shown as scaled atomic spheres / crystal structures — with a concise explainer card on the right (desktop) or in a bottom sheet (phone).
- **What draws my eye:** The tilted balance beam immediately communicates relative heaviness before I read a single number; the three distinct specimen forms (stamped ceramic block for solid, pooled disc for liquid, floating beads in a clear box for gas) read at a glance. On `Graphite · Diamond` (`c05`), the two 3D crystal networks side by side are an instant "aha!".
- **What I think I should do:** Click the `"Surprising pairs"` pills along the bottom (`Gold · Mercury`, `Helium · Osmium`, `Sodium · Chlorine`, `Graphite · Diamond`, `Hydrogen · Oganesson`, `Pick any two...`), switch `A litre of each` ↔ `One atom of each`, swap the two elements (`⇄`), or tap `change ▾` / any underlined figure.
- **Anything confusing in the first 5 seconds:**
  - Seeing matte **slate-blue Gold (`Au`)**, slate-blue **Mercury (`Hg`)**, and bubblegum-pink **Bromine (`Br`)** causes a brief double-take before I realize they inherit the periodic table's family glaze colors (intentional per `STYLE.md`, though still slightly jarring on the first look at "Gold").
  - On `Hydrogen · Oganesson` (`c06`), the stage subtitle still says *"as they are at room temperature (20 °C), weighed on a balance"*, even though the balance beam has been removed because Oganesson's density is unknown.
  - On phone (`c01`–`c06`), `"Surprising pairs"` has no label and `"Pick any two..."` is scrolled out of view off the right edge.

---

## 2. Scores (1–5, Strict) — Patterns and Side by Side Scored Separately

*Scale: 4 = genuinely good, 5 = exceptional. Target: ≥ 4.0 everywhere, ≥ 4.5 on beauty and delight.*

### A. Patterns Across the Table (`p01`–`p16`)

| Dimension | Score | Reason |
|---|---:|---|
| **Clarity** | **4.0** | Question headlines, Row 2–7 shaded bands, and direct italic annotations make periodicity obvious to non-chemists, held back by an ambiguous helium/neon ionization-energy sentence (`p02`), unlabeled taller predicted peaks in `Heft` (`p03`), and the duplicate `---` legend glyph on phone (`p01-phone`). |
| **Ease** | **4.0** | Bottom property chips, row/column toggle, tap-for-source popovers (`p05`), and the large mobile scrub loupe (`p12`) feel effortless, though the pinned `Iron` pill hides Row 4's peak (`p01`, `p11`), phone notes collide with dots (`p01-phone`, `p11-vi-phone`), and the Vietnamese desktop hint wraps onto an extra line (`p11-vi-desktop`). |
| **Beauty** | **4.5** | Warm Porcelain & Ink paper, serif headlines, mineral-pigment dots with gentle depth, and generous Tufte-style whitespace look genuinely editorial and museum-grade, with only minor annotation/dot overlaps keeping it from a 5. |
| **Smoothness** | **4.5** | `fps.txt` holds a rock-solid 60 FPS median (16.7 ms median, 16.7–16.8 ms p95, 59.2–60.0 avg FPS on desktop and phone under load 12+ on SwiftShader `low`), and `p13` confirms a clean left-to-right dot ripple with staggered label fade-in. |
| **Delight** | **4.5** | Reframing dry tables as human questions, watching an entire column snap onto one line (`p06`, `p14`), and surfacing credible primary-source popovers on tap (`p05`) create genuine wonder and curiosity. |

### B. Side by Side (`c01`–`c16`)

| Dimension | Score | Reason |
|---|---:|---|
| **Clarity** | **4.0** | The tilted balance beam, solid/liquid/gas specimen visual language, and one-sentence comparison hooks communicate core differences in seconds, undermined by `"weighed on a balance"` remaining visible when the balance disappears (`c06`), `"Draw the atoms"` appearing inside the card while viewing litres (`c08`), and a flat floor-ellipse placeholder for Oganesson's unknown atomic size (`c11`). |
| **Ease** | **3.5** | Desktop pair switching, swap (`⇄`), inline search (`c07`), and source popovers (`c09`) are smooth, but scrolling the mobile bottom sheet visibly slices the top data row in half beneath the sticky header (`c16`, violating `STYLE.md §5`), `"Pick any two..."` sits off-screen on phone, and a stray character peeks out beside the mobile picker (`c15`). |
| **Beauty** | **4.0** | The warm paper palette, card typography, and `Graphite · Diamond` 3D crystal lattices (`c05`) are lovely, yet the balance pans/beam feel slightly chalky, liquids read as flat plastic discs rather than wet pools, family-colored blue Gold/Mercury feels austere, and `One atom of each` (`c11` Iron · Gold) reduces to two near-identical slate spheres. |
| **Smoothness** | **4.5** | `fps.txt` maintains 59.9–60.0 FPS median across desktop and phone (`16.7–16.8 ms` p95 on `c02-phone`, `c06-desktop`, `c11-desktop`; one pass-1 p95 of `33.2 ms` on `c03-desktop` under load 10–13, still beating the table-landing control's `33–50 ms` p95). |
| **Delight** | **4.0** | Watching osmium crush helium (`c03`), seeing tungsten and gold balance dead-level (`c12`), and comparing graphite sheets against diamond tetrahedra (`c05`) are memorable, though non-curated pairs like Gallium · Mercury (`c14`) drop to flat boilerplate (missing Gallium's melt-in-your-hand hook) and `One atom of each` (`c11`) feels flat beside the balance view. |

### Honest Comparison vs. Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)
**Yes — this is clearly better on feel.** Sael's dusk showroom has neither a Trends/Patterns view nor a Side-by-side comparison view, runs heavy/slow with hard-to-click columns, lacks search and mobile polish, and surfaces thin unsourced data. Even judged purely on emotional feel, this Porcelain & Ink experience is calmer, faster (60 FPS even on software SwiftShader), far more welcoming to an adult who left chemistry behind, and orders of magnitude more trustworthy (every number one tap from a clean citation). The one place Sael's photoreal showroom still has an edge is *material richness in 3D*: the Side-by-side balance, liquid discs, and `One atom of each` spheres here look a touch plain/matte compared to the porcelain table tiles (`b00`) and could use richer ceramic glaze highlights and meniscus shading without sacrificing daylight calm.

---

## 3. Every Visible Problem

### A. Overlapping, Clipped, or Misaligned UI / Text
1. **Mobile scrolled-sheet text sliced in half (`c16-sheet-scrolled-phone.png` — breaks `STYLE.md §5`):** When the Side-by-side bottom sheet scrolls on phone, the sticky compact header (`Au Gold · Mercury Hg`) fails to cleanly occlude scrolled content below it — the top half of `"At 20 °C"`, `"Solid"`, and `"Liquid"` is sheared off right underneath the header bar. (`STYLE.md §5`: *"a compact title bar ... slides in under the close button, so rows never run beneath it."*)
2. **Pinned element callout hides the Row 4 melting-point peak (`p01-from-card-melting-desktop.png`, `p05`, `p11-vi-melting-desktop.png`):** The `Iron 1,538 °C` (`Sắt 1.538 °C`) pill sits straight on top of Chromium/Vanadium's peak (~1,907 °C); black line segments visibly poke into the bottom edge of the pill.
3. **Phone chart annotations collide with dots and lines (`p01-from-card-melting-phone.png`, `p03-heft-gold-phone.png`, `p11-vi-grip-phone.png`):**
   - `p01-phone`: `"In rows 2–6, the noble gas melts coldest"` sits directly over the Row 5/6 dots near 0 °C; `"Tungsten: 3,422 °C, the highest melting point"` overlaps the Row 6 peak dots.
   - `p11-vi-phone`: `"Kim loại mềm, dễ phản ứng buông dễ nhất"` sits on top of the Row 3/4 alkali dots and crowds the `11` axis tick.
   - `p03-phone`: The vertical leader line from `"Gases: a litre weighs only grams"` cuts across Row 2/3 dots.
4. **Desktop callout overlaps lines/annotations (`p06-columns-desktop.png`, `p08-crust-log-desktop.png`, `p04-hover-gold-desktop.png`):**
   - `p06`: `Sodium 166 pm` pill crosses the black column line and nearly touches `"Down this column: hydrogen 31 pm → francium 260 pm"`.
   - `p08`: `Gold 0.004 g per tonne` pill overlaps the steep black plunge line to Polonium/Radon.
5. **Vietnamese desktop hint wraps onto a stray second line (`p11-vi-melting-desktop.png`):** `"Chạm vào một điểm để chọn nguyên tố, rồi chạm vào số liệu để xem nguồn."` drops below the legend row and crowds the italic Mendeleev sentence beneath it.
6. **Full-width dotted underline on wrapped 2-line table values (`c03-helium-osmium-desktop.png`, `c06-hydrogen-oganesson-desktop.png`):** When a tappable value wraps onto two lines (`never` / `freezes`, `Solid` / `(predicted)`), the dotted underline stretches across the entire column width rather than hugging the text width like single-line values do.
7. **Stray background character peeking past mobile picker (`c15-pick-from-tile-phone.png`):** When `INSTEAD OF GOLD` opens on phone, a lone `"h"` from the clipped `"Sodium · Ch"` pill peeks out on the right margin beside the popover.
8. **Desktop picker covers the right-pan label (`c07-pick-any-two-desktop.png`):** Opening `INSTEAD OF GOLD` completely occludes `"Gold / solid · 19.3 kg"` under the right pan.
9. **Tight phone `100 pm` scale bar (`c05-graphite-diamond-phone.png`):** The right-most graphite sphere nearly touches the `"100 pm"` label between the two lattices.
10. **Inconsistent focus/teal highlight on initial mobile load (`c01-from-card-iron-gold-phone.png`):** Iron's `"Solid"` value in `"At 20 °C"` is rendered in verdigris teal while Gold's `"Solid"` is ink black (not present in `c02-phone` or `c03-phone`), suggesting a stray focus/hover state or inconsistent default styling.

### B. UX, Copy, and Visual-Logic Mismatches
11. **Copy says `"weighed on a balance"` when no balance exists (`c06-hydrogen-oganesson-desktop.png`):** Because Oganesson's density is unknown, the balance beam is honestly hidden and two flat pans sit on the ground — yet the subtitle directly under the toggle still reads *"as they are at room temperature (20 °C), weighed on a balance"*.
12. **`"Draw the atoms"` control appears while viewing litres on a balance (`c08-all-numbers-desktop.png`):** Expanding `"All numbers & sources"` while `A litre of each` is active displays `"Draw the atoms: [when bonded] [when touching]"`. Tapping it affects the *other* mode (`One atom of each`), not what is currently on screen.
13. **Duplicate `---` glyph in Patterns legend (`p01-from-card-melting-phone.png` and desktop `p01`–`p16`):** `"--- no dot: not measured"` uses three dashes (`---`), which looks identical to the dashed `"--- room temperature, 20 °C"` line on phone (`p01-phone`), even though missing values are represented by the *absence* of a dot, not a dashed line.
14. **Unlabeled taller Row 7 predicted peaks in `Heft` (`p03-heft-gold-desktop.png`, `p03-heft-gold-phone.png`):** Striped predicted superheavy dots in Row 7 rise well above the labeled `"Osmium: a litre would weigh 22.6 kg"` peak (~27+ kg/L). On phone the stripes are too small to read, making it look like the chart contradicts `"osmium is the densest element anyone has measured"`.
15. **Lonely uncontextualized Row 7 dot in `Boiling point` (`p15-boiling-desktop.png`):** A single striped blue dot floats around ~5,500 °C in Row 7 (around Z ≈ 104–106) with no connecting line or explanation, right next to the `"Rhenium: 5,596 °C, the hottest"` annotation.
16. **Log-scale grid ambiguity (`p08-crust-log-desktop.png`):** The subtitle says `"each line up: ×10"`, while the major labeled lines jump by `×1,000` (`0.001`, `1`, `1,000`, `1,000,000`) and the intermediate `×10` minor gridlines are so faint they are easy to miss on first glance.
17. **Phone `"Surprising pairs"` discoverability (`c01`–`c06` phone):** `"Pick any two..."` is off-screen to the right and there is no `"Surprising pairs"` heading, so a mobile visitor may never notice the strip scrolls or that `"Pick any two..."` exists (though `change ▾` on the tiles provides an alternate path).
18. **Missing unit on `"Weight of one atom"` (`c08-all-numbers-desktop.png`):** Shows `Na 22.99` and `Cs 132.91` with no unit (`u` / `Da`) or caption explaining `"relative to carbon-12"` / `"atomic mass units"`, which leaves a lay adult wondering *"22.99 what?"*.
19. **Mixed Vietnamese element naming (`c10-vi-gold-mercury-desktop.png`, `p11-vi-grip-phone.png`):** Pairs traditional/French names (`Natri`, `nitơ`) with GDPT-2018 IUPAC English names (`Chlorine`, `beryllium`, `Hydrogen`, `Helium`) in the same phrase (`Natri · Chlorine`, `beryllium và nitơ`). While familiar to adults, keeping one consistent convention (or matching `STYLE.md §5`: familiar Vietnamese name only for the 13 kept elements, consistent across pills and chart notes) would read cleaner.

### C. 3D Material & Visual Craft Issues (Side by Side)
20. **Flat/chalky 3D balance & liquid puck look (`c01`–`c04`, `c12`–`c14`):** Compared to the glazed porcelain table tiles (`b00`), the balance stand and pans look flat/matte, liquids (`Hg`, `Br`) read as opaque matte pucks rather than reflective/meniscus liquid pools, and `One atom of each` (`c11` Iron · Gold) looks stark — two nearly identical slate-blue billiard balls on cream paper.
21. **Flat floor-ellipse for unknown atom size (`c11-hydrogen-oganesson-one-atom-desktop.png`):** Oganesson's `"size not known"` is drawn as a horizontal dashed perspective oval on the ground, which reads like a missing plate or shadow rather than a spherical atom of unknown diameter.

### D. Contrast & Typography Check (against `STYLE.md`)
- **Source popovers (`p05`, `c09`):** Excellent fix — `Accessed` and `Licence` lines are crisp, legible `--ink-2` on `--card`.
- **Small axis/tick text (`p01`–`p16`):** The `1` label above Row 1 on desktop and phone looks slightly cramped next to `Row 2` / `2`.
- **Jargon check:** Consistently excellent across both views (`Grip on electrons · first ionization energy`, `Heft · density`, `Electron pull · electronegativity`, `Atom size when touching · van der Waals radius`). No unexplained jargon found.

### E. Fact-Check of Every Visible Number & Claim (Against Real Sources)

#### Real Errors, Ambiguities, or Source Discrepancies Found
1. **Misleading parenthetical implies Helium = 21.56 eV (`p02`, `p07`, `p11-vi`, `p12`, `p13` — Clarity/Factual bug):**
   - *Visible text:* `"neon holds on harder than any atom except helium (21.56 eV)."` / VI: `"neon giữ chặt hơn mọi nguyên tử, chỉ sau helium (21,56 eV)."`
   - *Real values:* According to the **NIST Atomic Spectra Database** (<https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html>), **Neon = 21.5645 eV** and **Helium = 24.5874 eV**. Placing `(21.56 eV)` immediately after `helium` makes the sentence read as if helium's ionization energy is 21.56 eV (off by 3.02 eV). Fix to: `"neon (21.56 eV) holds on harder than any atom except helium (24.59 eV)."`
2. **Copper density shows `8.9 kg` instead of `9.0 kg` (`c10-vi-iron-copper-phone.png` — Rounding/Data discrepancy):**
   - *Visible text:* `Đồng: rắn · 8,9 kg` and `1 lít nặng: 8,9 kg`.
   - *Real values:* Both **PubChem** (<https://pubchem.ncbi.nlm.nih.gov/element/Copper>) and the **Royal Society of Chemistry** (<https://www.rsc.org/periodic-table/element/29/copper>) report pure copper's density at room temperature as **`8.96 g/cm³`**, which rounds to **`9.0 kg`** per litre (not `8.9 kg`). Either the app is truncating `8.96` instead of rounding, or using an older `8.92 g/cm³` figure that conflicts with PubChem's `8.96 g/cm³`.
3. **Chlorine electron affinity shown as `3.62 eV` vs. NIST `3.61 eV` (`p16`, `c04` — Minor source discrepancy):**
   - *Visible text:* `"Chlorine is the most eager of all (3.62 eV)"`, `"Chlorine 3.62 eV"`.
   - *Real values:* High-precision laser photodetachment measurements cited by the **NIST Chemistry WebBook** (<https://webbook.nist.gov/cgi/cbook.cgi?ID=C22537151>, Trainham et al. 1987: `3.612709 ± 0.000087 eV`; Berzinsh et al. 1995, *Phys. Rev. A* 51:231: `3.612724(27) eV`) round to **`3.61 eV`**. The app's `3.62 eV` comes from rounding PubChem's older `3.617 eV` value (<https://pubchem.ncbi.nlm.nih.gov/element/Chlorine>). Because the chart cites PubChem it is internally consistent with PubChem, but worth noting (or updating to NIST/CRC `3.61 eV`).
4. **`"Rhenium: 5,596 °C, the hottest"` boiling-point claim is contested (`p15-boiling-desktop.png` — Scientific caveat):**
   - *Visible text:* `"rhenium holds out until 5,596 °C"` and `"Rhenium: 5,596 °C, the hottest"`.
   - *Real values:* PubChem and RSC list Re at `5,596 °C` (<https://www.rsc.org/periodic-table/element/75/rhenium>) above W at `5,555 °C` (<https://www.rsc.org/periodic-table/element/74/tungsten>), matching the plotted dots. However, modern critical thermophysical evaluations (Zhang et al. 2011, *J. Chem. Eng. Data* 56:328–337, <https://pubs.acs.org/doi/10.1021/je1011086>) place **tungsten** higher at **`~5,930 °C`** (6,203 K), and boiling points near 6,000 °C are extrapolated with hundreds of degrees of uncertainty. Saying `"Rhenium: 5,596 °C (with tungsten close behind)"` or noting `"in PubChem"` avoids overstating a genuinely disputed record.

#### Verified Accurate Numbers & Claims (Spot-Checked Against Primary Sources)
- **Melting points (PubChem / CRC / RSC):** Tungsten `3,422 °C` (highest true melting point at 1 atm), Carbon sublimes at `3,642 °C` (`3,915 K` in PubChem, does not melt at 1 atm), Osmium `3,033 °C`, Iron `1,538 °C` (`1,811 K` in `p05`), Copper `1,085 °C` (`1,084.62 °C`; `1,538 − 1,085 = 453 °C` in `c10-vi`), Gold `1,064 °C` (`1,064.18 °C`), Sodium `97.8 °C` (`97.794 °C`), Gallium `29.8 °C` (`29.76 °C`), Bromine `−7.2 °C`, Mercury `−38.8 °C` (`−38.83 °C`, `234 K` in `c09`), Chlorine `−101.5 °C`, Hydrogen `−259.3 °C` (PubChem `13.81 K = −259.34 °C`, equilibrium para-H₂ triple point; normal H₂ is `−259.16 °C`), Helium `never freezes` at 1 atm, Oganesson `≈ 52 °C` / `Solid (predicted)` (Smits et al. 2020, *Angew. Chem. Int. Ed.*, `325 ± 15 K ≈ 52 °C`). *"In rows 2–6, the noble gas melts coldest"* — verified true for Ne, Ar, Kr, Xe, Rn.
- **Boiling points:** Helium `−268.9 °C` (`4.22 K`, ~4° above absolute zero); *"In rows 1–6, the noble gas boils first"* — verified true for He, Ne, Ar, Kr, Xe, Rn.
- **Densities / "1 litre weighs" at 20 °C, 1 atm:** Osmium `22.6 kg` (`22.59 g/cm³`, densest measured element), Gold `19.3 kg` (`19.282`/`19.3`), Tungsten `19.3 kg` (`19.25` — within 0.2% of gold, *"almost exactly the same"*), Mercury `13.5 kg` (`13.534`), Iron `7.9 kg` (`7.874`; Au/Fe `19.282/7.874 = 2.45 → 2.4×`, and `19.3/7.9 = 2.44 → 2.4×`), Gallium `5.9 kg` (`5.91`), Diamond `3.5 kg` (`3.515`), Bromine `3.1 kg` (`3.103`), Graphite `2.3 kg` (`2.267`), Caesium `1.9 kg` (`1.93`), Sodium `0.97 kg` (`0.968`), Chlorine gas `3.0 g` (`2.95–2.99 g/L`), Dry air `1.20 g` (`1.204 g/L`), Helium gas `0.17 g` (`0.1664 g/L`; Os/He `22,590/0.1664 = 135,757 ≈ 136,000×`; Air/He `1.204/0.1664 = 7.24 ≈ 7×`), Hydrogen gas `0.08 g` (`0.0838 g/L`).
- **First ionization energies (NIST ASD):** He `24.59 eV` (`24.5874`), Ne `21.56 eV` (`21.5645`), H `13.60 eV` (`13.5984`), Cl `12.97 eV` (`12.9676`), Br `11.81 eV` (`11.8138`), Hg `10.44 eV` (`10.4375`), Au `9.23 eV` (`9.2255`), Os `8.44 eV` (`8.4382`), Fe `7.90 eV` (`7.9024`), W `7.86 eV` (`7.8640`), Cu `7.73 eV` (`7.7264`), Li `5.39 eV` (`5.3917`), Na `5.14 eV` (`5.1391`), K `4.34 eV` (`4.3407`), Fr `4.07 eV` (`4.0727`), Cs `3.89 eV` (`3.8939`). *"Little dips just after beryllium and nitrogen"* — verified (B < Be, O < N).
- **Covalent radii (Cordero et al. 2008, *Dalton Trans.* 2832–2838):** He `28 pm` (smallest), H `31 pm`, Cl `102 pm`, Br `120 pm`, Hg `132 pm`, Au `136 pm`, Fe `142 pm` (average of 132 low-spin / 152 high-spin), Os `144 pm`, W `162 pm`, Na `166 pm`, Cs `244 pm`, Fr `260 pm`. *"A picometre is a trillionth of a metre"* — accurate ($10^{-12}\text{ m}$).
- **Van der Waals radii (Alvarez 2013, *Dalton Trans.* 42:8617–8636):** Na `250 pm`, Cs `348 pm` (`348/250 = 1.39 → ×1.4`) — exact match to Alvarez 2013 Table 1.
- **Atomic weights (IUPAC/CIAAW) & ratios (`c06`, `c08`):** Na `22.99`, Cs `132.91` (`×5.8`); Oganesson/Hydrogen `294/1.008 = 291.7 ≈ 290` atoms.
- **Electronegativity (Pauling):** Fluorine `3.98` (strongest), Oxygen `3.44`; Na/Cs `0.93/0.79 = 1.18 → ×1.2`.
- **Crustal abundance (CRC Handbook):** Oxygen `46.1%` + Silicon `28.2%` = `74.3%` (`74 %`); Iron `56,300 g/tonne` vs Gold `0.004 g/tonne` → `14,075,000` (`about 14 million times`).
- **Discovery (`p09`):** 11 ancient elements in PubChem (`C, S, Fe, Cu, As, Ag, Sn, Sb, Au, Hg, Pb`), earliest dated in PubChem = Phosphorus `1669` (Hennig Brand), latest synthesized = Tennessine `2010` (Dubna/ORNL/LLNL). Mendeleev predicting gallium (1869/1871 vs 1875) — accurate.
- **Crystal & chemistry claims (`c02`, `c05`, `c13`):** Graphite (hexagonal layers, 3 neighbours, `142 pm`), Diamond (diamond cubic, 4 neighbours, `154 pm`, hardest natural mineral); Mercury's relativistic 6s² contraction explaining why it is liquid at room temperature (Calvo et al. 2013); Bromine and Mercury being the two liquid elements at 20 °C — all accurate.

---

## 4. Ranked Fix List (Highest Impact on Feel First)

1. **Fix mobile scrolled-sheet clipping in Side by side (`c16-sheet-scrolled-phone.png`):** Give the sticky compact header (`Au Gold · Mercury Hg`) a solid `--card` background with an explicit z-index and bottom hairline (or clip the scroll container *below* the sticky header height) so scrolled rows never peek or shear in half underneath it. *(Directly fixes a `STYLE.md §5` violation and lifts Side-by-side Ease above 4.0.)*
2. **Fix the misleading Neon/Helium ionization-energy sentence (`p02`, `p07`, `p11-vi`, `p12`, `p13`):** Change *"neon holds on harder than any atom except helium (21.56 eV)"* to *"neon (21.56 eV) holds on harder than any atom except helium (24.59 eV)"* (and likewise in Vietnamese: *"neon (21,56 eV) giữ chặt hơn mọi nguyên tử, chỉ sau helium (24,59 eV)"*). *(Fixes a real factual misread on a primary pattern.)*
3. **Eliminate chart annotation & pinned-pill collisions on desktop and phone (`p01`, `p01-phone`, `p03-phone`, `p06`, `p08`, `p11-vi-desktop`, `p11-vi-phone`):**
   - Compute collision-aware placement for the pinned element pill (`Iron 1,538 °C`, `Sodium 166 pm`, `Gold 0.004 g per tonne`) so it flips below/beside local peaks (just as `Iron 142 pm` cleanly does in `p04`) instead of burying Chromium's peak.
   - Reposition phone annotations into open whitespace (`p01-phone` noble-gas note below/left of empty space or shorter copy; `p11-vi-phone` alkali note shifted clear of Row 3/4 dots) and shorten/tighten the Vietnamese desktop legend hint so it stays on one line.
4. **Fix `"weighed on a balance"` mismatch & `"Draw the atoms"` context leak (`c06`, `c08`):**
   - In `c06` (any pair where one density is unknown and the balance is hidden), swap the stage subtitle to *"as they are at room temperature (20 °C) — weight not known for oganesson"* (removing *"weighed on a balance"*).
   - In `c08`, hide `"Draw the atoms: when bonded / when touching"` while `A litre of each` is active (or show it only when `One atom of each` is active, or move it onto the `One atom of each` stage caption).
5. **Elevate 3D material craft in Side by side (`c01`–`c04`, `c11`–`c14` — needed to hit 4.5+ Beauty & Delight):**
   - Give liquid pans (`Hg`, `Br`) a subtle curved meniscus, soft specular catchlight, and slight depth shading so they read as liquid rather than flat coasters.
   - Add subtle warm rim/ceramic glaze speculars to the balance pans and metallic sheen/brushed finish on the black beam so it matches the porcelain craftsmanship of the table tiles (`b00`).
   - In `One atom of each` (`c11`), replace the flat floor-ellipse for unknown sizes (Oganesson) with a vertical dashed circle (matching Hydrogen's sphere plane) or translucent ghost sphere with `?`, and add a subtle inner radial highlight or faint shell cue so two same-family spheres (`Fe` vs `Au`) feel less plain.
6. **Clarify `Heft` predicted Row 7 peaks and the `---` legend glyph (`p01-phone`, `p03`, `p03-phone`):**
   - Add a quiet italic note on Row 7 of `Heft` (*"predicted, not yet measured"*) or render predicted Row 7 dots at lower opacity with crisper stripes so phone readers never mistake them for solid peaks denser than Osmium.
   - Replace `"--- no dot: not measured"` with a small empty/faint-ring icon (or `"no dot: not measured"` with no dashes) so it never collides visually with the dashed `"--- room temperature, 20 °C"` line.
7. **Verify Copper density (`8.9 kg` vs `9.0 kg`), Chlorine EA (`3.62` vs `3.61 eV`), and Rhenium boiling-point caveat (`c10-vi-phone`, `p15`, `p16`):**
   - Check why Copper renders as `8,9 kg` when PubChem/RSC give `8.96 g/cm³` (`9.0 kg` rounded); fix truncation or align source value.
   - Qualify `"Rhenium: 5,596 °C, the hottest"` (`p15`) to acknowledge tungsten's contested ~5,555–5,930 °C range (and check whether the lone floating Row 7 dot at ~5,500 °C needs a tooltip/note).
   - Check whether Chlorine's electron affinity should stay at PubChem's `3.617 → 3.62 eV` or use NIST's `3.6127 → 3.61 eV`.
8. **Polish mobile Side-by-side details & minor UI edges (`c01-phone`, `c03`, `c05-phone`, `c06`, `c08`, `c14-phone`, `c15-phone`):**
   - Add a clean right-edge fade + subtle `"Surprising pairs"` label (or compact `"Pick any two..."` button) on phone, and mask/dim the strip behind the `INSTEAD OF GOLD` sheet so no stray `"h"` peeks out (`c15-phone`).
   - Fix two-line value underlines (`never freezes`, `Solid (predicted)`) to wrap inline (`display: inline`) instead of stretching across the full cell width (`c03`, `c06`).
   - Add `(u)` or a caption `"relative atomic mass"` under `"Weight of one atom"` (`c08`), make `p08` minor `×10` gridlines slightly more legible, and consider a bespoke one-liner for famous near-liquid pairs like Gallium · Mercury (`"Gallium is solid at 20 °C — until it melts in your hand at 29.8 °C."`).
