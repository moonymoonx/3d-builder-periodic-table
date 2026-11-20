# First-Time-Visitor Review — Hero Slice (Round 2)

Reviewed cold from all 19 screenshots in `/workspace/out/redesign/hero-r2/` (desktop 1440×900, phone 390×844) before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, `ref/VIDEO_NOTES.md`, or `fps.txt`.

---

## 1. First 5 Seconds

- **What I think this is:** A calm, museum-grade interactive 3D periodic table laid out like matte glazed ceramic tiles on warm paper. It reads immediately like an illustrated science book or physical specimen tray rather than a chemistry textbook or sci-fi dashboard.
- **What draws my eye:** On desktop (`01-first-load-desktop.png`), the perspective array of soft pastel-glazed 3D tiles and their gentle contact shadows own the viewport; the plain-English family labels floating around the clusters (*"Workhorse metals"*, *"Nonmetals of life"*, *"Salt-makers"*, *"Radioactive heavyweights"*) invite browsing without intimidating chemistry jargon. Below, the editorial serif line (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*) and verdigris prompt (*"Tap one to look inside."*) frame the experience clearly.
- **What I think I should do:** Click or tap any element tile (and if I hesitate, `02-try-iron-hint-desktop.png` gently nudges me with a crisp `Try iron` tag over `Fe`), type into `Find an element`, or explore the lens chips along the bottom (`Heat map`, `Melting point`, `Heft`, `Atom size`, `Grip on electrons`). On phone (`01-first-load-phone.png`), the prompt *"Touch the table and slide: lift your finger to open."* tells me to scrub rather than struggle to tap tiny tiles.
- **Anything confusing in the first 5 seconds:**
  - **Floating region labels on desktop (`01-first-load-desktop.png`):** `Mineral metals` floats over `Sc`/`Ti` (groups 3–4) rather than directly over the yellow alkaline-earth column (`Be–Ra`), so at first glance it looks like it labels `Sc–Ti`. `Half-metals` sits directly over `B` (group 13), even though the teal metalloid band runs diagonally down to `Po` while most of group 13 (`Al, Ga, In, Tl, Nh`) is light-blue "Other metals". `H` sits isolated in green at top-left with no label connecting it to `Nonmetals of life`.
  - **Number jump to the bottom rows:** `56 Ba` jumps straight to `71 Lu` (`57–70 La–Yb` sit detached below) and `88 Ra` jumps to `103 Lr` (`89–102 Ac–No` below) with no subtle gap marker or visual cue showing where the two rows insert.
  - **Phone landing scale (`01-first-load-phone.png`):** The table is squeezed into a thin ~170 px horizontal strip suspended between two huge empty beige bands (~190 px above, ~160 px below), with illegible atomic numbers and barely legible ~6–7 px symbols, while the bottom chip `Heft` is sliced mid-word (`He|`).

---

## 2. Scores (1–5, strict: 4 = genuinely good, 5 = exceptional)

| Criterion | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.0** | Plain-English hooks, human-scale facts, and the calm landing hierarchy make the app understandable in seconds, held back by ambiguous desktop region-label placement, missing stripe legends in two lenses, unexplained dotted-underline facts on phone, and Helium being misclassified under *"Flat tiles: not measured"*. |
| **Ease** | **3.5** | Hover lift, `← All elements`, and the phone thumb-scrub loupe are genuinely thoughtful, but Gold's desktop card clips its prev/next footer in half, zooming in offers no visible reset (`⌂`) button and leaves hero text draped over tiles, tall Melting point columns block `Tc`/`Mo`/`H`, and the phone loupe does not visibly highlight the active tile on the table. |
| **Beauty** | **4.0** | The "Porcelain & Ink" palette, beveled glazed tiles (`10-zoom-in-desktop.png`), soft contact shadows, and restrained typography feel genuinely museum-grade, kept below 4.5 by unreadable dark-on-blue atomic numbers in Heat map, a floor-level selection outline that crowds adjacent rows, wasted vertical void on phone, and clipped card edges. |
| **Smoothness** | **4.0** | Achieving a 60 FPS median across all 19 states (and a flat 60.0 FPS / 16.8 ms p95 on phone) on CPU-only SwiftShader rendering is strong engineering, though desktop p95 still hits 33.4 ms on cards/lenses and 50.0 ms (38.7 avg FPS) during the first second of deep zoom before dynamic resolution steps down, and real-device High-tier motion is not yet tested. |
| **Delight** | **3.5** | The whole-table Heat map slider, data-computed *"Side by side"* comparisons, and Carbon sublimation callout spark genuine curiosity, but the designed wow moment (*Hold a piece · heat it* forge dive) is not in this slice yet, the Heft lens's log scale flattens gold into a uniform metal wall that undercuts its own headline, and clipping/occlusion glitches interrupt the craft. |

