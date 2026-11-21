# First-Time-Visitor Review — Hero Slice (Round 5)

Cold review of all 30 screenshots in `/workspace/out/redesign/hero-r5/` (desktop `1440×900` and phone `390×844`), conducted before reading `STYLE.md`, `SPEC.md`, `DESIGN-RULES.md`, or `ref/VIDEO_NOTES.md`, then checked against those documents and `fps.txt`.

---

## 1. First 5 Seconds

- **What I think this is:** A calm, museum-grade interactive 3D periodic table. It reads immediately as 118 glazed ceramic/porcelain blocks resting on warm linen paper—closer to a Dieter Rams object or a Bartosz Ciechanowski explainer than a cramped high-school wall chart.
- **What draws my eye:**
  - **Desktop (`01-first-load-desktop.png`):** The sunlit bevelled tiles and their soft contact shadows own the viewport. My eye moves straight from the porcelain table to the italic serif line (*"Everything you have ever touched is made of atoms — and every atom is one of these 118 kinds."*) and the verdigris prompt (**"Tap one to look inside."**), then notices the quiet lens pills below and the `"Try iron"` tag (`02-try-iron-hint-desktop.png`).
  - **Phone (`01-first-load-phone.png`):** The prompt at the top (*"Touch and slide across the table — lift to open."*) immediately tells me how to interact with tiles that would otherwise be too small to tap, and the thumb-scrub loupe (`03-thumb-scrub-phone.png`) pays off that promise cleanly.
- **What I think I should do:** Tap a tile (especially Iron once `"Try iron"` appears), hover across elements (`03-hover-gold-desktop.png`), or try the bottom lens chips (`Heat map`, `Melting point`, `Heft`).
- **Anything immediately confusing:**
  - On first glance, `"Heat map"` sounds like a continuous colour-gradient heatmap rather than a solid/liquid/gas state-at-temperature slider (`08-lens-heat-1000C-*`), especially sitting right next to `"Melting point"`.
  - On portrait phone (`01-first-load-phone.png`), the table occupies a relatively narrow strip in the middle with large blank ivory margins above and below it.
  - Inside the forge (`13`–`18`), two things break the instant comprehension: (a) a bare `"1,394 °C"` tick with no explanation of what happens at that temperature, and (b) in the dark kiln states (`14`, `15`, `18`), the glowing central cutaway pocket looks like an unexplained fiery cavity/hot-spot in the front face rather than a clean 8- or 12-neighbour crystal diagram.

---

## 2. Scores (1–5, Strict)

| Criterion | Score | One-sentence reason |
|---|---:|---|
| **Clarity** | **4.5** | First-5-second hierarchy, plain-language family map, human-scale facts, and gas-adapted copy are immediately legible on desktop and phone, held back from 5 only by the `"Heat map"` label, the unexplained bare `"1,394 °C"` tick, and the missing scroll cue on the phone card. |
| **Ease** | **4.0** | The phone thumb-scrub loupe, generous pills, always-visible back/reset paths, and one-tap `"Heat it ▶"` make exploration effortless, but the forge slider thumb visibly lags behind its own tick marks (`16` phone, `17` desktop) and the phone card hides its scrollable details with no fade or peek. |
| **Beauty** | **4.0** | The daylight porcelain table, zoomed ceramic glaze (`10`), molten iron pool (`16`), and glowing vapour (`17`) are genuinely 4.5–5.0 craft, but two glaring blemishes inside the hero forge—the broken thermometer bulb/thumb collisions (`14`–`18`) and the messy glowing cutaway cavity (`14`, `15`, `18`)—keep overall beauty just below 4.5. |
| **Smoothness** | **4.0** | Continuous scale-dive frames (`12a`/`12b`) and ~60 median FPS even on CPU SwiftShader under heavy load (`~8.0`) show strong frame pacing, held back from 4.5 by the slider thumb/fill tracking desync during scrubbing and the noisy `66.7 ms` p95 spike on `18` that still warrants real-device verification. |
| **Delight** | **4.0** | Diving into a porcelain tile, dimming into a forge, seeing iron truly re-stack BCC→FCC, and watching it collapse into glowing beads and embers are memorable wonder moments, but the obscured 8-vs-12 neighbour cutaway and broken thermometer chrome distract right at the climax. |

