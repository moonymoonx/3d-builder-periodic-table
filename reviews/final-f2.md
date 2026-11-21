# Fresh First-Time-Visitor Review — Round F2 (build `2ddd58d`)

Reviewed all 48 `s-` screenshots (desktop 1440×900 and phone 390×844) in `/workspace/out/redesign/final` and skimmed `h-`, `p-`, `c-`, and `a-` before reading `STYLE.md`, `SPEC.md` (§0 Feel), `DESIGN-RULES.md`, and `fps.txt`.

---

## 1. Hold a Sample — Scores (1–5, target ≥ 4)

| Axis | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.0** | Every screen makes the state, transition temperatures, and next action obvious within seconds, though iron's opening caption never explains its green neighbour cutaway and the huge scale jump on single-molecule/single-atom solids briefly trips intuition. |
| **Ease** | **4.0** | One direct thermometer, one-tap play, clear reset, and collision-free mobile tick labels make exploration effortless, docked slightly for inconsistent playback-bar controls, a stuck primary button past iron's boiling point, and a minor phone header layout mismatch on iron. |
| **Beauty** | **4.5** | The *Porcelain & Ink* daylight specimen vessel, quicksilver mercury, and incandescent `--kiln` forge glow feel genuinely museum-grade, held back from 5 only by a neon bead escaping outside the glass wall while condensing and the stark oversized single-sphere fallback solids. |
| **Smoothness** | **4.0** | After the low-tier bead-budget cut (330 → 180), `fps.txt` shows 59.9 FPS median (16.7 ms) across all sample states even on SwiftShader under heavy CPU load—with 57.2 avg FPS / 16.8 ms p95 on molten phone forge—though desktop molten/start forge still shows 33.4 ms p95 spikes (46–47.5 avg FPS) and real-device Medium/High timings are unmeasured. |
| **Delight** | **4.5** | The dark forge sweep through iron's glow and 912 °C re-stack, helium refusing to freeze a whisker above absolute zero, and the quietly moving empty vessel for oganesson deliver memorable wonder with calm restraint. |

---

## 2. Overall Whole-Build Check

| Axis | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.5** | Plain human language leads everywhere with real science and sources one tap away, and every view stays focused on a single question or gesture. |
| **Ease** | **4.5** | Consistent back links, generous touch targets, phone thumb-scrubbing, and clean EN/VI localisation make moving between all five views frictionless. |
| **Beauty** | **4.5** | A cohesive warm-paper porcelain aesthetic unifies every view while reserving dark rooms strictly for the forge and atomic emission light. |
| **Smoothness** | **4.5** | Patterns, Side by side, Inside the atom, and phone Table/Molten Forge hold ~60 FPS (16.7–16.8 ms p95) even on SwiftShader, with only modest desktop SwiftShader p95 dips under heavy load on Table and Forge. |
| **Delight** | **4.5** | Every section earns its own genuine aha moment—from the balance scale and graphite-vs-diamond to chromium's electron surprise, glowing spectra, and molten iron. |