### Honest Comparison with Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)

**Is this better on feel?** **Yes on clarity, ease, calm beauty, and responsiveness; not yet on first-impression theatrical delight.**

- **Where this clearly beats Sael:** Calm daylight readability beats dark bloom-heavy showroom fatigue; plain-English framing (*"A litre would weigh 7.9 kg"*, *"Melts at 1,538 °C"*) beats raw stat panels; flat landing tiles, search, EN/VI support, and the phone thumb-scrub loupe make it vastly easier to actually use (especially on phones and modest hardware, where this hits 60 FPS median even on software rendering while Sael is heavy and hard to click); the home-screen **Heat map** slider gives an immediate table-wide interactive payoff Sael lacks.
- **Where Sael still edges this slice out:** Sael's dark photoreal desk, shallow depth-of-field, and tall sculptural columns create an instant 2-second *"whoa"* gasp. Because this hero slice stops at the element card doors (without the *Heat it* dark-forge dive or *Look inside the atom* stippled clouds yet), and because the 3D height lenses (`Melting point`, `Heft`) currently suffer from occlusion and flat log-compression, it feels admirably refined rather than unforgettable. Once the forge wow moment lands and the polish bugs below are fixed, this will decisively beat Sael on feel overall.

---

## 3. Every Visible Problem

### Overlapping or clipped text & UI
1. **Desktop Gold card clips prev/next footer (`05-card-gold-desktop.png`):** Because Gold's hook wraps to 3 lines and its *"Side by side"* subtitle wraps to 3 lines, `< Platinum` and `Mercury >` are sliced vertically in half at the bottom edge of the 392 px card.
2. **Expanded "All numbers & sources" card clips bottom row with no scroll cue (`06-card-gold-all-numbers-desktop.png`):** `Electronegativity (Pauling)` is cut in half at the bottom edge with no visible scrollbar or fade gradient indicating scrollable overflow.
3. **Hero intro copy collides with zoomed-in tiles (`10-zoom-in-desktop.png`):** *"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds. Tap one to look inside."* stays pinned across the bottom bevels and shadows of `Mt` and `Ds`, colliding directly with the 3D geometry.
4. **3D column occlusion in Melting point (`09-lens-melting-desktop.png`) and Heft (`09-lens-heft-phone.png`):** In `09-lens-melting-desktop.png`, tall front-row columns (`Ta, W, Re, Os, Ir, Pt, Rf`) hide or slice tiles behind them—`Tc` (43) is almost completely blocked behind `Re`, `Mo` (42) is bisected by `W`, `Mn`/`Fe` are partially occluded by `Ru`/`Os`, and `H` is half-hidden behind `Li`/`Be`. In `09-lens-heft-phone.png`, `H` is completely hidden behind `Li`/`Be`, and `N`/`O`/`F` vanish behind `P`/`S`/`Cl`.
5. **Vietnamese line break & label crowding (`11-vi-landing-desktop.png`):**
   - The landing sentence splits the two-syllable compound word **`nguyên / tử`** (*atom*) across two lines (*"...tạo nên từ nguyên / tử — và mỗi nguyên tử..."*).
   - `Nhóm tạo muối` nearly touches the top-left corner of the `He` tile, and `Kim loại phóng xạ nặng` crowds the left edge of `Ac`.
6. **Top bar overlap on phone Gold card (`05-card-gold-phone.png`):** Tiles `B` and `C` peek noticeably right behind the `EN | VI` pill and `≡` menu button because the top scrim is too light there.
7. **Phone lens bar mid-word clipping (`01-first-load-phone.png`, `08-lens-heat-1000C-phone.png`, `09-lens-heft-phone.png`):** `Heft` clips to `He|` on initial load, and scrolling centers `Heft` with awkward fragments `...es` and `At...` on both sides.

