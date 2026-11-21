# WIRING — atom place into the router (`src/app/main.js`)

For the main session to apply at merge (PARALLEL.md: no session edits `main.js`). The branch was built and tested with exactly this patch applied in the working tree, never committed. Apply it with `git apply` (the patch below is against `d1e17ae`), or by hand hunk by hunk.

**Why each hunk** (one line each):
1. Imports: the atom place replaces the legacy left panel (`ui/atomPanel.js`) and the dark-stage spectrum box.
2. `createAtomView` calls back the place when the view has built (the caption follows the clouds on screen).
3. The card's "Look inside the atom" door gets the same scale dive as the forge: into the tile, then out through the atom's shells.
4. Mount the place (the kit sheet: a card on desktop, a bottom sheet on phones).
5. `diveIntoHeat()` becomes `diveInto(place)` for both deep places; only the forge saves the table's temperature. The atom opens on the whole atom (`orbital: null`).
6. Legacy panels: the atom view no longer uses the left panel, the spectrum box or the right-hand data sheet.
7. `applyPlace`: the atom view is a porcelain place (`place-atom`, not `legacy`); the kiln may stay on there ("Its light"); legacy chrome hidden; show or hide the place.
8. `on(ch)`: forward state changes to the place (Z, language, orbital, colour-blind palette, tier).
9. `legacyNow`: the atom view is not a legacy view any more.
10. `updateSafe`: frame the atom beside the card (desktop), above the sheet (phone), above the spectrum band in "Its light".
11. ResizeObserver: the card and the light band change the free area.
12. Boot: no legacy right panel for the atom view on desktop.
13. `window.__pt`: keep `diveIntoHeat` for tools; expose the place for debugging.