### Honest comparison with Ryan Sael's `sael.net/periodic-table` (`ref/VIDEO_NOTES.md`)

**Yes—this is already better on feel overall**, and decisively better on **clarity, ease, calm, mobile usability, and scientific depth**:
- Sael's dusk showroom relies on dark PBR + heavy bloom and tall default columns for instant spectacle, but it is visually noisy, heavy/slow, hard to click, lacks search and mobile ergonomics, and uses a generic cubic grid in Sample view.
- This redesign ("Porcelain & Ink") feels calmer, more legible, and far more respectful of a curious adult's attention: sunlit tactile specimens on paper, zero clutter, a real thumb-scrub loupe on phones, sourced human-scale facts, and true BCC→FCC→molten→vapour iron physics where the dark forge earns its drama instead of drowning the whole app in darkness.
- **Where it isn't yet a knockout on beauty/delight:** Sael's glossy bloom hides rough edges, whereas a minimalist porcelain-and-ink stage puts every pixel under a microscope. Right now, the thermometer thumb/bulb defects (`14`–`18`) and the fiery cutaway smear (`14`–`15`) momentarily undercut the forge's museum-grade finish. Fix those two areas and this beats Sael across every single dimension—hitting 4.5+ on both beauty and delight.

---

## 3. Every Visible Problem

### Overlapping, misaligned, or clipped UI & text
1. **Forge thermometer thumb collides with tick labels (`14`, `15`, `17`, `18`):** The circular thumb sits too close to the lowest label row and cuts straight through `"re-"` / `"re-stacks"` in `14-forge-700C-glow-desktop.png`, `14-forge-700C-glow-phone.png`, `15-forge-930C-restacked-desktop.png`, and `18-forge-heat-it-playing-desktop.png`, and slices directly across `"2,861"` in `17-forge-2950C-gas-desktop.png`.
2. **Forge thermometer thumb is out of sync with the fill bar and tick marks (`16-forge-1600C-molten-phone.png`, `17-forge-2950C-gas-desktop.png`):**
   - At `2,950 °C` (`17`), the bright yellow-white fill bar protrudes ~10–12 px *to the right* of the circular thumb, while the thumb itself sits *to the left* of the `2,861 °C` tick.
   - At `1,600 °C` on phone (`16` phone), the thumb sits *to the left* of the `1,538 °C melts` tick—directly underneath the `1,394 °C` stem—visually contradicting `"1,600 °C · liquid"`.
   - Root cause: tick positions and fill width use raw `0–100%` of the track, whereas the native `<input type="range">` thumb center travels within `[thumbRadius, width - thumbRadius]`.
3. **Broken "Pac-Man" cold bulb on the left of the forge thermometer (`14`–`18`):** Once the thumb moves right of 20 °C, the left-end bulb appears as an orange circle with a dark bite/notch cut out of its right side where the track meets it (hidden at 20 °C only because the thumb sits over it).
4. **Phone `"912 °C re-stacks"` label detached from its tick (`13`, `14`, `16` phone):** On `390 px` width, `"912 °C re-stacks"` is pushed far left so `"912 °C"` sits directly over the `lead melts` tick (~11% across the bar) while its actual tick mark sits far to the right under `"stacks"` (~31%).
5. **Vietnamese family label grazes the `H` tile (`11-vi-landing-desktop.png`):** `"Kim loại khoáng"` nearly touches the right edge of the `H` block. In English (`01-first-load-desktop.png`), `"Mineral metals"` also sits slightly close to `H`, creating minor visual ambiguity about whether `H` belongs to it.
6. **Desktop card floating family label crowds lifted tile (`04-card-iron-desktop.png`, `07-card-oxygen-gas-desktop.png`):** `"Workhorse metals"` sits ~2–3 px above the lifted `Fe` tile's top verdigris border; `"Nonmetals of life"` and `"Salt-makers"` crowd similarly close to lifted `O`.
7. **3D column occlusion in `Heft` lens on phone (`09-lens-heft-phone.png`):** Even with the steeper angle, tall actinides (`Ac`–`No`) clip the lower halves of the lanthanides (`La`–`Yb`) directly behind them, and tall period 6–7 transition metals (`W`–`Au`, `Rf`–`Rg`) clip period 5 (`Nb`–`Ag`). (On desktop `09-lens-melting-desktop.png`, only `W`/`Re`/`Os` slightly graze `Mo`/`Tc`/`Ru`—much cleaner.)