### Low contrast & visual legibility
8. **Dark atomic numbers on dark-blue `liquid` tiles (`08-lens-heat-1000C-desktop.png`, `08-lens-heat-1000C-phone.png`):** While the element symbols (`Li, Mg, Ca, Ag, Pb, Pu`, etc.) switch to white on `#2A6FAE`, the atomic numbers (`3, 12, 20, 47, 82, 94`) remain dark ink and nearly vanish into the blue glaze.
9. **Low-contrast ghost/flat tiles (`09-lens-melting-desktop.png`):** `Db, Sg, Bh, Hs, Mt, Ds, Rg` and `He` use pale grey ink on pale translucent beige-grey tops, making their symbols hard to read.
10. **Muddy diagonal stripes on phone (`08-lens-heat-1000C-phone.png`, `09-lens-heft-phone.png`):** On ~19 px phone tiles, high-contrast diagonal stripes over tiny symbols (`Lr, Rf, Cn, Nh, Mc, Lv, Ts, Og, Es`) reduce legibility to visual noise.

### Jargon without a human phrase & missing legends
11. **Missing stripe legend in Melting point and Heft (`09-lens-melting-desktop.png`, `09-lens-heft-phone.png`):** Both views show prominent striped columns (e.g., `Rf` towering up next to flat `Db–Rg` in Melting point; `Lr–Lv`, `Fm–No` in Heft) with **no key explaining that stripes mean predicted values**. `09-lens-heft-phone.png` also renders `Og` as a flat ghost tile with no *"not known"* key.
12. **Unexplained electron-configuration exception pill (`06-card-gold-all-numbers-desktop.png`):** Inside *All numbers & sources*, `[Xe] 4f¹⁴ 5d¹⁰ 6s¹` carries a red-tinted pill reading `exception: 5d: 9 → 10, 6s: 2 → 1` with no human-language gloss (e.g., *"borrows one 6s electron to complete the 5d shell"*).
13. **Ambiguous lens title `"Heft"` (`01`, `09-lens-heft-phone.png`):** Charming in English, though less immediately clear to non-native English readers than pairing it or introducing it alongside density/weight; acceptable per `STYLE.md`, but worth noting that its visual doesn't reinforce the word (see #18).

### Inconsistent UI, spacing, type & missing affordances
14. **No visible reset-view (`⌂`) control when zoomed in (`10-zoom-in-desktop.png`, `10-zoom-in-phone.png`):** Directly violates `STYLE.md §7` (*`User orbiting is allowed within soft limits; "⌂" recentres.`*) and `DESIGN-RULES.md` (*`a way back or a reset is always visible`*). Once zoomed in, there is no obvious way to snap back to the full table.
15. **Phone dotted-underline facts lack interaction cues (`04-card-iron-phone.png`, `05-card-gold-phone.png`, `11-vi-card-iron-phone.png`):** `Solid`, `1,538 °C`, and `7.9 kg` have dotted underlines, unlike desktop's explicit `↗ across the table` links, leaving users guessing what tapping them does.
16. **Phone sheet hides scrollability & scientific family name (`04-card-iron-phone.png`, `05-card-gold-phone.png`):** There is no visual cue at the bottom of the sheet that *"All numbers & sources"* and prev/next element links exist below if you pull up; also the scientific family subtitle (`transition metals`) shown on desktop is missing on phone.
17. **Unexplained teal highlight on one row (`06-card-gold-all-numbers-desktop.png`):** `19.282 g/cm³` is styled in verdigris teal while every other clickable value in the table is dark ink with a dotted underline (presumably a synthetic hover/focus state, or inconsistent styling—either way, it looks odd without a tooltip/popover).

### 3D craft & visualization issues
18. **Log₁₀ scaling ruins the Heft lens visually (`09-lens-heft-phone.png`):** Because gases (`~0.0001–0.01 g/cm³`) eat ~4 of the 5.5 orders of magnitude on the log₁₀ scale, every solid from Lithium (`0.53 g/cm³`) to Gold (`19.3 g/cm³`) and Osmium (`22.6 g/cm³`) compresses into an almost flat uniform wall of tall blocks. Gold does not visually stand out at all, contradicting the card's own headline (*"Why a helium balloon floats, while a litre of gold would weigh 19.3 kg."*).
19. **Floor-level selection ring crowds adjacent rows (`04-card-iron-desktop.png`, `05-card-gold-desktop.png`, `07-card-oxygen-gas-desktop.png`, `04/05/11-phone`):** When `Fe`, `Au`, or `O` lifts up, the thin verdigris outline left flat in its socket grazes the top edge of the tile in front (`44 Ru`, `111 Rg`, `16 S`) while its top edge is hidden behind the lifted tile, reading like a slightly misaligned wireframe artifact rather than an intentional highlight.
20. **Ghostly half-faded bottom rows behind lens chips (`04/05/07-desktop`):** When zoomed to an element card, the bottom scrim partially washes out the lanthanide/actinide rows right behind the lens bar (`05-card-gold-desktop.png`), looking slightly messy.

