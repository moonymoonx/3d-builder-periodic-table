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

## Hero round 4: the forge's look (`reviews/hero-r3.md`), 21 Nov 2026
Gemini's cold round-3 review rated clarity, ease, beauty and smoothness 4.0 and delight 3.5. It put the table and cards at 4.5+, and the forge's climax below them: "sterile CAD wireframe + matte coaster", "flat spheres", "molten iron like orange cheese puffs", "boiling iron losing its glow". moony asked for beauty and delight at 4.5 within STYLE.md and smooth on phones. The calls are Claude's; numbers refer to the review's §3.

**Correction first.** Round 3's entry says numbers lenses were "seen more from above (φ 0.44 → 0.36)". That change was never applied; the code still had 0.44 (only the column height changed). It is applied now (0.33, below).

**The forge, made beautiful (E1–E4; fix 1): accepted**
- **Stage (E4):**
  - The CAD wireframe is gone. The vessel is glass that shows only at its edges (a Fresnel shader).
  - The flat coaster is now a rounded, glazed ceramic hearth. It catches the glow: the metal's blackbody colour pools on it, and the glow lights it (one light).
  - A warm ember gradient sits behind the specimen on the kiln stage.
  - The crucible is wider, so the melt can spread.
- **Unit-cell cue (STYLE §6):** ink spokes join one atom to every neighbour it touches: 8 in iron's bcc, 12 after the 912 °C re-stack (counted from the actual positions, not drawn by hand). They follow the Bain re-stack and turn kiln-coloured in the dark. *Why:* the caption's claim becomes visible at a glance.
- **Glowing solid (E3):**
  - Hot atoms glow brightest where they face you and darker toward the rim, whitening at the core as the temperature rises, so every bead stays a sphere.
  - Each hot atom has its own soft incandescent glow: one instanced, billboarded, additive draw that shares the atoms' positions and vibration. It is drawn on medium and high tiers only. Measured on the software renderer (low tier), it halved the glowing states' frame rate (700 °C: 30 FPS median); there, the beads' own incandescence and a stronger aura carry the glow (60 FPS).
  - The big central blob is now a faint aura behind the crystal.
