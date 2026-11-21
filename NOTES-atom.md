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
