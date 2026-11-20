#!/usr/bin/env node
// Compile data/raw/* into data/elements.json.
// Every value is [value, sourceKey] or [value, sourceKey, flags]; flags.p = predicted/estimated/theoretical,
// flags.n = note. A missing value is [null, "none", {n: reason}]. Units are defined once in `fields`.
// Nothing here is typed from memory: values come from the raw dumps listed in data/raw/MANIFEST.json,
// from computations whose method is stated, or from data/curated/placeholders.json (flagged, see QUESTIONS.md).
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parseCSV, nistCell, csvObjects } from './lib/csv.mjs';
import { infoboxFields, cleanText, refsOf, isPredictedText, firstNumber, parseLattice } from './lib/wikitext.mjs';
import { parseCIF, expandSites } from './lib/cif.mjs';
import { selectCod, COD_PHASES } from './lib/cod-select.mjs';
import { parseConfig, expandConfig, madelungConfig, configDiff, formatConfig, slaterZeff, subshellName, electronCount } from '../src/physics/config.js';
import { PROTOTYPES, nearestNeighbour, coordination } from '../src/physics/lattice.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = p => path.join(ROOT, 'data', 'raw', p);
const readRaw = (p, enc = 'utf8') => fs.readFileSync(RAW(p), enc);
const manifest = JSON.parse(readRaw('MANIFEST.json'));
const accessedOf = prefix => {
  const d = Object.entries(manifest.files).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v.accessed).sort();
  return d.length ? d[d.length - 1].slice(0, 10) : null;
};
const placeholders = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curated/placeholders.json'), 'utf8'));
const warnings = [];
const warn = (...a) => warnings.push(a.join(' '));
const num = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const round = (v, d = 4) => (v == null ? v : Number(Number(v).toPrecision(d + 2)));
const V = (v, s, flags) => (flags && Object.keys(flags).length ? [v, s, flags] : [v, s]);
const NONE = reason => [null, 'none', { n: reason }];
const K0 = 273.15;

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
const SOURCES = {
  pc: { name: 'PubChem Periodic Table (NCBI / NLM)', url: 'https://pubchem.ncbi.nlm.nih.gov/periodic-table/', data: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON', accessed: accessedOf('pubchem/'), licence: 'NCBI data: no restrictions (US Government); values compiled by PubChem from Jefferson Lab, LANL, NIST and IUPAC/CIAAW' },
  ciaaw: { name: 'IUPAC CIAAW — abridged standard atomic weights', url: 'https://www.ciaaw.org/abridged-atomic-weights.htm', accessed: accessedOf('ciaaw/'), licence: 'facts; cite CIAAW' },
  'ciaaw-full': { name: 'IUPAC CIAAW — standard atomic weights (full table, intervals)', url: 'https://www.ciaaw.org/atomic-weights.htm', accessed: accessedOf('ciaaw/'), licence: 'facts; cite CIAAW' },
  'nist-ie': { name: 'NIST Atomic Spectra Database ver. 5.12 — ground states & ionization energies', url: 'https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html', accessed: accessedOf('nist-asd/ie'), licence: 'NIST SRD 78; cite Kramida, Ralchenko, Reader & NIST ASD Team, NIST Atomic Spectra Database (ver. 5.12)' },
  'nist-lines': { name: 'NIST Atomic Spectra Database ver. 5.12 — lines of neutral atoms, 380–750 nm, air wavelengths', url: 'https://physics.nist.gov/PhysRefData/ASD/lines_form.html', accessed: accessedOf('nist-asd/lines'), licence: 'NIST SRD 78; cite Kramida, Ralchenko, Reader & NIST ASD Team, NIST Atomic Spectra Database (ver. 5.12)' },
  wp: { name: 'Wikipedia element infoboxes (Template:Infobox <element>), values with their cited references', url: 'https://en.wikipedia.org/wiki/Template:Infobox_element', accessed: accessedOf('wikipedia/infobox'), licence: 'CC BY-SA 4.0 (Wikipedia contributors); revision id per element in `wpRev`' },
  'wp-syn': { name: 'Wikipedia: "Synthetic element"', url: 'https://en.wikipedia.org/wiki/Synthetic_element', accessed: accessedOf('wikipedia/article-synthetic'), licence: 'CC BY-SA 4.0' },
  wd: { name: 'Wikidata element labels (en, vi)', url: 'https://www.wikidata.org/', accessed: accessedOf('wikidata/'), licence: 'CC0 1.0' },
  gdpt: { name: 'GDPT-2018 naming rule as reported by Báo Đại Đoàn Kết (13 Vietnamese names kept; others IUPAC)', url: 'https://daidoanket.vn/doi-cach-doc-ten-cac-nguyen-to-hoa-hoc-hoc-sinh-boi-roi-giao-vien-ban-khoan-10233769.html', accessed: accessedOf('vi-gdpt/'), licence: 'facts extracted from a news article; primary source requested (QUESTIONS.md Q7)' },
  'mdl-cordero': { name: `Covalent radii: ${bib.Cordero2008 || 'Cordero 2008'} — via mendeleev v1.3.0`, url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'mendeleev: MIT' },
  'mdl-alvarez': { name: `van der Waals radii: ${bib.Alvarez2013 || 'Alvarez 2013'}; ${bib.Vogt2014 || ''} — via mendeleev v1.3.0`, url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'mendeleev: MIT' },
  'mdl-crc': { name: `CRC Handbook values (${bib.haynes2014crc || 'Haynes 2014'}; ${bib.haynes2016crc || 'Haynes 2016'}) — via mendeleev v1.3.0`, url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'mendeleev: MIT' },
  'mdl-clementi': { name: `Effective nuclear charge: ${bib.Clementi1963 || 'Clementi & Raimondi 1963'}; ${bib.Clementi1967 || 'Clementi et al. 1967'} — via mendeleev v1.3.0`, url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'mendeleev: MIT' },
  mdl: { name: 'mendeleev v1.3.0 element table (discoverers, discovery place)', url: 'https://github.com/lmmentel/mendeleev', accessed: accessedOf('mendeleev/'), licence: 'MIT' },
  iaea: { name: 'IAEA LiveChart of Nuclides — ground states (NUBASE2020 / ENSDF evaluations)', url: 'https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html', accessed: accessedOf('iaea/'), licence: 'cite IAEA Nuclear Data Section, LiveChart of Nuclides' },
  codata: { name: 'CODATA 2022 recommended values (NIST)', url: 'https://physics.nist.gov/cuu/Constants/', accessed: accessedOf('nist-codata/'), licence: 'NIST SRD 121; cite CODATA 2022' },
  cie: { name: 'CIE 1931 2° colour-matching functions (CIE dataset doi:10.25039/CIE.DS.xvudnb9b), sampled every 5 nm', url: 'https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer', accessed: accessedOf('cie/'), licence: 'CC BY-SA 4.0' },
  w3c: { name: 'W3C CSS Color 4 sample code — XYZ (D65) to linear sRGB matrix', url: 'https://drafts.csswg.org/css-color-4/conversions.js', accessed: accessedOf('w3c/'), licence: 'W3C Software and Document License' },
  layout: { name: 'Computed from Z: IUPAC 18-column layout with group 3 = Sc, Y, Lu, Lr (f-block La–Yb, Ac–No)', url: 'https://iupac.org/what-we-do/periodic-table-of-elements/', licence: 'n/a (layout convention)' },
  calc: { name: 'Computed in this project from sourced inputs (method in the note)', url: '', licence: 'n/a' },
  sym: { name: 'Atomic positions fixed by space-group symmetry (no measured parameter needed)', url: '', licence: 'n/a' },
  spec: { name: 'Project scope decision (SPEC.md §5: molecular & complex solids later)', url: '', licence: 'n/a' },
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
      licence: 'COD: CC0 / public domain', doi: r.doi || undefined,
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

// 3. NIST ionization energies (all spectra)
const NIST_IE = new Map(); // Z -> charge -> row
for (const r of parseCSV(readRaw('nist-asd/ie-all.csv')).slice(1)) {
  const c = r.map(nistCell);
  const Z = +c[0], q = +String(c[2]).replace('+', '');
  if (!Z) continue;
  if (!NIST_IE.has(Z)) NIST_IE.set(Z, new Map());
  NIST_IE.get(Z).set(q, { shells: c[5], level: c[6], prefix: c[8], ie: num(c[9]), suffix: c[10], unc: num(c[11]), refs: c[12] });
}
// cores ([Ne], [Cd], [Hg], ...) are defined by NIST's own neutral ground configurations
const CORES = {};
for (const [Z, m] of NIST_IE) { const r = m.get(0); if (r && r.shells) CORES[PC.get(Z).Symbol] = parseConfig(r.shells); }
const CORE_SUBS = Object.fromEntries(Object.keys(CORES).map(s => [s, expandConfig(CORES[s], CORES)]));
const CORE_Z = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

// 4. Wikipedia infoboxes
const WP = new Map();
for (const i of [1, 2, 3]) {
  for (const p of JSON.parse(readRaw(`wikipedia/infobox-batch-${i}.json`)).query.pages) {
    const raw = p.revisions[0].slots.main.content;
    const F = infoboxFields(raw);
    const Z = +(F.number || F.Z);
    WP.set(Z, { F, raw, revid: p.revisions[0].revid, title: p.title });
  }
}
const synArticle = JSON.parse(readRaw('wikipedia/article-synthetic-element.json')).query.pages[0];
const synText = synArticle.revisions[0].slots.main.content;

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

// 7. IAEA ground states
const IAEA = new Map();
for (const r of csvObjects(readRaw('iaea/ground_states_all.csv'))) {
  const Z = +r.z;
  if (!(Z >= 1)) continue;
  if (!IAEA.has(Z)) IAEA.set(Z, []);
  IAEA.get(Z).push({ A: Z + +r.n, stable: r.half_life === 'STABLE', abundance: num(r.abundance), radius: num(r.radius), hl: r.half_life, hlUnit: r.unit_hl, hlSec: num(r.half_life_sec), hlOp: r.operator_hl });
}

// 8. CODATA
const CODATA = (() => {
  const t = readRaw('nist-codata/allascii.txt');
  const get = name => {
    const line = t.split('\n').find(l => l.startsWith(name + ' ') && l.slice(0, 60).trim() === name);
    if (!line) throw new Error('CODATA constant missing: ' + name);
    const val = line.slice(60, 85).replace(/\s/g, '').replace('...', '');
    return Number(val);
  };
  const ver = (t.match(/CODATA\s+(\d{4})/i) || [])[1] || null;
  return {
    version: ver,
    a0_m: get('Bohr radius'), R: get('molar gas constant'), kB: get('Boltzmann constant'), u_kg: get('atomic mass constant'),
    NA: get('Avogadro constant'), h: get('Planck constant'), c: get('speed of light in vacuum'), eV_J: get('electron volt'),
  };
})();
const KJMOL_PER_EV = (CODATA.eV_J * CODATA.NA) / 1000;

// 9. Colour science tables
const CMF = readRaw('cie/CIE_xyz_1931_2deg.csv').trim().split(/\r?\n/).map(l => l.split(',').map(Number))
  .filter(r => r[0] >= 380 && r[0] <= 780 && r[0] % 5 === 0).map(r => [r[0], round(r[1], 5), round(r[2], 5), round(r[3], 5)]);
const SRGB = (() => {
  const t = readRaw('w3c/css-color-4-conversions.js');
  const body = t.slice(t.indexOf('function XYZ_to_lin_sRGB')).split('];')[0];
  const rows = [...body.matchAll(/\[([^\[\]]+)\]/g)].map(m => m[1].split(',').filter(s => s.trim()).map(s => Function(`"use strict";return (${s})`)()));
  if (rows.length !== 3 || rows.some(r => r.length !== 3)) throw new Error('could not read sRGB matrix');
  return rows.map(r => r.map(v => round(v, 7)));
})();

// 10. GDPT-2018 rule: the 13 Vietnamese names that are kept
const GDPT13 = (() => {
  const html = readRaw('vi-gdpt/daidoanket-10233769.html');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const m = text.match(/Tên 13 nguyên tố[^:]*gồm:\s*([^.]+)\./);
  if (!m) throw new Error('GDPT sentence not found');
  const names = m[1].split(/,\s*|\s+và\s+/).map(s => s.trim()).filter(Boolean);
  if (names.length !== 13) throw new Error('expected 13 names, got ' + names.length + ': ' + names.join('|'));
  return { names, sentence: m[0].trim() };
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
const COD = new Map(); // sym -> [{phase, file, sgNumber, cell, sites, T, key}]
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
    if (cif.sgNumber >= 143 && cif.sgNumber <= 167 && Math.abs(cell.gamma - 120) > 1e-3 && Math.abs(cell.alpha - cell.beta) < 1e-6) {
      ({ cell, sites } = rhombToHex(cell, sites));
    }
    const pm = { a: cell.a * 100, b: cell.b * 100, c: cell.c * 100, alpha: cell.alpha, beta: cell.beta, gamma: cell.gamma };
    if (!COD.has(sym)) COD.set(sym, []);
    COD.get(sym).push({ phase: pick.phase, file: pick.file, sgNumber: cif.sgNumber, sg: cif.sg, cell: pm, sites, T: cif.T, key: addCodSource(pick.file, cif) });
  }
}

// 13. NIST lines
function parseJ(s) { if (!s) return null; if (s.includes('/')) { const [a, b] = s.split('/'); return Number(a) / Number(b); } return num(s); }
function linesFor(Z, sym) {
  const rel = `nist-asd/lines/${Z}-${sym}_I.csv`;
  const relNone = `nist-asd/lines/${Z}-${sym}_I.none.txt`;
  if (!fs.existsSync(RAW(rel))) {
    if (fs.existsSync(RAW(relNone))) return { none: 'NIST ASD has no lines for the neutral atom between 380 and 750 nm' };
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
    const intensRaw = c[col('intens')] || '';
    const im = intensRaw.match(/\d+(?:\.\d+)?/);
    const I = im ? Number(im[0]) : null;
    const Aki = num(c[col('Aki(s^-1)')]);
    const Jk = parseJ(c[col('J_k')]);
    const type = c[col('Type')] || '';
    out.push({ lam, obs: obs != null, I, Aki, gA: Aki != null && Jk != null ? (2 * Jk + 1) * Aki : null, type,
      lower: [c[col('conf_i')], c[col('term_i')], c[col('J_i')]].join(' ').trim(), upper: [c[col('conf_k')], c[col('term_k')], c[col('J_k')]].join(' ').trim() });
  }
  const withI = out.filter(x => x.I > 0 && x.obs);
  let basis, ranked;
  if (withI.length >= 3) { basis = 'intensity'; ranked = withI.sort((a, b) => b.I - a.I); }
  else if (out.some(x => x.gA > 0)) { basis = 'gA'; ranked = out.filter(x => x.gA > 0).sort((a, b) => b.gA - a.gA); }
  else { basis = 'none'; ranked = out.slice(); }
  const kept = ranked.slice(0, 40);
  const w = x => (basis === 'intensity' ? x.I : basis === 'gA' ? x.gA : 0);
  const max = Math.max(...kept.map(w), 1e-30);
  const v = kept.sort((a, b) => a.lam - b.lam).map(x => {
    const rel = basis === 'none' ? 0 : Math.max(1, Math.round((1000 * w(x)) / max));
    return [Number(x.lam.toFixed(3)), rel];
  });
  // transitions for the 12 strongest lines (upper -> lower), for the "More" view
  const tr = {};
  for (const x of kept.slice().sort((a, b) => w(b) - w(a)).slice(0, 12)) tr[x.lam.toFixed(3)] = `${x.upper} → ${x.lower}`.replace(/\*/g, '°');
  return { basis, total: out.length, v, tr };
}

// ---------------------------------------------------------------------------------------------
// Layout from Z (IUPAC 18-column form; group 3 = Sc, Y, Lu, Lr)
export function layoutOf(Z) {
  const starts = [1, 3, 11, 19, 37, 55, 87, 119];
  let period = 1;
  while (Z >= starts[period]) period++;
  const idx = Z - starts[period - 1];
  let group = null, block, fIndex = null;
  if (period === 1) { group = Z === 1 ? 1 : 18; block = 's'; }
  else if (period <= 3) { group = idx < 2 ? idx + 1 : idx + 11; block = idx < 2 ? 's' : 'p'; }
  else if (period <= 5) { group = idx + 1; block = idx < 2 ? 's' : idx < 12 ? 'd' : 'p'; }
  else {
    if (idx < 2) { group = idx + 1; block = 's'; }
    else if (idx < 16) { fIndex = idx - 2; block = 'f'; }
    else { group = idx - 13; block = group <= 12 ? 'd' : 'p'; }
  }
  // 32-column index
  let col32;
  if (period === 1) col32 = Z === 1 ? 0 : 31;
  else if (block === 's') col32 = group - 1;
  else if (block === 'f') col32 = 2 + fIndex;
  else col32 = group + 13; // group 3 -> 16 ... group 18 -> 31
  return { period, group, block, fIndex, col32 };
}

// ---------------------------------------------------------------------------------------------
const CATS = { 'Alkali metal': 'alkali', 'Alkaline earth metal': 'alkaline-earth', 'Transition metal': 'transition', 'Post-transition metal': 'post-transition', Lanthanide: 'lanthanide', Actinide: 'actinide', Metalloid: 'metalloid', Nonmetal: 'nonmetal', Halogen: 'halogen', 'Noble gas': 'noble-gas' };
const MOLECULAR = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'P', 'S']; // SPEC §5 "Later"
const COMPLEX = ['B', 'Mn']; // SPEC §5 "Later"
const PEARSON_SG = { cI2: [229], cF4: [225], hP2: [194], hP4: [194], cF8: [227], hR1: [166], hR2: [166], hR3: [166], hP3: [152, 154], tI2: [139], tI4: [141], oS8: [64], oS4: [63], oP8: [62], mP16: [11], cP1: [221] };

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

const fmtT = K => `${round(K - K0, 5)} °C`;

function wpNumber(F, key) {
  const raw = F[key];
  if (raw == null || cleanText(raw) === '') return null;
  return { v: firstNumber(raw), text: cleanText(raw), predicted: isPredictedText(F[`${key.replace(/ K$/, '')} comment`]) || isPredictedText(raw) };
}

const elements = [];
const crosscheck = [];
const CC = (Z, field, a, b, note) => { if (a && b && a[0] != null && b[0] != null) crosscheck.push({ Z, field, a, b, note }); };

for (const Z of ZS) {
  const pc = PC.get(Z);
  const sym = pc.Symbol;
  const wp = WP.get(Z);
  const F = wp ? wp.F : {};
  const mdl = MDL.get(Z) || {};
  const wd = WD.get(Z) || {};
  const f = {};

  // ---- names
  const iupac = (wd.en || pc.Name).toLowerCase();
  const gd = GDPT13.names.find(n => fold(n) === fold(wd.vi));
  const names = {
    en: V(iupac.charAt(0).toUpperCase() + iupac.slice(1), 'wd'),
    alias: V(pc.Name, 'pc'),
    vi: gd ? V(gd.toLowerCase(), 'gdpt') : V(iupac, 'gdpt', { n: 'IUPAC name (GDPT-2018 rule)' }),
    viAlt: gd ? V(iupac, 'gdpt', { n: 'English (IUPAC) annotation' }) : (wd.vi && fold(wd.vi) !== fold(iupac) ? V(wd.vi, 'wd', { n: 'Vietnamese Wikipedia / Wikidata name' }) : null),
  };

  // ---- layout + category
  const L = layoutOf(Z);
  f.period = V(L.period, 'layout');
  f.group = L.group == null ? NONE('f-block elements have no group number in the 18-column table') : V(L.group, 'layout');
  f.block = V(L.block, 'layout');
  f.cat = V(CATS[pc.GroupBlock], 'pc', { n: `PubChem GroupBlock "${pc.GroupBlock}"` });
  if (!CATS[pc.GroupBlock]) warn('unknown category', sym, pc.GroupBlock);

  // ---- atomic weight
  const ab = CIAAW_AB.get(Z);
  const full = CIAAW_FULL.get(Z);
  const abm = ab && ab.value.match(/^([\d.]+)\s*±\s*([\d.]+)/);
  if (abm) f.aw = V(Number(abm[1]), 'ciaaw', { t: abm[1], u: Number(abm[2]) });
  else f.aw = NONE('no standard atomic weight: the element has no stable isotopes (see longest-lived isotope)');
  if (full && full.value && full.value !== '—') f.awStd = V(full.value.replace(/\s(?=\d)/g, ''), 'ciaaw-full', full.notes ? { n: `CIAAW notes: ${full.notes}` } : undefined);
  CC(Z, 'aw', f.aw, num(pc.AtomicWeight) != null ? V(num(pc.AtomicWeight), 'pc') : null);

  // ---- isotopes (IAEA)
  const iso = IAEA.get(Z) || [];
  const stable = iso.filter(x => x.stable);
  f.nStable = V(stable.length, 'iaea');
  const main = stable.slice().sort((a, b) => (b.abundance || 0) - (a.abundance || 0))[0];
  let nucA = null, nucR = null;
  if (main) {
    f.isoMain = V(`${main.A}${sym}`, 'iaea', { n: main.abundance != null ? `natural abundance ${main.abundance} %` : 'abundance not listed' });
    nucA = main.A; nucR = main.radius;
  }
  const longest = iso.filter(x => !x.stable && x.hlSec > 0).sort((a, b) => b.hlSec - a.hlSec)[0];
  if (!stable.length) {
    if (longest) {
      f.massNumber = V(longest.A, 'iaea', { n: 'mass number of the longest-lived known isotope' });
      f.halfLife = V(longest.hlSec, 'iaea', { t: `${longest.hlOp && longest.hlOp !== 'EQ' ? longest.hlOp + ' ' : ''}${longest.hl} ${longest.hlUnit}`, A: longest.A });
      nucA = longest.A; nucR = longest.radius;
    } else f.halfLife = NONE('no half-life in IAEA LiveChart');
  }
  if (nucA) {
    f.nucA = V(nucA, 'iaea', { n: main ? 'most abundant stable isotope' : 'longest-lived isotope' });
    if (nucR) f.rNuc = V(nucR, 'iaea', { n: `rms charge radius of ${nucA}${sym}` });
    else {
      const r0 = placeholders.nuclearR0_fm;
      f.rNuc = V(round(r0.value * Math.cbrt(nucA), 3), 'placeholder', { p: 1, n: `estimate R = r0·A^(1/3) with r0 = ${r0.value} fm (${r0.q}); no measured charge radius for ${nucA}${sym}` });
    }
  }

  // ---- electron configuration (NIST; PubChem for the rest)
  const nist0 = NIST_IE.get(Z)?.get(0);
  // "unobserved": NIST gives only a theoretical "( )" or extrapolated "[ ]" ionization energy AND ASD has
  // no observed lines of the neutral atom in 380-750 nm. Only then are NIST values treated as predictions.
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
    const ok = CORE_SUBS[c].every(cs => subs.some(s => s.n === cs.n && s.l === cs.l && s.occ === cs.occ));
    if (ok) { core = c; break; }
  }
  f.config = V(formatConfig(subs, { core, coreSubs: core ? CORE_SUBS[core] : null }), cfgSrc, cfgFlags);
  if (nist0?.level) f.term = V(nist0.level, 'nist-ie');
  const mad = madelungConfig(Z);
  const diff = configDiff(mad, subs);
  f.madelung = V(diff.length ? 'exception' : 'follows', 'calc', diff.length
    ? { n: `aufbau (n+l) order predicts ${formatConfig(mad, { core, coreSubs: core ? CORE_SUBS[core] : null })}`, d: diff.map(d => `${subshellName(d.n, d.l)}: ${d.from}→${d.to}`) }
    : { n: 'configuration matches the aufbau (n+l, then n) order' });
  if (cfgSrc === 'nist-ie' && pc.ElectronConfiguration) {
    try {
      const pcs = expandConfig(parseConfig(pc.ElectronConfiguration), CORES);
      if (configDiff(pcs, subs).length) crosscheck.push({ Z, field: 'config', a: [f.config[0], 'nist-ie'], b: [pc.ElectronConfiguration, 'pc'], text: true });
    } catch (e) { warn('pubchem config parse', sym, e.message); }
  }

  // ---- ionization energies (NIST)
  for (const q of [0, 1, 2]) {
    const r = NIST_IE.get(Z)?.get(q);
    const key = `ie${q + 1}`;
    if (r && r.ie != null) {
      const fl = {};
      if (r.prefix === '(') { fl.th = 1; fl.n = 'theoretical value (NIST: in parentheses)'; }
      if (r.prefix === '[') { fl.th = 1; fl.n = 'semi-empirical / extrapolated value (NIST: in brackets)'; }
      if (fl.th && q === 0 && unobserved) fl.p = 1;
      if (fl.th && q > 0 && Z >= 100) fl.p = 1;
      if (r.unc != null) fl.u = r.unc;
      if (r.refs) fl.r = r.refs; // NIST bibliography reference code(s)
      f[key] = V(r.ie, 'nist-ie', fl);
    } else if (q === 0) {
      const pcIE = num(pc.IonizationEnergy);
      f[key] = pcIE != null ? V(pcIE, 'pc') : NONE('no ionization energy in NIST ASD or PubChem');
    }
  }
  CC(Z, 'ie1', f.ie1, num(pc.IonizationEnergy) != null ? V(num(pc.IonizationEnergy), 'pc') : null);
  if (F['ionization energy 1']) {
    const kj = firstNumber(F['ionization energy 1']);
    if (kj) CC(Z, 'ie1', f.ie1, V(round(kj / KJMOL_PER_EV, 5), 'wp', { n: `${kj} kJ/mol converted with CODATA e·N_A` }));
  }

  // ---- electronegativity, electron affinity, oxidation states
  f.en = num(pc.Electronegativity) != null ? V(num(pc.Electronegativity), 'pc', { n: 'Pauling scale' }) : NONE('no Pauling electronegativity in PubChem');
  CC(Z, 'en', f.en, mdl.en_pauling != null ? V(mdl.en_pauling, 'mdl-crc') : null);
  f.ea = num(pc.ElectronAffinity) != null ? V(num(pc.ElectronAffinity), 'pc') : NONE('no electron affinity in PubChem');
  CC(Z, 'ea', f.ea, mdl.electron_affinity != null ? V(mdl.electron_affinity, 'mdl-crc') : null);
  f.ox = pc.OxidationStates ? V(pc.OxidationStates.replace(/\s+/g, ' '), 'pc') : NONE('no oxidation states in PubChem');

  // ---- state, melting/boiling, density
  const st = pc.StandardState || '';
  const stateVal = /gas/i.test(st) ? 'gas' : /liquid/i.test(st) ? 'liquid' : /solid/i.test(st) ? 'solid' : null;
  f.state = stateVal ? V(stateVal, 'pc', /expected/i.test(st) ? { p: 1, n: `PubChem: "${st}"` } : undefined) : NONE('no standard state in PubChem');
  const wmp = wpNumber(F, 'melting point K'), wbp = wpNumber(F, 'boiling point K'), wsub = wpNumber(F, 'sublimation point K');
  const pred = (w, extra) => (w && w.predicted) || extra;
  const mpPC = num(pc.MeltingPoint), bpPC = num(pc.BoilingPoint), dPC = num(pc.Density);
  const stPred = /expected/i.test(st);
  // The infobox has the field but leaves it empty = Wikipedia editors consider the value unknown.
  const wpEmpty = key => key in F && cleanText(F[key]) === '';
  const estNote = 'predicted/estimated (Wikipedia infobox comment or PubChem "expected" state)';
  const emptyNote = 'PubChem gives a value, but the Wikipedia infobox leaves this field empty (not measured): treated as an estimate';
  const flagFor = (w, key) => (pred(w, stPred) ? { p: 1, n: estNote } : wpEmpty(key) ? { p: 1, n: emptyNote } : undefined);
  f.mp = mpPC != null ? V(mpPC, 'pc', flagFor(wmp, 'melting point K'))
    : wmp && wmp.v != null ? V(wmp.v, 'wp', wmp.predicted ? { p: 1, n: wmp.text } : { n: wmp.text }) : NONE('no melting point in PubChem or the Wikipedia infobox');
  f.bp = bpPC != null ? V(bpPC, 'pc', flagFor(wbp, 'boiling point K'))
    : wbp && wbp.v != null ? V(wbp.v, 'wp', wbp.predicted ? { p: 1, n: wbp.text } : { n: wbp.text }) : NONE('no boiling point in PubChem or the Wikipedia infobox');
  if (wsub && wsub.v != null) f.sub = V(wsub.v, 'wp', { n: `sublimation point at 1 atm: ${wsub.text}` });
  let wdens = ['density', 'density gpcm3nrt'].map(k => wpNumber(F, k)).find(x => x && x.v != null);
  if (stateVal === 'gas') { // gases: the infobox gives g/L at STP
    const g = wpNumber(F, 'density gplstp');
    wdens = g && g.v != null ? { ...g, v: g.v / 1000, text: `${g.text} g/L at STP` } : null;
  }
  const densPred = isPredictedText(F['density gpcm3nrt comment']) || isPredictedText(F['density comment']);
  f.density = dPC != null ? V(dPC, 'pc', (densPred || stPred) ? { p: 1, n: 'predicted/estimated (Wikipedia infobox comment)' } : (stateVal === 'gas' ? { n: 'gas at 0 °C, 1 atm' } : undefined))
    : wdens ? V(wdens.v, 'wp', { p: densPred ? 1 : undefined, n: wdens.text }) : NONE('no density in PubChem or the Wikipedia infobox');
  if (f.density[2] && f.density[2].p === undefined) delete f.density[2].p;
  const mdlPT = (MDL_PT.get(Z) || []).filter(r => !r.is_transition);
  const mdlMain = mdlPT[0];
  if (wmp && wmp.v != null) CC(Z, 'mp', f.mp, V(wmp.v, 'wp', { n: wmp.text }));
  if (mdlMain && mdlMain.melting_point != null) CC(Z, 'mp', f.mp, V(round(mdlMain.melting_point, 6), 'mdl-crc', mdlMain.allotrope ? { n: mdlMain.allotrope } : undefined));
  if (wbp && wbp.v != null) CC(Z, 'bp', f.bp, V(wbp.v, 'wp', { n: wbp.text }));
  if (mdlMain && mdlMain.boiling_point != null) CC(Z, 'bp', f.bp, V(round(mdlMain.boiling_point, 6), 'mdl-crc', mdlMain.allotrope ? { n: mdlMain.allotrope } : undefined));
  if (wdens) CC(Z, 'density', f.density, V(wdens.v, 'wp', { n: wdens.text }));
  if (mdl.density != null) CC(Z, 'density', f.density, V(mdl.density, 'mdl-crc'));

  // ---- radii, abundance
  f.rCov = mdl.covalent_radius_cordero != null ? V(round(mdl.covalent_radius_cordero, 4), 'mdl-cordero', ['Mn', 'Fe', 'Co'].includes(sym) ? { n: 'mendeleev stores the mean of Cordero\'s low-spin and high-spin radii for this element' } : undefined) : NONE('not in Cordero 2008 (via mendeleev)');
  if (F['covalent radius']) { const w = firstNumber(F['covalent radius']); if (w) CC(Z, 'rCov', f.rCov, V(w, 'wp', { n: cleanText(F['covalent radius']) })); }
  f.rVdw = mdl.vdw_radius_alvarez != null ? V(round(mdl.vdw_radius_alvarez, 4), 'mdl-alvarez') : NONE('not in Alvarez 2013 (via mendeleev)');
  f.abund = mdl.abundance_crust != null ? V(mdl.abundance_crust, 'mdl-crc', { n: 'mass fraction in Earth\'s crust' }) : NONE('no crustal abundance in CRC (via mendeleev)');

  // ---- discovery, natural/synthetic
  const yd = pc.YearDiscovered;
  f.year = yd ? V(/ancient/i.test(yd) ? 'ancient' : Number(yd), 'pc') : NONE('no discovery year in PubChem');
  if (mdl.discoverers) f.discoverers = V(mdl.discoverers.replace(/\.$/, ''), 'mdl', mdl.discovery_location ? { n: mdl.discovery_location } : undefined);
  const trace = NATURAL.traceNames.includes(iupac);
  f.natural = V(Z >= 95 ? 'synthetic' : trace ? 'trace' : 'natural', 'wp-syn', { n: Z >= 95 ? 'atomic numbers 95–118 are synthetic' : trace ? 'first made artificially, later found in nature in trace amounts' : 'atomic numbers 1–94 occur naturally (at least in traces)' });

  // ---- effective nuclear charge per occupied subshell
  const zeff = {};
  const sc = MDL_SC.get(Z);
  for (const s of subs) {
    const key = subshellName(s.n, s.l);
    if (sc && sc.has(key)) zeff[key] = V(round(Z - sc.get(key), 5), 'mdl-clementi');
    else zeff[key] = V(round(slaterZeff(Z, subs, s.n, s.l), 4), 'calc', { n: "Slater's rules (Slater 1930)", p: 1 });
  }

  // ---- crystal structures (Wikipedia) and the sample-view lattice
  const structs = [];
  for (const suf of ['', ' 2', ' 3', ' 4']) {
    const name = F['crystal structure' + suf];
    if (!name || !cleanText(name)) continue;
    const latRaw = F['lattice constant' + suf] || F['lattice constants' + suf] || '';
    structs.push({
      name: cleanText(name).replace(/\(predicted\)|\(extrapolated\)/gi, '').trim(),
      prefix: cleanText(F['crystal structure' + suf + ' prefix'] || ''),
      pearson: cleanText(F['crystal structure' + suf + ' Pearson symbol'] || '') || null,
      comment: cleanText(F['crystal structure' + suf + ' comment'] || ''),
      predicted: isPredictedText(F['crystal structure' + suf + ' comment']) || isPredictedText(name),
      lat: parseLattice(latRaw), latRefs: refsOf(latRaw, wp.raw),
    });
  }
  const mainS = structs[0];
  if (mainS) {
    const latText = mainS.lat ? mainS.lat.text.replace(/\s*\/\s*/g, ', ') : '';
    f.crystal = V(`${mainS.prefix ? mainS.prefix + ' ' : ''}${mainS.name}${mainS.pearson ? ` (${mainS.pearson})` : ''}`, 'wp', { p: mainS.predicted ? 1 : undefined, n: [mainS.comment, mainS.latRefs.join('; ')].filter(Boolean).join(' · ') || undefined });
    if (!f.crystal[2].p) delete f.crystal[2].p;
    if (!f.crystal[2].n) delete f.crystal[2].n;
    if (latText) f.latticeText = V(latText, 'wp', mainS.latRefs.length ? { n: mainS.latRefs.join('; ') } : undefined);
  } else f.crystal = NONE('no crystal structure in the Wikipedia infobox');
  if (mdl.lattice_structure) crosscheck.push({ Z, field: 'structure', a: [mainS ? `${mainS.name} ${mainS.pearson || ''}` : null, 'wp'], b: [`${mdl.lattice_structure} a=${mdl.lattice_constant} Å`, 'mdl'], text: true });

  const lat = buildLattice({ Z, sym, structs, mdl, F });

  // ---- 1-atm phase model for the sample view
  const ph = {};
  const crcMp = mdlMain ? mdlMain.melting_point : undefined;
  if (Z === 2) {
    ph.noSolid = V(true, 'mdl-crc', { n: 'no melting point at 1 atm in CRC (mendeleev) and none in the Wikipedia infobox; PubChem\'s 0.95 K is not a 1-atm value' });
    ph.bp = f.bp;
  } else if (f.sub) {
    ph.sub = f.sub;
    if (mdlMain && mdlMain.is_sublimation_point) ph.subCheck = V(round(mdlMain.boiling_point, 6), 'mdl-crc', { n: 'CRC sublimation point' });
  } else {
    ph.mp = f.mp; ph.bp = f.bp;
  }
  if (crcMp === null && Z !== 2 && !f.sub && mdlMain) warn(`${sym}: CRC has no melting point`);
  if (lat.trans) ph.trans = lat.trans;

  // ---- spectrum
  const ln = linesFor(Z, sym);
  const lines = ln.none ? { none: ln.none } : { basis: ln.basis, n: ln.total, v: ln.v, tr: ln.tr };

  elements.push({ Z, sym, names, f, cfg: subs.map(s => [s.n, s.l, s.occ]), zeff, ph, lat: lat.out, lines, wpRev: wp ? wp.revid : null, col32: L.col32, fIndex: L.fIndex });
}

