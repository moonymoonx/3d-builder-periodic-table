# First-Time-Visitor Review — Atom View ("Look inside the atom", Round A1, build `1b65eb0`)

Reviewed cold from all 27 desktop (`1440×900`) and phone (`390×844`) screenshots plus `fps.txt` in `/workspace/out/redesign/atom-merged/`, then checked against `STYLE.md`, `SPEC.md` §0 (*Feel*), `DESIGN-RULES.md`, `ref/VIDEO_NOTES.md`, and primary reference sources (NIST ASD, NUBASE2020, CIAAW, Angeli & Marinova, Smits et al.).

---

## 1. First 5 Seconds (Cold Reaction)

- **What I think this is:** A calm, museum-book interactive diagram of an iron atom on warm paper. Coming out of the dive into the beveled `26 Fe` tile (`atom-01a` → `atom-01b` → `atom-02`), it immediately feels like an illustrated science essay rather than a noisy dashboard.
- **What draws my eye:** First, the crisp white floating card on the right ("Inside iron", the ceramic `26 Fe` badge, and the bold black `+ proton Cobalt` pill). Second, the huge thin grey outer circle on the left with a tiny red-and-blue cloverleaf tucked into the center.
- **What I think I should do:** Tap `+ proton Cobalt` (strongest visual anchor), or click the three pills (`Whole atom`, `One cloud`, `Its light`). I do *not* immediately realize the atom on the left is a 3D object I can orbit or zoom—in `Whole atom`, the thin concentric circles read almost like a flat 2D SVG diagram.
- **What confuses me in the first 5 seconds:**
  1. **Why are the center dots red and blue?** `Whole atom` shows a bright red-and-blue cloverleaf in the middle of grey dust, with zero explanation on the card. As someone who left chemistry decades ago, my first instinct is "red = positive / protons, blue = negative / electrons"—which is completely wrong. You only learn that vermilion and cobalt are opposite signs of a wave if you happen to switch to `One cloud`.
  2. **Why is the exact same card lead repeated on every element and mode?** Four huge serif lines (*"Cloud shapes decide how atoms join; jumps between levels decide the colours an element glows."*) dominate the top of every card (`Iron`, `Cobalt`, `Chromium`, `Hydrogen`, `Carbon`, `Uranium`, `Oganesson`)—even in `One cloud`, where it crowds the actual orbital pickers off the bottom of the card.
  3. **Why does the nucleus magnification keep changing?** Iron says `drawn 850× bigger` on desktop, `1,800×` on English phone, `1.900 lần` on Vietnamese phone, `790×` in `One cloud 3d`, and `890×` in `Its light`. It is actually being mathematically honest to the rendered pixel scale, which is admirable, yet without context it feels oddly twitchy.
  4. **Missing shell numbers on phones:** On `atom-02-iron-phone.png`, the card says 4 shells `(2, 8, 14, 2)` while the rings only label `2 electrons` and `14` (both `8` and `2` vanish silently).

---

## 2. Scores (1–5, Strict) & Comparison with Ryan Sael

*Scale: 4 = genuinely good, 5 = exceptional. Target: ≥ 4.0 everywhere, ≥ 4.5 on Beauty and Delight.*

| Criterion | Score | Reason |
|---|---:|---|
| **Clarity** | **3.5** | Typography and hierarchy are calm and legible, but `Whole atom` never explains red/blue phase colours, repetitive 4-line boilerplate pushes key controls out of view, raw shorthand (`5f: 4 → 3, 6d: 0 → 1`, `medium and high quality`) leaks through, and two major factual defects (Oganesson's 1,000×-wrong half-life and Neon's missing orange-red lines) actively mislead. |
| **Ease** | **3.5** | The always-visible back pill and `− proton / + proton` stepper are effortless, yet severe bottom clipping with no scroll cue (`One cloud` desktop & phone, VI Sodium `Its light` phone), mid-glyph scroll slicing under sticky headers (`About this atom`), and zero 3D orbit cue create friction. |
| **Beauty** | **4.0** | The Porcelain & Ink palette and frosted-glass `One cloud` orbitals (`3d xz`, `2p z`) look like a living science engraving, held back from 4.5+ by the faceted low-poly inner `4s` shell, intersecting `2p`/`3d` lobe waists, flat 2D-looking `Whole atom` rings, and callout/ring collisions. |
| **Smoothness** | **4.0** | `fps.txt` holds a 59.9 FPS median everywhere and 60.0 FPS average (16.8 ms p95) on phones even under CPU SwiftShader (`low` tier) with a clean tile-to-atom dive, though desktop `Its light` dips to 43–44 avg FPS and neither animated transitions nor `medium`/`high` glaze tiers were profiled. |
| **Delight** | **3.5** | Stepping `+ proton` to watch Chromium pull a `4s` electron into `3d` and opening `One cloud` spark real calm wonder, but `Its light` under-delivers with a flat sparkle halo and a Neon spectrum that omits Neon's iconic orange-red glow right beneath prose promising orange-red. |

