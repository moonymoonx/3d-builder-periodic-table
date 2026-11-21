# Cold First-Time-Visitor Review — Merged Build `23af106` (Round M1)

**Scope reviewed:** All 30 screenshots in `/workspace/out/redesign/hero-r6/` (plus `README.txt` and `hero-r5/fps.txt`) and all 38 screenshots in `/workspace/out/redesign/patterns-merged/` (desktop 1440×900 and phone 390×844, EN and VI). Reviewed cold before opening `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, or `ref/VIDEO_NOTES.md`.

---

## 1. First 5 Seconds

- **What I think this is:** A museum-grade, interactive illustrated guide to the chemical elements—warm cream paper, thick pastel ceramic tiles on an angled tabletop, and serif typography that feels like an exhibition tray or a great popular-science book rather than a dry reference dashboard.
- **What I think I should do:** Tap a tile. The serif line (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*) plus *"Tap one to look inside."* (desktop) and *"Touch and slide across the table — lift to open."* (phone) make the primary gesture unmistakable, and the `Try iron` callout (`02-try-iron-hint-desktop.png`) gives an immediate starting point if I hesitate.
- **What draws my eye:** The tactile beveled 3D blocks and their soft shadows on the warm background, followed by the plain-English family names printed around the table (*Workhorse metals*, *Salt-makers*, *Nonmetals of life*, *Radioactive heavyweights*) and the verdigris-green active chip at the bottom. When entering **Patterns**, the bold editorial question (*"Why does tungsten glow in a light bulb without melting?"*) grabs me instantly. When entering **Side by side**, the giant scaled spheres (or the Graphite/Diamond lattices) pull focus first.
- **Anything confusing:**
  - On the landing bar, **`Heft`** makes me pause for a beat ("weight? mass? density?") until I click it.
  - On the desktop table, **`Mineral metals`** floats near `Be` and **`Other metals`** sits below `Nh–Lv` without clear grouping cues, and **`Half-metals`** sits above `B` even though that family runs diagonally.
  - On phone landing (`01-first-load-phone.png`), the 18-column table is tiny horizontally (two-letter symbols like `Sc`, `Ti`, `V`, `Cr` are near-illegible at rest), so I have to trust the "Touch and slide" prompt to discover the enlarged loupe (`03-thumb-scrub-phone.png`).
  - In **Side by side** (`c01`, `c02`), seeing **two nearly identical dull blue plastic balls** for *Iron vs. Gold* and *Gold vs. Mercury* immediately confuses me: why is *gold* slate-blue, and why do solid gold and liquid mercury look virtually indistinguishable?

---

## 2. Scores (Strict 1–5 Scale; Target ≥ 4.0 Everywhere, ≥ 4.5 Beauty & Delight)

### Hero Slice (`hero-r6` + merged hero screens)

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.5** | Warm plain-English hierarchy, unmistakable first gesture, and clean three-door element cards make the hero immediately readable, with only the stale `"Iron at room temperature"` caption at `396 °C` (`18`) and minor `Heft` ambiguity holding it back. |
| **Ease** | **4.0** | Generous pills, phone thumb-scrub loupe, persistent back navigation, and one-tap `"Heat it ▶"` feel effortless, slightly nicked by clipped/faded phone card footers (`04`, `05`, `11`) and tall `Heft` bars occluding rear symbols on phone (`09`). |
| **Beauty** | **4.5** | The "Porcelain & Ink" daylight tabletop, beveled matte-glazed tiles, soft contact shadows, serif/sans pairing, and warm-paper-to-kiln transition genuinely feel like a sunlit museum piece. |
| **Smoothness** | **4.0** | Even on loaded software SwiftShader (`hero-r5/fps.txt`, load ~8), median frame time holds `16.7 ms` (~60 FPS) across all 30 views and the dive/ripple cues look calm, though desktop p95 hits `33–67 ms` in molten/playing forge states and the molten cluster (`16`) still looks slightly boxy. |
| **Delight** | **4.5** | Diving into an iron tile, dimming the room into a forge, watching real 912 °C / 1,394 °C crystal re-stacks and blackbody glow, and sliding all 118 tiles through 1,000 °C create genuine calm wonder. |

### NEW View: Patterns Across the Table (`p01`–`p13`)

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **3.5** | Editorial question headlines make periodic trends click immediately, but a noble-gas pointer aimed at Caesium (`Z=55`) instead of Xenon (`Z=54`), a `×10` label on a `×1,000` log grid (`p08`), row copy left on screen in column mode (`p06`), and a "repeating wave" footer on Year of Discovery (`p09`) break trust. |
| **Ease** | **3.5** | Tapping dots, switching rows/columns, and tapping values for source popovers work cleanly on desktop, but phone loses `See it on the table →`, phone scrubbing leaves the dashed guide stuck on the old element (`p12`), and 8 extra patterns sit inside `More ▾` with no clarifying sublabels. |
| **Beauty** | **3.5** | The warm-paper Tufte-like chart styling and shaded period bands look refined in isolation, yet widespread overlaps—pills hiding data peaks, labels crossing curves, crisscrossing Vietnamese phone leader lines, and a tangled cobweb in column mode—make the charts look unfinished. |
| **Smoothness** | **4.0** | The mid-ripple shot (`p13`) shows a crisp, well-paced left-to-right transition on lightweight 2D graphics, though no FPS numbers were logged for `patterns-merged`. |
| **Delight** | **4.0** | Framing dry periodic trends as human stories (*"Why does tungsten glow..."*, *"How rare is gold?"*) with instant one-tap citations is genuinely rewarding once the visual clutter is fixed. |

### NEW View: Side by Side (`c01`–`c10`)

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.0** | True-to-scale pairing, a tight 5-row plain-English table, honest dashed footprint for unknown Oganesson (`c06`), and source popovers communicate quickly, softened by stranded `°C` line wraps, `"gases at 20 °C"` on solid-only pairs, a missing `100 pm` label on phone Graphite/Diamond (`c05`), and awkward rounding (`1 kg` Na, `≈ 51.9 °C` Og). |
| **Ease** | **3.5** | Desktop swapping, curated *Surprising pairs*, and ratio bars under *All numbers & sources* are intuitive, but phone strips away both `change` buttons, hides `Pick any two...` off the right edge of a clipped pill rail, fails to scroll the active pill into view (`c05-phone`), and desktop's `INSTEAD OF GOLD` search popover floats directly over the comparison table (`c07`). |
| **Beauty** | **3.0** | Graphite vs. Diamond (`c05`) is genuinely lovely, but all element-pair stages (`c01`–`c04`, `c06`, `c08`, `c10`) reduce the 3D hero to two bare glossy plastic marbles with harsh specular hotspots—worst when Gold, Iron, and Mercury all appear as identical dull slate-blue balls. |
| **Smoothness** | **4.0** | Simple two-object 3D stages and responsive drawers look lightweight and steady, though `patterns-merged` includes no FPS capture to verify. |
| **Delight** | **3.5** | Graphite vs. Diamond and Helium vs. Osmium deliver real visual "aha" moments, but pairing Gold with Mercury as two nearly identical blue spheres drains the magic from one of chemistry's best stories. |

### Overall Merged Build (`23af106`)

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.0** | The hero's editorial clarity carries the product, but factual and annotation bugs in Patterns and minor copy/rounding slips in Side by side keep it from 4.5. |
| **Ease** | **3.5** | Desktop flows feel calm and reversible, yet missing phone affordances in Side by side (`change`, `Pick any two...`), missing `See it on the table →` on mobile Patterns, and clipped phone sheets leave mobile clearly below 4. |
| **Beauty** | **3.5** | The 4.5-star Porcelain & Ink hero is undercut by generic glossy marbles in Side by side and pervasive label/line collisions in Patterns. |
| **Smoothness** | **4.0** | Solid ~60 FPS median on constrained hardware in the hero and clean staggered ripples in Patterns, pending real-device verification of molten forge p95 and the new views. |
| **Delight** | **4.0** | Calm wonder is unmistakably present in the tabletop, forge, and Graphite/Diamond comparison, but the new views need one dedicated polish pass to hit the 4.5+ bar. |

### Honest Comparison vs. Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)

**Is this better on feel?** **Yes—decisively on the Hero and overall usability, but NOT yet across every view.**
- **Where this clearly beats Sael:** Calm daylight Porcelain & Ink legibility vs. heavy dusk bloom; fast responsiveness (~60 FPS median even on SwiftShader low tier) vs. sluggish frames; real BCC→FCC→BCC iron crystal transitions vs. a generic cubic grid; thumb-scrubbing on phones; search, EN/VI, and full source provenance; plus two entire exploratory views (*Patterns* and *Side by side*) that Sael does not have.
- **Where Sael still feels richer:** Sael's photoreal showroom and scripted dioramas give element comparisons immediate material drama. Right now, our **Side by side** renders *Gold vs. Mercury* as two identical slate-blue plastic spheres—which feels noticeably flatter and cheaper than Sael's visual polish—and **Patterns** has too many overlapping labels to match the Hero's craft. Fixing those two views will make this unambiguously superior to Sael everywhere.

---

## 3. Every Visible Problem

### A. Factual Errors, Self-Contradictions, and Precision Bugs

1. **Wrong pointer target on Melting Point chart (`p01-from-card-melting-desktop.png`, `p11-vi-melting-desktop.png`):** The callout *"In each row, the noble gas melts coldest"* (`Trong mỗi hàng, khí hiếm nóng chảy ở nhiệt độ thấp nhất`) draws its leader line straight to **Caesium (`Z=55`, orange dot, melts at `28.5 °C`)** instead of **Xenon (`Z=54`, purple dot right beside it, melts at `−111.75 °C`)**.
2. **Self-contradicting noble-gas melting claim (`p01-from-card-melting-desktop.png`, `p01-phone`, `p11-vi`):** The text claims *"In each row, the noble gas melts coldest."* On Row 7 of the *very same chart*, predicted **Oganesson (`Z=118`, `≈ 52 °C`)** melts warmer than Francium (`Z=87`, `27 °C`), Copernicium (`112`), and Flerovium (`114`). Source: Smits et al., *Phys. Rev. Lett.* 125, 133002 (2020), https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.125.133002 (`325 ± 15 K` ≈ `52 °C`). Qualify to *"In every measured row, the noble gas melts coldest."*
3. **Wrong gridline multiplier on Crustal Abundance (`p08-crust-log-desktop.png`):** The subtitle states `each step up: ×10`, but the labeled horizontal gridlines are `10⁻¹²`, `10⁻⁹`, `10⁻⁶`, `0.001`, `1`, `1,000`, `1,000,000` with no minor gridlines between them—each visible grid step is **`×1,000`**, not `×10`.
4. **Wrong footer on Year of Discovery (`p09-discovered-desktop.png`):** The italic footer reads *"One wave that repeats across 118 elements: the pattern Mendeleev used to predict gallium before anyone had seen it."* Discovery year is a historical scatter plot, not a repeating periodic wave (which is why the chart rightly omits row/column lines). Crustal abundance (`p08`) also mostly reflects nuclear stability / Oddo–Harkins pairing rather than Mendeleev's chemical periodicity.
5. **Stale `"room temperature"` caption while heating (`18-forge-heat-it-playing-desktop.png`):** The forge is actively playing at **`396 °C`** (past the `lead melts` tick at 327 °C), yet the caption still reads *"Iron at room temperature: every atom touches 8 neighbours. Drag the thermometer to heat it."* This also breaks `STYLE.md` §9 (*"The caption names every stretch: room temperature, warming up, the glow, each event"*).
6. **False precision on predicted Oganesson melting point (`c06-hydrogen-oganesson-desktop.png`):** Shows `≈ 51.9 °C` (from `325 K − 273.15 = 51.85 °C`), implying 0.1 °C precision on a theoretical prediction whose published uncertainty is `± 15 K` (`325 ± 15 K`; Smits et al. 2020, https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.125.133002). Display `≈ 52 °C` (or `≈ 50 °C`).
7. **Misleading rounding on Sodium and Chlorine (`c04-sodium-chlorine-desktop.png`):**
   - Sodium density is shown as **`1 kg`** per litre. Real density is **`0.97 g/cm³`** (PubChem: https://pubchem.ncbi.nlm.nih.gov/element/Sodium)—crucially *less than water* (`1.0 kg/L`), which is why sodium floats. Rounding `0.97` to `1 kg` erases that fact and clashes with 1–2 decimals used elsewhere (`7.9 kg`, `0.17 g`, `0.08 g`, `1.3 g`).
   - Chlorine melting point is shown as **`−101 °C`**, whereas the standard value is **`−101.5 °C`** (`171.65 K`, PubChem: https://pubchem.ncbi.nlm.nih.gov/element/Chlorine), while Sodium on the same row (`97.8 °C`) and Mercury (`−38.8 °C`) keep one decimal place.
   - Chlorine density is shown as **`3 g`** (`2.95 g/L` at 20 °C), inconsistent with `1.3 g` for Oxygen and `0.17 g` for Helium.
   - Chlorine electron affinity in the hook says **`3.62 eV`** (matches PubChem's `3.617 eV` rounded to 2 decimals), though NIST Chemistry WebBook's high-precision laser photodetachment value is **`3.6127 eV`** (https://webbook.nist.gov/cgi/cbook.cgi?ID=C22537151, which rounds to `3.61 eV`)—confirm which source the `Source` pill cites.
8. **Copper density check (`c10-vi-iron-copper-phone.png`):** Shown as **`8,9 kg`**. Standard room-temperature copper density is **`8.96 g/cm³`** (RSC: https://periodic-table.rsc.org/element/29/copper; CRC Handbook), which rounds to **`9.0 kg`**. (PubChem's periodic table CSV lists `8.96` in its modern API and `8.92` in older exports—verify whether `8,9` came from `8.92` or from truncating `8.96`.)
9. **Iron covalent radius spin-state ambiguity (`c01`, `p02-phone`, `p04`, `c10-phone`):** Shows **`142 pm`** attributed to Cordero (2008). Cordero et al., *Dalton Trans.* 2008, 2832–2838 (https://pubs.rsc.org/en/content/articlelanding/2008/dt/b801115j) actually publish two values for Fe—**132 pm (low spin)** and **152 pm (high spin)**—so `142 pm` is their midpoint average. Note that explicitly in the source popover.

*(Note: Almost all other visible numbers—W 3,422 °C, C sublimation 3,642 °C, Fe 1,538 / 2,861 / 912 / 1,394 °C, Au 1,064 / 2,856 °C / 19.3 kg, Hg −38.83 °C / 13.5 kg, Os 22.6 kg / 3,033 °C, He 0.17 g & air 1.20 g at 20 °C & 136,000× ratio, CRC crustal abundances 74% O+Si & 14M× Fe/Au, NIST ionization energies, Alvarez 2013 vdW radii, Cordero 2008 radii for He/H/Cl/Cu/Hg/Au/Os/Na/Cs, Tennessine 2010, and the 1,000 °C heat-map states—checked out accurately!)*

### B. Overlapping, Colliding, or Clipped Text & Graphics

1. **Selected-element pills bury peaks and curves in Patterns:**
   - `p01-from-card-melting-desktop.png` & `p11-vi-melting-desktop.png`: `Iron 1,538 °C` (`Sắt 1.538 °C`) sits directly on top of the Row 4 peaks (`V`, `Cr`), obscuring the top of the black curve.
   - `p03-heft-gold-desktop.png`: `Gold 19.3 kg` completely covers the **Osmium (`22.6 kg`)**, Iridium, and Platinum peak dots right beneath *"Osmium: a litre would weigh 22.6 kg"*.
   - `p10-pull-desktop.png`: `Oxygen 3.44` overlaps the leader line of *"Fluorine pulls hardest: 3.98"* and sits over Nitrogen's dot.
   - `p04-hover-gold-desktop.png`: `Iron 142 pm` overlaps the descending Row 4 curve.
2. **Annotations and leader lines collide with data curves across Patterns:**
   - `p01-from-card-melting-desktop.png` & `p11-vi-melting-desktop.png`: `room temperature, 20 °C` (`nhiệt độ phòng, 20 °C`) cuts straight across Row 6 data dots (`Hg`, `Tl`).
   - `p03-heft-gold-desktop.png`: The leader line for *"Gases: a litre weighs only grams"* slashes diagonally through 4 dots/segments of Row 5 to reach Krypton (`36`).
   - `p08-crust-log-desktop.png`: *"Oxygen and silicon: 74 % of the crust"* overlaps the Row 2 vertical drop from `F` to `Ne`, and its single vertical pointer only touches Silicon (`14`), leaving Oxygen (`8`) unpointed.
   - `p01-from-card-melting-phone.png`: *"Tungsten: 3,422 °C, the highest melting point"* sits directly over the vertical Row 6 peak dots, and *"In each row, the noble gas melts coldest"* sits directly on top of Row 6 dots.
   - `p02-size-iron-phone.png`: *"Each row starts big..."* sits directly over Rubidium (`Z=37`).
   - `p03-heft-gold-phone.png`: *"Gases: a litre weighs only grams"* sits right on top of the bold black Row 6 line.
   - `p11-vi-grip-phone.png`: **Severe crisscrossing**—*"Hơi tụt ngay sau beryllium và nitơ"* draws its leader line right through Argon (`18`), and *"Kim loại mềm, dễ phản ứng buông dễ nhất"* shoots a diagonal leader line across Rows 4 and 5 straight through Xenon (`54`) to reach Potassium (`19`).
3. **"Down each column" spaghetti web + stale row annotations (`p06-columns-desktop.png`):** Switching to *Down each column* draws 17 faint crisscrossing horizontal grey lines across Rows 4–6 that tangle into a messy web, while keeping the row-oriented headline (*"Why do atoms get smaller as you go right?"*) and row callouts (*"Each row starts big... and shrinks across it"*) on screen.
4. **Stranded `°C` orphan on every English Side-by-side card (`c01`–`c06`, `c01-phone`, `c02-phone`):** The sub-label under `1 litre weighs` wraps as `density; gases at 20` / `°C`, leaving `°C` alone on a third line (missing non-breaking space `20\u00A0°C`). Also, **`gases at 20 °C`** shouldn't even appear when neither element is a gas (`c01` Iron/Gold, `c02` Gold/Mercury, `c05` Graphite/Diamond, `c10` Iron/Copper).
5. **Unanchored search popover covers the comparison table (`c07-pick-any-two-desktop.png`):** Clicking `Pick any two...` opens `INSTEAD OF GOLD` floating awkwardly across the left edge of the side card, slicing through `Atom size / covalent radius` and `Grip on electrons` while also covering `Gold 136 pm`.
6. **Clipped scroll edges in cards and sheets:**
   - `c08-all-numbers-desktop.png`: A clipped `°C` peeks out right beneath the sticky header `Na Sodium · Caesium Cs`, and `Electron pull` is bisected at the bottom edge.
   - `04-card-iron-phone.png` & `11-vi-card-iron-phone.png`: The clipped top edge of `Boils at 2,861 °C...` peeks out above the `< Manganese | Cobalt >` footer bar.
   - `c01-phone`, `c02-phone`, `c05-phone`, `c10-phone`: The bottom of the comparison sheet slices cleanly through the last visible row (`°C`, `coordination`, `bán kính cộng hoá`) with no fade gradient or "More" affordance.
7. **Vietnamese legend crowding (`p11-vi-melting-desktop.png`):** Because the Vietnamese legend is wider, `Chạm vào một điểm để chọn nguyên tố, rồi chạm vào số liệu để xem nguồn.` wraps into the gap above the italic footer, visually colliding with it.
8. **Rear-row occlusion in phone 3D lens (`09-lens-heft-phone.png`):** Tall Row 6/7 density columns (`Os`, `Ir`, `Pt`, `Au`, `Re`, `W`) obscure the symbols on the tiles behind them (`Ru`, `Rh`, `Pd`, `Ag`).

### C. Low Contrast

1. **Source popover metadata (`p05-tap-value-source-desktop.png`, `c09-tap-value-source-desktop.png`):** `Accessed: 2026-11-20` and `Licence: NCBI: US Government work...` are rendered in a pale washed-out blue-grey (~2.5–3:1 contrast on `#FBF8F2`), noticeably fainter than `--ink-2` (`6.8:1`) and hard to read.
2. **Washed-out `"More about Gold ⌄"` on phone (`05-card-gold-phone.png`):** The bottom white scroll-fade gradient sits *over* the `More about Gold ⌄` button, washing it out so it looks disabled/low-contrast (compare `04-card-iron-phone.png`, where it sits higher and stays crisp).

