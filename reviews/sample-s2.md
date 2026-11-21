# First-Time-Visitor Review — Round S2 (`sample-r2-merged`, build `0484ba5`)

Reviewed all 42 screenshots in `/workspace/out/redesign/sample-r2-merged` (desktop `1440×900` and phone `390×844`, EN and VI, plus hero/forge spot checks) before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, `ref/VIDEO_NOTES.md`, or `sample-r2/fps.txt`.

---

## 1. First 5 seconds

- **What I think this is:** A calm, museum-grade interactive periodic table rendered like glazed porcelain tiles on warm archival paper. Entering **Hold a sample** places me in front of a physical specimen vitrine — a clear glass cube on a ceramic hearth holding atoms or molecules — with a simple thermometer below it.
- **What I think I should do:** On the table, the bottom prompt (*"Tap one to look inside."*) makes tapping any tile obvious. Inside a sample view, the big pill (**Heat it ▶** / **◀ Cool it**) and the single thermometer knob immediately tell me to drag the temperature or press play. When the room dims for glowing iron or molten manganese, it feels like stepping into a darkroom or smith's forge.
- **What draws my eye:**
  - The sunlit tactility of the tiles (`01`), the mirror-bright quicksilver beads of room-temperature mercury (`s05`), the tangled 8-bead rings in molten sulfur (`s10`), the glowing molten iron/manganese pools (`16`, `s11`), and the striking **empty glass case** for oganesson (`s12`) — instantly communicating *"nobody has ever held this"* without a lecture.
- **What is immediately confusing or jarring:**
  1. **Neon escaping its glass box (`s16-neon-condensing`, `s16-neon-cool-it-playing`):** Purple spheres visibly poke outside the left and right glass walls, breaking the physical illusion of the vitrine.
  2. **The giant lone floating ball/molecule (`s04-nitrogen-frozen`, `s09-sulfur-honest-card`, `s17-manganese-room`, `s17-manganese-red-hot`, `s18-iodine-room`):** Sliding nitrogen from liquid (`-200 °C`, hundreds of tiny pairs) to frozen (`-218 °C`) abruptly swaps the whole puddle for two huge floating green peas separated by air inside the exact same cavernous glass box. Manganese at room temp and `1,027 °C` looks like a single levitating billiard ball.
  3. **Mercury changing material when it freezes (`s05` → `s06`):** At `20 °C` mercury is dazzling metallic chrome; at `-48 °C` it abruptly snaps to matte slate-blue, looking like a different substance (or a shader bug) rather than frozen silver metal.
  4. **The empty vitrine floor artifact (`s12-oganesson-never-desktop`):** Because oganesson's case is empty, my eye goes straight to the hearth floor — and lands on obvious diagonal shadow-acne striping and a hard diagonal triangle seam.
  5. **Iron feels like an older sibling (`13`–`17` vs `s02`–`s18`):** Iron is missing the **About this sample ›** link that every other sample has, shows a dimmed `Room temperature` link even when already at `20 °C`, renders `20 °C` in rust-orange instead of ink-black, and has no `◀ Cool it` button even at `2,950 °C`.

---

## 2. Scores (1–5; strict: 4 = genuinely good, 5 = exceptional; target ≥ 4 everywhere, 4.5+ on beauty & delight)