### Honest Comparison with Ryan Sael (`sael.net/periodic-table`, `ref/VIDEO_NOTES.md`)

- **Where this build clearly beats Sael:** Visual taste and legibility (warm porcelain/ink daylight beats Sael's bloom-heavy dark showroom), true quantum orbitals in `One cloud` (actual $\psi(n,l,m)$ lobes, phases, radial-node cutaways, and translucent 90% glaze vs Sael's hinted point clouds), phone usability and frame rate (60 FPS on phones even in software rendering vs Sael's heavy desktop-bound scene), and epistemic honesty (cited numbers, italicised predictions for Oganesson, honest empty-case card).
- **Where Sael still ties or beats this build on Atom feel:** Sael's default atom view immediately gives a stronger sense of 3D volume and physical scale (a visible `100 pm` scale bar right on the stage) and uses a punchy, element-specific one-liner (*"last one goes into 6d; d orbitals are four-leaf clovers"*) instead of a 4-line generic paragraph. And Sael's spectrum/glow view actually matches what visitors expect an element's glow to look like, whereas this build's Neon spectrum drops the 585–650 nm lines altogether.
- **Verdict:** **Better on craft, calm, quantum depth, and mobile smoothness, but not yet cleanly better on overall Atom feel** until the clipping bugs, Neon spectrum defect, `Whole atom` phase-colour mystery, and boilerplate bloat are fixed.

---

## 3. Every Visible Problem

### A. Factual & Scientific Accuracy Audit

Every visible number and claim was checked against primary sources. Most numbers check out cleanly—including Iron's melting/boiling/allotrope temperatures (`912`, `1,394`, `1,538`, `2,861 °C`), BCC 8-neighbour coordination, Gold's CIAAW abridged atomic weight (`196.97 ± 0.01`, https://ciaaw.org/abridged-atomic-weights.htm), Gold's boiling point (`2,856 °C / 3,129 K`), Gold's Clementi–Raimondi $Z_{\text{eff}}$ (`10.9` for `6s`), Gold's hydrogen-like `6s` 90% reach (`357.5 pm` → `about 360 pm`), Oganesson's predicted melting point (`≈ 52 °C` / `325 K`, solid at `20 °C`, Smits et al. 2020, https://doi.org/10.1002/anie.202011976), all displayed electron configurations and shell counts (`H`, `C`, `Cr`, `Fe`, `Co`, `Au`, `U`, `Og`), Uranium's f-orbital lobe counts ("six of the seven f clouds have six or eight lobes"), and Iron's `4s` radial node count (`3`).

However, **two serious factual errors** and **three subtle scientific/copy inaccuracies** appear directly in the screenshots:

1. **CRITICAL (1,000× error) — Oganesson half-life (`s12-oganesson-never-desktop.png`):** The card states **"Half its atoms decay in `680 milliseconds`"**. The evaluated half-life of $^{294}\text{Og}$ in **NUBASE2020** (Kondev et al. 2021, *Chinese Physics C* 45, 030001, https://doi.org/10.1088/1674-1137/abddae; IAEA Live Chart of Nuclides, https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html) is **`0.7(3) ms`** (and Oganessian et al.'s discovery value is **`0.69 ms`** ≈ `690 microseconds`), **not `680 milliseconds`** (`0.68 s`). This is off by a factor of 1,000—almost certainly a unit-conversion bug (`0.68 ms` rendered as `680 ms`, or stored in seconds as `0.68`).
2. **CRITICAL (misleading data) — Neon's "8 strongest visible lines" miss Neon's entire orange-red spectrum (`atom-08-light-neon-line-desktop.png`):** Right underneath prose stating **"neon glows orange-red"**, Neon's spectrum bar displays **one bright green line (~540 nm)** and **five far-red / near-infrared lines clustered between 693–749 nm**, with a **total black void from 545 nm to 690 nm**. It completely omits Neon's iconic bright optical lines at **585.25 nm** (yellow, $A_{ki} = 6.82 \times 10^7\text{ s}^{-1}$), **614.31 nm** (orange), **640.22 nm** (bright orange-red, $A_{ki} = 5.14 \times 10^7\text{ s}^{-1}$, the signature neon-sign peak), and **650.65 nm** (red-orange) (NIST ASD / NIST Handbook Strong Lines of Neon: https://physics.nist.gov/PhysRefData/Handbook/Tables/neontable2.htm and https://physics.nist.gov/asd). Furthermore, selecting **`748.9 nm: red light`** (`brightness 320 of 1,000`) exaggerates a near-infrared boundary line where human photopic sensitivity $V(749\text{ nm}) < 0.0002$. This happens when sorting raw heterogeneous NIST `Rel. Int.` values (whose scales differ across source papers for Ne I) without using persistent/transition-probability data or photopic weighting.
   - *Related spectrum selection quirk (`atom-14-vi-light-sodium-phone.png`, `atom-07-light-iron-desktop.png`):* Sodium correctly spotlights the `589.0 nm` D-doublet, yet shows a prominent cyan-green line (~515 nm) and violet lines (~390–430 nm) while omitting its much more familiar `568.8 nm` yellow-green doublet (NIST ASD, https://physics.nist.gov/asd). Iron (`atom-07`) cites `"8 strongest visible lines"` led by `387.9 nm` (Fe I `387.857 nm` is real and strong, right at the UV/violet edge), but because several lines stack tightly in `382–388 nm`, only ~4 distinct bars are visibly discernible on the strip.
3. **Glaze lobes visibly overlap at nodal planes (`atom-11-carbon-one-cloud-desktop.png`, `atom-05-one-cloud-3d-desktop.png`):** In Carbon `2p z` (`atom-11`), the blue lower egg visibly protrudes upward *into* the vermilion upper egg around the nucleus, forming an overlapping purple-brown lens right through the nodal plane. The same waist overlap appears between adjacent lobes in Iron `3d xz` (`atom-05`). This directly contradicts the card copy next to it: *"where they meet, it is never found."*
4. **Gold nuclear radius labelled `(estimate)` (`atom-09-about-gold-desktop.png`):** Says `about 5.5 fm (estimate)`. While `5.5 fm` is close to the real value, $^{197}\text{Au}$'s nuclear RMS charge radius is actually experimentally *measured* at **`5.437 fm`** (Angeli & Marinova 2013, *ADNDT* 99, 69–95, https://doi.org/10.1016/j.adt.2011.12.006), not merely estimated. (If the app uses an $A^{1/3}$ formula globally, wording it `"about 5.5 fm (from nucleus mass)"` or citing Angeli–Marinova avoids calling a well-measured constant an estimate.)
5. **Iron/Gold density ratio rounding (`04-card-iron-desktop.png`):** Says `"with gold: a litre of gold weighs 2.4× more"`. Using standard PubChem/CRC densities (`19.30 / 7.874 = 2.451`), that rounds to **`2.5×`** (it only rounds to `2.4×` if using `19.282 / 7.874 = 2.4488` or the already-rounded `19.3 / 7.9 = 2.443`). Minor, worth checking against the embedded `density` values.

### B. Clipping, Overlaps & Layout Bugs

1. **Card clips `Its 5 clouds` picker on desktop (`atom-05-one-cloud-3d-desktop.png`):** At the bottom of the Iron `One cloud` card, the label `Its 5 [clouds]` is cut off vertically (only `Its 5` survives), and the active `xz` pill fades/clips directly into the sticky footer bar.
2. **Phone bottom sheet hides active subshell & orientation controls (`atom-05-one-cloud-3d-phone.png`):** On `390×844`, `Shell 3` (including the selected `3d⁶` chip!), `Shell 4`, and the `Its 5 clouds` row are completely hidden behind the sticky `- proton / + proton` footer—only ~6 px of the tops of three pills peek out, with no fade-out gradient or scroll hint.
3. **VI Sodium `Its light` phone clips the entire selected line readout (`atom-14-vi-light-sodium-phone.png`):** The selected line (`589.0 nm: ánh sáng vàng...`) is ~95% buried behind the sticky bottom footer—only a 4 px orange sliver and the top tips of `589.0` are visible.
4. **Ghosted bleed-through text in phone compact header (`atom-14-vi-light-sodium-phone.png`):** Directly below `Bên trong nguyên tử natri`, faint ghosted text (`11 proton · 11 electron` or scrolled content) is visible bleeding through the dark header bar.
5. **Scrolled `About this atom` slices top row mid-glyph (`atom-09-about-gold-desktop.png`):** The compact sticky header (`Au Inside gold`) slices horizontally straight through the letters of `In the nucleus | 79 protons, 118 neutrons`, violating `STYLE.md §5` (*"so rows never run beneath it"*). Same abrupt hard clip at the top of `atom-09-about-gold-phone.png` (`millimetre.`).
6. **Vietnamese mode pills wrap awkwardly on desktop (`atom-13-vi-iron-desktop.png`):** `Cả nguyên tử`, `Một đám mây`, and `Ánh sáng` wrap onto two lines with `Ánh sáng` orphaned alone on line 2, while on phone (`atom-13-vi-iron-phone.png`) the taller Vietnamese intro pushes `Về nguyên tử này` completely below the fold.
7. **3D callout labels collide with shell rings and viewport edges:**
   - `atom-12-uranium-desktop.png`: `nucleus / drawn 2,500× bigger` sits directly over the 6th shell ring (the line slices through `2,500×`), and `21` sits right on top of dense red stipples.
   - `atom-02-iron-phone.png` & `atom-10-hydrogen-phone.png`: `2 electrons` and `1 electron` collide with the outer shell circle.
   - `atom-04-chromium-surprise-phone.png`: Both `the newest electron` (left) and `drawn 2,100× bigger` (right) cross over the outer shell ring.
   - `atom-14-vi-light-sodium-phone.png`: `vẽ to gấp 3.400 lần` sits within ~6 px of the right viewport edge (violating `STYLE.md §5`'s 14 px edge margin).
8. **Spectrum bar focus ring & edge clipping (`atom-08-light-neon-line-desktop.png`):** The entire spectrum strip displays a bright orange focus outline (presumably lingering from keyboard selection), and the white highlight rectangle around `748.9 nm` collides with the rounded right border of the bar.

### C. Contrast, Jargon & Copy Consistency

1. **Low contrast of callout captions over clouds (`atom-05-one-cloud-3d-phone.png`, `atom-10-hydrogen-phone.png`):** `drawn 790× bigger` (`--ink-2`) sits directly over the blue stippled glaze lobe on phone, and `its only electron` sits over the dense orange stipples on Hydrogen phone—noticeably harder to read than on clean paper.
2. **Unexplained jargon & developer leaks:**
   - `atom-12-uranium-desktop.png`: `(5f: 4 → 3, 6d: 0 → 1)` has no plain-English phrase (violating `STYLE.md §4` & `§10`).
   - `atom-09-about-gold-desktop.png` & phone: `"(medium and high quality)"` leaks graphics-tier jargon into science copy—a visitor has no idea what quality tier they are on or why physics depends on it.
   - `atom-05-one-cloud-3d-desktop.png`: `xy`, `yz`, `z²`, `xz`, `x²−y²` and `cloverleaf · xz` appear with no human gloss for what those axes mean.
   - `atom-11-carbon-one-cloud-desktop.png`: `2p` orientation chips are ordered `y`, `z`, `x`, `all 3` (quantum-number `m = −1, 0, +1` order) rather than intuitive `x`, `y`, `z`, `all 3`.
   - `atom-07-light-iron-desktop.png`: `"brightness 1,000 of 1,000 (compared with its brightest line)"` is self-referential and awkward when the brightest line itself is selected.
3. **Generic lead copy wastes prime vertical space:**
   - Every `Whole atom` and `One cloud` card repeats the exact same 4-line 20 px serif block (*"Cloud shapes decide how atoms join; jumps between levels decide the colours an element glows."*).
   - Every `Its light` card (even Iron!) repeats *"Heat or electricity makes every element glow its own colours: neon glows orange-red, sodium glows yellow (its 589 nm lines)."*
4. **Inconsistent atomic-number badge in compact header (`atom-05-one-cloud-3d-phone.png`, `atom-09-about-gold-desktop.png`, `atom-14-vi-light-sodium-phone.png`):** When scrolled or compact, the mini tile drops its atomic number (`Fe` instead of `26 Fe`, `Au` instead of `79 Au`), unlike `06-card-gold-all-numbers-desktop.png` which puts `79` cleanly beside `Gold`.

### D. 3D Visual Craft & Mobile Issues

1. **Faceted low-poly inner shell in `4s` cutaway (`atom-06-one-cloud-4s-desktop.png`):** While the outer `4s` blue sphere is smooth, the innermost nested orange/blue isosurface boundary is visibly coarse and polygonal (~10–12 flat segments), looking cheap right in the center of the hero visual.
2. **`Whole atom` feels flat and overly sparse on heavy elements (`atom-02`, `03`, `04`, `09`, `12`, `15`):** Because outer shells (`4s`, `6s`, `7s`) are 4–6× wider than the inner `d`/`f` shells, the interesting colorful cloud collapses into a tiny central smudge inside an enormous, faint, 1 px grey circle. On Oganesson (`atom-15`), the `7p` cloud is so dilute it barely reads as a dumbbell. There is also no scale bar (e.g., `100 pm`) and no subtle cue that you can drag to orbit in 3D.
3. **`Its light` 3D stage looks like a flat sparkle mist (`atom-07`, `atom-08`, `atom-14`):** Compared to the Forge's glowing 3D crystal, `Its light` turns the atom into a static circular haze of monochrome dots. There is no visual connection to electron shells/levels jumping—just a colored dust cloud.
4. **Phone `Whole atom` drops intermediate shell counts silently (`atom-02-iron-phone.png`, `atom-04-chromium-surprise-phone.png`, `atom-09-about-gold-phone.png`):** Inner ring numbers (`8`, `32`) disappear on phone without explanation, so the rings no longer match the `(2, 8, 14, 2)` text in the sheet.

---

## 4. Ranked Fix List (Most Impact on Feel First)

1. **Fix the two factual errors immediately (Oganesson half-life & Neon emission spectrum).**
   - In the element data / formatter for `Z = 118` (`s12-oganesson-never-desktop.png`), fix $^{294}\text{Og}$'s half-life from `680 milliseconds` to **`0.7 milliseconds`** (or `0.69 ms` / `690 microseconds`, citing NUBASE2020 `0.7(3) ms`). Audit all other sub-second half-lives for the same 1,000× unit-conversion bug!
   - In the NIST emission-line selector (`Its light`), stop taking raw top-8 by heterogeneous NIST `Rel. Int.` alone. Filter/rank using NIST persistent/strong optical lines (`380–700 nm`, or `380–750 nm` weighted by CIE photopic luminous efficiency $V(\lambda)$ and/or transition probability $A_{ki}$), so **Neon** prominently shows `585.2 nm`, `614.3 nm`, `640.2 nm`, `650.7 nm` (matching its actual orange-red glow!) and **Sodium** includes `568.8 nm` alongside the `589.0/589.6 nm` D-doublet. Also audit H, He, Ne, Ar, Kr, Na, Hg, Fe against real discharge spectra.
2. **Eliminate card/sheet clipping and reclaim vertical space by cutting the 4-line boilerplate.**
   - Remove or collapse the repeated 4-line generic serif essay from `One cloud` and `Its light` (and shorten `Whole atom`'s lead to 1–2 concise, **element-specific** lines, moving the general explanation behind a quiet info/source popover or into `About this atom`).
   - Add a proper bottom fade mask (`STYLE.md §5`) + subtle scroll indicator whenever the card or phone sheet overflows, and ensure the active controls (`Shell 1–4`, `Its 5 clouds`, and the selected spectral line readout in EN & VI) sit **fully above the sticky footer** on both `1440×900` and `390×844` without requiring a scroll.
   - Fix the sticky compact header so scrolled rows never slice mid-glyph (`atom-09-about-gold-desktop.png`: add clean opaque `--card` background + top scroll padding) and fix the ghosted text bleed-through in the dark mobile sheet header (`atom-14-vi-light-sodium-phone.png`).
   - Prevent the Vietnamese mode pills (`Cả nguyên tử`, `Một đám mây`, `Ánh sáng`) from wrapping onto two rows on the 392 px desktop card (tighten pill horizontal padding or use concise labels so all 3 stay on one row).
3. **Explain the red/blue phase colours in `Whole atom` and strip remaining jargon.**
   - Add a 1-line inline key in `Whole atom` using coloured ink words (per `STYLE.md §2`, Ciechanowski style)—e.g., *"The newest cloud's two wave signs are drawn in **vermilion** and **cobalt**."*—so first-time visitors never mistake them for protons/electrons.
   - Replace `(5f: 4 → 3, 6d: 0 → 1)` on Uranium with a human phrase first (*"one electron stays in 6d instead of moving to 5f"*), followed by the notation only as a caption or inside `About this atom`.
   - Remove `"(medium and high quality)"` from `About this atom` copy (conditionally show the glaze sentence only when the glaze is actually rendered, without exposing internal tier names).
   - Reorder `2p` orientation pills to `x`, `y`, `z`, `all 3`, add a short plain-English caption above the orientation row (*"Same shape, different tilt"*), and replace `"brightness 1,000 of 1,000 (compared with its brightest line)"` with `"its brightest visible line"` (and `"32% as bright as its strongest line"` for secondary lines).
4. **Polish `One cloud` 3D geometry (nodal pinch + `4s` inner-shell resolution).**
   - Fix the intersecting waist overlap in `2p` and `3d` glazed isosurfaces (`atom-11`, `atom-05`)—either evaluate the signed wavefunction on a finer grid near the origin, clip each phase mesh strictly to its own sign ($\psi > +\varepsilon$ vs $\psi < -\varepsilon$), or use analytical/polar radial-harmonic meshes (`r(θ,φ)`) so lobes pinch cleanly to zero at the nodal plane just as the text promises.
   - Increase radial/angular mesh resolution on the inner nested shells of `4s` (`atom-06-one-cloud-4s-desktop.png`)—an analytical spherical shell (exact sphere geometry at each radial isosurface radius!) eliminates the faceted marching-cubes polygon completely and is faster too.
5. **Fix 3D callout placement, padding, and contrast across desktop and phone.**
   - Anchor callout leader targets outside the outer shell ring (or with a soft `--paper` halo behind text) so `nucleus / drawn X× bigger`, `the newest electron`, and `2 electrons` never cross shell circles, clip inside the 14 px viewport margin (`atom-14`), or lose contrast over dense stipples (`atom-05-phone`, `atom-10-phone`, `atom-12`).
   - Add a quiet `100 pm` scale bar to `Whole atom` (matching Sael's best spatial cue) and a subtle one-time *"Drag to turn"* micro-hint that fades on first drag so visitors discover the 3D depth immediately.
6. **Elevate `Its light` visual delight and profile transitions + `medium`/`high` FPS.**
   - In `Its light`, keep faint shell rings (or subtle orbital glow contours) visible in the dark room and animate a quiet pulse/ripple from outer to inner shell when a spectral line is picked, tying *"jumps between levels"* visually to the emitted colour; also tighten the rightmost highlight marker so it stays cleanly inside the rounded spectrum bar and suppress the persistent focus border on mouse/tap selection (`:focus-visible` only).
   - Add `Its light` particle-budget tuning on desktop (currently 43–44 avg FPS vs 48–55 control in SwiftShader) and add `medium`/`high` tier + dive-transition measurements to `fps.txt` to verify smooth 60 FPS when the translucent orbital glazes are active.