### D. Cheap-Looking 3D & Visual Underdelivery

1. **Generic glossy plastic marbles in Side by side (`c01`, `c02`, `c03`, `c04`, `c06`, `c08`, `c10`):** Unlike the tactile matte-glazed tiles on the tabletop or the charming ball-and-stick lattices in Graphite/Diamond (`c05`), the atom spheres in Side by side have a sharp, round white specular blob that reads like default Three.js Phong/plastic balls. Worse, coloring them strictly by *family pigment* turns **Iron vs. Gold (`c01`)**, **Gold vs. Mercury (`c02`)**, and **Iron vs. Copper (`c10`)** into **two identical dull slate-blue spheres**, completely flattening the visual story (especially for *Gold vs. Mercury*, where yellow solid vs. liquid silver is the entire hook).
2. **Auto-scaled lone Hydrogen looks huge (`c06-hydrogen-oganesson-desktop.png`):** Because Oganesson's radius is unknown, Hydrogen (`31 pm`) auto-scales to fill the stage next to a flat dashed ellipse on the floor, giving the unintended first impression that Hydrogen is giant.
3. **Molten iron still reads slightly boxy (`16-forge-1600C-molten-desktop.png`, `16-phone`):** At `1,600 °C` the liquid iron cluster retains noticeable straight vertical sides and corner structure rather than slumping into a natural rounded molten pool.