### 3D / Visual craft issues
8. **Forge unit-cell cutaway looks like a glowing cavity/glitch in the kiln (`14`, `15`, `18`) and is hard to count in daylight (`13`):**
   - At 20 °C (`13`), the shrunken cutaway atoms linger as tiny floating pebbles around a uniform dark-verdigris cluster; because the centre atom and its 8 neighbours share the same dark colour and sit recessed inside the face, you cannot immediately count *"1 atom touching 8 neighbours"* at a glance.
   - At 700–930 °C (`14`, `15`, `18`), intense additive glow + gold rims inside the recessed pocket create a blazing orange-red hot-spot with dark dots inside it—reading at first glance like a laser-burned hole or shading bug rather than a clear transition from 8 neighbours (`14`) to 12 neighbours (`15`).
9. **Milky glass vessel faces on the dark kiln backdrop (`14`–`17`):** `STYLE.md` §6 specifies *"a glass vessel that shows only at its edges (Fresnel, no wireframe)"*, but in `14`–`17` the flat faces of the cube have noticeable uniform pale-grey opacity, slightly hazing the dark kiln backdrop behind the glowing atoms.

### Contrast, hierarchy & consistency issues
10. **Phone element card missing scroll fade and sliver of content below (`04`, `05`, `11-vi` phone):** `STYLE.md` §5 explicitly requires *"a sliver of what follows"* and *"the body fades out at the bottom whenever more waits below."* In all three phone card screenshots, the sheet ends cleanly on flat padding below `"Side by side"`, giving zero visual cue that boiling points, `"↗ across the table"`, and `"All numbers & sources"` exist by scrolling.
11. **Inconsistent source-tap signifiers between desktop and phone cards (`04`, `05`, `06`, `07`):** On phone (`04`, `05`), the three summary values (`Solid`, `1,538 °C`, `7.9 kg`) have dotted underlines plus `"Tap a value to see where it comes from."` On desktop (`04`, `05`, `07`), those same three summary values have *no* dotted underlines and *no* prompt (dotted underlines appear only inside `"All numbers & sources"` in `06`).
12. **Low-contrast disabled `"Room temperature"` button at 20 °C (`13-forge-start-desktop.png`, `13-forge-start-phone.png`):** When already at 20 °C, `"Room temperature"` remains visible in faint muted teal (~2.5:1 contrast on `--card`), looking like a broken low-contrast link rather than a clean unavailable action.
13. **Portrait phone vertical whitespace imbalance (`01-first-load-phone.png`):** ~160 px of empty paper separates the actinides from the family key, making the table feel smaller than necessary on mobile.
14. **Desktop top-row element framing (`07-card-oxygen-gas-desktop.png`):** With Oxygen selected, over half of the left viewport above the table is empty cream canvas because the camera centres directly on period 2 without gently clamping upward framing.