| Axis | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.0** | Plain-English hooks, landmark ticks, honest empty-case storytelling, and the non-overlapping `About this sample` drawer make almost every state graspable in seconds, held back by raw molecular formulas (`N₂`, `S₈`, `Br₂`, `I₂`) and detail jargon (`covalent radius`, `on hexagonal axes`, VI `chu kì bán rã`) without human glosses, colliding Neon ticks, and `At 20 °C: Solid` lacking a predicted cue on Oganesson's card. |
| **Ease** | **4.0** | One-tap `Cool it`/`Heat it` sweeps, clear `Room temperature`/`Back to 20 °C` resets, clean desktop/phone sheet geometry, and consistent single-pill back links make exploration effortless, penalized by Iron's merged-build regressions (missing `About this sample`, missing `Cool it`, disabled `Room temperature` at `20 °C`) and clipped scroll rows in Gold (`06`) and frozen Mercury (`s13`). |
| **Beauty** | **3.5** | The Porcelain & Ink art direction, sunlit tiles, quicksilver liquid, and glowing molten pools are genuinely gorgeous, but Neon bursting through its glass box (`s16`), glaring floor z-fighting in the empty Oganesson vitrine (`s12`), lone floating spheres and unjoined molecule beads (`s04`, `s09`, `s17`, `s18`), Mercury's chrome-to-blue snap (`s05`→`s06`), overblown Iron gas glow (`17`), and the muddy brown low-heat slider fill (`s07`, `s10`) pull craft well below the 4.5 target. |
| **Smoothness** | **4.0** | Every sample state holds a 16.7 ms median (59.9 FPS) even on CPU SwiftShader (`sample-r2/fps.txt`, 60.0 avg FPS on almost all phone shots and 16.0 ms on the Nitrogen dive), held back from 4.5 by 83.3 ms p95 hitches (35.7 avg FPS) during Neon's active `Cool it` sweep (`s16`, echoing the forge's 83–100 ms `Heat it` spikes) and abrupt visual pops across solid↔liquid fallback transitions (`s03`→`s04`, `s05`→`s06`). |
| **Delight** | **4.0** | Paired N₂ dumbbells condensing into a puddle (`s02`→`s03`), Helium refusing to freeze at `-272 °C` (`s08`), tangled S₈ rings in molten sulfur (`s10`), real 6-neighbour frozen mercury (`s06`), and the empty Oganesson vitrine (`s12`) create genuine museum wonder, but the spell breaks whenever particles clip the glass, a lone marble floats in mid-air, or Iron lags behind the newer sample controls. |

### Honest comparison with Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)
**Is this better on feel?** **Yes, overall — clearly better on calm, readability, mobile usability, performance, and scientific honesty, though not yet decisively ahead on 3D specimen polish in the edge/fallback states.**
- **Where this beats Sael:** Sunlit editorial calm vs. bloom-heavy dusk showroom; legible screen-space typography and plain-English framing vs. tiny 3D callouts and dense top-right controls; genuine 60 FPS median even on software rendering vs. heavy, laggy frames; real α-Hg crystal, molecular pairs/rings, unfreezable liquid helium, and Oganesson's empty glass case vs. Sael's generic cubic grid for every solid; real phone ergonomics.
- **Where Sael still holds an edge in this round:** Sael's glass-cube particle sim does not show spheres poking through the glass (`s16`), floor z-fighting inside an empty case (`s12`), or a single bare sphere floating in a full-sized cube (`s17`). Fixing those 3D craft flaws and unifying Iron with the new sample chrome will put this comfortably ahead of Sael on every dimension.

---

## 3. Every visible problem

