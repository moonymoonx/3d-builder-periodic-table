# PROPOSALS — from the sample session (branch `view-sample`)

Changes to shared files that this place needs or that I found while building it. Code changes to shared
files are separate `PROPOSAL: …` commits in this branch (§1, §2); the rest are suggestions for the main
session, who decides. Nothing here is required for the place to work, except where §1 says so.

## 1. `views/sample.js` (PROPOSAL commits, one concern each)
Each commit message carries the reason; all are small and leave the forge's heating path unchanged.

| PROPOSAL commit ("sample view: …") | What | Needed for |
|---|---|---|
| draw radon's measured gas and liquid | `sampleStateAt` gives the "predicted" card only to a predicted or unknown state, or to a solid whose crystal is predicted | **Required:** radon (its −71 °C / −61.7 °C are measured; today it shows "never made in bulk") |
| keep whole molecules in the sparse forge gas | a molecule's two atoms are adjacent in the instance list; the 40 % sparse count keeps whole pairs | **Required:** N₂, O₂, H₂, F₂, Cl₂, Br₂ gas showed as single beads |
| a cool liquid is drawn as its atoms | the molten pool forms only while the melt glows | Mercury and bromine at 20 °C were a dark brown disc. Moot if the in-progress forge (every melt drawn as atoms) lands first |
| glide to the vessel when it changes size | re-frame (0.7 s) when the vessel's size changes by over a fifth | Boron and manganese melting from an honest card (camera was far too close) |
| a condensing gas becomes a liquid of touching beads | on gas → liquid, the beads take the liquid size | Every cooled gas (liquid nitrogen looked porous) |

## 2. `places/elementCard.js` (PROPOSAL commit "element card: the sample place words its own door")
The card's second door asks `hooks.sampleDoor(e)` for its words and keeps today's when it returns null
(every forgeable element). Today mercury reads "Hold a piece · heat it / Watch its atoms as it melts and
boils" (it is already liquid), and the 21 never-made-in-bulk elements are promised a piece to hold. The
words live in `strings-sample.js` (`sample.door.*`); one router line passes the hook (WIRING-sample.md).

## 3. A shared thermometer for the kit (`ui/kit.js`, `styles/kit.css`)
Two places now draw the same big thermometer (`places/heat.js`, `places/sample.js`). Once both are merged,
lifting one `thermometer()` into the kit would keep them identical. The one in `places/sample.js` is
written as a self-contained factory for that: scale `{ lo, hi, events, marks }`, `show(T)`, `valueAt(v)`.
It adds what the forge's does not have yet:
- **Bug in today's `heat.js` tick placement** (committed and in-progress versions): the stem test is
  swapped. A tick in a *higher* row has its stem pass through lower rows, but the code checks the
  *lower* tick's stem against the higher label. Visible as nitrogen's "−196 °C" stem cutting "freezes".
  Correct form: `(p.r <= r || p.x < a - 5 || p.x > b + 5) && (p.r >= r || px < p.a - 5 || px > p.b + 5)`.
  `placeTicks` in `places/sample.js` also tries three orders (importance, right to left, left to right)
  and keeps the first that places every label.
- **Labels 6 px higher**: "Heat it ▶" stops just past each event, so the thumb (30 px) used to sit on the
  label it had just reached ("1,538 °C melts"). Stems grow by the same 6 px.
- **Ticks closer than 14 px share one stem and one label** ("−249 °C freezes · −246 °C turns liquid": neon's
  liquid range is 2.5 K wide).
- **Flags shift inward instead of vanishing** at the ends; their mark stays on the temperature
  (`--dx`). Room temperature is a flag, never dropped.
- Widths measured with the page's fonts (canvas `measureText`) instead of a per-character estimate.

## 4. Tokens (`design/tokens.js`)
Values used by both `heat.css` and `sample.css` that STYLE.md names but tokens.js does not hold:
- the kiln panel: ember text on dark `#F0874F` (STYLE §9: 7 : 1), its lighter link `#F0A070`, the thumb
  `#2A2019`, the panel background (heat.css `rgba(30,23,17,.88)`; sample.css derives it from `--kiln`);
- the temperature ramp (cold blue → paper → ember → glowing white): today written out in kit.css
  (`.ui-temp`), heat.css (`.heat-fill`) and `places/sample.js` (`RAMP`), with the same colours.
- Radii: the forge panel uses 18 px; the sample panel uses `--r-card` (16 px). One of them should change.

## 5. Retiring the legacy sample view (`ui/samplePanel.js`, view `'sample'`)
The new place covers what the legacy panel did for liquids, gases and cards. Retiring it changes four
smoke steps outside this session's block; what replaces each:
| Legacy step | Covered by |
|---|---|
| `sample view: Fe chips jump past each transition` | the forge step (`930 °C re-stacks…`) |
| `sample view: carbon graphite <-> diamond toggle` | **nothing yet**: the forge has no allotrope switch ("About this crystal ▾", REDESIGN-PLAN §2) |
| `sample view: helium stays liquid near 0 K` | `sample: helium never freezes…` |
| `sample view: "Heat it" raises the temperature` (mercury) | `sample: mercury … "◀ Cool it" sweeps down` |
So the legacy view can go once the forge has carbon's switch. Then `'hold'` can be renamed `'sample'`.

## 6. Smaller things seen from here
- **Vietnamese back link** (`places/home.js` `renderBack`): it uses `name()` ("Mercury", "Iron") while the
  card leads with the familiar GDPT-2018 name ("Thuỷ ngân", "Sắt"). The card's title rule would match.
- **Numbers and units wrap apart** in shared formatters (`fmtTemp`, the card's `degC`: "1,840 / km/h",
  "20 / °C" at phone width). The sample place binds them with a no-break space (` `).
- **Phone framing** (`frameGoal`): it fits the vessel's bounding sphere, but the hearth is 1.32× wider, so
  on phones the hearth's corners leave the screen (forge and sample alike).
- **Forge by URL for a non-forgeable element** (`#v=heat&el=N`): the caption says "its atoms in their
  measured pattern" and predicted events show without "≈". Moot once the router sends them here, but
  `heat.js` could guard.
- **Mercury's card (bug):** its melting note reads "Lower than mercury (29.8 °C), the lowest-melting
  metal". `meltAnchor` drops mercury from its own ladder, so the coldest landmark left is gallium, but
  `card.coldest` names mercury: gallium's temperature under mercury's name. For mercury itself the note
  could say it is the lowest-melting metal.
- **Card, never-made elements on phones:** "≈ 51.9 °C" (a prediction with a decimal) and "not in our
  sour…" clipped in the fact strip.
