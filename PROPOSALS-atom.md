# PROPOSALS — changes to shared files the atom place would like (for the main session)

PARALLEL.md: shared files are read-only for the view sessions; these are proposals only. #4 is also prepared as its own commit ("PROPOSAL: smoke: retire the legacy atom-panel steps"), so it can be cherry-picked or dropped.

1. **`src/physics/color.js`: the wavelength colour drifts at both ends of the spectrum.**
   - **Problem:** the analytic CIE fit's x̄ : ȳ ratio is wrong in the tails:
     - past ~690 nm: 700 → #8c4a00, 720 → #798a00, 749 → #008946 (olive, then green);
     - below 400 nm: 380 → #005589 (teal).
   - **Effect:** deep-red and near-UV lines are painted the wrong hue, e.g. iron's 748.9 nm or neon's 743–749 nm lines show green. This hits the legacy strip and the card's swatch.
   - **Proposal:** hold the hue at 680 nm above and at 400 nm below, and dim toward the ends, as `lineColour()` in `src/app/ui/spectrum.js` does (tested in `tests/atom.test.mjs`). Alternatively, use a sourced piecewise fit for the tails.
   - `blackbody()` integrates the fit over 380–780 nm weighted by Planck's law, so it is barely affected, but it is worth a check.
2. **`src/app/ui/sheet.js` (card → "All numbers & sources" → visible emission lines): drop or relabel the glow swatch.**
   - The swatch is the CIE mix of the 8 strongest lines, which contradicts known lamp colours: neon green (#00ff5d; real neon is orange-red, as our own hook says), strontium blue, barium orange, calcium magenta.
   - With only 8 lines (NIST licence decision) a single "glow colour" cannot be right in general. The atom place no longer shows one (NOTES-atom.md › Its light).
3. **`src/design/tokens.js`: two kiln tokens.** The forge panel and the atom card use the same literals on the dark stage. Suggested tokens:
   - `kilnPanel: 'rgba(30,23,17,0.9)'`;
   - `kilnAccent: '#F0874F'`, the brightened ember of STYLE.md §9 (7 : 1 on the panel).

   Today these are literals in `heat.css` and `atom.css`.
4. **`tools/smoke.mjs`: retire the four legacy "atom view" steps** (between "URL hash is shareable" and the first sample step).
   - They drive the old dark-stage panel (`.side.left .why`, `.side.left .chip`, `.specline`, `.spectrum p`), which the atom place replaces.
   - The same behaviour is covered by the `// ---- atom ----` block: the door and the back link, + proton V → Cr "moved there from 4s", one cloud picker and turns, its light (a line, its source, arrow keys), about, keyboard, VI, phone.
5. **`tools/shots.mjs`: the `--set=atom` block** (marked `// ---- atom ----`): 23 review states, reached through the card's door. Move it elsewhere if the tool should hold no per-scope sets.
6. **After the wiring**: delete `src/app/ui/atomPanel.js` and the legacy `buildSpectrum` export in `src/app/ui/spectrum.js`. Nothing imports them once `WIRING-atom.md` is applied. They are kept only so the router builds before it.
7. **`src/app/places/home.js`: the back link's name in Vietnamese.**
   - `renderBack()` uses `name()` ("← Iron"), while the card's title and the atom place lead with the familiar GDPT-2018 name ("Sắt").
   - Suggest the same rule as the card: `gdpt ? cap(viAlt) : name(e)`.
   - The forge shows the same "← Iron".

## Round 2 (view-atom-r2, 21 Nov 2026, answering reviews/atom-a1.md)
The first two are prepared as their own commits ("PROPOSAL: data: …"), so each can be cherry-picked or dropped. The atom place works without them: it falls back to the 8 lines in the data and to the estimated radius.

1. **The visible lines that look brightest, and the colour they mix to** (`tools/build-data.mjs`, `tools/validate.mjs`, `data/elements.json`). Commit "PROPOSAL: data: the visible lines that look brightest, and the colour they mix to".
   - **Problem (checked against the raw NIST ASD dumps):** the build kept the 8 lines with the highest NIST relative intensity between 380 and 750 nm. Those intensities depend on the light source, and some elements mix papers on different scales.
     - **Neon** showed one green line and five near-infrared lines (692.9–748.9 nm), under "neon glows orange-red". Its 540.06 and 585.25 nm lines share an upper level, so NIST's own transition probabilities (9.0 × 10⁵ and 6.15 × 10⁷ s⁻¹) fix their ratio at about 1 : 63, yet both are listed as 20,000. The same goes for 614.31 and 692.95 nm (from different papers): NIST's rates say 692.9 nm is about 0.55 × 614.3 nm, but it is listed 10× brighter.
     - **Sodium's** 386–443 nm and 507 nm lines come from core-excited levels (2p⁵ 3s 3d, about 36 eV, far above sodium's 5.14 eV ionization energy). No flame or lamp shows them. Its 568.8 nm pair was missing.
     - **Iron** led with near-ultraviolet lines (382–393 nm) that the eye barely sees.
   - **Rule:**
     - NIST lines of the neutral atom, 380–750 nm, observed.
     - Leave out lines from levels above the first ionization energy.
     - Where NIST grades the transition probabilities of at least 3 visible lines within 18 % (C+ or better), estimate each graded line's radiant power for a gas at kT = 1 eV, the default plasma of NIST's LIBS spectrum tool (checked on its form): P ∝ g_k A_ki e^(−E_k/kT)/λ. Otherwise use NIST's relative intensities (or g_k A_ki).
     - Keep the 8 that look brightest: P × V(λ), the CIE 1931 ȳ from the CIE table already in `data/raw/cie`. A line within 0.5 nm of a brighter kept line is skipped, so the sodium D doublet stays two lines.
     - 49 elements now use the graded rates and 48 the intensities. Still at most 8 lines per element, so the NIST policy is unchanged.
   - **Glow:** `lines.glow` is the CIE 1931 chromaticity (x, y) of all the element's lines above, as the eye would mix them. It is checked against the lamp colours in Wikipedia's "Gas-discharge lamp" table (oldid 1351286820):

     | Element | Wikipedia | Ours (x, y) | Agrees? |
     |---|---|---|---|
     | Neon | red-orange | (0.648, 0.345) | yes |
     | Sodium | bright orange-yellow | (0.557, 0.427) | yes |
     | Argon | violet to pale lavender blue | (0.186, 0.016) | yes |
     | Mercury | light blue | (0.226, 0.251) | yes |
     | Helium | white to orange | (0.451, 0.334) | yes |
     | Hydrogen | lavender to pink-magenta | (0.375, 0.181) | yes |
     | Krypton | grey off-white to green | (0.33, 0.15), magenta | no |
     | Xenon | grey or blue-grey dim white | (0.18, 0.11), too saturated a blue | no |

     Real tubes are not in equilibrium, and their ion lines are not in our data.
   - **Results:**
     - neon: 585.2, 588.2, 594.5, 607.4, 609.6, 614.3, 626.6, 640.2 nm;
     - sodium: the D doublet, the 568.3/568.8 pair, 498.3, 515.3, 615.4, 616.1 nm;
     - hydrogen: Hα–Hζ;
     - mercury: 404.7, 435.8, 546.1, 577.0 nm…;
     - iron: 495.8–561.6 nm (green).
   - **Validator:** two new checks (the lines above; the glow against the table), and the "≤ 8 lines" check passes.
   - **Also needed:** `src/app/ui/sheet.js` line 85 says "the 8 strongest are used". With this rule it should read "the 8 that look brightest (NIST transition probabilities or relative intensities × the eye's sensitivity)".
