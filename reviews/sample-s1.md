# First-Time-Visitor Review — Round S1 (`sample-merged`, build `f3d0ae7`)

Reviewed cold across all 33 screenshots in `/workspace/out/redesign/sample-merged` (desktop 1440×900 and phone 390×844, EN + VI) before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, and `ref/VIDEO_NOTES.md`. No `fps.txt` was present in the folder.

---

## 1. First 5 seconds (cold reaction)

- **What I think this is:** A calm, museum-book interactive periodic table where you tap any porcelain tile to read plain-English essentials, then open a miniature glass specimen box on a ceramic tray and drag a thermometer to freeze, melt, or boil its atoms and molecules.
- **What I think I should do:** Tap an element on the table, click **Hold a sample · cool or heat it** (or **Hold a piece · heat it**), then drag the thermometer or press the big black **◀ Cool it** / **Heat it ▶** pill button to watch the sample transform. Click **About this sample ›** if I want the numbers behind it.
- **What draws my eye:**
  - The warm paper canvas, glazed 3D porcelain tiles, serif typography, and soft shadows immediately feel refined and approachable — nothing like a cluttered sci-fi chemistry dashboard.
  - The dark-room kiln glow on molten iron (`16-forge-1600C-molten-desktop.png`) and molten manganese (`s11-manganese-molten-kiln-desktop.png`) is genuinely striking and theatrical.
  - Real two-atom dumbbells in nitrogen (`s02`, `s03`) and bromine (`s14`), plus the poetic empty vessel for oganesson (`s12`), make the science feel alive and human.
- **What is immediately confusing:**
  - **Blazing orange-red temperatures at −272 °C:** Every temperature readout (`−272 °C` on Helium `s08`, `−218 °C` on Nitrogen `s04`, `−48 °C` on Mercury `s06`, `20 °C` everywhere) is bright ember-orange even when the scene is talking about freezing near absolute zero.
  - **Empty glass box for Sulfur (`s09`) and frozen Nitrogen (`s04`):** Clicking "Hold a sample" on Sulfur drops me into an empty box with *"We do not draw molecular crystals yet, so the vessel stands empty."* It feels unfinished, and when Sulfur melts (`s10`), the text says *"Now its S₈ molecules can be drawn"* while showing plain single green balls.
  - **Inverted knob on Manganese's kiln (`s11`):** On dark molten Manganese, the draggable slider knob is a dark black circle while the thermometer bulb on the far left is a glowing cream-white dot — at first glance I thought the white dot on the left was the slider handle.
  - **Backwards-feeling cooling bar (`s02`–`s04`, `s08`):** At room temperature (`20 °C`) on Nitrogen, almost the entire bar is filled icy blue; as you cool it toward freezing, the blue bar *shrinks* until at `−272 °C` (Helium) the bar is completely grey.
  - **Unexplained green/black atoms in crystals (`13-forge-start`, `s06`):** Frozen mercury and solid iron have a small cluster of dark-green and black spheres embedded in the side with no caption explaining that they illustrate the 6 or 8 touching neighbours — on first look it resembles an impurity or rendering glitch.

---

## 2. Scores (1–5; strict, target ≥ 4.0 everywhere, ≥ 4.5 beauty & delight)