**Other parts (anything below 4?):**
- **Table and card (`h-`):** Nothing below 4 — tactile porcelain tiles, on-table map labels, clean 3-fact/3-door cards, legible heat-map lens, and crisp VI localisation all look 4.5–5.
- **Patterns (`p-`):** Nothing below 4 — question-led headlines, clean annotated periodic waves, row/column toggle, log crustal abundance, and phone scrub layout all look 4.5 (only a tiny nit in `p-11-vi-melting-desktop.png` where the right-hand callout brushes the dashed `0 °C` line).
- **Side by side (`c-`):** Nothing below 4 — the litre balance scale (including mercury's puddle and unweighed oganesson pedestals), to-scale atoms, and graphite-vs-diamond lattice comparison are standout 4.5–5 work.
- **Inside the atom (`a-`):** Nothing below 4 — engraving-like stippled orbitals, explicit nucleus scale callouts, nodal paper sheets in *One cloud*, chromium's surprise note, and the dark-room spectral lines all look 4.5–5.

---

## 3. Visible Problems in the Sample (`s-`) Shots

1. **Atom escapes outside the glass vessel while condensing (`s-16-neon-condensing-desktop.png`).** On the right side of the glass cube, about 40% down from the top-right corner, a stray purple neon bead floats clearly outside the right glass wall in empty space.
2. **Hero iron arrival never explains the green/dark cutaway (`s-13-forge-start-desktop.png`, `s-13-forge-start-phone.png`, `s-12b-forge-dive-out-of-crystal-desktop.png`).** Unlike frozen mercury (`s-06`), which tints **6 neighbours** in verdigris and explicitly adds *"(in green around the dark one)"*, iron's 20 °C card shows the prominent green cluster around a dark atom while the caption says only *"Iron at room temperature: every atom touches 8 neighbours. Drag the thermometer to heat it."* A first-time visitor arriving on the suggested first element has to guess why part of the iron cube is green.
3. **Inconsistent playback control bar between light mode and kiln mode (`s-16-neon-cool-it-playing-desktop.png` vs `s-18-forge-heat-it-playing-desktop.png`).** While *Cool it* is auto-playing on neon, *Room temperature* and *Warm it* vanish leaving only a centered `Pause ❚❚` pill; while *Heat it* is auto-playing on iron, all three controls remain visible (`◀ Cool it`, `Room temperature` in a dark pill, and orange `Pause ❚❚`). Violates `DESIGN-RULES.md` consistency and always-visible reset expectations.
4. **Boiled iron omits gas speed (`s-17-forge-2950C-gas-desktop.png`).** Nitrogen (`s-02`, `gas · about 1,840 km/h`) and boiled mercury (`s-07`, `gas · about 1,020 km/h`) both display the RMS particle speed under the temperature readout, but boiled iron at 2,950 °C shows only `gas` (missing `about 4,310 km/h`).
5. **Primary action stays on `Heat it ▶` past iron's boiling point (`s-17-forge-2950C-gas-desktop.png`).** At 2,950 °C (already past 2,861 °C boiling and near the right end of the rail), `Heat it ▶` remains the solid orange primary button instead of flipping emphasis to `◀ Cool it` as mercury properly does past boiling (`s-07`, 377 °C).
6. **Minor factual/phrasing error on white phosphorus (`s-19-phosphorus-room-desktop.png`).** The caption reads *"a crystal of little pyramids of **4 white phosphorus atoms** (P₄)"*. Individual atoms are simply *phosphorus atoms*; "white phosphorus" is the bulk allotrope formed by those tetrahedral P₄ molecules (see [Royal Society of Chemistry — Phosphorus](https://www.rsc.org/periodic-table/element/15/phosphorus)). Looks like a template substituting the allotrope label where the element name belongs.
7. **Abrupt scale jump on single-molecule / single-atom fallback solids (`s-04-nitrogen-frozen-desktop.png`, `s-09` → `s-10`, `s-17` → `s-11`, `s-18-iodine-room-phone.png`, `s-19-phosphorus-room-desktop.png`).** `STYLE.md` §6 asks for *"a vessel sized to it"* and *"never a change of scale"*, yet the glass box stays the exact same size while ~180 tiny liquid/gas beads abruptly become 1 giant sphere (Mn) or 1 giant molecule (N₂, S₈, I₂, P₄) blown up ~5–10×. The honest caption prevents confusion, so it is a polish issue rather than a hard error, but a small zoom/scale cue (or tighter framing) would soften the jump.
8. **Phone card header layout differs on iron vs other elements (`s-13-forge-start-phone.png`, `s-14-forge-700C-glow-phone.png`, `s-16-forge-1600C-molten-phone.png` vs `s-06`, `s-09`, `s-11-manganese-molten-kiln-phone.png`).** On every other element, phone places the state below the temperature and aligns `About this sample ›` on the right; on iron—even when the state is just the short word `liquid` (`s-16`)—the state sits beside the temperature and `About this sample ›` drops onto a left-aligned second line.
9. **Family-pigment beads on famously coloured elements without an on-stage cue (`s-09` olive-green sulfur, `s-14` pink bromine, `s-18` pink iodine).** `About this sample` (`s-13-about-nitrogen-desktop.png`) honestly explains that bead colours come from the periodic table family rather than real appearance, which matches `STYLE.md` §6; still, adults who remember yellow sulfur or brown-red bromine may briefly second-guess the colour on the main screen without opening the drawer.

*(Numeric fact-check note: all tested melting/boiling points, transitions, speeds, and crystal data visible in the `s-` shots checked out accurately — including Fe 912 / 1,394 / 1,538 / 2,861 °C, Hg −38.83 / 357 °C and α-Hg 301.1 pm / 70.5° / 6 neighbours, Mn 58-atom cell and 1,246 / 2,061 °C, N₂ −210 / −196 °C / 1,840 km/h / 3.4 nm gap, He −269 °C never freezing at 1 atm, S 115 / 445 °C, P₄ 44.2 / 281 °C, Br₂ −7.2 / 58.8 °C, I₂ 114 / 184 °C, Ne −249 / −246 °C, and Og-294 0.7 ± 0.3 ms / ≈ 52 °C predicted melt.)*

---

## 4. Short Ranked Fix List

**Blockers for ≥ 4:** **None** — Hold a sample now clears ≥ 4.0 on all five axes. The ranked polish fixes below would move Clarity, Ease, Beauty, and Delight toward 4.5–5.0:

1. **Clamp condensing particle positions inside the vessel inner bounds** (`s-16-neon-condensing-desktop.png`) so beads never float outside the glass walls.
2. **Match iron's 20 °C caption to frozen mercury's cutaway cue** (`s-13-forge-start-desktop.png`, `s-13-forge-start-phone.png`): colour *"8 neighbours"* in verdigris and add *"(in green around the dark one)"* so the hero screen immediately explains the green cluster.
3. **Unify the auto-play button bar and post-boiling button emphasis** (`s-16-neon-cool-it-playing-desktop.png`, `s-18-forge-heat-it-playing-desktop.png`, `s-17-forge-2950C-gas-desktop.png`): keep `Room temperature` / `Back to 20 °C` visible during playback in both daylight and kiln modes, and flip primary emphasis to `◀ Cool it` once above boiling (matching mercury `s-07`).
4. **Show RMS gas speed on boiled metals in kiln mode** (`s-17-forge-2950C-gas-desktop.png`) so boiled iron displays `gas · about 4,310 km/h` just like nitrogen and mercury.
5. **Fix the white phosphorus wording** (`s-19-phosphorus-room-desktop.png`) from *"4 white phosphorus atoms (P₄)"* to *"4 phosphorus atoms (P₄)"*.
6. **Align iron's phone card header layout with all other elements** (`s-13`/`s-14`/`s-16` phone) and consider adding a subtle *"zoomed in"* cue on single-atom/single-molecule fallback solids (`s-04`, `s-09`, `s-17`, `s-18`, `s-19`).
