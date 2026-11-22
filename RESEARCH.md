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

## Answers
Answers to QUESTIONS.md, 2026-11-20. "FACTCHECK" = the earlier Gemini 4 Neon pass (`FACTCHECK.md`). "Batch 2" = a second Gemini 4 Neon (High) run on 2026-11-20 evening (agy plan mode, read-only). Raw batch-2 output: `/workspace/fc-tmp/agy-out2.txt` (outside the repo). Items marked **(spot-checked)** were re-opened by us.

### Q1 — δ-Fe lattice
Already resolved in QUESTIONS.md: COD 9013487, a = 2.928 Å at 1705 K (Basinski, Hume-Rothery & Sutton 1955). **(spot-checked)** COD CIF 9013487 shows a = 2.928, Fe, 1955. https://www.crystallography.net/cod/9013487.html

### Q2 — Cerium at 20 °C, 1 atm
- **Answer:** β-Ce (dhcp) is the equilibrium phase at 20 °C (β↔γ equilibrium ≈ 75 °C), but γ-Ce (fcc) is the phase normally observed in room-temperature samples (γ→β on cooling only starts below ≈ −15 °C; γ→α below ≈ −160 °C; large hysteresis). **Recommendation: default to γ-Ce (fcc), toggle to β-Ce (dhcp)** with the note "β is the true ground state; γ is what you usually hold". 
- **Values at 20 °C:** γ-Ce fcc `cF4` Fm-3m a = 516.12 pm (COD 9010987; **spot-checked**: CIF has a = 5.1612 Å, Ce, Spedding et al. 1956). β-Ce dhcp `hP4` P6₃/mmc a = 368.11, c = 1185.7 pm (Arblaster 2018 via Wikipedia infobox). Do **not** use COD 9008491 (obsolete 2-atom hcp Ce).
- **Caveat:** exact reverse (heating) onset temperatures were not found in open text.
- **Sources:** https://www.crystallography.net/cod/9010987.html · https://en.wikipedia.org/wiki/Cerium · https://en.wikipedia.org/wiki/Template:Infobox_cerium · Koskimaki, Gschneidner & Panousis 1974, https://doi.org/10.1016/0022-0248(74)90098-0 · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9568586/ (also FACTCHECK Ce row)

### Q3 — Lindemann ratio
- **Answer: use δ_L = 0.10 as a "model parameter"**, defined as 3D rms thermal displacement ÷ nearest-neighbour distance at the melting point. Per-structure literature means (ξ = rms displacement ÷ r₀, quoted in de With 2023 §5.1): fcc 0.11 (Gilvarry 1956) / 0.096 (Cho 1982); bcc 0.13 / 0.121; hcp 0.09 / 0.069. Lattice-dynamics values by Shapiro 1970 are lower: fcc (Al, Cu, Ag, Au) 0.071, bcc alkali 0.113. 
- **Not verified:** a primary value for diamond-cubic Si (none found, Group 14 excluded from Vopson et al. 2020); individual Fe/Pb numbers. Literature values differ by √3 (1D vs 3D rms) or ≈2 (d_nn vs r₀), so document the definition in the UI. Lindemann 1910 assumed atoms touching (maximum displacement); Gilvarry 1956 reformulated it as an rms criterion.
- **Replaces** the BIPM thermometry link FACTCHECK #22 cited, which is not a source for the Lindemann criterion.
- **Sources:** de With, Chem. Rev. 123, 13713 (2023), open access: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10722469/ **(spot-checked:** the quoted "ξ_FCC ≅ 0.11, ξ_BCC ≅ 0.13 …" sentence is in the text) · Gilvarry, Phys. Rev. 102, 308 (1956), https://doi.org/10.1103/PhysRev.102.308 (**spot-checked** via Crossref: "The Lindemann and Grüneisen Laws") · Shapiro, Phys. Rev. B 1, 3982 (1970), https://doi.org/10.1103/PhysRevB.1.3982 · Cho, J. Phys. F 12, 1069 (1982), https://doi.org/10.1088/0305-4608/12/6/008 · Vopson et al. 2020, https://arxiv.org/abs/2005.12912

