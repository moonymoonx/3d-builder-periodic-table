# PROPOSALS — patterns (changes to shared files, for the main session to apply or reject)

Nothing below is applied in this branch except P5 (tools/shots.mjs is not on the read-only list; it is a 6-line,
generic change). Each proposal is small and independent.

## P1. Lens banners link to the pattern behind them (`places/home.js`, one line in `renderBanner`)
For a numbers lens (Melting point, Heft, Atom size, Grip…), add a quiet "↗ The pattern behind it" button to the
banner that does `set({ view: 'trends', prop: state.lens })`. *Why:* moony asked "why should I look at the trends?";
the lens shows heights on the table, the pattern answers the question with the same plain name. Today Patterns is
reachable only from three card facts (melting, boiling, heft).

## P2. "All numbers & sources" rows open their pattern (`places/elementCard.js`)
Rows whose field is a pattern (atom size, grip, pull, appetite, weight, crust, discovered, felt pull) get the same
"↗" the three facts have (`hooks.onPattern(key)`). *Why:* every chart is one tap from the number it explains.

## P3. Back link in Vietnamese: the familiar name (`places/home.js`, `renderBack`)
For the 13 elements GDPT-2018 keeps (Sắt, Đồng…), the back link out of a place reads "← Iron" in Vietnamese while
the card it returns to is headed "Sắt". Use the same rule as the card title (`names.viAlt[1] === 'gdpt'`).

## P4. A loupe in the kit (`ui/kit.js`, `styles/kit.css`)
The phone thumb-scrub loupe now exists twice (home's `hero-loupe`, Patterns' `patterns-loupe`), with the same look.
A kit `loupe()` (tile + name + one line, placed above the thumb) would keep them identical. PARALLEL.md: "propose it
for the kit only if a second place needs it" — Patterns is the second.

## P5 (applied here). `tools/shots.mjs`: a generic set loader
`--set=<name>` loads `tools/shots-<name>.mjs` (exporting `cases({ SIZES })`) when it is not `views` or `hero`, so
each view session keeps its review set in its own file and nobody edits the same lines.

## P6. Source popover: "Accessed" and "Licence" too pale (`styles/legacy.css`, `ui/source.js`)
`legacy.css` comes last in `CSS_ORDER` and still sets `.small { color: var(--muted) }` (#a9b6d3, the old dark theme's
pale blue) over base.css's `--ink-2`. In the paper popover (`ui/source.js` lines 29–30) that is about 1.9 : 1, below
STYLE.md's 4.5 : 1 for text and off-palette. Scope the legacy rule to `body.legacy .small`, or give the popover's
lines their own class. (Side by side's own references popover already uses `.patterns-refs__note`, in `--ink-2`.)

## P7. The side-by-side stage in the link (`state.js`, the router)
The stage (a litre of each / one atom of each) is a module holder in `ui/comparePanel.js` (`getStage`, `setStage`,
`onStage`), so a shared link always opens the litre stage. A hash key (e.g. `cs=atoms`, omitted for the default)
would make it linkable; the place already calls `setStage`, so only the state key and the router line are needed.
