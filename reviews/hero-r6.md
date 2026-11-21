# First-time-visitor review — Periodic Table redesign (Round 6, hero slice)

Reviewed cold across all 30 screenshots in `/workspace/out/redesign/hero-r6/` (desktop `1440×900` and phone `390×844`) before reading `STYLE.md`, `SPEC.md` (Feel), `DESIGN-RULES.md`, `ref/VIDEO_NOTES.md`, `README.txt`, and the referenced `hero-r5/fps.txt`.

---

## 1. First 5 seconds

- **What I think this is:** A calm, museum-grade interactive periodic table — glazed ceramic or porcelain tiles resting on warm archival paper, inviting casual exploration rather than chemistry homework.
- **What draws my eye:**
  - **Desktop (`01-first-load-desktop.png`):** The soft, matte-glazed 3D blocks casting gentle shadows onto cream paper immediately steal the show. The italic serif neighbourhood labels printed straight onto the desk (*Workhorse metals*, *Nonmetals of life*, *Salt-makers*, *Radioactive heavyweights*) make the layout feel like a readable map instead of a textbook wall. After a beat (`02-try-iron-hint-desktop.png`), the verdigris **Try iron** tag cleanly replaces *Workhorse metals* above `Fe` with zero collision.
  - **Phone (`01-first-load-phone.png`):** My eye hits the italic hook and green gesture prompt at the top (*"Touch and slide across the table — lift to open."*), then drops to a surprisingly small horizontal strip of tiles floating in a lot of empty beige paper, then down to a dense bottom stack of colour key + three rows of lens pills.
- **What I think I should do:** On desktop, it is unmistakable: click/tap a tile (especially Iron) to look inside, or switch one of the quiet lens pills along the bottom. On phone, the gesture prompt tells me to drag my thumb across the table — and once I see the loupe (`03-thumb-scrub-phone.png`), the interaction makes immediate sense.
- **Anything confusing in the first 5 seconds:**
  - On desktop (`01`), *Mineral metals* sits right beside green `H` (Hydrogen) above `Be`, which briefly makes you wonder whether `H` belongs to *Mineral metals* until you match the yellow pigment to `Be–Ra`.
  - On phone (`01`), the 18-column table is only ~150 px tall in an 844 px screen, so tile symbols look tiny and slightly fuzzy at rest while huge blank paper bands sit above and below it.

---

## 2. Scores (1–5, strict) & comparison with Ryan Sael

*Targets: ≥ 4.0 everywhere, ≥ 4.5 on beauty and delight.*

| Criterion | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.5 / 5** | Table, cards, and lenses communicate in plain human language with honest predicted/unknown markings, held back only by the stale `"Iron at room temperature"` caption at `396 °C` (`18`), the ambiguous solid-bulb vs hollow-knob thermometer (`14`–`18`), and no visual highlight backing up `"12 neighbours"` at `930 °C` (`15`). |
| **Ease** | **4.0 / 5** | One obvious action per screen, strong escape hatches (`← All elements`, `← Iron`, `⌂ Whole table`), and a clever mobile thumb-scrub loupe, docked for clipped text above the phone card footer (`04`/`05`/`11`), cramped stacked tick labels on the phone thermometer (`13`–`16`), and the missing `"Tap a value…"` hint on collapsed desktop cards (`04`/`05`/`07`). |
| **Beauty** | **4.0 / 5** | The Porcelain & Ink table itself is a 4.5+ (especially `01`, `09-melting`, `10-zoom-in`), but the score drops on the daylight Forge 3D craft (`13`/`18`: smudgy flat glass planes, toy-like matte spheres, hearth clipped behind the card), severe column-on-symbol occlusion in `09-lens-heft-phone.png`, and blown-out gas glow on the floor in `17`. |
| **Smoothness** | **4.0 / 5** | Lightweight shader-glaze + baked-shadow architecture and clean spatial dive staging (`12a`/`12b`) hit ~60 median FPS even on CPU SwiftShader (`hero-r5/fps.txt`, noisy load ~8), though molten (`16`, avg 38.2 FPS, p95 33.4 ms) and active heating (`18`, p95 66.7 ms) remain noticeably heavier than the table and need real-device validation. |
| **Delight** | **4.0 / 5** | The *idea* — daylight ceramic tiles, whole-table `Solid, liquid, gas` slider, diving into the tile, and dimming the room into a glowing kiln — is exceptional, but the signature Forge climax loses impact when `396 °C` still claims room temperature (`18`), `930 °C` hides the 12-neighbour proof (`15`), molten iron stays blocky (`16`), and gas clumps on the floor (`17`). |

