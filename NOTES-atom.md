# NOTES — atom place, "Look inside the atom" (branch `view-atom`, 21 Nov 2026)

Decisions of the atom session (PARALLEL.md scope 1), for the main session to move into DECISIONS.md. Each says what, why and who proposed it. "Plan" = REDESIGN-PLAN.md §2/§4; "style" = STYLE.md (locked; not edited).

## What was built
- **The place** (`places/atom.js`, `styles/atom.css`): the kit sheet (a card on the right on desktop, a bottom sheet on phones), so the card's door opens a card of the same family. In reading order:
  1. the hook first, with its sources;
  2. one plain caption computed from the configuration, its numbers tappable for their source;
  3. three ways to look (chips): **Whole atom · One cloud · Its light**;
  4. **About this atom ▾**.

  The one visible control is the **− proton / + proton** stepper in the sheet's always-visible footer. Each button names where it leads ("+ proton · Cobalt"), and the readout says "26 protons". The top bar keeps only the back link, as in the forge. *Claude, after the plan* ("one visible control: + proton / − proton; behind taps: show one cloud, its light, about this atom").
- **The scale dive** (in `WIRING-atom.md`): the door plunges into the tile like the forge. The tile's glaze crossfades, and the camera then draws back out from near the nucleus through the shells. *Claude; style §7 ("continuous camera flights between scales").*
- **The stage** (`views/atom.js`): an engraving come alive (style §6). Details below.
- **Its light**: the room dims to the kiln (reuses `#kiln` and `body.kiln`, not restyled); the NIST lines spread across the stage as a spectroscope band; the card describes the picked line, with its source.

## Decisions
**The whole atom (default)**
- **The shells are drawn as fine ink rings, with their electron counts.** Each ring sits on the radius holding 90 % of that shell's electrons (the subshells' radial probabilities combined, weighted by occupancy). So "Iron's 26 electrons sit in 4 shells (2, 8, 14, 2)" is visible: 2 electrons on the outer ring, 14 and 8 inside it. Rings too small to read hide their count. *Claude.*
  - *Why:* drawn honestly by density, 24 of iron's 26 electrons sit in the core. The outer 4s cloud then shows only as dust and the "4 shells" of the caption cannot be seen (first build: `/workspace/out/redesign/atom/process/a-first-build-honest-density-desktop.png`; with rings: `b-shell-rings-desktop.png`).
- **Ink stipple for every electron; dots are positions sampled from |ψ|².** Two engraver's choices:
  - the outermost shell gets at least 30 % of the dots, so its reach shows;
  - dense inner shells take lighter ink (tone ∝ (density)^−0.55, clamped), so the core never turns into a black blot.

  Dots per subshell otherwise follow its electrons. *Claude.*
- **The newest electron's cloud is drawn in the phase inks** (vermilion +, cobalt −) over the ink stipple, as the caption names it. *Plan.*
  - **The first d cloud shown is d_xz (m = +1)**, one of the four cloverleaves, in the plane that faces the default camera. The plan's d_xy (m = ±2) lies flat in our z-up scene and would be seen almost edge-on. The intent is kept ("a cloverleaf, not d_z²").
  - p shows p_z (an upright dumbbell); f shows f_xyz (eight lobes).
  - An s cloud shown in colour replaces its own grey copy, so hydrogen is one clean vermilion cloud.

  *Claude.*
- **The nucleus**: matte beads; protons glazed in the element's family pigment (the tile's colour), neutrons in porcelain (`paperDeep`).
  - It is drawn at about 3 % of the frame and never smaller than 3 px.
  - Once the first shell is big enough to see, it stays inside that shell.
  - The label "drawn N× bigger" is computed live from the drawn size and the (estimated) nuclear radius, so it stays true while you zoom.
  - You may zoom right in to the first shell.

  *Claude; style §6 ("a small cluster of matte beads").*
