# STYLE — "Porcelain & Ink" (redesign, 21 Nov 2026)

The style card for the redesign (DESIGN-RULES.md Layer 2). It is made for this topic and this audience. It is not a house style and not a copy of the dark, bloom-heavy photoreal showroom we compared against (DESIGN-STUDY.md §1).

## 1. Audience and feeling
- **Who:** curious adults with no chemistry assumed, such as a PhD who last studied chemistry decades ago, software developers and documentary watchers. Students and teachers too.
- **Feeling:** *calm wonder*. It should feel like turning the pages of a beautifully illustrated science book in a sunlit museum, where every specimen can be picked up. The tone is never a dashboard and never homework.
- **One-line concept:** the elements as **porcelain specimens on warm paper, labelled in ink**. When you heat something, **the room goes dark like a forge** so you can see it glow.
- **One visual rule:** *daylight is for matter; a dark room is for light and fire.* Only two places dim the room: **Heat it** (glowing metal) and **Its light** (emission spectra).

## 2. References, and what we take from each
| Reference | We take | We leave |
|---|---|---|
| Ciechanowski, *Mechanical Watch* | cream paper and ink, crisp 3D in daylight, one direct control per idea, words coloured like the part they name | long scroll essay |
| Neal.fun, *The Deep Sea* | one obvious first gesture, numbers tied to human landmarks | playful cartoon look |
| NASA *Eyes on the Solar System* | the canvas owns ~90 % of the screen, continuous camera flights between scales | dark space UI chrome |
| RSC Periodic Table | plain "why you know it" before data, story lenses, the whole table as a temperature map | tabbed reference pages |
| Real-world inspiration: museum specimen trays, glazed porcelain tiles, 19th-century stippled science engravings, a smith's forge at night | tile labels, matte glaze, stippled electron clouds, the glow in the dark | — |

## 3. Palette (tokens)
Four core colours with fixed roles. Data colours appear only on the specimens, never on chrome. Contrast is measured against `--paper` (WCAG).

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--paper` | `#F5F0E6` | page and 3D background (warm paper) | — |
| `--card` | `#FBF8F2` | cards, sheets, popovers | — |
| `--ink` | `#1C1A17` | text, symbols on tiles, primary button fill | 15.3 : 1 |
| `--ink-2` | `#57524B` | secondary text, captions | 6.8 : 1 |
| `--ink-3` | `#857E73` | hints, disabled (never essential text) | 3.5 : 1 |
| `--line` | `rgba(28,26,23,.12)` | hairlines, card borders | — |
| `--verdigris` | `#0E6B62` | the one interactive accent: selection ring, focus ring, links, active chip (the patina of copper) | 5.6 : 1 |
| `--ember` | `#B93E12` | heat UI only: thermometer fill, temperature readout | 4.9 : 1 |
| `--kiln` | `#15100C` | the heat stage after the room darkens | — |
| `--kiln-text` / `--kiln-text-2` | `#F2E8DA` / `#B9AC9C` | text on the kiln stage | 15.6 / 8.5 : 1 |

**Family pigments** are muted, like mineral paints. They colour the top glaze of each tile, and the symbols are ink (6.7 : 1 or better on every pigment).
`alkali #E8955A · alkaline-earth #EBC55E · transition #8FA9CF · post-transition #A9CBD6 · metalloid #7FC0A8 · nonmetal #B5D27F · halogen #E39BBA · noble-gas #B7A6DA · lanthanide #DCC6A0 · actinide #C9967C`
- Pigments are pale against the paper (1.5–2.3 : 1). Tiles stand out by **shading, not hue**: side faces are 38 % darker than the top, the glazed top catches a soft highlight, and each tile casts a soft contact shadow, so its edge reaches at least 3 : 1.
- A colour-blind-safe set (Okabe–Ito based) remains a setting.
- Colour never works alone. Families are named in words on the table (region labels; on phones, whose tiles are too small for words, a compact colour key under the table and the family name in the loupe), and predicted values keep the hatch.

