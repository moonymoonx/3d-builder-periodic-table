# First-Time Visitor Review — Hero Slice (Round 1)

**Reviewed:** 19 screenshots (`01`–`11`, desktop 1440×900 & phone 390×844) + `fps.txt` in `/workspace/out/redesign/hero-r1`, evaluated first with fresh eyes (no instructions), then checked against `STYLE.md`, `SPEC.md §0`, `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`.

---

## 1. First 5 Seconds (Uninstructed Reaction)

- **What I think this is:** A calm, tactile museum exhibit of the periodic table—118 thick ceramic-like tiles resting on warm archival paper, grouped by muted mineral colours with plain-English map labels (*Soft, reactive metals*, *Workhorse metals*, *Salt-makers*, *Noble gases*). It looks immediately approachable, not like a textbook or developer dashboard.
- **What I think I should do:** On desktop (`01-first-load-desktop.png`), my eye lands on the 3D tile array, then drops to *"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds. Tap one to look inside."* The action—click a tile—is unmistakable, and after 4 seconds the `"Try iron"` pill (`02`) removes any remaining hesitation. Below the prompt, the chip row (*Families · Heat map · Melting point · Heft · Atom size · Grip on electrons*) invites a second click.
- **What draws my eye:** The warm cream surface, crisp ink symbols printed directly onto the tiles, and soft contact shadows underneath. Clicking an element on desktop (`04`, `05`, `07`) glides the camera in and lifts the tile like pulling a specimen from a tray—genuinely satisfying.
- **What confuses me:**
  1. **On phone (`01-first-load-phone.png`),** the table sits tiny in the middle of a massive blank cream void with *zero* family labels (so the colours go unexplained), and when I tap Iron or Gold (`04`, `05`), the table doesn't zoom in and the bottom card cuts off before showing *any* of the three action buttons (*Look inside the atom*, *Hold a piece*, *Side by side*).
  2. **In Heat map (`08-lens-heat-1000C-desktop.png`),** there are *four* tile colours on the table (slate grey, blue, amber, and pale tan/beige for `Fr, Db–Rg, Fl, At, No`), yet the legend only explains three (*solid, liquid, gas*).
  3. **In Melting point (`09-lens-melting-desktop.png`),** Carbon (`C`) is completely flat and faded grey right beside towering Boron (`B`), which looks broken if you know diamonds and graphite handle extreme heat.
  4. **In the Iron card (`04`),** the tiny green dagger `†` after *"your blood."* has no obvious meaning, and *"Side by side with Ruthenium"* suggests an obscure element a non-chemist has never heard of.

---

## 2. Strict Scores (1–5) & Honest Comparison with Ryan Sael

| Dimension | Score | One-Sentence Reason |
| :--- | :---: | :--- |
| **Clarity** | **4.0 / 5** | Desktop landing and element cards are instantly intelligible with zero chemistry jargon, held back by the unexplained fourth colour in Heat map (`08`), missing family labels on phone (`01`), and flat-ghosted Carbon in Melting point (`09`). |
| **Ease** | **3.5 / 5** | Desktop exploration and the phone thumb-scrub loupe (`03`) are genuinely smart, but the phone bottom sheet hides all three action doors off-screen (`04`, `05`), scrolling the desktop card collides `×` with `"across the table"` (`06`), and the phone search pill + lens strip (`09`) clip awkwardly. |
| **Beauty** | **4.0 / 5** | "Porcelain & Ink" is original, calm, and far easier to read than dark neon, yet zoomed-in tiles read slightly like matte plastic keyboard keycaps (`10`), the phone landing has too much empty beige void (`01`), and region labels clip behind the open card (`04`). |
| **Smoothness** | **4.0 / 5** | Phone holds a locked 60.0 FPS (`p95 16.8 ms`) even on SwiftShader software rendering, though zoomed-in desktop states (`04-card-iron`, `10-zoom-in`) drop to 30.0 FPS median (`p95 50.0 ms`), pointing to high fill-rate/overdraw cost when tiles fill the viewport. |
| **Delight** | **3.5 / 5** | Lifting a selected tile on desktop (`04`, `05`) and melting the whole table at 1,000 °C (`08`) feel wonderful, but phone loses the camera-glide payoff, `"Side by side with Ruthenium"` misses an intriguing hook, and the slice does not yet surpass Ryan Sael's tactile magic. |

