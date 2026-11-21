# WIRING — patterns (Patterns across the table + Side by side)

The main session applies these lines at merge (PARALLEL.md: never three conflicting edits of the router).
**This branch boots only with them applied:** `ui/trends.js` and `ui/comparePanel.js` no longer export the
legacy `buildTrends` / `buildComparePanel` (the dark-stage panels they built are retired by this scope).
Verified locally on an unstaged copy: build, unit tests (33/33), validator, smoke 31/31 (after part 2).

## 1. `src/app/main.js` (patch against d1e17ae)
One line of reason per hunk:
1. imports: the two new places replace the legacy panel builders; `twoForms` lets carbon stand beside itself.
2. build: `buildPatterns(ui)` and `buildCompare(ui, { onBack, onLayout })` (onLayout re-frames the stage when the sheet changes height).
3. `home.onPick`: in Patterns / Side by side, Find picks the element there instead of opening the card over the place.
4. `card.onPattern`: no `log` — the Patterns place picks its own scale (log only for crustal abundance), and
   writing `state.log` there made the table's Heft lens log-scaled after coming back (it is linear by decision).
5. `goBack`: restore the lens's `prop`/`log` when returning to the card, since Patterns shares `state.prop`
   with the table heights (a Melting point lens would otherwise come back showing the last pattern viewed).
6. `leftPanels` / `renderLegacy`: trends and compare no longer have legacy panels or the legacy data sheet.
7. `applyPlace`: `trends` and `compare` are porcelain places (no `body.legacy`, no side panels or mobile bar);
   show/hide the two places.
8. `on()`: the Z2 guard lets carbon stand beside itself (graphite · diamond: `el=C&el2=C`); forward state to the places.
9. `updateSafe`: each place says which part of the screen its 3D view may use (`safeArea()`).

