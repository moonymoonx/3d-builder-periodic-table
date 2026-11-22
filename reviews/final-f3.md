# Final First-Time-Visitor Review — Round F3 (build e09aabe, Gemini, 2026-11-22)

Screenshots: screenshots/finish/review/ (hero, views at 1440×900/390×844 and 1920×1080/360×740, sample, atom, patterns, shared). Prompt: prompts/api-run/*final-review-f3-retry.md (private).

## Scores by Part

### 1. The Table and Its Element Card (`table`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **4.5** | Plain-English family labels (`Workhorse metals`, `Salt-makers`) paired with standard chemistry names and clear lens legends make the layout immediately legible (`views/1-table-landing-desktop-1440x900.png`, `hero/08-lens-heat-1000C-desktop.png`), though 3D Heft heights flatten out on phone (`hero/09-lens-heft-phone.png`) and the `↗` icons in expanded numbers have no label (`hero/06-card-gold-all-numbers-desktop.png`). |
| **Ease** | **4.0** | The `Try iron` hint, hover chip, and phone thumb-scrub card make picking elements effortless (`hero/02-try-iron-hint-desktop.png`, `hero/03-thumb-scrub-phone.png`), but `All numbers & sources` clips almost out of sight on taller desktop cards (`hero/05-card-gold-desktop.png`, `hero/07-card-oxygen-gas-desktop.png`) and phone cards drop the `↗ across the table` links (`hero/04-card-iron-phone.png`). |
| **Beauty** | **4.5** | Warm parchment tones and tactile 3D tiles feel like an editorial museum piece (`views/1-table-landing-desktop-1440x900.png`, `hero/09-lens-melting-desktop.png`), slightly held back by faint aliased bevel seams when zoomed in (`hero/10-zoom-in-desktop.png`). |
| **Smoothness** | **3.5** | Phone stays at 60.0 FPS, but desktop landing is the roughest view in `fps.txt` (35.8 avg FPS, 50.0 ms p95 spikes). |
| **Delight** | **4.5** | Watching the entire 3D table melt and boil at 1,000 °C or rise into melting-point towers with Carbon/Helium callouts feels genuinely magical (`hero/08-lens-heat-1000C-desktop.png`, `hero/09-lens-melting-desktop.png`). |

---

### 2. Patterns Across the Table (`patterns`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **4.0** | Question-driven headlines, unit explainers, and row/column toggles clarify periodic trends brilliantly (`views/4-trends-desktop-1440x900.png`, `patterns/p06-columns-desktop.png`), but annotation collisions make labels unreadable on 360px phones (`views-other-sizes/4-trends-phone-360x740.png`) and `---` is confusingly reused for both "no dot" and the dashed 20 °C line (`patterns/p01-from-card-melting-phone.png`). |
| **Ease** | **4.5** | Switching lenses via `More ▾`, scrubbing on phone, and tapping values for source popovers feel intuitive and low-friction (`patterns/p05-tap-value-source-desktop.png`, `patterns/p07-more-menu-desktop.png`, `patterns/p12-scrub-phone.png`). |
| **Beauty** | **4.0** | Desktop charts look publication-grade (`patterns/p08-crust-log-desktop.png`, `patterns/p09-discovered-desktop.png`), but mobile beauty suffers where italic callouts collide with each other or sit directly on data lines (`views-other-sizes/4-trends-phone-360x740.png`, `patterns/p01-from-card-melting-phone.png`, `patterns/p11-vi-grip-phone.png`). |
| **Smoothness** | **5.0** | Locked at 60.0 avg FPS (16.7–16.8 ms median/p95) on both desktop and phone in `fps.txt`, with clean animated transitions (`patterns/p13-switch-pattern-mid-ripple-desktop.png`). |
| **Delight** | **4.5** | Switching to `Down each column`, discovering Earth's crustal rarity on a log scale, and seeing ancient vs 2010 discoveries spark real "aha!" moments (`patterns/p06-columns-desktop.png`, `patterns/p08-crust-log-desktop.png`, `patterns/p09-discovered-desktop.png`). |

---

### 3. Side by Side (`side`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **5.0** | A balance scale showing solids, liquid pools, and boxed gases—plus crystal lattices for Graphite/Diamond and honest `?` / no-scale handling for Oganesson—communicates differences instantly (`patterns/c02-gold-mercury-desktop.png`, `patterns/c05-graphite-diamond-desktop.png`, `patterns/c06-hydrogen-oganesson-desktop.png`, `patterns/c11-hydrogen-oganesson-one-atom-desktop.png`). |
| **Ease** | **4.5** | Curated `Surprising pairs`, inline search pickers, swap button, and ratio bars make comparison effortless (`patterns/c07-pick-any-two-desktop.png`, `patterns/c08-all-numbers-desktop.png`, `patterns/c15-pick-from-tile-phone.png`); only minor tightness at the phone top toggle and hard left-clipping on the scrolled preset strip (`views/5-compare-phone-390x844.png`, `patterns/c05-graphite-diamond-phone.png`). |
| **Beauty** | **4.5** | Tactile 3D pans, gleaming liquid mercury, and balanced typography look refined (`patterns/c02-gold-mercury-desktop.png`, `patterns/c13-bromine-mercury-desktop.png`), marred slightly by aliased stair-stepping on the dark balance beam and strings (`patterns/c01-from-card-iron-gold-desktop.png`). |
| **Smoothness** | **5.0** | Flat 60.0 avg FPS (16.7 ms median and p95) on both desktop and phone (`fps.txt`). |
| **Delight** | **5.0** | Level Tungsten vs Gold (`19.3 kg` each), Gold cube vs Mercury pool, Graphite vs Diamond lattices, and `when bonded / when touching` spheres are consistently surprising (`patterns/c02-gold-mercury-desktop.png`, `patterns/c05-graphite-diamond-desktop.png`, `patterns/c12-tungsten-gold-level-desktop.png`, `patterns/c18-all-numbers-one-atom-desktop.png`). |

---

### 4. Inside the Atom (`atom`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **3.5** | Real probability clouds, explicit nucleus magnification notes, and Iron's `"Why blue?"` spectral note are admirable (`atom/atom-02-iron-desktop.png`, `atom/atom-07-light-iron-desktop.png`), but desktop `One cloud` orbitals are so faint they look blank (`atom/atom-06-one-cloud-4s-desktop.png`, `atom/atom-12b-uranium-5f-cloud-desktop.png`), phone `Shells:` text clips off-screen (`views/2-atom-phone-390x844.png`), and Chromium says `"1 electrons"` (`atom/atom-04-chromium-surprise-desktop.png`). |
| **Ease** | **4.0** | Stepping with `− proton / + proton` and toggling `Whole atom / One cloud / Its light` is clear (`atom/atom-03-plus-proton-cobalt-desktop.png`), though `One cloud` clips selector text and legends above the footer bar (`atom/atom-05-one-cloud-3d-desktop.png`, `atom/atom-05-one-cloud-3d-phone.png`). |
| **Beauty** | **4.0** | `Its light` mode is breathtaking (`atom/atom-08b-light-neon-ripple-desktop.png`, `atom/atom-17-light-hydrogen-desktop.png`), but desktop `Whole atom` and `One cloud` dots look washed-out compared to phone (`atom/atom-05-one-cloud-3d-desktop.png` vs `atom/atom-05-one-cloud-3d-phone.png`) and nodal planes have jagged edges (`atom/atom-11-carbon-one-cloud-desktop.png`). |
| **Smoothness** | **5.0** | Smooth 60.2 avg FPS (16.7–16.8 ms median/p95) across desktop and phone (`fps.txt`). |
| **Delight** | **4.5** | Tapping a Neon line to launch a red light ripple and discovering Chromium's Aufbau surprise make quantum mechanics genuinely thrilling (`atom/atom-04-chromium-surprise-desktop.png`, `atom/atom-08b-light-neon-ripple-desktop.png`). |

---

### 5. Hold a Sample (`sample`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **3.5** | The warm parchment/forge view explains diatomic gases, `S₈` rings, and unfreezable helium clearly (`sample/s02-nitrogen-gas-desktop.png`, `sample/s08-helium-near-zero-desktop.png`, `sample/s09-sulfur-honest-card-desktop.png`), but seeing a totally different broken dark-navy sample screen (`views/3-sample-desktop-1440x900.png`), a vanished 3D sample on Iron's About drawer (`shared/f02-forge-about-desktop.png`), and Manganese abruptly becoming one unexplained giant ball (`sample/s17-manganese-red-hot-phone.png`) is deeply confusing. |
| **Ease** | **3.5** | The warm thermometer with `Heat it / Cool it` and angled ticks for close transitions works nicely (`sample/s16-neon-condensing-desktop.png`, `sample/s20-neon-close-events-phone.png`), but the dark-navy view's thermometer bar overlaps card text on desktop and buries half the crystal on phone (`views/3-sample-desktop-1440x900.png`, `views-other-sizes/3-sample-phone-360x740.png`). |
| **Beauty** | **4.0** | Glowing molten iron on a darkened forge, `S₈` crowns, and Oganesson's empty glass case are extraordinary (`shared/f03-forge-1600C-molten-desktop.png`, `sample/s09-sulfur-honest-card-desktop.png`, `sample/s12-oganesson-never-desktop.png`), dragged down heavily by the clashing dark-navy UI (`views/3-sample-*`) and blank canvas in `shared/f02-forge-about-desktop.png`. |
| **Smoothness** | **4.5** | 60.0 avg FPS on phone and 54.5 avg FPS (33.3 ms p95) on desktop in `fps.txt`. |
| **Delight** | **4.5** | Watching iron re-stack and glow, sulfur melt as intact eight-atom rings, helium stay liquid at −272 °C, and Oganesson stand empty in a museum box is unforgettable (`hero/15-forge-930C-restacked-desktop.png`, `sample/s10-sulfur-molten-desktop.png`, `sample/s08-helium-near-zero-desktop.png`, `shared/f07-oganesson-empty-desktop.png`). |

---

## Overall Page Scores (`overall`)

| Criterion | Score | Reason |
| --- | :---: | --- |
| **Clarity** | **4.0** | Remarkably humane science writing and ubiquitous source provenance across all five views, held back by unreadable phone chart overlaps (`views-other-sizes/4-trends-phone-360x740.png`), nearly invisible desktop orbital clouds (`atom/atom-06-one-cloud-4s-desktop.png`), clipped phone `Shells:` text (`views/2-atom-phone-390x844.png`), and the broken dark-navy sample screen (`views/3-sample-desktop-1440x900.png`). |
| **Ease** | **4.0** | Exploration flows naturally between table, cards, charts, balance, and atoms, but card/panel clipping (`hero/05-card-gold-desktop.png`, `atom/atom-05-one-cloud-3d-phone.png`) and the overlapping dark-navy sample layout (`views/3-sample-desktop-1440x900.png`) create avoidable friction. |
| **Beauty** | **4.5** | A cohesive, warm, tactile editorial aesthetic with standout visual peaks (`views/1-table-landing-desktop-1440x900.png`, `patterns/c02-gold-mercury-desktop.png`, `atom/atom-08b-light-neon-ripple-desktop.png`, `shared/f03-forge-1600C-molten-desktop.png`), undermined by the mismatched dark-navy sample UI, blank `shared/f02-forge-about-desktop.png`, and faint desktop orbitals. |
| **Smoothness** | **4.5** | Four of five views run near 60 FPS even under software rendering (`fps.txt`), with desktop jank concentrated on the 3D table landing (35.8 avg FPS, 50.0 ms p95) and minor dips on desktop sample (54.5 avg FPS, 33.3 ms p95). |
| **Delight** | **4.5** | Full of rare scientific honesty and playful discovery—from Oganesson's empty case and unfreezable helium to `S₈` sulfur rings, Gold vs Mercury, and Neon's light ripple (`shared/f07-oganesson-empty-desktop.png`, `sample/s08-helium-near-zero-desktop.png`, `sample/s09-sulfur-honest-card-desktop.png`, `patterns/c02-gold-mercury-desktop.png`, `atom/atom-08b-light-neon-ripple-desktop.png`). |

---

## Visible Problems (Most Important First)

1. **Broken, clashing dark-navy sample UI with severe overlaps and clipping (`views/3-sample-desktop-1440x900.png`, `views/3-sample-phone-390x844.png`, `views-other-sizes/3-sample-desktop-1920x1080.png`, `views-other-sizes/3-sample-phone-360x740.png` vs `shared/f01-forge-start-desktop.png`)** — These four sample views display an entirely different dark-navy theme (`A SAMPLE OF IRON`, `293 K`, blue spheres) that conflicts with the warm parchment/forge sample design seen everywhere else (`hero/13..18`, `shared/f01..f08`, `sample/s01..s20`). Worse:
   - On `views/3-sample-desktop-1440x900.png`, the bottom thermometer panel overlaps the right-hand Iron card, cutting off the first letters of `Boiling point`, `Density`, and `Electronegativity`.
   - On `views/3-sample-phone-390x844.png` and `views-other-sizes/3-sample-phone-360x740.png`, the bottom controls obscure half of the 3D crystal while leaving a huge empty dark void at the top.
   - On `views/3-sample-desktop-1440x900.png` and `views-other-sizes/3-sample-desktop-1920x1080.png`, the right panel shows an active-looking `See a sample` button while you are already inside the sample view, and `Discovered / ancient times` clips in half at the bottom of the 1920×1080 card.
2. **3D crystal completely disappears when opening "About this sample" on desktop (`shared/f02-forge-about-desktop.png`)** — Opening Iron's `About this sample` drawer wipes the entire 3D crystal and plinth from the canvas (leaving blank cream), unlike `sample/s13-about-nitrogen-desktop.png` where the 3D sample shifts cleanly left. The two drawers also use inconsistent templates (`shared/f02-forge-about-desktop.png` and `shared/f02-forge-about-phone.png` lack the element/temperature subtitle and intro paragraph shown in `sample/s13-about-nitrogen-desktop.png` and `sample/s13-about-mercury-frozen-phone.png`).
3. **Desktop `One cloud` electron orbitals are practically invisible (`atom/atom-06-one-cloud-4s-desktop.png`, `atom/atom-05-one-cloud-3d-desktop.png`, `atom/atom-11-carbon-one-cloud-desktop.png`, `atom/atom-12b-uranium-5f-cloud-desktop.png`)** — On desktop, the probability stippling is so faint that Iron's `4s` orbital looks like an empty cream page with a tiny nucleus dot, and `3d`, `2p`, and `5f` look like empty jagged wireframes (whereas `atom/atom-05-one-cloud-3d-phone.png` renders vivid, clearly legible dots). Even in `Whole atom` mode (`atom/atom-02-iron-desktop.png`, `atom/atom-10-hydrogen-desktop.png`), desktop clouds are far dimmer than on phone.
4. **Unreadable colliding chart annotations on 360px phone (`views-other-sizes/4-trends-phone-360x740.png`)** — `"Little dips just after beryllium and nitrogen"` and `"Soft, reactive metals let go easily"` print directly on top of each other, turning both into illegible overlapping text.
5. **Chart annotations overlap data dots and lines on 390px phone and Vietnamese views (`patterns/p01-from-card-melting-phone.png`, `patterns/p03-heft-gold-phone.png`, `patterns/p11-vi-grip-phone.png`, `patterns/p11-vi-melting-desktop.png`)** — `"Tungsten: 3,422 °C, the highest melting point"` sits over the Tungsten peak and `"In rows 2–6, the noble gas melts coldest"` crosses Row 6/7 lines (`p01-from-card-melting-phone.png`); `"Gases: a litre weighs only grams"` hits Row 5 dots (`p03-heft-gold-phone.png`); `"Kim loại mềm, dễ phản ứng buông dễ nhất"` collides with Row 4/5 dots (`p11-vi-grip-phone.png`); and `"Ở hàng 2–6, khí hiếm nóng chảy ở nhiệt độ thấp nhất"` touches Francium's dot and is crossed by the 20 °C dashed line (`p11-vi-melting-desktop.png`).
6. **Right-edge clipping of `Shells:` summary on every phone atom view (`views/2-atom-phone-390x844.png`, `views-other-sizes/2-atom-phone-360x740.png`, `atom/atom-02-iron-phone.png`, `atom/atom-04-chromium-surprise-phone.png`, `atom/atom-09-about-gold-phone.png`, `atom/atom-13-vi-iron-phone.png`)** — The bottom-right shell count cuts off at the viewport edge (`Shells: 2`, `She`, `Các lớp: 2`).
7. **Unexplained jump from 58-atom crystal to a single giant ball for hot Manganese (`sample/s17-manganese-room-desktop.png` vs `shared/f08-manganese-red-hot-phone.png`, `sample/s17-manganese-red-hot-phone.png`, `sample/s11-manganese-molten-kiln-phone.png`)** — Manganese starts as a 58-atom crystal and melts into ~60 beads, but at 900–1,027 °C abruptly turns into one giant glowing red sphere (`solid · one atom shown`) with no explanation on screen of why the crystal vanished.
8. **Bottom-of-card clipping hides controls and text (`hero/05-card-gold-desktop.png`, `hero/07-card-oxygen-gas-desktop.png`, `atom/atom-05-one-cloud-3d-desktop.png`, `atom/atom-05-one-cloud-3d-phone.png`, `atom/atom-12b-uranium-5f-cloud-desktop.png`, `atom/atom-14-vi-light-sodium-phone.png`)** — `All numbers & sources` is sliced to ~2px of peeking letters on Gold and Oxygen desktop cards; `Which` (for `Which one`) and `all 5` are clipped off on `atom-05-one-cloud-3d-phone.png`; `"where it is never found."` clips above the footer on `atom-05-one-cloud-3d-desktop.png`; and clipped letter tops peek above the footer divider on `atom-14-vi-light-sodium-phone.png`.
9. **Desktop landing frame-time spikes (`fps.txt`)** — `1-table-landing-desktop-1440x900` drops to 35.8 avg FPS with 50.0 ms p95 spikes (and `3-sample-desktop-1440x900` hits 33.3 ms p95), noticeably rougher than the 60 FPS achieved on all other views.
10. **Grammar error on Chromium atom card (`atom/atom-04-chromium-surprise-desktop.png`, `atom/atom-04-chromium-surprise-phone.png`)** — Reads `"Chromium has 1 electrons in its outer shell (shell 4)"` instead of `"1 electron"`.
11. **Confusing `---` legend glyph for missing dots (`patterns/p01-from-card-melting-desktop.png`, `patterns/p01-from-card-melting-phone.png`, `patterns/p16-appetite-desktop.png`, `views/4-trends-desktop-1440x900.png`)** — A dashed line `---` is used for `"no dot: no value in our sources"` (and two other "no dot" meanings in `p01` and `p16`), while on `p01-from-card-melting-phone.png` the exact same `---` glyph simultaneously represents the actual dashed horizontal line `room temperature, 20 °C`.
12. **Cramped canvas labels on small 360px phone atom view (`views-other-sizes/2-atom-phone-360x740.png`)** — `200 pm` overlaps the outer shell ring, and `nucleus` / `clover cloud · shell 3` sit directly on top of the electron cloud rings.
13. **Heavy aliasing/stair-stepping on 3D lines and nodal planes (`atom/atom-05-one-cloud-3d-desktop.png`, `atom/atom-11-carbon-one-cloud-desktop.png`, `atom/atom-12b-uranium-5f-cloud-desktop.png`, `patterns/c01-from-card-iron-gold-desktop.png`, `patterns/c02-gold-mercury-desktop.png`, `hero/10-zoom-in-desktop.png`)** — Nodal plane outlines, balance-scale strings/beams, and zoomed tile bevel edges show visible pixelated jaggedness.
14. **Flattened 3D Heft columns on phone (`hero/09-lens-heft-phone.png`)** — The steep top-down camera on phone makes column heights hard to judge and causes tall elements (Os, Ir, Pt, Au) to partially obscure the row behind them.
15. **Missing `↗ across the table` links on phone element cards (`hero/04-card-iron-phone.png`, `hero/05-card-gold-phone.png` vs `hero/04-card-iron-desktop.png`)** — Desktop cards offer direct `↗ across the table` jumps to Patterns charts, while phone cards omit them; and desktop's expanded table (`hero/06-card-gold-all-numbers-desktop.png`) uses bare `↗` icons without explaining what they open.
16. **Inconsistent Vietnamese element naming (`hero/11-vi-card-iron-phone.png`, `patterns/c10-vi-gold-mercury-desktop.png`, `patterns/p11-vi-grip-phone.png`)** — Mixes traditional Vietnamese and English IUPAC names side-by-side (`Sắt` with `Manganese`/`Cobalt`, `Natri · Chlorine`, and `beryllium và nitơ` in the same phrase).
17. **Predicted superheavy peaks tower above Osmium without explanation (`patterns/p03-heft-gold-phone.png`, `patterns/p03-heft-gold-desktop.png`)** — The headline states `"osmium is the densest element anyone has measured"`, yet Row 7 shows higher peaks whose tiny stripes are barely visible on phone, making it look contradictory at a glance.
18. **Phone `Side by side` minor layout blemishes (`views/5-compare-phone-390x844.png`, `views-other-sizes/5-compare-phone-360x740.png`, `patterns/c03-helium-osmium-phone.png`, `patterns/c05-graphite-diamond-phone.png`, `patterns/c06-hydrogen-oganesson-phone.png`)** — The `A litre of each / One atom of each` toggle sits almost touching the top header buttons, and scrolled `Surprising pairs` pills (`Mercury`, `hlorine`, `amond`) clip sharply at the left edge without a fade mask.
19. **Frozen mercury neighbour count is hard to verify visually (`shared/f05-mercury-frozen-desktop.png`, `sample/s06-mercury-frozen-desktop.png`)** — The caption says `"touches 6 neighbours (in green around the dark one)"`, yet only 3 green spheres are clearly visible around the dark atom from the default angle.
20. **Minor copy/polish inconsistencies** — Desktop uses `"Tap one to look inside."` (`views/1-table-landing-desktop-1440x900.png`); sample reset button switches between `"Room temperature"` on desktop and `"Back to 20 °C"` on phone (`shared/f03-forge-1600C-molten-desktop.png` vs `shared/f03-forge-1600C-molten-phone.png`); `"Boils and turns liquid at"` reads slightly awkwardly (`sample/s13-about-nitrogen-desktop.png`, `sample/s13-about-mercury-frozen-phone.png`); `1 3` x-axis ticks nearly touch Helium's selection ring (`patterns/p15-boiling-desktop.png`); and `atom/atom-04b-chromium-electron-moves-desktop.png` displays Vanadium rather than Chromium.

```json
{
  "table": {
    "clarity": 4.5,
    "ease": 4.0,
    "beauty": 4.5,
    "smoothness": 3.5,
    "delight": 4.5
  },
  "patterns": {
    "clarity": 4.0,
    "ease": 4.5,
    "beauty": 4.0,
    "smoothness": 5.0,
    "delight": 4.5
  },
  "side": {
    "clarity": 5.0,
    "ease": 4.5,
    "beauty": 4.5,
    "smoothness": 5.0,
    "delight": 5.0
  },
  "atom": {
    "clarity": 3.5,
    "ease": 4.0,
    "beauty": 4.0,
    "smoothness": 5.0,
    "delight": 4.5
  },
  "sample": {
    "clarity": 3.5,
    "ease": 3.5,
    "beauty": 4.0,
    "smoothness": 4.5,
    "delight": 4.5
  },
  "overall": {
    "clarity": 4.0,
    "ease": 4.0,
    "beauty": 4.5,
    "smoothness": 4.5,
    "delight": 4.5
  }
}
```
