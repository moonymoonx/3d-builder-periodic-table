# REDESIGN PLAN (21 Nov 2026)

**Why:** moony's verdict on M5 was *"too technical, looks bad quality"* and *"why should I look at the trends?"*. The BEFORE screenshots (`/workspace/out/redesign/before/`) show a dashboard: a jargon dropdown ("First ionization energy"), a 12-item legend, a 25-row data sheet and six tabs.
**What changes:** the *surface* and the *order of disclosure*. **What stays:** every value, every science model, every source link, the validator and the tests. We restructure; we do not delete facts.
**Read with:** SPEC.md §0 (Feel), STYLE.md (look and motion), DESIGN-STUDY.md (hooks and sources), DESIGN-RULES.md (feel rules).

## 1. Principles
1. **One hero, one obvious action per place.** Home = the table (action: tap an element). Element = the card (action: open a door). Heat = the thermometer (action: drag).
2. **Plain words first.** No unexplained jargon on any default surface. Jargon appears only as a secondary caption after a human phrase ("Grip on electrons · *ionization energy*").
3. **Every technical layer sits behind one tap,** opened by a one-line *why it matters* hook with a source (§4).
4. **Numbers get human anchors computed from our own data:** "a litre of gold would weigh 19.3 kg"; "melts in your hand: gallium, 29.8 °C".
   - We never invent an anchor; a non-element landmark needs a source first (QUESTIONS.md).
   - Gas weights are stated at 20 °C, scaled by the ideal-gas law from PubChem's 0 °C values; the method is shown in the source popup. Helium: 0.17 g per litre.
5. **Places, not tabs.** A back link is always visible; nothing is a dead end.
6. **Smooth on a phone** before anything else (§8). We cut effects before we cut frame rate.