2. **Measured nuclear radii** (`tools/fetch.mjs`, `tools/build-data.mjs`, `tools/validate.mjs`, `data/elements.json`). Commit "PROPOSAL: data: measured nuclear charge radii (Angeli & Marinova 2013)".
   - **Problem:** gold's "about 5.5 fm (estimate)" came from 0.94·A^(1/3) fm, while the rms charge radius of gold-197 is measured: 5.4371 ± 0.0038 fm (I. Angeli, K. P. Marinova, ADNDT 99 (2013) 69, doi:10.1016/j.adt.2011.12.006). The review was right.
   - **Fix:**
     - a new fetch step `iaea-radii` takes the IAEA LiveChart of Nuclides API's `ground_states` (its `radius` field cites Angeli & Marinova). The raw file is kept local like NIST's (`commit: false`), and only individual values are used;
     - `f.rNuc` is the measured value of the isotope we show (most abundant, or longest-lived) where there is one. That covers 89 elements; the other 29 keep the flagged estimate, with a note that no measured value exists for that isotope.
   - **Validator:** gold-197 is 5.4371 fm and not marked as an estimate.
   - **To rebuild on master:** `node tools/fetch.mjs --only=iaea-radii`, then `node tools/build-data.mjs`.
3. **`src/physics/color.js`: clip instead of adding white for spectral colours.** Light of one wavelength lies outside sRGB. `wavelengthToRGB` adds white until no channel is negative, which turns the deep reds crimson: 640 nm comes out #ff0a46, pink beside neon's red-orange glow. Clipping the negative channels keeps the hue: 640 nm becomes #ff0000-like. The atom place does this in its own `lineColour()` (`ui/spectrum.js`, tested: 640–749 nm read red). The shared function could do the same. White-add stays right for mixtures such as the glow, which lie near the gamut.
4. **`tools/build.mjs`: `export const A = 1, B = 2` silently exports only `A`.** `color.js`'s `HUE_RED` is therefore `undefined` in the built page. The atom place first imported it, and every line turned grey on the page only; Node tests could not see it. Suggest either making the bundler throw on (or support) multi-name `export const`, or splitting the line in `color.js`. The atom place now keeps its own copies of 400/680 with a comment.
5. **Kit sheet (`kit.css`): rows sliced under the compact title bar.** STYLE.md §5 says rows never run beneath the bar, but a scrolled body is cut by the bar's edge mid-glyph (review B5, gold's "About"). The atom card masks its body under the bar once scrolled: transparent to 66 px, opaque at 90 px, with 36→58 px on phones under the handle. The kiln bar is also solid (#1E1711, not 0.98 alpha), so nothing ghosts through it. The same mask on `.ui-sheet.is-scrolled .ui-sheet__body` would fix every card.
