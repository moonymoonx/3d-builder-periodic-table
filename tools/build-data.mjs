#!/usr/bin/env node
// Compile data/raw/* into data/elements.json.
// Every value is [value, sourceKey] or [value, sourceKey, flags]; flags.p = predicted/estimated,
// flags.th = theoretical (NIST notation), flags.n = note, flags.alt = other sources, flags.u = uncertainty.
// A missing value is [null, "none", {n: reason}]. Units are defined once in `fields`.
// Nothing is typed from memory: values come from the raw files in data/raw/MANIFEST.json, from stated
// computations, from data/curated/factcheck-fixes.json (Gemini fact-check, source-tagged) or from
// data/curated/placeholders.json (flagged, see QUESTIONS.md).
// Policy (moony, 2026-11-20): NIST ASD/CODATA numbers are used only as individual cited facts that the
// page needs (ionization energies, ground states, a handful of visible lines per element) — no tables.
// Wikipedia contributes numbers only (no copied prose or comment strings).
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parseCSV, nistCell } from './lib/csv.mjs';
import { infoboxFields, cleanText, refsOf, isPredictedText, firstNumber, parseLattice } from './lib/wikitext.mjs';
import { parseCIF, expandSites } from './lib/cif.mjs';
import { selectCod, COD_PHASES } from './lib/cod-select.mjs';
import { parseConfig, expandConfig, madelungConfig, configDiff, formatConfig, slaterZeff, subshellName, electronCount } from '../src/physics/config.js';
import { PROTOTYPES, nearestNeighbour, coordination, cellVolume } from '../src/physics/lattice.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = p => path.join(ROOT, 'data', 'raw', p);
const readRaw = (p, enc = 'utf8') => fs.readFileSync(RAW(p), enc);
const manifest = JSON.parse(readRaw('MANIFEST.json'));
const accessedOf = prefix => {
  const d = Object.entries(manifest.files).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v.accessed).sort();
  return d.length ? d[d.length - 1].slice(0, 10) : null;
};
const curated = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curated', f), 'utf8'));
const placeholders = curated('placeholders.json');
const FIX = curated('factcheck-fixes.json');
const LINES = curated('element-lines.json').lines;
const HIT = curated('phases-highT.json');
const TENTATIVE = curated('tentative-isotopes.json').entries; // NUBASE entries not yet confirmed: never the longest-lived kind
const warnings = [];
const warn = (...a) => warnings.push(a.join(' '));
const num = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const round = (v, d = 4) => (v == null ? v : Number(Number(v).toPrecision(d + 2)));
const clean = o => { if (!o) return o; for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return Object.keys(o).length ? o : undefined; };
const V = (v, s, flags) => { const f = clean(flags ? { ...flags } : undefined); return f ? [v, s, f] : [v, s]; };
const NONE = reason => [null, 'none', { n: reason }];
const K0 = 273.15;
const NLINES = 8; // "a handful of visible lines per element" (NIST policy)