### Honest comparison with Ryan Sael (`sael.net/periodic-table`, `ref/VIDEO_NOTES.md`)
- **Is this better on feel?** **Yes, clearly better on overall usability, calm clarity, and editorial taste — not yet decisively better on 3D "wow" polish inside the sample/forge view.**
- **Where this beats Sael:** First-5-seconds serenity (no dusk-showroom clutter or unexplained height columns on load), real search, bilingual `EN | VI`, readable ≥14 px screen-space labels, mobile thumb-scrubbing, whole-table temperature scrubbing right from home (`08`), honest predicted/unknown visual coding, and real BCC→FCC→BCC crystal re-stacking instead of a generic cubic grid. The daylight-to-dark-kiln transition (`13`→`14`) is stronger storytelling than a permanently dark showroom.
- **Where Sael still edges ahead:** Raw 3D material richness in the sample view. While the porcelain table (`01`, `10`) equals or surpasses Sael through restraint and craft, the daylight Forge (`13`, `18`) currently reads noticeably more utilitarian ("Three.js spheres in a faint box") than Sael's glossy PBR spectacle. Fixing the Forge 3D presentation and the small UI/caption glitches will push beauty and delight past 4.5 and make this an unambiguous win.

---

## 3. Every visible problem

### A. Factual / state-logic bug
1. **Stale `"Iron at room temperature"` caption at `396 °C` while auto-playing (`18-forge-heat-it-playing-desktop.png`):** The readout is `396 °C`, the slider has already passed `lead melts` (`327.5 °C`, [PubChem — Lead](https://pubchem.ncbi.nlm.nih.gov/element/Lead)), and playback is running (`Pause ❚❚`), yet the caption still says *"Iron at room temperature: every atom touches 8 neighbours. Drag the thermometer to heat it."* Standard room temperature is ~20 °C ([IUPAC Gold Book — standard conditions](https://goldbook.iupac.org/terms/view/S05910)); calling 396 °C "room temperature" is factually wrong, and prompting the user to drag while `Heat it` is playing is stale.
   *(Chemistry spot-check note: Iron's `912 / 1,394 / 1,538 / 2,861 °C`, Gold's `1,064 / 2,856 °C`, `19.3 kg/L`, and CIAAW abridged rounded atomic weight `196.97 ± 0.01`, Oxygen's `-183 / -219 °C` and `1.3 g/L`, Carbon's `3,642 °C` sublimation, and the 1,000 °C phase states in `08` all checked out cleanly. Vietnamese prev/next `< Manganese` / `Cobalt >` in `11-vi-card-iron-phone.png` also follows GDPT-2018 per `STYLE.md §5`.)*

### B. Overlapping, occluded, or clipped text / UI
2. **Phone element card clips content behind the bottom fade above the footer (`04-card-iron-phone.png`, `05-card-gold-phone.png`, `11-vi-card-iron-phone.png`):**
   - In `04-card-iron-phone.png` and `11-vi-card-iron-phone.png`, the top halves of letters from the next line (`Boils at 2,861 °C…`) peek out sliced off right above the `< Manganese | Cobalt >` footer divider.
   - In `05-card-gold-phone.png`, because Gold's description wraps to 3 lines and `Side by side` wraps to 2 lines, **`More about Gold ⌄` itself is half-faded and cut off** against the footer divider.
3. **Tall density columns obliterate rear tile symbols on phone (`09-lens-heft-phone.png`):** In the `Heft` lens on phone, Row 6 (`Os`, `Ir`, `Pt`, `Au`, `Re`, `W`) rises straight across Row 5 (`Ru`, `Rh`, `Pd`, `Ag`), reducing `Ru` and `Rh` to illegible chopped dots, and actinides (`U`, `Np`, `Pu`, `Am`) slice across lanthanides (`Nd`, `Pm`, `Sm`, `Eu`).
4. **Hearth pedestal clipped by the Forge control card on every desktop shot (`13`–`18` desktop, `12b`):** The front bottom corner of the ceramic hearth slides directly under the top edge of the thermometer card, making the stage feel cramped vertically despite generous empty margin above the glass box.
5. **Cramped, hard-to-trace thermometer tick labels on phone (`13-forge-start-phone.png`, `14-forge-700C-glow-phone.png`, `16-forge-1600C-molten-phone.png`):** `1,394 °C re-stacks` stacks directly over `912 °C re-stacks` with its tall stem dropping immediately right of `912 °C` and right beside `1,538 °C`, forcing the eye to untangle which stem belongs to which label. On desktop (`13`–`18`), `1,394 °C re-stacks` is also offset far left of its stem so the stem drops from the end of `"re-stacks"`. Meanwhile `copper melts` vanishes on phone, leaving `lead melts` alone on the far left.
6. **Phone lens pills wrap to 3 rows instead of 2 (`01`, `03`, `08`, `09`, `10` phone):** `More ▾` sits alone as an orphan on a third row, violating `STYLE.md §5` (*"all lens chips are in view (two rows, never cut mid-word)"*) and stealing ~52 px of vertical space from the already tiny table.

### C. Cheap-looking / inconsistent 3D & missing visual proof
7. **Daylight Forge 3D lags well behind the porcelain table (`13-forge-start-desktop.png`, `13-forge-start-phone.png`, `18`):**
   - The **glass vessel** renders as uniform flat translucent grey walls with sharp polygon seams and no Fresnel rim/edge sheen (contradicting `STYLE.md §6`: *"a glass vessel that shows only at its edges (Fresnel, no wireframe)"*), reading as a muddy overlay in daylight and flat plastic planes in the kiln.
   - The **atoms at 20 °C (`13`, `18`)** look like matte, evenly lit toy spheres with low specular/AO depth compared to the crisp studio-glazed tiles in `10-zoom-in-desktop.png`.
   - The **hearth slab** floats with almost no grounding shadow beneath it.
8. **Unit-cell neighbour count is unreadable at 20 °C (`13`) and completely missing at 930 °C (`15`):**
   - At `20 °C` (`13`), the dark centre atom is buried behind the front verdigris spheres and the connecting rods are lost in shadow, so you see a dark-green patch (~6–7 visible balls) rather than an unmistakably countable 1+8 BCC unit cell.
   - At `930 °C` (`15-forge-930C-restacked-desktop.png`), the caption and sub-label promise *"Each now touches 12 neighbours"*, yet `STYLE.md §6`'s *"wear warm-gold rims in the kiln"* was dropped — leaving a uniform orange cube with zero visual cue showing the 12 neighbours.
9. **Molten iron silhouette is still too boxy (`16-forge-1600C-molten-desktop.png`, `16-phone`):** Rather than slumping into a lower, rounded glowing puddle (`STYLE.md §9`), the molten cluster still reads like a slightly melted square pile of orange marbles.
10. **Boiled gas clumps and blows out on the floor (`17-forge-2950C-gas-desktop.png`):** Too many gas particles hug the lower third of the vessel, where additive glow stacks over the bright hearth reflection into a clipped yellow-white mass with dark-ringed sphere outlines visible inside it.

### D. Interaction clarity, contrast & copy inconsistencies
11. **Solid thermometer bulb vs hollow draggable thumb (`14`–`18`):** Once you drag past 20 °C, a solid bright orange (or grey in `18`) circle of the exact same diameter as the thumb stays pinned at the left end while the actual draggable thumb is a hollow dark-centred ring. It reads like a two-handle range slider or puts stronger visual weight on the immobile left dot than on the active handle.
12. **`Heat it ▶` stays unchanged at `2,950 °C` (`17-forge-2950C-gas-desktop.png`):** Near the top of the scale (past boiling), the primary button still invites `"Heat it ▶"` instead of `"Replay ↻"` or `"Heat from 20 °C"`.
13. **Element identity disappears from the Forge card once heated (`14`–`17`):** Beyond `← Iron` in the far top-left corner, nothing on the dark Forge card names the element once the caption leaves room temperature.
14. **Missing `"Tap a value to see where it comes from."` affordance on collapsed desktop cards (`04`, `05`, `07`):** Desktop shows dotted underlines on `Solid`, `1,538 °C`, `7.9 kg` alongside an explicit `[Source]` pill on the hook, without the explanatory hint that phone (`04-phone`) and expanded desktop (`06`) include.
15. **Minor jargon / naming friction:**
    - `(PubChem)` appears directly inside primary lens subtitles (`09-lens-melting-desktop.png`, `09-lens-heft-phone.png`); casual visitors don't know what PubChem is. Move it to a subtle `Source` link/popover.
    - `Solid, liquid, gas` slider (`08`) has no min/max temperature endpoints (`-273 °C` / max) and uses a blue-to-red temperature track directly above a legend where blue means *liquid* (hotter than grey solid).
    - Calling **Gold** a *Workhorse metal* on its own card (`05-card-gold-desktop.png`, `05-phone`) reads slightly incongruously (fine as a whole-block map label, funny on Au/Ag/Pt).
    - `Mineral metals` sits slightly close to green `H` (`01-first-load-desktop.png`).
    - Low contrast on `lead melts` / `copper melts` secondary italic flags in kiln dark mode (`14`–`17`) — readable, but dim on lower-brightness displays.
16. **Phone layout proportions (`01`, `08`, `09`, `10` phone):** Large empty cream gaps sit above and below a very small table strip on portrait phone while the bottom chrome stacks tall (legend + 3 chip rows on home).

---

## 4. Ranked fix list (highest impact on feel first)

1. **Fix the Forge `396 °C` stale caption and add a "warming" beat (`18`):**
   - Trigger a dedicated warming caption as soon as `T > 40 °C` (and below glow onset ~490 °C), e.g., *"Warming up: the atoms shiver harder in place, still 8 neighbours each."*
   - While `Heat it` is auto-playing (`Pause ❚❚`), omit `"Drag the thermometer to heat it."`
   - When `T` is near max / past boiling (`17`), switch `"Heat it ▶"` to `"Replay ↻"` (restarting cleanly from 20 °C).
   - Add a quiet eyebrow label (`Iron` / element name) inside the Forge card so the specimen stays named in `14`–`17`.

2. **Make the Forge 3D look museum-grade in daylight and prove 8 → 12 neighbours (`13`–`17`):**
   - **Camera framing:** Shift the Forge camera target slightly down (pushing the 3D scene up ~8–10 % on desktop) so the entire ceramic hearth clears the top of the bottom card with breathing room and a soft baked contact shadow beneath the hearth.
   - **True Fresnel glass vessel:** Replace flat translucent box faces with a Fresnel-only shader (`alpha ≈ pow(1.0 - abs(dot(N, V)), 3.0)`) plus faint specular edge highlights so the vessel reads as crisp quartz glass in both daylight and kiln dark mode.
   - **Richer daylight beads:** Match the table's shader studio softboxes on the Forge atoms (subtle specular catchlight + contact darkening/AO toward the lattice interior) so `13` feels like glazed studio specimens rather than matte default spheres.
   - **Readable 8- and 12-neighbour unit cell:** At `20 °C` (`13`), pull the featured atom one layer closer to the front corner (or widen the cutaway cleanly) and brighten the rods so all 8 neighbours around 1 ink atom are actually countable. At `912–1,394 °C` (`15`), restore a subtle non-cutaway **exterior** highlight (e.g. bright gold/white rims or thin luminous bonds on a corner-visible atom + its 12 FCC neighbours, without carving a "fiery cavity") so the user actually *sees* `"12 neighbours"` happen.

3. **Redesign the thermometer bulb vs knob and clean up phone tick labels (`13`–`18`):**
   - Make the **draggable thumb** unmistakably the primary interactive control (solid high-contrast warm-white/cream disc with crisp dark/ember border and subtle shadow, or a pill slider grip), and style the **cold-end bulb** as an integrated glass reservoir (slightly taller capsule/bulb fused to the track with a faint outline and lower contrast) so it never reads as a second active handle.
   - On phone (`390 px`), simplify tick labels: put `912 °C` and `1,394 °C` on a clean staggered layout with short leader elbows or abbreviate `"re-stacks"` to an icon/short tag (or show the active milestone's full label in the caption and compact `912° · 1,394° · 1,538° · 2,861°` ticks on phone), and brighten `lead melts` / `copper melts` to `--kiln-text-2` (`#B9AC9C`, 8.5:1) in dark mode.

4. **Fix mobile element-card bottom-sheet clipping (`04`, `05`, `11` phone):**
   - Add bottom padding inside the sheet scroll area and align the bottom fade mask cleanly above the footer border (or measure initial sheet snap height dynamically so `More about [Element] ⌄` sits completely clear of the fade with zero sliced next-line text peeking above `< Prev | Next >`).

5. **Fix phone `Heft` column occlusion & compact phone landing chrome (`01`, `09` phone):**
   - In numbers lenses on narrow/portrait viewports, increase camera pitch slightly (e.g., `φ ≈ 0.44–0.48`) and/or cap max column height (~2.4–2.6 units vs 3.6 on desktop) so `Os/Ir/Pt/Au` and `U/Np/Pu` never obscure Row 5 or the lanthanides' symbols.
   - Tighten phone lens chips slightly (horizontal padding/gap or compact label like `States` / `Electrons`) so all 7 pills fit cleanly into **two rows** per `STYLE.md §5`, freeing ~50 px to enlarge/re-centre the table slightly and reduce the empty cream bands.

6. **Refine molten puddle & gas vapour physics/rendering (`16`, `17`):**
   - In molten mode (`16`), relax horizontal confinement and slightly lower vertical stacking so the metal slumps into a wider, rounded puddle on the hearth rather than a squared-off mound.
   - In gas mode (`17`), distribute particles more uniformly throughout the upper vessel volume (reduced gravity/floor bias) and tone down per-sprite additive intensity or clamp overlap so the bottom doesn't blow out into a clipped blob with visible grey sphere rings.

7. **Small clarity & polish passes (`01`, `04`, `05`, `07`, `08`, `09`):**
   - Add the subtle `"Tap a value to see where it comes from."` note (or consistent hover tooltip/affordance) on collapsed desktop cards (`04`, `05`, `07`) so dotted underlines match phone (`04-phone`).
   - Replace `(PubChem)` in lens subtitles (`09`) with a quiet `Source` link.
   - Add subtle min/max endpoint ticks (`−273 °C` … `6,000 °C`) to the `Solid, liquid, gas` temperature slider (`08`).
   - Nudge the *Mineral metals* desk label slightly right (over `Be`/`Mg` gap) so it doesn't visually crowd green `H` (`01`).
   - Profile molten (`16`) and animated heating (`18`) on a real mid-range phone to verify steady ≥55 FPS outside noisy SwiftShader captures.