- **Molten pool (E1):**
  - The melt settles into a low, wide pool, about 40 % of the crystal's height.
  - It is drawn as one round, flat-topped surface whose edge rolls down like a meniscus (a lathe of y = (1 − r⁴)^¼). It has slow convection cells and a brighter meniscus, in the blackbody colour.
  - It rises with the collapsing crystal. Once formed it *is* the liquid: the atoms jostle on beneath it, hidden, and are drawn again when it boils or freezes. The melt is kept round (never in the crucible's corners), and the fluid keeps wall-clock pace on slow frames (up to 4 sub-steps).
- **Vapour (E2):**
  - The glow only grows with temperature: at 2,950 °C the vapour is bright warm white with larger glows.
  - It is drawn sparse (40 % of the particles, smaller beads) so it reads as atoms flying apart.
  - The hearth stays lit.
- **Rejected:** post-processing bloom, a screen-space metaball liquid and a physical (transmission) glass. *Why:* each costs a full-screen pass or heavy shading on phones and software renderers. The cheap pieces above give the look at 60 FPS.

**Thermometer (D1, F3, G3; fix 2): accepted**
- Every event is labelled ("912 °C re-stacks", "1,394 °C re-stacks", "1,538 °C melts", "2,861 °C boils"), in up to three staggered rows with leader lines. A label is shortened to its number only if no row fits; none is ever dropped, including 912 °C on phones.
- The rail has a thermometer bulb at its cold end (C3), and "Heat it again ▶" already appears at the top.

**Dive (E5, 4): accepted**
- 12a and 12b are now real in-flight frames. The shot tool runs the page on Playwright's fake clock, pauses it, taps the door and advances exactly 450 ms or 1,400 ms.
- The selection ring steps aside during the plunge.
- *Rejected:* a 2× symbol atlas for the dive close-up (B3). *Why:* about 4× the texture memory for a frame seen for a quarter second before the crossfade.

**Table and card fixes: accepted**
- **A1:** "Mineral metals" is written on one line in row 1, right of H, clear of Be (EN and VI).
- **A4:** columns are lower (tallest 3.0) and the view steeper (φ 0.33), so Tc and Mo show whole; tall columns darken toward the base, like carved blocks (E6).
- **A5:** carbon's tag extends left and helium's right, so both show.
- **A3:** gold's "All numbers & sources" sits clear of a shorter (22 px) edge fade, and the card is a little tighter.
- **F2:** phones see numbers lenses from lower down with taller columns (×1.7), so heft reads as heights.
- **A6:** the first hover over any tile dismisses "Try iron".
- **A2:** with a card open, the lens chips are hidden, leaving one focus. The card's "across the table" links switch lenses, and the chips return with "← All elements".
- **F4 / D2 / D3:** phone cards have the same always-visible previous / next footer as desktop. The sheet stands just clear of the doors, and the edge fade falls on empty paper, so no clipped sentence peeks below them. *Not taken:* moving the boiling note back beside the melting value on phones, which would push the doors below the fold.
- **C1, C2:** the configuration note now reads "one electron sits in a different shell than the usual order predicts: …"; "Atomic weight (rounded)" replaces "Standard atomic weight (abridged)".
- **F5:** the phone prompt reads "Touch and slide across the table — lift to open."

**Rejected or deferred**
- **B2, a "tap a value" hint on desktop cards: rejected.** On desktop, values show the pointer cursor and turn verdigris on hover; the hint stays on phones, where there is no hover.
- **G1, Pu / Np / Ac striped at 1,000 °C: deferred.** Stripes follow the predicted flags in our sources (e.g. actinium's melting point is flagged as an estimate). Striping only when the deciding boundary is predicted is a sound rule, but it needs a data review first.
- **B1, softer stripes on the heat map: deferred** (stripes were already softened on phones in round 3).
- **F1, the phone landing's empty bands: not changed again.** The table is width-bound; round 3 made the prompt a heading and added the colour key.
- **D4, top scrim when zoomed: deferred** (minor; the "Whole table" pill is the exit).
- **Smoothness:** real-device GPU numbers cannot be measured in this sandbox (headless software rendering only).

## Hero round 5 (`reviews/hero-r4.md`), 21 Nov 2026
Gemini's cold round-4 review: clarity 4.5, ease 4.5, beauty 4.0, smoothness 4.0, delight 4.0. The hero slice passes (all ≥ 4). moony asked to push beauty and delight to 4.5 on six named points. The calls are Claude's (design owner).

- **Molten iron reads as an "orange Jell-O dome": accepted, using the review's option A (atomic continuity).**
  - The dome is gone. The melt is drawn as its atoms from solid to liquid to gas: a dense, slowly swirling pool of incandescent beads. The beads are a little larger, so they blend, and each has its soft glow (medium/high tiers).
  - The melt is hotter at the centre and a little cooler at its edges (it also gives the solid "hotter crevices").
  - *Rejected:* option B (a refined opaque pool surface). *Why:* it keeps the scale break the review names (atoms → pudding → atoms).
- **The neighbour spokes look like a "spider / starburst", illegible at 12: accepted.**
  - The flat, always-on-top lines and dots are gone. One atom a little inside the front corner and the neighbours it touches are now:
    - verdigris beads by day, with warm-gold rims once the metal glows;
    - joined by depth-tested 3D rods;
    - revealed by a cutaway, where the atoms in front of them shrink back.
  - Counts come from positions (8 in bcc, 12 in fcc), and the cell follows the Bain re-stack.
- **The thermometer's heat gradient runs backwards: accepted.** The fill now goes charcoal → ember → orange → yellow-white, so the cold end is dark and the hot end bright, like the metal.
- **The 1,394 °C stem crosses "1,538 °C melts": accepted.**
  - Each label extends away from its nearest neighbouring tick. Rows are used bottom-up, and no label may cover another tick's stem. Only if nothing fits is a label shortened to its number (1,394 °C on desktop now reads "1,394 °C").
  - Every tick still has a label.
- **Phone heft buries elements: accepted.**
  - Phones see numbers lenses more from above again (φ 0.5) with a lower height cap (×1.3), so osmium, iridium, platinum, gold and the lanthanides stay visible behind row 7.
  - Predicted columns are slightly ghosted and striped on every face, so a guessed density never stands like a measured monolith.
- **Desktop "Heat it" playback hitch (50 ms p95): addressed, not proven.**
  - Removed per-frame work: the thermometer rewrites only what changed; the hidden table skips its colour pass on temperature changes.
  - Removed per-event work: atoms are one unit sphere scaled per instance, so phase changes no longer rebuild geometry.
  - With four Claude sessions sharing the CPU (load 6–12), an alternating A/B against round 4 was inconclusive: round 4's own p95 swung between 33 and 150 ms from run to run.
- **Not taken this round:** the gas's "frog eggs" look (§B8; the vapour now fills the vessel, as the shot waits for it to spread), the phone landing's empty bands (§F11) and the card's phone "across the table" asymmetry (§F12, by design in STYLE §5).

## Hero round 6 (`reviews/hero-r5.md`), 21 Nov 2026
Gemini's cold round-5 review: clarity 4.5, ease 4.0, beauty 4.0, smoothness 4.0, delight 4.0; verdict "already better on feel overall". moony asked for small, safe changes toward 4.5. The calls are Claude's.

- **The thermometer's thumb lags its ticks and fill; the bulb looks bitten: accepted.**
  - A drawn knob now sits exactly where the fill ends (same scale as the ticks). The native thumb stays invisible and only takes the drag.
  - The bulb is drawn above the rail.
  - Tick labels sit higher, clear of the knob.
- **The bare "1,394 °C" tick: accepted, and it was a bug.** The rule that keeps labels off other ticks' stems had its two row tests inverted, so a label could be refused room it had (and in round 5 that is what left 1,394 °C bare). Fixed: it reads "1,394 °C re-stacks" again, and no label crosses a stem.
- **The unit-cell cutaway is messy in the kiln and hard to count by day: accepted.**
  - By day the atoms in front are removed cleanly (no leftover pebbles). The chosen atom is ink and the neighbours it touches are verdigris, so "one atom touching 8" can be counted.
  - In the glowing kiln the cutaway is not shown (it read as a fiery cavity). The caption and the readout ("solid · 12 neighbours each") carry the 12.
- **The phone card hides its details: accepted.** A "More about Iron ⌄" row under the doors pulls the sheet up.
- **"Heat map" reads like a colour gradient: accepted.** The lens is now "Solid, liquid, gas" (VI "Rắn, lỏng, khí").
- **Not taken:** min/max labels on the heat-map slider (the readout and the "Room temperature" button frame it), and FPS re-measurement this round (no rendering change; the machine is shared by four sessions, load ~17).

## Merge review: `view-patterns` (Patterns across the table + Side by side), 21 Nov 2026
Reviewed by the main session (design owner) against STYLE.md and the PARALLEL.md checklist. The session's own decisions are in `NOTES-patterns.md` (kept in the repo as the record); its router lines are in `WIRING-patterns.md`.

**Checklist: passed.**
1. **Tokens:** the only literal colours are ink-derived alpha shadows and lines (the same as the kit's).
2. **Plain language:** each chart opens with a question and a plain answer; jargon is a caption ("Grip on electrons · first ionization energy").
3. **Sources:** every dot and every value opens its source, and the answers' Source pills list the pages behind the words. Claims were checked against those pages (one unverifiable one dropped), and `tests/patterns.test.mjs` pins each headline's premise to the data.
4. **Layer 1:** back links are present and the controls are kit pills and segmented controls. Small type appears only in the atomic numbers printed on tiles (decoration, STYLE §4).
5. **Look:** daylight, ink on paper, family beads, verdigris for the picked element; side by side shows glazed porcelain atoms at true scale with contact shadows.
6. **Speed:** a 60 FPS median in every state of its review set.
7. **Vietnamese:** complete (familiar GDPT names in sentences); nothing clipped at 390×844.
8. **Tests:** unit 33/33 (16 new), validator passes, smoke 31/31. The build is 1,585 KB.

Consistent with the hero: same type scale, kit, back links and card language. Nothing sent back.

**Proposals** (`PROPOSALS-patterns.md`):
- **P1, lens banners link to the pattern behind them: accepted, scheduled.** Applied after the remaining merges, with its own way back. From the table with no card open, "back" must return to the table, not to a card. Today's back link out of a place always returns to the card and names its element.
- **P2, "All numbers & sources" rows open their pattern: accepted and applied.** Rows with a pattern behind them (melting, boiling, heft, sizes, grip, pull, appetite, weight, crust, discovered, felt pull) carry the same "↗" as the card's facts, with a 44 px tap area.
- **P3, the Vietnamese back link uses the familiar name: accepted and applied.** It uses the card title's own rule (Sắt, Đồng…).
- **P4, a loupe in the kit: accepted, scheduled.** Two places now draw it (home, patterns), which meets the PARALLEL.md rule. Moving it into the kit touches home and the patterns place, so it waits until the atom and sample branches are merged.
- **P5, a generic `--set=<name>` loader in `tools/shots.mjs`: accepted** (applied in the branch).
- **WIRING part 2, retire four legacy trends/compare smoke steps: accepted.** They tested the retired dark-stage panels; the `// ---- patterns ----` block covers the same ground.

**Fixed at merge:** the hero shot script's "All numbers" step now targets the visible sheet. The side-by-side place has its own (hidden) kit sheet, so `.ui-sheet__body` matched two elements.

## Hero round 7 (`reviews/hero-r6.md`), 21 Nov 2026
Gemini's cold round-6 review: clarity 4.5, ease 4.0, beauty 4.0, smoothness 4.0, delight 4.0 (passing). moony listed the points to fix; the calls are Claude's.

- **A stale "Iron at room temperature" caption at 396 °C: accepted.** A caption now names the warm-up ("Warming up: the atoms shiver harder as the temperature climbs.") between room temperature and the first glow.
- **Solid bulb vs hollow knob: accepted.** The knob is the one thing you drag: a solid cream disc with an ember ring and a shadow. The bulb is the thermometer's reservoir, smaller and in the rail's own colour.
- **Clipped text above the phone card footer: accepted.** While the sheet only peeks, it ends exactly at the "More about …" row and the edge fade is off (the row is the cue); nothing from below peeks.
- **Cramped stacked tick labels on the phone thermometer: accepted.** On phones, close re-stack ticks share one label below the rail ("912 · 1,394 °C re-stacks", with short stems), and the row above keeps melting and boiling. Phones drop the landmark flags when that row is needed.
- **The daylight forge start: accepted.**
  - The glass vessel is rounded and its Fresnel term sharper: faces nearly clear, edges catching the light.
  - The beads reflect the same soft studio as the table's tiles and are a little shaded toward the inside.
  - The camera frames the whole hearth clear of the panel, and a soft contact shadow grounds the hearth.
- **Column-on-symbol occlusion in the height lenses on phones: accepted.** Phones look a little more from above (φ 0.45) with a lower height cap (2.6).
- **Molten / heating frame pacing: not changed this round.** Round 5 already removed per-frame and per-event work. With three other sessions on the machine (load 15–20), no measurement here can show a difference; it waits for a quiet machine.
- **Also, from the review:**
  - The vapour's per-atom glows and hearth glow are softer, so the vessel floor no longer blows out.
  - STYLE.md now matches round 6, with no unit cell in the kiln (the review noted the mismatch).

## Merge review: `view-sample` (Hold a sample: liquids, gases and honest cards), 21 Nov 2026
Reviewed by the main session against STYLE.md and the PARALLEL.md checklist. The session's own decisions are in `NOTES-sample.md` and its router lines in `WIRING-sample.md` (both kept as the record).

**Checklist: passed.**
- **Look and language:**
  - The same look and chrome as the forge: hearth, glass, thermometer panel, captions, kiln dimming.
  - Plain words: "a gas of N₂ molecules flying at about 1,840 km/h", computed from the data.
  - Honest cards for molecular crystals ("we do not draw molecular crystals yet") and for never-made elements ("Nobody has ever held a piece of oganesson", predictions marked).
  - Every value is sourced; Vietnamese uses the familiar names.
- **Speed:** frozen mercury and liquid nitrogen, re-measured at load 6–7, hold a 60 FPS median on desktop and phone (averages 42–57). The session's 20–30 were taken under heavier load.
- **Tests:** unit 33/33, validator passes, smoke 40/40 (31 + 9 sample steps); the build is 1,644 KB.
- **Consistency with the hero:** once rebased, the place inherits the round 5–7 forge look (rounded Fresnel glass, unit cell by day, atoms from melt to vapour). Nothing sent back.

**Proposals** (`PROPOSALS-sample.md`):
- **§1, `views/sample.js`:**
  - **Accepted and merged:**
    - "draw radon's measured gas and liquid";
    - "keep whole molecules in the sparse forge gas" (combined at the rebase with the forge's per-instance radius and cutaway);
    - "glide to the vessel when it changes size";
    - "a condensing gas becomes a liquid of touching beads".
  - **Dropped as superseded:** "a cool liquid is drawn as its atoms". Round 5 already draws every melt as atoms; the pool is never shown.
- **§2, the card's second door worded by the sample place: accepted** (merged; the router passes `sampleDoor`). Mercury now reads "Hold a sample · cool or heat it".
- **§3, a shared thermometer in the kit: accepted, scheduled** after the atom merge, together with the patterns loupe (P4). The kit version will adopt this session's placement improvements:
  - three placement orders;
  - one stem for ticks closer than 14 px;
  - flags that shift inward;
  - measured text widths.

  The "swapped stem test" it reports was in the d1e17ae `heat.js`; `master` has carried the correct form since round 6 (87f474f).
- **§4, tokens:** the panel radius is done now (the forge panel uses `--r-card`). Kiln-panel tokens (ember on kiln `#F0874F`, its link `#F0A070`, the panel ground) and one temperature-ramp token: accepted, scheduled with §3.
- **§5, retire the legacy sample view: accepted, blocked** on carbon's graphite ↔ diamond switch in the forge ("About this crystal ▾"). Then the `hold` view takes the name `sample`.
- **§6, smaller things:**
  - The Vietnamese back link: done at the patterns merge (P3).
  - **Mercury's card bug: fixed by the main session.** For mercury the note now reads "The lowest melting point of any metal". The ladder's coldest rung was mercury itself, so the card had printed gallium's 29.8 °C under mercury's name.
  - **Never-made elements on phones: fixed.** Predicted temperatures are whole degrees ("≈ 52 °C"), and the phone fact strip says "not known".
  - **Scheduled:**
    - No-break spaces between numbers and units in the shared formatters (together with the tests that match them).
    - A phone check of the hearth framing.
    - A guard in `heat.js` for a non-forgeable element opened by URL (the router already sends those to the sample place).

## Merge review: `view-atom` (Look inside the atom), 21 Nov 2026
Reviewed by the main session against STYLE.md and the PARALLEL.md checklist, with its shots (`/workspace/out/redesign/atom/`) beside the hero's. The session's own decisions are in `NOTES-atom.md` and its router lines in `WIRING-atom.md` (both kept as the record; the decisions there are accepted except where noted below).

**Checklist: passed.**
1. **Tokens:**
   - It uses the kit sheet, chips, buttons and disclosure, and the type steps.
   - Its only literals are the forge panel's kiln values (ember on kiln `#F0874F`, the panel ground, kiln-text alphas), the same as `heat.css` and sanctioned by STYLE §9 (→ proposal #3).
   - The 11 px atomic number on the badge tile is decoration, as on the table's tiles.
2. **Plain language:** a human phrase first, with the jargon as a caption ("Pull felt by the outer electrons · *effective nuclear charge*"), and "thin round gaps where the electron is never found" for radial nodes.
3. **Sources:** every number is tappable for its source: shell counts, wavelengths, the "2,542 listed by NIST" (the data's `lines.n`) and the nucleus size (marked as an estimate).
4. **Layer 1:**
   - One visible control: the ± proton stepper in the always-visible footer, each button naming where it leads.
   - A back link; kit targets (the inline Source pill and values extend their tap areas to 44 px).
   - A 14 px floor with 13 px captions; reduced motion makes the camera, the reveal and the kiln instant.
5. **Light:**
   - Daylight for the clouds; the kiln (`#kiln`, `body.kiln`, not restyled) for "Its light".
   - Alpha-blended ink stipple, phase inks only for the newest electron's cloud, thin glaze on medium/high tiers.
   - No bloom and no additive glare.
6. **Speed:** after the merge, all measured states hold a 60 FPS median (two passes, each with a table-landing control, load 4–6). Phones average 60; desktop p95 33 ms, the same as the control (`atom-merged/fps.txt`).
7. **Languages:** English and Vietnamese complete; the phone step checks that nothing is wider than 390 px. One Vietnamese fix (below).
8. **Tests:** unit 39/39 (6 new), validator passes (one check added), smoke 44/44 twice, index.html 1,703 KB.

Consistency with the hero: the same card family (a 392 px side card / bottom sheet, the compact title on scroll, the footer), the same dive language (into the tile's glaze, out through the shells) and the same kiln in "Its light". Nothing sent back.

**Proposals** (`PROPOSALS-atom.md`):
1. **`color.js`, the spectrum's ends: accepted.** The fix is made in the shared module, not only in the atom band.
   - **Problem:** the analytic CIE fit's x̄ falls off faster than its ȳ past ~650 nm, so 700 nm came out olive (#8c4a00) and 749 nm green (#008946); below 400 nm the colour turns teal. Real spectral light keeps one hue there (CIE 1931 spectral locus).
   - **Fix:** `wavelengthToRGB` reads the hue no further out than 400 and 680 nm; only the brightness follows the wavelength. The validator checks that 700 and 749 nm stay red and 385 nm violet.
   - **Why 680 nm (the session's tested choice), not 650 nm:** at 650 nm the fit's chromaticity is still right, but the existing white-add gamut mapping turns the true deep-red locus crimson (#ff0055), so neon's cloud would read pink. The fit's 680 nm hue displays as a clean red.
   - `lineColour()` in `ui/spectrum.js` is now a thin wrapper.
2. **The card's glow swatch: accepted, removed** from "All numbers & sources" (Q-atom-1).
   - A mix of the 8 strongest lines contradicts known lamp colours: neon #00ff5d (green), iron #00ffb2, calcium #ff00fb. The tail fix does not save it: neon's mix is dominated by its 540 nm line.
   - `glowColour` stays in `color.js` only for the validator's sodium check, with a comment saying why it is not shown.
3. **Kiln tokens (`kilnPanel`, `kilnAccent`): accepted, scheduled** with the sample session's identical request (§4). One tokens pass covers the kiln panel, ember on kiln and the temperature ramp, together with the shared thermometer (sample §3).
4. **Retire the four legacy atom-panel smoke steps: accepted** (the PROPOSAL commit is merged). The `// ---- atom ----` block covers their behaviour.
5. **`--set=atom`: accepted, moved** to `tools/shots-atom.mjs`. Since the patterns merge (P5), every set lives in its own file and the generic loader finds it.
6. **Retire the legacy panel: done.**
   - Removed: `ui/atomPanel.js`, the legacy `buildSpectrum` strip, `glowOf` and `L_COLORS`. Nothing imports them now.
   - The legacy `spec.*` strings in `i18n.js` are now unused; they go with the next i18n tidy-up.
7. **Vietnamese back link: already done** on master at the patterns merge (P3). Checked in the reshoot: "← Sắt", "← Natri".

**Open questions** (`NOTES-atom.md`):
- **Q-atom-1** (keep the 8-line glow colour anywhere?): **no.** See #2. The atom place shows the lines themselves and colours the outer shell by them, in proportion to their intensities. A single lamp colour would need a sourced colour per element.
- **Q-atom-2** (d_xz instead of d_xy): **accepted.** d_xy lies flat in our z-up scene and would be seen edge-on. d_xz is the same cloverleaf facing the viewer, the caption says "four of the five d clouds are cloverleaf-shaped", and the picker offers all five turns.
- **Q-atom-3** (Slater outer clouds several times too large for heavy atoms): **kept as disclosed** ("About this atom" says so: uranium's 7s reaches ~1,750 pm in this model; its covalent radius is 196 pm).
  - A better radial model would change the validated hydrogen-like nodes and normalisation, so it is not done at a merge.
  - **Scheduled:** evaluate published effective charges (Clementi–Raimondi) for the outer clouds, as a data-reviewed change with its own tests.
- **Q-atom-4** (Vietnamese wording): the drafts are accepted for moony's review.
  - **Fixed at the merge:** the "Its light" hook said "sodium phát ánh sáng vàng" while the title beside it said "natri". Sodium keeps the familiar name natri (one of the 13 GDPT-2018 names), so the hook now says "natri".

**Merge fixes** (main session):
- **Router:**
  - One dive, `diveInto(place)`, for the forge, the sample place and the atom (the sample wiring's `diveIntoHeat(to)` and the atom wiring's `diveInto(place)` combined). The forge and the sample place save the table's temperature and start at 20 °C; the atom keeps the temperature and opens on the whole atom.
  - The sample place's door to the atom also clears the picked cloud.
  - The header comment now names the deep places; only the legacy sample view keeps the dark stage.
- **Smoke:**
  - The four door steps (forge, side by side, sample, atom) open their card with the router's own `openCard`, now on `window.__pt`.
  - A scripted `set({ card: true })` opens no card unless the view changes, so behind the sample block, which ends with the card closed, the atom block's door could not be found (6 of its 8 steps failed).
  - The router gap itself (the card flag true while the card is closed, reachable only by a scripted set or a hand-edited hash) is noted and not changed: making the card follow the flag in the state listener would render it two or three times per tap.

## Merge review: `view-patterns-r2` (patterns and side by side, round 2), 21 Nov 2026
The patterns session's answer to the cold review `reviews/merged-m1.md` (committed with this merge). Reviewed by the main session against STYLE.md and the PARALLEL.md checklist, with its shots (`/workspace/out/redesign/patterns-r2/`) beside the hero's. Its decisions are in `NOTES-patterns.md` › Round 2 (accepted as recorded there).

**Checklist: passed.**
- Only the scope's own files changed.
- **Tokens:** the kit's chips and segmented controls (44 px), the type steps and an ink-derived 5.5 % hairline for the minor gridlines.
- **Plain language:** question-led charts with the jargon as captions.
- **Sources:** every value tappable for its source; units bound to their numbers.
- **Light:** daylight only.
- **Speed:** 60 FPS median in every measured state, even at load 9–13.
- **Languages:** English and Vietnamese, with the familiar names.
- **Tests:** unit 45/45, validator, smoke 45/45 twice; index.html 1,736 KB.

**The review's points, checked in the shots:**
- The noble-gas note now lands on its own bead.
- "Each line up: ×10" is literally true (a faint line at every power of ten).
- Column mode draws one column, with column words.
- The "repeating wave" footer shows for periodic properties only.
- Labels and pills keep off peaks and curves.
- One leader per note on phones.
- On phones: "On the table →" beside "Other patterns ▾", the scrub guide follows the thumb, and "change ▾" under both tiles.
- No stranded °C; "gases at 20 °C" only when the pair has a gas; the phone sheet scrolls.

The side-by-side stage answers "two glossy marbles":
- **The default is a litre of each at 20 °C on a balance:** a glazed block, a pool or a glass litre of drifting atoms. The beam tips by the weight ratio and hangs level for tungsten and gold; never-weighed oganesson stands on plinths.
- **"One atom of each"** keeps soft-glazed beads with no hard catchlight.

**Open questions and proposals:**
1. **Real material colours on the side-by-side stage: yes for the litre stage, once they are sourced; the family pigment stays until then.**
   - **Why real appearance:** a litre is a piece of the material, not an atom. For non-experts, a yellow block sinking against a silver pool is recognised without reading (moony's goal: feel and intelligibility).
   - **Why not now:**
     - We hold no sourced appearance data, so a "gold yellow" today would be an invented colour.
     - PubChem's CPK colours are a molecular-model convention, not appearance (iron orange, sodium violet).
     - The stage already tells gold from mercury by form (block or pool), by the beam and in words.
   - **Path (scheduled after the round-2 merges):**
     - The main session curates a cited appearance for each element ("lustrous metallic yellow", "shiny silvery liquid") and maps it to muted mineral-paint finishes: one pewter glaze for the silvery metals; their own finish for gold, copper, caesium, sulfur, bromine, iodine and chlorine.
     - It amends STYLE.md §3/§6: litre specimens wear their sourced appearance; atoms, tiles and badges keep the family pigment.
     - Then the patterns session switches the litre stage.
2. **P6, the source popover's pale "Accessed" and "Licence" lines: accepted and applied.**
   - `legacy.css` set `.small` to the old dark theme's #a9b6d3 everywhere (about 1.9 : 1 on paper).
   - The rule is now scoped to `body.legacy`, and the popover keeps `--ink-2` even on the remaining legacy stage.
   - This also fixes the menu's credits and settings captions on paper.
3. **P7, the stage in the link (`cs=atoms`): accepted, scheduled.** It needs a state key and a router line, and `state.js` stays untouched while the sample and atom branches are open.
4. **Vietnamese drafts: accepted** for moony's review. Spot-checked for the naming rule: Vàng, Thuỷ ngân, Natri; Chlorine (IUPAC, not one of the 13); Than chì / Kim cương.

**Noted:**
- The side-by-side sheet now says "A litre of gold weighs 2.4 times as much as a litre of iron" (exact).
- The card's pair hook (`strings-home.js`) still says "weighs 2.4× more". The number is right for our PubChem densities (19.282 / 7.874 = 2.449; the review's 2.5 used CRC's 19.30). The wording waits for moony's call.

## Merge review: `view-sample-r2` (the sample place, round 2), 21 Nov 2026
The sample session's answer to `reviews/sample-s1.md`, committed with this merge (with `reviews/atom-a1.md` and `reviews/patterns-p2.md`). Reviewed against STYLE.md and the PARALLEL.md checklist: passed. Its decisions are in `NOTES-sample.md`.

**PROPOSAL commits: all accepted.**
- **Data:** NUBASE2020's half-life uncertainty.
- **Card:** oganesson is "predicted to be a solid, unlike the other noble gases" (from our state at 20 °C).
- **Sample view:**
  - atoms keep their size from liquid to gas (STYLE §6);
  - molecules of any size (S₈ rings, P₄);
  - a building-block specimen instead of an empty vessel (the vessel is sized to it; the 0.7 s glide re-frames on melting, so there is no change of scale);
  - daylight glass with a faint haze and a foot line;
  - a crisper glaze;
  - condensation that rains into the pool.
- **Quicksilver mercury:** asked for by moony ("mercury should read as shiny quicksilver"). STYLE.md §6 is amended for the glaze, the glass, quicksilver and the specimen.
- **The table's glaze:** `tableArt.js` is a pure refactor (`glazeStudio` = fres × `studioLight`). The tiles render identically (checked against hero-r7).

**Follow-ups:**
- **Metals by day:** frozen mercury turns from quicksilver back to family blue. Decide this together with the forge's iron.
- **The forge's vapour at the true bead size** is dense and blown-out at 2,950 °C (hero 17). Thin it: fewer drawn atoms or less glow.

**Oganesson's half-life (moony's check, applied at the merge):**
- NUBASE2020 lists oganesson-294 at 0.7 ± 0.3 ms (line 5867) and oganesson-295 at 680 ± 540 ms (line 5868). The 295 value rests on a single unconfirmed observation (Wikipedia's isotope list and Smits et al. 2020 cite only 294).
- `data/curated/tentative-isotopes.json` records this. `tools/build-data.mjs` never takes a flagged entry as the longest-lived kind; beside one, it prefers an observed kind over a NUBASE '#' estimate (293's "1 ms #"). It keeps 295 as `halfLifeTent`.
- **Only oganesson changes:** half-life 0.7 ± 0.3 ms with "the only confirmed kind", mass number 294 (IUPAC's [294]), nucleus A = 294.
- **Display:**
  - The sample place shows 294 first, with 295 as a note ("…listed at 680 ± 540 milliseconds, but it is not yet confirmed"), both tappable to NUBASE2020.
  - The card's "All numbers" shows "Longest half-life (confirmed kinds)" plus a row for the unconfirmed kind.
- **Note for the atom session (round 2):** its "longest-lived kind known (mass number 294)" could say "confirmed".

**Its questions:**
1. Vietnamese accent style ("thuỷ/hoá" vs "thủy/hóa"): left as is and listed for moony in QUESTIONS.md.
2. Shared thermometer rules (knob margin, a disabled vs a hidden "Room temperature" button, the About link on the forge): decided when the kit's thermometer unifies both (scheduled).
3. **The card's §6 items:**
   - The desktop card now gives the source hint, as phones do.
   - "Half-metals" keeps its break at the compound's own hyphen (like "Salt-makers"; the staircase is too narrow for one line at 14 px).

## Shared sample fixes after the cold review `reviews/sample-s2.md`, 21 Nov 2026
The shared items of the review, done by the main session on master. The sample-scope items went to `view-sample-r3`, which also commits the review.
- **(A) The hearth floor:**
  - **Cause:** the glass vessel's flat bottom face lay exactly on the hearth's top face and z-fought with it. That gave diagonal striping and a seam along the face's diagonal in the empty oganesson vessel; on a phone's steeper view the same diagonal read as the "hard horizontal band" on a glowing hearth.
  - **Fix:** the vessel now stands open on the hearth (the flat bottom triangles are dropped; its rounded foot stays), and the decals lying on the hearth get a polygon offset.
- **(B) The forge, as the sample place:**
  - 20 °C in ink (ember once heated);
  - "Room temperature" only once away from it ("Back to 20 °C" on phones);
  - "◀ Cool it" once heated: a sweep back down that stops just past each event, primary at the top of the scale;
  - "About this sample ›": a kit sheet with the state now, melting and boiling points, the stacking pattern, the box's side (with where it was measured), the neighbours and their distance, and how far atoms shake (Lindemann), every value tappable for its source, plus a note on what the drawing slows down. The router frames the crystal beside it, and Escape closes it first.

  The sample place's own About stays in its file (`view-sample-r3` is open). The two are unified with the kit's thermometer.
- **(C) A metal's finish belongs to the element, not its state** (STYLE.md §6):
  - Mercury, the one metal liquid at room temperature (from our data), is quicksilver frozen, liquid or boiling. Its unit cell's atoms take the glaze, so the ink atom and its verdigris neighbours stay legible.
  - Every other metal keeps its family glaze when it melts or boils: no snap from one finish to another, in the sample place or the forge.
- **(D) The forge's vapour:**
  - About a quarter of the atoms are drawn (was 40 %).
  - Each keeps its own small glow (3.2× its radius, was 7.5×), and the bead's emission and core whitening are lower in a gas, so every atom stays a sphere: no white blob, no heavy bloom (STYLE §6, §10).
  - It is also cheaper: p95 16.8 ms at 2,950 °C.
- **(E) The card:**
  - A predicted state reads "Predicted at 20 °C" with the value in italics on phones (the strip's `font` shorthand had reset the italics).
  - The desktop card says "Tap a value…" once, under the facts, no longer again inside "All numbers & sources".
- **Checks:** unit tests 45/45, validator, smoke 46/46 twice (a new forge-chrome step). Targeted shots in `/workspace/out/redesign/shared-fixes/` (`tools/shots-shared.mjs`).

## Merge review: `view-patterns-r3` (side by side, round 3), 21 Nov 2026
The answer to `reviews/patterns-p2.md` (committed with the sample round-2 merge). Reviewed against STYLE.md and the PARALLEL.md checklist: passed. Only scope files changed; the rebase was clean. The session's decisions are in `NOTES-patterns.md` › Round 3.
- **Rows rest whole** under the phone sheet's compact header (scroll snapping).
- **The phone rail** has its "Surprising pairs" label again, with "Pick any two…" always in view.
- **"No weight known for oganesson"** replaces "weighed on a balance" where there is no balance.
- **Text underlines** follow wrapped values.
- **Look:** a glazed bone-porcelain balance with ink lacquer, and liquids with a window sheen. Hover colours appear only where a pointer hovers.
- **Neon's sentence** now names both values.

**Its questions:**
1. **Chlorine's electron affinity:** PubChem's 3.617 eV ("3.62"). Our data rule takes electron affinity from PubChem (`tools/build-data.mjs`; the CRC value is only a cross-check), so every place shows 3.62; NIST's photodetachment 3.61 is not used.
2. **A Gallium · Mercury hook ("solid at 20 °C, melts at 29.8 °C"): accepted for its next round,** provided the number is computed from our data (PubChem's 302.91 K = 29.76 °C) and not typed into a string.

**Checks:** unit tests 45/45, validator, smoke 46/46 twice; index.html 1,778 KB. Reshoot: `/workspace/out/redesign/patterns-r3-merged/`.

## Merge review: `view-atom-r2` (the atom place, round 2), 21 Nov 2026
The answer to `reviews/atom-a1.md`. Reviewed against STYLE.md and the PARALLEL.md checklist: passed. The session's decisions are in `NOTES-atom.md` › Round 2.

**Data proposals: both accepted.**
- **The visible lines that look brightest:**
  - Neutral-atom lines, 380–750 nm.
  - Lines from levels above the first ionization energy are left out (sodium's core-excited lines).
  - Brightness: radiant power at kT = 1 eV from NIST's graded transition probabilities where at least 3 lines are graded within 18 %, else NIST's relative intensities, times the eye's ȳ.
  - Still at most 8 lines per element (the NIST policy is unchanged).
  - Neon now shows 585.2–640.2 nm (checked by moony); sodium keeps its D doublet and the 568 nm pair.
- **Measured nuclear charge radii** (Angeli & Marinova 2013, via the IAEA LiveChart API; the raw file stays local and only single values are used):
  - 89 elements take the measured radius of the isotope we show; the others keep the flagged estimate.
  - Gold-197 is 5.4371 ± 0.0038 fm (checked by moony).
  - **At the merge:** the raw file was taken from the atom worktree after checking its SHA-256 against the branch's manifest; no symlink was added.
  - The data was rebuilt from the merged build, which unites these with master's NUBASE uncertainties and oganesson-294 as the confirmed kind.

**Its questions (decided as moony suggested):**
1. **The glow:** accepted. It is the CIE mix of the element's measured lines, checked against the gas-discharge lamp table. The caption now says so ("computed from its measured lines"). Krypton (magenta) and xenon (too blue) fail the lamp check, so the data carries no glow for them, and the validator checks that.
2. **The card's note:** now "the 8 that look brightest (NIST transition probabilities or relative intensities × the eye's sensitivity)".
3. **Widening the window to 780 nm** for potassium's 766/770 nm lines: accepted for its next round, with an honest label (near-infrared edge). It needs the NIST lines fetched again.

**Other proposals:**
- **`color.js` clips** a spectral colour's negative channels instead of adding white (640 nm was crimson): applied.
- **The bundler registers only the first name of `export const A = 1, B = 2`:** `color.js`'s line was mine (atom merge). It is split now; a bundler check is scheduled with the kit pass.
- **The kit sheet's rows under the compact bar:** scheduled for the kit pass, with the shared thermometer and tokens.

**Also fixed at the merge (main session):** the desktop card's "All numbers & sources" began with a stray "null". `Element.append(null)` prints it, a bug from the shared fixes (cf98e90).

**The gold/iron ratio** (moony asked whether it now reads 2.45): it still reads "2.4×". Our cited densities are PubChem's 19.282 and 7.874 g/cm³: 2.4488, which is 2.4 to one decimal (2.45 only to two). No change.

**Checks:** unit tests 47/47, validator (two new checks, plus krypton/xenon), smoke 48/48 twice; index.html 1,795 KB.

## Patterns and side-by-side polish 1, after the cold review `reviews/patterns-p3.md`, 21 Nov 2026
Both places passed that review (patterns 4.0/4.0/4.5/4.0/4.5, side by side 4.0/4.0/4.0/4.0/4.5). The main session made a short polish round on master from its list, facts first.
1. **Every gap with its true reason, from our data:**
   - **Electron appetite:** the noble gases, N, Be, Mg, Zn, Cd and Hg read "adding an electron releases no energy (electron affinity ≤ 0)".
     - `data/curated/ea-unbound.json` gives the basis: moony's review list citing Chemistry LibreTexts. The CRC values via mendeleev are negative for He, Be, N, Ar and Xe.
     - These gaps keep source "none" with the reason in the note, so the card's "All numbers" says it too.
   - **Melting point:** helium "never freezes at normal pressure" (its sourced `noSolid`).
   - Only the remaining gaps say "no value in our sources" (was "not measured", which nobody could know).
2. **"One atom of each" gets its own headline.**
   - A litre sentence (a weight story, or helium · osmium's curated litre line) becomes a size sentence in the drawn radius ("about the same size", or "N times as wide").
   - An atom of unknown size is a dashed outline with a "?" inside, and the headline says it is not to scale.
3. **Column questions:** grip on electrons gets one ("Why do atoms lower down a column let go of an electron more easily?"). The other row questions also hold for columns.
4. **"Pick any two…"** now asks for both: "Pick the first of two", then at once "And the second, beside …". The tiles' "change ▾" keeps the one-slot "Instead of …".
5. **The balance:** mercury is quicksilver (the forge's mirror recipe, tinted 30 % by its family colour), per STYLE.md §6. The other metals keep their family glaze (§6, and the litre-colour decision: real appearance only once it is sourced).
6. **Labels, rail and pills:**
   - Oganesson's label was culled on phones (its long caption, slid inward, covered hydrogen's); captions under the stage now wrap.
   - The scrolled pair rail fades at both ends.
   - **Checked and left:** the inline Source pills already reach 44 px through an invisible extension (24 px pill + 2 × 10 px).

**Checks:** unit tests 47/47, validator, smoke 48/48 twice (the pick-two step now checks both steps). Shots: `/workspace/out/redesign/polish-1/`.

## Merge review: `view-atom-r3` (the atom place, round 3), 21 Nov 2026
The answer to `reviews/atom-a2.md` (clarity and ease were 3.5). Reviewed against STYLE.md and the PARALLEL.md checklist: passed. Only scope files changed; the rebase onto 9216171 was clean.
- **The picker** is in plain words: shell, then the clouds ("round · dumbbells · clovers · many-lobed"), then which one.
- **One exit:** the back link (the sheet's × hidden by the place's own CSS).
- **A scale bar** in picometres with its meaning.
- **"Its light"** uses kiln-text cream for its controls instead of ember. That is right: STYLE keeps ember for heat.

**Open items, as reported:**
- The phone "all 5" chip sits under the sheet's edge but is reachable by scrolling.
- The uranium picker wraps on desktop.
- Uranium's outer cloud (Slater above Z = 86) waits for the data review (Q-atom-3).

**Its proposals:**
- **OKLab constants for hue-keeping gamut mapping** (614 nm orange-red rather than clipped red): scheduled with the colour/data pass.
- **A kit `closable: false` sheet option:** not now. The place's scoped CSS does the job; the kit option comes with the kit pass if a second place needs it.

**Checks:** unit tests 47/47, validator, smoke 48/48 twice; index.html 1,810 KB. Reshoot: `/workspace/out/redesign/atom-r3-merged/`.

## Merge review: `view-sample-r3` (the sample place, round 3), 21 Nov 2026
The answer to `reviews/sample-s2.md` (beauty was 3.5). Reviewed against STYLE.md and the PARALLEL.md checklist: passed. The rebase onto cf21995 was clean.

**PROPOSAL commits on `views/sample.js`: all accepted.**
- Every bead stays inside the glass (neon no longer burst through).
- Molecules read as joined, and S₈ is drawn as its crown (Wikipedia, Octasulfur / Allotropes of sulfur).
- The building block rests on the hearth in a vessel sized to it, swaying to face the visitor.
- Its contact shadow takes the hearth's polygon offset.

The forge's heating path is untouched.

**§0a, the engine's resolution steps: accepted, done by the main session (`engine.js`).** Each pixel-ratio step reallocates the canvas, a 50–67 ms frame on a software renderer. Steps now need two slow windows in a row and come at most once every 3 s; the proactive zoom step is unchanged.

**FPS at the merge** (dense states, load 7–8):
- All hold a 60 FPS median.
- The neon "Cool it" sweep keeps an 83 ms p95. Its remaining long frames come with an idle main thread (the session's profile): the software renderer under load.

**Checks:** unit tests 47/47, validator, smoke 48/48 twice; index.html 1,819 KB. Reshoot: `/workspace/out/redesign/sample-r3-merged/` (README and fps.txt).

## Final review fixes, after `reviews/final-f1.md` (fresh, cold review of c7dd7d8), 21 Nov 2026
Every part scored 4 or more except Hold a sample (clarity 3.5, smoothness 3.5). One short round on master, blockers only, in moony's order.
1. **Phosphorus: one form throughout (a fact).**
   - The sample drew white phosphorus (its cI232 crystal, P₄ molecules), but its phase model used the only Wikipedia sublimation point we hold, 416 °C, which is red phosphorus's.
   - The build now gives phosphorus PubChem's melting and boiling points (44.15 °C, 280.5 °C: white phosphorus, as moony checked against PubChem and the RSC table; the patterns chart already plotted 44 °C).
   - It names the form, "white phosphorus", in every caption of the sample place (`ph.form`). The 416 °C stays as a fact labelled "red phosphorus".
   - Carbon (graphite sublimes), sulfur (rhombic S₈), tin (white, with its 13.2 °C grey transition), arsenic (grey sublimes) and selenium (grey) were checked: each is one form throughout.
2. **Thermometer landmarks:**
   - They are `--ink-2` by day (was `--ink-3`) and `--kiln-text-2` in the kiln.
   - A landmark the knob covers is hidden cleanly, never faded to 25 %.
   - The forge's landmarks take `--ink-2` too.
3. **Frame rate on the low tier:**
   - **Re-measured on the quiet machine beside the table-landing control:** neon condensing and liquid mercury held a 60 FPS median with averages near the control's. Molten iron on desktop was genuinely slow: a 33 ms median even at load 0.3.
   - **In-page split:** the view's update 0.5 ms and the render call 0.2 ms per frame, the engine already at its 0.3 MP floor. The rasteriser's per-bead cost dominates (drawing half the beads: 25 → 19 ms; dropping the additive layers as well added little).
   - **Fix:** the low tier's bead budget 330 → 180 (iron's crystal 4×4×4 cells there). Medium and high keep 800 and 1,500, so the review shots (`?q=med`) are unchanged.
   - **After:** molten iron at a 16.7 ms median (desktop average 46–48, the control's own 44–51; phone 57), neon condensing 55–57, liquid mercury 55–57.
   - The kiln also skips the beads' glaze and mirror terms (no measurable gain, kept as free).
4. **Neon at the glass:** beads now keep a visible gap from the walls (2.5 % of the vessel, was 1.2 %). The two "escaped" atoms sat inside the silhouette, touching the glass.
5. **Copy:**
   - Iron's light reads "out of all 651 visible lines" in both sentences (the source note keeps NIST's 2,542 in context).
   - A punctuation mark after a value is glued to it, so uranium's sentence no longer ends with a lone ".".

**Checks:** unit tests 47/47, validator, smoke 48/48. The final set (`/workspace/out/redesign/final/`) is reshot for the affected states (sample place, forge 13–18, the atom's light and uranium) with new fps.txt rows.

## Vietnamese accent style, 21 Nov 2026
- 2026-11-21 (moony): **Vietnamese accent style** — moony chose the most common modern placement: "thủy, hóa" (tone mark on the first vowel of oa/oe/uy when there is no final consonant), not "thuỷ, hoá". Applied throughout the Vietnamese strings (Q18). Syllables with a final consonant, and qu+y (quý), are unchanged.