| Dimension | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **3.5** | Plain-English storytelling, human landmarks, and the `About this sample` drawer are genuinely lucid, but a 1,000× half-life error on Oganesson, single spheres captioned as "S₈ molecules", orange-red cryogenic readouts, unexplained green crystal highlights, and `unreactive gases` directly above `At 20 °C: Solid` erode trust. |
| **Ease** | **3.5** | The one-gesture thermometer and `Cool it` / `Heat it` pills are immediately graspable on both desktop and phone, but the slider thumb is visibly misaligned from the temperature ticks, Manganese's dark thumb/bright bulb inverts affordance, close ticks collide with the thumb on phone, and `Cool it` stays the primary black button even when already frozen at the left stop. |
| **Beauty** | **4.0** | The Porcelain & Ink table, element cards, and dark-kiln molten glow are genuinely handsome and restful, but the daylight glass vessel is nearly invisible, matte family-coloured beads make mercury and sulfur look like flat plastic pellets, and the ember readout clashes with the icy-blue cooling bar. |
| **Smoothness** | **3.5** | No `fps.txt` was present to verify frame timing; layout framing is clean across desktop and phone, but the mid-dive shot (`s01`) leaves the opaque thermometer card overlapping a clipped hearth, mid-condensation Neon (`s16`) freezes in artificial-looking vertical columns, and atoms shrink noticeably between liquid (`s05`) and gas (`s07`). |
| **Delight** | **3.5** | Glowing molten metals, real `N₂`/`Br₂` dumbbells, helium refusing to freeze at `−272 °C`, and oganesson's quiet empty plinth deliver real wonder, but landing on an empty box with *"We do not draw molecular crystals yet"* for Sulfur, matte slate-blue Mercury, and mismatched thermometer widgets break the spell. |

### Honest comparison with Ryan Sael (`sael.net/periodic-table`, per `ref/VIDEO_NOTES.md`)

- **Where this build already beats Sael on feel:** Calm, sunlit editorial legibility; zero dashboard clutter; dramatic light-to-dark kiln contrast when heating; dramatically better mobile ergonomics (`s00`, `s02`, `s05`, `s12`); bilingual EN/VI support; real measured crystal lattices and diatomic molecules instead of Sael's generic cubic grid; and plain-language framing with one-tap sources.
- **Where Sael still feels stronger right now:** Sael's sample glass cube and particles feel jewel-like and visually alive on first sight. In Round S1, our new non-iron Sample views are held back by flat matte beads (blue-grey "quicksilver" mercury, pea-green sulfur), a near-invisible daylight glass vessel, an empty Sulfur box that breaks immersion, and noticeable thermometer/data bugs. **Verdict:** The table, cards, and Iron forge already surpass Sael on feel; the new Sample views (liquids, gases, no-crystal elements) do **not yet** surpass Sael until the factual, thermometer, and daylight-material issues below are fixed.

---

## 3. Every visible problem

### A. Factual errors & scientific contradictions (fact-checked against external sources)