### Mobile-specific issues
21. **No visible tile highlight during thumb-scrub (`03-thumb-scrub-phone.png`):** While the floating loupe (`26 Fe · Iron · Workhorse metals`) is super readable, the actual `Fe` tile on the 3D table underneath shows no unmistakable highlight/ring/lift at phone scale, breaking the spatial link between thumb position and loupe.
22. **Phone zoomed-in view keeps landing legend & hero quote pinned (`10-zoom-in-phone.png`):** Even after pinch-zooming into the table, the 4-row family key + 3-line intro + *"Touch the table and slide..."* stay glued across the bottom ~40% of the screen, wasting space and fighting the zoomed interaction.
23. **Phone Vietnamese title surprise (`11-vi-card-iron-phone.png`):** Displaying English **`Iron`** as the huge serif headline with tiny `sắt` in the muted subtitle matches `SPEC.md §3` (GDPT-2018), but for older Vietnamese adults (a core target audience in `STYLE.md §1`), leading solely with English `Iron` in an otherwise Vietnamese UI can feel at first glance like an untranslated heading.

### Factual & data-consistency errors
24. **Helium mislabelled as *"not measured"* (`09-lens-melting-desktop.png`):** `He` is rendered as a flat ghost tile and the Melting point caption states *"Flat tiles: not measured."* Helium's melting behavior at 1 atm is **not** unmeasured—helium uniquely **never solidifies at normal atmospheric pressure (1 atm)**, remaining liquid even at absolute zero due to quantum zero-point energy (requiring ≥25 atm to freeze). Source: Los Alamos National Laboratory Periodic Table, Helium (`https://periodic.lanl.gov/2.shtml`). This also contradicts `SPEC.md §2` (*"handles sublimation (C, As) and helium (no solid at 1 atm)"*).
25. **Abridged atomic weight labelled as full `"Standard atomic weight"` (`06-card-gold-all-numbers-desktop.png`):** Gold displays `Standard atomic weight: 196.97 ± 0.01`. That is IUPAC/CIAAW's *abridged* 5-digit standard atomic weight (`https://ciaaw.org/abridged-atomic-weights.htm`), whereas gold is monoisotopic (`¹⁹⁷Au`) and its actual IUPAC standard atomic weight is **`196.966 570 ± 0.000 004`** (`https://ciaaw.org/gold.htm`). Presenting `± 0.01` without labelling it *abridged* overstates the uncertainty by 2,500×.
26. **Inconsistent predicted-data flagging for Actinium (`Ac`, Z=89):** `Ac` is striped (predicted) in `08-lens-heat-1000C-desktop.png`, yet unstriped in `09-lens-melting-desktop.png`, even though at 1,000 °C only melting point (not boiling point) determines its solid state, and actinium's melting point (~1,050 °C) is itself an estimate in critically evaluated thermophysical literature (`https://www.rsc.org/periodic-table/element/89/actinium`).

---

## 4. Ranked Fix List (Most Impact on Feel First)

1. **Fix Gold (and tall-copy) desktop card overflow & add scroll affordance (`05`, `06`):** Make the desktop element card a flex column with a sticky footer (`‹ Prev` / `Next ›`) and a scrollable middle body (with a subtle bottom fade/scrollbar when overflowing) so `< Platinum` / `Mercury >` and `Electronegativity (Pauling)` are never sliced in half at 900 px viewport height.
2. **Add an always-visible `⌂` / `Reset view` pill when zoomed or orbited, and fade out landing chrome on zoom (`10-desktop`, `10-phone`):** As soon as camera distance/target moves away from the home framing, smoothly fade out the bottom hero quote (desktop + phone) and family legend (phone) so text never overlaps zoomed tiles, and reveal a `⌂ Reset view` pill in the top bar (per `STYLE.md §7` and `DESIGN-RULES.md`).
3. **Fix Melting point camera elevation & Heft height curve (`09-melting-desktop`, `09-heft-phone`):**
   - For **Melting point** (and any extruded lens), raise the default camera pitch higher (e.g., ~50–55° instead of low oblique) and slightly reduce max column height ratio so tall front-row columns (`W, Re, Os, Ta`) never hide `Tc, Mo, Mn, Fe, H` behind them.
   - For **Heft**, replace raw log₁₀-from-hydrogen with a **two-band or piecewise/sqrt-compressed scale** (e.g., gases sit flat/recessed at floor level with a subtle "gases < 0.01 g/cm³" note, while solids & liquids scale linearly or gently across 0.5–23 g/cm³) so **Gold (`19.3`) and Osmium (`22.6`) visibly tower over Lithium (`0.53`) and Aluminium (`2.7`)**, matching the card's headline.
   - Add the `striped: predicted` and `flat: not known` key items to **every** lens card that uses them (Melting point, Heft, etc.), and brighten flat ghost-tile ink to ≥4.5:1.