### E. Mobile-Specific Issues (390×844)

1. **No way to change elements visible on Side-by-side phone (`c01-phone`, `c02-phone`, `c05-phone`, `c10-phone`):** Desktop puts green `change` links under both tiles and shows `Pick any two...` clearly at the bottom. On phone, both `change` links disappear and `Pick any two...` is pushed off-screen to the far right of a horizontally scrolling pill strip (`Sodium · Ch…`) with no clear hint that more lies right.
2. **Missing scale bar label on Graphite/Diamond phone (`c05-graphite-diamond-phone.png`):** The horizontal scale bar renders between Graphite and Diamond with **no `100 pm` text label** underneath it (unlike `c01-phone` and `c02-phone`).
3. **Active pair pill not scrolled into view (`c05-graphite-diamond-phone.png`):** Even though *Graphite · diamond* is active, the pill strip above the sheet stays scrolled at the left (`Gold · Mercury | Helium · Osmium | Sodium · Ch`), showing nothing selected.
4. **Missing `See it on the table →` on mobile Patterns (`p01-phone`, `p02-phone`, `p03-phone`, `p11-vi-grip-phone`, `p12-scrub-phone`):** Desktop has a clean verdigris `See it on the table →` link above the chart; phone drops it entirely, cutting off the cross-link from Patterns back to the 3D table lens.
5. **Phone chart scrub crosshair stays stuck (`p12-scrub-phone.png`):** While scrubbing to `29 Cu Copper 7.73 eV`, the dashed vertical guideline remains pinned on `Iron (26)` instead of tracking under the user's thumb at Copper (`29`).

