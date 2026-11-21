# WIRING — sample place (branch `view-sample`)

**Round 2 (`view-sample-r2`): no new router lines.** Everything below was merged with f3d0ae7. The
panel's wait during the scale dive watches `body.diving`, which `main.js` already sets.

The router lines the sample place needs (PARALLEL.md: `main.js` and `state.js` are the main session's; these
are applied at merge). The patch below is exactly what this branch was tested with (smoke, shots, FPS):
it applies cleanly to `src/app/main.js` and `src/app/state.js` at `d1e17ae`.

## What each hunk does (one line each)
**src/app/main.js**
1. `import { buildSample, sampleDoor }`: the place module (`src/app/places/sample.js`).
2. `const holdView = createSampleView({ onKiln }, { look: 'forge' })`: the place's own instance of the forge view (same look; its `onKiln` dims the room only while `state.view === 'hold'` and names the glow).
3. `onDoor`: the card's second door dives into the forge for a forgeable element and into the sample place for every other one (liquids, gases, honest cards). Same dive, same timing.
4. `sampleDoor` passed to the card: the door's words for liquids, gases and honest cards (needs the PROPOSAL commit on `elementCard.js`; harmless without it).
5. `registerView('hold', holdView)` and `buildSample(ui, { onDoor, onLayout })`: register the view; build the place. `onDoor('atom')` is the never-made-in-bulk card's door to the atom (it restores the table's saved temperature, as the back link does); `onLayout` re-frames when "About this sample" opens or closes.
6. `goBack`: the back link leaves the sample place the way it leaves the forge (`leaveHeat`: fade to paper, back to the card, saved temperature restored).
7. `diveIntoHeat(to = 'heat')`: the dive takes the view to open (`E.views[to].diveIn` instead of `forge.diveIn`).
8. `leaveHeat`: also stops the sample place's sweep.
9. `renderLegacy`, `applyPlace`, the state listener, the initial panel check: treat `'hold'` like `'heat'` (no legacy panels, no data sheet, no mobile bar; body class `place-hold`; the kiln class survives in both).
10. `holdPlace.onState(ch)`: the place follows the state (temperature, element, language).
11. Escape: closes "About this sample" first, then the back link as usual.
12. `updateSafe` for `'hold'`: the sample sits between the top bar and the panel; on desktop beside "About this sample" (a right-hand card), on phones above it (a bottom sheet).
13. ResizeObserver: also watches the place's panel and its "About" card.
14. `window.__pt.hold` / `holdView`: for the smoke steps and scripted screenshots (as `heat`, `forge`).

