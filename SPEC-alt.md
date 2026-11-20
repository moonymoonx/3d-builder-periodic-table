# SPEC — Better 3D Periodic Table

*Draft for moony's approval · 20 Nov 2026*

One offline-capable `index.html`: three.js inlined, all visuals made in code, no requests after load, no tracking. Credits Ryan Sael's original; our own look.

## 1. The 2-minute takeaway (5-step tour, age 8+)
- Elements line up by proton count; each step adds one proton and one electron.
- Each row starts a new electron shell; each column is a family: same outer electrons, similar behaviour.
- The table's shape *is* the orbitals: blocks 2/6/10/14 wide = 2 × (1, 3, 5, 7) orbitals.
- Atoms generally shrink across a row and grow down a column; ionisation energy does the opposite.
- Solids stack atoms in a few real patterns and melt/boil at element-specific temperatures.

## 2. Views & interactions
- **Table:** height + colour = one of 8 properties (ionisation energy, radius, electronegativity, melting point…), log option; no data = ghost column, never zero. Click/tap → dive into the atom.
- **Layouts:** 18-column, 32-column, **helix** (one period per turn, Z unbroken); animated morphs.
- **Atom:** orbitals of the last-filled subshell (tap any other); configuration; "add a proton" stepper flagging exceptions (Cr, Cu); emission lines + approximate glow colour; nucleus marked "not to scale".
- **Sample:** real lattice; temperature slider (K/°C) melts/boils at real 1-atm points; never-isolated elements (At, Fr, Fm+) say so.
- **Trends & Compare:** property-vs-Z chart linked to the table; any two elements side by side.
- **Quiz:** one question at a time; predict → reveal in 3D; wrong answers get a hint question, not the answer; a 0–5 skill map (trends, orbitals, crystals, number patterns like 2n²…) picks what's next; kid/adult tracks; saved locally.
- **Everywhere:** data sheet (mobile: bottom sheet), search, keyboard control, deep links (`#Fe/sample/vi`), reduced-motion mode.

## 3. Data — real, cited, one JSON
- **Sources:** [PubChem Periodic Table](https://pubchem.ncbi.nlm.nih.gov/periodic-table/); [CIAAW](https://www.ciaaw.org/atomic-weights.htm) atomic weights ([n] = longest-lived isotope); [NIST ASD](https://physics.nist.gov/asd) (configurations, ionisation energies, visible lines); [Cordero 2008](https://doi.org/10.1039/b801115j) covalent radii; NUBASE2020 via [IAEA LiveChart](https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html) (isotopes); [Crystallography Open Database](https://www.crystallography.net/cod/) (lattices). CRC and WebElements for spot checks only. Blurbs: ours, cited.
- **Orbitals:** computed live — hydrogen-like ψ(n,l,m), real spherical harmonics, Slater Z_eff; labelled an approximation.
- **Embedding:** one `<script type="application/json">`: 118 elements (each value tagged source + measured/estimated/predicted), spectra, lattice cells (cell parameters + fractional coords), EN/VI strings, dated source list; built offline from saved raw dumps.
- **Attribution:** Sources & credits panel (links, licences, dates, three.js licence) + per-value ⓘ. Licences verified before embedding.

## 4. Beating the original
| Original (seen 20 Nov) | Ours |
|---|---|
| Point clouds that hint at orbitals | True s/p/d/f 90%-probability surfaces with nodes + phase colours |
| One cubic grid for every sample | Real per-element lattice: BCC, FCC, HCP (real c/a), diamond-cubic (Si, Ge), simple cubic (Po), rhombohedral (As/Sb/Bi), graphite, diatomic molecules…; He never freezes at 1 atm; C and As sublime |
| No search; legend lacks reactive nonmetals | Accent-insensitive search (name, symbol, Z); complete, filterable legend; one category per element |
| 5 height properties; one layout | 8 properties + chart, two-element compare, 3 layouts |
| Thin-looking data sheet | Mass, configuration, radii, EN, IE, EA, oxidation states, mp/bp, density, structure, isotopes, discovery, uses, sources |
| No quiz | Socratic quiz + skill map |
| Very heavy, hard to click | Instancing, render-on-demand, auto Low/Med/High tiers + dynamic resolution, ≥ 44 px tap targets |
| Small 3D labels | Symbols ≥ 12 px, names on zoom; HTML panels; WCAG-AA contrast; colour-blind-safe palette |
| Vietnamese unconfirmed | Full EN/VI: textbook name + traditional (sodium · natri — moony confirms); decimal comma |

## 5. v1 vs later
- **v1:** §2–4, capped: 8 properties, one-line blurbs, ~60 written quiz items + generated ones. Build order: table → atom → sample → trends/compare → quiz.
- **Later:** Demo dioramas (reactions, flame tests, magnet, decay); allotropes and solid–solid changes like Fe α→γ→δ (v1: room-temperature form + note); very complex cells — B, Mn, S, P, Pu (v1 names them, never fakes a grid); multi-electron orbitals; phase diagrams; Benfey spiral; more languages; teacher mode.

## 6. Done criteria
- **Speed** (`?stats` overlay, all views): p95 frame ≤ 16.7 ms (60 fps) at 1080p High on integrated graphics; ≤ 33 ms (30 fps) on a ~2023 mid-range phone; interactive < 3 s on 4G; file ≤ 2 MB.
- **Data:** script checks completeness, units, one category each, sources on every value; two-source cross-check (> 1% gap → review); 20 random elements hand-checked vs primary sources; tricky cases right (Cr/Cu configurations, He/C/As at 1 atm, Hg liquid and Ga solid at 20 °C).
- **Screenshots:** each view × EN/VI × 1440×900 and 390×844, plus Low tier; orbitals (2p, 3dz², 4f) and lattices (Fe, Cu, Mg, Si) match textbook figures.
- **Quiz:** answers derived from the JSON; VI text reviewed by moony.
- **moony signs off.**