After applying, `src/app/ui/atomPanel.js` and `buildSpectrum` in `src/app/ui/spectrum.js` are no longer imported. They are kept in the branch only so that the router builds before this patch; delete them afterwards (PROPOSALS-atom.md #6).

```diff
diff --git a/src/app/main.js b/src/app/main.js
index 1f12449..fc10f1c 100644
--- a/src/app/main.js
+++ b/src/app/main.js
@@ -9,8 +9,7 @@ import { setLang, t } from './i18n.js';
 import { createEngine, registerView, switchView, E, invalidate, setSafe } from './engine.js';
 import { createTableView } from './views/table.js';
 import { createAtomView } from './views/atom.js';
-import { buildAtomPanel } from './ui/atomPanel.js';
-import { buildSpectrum } from './ui/spectrum.js';
+import { buildAtom } from './places/atom.js';
 import { createSampleView } from './views/sample.js';
 import { buildSampleUI } from './ui/samplePanel.js';
 import { buildTrends } from './ui/trends.js';
@@ -61,12 +60,10 @@ function boot() {
   // ---- legacy views (rebuilt later against the same tokens and kit) ----------------------------------
   const shell = buildShell();
   const sheet = buildSheet(shell.right, { onView: v => set({ view: v }) });
-  const atomPanel = buildAtomPanel(shell.left);
-  const spectrum = buildSpectrum(ui); spectrum.box.hidden = true;
   const sampleUI = buildSampleUI(ui, shell.left);
   const trends = buildTrends(ui, shell.left);
   const comparePanel = buildComparePanel(shell.left, ui); comparePanel.panel.remove();
-  const atom = createAtomView({ onBuilt: info => { if (state.view === 'atom') atomPanel.render(info); } });
+  const atom = createAtomView({ onBuilt: info => atomPlace.onBuilt(info) });
   const sample = createSampleView({
     onState: info => { if (state.view === 'sample') sampleUI.render(info); },
     onEvent: (a, b, e) => { if (state.view === 'sample') sampleUI.onEvent(a, b, e); },
@@ -108,7 +105,8 @@ function boot() {
     onClose: () => closeCard(),
     onStep: d => { const Z = state.Z + d; openCard(Z < 1 ? 118 : Z > 118 ? 1 : Z, true); },
     onDoor: (v, Z2) => {
-      if (v === 'sample' && forgeable(byZ(state.Z))) { diveIntoHeat(); return; } // the wow path
+      if (v === 'sample' && forgeable(byZ(state.Z))) { diveInto('heat'); return; } // the wow path
+      if (v === 'atom') { diveInto('atom'); return; } // into the tile, out through the atom's shells
       set({ view: v, ...(v === 'compare' ? { Z2 } : {}), ...(v === 'sample' ? { T: 293.15, allotrope: null } : {}) });
     },
     onPattern: prop => set({ view: 'trends', prop, log: prop === 'density' }),
@@ -119,6 +117,7 @@ function boot() {
   registerView('sample', sample);
   registerView('heat', forge);
   const heat = buildHeat(ui, { onInteract: () => {} });
+  const atomPlace = buildAtom(ui, { view: atom, onBack: () => goBack() });
   registerView('compare', createCompareView());
   registerView('trends', stubView());
 
@@ -148,19 +147,19 @@ function boot() {
   // ---- the scale dive: from the tapped tile into its crystal (STYLE.md §7: 1.4 s, crossfade at 70 %) ----
   const wait = ms => new Promise(r => setTimeout(r, ms));
   let savedT = null, diving = false;
-  async function diveIntoHeat() {
+  async function diveInto(place) {
     if (diving) return;
     diving = true;
     const e = byZ(state.Z), reduced = state.reduced;
-    savedT = state.T;
+    if (place === 'heat') savedT = state.T;
     diveEl.style.background = (state.cb ? pigmentCB : pigment)[e.f.cat[0]];
     document.body.classList.add('diving'); // the chrome steps aside for the plunge
     card.close();
     if (!reduced) { table.dive(e.Z, 1.0); await wait(700); }
     diveEl.classList.add('on'); // the tile's glaze fills the screen...
     await wait(reduced ? 120 : 320);
-    set({ view: 'heat', T: 293.15, allotrope: null });
-    forge.diveIn(reduced ? 0 : 1.2); // ...and opens into the crystal
+    set(place === 'heat' ? { view: 'heat', T: 293.15, allotrope: null } : { view: 'atom', orbital: null });
+    (place === 'heat' ? forge : atom).diveIn(reduced ? 0 : 1.2); // ...and opens into the crystal or the atom
     await wait(60);
     document.body.classList.remove('diving');
     diveEl.classList.remove('on');
@@ -178,31 +177,31 @@ function boot() {
   }
 
   // ---- legacy panels per view --------------------------------------------------------------------
-  const leftPanels = { atom: atomPanel, sample: { panel: sampleUI.panel, render: () => sampleUI.render() }, trends: { panel: trends.panel, render: () => trends.render() }, compare: comparePanel };
+  const leftPanels = { sample: { panel: sampleUI.panel, render: () => sampleUI.render() }, trends: { panel: trends.panel, render: () => trends.render() }, compare: comparePanel };
   function renderLegacy() {
     const v = state.view;
     for (const [k, p] of Object.entries(leftPanels)) if (k !== v && p.panel.parentNode) p.panel.remove();
-    spectrum.box.hidden = v !== 'atom';
     sampleUI.show(v === 'sample');
     trends.show(v === 'trends');
     comparePanel.show(v === 'compare');
-    if (v === 'atom') spectrum.render(byZ(state.Z));
     if (leftPanels[v]) {
       const p = leftPanels[v];
       if (!p.panel.parentNode) shell.left.append(p.panel);
-      p.render(v === 'atom' ? atom.info() : undefined);
+      p.render();
     }
-    if (v !== 'table' && v !== 'heat') sheet.render();
+    if (v !== 'table' && v !== 'heat' && v !== 'atom') sheet.render();
   }
   function applyPlace() {
-    const homeNow = state.view === 'table', heatNow = state.view === 'heat';
-    document.body.classList.toggle('legacy', !homeNow && !heatNow);
+    const homeNow = state.view === 'table', heatNow = state.view === 'heat', atomNow = state.view === 'atom';
+    document.body.classList.toggle('legacy', !homeNow && !heatNow && !atomNow);
     document.body.classList.toggle('place-home', homeNow);
     document.body.classList.toggle('place-heat', heatNow);
-    if (!heatNow) document.body.classList.remove('kiln');
-    shell.left.hidden = homeNow || heatNow; shell.right.hidden = homeNow || heatNow;
-    document.querySelector('.mobile-bar').hidden = homeNow || heatNow;
+    document.body.classList.toggle('place-atom', atomNow);
+    if (!heatNow && !atomNow) document.body.classList.remove('kiln');
+    shell.left.hidden = homeNow || heatNow || atomNow; shell.right.hidden = homeNow || heatNow || atomNow;
+    document.querySelector('.mobile-bar').hidden = homeNow || heatNow || atomNow;
     heat.show(heatNow);
+    atomPlace.show(atomNow);
     if (homeNow && state.card) { if (!card.isOpen()) card.open(); else card.render(); }
     if (!homeNow && card.isOpen()) card.close();
   }
@@ -217,9 +216,10 @@ function boot() {
     for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
     home.onState(ch);
     heat.onState(ch);
+    atomPlace.onState(ch);
     if ('lang' in ch || 'view' in ch) renderAll();
     else {
-      const legacyNow = state.view !== 'table' && state.view !== 'heat';
+      const legacyNow = state.view !== 'table' && state.view !== 'heat' && state.view !== 'atom';
       if (legacyNow && ['prop', 'log', 'layout', 'cb', 'T', 'Z', 'Z2', 'density', 'orbital', 'surf', 'tier', 'allotrope', 'trendLine', 'cmpR'].some(k => k in ch)) renderLegacy();
       if (legacyNow && ['Z', 'more', 'cb', 'T'].some(k => k in ch)) sheet.render();
       if (state.view === 'table' && state.card && ['Z', 'cb'].some(k => k in ch)) card.render();
@@ -276,6 +276,7 @@ function boot() {
       }
       return;
     }
+    if (state.view === 'atom') { setSafe(atomPlace.safe(tb.bottom)); return; } // beside the card, above the phone sheet
     if (state.view === 'heat') { // the crystal sits between the top bar and the thermometer
       const pr = heat.panel.getBoundingClientRect();
       setSafe({ left: 0, right: 0, top: tb.bottom + 8, bottom: H - pr.top + 12 });
@@ -287,14 +288,14 @@ function boot() {
     setSafe({ left: show(shell.left) ? L.right + 8 : 0, right: show(shell.right) ? W - R.left + 8 : 0, top: tb.bottom + 6, bottom: 0 });
   }
   const ro = new ResizeObserver(() => updateSafe());
-  for (const el of [shell.left, shell.right, home.top, home.bottom, home.head, card.el, heat.panel]) ro.observe(el);
+  for (const el of [shell.left, shell.right, home.top, home.bottom, home.head, card.el, heat.panel, atomPlace.el, atomPlace.band]) ro.observe(el);
   window.addEventListener('resize', () => { home.render(); updateSafe(); });
 
   renderAll();
   updateSafe();
   switchView(state.view);
   if (state.view === 'table' && state.card) table.focus(state.Z, 0);
-  if (!isPhone() && state.view !== 'table' && state.view !== 'heat') shell.openPanel('right');
+  if (!isPhone() && state.view !== 'table' && state.view !== 'heat' && state.view !== 'atom') shell.openPanel('right');
 
   // first five seconds: a light sweep, iron breathes, a "Try iron" tag after 4 s without a touch
   const loading = document.getElementById('loading');
@@ -308,7 +309,7 @@ function boot() {
     }
   }));
   for (const evName of ['pointerdown', 'wheel']) E.canvas.addEventListener(evName, firstTouch, { passive: true });
-  window.__pt = { state, set, E, table, home, card, heat, forge, diveIntoHeat, strings: { atom: ATOM_KEYS, sample: SAMPLE_KEYS, patterns: PATTERNS_KEYS } }; // debugging / scripted screenshots
+  window.__pt = { state, set, E, table, home, card, heat, forge, diveIntoHeat: () => diveInto('heat'), atomPlace, diveInto, strings: { atom: ATOM_KEYS, sample: SAMPLE_KEYS, patterns: PATTERNS_KEYS } }; // debugging / scripted screenshots
 }
 
 boot();
```

**Check after applying:** `node tools/build.mjs && node tools/smoke.mjs` (the `// ---- atom ----` block drives the place through the door, the stepper, the three ways to look, "About this atom", the keyboard, Vietnamese and a phone viewport).
