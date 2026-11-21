# First-Time-Visitor Review — Inside the Atom (Round A2, merged build `b24ab3d`)

Reviewed across all 31 screenshots in `/workspace/out/redesign/atom-r2-merged` (desktop `1440×900` and phone `390×844`, EN + VI), plus `/workspace/out/redesign/atom-r2/fps.txt`, checked afterward against `STYLE.md`, the Feel section of `SPEC.md`, `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`.

---

## 1. First 5 seconds

- **What I think this is:** Stepping out of the warm ceramic periodic table (`04-card-iron-desktop.png`) through the tile dive (`atom-01a`, `atom-01b`) into `atom-02-iron-desktop.png`, I immediately recognize an editorial, museum-grade look inside an iron atom: an illustrated scientific plate on warm ivory paper, with a tidy right-hand guide card ("Inside iron · 26 protons · 26 electrons") and a bottom-left scale bar (`100 pm`).
- **What draws my eye first:** On the left, the large crisp outer ring and the delicate vermilion stipple cloud huddled around the dark nucleus; on the right, the bold serif title **"Inside iron"** and the heavy black **`+ proton (Cobalt)`** pill at the bottom of the card. (Once I tap **One cloud** or **Its light**, the glazed lobes with translucent paper nodal planes and the darkroom spectral glow completely steal the show.)
- **What I think I should do:** The black **`+ proton`** button and the **`Whole atom / One cloud / Its light`** pills invite tapping first. The quiet top-left hint (`Drag to turn the atom · scroll or pinch to zoom`) tells me the diagram is rotatable 3D.
- **What immediately feels confusing or flat:**
  1. **Whole atom looks 2D and oddly empty at first glance.** Because the outer shell is a sharp flat circle filled with faint sparse dust, Iron (`atom-02`), Cobalt (`atom-03`), Chromium (`atom-04`), Gold (`atom-09`), and Uranium (`atom-12`) all read at first glance like almost the same big empty ring with a tiny red smudge in the center. Clicking `+ proton` from Iron to Cobalt barely changes what I see (`14` ticks to `15`).
  2. **Unexplained dotted underlines and inline `Source` pill.** Words like `(2, 8, 14, 2)`, `3d`, `6`, and `2,542` carry dotted underlines with no hint that they are tappable (unlike the element card's *"Tap a value to see where it comes from."*), while the poetic thesis sentence ends with an awkward orphan wrap and inline button (`join. [Source]`).
  3. **Two exit buttons (`← Iron` and `×`).** Top-left has `← Iron` and the card's top-right has `×`; it is unclear whether `×` dismisses just the card or exits the atom view altogether.
  4. **Hidden interactivity in `Its light`.** The bottom spectroscope bar has bright glowing lines, and `atom-08b` reveals that tapping a line triggers an expanding colour ripple—yet nothing in `atom-07`, `08`, `16`, or `17` tells a visitor those lines are clickable, and the top-left orbit hint vanishes completely.

---

## 2. Scores (1–5, strict) & comparison with Ryan Sael

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **3.5** | The porcelain-book hierarchy and plain-English `About this atom` rows are strong, but raw `3d`/`4s`/`5f`/`6d` and polynomial `y(3x²−y²)` labels, `"of 2,542 NIST lists"`, unannounced dotted underlines, Iron's blue glow vs. green spectrum bar, and Neon's `"orange light"` next to a red swatch create avoidable friction. |
| **Ease** | **3.5** | Primary mode pills and the `−/+ proton` stepper are roomy and predictable, but mobile sheets push all explanatory copy below the fold in `One cloud` and `Its light`, Uranium's `One cloud` overflows off-screen even on desktop, two exit controls compete, and spectrum lines lack a tap cue. |
| **Beauty** | **4.0** | `One cloud` (glazed vermilion/cobalt lobes with stippled clouds and vellum nodal sheets, easily 4.5–5.0 on its own) and `Its light` are genuinely museum-grade, held back from 4.5+ by the flat/empty default `Whole atom` look, mobile leader lines slicing across label text, and the loud coral-orange `+ proton` button clashing with the quiet darkroom. |
| **Smoothness** | **4.0** | The tile-to-shells dive and a 60 FPS median across all 29 states and live animations on CPU-only SwiftShader (`atom-r2/fps.txt`) show disciplined engineering, short of 4.5 due to 33–67 ms desktop CPU p95 spikes, no post-merge `b24ab3d` re-measurement or real-GPU numbers, and clipped scroll transitions inside cards. |
| **Delight** | **4.0** | Revealing the `3d` cloverleaf, nested `4s` glass shells, `5f` eight-lobe crystal, and Neon's light ripple delivers real wonder, but landing first on a sparse `Whole atom` where `Fe → Co` barely budges and Chromium's surprise isn't visually dramatized softens the opening payoff. |

### Honest comparison with Ryan Sael (`sael.net/periodic-table`, per `ref/VIDEO_NOTES.md`)

**Is this better on feel?** **Overall yes—decisively so in taste, calm, performance, and orbital truth—but not yet on first-second drama in the default `Whole atom` state.**

- **Where this build clearly beats Sael:**
  - *Calm & visual craft:* Warm paper + stipple engravings + selective darkroom (`Its light`) feel timeless and effortless to read compared to Sael's heavy, bloom-drenched dark showroom.
  - *Real quantum shapes (`One cloud`):* True $\psi(n,l,m)$ phase-coloured clouds, 90% translucent glazes, and translucent nodal planes (including radial nodes in `4s` and `5f`) are in a different league from Sael's hinted clouds inside spherical shells.
  - *Performance & reach:* 60 FPS median even on CPU SwiftShader, clean Vietnamese support, and a full mobile layout versus Sael's heavy, slow desktop-centric scene.
- **Where Sael still edges ahead:**
  - *Default whole-atom punch:* Sael's glowing, layered 3D shells read instantly as a rich 3D volume the moment you arrive, and clicking "+ proton" feels viscerally alive. Here, `Whole atom` (the first thing you see) feels noticeably flatter and emptier than `One cloud`, so the wow is hidden one tap deep.

---

## 3. Every visible problem

### A. Overlapping, clipped, or crowded text & UI
1. **Leader lines cut straight through label text (phone):**
   - `atom-17-light-hydrogen-phone.png`: the thin white leader line from the nucleus slices directly across the `s` of **`nucleus`**.
   - `atom-14-vi-light-sodium-phone.png`: the leader line cuts straight across the `n` of **`hạt nhân`**.
2. **Callouts violate `STYLE.md` §5's 14 px edge margin and cover the 3D subject (phone):**
   - `atom-14-vi-light-sodium-phone.png`, `atom-17-light-hydrogen-phone.png`, `atom-10-hydrogen-phone.png`: the `nucleus` / `hạt nhân` callout pill sits nearly flush with the left screen edge (~8–10 px) and overlaps the outer ring.
   - `atom-02-iron-phone.png`, `atom-04-chromium-surprise-phone.png`, `atom-13-vi-iron-phone.png`: `2 electrons` / `1 electron` crowds the right viewport edge; `3d cloud` and `nucleus / drawn 2,000× bigger` overlap the outer ring.
   - `atom-05-one-cloud-3d-phone.png`: `nucleus / drawn 1,000× bigger` sits on top of the lower-left vermilion lobe; `3d cloud / cloverleaf · xz` covers the upper-right lobe.
3. **Explanatory prose pushed completely below the fold or faded mid-line:**
   - `atom-05-one-cloud-3d-desktop.png`: `"The glaze wraps where it is found 90 % of the time."` is half-erased by the bottom fade gradient, and `"About this atom"` is hidden without a visible scroll indicator.
   - `atom-12b-uranium-5f-cloud-desktop.png`: 7 shell rows + 2 rows of f-cloud chips consume the entire card body; **zero** explanation of the `5f` cloud, colour signs, or nodal sheets is visible without scrolling.
   - `atom-05-one-cloud-3d-phone.png`: **all** explanatory prose for the orbital is pushed completely off-screen, and the `Shell 1..4` labels disappear so the 7 subshell pills collapse into an unlabeled wrapping list with `4s²` orphaned on row 2.
   - `atom-07-light-iron-phone.png`, `atom-14-vi-light-sodium-phone.png`, `atom-17-light-hydrogen-phone.png`: the paragraph explaining how emission lines work (`"Each line is light given off..."`) and `"About this atom"` are pushed below the fold.
4. **Scrolled text peeks dimly under sticky card headers:**
   - `atom-09-about-gold-desktop.png`: the clipped tail of a prior line (`4f¹⁴ 5d¹⁰ 6s¹.`) peeks out directly below the `Au Inside gold` sticky header (same clipped-letter peek at the top of `06-card-gold-all-numbers-desktop.png`), and `atom-09b-about-gold-midscroll-desktop.png` clips mid-sentence at the bottom.
5. **Spectrum bar colour labels nearly collide on phone:**
   - `atom-07-light-iron-phone.png`, `atom-17-light-hydrogen-phone.png`: `green` and `yellow` almost touch (`green yellow`) while `violet`, `blue`, and `red` sit far apart.
6. **Spectrum ripple clips against viewport top and dives behind spectrum bar:**
   - `atom-08b-light-neon-ripple-desktop.png`: the expanding red emission ring runs off the top of the frame and passes behind the bottom spectroscope strip.
7. **Mini tile badge numbers crowd symbols on phone & 3-digit Z:**
   - `atom-14-vi-light-sodium-phone.png` (`11` nearly touches `N` of `Na`), `atom-02-iron-phone.png` (`26`/`Fe`), `atom-04-chromium-surprise-phone.png` (`24`/`Cr`), and `atom-15-oganesson-desktop.png` (`118`/`Og`).

### B. Contrast, colour, and style-card violations (`STYLE.md`)
8. **Token role violation in `Its light` (`atom-07`, `08`, `14`, `16`, `17`):**
   - Both the active **`Its light`** mode pill and the **`+ proton`** primary button use bright coral-orange (`#F0874F`), which `STYLE.md` §3 & §9 reserve exclusively for **heat UI** (`--ember` / thermometer / temperature readout). Using it for two unrelated controls in an emission-spectrum view creates visual competition and violates the calm darkroom aesthetic (and leaves the active tab pill sharing a colour with the primary CTA, unlike daylight mode where active tab = verdigris and `+ proton` = ink).
9. **Inconsistent disabled states on `−/+ proton`:**
   - On Hydrogen (`atom-10-hydrogen-desktop.png`), disabled `− proton` is a faint light-outlined ghost pill; on Oganesson (`atom-15-oganesson-desktop.png`), disabled `+ proton` is a heavy solid medium-grey pill that looks much louder than a disabled control.
10. **Orphaned inline `Source` pill:**
    - On almost every desktop and phone shot (`atom-02` through `atom-17`), the thesis sentence wraps a single word onto the last line just to carry the bordered `Source` pill (`join. [Source]`, `of. [Source]`, `nhau. [Source]`), adding chrome noise to the poetic hook.

### C. Jargon without a human phrase & copy inconsistencies
11. **Unexplained orbital & polynomial jargon (`STYLE.md` §4 & `DESIGN-RULES.md`):**
    - `atom-04-chromium-surprise-desktop.png`: `"one more moved there from 4s"` (`4s` isn't even dotted-underlined, and neither `3d` nor `4s` is paired with a plain-English phrase like "outer shell").
    - `atom-12-uranium-desktop.png`: `"one electron sits in 6d instead of 5f."` (no plain phrase).
    - `atom-05`, `atom-11`, `atom-12b`: `One cloud` presents raw `1s² / 2p⁶ / 3d⁶ / 5f³` buttons and polynomial chips (`x²−y²`, `z²`, `y(3x²−y²)`, `x(x²−3y²)`, `z(x²−y²)`). The caption `"Each is named by the axes its lobes lie along."` does not explain `y(3x²−y²)` or `x²−y²` to a non-chemist.
12. **Unexplained acronym and awkward phrasing in `Its light`:**
    - `"Its 8 brightest lines to the eye (of 2,542 NIST lists)"` (`atom-07`, `08`, `16`, `17`): `NIST` is unexplained acronym jargon, and `"of 2,542 NIST lists"` parses awkwardly as a noun phrase ("2,542 lists") rather than a verb clause. (Ironically, the Vietnamese version `"trong 141 vạch NIST liệt kê"` reads much more naturally.)
13. **Inconsistent typography & wording details:**
    - Space before `%` everywhere (`90 %`, `60 %`, `95 %`, `100 %`) reads slightly unnatural in English prose compared to `90%`.
    - Two different definitions of `picometre` on the exact same screen (`atom-09-about-gold-desktop.png`): bottom-left says `"a picometre is a trillionth of a metre"`, while the right card says `"A picometre is a billionth of a millimetre."`
    - Missing dotted-underline affordance hint: the card uses dotted underlines on selective numbers/terms (`(2, 8, 14, 2)`, `3d`, `6`, `2,542`, `about 360 pm`), yet omits the `"Tap a value to see where it comes from."` cue present on the element card (`04-card-iron-desktop.png`).
    - Vietnamese naming jump (`atom-13-vi-iron`, `atom-14-vi-light-sodium`): `Sắt` and `Natri` appear in the title/footer center without their international GDPT-2018 names beside them (`SPEC.md` §3 specifies *"GDPT-2018 textbook form + traditional name where different (sodium · natri)"*), directly beside English/IUPAC `Manganese`, `Cobalt`, and `Magnesium` on the proton buttons.

### D. 3D quality & visual fidelity issues
14. **`Whole atom` reads flat and visually monotonous:**
    - In `atom-02`, `03`, `04`, `09`, `12`, `15`, the outer shell is a stark 2D wireframe ring enclosing very faint grey dots; there is almost no volumetric shading or depth cue to signal 3D before dragging. Stepping Iron → Cobalt (`atom-02` → `atom-03`) produces almost no visible change.
15. **Faceted nodal plane & alpha-sorting seam on `5f` (`atom-12b-uranium-5f-cloud-desktop.png`):**
    - The curved outer edges of the translucent nodal planes show visible polygonal faceting and a small notch/clipping artifact at bottom-center where the vertical plane meets the lower vermilion lobe; the inner radial-node lobe creates a slightly muddy transparency seam inside the front cobalt lobe.
16. **Microscopic nucleus despite enlargement label (`atom-05`, `atom-12b`):**
    - In `atom-05-one-cloud-3d-desktop.png` and `atom-12b-uranium-5f-cloud-desktop.png`, the nucleus at `500×` is ~3–4 px wide—barely a dust speck—so the prominent leader line points at almost nothing.
17. **Subtle tile banding up close during dive (`atom-01a-dive-into-tile-desktop.png`):**
    - Fine horizontal texture/shading lines are visible on the `Fe` and `Ni` tile surfaces when the camera zooms tightly into the tile.

### E. Factual, scientific, or perceptual-accuracy discrepancies
18. **Iron's blue glow directly contradicts its green spectrum strip (`atom-07-light-iron-desktop.png` & `phone.png`):**
    - The spectroscope shows 5 bright cyan/green/yellow-green lines (peak `538.3 nm: green light`, zero deep-blue or violet lines visible), yet the atom above it glows deep blue (and on phone, green dots sit over a blue halo). Neutral Fe I does have strong blue-violet lines (e.g., `404.58 nm`, `438.35 nm` in NIST ASD, https://physics.nist.gov/PhysRefData/ASD/lines_form.html) that pull the full-spectrum mixed glow blue, while photopic eye weighting pushes green lines into the "8 brightest to the eye". Showing only the 8 green lines while glowing blue looks like a factual/rendering bug to a visitor.
19. **Neon's `614.3 nm: orange light` contradicts its pure red swatch & red ripple (`atom-08b-light-neon-ripple-desktop.png`), and `585.2 / 589.0 nm: yellow light` show orange swatches (`atom-08`, `atom-14`):**
    - `614.3 nm` sits on the orange-red border (orange is conventionally ~590–620 nm, red ~620–750 nm; https://en.wikipedia.org/wiki/Visible_spectrum), so calling it `"orange light"` directly beside a crimson-red square swatch and deep-red ripple reads as wrong. Either align the colour-word thresholds with the actual rendered sRGB hue (e.g., `"orange-red light"` for 608–625 nm, `"golden-yellow"` / `"yellow-orange"` around 585–590 nm) or calibrate the swatch chroma so word and colour agree.
20. **Uranium's outer cloud inflates ~4.5× beyond Gold due to the Clementi–Raimondi → Slater switch (`atom-12-uranium-desktop.png`):**
    - Uranium's scale bar jumps to `500 pm` (outer ring radius ~1,500–1,600 pm, vs. Gold's `360 pm` and Oganesson's `200 pm`), crushing the `5f` cloud into a tiny orange speck and forcing a `5,000×` nucleus scale. Real atomic/covalent/van der Waals radii for Uranium are ~156–240 pm (https://en.wikipedia.org/wiki/Uranium; NIST ground state `[Rn] 5f³ 6d¹ 7s²`, https://physics.nist.gov/PhysRefData/Handbook/Tables/uraniumtable1.htm), only modestly larger than Gold—not 4.5× larger. Falling off Clementi–Raimondi at $Z=86$ onto naive Slater shielding for $7s$ creates an unphysical visual jump across the actinides.

---

## 4. Ranked fix list (highest impact on feel first)

1. **Give `Whole atom` genuine 3D presence and make `+ proton` / exceptions visually rewarding.**
   - Replace the flat 2D outer-shell outline with a soft Fresnel-tinted translucent sphere rim (subtle enough to stay parchment-and-ink) and boost contrast on the non-highlighted shells slightly so the atom reads as a 3D volume before the first drag.
   - Make stepping `+ proton` visibly animate the newly added electron/cloud (brief vermilion pulse or gentle radial settle), and for filling-order exceptions (Cr, Cu, Au, U) subtly highlight the donated shell (`4s`/`6s`/`6d`) alongside the gaining cloud (`3d`/`5d`/`5f`) so the surprise is *seen*, not just read.
   - Fix the $Z > 86$ $Z_{\text{eff}}$ discontinuity (use published relativistic/SCF screening constants for $Z=87\text{–}118$ or smoothly anchor actinide $7s$ shielding instead of raw Slater's rules) so Uranium's `5f` cloud isn't crushed inside an unphysical ~1,600 pm ring.

2. **Fix mobile callout layout and leader-line collisions across all atom modes.**
   - Anchor leader lines to the *nearest outer edge* of the label pill (never its center), so lines never cross through `nucleus` / `hạt nhân` (`atom-14`, `atom-17`).
   - Enforce a hard `16 px` screen-edge safe inset and place mobile labels in dedicated clear quadrants outside the outer ring/lobes (`atom-02`, `04`, `05`, `10`, `13`, `14`, `17`), shrinking the canvas atom framing ~8–10% on `390×844` if needed.

3. **Keep core explanatory copy above the fold in `One cloud` and `Its light` (especially on phone and heavy elements).**
   - On desktop for heavy elements (`atom-12b` Uranium), collapse the `Shell 1..7` subshell picker into a compact horizontal scroll/accordion or a 2-column grid so the active cloud's plain-English description (`"This 5f cloud..."`, colour-sign key, 90% glaze note) stays visible without scrolling.
   - On phone (`atom-05`, `07`, `14`, `17`), keep compact shell groupings (`S1–S4` inline markers) and tighten vertical padding above the fold so at least the active orbital's 1-line shape description and the `Its light` 1-line explanation are visible before scrolling.
   - Fix the sticky header mask on scrolled cards (`atom-09`, `06-card-gold`) with a crisp opaque header background + top padding so scrolled lines never peek out underneath the header border.

4. **Resolve the `Its light` colour contradictions, missing tap hint, and dark-mode button tokens.**
   - Render all NIST visible lines as a faint background spectrum strip behind the 8 brightest selectable lines so Iron's blue-violet contributors are *visible* directly on the bar, explaining why Iron glows blue even when its brightest photopic lines are green (`atom-07`).
   - Align wavelength colour words with rendered sRGB swatches (e.g., `614.3 nm: orange-red light`, `585–590 nm: yellow-orange` or warmer yellow swatch) so the text never contradicts the swatch next to it (`atom-08`, `08b`, `14`).
   - Add a 1-line micro-hint on the spectrum bar (`"Tap a line to see its wave"`) and restore a quiet dark-mode orbit hint (`"Drag to turn · scroll to zoom"`) if orbiting remains active; clamp the ripple ring radius inside the atom stage so it doesn't clip at the top edge (`atom-08b`).
   - Fix `Its light` chrome colours to obey `STYLE.md`: keep the active `Its light` pill in lightened verdigris (or cream outline) and make `+ proton` a high-contrast cream/paper pill with `--kiln` ink text—reserve ember orange strictly for heat UI.

5. **Eliminate unexplained jargon, unify affordances, and remove redundant chrome.**
   - Pair subshell codes with human phrases on first mention (`"borrowed from the outer shell (4s)"`, `"in the third shell's cloverleaf cloud (3d)"`), and in `One cloud` label individual orientation chips plainly (`1–5` or `"Cloverleaf 1 (xy)"` / tooltip with the axis formula) rather than dumping `y(3x²−y²)` and `x(x²−3y²)` raw onto buttons.
   - Rewrite `"Its 8 brightest lines to the eye (of 2,542 NIST lists)"` to `"Its 8 brightest lines to the eye (out of 2,542 measured lines)"` with a single source link on `2,542`.
   - Remove the inline `[Source]` button from the poetic hook (move it cleanly into `About this atom` or a subtle footnote icon), add a quiet `"Tap underlined values for sources"` caption, and reconcile `← Iron` vs `×` (either drop `×` when `← Iron` is already top-left, or make `×` clearly collapse/expand the card only).

6. **Polish remaining micro-details, 3D seams, and consistency.**
   - Unify the disabled state of `− proton` (Hydrogen) and `+ proton` (Oganesson) to the same faint ghost-outline style.
   - Increase tessellation on the translucent nodal-plane discs and tune depth/polygon-offset sorting for radial-node inner lobes (`atom-12b` Uranium `5f`); set a minimum visual floor (~6–7 px) for the enlarged nucleus so `drawn 500× bigger` doesn't point to a 3 px speck (`atom-05`, `atom-12b`).
   - Fix minor typography & localization polish: remove the space before `%` (`90%`), use one consistent picometre definition (`"a trillionth of a metre"`), widen the `green` / `yellow` spectrum label gap on phone (`atom-07`, `17`), adjust mini-tile badge padding so `11`/`Na` and `26`/`Fe` don't crowd, show the international name alongside traditional Vietnamese names in the atom card header (`Sắt · Iron`, `Natri · Sodium`), and re-run `fps.txt` on the merged `b24ab3d` build (plus at least one real GPU / phone spot-check).
