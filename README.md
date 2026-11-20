# Periodic Table 3D — the elements up close

A calm 3D periodic table in **one offline HTML file** (`index.html`): three.js r170 and all data are inlined,
every shape is made in code, nothing is fetched at runtime. English and Vietnamese. Tap an element to open its
card (plain facts, then doors to look inside the atom, hold a piece and heat it, or compare it). Every number
carries a source — tap it to see where it comes from.

Specification: [SPEC.md](SPEC.md) (§0 Feel) · style: [STYLE.md](STYLE.md) · redesign plan: [REDESIGN-PLAN.md](REDESIGN-PLAN.md) ·
progress and honest status: [LOG.md](LOG.md) · decisions: [DECISIONS.md](DECISIONS.md) · open questions: [QUESTIONS.md](QUESTIONS.md) ·
fact-check: [FACTCHECK.md](FACTCHECK.md) · design study: [DESIGN-STUDY.md](DESIGN-STUDY.md) and its critique [PLAN-CRITIQUE.md](PLAN-CRITIQUE.md)

## Use it
Open `index.html` in a recent browser (Chrome, Edge, Firefox, Safari), straight from disk or any static server
(`python3 -m http.server`). Keys: `←/→` element, `↑/↓` up/down a column, `/` find, `Enter` open the card,
`Esc` back / close, `H` next lens, `L` other table shapes, `F` FPS meter. Add `?stats` for the FPS meter, `?q=low|med|high`
to force a quality tier. The URL hash (e.g. `#v=table&el=Au&card=1&lens=heat&T=1300&lang=vi`) is a shareable link.

## Build it
```bash
npm install                      # three@0.170.0 (pinned)
node tools/fetch.mjs             # download raw data into data/raw/ (+ MANIFEST.json); resumable
node tools/build-data.mjs        # data/raw -> data/elements.json (every value [value, source, flags])
node tools/validate.mjs --report # data + physics validator (exit 1 on failure) -> data/crosscheck.md
node --test tests/*.test.mjs     # unit tests (orbitals, configurations, lattices, parsers, colour)
node tools/build.mjs             # -> index.html (single file, checked <= 2 MB, no runtime fetches)
```
`data/elements.json` and `index.html` are committed, so only `npm install` + `node tools/build.mjs` is needed to
rebuild the page from the committed data.

**Code layout (redesign).** `src/design/tokens.js` is the one source of design tokens (colour, type, space, motion,
3D light and tile); the build writes them as CSS custom properties. Styles live in `src/styles/` in a fixed order:
`base.css` (page, type, 3D labels, overlays) → `kit.css` (shared `ui-` components from `src/app/ui/kit.js`: button,
chip, back link, icon button, segmented, door, fact, disclosure, banner, sheet, temperature slider, menu) →
`home.css`, `card.css` (places) → `legacy.css` (views not rebuilt yet, on a dark stage). Places are in
`src/app/places/` (home, element card, lenses); 3D views in `src/app/views/` (table + `tableArt.js`, `tableRegions.js`).
Later rebuilds of atom, sample, trends and compare should use the tokens and the kit and keep to their own files. Some raw sources are not redistributed (see below); `tools/fetch.mjs`
downloads them again and `MANIFEST.json` records their URL, access date and sha256.

### Browser checks (optional)
Playwright is not a dependency of this repo. Install it outside, then run the scripted screenshots and the
interaction smoke test (headless Chromium with software WebGL; frame rates there are not representative):
```bash
mkdir -p ../tools-env && cd ../tools-env && npm init -y && npm i playwright@1.49.1 \
  && PLAYWRIGHT_BROWSERS_PATH=$PWD/browsers npx playwright install chromium && cd -
node tools/shots.mjs     # -> screenshots/*.jpg (1920×1080 and 390×844, EN + VI), fails on console errors
node tools/smoke.mjs     # landing, tile -> card, sources, search, keyboard, lenses, menu, back links, views
# review sets for the redesign (outside the repo), e.g. the hero slice at 1440×900 + 390×844 with frame statistics:
node tools/shots.mjs --set=hero --serve --desk=1440x900 --phone=390x844 --png --query=q=med --out=/tmp/hero
node tools/shots.mjs --set=views --serve --desk=1440x900 --phone=390x844 --png --fps=4 --out=/tmp/views
```

## Data sources and licences
| Data | Source | Licence / how it is used |
|---|---|---|
| names (EN), category, state, melting/boiling point, density, electronegativity, electron affinity, oxidation states, discovery year | PubChem Periodic Table (NCBI/NLM) | US Government work; some content contributed by third parties |
| standard atomic weights | IUPAC CIAAW (abridged + full tables) | numeric facts, cited; raw pages not redistributed |
| ground-state configurations, ionization energies, a handful of visible lines per element | NIST Atomic Spectra Database v5.12 (SRD 78) | © U.S. Secretary of Commerce: only the individual cited values the page needs (moony's decision, DECISIONS.md); no NIST table or raw dump is redistributed |
| physical constants (Bohr radius, R, k, N_A, …) | CODATA 2022 via NIST (SRD 121) | individual cited constants |
| crystal structures, lattice constants, corrections | Wikipedia element infoboxes and articles (citing Arblaster 2018 and others) | CC BY-SA 4.0 pages: numbers only, our own wording |
| atomic positions of non-trivial structures | Crystallography Open Database | CC0 (original authors cited per entry) |
| covalent radii (Cordero 2008), vdW radii (Alvarez 2013), Clementi–Raimondi Z_eff, CRC phase data, crustal abundance | mendeleev v1.3.0 | MIT (package); numeric facts cited to the original papers |
| isotopes, natural abundances, half-lives | NUBASE2020 (Kondev et al., Chin. Phys. C 45, 030001) | CC BY 3.0 |
| Vietnamese names | Wikidata labels (CC0) + GDPT-2018 naming rule (Báo Đại Đoàn Kết report) | facts; to be confirmed by moony |
| colour of light | analytic CIE 1931 fit (Wyman, Sloan & Shirley 2013), W3C sRGB matrix | formula coefficients; W3C licence |

The Credits panel inside the app (button "Sources") lists every source with licence and access date.
Values that could not be sourced are shown as missing with a reason; predicted or estimated values are striped/marked;
the few remaining working assumptions are tagged "unverified" and listed in QUESTIONS.md.

## Credits
Inspired by Ryan Sael's 3D periodic table (sael.net/periodic-table); this is an independent, clean-room design and code
base. Rendering: [three.js](https://threejs.org) r170, MIT licence.
