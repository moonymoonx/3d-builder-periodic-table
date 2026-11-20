# First-Time Visitor Review — Redesigned Periodic Table (Hero Round 4)

Reviewed cold from the 30 screenshots and `fps.txt` in `/workspace/out/redesign/hero-r4` (desktop `1440×900` and phone `390×844`) before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`.

---

## 1. First 5 Seconds (Cold Reaction)

- **What I think this is:** An editorial, museum-grade interactive 3D periodic table. It immediately feels like a tactile tray of glazed ceramic tiles laid on warm cream paper—closer to a Bartosz Ciechanowski essay or a sunlit science-museum exhibit than a textbook or a neon dashboard.
- **What draws my eye:** On desktop (`01`, `02`), the soft colour-coded ceramic blocks and their warm contact shadows anchor the centre of the screen; my eye drops straight to the italic serif hook (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*) and the teal call to action (*"Tap one to look inside."*). When `"Try iron"` pops above `Fe` (`02`), it gives an instant, friendly starting point without nagging.
- **What I think I should do:** Click a tile (starting with Iron or Gold), or try one of the quiet pill chips along the bottom (`Heat map`, `Melting point`, `Heft`, `Atom size`, `Grip on electrons`) to reshape the table, or type into `Find an element`.
- **Anything confusing in the first 5 seconds:**
  - On **desktop (`01`, `11-vi`)**, the `"Mineral metals"` label sits beside the gap between `H` and `Be`. Because Hydrogen (`H`) sits alone in green with no label of its own, it is momentarily ambiguous whether `"Mineral metals"` labels column 2 (`Be–Ra`) or `H`.
  - On **phone (`01-first-load-phone`)**, the table is a very narrow strip floating in the middle of a large vertical expanse of empty cream space; the printed tile symbols are tiny (~5–6 px tall) and barely readable before touching. The instruction *"Touch and slide across the table — lift to open."* makes sense once you see the thumb-scrub loupe (`03-thumb-scrub-phone`), which is genuinely clever, though at rest the screen feels slightly empty above and below the tiny ribbon of tiles.
  - `"Heft"` is charming and mostly intuitive, though a non-native speaker or developer may pause half a second before realizing it means density.
  - Once inside the **Forge (`13`–`15`)**, the very first thing that breaks the spell is the tiny black/white spider-like asterisk with boxy square tips pasted over the dead centre of the iron crystal. Without instructions, it looks like a stray 3D axis gizmo or a rendering artifact until you read *"every atom touches 8 neighbours"*.

---

## 2. Scores (1–5) & Comparison with Ryan Sael (`sael.net/periodic-table`)

| Dimension | Score | Reason |
|---|---|---|
| **Clarity** | **4.5 / 5** | The porcelain table, plain-English family map, editorial element cards, and 1,000 °C heat map are extraordinarily clear at a glance, held back from a 5 only by the colliding thermometer stem (`1,394 °C` slicing through `1,538 °C melts`), the confusing 2D spoke overlay in the forge, and buried elements in the phone Heft view. |
| **Ease** | **4.5 / 5** | Navigation feels effortless on both desktop and phone—thumb-scrub loupe, always-visible back links, persistent prev/next card footer, `"Whole table"` reset, and one-tap `"Heat it ▶"`—with minor friction from cramped thermometer markers on phone and tiny resting phone tiles. |
| **Beauty** | **4.0 / 5** | The table, paper palette, typography, and cards are easily 4.5–5.0 craft, but the forge's molten orange Jell-O dome (`16`), cheap-looking 2D spoke spider (`13`–`15`), backwards thermometer heat gradient, and phone Heft column wall pull the slice below the 4.5+ bar. |
| **Smoothness** | **4.0 / 5** | Holding a 60 FPS median across every view (and 60.0 avg FPS on phone) under CPU SwiftShader plus real in-flight scale-dive frames (`12a`–`12b`) is impressive, though `fps.txt` only validates the `low` tier (without per-atom glows) and `18` desktop playback still shows a 50 ms p95 hitch. |
| **Delight** | **4.0 / 5** | The scale dive into iron, daylight-to-kiln darkening, interactive whole-table Heat map, and real 912 °C / 1,394 °C iron re-stacking are wonderful ideas, yet the climax stumbles visually right when iron melts (`16`) and when the 12-spoke starburst turns illegible (`15`). |

### Honest comparison with Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)

- **Better on feel overall? Yes—decisively on the table, cards, clarity, and usability; not yet decisively on the 3D specimen climax.**
- **Where this beats Sael clearly:** Calmness, editorial taste, readability, mobile usability, speed, and human warmth. Sael's dark bloom-heavy showroom looks flashy in a 28-second trailer, but has small 3D labels, no search, no reactive-nonmetal legend, generic cubic grids, and heavy frame times that struggle on phones. Here, the Porcelain & Ink table feels genuinely original, serene, fast, and respectful of an adult learner's intelligence.
- **Where Sael still has an edge:** Pure 3D wow-factor polish inside the specimen view. Right now, our forge's molten puddle (`16`) looks like an orange gummy pancake and the neighbour-spoke overlay (`13`–`15`) looks like a debug wireframe widget, whereas Sael's dusk PBR lighting keeps his 3D hero objects feeling lush and cinematic. Fixing the forge's molten visual, neighbour highlight, and thermometer stem collision will push Beauty and Delight past 4.5 and put this ahead of Sael on every dimension of feel.

---

## 3. Every Visible Problem

### A. Overlapping or Clipped Text / Layout Bugs
1. **Thermometer stem slices straight through `1,538 °C melts` (ALL forge shots: `12b`, `13`–`18`, desktop & phone):** The vertical leader line dropping from `1,394 °C re-stacks` cuts directly through the digits of `1,538 °C melts` (violating `STYLE.md §9`: *"staggered in up to three rows so labels never overlap"*). On phone (`13`, `14`, `16`), the stem also brushes the `"s"` of `912 °C re-stacks`, and at `1,600 °C` (`16-phone`) the slider thumb circle sits on top of the `1,538 °C` text.
2. **Ceramic hearth bottom corner clipped by the thermometer HUD (`13`–`18` desktop):** On every desktop forge shot, the front tip of the diamond-rotated hearth plate tucks behind the top edge of the thermometer card instead of sitting cleanly above it with margin.
3. **Desktop card bottom edge peeks over lanthanide tiles (`04`, `05` desktop):** The bottom edge of the floating right card cuts slightly across the top of `Ho`/`Er`/`Tm`/`Yb` peeking underneath (`04`). Minor, but a slightly gentler framing or card bottom margin would look cleaner.
4. **Zoomed-in top-right tile (`10-zoom-in-desktop`):** `14 Si` passes directly behind the `EN | VI` pill and search bar, and its specular glare nearly washes out the `14` under the scrim.

### B. Cheap-Looking 3D & Forge Visual Issues
5. **Molten iron looks like translucent orange Jell-O (`16-forge-1600C-molten-desktop` & `phone`):** This is the single weakest visual in the set. Instead of blindingly incandescent molten metal at 1,600 °C, it looks like a glossy orange gummy cushion with:
   - blurry vertical zebra stripes (stretched convection noise);
   - a sharp curved horizontal band across the front face (looks like a flat-top/side seam or glass refraction artifact);
   - two tiny white plastic specular pinpoints that read like wet vinyl or jelly candy rather than glowing liquid metal;
   - an abrupt **scale-continuity break**: solid (`13`–`15`) shows ~200 discrete atoms, liquid (`16`) suddenly deletes all atoms in favour of a smooth macroscopic pudding dome, and gas (`17`) brings discrete atoms back.
6. **Neighbour spokes look like a broken 3D gizmo / spider (`12b`, `13`, `14`, `15`, `18`):** Drawn with `depthTest: false` as flat 1 px black/white lines and tiny square dots dead-centre on the opaque crystal face, the overlay breaks 3D depth and reads like a UI cursor artifact. At 930 °C (`15`), the 12 white spokes and 12 white squares mash together into an unreadable white starburst blob—a visitor cannot actually count 12 neighbours or tell which spheres they attach to.
7. **Thermometer fill gradient runs backwards (`14`, `15`, `16`, `17`, `18`):** At 700 °C (`14`) and 1,600 °C (`16`), the *cold* left end of the filled track is bright pale whitish-peach while the *hot* right end near the thumb is darker orange-red. Visually, the cold end looks white-hot and 1,600 °C looks cooler.
8. **Gas particles show dark-rimmed polka dots and clump at the bottom (`17-forge-2950C-gas-desktop`):** The tiny crisp pale-grey sphere cores inside huge fuzzy orange additive halos create a slightly cheap "bubbles / frog eggs" look where the glow stacks near the bottom, and the atoms bunch heavily in the lower half of the vessel instead of filling the glass cube evenly as a gas.
9. **Solid glowing crystal lacks internal depth radiance (`14`, `15`, `18`):** The beads keep their 3D form nicely (good), but the whole cube glows almost uniformly from outer corners to core; subtle hotter crevices inside the lattice and slightly cooler outer edges would make it read as incandescent metal rather than red-painted spheres.

### C. Mobile Issues
10. **Severe column occlusion & invisible "predicted" stripes in Phone Heft view (`09-lens-heft-phone`):** Because the phone Heft camera was lowered and columns made taller, the towering front wall of Row 7 superheavies (`Rf`–`Rg`, all *predicted* values) and actinides (`Ac`–`Cf`) completely hides `La`–`Dy` and buries the actual densest measured elements (`Os`, `Ir`, `Pt`, `Au`—even though the caption right underneath highlights Gold at `19.3 kg`!). Worse, at phone resolution the diagonal `"predicted"` hatch on the tiny top faces of `Rf`–`Rg` is practically invisible, while their huge solid-coloured vertical sides dominate the screen and look like measured data.
11. **Portrait phone home/lens vertical dead space (`01-phone`, `08-phone`):** The 18-column table occupies a narrow horizontal band (~15% of viewport height) with large blank cream voids above and below, making resting tile symbols barely legible.
12. **Phone card lacks `"↗ across the table"` above the fold (`04`, `05` phone vs desktop):** On desktop, `1,538 °C` and `7.9 kg` offer immediate `"↗ across the table"` links; on phone they are tucked below the fold (acceptable per `STYLE.md §5`, though worth noting the asymmetry).

### D. Low Contrast, Wording & Jargon
13. **Disabled `"Room temperature"` link at 20 °C (`13` desktop & phone):** Very pale sage green on cream; looks slightly washed out rather than clearly inactive (minor).
14. **`"Heat it ▶"` label at 2,950 °C (`17` desktop):** When iron has already boiled near the right end of the slider, `"Heat it ▶"` is odd; `"Replay ▶"` or `"Heat from 20 °C"` would make more sense.
15. **Mild unexplained jargon in `"All numbers & sources"` (`06-card-gold-all-numbers-desktop`):**
    - `Group 11 · Period 6 · Block d` — `"Block d"` (and to a lesser extent Group/Period) has no plain-English cue for an adult who left chemistry decades ago.
    - `[Xe] 4f¹⁴ 5d¹⁰ 6s¹` — the peach callout explains the Aufbau exception well, but the base notation has no plain shell summary (e.g., `shells: 2, 8, 18, 32, 18, 1`).
16. **Minor label ambiguity on desktop table (`01`, `02`, `11-vi`):** `"Mineral metals"` (`Kim loại khoáng`) hovers next to the gap between `H` and `Be`, slightly inviting misassociation with Hydrogen.
17. **Desktop card values lack source-tap affordance above the fold (`04`, `05`, `07` desktop):** `Solid`, `1,538 °C`, `7.9 kg` carry very faint dotted underlines, but unlike phone (`"Tap a value to see where it comes from."`), desktop shows no hint until you scroll into `All numbers & sources`.

### E. Factual & Scientific Accuracy Check
- **No numerical factual errors found.** Spot-checked against primary sources:
  - Gold's `196.97 ± 0.01` matches the official IUPAC/CIAAW *abridged* standard atomic weight (full value `196.966570(4)`), `1,064 °C` mp, `2,856 °C` bp, `19.3 kg/L` density, `[Xe] 4f¹⁴ 5d¹⁰ 6s¹`.
  - Iron's `912 °C` (α-BCC → γ-FCC, 8 → 12 neighbours), `1,394 °C` (γ-FCC → δ-BCC), `1,538 °C` mp, `2,861 °C` bp, `7.9 kg/L` density, and Gold `2.4×` heft ratio are accurate.
  - Oxygen's `−183 °C` bp, `−219 °C` mp, `1.3 g/L` at 20 °C (`1.33 g/L`), Carbon's `3,642 °C` sublimation point, and the 1,000 °C Heat map phases (e.g., `Ag`/`Al`/`Ge`/`Eu`/`Yb` liquid, `Fe`/`Cu`/`Au`/`Nd` solid, `Na`/`Zn`/`As`/`Po` gas) all check out.
  - Vietnamese `Sắt` / `vàng` paired with `Manganese` / `Cobalt` in `11-vi-card-iron-phone` aligns with the GDPT-2018 convention documented in `STYLE.md §5`.
- **Minor visual-science inaccuracy:** Gas atoms in `17` cluster near the bottom of the vessel as if heavily settled by gravity rather than filling the volume uniformly, and the solid → smooth-liquid → atomic-gas switch breaks physical scale consistency.

### F. Performance / Smoothness Caveats (`fps.txt`)
- `fps.txt` only measures the `low` tier (where per-atom glows are disabled). Because screenshots were captured at `?q=med`, we do not yet have frame-time verification showing that per-atom glows stay at ≥55–60 FPS on a real mid-range phone or laptop.
- `18-forge-heat-it-playing-desktop` has a `50.0 ms` p95 frame time (`45.0` avg FPS) even on `low`, suggesting a periodic hitch during animated playback (likely caption/DOM reflow or transition-event work).

---

## 4. Ranked Fix List (Highest Impact on Feel First)

1. **Redesign the molten iron visual (`16`, desktop & phone) so it looks genuinely molten—not orange Jell-O.**
   - Remove the sharp mid-dome seam, plastic white pinpoints, translucent jelly shading, and vertical stripe noise.
   - Option A (atomic continuity, strongest scientifically): let the incandescent iron atoms slump into a dense, slowly swirling, cohesive glowing liquid pool of soft-blended incandescent spheres inside a luminous molten core halo, so Solid → Liquid → Gas stays at one consistent atomic scale.
   - Option B (refined molten pool): make it opaque, heavy, and incandescently bright (white-yellow hot core, rich golden-orange convective cells using isotropic 3D simplex/Worley noise rather than stretched vertical bands, dark-orange meniscus rim, warm Fresnel reflection, zero white plastic dot highlights).

2. **Replace the `depthTest: false` spider-spoke overlay (`12b`, `13`–`15`, `18`) with a true 3D unit-cell highlight.**
   - Delete the floating 2D hairline spokes and square dots.
   - Instead, showcase the 8-vs-12-neighbour unit cell on the **front-top corner** of the crystal (or subtly dim/fade non-member atoms around one exposed corner atom during the 20 °C and 912 °C moments) and connect the central atom to its 8 or 12 *visibly distinct, highlighted* neighbour spheres using subtle depth-tested 3D rods or warm glowing rim rings so a visitor can actually see and count the stack change without obscuring the crystal's centre.

3. **Fix the thermometer tick stem collision (`12b`, `13`–`18`, desktop & phone) and reverse the backwards fill gradient.**
   - **Collision fix:** Offset `1,538 °C melts` right-aligned or place it on row 1 *to the right* of its tick (or route the `1,394 °C` leader cleanly to the left of `1,538 °C`, e.g., left-align `1,394 °C re-stacks` on the top row with a short angled/shifted stem, and right-align `1,538 °C melts` on the lower row so no vertical line ever crosses text). On phone, enforce a minimum horizontal gap or abbreviate to `912 °C`, `1,394 °C`, `1,538 °C melts`, `2,861 °C boils` so neither stems nor the slider thumb collide with text.
   - **Fill gradient fix:** Flip the luminance ramp so cold (left bulb) starts deep muted ember/charcoal-red (`#5A2414` → `#B93E12`) and brightens continuously toward the hot right tip (orange → yellow-white `#FFF2C2`), matching the blackbody glow of the metal.
   - **Button polish:** Switch `"Heat it ▶"` to `"Replay ▶"` (or `"Heat again ▶"`) once the temperature is at/near the top of the bar (`17`).