**src/app/state.js**
15. `VIEWS` gains `'hold'`, so `#v=hold&el=N&T=73` is a shareable link.
16. `writeHash` writes `T` for `'hold'` (the temperature is the place's one control).

## Not wired here (decisions for the main session)
- **View name.** The place lives at `'hold'` ("Hold a sample"). `'sample'` stays the legacy view, because four existing smoke steps (`sample view: …`, outside this session's block) drive its panel. Once the legacy view is retired (PROPOSALS-sample.md §5), `'hold'` can be renamed `'sample'` with a one-word change in these lines.
- **Card door wording** is a PROPOSAL commit on `elementCard.js` (PROPOSALS-sample.md §2); hunk 4 passes the hook.
- **Tools:** `tools/shots.mjs` gains one line (`--set=sample` loads `tools/shots-sample.mjs`); `tools/smoke.mjs` gains the `// ---- sample ----` block. Both are in this branch's commits; the smoke block needs the lines below.

## Patch
```diff
diff --git a/src/app/main.js b/src/app/main.js
index 1f12449..f38014e 100644
--- a/src/app/main.js
+++ b/src/app/main.js
@@ -21,6 +21,7 @@ import { buildSheet } from './ui/sheet.js';
 import { buildHome } from './places/home.js';
 import { buildElementCard } from './places/elementCard.js';
 import { buildHeat, forgeable } from './places/heat.js';
+import { buildSample, sampleDoor } from './places/sample.js';
 // strings of the places built in parallel (PARALLEL.md); each session edits only its own file
 import { ATOM_KEYS } from './content/strings-atom.js';
 import { SAMPLE_KEYS } from './content/strings-sample.js';
@@ -80,6 +81,11 @@ function boot() {
     onEvent: (a, b, e) => { if (state.view === 'heat') heat.onEvent(a, b, e); },
     onKiln: on => { document.body.classList.toggle('kiln', on && state.view === 'heat'); if (on) heat.onKiln(on); },
   }, { look: 'forge' });
+  // the sample place (Hold a sample · cool or heat it): the forge's look for liquids, gases and the
+  // honest cards (places/sample.js), on its own instance of the forge view
+  const holdView = createSampleView({
+    onKiln: on => { document.body.classList.toggle('kiln', on && state.view === 'hold'); if (on) holdPlace.onKiln(on); },
+  }, { look: 'forge' });
 
   // ---- home: the table, its chrome and the element card ----------------------------------------------
   let interacted = false, hintTimer = 0, breathTimer = 0;
@@ -108,17 +114,20 @@ function boot() {
     onClose: () => closeCard(),
     onStep: d => { const Z = state.Z + d; openCard(Z < 1 ? 118 : Z > 118 ? 1 : Z, true); },
     onDoor: (v, Z2) => {
-      if (v === 'sample' && forgeable(byZ(state.Z))) { diveIntoHeat(); return; } // the wow path
+      if (v === 'sample') { diveIntoHeat(forgeable(byZ(state.Z)) ? 'heat' : 'hold'); return; } // the wow path; the sample place for the rest
       set({ view: v, ...(v === 'compare' ? { Z2 } : {}), ...(v === 'sample' ? { T: 293.15, allotrope: null } : {}) });
     },
     onPattern: prop => set({ view: 'trends', prop, log: prop === 'density' }),
     defaultPartner,
+    sampleDoor: e => (forgeable(e) ? null : sampleDoor(e)), // the sample place words its own door
   });
   registerView('table', table);
   registerView('atom', atom);
   registerView('sample', sample);
   registerView('heat', forge);
+  registerView('hold', holdView);
   const heat = buildHeat(ui, { onInteract: () => {} });
+  const holdPlace = buildSample(ui, { onDoor: v => set({ view: v, ...(savedT != null ? { T: savedT } : {}) }), onLayout: () => updateSafe() });
   registerView('compare', createCompareView());
   registerView('trends', stubView());
 
@@ -140,7 +149,7 @@ function boot() {
     if (E.active === table) table.frame();
   }
   function goBack() {
-    if (state.view === 'heat') { leaveHeat(); return; }
+    if (state.view === 'heat' || state.view === 'hold') { leaveHeat(); return; }
     if (state.view !== 'table') { set({ view: 'table', card: true, hideSel: false }); return; }
     closeCard();
   }
@@ -148,7 +157,7 @@ function boot() {
   // ---- the scale dive: from the tapped tile into its crystal (STYLE.md §7: 1.4 s, crossfade at 70 %) ----
   const wait = ms => new Promise(r => setTimeout(r, ms));
   let savedT = null, diving = false;
-  async function diveIntoHeat() {
+  async function diveIntoHeat(to = 'heat') {
     if (diving) return;
     diving = true;
     const e = byZ(state.Z), reduced = state.reduced;
@@ -159,15 +168,15 @@ function boot() {
     if (!reduced) { table.dive(e.Z, 1.0); await wait(700); }
     diveEl.classList.add('on'); // the tile's glaze fills the screen...
     await wait(reduced ? 120 : 320);
-    set({ view: 'heat', T: 293.15, allotrope: null });
-    forge.diveIn(reduced ? 0 : 1.2); // ...and opens into the crystal
+    set({ view: to, T: 293.15, allotrope: null });
+    E.views[to].diveIn(reduced ? 0 : 1.2); // ...and opens into the crystal
     await wait(60);
     document.body.classList.remove('diving');
     diveEl.classList.remove('on');
     diving = false;
   }
   async function leaveHeat() {
-    heat.stop();
+    heat.stop(); holdPlace.stop();
     document.body.classList.remove('kiln');
     diveEl.style.background = 'var(--paper)';
     diveEl.classList.add('on');
@@ -192,17 +201,19 @@ function boot() {
       if (!p.panel.parentNode) shell.left.append(p.panel);
       p.render(v === 'atom' ? atom.info() : undefined);
     }
-    if (v !== 'table' && v !== 'heat') sheet.render();
+    if (v !== 'table' && v !== 'heat' && v !== 'hold') sheet.render();
   }
   function applyPlace() {
-    const homeNow = state.view === 'table', heatNow = state.view === 'heat';
-    document.body.classList.toggle('legacy', !homeNow && !heatNow);
+    const homeNow = state.view === 'table', heatNow = state.view === 'heat', holdNow = state.view === 'hold';
+    document.body.classList.toggle('legacy', !homeNow && !heatNow && !holdNow);
     document.body.classList.toggle('place-home', homeNow);
     document.body.classList.toggle('place-heat', heatNow);
-    if (!heatNow) document.body.classList.remove('kiln');
-    shell.left.hidden = homeNow || heatNow; shell.right.hidden = homeNow || heatNow;
-    document.querySelector('.mobile-bar').hidden = homeNow || heatNow;
+    document.body.classList.toggle('place-hold', holdNow);
+    if (!heatNow && !holdNow) document.body.classList.remove('kiln');
+    shell.left.hidden = homeNow || heatNow || holdNow; shell.right.hidden = homeNow || heatNow || holdNow;
+    document.querySelector('.mobile-bar').hidden = homeNow || heatNow || holdNow;
     heat.show(heatNow);
+    holdPlace.show(holdNow);
     if (homeNow && state.card) { if (!card.isOpen()) card.open(); else card.render(); }
     if (!homeNow && card.isOpen()) card.close();
   }
@@ -217,9 +228,10 @@ function boot() {
     for (const v of Object.values(E.views)) if (v.ready && v.onState) v.onState(ch);
     home.onState(ch);
     heat.onState(ch);
+    holdPlace.onState(ch);
     if ('lang' in ch || 'view' in ch) renderAll();
     else {
-      const legacyNow = state.view !== 'table' && state.view !== 'heat';
+      const legacyNow = state.view !== 'table' && state.view !== 'heat' && state.view !== 'hold';
       if (legacyNow && ['prop', 'log', 'layout', 'cb', 'T', 'Z', 'Z2', 'density', 'orbital', 'surf', 'tier', 'allotrope', 'trendLine', 'cmpR'].some(k => k in ch)) renderLegacy();
       if (legacyNow && ['Z', 'more', 'cb', 'T'].some(k => k in ch)) sheet.render();
       if (state.view === 'table' && state.card && ['Z', 'cb'].some(k => k in ch)) card.render();
@@ -237,6 +249,7 @@ function boot() {
     if (k === 'Escape') {
       if (shell.modalOpen()) { shell.closeModal(); return; }
       if (home.menuOpen()) { home.closeMenu(); return; }
+      if (state.view === 'hold' && holdPlace.aboutOpen()) { holdPlace.closeAbout(); return; }
       if (state.view !== 'table' || state.card) { goBack(); return; }
       shell.closePanels(); return;
     }
@@ -281,20 +294,26 @@ function boot() {
       setSafe({ left: 0, right: 0, top: tb.bottom + 8, bottom: H - pr.top + 12 });
       return;
     }
+    if (state.view === 'hold') { // the sample sits between the top bar and the panel, beside "About this sample"
+      const pr = holdPlace.panel.getBoundingClientRect(), ab = holdPlace.aboutOpen() ? restingRect(holdPlace.about.el) : null;
+      if (isPhone()) setSafe({ left: 0, right: 0, top: tb.bottom + 8, bottom: H - (ab ? ab.top : pr.top) + 12 });
+      else setSafe({ left: 0, right: ab ? W - ab.left + 12 : 0, top: tb.bottom + 8, bottom: H - pr.top + 12 });
+      return;
+    }
     if (isPhone()) { setSafe({ left: 0, right: 0, top: tb.bottom + 4, bottom: 64 }); return; }
     const L = shell.left.getBoundingClientRect(), R = shell.right.getBoundingClientRect();
     const show = el => !el.hidden && getComputedStyle(el).display !== 'none' && el.children.length;
     setSafe({ left: show(shell.left) ? L.right + 8 : 0, right: show(shell.right) ? W - R.left + 8 : 0, top: tb.bottom + 6, bottom: 0 });
   }
   const ro = new ResizeObserver(() => updateSafe());
-  for (const el of [shell.left, shell.right, home.top, home.bottom, home.head, card.el, heat.panel]) ro.observe(el);
+  for (const el of [shell.left, shell.right, home.top, home.bottom, home.head, card.el, heat.panel, holdPlace.panel, holdPlace.about.el]) ro.observe(el);
   window.addEventListener('resize', () => { home.render(); updateSafe(); });
 
   renderAll();
   updateSafe();
   switchView(state.view);
   if (state.view === 'table' && state.card) table.focus(state.Z, 0);
-  if (!isPhone() && state.view !== 'table' && state.view !== 'heat') shell.openPanel('right');
+  if (!isPhone() && state.view !== 'table' && state.view !== 'heat' && state.view !== 'hold') shell.openPanel('right');
 
   // first five seconds: a light sweep, iron breathes, a "Try iron" tag after 4 s without a touch
   const loading = document.getElementById('loading');
@@ -308,7 +327,7 @@ function boot() {
     }
   }));
   for (const evName of ['pointerdown', 'wheel']) E.canvas.addEventListener(evName, firstTouch, { passive: true });
-  window.__pt = { state, set, E, table, home, card, heat, forge, diveIntoHeat, strings: { atom: ATOM_KEYS, sample: SAMPLE_KEYS, patterns: PATTERNS_KEYS } }; // debugging / scripted screenshots
+  window.__pt = { state, set, E, table, home, card, heat, forge, diveIntoHeat, hold: holdPlace, holdView, strings: { atom: ATOM_KEYS, sample: SAMPLE_KEYS, patterns: PATTERNS_KEYS } }; // debugging / scripted screenshots
 }
 
 boot();
diff --git a/src/app/state.js b/src/app/state.js
index d7ad105..dc83a86 100644
--- a/src/app/state.js
+++ b/src/app/state.js
@@ -1,7 +1,7 @@
 // Global app state + shareable URL hash (#v=table&el=Fe&p=ie1&lay=s18&lang=vi ...).
 const listeners = new Set();
 // 'table' is home; the other views are reached through the element card (the quiz is parked on a branch)
-export const VIEWS = ['table', 'atom', 'sample', 'trends', 'compare', 'heat']; // heat: the forge (Hold a piece · heat it)
+export const VIEWS = ['table', 'atom', 'sample', 'trends', 'compare', 'heat', 'hold']; // heat: the forge (Hold a piece · heat it); hold: the sample place (liquids, gases, honest cards)
 export const LENSES = ['families', 'heat', 'mp', 'density', 'rCov', 'ie1', 'en', 'year', 'abund', 'bp', 'ea', 'aw', 'rVdw', 'zeff'];
 export const LAYOUTS = ['s18', 's32', 'helix'];
 
@@ -58,7 +58,7 @@ function writeHash() {
   if (state.view === 'compare') q.set('el2', symOf(state.Z2));
   if (state.view === 'trends') { q.set('p', state.prop); if (state.log) q.set('log', '1'); }
   if (state.view === 'table') { if (state.lens !== 'families') q.set('lens', state.lens); if (state.card) q.set('card', '1'); if (state.layout !== 's18') q.set('lay', state.layout); }
-  if (state.view === 'sample' || (state.view === 'table' && state.lens === 'heat')) q.set('T', String(Math.round(state.T * 100) / 100));
+  if (state.view === 'sample' || state.view === 'hold' || (state.view === 'table' && state.lens === 'heat')) q.set('T', String(Math.round(state.T * 100) / 100));
   if (state.view === 'atom') { if (state.orbital) q.set('orb', state.orbital); if (state.density !== 'orbital') q.set('den', state.density); }
   if (state.view === 'sample' && state.allotrope) q.set('alt', state.allotrope);
   if (state.view === 'trends' && state.trendLine !== 'period') q.set('line', state.trendLine);
```
