# Cold First-Time-Visitor Review — Hero Slice Round 3

*Reviewed cold from `/workspace/out/redesign/hero-r3/` (all 30 screenshots + `fps.txt` + `README.txt`) before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`. Earlier reviews in `reviews/` were not read.*

---

## 1. First 5 seconds (cold reaction)

- **What I think this is:** A museum-grade, tactile 3D periodic table made of glazed ceramic tiles resting on warm cream linen paper. It immediately feels calm, inviting, and crafted—like an exhibit tray or an illustrated science book rather than a neon sci-fi dashboard or a chemistry textbook.
- **What I think I should do:** Tap any element tile. The bottom serif hook (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*) paired with **"Tap one to look inside."** makes the primary gesture unmistakable on desktop. After a pause, the teal **"Try iron"** tag nudges me straight to `Fe`. On phone, **"Touch the table and slide: lift your finger to open."** explains the scrub-loupe gesture before I try poking tiny tiles.
- **What draws my eye:**
  1. On desktop (`01-first-load-desktop.png`), the warm pastel 3D tiles and their crisp beveled shadows dominate cleanly, followed by the serif hook and then the bottom lens pills (`Families`, `Heat map`, `Melting point`, `Heft`, `Atom size`, `Grip on electrons`).
  2. On phone (`01-first-load-phone.png`), my eye hits the large italic serif prompt first, then drops into a huge empty cream expanse before reaching a tiny ribbon of tiles in the middle of the screen.
- **Anything confusing right away:**
  - On desktop (`01`, `02`, `11`), the map label **`Mineral metals`** (and Vietnamese **`Kim loại khoáng`**) physically collides with the top-right edge of the **`Be`** tile.
  - Once I hover Gold (`03-hover-gold-desktop.png`), the idle **`Try iron`** bubble stays stuck over `Fe` instead of stepping aside—so two callouts compete on screen at once.
  - On phone (`01-first-load-phone.png`), the table is so small (tiles ~18 px wide, atomic numbers unreadable) and surrounded by so much empty vertical cream space that it feels distant until I scrub it.
  - Clicking into **"Hold a piece · heat it"** (the forge) starts with a tidy but textbook-like cube of grey balls inside a thin CAD wireframe box on a plain beige coaster (`13`), and the slider displays mysterious **unlabeled tick marks** (one on desktop just left of `1,538 °C`, two on phone where `912 °C re-stacks` disappears completely).

---

## 2. Scores (1–5, strict) & comparison with Ryan Sael

*Scale: 4 = genuinely good, 5 = exceptional. Target: ≥ 4.0 everywhere, ≥ 4.5 on beauty and delight.*

| Dimension | Score | Target | One-sentence reason |
|---|---:|---:|---|
| **Clarity** | **4.0** | ≥ 4.0 | The porcelain table, human-language labels (*"Workhorse metals"*, *"Grip on electrons"*, *"A litre would weigh 7.9 kg"*), and editorial element cards communicate effortlessly, but `Mineral metals` collides with `Be`, `Tc` is sliced in half on Melting point, Gold's `All numbers & sources` is half-erased at the card fold, Heft is unreadable on phone, and the forge slider leaves key transitions unlabeled. |
| **Ease** | **4.0** | ≥ 4.0 | Always-visible back pills (`← All elements`, `← Iron`), `"⌂ Whole table"` reset, mobile thumb-scrub loupe, and one-tap `"Heat it ▶"` make exploration low-friction, though the lingering `"Try iron"` tag on hover, lens pills colliding with zoomed tiles behind open cards, and phone's orphaned/clipped boiling-point line below the doors introduce avoidable rough edges. |
| **Beauty** | **4.0** | **≥ 4.5** | The daylight porcelain table and editorial typography are legitimately 4.5+ museum quality, but the forge's 3D look pulls the overall score down—sterile CAD wireframe + matte coaster at 20 °C, washed-out flat spheres at 700–930 °C, a dry mound of flat orange foam beads at 1,600 °C, and dull flat-peach 2D discs at 2,950 °C. |
| **Smoothness** | **4.0** | ≥ 4.0 | Every view hits a 59.9 FPS median even under SwiftShader software rendering (`fps.txt`), with phone locked at a flat 60.0–60.2 avg FPS (16.7–16.8 ms p95), though desktop drops to 44.5–49.2 avg FPS (33.4 ms p95) on dive/hover/forge-start, `12b` misses the promised crystal-opening dive frame, and real-device GPU numbers are still unverified. |
| **Delight** | **3.5** | **≥ 4.5** | The calm porcelain-on-paper identity, whole-table Heat map slider, and dark-kiln transition are inspired ideas, yet the designated single wow moment (heating iron) under-delivers visually right at its climax—molten iron looks like piled orange cheese puffs, boiling iron loses its incandescent glow completely, and phone hides the `912 °C re-stacks` landmark. |

### Honest comparison with Ryan Sael (`sael.net/periodic-table`, per `ref/VIDEO_NOTES.md`)

**Is this better on feel overall?** **On the table, cards, clarity, and usability: decisively YES. On the hero 3D "wow" specimen: NOT YET.**

- **Where this redesign clearly beats Sael:** First-5-second calm and legibility (Porcelain & Ink vs. Sael's heavy, cluttered dark showroom), plain-language framing (*"A litre would weigh 19.3 kg"*), search + EN/VI localization + mobile thumb-scrubbing, whole-table Heat map, real BCC→FCC→BCC iron crystal geometry (vs. Sael's generic cubic grid), and lightweight performance (60 FPS median even in software rendering vs. Sael's heavy, slow, hard-to-click columns).
- **Where Sael still beats this round-3 slice:** Visual spectacle and material polish in the close-up 3D specimen. Sael's dusk PBR + bloom + glass-vessel aesthetic gives an immediate cinematic thrill, whereas our Forge (`13`–`17`) currently feels noticeably cheaper than our own porcelain table. If the forge's 3D shaders, crucible/vessel, molten puddle physics, and incandescent glow are elevated to match the craft of the table, this will beat Sael decisively across the board.

---

## 3. Every visible problem

### A. Overlapping or clipped text & UI collisions
1. **`Mineral metals` / `Kim loại khoáng` overlaps the `Be` tile** (`01-first-load-desktop.png`, `02-try-iron-hint-desktop.png`, `03-hover-gold-desktop.png`, `04-card-iron-desktop.png`, `11-vi-landing-desktop.png`): The second word (`metals` / `khoáng`) sits directly on top of the right-hand corner and bevel of `4 Be`.
2. **Bottom lens bar collides with zoomed tiles when an element card is open** (`04-card-iron-desktop.png`, `05-card-gold-desktop.png`, `07-card-oxygen-gas-desktop.png`): The white lens pills sit directly over the zoomed lanthanide/bottom-row tiles (`Pr`, `Nd`, `Pm`, `Sm`, `Eu`, `Gd`, `Tb` in `04`; `Nh`, `Fl`, `Mc`, `Lv`, `Ts` in `07`). The bottom paper scrim specified in `STYLE.md` §6 is either missing or far too subtle, so bold black element symbols poke out between the white pills.
3. **`All numbers & sources` is half-erased at the card fold on Gold** (`05-card-gold-desktop.png`): Because Gold's hook wraps to 3 lines and `Side by side` wraps to 2 lines, the accordion trigger `All numbers & sources ▾` lands right inside the bottom fade mask and becomes barely legible ghost text, looking clipped rather than scrollable.
4. **3D column occlusion on Melting point lens** (`09-lens-melting-desktop.png`): Tall front columns still cut into tiles behind them—**`43 Tc`** has its entire bottom half sliced off by `75 Re`, **`42 Mo`** is clipped along its bottom edge by `74 W`, and **`1 H`** is crowded behind `Be`/`Li`.
5. **Missing Carbon tag promised for Melting point lens** (`09-lens-melting-desktop.png`): Only `Helium never freezes at normal pressure` appears; Carbon—the tallest column on the table and a sublimation exception—has no callout tag despite `README.txt` stating both carbon and helium tags are present.
6. **Stale `"Try iron"` callout remains visible while hovering another element** (`03-hover-gold-desktop.png`): Hovering `Gold` shows the white `Gold` tag while the teal `Try iron` nudge stays pinned over `Fe`.
7. **Hover tooltip partially overlaps the tile above** (`03-hover-gold-desktop.png`): The `Gold` pill covers the bottom edge of `29 Cu` (minor, acceptable if transient, though slightly tight).

### B. Low contrast & legibility
1. **Striped "predicted" hatch degrades atomic-number legibility on Heat map** (`08-lens-heat-1000C-desktop.png`): On blue liquid (`93 Np`, `94 Pu`, `97 Bk`, `98 Cf`, `113 Nh`, `115 Mc`) and amber gas (`99 Es`, `112 Cn`, `116 Lv`, `117 Ts`, `118 Og`) tiles, high-contrast diagonal stripes visually tangle with the small atomic numbers.
2. **Dotted underline discoverability on desktop cards** (`04-card-iron-desktop.png`, `05-card-gold-desktop.png`, `07-card-oxygen-gas-desktop.png`): Desktop cards show faint dotted underlines under `Solid`/`Gas`, melting point, and weight, but omit the `"Tap a value to see where it comes from."` hint that phone shows (desktop only reveals that hint inside the collapsed `All numbers & sources` drawer in `06`).
3. **Soft/low-res tile texture in deep scale-dive close-up** (`12a-forge-dive-into-tile-desktop.png`): When `26 Fe` fills the screen, the canvas-atlas lettering (`26`, `Fe`) looks noticeably soft/blurry, contrasting awkwardly with the razor-sharp UI chrome.

### C. Jargon without a human phrase
1. **Gold's electron-configuration exception note** (`06-card-gold-all-numbers-desktop.png`): *"fills its shells out of the usual order: `5d: 9 → 10, 6s: 2 → 1`"* starts in plain English, then drops unexplained spectroscopic notation (`5d`, `6s`) that a non-chemist cannot decode.
2. **`Standard atomic weight (abridged)`** (`06-card-gold-all-numbers-desktop.png`): "(abridged)" is IUPAC terminology without a plain-language explanation (e.g., *"rounded standard"* or just *"Average atom weight"* with IUPAC note in the source popover).
3. **`Drag the thermometer to heat it`** (`13-forge-start-desktop.png`, `13-forge-start-phone.png`): Minor mismatch—the control is a horizontal slider track, not visually a thermometer. Either say *"Drag the temperature slider"* or give the slider a subtle thermometer bulb/scale cue.

### D. Inconsistent spacing, type, or layout
1. **Unlabeled mystery tick marks on the forge slider** (`13`–`18`):
   - Desktop shows an unlabeled tick just left of `1,538 °C melts` (iron's 1,394 °C $\gamma \to \delta$ transition). Without a hover/active callout or label, it looks like a stray UI artifact.
   - Phone (`13-forge-start-phone.png`, `14-forge-700C-glow-phone.png`, `16-forge-1600C-molten-phone.png`) drops **both** `912 °C re-stacks` and `copper melts`, leaving **two** unexplained tick marks on the track so mobile visitors never know iron re-stacks at 912 °C before stumbling onto it.
2. **Card content order diverges awkwardly between desktop and phone** (`04`, `05`, `11`): On desktop, `Boils at 2,861 °C · Higher than copper...` sits directly beneath `Melts at 1,538 °C`. On phone, that sentence is pushed *below* the three action doors (`Look inside`, `Hold a piece`, `Side by side`) and clipped mid-sentence at the bottom of the screen, with no logical proximity to `Melts at`.
3. **Prev / Next navigation absent above the fold on phone cards** (`04-card-iron-phone.png`, `05-card-gold-phone.png`, `11-vi-card-iron-phone.png`): Desktop pins `‹ Manganese` / `Cobalt ›` in an always-visible sticky footer; phone hides them below the fold.
4. **Top-right tile peeking behind header pills when zoomed** (`10-zoom-in-desktop.png`): `13 Al` and `14 Si` slide directly underneath the `EN | VI` pill and search bar, with a faint bright glare spot on `14 Si`—the top paper scrim is too faint to cleanly separate zoomed tiles from the top bar.

### E. Cheap-looking 3D & visual defects (biggest drag on Beauty & Delight)
1. **Forge 1,600 °C molten iron looks like a dry mound of flat orange foam beads** (`16-forge-1600C-molten-desktop.png`, `16-forge-1600C-molten-phone.png`): Instead of collapsing into a glistening, level molten puddle across the base, the spheres heap into a tall lumpy pyramid with disconnected stray spheres floating in mid-air near the upper flanks. Because emissive fills flatten sphere shading, the atoms read as flat 2D orange polka dots behind a single yellow airbrush blotch.
2. **Forge 2,950 °C boiling gas looks like flat matte-peach 2D confetti—and dimmer than 1,600 °C** (`17-forge-2950C-gas-desktop.png`): All 3D shading and glow vanish completely; the atoms become flat `#E8B07B`-ish discs densely packed in a cube shape (too dense to read as "atoms fly apart as a gas"), and the base slab turns a dead dark olive-grey with zero light cast on it.
3. **Forge 700 °C & 930 °C glowing solid loses 3D form** (`14`, `15`, `18`): At 700 °C the spheres look like dull matte red gumballs; at 930 °C the single centered additive halo sprite washes out the interior into an orange blur while outer spheres flatten into unshaded orange circles. The base slab turns flat muddy brown with no warm falloff or specular reflection from the glowing metal sitting on it.
4. **Forge 20 °C staging reads as a sterile WebGL debug box** (`13-forge-start-desktop.png`, `13-forge-start-phone.png`): A sharp thin CAD wireframe cube sitting on a plain flat beige coaster feels generic—missing both the *"hairline glass cube"* materiality and the *"ink unit-cell outline"* promised in `STYLE.md` §6 (highlighting one 8-neighbour / 12-neighbour unit cell would be both gorgeous and deeply clarifying!).
5. **Chunky 2D-looking selection ring up close & missing crystal-open frame in dive** (`12a-forge-dive-into-tile-desktop.png`, `12b-forge-dive-out-of-crystal-desktop.png`): In `12a`, the verdigris outline reads as a thick flat 2D green stroke floating unevenly around a 3D beveled block. In `12b`, no crystal is visible at all—it still shows the zoomed-out periodic table—indicating either the dive transition is too brief/mistimed or the crystal reveal isn't landing cleanly.
6. **Tall extruded bars on Melting point look flat-sided** (`09-lens-melting-desktop.png`): The long vertical walls of `W`, `Re`, `Os`, `Ta`, `C` lack subtle vertical ambient occlusion / gradient shading, reading slightly like matte plastic extrusions compared to the porcelain tops.