4. **Fix Heat map `liquid` tile atomic-number contrast (`08-desktop`, `08-phone`):** Render the atomic number in the same light/paper ink as the element symbol whenever a tile uses the `#2A6FAE` liquid glaze (and soften stripe opacity slightly on small phone tiles so symbols remain legible).
5. **Fix the factual/data issues (`09-melting`, `06-gold`, `08-heat`):**
   - Give **Helium** its own callout/caption note in Melting point (*"Helium never freezes at normal pressure."*), rather than lumping it into *"Flat tiles: not measured"*.
   - In *All numbers & sources*, either display the full CIAAW standard atomic weight (`196.966 570 ± 0.000 004`) or explicitly label `196.97 ± 0.01` as *"Standard atomic weight (abridged)"*.
   - Align predicted-flagging between Melting point and Heat map (only stripe an element in Heat map when the phase boundary relevant to the current temperature is predicted, and apply the same `predicted` flag to `Ac`'s melting point across both lenses).
6. **Improve phone landing framing, thumb-scrub anchoring, and sheet cues (`01-phone`, `03-phone`, `04/05-phone`):**
   - Reduce the empty cream void above the phone table (frame the table higher and slightly larger, or allow a slightly tighter top margin and compact 3-row legend) so the table feels substantial rather than stranded.
   - During thumb-scrub (`03-thumb-scrub-phone.png`), strongly highlight and raise the active tile (e.g., crisp verdigris rim glow + elevated tile + small subtle indicator) so the eye instantly connects the loupe to the tile under the finger.
   - On the phone element sheet (`04/05-phone`), add a subtle `"All numbers & sources ⌃"` footer peek or bottom fade cue, keep the scientific family caption (`transition metals`), explain or subtly label the dotted-underline facts, and strengthen the top scrim behind `EN | VI` and `≡`.
7. **Refine the 3D selection ring on lifted tiles (`04`, `05`, `07`):** Attach a clean verdigris bevel rim/halo to the **lifted tile itself** (or recess/shrink the socket ring inward by 6–8%) so the outline never grazes or visually collides with the top edge of the tile in front (`Ru`, `Rg`, `S`).
8. **Tighten region labels and Vietnamese typography (`01-desktop`, `11-vi-desktop`, `11-vi-phone`):**
   - Move `Mineral metals` directly over/beside `Be`–`Mg` (col 2, aligned left of the `Sc` gap) instead of floating above `Ti`, and adjust `Half-metals` slightly right toward `B`/`Si` so it doesn't sit squarely over the `Al–Nh` column.
   - Add a non-breaking space in Vietnamese (`nguyên&nbsp;tử`) so *"nguyên tử"* never splits across lines, and give `Nhóm tạo muối` and `Kim loại phóng xạ nặng` ≥10 px clearance from `He` and `Ac`.
   - On Vietnamese element cards (`11-vi-card-iron-phone.png`), consider showing `Iron · Sắt` (or slightly larger traditional name) so adults schooled before GDPT-2018 immediately recognize the element.
9. **Smooth out desktop deep-zoom frame-time spikes (`fps.txt`, `10-zoom-in-desktop`):** Trigger dynamic resolution scaling proactively (or pre-lower pixel ratio slightly on software/low-tier zoom gestures) so `10-zoom-in-desktop` avoids its 50 ms p95 / 38.7 avg FPS dip during the first second, and trim the 33.4 ms p95 spikes on desktop card/lens transitions.
10. **Polish minor copy & detail consistency (`06-gold`):** Add a brief plain-English gloss to the electron-configuration exception pill (*"exception: fills 5d by borrowing one 6s electron (5d: 9→10, 6s: 2→1)"*), ensure consistent link/underline styling across rows in *All numbers & sources*, and subtly hide or dim the desktop bottom lens bar when an element card is open so the table's bottom rows aren't half-erased behind chips.
