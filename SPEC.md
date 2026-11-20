# SPEC — Better 3D Periodic Table (v1)

Draft for moony's approval · 20 Nov 2026 · no app code until approved.
**Deliverable:** one offline `index.html`: three.js (pinned) and data inlined; every shape and light made in code; no fonts, images, models or CDN.

## 0. Feel (redesign, 21 Nov 2026; moony pre-approved overnight; style in `STYLE.md`, work in `REDESIGN-PLAN.md`)
Where this section conflicts with §2 (six tabs, kid-first wording, legend and data sheet on the first screen), this section wins. Every data, science and source rule in §3–§6 stays.

**Audience.** Curious adults with no chemistry assumed: a PhD who last studied chemistry decades ago, software developers, documentary watchers. Students and teachers too.
**Feeling.** Calm wonder: a sunlit museum of matter where every specimen can be picked up. Plain words come first; the real science and its sources are one tap away, never in the way.

**The first 5 seconds (exactly what is on screen).**
- *Desktop 1440×900:*
  - The page is warm paper. The 118 elements sit as low porcelain tiles in the familiar 18-column shape, tilted toward you and filling about 80 % of the width. Each tile has its family glaze and its symbol in ink.
  - The family names are written on the table itself in serif italic, like a map: "Soft, reactive metals", "Workhorse metals", "Salt-makers", "Noble gases", "Rare earths" …
  - A soft light sweeps across once on load (1.2 s).
  - A quiet top bar holds the wordmark, a "Find an element" pill, EN | VI and a ≡ menu.
  - Bottom centre, in serif: *"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."* Under it, in small sans: **"Tap one to look inside."**
  - Below the prompt, a quiet row of lens chips: **Families** (on) · **Heat map** · Melting point · Heft · Atom size · Grip on electrons · More ▾. They are visibly secondary to the prompt.
  - The iron tile breathes gently (the suggested first tap). After 4 s without a touch, a small "Try iron" tag appears beside it.
  - There is no legend, dropdown, data sheet or tab row.
- *Phone 390×844 (portrait):* the same table, framed to fit the width, with the prompt above the thumb zone. Touch and slide across the table: the element under your thumb pops up large above it (a loupe). Lift to open it. This gives tiny tiles a 44 px-equivalent target.
- **The ONE obvious action: tap an element.**

**The 3-step path to the wow moment** (STYLE.md §9):
1. Tap **iron**. Its tile lifts, the camera glides in, and a card shows *"Iron · the metal of steel"* with three plain facts and three doors.
2. Tap **Hold a piece**. The camera dives *into* the tile, which opens into iron's real crystal (each atom touching 8 neighbours) with a big thermometer.
3. Drag the thermometer up (or press "Heat it ▶"). The room dims like a forge, the metal glows red, then orange, then white. At 912 °C the crystal snaps into a 12-neighbour stack; it melts at 1,538 °C and boils at 2,861 °C.
- **An instant one-tap taste from home:** tap the **Heat map** chip and drag its temperature; all 118 tiles turn solid, liquid or gas together.
- The forge works for any solid that glows, not only iron.

**User flow across views.** The views are places, not tabs. A back link ("← All elements" or "← Iron") is always visible.
```
Table (home: Families; lens chips: Heat map · Melting point · Heft · Atom size · Grip on electrons · More: Electron pull, Discovered,
       Crustal abundance, Boiling point … · story lenses In your phone / Made in stars / In your body once their data is in)
  └─ tap an element → Element card (name, one human line, 3 plain facts, "All numbers & sources")
        ├─ Look inside the atom   (electron clouds, "add a proton", its light; "Its light" dims the room)
        ├─ Hold a piece · heat it (crystal, thermometer, melt/boil)  ← the wow
        ├─ Side by side           (curated surprising pairs or any element; to scale)
        └─ "How does this change across the table?" (from any fact) → Patterns (chart that opens with a question)
Find (search + quick filters) and the menu (lenses, other table shapes, sound, quality, sources, language) are reachable from everywhere.
```

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
