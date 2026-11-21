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