### Q4 — Nuclear radius r0
- **Answer:** the placeholder 1.2 fm is the equivalent uniform-sphere radius, but IAEA LiveChart gives the rms charge radius. For the rms fallback use **R_rms ≈ 0.94·A^(1/3) fm** (= √(3/5)·1.2). Or convert IAEA values with R_equiv = √(5/3)·R_rms everywhere. Keep the "estimate" flag.
- **Source:** FACTCHECK claim #21 and data-issue #2 (Gemini derivation; the relation R_rms² = (3/5)R_equiv² is standard). IAEA LiveChart: https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html

### Q5 — Cm, Bk, Cf, Es lattices
- Cm α-Cm dhcp `hP4` P6₃/mmc: **a = 349.6, c = 1133.1 pm** (Cunningham & Wallmann 1964). https://www.webelements.com/curium/crystal_structure.html
- Bk α-Bk dhcp: **a = 341.6, c = 1106.9 pm** (Peterson et al. 1971). https://www.webelements.com/berkelium/crystal_structure.html · https://en.wikipedia.org/wiki/Berkelium
- Cf α-Cf dhcp: **a = 338.0–338.4, c = 1102.5–1104.0 pm** (Radchenko 1986). WebElements prints "3.3800 pm", a unit typo (it is Å). https://www.webelements.com/californium/crystal_structure.html
- Es fcc `cF4` Fm-3m: **a = 575 pm** (Haire & Baybarz 1979; rapidly self-damages). https://en.wikipedia.org/wiki/Einsteinium
- WebElements is all-rights-reserved: use as a cross-check and cite the primary papers, never copy its text. (Source: FACTCHECK §3.1 rows 96–99.)