1. **Oganesson half-life is wrong by a factor of 1,000×** (`s12-oganesson-never-desktop.png`, `s12-oganesson-never-phone.png`, `s15-vi-oganesson-phone.png`):
   - Displayed: **`680 milliseconds`** (VI: **`680 mili giây`**).
   - Real value: $^{294}\text{Og}$ (the only known isotope) has a half-life of **0.7 ms** ($0.7^{+0.4}_{-0.2}\text{ ms}$ in NUBASE2020; ~0.69 ms in Oganessian et al.), i.e., **~680–700 microseconds**, *not* 680 milliseconds. This looks like a 1,000× unit conversion bug (`0.68 ms` / `680 µs` formatted as `milliseconds`).
   - Sources: Kondev et al. (2021), *The NUBASE2020 evaluation of nuclear physics properties*, Chinese Physics C 45(3):030001 (https://doi.org/10.1088/1674-1137/abddae); Wikipedia, *Oganesson* (https://en.wikipedia.org/wiki/Oganesson).
2. **Molten Sulfur claims to draw `S₈` molecules but renders single spheres** (`s10-sulfur-molten-desktop.png`):
   - Caption: *"115 °C: it melts. Now its S₈ molecules can be drawn: they touch but slide past each other."*
   - Visual: Single monatomic olive-green spheres — identical in geometry to monatomic Hg/He/Mn — despite `N₂` (`s02`, `s03`) and `Br₂` (`s14`) being rendered as genuine 2-sphere dumbbells. Below the λ-transition (~159 °C), molten sulfur consists of 8-atom cyclic $\text{S}_8$ rings, not single spheres (https://en.wikipedia.org/wiki/Allotropes_of_sulfur; https://pubchem.ncbi.nlm.nih.gov/element/Sulfur). Either draw $\text{S}_8$ rings/clusters or do not claim *"Now its S₈ molecules can be drawn"* when drawing single schematic particles.
3. **Oganesson card directly contradicts itself on state & reactivity** (`s00-card-oganesson-door-phone.png`):
   - Family subtitle: `Noble gases` / **`unreactive gases`**.
   - Two lines below: **`At 20 °C: Solid`** and **`Melts at ≈ 52 °C`**.
   - Relativistic spin-orbit effects are predicted to make Oganesson both a **solid** at 20 °C (~325 ± 15 K) and significantly **more polarizable/reactive** than lighter Group 18 elements (Smits et al. 2020, *Angew. Chem. Int. Ed.* 59:23636–23640, https://doi.org/10.1002/anie.202011976). Keep the family name `Noble gases`, but add an exception note (e.g., *"Group 18 — predicted solid, unlike lighter noble gases"*) instead of calling it `unreactive gases`.
4. **Verified numbers that passed fact-checking:** Iron (mp 1,538 °C, bp 2,861 °C, α→γ 912 °C, γ→δ 1,394 °C, 7.9 kg/L, gold 2.4× denser, Cu 1,085 °C, W 3,422 °C); Mercury (mp −38.83 °C / 234 K, bp 357 °C / 630 K, 13.5 kg/L, α-Hg hexagonal setting $a = 347.64\text{ pm}, c = 673.2\text{ pm}, Z = 3$, 6 nearest neighbours at 301 pm, gas $v_{\text{rms}}$ at 377 °C ≈ 1,024 → 1,020 km/h); Nitrogen (78% of air, 1.165 → 1.2 g/L at 20 °C, mp −210 °C / 63 K, bp −196 °C / 77 K, $v_{\text{rms}}$ = 511 m/s = 1,840 km/h, mean spacing 3.4 nm ≈ 10× width); Helium (bp −269 °C, liquid at 1 atm down to 0 K); Sulfur (β-S mp 115 °C, bp 445 °C); Manganese (mp 1,246 °C, bp 2,061 °C); Bromine (mp −7.2 °C, bp 58.8 °C); Neon (mp −249 °C, bp −246 °C); Oganesson (named 2016 after Yuri Oganessian, predicted mp ≈ 52 °C); Vietnamese GDPT-2018 retained names `Thuỷ ngân` and `Nitơ`.

### B. Thermometer widget bugs & STYLE.md violations

5. **Slider thumb is misaligned from the temperature ticks across all new Sample views** (`s02`, `s03`, `s04`, `s05`, `s06`, `s07`, `s08`, `s14`, `s15-vi`):
   - At `20 °C` (`s02`, `s05`, `s14`, `s15-vi-mercury`), the `room temperature` tick mark under the rail sits ~10–16 px to the **right** of the thumb centre.
   - At `−200 °C` on Nitrogen (`s03`), the thumb centre sits directly under `−196 °C` instead of between `−210 °C` and `−196 °C`.
   - At `−48 °C` on Mercury (`s06`), the thumb sits directly under `−38.8 °C freezes`; at `377 °C` (`s07`), it sits directly under `357 °C boils`.
   - Cause looks like a coordinate mismatch between the left thermometer bulb offset and the tick/thumb track percentage. (Iron's forge thermometer in `16-forge-1600C-molten-desktop.png` does *not* have this bug: `1,600 °C` sits cleanly right of `1,538 °C melts`.)
6. **Manganese kiln thermometer inverts the knob, bulb, and fill direction** (`s11-manganese-molten-kiln-desktop.png`, `s11-manganese-molten-kiln-phone.png`):
   - Violates `STYLE.md §9` (*"The knob is the one thing you drag: a solid cream disc with an ember ring... Its fill runs dark to bright like heated metal, so the hot end is the bright end"*).
   - Here, the active thumb is a **dark black disc**, the left cold bulb is a **bright cream-white disc**, and the gradient runs bright-on-left to dark-to-orange. Compare directly with Iron (`16-forge-1600C-molten-desktop.png`), which gets it right.
7. **Two mismatched thermometer implementations (Iron Forge vs new Sample views):**
   - Iron (`13-forge-start`, `16-forge-1600C`) has an ember-ringed cream knob, subtle rail-coloured bulb, and **no `About this sample ›` link**.
   - New Sample views (`s02`–`s16`) have a harsh black-ringed knob, an oversized left bulb nearly as large as the knob, and include `About this sample ›`. Both should share one unified component.
8. **Temperature readout uses `--ember` orange-red at cryogenic and room temperatures** (`s02`–`s10`, `s14`–`s16`):
   - `STYLE.md §3` restricts `--ember` to *"heat UI only"*. Showing `−272 °C` (`s08`) and `−218 °C` (`s04`) in fiery orange-red clashes directly with the icy-blue cooling bar and freezing copy.
9. **Cooling bar fill shrinks as temperature drops** (`s02`, `s03`, `s04`, `s08`, `s16`):
   - At `20 °C` (`s02`), the whole rail left of the thumb is bright blue; at `−200 °C` (`s03`) only a stub is blue; at `−272 °C` (`s08`) the rail is completely grey. Cooling should *build* a cold-blue bar leftward from the `room temperature` anchor (just as heating builds an ember bar rightward from `room temperature`).
10. **Primary CTA button stays stuck on `◀ Cool it` even at the cold stop** (`s04`, `s06`, `s07`):
    - On frozen Mercury (`s06`, `−48 °C`), `◀ Cool it` is still the solid-black primary button while `Heat it ▶` is secondary white — even though the thumb is already at the left end.
    - On Nitrogen (`s04`, `−218 °C`), `◀ Cool it` remains the primary button with no `Warm it ▶` option; on Helium (`s08`, `−272 °C`), `◀ Cool it again` is understandable as a replay but slightly awkward when already at −272 °C.
    - On Nitrogen's element card (`s00-card-nitrogen-door-phone.png`), the door reads `Hold a sample · cool or heat it`, even though Nitrogen's sample view only has a `◀ Cool it` button.

### C. Overlapping, clipped, or low-contrast UI & mobile issues

11. **Tick label collisions & missing stems on desktop and phone:**
    - `s16-neon-cool-it-playing-desktop.png`: `−249 °C freezes · −246 °C turns liquid` collapses onto one line with **no stems** linking either label to the rail, while the thumb sits right beneath `−249 °C`.
    - `s03-nitrogen-liquid-desktop.png`, `s03-nitrogen-liquid-phone.png`, `s15-vi-nitrogen-liquid-phone.png`: The `−210 °C` stem runs straight into the top border of the thumb, and `−196 °C turns liquid` touches/clips the thumb edge.
    - `s06-mercury-frozen-phone.png` and `s08-helium-near-zero-phone.png`: The large thumb swallows the `−38.8 °C` / `−269 °C` stems and collides with the left bulb (`s06`) and `absolute zero` tick (`s08`).
    - `s09-sulfur-honest-card-phone.png`: At `20 °C`, the left-aligned thumb nearly touches the left edge of the bottom card (tighter horizontal margin than desktop).
12. **Low-contrast disabled `Room temperature` link & cramped mobile footer row** (`13-forge-start`, `s02`, `s05`, `s09`, `s14`, `s15-vi-mercury`):
    - When already at `20 °C`, `Room temperature` renders in very pale washed-out teal (below 3:1 contrast on `#FBF8F2`). On `s05-mercury-liquid-phone.png`, squeezing `◀ Cool it`, `Room temperature`, and `Heat it ▶` onto one 390 px row leaves minimal breathing room. Hide `Room temperature` (or collapse it) when already at 20 °C.
13. **Phone `About this sample` sheet clips the last visible row without a bottom fade** (`s13-about-mercury-frozen-phone.png`):
    - `Neighbours touching | 6, 301 pm apart` is cut in half at the bottom edge of the 844 px viewport with no scroll-fade gradient (`STYLE.md §5`: *"the body fades out at the bottom whenever more waits below"*).
14. **Multi-line citation underlines look like broken row dividers** (`s13-about-mercury-frozen-phone.png`, `s13-about-nitrogen-desktop.png`):
    - Multi-line values (`solid, at normal pressure (1 atm)`, `a = 347.64 pm, c = 673.2 pm (triple point)`, `about 3.4 nm, 10 times their width`) draw a full-column-width dotted border directly on top of the solid hairline divider rather than tightly underlining the text. Also, `3` in `Atoms in each box` has no underline, making it unclear whether it is sourced.
15. **Desktop element cards lack the source-tap hint shown on phones** (`04-card-iron-desktop.png`, `s00-card-mercury-door-desktop.png` vs `s00-card-nitrogen-door-phone.png`):
    - Desktop cards show dotted underlines under facts (`Solid`, `1,538 °C`, `7.9 kg`) with no `"Click a value to see where it comes from"` hint, whereas phone cards include `"Tap a value to see where it comes from."`
16. **Minor card/map typography nits:**
    - `Half-\nmetals` breaks awkwardly mid-compound word above Boron (`04-card-iron-desktop.png`, `s00-card-mercury-door-desktop.png`).
    - Vietnamese uses old-style tone placement (`Thuỷ ngân`, `hoá lỏng`) in `s15-vi-*`; fully valid, though GDPT-2018 textbooks generally use `Thủy ngân` / `hóa lỏng` — worth a quick consistency check.

### D. Cheap-looking / inconsistent 3D & motion cues

17. **Atoms change scale between liquid and gas** (`s05-mercury-liquid-desktop.png` vs `s07-mercury-boiling-desktop.png`; `s03` vs `s02`):
    - In `s07` (mercury vapour), the Hg spheres shrink to roughly half the visual diameter of liquid Hg in `s05`. This directly breaks `STYLE.md §6` (*"Atoms from solid to gas, never a change of scale"*) and feels jarring when scrubbing past the boiling point.
18. **Daylight glass vessel is too faint** (`s04`, `s09`, `s12`, `s02`, `s05`):
    - On warm cream paper (`#F5F0E6`), the Fresnel glass edges barely register, making empty vessels (`s04`, `s09`, `s12`) look like faint wireframe outlines on a beige coaster rather than museum glass.
19. **Matte daylight beads lack porcelain luster and rob iconic elements of character** (`s05`, `s06`, `s10`, `s14`):
    - Liquid Mercury (`s05`) reads as dull slate-blue plastic marbles rather than lustrous metal; Sulfur (`s10`) is pea-green; Bromine (`s14`) is matte mauve. Even while keeping the family-pigment porcelain language, slightly crisper glaze highlights (closer to the tiles' `roughness 0.16` sheen) and a one-line note in `About this sample` explaining that colours follow the table's element families would elevate quality and prevent confusion.
20. **Empty vessel + developer-tone copy for molecular solids** (`s04`, `s09`):
    - *"We do not draw molecular crystals yet, so the vessel stands empty"* breaks the museum-book voice and reuses Oganesson's poignant empty-plinth motif for everyday Sulfur.
21. **Unexplained crystal-neighbour cutaway highlight** (`13-forge-start-desktop.png`, `s06-mercury-frozen-desktop.png`, `s06-mercury-frozen-phone.png`):
    - The 1 ink atom + 6/8 verdigris-green neighbours cutaway is a great visual idea, but without referencing the green highlight in the caption (e.g., *"Each atom touches 6 neighbours, shown in green"*), first-time visitors misread it as an impurity.
22. **Mid-dive chrome overlap (`s01-nitrogen-dive-desktop.png`) & blocky mid-condensation cloud (`s16-neon-cool-it-playing-desktop.png`):**
    - In `s01`, the opaque thermometer panel is already visible on top of a tightly zoomed, cropped hearth mid-dive, contradicting `STYLE.md §7` (*"the chrome steps aside"* during scale dive).
    - In `s16`, Neon mid-condensation (`−247 °C`) shows upper atoms arranged in stiff box-aligned columns above the liquid pool rather than organic condensing vapour.

### E. Jargon without a human phrase (`About this sample`)

23. **`s13-about-mercury-frozen-phone.png`:**
    - `rhombohedral (α-Hg type)` — needs a plain gloss (e.g., *"slanted cube — rhombohedral, α-Hg"*).
    - `a = 347.64 pm, c = 673.2 pm (triple point)` — `a`, `c`, `pm` (picometres), and `(triple point)` are unexplained, and listing the 3-atom hexagonal conventional cell right under `rhombohedral` without noting `(hexagonal axes)` will puzzle readers who look up α-Hg's 1-atom primitive cell.
24. **`s13-about-nitrogen-desktop.png`:**
    - `about 3.3 × 10¹¹ times` — lead with human scale (*"about 330 billion times (3.3 × 10¹¹)"*).
    - `about two covalent radii apart` — replace or gloss *"covalent radii"* (e.g., *"about one bond length apart"*).

---

## 4. Ranked fix list (most impact on feel first)

1. **Fix the 1,000× Oganesson half-life bug (`s12`, `s15-vi`) and card contradiction (`s00`).**
   - Change `680 milliseconds` / `680 mili giây` to **`0.7 milliseconds`** (or **`≈ 700 microseconds`**, matching NUBASE2020 $0.7^{+0.4}_{-0.2}\text{ ms}$; VI: **`0,7 mili giây`** / **`≈ 700 micro giây`**).
   - On Oganesson's card (`s00`), suppress `unreactive gases` (or override the subtitle to *"Group 18 · predicted solid, unlike lighter noble gases"*) so it stops contradicting `At 20 °C: Solid` two lines below.
2. **Unify and fix the thermometer widget across Iron Forge and all Sample views (`13`, `16`, `s02`–`s16`).**
   - **Fix tick-to-thumb alignment:** Compute both the thumb's `left` position and every tick/landmark `left` position on the exact same inner track coordinate range (excluding the left bulb width), so `20 °C` centres dead-on over `room temperature`, `−200 °C` sits strictly between `−210 °C` and `−196 °C`, and `377 °C` sits strictly right of `357 °C`.
   - **Fix Manganese's kiln theme (`s11`):** Use the exact `STYLE.md §9` kiln styling already working on Iron (`16-forge`): solid cream draggable thumb with ember ring, subtle rail-coloured bulb on the left, and a dark-to-bright fill from cold to hot.
   - **Add `About this sample ›` to Iron (`13`, `16`)** and use one shared thermometer component everywhere.
3. **Make temperature colour and fill direction match cold vs hot (`s02`–`s10`, `s14`–`s16`).**
   - Reserve `--ember` (`#B93E12` / `#F0874F` on kiln) for temperatures above room temp; use `--ink` at room temperature (`20 °C`) and cool slate-blue (`#2A6FAE`) below room temperature.
   - Anchor the thermometer fill at `room temperature`: grow cool icy-blue **leftward** as you cool below `20 °C`, and grow ember-orange **rightward** as you heat above `20 °C`, so `-272 °C` looks dramatically cold rather than an empty grey bar.
4. **Fix Sulfur's `S₈` mismatch (`s10`) and replace the empty-vessel TODO copy (`s04`, `s09`).**
   - For molten Sulfur (`s10`), either render genuine 8-atom $\text{S}_8$ ring clusters (matching the standard set by $\text{N}_2$ and $\text{Br}_2$ dumbbells) OR rewrite the caption honestly (*"115 °C: it melts. Its molecules — shown simplified here as single beads — slide past each other."*).
   - For molecular crystals not yet modelled (`s04` frozen N₂, `s09` solid S), stop showing an empty glass cube with *"We do not draw molecular crystals yet"* (reserve the empty plinth strictly for Oganesson and never-held superheavies). Either render a quiet frosted/translucent schematic lump with a plain label (*"Solid molecular crystal — schematic view; heat above 115 °C to see the liquid move"*) or note it cleanly in the door subtitle.
5. **Fix primary CTA state, hide redundant `Room temperature` at 20 °C, and align card door copy (`s00`, `s04`–`s08`, `s14`).**
   - Make `Heat it ▶` the primary black pill once the sample is at or below freezing (`s06`), and disable or swap `◀ Cool it` at the cold stop (offer `Warm it ▶` on cold gases like `s04`).
   - Hide `Room temperature` when `T === 20 °C` (eliminates low-contrast disabled text and fixes horizontal crowding on `s05-mercury-liquid-phone.png`).
   - Change gas element cards (`s00-card-nitrogen`) from `Hold a sample · cool or heat it` to `Hold a sample · cool it` when only cooling is supported.
6. **Prevent tick-stem collisions on close phase transitions (`s03`, `s06`, `s08`, `s15-vi`, `s16`).**
   - Give Neon's merged label (`s16`) two short leader ticks (or staggered two-row stems) so both `−249 °C` and `−246 °C` point accurately to the rail.
   - Add a small vertical clearance gap between tick stems and the top of the thumb, pad the left rail inset on phone (`s09`), and auto-flip/stagger overlapping ticks when the thumb passes under them (`s03`, `s06`, `s08`).
7. **Upgrade daylight 3D sample craft and fix liquid→gas scale shrinkage (`s02`, `s05`–`s07`, `s10`, `s12`).**
   - Keep atomic sphere radius constant across solid, liquid, and gas (`s05` vs `s07`, `s02` vs `s03`) per `STYLE.md §6`.
   - Strengthen the glass vessel's Fresnel edge and add a subtle rim contact line on the ceramic hearth + soft specular streak so it reads unmistakably as museum glass on cream paper.
   - Increase bead glaze crispness slightly (especially specular catchlights so daylight samples feel like glazed porcelain rather than matte clay) and add a brief note in `About this sample` that bead colours match the table's element families.
8. **Connect the green crystal highlight to the caption (`13-forge-start`, `s06`).**
   - Colour the phrase *"6 neighbours"* / *"8 neighbours"* in verdigris (or add *"shown in green"*) — following Ciechanowski's rule in `STYLE.md §2` (*"words coloured like the part they name"*) so the cutaway reads instantly without guesswork.
9. **Polish transition & condensation motion cues (`s01`, `s16`).**
   - Fade the thermometer panel *in* only after the scale dive finishes (`s01`), keeping the chrome aside during the camera move per `STYLE.md §7`.
   - Break up the grid-aligned vertical columns during gas→liquid condensation (`s16`) with organic radial/velocity jitter as particles settle.
10. **Smooth out `About this sample` jargon, underlines, and phone scroll cues (`s13-about-*`).**
    - Add a bottom scroll-fade gradient on the phone sheet (`s13-about-mercury-frozen-phone.png`).
    - Use inline dotted text-decoration (`text-decoration: underline dotted`) instead of full-width cell borders on multi-line sourced values, and ensure `Atoms in each box` carries a source too.
    - Gloss remaining technical terms in plain words: `"slanted cube (rhombohedral, α-Hg)"`, `"hexagonal cell: a = 347.64 pm, c = 673.2 pm (picometres; 1 pm = 10⁻¹² m)"`, `"about 330 billion times (3.3 × 10¹¹)"`, and `"about one bond length apart"`.