### F. Jargon, Copy, and Type/Spacing Inconsistencies

1. **Unexplained `electronvolts` (`p02-grip-iron-desktop.png`):** Atom size helpfully explains `; a picometre is a trillionth of a metre`, whereas Grip on electrons says `first ionization energy (NIST), in electronvolts` with no plain-English clue to what an eV is (e.g., *"how much energy it takes to pull one electron off"*).
2. **`More ▾` menu cryptic labels (`p07-more-menu-desktop.png`):** `Felt pull of the nucleus` and `Electron appetite` are plain-ish inventions, but without subtle secondary captions (like `effective nuclear charge`, `electron affinity`) or brief hints, neither a curious adult nor a chemistry student immediately knows what `Felt pull of the nucleus` means.
3. **Capitalization inconsistency (`c01`–`c08`, `c10`):** `Graphite · diamond` uses a lowercase `d`, whereas every other pill capitalizes both sides (`Gold · Mercury`, `Helium · Osmium`, `Sodium · Chlorine`, `Hydrogen · Oganesson`). Same in Vietnamese (`Than chì · kim cương`).
4. **Vietnamese element-naming inconsistency (`11-vi-card-iron-phone.png`, `p11-vi-grip-phone.png`, `c10-vi-gold-mercury-desktop.png`):** Cards mix traditional Vietnamese (`Sắt`, `Vàng`, `Thuỷ ngân`, `Đồng`, `Natri`, `Nitơ`, `vàng`, `oxy`) with English/IUPAC names (`Manganese`, `Cobalt`, `Chlorine`, `Beryllium`, `Tungsten`, `Helium`, `Hydrogen`, `Oganesson`)—most glaringly in `Natri · Chlorine`, `beryllium và nitơ`, and `Sắt` having `< Manganese | Cobalt >` in its footer. (Per `SPEC.md` §3, GDPT-2018 keeps traditional forms only where familiar, so `natri`/`nitơ` vs `chlorine`/`beryllium` should be checked systematically with moony for consistent GDPT-2018 rules.)
5. **Vietnamese pill wrap & tight card bottom (`c10-vi-gold-mercury-desktop.png`):** `Chọn hai nguyên tố bất kì...` wraps alone onto a second row beneath the 5 pair pills, and `Tất cả số liệu & nguồn` sits right on the card's bottom border with cramped padding.
6. **Missing unit suffix in `p08` pill (`p08-crust-log-desktop.png`):** The pill reads `Gold 0.004 g` rather than `0.004 g/t` (or `0.004 g per tonne`), which can be misread out of context without checking the y-axis subtitle.