```diff
diff --git a/src/app/main.js b/src/app/main.js
index 1f12449..5bd53c6 100644
--- a/src/app/main.js
+++ b/src/app/main.js
@@ -13,9 +13,10 @@ import { buildAtomPanel } from './ui/atomPanel.js';
 import { buildSpectrum } from './ui/spectrum.js';
 import { createSampleView } from './views/sample.js';
 import { buildSampleUI } from './ui/samplePanel.js';
-import { buildTrends } from './ui/trends.js';
+import { buildPatterns } from './places/patterns.js';
 import { createCompareView } from './views/compare.js';
-import { buildComparePanel, defaultPartner } from './ui/comparePanel.js';
+import { defaultPartner, twoForms } from './ui/comparePanel.js';
+import { buildCompare } from './places/compare.js';
 import { buildShell } from './ui/shell.js';
 import { buildSheet } from './ui/sheet.js';
 import { buildHome } from './places/home.js';
@@ -64,8 +65,8 @@ function boot() {
   const atomPanel = buildAtomPanel(shell.left);
   const spectrum = buildSpectrum(ui); spectrum.box.hidden = true;
   const sampleUI = buildSampleUI(ui, shell.left);
-  const trends = buildTrends(ui, shell.left);
-  const comparePanel = buildComparePanel(shell.left, ui); comparePanel.panel.remove();
+  const patterns = buildPatterns(ui);
+  const sideBySide = buildCompare(ui, { onBack: () => goBack(), onLayout: () => updateSafe() });
   const atom = createAtomView({ onBuilt: info => { if (state.view === 'atom') atomPanel.render(info); } });
   const sample = createSampleView({
     onState: info => { if (state.view === 'sample') sampleUI.render(info); },
@@ -98,7 +99,7 @@ function boot() {
     isPhone,
   });
   const home = buildHome(ui, {
-    onPick: e => { firstTouch(); openCard(e.Z, true); },
+    onPick: e => { firstTouch(); if (state.view === 'trends' || state.view === 'compare') set({ Z: e.Z }); else openCard(e.Z, true); },
     onBack: () => goBack(),
     onInteract: firstTouch,
     onReset: () => table.frame(),
@@ -111,7 +112,7 @@ function boot() {
       if (v === 'sample' && forgeable(byZ(state.Z))) { diveIntoHeat(); return; } // the wow path
       set({ view: v, ...(v === 'compare' ? { Z2 } : {}), ...(v === 'sample' ? { T: 293.15, allotrope: null } : {}) });
     },
-    onPattern: prop => set({ view: 'trends', prop, log: prop === 'density' }),
+    onPattern: prop => set({ view: 'trends', prop }),
     defaultPartner,
   });
   registerView('table', table);
@@ -141,7 +142,7 @@ function boot() {
   }
   function goBack() {
     if (state.view === 'heat') { leaveHeat(); return; }
-    if (state.view !== 'table') { set({ view: 'table', card: true, hideSel: false }); return; }
+    if (state.view !== 'table') { set({ view: 'table', card: true, hideSel: false, ...lensPatch(state.lens) }); return; }
     closeCard();
   }
 
@@ -178,38 +179,38 @@ function boot() {
   }
 
   // ---- legacy panels per view --------------------------------------------------------------------
-  const leftPanels = { atom: atomPanel, sample: { panel: sampleUI.panel, render: () => sampleUI.render() }, trends: { panel: trends.panel, render: () => trends.render() }, compare: comparePanel };
+  const leftPanels = { atom: atomPanel, sample: { panel: sampleUI.panel, render: () => sampleUI.render() } };
   function renderLegacy() {
     const v = state.view;
     for (const [k, p] of Object.entries(leftPanels)) if (k !== v && p.panel.parentNode) p.panel.remove();
     spectrum.box.hidden = v !== 'atom';
     sampleUI.show(v === 'sample');
-    trends.show(v === 'trends');
-    comparePanel.show(v === 'compare');
     if (v === 'atom') spectrum.render(byZ(state.Z));
     if (leftPanels[v]) {
       const p = leftPanels[v];
       if (!p.panel.parentNode) shell.left.append(p.panel);
       p.render(v === 'atom' ? atom.info() : undefined);
     }
-    if (v !== 'table' && v !== 'heat') sheet.render();
+    if (v !== 'table' && v !== 'heat' && v !== 'trends' && v !== 'compare') sheet.render();
   }
   function applyPlace() {
-    const homeNow = state.view === 'table', heatNow = state.view === 'heat';
-    document.body.classList.toggle('legacy', !homeNow && !heatNow);
+    const homeNow = state.view === 'table', heatNow = state.view === 'heat', ownNow = state.view === 'trends' || state.view === 'compare';
+    document.body.classList.toggle('legacy', !homeNow && !heatNow && !ownNow);
     document.body.classList.toggle('place-home', homeNow);
     document.body.classList.toggle('place-heat', heatNow);
     if (!heatNow) document.body.classList.remove('kiln');
-    shell.left.hidden = homeNow || heatNow; shell.right.hidden = homeNow || heatNow;
-    document.querySelector('.mobile-bar').hidden = homeNow || heatNow;
+    shell.left.hidden = homeNow || heatNow || ownNow; shell.right.hidden = homeNow || heatNow || ownNow;
+    document.querySelector('.mobile-bar').hidden = homeNow || heatNow || ownNow;
     heat.show(heatNow);
+    patterns.show(state.view === 'trends');
+    sideBySide.show(state.view === 'compare');
     if (homeNow && state.card) { if (!card.isOpen()) card.open(); else card.render(); }
     if (!homeNow && card.isOpen()) card.close();
   }
   function renderAll() { shell.relabel(); home.render(); renderLegacy(); applyPlace(); if (card.isOpen()) card.render(); }
 
   on(ch => {
-    if (('view' in ch || 'Z' in ch) && state.view === 'compare' && (!state.Z2 || state.Z2 === state.Z)) set({ Z2: defaultPartner(state.Z) }, { silent: true });
+    if (('view' in ch || 'Z' in ch) && state.view === 'compare' && (!state.Z2 || (state.Z2 === state.Z && !twoForms(state.Z)))) set({ Z2: defaultPartner(state.Z) }, { silent: true });
     if ('lens' in ch) Object.assign(state, lensPatch(state.lens)); // (already set by the chip; keeps hash loads consistent)
     if ('lang' in ch) setLang(state.lang);
     if ('reduced' in ch) { document.body.classList.toggle('reduced', state.reduced); E.rig.reduced = state.reduced; }
@@ -217,9 +218,11 @@ function boot() {
     for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
     home.onState(ch);
     heat.onState(ch);
+    patterns.onState(ch);
+    sideBySide.onState(ch);
     if ('lang' in ch || 'view' in ch) renderAll();
     else {
-      const legacyNow = state.view !== 'table' && state.view !== 'heat';
+      const legacyNow = state.view !== 'table' && state.view !== 'heat' && state.view !== 'trends' && state.view !== 'compare';
       if (legacyNow && ['prop', 'log', 'layout', 'cb', 'T', 'Z', 'Z2', 'density', 'orbital', 'surf', 'tier', 'allotrope', 'trendLine', 'cmpR'].some(k => k in ch)) renderLegacy();
       if (legacyNow && ['Z', 'more', 'cb', 'T'].some(k => k in ch)) sheet.render();
       if (state.view === 'table' && state.card && ['Z', 'cb'].some(k => k in ch)) card.render();
@@ -281,6 +284,8 @@ function boot() {
       setSafe({ left: 0, right: 0, top: tb.bottom + 8, bottom: H - pr.top + 12 });
       return;
     }
+    if (state.view === 'trends') { setSafe(patterns.safeArea()); return; }
+    if (state.view === 'compare') { setSafe(sideBySide.safeArea()); return; }
     if (isPhone()) { setSafe({ left: 0, right: 0, top: tb.bottom + 4, bottom: 64 }); return; }
     const L = shell.left.getBoundingClientRect(), R = shell.right.getBoundingClientRect();
     const show = el => !el.hidden && getComputedStyle(el).display !== 'none' && el.children.length;
```

## 2. `tools/smoke.mjs`: retire the four legacy trends/compare steps
They test the dark-stage panels this scope replaces (`.chip.prop`, `.chart-head h2`, `.side.left .chip`,
`.side.left p.why`, "See it as heights on the table"), so they cannot pass after part 1. The `// ---- patterns ----`
block at the end of the file covers the same ground in the new places (pick a property, tap a dot to select,
see it on the table, partner chips, swap, radius toggle, sentences, Vietnamese familiar names).
Delete these four steps (in master at d1e17ae, lines 213–253):
- `trends: pick a property, tap a dot to select that element`
- `trends: "See it as heights on the table" keeps the property`
- `compare: partner chip, swap, radius toggle and sentences`
- `compare (VI): sentences use the familiar Vietnamese name too`

Note: with them in place, `compare (VI)` times out before switching the language back to English, so the next
step (the forge) fails too, looking for "Hold a piece" in Vietnamese. That is a cascade, not a forge bug:
without the four steps the forge step passes.

## 3. Nothing else
- No change to `state.js`: the places use the existing keys `prop`, `trendLine` (Patterns), `Z2`, `cmpR` (Side by side)
  and their hash keys (`p`, `line`, `el2`, `rad`).
- `tools/build.mjs` already inlines `src/styles/patterns.css` (one file for both places).
