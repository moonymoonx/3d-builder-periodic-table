# Design Study: Redesigning the 3D Periodic Table for Curious Non-Experts

**Goal:** Beat Ryan Sael's 3D periodic table ([sael.net/periodic-table](https://sael.net/periodic-table)) on *feel, clarity, and wonder* while keeping real, cited science—built for curious adults who haven't taken chemistry since school (economists, developers, documentary watchers) as well as students and teachers.

---

## 1. Breakdown of Ryan Sael's 3D Periodic Table

> *Method note:* Out of respect for the automated-reader notice on [sael.net/periodic-table](https://sael.net/periodic-table), this critique relies exclusively on our existing observation log (`ref/VIDEO_NOTES.md`) and public listings ([sael.net/periodic-table](https://sael.net/periodic-table), [x.com/RyanSael/status/2114706108317372821](https://x.com/RyanSael/status/2114706108317372821)). We do **not** imitate or reconstruct his visual style; per `DESIGN-RULES.md`, we design an original aesthetic that surpasses it on experience. Unverified details are explicitly marked.

### First 5 Seconds
- **What you see:** A photoreal dusk showroom with 118 glowing 3D columns arranged on a physical desk, shallow depth-of-field (DOF), and strong PBR reflections/bloom (`ref/VIDEO_NOTES.md`). It reads immediately as a museum-grade interactive exhibit rather than a spreadsheet or textbook diagram.
- **What you're invited to do:** Hover over columns for live value tooltips, drag to orbit, or click a column to dive straight into the Atom view. The top-right control cluster invites switching `HEIGHT` (plain-worded: *Ionisation, Size, Pull, Melting, Density*) and `VIEW` (*Table / Atom / Sample / Demo*), while an element slider (`1–118`) and "each click adds a proton" affordance encourage tactile stepping (`ref/VIDEO_NOTES.md`).

### Motion and Camera
- Columns smoothly animate height when switching properties; clicking an element triggers a dramatic camera dive from table scale into atomic scale (`ref/VIDEO_NOTES.md`).
- Cinematic camera presets (`C`) add documentary polish, and the Sample view animates solid → liquid → gas transitions continuously as you scrub a temperature slider (`ref/VIDEO_NOTES.md`).

### Density of Text
- Intentionally sparse on the default stage: a single compact top-left card (name, symbol, Z, weight, melting/boiling points, short blurb) and a minimal top-right control stack (`ref/VIDEO_NOTES.md`).
- Critically, technical concepts are translated into *warm plain English* right in the scene—for example, `"Pull"` instead of *Electronegativity*, and atom captions like `"last one goes into 6d; d orbitals are four-leaf clovers"` (`ref/VIDEO_NOTES.md`).

### Typography, Colour, and Lighting
- Dark, moody dusk atmosphere with high-contrast light typography, glowing accents, PBR materials, heavy bloom, and cinematic DOF (`ref/VIDEO_NOTES.md`). *(Exact font families and full colour tokens are unverified—we did not inspect site stylesheets.)*
- Colour coding distinguishes element families while glowing emission strips (`"ITS GLOW"` toggle) connect atomic spectra directly to visible light (`ref/VIDEO_NOTES.md`).

### What Makes It Delightful
1. **Tactile physical metaphor:** A lit glass-and-metal tabletop exhibit + glass sample cube with an adjacent thermometer feels like holding real laboratory curiosities, not clicking a database UI.
2. **Zero-jargon voice:** Replacing *electronegativity* with *Pull* and explaining `6d` as *four-leaf clovers* lets a non-chemist stay curious instead of bouncing off terminology.
3. **Playful "Demo" dioramas:** Scripted visual moments (alkali + water, flame tests, neon tubes, bismuth crystals, diamond vs. graphite, iron filings + magnet) turn abstract numbers into memorable physical spectacles (`ref/VIDEO_NOTES.md`).

### Where It Is Weak (Our Opportunity)
- **Performance and precision:** Heavy PBR + DOF + bloom produces sluggish frame rates and makes small 3D columns hard to click accurately; low-end laptops and phones are likely poor *(mobile FPS unverified, noted as likely bad in `ref/VIDEO_NOTES.md`)*.
- **Scientific shortcuts:** Sample view uses a generic cubic particle grid instead of true crystal lattices (BCC/FCC/HCP/diamond); orbitals hint at shapes via point clouds + shell rings rather than accurate phase-coloured $\psi(n,l,m)$ lobes and nodes (`ref/VIDEO_NOTES.md`).
- **Missing discovery & exploration tools:** No search, no category filters, missing reactive nonmetals in the demo legend (and no legend on the live site), no trends comparison chart, no side-by-side element comparison, no alternate table layouts, and no guided learning path (`ref/VIDEO_NOTES.md`).
- **Small 3D labels & thin depth:** Floating 3D callouts are small and harder to scan, and there is no sourced deep-dive data sheet *(full depth of data sheet unverified per `ref/VIDEO_NOTES.md`)*.

---

## 2. Four Reference Designs to Learn From

### 1. Bartosz Ciechanowski — *Mechanical Watch*
- **Link:** [ciechanow.ski/mechanical-watch/](https://ciechanow.ski/mechanical-watch/)
- **First 5 seconds:** Clean cream-and-ink editorial typography opens immediately onto a crisp, brightly lit, interactive 3D watch mechanism running smoothly right inside the prose—no splash screen, no chrome walls, no instructions needed.
- **Making complex things intelligible:** Pairs every single mechanism with a direct-manipulation 3D cutaway right next to the sentence explaining it, and colour-codes key words in text to match the moving 3D parts ([aresluna.org review via search](https://ciechanow.ski/mechanical-watch/)).
- **Progressive disclosure:** Never dumps the full watch on you at once. Starts with one coiled spring, adds one gear, then an escapement, building mental models one lever at a time.
- **Motion:** Hand-coded 60 fps WebGL physics where sliders and direct drags obey real mechanical constraints—motion *is* the explanation, never decorative spin.
- **The 'wow' moment:** Dragging a single slider and watching a complex interlocking escapement tick in real time—turning "black-box engineering" into immediate physical intuition.
- **Concrete lesson for us:** **Light-touched, tactile, 60 fps 3D beats heavy dark bloom.** Pair every scientific concept (orbitals, lattice melting, atomic radius) with *one* direct control and match text highlight colours to the 3D parts being explained.

### 2. Neal.fun — *The Deep Sea*
- **Link:** [neal.fun/deep-sea/](https://neal.fun/deep-sea/)
- **First 5 seconds:** Bright blue ocean surface, a single animated prompt (`Scroll down`), and zero menus or settings. Within two seconds you are descending past familiar sea life with a live depth meter ticking downward.
- **Making complex things intelligible:** Anchors unimaginable numerical scales (10,900 meters of ocean depth) to human landmarks everyone knows—scuba divers, the *Titanic*, Mount Everest inverted—so numbers gain emotional weight ([neal.fun/deep-sea/](https://neal.fun/deep-sea/)).
- **Progressive disclosure:** One continuous gesture (scrolling) unveils oceanic zones (*Sunlight → Twilight → Midnight → Abyssal → Hadal*) one discovery at a time; you never see a taxonomy menu upfront.
- **Motion:** Ambient colour shifts from sunlit turquoise to abyssal black as you scroll, making environmental change *felt* rather than stated in a sidebar.
- **The 'wow' moment:** Scrolling past the depth of the *Titanic* and realizing you are barely a third of the way to Challenger Deep.
- **Concrete lesson for us:** **Give every number a human-scale anchor and a single obvious first gesture.** When scrubbing temperature or comparing density, show everyday landmarks right on the axis (*"Melts in your hand — Gallium, 29.8 °C"*, *"Boiling water"*, *"Incandescent filament — Tungsten, 3,422 °C"*).

### 3. NASA JPL — *Eyes on the Solar System*
- **Link:** [eyes.nasa.gov/apps/solar-system/](https://eyes.nasa.gov/apps/solar-system/) (overview: [science.nasa.gov/eyes/](https://science.nasa.gov/eyes/))
- **First 5 seconds:** Drops you directly into a live, real-time 3D solar system with spacecraft moving on real JPL trajectories; controls stay pinned softly to the edges (global search top-left, time scrubber bottom, subtle layer toggles) so the 3D canvas owns ~90% of the viewport ([science.nasa.gov/eyes/](https://science.nasa.gov/eyes/)).
- **Making complex things intelligible:** Uses real NAIF mission telemetry but exposes it through intuitive actions: click any body to lock on, drag the timeline to scrub decades, and switch lighting modes (*Natural / Flood*) so shadowed details stay inspectable ([eyes.nasa.gov/apps/solar-system/](https://eyes.nasa.gov/apps/solar-system/)).
- **Progressive disclosure:** Opens with clean orbital trails and labels; detailed telemetry, mission stories, and layer toggles stay tucked away until you click a planet or spacecraft.
- **Motion:** Seamless cinematic camera flights bridge billions of kilometers—zooming from the entire solar system right onto a 3D spacecraft model without jarring screen cuts.
- **The 'wow' moment:** Clicking a tiny distant probe like *Voyager* or *Parker Solar Probe* and flying smoothly through space until you are riding alongside its 3D chassis in real time.
- **Concrete lesson for us:** **Let the 3D scene own 90% of the viewport and use continuous camera choreography to bridge scales**—flying seamlessly from the 118-element Table into a single Atom's orbital cloud or a Sample's crystal lattice, with a persistent search bar and unobtrusive bottom scrubber.

### 4. Royal Society of Chemistry — *Interactive Periodic Table*
- **Link:** [periodic-table.rsc.org](https://periodic-table.rsc.org/)
- **First 5 seconds:** A clean, scannable periodic table with immediate visual-mode tabs (*Visual Elements*, *Temperature*, *Trends*, *History*, *Alchemy*, *Supply Risk*) inviting curiosity-led exploration rather than dry reference lookup ([periodic-table.rsc.org](https://periodic-table.rsc.org/)).
- **Making complex things intelligible:** Leads every element page with plain-language *Uses and Properties* and human *History* before deep atomic data, plus short *Chemistry in its Element* podcasts and University of Nottingham videos ([periodic-table.rsc.org](https://periodic-table.rsc.org/)).
- **Progressive disclosure:** Top-level tiles stay crisp; hovering previews key metrics, and clicking opens tabbed story layers (*Overview → Uses → History → Atomic data → Supply risk*).
- **Motion:** Dragging the Temperature slider turns the entire periodic table into a live phase map—watching metals melt into liquid and vaporize into gas across the whole grid at once ([periodic-table.rsc.org](https://periodic-table.rsc.org/)).
- **The 'wow' moment:** Switching to *Supply Risk* and discovering that critical elements inside your smartphone (like indium and rare earths) face real-world scarcity—instantly turning chemistry into economics and geopolitics.
- **Concrete lesson for us:** **Add "story lenses" to the Table view**—such as *Cosmic Origin*, *In Your Body*, *In Your Phone*, and *Temperature Phase Map*—so a non-chemist immediately sees *why* the table connects to their own life.

---

## 3. Stories, Hooks, and "Why Should I Care?"

Curious non-experts don't wake up wanting to compare first ionization energies in eV—they want to understand the world they touch. Organizing stories directly into our Table lenses, element cards, and layer headers answers *"why should I care?"* before showing a single formula.

### A. Story Lenses for the Whole Table
- **Where your atoms were forged (Cosmic Origins):** Astronomer Jennifer Johnson's nucleosynthesis mapping (featured by NASA APOD) shows that almost all hydrogen and helium came from the **Big Bang**; carbon and nitrogen in your body were exhaled by **dying low-mass stars**; oxygen, magnesium, and iron were scattered by **exploding massive stars (supernovae)**; and heavy precious metals like gold, platinum, and uranium were forged mainly in cataclysmic **neutron star mergers** ([science.nasa.gov/image-article/apod-2023-january-8-where-your-elements-came-from/](https://science.nasa.gov/image-article/apod-2023-january-8-where-your-elements-came-from/)).
- **What's inside your body:** Roughly **99% of human body mass** comes from just six elements—oxygen (~65%), carbon (~18.5%), hydrogen (~9.5%), nitrogen (~3.2%), calcium (~1.5%), and phosphorus (~1.0%)—with ~96% from the first four alone ([en.wikipedia.org/wiki/Composition_of_the_human_body](https://en.wikipedia.org/wiki/Composition_of_the_human_body)).
- **What's inside your smartphone:** A modern smartphone packs **30+ to ~70 different elements** into your palm: **indium** (as indium tin oxide) forms the transparent conductive touchscreen; **tantalum** stores charge in tiny capacitors; and **rare-earth elements** (neodymium, terbium, dysprosium, europium) power the speaker magnets, vibration motor, and screen colours ([compoundchem.com/2014/02/19/the-chemical-elements-of-a-smartphone/](https://www.compoundchem.com/2014/02/19/the-chemical-elements-of-a-smartphone/), [usgs.gov/publications/rare-earth-elements-critical-resources-high-technology](https://www.usgs.gov/publications/rare-earth-elements-critical-resources-high-technology)).

### B. Human Stories: Names, Places, and Discovery Dramas
- **One Swedish village, four elements:** A feldspar quarry in **Ytterby, Sweden**, yielded unusual heavy rocks from which chemists isolated and named **four** elements after the village itself—**yttrium (Y), terbium (Tb), erbium (Er), and ytterbium (Yb)**—plus minerals linked to gadolinium, holmium, thulium, scandium, and tantalum ([en.wikipedia.org/wiki/Ytterby](https://en.wikipedia.org/wiki/Ytterby)).
- **Marie Curie's shed & homeland:** Working in a drafty Paris shed processing tons of pitchblende ore, Marie and Pierre Curie isolated **polonium** (named after Marie's homeland, Poland) and **radium** (1898), making Marie Curie the only person to win Nobel Prizes in two different sciences—Physics (1903) and Chemistry (1911) ([nobelprize.org/prizes/chemistry/1911/marie-curie/facts/](https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/facts/), [nobelprize.org/prizes/physics/1903/marie-curie/biographical/](https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/)).
- **Named for a living scientist:** Element 118, **oganesson (Og)**—officially approved by IUPAC in November 2016—honors nuclear physicist Yuri Oganessian, currently the only living person with an element on the periodic table ([iupac.org/iupac-announces-the-names-of-the-elements-113-115-117-and-118/](https://iupac.org/iupac-announces-the-names-of-the-elements-113-115-117-and-118/), [periodic-table.rsc.org/element/118/oganesson](https://periodic-table.rsc.org/element/118/oganesson)).
- **The glowing urine alchemist (1669):** Searching for the philosopher's stone to turn base metal into gold, German alchemist Hennig Brand boiled down buckets of fermented human urine and accidentally isolated waxy, glow-in-the-dark **phosphorus** ("light-bearer")—the first element with a recorded discoverer ([periodic-table.rsc.org/element/15/phosphorus](https://periodic-table.rsc.org/element/15/phosphorus)).
- **Found in the Sun before Earth (1868):** During a total solar eclipse in India, Pierre Janssen (and independently Norman Lockyer) spotted an unknown bright yellow line in sunlight and named the element **helium** after *Helios*, 27 years before it was isolated on Earth ([periodic-table.rsc.org/element/2/helium](https://periodic-table.rsc.org/element/2/helium)).
- **The prediction that proved the table (1875):** Dmitri Mendeleev left a blank space beneath aluminium ("eka-aluminium") and forecast its properties; when **gallium** was discovered—a silvery metal that literally melts in your hand at 29.76 °C—it matched his predictions and proved the periodic table was a law of nature, not just a catalog ([periodic-table.rsc.org/element/31/gallium](https://periodic-table.rsc.org/element/31/gallium)).

### C. Everyday Phenomena Explained by Trends
- **Why sodium explodes in water:** High-speed cameras and simulations revealed in 2015 that it isn't just burning hydrogen—water strips sodium's lone outer electron so fast that positively charged sodium ions violently repel and blast liquid metal spikes outward in a **Coulomb explosion** ([nature.com/articles/nchem.2161](https://www.nature.com/articles/nchem.2161)).
- **Why gold doesn't rust (and looks yellow):** Special relativity. Gold's 79 protons whip inner electrons near light speed, contracting its outer `6s` orbital so tightly that oxygen cannot steal it—and shrinking the `5d`–`6s` energy gap so gold absorbs blue light and reflects warm yellow instead of silvery white ([en.wikipedia.org/wiki/Relativistic_quantum_chemistry](https://en.wikipedia.org/wiki/Relativistic_quantum_chemistry), [periodic-table.rsc.org/element/79/gold](https://periodic-table.rsc.org/element/79/gold)).
- **Why mercury is liquid at room temperature (−38.8 °C):** Next door to gold (Z = 80), relativistic contraction locks mercury's full `6s²` pair so tightly that atoms barely bond to neighbors; simulations show turning off relativity raises mercury's melting point by over 100 °C ([chemistryworld.com/news/relativity-behind-mercurys-liquidity/6297.article](https://www.chemistryworld.com/news/relativity-behind-mercurys-liquidity/6297.article), [periodic-table.rsc.org/element/80/mercury](https://periodic-table.rsc.org/element/80/mercury)).
- **Why helium balloons rise:** Helium's ultra-low gas density (~0.1785 g/L at STP vs. ~1.29 g/L for air) means displaced heavier air pushes the balloon upward via buoyancy ([periodic-table.rsc.org/element/2/helium](https://periodic-table.rsc.org/element/2/helium), [pubchem.ncbi.nlm.nih.gov/periodic-table/](https://pubchem.ncbi.nlm.nih.gov/periodic-table/)).
- **Why tungsten is in light bulbs:** Tungsten has the highest melting point of any pure metal (~3,414–3,422 °C across reference tables), letting filaments glow white-hot (~2,500 °C) without melting ([periodic-table.rsc.org/element/74/tungsten](https://periodic-table.rsc.org/element/74/tungsten)).
- **Why fireworks & neon signs glow in specific colours:** Heat or electricity kicks electrons to higher energy rungs; as they drop back, each element emits a unique wavelength fingerprint—strontium = red, barium = green, copper = blue, sodium = yellow, and pure neon gas = orange-red ([compoundchem.com/2013/12/30/the-chemistry-of-fireworks/](https://www.compoundchem.com/2013/12/30/the-chemistry-of-fireworks/), [nist.gov/pml/atomic-spectra-database](https://www.nist.gov/pml/atomic-spectra-database), [periodic-table.rsc.org/element/10/neon](https://periodic-table.rsc.org/element/10/neon)).

### D. Plain-Language "Why It Matters" Hooks for Every Technical Layer

| Technical Layer | Plain-Language Label | One-Line "Why It Matters" Hook | Source |
| :--- | :--- | :--- | :--- |
| **Orbitals / electron shells** | *Electron Clouds* | The 3D shape of an atom's outer cloud dictates how it snaps together with other atoms—and why every element glows its own signature colour. | [en.wikipedia.org/wiki/Atomic_orbital](https://en.wikipedia.org/wiki/Atomic_orbital), [nist.gov/pml/atomic-spectra-database](https://www.nist.gov/pml/atomic-spectra-database) |
| **Crystal lattices** | *Atomic Pattern* | Exact same carbon atoms, two different 3D stacking patterns: one becomes soft pencil graphite, the other becomes diamond, nature's hardest mineral. | [en.wikipedia.org/wiki/Allotropes_of_carbon](https://en.wikipedia.org/wiki/Allotropes_of_carbon), [periodic-table.rsc.org/element/6/carbon](https://periodic-table.rsc.org/element/6/carbon) |
| **Melting / boiling point** | *Heat Resistance* | Tells you what survives a white-hot light bulb filament (tungsten, ~3,414 °C), melts in your palm (gallium, 29.8 °C), or stays liquid at room temperature (mercury, −38.8 °C). | [periodic-table.rsc.org/element/74/tungsten](https://periodic-table.rsc.org/element/74/tungsten), [periodic-table.rsc.org/element/31/gallium](https://periodic-table.rsc.org/element/31/gallium) |
| **Density** | *Heft* | Explains why helium balloons float to the ceiling while a shoebox-sized bar of gold weighs as much as a small adult. | [periodic-table.rsc.org/element/2/helium](https://periodic-table.rsc.org/element/2/helium), [periodic-table.rsc.org/element/79/gold](https://periodic-table.rsc.org/element/79/gold) |
| **Atomic size (radius)** | *Atom Size* | Smaller atoms slip easily into tight spaces—one reason tiny, lightweight lithium ions power modern rechargeable batteries. | [nobelprize.org/prizes/chemistry/2019/press-release/](https://www.nobelprize.org/prizes/chemistry/2019/press-release/) |
| **Ionization energy** | *Grip on Electrons* | Measures how tightly an atom guards its outer electron—weak grip makes sodium explode in water; iron grip makes noble gases refuse to react. | [en.wikipedia.org/wiki/Ionization_energy](https://en.wikipedia.org/wiki/Ionization_energy), [nature.com/articles/nchem.2161](https://www.nature.com/articles/nchem.2161) |
| **Electronegativity** | *Electron Pull* | Shows how greedily an atom hogs shared electrons—oxygen's pull makes water dissolve salt and sustain life; fluorine's extreme pull makes Teflon non-stick. | [en.wikipedia.org/wiki/Electronegativity](https://en.wikipedia.org/wiki/Electronegativity), [periodic-table.rsc.org/element/9/fluorine](https://periodic-table.rsc.org/element/9/fluorine) |
| **Trends charts** | *Patterns Across the Table* | Turns 118 separate facts into one visual wave—so you can *see* why metals sit on the left, explosive gases on the right, and why Mendeleev could predict missing elements. | [en.wikipedia.org/wiki/Periodic_trends](https://en.wikipedia.org/wiki/Periodic_trends), [periodic-table.rsc.org/element/31/gallium](https://periodic-table.rsc.org/element/31/gallium) |
| **Comparing two elements** | *Side-by-Side* | Puts two neighbors next to each other at one scale—revealing how adding a single proton turns solid yellow gold (79) into liquid silver mercury (80). | [chemistryworld.com/news/relativity-behind-mercurys-liquidity/6297.article](https://www.chemistryworld.com/news/relativity-behind-mercurys-liquidity/6297.article), [periodic-table.rsc.org/element/80/mercury](https://periodic-table.rsc.org/element/80/mercury) |

---

## 4. Ranked Recommendations: 9 Design Moves to Beat Ryan on Feel

Ranked from highest leverage on first-5-second impression and everyday intelligibility down to deeper craft:

1. **Choose a fresh, luminous studio aesthetic—not a murky dark bloom clone.**
   Replace harsh dark-mode neon/bloom with a crisp, warm museum-pedestal or bright architectural-gallery palette (inspired by Ciechanowski's effortless clarity and Apple HIG depth): soft directional key light, subtle contact shadows, matte ceramic/brushed-metal procedural materials, and high-contrast typography. It looks unmistakably higher-craft, stays legible on phones in daylight, and runs at a locked 60 fps without heavy post-processing.

2. **Make the first 5 seconds effortless and story-led (90% canvas, one clear invitation).**
   Open directly onto a calm, gently breathing 3D periodic table with only a lightweight search/lens pill at top and one quiet interactive prompt (*"Click any element to dive inside — or pick a story"*). Hide Trends, Compare, Helix layout, and raw 25-field data sheets behind progressive disclosure until invited—never greet a non-chemist with a dashboard of jargon controls.

3. **Lead with "Story Lenses" before numerical height modes.**
   Offer one-tap curated lenses right beside the height selector: **Made in Stars**, **In Your Body**, **In Your Phone**, and **Heat It Up** (live temperature phase map across all 118 elements, inspired by RSC). Watching 70% of the table light up for your smartphone—or watching gold and uranium pulse as *Neutron Star Mergers*—creates an instant emotional hook that pure height bars cannot match.

4. **Translate every technical label into plain English—with the real term one tap away.**
   Use human labels on every top-level control (*Atom Size*, *Grip on Electrons*, *Electron Pull*, *Heat Resistance*, *Heft*) paired with a single-line "why it matters" banner whenever a mode is active (e.g., *"Electron Pull: how greedily an atom hogs electrons — Fluorine wins, making Teflon non-stick"*). Clicking `"More"` or toggling *Scientist Mode* reveals IUPAC/NIST terminology (`IE₁`, Pauling χ, $\psi_{3d_{z^2}}$) and exact source citations—delighting both economists and chemistry teachers without alienating either.

5. **Design one unforgettable "Scale-Dive" Wow Moment (Table → Crystal → Atom).**
   Borrow NASA Eyes' continuous camera choreography: clicking an element lifts its column softly, then glides the camera smoothly *into* the material—first revealing its true vibrating crystal lattice (e.g., diamond's tetrahedral network vs. graphite's sliding sheets, or iron flipping BCC → FCC as you drag heat up), and with one more tap diving smoothly into the real phase-coloured quantum orbital cloud and visible emission glow.

6. **Attach human-scale landmarks directly to sliders and Trend charts.**
   Take Neal.fun's lesson directly into our Temperature scrubber and Trends view. Don't just show `302.9 K` or `3,695 K`—pin tiny clickable story flags along the track (*Liquid Nitrogen −196 °C*, *Melts in Your Hand 30 °C*, *Iron Forging 912 °C*, *Light Bulb Filament 3,414 °C*). In Trends, pin 3 clickable anomaly callouts per curve (*"Why is Mercury a dip?"*, *"Why does Gold jump?"*) so the chart reads like a detective story instead of a homework plot.

7. **Turn "Compare" into curated 1-click "Mind-Blowing Pairs."**
   An empty two-element picker feels like a utility form. Pre-seed 5 irresistible one-click comparisons—**Gold (79) vs. Mercury (80)** (*+1 proton, solid → liquid*), **Diamond vs. Graphite** (*same atom, opposite hardness*), **Helium (2) vs. Osmium (76)** (*lightest lift vs. densest metal*), **Sodium (11) vs. Chlorine (17)** (*explosive metal + toxic gas = table salt*), **Hydrogen (1) vs. Oganesson (118)**—with plain-language takeaway sentences right above the true-scale 3D split view.

8. **Make every tap snappy, forgiving, and effortless on both desktop and phone.**
   Fix Ryan's biggest usability weakness: give every 3D column generous hit targets (≥44 px equivalent), crisp screen-space hover labels (≥14 px, zero overlap), instant <100 ms hover lift + subtle audio/visual feedback, an always-visible `Reset / Back to Table` breadcrumb, and an auto-scaled 60 fps quality tier so a mid-range phone feels just as silky as a desktop GPU.

9. **Reinvent the Quiz as "Playful Micro-Mysteries" (Nicky Case / Socratic feel).**
   Rather than labeling it *Quiz* (which sounds like a school test), frame it as **Challenges / Mysteries** (*"Find the metal that melts in your hand"*, *"Heat iron until its crystal snaps into a new shape"*). Answers happen by interacting directly with the 3D scene—clicking columns, dragging temperature, toggling orbitals—while the camera glides gently to the visual evidence on a miss.