## 2. The new surface, place by place
**Home: the table.** Everything else is quiet around it.
- Paper stage with low, equal porcelain tiles in the 18-column shape. The family glaze and the ink symbol are on each tile.
- Family names are written on the table itself (region labels, see §3). They replace the legend.
- Top bar: wordmark · "Find an element" · EN|VI · ≡.
- Bottom prompt: *"Everything you have ever touched is built from these kinds of atom. Tap one to look inside."*
- A quiet row of **lens chips** sits under the prompt: **Families** (on) · **Heat map** · Melting point · Heft · Atom size · Grip on electrons · More ▾.
  - The Heat map is deliberately on the first screen: drag its temperature and all 118 tiles turn solid, liquid or gas together. That is a one-tap taste of the wow (Gemini critique).
  - Lenses re-colour or raise the tiles. Each opens with a one-line banner (§4) and has one control at most (the heat map's temperature slider).
  - More ▾ holds Electron pull, Discovered, Crustal abundance, Boiling point, Electron appetite, Weight of one atom, the van der Waals size and the felt pull of the nucleus.
  - Story lenses (In your phone, Made in stars, In your body) join as soon as their data is in (§7).
- Phone: thumb-scrub **loupe** to pick tiny tiles; the prompt and lens pill sit above the thumb zone.

**Element (card).** Tapping a tile lifts it 3 mm and glides the camera to it. A card slides in (desktop: 380 px on the right; phone: a bottom sheet that peeks at 45 % and swipes up).
- **Header:** big serif name, symbol · atomic number, Vietnamese name in VI.
- **One human line:** e.g. "The metal of steel and of the red in your blood."
  - Hand-written in our own words for the ~30 elements people tap first (H, He, Li, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, K, Ca, Ti, Fe, Cu, Zn, Ag, Sn, I, W, Pt, Au, Hg, Pb, U, Pu, Og), each with a source link and queued for fact-checking (Q17).
  - Every other element gets a sentence generated from data: "A workhorse metal, solid at room temperature, that melts at 1,538 °C".
- **Three plain facts with anchors** (all from our data):
  - Solid / liquid / gas at 20 °C;
  - "Melts at 1,538 °C", shown on a mini thermometer with element landmarks;
  - "A litre would weigh 7.9 kg", or for a gas "a litre weighs 0.17 g" (at 20 °C).
- **Three doors** (big buttons): **Look inside the atom** · **Hold a piece · heat it** · **Side by side…**
- **"All numbers & sources ▾":** the full data sheet as it is today: about 25 fields, every value tappable for its source, hatched estimates, "Other sources" disputes. Nothing is removed; it is only demoted.
- Each fact has a small "↗ across the table" link that opens **Patterns** for that property.

**Hold a piece · heat it** (the wow, STYLE.md §9).
- The scale dive goes from the tile into the specimen. The thermometer is the one control, with element landmark flags (gallium 29.8 °C, lead 327 °C, iron 1,538 °C, tungsten 3,422 °C, from our data). There are also "Room temperature" and "Heat it ▶" buttons.
- The room dims to the kiln colour when the metal starts to glow.
- A caption appears at each event: "912 °C — the atoms re-stack: each now touches 12 neighbours".
- **"About this crystal ▾"** holds today's details: pattern name, unit cell, neighbours, wobble (Lindemann, with its source), gas speeds and slow-down factor, and the honest cards (complex or never-made-in-bulk). Carbon keeps its visible graphite ↔ diamond switch.

**Look inside the atom.**
- **Default:** the whole atom as stippled clouds, with a plain caption: "Iron's 26 electrons sit in 4 shells (2, 8, 14, 2). The newest went into a 3d cloud; four of the five d clouds are cloverleaf-shaped." (The configuration is from NIST.)
  - When one d cloud is shown first, it is a cloverleaf (m = ±2, d_xy), not the dumbbell-and-ring d_z².
- **One visible control:** "+ proton / − proton" (the stepper).
- **Behind taps:**
  - "Show one cloud" (subshell picker, real ψ(n,l,m) lobes and phases);
  - "Its light" (NIST lines, tap → wavelength, glow colour). **The room dims to the kiln colour** here too, as in Heat it;
  - "About this atom ▾" (configuration, exceptions, Slater/Clementi effective charge, nucleus enlargement factor, 90 % surfaces).

**Side by side.**
- Opens with **curated surprising pairs** (DESIGN-STUDY §4.7). Each takeaway sentence is checked against our data:
  - gold 79 vs mercury 80: one more proton, solid → liquid. The details add that the extra electron completes mercury's 6s pair, which relativity holds tight (Chemistry World);
  - diamond vs graphite: same atom, different stacking;
  - helium vs osmium: a gas of 0.18 g per litre vs the densest metal, 22.6 kg per litre;
  - sodium vs chlorine;
  - hydrogen vs oganesson.
- "Pick any two" is also there.
- The atoms are drawn to scale with plain sentences (today's), and the ratio bars move into details.

**Patterns.**
- Each chart opens with a question, not a property name: "Why do atoms get *smaller* as you go right?"
- The selected element is highlighted, and its row is drawn bright (today's).
- Two or three callouts per chart come from the data: e.g. "each row starts big and shrinks", "the little dips after beryllium and nitrogen" (source: Wikipedia *Ionization energy*).
- Joining by row or by column stays as a secondary toggle; log scale is automatic, with a "each step = ×10" note.

**Find and menu.**
- **Find:** search (EN/VI, accent-insensitive, symbol, number) plus quick filter chips: family, row, column, natural or made-in-lab, state at a temperature. These are today's filters, moved here.
- **Menu:**
  - Lenses;
  - Other shapes of the table (32-column; helix: "the first periodic system, de Chancourtois 1862, was a helix — a spiral wound around a cylinder");
  - Sound (off by default);
  - Quality;
  - Colour-blind palette;
  - Reduced motion;
  - Keyboard;
  - Sources & credits;
  - Share link.

## 3. Plain-language map (default surfaces)
Family names are human first and were revised after Gemini's critique (Q16 answered). The Vietnamese column is a draft for moony's review.

| Human (default) | Secondary caption | VI draft |
|---|---|---|
| Soft, reactive metals | alkali metals | Kim loại mềm, dễ phản ứng |
| Mineral metals | alkaline earth metals (found in nature only in minerals) | Kim loại khoáng |
| Workhorse metals | transition metals | Kim loại trụ cột |
| Other metals | post-transition metals | Kim loại khác |
| Half-metals | metalloids | Á kim |
| Nonmetals of life | reactive nonmetals (H, C, N, O, P, S, Se) | Phi kim của sự sống |
| Salt-makers | halogens (Greek: "salt-former") | Nhóm tạo muối |
| Noble gases | unreactive gases | Khí hiếm |
| Rare earths | lanthanides | Đất hiếm |
| Radioactive heavyweights | actinides | Kim loại phóng xạ nặng |
| Row · Column | period · group |
| Number (protons) | atomic number |
| Atom size | covalent radius (Cordero 2008); van der Waals in details |
| Grip on electrons | first ionization energy |
| Electron pull | electronegativity (Pauling) |
| Electron appetite | electron affinity |
| Heft (how heavy a litre is) | density |
| Weight of one atom | standard atomic weight |
| Melting / boiling (°C) | melting / boiling point (K in details) |
| How common in Earth's crust | crustal abundance |
| Electron clouds | orbitals; s, p, d, f subshells |
| Atomic pattern | crystal lattice (bcc, fcc, hcp…) |
| Wobble | Lindemann vibration amplitude |
| Felt pull of the nucleus | effective nuclear charge |

## 4. Technical layers: hidden behind a tap, opened by a hook
Hooks are from DESIGN-STUDY.md §3. ⚠ marks wording we changed for accuracy (reasons in DECISIONS.md). "Verify" items are queued in Q15.

| Layer | Opened from | Hook (one line) | Source |
|---|---|---|---|
| Electron clouds (orbitals) ⚠ | Atom → "Show one cloud" | Cloud shapes decide how atoms join; jumps between levels decide the colours an element glows. | Wikipedia *Atomic orbital*; NIST ASD |
| Atomic pattern (lattices) | Heat → "About this crystal" | Same carbon atoms, two stacking patterns: one is soft pencil graphite, the other is diamond, nature's hardest mineral. | Wikipedia *Allotropes of carbon*; RSC carbon |
| Melting and boiling | Card fact, Heat view, heat-map lens | It decides what survives a light-bulb filament (tungsten, 3,422 °C), what melts in your hand (gallium, 29.8 °C) and what is liquid at room temperature (mercury, −38.8 °C). | PubChem (our data; RSC lists W at 3,414 °C); RSC Ga, Hg |
| Heft (density) ⚠ | Card fact, lens | Why a helium balloon floats (a litre of helium weighs 0.17 g, a litre of air 1.20 g, at 20 °C), while a litre of gold would weigh 19.3 kg. | PubChem (our data, gas scaled to 20 °C); Wikipedia *Density of air*; RSC He |
| Atom size ⚠ | Lens, Side by side | Size changes with charge: a lithium atom is fairly big (128 pm), but without its outer electron it becomes a tiny ion that slips between the layers inside your phone's battery. | Nobel 2019 popular information; USGS GIP 167; our data |
| Grip on electrons ⚠ | Lens, Patterns | How tightly an atom holds its outer electron. A weak grip is why sodium explodes in water; a strong grip is why noble gases hardly react. | Wikipedia *Ionization energy*; Nature Chemistry 2015 (nchem.2161) |
| Electron pull ⚠ | Lens (More), Patterns | How hard an atom pulls on electrons it shares. Fluorine pulls hardest of all (3.98); oxygen's pull gives bent water molecules a positive and a negative end, which lets water dissolve salt. | Wikipedia *Electronegativity*, *Properties of water*; our data |
| Patterns (trends chart) ⚠ | Any fact "↗", lens menu | 118 numbers turn into one repeating wave: the pattern that let Mendeleev leave a gap for gallium and predict it before anyone had seen it. | Wikipedia *Periodic trends*; RSC gallium |
| Side by side | Card door, menu | One more proton turns solid gold (79) into liquid mercury (80). | Chemistry World, *Relativity behind mercury's liquidity*; RSC Hg |
| Its light (spectrum) | Atom → "Its light" | Heat or electricity makes every element glow its own colours: neon glows orange-red, sodium glows yellow (its 589 nm lines). | NIST ASD; RSC neon; compoundchem fireworks |
| Nucleus and isotopes | Atom → "About this atom" | No hook until sourced (Q15). We show plain counts: "26 protons, and most iron atoms have 30 neutrons". | NUBASE2020 |

## 5. Removed or demoted (and why)
| Today | New place | Why |
|---|---|---|
| Six top tabs | Removed; places reached through the element card, back link, menu | Six equal choices with jargon names ("Trends") and no order; moony: "why should I look at the trends?" |
| "Column height" jargon dropdown, columns of unexplained heights on load | Flat equal tiles by default; heights only inside a named **lens** with its question banner | Heights without a question are noise |
| 12-item legend | Family names written on the table; family filter chips in Find | Saves space and reads like a map; colour is never the only cue |
| 25-row data sheet on the right | "All numbers & sources" in the card, unchanged | A wall of data on first contact; all facts stay |
| Log-scale checkbox | Automatic per lens, with an "each step = ×10" note | A choice nobody should have to make first |
| Layout switch (32-column, helix) | Menu → "Other shapes of the table", told as history | Delightful for some, noise for most |
| Colour mode (Family / State at T) | The **heat-map** lens (temperature slider on the table) | Same data, with a question |
| Filters panel | Find panel chips | Search is where people look for narrowing |
| Trends "What to plot" list and "Join the dots" control | Patterns opens from a fact or lens; joining by column is a secondary toggle | Question-led instead of list-led |
| Compare picker first | Curated pairs first, "pick any two" second | An empty form is not an invitation |
| Help modal | Teach-by-doing hints at the moment they are needed (first visit only); keys under menu → Keyboard | No walls of instructions |
| Kelvin-first temperatures | °C first; K in details | Human scale |
| Quiz tab | Parked on branch `wip-m6-quiz`; returns later as "Mysteries" | moony stopped it; Gemini §4.9 reframes it |
| FPS meter, quality tier | Settings only (F key and `?stats` still work) | Developer tools |
| Sound | Deferred until the visuals pass the first review gate (still off by default) | Gemini critique: polish what everyone sees first |

## 6. Facts kept (and where they live now)
All 118 elements with every sourced field (PubChem, CIAAW, NIST ASD/CODATA, Wikipedia/Arblaster, mendeleev data, NUBASE2020, COD) are kept in the same `elements.json` → card details. The rest moves without loss:
- orbital mathematics → Atom;
- 84 measured lattices, Lindemann, Bain path, gases, honest cards → Heat;
- emission lines → Its light;
- trends → Patterns;
- compare sentences and ratios → Side by side;
- search and filters → Find;
- three layouts → menu;
- EN/VI, shareable URL (new place names), keyboard, colour-blind palette, reduced motion, quality tiers.

`tools/validate.mjs` and the tests stay green at every step.

## 7. New content and data (never invented; queued in QUESTIONS.md)
Answered in PLAN-CRITIQUE.md (21 Nov):
- **Q11 Made in stars:** per-element fractions in Wikimedia Commons *File:Nucleosynthesis_periodic_table.svg* (after Johnson 2019, *Science* 363:474), CC BY-SA 3.0 / GFDL. Before use we check how the numbers are encoded and the share-alike terms; fractions are shown as approximate.
- **Q12 In your body:** Wikipedia *Composition of the human body* (primary: ICRP Publication 23; Emsley 2011). We take the numbers only, cited.
- **Q13 In your phone:** USGS GIP 167 *A World of Minerals in Your Mobile Device* (2016, public domain): elements by role (display, electronics, battery, speakers and vibration).
- **Q14 One human line per element:** no open dataset exists. We write our own lines for ~30 elements in the HERO slice (sources linked; Q17 checks them) and generate the rest from data.
- **Q15 Hooks:** lithium and water hooks rewritten (§4). Air is 1.205 g/L at 20 °C (Wikipedia *Density of air*).
- **Q16 Family names:** revised (§3).
- **New Q17:** fact-check the ~30 hand-written element lines against their sources.
- **Story lenses move from "Later" to step 4** (In your phone first, since its source is public domain). Each ships only once its data is fetched, cited and validated, with no placeholders on a default surface.

## 8. Work order: the HERO slice first, at full polish
> **Status 21 Nov 2026:** step 1 (HERO slice) is built: review set in `/workspace/out/redesign/hero-r1/`, details in LOG.md. Waiting for Gemini's first-visitor review before step 2.
1. **HERO slice: landing + table + first interaction.** Acceptance:
   - DESIGN-RULES checklist passes.
   - AFTER screenshots at 1440×900 and 390×844 are taken with the same tool and flags as BEFORE (`/workspace/out/redesign/shots-tool.patch`).
   - First-time-user scores (clarity, ease, beauty, smoothness, delight) are 4 or higher.
   - Frame-rate targets in §9 are met.
   - **Review gate:** Gemini critique and moony's look before step 2.
   1. *Foundations:* STYLE tokens and type stacks in CSS; transparent canvas over paper; daylight rig; rounded porcelain tiles with darker sides; instanced baked contact shadows; region labels; a pure-CSS loading state (paper and tile silhouettes) that paints in under 300 ms.
   2. *Landing:*
      - Families table of thick ceramic tiles, one-time light sweep, subtle pointer parallax.
      - Bottom prompt and the **lens chip row**: Families, Heat map (with its temperature slider), Melting point, Heft, Atom size, Grip on electrons, More.
      - Breathing iron and the delayed "Try iron" tag.
      - Find pill (today's search, restyled) and the menu.
   3. *First interaction:*
      - Hover lift and ring in under 100 ms.
      - Tap → lift, camera glide, then the card or sheet with the human line (~30 hand-written, the rest generated), 3 anchored facts, 3 doors (wired to today's views inside the new chrome) and "All numbers & sources".
      - Back link and Esc.
   4. *Phone:* thumb-scrub loupe, sheet with peek and expanded states, thumb-zone layout, landscape check.
   5. *Strings:* EN/VI for every new string (VI flagged for moony); smoke checks for the new flow.
2. **The wow path:** scale dive; Heat restyle; kiln dimming; landmark flags; event captions; sample performance (atoms per tier); optional sound groundwork.
3. **Inside the atom:** stippled clouds on paper, plain caption, "+ proton", "Show one cloud", "Its light", details.
4. **Story lenses, the rest of the lenses, and Find:**
   - In your phone (USGS), Made in stars (Wikimedia, after the licence check), In your body (Wikipedia/ICRP).
   - The More lenses, each with its banner and automatic log scale.
   - Find chips; other table shapes in the menu.
5. **Patterns and Side by side:** question-led charts with data-derived callouts; curated pairs.
6. **Polish and proof:**
   - The full BEFORE/AFTER set.
   - The DESIGN-RULES checklist recorded in LOG.md.
   - Contrast, keyboard, reduced motion, tiers, phone landscape.
   - Optional sound (STYLE §8).
   - README.
7. **Later:**
   - "Mysteries" built from the parked quiz (fix its two known bugs first).
   - SPEC §5 Later items (demo dioramas, etc.).

## 9. Performance goals (smooth on a phone)
- **Targets** (SPEC §6, built-in meter):
  - Mid-range phone on Medium: 60 FPS median and p95 ≤ 20 ms in the table, card and atom views; ≥ 55 FPS in Heat.
  - Low-end Android on Low: ≥ 30 FPS.
  - Desktop on High: 60 FPS.
  - Interactive in ≤ 3 s on 4G; file ≤ 2 MB (master is 1.31 MB).
- **Headless baseline** (SwiftShader, Low): BEFORE, everything is at 60 except Heat at 20 FPS on desktop. **Goal: Heat ≥ 45 on desktop and ≥ 55 on phone**, with everything else staying at 60.
- **Budget:**
  - No post-processing by default.
  - Contact shadows are baked as instanced gradient quads.
  - Device pixel ratio is capped at 2 (1.5 on Low).
  - Table: about 6 draw calls; at most 60 visible screen-space labels.
  - Heat: 500 / 1,200 / 3,000 beads by tier, low-poly by tier, vibration in the vertex shader.
  - Atom: stipple points by tier, alpha-blended (less overdraw than today's additive glow).
  - Everything renders on demand, and nothing heavy is built before first use.

## 10. Checks and gates
- Validator, unit tests and smoke tests pass on every commit; smoke checks are added for each new place.
- Screenshot pairs (BEFORE/AFTER, same flags) and FPS notes go in LOG.md.
- There is a review gate after the HERO slice (Gemini and moony) and after the wow path.
- No "M<n>:" commit prefixes. Nothing is published except `git push` to origin.

## 11. Open questions
Answered by Gemini's critique (PLAN-CRITIQUE.md):
- **Light vs dark:** light, with strong tactile contrast.
- **Family names:** revised.
- **Wow moment:** yes, plus the one-tap heat map on home and the forge for any metal.
- **Top lenses:** Families, Heat map, Melting point, Heft, Atom size, Grip on electrons.
- **Sources:** Q11–Q15 answered.

Still open:
- The Vietnamese wording of every new string (moony).
- Q17, the element lines.
