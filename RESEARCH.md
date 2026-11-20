# RESEARCH — what we know about the original

Sources
- X post: https://x.com/RyanSael/status/2114706108317372821 (≈1.5k likes, 1.2k bookmarks, ≈90k views as of 20 Nov 2026)
- Live site: https://sael.net/periodic-table
- Our notes: ref/VIDEO_NOTES.md; screenshots ref/sael-atom-view.webp, ref/sael-sample-view.png

Known (observed by us on 20 Nov 2026)
- Views: Table (3D columns, height = ionisation / size / pull / melting / density), Atom, Sample (temperature slider solid→liquid→gas), Demo (scripted scenes).
- Atom view hints at orbital shapes with point clouds, stat boxes, visible spectrum strip, scale bar.
- Photoreal dusk showroom, heavy bloom, language dropdown, help, share, view counter.
- Weak points: very heavy (slow frames, hard to click, bad on low-end/mobile); legend lacks reactive nonmetals; sample sim is a generic cubic grid; no search/filters/trends/compare/alt layouts/quiz; thin data (unconfirmed).

To verify later with Gemini (NOT yet verified)
- Whether the original really lacks search/filters/quiz on all views and mobile.
- Which data sets Ryan Sael used and their licences.
- Candidate real data sources for our build: PubChem periodic table data, NIST Atomic Spectra Database (emission lines), CRC Handbook / WebElements-style values, crystal structure per element (e.g. Wikipedia/CRC tables).
- Licences/attribution for each source.

## Gemini fact-check 2026-11-20
Full report: `FACTCHECK.md` (Gemini 4 Neon, High, via agy plan mode). 47 claims checked: 26 correct, 18 wrong, 3 unverifiable. Corrections (Gemini's sources; spot-verify before relying):
- **NIST ASD coverage** is not Z=1–118: neutral ground states/IEs only Z=1–108; no 380–750 nm neutral lines for At (85) and Fm–Og (100–118). https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html
- **NIST ASD (SRD 78) and CODATA (SRD 121) are copyrighted** (15 U.S.C. § 290e), not free to embed; get permission (data@nist.gov) or use only bare facts with citation. https://www.nist.gov/srd/public-law · https://www.nist.gov/copyrights-disclaimers
- **IAEA LiveChart** has non-open Terms of Use; NUBASE2020 paper is CC BY 3.0. https://doi.org/10.1088/1674-1137/abddae
- **CIE 1931 CMF csv is CC BY-SA 4.0** (ShareAlike if embedded): use an analytic fit or release the table under CC BY-SA. https://creativecommons.org/licenses/by-sa/4.0/legalcode.en
- **Wikipedia infoboxes CC BY-SA 4.0:** keep numeric facts only, no copied prose/comment strings. CRC Handbook is proprietary; WebElements all rights reserved (cross-check only). PubChem has third-party contributed content: https://www.ncbi.nlm.nih.gov/home/about/policies/
- **Z_eff coverage:** Clementi–Raimondi 1963 covers Z=2–36 only (https://doi.org/10.1063/1.1733573); Z=37–86 is Clementi–Raimondi–Reinhardt 1967 (https://doi.org/10.1063/1.1712084); Z=87–118 needs Slater's rules. Cordero 2008 covers Z=1–96 (https://doi.org/10.1039/b801115j); Alvarez 2013 covers Z=1–98 (https://doi.org/10.1039/c3dt50599e).
- **Vietnamese names:** build-data.mjs puts `natri` first, which contradicts SPEC §3 (`sodium · natri`); Circular 32/2018/TT-BGDĐT keeps 13 familiar VN names. https://daidoanket.vn/doi-cach-doc-ten-cac-nguyen-to-hoa-hoc-hoc-sinh-boi-roi-giao-vien-ban-khoan-10233769.html (moony still to confirm).
- **Group 3 = Sc, Y, Lu, Lr** is an IUPAC 2021 provisional recommendation, not the official chart (which shows 57–71/89–103). https://iupac.org/what-we-do/periodic-table-of-elements/
- **PubChem raw data errors** (confirmed in our periodictable.json): Li weight 7.0 (CIAAW interval 6.938–6.997), Br 79.90 (interval 79.901–79.907), Fe 55.84 (55.845), Ru 101.1, Sm 150.4; Lr config `[Rn]7s2 5f14 6d1` vs NIST `[Rn]5f14 7s2 7p1`; Og "Expected to be a Gas" (relativistic calcs: solid, mp ~325 K); He mp 0.95 K is at ~25 bar; C and As sublime at 1 atm; Ga bp 2477 K → 2676 K https://doi.org/10.1021/je1011086; Ba bp 2170 → 2118 K; Ra bp 1413 → 2010 K; Bk mp 1323 → 1259 K; YearDiscovered wrong for Al, Ca, F, Si, Ru. Sources: https://www.ciaaw.org/atomic-weights.htm · https://en.wikipedia.org/wiki/Radium · https://en.wikipedia.org/wiki/Berkelium
- **Density/EN disagreements:** Cs 1.93 → 1.886 (Arblaster) / 1.873 g/cm³ (CRC); mendeleev EN for Tc/U/Np (2.1/1.7/1.3) are older than PubChem (1.9/1.38/1.36); mendeleev `C` pairs lattice DIA with graphite density; mendeleev lattice codes are lossy (HEX/ORC) and scalar `a` only. https://en.wikipedia.org/wiki/Periodic_table_(crystal_structure)
- **COD CIF picks:** `1527120` is α-U at 43 K (use `9008584`); `7222459` is nanocrystalline α-Sn from a battery electrode (use `9008568`); `9008562` α-Ga is non-standard setting (prefer `9008085`, Cmce); α-Fe CIF `9006587` a=2.8654 Å vs 2.8665. https://www.crystallography.net/cod/9008584.html · https://www.crystallography.net/cod/9008568.html
- **Crystal table:** Ra is `cI2` (BCC, Im-3m), Wikipedia infobox `cF4` is a typo; Db should be `predicted` not `nodata`; Cm/Bk/Cf/Es lack lattice constants (80 built vs 84 claimed); Ce room-temperature default phase (γ-Ce fcc vs β-Ce dhcp) needs a choice.
- **Physics:** nuclear `r0 = 1.2 fm` is a uniform-sphere radius but IAEA gives rms charge radius (use ~0.94 fm for rms, or convert with √(5/3)); gas speed √(3RT/M) must use molecular mass for H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂.
- **Unverifiable:** X post metrics (needs login); original-site feature claims (not independently inspected; the site's header carries an all-rights-reserved/automated-reader notice, so clean-room design only).
- Confirmed correct (not exhaustive): CIAAW abridged/full table structure; mendeleev v1.3.0 MIT licence and citation keys; COD CC0; golden values (Ga mp 29.76 °C, Na D 588.995/589.592 nm air, H IE 13.598 eV, Cr [Ar]3d⁵4s¹, α-Fe 286.65 pm); Fe α→γ 912 °C, γ→δ 1394 °C. Full tables of all-118 crystal structures and phase transitions are in `FACTCHECK.md` §3.1–3.4.