// ---------------------------------------------------------------------------------------------
// Bibliography (mendeleev references.bib) -> readable citations for the source registry
const bib = (() => {
  const t = readRaw('mendeleev/references.bib');
  const out = {};
  for (const m of t.matchAll(/@\w+\{([^,]+),([\s\S]*?)\n\}/g)) {
    const body = m[2];
    const g = k => { const r = body.match(new RegExp(`\\b${k}\\s*=\\s*[{"]([\\s\\S]*?)[}"],?\\s*\\n`, 'i')); return r ? r[1].replace(/[{}\\'"`]/g, '').replace(/\s+/g, ' ').trim() : ''; };
    const authors = g('author').split(' and ').map(a => a.split(',')[0].trim()).filter(Boolean);
    const au = authors.length > 2 ? `${authors[0]} et al.` : authors.join(' & ');
    out[m[1].trim()] = [au, g('year') && `(${g('year')})`, g('title'), g('journal'), g('edition') && `${g('edition')} ed.`, g('doi') && `doi:${g('doi')}`].filter(Boolean).join(', ');
  }
  return out;
})();

// ---------------------------------------------------------------------------------------------
// Source registry (key -> description). Keys are referenced by every value.
const NIST_CITE = 'Kramida, A., Ralchenko, Yu., Reader, J. and NIST ASD Team, NIST Atomic Spectra Database (ver. 5.12), NIST SRD 78';
const SOURCES = {
  pc: { name: 'PubChem Periodic Table (NCBI / NLM)', url: 'https://pubchem.ncbi.nlm.nih.gov/periodic-table/', accessed: accessedOf('pubchem/'), licence: 'NCBI: US Government work, no restrictions on NCBI-created data; some PubChem content is contributed by third parties' },
  ciaaw: { name: 'IUPAC CIAAW — abridged standard atomic weights', url: 'https://www.ciaaw.org/abridged-atomic-weights.htm', accessed: accessedOf('ciaaw/'), licence: 'numeric facts, cited (CIAAW; Prohaska et al., Pure Appl. Chem. 94 (2022) 573)' },
  'ciaaw-full': { name: 'IUPAC CIAAW — standard atomic weights (full table with intervals)', url: 'https://www.ciaaw.org/atomic-weights.htm', accessed: accessedOf('ciaaw/'), licence: 'numeric facts, cited' },
  'nist-ie': { name: `${NIST_CITE} — ground states and ionization energies`, url: 'https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html', accessed: accessedOf('nist-asd/ie'), licence: '© U.S. Secretary of Commerce (SRD). Used only as individual cited values (moony, 2026-11-20); no NIST table is redistributed' },
  'nist-lines': { name: `${NIST_CITE} — the visible lines of the neutral atom that look brightest (air wavelengths). Brightness from NIST's transition probabilities (graded within 18 %) for a gas at 1 eV, as NIST's LIBS tool assumes, or else NIST's relative intensities; weighted by the eye's sensitivity (CIE 1931)`, url: 'https://physics.nist.gov/PhysRefData/ASD/lines_form.html', accessed: accessedOf('nist-asd/lines'), licence: `© U.S. Secretary of Commerce (SRD). Only ${NLINES} lines per element are shown, as cited values; the glow colour is computed from the element's lines and no table is redistributed` },
  wp: { name: 'Wikipedia element infoboxes (Template:Infobox <element>): numbers only, with the references cited there', url: 'https://en.wikipedia.org/wiki/Template:Infobox_element', accessed: accessedOf('wikipedia/infobox'), licence: 'CC BY-SA 4.0 page; only numeric facts are used (revision id per element in `wpRev`)' },
  wpa: { name: 'Wikipedia articles (numbers only): Curium, Berkelium, Californium, Einsteinium, Cerium, Helium', url: 'https://en.wikipedia.org/', accessed: accessedOf('wikipedia/articles-factcheck'), licence: 'CC BY-SA 4.0 page; only numeric facts are used' },
  'wp-syn': { name: 'Wikipedia: "Synthetic element" (which elements occur in nature)', url: 'https://en.wikipedia.org/wiki/Synthetic_element', accessed: accessedOf('wikipedia/article-synthetic'), licence: 'CC BY-SA 4.0 page; facts only' },
  'wp-cie': { name: 'CIE 1931 colour-matching functions, analytic multi-lobe Gaussian fit (Wyman, Sloan & Shirley 2013, JCGT 2(2)), coefficients as given in Wikipedia "CIE 1931 color space"', url: 'https://en.wikipedia.org/wiki/CIE_1931_color_space', accessed: accessedOf('wikipedia/articles-factcheck'), licence: 'formula coefficients (facts); no CIE table is embedded' },
  wd: { name: 'Wikidata element labels (en, vi)', url: 'https://www.wikidata.org/', accessed: accessedOf('wikidata/'), licence: 'CC0 1.0' },
  gdpt: { name: 'GDPT-2018 chemistry programme (Thông tư 32/2018/TT-BGDĐT): IUPAC names; 13 familiar Vietnamese names kept for the elements, with the English name — as stated by GS.TS Đặng Thị Oanh (Báo Đại Đoàn Kết) and PGS.TS Cao Cự Giác (cm.pek.edu.vn)', url: 'https://daidoanket.vn/doi-cach-doc-ten-cac-nguyen-to-hoa-hoc-hoc-sinh-boi-roi-giao-vien-ban-khoan-10233769.html', accessed: accessedOf('vi-gdpt/'), licence: 'facts from published interviews; programme PDF page not verified (RESEARCH.md Answers Q7)' },
  'mdl-cordero': { name: `Covalent radii: ${bib.Cordero2008 || 'Cordero 2008'} — via mendeleev v1.3.0`, url: 'https://doi.org/10.1039/b801115j', accessed: accessedOf('mendeleev/'), licence: 'numeric facts, cited; mendeleev package MIT' },
  'mdl-alvarez': { name: `van der Waals radii: ${bib.Alvarez2013 || 'Alvarez 2013'} — via mendeleev v1.3.0`, url: 'https://doi.org/10.1039/c3dt50599e', accessed: accessedOf('mendeleev/'), licence: 'numeric facts, cited; mendeleev package MIT' },
  'mdl-crc': { name: `CRC Handbook values (${bib.haynes2014crc || 'Haynes 2014'}; ${bib.haynes2016crc || 'Haynes 2016'}) — via mendeleev v1.3.0`, url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'individual numeric facts, cited (the Handbook itself is proprietary)' },
  'mdl-clementi': { name: `Effective nuclear charge: Z = 2–36 ${bib.Clementi1963 || 'Clementi & Raimondi 1963'}; Z = 37–86 ${bib.Clementi1967 || 'Clementi, Raimondi & Reinhardt 1967'} — via mendeleev v1.3.0`, url: 'https://doi.org/10.1063/1.1712084', accessed: accessedOf('mendeleev/'), licence: 'numeric facts, cited' },
  mdl: { name: 'mendeleev v1.3.0 element table (discoverers, discovery place)', url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'MIT' },
  nubase: { name: 'NUBASE2020: F. G. Kondev, M. Wang, W. J. Huang, S. Naimi, G. Audi, Chin. Phys. C 45, 030001 (2021)', url: 'https://doi.org/10.1088/1674-1137/abddae', accessed: accessedOf('nubase/'), licence: 'CC BY 3.0 (open-access publication)' },
  codata: { name: 'CODATA 2022 recommended values of the fundamental physical constants (NIST)', url: 'https://physics.nist.gov/cuu/Constants/', accessed: accessedOf('nist-codata/'), licence: 'individual constants used as cited facts (moony, 2026-11-20)' },
  w3c: { name: 'W3C CSS Color 4 sample code — XYZ (D65) to linear sRGB matrix (IEC 61966-2-1)', url: 'https://drafts.csswg.org/css-color-4/conversions.js', accessed: accessedOf('w3c/'), licence: 'W3C Software and Document License' },
  fc: { name: 'Gemini fact-check of 2026-11-20 (FACTCHECK.md): correction with the citation given there; our consistency check in the note', url: '', licence: 'n/a' },
  ans: { name: 'Research answers of 2026-11-20 (RESEARCH.md › Answers, Gemini batch 2, partly spot-checked by the project): the underlying citation is in the note', url: '', licence: 'n/a' },
  layout: { name: 'Computed from Z: 18-column layout with group 3 = Sc, Y, Lu, Lr (2021 IUPAC project provisional recommendation); f-block La–Yb, Ac–No', url: 'https://iupac.org/what-we-do/periodic-table-of-elements/', licence: 'n/a (layout convention)' },
  calc: { name: 'Computed in this project from sourced inputs (method in the note)', url: '', licence: 'n/a' },
  model: { name: 'Modelling assumption of this app (stated in the note)', url: '', licence: 'n/a' },
  sym: { name: 'Atomic positions fixed by space-group symmetry (no measured parameter needed)', url: '', licence: 'n/a' },
  spec: { name: 'Project scope decision (SPEC.md §5: molecular and complex solids later)', url: '', licence: 'n/a' },
  lines: { name: 'Our own one-line descriptions (data/curated/element-lines.json), each checked against the Wikipedia lead section of the element (revision in the note); Vietnamese drafted for moony', url: 'https://en.wikipedia.org/', accessed: accessedOf('wikipedia/intros'), licence: 'our text; facts from CC BY-SA 4.0 pages (no text copied)' },
  placeholder: { name: 'PLACEHOLDER — unverified value awaiting a source (see QUESTIONS.md)', url: '', licence: 'n/a' },
  none: { name: 'No value in our sources (reason given)', url: '', licence: 'n/a' },
};
const addCodSource = (file, cif) => {
  const key = `cod-${file}`;
  if (!SOURCES[key]) {
    const r = cif.ref;
    SOURCES[key] = {
      name: `Crystallography Open Database entry ${file}: ${[r.authors, r.year && `(${r.year})`, r.title, r.journal, r.volume, r.page].filter(Boolean).join(', ')}`.slice(0, 300),
      url: `https://www.crystallography.net/cod/${file}.html`, accessed: (manifest.files[`cod/${file}.cif`] || {}).accessed?.slice(0, 10) || null,
      licence: 'COD: CC0 / public domain (cite the original authors)', doi: r.doi || undefined,
    };
  }
  return key;
};

// ---------------------------------------------------------------------------------------------
// 1. PubChem base table
const pcJ = JSON.parse(readRaw('pubchem/periodictable.json'));
const pcCols = pcJ.Table.Columns.Column;
const PC = new Map(pcJ.Table.Row.map(r => {
  const o = Object.fromEntries(pcCols.map((c, i) => [c, r.Cell[i] === '' ? null : r.Cell[i]]));
  return [+o.AtomicNumber, o];
}));
const ZS = [...PC.keys()].sort((a, b) => a - b);
const SYM = new Map(ZS.map(z => [PC.get(z).Symbol, z]));

// 2. CIAAW tables
function ciaawRows(html) {
  const txt = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&plusmn;/g, '±').replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();
  const rows = new Map();
  for (const m of html.matchAll(/<tr>\s*<td>\s*(\d+)\s*<\/td>\s*<td>\s*([A-Z][a-z]?)\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    rows.set(+m[1], { sym: m[2], name: txt(m[3]), value: txt(m[4]), notes: txt(m[5]) });
  }
  return rows;
}
const CIAAW_AB = ciaawRows(readRaw('ciaaw/abridged-atomic-weights.htm'));
const CIAAW_FULL = ciaawRows(readRaw('ciaaw/atomic-weights.htm'));

// 3. NIST ionization energies (all spectra; we keep neutral, +1, +2 only)
const NIST_IE = new Map();
for (const r of parseCSV(readRaw('nist-asd/ie-all.csv')).slice(1)) {
  const c = r.map(nistCell);
  const Z = +c[0], q = +String(c[2]).replace('+', '');
  if (!Z || q > 2) continue;
  if (!NIST_IE.has(Z)) NIST_IE.set(Z, new Map());
  NIST_IE.get(Z).set(q, { shells: c[5], level: c[6], prefix: c[8], ie: num(c[9]), unc: num(c[11]), refs: c[12] });
}
// cores ([Ne], [Cd], [Hg], ...) are defined by NIST's own neutral ground configurations
const CORES = {};
for (const [Z, m] of NIST_IE) { const r = m.get(0); if (r && r.shells) CORES[PC.get(Z).Symbol] = parseConfig(r.shells); }
const CORE_SUBS = Object.fromEntries(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'].map(s => [s, expandConfig(CORES[s], CORES)]));
const CORE_Z = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

// 4. Wikipedia infoboxes + articles
const WP = new Map();
for (const i of [1, 2, 3]) {
  for (const p of JSON.parse(readRaw(`wikipedia/infobox-batch-${i}.json`)).query.pages) {
    const raw = p.revisions[0].slots.main.content;
    const F = infoboxFields(raw);
    WP.set(+(F.number || F.Z), { F, raw, revid: p.revisions[0].revid, title: p.title });
  }
}
const synText = JSON.parse(readRaw('wikipedia/article-synthetic-element.json')).query.pages[0].revisions[0].slots.main.content;
const ART = new Map(JSON.parse(readRaw('wikipedia/articles-factcheck.json')).query.pages.map(p => [p.title, { text: p.revisions[0].slots.main.content, revid: p.revisions[0].revid }]));

// 5. Wikidata labels
const WD = new Map();
for (const b of JSON.parse(readRaw('wikidata/element-labels.json')).results.bindings) {
  const Z = +b.z.value;
  if (!WD.has(Z)) WD.set(Z, { vi: b.vi?.value || null, en: b.en?.value || null, q: b.item.value.split('/').pop() });
}

// 6. mendeleev
const db = new DatabaseSync(RAW('mendeleev/elements.db'), { readOnly: true });
const MDL = new Map(db.prepare('select * from elements').all().map(r => [r.atomic_number, r]));
const MDL_PT = new Map();
for (const r of db.prepare('select * from phasetransitions').all()) {
  if (!MDL_PT.has(r.atomic_number)) MDL_PT.set(r.atomic_number, []);
  MDL_PT.get(r.atomic_number).push(r);
}
const MDL_SC = new Map();
for (const r of db.prepare('select * from screeningconstants').all()) {
  if (!MDL_SC.has(r.atomic_number)) MDL_SC.set(r.atomic_number, new Map());
  MDL_SC.get(r.atomic_number).set(`${r.n}${r.s}`, r.screening);
}

// 7. NUBASE2020 ground states (fixed-width table; columns from the file header)
const UNIT_S = { ys: 1e-24, zs: 1e-21, as: 1e-18, fs: 1e-15, ps: 1e-12, ns: 1e-9, us: 1e-6, ms: 1e-3, s: 1, m: 60, h: 3600, d: 86400 };
const YEAR_S = 365.25 * 86400;
Object.assign(UNIT_S, { y: YEAR_S, ky: 1e3 * YEAR_S, My: 1e6 * YEAR_S, Gy: 1e9 * YEAR_S, Ty: 1e12 * YEAR_S, Py: 1e15 * YEAR_S, Ey: 1e18 * YEAR_S, Zy: 1e21 * YEAR_S, Yy: 1e24 * YEAR_S });
const NUBASE = new Map(); // Z -> [{A, stable, hlText, hlSec, hlU, est, abundance}]
for (const line of readRaw('nubase/nubase_4.mas20.txt', 'latin1').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const A = +line.slice(0, 3), zzzi = line.slice(4, 8), Z = +zzzi.slice(0, 3), iso = zzzi[3];
  if (iso !== '0' || !(Z >= 1)) continue; // ground states only
  const hlRaw = line.slice(69, 78).trim(), unit = line.slice(78, 80).trim();
  const br = line.slice(119);
  const ab = br.match(/IS=([\d.]+)/);
  const rec = { A, stable: hlRaw === 'stbl', hlText: null, hlSec: null, est: hlRaw.includes('#'), abundance: ab ? Number(ab[1]) : null };
  if (!rec.stable && hlRaw && hlRaw !== 'p-unst') {
    const v = Number(hlRaw.replace(/[#<>~]/g, ''));
    if (Number.isFinite(v) && UNIT_S[unit]) { rec.hlSec = v * UNIT_S[unit]; rec.hlText = `${hlRaw.replace('#', '')} ${unit}`; }
    // the half-life's uncertainty (columns 82-88, same unit); limits such as ">300ns" are not uncertainties
    const dT = line.slice(81, 88).trim();
    if (rec.hlSec && /^\d+(\.\d+)?$/.test(dT)) { rec.hlU = Number(dT) * UNIT_S[unit]; rec.hlUText = `${hlRaw.replace('#', '')} ± ${dT} ${unit}`; }
  }
  if (!NUBASE.has(Z)) NUBASE.set(Z, []);
  NUBASE.get(Z).push(rec);
}

// 8. CODATA (individual constants only)
const CODATA = (() => {
  const t = readRaw('nist-codata/allascii.txt');
  const get = name => {
    const line = t.split('\n').find(l => l.slice(0, 60).trim() === name);
    if (!line) throw new Error('CODATA constant missing: ' + name);
    return Number(line.slice(60, 85).replace(/\s/g, '').replace('...', ''));
  };
  return {
    version: (t.match(/CODATA\s+(\d{4})/i) || [])[1] || null,
    a0_m: get('Bohr radius'), R: get('molar gas constant'), kB: get('Boltzmann constant'), u_kg: get('atomic mass constant'),
    NA: get('Avogadro constant'), h: get('Planck constant'), c: get('speed of light in vacuum'), eV_J: get('electron volt'),
  };
})();
const KJMOL_PER_EV = (CODATA.eV_J * CODATA.NA) / 1000;

// 9. Colour science: CIE 1931 analytic fit (coefficients parsed from the article) + W3C sRGB matrix
const CMF_FIT = (() => {
  const t = ART.get('CIE 1931 color space').text;
  const block = t.slice(t.indexOf('Analytical approximation'));
  const comp = name => {
    const start = block.indexOf(`\\overline{${name}}(\\lambda) &=`);
    const end = block.indexOf('\\overline{', start + 10);
    const seg = block.slice(start, end > 0 ? end : start + 400);
    const terms = [...seg.matchAll(/([+-]?)\s*(?:&\\quad\s*)?([+-])?\s*(\d\.\d+)\\,g\(\\lambda;\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g)];
    return terms.map(m => [((m[1] || m[2]) === '-' ? -1 : 1) * Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])]);
  };
  const fit = { x: comp('x'), y: comp('y'), z: comp('z') };
  if (fit.x.length !== 3 || fit.y.length !== 2 || fit.z.length !== 2) throw new Error('CIE analytic fit not parsed: ' + JSON.stringify(fit));
  return fit; // each term: [amplitude, mu (nm), tau1 (1/nm, left), tau2 (1/nm, right)]
})();
const SRGB = (() => {
  const t = readRaw('w3c/css-color-4-conversions.js');
  const body = t.slice(t.indexOf('function XYZ_to_lin_sRGB')).split('];')[0];
  const rows = [...body.matchAll(/\[([^\[\]]+)\]/g)].map(m => m[1].split(',').filter(s => s.trim()).map(s => Function(`"use strict";return (${s})`)()));
  if (rows.length !== 3 || rows.some(r => r.length !== 3)) throw new Error('could not read sRGB matrix');
  return rows.map(r => r.map(v => round(v, 7)));
})();

// 10. GDPT-2018: the 13 Vietnamese names that are kept (with English annotation)
const GDPT13 = (() => {
  const text = readRaw('vi-gdpt/daidoanket-10233769.html').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const m = text.match(/Tên 13 nguyên tố[^:]*gồm:\s*([^.]+)\./);
  if (!m) throw new Error('GDPT sentence not found');
  const names = m[1].split(/,\s*|\s+và\s+/).map(s => s.trim()).filter(Boolean);
  if (names.length !== 13) throw new Error('expected 13 names, got ' + names.length);
  return { names };
})();
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

// 11. Natural vs synthetic (Wikipedia "Synthetic element")
const NATURAL = (() => {
  const plain = cleanText(synText);
  if (!/atomic numbers 95[–-]118/.test(plain)) throw new Error('synthetic range sentence not found');
  if (!/atomic numbers 1 through 94 occur naturally/.test(plain)) throw new Error('natural range sentence not found');
  const m = synText.match(/Six more elements[^:]*:([\s\S]*?)\.\s/);
  const traceNames = m ? [...m[1].matchAll(/\[\[([^\]|]+)/g)].map(x => x[1].toLowerCase()) : [];
  if (/Plutonium, first synthesized in 1940, is another such element/.test(plain)) traceNames.push('plutonium');
  return { traceNames: [...new Set(traceNames)] };
})();

// 12. COD structures (cell in pm, fractional sites of the full conventional cell)
const COD = new Map();
function rhombToHex(cell, sites) {
  const a = cell.a, al = (cell.alpha * Math.PI) / 180;
  const ah = 2 * a * Math.sin(al / 2), ch = a * Math.sqrt(3 * (1 + 2 * Math.cos(al)));
  const out = [];
  for (const [x, y, z] of sites) {
    const h = [(2 * x - y - z) / 3, (x + y - 2 * z) / 3, (x + y + z) / 3];
    for (const t of [[0, 0, 0], [2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 2 / 3]]) {
      const p = h.map((v, i) => { let w = v + t[i]; w -= Math.floor(w); return Math.abs(w - 1) < 1e-6 || Math.abs(w) < 1e-6 ? 0 : w; });
      if (!out.some(q => q.every((v, i) => Math.min(Math.abs(v - p[i]), 1 - Math.abs(v - p[i])) < 1e-4))) out.push(p);
    }
  }
  return { cell: { a: ah, b: ah, c: ch, alpha: 90, beta: 90, gamma: 120 }, sites: out };
}
for (const sym of Object.keys(COD_PHASES)) {
  const qrel = `cod/query-${sym}.json`;
  if (!fs.existsSync(RAW(qrel))) { warn('COD query missing for', sym); continue; }
  for (const pick of selectCod(sym, JSON.parse(readRaw(qrel)))) {
    const rel = `cod/${pick.file}.cif`;
    if (!fs.existsSync(RAW(rel))) { warn('COD CIF missing', rel); continue; }
    const cif = parseCIF(readRaw(rel));
    let sites = expandSites(cif);
    let cell = { ...cif.cell };
    if (sites.length !== cif.Z) warn(`COD ${pick.file}: expanded ${sites.length} sites but Z=${cif.Z}`);
    if (cif.sgNumber >= 143 && cif.sgNumber <= 167 && Math.abs(cell.gamma - 120) > 1e-3 && Math.abs(cell.alpha - cell.beta) < 1e-6) ({ cell, sites } = rhombToHex(cell, sites));
    const pm = { a: cell.a * 100, b: cell.b * 100, c: cell.c * 100, alpha: cell.alpha, beta: cell.beta, gamma: cell.gamma };
    if (!COD.has(sym)) COD.set(sym, []);
    COD.get(sym).push({ phase: pick.phase, file: pick.file, sgNumber: cif.sgNumber, cell: pm, sites, T: cif.T, key: addCodSource(pick.file, cif) });
  }
}

// 13. NIST lines: a handful of visible lines of the neutral atom, and the colour they mix to.
// How the lines are chosen and how bright they are (atom view round 2, PROPOSALS-atom.md r2 #1):
//  - NIST ASD lines of the neutral atom between 380 and 750 nm (air), observed by NIST.
//  - Lines from levels above the first ionization energy are left out: core-excited levels (sodium's
//    2p5 3s 3d at ~36 eV gave its old violet lines) never show in a flame, lamp or tube.
//  - NIST's relative intensities depend on the light source, and some elements mix papers on different
//    scales: neon's 540.06 and 585.25 nm lines share an upper level, so NIST's own transition rates fix
//    their ratio at about 1 : 63, yet both are listed as 20,000. So where NIST grades the transition
//    probability of at least 3 visible lines within 18 % (grade C+ or better), every graded line's
//    radiant power is estimated from them for a gas in equilibrium at kT = 1 eV (the default plasma of
//    NIST's LIBS spectrum tool): P ∝ g_k A_ki exp(-E_k / kT) / λ. Otherwise NIST's relative intensities
//    are used ('intensity'), or g_k A_ki when no intensity is given ('gA').
//  - The NLINES lines that look brightest are kept: power × the eye's sensitivity V(λ) (CIE 1931 ȳ,
//    the CIE table in data/raw/cie); a line within 0.5 nm of a brighter kept line is skipped (a
//    spectroscope shows them as one; the sodium D doublet, 0.6 nm apart, stays two lines). v = [wavelength,
//    radiant power relative to the strongest kept, 1–1000].
//  - glow = the CIE 1931 chromaticity (x, y) of all those lines together (not only the kept ones):
//    the colour the eye would see. Checked in validate.mjs against the lamp colours of Wikipedia's
//    "Gas-discharge lamp" table.
function parseJ(s) { if (!s) return null; if (s.includes('/')) { const [a, b] = s.split('/'); return Number(a) / Number(b); } return num(s); }
const levelCm = s => (!s || /[a-z]/i.test(s) ? null : num(String(s).replace(/[[\]()+?]/g, ''))); // "[40860.648]" -> 40860.648; "+x" levels -> null
const CIE_TABLE = new Map(readRaw('cie/CIE_xyz_1931_2deg.csv').trim().split(/\r?\n/).map(l => { const [w, x, y, z] = l.split(',').map(Number); return [w, [x, y, z]]; }));
const cieAt = lam => { const a = Math.floor(lam), t = lam - a, A = CIE_TABLE.get(a), B = CIE_TABLE.get(a + 1) || A; return A.map((v, i) => v + (B[i] - v) * t); };
const ACC = { AAA: 0.003, AA: 0.01, 'A+': 0.02, A: 0.03, 'B+': 0.07, B: 0.1, 'C+': 0.18, C: 0.25, 'D+': 0.4, D: 0.5, E: 1 }; // NIST ASD accuracy codes: relative uncertainty of A_ki
const EV_CM = CODATA.eV_J / (CODATA.h * CODATA.c) / 100; // 1 eV in cm^-1 (CODATA)
const LIBS_KT_EV = 1; // NIST LIBS form default electron temperature, eV (https://physics.nist.gov/PhysRefData/ASD/LIBS/libs-form.html)
function linesFor(Z, sym, ieEv) {
  const rel = `nist-asd/lines/${Z}-${sym}_I.csv`;
  if (!fs.existsSync(RAW(rel))) {
    if (fs.existsSync(RAW(`nist-asd/lines/${Z}-${sym}_I.none.txt`))) return { none: 'NIST ASD lists no lines of the neutral atom between 380 and 750 nm' };
    return { none: 'not fetched' };
  }
  const rows = parseCSV(readRaw(rel, 'latin1'));
  const head = rows[0].map(h => h.trim());
  const col = n => head.indexOf(n);
  const out = [];
  for (const r of rows.slice(1)) {
    const c = r.map(nistCell);
    const obs = num(c[col('obs_wl_air(nm)')]), ritz = num(c[col('ritz_wl_air(nm)')]);
    const lam = obs ?? ritz;
    if (!(lam >= 380 && lam <= 750)) continue;
    const im = (c[col('intens')] || '').match(/\d+(?:\.\d+)?/);
    out.push({ lam, obs: obs != null, I: im ? Number(im[0]) : null, A: num(c[col('Aki(s^-1)')]), acc: c[col('Acc')], Ek: levelCm(c[col('Ek(cm-1)')]), Jk: parseJ(c[col('J_k')]) });
  }
  const ieCm = ieEv != null ? ieEv * EV_CM : null;
  const bound = out.filter(x => !(ieCm != null && x.Ek != null && x.Ek > ieCm));
  const seen = bound.filter(x => x.obs);
  const graded = bound.filter(x => x.A > 0 && x.Ek != null && x.Jk != null && (ACC[x.acc] ?? 1) <= ACC['C+']);
  const withI = seen.filter(x => x.I > 0);
  const gA = seen.filter(x => x.A > 0 && x.Jk != null);
  let basis, pool;
  if (graded.length >= 3) { basis = 'model'; pool = graded.map(x => ({ ...x, P: ((2 * x.Jk + 1) * x.A * Math.exp(-x.Ek / (LIBS_KT_EV * EV_CM))) / x.lam })); }
  else if (withI.length >= 3) { basis = 'intensity'; pool = withI.map(x => ({ ...x, P: x.I })); }
  else if (gA.length) { basis = 'gA'; pool = gA.map(x => ({ ...x, P: (2 * x.Jk + 1) * x.A })); }
  else { basis = 'none'; pool = (seen.length ? seen : bound).map(x => ({ ...x, P: 0 })); }
  const eye = pool.map(x => ({ ...x, B: x.P * cieAt(x.lam)[1] })).sort((a, b) => b.B - a.B || a.lam - b.lam);
  const kept = [];
  for (const x of eye) { if (kept.length === NLINES) break; if (!kept.some(k => Math.abs(k.lam - x.lam) < 0.5)) kept.push(x); }
  let X = 0, Y = 0, Zt = 0;
  for (const x of pool) { const [a, b, c] = cieAt(x.lam); X += x.P * a; Y += x.P * b; Zt += x.P * c; }
  const S = X + Y + Zt;
  const max = Math.max(...kept.map(x => x.P), 1e-30);
  return {
    basis, total: out.length, used: pool.length, dropped: out.length - bound.length,
    glow: basis !== 'none' && S > 0 ? [round(X / S, 2), round(Y / S, 2)] : undefined,
    v: kept.sort((a, b) => a.lam - b.lam).map(x => [Number(x.lam.toFixed(3)), basis === 'none' ? 0 : Math.max(1, Math.round((1000 * x.P) / max))]),
  };
}

// ---------------------------------------------------------------------------------------------
// Layout from Z (18-column form; group 3 = Sc, Y, Lu, Lr)
export function layoutOf(Z) {
  const starts = [1, 3, 11, 19, 37, 55, 87, 119];
  let period = 1;
  while (Z >= starts[period]) period++;
  const idx = Z - starts[period - 1];
  let group = null, block, fIndex = null;
  if (period === 1) { group = Z === 1 ? 1 : 18; block = 's'; }
  else if (period <= 3) { group = idx < 2 ? idx + 1 : idx + 11; block = idx < 2 ? 's' : 'p'; }
  else if (period <= 5) { group = idx + 1; block = idx < 2 ? 's' : idx < 12 ? 'd' : 'p'; }
  else if (idx < 2) { group = idx + 1; block = 's'; }
  else if (idx < 16) { fIndex = idx - 2; block = 'f'; }
  else { group = idx - 13; block = group <= 12 ? 'd' : 'p'; }
  let col32;
  if (period === 1) col32 = Z === 1 ? 0 : 31;
  else if (block === 's') col32 = group - 1;
  else if (block === 'f') col32 = 2 + fIndex;
  else col32 = group + 13;
  return { period, group, block, fIndex, col32 };
}

// ---------------------------------------------------------------------------------------------
const CATS = { 'Alkali metal': 'alkali', 'Alkaline earth metal': 'alkaline-earth', 'Transition metal': 'transition', 'Post-transition metal': 'post-transition', Lanthanide: 'lanthanide', Actinide: 'actinide', Metalloid: 'metalloid', Nonmetal: 'nonmetal', Halogen: 'halogen', 'Noble gas': 'noble-gas' };
const MOLECULAR = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'P', 'S']; // SPEC §5 "Later"
const COMPLEX = ['B', 'Mn']; // SPEC §5 "Later"
const PEARSON_SG = { cI2: [229], cF4: [225], hP2: [194], hP4: [194], cF8: [227], hR1: [166], hR2: [166], hR3: [166], hP3: [152, 154], tI2: [139], tI4: [141], oS8: [64], oS4: [63], oP8: [62], mP16: [11], cP1: [221] };
// Our own canonical structure names (no Wikipedia wording copied); key = prototype or Pearson symbol
const STRUCT_NAME = {
  bcc: 'body-centred cubic (bcc)', fcc: 'face-centred cubic (fcc)', hcp: 'hexagonal close-packed (hcp)', dhcp: 'double hexagonal close-packed (dhcp)',
  diamond: 'diamond cubic', graphite: 'hexagonal layers (graphite)', sc: 'simple cubic', hR1: 'rhombohedral (α-Hg type)', hR2: 'rhombohedral layers (As type)',
  hR3: 'rhombohedral (Sm type)', hP3: 'trigonal helical chains (Se type)', tI2: 'body-centred tetragonal', tI4: 'body-centred tetragonal (white tin)',
  oS8: 'base-centred orthorhombic (Ga type)', oS4: 'base-centred orthorhombic (α-U type)', oP8: 'primitive orthorhombic (α-Np type)', mP16: 'monoclinic (α-Pu type)',
};
const PROTO_PEARSON = { bcc: 'cI2', fcc: 'cF4', hcp: 'hP2', dhcp: 'hP4', diamond: 'cF8', graphite: 'hP4', sc: 'cP1' };
function protoFor(name, pearson) {
  const n = String(name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (/doublehexagonal/.test(n)) return 'dhcp';
  if (/bodycent(ered|red)cubic|cubicbodycentered/.test(n)) return 'bcc';
  if (/facecent(ered|red)cubic/.test(n)) return 'fcc';
  if (/hexagonalclose/.test(n)) return 'hcp';
  if (/diamondcubic/.test(n)) return 'diamond';
  if (/simplehexagonal/.test(n) && pearson === 'hP4') return 'graphite';
  if (n === 'cubic' && !pearson) return 'sc';
  return null;
}
// Description derived from any Pearson symbol (crystal family + centring + atoms per cell)
function pearsonText(p) {
  const m = String(p || '').match(/^([amothc])([PSCIFR])(\d+)$/);
  if (!m) return null;
  const fam = { a: 'triclinic', m: 'monoclinic', o: 'orthorhombic', t: 'tetragonal', h: 'hexagonal', c: 'cubic' }[m[1]];
  const cen = { P: 'primitive', S: 'base-centred', C: 'base-centred', I: 'body-centred', F: 'face-centred', R: 'rhombohedral' }[m[2]];
  return `${cen} ${fam} lattice, ${m[3]} atoms per cell (${p})`;
}
const structName = (proto, pearson) => STRUCT_NAME[proto] || STRUCT_NAME[pearson] || pearsonText(pearson);
const fmtNum = (v, d = 2) => Number(v.toFixed(d)).toString();
const latText = c => {
  if (c.gamma === 120) return `a = ${fmtNum(c.a)} pm, c = ${fmtNum(c.c)} pm`;
  if (Math.abs(c.a - c.b) < 1e-6 && Math.abs(c.a - c.c) < 1e-6) return `a = ${fmtNum(c.a)} pm`;
  if (Math.abs(c.a - c.b) < 1e-6) return `a = ${fmtNum(c.a)} pm, c = ${fmtNum(c.c)} pm`;
  return `a = ${fmtNum(c.a)} pm, b = ${fmtNum(c.b)} pm, c = ${fmtNum(c.c)} pm${Math.abs(c.beta - 90) > 1e-6 ? `, β = ${fmtNum(c.beta)}°` : ''}`;
};
const condText = cond => {
  if (!cond) return null;
  const c = cond.match(/(-?\d+(?:\.\d+)?)\s*°C/);
  if (c) return `${c[1]} °C`;
  const k = cond.match(/(\d+(?:\.\d+)?)\s*K/);
  if (k) return `${k[1]} K`;
  if (/triple|t\.p\./i.test(cond)) return 'triple point';
  if (/r\.t\.|room/i.test(cond)) return 'room temperature';
  if (/estimat/i.test(cond)) return 'estimated';
  return null;
};

function wpNumber(F, key) {
  const raw = F[key];
  if (raw == null || cleanText(raw) === '') return null;
  return { v: firstNumber(raw), predicted: isPredictedText(F[`${key.replace(/ K$/, '')} comment`]) || isPredictedText(raw) };
}

const elements = [];
const crosscheck = [];
const ccAdd = (Z, field, a, b) => { if (a && b && a[0] != null && b[0] != null && a[1] !== b[1]) crosscheck.push({ Z, field, a, b }); };

for (const Z of ZS) {
  const pc = PC.get(Z);
  const sym = pc.Symbol;
  const wp = WP.get(Z);
  const F = wp ? wp.F : {};
  const mdl = MDL.get(Z) || {};
  const wd = WD.get(Z) || {};
  const f = {};
  const L = layoutOf(Z);
  const superheavy = Z >= 100; // never made in bulk (fact-check: Fm–Og)

  // ---- names: IUPAC first, Vietnamese/traditional second ("sodium · natri", SPEC §3)
  const iupac = (wd.en || pc.Name).toLowerCase();
  const gd = GDPT13.names.find(n => fold(n) === fold(wd.vi));
  const names = {
    en: V(iupac.charAt(0).toUpperCase() + iupac.slice(1), 'wd'),
    alias: V(pc.Name, 'pc'),
    vi: V(iupac, 'gdpt', { n: 'IUPAC name (GDPT-2018)' }),
    viAlt: gd ? V(gd.toLowerCase(), 'gdpt', { n: 'one of the 13 familiar Vietnamese names kept by GDPT-2018' })
      : (wd.vi && fold(wd.vi) !== fold(iupac) ? V(wd.vi, 'wd', { n: 'Vietnamese Wikipedia / Wikidata name' }) : null),
  };

  // ---- layout + category
  f.period = V(L.period, 'layout');
  f.group = L.group == null ? NONE('f-block elements have no group number in the 18-column table') : V(L.group, 'layout');
  f.block = V(L.block, 'layout');
  f.cat = V(CATS[pc.GroupBlock], 'pc', { n: `PubChem GroupBlock "${pc.GroupBlock}"` });
  if (!CATS[pc.GroupBlock]) warn('unknown category', sym, pc.GroupBlock);

  // ---- atomic weight (CIAAW)
  const ab = CIAAW_AB.get(Z), full = CIAAW_FULL.get(Z);
  const abm = ab && ab.value.match(/^([\d.]+)\s*±\s*([\d.]+)/);
  f.aw = abm ? V(Number(abm[1]), 'ciaaw', { t: abm[1], u: Number(abm[2]) }) : NONE('no standard atomic weight: the element has no stable isotopes (see longest-lived isotope)');
  if (full && full.value && full.value !== '—') f.awStd = V(full.value.replace(/\s(?=\d)/g, ''), 'ciaaw-full');
  ccAdd(Z, 'aw', f.aw, num(pc.AtomicWeight) != null ? V(num(pc.AtomicWeight), 'pc') : null);

  // ---- isotopes (NUBASE2020)
  const iso = NUBASE.get(Z) || [];
  f.nStable = V(iso.filter(x => x.stable).length, 'nubase', { n: 'ground states marked stable in NUBASE2020' });
  const natural = iso.filter(x => x.abundance != null).sort((a, b) => b.abundance - a.abundance);
  // the longest-lived kind: confirmed ones only; a longer-lived listing that is not yet confirmed (oganesson-295)
  // is kept beside it as a tentative value (data/curated/tentative-isotopes.json gives the basis)
  const unconfirmed = x => TENTATIVE.some(u => u.Z === Z && u.A === x.A);
  const tentative = iso.filter(x => x.hlSec > 0 && unconfirmed(x)).sort((a, b) => b.hlSec - a.hlSec)[0];
  const confirmed = iso.filter(x => x.hlSec > 0 && !unconfirmed(x));
  // beside a tentative listing, the confirmed kind must be an observed one, not a NUBASE '#' estimate
  // (oganesson-293's "1 ms #" is a systematics estimate; oganesson-294's 0.7 ms is measured)
  const pool = tentative && confirmed.some(x => !x.est) ? confirmed.filter(x => !x.est) : confirmed;
  const longest = pool.sort((a, b) => b.hlSec - a.hlSec)[0];
  const onlyConfirmed = !!(longest && tentative && tentative.hlSec > longest.hlSec);
  let nucA = null;
  if (natural.length) { f.isoMain = V(`${natural[0].A}${sym}`, 'nubase', { n: `natural abundance ${natural[0].abundance} %` }); nucA = natural[0].A; }
  if (!iso.some(x => x.stable)) {
    if (longest) {
      if (f.aw[0] == null) f.massNumber = V(longest.A, 'nubase', { n: `mass number of the longest-lived ${onlyConfirmed ? 'confirmed' : 'known'} isotope` });
      const tentText = onlyConfirmed ? `NUBASE2020 also lists ${sym}-${tentative.A} at ${tentative.hlUText || tentative.hlText}, ${TENTATIVE.find(u => u.Z === Z && u.A === tentative.A).why}` : null;
      f.halfLife = V(round(longest.hlSec, 4), 'nubase', { t: longest.hlText, A: longest.A, p: longest.est ? 1 : undefined, u: longest.hlU ? round(longest.hlU, 4) : undefined,
        conf: onlyConfirmed ? 1 : undefined, // the only confirmed kind (a longer-lived listing is tentative)
        n: longest.est ? 'estimated from systematics (NUBASE #)'
          : [longest.hlU ? `NUBASE2020: ${longest.hlUText} for ${sym}-${longest.A}` : null, onlyConfirmed ? `the only confirmed kind; ${tentText}` : null].filter(Boolean).join('; ') || undefined });
      if (onlyConfirmed) f.halfLifeTent = V(round(tentative.hlSec, 4), 'nubase', { t: tentative.hlText, A: tentative.A, u: tentative.hlU ? round(tentative.hlU, 4) : undefined,
        n: `NUBASE2020: ${tentative.hlUText || tentative.hlText} for ${sym}-${tentative.A}; ${TENTATIVE.find(u => u.Z === Z && u.A === tentative.A).why} (${sym}-${longest.A} is the only confirmed kind)` });
      if (!nucA) nucA = longest.A;
    } else f.halfLife = NONE('no half-life in NUBASE2020');
  }
  if (nucA) {
    f.nucA = V(nucA, 'nubase', { n: natural.length ? 'most abundant natural isotope' : onlyConfirmed ? 'longest-lived confirmed isotope' : 'longest-lived isotope' });
    const r0 = FIX.nuclearR0_fm.value;
    f.rNuc = V(round(r0 * Math.cbrt(nucA), 3), 'fc', { p: 1, n: `estimate: rms charge radius ≈ ${r0}·A^(1/3) fm (${FIX.nuclearR0_fm.cite})` });
  }

  // ---- electron configuration (NIST; PubChem for Z > 108)
  const nist0 = NIST_IE.get(Z)?.get(0);
  const hasLines = fs.existsSync(RAW(`nist-asd/lines/${Z}-${sym}_I.csv`));
  const unobserved = !!nist0 && (nist0.prefix === '(' || nist0.prefix === '[') && !hasLines;
  let parsed, cfgSrc, cfgFlags = {};
  if (nist0 && nist0.shells) {
    parsed = parseConfig(nist0.shells); cfgSrc = 'nist-ie';
    if (unobserved) cfgFlags = { p: 1, n: 'no observed spectrum in our NIST data and only a theoretical/extrapolated ionization energy: treated as a theoretical configuration' };
  } else {
    parsed = parseConfig(pc.ElectronConfiguration); cfgSrc = 'pc';
    cfgFlags = { p: 1, n: /predicted/i.test(pc.ElectronConfiguration || '') ? 'PubChem marks this configuration as predicted' : 'not in NIST ASD' };
  }
  const subs = expandConfig(parsed, CORES);
  if (electronCount(subs) !== Z) warn(`config electron count ${electronCount(subs)} != Z for ${sym}`);
  let core = null;
  for (const c of ['Rn', 'Xe', 'Kr', 'Ar', 'Ne', 'He']) {
    if (CORE_Z[c] >= Z) continue;
    if (CORE_SUBS[c].every(cs => subs.some(s => s.n === cs.n && s.l === cs.l && s.occ === cs.occ))) { core = c; break; }
  }
  f.config = V(formatConfig(subs, { core, coreSubs: core ? CORE_SUBS[core] : null }), cfgSrc, cfgFlags);
  if (nist0?.level) f.term = V(nist0.level, 'nist-ie');
  const mad = madelungConfig(Z);
  const diff = configDiff(mad, subs);
  f.madelung = V(diff.length ? 'exception' : 'follows', 'calc', diff.length
    ? { n: `aufbau (n+l) order predicts ${formatConfig(mad, { core, coreSubs: core ? CORE_SUBS[core] : null })}`, d: diff.map(d => `${subshellName(d.n, d.l)}: ${d.from}→${d.to}`) }
    : { n: 'configuration matches the aufbau (n+l, then n) order' });

  // ---- ionization energies (NIST, cited individually)
  for (const q of [0, 1, 2]) {
    const r = NIST_IE.get(Z)?.get(q);
    const key = `ie${q + 1}`;
    if (r && r.ie != null) {
      const fl = { u: r.unc ?? undefined, r: r.refs || undefined };
      if (r.prefix === '(') { fl.th = 1; fl.n = 'theoretical value (NIST: in parentheses)'; }
      if (r.prefix === '[') { fl.th = 1; fl.n = 'semi-empirical / extrapolated value (NIST: in brackets)'; }
      if (fl.th && (q === 0 ? unobserved : superheavy)) fl.p = 1;
      f[key] = V(r.ie, 'nist-ie', fl);
    } else if (q === 0) {
      const pcIE = num(pc.IonizationEnergy);
      f[key] = pcIE != null ? V(pcIE, 'pc', { p: superheavy ? 1 : undefined }) : NONE('no ionization energy in NIST ASD or PubChem');
    }
  }
  ccAdd(Z, 'ie1', f.ie1, num(pc.IonizationEnergy) != null ? V(num(pc.IonizationEnergy), 'pc') : null);
  if (F['ionization energy 1']) { const kj = firstNumber(F['ionization energy 1']); if (kj) ccAdd(Z, 'ie1', f.ie1, V(round(kj / KJMOL_PER_EV, 5), 'wp', { n: `${kj} kJ/mol converted with CODATA e·N_A` })); }

  // ---- electronegativity, electron affinity, oxidation states
  f.en = num(pc.Electronegativity) != null ? V(num(pc.Electronegativity), 'pc', { n: 'Pauling scale', p: superheavy ? 1 : undefined }) : NONE('no Pauling electronegativity in PubChem');
  ccAdd(Z, 'en', f.en, mdl.en_pauling != null ? V(mdl.en_pauling, 'mdl-crc') : null);
  f.ea = num(pc.ElectronAffinity) != null ? V(num(pc.ElectronAffinity), 'pc', { p: superheavy ? 1 : undefined }) : NONE('no electron affinity in PubChem');
  ccAdd(Z, 'ea', f.ea, mdl.electron_affinity != null ? V(mdl.electron_affinity, 'mdl-crc') : null);
  f.ox = pc.OxidationStates ? V(pc.OxidationStates.replace(/\s+/g, ' '), 'pc', { p: superheavy ? 1 : undefined }) : NONE('no oxidation states in PubChem');

  // ---- state, melting/boiling, density (PubChem; Wikipedia when PubChem is empty; fixes below)
  const st = pc.StandardState || '';
  const stateVal = /gas/i.test(st) ? 'gas' : /liquid/i.test(st) ? 'liquid' : /solid/i.test(st) ? 'solid' : null;
  const stPred = /expected/i.test(st) || superheavy;
  f.state = stateVal ? V(stateVal, 'pc', stPred ? { p: 1, n: 'predicted' } : undefined) : NONE('no standard state in PubChem');
  if (superheavy && F.phase && /solid|liquid|gas/i.test(cleanText(F.phase))) {
    // never made in bulk: use the predicted phase given with Wikipedia's predicted melting/boiling points
    const wph = cleanText(F.phase).toLowerCase().match(/solid|liquid|gas/)[0];
    f.state = V(wph, 'wp', { p: 1, n: 'predicted', alt: wph !== stateVal && stateVal ? `PubChem: "${st}"` : undefined });
  }
  const wmp = wpNumber(F, 'melting point K'), wbp = wpNumber(F, 'boiling point K'), wsub = wpNumber(F, 'sublimation point K');
  const wpEmpty = key => key in F && cleanText(F[key]) === '';
  const estFlag = (w, key) => ((w && w.predicted) || stPred ? { p: 1, n: 'predicted or estimated' } : wpEmpty(key) ? { p: 1, n: 'not measured: estimate (Wikipedia leaves this field empty)' } : undefined);
  const mpPC = num(pc.MeltingPoint), bpPC = num(pc.BoilingPoint), dPC = num(pc.Density);
  f.mp = mpPC != null ? V(mpPC, 'pc', estFlag(wmp, 'melting point K')) : wmp && wmp.v != null ? V(wmp.v, 'wp', wmp.predicted || stPred ? { p: 1 } : undefined) : NONE('no melting point in PubChem or the Wikipedia infobox');
  f.bp = bpPC != null ? V(bpPC, 'pc', estFlag(wbp, 'boiling point K')) : wbp && wbp.v != null ? V(wbp.v, 'wp', wbp.predicted || stPred ? { p: 1 } : undefined) : NONE('no boiling point in PubChem or the Wikipedia infobox');
  if (wsub && wsub.v != null) f.sub = V(wsub.v, 'wp', { n: 'sublimation point at 1 atm' });
  let wdens = ['density', 'density gpcm3nrt'].map(k => wpNumber(F, k)).find(x => x && x.v != null);
  if (stateVal === 'gas') { const g = wpNumber(F, 'density gplstp'); wdens = g && g.v != null ? { ...g, v: g.v / 1000 } : null; }
  const densPred = isPredictedText(F['density gpcm3nrt comment']) || isPredictedText(F['density comment']) || stPred;
  f.density = dPC != null ? V(dPC, 'pc', densPred ? { p: 1, n: 'predicted or estimated' } : stateVal === 'gas' ? { n: 'gas at 0 °C, 1 atm' } : undefined)
    : wdens ? V(wdens.v, 'wp', densPred ? { p: 1 } : undefined) : NONE('no density in PubChem or the Wikipedia infobox');

  // fact-check corrections (source wins; explanation kept in flags.alt)
  for (const fx of FIX.values.filter(x => x.sym === sym)) {
    const prev = f[fx.field];
    if ('value' in fx && fx.value === null) f[fx.field] = [null, 'none', { n: fx.why }];
    else if (fx.from) {
      const w = wpNumber(F, fx.from);
      let val = w && w.v;
      if (fx.field === 'state') val = cleanText(F[fx.from]).toLowerCase().match(/solid|liquid|gas/)?.[0] ?? null;
      if (val == null) { warn('fact-check fix: no value in', fx.from, 'for', sym); continue; }
      f[fx.field] = V(val, 'wp', { p: fx.flag === 'p' ? 1 : undefined, alt: fx.why });
    } else if (fx.flag === 'p' && prev && prev[0] != null) f[fx.field] = V(prev[0], prev[1], { ...(prev[2] || {}), p: 1, alt: fx.why });
  }

  // second sources for the cross-check (pc, wp, CRC) — never the primary's own source
  const mdlPT = (MDL_PT.get(Z) || []).filter(r => !r.is_transition);
  const mdlMain = mdlPT[0];
  const second = {
    mp: [mpPC != null && V(mpPC, 'pc'), wmp && wmp.v != null && V(wmp.v, 'wp'), mdlMain && mdlMain.melting_point != null && V(round(mdlMain.melting_point, 6), 'mdl-crc')],
    bp: [bpPC != null && V(bpPC, 'pc'), wbp && wbp.v != null && V(wbp.v, 'wp'), mdlMain && mdlMain.boiling_point != null && V(round(mdlMain.boiling_point, 6), 'mdl-crc')],
    density: [dPC != null && V(dPC, 'pc'), wdens && V(wdens.v, 'wp'), mdl.density != null && V(mdl.density, 'mdl-crc')],
  };
  for (const [k, list] of Object.entries(second)) for (const b of list) if (b) ccAdd(Z, k, f[k], b);

  // ---- radii, abundance
  f.rCov = mdl.covalent_radius_cordero != null ? V(round(mdl.covalent_radius_cordero, 4), 'mdl-cordero', ['Mn', 'Fe', 'Co'].includes(sym) ? { n: "mean of Cordero's low-spin and high-spin radii (as stored by mendeleev)" } : undefined) : NONE('not in Cordero 2008 (via mendeleev)');
  f.rVdw = mdl.vdw_radius_alvarez != null ? V(round(mdl.vdw_radius_alvarez, 4), 'mdl-alvarez') : NONE('not in Alvarez 2013 (via mendeleev)');
  f.abund = mdl.abundance_crust != null ? V(mdl.abundance_crust, 'mdl-crc', { n: "mass fraction in Earth's crust" }) : NONE('no crustal abundance in CRC (via mendeleev)');

  // ---- discovery, natural/synthetic
  if (!f.year) {
    const yd = pc.YearDiscovered;
    f.year = yd ? V(/ancient/i.test(yd) ? 'ancient' : Number(yd), 'pc') : NONE('no discovery year in PubChem');
  }
  if (mdl.discoverers) f.discoverers = V(mdl.discoverers.replace(/\.$/, ''), 'mdl', mdl.discovery_location ? { n: mdl.discovery_location } : undefined);
  const trace = NATURAL.traceNames.includes(iupac);
  f.natural = V(Z >= 95 ? 'synthetic' : trace ? 'trace' : 'natural', 'wp-syn');

  // ---- effective nuclear charge per occupied subshell
  const zeff = {};
  const sc = MDL_SC.get(Z);
  for (const s of subs) {
    const key = subshellName(s.n, s.l);
    if (sc && sc.has(key)) zeff[key] = V(round(Z - sc.get(key), 5), 'mdl-clementi', { n: Z <= 36 ? 'Clementi & Raimondi 1963' : 'Clementi, Raimondi & Reinhardt 1967' });
    else zeff[key] = V(round(slaterZeff(Z, subs, s.n, s.l), 4), 'calc', { n: "Slater's rules (Slater 1930)", p: 1 });
  }

  // ---- crystal structures (Wikipedia numbers) and the sample-view lattice
  const structs = [];
  for (const suf of ['', ' 2', ' 3', ' 4']) {
    const name = F['crystal structure' + suf];
    if (!name || !cleanText(name)) continue;
    const latRaw = F['lattice constant' + suf] || F['lattice constants' + suf] || '';
    const prefix = cleanText(F['crystal structure' + suf + ' prefix'] || '');
    let pearson = cleanText(F['crystal structure' + suf + ' Pearson symbol'] || '') || null;
    let proto = protoFor(cleanText(name), pearson);
    if (proto && PROTO_PEARSON[proto] && pearson && pearson !== PROTO_PEARSON[proto]) {
      // Same centring letter but more atoms (e.g. P cI232, Mn cI58): the name describes the Bravais
      // lattice of a complex structure, not the 2-atom bcc structure -> no prototype.
      // Different centring letter (Ra: "body-centred cubic" with cF4): the Pearson symbol is the typo
      // (Gemini fact-check: Ra is cI2) -> keep the prototype, correct the symbol.
      if (pearson.slice(0, 2) === PROTO_PEARSON[proto].slice(0, 2)) proto = null;
      else { warn(`${sym}: Pearson ${pearson} contradicts "${cleanText(name)}"; using ${PROTO_PEARSON[proto]}`); pearson = PROTO_PEARSON[proto]; }
    }
    structs.push({
      proto, pearson: pearson || (proto ? PROTO_PEARSON[proto] : null), prefix,
      greek: (prefix.match(/[αβγδε]/) || [])[0] || null,
      predicted: superheavy || isPredictedText(F['crystal structure' + suf + ' comment']) || isPredictedText(name),
      lat: parseLattice(latRaw), latRefs: refsOf(latRaw, wp.raw),
    });
  }
  const lat = buildLattice({ Z, sym, structs, subs });
  const mainS = structs[0];
  if (lat.out.kind === 'lattice') {
    const p = lat.out.phases.find(x => x.id === lat.out.def) || lat.out.phases[0];
    f.crystal = V(p.name, p.cellSrc.startsWith('cod-') || p.cellSrc === 'wp' ? 'wp' : p.cellSrc, p.cellNote ? { n: p.cellNote } : undefined);
    f.latticeText = V(latText(p.cell) + (p.cond ? ` (${p.cond})` : ''), p.cellSrc, p.cellNote ? { n: p.cellNote } : undefined);
  } else if (mainS) {
    const nm = structName(mainS.proto, mainS.pearson);
    f.crystal = nm ? V(nm, 'wp', mainS.predicted ? { p: 1, n: 'predicted' } : undefined) : NONE('structure not described in our sources');
  } else f.crystal = NONE('no crystal structure in our sources');

  // ---- 1-atm phase model for the sample view
  const ph = {};
  if (Z === 2) { ph.noSolid = V(true, 'wpa', { n: 'helium does not solidify at normal pressure (Wikipedia: Helium); CRC (mendeleev) lists no 1-atm melting point' }); ph.bp = f.bp; }
  else if (f.sub) { ph.sub = f.sub; if (mdlMain && mdlMain.is_sublimation_point) ph.subCheck = V(round(mdlMain.boiling_point, 6), 'mdl-crc', { n: 'CRC sublimation point' }); }
  else { ph.mp = f.mp; ph.bp = f.bp; }
  if (lat.trans) ph.trans = lat.trans;
  const gasN = FIX.gas[sym];
  ph.gas = gasN ? V(gasN, 'fc', { n: gasN === 2 ? `${sym}₂ molecules` : `${sym}${gasN === 4 ? '₄' : '₈'} molecules near the boiling point` })
    : V(1, 'model', { n: 'gas drawn as single atoms (monatomic vapour)' });

  // ---- spectrum (a handful of NIST lines)
  const ln = linesFor(Z, sym, NIST_IE.get(Z)?.get(0)?.ie ?? null);
  const lines = ln.none ? { none: ln.none } : clean({ basis: ln.basis, n: ln.total, used: ln.used, ex: ln.dropped || undefined, glow: ln.glow, v: ln.v });

  // the element card's first line: our own words, checked against the Wikipedia lead (REDESIGN-PLAN §2, QUESTIONS Q17)
  const ln1 = LINES[sym];
  const line = ln1 ? V({ en: ln1.en, vi: ln1.vi }, 'lines', { n: `checked against Wikipedia: ${ln1.wiki} (revision ${ln1.rev})`, url: `https://en.wikipedia.org/w/index.php?oldid=${ln1.rev}`, check: ln1.check }) : undefined;
  elements.push({ Z, sym, names, f, cfg: subs.map(s => [s.n, s.l, s.occ]), zeff, ph, lat: lat.out, lines, ...(line ? { line } : {}), wpRev: wp ? wp.revid : null, col32: L.col32, fIndex: L.fIndex });
}

// ---------------------------------------------------------------------------------------------
function xrayDensity(cell, nAtoms, Z) {
  const M = (CIAAW_AB.get(Z) && num(CIAAW_AB.get(Z).value.split(/\s/)[0])) || (NUBASE.get(Z) || []).filter(x => x.hlSec).sort((a, b) => b.hlSec - a.hlSec)[0]?.A;
  const V_cm3 = cellVolume(cell) * 1e-30; // pm^3 -> cm^3
  return M ? (nAtoms * M) / (CODATA.NA * V_cm3) : null;
}

// A COD entry by id (fetched raw file): cell in pm, full conventional-cell sites, temperature, source key
function codById(id) {
  const cif = parseCIF(readRaw(`cod/${id}.cif`));
  let sites = expandSites(cif), cell = { ...cif.cell };
  if (cif.sgNumber >= 143 && cif.sgNumber <= 167 && Math.abs(cell.gamma - 120) > 1e-3 && Math.abs(cell.alpha - cell.beta) < 1e-6) ({ cell, sites } = rhombToHex(cell, sites));
  const pm = Object.fromEntries(Object.entries({ a: cell.a * 100, b: cell.b * 100, c: cell.c * 100, alpha: cell.alpha, beta: cell.beta, gamma: cell.gamma }).map(([k, v]) => [k, round(v, 6)]));
  return { cell: pm, sites: sites.map(p => p.map(v => round(v, 5))), T: cif.T, sgNumber: cif.sgNumber, sg: cif.sg, key: addCodSource(id, cif) };
}
/** Pearson symbol from the space group (number + Hermann–Mauguin centring letter) and the atom count. */
function pearsonOf(sgNumber, sg, n) {
  const fam = sgNumber <= 2 ? 'a' : sgNumber <= 15 ? 'm' : sgNumber <= 74 ? 'o' : sgNumber <= 142 ? 't' : sgNumber <= 194 ? 'h' : 'c';
  let cen = String(sg || 'P').trim()[0].toUpperCase();
  if (cen === 'C' || cen === 'A' || cen === 'B') cen = 'S';
  return `${fam}${cen}${n}`;
}
/** Apply the high-temperature phase sequence from data/curated/phases-highT.json. */
function applyHighT(sym, phases, out) {
  const H = HIT[sym];
  if (!H) return null;
  if (H.note) { out.hiNote = V(H.note, 'ans', { n: 'RESEARCH.md Answers Q8' }); return null; }
  const mid = v => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v);
  const base = phases.find(p => p.id === out.def);
  if (!base.label) base.label = `α-${sym}`;
  const steps = H.steps;
  const Ts = steps.map(st => round(mid(st.T_C) + K0, 6));
  base.T = [0, Ts[0]];
  const trans = [];
  let prev = base.label || sym;
  steps.forEach((st, i) => {
    const T = Ts[i], Tnext = i + 1 < steps.length ? Ts[i + 1] : null;
    let ph;
    if (st.cod) {
      const c = codById(st.cod);
      const proto = c.sgNumber === 229 ? 'bcc' : c.sgNumber === 225 ? 'fcc' : null;
      const pearson = pearsonOf(c.sgNumber, c.sg, c.sites.length);
      ph = { id: `h${i}`, label: st.to, name: structName(proto, pearson), pearson, proto, cell: c.cell, cellSrc: c.key, cellNote: `COD ${st.cod}`, cond: c.T ? `${c.T} K` : null,
        sites: c.sites, sitesSrc: c.key, dNN: round(nearestNeighbour(c.cell, c.sites), 5), cn: coordination(c.cell, c.sites), T: [T, Tnext] };
    } else ph = { id: `h${i}`, label: st.to, card: st.card, src: 'ans', note: st.cite, T: [T, Tnext] };
    phases.push(ph);
    const tc = Array.isArray(st.T_C) ? `${st.T_C[0]}–${st.T_C[1]} °C` : `${st.T_C} °C`;
    trans.push({ T: V(T, 'ans', { n: `${prev} → ${st.to} at ${tc} (${st.cite})` }), to: ph.id });
    prev = st.to;
  });
  return trans;
}

function buildLattice({ Z, sym, structs }) {
  const mainS = structs[0];
  const structure = mainS ? structName(mainS.proto, mainS.pearson) : null;
  if (Z === 2) return { out: { kind: 'nosolid', structure: structName('hcp'), src: 'wpa' } };
  if (MOLECULAR.includes(sym)) return { out: { kind: 'molecular', structure, src: 'spec' } };
  if (COMPLEX.includes(sym)) return { out: { kind: 'complex', structure, atoms: mainS?.pearson ? Number((mainS.pearson.match(/\d+/) || [])[0]) : null, src: 'spec' } };
  if (Z >= 100 || !mainS || mainS.predicted) return { out: { kind: 'predicted', structure, src: Z >= 100 ? 'fc' : 'wp' } };

  const cod = COD.get(sym) || [];
  const phases = [];
  const fixLat = FIX.lattices[sym];
  structs.forEach((s, i) => {
    if (s.predicted) return;
    const proto = s.proto;
    const pearson = s.pearson || (proto === 'sc' ? 'cP1' : null);
    const sgs = PEARSON_SG[pearson] || [];
    const codE = cod.find(c => sgs.includes(c.sgNumber) && c.phase !== 'gamma-Fe' && c.phase !== 'delta-Fe' && (proto !== 'graphite' || c.cell.c / c.cell.a > 2) && (proto !== 'diamond' || c.sgNumber === 227));
    const w = s.lat || {};
    let cell = null;
    if (w.ah && w.ch) cell = { a: w.ah, b: w.ah, c: w.ch, alpha: 90, beta: 90, gamma: 120 };
    else if (w.a) {
      const hexLike = ['hcp', 'dhcp', 'graphite'].includes(proto) || ['hP3', 'hR1', 'hR2', 'hR3'].includes(pearson);
      const tetra = /^t/.test(pearson || '');
      if (['bcc', 'fcc', 'diamond', 'sc'].includes(proto)) cell = { a: w.a, b: w.a, c: w.a, alpha: 90, beta: 90, gamma: 90 };
      else if (hexLike) cell = { a: w.a, b: w.a, c: w.c, alpha: 90, beta: 90, gamma: 120 };
      else if (tetra) cell = { a: w.a, b: w.a, c: w.c, alpha: 90, beta: 90, gamma: 90 };
      else cell = { a: w.a, b: w.b ?? w.a, c: w.c ?? w.a, alpha: w.alpha ?? 90, beta: w.beta ?? 90, gamma: w.gamma ?? 90 };
    }
    let cellSrc = 'wp', cellNote = s.latRefs.join('; ') || undefined, cond = condText(w.cond);
    let sites, sitesSrc;
    if (codE) {
      sites = codE.sites; sitesSrc = codE.key;
      if (cell) {
        let mapped;
        if (codE.cell.gamma === 120) mapped = { a: cell.a, b: cell.a, c: cell.c };
        else if (codE.cell.alpha === 90 && codE.cell.beta === 90 && cell.gamma === 90) {
          const cs = [['a', codE.cell.a], ['b', codE.cell.b], ['c', codE.cell.c]].sort((x, y) => x[1] - y[1]);
          const ws = [cell.a, cell.b, cell.c].sort((x, y) => x - y);
          mapped = {}; cs.forEach(([k], j) => { mapped[k] = ws[j]; });
        } else mapped = { a: cell.a, b: cell.b, c: cell.c };
        const dev = Math.max(...['a', 'b', 'c'].map(k => Math.abs(mapped[k] - codE.cell[k]) / codE.cell[k]));
        if (dev > 0.03) { warn(`${sym}: Wikipedia cell differs from COD ${codE.file} by ${(dev * 100).toFixed(1)}% — using COD cell`); cell = codE.cell; cellSrc = codE.key; cellNote = `COD ${codE.file}`; cond = codE.T ? `${codE.T} K` : null; }
        else cell = { ...mapped, alpha: codE.cell.alpha, beta: codE.cell.beta, gamma: codE.cell.gamma };
      } else { cell = codE.cell; cellSrc = codE.key; cellNote = `COD ${codE.file}`; cond = codE.T ? `${codE.T} K` : null; }
    } else if (proto && PROTOTYPES[proto]) { sites = PROTOTYPES[proto].sites; sitesSrc = 'sym'; }
    if (!cell && i === 0 && fixLat && proto === fixLat.proto) {
      // lattice constants supplied by the fact-check / an article (Cm, Bk, Cf, Es)
      const mid = v => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v);
      const a = mid(fixLat.a), c = fixLat.c != null ? mid(fixLat.c) : a;
      cell = proto === 'dhcp' ? { a, b: a, c, alpha: 90, beta: 90, gamma: 120 } : { a, b: a, c: a, alpha: 90, beta: 90, gamma: 90 };
      cellSrc = fixLat.src; cond = null;
      const rho = xrayDensity(cell, PROTOTYPES[proto].sites.length, Z);
      const pcRho = num(PC.get(Z).Density);
      cellNote = `${fixLat.cite}. ${fixLat.check}${rho ? ` Density from this cell: ${rho.toFixed(2)} g/cm³${pcRho ? ` (PubChem: ${pcRho})` : ''}.` : ''}`;
      if (Array.isArray(fixLat.a)) cellNote += ` Reported ranges: a = ${fixLat.a.join('–')} pm, c = ${fixLat.c.join('–')} pm.`;
    }
    if (!cell && i === 0 && cod.length && !codE) {
      const c = cod[0];
      if (!proto || (PROTOTYPES[proto] && PEARSON_SG[PROTO_PEARSON[proto]]?.includes(c.sgNumber))) { cell = c.cell; cellSrc = c.key; cellNote = `COD ${c.file}`; sites = c.sites; sitesSrc = c.key; cond = c.T ? `${c.T} K` : null; }
    }
    if (!cell || !sites) return;
    const rcell = Object.fromEntries(Object.entries(cell).map(([k, v]) => [k, round(v, 6)]));
    phases.push({
      id: `p${i}`, label: s.greek ? `${s.greek}-${sym}` : null, name: structName(proto, pearson), pearson, proto,
      cell: rcell, cellSrc, cellNote, cond,
      sites: sites.map(p => p.map(v => round(v, 5))), sitesSrc,
      dNN: round(nearestNeighbour(rcell, sites), 5), cn: coordination(rcell, sites),
    });
  });
  if (!phases.length) return { out: { kind: 'nodata', structure, src: 'wp' } };

  const out = { kind: 'lattice', structure: phases[0].name, phases, def: phases[0].id };
  let trans;
  if (sym === 'Fe') {
    const g = structs.find(s => s.greek === 'γ');
    const m = g && g.prefix.match(/(\d+)\s*[–-]\s*(\d+)\s*°C/);
    if (m) {
      const T1 = Number(m[1]) + K0, T2 = Number(m[2]) + K0;
      const alpha = phases[0], gamma = phases.find(p => p.proto === 'fcc');
      const dCod = cod.find(c => c.phase === 'delta-Fe');
      const delta = dCod
        ? { ...alpha, id: 'delta', label: 'δ-Fe', cell: Object.fromEntries(Object.entries(dCod.cell).map(([k, v]) => [k, round(v, 6)])), cellSrc: dCod.key, cellNote: `COD ${dCod.file}`, cond: `${dCod.T} K`, sites: dCod.sites, sitesSrc: dCod.key }
        : { ...alpha, id: 'delta', label: 'δ-Fe', cellSrc: 'placeholder', cellNote: placeholders.deltaFe.note };
      delta.dNN = round(nearestNeighbour(delta.cell, delta.sites), 5); delta.cn = coordination(delta.cell, delta.sites);
      phases.push(delta);
      alpha.T = [0, round(T1, 6)]; gamma.T = [round(T1, 6), round(T2, 6)]; delta.T = [round(T2, 6), null];
      trans = [{ T: V(round(T1, 6), 'wp', { n: `α → γ at ${m[1]} °C` }), to: gamma.id }, { T: V(round(T2, 6), 'wp', { n: `γ → δ at ${m[2]} °C` }), to: 'delta' }];
    } else warn('Fe transition temperatures not found');
  }
  if (sym === 'Sn') {
    const tr = (MDL_PT.get(Z) || []).find(r => r.is_transition);
    const white = phases.find(p => p.proto !== 'diamond'), grey = phases.find(p => p.proto === 'diamond');
    if (tr && white && grey) {
      grey.label = 'α-Sn'; white.label = 'β-Sn';
      grey.T = [0, round(tr.melting_point, 6)]; white.T = [round(tr.melting_point, 6), null];
      trans = [{ T: V(round(tr.melting_point, 6), 'mdl-crc', { n: `grey (α) ↔ white (β) tin at ${round(tr.melting_point - K0, 4)} °C` }), to: white.id }];
      out.def = white.id;
    }
  }
  if (!trans && phases.length > 1 && !HIT[sym]?.steps) phases.slice(1).forEach(p => { p.alt = true; });
  if (sym === 'C') { phases.forEach(p => { p.label = p.proto === 'graphite' ? 'graphite' : 'diamond'; }); }
  if (sym === 'Ce') {
    // Wikipedia "Cerium": γ (fcc) is the stable form from 726 °C down to about room temperature; β (dhcp)
    // is the equilibrium form from about room temperature down to −150 °C. Default γ, β as a toggle.
    const g = phases.find(p => p.proto === 'fcc'), b = phases.find(p => p.proto === 'dhcp');
    if (g && b) {
      out.def = g.id; g.alt = false; b.alt = true; g.label = 'γ-Ce'; b.label = 'β-Ce';
      out.defNote = V('γ-Ce (fcc) is shown by default: it is what room-temperature cerium usually is. β-Ce (dhcp) is the true equilibrium form at 20 °C (β↔γ equilibrium near 75 °C), but γ turns into β only on cooling below about −15 °C (large hysteresis).', 'ans', { n: 'RESEARCH.md Answers Q2: Koskimaki, Gschneidner & Panousis 1974, doi:10.1016/0022-0248(74)90098-0; Wikipedia: Cerium. γ-Ce a = 516.12 pm agrees with COD 9010987.' });
    }
  }
  const hiTrans = applyHighT(sym, phases, out);
  if (hiTrans) trans = (trans || []).concat(hiTrans);
  return { out, trans };
}

// attach cross-check explanations ("other sources say ...") to the values they explain
const ccNotes = curated('crosscheck-notes.json');
for (const [key, note] of Object.entries(ccNotes)) {
  if (key.startsWith('_')) continue;
  const [sym, field] = key.split(':');
  const e = elements.find(x => x.sym === sym);
  if (!e || !e.f[field]) { warn('cross-check note for unknown value', key); continue; }
  const v = e.f[field];
  if (!(v[2] && v[2].alt)) v[2] = { ...(v[2] || {}), alt: note };
}

// ---------------------------------------------------------------------------------------------
const FIELDS = {
  aw: { unit: '', kind: 'num' }, awStd: { kind: 'text' }, massNumber: { kind: 'int' }, nStable: { kind: 'int' }, isoMain: { kind: 'text' },
  halfLife: { unit: 's', kind: 'num' }, halfLifeTent: { unit: 's', kind: 'num' }, nucA: { kind: 'int' }, rNuc: { unit: 'fm', kind: 'num' },
  period: { kind: 'int' }, group: { kind: 'int' }, block: { kind: 'enum' }, cat: { kind: 'enum' },
  config: { kind: 'text' }, term: { kind: 'text' }, madelung: { kind: 'enum' },
  ie1: { unit: 'eV', kind: 'num' }, ie2: { unit: 'eV', kind: 'num' }, ie3: { unit: 'eV', kind: 'num' },
  en: { unit: '', kind: 'num' }, ea: { unit: 'eV', kind: 'num' }, ox: { kind: 'text' },
  state: { kind: 'enum' }, mp: { unit: 'K', kind: 'num' }, bp: { unit: 'K', kind: 'num' }, sub: { unit: 'K', kind: 'num' },
  density: { unit: 'g/cm³', kind: 'num' }, rCov: { unit: 'pm', kind: 'num' }, rVdw: { unit: 'pm', kind: 'num' },
  abund: { unit: 'mg/kg', kind: 'num' }, year: { kind: 'text' }, discoverers: { kind: 'text' }, natural: { kind: 'enum' },
  crystal: { kind: 'text' }, latticeText: { kind: 'text' },
};
const out = {
  meta: {
    schema: 2, built: new Date().toISOString(), generator: 'tools/build-data.mjs',
    value: '[value, sourceKey] or [value, sourceKey, {p: predicted/estimated, th: theoretical, n: note, alt: other sources, t: display text, u: uncertainty, r: NIST reference}]',
    codata: CODATA.version, warnings: warnings.length,
  },
  sources: SOURCES,
  fields: FIELDS,
  categories: ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'metalloid', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide'],
  constants: {
    a0_pm: V(CODATA.a0_m * 1e12, 'codata'), R: V(CODATA.R, 'codata', { n: 'J mol⁻¹ K⁻¹' }), kB: V(CODATA.kB, 'codata', { n: 'J K⁻¹' }),
    u_kg: V(CODATA.u_kg, 'codata'), NA: V(CODATA.NA, 'codata'), h: V(CODATA.h, 'codata'), c: V(CODATA.c, 'codata'), eV_J: V(CODATA.eV_J, 'codata'),
  },
  model: { lindemann: V(0.10, 'ans', { n: 'model parameter: rms thermal displacement ÷ nearest-neighbour distance at the melting point. Literature means: fcc 0.11, bcc 0.13, hcp 0.09 (Gilvarry 1956, doi:10.1103/PhysRev.102.308, as quoted in de With, Chem. Rev. 123, 13713 (2023)); lattice-dynamics values are lower (Shapiro 1970).' }) },
  cmfFit: { v: CMF_FIT, src: 'wp-cie' },
  srgb: { v: SRGB, src: 'w3c' },
  elements,
};
fs.writeFileSync(path.join(ROOT, 'data/elements.json'),
  JSON.stringify({ ...out, elements: undefined }, null, 1).replace(/\n}$/, ',\n "elements": [\n') +
  elements.map(e => '  ' + JSON.stringify(e)).join(',\n') + '\n ]\n}\n');
fs.writeFileSync(path.join(ROOT, 'data/crosscheck.json'), JSON.stringify(crosscheck, null, 0).replace(/\},\{/g, '},\n{') + '\n');
const bytes = fs.statSync(path.join(ROOT, 'data/elements.json')).size;
console.log(`elements.json: ${elements.length} elements, ${(bytes / 1024).toFixed(0)} KB; crosscheck pairs: ${crosscheck.length}; warnings: ${warnings.length}`);
for (const w of warnings) console.log('  warn:', w);