**State colours** (heat-map lens): `solid #AEB8C8 · liquid #2A6FAE · gas #E0A33A · not known #E6DFD2` (a blank paper tone), plus the words "solid / liquid / gas" in the card. Ink symbols reach 8.7 : 1 on solid and 7.8 : 1 on gas; liquid takes light symbols (5 : 1). Predicted states are striped. Every colour and the stripes are in the lens key.
**Electron-cloud inks** (stippled orbitals): `phase + #C8501E` (vermilion) and `phase − #2C5DB0` (cobalt). This orange/blue pair stays distinct for red-green colour blindness.
**Glow** is never a token: it is computed from the temperature (Planck's law × CIE fit, as today).

## 4. Type
No font files (SPEC deliverable), so we use two **system stacks**, one serif and one sans:
- **Serif (voice):** `"Iowan Old Style", Charter, "Palatino Linotype", Palatino, "Noto Serif", Georgia, serif`. Used for element names, headlines, hooks and region labels on the table. In Vietnamese the stack starts at `"Noto Serif", "Palatino Linotype", Georgia` (full diacritics).
- **Sans (interface and numbers):** `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`, with `font-variant-numeric: tabular-nums` for figures.

| Step | Size / line height (desktop · phone) | Font / weight | Used for |
|---|---|---|---|
| Display | 40/44 · 32/38 | serif 600 | the element's name on its card (a 392 px card fits names up to 13 letters) |
| Title | 30/36 · 24/30 | serif 600 | view titles ("Inside iron") |
| Lead | 20/30 · 18/27 | serif 400 | one-line hooks, "why it matters" |
| Body | 16/25 · 16/24 | sans 400 | text, facts |
| Label | 14/20 | sans 600, +0.01 em | buttons, chips, tile symbols (14 px floor) |
| Caption | 13/18 | sans 400, `--ink-2` | jargon secondary labels, units, source hints |

**Rules:**
- Body and labels are never under 14 px (the tiny atomic number printed on each tile is decoration; the card shows it in full).
- Jargon is always a *caption after* a human phrase: "Grip on electrons · *ionization energy*".
- Temperatures show °C first and K only in the details.
- Never use all caps for more than 3 words.

## 5. Layout and components
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 48. **Radii:** 10 (chips), 16 (cards), 999 (pills).
- **Elevation:** paper shadows only (`0 1px 2px rgba(28,26,23,.06), 0 8px 24px rgba(28,26,23,.08)`). No glassmorphism, no glow on chrome.
- **Targets:** at least 44 × 44 px with 8 px gaps. The primary button is an ink pill with paper text; the secondary is an outlined pill; the tertiary is a text link in verdigris.
- **The canvas owns the screen** (about 90 %). On a default surface you see at most: a top bar (wordmark, find pill, language, menu), one card or sheet, and one bottom prompt. On phones, find is a round 44 px button that opens into a field across the bar.
- **Element card:** a 392 px side card on desktop; when it scrolls, a compact title bar (tile, name, number) slides in under the close button, so rows never run beneath it. On phones it is a bottom sheet that stands exactly tall enough to show the three doors (at most 62 % of the screen): name, the human line, the three facts in one strip, the doors; the facts' notes, "across the table" links and all numbers follow below.
- **Name tags** (hover, "Try iron", lens notes) hang above the tile's back edge with a small caret, so they never cover the printed number. Names written on the table keep 14 px from the screen edges and stay clear of the card, or are hidden.

## 6. 3D: lighting and materials
- **Stage:** a transparent canvas over the CSS paper (a soft warm radial light from the top left, a faint grain, the edges a touch deeper; painted once). Distance fog fades into `--paper`, so depth reads as atmosphere and there is no hard horizon.
- **Light rig (daylight studio):**
  - a hemisphere light (sky `#FFF7EC`, ground `#D9CFC0`, 0.95);
  - one warm key light from the top left (`#FFF1DE`, 2.0);
  - a faint cool rim light from behind (`#DCE6F5`, 0.5).
  - Tone mapping: Khronos PBR Neutral, exposure 1.0 (it keeps the glazes' hues; ACES shifted them).
- **Scrims:** soft paper gradients at the top and bottom of the screen keep the chrome legible when tiles pass under it (zoomed in, tall columns).
- **Shadows:**
  - Soft *baked* contact shadows: all tiles' shadows drawn into one texture on one plane under the table (one blended layer on screen, however close the camera), re-baked only when the shape or the lifted tile changes. A lifted tile's shadow grows softer and lighter. Real shadow maps only on High on desktop.
  - No post-processing by default: no bloom, no depth-of-field.
- **Tiles:**
  - Built in code as **thick** rounded ceramic blocks (height about 40 % of their width, bevel about 6 % of the width), so they read as 3D objects in the first second and not as a tilted HTML table.
  - Material:
    - The top face is the family pigment under a glaze (`roughness 0.16`); the sides are glazed too (`roughness 0.34`) and **38 % darker**. `metalness 0` throughout.
    - The glaze reflects a soft studio computed in the shader (no environment map, so it costs no texture reads): warm walls, the paper floor, a long softbox low behind the table (a sheen on the far tile tops) and a key softbox front-left (a bright catchlight along each front bevel). Strength `tile.glaze 0.6`.
    - Each tile's glaze varies by ±2.5 % in lightness, like handmade ware, and a resting tile darkens slightly where it meets the paper.
  - The symbol and the atomic number are **printed on the glaze** (an atlas texture drawn with the system sans when the scene is built), so every tile always carries its label, like a specimen tray. The hovered tile's *name* pops up as a screen-space label (≥ 14 px); on phones a loupe shows it under the thumb.
  - Default height is equal for all tiles. Height means something only inside a numbers lens.
  - Pointer parallax on desktop: the camera leans at most 1.2° toward the cursor (300 ms ease-out), as a depth cue. It is off on touch screens and with reduced motion.
- **Specimen stage (Heat it):**
  - Atoms are glazed beads (`roughness 0.35`) in the family pigment, inside a hairline glass cube with an ink unit-cell outline.
  - When hot, the beads' emissive colour follows the blackbody glow, with a cheap additive halo sprite on Medium and High.
- **Electron clouds (Inside the atom):**
  - Fine **stipple** dots, alpha-blended (no additive glare), in vermilion and cobalt. The 90 % surfaces are thin translucent glaze.
  - The nucleus is a small cluster of matte beads.
  - It should read like an engraving come alive.

## 7. Motion
**Personality:** *unhurried and precise*, like a curator's hands. Moves are smooth and settle without bounce. The only springs are hover, press and picking up a tile: the picked tile rises with a 10 % overshoot and settles (about 350 ms), like a piece lifted from a tray. Reduced motion removes the overshoot.

| Event | Duration | Easing |
|---|---|---|
| tap or press feedback (tile dips 1 mm, ring appears) | 90 ms | `cubic-bezier(.2,.8,.2,1)` |
| hover lift (tile rises 3 mm, label grows to 1.1×) | 160 ms | critically damped spring |
| card or sheet in / out | 280 ms / 200 ms | ease-out / ease-in |
| lens change (heights and colours ripple left→right by atomic number) | 650 ms total, 250 ms stagger | ease-in-out cubic |
| camera glide to a selected element | 900 ms | ease-in-out cubic |
| scale dive (table → inside a tile) | 1400 ms; crossfade at 70 % | ease-in-out quint |
| return to the table | 900 ms | ease-in-out cubic |
| number changes (counters) | 300 ms | ease-out |
| room dims to `--kiln` (Heat it, Its light) / returns | 600 ms / 600 ms | ease-in-out |
| pointer parallax (desktop) | 300 ms follow, ≤ 1.2° | ease-out |

**Camera language:**
- One continuous move per user action. The subject always ends centred in the *free* area (beside the card, above the sheet).
- Dolly and gentle arcs only. No spins, no auto-rotate, no shakes, no jump cuts.
- User orbiting is allowed within soft limits; "⌂" recentres.
- **Reduced motion:** every camera move becomes a 150 ms crossfade, ripples become instant, vibration amplitude is shown as a still "blur" ring instead of shaking, and heating still changes colour (information, not decoration).

## 8. Sound (optional, **off by default**; built only after the visuals pass the first review gate)
- A "Sound" switch lives in the menu and is remembered on this device. Everything is synthesised with WebAudio (no files). Nothing plays on page load, and nothing loops except while the user is acting.
- Volume is quiet (−24 dB peak) and pitches are warm (marimba and glass timbres).

| When | What plays |
|---|---|
| tap a tile | a soft porcelain "tik" (30 ms, pitch rises gently with atomic number) |
| card opens | nothing (silence keeps it calm) |
| scale dive | a low airy swell (0.8 s) |
| dragging the thermometer | a faint hum whose pitch follows the temperature; stops when you let go |
| crystal re-stacks (e.g. iron at 912 °C) | a glassy "tink" |
| melts | a soft descending chime |
| boils | a quick bubbling burst |
| a "Mystery" solved (later) | a two-note rising chime |

## 9. The single wow moment — *Heat iron until it glows*
1. From the table, tap iron → **Hold a piece**. The camera dives into the iron tile, and the tile's glaze opens into a lump of iron atoms in their real pattern: body-centred cubic, each atom touching 8 neighbours.
2. Drag the big thermometer up. The atoms shiver harder, and the **room lights dim to `--kiln`**, as in a forge, so you can see the glow.
3. The metal glows dull red, then orange, then yellow-white. The colour is computed from the real temperature.
4. At **912 °C** the crystal *snaps* into a tighter stack, with 12 neighbours each (a glassy tink).
5. At **1,394 °C** it snaps back. At **1,538 °C** it melts into a glowing puddle; at **2,861 °C** it boils away into a gas.
6. One quiet caption names each moment. Let go and the room light returns.
Every number comes from our data (PubChem; Wikipedia/Arblaster transitions; COD cells). The stage around it stays calm: no other panels and no chrome beyond the thermometer and the back link.
- **Not just iron.** The forge dims for *any* solid as soon as it starts to glow, and "Heat it ▶" plays the whole sweep with one tap. Iron is only the suggested first example.
- **An instant taste from home.** The **Heat map** lens chip on the table turns the temperature into a slider for all 118 tiles at once: drag it and watch whole regions melt and boil.

## 10. Do / Don't
| Do | Don't |
|---|---|
| "Grip on electrons · *ionization energy*" | "First ionization energy (eV)" in a dropdown |
| Write the family names on the table, like a map ("Noble gases", "Salt-makers"); phones get a compact key under the table | A 12-item colour legend beside the desktop table |
| "Melts at 1,538 °C" (K in the details) | "1,811 K (1,538 °C)" on a default surface |
| "A litre of gold would weigh 19.3 kg" (from our density) | "19.282 g/cm³" as the headline |
| One card with 3 facts and 3 doors | A 25-row data sheet wall |
| Equal, calm tiles; heights only in a numbers lens, with its question | Columns of unexplained heights on first load |
| Soft contact shadows, a glaze that catches the light, daylight | Neon edges, heavy bloom, harsh default shadow acne |
| The camera glides to what you tapped | Spinning or auto-rotating the table |
| A back link "← All elements", always visible | Six top-level tabs |
| A hook first, then the science, then the source | Unexplained "Lindemann", "Z_eff", "Pearson cI2" on screen |
| Stippled vermilion/cobalt clouds on paper | Additive neon point clouds on black |
| Silence by default; sound only if switched on | Sounds on load or looping music |