### A. Cheap-looking / broken 3D & material discontinuities
1. **Particles clipping outside the glass vessel (`s16-neon-condensing-desktop.png`, `s16-neon-cool-it-playing-desktop.png`):** In `s16-neon-condensing`, a stray purple Neon sphere hovers clearly outside the right glass wall. In `s16-neon-cool-it-playing`, the left and right sides of the condensing puddle visibly protrude past both vertical glass edges. Neon's bead radius also looks noticeably bloated relative to Helium (`s08`) and Mercury (`s05`).
2. **Shadow acne / z-fighting & diagonal seam on the vessel floor (`s12-oganesson-never-desktop.png`, `s15-vi-oganesson-phone.png`, `s09-sulfur-honest-card-phone.png`, `s17-manganese-room-desktop.png`, `s18-iodine-room-phone.png`, `s01-nitrogen-dive-desktop.png`, `13-forge-start-phone.png`):** Diagonal striping/moiré and a sharp diagonal shading split across the recessed square inside the hearth — directly violating `STYLE.md §10` (*"Don't: harsh default shadow acne"*). Most glaring on Oganesson where the empty case puts the floor center-stage.
3. **Hard horizontal shading band across glowing hearth (`s17-manganese-red-hot-phone.png`):** Below the glowing orange manganese sphere, a crisp straight horizontal tonal seam cuts across the lower third of the ceramic plate.
4. **Oversized vessel + giant scale jump + disconnected atoms in "crystal not drawn" fallbacks (`s04-nitrogen-frozen`, `s09-sulfur-honest-card`, `s17-manganese-room`, `s17-manganese-red-hot`, `s18-iodine-room`):**
   - Violates `STYLE.md §6` (*"in a vessel sized to it"* and *"Atoms from solid to gas, never a change of scale"*): the full-size glass cube stays huge while one ~10× enlarged atom or molecule floats alone in mid-air.
   - Manganese (`s17-manganese-room`, `s17-manganese-red-hot`) reads as a single generic glossy sphere floating in empty space — the cheapest-looking 3D in the entire build.
   - In `s04-nitrogen-frozen` (N₂), `s18-iodine-room` (I₂), and `s09-sulfur-honest-card` (S₈), the constituent spheres have **visible gaps of empty air between them** with no connecting bonds or overlap, contradicting *"two atoms joined"* (`s13-about-nitrogen`) and making S₈ look like 8 floating green peas in a circle.
5. **Jarring Mercury material jump (`s05-mercury-liquid` → `s06-mercury-frozen`, `s07-mercury-boiling`):** Liquid mercury renders as mirror-bright quicksilver (`s05`), then snaps to flat matte slate-blue (`#8FA9CF`) as soon as it freezes into solid metal (`s06`) or boils (`s07`). Even though `STYLE.md §6` specifies quicksilver for *"a liquid metal by day"*, visually losing all metallic sheen when mercury freezes feels like a rendering glitch.
6. **Overblown Iron gas glow (`17-forge-2950C-gas-desktop.png`):** Additive sprites stack into a blinding white-yellow central blob that flattens spheres into pale disks and bleeds past the glass walls, pushing against `STYLE.md §6` (*"so each stays a sphere"*) and `§10` (*"Don't: heavy bloom"*).