**Honest verdict vs. [sael.net/periodic-table](https://sael.net/periodic-table) (`ref/VIDEO_NOTES.md`):**
- **Where we already beat Ryan:** Legibility, calm hierarchy, search & plain-language lenses, phone thumb-scrub usability, Vietnamese support (`11` has crisp, unclipped diacritics), and performance on modest hardware. Our daylight paper look feels smarter and more trustworthy than dark bloom.
- **Where Ryan still beats this R1 slice on feel:** **Tactile richness and immediate wow.** Ryan's dusk showroom immediately reads as a lush, physical diorama, whereas our tiles—especially zoomed in (`10-zoom-in-desktop.png`)—still feel slightly like uniform matte keycaps rather than glazed stoneware, and the phone view feels spare rather than enchanting. Pushing material craft, fixing the phone card/camera flow, and landing the forge wow will put us clearly ahead.

---

## 3. Every Visible Problem Found

### Overlapping, Clipped, or Misaligned UI
1. **Close button `×` overlaps `"↗ across the table"` when scrolled (`06-card-gold-all-numbers-desktop.png`):** Scrolling the desktop card slides content directly underneath the floating `×` button, clipping `"table"` into `"↗ across the [×]"`. Also, the element title (`Gold`) disappears off the top instead of collapsing into a sticky header.
2. **Phone bottom sheet hides all three action doors (`04-card-iron-phone.png`, `05-card-gold-phone.png`, `11-vi-card-iron-phone.png`):** At initial peek height, `"A litre would weigh"` is sliced in half at the bottom edge and none of the three doors (*Look inside the atom*, *Hold a piece · heat it*, *Side by side*) are visible—breaking `SPEC.md §0`'s 3-step path to the wow moment on mobile.
3. **Region label clipped by open card (`04-card-iron-desktop.png`):** `"Nonmetals of life"` is cut off by the left edge of the Iron card, reading `"Nonm / of"`.
4. **Hover tooltip and `"Try iron"` pill cover tile numbers (`02`, `03`, `10`):** `"Try iron"` (`02`) covers `26` on `Fe`; the hover card `"Cobalt / Co · number 27"` (`10`) covers `27` on `Co`; `"Gold"` (`03`) sits directly over `Ag` and `Pd`.
5. **Phone search pill is malformed (`01`, `03`, `04`, `05`, `08`, `09`, `10`, `11`):** On 390 px screens, the search button stays an awkward wide pill (~60 px) with a tiny magnifying glass `⌕` stuck on the left and empty space on the right instead of a centered 44×44 circle matching the `≡` menu button.
6. **Active lens chip clipped on phone (`09-lens-heft-phone.png`):** `"Families"` is cut to `"amilies"` on the left, while the *selected* `"Heft"` chip is faded out by the right-edge scroll mask.
7. **Tight left margin on bottom-left map label (`01-first-load-desktop.png`, `11-vi-landing-desktop.png`):** `"Radioactive heavyweights"` / `"Kim loại phóng xạ nặng"` sits just a few pixels from the left screen edge.

### Contrast, Style & Spec Deviations (`STYLE.md` / `DESIGN-RULES.md`)
8. **Missing legend item & weak contrast on Heat map (`08-lens-heat-1000C-desktop.png`, `08-lens-heat-1000C-phone.png`):**
   - Unknown/no-data elements (`Fr, Db–Rg, Fl, At, No`) appear as a 4th beige/tan colour not listed in the `solid / liquid / gas` legend, and hatching on predicted elements is barely discernible at table scale (especially on phone).
   - Dark ink symbols on dark slate `#7D8799` solid tiles (`Fe, Cr, W, Os, U`) have noticeably weaker contrast than the crisp white symbols on blue liquid tiles (`Li, Ag, Al`). Using white symbols on `#7D8799` (or lightening solid slate) will match the liquid tiles' clarity.
9. **Kelvin shown on default surface & Kelvin-first in details (`08`, `06`):** `08-lens-heat-1000C` shows `1,273 K` right below `1,000 °C` on a default surface, and `06-card-gold-all-numbers` shows `1,337 K (1,064 °C)` and `3,129 K (2,856 °C)`—violating `STYLE.md §4 & §10` (*"°C first and K only in the details"*).
10. **Inconsistent dotted underlines & unexplained `†` dagger (`04`, `05`, `07`, `11`):** Phone cards (`04-card-iron-phone.png`, `11-vi-card-iron-phone.png`) show dotted underlines under `Solid` and `1,538 °C`, whereas desktop cards (`04-card-iron-desktop.png`) do not. Meanwhile the standalone green `†` after the element hook looks cryptic rather than clickable.
11. **No family names on phone (`01-first-load-phone.png`):** Phone landing hides all family labels, leaving colour carrying family meaning alone (breaks `DESIGN-RULES.md` Respect + `STYLE.md §3`).
12. **Tech-demo subtitle `"3D · REAL DATA"` (`01-first-load-desktop.png`):** Reads slightly dry/developer-y against the warm museum-book voice.

### 3D Craft, Mobile Camera & Conceptual/Factual Issues
13. **Phone camera doesn't zoom in on selected tile (`04-card-iron-phone.png`, `05-card-gold-phone.png`, `11-vi-card-iron-phone.png`):** Tapping an element on desktop glides the camera dramatically into the lifted tile; on phone, the camera stays fully zoomed out on a tiny 18-column grid surrounded by empty cream space, losing the tactile payoff completely.
14. **Zoomed-in tiles look like matte keycaps, not glazed porcelain (`10-zoom-in-desktop.png`):** Uniform matte bevels with almost no specular glaze catchlight or ceramic edge nuance look closer to soft-touch ABS keyboard caps than porcelain specimens.
15. **Tall columns occlude back rows & Carbon looks "missing" in Melting point (`09-lens-melting-desktop.png`):** High pillars (`Ta, W, Re, Os, Ir`) block `Nb, Mo, Tc, Ru, Rh` and `V–Fe` behind them at this low pitch angle. Worse, Carbon (`C`) is rendered completely flat and grey right beside Boron (`B`) because carbon sublimes rather than melts at 1 atm (~3,642 °C sublimation point, [periodic-table.rsc.org/element/6/carbon](https://periodic-table.rsc.org/element/6/carbon))—without calling out Carbon in the banner or hatching/flagging sublimation, non-experts will think Carbon has a low melting point or broken data.
16. **Awkward phrasing & weak compare default (`04`, `07`):**
    - Iron's card suggests `"Side by side with Ruthenium"` (`04`)—an obscure element for laypeople; pairing Iron with **Gold** or **Aluminium** (or **Copper**) is far more relatable.
    - Oxygen's card (`07`) uses `"Hold a piece · heat it"` for a gas you can't hold—rename to `"Cool & heat a sample"` (or `"Hold a sample · change heat"`) for gases.
    - Oxygen's melting anchor (`"Lower than mercury (−38.8 °C), the lowest-melting metal"`) compares a cryogenic gas to a metal; comparing to *"liquid nitrogen (−196 °C)"* or simply stating *"stays a gas until −183 °C"* feels far more intuitive.

---

## 4. Ranked Fix List (Highest Impact on Feel First)

1. **Fix the phone element-card flow: zoom the camera to the lifted tile AND make the 3 action doors visible at peek height (`04`, `05`, `11`).**
   - On phone tap, glide/zoom the 3D table cleanly onto the tapped tile in the upper 45% of the viewport (just like desktop) and compact the sheet header + 3 facts into a tight 3-column mini-strip (`State · Melts · 1 L weighs`) so **Look inside the atom** and **Hold a piece · heat it** sit immediately tappable above the fold without scrolling.
2. **Add a sticky compact header inside the desktop element card so `×` never overlaps scrolling rows (`06`).**
   - When the card scrolls past the hero name, pin a subtle `--card` header bar (`79 Au · Gold` on the left, `×` on the right, hairline border below) so `"↗ across the table"` never collides with `×` and users always remember which element they're reading.
3. **Elevate the porcelain tile shader/material so close-ups feel like glazed stoneware, not keycaps (`01`, `10`).**
   - Lower top-face roughness slightly (`0.42 → 0.28–0.32`) or add a crisp clearcoat/specular sheen (`MeshPhysicalMaterial` clearcoat on Med/High, specular highlight on Low) plus slightly tighter top rim bevel and a faint warm paper-grain vignette on the backdrop so the tiles look unmistakably crafted up close.
4. **Fix Heat map contrast, add the missing `"no data"` legend chip, and remove `1,273 K` from the default surface (`08`).**
   - Switch solid-tile `#7D8799` ink symbols to crisp white (matching blue liquid tiles) or lighten solid slate so ink hits ≥7:1; add a 4th legend swatch (`unknown / no data`) for the tan tiles (`Fr, Db–Rg, At…`); strengthen predicted hatching contrast; remove `1,273 K` from the default Heat-map card (keep K in details only) and flip `06` details to `1,064 °C (1,337 K)`.
5. **Improve the phone landing composition and fix phone top-bar / chip-strip polish (`01`, `08`, `09`).**
   - Make the phone search button a centered `44×44` circular button matching `≡`; auto-scroll the active lens chip fully inside safe padding so `"Heft"` isn't masked out (`09`); frame the phone table slightly larger/angled with a subtle family-bar or pill legend (or show the tapped family name in the loupe!) so colour isn't unexplained on phone.
6. **Prevent label/tooltip collisions across all desktop states (`02`, `03`, `04`, `10`).**
   - Offset hover tooltips and `"Try iron"` 10–12 px higher with a tiny downward caret so they never cover the tile's atomic number (`26`, `27`); fade out any 3D region label whose screen-space bounding box intersects the open right-hand element card (`"Nonm / of"` in `04`); add 16 px breathing room on the left of `"Radioactive heavyweights"`.
7. **Fix Melting point occlusion and explain Carbon's sublimation (`09-lens-melting-desktop.png`).**
   - Raise the camera elevation angle slightly (e.g., +8–10° steeper pitch) whenever a bar-height lens is active so tall `W/Re/Os/B` columns don't swallow the rows behind them; update the Melting point banner to mention Carbon explicitly (e.g., *"Carbon doesn't melt at normal pressure—it turns straight to gas at ~3,642 °C"*).
8. **Upgrade smart default pairings, gas wording, and source indicator (`04`, `07`).**
   - Curate human-first default `"Side by side"` pairs for common elements (e.g., Iron → **Gold** or **Aluminium**, Oxygen → **Carbon** or **Nitrogen**, instead of mechanical same-column `Ruthenium`); change `"Hold a piece · heat it"` on gases to `"Cool & heat a sample"`; replace the cryptic `†` dagger with a quiet `"Source"` pill or info dot, and unify dotted tap-hints across desktop and phone.
9. **Reclaim desktop zoomed-in frame rate (`fps.txt`: `04-card-iron` & `10-zoom-in` at 30 FPS / 50 ms p95).**
   - Profile why zoomed-in views double frame time on SwiftShader (likely alpha-blended contact-shadow quads + screen-space backdrop/scrims overdrawing large tile areas); disable/cull off-screen tiles and simplify contact-shadow alpha fill when zoomed in so desktop matches phone's locked 60 FPS.
10. **Polish micro-copy and wordmark restraint (`01`).**
    - Drop the `"3D · REAL DATA"` tech badge under `"Periodic Table"` (or tuck `"Real cited data"` inside the menu/footer) so the top-left reads like an art book rather than a software demo.