### Q6 — Radium structure
- **Answer: body-centred cubic, `cI2`, Im-3m (#229), a = 514.8 pm** (Weigel & Trinkl 1968 / Arblaster 2018). The infobox's `cF4` is a typo. Override it.
- **Sources:** https://www.webelements.com/radium/crystal_structure.html · https://en.wikipedia.org/wiki/Radium (FACTCHECK data-issue #3)

### Q7 — Primary source for the 13 Vietnamese element names
- **Answer:** the 13-element rule is confirmed in two independent authoritative interviews. The official MOET programme PDF itself could **not** be read (embedded flipbook; thuvienphapluat.vn Cloudflare-gated), so the exact page number is **unverified**.
- **Rule:** "Tên 13 nguyên tố đã quen dùng trong tiếng Việt tiếp tục được sử dụng nhưng có kèm chú thích tiếng Anh, gồm: Vàng, Bạc, Đồng, Chì, Sắt, Nhôm, Kẽm, Lưu huỳnh, Thiếc, Nitơ, Natri, Kali và Thuỷ ngân. Hợp chất của các nguyên tố này cũng được gọi tên theo khuyến nghị của IUPAC." — GS.TS Đặng Thị Oanh, chair of the 2018 chemistry curriculum subcommittee (Báo Đại Đoàn Kết). **(spot-checked:** this text is on the page.)
- **Scope:** per PGS.TS Cao Cự Giác (editor-in-chief, Chân trời sáng tạo chemistry textbooks): Vietnamese names are kept "ở dạng đơn chất" (as the free element) with the English term in brackets; compounds use IUPAC names (Fe₂(SO₄)₃ – iron(III) sulfate). **(spot-checked:** the "vẫn sử dụng tên tiếng Việt cho 13 nguyên tố … ở dạng đơn chất …" sentence is on the cm.pek.edu.vn page.) Standards cited there: TCVN 5529:2010, TCVN 5530:2010.
- **Programme document:** Chương trình giáo dục phổ thông môn Hóa học, issued with Thông tư 32/2018/TT-BGDĐT (26 Dec 2018); Gemini says the rule sits in Mục VIII (secondary reports; not confirmed).
- **Sources:** https://daidoanket.vn/doi-cach-doc-ten-cac-nguyen-to-hoa-hoc-hoc-sinh-boi-roi-giao-vien-ban-khoan-10233769.html · https://cm.pek.edu.vn/fr/news/dien-dan-giao-duc/vi-sao-chuong-trinh-gdpt-2018-dung-ten-goi-nguyen-to-hoa-hoc-bang-tieng-anh-811.html · programme PDF host (per Gemini, not opened by us): https://thcslamsonq6.hcm.edu.vn/hoat-dong-chuyen-mon/chuong-trinh-giao-duc-pho-thong-mon-hoa-hoc-ban-hanh-kem-theo-thong-tu-so-32201/ctmb/30978/387346
- **Implication for build:** keep moony's check; the "sodium · natri" display order (SPEC §3) is fine for the 13 as "Vietnamese name with English annotation", but the compounds rule means compound names should not be Vietnamese.

### Q8 — Solid–solid transitions at 1 atm and high-T structures
All Ti→Pu rows below come from batch 2 (COD/NIST WebBook/Wikipedia/Crossref); transition temperatures for Pu and Co are as in FACTCHECK §3.2. **(spot-checked:** COD 9008554 Ti a = 3.3065 Å, COD 1522789 Hf a = 3.61 Å, both elemental CIFs from 1963.)

| Element | Transition (T) | High-T phase | High-T lattice (pm), T | COD / source |
|---|---|---|---|---|
| Ti | α hcp → β bcc, 882 °C (1155 K) | bcc `cI2` Im-3m | a = 330.65 @ 1173 K | COD 9008554 |
| Zr | α hcp → β bcc, 863 °C (1136 K) | bcc | a = 362 @ 1123 K | COD 9008559 |
| Hf | α hcp → β bcc, ~1742–1760 °C (~2015–2033 K) | bcc | a = 361 (T not recorded) | COD 1522789. Wikipedia prose 2388 K is a DFT value; do not use |
| Co | hcp → fcc, ≈ 422 °C equilibrium (695 K); ≈ 450 °C observed on heating (723 K), strong hysteresis | fcc `cF4` Fm-3m | a = 356.88 @ 793 K; 362.14 @ 1671 K | COD 9012926, 9012948 |
| Sc | hcp → bcc (not sourced; ~1337 °C was only a hint in our prompt) | bcc | not verified | no COD entry for β-Sc. Keep out of v1 or flag "unverified" |
| Y | hcp → bcc (not sourced; ~1478 °C hint only) | bcc | not verified | no COD entry for β-Y |
| La | α dhcp → β fcc, ≈ 310 °C (583 K); β → γ bcc ≈ 865 °C (1138 K) (CRC via Wikipedia) | fcc; bcc | β: a ≈ 529–530 pm; γ not verified | COD 1523533 (β-La, a 529.1), 4031654, 9008472 |
| Ca | α fcc → β bcc, 443 °C (716 K) | bcc | a = 448 @ 740 K; 448.8 @ 888 K | COD 9011034, 9012732. Ignore legacy hcp COD 9008489/9012730 |
| Sr | α fcc → β bcc, **547 °C (820 K)**. The 215 °C "hcp" phase is a hydrogen-impurity artefact (Peterson & Colburn 1966; NIST-JANAF models only α, β) | bcc | a = 484 @ 873 K; 487 @ 901 K | COD 9012760, 9008551, 9012727. Ignore H-stabilised hcp COD 9008515/9012728 |
| Th | α fcc → β bcc, 1360 °C (1633 K) | bcc | a = 411 @ 1723 K | COD 9008553 |
| U | α `oS4` Cmcm → β `tP30`, 668 °C (941 K); β → γ bcc, 775–776 °C (1048–1049 K) | β: tetragonal P4₂/mnm (#136, Lawson et al. 1988); γ: bcc | β: a = b = 1075.9, c = 565.6 (COD 2106190, old setting P4₂nm; Wikipedia swaps a and c); γ: a = 354.2 (COD 1539778) | COD 2106190, 1539778, 9008556 |
| Np | α `oP8` → β `tP4` P4₂12, 280 °C (553 K); β → γ bcc, 576–577 °C (849–850 K) | β: a = 489.7, c = 338.8 @ 586 K; γ: a = 352 @ 873 K | COD 9008586, 9008547 |
| Pu | α `mP16` → β `mS34` 122 °C; → γ `oF8` 207 °C; → δ fcc 319 °C; → δ′ bct 452 °C; → ε bcc 480 °C (Gemini only confirmed the 310–452 °C δ range; the rest are FACTCHECK §3.2) | β: a = 1183, b = 1044.9, c = 922.7, β = 138.65° (COD 2311043); γ: a = 315.87, b = 576.82, c = 1016.2 @ 508 K (COD 9008588); δ: a = 463.7 @ 593 K (COD 9008481); ε: a = 363.8 @ 773 K (COD 9008548) | δ′: no valid COD entry (COD 2310541 is mislabelled PuC₂) |

- **Suggested v1 scope:** show Ti, Zr, Hf, Co, Ca, Sr, Th, U, Np, Pu, La (β only) with COD-backed high-T constants. Sc, Y, γ-La and δ′-Pu stay "transition known, constants not in our sources".
- **Sources:** COD API https://www.crystallography.net/cod/result?formula=Ti&format=json (and the same for each element) · NIST WebBook phase data (Chase 1998, NIST-JANAF): https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440246&Mask=2 (Sr), …ID=C7440702 (Ca), …ID=C7440326 (Ti), …ID=C7440677 (Zr), …ID=C7440586 (Hf), …ID=C7440484 (Co), …ID=C7440611 (U) · Peterson & Colburn 1966 https://doi.org/10.1021/j100874a023 · Lawson et al. 1988 https://doi.org/10.1107/S0108768187009406 · Ross & Hume-Rothery 1963 https://doi.org/10.1016/0022-5088(63)90031-6 · Wikipedia element and allotrope pages (secondary).

### Q9 — Fr and At melting points
- **Answer: both are estimates.** Neither element has been made in bulk. Flag Fr mp (PubChem/Wikipedia 300 K), At mp (PubChem 575 K) and the Fm–Lr melting points as predicted/estimated (hatched). Fr structure is "extrapolated"/predicted bcc and At "predicted" fcc.
- **Sources:** FACTCHECK data-issue #4 and §3.3 (Gemini). https://en.wikipedia.org/wiki/Periodic_table_(crystal_structure) · https://pubchem.ncbi.nlm.nih.gov/periodic-table/

### Q10 — Conflicting bulk values
Policy recommended: use the best-supported value as primary (flag measured vs extrapolated); keep the other as "Other sources".
| Property | Primary to use | Alternative / note | Source |
|---|---|---|---|
| Ga boiling point | **2676 K** | PubChem 2477 K is an older value | Zhang, Evans & Yang, J. Chem. Eng. Data 56, 328 (2011), https://doi.org/10.1021/je1011086 |
| Cs density | **1.886 g/cm³** (X-ray, Arblaster 2018) | CRC 20 °C 1.873; PubChem 1.93 is too high | FACTCHECK #40 |
| Ba boiling point | **2118 K** (CRC/Wikipedia) | PubChem 2170 K | FACTCHECK #44 · https://en.wikipedia.org/wiki/Barium |
| Ra boiling point | **2010 K** | PubChem 1413 K is old | https://en.wikipedia.org/wiki/Radium |
| Bk melting point | **1259 K** | PubChem 1323 K | https://en.wikipedia.org/wiki/Berkelium |
| Bk density | **14.78 g/cm³** (β-Bk / α CRC/Wikipedia) | PubChem 14 | https://en.wikipedia.org/wiki/Berkelium |
| Am density | **13.69 g/cm³** (13.67 for ²⁴¹Am); X-ray density of dhcp α-Am (McWhan, Cunningham & Wallmann 1962, https://doi.org/10.1016/0022-1902(62)80246-2) | "12 g/cm³" (CRC/Wikipedia/LANL) comes from a 1951 microgram sample (Westrum & Eyring, https://doi.org/10.1021/ja01151a116): do not use | PubChem element 95: https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/element/95/JSON/ |
| Np boiling point | **4447 K (4174 °C), extrapolated** from vapour pressure (Ackermann & Rauh 1975 data span only ≈1618–2074 K, so uncertainty of several hundred K) | PubChem 4175 K (3902 °C, Jefferson Lab) is the same kind of extrapolation. Both are estimates: hatch the value | https://webbook.nist.gov/cgi/cbook.cgi?ID=C7439998&Mask=4 · https://doi.org/10.1016/0021-9614(75)90058-0 · https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/element/93/JSON/ |
| Am boiling point | **2284 K (2011 °C), extrapolated** (CRC / Lange's / PubChem) | 2880 K (2607 °C) traces to a 1955 effusion study (Carniglia & Cunningham, https://doi.org/10.1021/ja01611a028); LANL's own page gives both | https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/element/95/JSON/ · https://www.lanl.gov/science-engineering/periodic-table/element/americium |
- **Caveats:** the Np and Am boiling points are judgement calls between competing handbook extrapolations (Gemini could not read the paywalled actinide reviews: Konings & Beneš 2010, https://doi.org/10.1063/1.3474238; Lemire 2001; Silva 1995). For Np, Gemini's reason for preferring 4447 K is weak (4175 K and 4447 K are the same kind of number), so treat the choice as low confidence and keep both visible. Bk/Ba/Ra rows rest on Wikipedia/CRC (secondary).

### Q17 — The hand-written element lines (Gemini, 2026-11-22)

- **Method:** every one of the 37 lines in `data/curated/element-lines.json` was sent to Gemini with the plain-text lead section of its cited Wikipedia revision (data/raw/wikipedia/intros-1/2.json); prompts and replies: prompts/api-run/*q17-lines*.md (private).
- **Result:** 26 lines supported as written; 11 corrected (below). Each line now carries `check` and the supporting quote (`support`); a corrected line keeps its old wording in `was`.

| el | corrected line | why |
|---|---|---|
| O | About 21 % of the air, needed in every breath, and almost half of Earth’s crust. | Calling oxygen "the gas in every breath" is misleading because air is mostly nitrogen (~78 %) and only about 21 % oxygen, which is the part needed for respiration. |
| Al | Shines like silver, yet a block of it weighs about a third as much as a same-sized block of steel. | The source specifies "about one-third that of steel" rather than "only a third", and "the same block of steel" was clarified to "a same-sized block of steel". |
| Ca | Your bones need it; as calcium carbonate, it is found in limestone. | The source says calcium carbonate is "found in limestone", whereas "it is limestone" overstates the compound as identical to the rock. |
| Zn | Its main use is coating iron against corrosion (galvanising). | The lead calls plating zinc on iron "the major application", not "mostly", and does not mention steel. |
| Cs | Widely used in atomic clocks: since 1967, the second has been defined using caesium. | Calling caesium 'the atom of atomic clocks' overstates exclusivity, since the lead only says it is widely used in atomic clocks (other elements are also used). |
| Nd | Used in strong, small magnets for audio equipment, hard drives and electric vehicle motors. | The lead says 'audio equipment' and 'electric vehicle motors' rather than 'speakers' and 'electric-car motors', and the Vietnamese 'Thành phần chính' wrongly implies neodymium is the main ingredient of Nd–Fe–B magnets. |
| W | Highest melting point of any element at normal pressure (3,422 °C): used for glowing wires in light bulbs. | The lead qualifies tungsten's melting-point record as 'at standard pressure' (carbon melts higher under pressure) and describes incandescent light bulb filaments in the present tense rather than saying 'once'. |
| Pt | A rare, highly unreactive precious metal: a key part of catalytic converters. | The source lead states that platinum is a key component in catalytic converters without mentioning cars specifically, so 'car' is removed to match the lead. |
| Au | Bright yellow and almost untouched by corrosion: coins and jewellery throughout recorded history. | The English line is fully supported by the lead, but the Vietnamese draft broadened 'recorded history' to 'lịch sử loài người' ('human history'), which includes prehistory. |
| Hg | The only metal known to be liquid at standard temperature and pressure. | The lead specifies 'known to be liquid at standard temperature and pressure' rather than 'at room temperature', since warm room temperatures can melt caesium or gallium and copernicium's state is unconfirmed. |
| Pb | Soft and heavy: it was widely used in plumbing, paint and petrol, though it damages the nervous system. | The lead does not say those uses ended when lead's toxicity was widely recognised, and that chronology is wrong because wide recognition occurred in the late 19th century while leaded petrol was introduced decades later in the 1920s. |

### Finishing pass answers (Gemini, 2026-11-22; prompts and replies in prompts/api-run/, private)
- **Crystal pieces (sample view):** β-N₂ COD 9012476 (Schuch & Mills 1970, 46 K) and α-N₂ COD 9008571 (Wyckoff 1963, 4.2 K; Pa-3 preferred over P2₁3, Venables & English 1974); α–β at 35.62 K (Lipiński et al. 2007, https://doi.org/10.1007/s10765-007-0267-y). I₂ COD 4511285 (Bertolotti et al. 2014; Gemini reads 110 K in the paper, the CIF says 100(2) K: we print the CIF). Br₂ COD 9013119 and Cl₂ COD 9013123 (Powell, Heal & Torrie 1984). α-S COD 9011362 (Rettig & Trotter 1987, 298 K), shown up to 368.3 K (NIST-JANAF). α-Mn COD 9011108 (Oberteuffer & Ibers 1970), shown up to 980 K (NIST-JANAF; Desai 1987, https://doi.org/10.1063/1.555794). White P keeps one P₄ (room-temperature α-P is rotationally disordered). In β-N₂ the molecules tumble: the caption says so.
- **Krypton and xenon glow:** no source gives a measured chromaticity; the colours are renderings of sourced descriptions (Kr: Britannica "a bluish white light", Wikipedia "glowing white"; Xe: Britannica "a beautiful blue color", RSC "a beautiful blue glow", Wikipedia "blue or lavenderish glow"). CIE xy Kr (0.3051, 0.3228), Xe (0.2819, 0.2971). Why the neutral-line mix differs: a glow discharge is not in thermal equilibrium; ion lines and pressure/current change the line strengths (NIST ASD line help).
- **Units:** pm = 10⁻¹² m, nm = 10⁻⁹ m (BIPM SI Brochure 9th ed., Table 7); eV = energy an electron gains through 1 V (SI Brochure Table 8); visible light ≈ 380–750 nm.
- **Atom headlines:** templates backed by Wikipedia *Valence electron* ("for a main-group element, a valence electron can exist only in the outermost electron shell…", "an atom with a closed shell… tends to be chemically inert") and *Noble gas*; hand-written lines for H, C, O, Na, Cl, Fe, Cu, Au, Hg with their own Wikipedia sources (O, Au, Hg reworded by Gemini).
- **Heavy-atom clouds (Z ≥ 87):** Waber & Cromer (1965), J. Chem. Phys. 42, 4116 (https://doi.org/10.1063/1.1695904): relativistic radius of the outermost orbital, openly transcribed in HORTON data/elements.csv (col. P), Fr–No. Converted to Z_eff = n(n−1)/r_max, which gives Cs and Ba within 2 % of Clementi–Raimondi. Desclaux (1973) would cover all Z but is paywalled.