### Jargon, copy & clarity issues
15. **Unexplained bare `"1,394 °C"` tick in the forge (`13`–`18`):** Every other tick names an event (`912 °C re-stacks`, `1,538 °C melts`, `2,861 °C boils`), leaving `"1,394 °C"` hanging with no label—a visitor who left chemistry decades ago has no idea it marks iron snapping back from 12 to 8 neighbours (FCC → δ-BCC), especially on phone where row 2 has ample room beside `"1,394 °C"`.
16. **`"Heat map"` lens chip name & unlabelled slider range (`08-lens-heat-1000C-*`):** Calling the solid/liquid/gas temperature slider `"Heat map"` implies a continuous colour scale rather than states of matter. In addition, the slider track has no min/max temperature labels (e.g., `−273 °C` to `6,000 °C`), so the thumb's position at `1,000 °C` lacks visual scale.
17. **Unexplained `"(PubChem)"` in lens banners (`09-lens-melting-desktop.png`, `09-lens-heft-phone.png`):** `"Melting point (PubChem)."` and `"Density (PubChem), height in proportion."` drop a database acronym into the plain-language caption without context.
18. **Minor copy precision (`04-card-iron-desktop.png`, `04-card-iron-phone.png`):** `"with gold: a litre of gold weighs 2.4× more"` technically means 3.4× as much (`19.3 / 7.9 ≈ 2.44`); `"weighs 2.4× as much"` is sharper for science-literate adults.

### Factual check
- **No factual errors found.** Spot-checked values across all visible cards and the 1,000 °C heat map match authoritative references:
  - Gold abridged standard atomic weight `196.97 ± 0.01` matches CIAAW/IUPAC abridged tables (full standard weight `196.966570(4)`), melting point `1,064 °C` (`1,337 K`), boiling point `2,856 °C` (`3,129 K`), density `19.3 kg/L`.
  - Iron transitions `912 °C` (α-BCC → γ-FCC), `1,394 °C` (γ-FCC → δ-BCC), `1,538 °C` (melting), `2,861 °C` (boiling), density `7.9 kg/L` all match standard reference data.
  - Oxygen boiling point `−183 °C`, melting point `−219 °C`, gas density at 20 °C `1.3 g/L`, Carbon sublimation `3,642 °C`, and 1,000 °C solid/liquid/gas states across periods 1–7 all check out.
  - Vietnamese Iron card (`11-vi-card-iron-phone.png`) properly uses GDPT-2018 naming (`Sắt` + `Iron`, decimal comma `7,9 kg`, thousands dot `1.538 °C`, and IUPAC `Manganese`/`Cobalt` in the footer).

---

## 4. Ranked Fix List (Most Impact on Feel First)

1. **Fix the forge thermometer geometry, thumb-to-tick alignment, bulb seam, and label clearance (`13`–`18`)** *(biggest immediate jump in Beauty, Ease, and Smoothness)*
   - Map tick `left` percentages and fill-bar width to the exact thumb-travel range: `calc(var(--thumb-r) + (100% - 2 * var(--thumb-r)) * p)` (or replace native range thumb positioning with a custom-positioned track/thumb using the same `p`), so at `1,600 °C` the thumb sits cleanly *past* `1,538 °C`, and at `2,950 °C` it sits cleanly *past* `2,861 °C` with the fill ending exactly at the thumb's center.
   - Merge the left-end thermometer bulb seamlessly into the track fill (same z-index/background or single SVG/pill shape with no dark border or cutout overlapping the bulb).
   - Raise the lowest tick-label row by `10–12 px` above the track (with slightly taller tick stems) so the circular thumb *never* touches `"912 °C re-stacks"` or `"2,861 °C boils"` on desktop or phone.
   - Anchor `"912 °C re-stacks"` on phone to its actual tick position (e.g., centered on its stem or right-extending if space permits, moving `"1,394 °C"` up to tier 2) so it never hovers above `lead melts`.

2. **Redesign the forge unit-cell highlight so 8 vs. 12 neighbours reads clearly instead of as a glowing cavity (`13`, `14`, `15`, `18`)** *(unlocks 4.5+ on both Beauty and Delight)*
   - Completely hide (rather than shrink into tiny distracting pebbles) the small corner wedge of foreground atoms that occlude the highlighted unit cell, OR place the highlighted unit cell on the front-most outer corner so no atoms sit in front of it.
   - Differentiate the **central atom** from its **neighbours** (e.g., pale ivory/warm-white centre bead surrounded by verdigris neighbours by day; crisp gold-rimmed beads with clear connecting rods in the kiln) and **cap/reduce additive glow sprites inside the cutaway** so the pocket matches the crystal's brightness instead of blowing out into a bright fiery hole.
   - Aim for an unmistakable visual silhouette shift between `14` (cubic 8-neighbour frame) and `15` (tighter 12-neighbour cluster).