4. **Fix phone Heft occlusion and make predicted columns unmistakable (`09-lens-heft-phone`).**
   - Restore the steeper desktop camera pitch (`φ ≈ 0.36`, or slightly steeper on portrait phones) and cap max column height on phone so `Os`, `Ir`, `Pt`, `Au`, and the lanthanides (`La`–`Dy`) remain clearly visible behind Row 7 and the actinides.
   - Apply subtle diagonal hatching (or lower opacity / muted ghosted glazing) to the **vertical side walls** of predicted columns (`Rf`–`Rg`), not just their tiny 15 px top faces, so speculative superheavy densities never visually masquerade as measured monoliths blocking Gold.

5. **Refine the gas phase (`17`) and forge stage framing (`13`–`18` desktop).**
   - In `17`, distribute the gas atoms uniformly across the full height of the glass vessel (remove downward settling bias) and replace the dark-rimmed grey dot + oversized billboard sprite with bright incandescent white-hot cores smoothly blending into a tighter, hotter yellow-orange aura.
   - Shift the desktop forge camera target down slightly (raising the crystal + hearth ~40–50 px on screen) so the front corner of the ceramic hearth clears the top border of the thermometer card with comfortable breathing room.
   - Add subtle inner-core thermal radiance to the glowing solid cube (`14`, `15`, `18`) so interior crevices glow slightly brighter than outer corners.

6. **Eliminate the remaining minor table/card friction (`01`, `06`, `10`).**
   - Nudge `"Mineral metals"` (`Kim loại khoáng`) slightly right/down so it sits unmistakably over column 2 (`Be–Mg`) rather than beside Hydrogen (`H`).
   - In `All numbers & sources` (`06`), add plain-language parentheticals for `Block d` (e.g., `Column 11 · Row 6 · d-block`) and a shell-count line under `[Xe] 4f¹⁴ 5d¹⁰ 6s¹` (`shells: 2, 8, 18, 32, 18, 1`).
   - Tighten the vertical framing on portrait phones (`01-phone`, `08-phone`) slightly—e.g., bring the prompt and legend a touch closer to the table and use a slightly steeper view angle to maximize readable tile face area.

7. **Profile the `50 ms` playback hitch (`18`) and benchmark `?q=med` on a real GPU/phone.**
   - Investigate the `50 ms` p95 spike in `18-forge-heat-it-playing-desktop` (avoid per-frame DOM layout thrashing on the thermometer readout/caption).
   - Record real-device Medium-tier FPS (with per-atom glows enabled) alongside the SwiftShader Low-tier numbers before sign-off.