### F. Mobile issues (390×844)
1. **Huge dead cream space around a tiny table** (`01-first-load-phone.png`, `08-lens-heat-1000C-phone.png`, `09-lens-heft-phone.png`, `10-zoom-in-phone.png`): The table occupies only ~18–22% of the vertical screen, flanked by ~150–200 px blank bands above and below. Even zoomed in (`10-zoom-in-phone.png`), over 60% of the screen is blank cream.
2. **Heft (density) 3D bar heights are effectively invisible on phone** (`09-lens-heft-phone.png`): At this tiny width and high camera pitch, heavy metals (`Os`, `Ir`, `Pt`, `Au`) look nearly flat and indistinguishable from light solids—the core visual story of the lens fails on mobile.
3. **Phone forge slider drops `912 °C re-stacks` and `copper melts` labels** (`13`, `14`, `16` phone), leaving unlabeled mystery ticks.
4. **Phone element card clips the orphaned boiling-point sentence at the bottom edge** (`04`, `05`, `11` phone) and hides prev/next navigation.
5. **Minor phrasing stiffness in phone prompt** (`01-first-load-phone.png`): *"Touch the table and slide: lift your finger to open."* — the colon reads slightly awkwardly; *"Touch and slide across the table — lift to open."* reads more naturally.

### G. Factual / scientific accuracy & data-signaling issues
1. **Plutonium (`94 Pu`), Neptunium (`93 Np`), and Actinium (`89 Ac`) are wrongly striped as "predicted" at 1,000 °C on the Heat map lens** (`08-lens-heat-1000C-desktop.png`, `08-lens-heat-1000C-phone.png`):
   - Plutonium's melting point (639.4 °C) and boiling point (3,228 °C) are experimentally measured ([PubChem: Plutonium](https://pubchem.ncbi.nlm.nih.gov/element/Plutonium), [RSC: Plutonium](https://www.rsc.org/periodic-table/element/94/plutonium)); Neptunium's melting point (644 °C) is experimentally measured ([PubChem: Neptunium](https://pubchem.ncbi.nlm.nih.gov/element/Neptunium)); Actinium's melting point (1,050 °C) is experimentally measured ([RSC: Actinium](https://www.rsc.org/periodic-table/element/89/actinium)).
   - Indeed, in `09-lens-melting-desktop.png` none of `Ac`, `Np`, or `Pu` are striped—proving their melting points are marked measured in the dataset. Striping them at 1,000 °C (likely because the Heat map marks an element predicted if *either* `mp` or `bp` is estimated) falsely tells the user that liquid plutonium at 1,000 °C is a theoretical prediction. The stripe should only apply when the *relevant boundary determining the state at temperature $T$* is predicted.
2. **Blackbody colour and brightness at 2,950 °C (3,223 K) contradict physics and `STYLE.md`** (`17-forge-2950C-gas-desktop.png`):
   - At 3,223 K, blackbody emission is bright warm incandescent white (roughly 3,200 K tungsten-halogen white, [Color temperature](https://en.wikipedia.org/wiki/Color_temperature)) and radiates ~8.8× more power per unit area than at 1,600 °C (1,873 K) by the Stefan–Boltzmann $T^4$ law ([Stefan–Boltzmann law](https://en.wikipedia.org/wiki/Stefan%E2%80%93Boltzmann_law)). Rendering 2,950 °C as dull matte peach with no glow—darker than 1,600 °C—breaks both physical truth and `STYLE.md` §9 (*"dull red, then orange, then yellow-white"*).
3. **Iron's 1,394 °C solid-state transition ($\gamma$-FCC $\to$ $\delta$-BCC) is marked by an unlabeled tick** (`13`–`18`): Iron truly re-stacks back to 8-neighbour BCC at 1,394 °C ([Allotropes of iron](https://en.wikipedia.org/wiki/Allotropes_of_iron)), and `STYLE.md` §9 explicitly mentions *"At 1,394 °C it snaps back"*, but without a label or active badge on that tick, visitors have no clue what the extra line next to `1,538 °C` means.

*(All checked element card values—Fe mp 1,538 °C / bp 2,861 °C / 7.9 kg/L; Au mp 1,064 °C / bp 2,856 °C / 19.3 kg/L / `[Xe] 4f¹⁴ 5d¹⁰ 6s¹`; O bp −183 °C / mp −219 °C / 1.3 g/L; W 3,422 °C; Ga 29.8 °C; Cu 1,085 °C; Al 660 °C; Fe 912 °C BCC→FCC—are accurate and consistent with PubChem/IUPAC.)*

---

## 4. Ranked fix list (most impact on feel first)

1. **Overhaul the Forge 3D shaders, molten puddle, and incandescent glow (`13`–`17`) — *highest impact on Beauty & Delight***
   - **Preserve 3D form while glowing (`14`–`17`):** Stop washing out spheres with uniform flat emissive + one central blob. Compute a view-angle / Fresnel term per atom so cores glow hot (brighter toward yellow-white as $T$ rises) while sphere rims keep darker incandescent falloff (so every bead still reads as a 3D sphere even at 1,600 °C and 2,950 °C).
   - **Fix 2,950 °C boiling gas (`17`):** Keep the glow *increasing* monotonically with $T$ into bright warm-white incandescent light (~3,200 K), reduce visible atom count or expand the dispersion radius slightly (with subtle soft-alpha depth fading or brief motion streaks) so it reads unmistakably as sparse, energetic gas rather than a dense cube of flat peach dots.
   - **Fix 1,600 °C molten liquid (`16`):** Settle molten atoms under gravity into a **low, wide, flat-topped glowing puddle** hugging the base (height ~35–45% of the solid cube, zero stray balls floating disconnected above the surface) with animated convective churning and hot bright core crevices.
   - **Upgrade the 20 °C stage & kiln base (`13`–`17`):** Replace the CAD wireframe + flat beige coaster with a subtle recessed ceramic/stone hearth plate that actually catches warm orange/white radial light and soft specular sheen from the glowing sample above, soften/fade the glass vessel walls (or show subtle chamfered glass corners only when molten/gas), and draw the subtle **ink unit-cell outline** (`STYLE.md` §6) on one corner cell at solid temperatures so the 8-neighbour vs. 12-neighbour re-stacking is visually obvious at a glance.

2. **Fix the Forge thermometer tick labeling on desktop & phone (`13`–`18`)**
   - Make the 1,394 °C tick legible (either stagger alternating tick heights/labels, use a compact `"1,394°"` / `"re-stacks"` label, or show an interactive active callout pill above the thumb whenever approaching/passing a tick—especially `912 °C` and `1,394 °C`).
   - On phone (`390 px`), **never drop `912 °C re-stacks`**—that is the single most surprising scientific discovery in the forge. Show `912°`, `1,538°`, `2,861°` cleanly (e.g., compact `912°` / `1,538°` / `2,861°` above the track, and omit `°C` on intermediate ticks if tight) and eliminate any unlabeled mystery marks.
   - When the slider reaches boiling (`≥ 2,861 °C`), switch the primary button label from `Heat it ▶` to `Replay ▶` (or `Cool & replay`).

3. **Eliminate the desktop zoomed-table vs. bottom lens-bar collision (`04`, `05`, `07`, `10`)**
   - While an element card is open (`04`, `05`, `07`), either **hide/fade the bottom lens chips** (returning them on `← All elements`, keeping one main focus per screen per `DESIGN-RULES.md`) OR add a real 96 px `--paper` bottom gradient scrim (`opacity: 0 → 0.96`) and shift the camera target slightly upward so zoomed tiles never poke out behind the white pills. Strengthen the top scrim similarly for zoomed-in views (`10-zoom-in-desktop.png`).

4. **Fix the scale-dive close-up polish (`12a`, `12b`)**
   - Fade out the 2D-looking green selection ring as the camera begins diving into the tile (`12a`), and double the symbol atlas resolution (or render the active tile's symbol at 2×) so `26 Fe` stays razor-sharp during the plunge.
   - Verify the dive timing and capture `12b` when the glaze has genuinely parted to reveal the iron crystal emerging—right now `12b` still shows the outer periodic table.

5. **Fix `Mineral metals` / `Kim loại khoáng` colliding with `Be` and dismiss `"Try iron"` on first interaction (`01`–`04`, `11`)**
   - Reposition the Group 2 map label (`Mineral metals` / `Kim loại khoáng`) cleanly **above** `Be` (aligned horizontally with `Half-metals` / `Nonmetals of life`, or tucked to the right of `Mg`/`Ca` in the empty valley between Group 2 and Group 3) with a guaranteed collision margin from `Be`'s bounding box in both EN and VI.
   - Dismiss the idle `"Try iron"` pill immediately on the first pointer hover/move over any tile (`03-hover-gold-desktop.png`).

6. **Fix desktop Gold card fold clipping and phone card hierarchy (`04`, `05`, `06`, `11`)**
   - On desktop (`05-card-gold-desktop.png`), tighten vertical padding by ~8–12 px (or increase the card max-height / reduce the bottom fade height to 20 px) so `All numbers & sources ▾` always sits cleanly above the fade on 3-line hooks like Gold, and add a subtle `"Click any underlined value for its source"` cue once on the card.
   - On phone (`04`, `05`, `11`), move the boiling-point/comparison note back under `Melts at` (or collapse it cleanly below the fold without leaving a half-clipped orphan line peeking under the three doors) and add a compact sticky footer with `‹ Manganese` / `Cobalt ›` matching desktop.

7. **Fix Melting-point occlusion, missing Carbon tag, and Heat-map "predicted" stripe logic (`08`, `09`)**
   - On `09-lens-melting-desktop.png`: reduce max column height slightly (e.g., `3.6 → 2.9` units) or steepen camera pitch slightly (`φ 0.36 → 0.42`) so `75 Re` and `74 W` no longer slice across `43 Tc` and `42 Mo`; render the promised **Carbon** tag (`"Carbon turns straight to gas at 3,642 °C"`) alongside Helium; add subtle vertical AO darkening near the base of tall bars so columns feel carved rather than flat-extruded.
   - On `08-lens-heat-1000C`: only apply the `"predicted"` stripe to an element at temperature $T$ when the phase state at $T$ actually depends on an estimated/predicted transition point (so `94 Pu`, `93 Np`, and `89 Ac` render cleanly unstriped at 1,000 °C), and reduce stripe contrast/opacity (~25–30%) so atomic numbers remain crisp.

8. **Improve portrait phone framing & make Heft readable on mobile (`01`, `08`, `09`, `10` phone)**
   - On `09-lens-heft-phone.png`, tilt the camera lower (more isometric/front-angled, e.g., `φ ~0.75–0.85`) and exaggerate vertical column scale slightly on narrow viewports so dense heavy metals visibly tower above light solids and flat gases.
   - Across phone table views (`01`, `08`, `09`), tighten the vertical layout so the table sits slightly higher/larger (reducing the two giant empty cream bands above and below it) and soften the prompt punctuation to *"Touch and slide across the table — lift to open."*

9. **De-jargon two strings in `All numbers & sources` (`06`) & verify real-device FPS**
   - Rewrite Gold's shell-exception note to plain words first: *"pulls one outer electron into a fuller inner shell (`5d: 9 → 10, 6s: 2 → 1`)"*, and simplify `Standard atomic weight (abridged)` to `Atomic weight` (putting "IUPAC abridged" in the source popover).
   - Run the FPS check on at least one real laptop GPU and one mid-range phone (and investigate the desktop 33.4 ms p95 dips on `03`, `12b`, `13`) to confirm smooth 60 FPS outside SwiftShader.