3. **Label the `"1,394 °C"` tick on the forge thermometer (`13`–`18`)** *(quick Clarity win)*
   - Give `"1,394 °C"` an explicit short event label—e.g., `"1,394 °C back to 8"` or `"1,394 °C re-stacks"`—placed on tier 2 (above `"912 °C re-stacks"` and `"1,538 °C melts"`). Both desktop and phone already have clear vertical room in tier 2 for it.

4. **Restore the bottom scroll fade and peeking sliver on the phone element card (`04`, `05`, `11-vi` phone)** *(matches `STYLE.md` §5 and fixes Ease on mobile)*
   - Increase the initial sheet height slightly (within the 64% cap) or tighten vertical padding by ~8–12 px so the `"All numbers & sources ▾"` row (or fact notes) visibly peeks below `"Side by side"`, overlaid with a soft `--card` bottom gradient fade whenever `scrollHeight > clientHeight`.

5. **Align source-tap signifiers across desktop and phone cards (`04`, `05`, `07`)** *(Consistency / Clarity)*
   - Either add the same subtle dotted underlines (and hover tooltip/cursor) to the three top facts on desktop as on phone, or keep both consistent so desktop users also discover that top facts are sourced on tap.

6. **Sharpen the Fresnel glass vessel on the dark kiln stage (`14`–`17`)** *(Beauty polish)*
   - Lower the base face opacity of the containment cube in the kiln (`--kiln`) while keeping crisp, thin Fresnel edge reflections so the glowing iron atoms and vapour pop against pure dark kiln warmth without a milky grey cube behind them.

7. **Hide (while reserving space for) `"Room temperature"` when already at 20 °C (`13`)** *(Cleanliness / Contrast)*
   - Use `opacity: 0; pointer-events: none` (preserving button layout width so `"Heat it ▶"` doesn't jump) at `T === 20 °C`, then fade `"Room temperature"` in cleanly at full readable contrast as soon as the user heats the sample.

8. **Refine lens naming, range endpoints, and plain-language captions (`08`, `09`)** *(Clarity)*
   - Consider renaming `"Heat map"` to `"Solid, liquid, gas"` (or `"Melt & boil"`) and adding subtle min/max temperature labels (`−273 °C` … `6,000 °C`) at the ends of its slider track.
   - Move `"(PubChem)"` out of the plain-language lens banner (`09`) into the Sources drawer or a subtle `"Source"` pill (matching the element card).

9. **Nudge crowded table labels and tighten phone/top-row framing (`01`, `04`, `07`, `09` phone, `11-vi`)** *(Layout polish)*
   - Shift `"Mineral metals"` / `"Kim loại khoáng"` ~10–14 px right so it sits cleanly over `Be` without grazing `H`.
   - When an element card is open on desktop (`04`, `07`), slightly raise or fade overlapping regional family labels above the lifted tile so `"Workhorse metals"` / `"Nonmetals of life"` don't kiss the verdigris selection ring; clamp the vertical camera framing slightly on row 1–2 selections (`07` Oxygen) to reduce excess empty paper above the table.
   - On phone `09-lens-heft-phone.png`, modestly reduce the max column height cap (~15%) or steepen pitch slightly more so `La`–`Yb` and period-5 symbols stay fully readable behind taller front rows, and tighten the ~160 px empty vertical gap below the table on `01-first-load-phone.png`.

10. **Polish copy & verify real-device playback FPS (`04`, `18`)**
    - Change `"weighs 2.4× more"` → `"weighs 2.4× as much"` on Iron's comparison door.
    - Re-measure `18-forge-heat-it-playing-desktop` and `16-forge-1600C-molten-*` on an unloaded GPU/phone to confirm p95 ≤ 20 ms (`SPEC.md` §6).