---

## 4. Ranked Fix List (Highest Impact on Feel First)

1. **Fix factual & pointer bugs in Patterns and Forge (trust-breakers):**
   - Point the noble-gas melting-point annotation in `p01`/`p11-vi` to **Xenon (`Z=54`)**, not Caesium (`Z=55`), and qualify the copy to *"In every measured row, the noble gas melts coldest."*
   - Fix `p08` (`How common in Earth's crust`): either draw minor `×10` gridlines or change the subtitle to `each gridline: ×1,000` (and add `/t` to the pill value: `0.004 g/t`).
   - Give `p09` (`Discovered`)—and `p08` (`Crust`)—pattern-specific footers instead of the periodic-wave Mendeleev copy.
   - Update the Forge narrative caption threshold (`18-forge-heat-it-playing`) so `"Iron at room temperature..."` transitions to a `"Warming up: the atoms vibrate harder..."` caption as soon as temperature leaves room temp (e.g., `> 40 °C`).
2. **Make Side-by-side 3D visuals look tactile and genuinely differentiated (biggest leap in Beauty & Delight):**
   - Replace the harsh single-hotspot plastic shader on Side-by-side spheres with the same soft porcelain studio glaze / hemisphere-plus-softbox lighting used on the tabletop tiles.
   - Differentiate same-family pairs visually instead of showing two identical slate-blue balls: e.g., show subtle material/state cues (warm metallic sheen or subtle internal electron-shell/ring stippling, or a gentle liquid/gas surface treatment for Mercury/Helium/Chlorine) OR add a compact visual weight/state cue (such as a miniature 1-litre cube weight balance or state badge beside the spheres) so *Gold vs. Mercury* and *Iron vs. Gold* tell their story at a glance—matching the brilliance of `c05` Graphite vs. Diamond.
   - Cap Hydrogen's max display radius in `c06` (`Hydrogen · Oganesson`) so `31 pm` doesn't look massive beside Oganesson's unknown footprint.
