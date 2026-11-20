# PARALLEL — three view sessions, one design owner (21 Nov 2026)

moony approved up to three extra Claude sessions working in parallel on the views the redesign has not rebuilt yet. Quality comes strictly first.

The **main session is the design owner**. It keeps the hero slice (table, cards, forge), reviews every branch against STYLE.md before merging, and rejects anything off-style. Read STYLE.md (locked), SPEC.md §0, REDESIGN-PLAN.md, DESIGN-RULES.md and the last DECISIONS.md entries before writing code.

## The three scopes

### 1. Atom — "Look inside the atom" (branch `view-atom`)
The card's first door: the nucleus and the stippled electron clouds of REDESIGN-PLAN §2 and STYLE.md §6, in the porcelain style. The atom place's own chrome replaces the old dark-stage panels.
- **Owns:**
  - `src/app/views/atom.js`, `src/app/ui/atomPanel.js`, `src/app/ui/spectrum.js`
  - new `src/app/places/atom.js`
  - `src/styles/atom.css` (stub exists)
  - `src/app/content/strings-atom.js` (stub exists)
  - `src/physics/orbitals.js`, `src/physics/isosurface.js`, `src/physics/config.js`
  - its smoke steps (see "Tests")
- "Its light" (emission lines) dims the room like the forge: reuse `#kiln` and the `kiln` body class; do not restyle them.

### 2. Sample — everything the forge does not cover (branch `view-sample`)
The forge (`Hold a piece · heat it` for crystals solid at room temperature) stays the main session's. This session builds the same experience for everything else:
- liquids (mercury, bromine);
- gases;
- elements without a measured crystal (molecular solids, complex or never-made-in-bulk phases): the honest cards.

It must look and feel like the forge: reuse its look by creating a view with `createSampleView(hooks, { look: 'forge' })` and a thermometer like `places/heat.js`.
- **Owns:**
  - new `src/app/places/sample.js`
  - `src/app/ui/samplePanel.js` (legacy, to be retired by this place)
  - `src/styles/sample.css` (stub exists)
  - `src/app/content/strings-sample.js` (stub exists)
  - its smoke steps
- **Needs a change in `views/sample.js` or `views/forgeArt.js`** (an option, a hook)? Write it as a small, separate commit titled "PROPOSAL: …" with the reason. The main session applies or rejects it.

### 3. Patterns and side by side (branch `view-patterns`)
The card's "↗ across the table" links (trends) and the third door "Side by side" (compare), in the porcelain style. Plain-language axis names with the jargon as a caption; every point is tappable for its source.
- **Owns:**
  - `src/app/ui/trends.js`, `src/app/views/compare.js`, `src/app/ui/comparePanel.js`
  - new `src/app/places/patterns.js` and `src/app/places/compare.js`
  - `src/styles/patterns.css` (stub exists)
  - `src/app/content/strings-patterns.js` (stub exists; compare strings go here too)
  - its smoke steps

## Shared files: READ-ONLY for the three sessions
Change them only through a "PROPOSAL: …" commit in your branch. The main session decides.
- **Design:**
  - `STYLE.md` (locked)
  - `src/design/tokens.js` (no new colours, sizes or durations)
  - `src/styles/base.css`, `src/styles/kit.css`
- **Kit:** `src/app/ui/kit.js`. Need a component? Build it inside your place first. Propose it for the kit only if a second place needs it.
- **Strings:**
  - `src/app/content/strings-home.js`
  - `src/app/i18n.js` (shared keys such as `state.*`, `f.*`, `fam.*` may be *used*, never edited)
- **Router and core:**
  - `src/app/main.js`, `src/app/state.js`, `src/app/engine.js`, `src/app/controls.js`, `src/app/labels.js`, `src/app/dom.js`, `src/app/data.js`
  - `tools/build.mjs`
- **Table, cards, forge:**
  - `src/app/views/table.js`, `tableArt.js`, `tableRegions.js`
  - `src/app/places/home.js`, `elementCard.js`, `lenses.js`, `heat.js`
  - `src/app/views/sample.js`, `src/app/views/forgeArt.js`
  - `src/styles/home.css`, `card.css`, `heat.css`
- **Data and its tools:** `data/**`, `tools/build-data.mjs`, `tools/validate.mjs`, `tools/fetch.mjs`. Never invent a number; unknown facts go to QUESTIONS.md as `- [ ] Q<n>: …`.

**Wiring into the router.** Your place needs `main.js` to mount it, show it for its view and include it in the free-area framing.
- Do not edit `main.js`.
- Put the exact lines you need in `WIRING-<scope>.md` in your branch (a patch-style excerpt with one line of reason each).
- The main session applies them at merge, so there are never three conflicting edits of the router.
- For your own testing you may apply them locally on a scratch commit that you do not push.

## How each session works
- Branch from `master` at the commit that adds this file. Push only your branch, never `master`; the main session merges.
- Commit subjects are plain (no `M<n>:` prefix). End each message with the attribution lines in use in this repo. Never commit `claude-sessions/`, `ref/` media, secrets or raw NIST tables.
- **Strings:**
  - All visible text goes in your `strings-<scope>.js`, as `'<scope>.key'`, English first, Vietnamese as a draft.
  - Vietnamese uses the 13 GDPT-2018 familiar names in sentences, the IUPAC name otherwise (DECISIONS.md).
- **Classes:** prefix your CSS classes with your scope (`atom-`, `sample-`, `patterns-`, `compare-`); use the `ui-` kit classes as they are.
- **Tests:**
  - Add smoke steps for your view at the end of `tools/smoke.mjs`, in one block marked `// ---- <scope> ----`. That block is the only part of the file you edit.
  - Keep all existing steps passing.
  - Run `node --test tests/*.test.mjs`, `node tools/validate.mjs`, `node tools/smoke.mjs` before pushing.
- **Screenshots:** take your view at 1440×900 and 390×844 with `tools/shots.mjs` (`?q=med`), plus `--fps=4` on the automatic path. Put them in `/workspace/out/redesign/<scope>/`, not in the repo.
- **Notes:** log your decisions in your branch's `NOTES-<scope>.md` (what, why, who proposed). The main session moves accepted ones into DECISIONS.md.

## Review checklist (applied by the main session before any merge)
1. **Tokens only:** colours, fonts, spacing, radii, elevation and durations come from `tokens.js` / the CSS variables. The kit is used as it is.
2. **Plain language first:** jargon only as a caption after a human phrase. °C first, kelvin in the details.
3. **Sources:** every number on screen comes from our data and is tappable for its source. Nothing is invented.
4. **Layer 1 rules:** one main action per place, a visible way back, targets ≥ 44 px, text ≥ 14 px (13 px captions), reduced motion respected.
5. **Light:** daylight for matter, the kiln for light and fire. No neon, bloom or glassmorphism.
6. **Speed:** 60 FPS median on phones on the automatic path. No full-screen post-processing.
7. **Languages:** English and Vietnamese both complete. Nothing clipped at 390×844.
8. **Tests:** all existing smoke steps, unit tests and the validator pass. The build stays under 2 MB.

## Merge order
1. **Atom** (`view-atom`): the first door on every card.
2. **Sample** (`view-sample`): the second door, for the elements the forge does not take.
3. **Patterns and side by side** (`view-patterns`): the third door and the "across the table" links.

The main session merges one branch at a time:
- review against the checklist;
- apply `WIRING-<scope>.md`;
- rebuild and run every test;
- reshoot;
- merge to `master` and push.

A branch that fails the checklist goes back with written reasons. The next branch rebases on the new `master` before its review.
