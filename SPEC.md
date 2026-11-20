# SPEC — Better 3D Periodic Table (v1)

Draft for moony's approval · 20 Nov 2026 · no app code until approved.
**Deliverable:** one offline `index.html`: three.js (pinned) and data inlined; every shape and light made in code; no fonts, images, models or CDN.

## 1. After 2 minutes, a visitor gets
- Order = proton count; a column (group) shares its outer-electron pattern.
- Trends are real: atoms shrink across a period, grow down a group; ionization energy does the opposite.
- Electrons fill real-shaped s/p/d/f orbitals in a set order (with exceptions like Cr, Cu).
- Solids are specific repeating patterns (BCC, FCC, HCP…) that melt and boil at real temperatures.

## 2. Views & interactions
- **Table:** 118 columns; height = radius, ionization energy, electronegativity, melting/boiling point, density… (log option); colour = category. Layouts: 18-col, 32-col, **helix** (32-col on a cylinder, after de Chancourtois 1862: Z continuous, groups aligned). No data = ghost column; predicted = hatched.
- **Trends:** property-vs-Z chart linked to the table; one-line "why".
- **Atom:** phase-coloured orbital clouds for every occupied subshell (+ 90 % surfaces on Medium+); single orbitals ↔ total density; nucleus with its true enlargement factor; "add a proton" stepper; NIST emission lines (tap → λ) and glow colour.
- **Sample:** the element's measured lattice. Temperature slider: vibration grows (Lindemann), then real 1-atm melting and boiling; handles sublimation (C, As) and helium (no solid at 1 atm); gas speed = √(3RT/M); iron switches BCC→FCC→BCC; graphite ↔ diamond.
- **Compare:** two elements, split view at one scale, ratio bars + plain sentences.
- **Quiz:** Socratic, one question at a time, answered by tapping the scene or a choice; a miss gets a smaller guiding question while the camera flies to the evidence. Skill map (table, categories, orbitals, trends, states, crystals): 0 = unseen … 3 = solves alone … 5 = predicts new cases; saved locally. Questions hand-written + generated from data.
- **Everywhere:** search (EN/VI names, accent-insensitive, symbol, Z); filters (category, block, group, period, state at T, natural/synthetic); complete legend; rich data sheet (~25 fields, each sourced); EN ↔ VI; kid-first text, "More" for adults; shareable URL; keyboard; phone layout; colour-blind-safe; reduced motion.
- **Quality tiers** Low/Med/High, auto + manual; bloom/shadows only on High; renders only when something changes.

## 3. Data — real, cited, embedded
- **PubChem Periodic Table** (NCBI): base properties. **IUPAC/CIAAW:** atomic weights.
- **NIST ASD:** configurations, ionization energies, emission lines (neutral atoms, air λ 380–750 nm).
- **CRC Handbook + Crystallography Open Database:** structures, lattice constants, abundance; WebElements cross-check.
- Radii: covalent (Cordero 2008), van der Waals (Alvarez 2013), always labelled. NUBASE2020 half-lives. Z_eff: Clementi–Raimondi, else Slater's rules.
- VI names: GDPT-2018 textbook form + traditional name where different (sodium · natri).
- **Embedding:** a build script merges raw downloads (kept with URL + date) into **one** `<script type="application/json">` block. Every value carries a source key (tap a number to see it); a Credits panel lists versions, licences, access dates. Descriptions are our own words.

## 4. How it beats the original
| Original | Ours |
|---|---|
| Shells + hinted clouds | Hydrogen-like ψ(n,l,m): true lobes, phases, nodes |
| Generic cubic grid | Measured lattice per element (BCC/FCC/HCP/diamond…) |
| No search; legend lacks reactive nonmetals | Search, filters, full legend incl. reactive nonmetals |
| No trends, compare, layouts | Trends chart, compare, 3 layouts |
| Thin data | Rich sheet, every value sourced |
| No learning path | Socratic quiz + skill map |
| Heavy, hard to click | Tiers, big hit areas, keyboard |
| Small 3D labels | Screen-space labels ≥ 14 px, no overlap |

## 5. Scope
- **v1:** all of the above; lattices for every measured non-molecular solid with ≤ 16 atoms per conventional cell (≈ 84 elements); an honest card for the rest (e.g. "never made in bulk").
- **Later:** the original's demo dioramas; photoreal desk/DOF; molecular & complex solids (H, N, O, halogens, B, Mn, P, S); predicted superheavy structures; more allotropes; Benfey/Janet layouts; isotopes/decay; many-electron orbitals; more languages.

## 6. Done when
- **Coverage:** every weakness in `ref/VIDEO_NOTES.md` is beaten (§4) or listed in Later.
- **FPS** (built-in meter, real devices): M1/Iris Xe laptop, 1080p, High → 60 median, p95 frame ≤ 20 ms; mid-range phone (iPhone 12/Pixel 6a), Medium → ≥ 55; low-end Android, Low → ≥ 30. Interactive ≤ 3 s on 4G; file ≤ 2 MB; nothing fetched beyond the HTML.
- **Data:** validator passes (118 unique Z, units, source on every value, one category each); 20 random elements × 5 fields match a second source or the gap is explained; golden values match (Ga mp 29.76 °C, α-Fe a = 286.65 pm, Cr [Ar] 3d⁵ 4s¹, Na D 589.0/589.6 nm, H IE 13.598 eV); orbital maths verified for all 19 occupied subshells (normalised; n−l−1 radial, l angular nodes).
- **Screenshots:** scripted 1920×1080 + 390×844 per view (H, C, Fe, Au, U; EN + VI): labels ≥ 14 px, no overlap or clipped diacritics, legend complete; reviewed beside the `ref/` shots.
- **Sign-off:** licences confirmed; Vietnamese checked by moony; moony approves.