// ---------------------------------------------------------------------------------------------
function buildLattice({ Z, sym, structs, mdl }) {
  const mainS = structs[0];
  const structure = mainS ? `${mainS.name}${mainS.pearson ? ` (${mainS.pearson})` : ''}` : null;
  if (Z === 2) return { out: { kind: 'nosolid', structure, src: 'mdl-crc' } };
  if (MOLECULAR.includes(sym)) return { out: { kind: 'molecular', structure, src: 'spec' } };
  if (COMPLEX.includes(sym)) {
    const atoms = mainS && mainS.pearson ? Number((mainS.pearson.match(/\d+/) || [])[0]) : null;
    return { out: { kind: 'complex', structure, atoms, src: 'spec' } };
  }
  if (!mainS || mainS.predicted) return { out: { kind: 'predicted', structure, src: mainS ? 'wp' : 'none' } };

  const cod = COD.get(sym) || [];
  const phases = [];
  structs.forEach((s, i) => {
    if (s.predicted) return;
    const proto = protoFor(s.name, s.pearson);
    const pearson = s.pearson || (proto === 'sc' ? 'cP1' : null);
    const sgs = PEARSON_SG[pearson] || [];
    let codE = cod.find(c => sgs.includes(c.sgNumber) && (proto !== 'graphite' || c.cell.c / c.cell.a > 2) && (proto !== 'diamond' || c.sgNumber === 227));
    const w = s.lat || {};
    // Wikipedia/Arblaster cell in pm (hex setting for rhombohedral structures)
    let cell = null;
    if (w.ah && w.ch) cell = { a: w.ah, b: w.ah, c: w.ch, alpha: 90, beta: 90, gamma: 120 };
    else if (w.a) {
      const sys = PROTOTYPES[proto]?.cell;
      if (sys === 'cubic' || /cubic/i.test(s.name)) cell = { a: w.a, b: w.a, c: w.a, alpha: 90, beta: 90, gamma: 90 };
      else if (sys === 'hexagonal' || /hexagonal|trigonal/i.test(s.name)) cell = { a: w.a, b: w.a, c: w.c, alpha: 90, beta: 90, gamma: 120 };
      else if (/tetragonal/i.test(s.name)) cell = { a: w.a, b: w.a, c: w.c, alpha: 90, beta: 90, gamma: 90 };
      else cell = { a: w.a, b: w.b ?? w.a, c: w.c ?? w.a, alpha: w.alpha ?? 90, beta: w.beta ?? 90, gamma: w.gamma ?? 90 };
    }
    let sites, sitesSrc, cellSrc = 'wp', cellNote = [w.cond, s.latRefs.join('; ')].filter(Boolean).join(' · ');
    if (codE) {
      sites = codE.sites; sitesSrc = codE.key;
      if (cell) {
        // keep COD's axis setting; take the measured lengths from Arblaster (via Wikipedia), matching axes by length
        const cl = [['a', codE.cell.a], ['b', codE.cell.b], ['c', codE.cell.c]];
        const wl = [cell.a, cell.b, cell.c];
        let mapped;
        if (codE.cell.gamma === 120 || (codE.cell.alpha === 90 && codE.cell.beta === 90 && codE.cell.gamma === 90 && cell.gamma === 90)) {
          const cs = cl.slice().sort((x, y) => x[1] - y[1]);
          const ws = wl.slice().sort((x, y) => x - y);
          mapped = {};
          cs.forEach(([k], j) => { mapped[k] = ws[j]; });
          if (codE.cell.gamma === 120) mapped = { a: cell.a, b: cell.a, c: cell.c };
        } else mapped = { a: cell.a, b: cell.b, c: cell.c };
        const dev = Math.max(...['a', 'b', 'c'].map(k => Math.abs(mapped[k] - codE.cell[k]) / codE.cell[k]));
        if (dev > 0.03) { warn(`${sym}: Wikipedia cell differs from COD ${codE.file} by ${(dev * 100).toFixed(1)}% — using COD cell`); cell = codE.cell; cellSrc = codE.key; cellNote = `COD ${codE.file}${codE.T ? `, ${codE.T} K` : ''}`; }
        else cell = { ...mapped, alpha: codE.cell.alpha, beta: codE.cell.beta, gamma: codE.cell.gamma };
      } else { cell = codE.cell; cellSrc = codE.key; cellNote = `COD ${codE.file}${codE.T ? `, ${codE.T} K` : ''}`; }
    } else if (proto && PROTOTYPES[proto]) {
      sites = PROTOTYPES[proto].sites; sitesSrc = 'sym';
    }
    if (!cell || !sites) return;
    const dNN = nearestNeighbour(cell, sites);
    phases.push({
      id: `p${i}`, label: s.prefix.replace(/[:(].*$/, '').trim() || null, name: s.name, pearson, proto,
      cell: Object.fromEntries(Object.entries(cell).map(([k, v]) => [k, round(v, 6)])), cellSrc, cellNote,
      sites: sites.map(p => p.map(v => round(v, 5))), sitesSrc,
      dNN: round(dNN, 5), cn: coordination(cell, sites),
    });
  });
  // cell from COD only (no Wikipedia structure entry with constants), e.g. americium
  if (!phases.length && cod.length && mainS && !mainS.predicted) {
    const c = cod[0];
    const proto = protoFor(mainS.name, mainS.pearson);
    const cell = Object.fromEntries(Object.entries(c.cell).map(([k, v]) => [k, round(v, 6)]));
    phases.push({ id: 'p0', label: null, name: mainS.name, pearson: mainS.pearson, proto, cell, cellSrc: c.key, cellNote: `COD ${c.file}${c.T ? `, ${c.T} K` : ''}`, sites: c.sites.map(p => p.map(v => round(v, 5))), sitesSrc: c.key, dNN: round(nearestNeighbour(cell, c.sites), 5), cn: coordination(cell, c.sites) });
  }
  if (!phases.length) return { out: { kind: 'nodata', structure, src: 'wp' } };

  const out = { kind: 'lattice', structure, phases, def: phases[0].id };
  let trans;
  // iron: alpha -> gamma -> delta (temperatures from the infobox prefix "γ-Fe (912–1394 °C)")
  if (sym === 'Fe') {
    const g = structs.find(s => /γ/.test(s.prefix));
    const m = g && g.prefix.match(/(\d+)\s*[–-]\s*(\d+)\s*°C/);
    if (m) {
      const T1 = Number(m[1]) + K0, T2 = Number(m[2]) + K0;
      const alpha = phases[0], gamma = phases.find(p => p.proto === 'fcc');
      const dCod = cod.find(c => c.phase === 'delta-Fe');
      let delta;
      if (dCod) {
        delta = { ...alpha, id: 'delta', label: 'δ-Fe', cell: Object.fromEntries(Object.entries(dCod.cell).map(([k, v]) => [k, round(v, 6)])),
          cellSrc: dCod.key, cellNote: `at ${dCod.T} K · COD ${dCod.file}`, sites: dCod.sites, sitesSrc: dCod.key };
        delta.dNN = round(nearestNeighbour(delta.cell, delta.sites), 5); delta.cn = coordination(delta.cell, delta.sites);
      } else {
        const dph = placeholders.deltaFe;
        delta = { ...alpha, id: 'delta', label: 'δ-Fe', cellSrc: 'placeholder', cellNote: `${dph.note} (${dph.q})` };
      }
      phases.push(delta);
      alpha.T = [0, round(T1, 6)]; gamma.T = [round(T1, 6), round(T2, 6)]; delta.T = [round(T2, 6), null];
      trans = [{ T: V(round(T1, 6), 'wp', { n: `α → γ at ${m[1]} °C (Wikipedia infobox: "${g.prefix}")` }), to: gamma.id },
        { T: V(round(T2, 6), 'wp', { n: `γ → δ at ${m[2]} °C (same source)` }), to: 'delta' }];
    } else warn('Fe transition temperatures not found');
  }
  // tin: grey (alpha) below the CRC transition temperature, white (beta) above
  if (sym === 'Sn') {
    const tr = (MDL_PT.get(Z) || []).find(r => r.is_transition);
    const white = phases.find(p => p.proto !== 'diamond'), grey = phases.find(p => p.proto === 'diamond');
    if (tr && white && grey) {
      grey.T = [0, round(tr.melting_point, 6)]; white.T = [round(tr.melting_point, 6), null];
      trans = [{ T: V(round(tr.melting_point, 6), 'mdl-crc', { n: `grey (α) ↔ white (β) tin at ${fmtT(tr.melting_point)}` }), to: white.id }];
      out.def = white.id;
    }
  }
  // allotropes without a 1-atm transition shown as a toggle (carbon: graphite/diamond; cerium)
  if (!trans && phases.length > 1) phases.slice(1).forEach(p => { p.alt = true; });
  if (sym === 'Ce') out.defNote = V(placeholders.ceriumDefault.note, 'placeholder', { n: placeholders.ceriumDefault.q });
  if (sym === 'Ra' && mainS.pearson === 'cF4' && phases[0].proto === 'bcc') out.defNote = V('Wikipedia gives "body-centered cubic" with Pearson symbol cF4; drawn as bcc', 'placeholder', { n: 'QUESTIONS.md Q6' });
  return { out, trans };
}

// ---------------------------------------------------------------------------------------------
const FIELDS = {
  aw: { unit: '', kind: 'num' }, awStd: { kind: 'text' }, massNumber: { kind: 'int' }, nStable: { kind: 'int' }, isoMain: { kind: 'text' },
  halfLife: { unit: 's', kind: 'num' }, nucA: { kind: 'int' }, rNuc: { unit: 'fm', kind: 'num' },
  period: { kind: 'int' }, group: { kind: 'int' }, block: { kind: 'enum' }, cat: { kind: 'enum' },
  config: { kind: 'text' }, term: { kind: 'text' }, madelung: { kind: 'enum' },
  ie1: { unit: 'eV', kind: 'num' }, ie2: { unit: 'eV', kind: 'num' }, ie3: { unit: 'eV', kind: 'num' },
  en: { unit: '', kind: 'num' }, ea: { unit: 'eV', kind: 'num' }, ox: { kind: 'text' },
  state: { kind: 'enum' }, mp: { unit: 'K', kind: 'num' }, bp: { unit: 'K', kind: 'num' }, sub: { unit: 'K', kind: 'num' },
  density: { unit: 'g/cm³', kind: 'num' }, rCov: { unit: 'pm', kind: 'num' }, rVdw: { unit: 'pm', kind: 'num' },
  abund: { unit: 'mg/kg', kind: 'num' }, year: { kind: 'text' }, discoverers: { kind: 'text' }, natural: { kind: 'enum' },
  crystal: { kind: 'text' }, latticeText: { kind: 'text' },
};
const CATEGORY_ORDER = ['alkali', 'alkaline-earth', 'transition', 'post-transition', 'metalloid', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide'];

// attach cross-check explanations ("other sources say ...") to the values they explain
const ccNotes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curated/crosscheck-notes.json'), 'utf8'));
for (const [key, note] of Object.entries(ccNotes)) {
  if (key.startsWith('_')) continue;
  const [sym, field] = key.split(':');
  const e = elements.find(x => x.sym === sym);
  if (!e || !e.f[field]) { warn('cross-check note for unknown value', key); continue; }
  const v = e.f[field];
  v[2] = { ...(v[2] || {}), alt: note };
}

const out = {
  meta: {
    schema: 1, built: new Date().toISOString(), generator: 'tools/build-data.mjs',
    value: '[value, sourceKey] or [value, sourceKey, {p:1 predicted/estimated, n: note, t: display text, u: uncertainty}]',
    codata: CODATA.version, warnings: warnings.length,
  },
  sources: SOURCES,
  fields: FIELDS,
  categories: CATEGORY_ORDER,
  constants: {
    a0_pm: V(CODATA.a0_m * 1e12, 'codata'), R: V(CODATA.R, 'codata', { n: 'J mol⁻¹ K⁻¹' }), kB: V(CODATA.kB, 'codata', { n: 'J K⁻¹' }),
    u_kg: V(CODATA.u_kg, 'codata'), NA: V(CODATA.NA, 'codata'), h: V(CODATA.h, 'codata'), c: V(CODATA.c, 'codata'), eV_J: V(CODATA.eV_J, 'codata'),
  },
  model: {
    lindemann: V(placeholders.lindemannRatio.value, 'placeholder', { n: `${placeholders.lindemannRatio.note} (${placeholders.lindemannRatio.q})` }),
  },
  cmf: { v: CMF, src: 'cie' },
  srgb: { v: SRGB, src: 'w3c' },
  gdpt: { names: GDPT13.names, sentence: GDPT13.sentence, src: 'gdpt' },
  elements,
};
fs.writeFileSync(path.join(ROOT, 'data/elements.json'),
  JSON.stringify({ ...out, elements: undefined }, null, 1).replace(/\n}$/, ',\n "elements": [\n') +
  elements.map(e => '  ' + JSON.stringify(e)).join(',\n') + '\n ]\n}\n');
fs.writeFileSync(path.join(ROOT, 'data/crosscheck.json'), JSON.stringify(crosscheck, null, 0).replace(/\},\{/g, '},\n{') + '\n');
const bytes = fs.statSync(path.join(ROOT, 'data/elements.json')).size;
console.log(`elements.json: ${elements.length} elements, ${(bytes / 1024).toFixed(0)} KB; crosscheck pairs: ${crosscheck.length}; warnings: ${warnings.length}`);
for (const w of warnings) console.log('  warn:', w);
