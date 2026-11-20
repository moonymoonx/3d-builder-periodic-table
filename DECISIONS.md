# DECISIONS
- 2026-11-20: Project = better remake of Sael's 3D periodic table; single self-contained three.js page, code-made shapes, real data.
- 2026-11-20: Spec before code; moony approves SPEC.md first.
- 2026-11-20: Claude Code always Opus; planning/spec at max effort (xhigh if easier); build at xhigh/high.
- 2026-11-20: Gemini does idea scouting alone (no Claude critique). Gemini CLI unusable with personal accounts; use gemini.google.com.
- 2026-11-20: SPEC.md v1 drafted by Claude Code (Opus, max). Pending moony approval. Open sign-offs: data licences, Vietnamese element names (moony checks).
- 2026-11-20: Idea bank doc lives in private Drive folder '3D builder' (not shared).
- 2026-11-20 (M1, build): **Data model** — every value is `[value, sourceKey, flags]`; units declared once per field; a missing value is `[null, "none", {n: reason}]`; `p` = predicted/estimated (UI hatches it), `th` = theoretical/semi-empirical (NIST notation), `alt` = what other sources say, `u` = uncertainty, `r` = NIST reference code.
- 2026-11-20 (M1): **Primary source per field** — names: Wikidata (IUPAC spelling) + PubChem alias; category, state, mp/bp, density, EN, EA, oxidation states, discovery year: PubChem (SPEC §3); atomic weight: CIAAW abridged; configuration, term, IE1–3: NIST ASD 5.12; lines: NIST ASD 5.12 (top 40 per element by NIST relative intensity, else by g·A); structures + lattice constants: Wikipedia infobox values (Arblaster 2018 etc.); free atomic positions: COD; covalent/vdW radii, Clementi Z_eff, crustal abundance, CRC phase data: mendeleev v1.3.0 (citations resolved from its bib file); isotopes, half-lives, charge radii: IAEA LiveChart; constants: CODATA 2022; colour: CIE 1931 CMFs + W3C sRGB matrix.
- 2026-11-20 (M1): **Public repo vs raw dumps** — raw files with an open licence are committed (PubChem, Wikipedia CC BY-SA, Wikidata CC0, COD CC0, mendeleev MIT, CIE CC BY-SA, W3C). NIST SRD (© US Sec. of Commerce), CIAAW, IAEA, CODATA and the news article are kept local only (data/raw/.gitignore) and can be re-fetched; MANIFEST.json (committed) records their URL, date and sha256. Extracted values are embedded with citations. Licence sign-off stays with moony.
- 2026-11-20 (M1): **Categories** = PubChem GroupBlock (10: alkali, alkaline-earth, transition, post-transition, metalloid, nonmetal → labelled "reactive nonmetal", halogen, noble gas, lanthanide, actinide); exactly one per element. **Layout**: IUPAC 18-column form with group 3 = Sc, Y, Lu, Lr; f-block La–Yb, Ac–No (also defines the 32-column order).
- 2026-11-20 (M1): **Vietnamese names** — GDPT-2018 rule as reported by Báo Đại Đoàn Kết: 13 elements keep Vietnamese names with an English annotation (vàng, bạc, đồng, chì, sắt, nhôm, kẽm, lưu huỳnh, thiếc, nitơ, natri, kali, thuỷ ngân); all others use the IUPAC name; the Vietnamese-Wikipedia/Wikidata form is shown as the alternative (e.g. "oxygen · oxy"). Primary MOET source requested (QUESTIONS.md Q7); moony checks.
- 2026-11-20 (M1): **NIST "( )"/"[ ]" values** are hatched as predictions only when the neutral atom also has no observed lines in our NIST data (H's QED value is not "predicted"). **Bulk estimates**: hatched when Wikipedia marks them predicted/estimated or leaves the field empty while PubChem has a value (e.g. At mp).
- 2026-11-20 (M1): **1-atm phase model** — He: no solid (CRC + Wikipedia), C and As sublime (Wikipedia sublimation point; CRC as check), Fe α→γ→δ at 912/1394 °C (Wikipedia infobox), Sn grey↔white at 286.35 K (CRC), everything else PubChem mp/bp. Elements with multiple measured structures but no transition data (C graphite/diamond, Ce β/γ) get an allotrope toggle; default = first structure listed in the infobox (Ce: QUESTIONS.md Q2).
- 2026-11-20 (M1): **Lattices** — cell lengths from Wikipedia/Arblaster (20 °C) mapped onto the COD axis setting by length; atomic positions from COD where symmetry does not fix them, else from symmetry (bcc, fcc, hcp, dhcp). COD entry choice is deterministic (tools/lib/cod-select.mjs: space group, ambient pressure, temperature window, closest to 293 K or to the phase's mid-range, newest; XAFS "local structure" models excluded). δ-Fe uses COD 9013487 (Basinski et al. 1955, 1705 K). Molecular (H, N, O, F, Cl, Br, I, P, S) and complex (B, Mn) solids are honest cards per SPEC §5.
- 2026-11-20 (M1): **Cross-check** — SPEC sample = 20 elements drawn with fixed seed 20261120 × (mp, bp, density, IE1, atomic weight); tolerance mp/bp ±max(2 K, 1 %), density ±2 %, IE ±0.5 %, AW ±0.1 % or within stated uncertainty; gas densities compared at the same temperature (PubChem 0 °C vs CRC 295 K). Every remaining gap has a written explanation (data/curated/crosscheck-notes.json) that the UI shows as "Other sources". PubChem stays primary where sources conflict (QUESTIONS.md Q10).
- 2026-11-20 (M1): **Unknowns** go to QUESTIONS.md with a marked placeholder (source key `placeholder`, UI label "unverified"); RESEARCH.md › Answers and FACTCHECK.md are checked at the start of each milestone.
- 2026-11-20 (M1): package.json switched to `"type": "module"` (shared ES modules for app + node tests).
- 2026-11-20 (moony, proposed by the Gemini fact-check): **NIST ASD and CODATA are SRD-copyrighted** → use NIST values only as plain facts: just the specific numbers the page needs (ground states, ionization energies, a handful of visible lines per element = the 8 strongest, wavelength + relative intensity only; 8 CODATA constants), each cited to the NIST source. No NIST table or raw dump is embedded in index.html or committed (data/raw/nist-asd and nist-codata are gitignored and were never committed).
- 2026-11-20 (fact-check applied): **Gemini fact-check fixes** (FACTCHECK.md) applied in tools/build-data.mjs + data/curated/factcheck-fixes.json; where a fix has a source we hold, that source is used (Wikipedia infobox/article numbers, COD entries), otherwise the value is tagged `fc` with Gemini's citation. Summary: COD picks pinned (Ga 9008085 Cmce, U 9008584 room-T, α-Sn 9008568 bulk) + cryogenic/nanocrystalline/electrode/thin-film/XAFS entries filtered; isotopes and half-lives now from **NUBASE2020** (CC BY 3.0) instead of IAEA LiveChart; nuclear radius estimate R_rms ≈ 0.94·A^(1/3) fm; gas particles per molecule (H₂ … I₂ = 2, P₄, S₈); Ra = cI2; Z ≥ 100 = predicted card; Cm/Bk/Cf/Es lattices → **84 measured lattices**; γ-Ce default; canonical structure names written by us (fixes "facecentredcubic"); PubChem overrides (Ga bp 2676 K, Ba 2118 K, Ra 2010 K est., Bk mp 1259 K + density 14.78, Cs density 1.886, He/C/As no 1-atm mp, At/Fr mp and Pa/Cm/Bk/Cf bp flagged as estimates, Og/Cn/Fl predicted phases from Wikipedia, discovery years Al/Ca/F/Si/Ru from the Wikipedia infobox); VI names IUPAC first ("sodium · natri", SPEC §3); colour from the analytic CIE fit (Wyman–Sloan–Shirley coefficients parsed from Wikipedia) — the CC BY-SA CIE table is no longer embedded (kept in data/raw only to test the fit); no Wikipedia prose/comment strings copied (notes are ours, only numbers + citations); Clementi Z_eff cited per Z range; group-3 layout labelled as the 2021 IUPAC provisional recommendation.

- 2026-11-20 (M2): **Table encodings** — heights are proportional from zero (honest bars) except discovery year (range) and the log option; no data = translucent ghost column; predicted/estimated = diagonal stripes; filtered out = dimmed. Labels are HTML (15 px symbol, 14 px value), greedily culled so none overlap (selected > hovered > elements > axis numbers). The 3D scene is framed in the screen area between the panels (camera view offset). Helix = 32 columns around a cylinder, Z continuous, groups aligned, bars pointing outward at half height; labels on the far side are hidden.
- 2026-11-20 (M2): **Build** — no bundler dependency: tools/build.mjs wraps three.module.min.js (r170, self-contained) in an IIFE from its trailing export list and bundles our ES modules in dependency order; conservative minification (comments/indentation only). Screenshots are JPEG (quality 82) to keep the public repo small. Playwright lives in ../tools-env, outside the repo.

- 2026-11-20 (M3): **Atom view** — scene unit = picometre; orbital z axis drawn vertical; default shows the subshell that received the newest electron (vs Z−1) and its m = 0 orbital; 90 % surface = the |ψ| level enclosing 90 % of the probability on a 44³ (Medium) / 60³ (High) grid; nucleus drawn at 2.5 % of the shown extent and the factor reported honestly (nuclear radii are estimates since NUBASE2020 has none). Point budgets scale with the quality tier. Spectrum heights ∝ √(relative intensity) so weak lines stay visible; glow = CIE-weighted sum of the 8 lines, labelled approximate.

- 2026-11-21 (moony): **Design bar for M4–M7 = DESIGN-RULES.md Layer 1** (clarity in 5 s, one main action per screen, instant feedback, ≥ 44 px targets, visible undo/reset, calm layout, ≤ 2 fonts, motion that explains at 60 fps with reduced-motion support, one designed wow moment, fast first load, contrast on phone and desktop). M1–M3 are not redone; the M7 polish runs the rules' quick review checklist across all views.
- 2026-11-21 (M4): **Sample view** — hero control = temperature dock (log slider 1–6000 K); event chips instead of slider labels (no overlap, big targets). Display physics: lattice constants fixed per phase (no thermal expansion, stated in the app); vibration from the sourced Lindemann parameter; Bain path for bcc↔fcc; liquid = jostling particles with short-range repulsion, weak gravity and cohesion (qualitative, labelled); gas = ideal gas, Maxwell speeds from √(3RT/M) shown ~3×10¹¹ times slower, particles not to scale (stated). Molecules: diatomic pairs with bond ≈ 2 covalent radii (approximation); P₄/S₈ drawn as single particles. **Wow moment (project-wide): heat a metal until it glows** — blackbody colour from Planck's law × the CIE fit.

- 2026-11-21 (M5): **Trends** is an SVG chart, not 3D: a flat chart reads faster and stays crisp at any size (clarity in 5 s); it shares `state.prop` with the table's column heights, so the "link to the table" is the same property one tap away. **Compare** uses covalent radius by default (the size atoms have when they bond, available for 118 elements) with van der Waals as the alternative; both are radii of different kinds, so the toggle names the kind and the sentences follow it. Ratios are written as "N times as …" with 3 significant figures below 10; differences under 5 % are not called out; densities are only compared when neither element is a gas (a gas/solid density ratio would be misleading).

## Fact-check disputes
Items from FACTCHECK.md applied differently from Gemini's suggestion, with reasons:
- **Al discovery year:** fact-check says 1825; the Wikipedia infobox we hold says 1824 (Ørsted). Kept 1824 (source in our raw data); both years are in the app note.
- **F discovery year:** fact-check suggests 1886 (first isolation, Moissan). The app's field is "discovered"; the Wikipedia infobox gives 1810 (recognised as an element, Ampère) and names Moissan for the isolation. Shown 1810, with the 1886 isolation in the note.
- **Cm lattice:** Wikipedia's Curium article gives a = 365 pm, c = 1182 pm, contradicting the fact-check's 349.6/1133.1 pm. Kept the fact-check values because they reproduce PubChem's measured density (dhcp, 4 atoms: 13.7 vs 13.51 g/cm³); the article's values give 12.0 g/cm³.
- **Cf lattice:** the fact-check gives ranges (a 338.0–338.4, c 1102.5–1104.0 pm); drawn at the middle of each range, ranges shown in the note.
- **Gas-density temperature basis:** fact-check says the CRC values (via mendeleev) are at 298.15 K; mendeleev's own metadata says 295 K. The validator follows the source's metadata; every gas agrees within tolerance on either basis.
- **Nuclear radii:** r0 ≈ 0.94 fm adopted, but NUBASE2020 has no charge radii, so after leaving IAEA LiveChart every nuclear radius is now an estimate (flagged). Measured charge radii (Angeli & Marinova) would need an openly licensed source.
- **Black phosphorus (oS8, layered, not molecular):** not added — SPEC §5 keeps P in "later", and white P is the standard reference form.
- **PubChem CPK colours (Pd "6985", Er empty):** no change needed; the app never reads CPK colours.
- **"thủy ngân" vs "thuỷ ngân":** kept the source article's spelling (both orthographies are standard); for moony to confirm with the other VI wording.
- **α-Fe COD a = 286.54 pm vs 286.65 pm:** no change; the app shows Arblaster's 286.65 pm and uses COD only for atomic positions.
- **Answers batch (RESEARCH.md › Answers, applied 2026-11-20):** (a) β-Sr uses COD 9008551 (Wyckoff, 887 K) rather than 9012760, whose paper is about strontium above 35 kbar (pressure of that entry unclear); β-Ca uses COD 9011034 (thermal-expansion study) rather than 9012732 (Ca–Sr alloy paper). (b) β-U (30 atoms) and β-Pu (34 atoms) exceed SPEC §5's 16-atom limit, so their temperature ranges show an honest card although COD has them. (c) Transitions listed only in FACTCHECK §3.2 (β-Be, β-Tl, β-Po, δ-Ce) are added as cards ("lattice constants not in our sources"), beyond the answer's suggested scope. (d) Ranges (Hf 1742–1760 °C, U 775–776 °C, Np 576–577 °C, Be 1254–1269 °C) are drawn at their middle; the range is in the note. (e) Co uses the 422 °C equilibrium value with the ≈450 °C heating value in the note. (f) Lindemann: the answer's single 0.10 is used for every structure; the per-structure literature values (fcc 0.11, bcc 0.13, hcp 0.09) are only quoted in the note. (g) Np boiling point: 4447 K is primary as the answer recommends, but the answer itself rates this low-confidence; PubChem's 4175 K stays visible as the alternative.

## Redesign decisions (21 Nov 2026)
Who proposed each: **moony** (owner), **Gemini study** (DESIGN-STUDY.md, committed with this entry) or **Claude** (the builder). Details are in SPEC.md §0, STYLE.md and REDESIGN-PLAN.md.

**From moony**
- **Redesign now; the milestone plan stops.** M5 was judged "too technical, looks bad quality"; "why should I look at the trends?". The audience is redefined as curious adults with no chemistry assumed (a PhD who learned chemistry decades ago, developers, documentary watchers) plus students and teachers. Pre-approved overnight ("do whatever makes sense and best"). *Why:* the dashboard surface hid the science behind jargon.
- **Quiz stopped and parked** on branch `wip-m6-quiz` (cde11a6, with two known UI bugs). **No "M<n>:" commit prefixes** from now on. *Why:* owner's direction.

**Adopted from the Gemini study**
- **A light, luminous studio look instead of dark bloom** (study §4.1). Claude's concrete answer is "porcelain & ink": warm paper, matte porcelain tiles, ink type. *Why:* legible in daylight on phones, looks crafted, costs little GPU, and is clearly not the dark photoreal showroom we compared against.
- **Plain-language labels, jargon one tap away** (study §4.4), as "human phrase · *jargon caption*". *Why:* the core complaint; jargon stays available for teachers and the PhD.
- **"Why it matters" hooks on every technical layer** (study §3.D) with their sources. *Why:* answers "why should I look at this?" before any number.
- **The scale dive** (study §4.5, table → inside a tile) as the road to the wow moment. *Why:* continuous camera moves explain where you are (NASA Eyes lesson).
- **Human-scale landmarks on sliders and charts** (study §4.6). Claude's limit: only landmarks computed from our element data (gallium 29.8 °C, lead 327 °C, iron 1,538 °C, tungsten 3,422 °C); any other landmark needs a source first (QUESTIONS Q15). *Why:* "never invent values".
- **Curated surprising pairs in Side by side** (study §4.7). *Why:* an empty picker is not an invitation.
- **Story lenses** (study §4.3: made in stars, in your body, in your phone) are accepted in principle but **shown only when their data is fetched and cited** (QUESTIONS Q11–Q13). *Why:* we do not have that data yet and must not invent it.
- **"Mysteries" instead of "Quiz"** (study §4.9): deferred, since the quiz is parked.

**Claude's decisions (and why)**
- **The single wow moment: heat iron until it glows.** It is reached through the scale dive. The room dims to a kiln colour, the 912 °C crystal snap (8 → 12 neighbours), melting and boiling follow. *Why:* real physics we already model (blackbody colour, Bain path), visceral for every audience, and continuous with the M4 design bar.
- **Places, not tabs.** Table → element card → {inside the atom, hold a piece / heat it, side by side, patterns}, with a back link always visible. *Why:* six equal tabs gave no hierarchy and created dead ends.
- **Flat, equal tiles by default;** heights only inside a named lens that opens with its question. *Why:* heights without a question are noise.
- **The legend is replaced by family names written on the table;** family filters move to Find. *Why:* less chrome; colour is never the only cue.
- **The data sheet is demoted, not removed,** behind "All numbers & sources" in the card. *Why:* keep every sourced fact, but not on first contact.
- **Other layouts (32-column, helix) move to the menu as history;** log scale is automatic per lens; °C is shown first and K in details. *Why:* choices nobody should have to make first.
- **System fonts only** (a serif stack for the voice, a sans stack for interface and numbers). *Why:* the deliverable allows no font files; two families keep the type calm.
- **Sound is optional and off by default,** synthesised with WebAudio, never on load. *Why:* DESIGN-RULES delight without nagging; no audio files.
- **Phone: a thumb-scrub loupe to pick tiles.** *Why:* the 18-column table makes tiles about 18 px wide on a 390 px screen; the loupe gives a 44 px-equivalent target.
- **Performance:** no post-processing by default, baked instanced contact shadows, atom and point budgets per quality tier, Heat ≥ 45 FPS on the headless baseline (was 20). *Why:* "smooth on phone" comes before effects.
- **Hook wording changed for accuracy** (marked ⚠ in REDESIGN-PLAN §4):
  - "noble gases *hardly* react" instead of "refuse to react" (some noble gases do form compounds);
  - the Teflon claim is dropped (it oversimplifies why Teflon is non-stick);
  - "explosive gases on the right" is dropped (the right edge holds the noble gases);
  - "a shoebox of gold weighs as much as a small adult" is replaced by the weight of a litre computed from our density (19.3 kg).
  Hooks whose wording still needs checking against their sources are queued as Q15.
- **The HERO slice is built first at full polish** (landing, table, first tap and card, phone loupe), then a review gate with Gemini and moony before the wow path. *Why:* DESIGN-RULES "first slice"; change direction while it is cheap.

## Gemini critique applied (21 Nov 2026, PLAN-CRITIQUE.md)
Rule from moony: the builder (Claude) wins on code and design craft; the sourced side wins on facts, but its claims are checked too. Each point is listed with who proposed it.

**Facts: accepted** (proposed by the Gemini critique; checked by Claude against `elements.json`)
- **Iron's 26 electrons "sit in" 4 shells (2, 8, 14, 2), not "fill".** *Why:* shells 3 and 4 are not full.
- **The first d cloud shown is a cloverleaf** (m = ±2, d_xy), and the caption says "four of the five d clouds are cloverleaf-shaped". *Why:* our default m = 0 (d_z²) is a dumbbell with a ring.
- **The lithium "small atom" hook is rewritten to contrast the fairly big lithium atom (128 pm) with its tiny ion between battery layers.** *Why:* the neutral lithium atom is not small. Small correction to the critique itself: carbon is 73 pm in our data, not 76; the conclusion stands.
- **Gas litre weights are given at 20 °C,** scaled by the ideal-gas law from PubChem's 0 °C values: helium 0.17 g, not 0.18 g. *Why:* the card also says "gas at 20 °C"; mixing bases would contradict itself.
- **"Soft, low-melting metals" is dropped.** *Why:* it is wrong for aluminium (660 °C) and bismuth (brittle).
- **The orbital hook is split into two clauses:** shapes decide joining, level jumps decide colours. *Why:* glow colours come from energy steps, not lobe shapes.
- **The water hook now says** oxygen's pull gives *bent* water molecules a positive and a negative end. *Why:* the polarity needs the bent shape (CO₂ is not polar).
- **Tungsten 3,422 °C cites PubChem** (our value); RSC lists 3,414 °C. *Why:* a citation must match its value.
- **De Chancourtois' system is called a helix** (a spiral wound around a cylinder). *Why:* accuracy.
- **Gold → mercury details add the completed 6s pair and relativity.** *Why:* the nuance curious readers ask about.
- **"3.5 million iron atoms per millimetre" leaves the card.** If an atoms-per-mm figure is ever used, it comes from the nearest-neighbour distance in the solid (about 4.0 million). *Why:* the covalent diameter is not the spacing in metal.

**Facts: rejected or modified**
- **The landing line "built from these 118 ingredients" is rejected** (Gemini critique). *Why:* only 94 elements occur naturally (`elements.json`); nobody has touched oganesson. Claude's line keeps the accuracy and adds warmth: *"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*

**Design: accepted** (Gemini critique; the specifics are Claude's craft decisions)
- **Thicker ceramic tiles,** sides 38 % darker, a satin glaze highlight on top, and pointer parallax of at most 1.2° on desktop only (off for touch and reduced motion). *Why:* flat pale tiles risk reading as a tilted HTML table.
- **The Heat map is a visible lens chip on the home screen** (a one-tap taste of the wow); the forge works for any glowing solid; "Heat it ▶" plays the whole sweep. *Why:* the main wow was 3 taps deep, on one element.
- **"Its light" also dims the room to the kiln colour.** One rule: daylight for matter, dark room for light and fire. *Why:* emission lines look lifeless on paper.
- **Top lens chips:** Families · Heat map · Melting point · Heft · Atom size · Grip on electrons; everything else under "More". *Why:* "grip" and "pull" sound alike to non-chemists, so they are not shown side by side; physical wonder comes first.
- **Story lenses move to work step 4** (In your phone first, since USGS GIP 167 is public domain). Made in stars waits for a licence and encoding check of the Wikimedia SVG. *Why:* strongest answer to "why should I care?", and the sources now exist.
- **Hand-written human lines for ~30 elements in the HERO slice;** others generated from data. They are checked by Q17. *Why:* no robotic text on the first taps.
- **Family names** (Claude's final choices):
  - Mineral metals (alkaline earth);
  - Other metals (post-transition);
  - Half-metals (metalloids);
  - Noble gases (caption "unreactive gases");
  - Nonmetals of life (without the list on the map);
  - kept: Soft, reactive metals · Workhorse metals · Salt-makers · Rare earths · Radioactive heavyweights.

  Gemini's Vietnamese drafts are adopted as drafts for moony. *Why:* dignified for adults, and accurate. One caveat: physicists use "half-metal" for something else, but in a periodic-table context the caption "metalloids" removes the doubt.
- **Sound is deferred** until the visuals pass the first review gate. *Why:* polish what everyone sees first.

**Design: kept as planned** (Claude)
- Iron stays the *suggested* first tap and the wow example. *Why:* its two re-stackings (912 °C and 1,394 °C) and its glow make the richest sweep; other metals get the same forge.

## Hero slice: build decisions (21 Nov 2026, Claude, within the approved style and plan)
- **One tokens file:** `src/design/tokens.js`. The build writes it as CSS custom properties; the same values drive the 3D lights, tiles and printed labels. *Why:* later views, possibly built in parallel worktrees, share one source of truth.
- **One shared kit:** `src/app/ui/kit.js` + `src/styles/kit.css`, with an `ui-` class prefix: button, chip, back link, icon button, segmented, door, fact, disclosure, banner, sheet, temperature slider, menu. *Why:* reuse and clear boundaries. The prefix avoids the kind of class clash that broke the parked quiz (`.lbl`, `.mark`).
- **Places in their own files:** `places/home.js`, `places/elementCard.js`, `places/lenses.js`. The 3D table is `views/table.js` + `views/tableArt.js` (geometry and textures) + `views/tableRegions.js` (map labels). *Why:* view code stays separable.
- **Legacy views are left alone on a dark stage** (`body.legacy`, `src/styles/legacy.css`, legacy variables renamed `--lg-*`). The card's doors lead to them, and a back link returns to the card. *Why:* they will be rebuilt against the tokens later; until then they must keep working (smoke tests cover them).
- **Symbols and atomic numbers are printed on the tile glaze** (atlas texture), not floated as 118 DOM labels. *Why:* they read as real specimen labels, never vanish to overlap culling, and cost no layout per frame. Names stay screen-space labels ≥ 14 px (hover; the phone loupe). The tiny printed atomic number is decoration; the card shows it in full.
- **Region labels on the desktop table only.** *Why:* phone tiles are about 20 px wide, so words would cover them. On phones the loupe and the card name the family.
- **Group and period numbers are no longer drawn on the table.** *Why:* calmer first view. The card states row and column ("Group 8 · Period 4 · Block d" in "All numbers & sources").
- **Tone mapping is Khronos PBR Neutral, not ACES** (STYLE.md updated). *Why:* ACES shifted the pigment hues.
- **Card name at 40/32 px instead of display 56/40** (STYLE.md updated). *Why:* the card is 392 px wide, and long names (Rutherfordium) must fit.
- **The melting fact gets a plain comparison instead of a mini ruler:** "Higher than copper (1,085 °C), lower than tungsten (3,422 °C)", built from a ladder of familiar metals in our data. *Why:* the ruler's labels collided; a sentence is clearer.
- **Gas litre weights are computed at 20 °C,** scaled by the ideal-gas law from PubChem's 0 °C values (the method is shown in the source popup).
- **Element lines:** 37 hand-written lines in our own words (`data/curated/element-lines.json`), each checked against the stored Wikipedia lead section. The text is fetched by the new step `node tools/fetch.mjs --only=wikipedia-intros`; revision ids are recorded. Every other element gets a sentence generated from data. Q17 asks for an independent check.
- **Vietnamese sentences use the 13 GDPT-2018 familiar names (đồng, chì, nhôm…) and the IUPAC name otherwise** (tungsten, not the Wikidata "vonfram"). *Why:* it follows the GDPT-2018 rule recorded earlier.
- **Software renderers keep their frame rate:**
  - No multisampling on a detected software renderer.
  - On the low tier, a big window renders at about 0.75 megapixels.
  - Fewer bevel segments on the low tier.

  *Why:* the redesign lets the table fill about 85 % of the width, roughly 2.8× more pixels than the old panel-squeezed table, and the headless baseline fell from 60 to 15 FPS. Real GPUs are unaffected and keep full quality.
- **Review screenshots are taken with `?q=med`** (full resolution, anti-aliased), while FPS is reported on the automatic path. *Why:* the images should show the design; the FPS should show what a fallback machine gets.
- **The Quiz tab and the 1–6 view keys are removed** (`VIEWS` no longer lists `quiz`). Keys now: arrows, `/`, Enter, Esc, `H` (next lens), `L` (other shapes), `F`.

## Hero round 2: Gemini's first-time-visitor review (`reviews/hero-r1.md`), 21 Nov 2026
Proposed by Gemini (reviewer); every call below is Claude's (design owner), with the reason. Scores in r1: clarity 4.0, ease 3.5, beauty 4.0, smoothness 4.0, delight 3.5. Numbers refer to the review's §3 problem list.

**Ease**
- **#2 / fix 1, phone sheet hides the three doors: accepted.** On phones the card shows name, line, the three facts in one strip (`At 20 °C · Melts at · 1 litre weighs`) and then the doors. The sheet stands exactly as tall as the doors need (measured, at most 62 % of the screen). The facts' notes, "across the table" links and all numbers follow below. Doors are compact (52 px, still ≥ 44 px). *Why:* the path to the wow is 3 taps on every screen (SPEC §0).
- **#1 / fix 2, × collides with "↗ across the table" when the card scrolls: accepted.** A compact title bar (tile · name · number) slides in under the × once the card scrolls; rows pass beneath it. *Why:* no overlap, and you always know which element you are reading.
- **#5, phone find is a malformed pill: accepted.** A round 44 px button like the menu; tapping it opens a field across the bar (CSS `:focus-within`, no extra state).
- **#6, phone lens chips clipped and the chosen chip faded: accepted.** The row fades only on the side that has more chips, and the chosen chip is scrolled fully clear of the fades.

**Clarity**
- **#8, heat map's 4th colour unexplained, weak stripes: accepted.** The key lists solid, liquid, gas, **not known** and **striped: predicted**. "Not known" is a blank paper tone `#E6DFD2` (was a beige that read as a fourth state), and the stripes are darker in this lens.
- **#8, ink on slate "solid" tiles: accepted, by lightening.** Solid is now `#AEB8C8` (ink 8.7 : 1). *Rejected alternative:* white symbols on the old `#7D8799`, which reach only 3.7 : 1.
- **#9, kelvin on a default surface and kelvin-first details: accepted.** The heat readout shows °C only. Every temperature in the app now reads "1,064 °C (1,337 K)" (one formatter, `fmtTemp`), including the older views.
- **#11 / fix 5, no family names on phones: accepted, with a key instead of map labels.** A compact two-column colour key sits under the table on the phone landing, and the thumb loupe names the family ("Iron · Workhorse metals"). *Rejected:* map labels on the phone table, whose tiles are about 20 px wide, so words would cover them. STYLE.md now allows the key on phones only.
- **#15 / fix 7, carbon looks broken in "Melting point"; tall columns hide back rows: accepted.**
  - Elements that never melt at 1 atm (carbon, arsenic: our data has no 1-atm melting point, only a sublimation point) stand at the temperature where they turn into gas.
  - The tallest of them gets a tag: "Carbon never melts: it turns to gas at 3,642 °C" (3,915 K, Wikipedia). The caption names both (computed from the data).
  - Numbers lenses look down about 7° more steeply (desktop φ 0.56 → 0.44 rad; phones 0.36 → 0.30).
  - *Why:* carbon now towers over tungsten, a true surprise, with no unexplained flat tile.
- **#16, "Hold a piece · heat it" for a gas: accepted.** Gases read "Hold a sample · cool or heat it".
- **#16, oxygen compared with mercury: accepted.** For gases the fact is "Turns liquid at −183 °C", with "Freezes at −219 °C". When it is close, a comparison with liquid nitrogen follows ("A little warmer than liquid nitrogen (−196 °C)"); it is computed from nitrogen's boiling point in our data.
- **#10, cryptic † after the line: accepted.** It is now a quiet "Source" pill whose tap area reaches 44 px.
- **#10, dotted underlines differ between desktop and phone: rejected.** Both use the same rule (`.card-v`). The r1 desktop images show it when enlarged; it was lost to image scaling.
- **#12, "3D · REAL DATA" under the wordmark: accepted, removed.** Trust stays where it is earned: every value opens its source, and "Sources & credits" is in the menu.

**Beauty**
- **#14 / fix 3, tiles read like matte keycaps: accepted, our way.**
  - The glaze reflects a soft studio computed in the shader (`tableArt.js` `GLAZE`): warm walls, the paper floor, a long softbox low behind the table (a sheen on the far tops) and a key softbox front-left (a bright catchlight along every front bevel).
  - Tops at roughness 0.16, sides 0.34, the bevel a little tighter (0.07 → 0.055).
  - Each tile's glaze varies ±2.5 %, like handmade ware, and a resting tile darkens slightly where it meets the paper.
  - The paper gets a faint grain and deeper edges.
  - *Rejected:* `MeshPhysicalMaterial` clearcoat on med/high, and a prefiltered environment map. The clearcoat adds a second specular pass. The environment map was tried and measured back to back: on a software renderer it added about 17 ms a frame on the landing (33 → 50 ms median under the same heavy load). The computed studio looks the same on every tier and costs a few arithmetic operations.
- **#3, "Nonm / of" clipped by the open card: accepted, and it was a bug.** The free area was measured while the card was still sliding in (18 px off). It now uses the card's resting position, and labels keep 8 px from it.
- **#4 / fix 6, name tags cover the tile's number: accepted.** Hover names, "Try iron" and lens notes hang above the tile's back edge, with a caret.
- **#7, "Radioactive heavyweights" hugs the screen edge: accepted.** It now sits on two lines, and names written on the table are hidden rather than drawn closer than 14 px to an edge.
- **Phone landing "too much empty beige void" (fix 5): accepted.**
  - The colour key fills the space under the table.
  - The flat table is tilted to show the glazed tile fronts (φ 0.36 → 0.5 rad) and framed about 5 % larger.

**Delight**
- **#13 / fix 1, no camera glide on phones: accepted.** A tap glides the camera in above the sheet until about five tiles fill the width, angled (φ 0.66) so the lifted tile reads as an object among its neighbours. If the sheet settles mid-glide, the glide's goal moves (`OrbitRig.retarget`) instead of jumping.
- **#16 / fix 8, "Side by side with Ruthenium": accepted.**
  - Common elements get a familiar or surprising partner: iron → gold, aluminium → iron, lithium → iron, tungsten → gold, bromine → mercury, oxygen ↔ nitrogen, helium ↔ osmium, and so on (`PAIRS`).
  - The door says why, computed from measured values only:
    - "with gold: a litre of gold weighs 2.4× more";
    - tungsten: "almost exactly as heavy, litre for litre";
    - bromine: "both are liquid at room temperature";
    - helium: "a litre of osmium weighs 136,000× more".
  - Predictions are never used for a hook.
- **Picking up a tile springs (Claude's addition):** it rises with a 10 % overshoot and settles in about 350 ms; landing and hover are critically damped, and reduced motion removes the overshoot. STYLE.md §7 is updated. *Why:* the tactile "lifted from a tray" feel the reviewer liked, made physical.

**Smoothness**
- **Fix 9, zoomed-in desktop at 30 FPS: accepted, and fixed at the cause.** Measured on the r1 build: hiding the 118 overlapping contact-shadow quads restored 60 FPS.
  - **Contact shadows are baked** into one texture on one plane (one blended layer), re-baked only when the shape or the lifted tile changes. They fade out while tiles travel to a new shape and fade back once the tiles land.
  - **Front rows are drawn first** (instance order), so hidden fragments are rejected early.
  - **Adaptive resolution on software renderers.** The tiles' own shading then limited a screen full of tiles. On a software renderer (low tier, auto quality), when frames take longer than 20 ms the internal resolution steps down from 0.75 to at least 0.3 MP. It steps back up once the camera has moved well back out.
  - Real GPUs are unaffected.
  - Same-load A/B, r1 vs r2: landing 16.7 vs 16.7 ms; zoomed in 33.3 vs 16.7 ms median.

**Not done in this round (and why)**
- **The forge wow (heat a piece until it glows):** the reviewer's "land the forge wow". It belongs to the next slice, Hold & heat (REDESIGN-PLAN work step 2). The hero slice only opens its door.

## Hero round 3: Gemini's cold review of round 2 (`reviews/hero-r2.md`) and the forge moment, 21 Nov 2026
Proposed by Gemini (cold reviewer). The calls are Claude's (design owner); the forge scope is moony's: "build the wow moment now as part of the hero path, scoped to what the hero path needs". Round-2 scores were clarity 4.0, ease 3.5, beauty 4.0, smoothness 4.0, delight 3.5. Numbers refer to the review's §3 list.

**The wow moment: built**
- **Hold a piece · heat it** (STYLE.md §9, SPEC §0) is now the iron card's door. It leads to a new place, `places/heat.js`, over the existing simulation in a new look (`views/sample.js`, `look: 'forge'`).
  - **The scale dive:** the camera plunges straight down into the tile until its glaze fills the screen. The glaze colour crossfades (at ~70 %), and the camera then draws back out of the crystal. The chrome steps aside meanwhile. Reduced motion: a short crossfade.
  - **The stage:** iron's measured crystal as glazed beads in the family pigment, in a hairline glass cube on a paper slab, in daylight.
  - **The thermometer:** one big control. Event ticks come from the data (912 °C re-stacks, 1,394 °C, 1,538 °C melts, 2,861 °C boils), with familiar metals' melting points as flags (lead, copper).
  - **Buttons:** "Heat it ▶" plays the sweep and stops just past each event so its caption can be read. "Room temperature" starts over.
  - **The room dims to `--kiln`** (600 ms) while the metal glows. The glow colour is the blackbody colour of the temperature (Planck × CIE, CODATA constants), now decoded as sRGB so it reads dull red at 700 °C, orange at 1,000 °C and yellow near boiling. The hot metal lights its surroundings (one light) and blooms softly (one sprite).
  - **One quiet caption** names each moment: "912 °C: the atoms re-stack. Each now touches 12 neighbours." (neighbour counts from the phase data), melting, boiling and the way back down.
  - **The way back:** the back link returns to the iron card in daylight, and the table's heat-map temperature is restored.
- **Scope:**
  - Every element with a measured crystal that is solid at room temperature uses the forge. All others keep the old sample view.
  - "About this crystal ▾" and sound (the 912 °C "tink") are not built. *Why:* STYLE §9 keeps the stage free of other panels; sound stays deferred (earlier decision).
  - An undrawable phase (e.g. β-uranium) gets a caption instead of an empty box.
- **Rejected:** a separate full-screen "dive" movie. *Why:* the dive uses the real table and the real crystal, so it costs nothing to load and works the same for every element.

**Ease**
- **#1 / fix 1, gold's card clips previous / next: accepted.** Previous / next now sit in an always-visible footer on desktop.
- **#2, no scroll cue in "All numbers": accepted.** The card body fades out at the bottom whenever more waits below (desktop and phone).
- **#3 / #14 / #22 / fix 2, no reset after zooming, hero text over tiles: accepted.**
  - Once the table is zoomed or turned away from its home framing, a "⌂ Whole table" pill appears, and the hero line (and the phone key) step aside.
  - Re-framing never undoes a zoom.
- **#4 / fix 3, tall columns hide Tc, Mo, H: accepted.**
  - Columns are lower (the tallest is 3.6 scene units instead of 4.6) and seen more from above (desktop φ 0.44 → 0.36).
  - *Not taken:* fading occluding columns. *Why:* it is costly and confusing; the steeper view solves most of it.
- **#21, the thumb-scrub tile has no visible highlight: accepted.** The tile under a scrubbing thumb rises like a picked tile and gets the verdigris ring.
- **#7, phone chips cut mid-word: accepted.** All lens chips are in view on phones, in two rows; no horizontal scroll.

**Clarity**
- **Region labels (§1): partly accepted.**
  - "Mineral metals" now sits in row 1 right of H, above Be.
  - Vietnamese "Nhóm tạo muối" and "Kim loại phóng xạ nặng" keep more distance from He and Ac.
  - *Rejected:* moving "Half-metals" off B, and a separate label for H. *Why:* B is the first member of the half-metal diagonal, and one name per family is the rule; the phone key, the loupe and the card name every family.
- **#11, no stripe / pale key in Melting point and Heft: accepted.** Every lens banner keys its stripes ("striped: predicted") and pale flat tiles ("not known").
- **#15, unexplained dotted underlines on phone: accepted.** "Tap a value to see where it comes from." sits under the fact strip.
- **#24, helium filed under "not measured": accepted.** Helium's flat tile carries "Helium never freezes at normal pressure". The caption says so, and "not measured" is left for the others.
- **#12, the exception pill: accepted.** It now reads "fills its shells out of the usual order: 5d: 9 → 10, 6s: 2 → 1".
- **#25, abridged atomic weight presented as the standard: accepted.** It is labelled "Standard atomic weight (abridged)". The full CIAAW value (196.966570(4)) is the next row in "more".
- **#26, actinium striped in one lens and not the other: rejected, not a data error.** Its melting point is flagged predicted in both records our lenses read. The stripes were hard to see, so they are now stronger on desktop and wider on phones.
- **#13, "Heft" may be unclear to non-native readers: rejected.** It is the chosen plain word (REDESIGN-PLAN); the banner's hook explains it at once, and Vietnamese uses "Độ nặng".
- **#16, phone sheet: accepted.**
  - The peek shows a sliver of what follows, and the family caption ("transition metals") is back on phones.
- **#23, Vietnamese card headed "Iron": accepted.** For the 13 elements whose familiar names GDPT-2018 keeps, the Vietnamese card leads with that name (Sắt, Đồng…), followed by the international name. Sentences already used it.
- **#5, Vietnamese "nguyên / tử" split: accepted** (no-break space).

**Beauty**
- **#8, dark numbers on blue liquid tiles: accepted.** Atomic numbers are printed larger and bolder; they already take the same light ink as the symbol.
- **#9, unreadable ghost tiles: accepted.** The glaze fades toward paper but the ink stays dark (between ink and ink-2, ≥ 7 : 1).
- **#10, muddy stripes on phone tiles: accepted.** On phones the stripes are wider and softer.
- **#19 / fix 7, the floor ring under a lifted tile: accepted.** The ring now frames the lifted tile itself.
- **#6, tiles peeking behind the phone top bar: accepted.** The phone top scrim is stronger while a card is open.
- **#20, washed bottom rows behind the chips: accepted.** No bottom scrim while a card is open on desktop.
- **Phone vertical void (fix 6): partly accepted.**
  - The prompt is now a page heading under the top bar, so the screen reads heading, table, key, chips.
  - The table itself stays width-bound. *Why:* rotating or cropping the table would make it less recognisable.
- **#17, one value in teal: rejected.** It was the hover colour under the screenshot tool's pointer; the shot now moves the pointer away.

**Delight**
- **#18 / fix 3, Heft's log scale flattens gold: accepted.** Heft is linear: gold and osmium tower, gases stay at the floor. The caption explains why.
- **The forge**, above.

**Smoothness**
- **Fix 9, the first second of a deep zoom: accepted.** On software renderers the resolution now steps down as soon as the camera is much closer than the home framing, instead of waiting for slow frames.
- **Fix: a real bug found while building the dive.**
  - Closing the card re-framed the table while the camera was gliding, which retargeted the glide.
  - The table no longer steers the camera during a dive.