3. **Build a collision-free annotation & pill layout pass for Patterns (desktop + phone):**
   - Place the selected-element pill using quadrant/collision checks so it never covers peaks (`Cr/V` in `p01`, `Os` in `p03`) or adjacent leader lines (`F` in `p10`).
   - Route callout leader lines to the nearest clear anchor without crossing data curves (especially `p03` "Gases", `p01` `room temperature, 20 °C`, `p01-phone` Tungsten/noble-gas, `p02-phone` Rb, and `p11-vi-grip-phone` where leader lines currently cross multiple rows).
   - In **Column mode (`p06`)**: dim non-selected column lines to ~10–15% opacity (or hide them until hovered) so the selected column stands out cleanly instead of a grey cobweb, and swap the headline/annotations to column-relevant copy (*"Down each column, each new shell makes the atom bigger"*).
4. **Fix mobile parity in Side by side & Patterns (pushes Ease ≥ 4.0):**
   - On Side-by-side phone (`c01`–`c10`), restore visible `change` links under both tiles in the sheet header (or make the tiles tappable with a small `▾` chevron), auto-scroll the active pair pill into view (`c05-phone`), ensure `Pick any two...` is reachable without hunting off-screen, and fix the missing `100 pm` label on `c05-graphite-diamond-phone.png`.
   - On Patterns phone, restore a compact `On table →` link in the chart header and update the dashed vertical guide live to follow the scrubbed element (`p12`).