- **Labels stand outside the drawing**, joined to what they name by a hairline (an engraved plate's leader lines). The nucleus label sits to the lower right, the cloud label to the upper left. *Claude.*

**One cloud**
- **Picker**: subshells grouped by shell ("Shell 3: 3s² 3p⁶ 3d⁶"), then the turns of the chosen subshell (xy, xz, yz, x²−y², z², all 5). Their names are the standard captions, and each turn's shape is in plain words on the label and in the caption ("This 3d cloud is a cloverleaf: four lobes in one plane").
  - Radial nodes are described as "thin round gaps where the electron is never found".
  - The phase inks are explained once.

  *Plan + Claude.*
- **The 90 % surface is a thin glaze**, on medium and high quality: back faces, then the dots, then front faces, transparent with a Fresnel rim. *Style §6.*
  - The framing uses the surface's real reach: a lobe reaches further along its axis than the radial 90 % radius.
  - s clouds drop pieces smaller than two grid cells (otherwise blocky specks at the nucleus).

**Its light**
- **The 8-line "glow colour" is not shown.** The old view mixed the 8 strongest NIST lines with the CIE functions. With only 8 lines (moony's NIST licence decision) the mix contradicts known lamp colours:
  - **neon comes out green** (#00ff5d): its 8 lines are deep reds the eye barely sees plus one 540 nm green line;
  - strontium comes out blue;
  - barium comes out orange.

  It sat right under the hook "neon glows orange-red" (`/workspace/out/redesign/atom/process/c-old-glow-colour-neon-green-desktop.png`). *Claude, from checking the data.*
  - **Instead:** visible lines come from the outer electrons' jumps, so in the dark room **the outermost shell's dots take the colours of the element's own lines**, chosen in proportion to the lines' NIST intensities. The inner shells dim to a faint warm grey. No single blended colour is claimed.
  - The legacy swatch still shows in the card's "All numbers & sources" (main session's file): **PROPOSALS-atom.md #2**.
- **A spectroscope band across the stage** instead of the old small strip:
  - one line per wavelength (NIST lists some twice, e.g. helium);
  - brighter = stronger;
  - colour words under it (violet … red);
  - tap or arrow keys pick a line, and the card says "387.9 nm: violet light · brightness 1,000 of 1,000" with its NIST source;
  - the brightest line is picked on entry.

  *Claude; plan ("Its light (NIST lines, tap → wavelength)", "the room dims").*
- **Line colours**: the shared CIE fit drifts toward olive past ~690 nm and toward teal below 400 nm (iron's 748.9 nm line came out green). `ui/spectrum.js` holds the hue at 680 nm and at 400 nm and dims toward the ends; tested in `tests/atom.test.mjs`. `color.js` is shared, so the fix is proposed: **PROPOSALS-atom.md #1**.
- **Elements with no visible lines in our data** (20, e.g. oganesson) say "Our source lists no visible light from oganesson atoms" and show no band.

**Words**
- The **hooks are the plan's wording** (§4): "Cloud shapes decide how atoms join; jumps between levels decide the colours an element glows." and "Heat or electricity makes every element glow its own colours: neon glows orange-red, sodium glows yellow (its 589 nm lines)".
  - The 589 comes from our sodium lines and is tappable for its source.
  - Each hook's "Source" pill lists the plan's sources with links.
- **Captions are built from the configuration (NIST) and the one before it**:
  - "The newest went into a 3d cloud; four of the five d clouds are cloverleaf-shaped";
  - "…and one more moved there from 4s" (Cr, Cu, Nb, Ru, Pd, Pt, Ce, Pr, Tb, Pa, Pu, Bk, Rf: an electron also moves);
  - "{Element} breaks the usual filling order (…)" for the other exceptions (from the data's Madelung note);
  - predicted configurations read "are predicted to sit" and are in italics.
- **"About this atom"** shows, every value tappable for its source:
  - how its electrons are arranged · *electron configuration*;
  - the filling order;
  - in the nucleus, e.g. "26 protons, 30 neutrons · the most common kind: iron-56 (91.754 % of natural iron)", or the longest-lived kind;
  - the pull felt by the outer electrons · *effective nuclear charge*: "about 5.4 of 26 protons (4s)";
  - the size of the nucleus (estimate) and how much bigger it is drawn;
  - the reach of the outer cloud (90 % radius, in this model);
  - how the clouds are drawn (hydrogen-like orbitals shrunk by the felt pull: an approximation).

  The Slater caveat appears for atoms whose outer Z_eff comes from Slater's rules: their outer clouds come out larger than their measured covalent radius. *Claude: honest about the model, e.g. uranium's 7s reaches ~1,750 pm in this model, its covalent radius is 196 pm.*
- **Vietnamese**: drafts for moony. The 13 GDPT-2018 familiar names are used in sentences, in the title, on the stepper and in the readout (Sắt, as the card does). The back link is home.js's and still says "Iron": PROPOSALS-atom.md #7.

**Speed and build**
- **Each orbital is sampled once at unit charge and rescaled** (ψ_Z(r) = Z^1.5 ψ_1(Zr)), from a seeded stream that is only ever extended. "+ proton" never re-samples, and screenshots are reproducible.
- **Dot budgets by tier**: whole atom 52,000 × tier points (low 18,200, medium 36,400, high 52,000) plus the coloured cloud.
- **No glaze on the low tier.** Renders on demand; only changes animate:
  - the new clouds draw out from the nucleus in 0.75 s while the old ones fade (`motion.cardOut`);
  - the kiln takes `motion.kiln`;
  - reduced motion makes all of it instant (camera, reveal, kiln).
- **Router wiring** is in `WIRING-atom.md` (tested; applies cleanly to `d1e17ae`). `index.html` is not committed in this branch (a build artefact; the main session rebuilds after wiring).
- **`tools/smoke.mjs`**: the `// ---- atom ----` block. The four legacy "atom view" steps test the old dark-stage panel (`.side.left .why`, `.specline`), which this place retires. Their removal is the separate commit "PROPOSAL: smoke: retire the legacy atom-panel steps".
- **`tools/shots.mjs`**: a `// ---- atom ----` block adds `--set=atom` (23 states, reached the real way: through the card's door).

## Checks (with WIRING-atom.md applied)
- Smoke: every step passes. The `// ---- atom ----` block has 8 steps; the PROPOSAL commit retires the 4 legacy atom-panel steps.
- Unit tests 23/23 (6 new in `tests/atom.test.mjs`); validator ALL PASS; no console errors in 23 review states or in a stress run (10 fast "+ proton" taps, modes switched mid-transition, leaving while the room is dark, with and without reduced motion).
- `index.html` is 1,535 KB.
- **FPS** (automatic path: SwiftShader, low tier; `/workspace/out/redesign/atom/fps.txt`): all 23 states hold a 60 FPS median, desktop and phone. Desktop p95 is 33 ms, the same as the table landing measured alongside.
  - Other sessions' screenshot jobs loaded this machine at times. Every number was taken while a control (the table landing) also read 60; states first measured under load were re-measured right after a 60 FPS control.
  - Under load, interleaved runs showed the atom states equal to or faster than the landing.
- Review shots: `/workspace/out/redesign/atom/` (23 PNG, README.txt, fps.txt, process/).

## Open questions
- **Q-atom-1:** keep the 8-line glow colour anywhere? (PROPOSALS #2). Neon green is wrong; a sourced lamp colour per element would be needed to show one.
- **Q-atom-2:** the plan asked for d_xy (m = ±2) first; we show d_xz (m = +1) so it faces you. Fine?
- **Q-atom-3:** heavy atoms (Slater Z_eff) show outer clouds several times their measured size. The About row says so. Is a better radial model wanted (it would change the validated hydrogen-like nodes and normalisation)?
- **Q-atom-4:** Vietnamese wording of every `atom.*` string (moony).

---

# Round 2 (branch `view-atom-r2`, 21 Nov 2026): answering the cold review `reviews/atom-a1.md`
Review scores: clarity 3.5, ease 3.5, beauty 4.0, smoothness 4.0, delight 3.5. Every factual claim was checked against its primary source before changing anything; where a claim was wrong or not ours, it says so here. Shared-file changes are proposals: `PROPOSALS-atom.md` › Round 2; the two data changes are separate "PROPOSAL:" commits.

## Facts
- **Neon's lines: the review is right, for a reason it half-guessed.** NIST's relative intensities come from different papers on different scales, and NIST's own transition probabilities show it.
  - 540.06 and 585.25 nm share an upper level (152,970.7 cm⁻¹), so their ratio is fixed at about 1 : 63, yet both are listed as 20,000.
  - 614.31 and 692.95 nm share another; NIST's rates make 692.9 nm about 0.55 of 614.3 nm, but it is listed 10× brighter.
  - Ranking by eye sensitivity alone does not fix it: NIST's intensities still make the green 533–540 nm lines neon's brightest.
  - **New rule** (proposal r2 #1): brightness from NIST's transition probabilities graded within 18 %, for a gas at 1 eV (the NIST LIBS tool's default), where at least 3 visible lines have them; otherwise NIST's intensities. Lines from levels above the ionization energy are dropped. Of the lines left, the 8 that look brightest (× V(λ)) are kept.
  - Neon now shows 585.2, 588.2, 594.5, 607.4, 609.6, 614.3, 626.6 and 640.2 nm, with 640.2 the brightest to the eye.
  - 650.65 nm (which the review listed) is 9th by this rule, not shown.
- **Sodium:**
  - The "cyan-green" and violet lines were 507.1 and 386–443 nm, from **core-excited** levels near 36 eV (2p⁵ 3s 3d), far above the 5.14 eV ionization energy. They are real NIST entries but never seen in a flame or lamp. Gone.
  - The 568.3/568.8 nm pair is now shown with the D doublet (589.0/589.6 nm). The doublet is kept as two lines (lines within 0.5 nm merge, the D lines are 0.6 nm apart).
- **Iron:** the near-ultraviolet stack (382–393 nm) gave way to the lines the eye sees best (495.8–561.6 nm, green). Its glow, from all 651 graded lines, is a blue-violet: iron's many violet lines carry most of its radiant power. The card says the glow is "all of its lines mixed".
- **Glow colour:** computed from all the element's lines (CIE 1931 chromaticity) and checked against Wikipedia's gas-discharge lamp table in the validator.
  - **Agree:** neon red-orange, sodium orange-yellow, argon violet, mercury light blue, helium salmon (white to orange), hydrogen magenta-pink.
  - **Off:** krypton (magenta vs "grey off-white to green") and xenon (too saturated a blue). Real tubes are not in equilibrium, and their ion lines are not in our neutral-atom data.
  - **Flames:** potassium's lilac flame is not reproduced. Its 766/770 nm lines are outside 380–750 nm, and flames are far cooler than 1 eV.
  - This answers DECISIONS.md Q-atom-1 ("a sourced lamp colour would be needed"): the colour is computed from sourced lines by a stated method and checked against the sourced lamp colours. It is not a hand-picked colour.
- **Gold's nucleus: the review is right.** Gold-197's rms charge radius is measured, 5.4371 ± 0.0038 fm (Angeli & Marinova 2013, via the IAEA LiveChart API, whose guide cites them).
  - The data now uses measured radii for 89 elements (proposal r2 #2); 29 keep the flagged estimate.
  - The card shows "5.44 fm (measured)" with a caption "radius of its charge".
- **Not changed, with reasons:**
  - **Oganesson "680 ms":** not in this place, and wrong in the review. It is NUBASE2020's oganesson-295 (680 ± 540 ms), not oganesson-294 (DECISIONS / main's memory).
  - **"Iron/gold 2.4×":** the card's, and right for our PubChem densities.
- **The glaze "overlapping through the nodal plane":**
  - The surfaces never crossed. Each sign's lobes were already taken from ψ itself.
  - The fat 90 % lobes come within a fraction of a Bohr radius of the plane, and from 21° above, the far lobe showed through the near one's translucent glaze.
  - Now a **paper sheet** marks each flat surface where the cloud is zero (planes computed from the real harmonics, tested: ψ = 0 on each). The two inks read as two separate lobes, and the caption says "The paper sheet between them marks where it is never found". d_z² and the f clouds' cones are not drawn as sheets; their caption says "Where they meet, it is never found".

## Clarity
- **Hooks:**
  - The clouds' hook is one line, "Cloud shapes decide how atoms join." (the plan's first half).
  - The light's hook: "Every element glows its own colours: it is how we know what the stars are made of." Sources: NIST ASD, Wikipedia "Astronomical spectroscopy", and Wikipedia "Helium" (first seen as a yellow line in sunlight, 1868).
  - The element-specific sentence is the caption right under the ways to look.
- **Red and blue in the whole atom:**
  - The newest cloud is now drawn in vermilion only, and the caption names it: "The newest went into a 3d cloud, drawn in ● vermilion".
  - A swatch of the ink stands before the word; the word keeps text colour, because vermilion on the card would be 4.3 : 1.
  - The two phase inks appear only in "One cloud", where they are explained.
- **Shorthand removed:**
  - Filling-order exceptions read "Uranium breaks the usual filling order: one electron sits in 6d instead of 5f." The configuration the usual order predicts is a note in "About this atom". Tested for every exception in the data.
  - "(medium and high quality)" is gone. The glaze sentence shows only where the glaze is drawn.
  - The turns are ordered x, y, z (p) and xy, xz, yz, x²−y², z² (d), with "Each is named by the axes its lobes lie along."
  - Brightness reads "its brightest line to the eye" or "about 25 % as bright to the eye as its brightest line".
- **"Drawn N× bigger" no longer twitches:** the nucleus is drawn a round factor bigger (1, 2 or 5 × a power of ten), changing only when it must (under 2.4 px, past the first shell or far from the wanted size).

## Ease
- **Reading order:** hook → the three ways to look → what that way starts with (one cloud's picker, its light's picked line, the whole atom's caption) → About.
  - The ways to look are three equal columns, so Vietnamese never wraps.
  - On phones the sheet grows to show the chosen way's controls (at most 60 %), and switching never scrolls half a hook under the title bar.
  - One cloud on phones: every subshell in one wrapping row (each tells its shell to screen readers), then the turns. At 390 × 844 all are above the footer.
- **Scrolling:**
  - Once the card scrolls, rows fade out under the compact title instead of being cut mid-glyph.
  - The compact title's tile keeps its number (26 Fe).
  - The kiln title bar is solid.
- **Labels:**
  - They stand on a small paper ground (kiln ground in the dark), so rings and dots never cut through words.
  - They turn to the other side of their point rather than come within 14 px of the stage edge.
  - Shell counts too small to place are listed in a legend beside the scale bar ("Shells from the inside out: 2 · 8 · 14 · 2 electrons"), so nothing disappears silently on phones.
- **Stage aids:** a scale bar (a round number of picometres at the nucleus's depth, "a picometre is a trillionth of a metre"), and once per visit "Drag to turn the atom · scroll or pinch to zoom" beside the back link, gone at the first drag or zoom.
- **The band:**
  - The focus ring shows for the keyboard only (`:focus-visible`; the review's shot had used the End key).
  - The selection box stays inside the band's rounded ends.

## Beauty and delight
- **Shells as glass globes:** a fine ink line on each silhouette, a veil thickening toward the rim, the side away from the key light a touch deeper, and a soft highlight at the upper left. One camera-facing quad per shell (exact for a sphere), so it costs almost nothing. In the dark room only a faint warm rim remains.
- **s clouds' glaze:** true spheres at the radii where |ψ| crosses the 90 % level (solved on the radial function), so 4s has no facets left.
- **Its light:**
  - The outer cloud glows like a lamp's gas. Its brightness across the cloud is the outer electrons' density summed along the line of sight (from their own radial functions), on a lamp's tone curve, with a faint aura; the brightest part whitens a little.
  - It is one additive draw, like the forge's glow; the stipple stays alpha-blended (STYLE §6, §10). The nucleus is lit by the glow instead of being a dark hole.
  - Picking a line sends a soft ring of its colour down onto the outer shell (an electron dropping to a lower level gives off that colour) while the glow leans toward it. Under a second; none with reduced motion.
  - The band's slits glow with a whiter core, as bright as each line looks.
  - Line colours clip instead of adding white, so deep reds stay red, not crimson (proposal r2 #3).

## Built with
- `views/atom.js`: glass globes, the glow, the ripple, sheets, s spheres, round factor, labels kept in, scale bar, legend, hint.
- `places/atom.js`: order, hooks, picker, light card, About.
- `ui/spectrum.js`: brightness to the eye, glow colour, clipped line colours, glowing slits.
- `strings-atom.js`, `atom.css`, `tests/atom.test.mjs` (8 tests), smoke `// ---- atom ----` (10 steps), `tools/shots-atom.mjs` (29 states).

## Checks (round 2, final build)
- Unit tests 41/41 (`tests/atom.test.mjs`: 8 tests, 3 new: the lines and glow, nodal planes / s spheres / turn order, round factors and plain filling-order phrases). The validator passes, with 3 new checks: the brightest-looking lines, the glow against Wikipedia's lamp table, gold-197's measured radius.
- Smoke: all steps pass. The `// ---- atom ----` block has 10 steps, 2 new: every shell count shown, the scale bar and round factor; carbon's x/y/z turns and its paper sheet; uranium in plain words. The light and About steps now check the brightest-looking line, the glow and "3.74 fm (measured)", and the phone step checks the picked line's readout above the footer.
- No console errors in the 29 review states.
- **FPS** (`/workspace/out/redesign/atom-r2/fps.txt`), all bracketed by table-landing controls:
  - Automatic path (SwiftShader → low tier): all 29 states hold a 60 FPS median. Three were first measured while another session's job started (load 12) and were measured again beside 60 FPS controls.
  - Desktop p95 is 33–67 ms, against the control's own 33 ms in the same minutes; phones hold 60 (58–60 average in a quiet minute).
  - While things move (+ proton every 0.8 s, switching ways to look, picking lines with the ripple): a 60 FPS median on desktop and phone.
  - Forced medium/high tiers (never picked on SwiftShader): 30–15 FPS median, faster than the table landing itself at those tiers on the same renderer (12 and 7.5 FPS).

## Open questions (round 2)
- **Q-atom-r2-1, the glow model:**
  - The glow colour is computed from NIST transition probabilities at 1 eV where they are graded, and checked against Wikipedia's lamp table. It matches neon, sodium, argon, mercury, helium and hydrogen; krypton (magenta vs "grey off-white to green") and xenon (too saturated a blue) are off.
  - Is this method acceptable in place of DECISIONS Q-atom-1's "a sourced lamp colour per element"? If not, the glow can fall back to the dots in the lines' colours only. Dropping proposal r2 #1 removes `lines.glow`, and the view then draws no glow.
- **Q-atom-r2-2, the sheet's wording:** `sheet.js`'s emission-line note still says "the 8 strongest are used" (proposal r2 #1 asks to change it).
- **Q-atom-r2-3, flame colours:** potassium's lilac flame comes from lines beyond 750 nm and from a cooler source than the model's 1 eV. Should the fetch window grow to 780 nm (the CIE limit)? It would not change the model's verdict for potassium.