### B. Merged-build inconsistencies (Iron forge vs. other samples)
7. **Iron lacks `About this sample ›` (`13-forge-start-desktop.png`, `13-forge-start-phone.png`, `14`, `16`, `17`):** Every other sample (`s02`–`s18`, except Oganesson's empty-box card) offers `About this sample ›` right under the state subtitle. Iron — the hero wow-moment element — omits it completely.
8. **Iron's `Room temperature`, `20 °C` color, and missing `◀ Cool it` (`13`–`17`):**
   - At `20 °C`, Iron shows a faded/disabled `Room temperature` button (`13-forge-start-desktop/phone`), whereas all other samples hide it at `20 °C` and label it `Back to 20 °C` on phones (`s03`, `s06`, `s08`, `s11`, `s17`).
   - At `20 °C`, Iron prints `20 °C` in `--ember` rust-orange (`13`), whereas every other sample prints `20 °C` in `--ink` charcoal (`s02`, `s05`, `s09`, `s14`, `s17`, `s18`).
   - When hot (`16`, `17`), Iron never offers `◀ Cool it`, leaving `Heat it ▶` as the sole button even at `2,950 °C` (past boiling).
9. **Stray pill background on `Room temperature` during Neon playback (`s16-neon-cool-it-playing-desktop.png`):** `Room temperature` wears a pale-teal pill fill instead of the plain verdigris text link used everywhere else (`s03`, `s04`, `s06`, `s07`, `s08`, `s10`, `s16-neon-condensing`, and `STYLE.md §5`), making it look toggled-on alongside `Pause ⏸`.

### C. Overlapping, clipped, or awkward UI / typography / contrast
10. **Mid-glyph scroll clipping (`06-card-gold-all-numbers-desktop.png`, `s13-about-mercury-frozen-phone.png`):**
    - In Gold's expanded card (`06`), `Boiling point  2,856 °C (3,129 K)` is sliced horizontally in half right above the `< Platinum  Mercury >` footer; the bottom scroll fade is too shallow to mask the cut.
    - In Mercury's `About this sample` phone sheet (`s13`), the last line (`on hexagonal axes; the slanted…`) is cropped half-height against the bottom viewport edge with almost no fade.
11. **Crowded Neon thermometer ticks (`s16-neon-condensing-desktop.png`, `s16-neon-cool-it-playing-desktop.png`):** The `-249 °C freezes` and `-246 °C turns liquid` vertical tick stems are ~2 px apart, collapsed onto one label (`-249 °C freezes · -246 °C turns liquid`) and buried under the knob at `-247 °C`.
12. **Knob glow obscuring `iron melts` tick (`s11-manganese-molten-kiln-desktop.png`):** At `1,427 °C`, the bright white halo of the knob partially swallows the `iron melts` (`1,538 °C`) tick stem below the track, making `iron melts` look at a quick glance like it marks the current `1,427 °C` position.
13. **Muddy dark-brown slider fill for non-glowing heat (`s07-mercury-boiling-desktop.png`, `s10-sulfur-molten-desktop.png`):** Between `20 °C` and ~`490 °C` on the light card, the heated portion of the thermometer fills with near-black chocolate brown, clashing with the bright `--ember` temperature readout (`377 °C`, `150 °C`) and looking dead/muddy next to the crisp blue cooling fill (`s03`, `s06`, `s08`).
14. **Vietnamese button icon spacing (`s15-vi-mercury-desktop.png`, `s15-vi-nitrogen-liquid-phone.png`):** `◀Làm lạnh` has essentially no gap between the left triangle and `L` (unlike English `◀ Cool it` or `Nung lên ▶` / `Làm ấm ▶`).
15. **Very faint dotted underlines & duplicate source hint on desktop cards (`04-card-iron-desktop.png`, `06-card-gold-all-numbers-desktop.png`, `s00-card-mercury-door-desktop.png`):** On desktop, the dotted underlines beneath clickable values (`Solid`, `1,538 °C`, `7.9 kg`) are much fainter than on phone (`s00-card-nitrogen-door-phone.png`), and `"Tap a value to see where it comes from."` repeats both above the 3 doors (`04`) and again inside `All numbers & sources` (`06`). Also, `s00-card-oganesson-door-phone.png` displays `At 20 °C: Solid` in upright bold without `≈` or italic (unlike `s12-oganesson-never-phone.png`, which carefully marks `Predicted at 20 °C: solid` in italic).

### D. Jargon without a human phrase (violating `STYLE.md §4` & `DESIGN-RULES.md`)
16. **Bare chemical formulas in headline sample captions (`s02`, `s03`, `s04`, `s09`, `s10`, `s14`, `s18`):** Captions say `"N₂ molecules"`, `"Br₂ molecules"`, `"S₈ molecules"`, `"I₂ molecules"` without first naming the geometry in plain words (e.g., *"pairs of nitrogen atoms (N₂)"*, *"8-atom rings (S₈)"*). A visitor who left chemistry decades ago looking at the 8-bead ring in `s09` is never told in plain words that sulfur forms rings of eight.
17. **Unexplained jargon in `About this sample` (`s13-about-nitrogen-desktop.png`, `s13-about-mercury-frozen-phone.png`):**
    - `covalent radius` in Nitrogen's footnote (`"twice the covalent radius, an approximation"`) has no human phrase.
    - `on hexagonal axes` and `picometres (pm)` in frozen Mercury (`a = 347.64 pm, c = 673.2 pm / its sides, in picometres (pm), on hexagonal axes` and `Atoms in each box: 3 / on hexagonal axes; the slanted…`) clash confusingly with the row right above it calling the pattern *"a slanted cube"* (whose primitive cell has 1 atom and equal sides, not 3 atoms on `a` and `c`), and picometres isn't glossed (e.g. *"trillionths of a metre"*).
18. **Vietnamese half-life jargon (`s15-vi-oganesson-phone.png`):** The main stat translates half-life warmly (`Một nửa số nguyên tử phân rã sau 0,7 ± 0,3 mili giây`), but the footnote drops into textbook jargon (`chu kì bán rã 680 ± 540 mili giây`) where English stayed plain (`is listed at 680 ± 540 milliseconds`).
19. **Internal-sounding status subtitle (`s04`, `s09`, `s17`, `s18`):** `solid · crystal not drawn` reads like a developer disclaimer rather than museum copy (compare *"solid · one molecule shown"* or *"solid · one atom shown"*).

### E. Factual / scientific accuracy check
20. **N₂ bond-length approximation overstated as "about their real bond length" (`s13-about-nitrogen-desktop.png`):** The footnote reads *"Each N₂ molecule is drawn as two atoms joined at about their real bond length (twice the covalent radius, an approximation)."* Doubling nitrogen's single-bond covalent radius (Cordero et al. 2008: `71 pm` → `142 pm`) is **~29 % longer** than the actual N≡N triple-bond length of **109.77 pm** (NIST CCCBDB: https://cccbdb.nist.gov/exp2.asp?casno=7727379) — and visually in `s04-nitrogen-frozen-desktop.png` the two spheres do not even touch. Either use the true experimental bond length (`110 pm`, overlapping spheres / short bond cylinder) or stop claiming *"about their real bond length"* when using `2 × r_cov`.
*(All other spot-checked numbers — N₂ `511 m/s` / `1,840 km/h` and `3.4 nm` spacing, Hg `1,020 km/h`, `-38.83 °C`, `357 °C`, α-Hg `6` nearest neighbours and `a = 347.64 pm, c = 673.2 pm` on hexagonal axes, He liquid near `-272 °C`, S `115 °C` / `445 °C` S₈ liquid at `150 °C`, Mn 58-atom cell / `1,246 °C` / `2,061 °C`, Og-294 `0.7 ± 0.3 ms` and Og-295 `680 ± 540 ms` unconfirmed — check out.)*

### F. Mobile-specific issues (`390×844`)
- Clipped bottom line in `s13-about-mercury-frozen-phone.png`.
- Iron phone (`13-forge-start-phone.png`) diverges from every other sample phone view: shows `Room temperature` (disabled at `20 °C`) instead of hiding it / using `Back to 20 °C`, and omits `About this sample ›`.
- Hard horizontal shading band across the heated plinth in `s17-manganese-red-hot-phone.png`.
- `s00-card-oganesson-door-phone.png` shows `At 20 °C: Solid` without a predicted indicator.

---

## 4. Ranked fix list (highest impact on feel first)

1. **Fix Neon particle containment inside the glass vessel (`s16-neon-condensing`, `s16-neon-cool-it-playing`).**
   - Clamp every particle's center to `halfInnerBox - beadRadius - margin` along X, Y, and Z in both gas and condensing/liquid physics, and normalize Neon's visual bead radius to match Helium/Mercury (`s05`, `s08`) so no sphere ever intersects or escapes the glass walls.
2. **Eliminate the glass-floor z-fighting / shadow acne & diagonal triangle seam (`s12`, `s09`, `s17`, `s18`, `s01`).**
   - Raise the glass vessel's bottom contact plane (or remove the coplanar bottom face of the glass cube so only the outer rim/contact ring meets the plinth), tune shadow `bias` / `normalBias` (or use baked soft contact shadow only on the hearth, matching `STYLE.md §6`), and check the plinth shader's reflection/point-light cutoff causing the horizontal band in `s17-manganese-red-hot-phone.png`.
3. **Unify Iron's forge view with the new sample UI (`13`–`17` vs `s02`–`s18`).**
   - Add `About this sample ›` to Iron (showing its BCC/FCC transitions, lattice constant, and sources).
   - Use `--ink` for `20 °C` at room temperature, hide `Room temperature` / `Back to 20 °C` when already at `20 °C`, and add `◀ Cool it` once heated above `20 °C` (switching primary emphasis to `◀ Cool it` at the top of the range, just like Mercury `s07`).
4. **Upgrade the "crystal not drawn" fallback from a lone floating sphere / unjoined peas (`s04`, `s09`, `s17`, `s18`).**
   - **Join molecular atoms cleanly:** Overlap spheres or add subtle matte bond necks in `N₂`, `I₂`, and `S₈` (with a clear puckered crown tilt for `S₈`, and true ~`110 pm` bond ratio for `N₂` so `s13-about-nitrogen` is factually right).
   - **Follow `STYLE.md §6` ("in a vessel sized to it"):** Shrink the glass vitrine and hearth proportionally around single-molecule/single-atom specimens (or frame closer with a subtle scale-change cue) and add a faint studio pedestal shadow beneath the turning molecule so it feels curated, not stranded in an oversized box. For complex-cell metals like Manganese (`s17`), consider a small stylized cluster or soft matte-ceramic specimen bead on a proportional mini-plinth rather than a giant floating billiard ball, and rename `solid · crystal not drawn` to `solid · one molecule shown` / `solid · one atom shown`.
5. **Fix Mercury's chrome-to-slate-blue material snap (`s05` → `s06`, `s07`).**
   - Keep solid mercury (`s06`) metallic quicksilver (slightly higher roughness than liquid, e.g. `0.22–0.28`, still silver-tinted with subtle family hue) so freezing mercury reads as liquid silver crystallizing into solid silver rather than turning blue, while keeping the verdigris 6-neighbour highlight crisp against it.
6. **Refine thermometer fills, ticks, and playback controls (`s07`, `s10`, `s11`, `s16`, `17`, `s15-vi`).**
   - Warm up the daylight heat fill between `20 °C` and glow onset (`s07`, `s10`) from muddy dark brown to a clear muted terracotta/amber ramp leading into `--ember`, matching the readout color.
   - Remove the stray pale-teal pill background on `Room temperature` during `Pause ⏸` playback (`s16-neon-cool-it-playing`) so tertiary links stay borderless verdigris text.
   - Give Neon's `-249 °C` and `-246 °C` ticks (`s16`) a minimum visual separation or short angled leader lines so both transitions read clearly even when the knob sits at `-247 °C`.
   - Add a normal space after `◀` in Vietnamese `◀ Làm lạnh` (`s15-vi-*`).
   - Dial back additive sprite intensity/radius on Iron gas at `2,950 °C` (`17-forge-2950C-gas`) so individual glowing spheres stay legible instead of blowing out into a white cloud.
   - Smooth out the `83 ms` p95 frame spikes during active `Cool it` / `Heat it` sweeps (`sample-r2/fps.txt`: `s16`, `18`) — likely caused by per-frame DOM/text/slider reflows or geometry rebuilds during continuous sweep ticks.
7. **Fix card/sheet scroll fades, Oganesson predicted cue, and plain-language wording (`04`, `06`, `s00`, `s13`, `s15-vi`).**
   - Increase the bottom scroll-fade gradient height (e.g. `36–44 px` into `--card`) on Gold's expanded card (`06`) and the phone `About this sample` sheet (`s13`) so text fades softly instead of clipping mid-glyph.
   - On Oganesson's element card (`s00-card-oganesson-door-phone`), style `At 20 °C` as italic *`Solid (predicted)`* or `Predicted at 20 °C: solid` to match `s12-oganesson-never`.
   - Strengthen desktop dotted underlines on tappable facts (`04`, `s00-mercury`) to match mobile legibility, and avoid repeating `"Tap a value to see where it comes from."` twice on the same expanded card (`06`).
   - Pair every formula/jargon term with a plain phrase first: `"pairs of nitrogen atoms (N₂)"`, `"8-atom rings (S₈)"`, `"picometres (trillionths of a metre)"`, explain why α-Hg's *"slanted cube"* is listed on hexagonal axes (or show the primitive rhombohedral `a ≈ 301 pm, α ≈ 70.5°, 1 atom` alongside it), drop `"covalent radius"` from Nitrogen's footnote (use the real `110 pm` bond length), and replace VI `chu kì bán rã` in `s15-vi-oganesson-phone` with plain Vietnamese matching the English note.