5. **Fix Side-by-side desktop search popover anchoring & table polish:**
   - Anchor the `INSTEAD OF GOLD` search popover (`c07`) cleanly to the clicked `change` tile header (or bottom `Pick any two...` pill) so it never straddles the middle of the comparison table.
   - Add non-breaking spaces (`20\u00A0°C`) to eliminate every orphaned `°C` line wrap, hide `; gases at 20 °C` whenever neither compared element is a gas, and capitalize `Graphite · Diamond`.
   - Fix rounding & precision: show `0.97 kg` for Sodium, `2.9 g` and `−101.5 °C` for Chlorine, `≈ 52 °C` for Oganesson, verify Copper `8.96 → 9.0 kg` vs `8.92`, and note Fe's low/high-spin Cordero midpoint in its source popover.
6. **Polish contrast, scroll clipping, and subtle hero edges:**
   - Darken the `Accessed` and `Licence` lines in source popovers (`p05`, `c09`) to `--ink-2` (`#57524B`, ≥ 4.5:1).
   - Fix phone card bottom scroll fade and clipping (`04`, `05`, `11`, `c01`–`c10-phone`, `c08-desktop`): keep `More about <Element> ⌄` *above* the fade scrim so it never washes out, mask scrolling rows cleanly under sticky headers/footers, and add a gentle bottom fade to Side-by-side phone sheets.
   - Add a brief plain-English hint for `electronvolts` on `p02` (matching `picometre` on `p04`) and optional subtle captions in the `More ▾` menu (`p07`).
   - Add a `patterns-merged/fps.txt` check on desktop + phone (and slightly soften the silhouette of molten iron in `16-forge-1600C-molten` so its top corners slump more organically).
