#!/usr/bin/env node
// Downloads every raw data source into data/raw/<source>/ and records provenance in
// data/raw/MANIFEST.json (url, access time, licence, bytes, sha256, commit policy).
// Re-runnable: existing files are kept unless --force. Failures are recorded, never hidden.
//
//   node tools/fetch.mjs                 # fetch everything missing
//   node tools/fetch.mjs --only=nist-lines,cod --force
//
// Raw files whose licence does not clearly allow public redistribution are listed in
// data/raw/.gitignore (kept locally, re-fetchable from the manifest). See DECISIONS.md.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const MANIFEST = path.join(RAW, 'MANIFEST.json');
const UA = 'periodic-table-data-build/1.0 (offline educational app)';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);

// ---- source registry -------------------------------------------------------------------
export const LICENCES = {
  pubchem: { licence: 'NCBI/NLM: no restrictions on NCBI-produced data (https://www.ncbi.nlm.nih.gov/home/about/policies/). PubChem element values are compiled from US Government sources (Jefferson Lab, LANL, NIST) and IUPAC/CIAAW.', commit: true },
  ciaaw: { licence: 'IUPAC CIAAW web page (no explicit open licence). Atomic weights are facts; cite CIAAW / Prohaska et al., Pure Appl. Chem. 94 (2022) 573. Raw HTML kept local only.', commit: false },
  'nist-asd': { licence: 'NIST Standard Reference Database 78 (ASD v5.12), (c) U.S. Secretary of Commerce; free to use with citation: Kramida, A., Ralchenko, Yu., Reader, J. and NIST ASD Team, NIST Atomic Spectra Database (ver. 5.12). Raw dumps kept local only.', commit: false },
  wikipedia: { licence: 'Wikipedia text CC BY-SA 4.0 (Wikipedia contributors; revision ids recorded). We extract factual values only and cite the references given in the infobox.', commit: true },
  wikidata: { licence: 'Wikidata CC0 1.0 (public domain dedication).', commit: true },
  mendeleev: { licence: 'mendeleev v1.3.0 by L. M. Mentel, MIT licence (LICENSE stored alongside). Per-column citation keys in table propertymetadata.', commit: true },
  cod: { licence: 'Crystallography Open Database: data dedicated to the public domain (CC0) per COD; cite the original paper of each entry (recorded per file).', commit: true },
  'nist-codata': { licence: 'NIST CODATA 2022 fundamental constants (NIST SRD 121); free to use with citation (Mohr, Newell, Taylor, Tiesinga, CODATA 2022). Raw dump kept local only.', commit: false },
  'vi-gdpt': { licence: 'News article (Bao Dai Doan Ket), copyright of the publisher. Only the factual list of 13 Vietnamese element names is extracted. Raw HTML kept local only.', commit: false },
  cie: { licence: 'CIE dataset "Colour-matching functions of CIE 1931 standard colorimetric observer", doi:10.25039/CIE.DS.xvudnb9b, CC BY-SA 4.0.', commit: true },
  w3c: { licence: 'W3C CSS Color 4 sample code (conversions.js), W3C Software and Document License; only the XYZ->sRGB matrix is used.', commit: true },
  nubase: { licence: 'NUBASE2020 evaluation (F. G. Kondev et al., Chinese Physics C 45 (2021) 030001, open access CC BY 3.0); ASCII table distributed by the Atomic Mass Data Center.', commit: true },
  'iaea-radii': { licence: 'IAEA Nuclear Data Section, LiveChart of Nuclides API (ground_states); charge radii from I. Angeli, K. P. Marinova, Atomic Data and Nuclear Data Tables 99 (2013) 69-95, doi:10.1016/j.adt.2011.12.006. IAEA terms of use (https://nucleus.iaea.org/Pages/Others/Terms-Of-Use.aspx); only individual measured radii are used, as cited values. Raw dump kept local only.', commit: false },
};

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function loadManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
  catch { return { generated: null, note: 'Provenance of every raw download. sha256 is of the bytes as served.', files: {}, failures: [] }; }
}
const manifest = loadManifest();
manifest.failures = manifest.failures || [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, { timeout = 90000, headers = {} } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: ctl.signal, redirect: 'follow' });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, buf, type: res.headers.get('content-type') || '' };
  } finally { clearTimeout(t); }
}

function record(source, rel, url, buf, extra = {}) {
  manifest.files[rel] = {
    source, url, accessed: new Date().toISOString(), bytes: buf.length, sha256: sha256(buf),
    licence: LICENCES[source].licence, committed: LICENCES[source].commit, ...extra,
  };
}
function fail(source, url, why) {
  const f = { source, url, when: new Date().toISOString(), why: String(why).slice(0, 300) };
  manifest.failures = manifest.failures.filter(x => x.url !== url);
  manifest.failures.push(f);
  console.warn('  FAIL', source, url, '-', f.why);
}
function clearFailure(url) { manifest.failures = manifest.failures.filter(x => x.url !== url); }

async function fetchTo(source, rel, url, { validate, timeout, headers, extra } = {}) {
  const abs = path.join(RAW, rel);
  if (!FORCE && fs.existsSync(abs) && manifest.files[rel]) return fs.readFileSync(abs);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await get(url, { timeout, headers });
      if (r.status !== 200) throw new Error('HTTP ' + r.status);
      const problem = validate ? validate(r.buf) : null;
      if (problem) throw new Error(problem);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, r.buf);
      record(source, rel, url, r.buf, extra);
      clearFailure(url);
      console.log('  ok', rel, r.buf.length + ' B');
      return r.buf;
    } catch (e) {
      if (attempt === 3) { fail(source, url, e.message || e); return null; }
      await sleep(1500 * attempt);
    }
  }
}
const want = id => ONLY.length === 0 || ONLY.includes(id);

// ---- 1. PubChem periodic table (also gives us the element list) ---------------------------
async function pubchem() {
  console.log('PubChem periodic table');
  await fetchTo('pubchem', 'pubchem/periodictable.json', 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON', {
    validate: b => { const j = JSON.parse(b); return j.Table.Row.length === 118 ? null : 'expected 118 rows'; },
  });
}
function elementList() {
  const j = JSON.parse(fs.readFileSync(path.join(RAW, 'pubchem/periodictable.json'), 'utf8'));
  const cols = j.Table.Columns.Column;
  return j.Table.Row.map(r => Object.fromEntries(cols.map((c, i) => [c, r.Cell[i]])))
    .map(o => ({ Z: +o.AtomicNumber, sym: o.Symbol, name: o.Name }));
}

// ---- 2. CIAAW atomic weights --------------------------------------------------------------
async function ciaaw() {
  console.log('CIAAW');
  const v = b => (b.toString('utf8').includes('<table') ? null : 'no table in page');
  await fetchTo('ciaaw', 'ciaaw/atomic-weights.htm', 'https://www.ciaaw.org/atomic-weights.htm', { validate: v });
  await fetchTo('ciaaw', 'ciaaw/abridged-atomic-weights.htm', 'https://www.ciaaw.org/abridged-atomic-weights.htm', { validate: v });
}

// ---- 3. NIST ASD: ionization energies + ground configurations, all spectra ---------------
async function nistIE() {
  console.log('NIST ASD ionization energies');
  const url = 'https://physics.nist.gov/cgi-bin/ASD/ie.pl?spectra=H-Og&units=1&format=2&order=0&at_num_out=on&sp_name_out=on&ion_charge_out=on&el_name_out=on&seq_out=on&shells_out=on&level_out=on&ion_conf_out=on&e_out=0&unc_out=on&biblio=on';
  await fetchTo('nist-asd', 'nist-asd/ie-all.csv', url, {
    timeout: 180000, validate: b => (b.toString('utf8').startsWith('At. num') ? null : 'not the expected CSV'),
    extra: { asdVersion: '5.12' },
  });
}

// ---- 4. NIST ASD: neutral-atom lines 380-750 nm (air), one query per element -------------
export function nistLinesUrl(sym) {
  const q = new URLSearchParams({
    spectra: `${sym} I`, output_type: '0', low_w: '380', upp_w: '750', unit: '1', de: '0', plot_out: '0',
    I_scale_type: '1', format: '2', line_out: '0', remove_js: 'on', en_unit: '0', output: '0', bibrefs: '1',
    page_size: '15', show_obs_wl: '1', show_calc_wl: '1', unc_out: '1', order_out: '0', max_low_enrg: '',
    show_av: '2', max_upp_enrg: '', tsb_value: '0', min_str: '', A_out: '0', intens_out: 'on', max_str: '',
    allowed_out: '1', forbid_out: '1', min_accur: '', min_intens: '', conf_out: 'on', term_out: 'on',
    enrg_out: 'on', J_out: 'on',
  });
  return 'https://physics.nist.gov/cgi-bin/ASD/lines1.pl?' + q.toString();
}
async function nistLines() {
  console.log('NIST ASD lines (118 queries, throttled)');
  for (const el of elementList()) {
    const rel = `nist-asd/lines/${el.Z}-${el.sym}_I.csv`;
    const relErr = `nist-asd/lines/${el.Z}-${el.sym}_I.none.txt`;
    if (!FORCE && ((fs.existsSync(path.join(RAW, rel)) && manifest.files[rel]) || (fs.existsSync(path.join(RAW, relErr)) && manifest.files[relErr]))) continue;
    const url = nistLinesUrl(el.sym);
    try {
      const r = await get(url, { timeout: 90000 });
      const text = r.buf.toString('latin1');
      if (r.status === 200 && text.startsWith('obs_wl_air')) {
        fs.mkdirSync(path.dirname(path.join(RAW, rel)), { recursive: true });
        fs.writeFileSync(path.join(RAW, rel), r.buf);
        record('nist-asd', rel, url, r.buf, { asdVersion: '5.12' });
        clearFailure(url);
        console.log('  ok', rel, r.buf.length + ' B');
      } else if (r.status === 200) {
        // ASD answered with an HTML page: no lines (or spectrum unknown). Keep the message as evidence.
        const msg = (text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          .match(/(No lines are available[^.]*\.|Unrecognized[^.]*\.|Error Message:[^.]{0,160})/i) || ['(no CSV returned; message not recognised)'])[0];
        const b = Buffer.from(`NIST ASD returned no line list for ${el.sym} I (380-750 nm, air).\nMessage: ${msg.trim()}\nURL: ${url}\n`);
        fs.mkdirSync(path.dirname(path.join(RAW, relErr)), { recursive: true });
        fs.writeFileSync(path.join(RAW, relErr), b);
        record('nist-asd', relErr, url, b, { asdVersion: '5.12', empty: true, sha256OfResponse: sha256(r.buf) });
        clearFailure(url);
        console.log('  none', el.sym, '-', msg.trim().slice(0, 80));
      } else throw new Error('HTTP ' + r.status);
    } catch (e) { fail('nist-asd', url, e.message || e); }
    await sleep(700);
  }
}

// ---- 5. Wikipedia element infoboxes (wikitext), 50 titles per API call ---------------------
async function wikipedia() {
  console.log('Wikipedia infobox templates');
  const els = elementList();
  for (let i = 0; i < els.length; i += 40) {
    const batch = els.slice(i, i + 40);
    const titles = batch.map(e => 'Template:Infobox ' + e.name.toLowerCase()).join('|');
    const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', prop: 'revisions', rvprop: 'content|ids|timestamp', rvslots: 'main', format: 'json',
      formatversion: '2', redirects: '1', titles,
    });
    await fetchTo('wikipedia', `wikipedia/infobox-batch-${String(i / 40 + 1)}.json`, url, {
      validate: b => { const j = JSON.parse(b); return j.query && j.query.pages && j.query.pages.length ? null : 'no pages'; },
    });
    await sleep(500);
  }
  // Article with the iron allotrope data (delta-iron) used by the sample view.
  const art = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', prop: 'revisions', rvprop: 'content|ids|timestamp', rvslots: 'main', format: 'json',
    formatversion: '2', redirects: '1', titles: 'Allotropes of iron|Allotropes of carbon|Tin pest',
  });
  await fetchTo('wikipedia', 'wikipedia/articles-allotropes.json', art, {
    validate: b => (JSON.parse(b).query ? null : 'no query'),
  });
  // Which elements occur in nature (natural/synthetic filter).
  const syn = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', prop: 'revisions', rvprop: 'content|ids|timestamp', rvslots: 'main', format: 'json',
    formatversion: '2', redirects: '1', titles: 'Synthetic element',
  });
  await fetchTo('wikipedia', 'wikipedia/article-synthetic-element.json', syn, {
    validate: b => (JSON.parse(b).query ? null : 'no query'),
  });
  // Articles used to verify the Gemini fact-check corrections (FACTCHECK.md): actinide lattices,
  // cerium phases, radium, discovery/isolation years, and the analytic CIE 1931 fit.
  const fc = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', prop: 'revisions', rvprop: 'content|ids|timestamp', rvslots: 'main', format: 'json', formatversion: '2', redirects: '1',
    titles: 'Curium|Berkelium|Californium|Einsteinium|Cerium|Radium|Aluminium|Calcium|Fluorine|Silicon|Ruthenium|Helium|CIE 1931 color space',
  });
  await fetchTo('wikipedia', 'wikipedia/articles-factcheck.json', fc, {
    timeout: 180000, validate: b => (JSON.parse(b).query?.pages?.length >= 13 ? null : 'expected 13 pages'),
  });
}

// ---- 8b. NUBASE2020 (Kondev et al. 2021, Chinese Physics C 45 030001, CC BY 3.0) -------------
async function nubase() {
  console.log('NUBASE2020');
  const ok = b => (/NUBASE2020/i.test(b.toString('latin1', 0, 4000)) ? null : 'not the NUBASE2020 table');
  const got = await fetchTo('nubase', 'nubase/nubase_4.mas20.txt', 'https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt', { timeout: 120000, validate: ok });
  if (!got) await fetchTo('nubase', 'nubase/nubase_4.mas20.txt', 'https://amdc.impcas.ac.cn/masstables/Ame2020/nubase_4.mas20.txt', { timeout: 120000, validate: ok });
}

// ---- 8c. Measured nuclear charge radii (Angeli & Marinova 2013) via the IAEA LiveChart API -----
async function iaeaRadii() {
  console.log('IAEA LiveChart ground states (charge radii)');
  await fetchTo('iaea-radii', 'iaea-radii/ground-states.csv', 'https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all', {
    timeout: 180000, validate: b => (/^z,n,symbol,radius,unc_r/.test(b.toString('utf8', 0, 64)) ? null : 'not the ground_states CSV'),
  });
}

// ---- 5b. CODATA constants (a0, R, k, u, NA) -------------------------------------------------
async function codata() {
  console.log('NIST CODATA constants');
  await fetchTo('nist-codata', 'nist-codata/allascii.txt', 'https://physics.nist.gov/cuu/Constants/Table/allascii.txt', {
    validate: b => (b.toString('utf8').includes('Bohr radius') ? null : 'no Bohr radius line'),
  });
}

// ---- 5b'. Colour science: CIE 1931 colour-matching functions + sRGB matrix ------------------
async function colour() {
  console.log('CIE CMFs + W3C sRGB conversion');
  await fetchTo('cie', 'cie/CIE_xyz_1931_2deg.csv', 'https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv', {
    validate: b => (/^360,/.test(b.toString('utf8')) ? null : 'unexpected CSV'),
  });
  await fetchTo('cie', 'cie/CIE_xyz_1931_2deg.csv_metadata.json', 'https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv_metadata.json');
  await fetchTo('w3c', 'w3c/css-color-4-conversions.js', 'https://drafts.csswg.org/css-color-4/conversions.js', {
    validate: b => (b.toString('utf8').includes('XYZ_to_lin_sRGB') ? null : 'function not found'),
  });
}

// ---- 5c. GDPT-2018 Vietnamese naming rule (13 elements keep Vietnamese names) ---------------
async function viGdpt() {
  console.log('VI naming rule (GDPT-2018)');
  await fetchTo('vi-gdpt', 'vi-gdpt/daidoanket-10233769.html',
    'https://daidoanket.vn/doi-cach-doc-ten-cac-nguyen-to-hoa-hoc-hoc-sinh-boi-roi-giao-vien-ban-khoan-10233769.html', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validate: b => (b.toString('utf8').includes('13 nguyên tố') ? null : 'expected sentence not found'),
    });
}

// ---- 6. Wikidata: Vietnamese + English labels for all 118 elements -----------------------
async function wikidata() {
  console.log('Wikidata labels');
  const q = `SELECT ?z ?item ?vi ?en WHERE { ?item wdt:P31 wd:Q11344; wdt:P1086 ?z.
    OPTIONAL { ?item rdfs:label ?vi FILTER(lang(?vi)="vi") }
    OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en)="en") }
    FILTER(?z>=1 && ?z<=118) } ORDER BY ?z`;
  const url = 'https://query.wikidata.org/sparql?' + new URLSearchParams({ query: q, format: 'json' });
  await fetchTo('wikidata', 'wikidata/element-labels.json', url, {
    headers: { Accept: 'application/sparql-results+json' },
    validate: b => (JSON.parse(b).results.bindings.length >= 118 ? null : 'fewer than 118 rows'),
  });
}

// ---- 7. mendeleev DB (Cordero/Alvarez radii, Clementi screening, CRC phase data) ----------
async function mendeleev() {
  console.log('mendeleev v1.3.0');
  const base = 'https://raw.githubusercontent.com/lmmentel/mendeleev/v1.3.0/';
  await fetchTo('mendeleev', 'mendeleev/elements.db', base + 'mendeleev/elements.db', {
    timeout: 180000, validate: b => (b.slice(0, 15).toString() === 'SQLite format 3' ? null : 'not sqlite'),
    extra: { version: 'v1.3.0 (git tag)' },
  });
  await fetchTo('mendeleev', 'mendeleev/LICENSE', base + 'LICENSE', { extra: { version: 'v1.3.0 (git tag)' } });
  await fetchTo('mendeleev', 'mendeleev/references.bib', base + 'docs/source/references.bib', {
    validate: b => (b.toString('utf8').includes('@') ? null : 'not a bib file'), extra: { version: 'v1.3.0 (git tag)' },
  });
}

// ---- 9. COD: entries for elements whose structures have free atomic coordinates ----------
// Selection rule (deterministic, in tools/lib/cod-select.mjs): matching space group, ambient
// pressure, temperature closest to 293 K, then newest. The query JSON is kept so the choice
// can be audited.
export const COD_ELEMENTS = ['Ga', 'As', 'Se', 'Sb', 'Te', 'Bi', 'Sm', 'U', 'Np', 'Pu', 'Hg', 'In', 'Sn', 'Pa', 'Po', 'C', 'Si', 'Ge',
  'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fe'];
async function cod() {
  console.log('COD queries + CIFs');
  const { selectCod } = await import('./lib/cod-select.mjs');
  for (const sym of COD_ELEMENTS) {
    const url = `https://www.crystallography.net/cod/result?formula=${encodeURIComponent(sym)}&format=json`;
    const buf = await fetchTo('cod', `cod/query-${sym}.json`, url, {
      timeout: 120000, validate: b => (Array.isArray(JSON.parse(b)) ? null : 'not a JSON array'),
    });
    if (!buf) continue;
    const picks = selectCod(sym, JSON.parse(buf));
    for (const p of picks) {
      await fetchTo('cod', `cod/${p.file}.cif`, `https://www.crystallography.net/cod/${p.file}.cif`, {
        timeout: 120000, validate: b => (b.toString('utf8').includes('_cell_length_a') ? null : 'not a CIF'),
        extra: { element: sym, phase: p.phase, reason: p.reason },
      });
    }
    await sleep(500);
  }
}

// ---- 9b. COD entries for high-temperature phases (ids from RESEARCH.md › Answers Q8) -------------
export const COD_HIGH_T = {
  Ti: ['9008554'], Zr: ['9008559'], Hf: ['1522789'], Co: ['9012926', '9012948'], La: ['1523533'], Ca: ['9011034', '9012732'],
  Sr: ['9012760', '9008551'], Th: ['9008553'], U: ['2106190', '1539778'], Np: ['9008586', '9008547'],
  Pu: ['2311043', '9008588', '9008481', '9008548'],
};
async function codHighT() {
  console.log('COD high-temperature phases');
  for (const [sym, ids] of Object.entries(COD_HIGH_T)) for (const id of ids) {
    await fetchTo('cod', `cod/${id}.cif`, `https://www.crystallography.net/cod/${id}.cif`, {
      timeout: 120000, validate: b => (b.toString('utf8').includes('_cell_length_a') ? null : 'not a CIF'),
      extra: { element: sym, phase: 'high-temperature phase (RESEARCH.md Answers Q8)' },
    });
  }
}
// Second published source for the GDPT-2018 naming rule (RESEARCH.md › Answers Q7)
async function viGdpt2() {
  await fetchTo('vi-gdpt', 'vi-gdpt/cm-pek-811.html', 'https://cm.pek.edu.vn/fr/news/dien-dan-giao-duc/vi-sao-chuong-trinh-gdpt-2018-dung-ten-goi-nguyen-to-hoa-hoc-bang-tieng-anh-811.html', {
    headers: { 'User-Agent': 'Mozilla/5.0' }, validate: b => (b.toString('utf8').includes('13 nguyên tố') ? null : 'expected text not found'),
  });
}

// ---- 10. Wikipedia lead sections (plain text) for the elements with a hand-written card line ----
// Used only to check our own one-line descriptions (data/curated/element-lines.json); no text is copied.
export const LINE_TITLES = ['Hydrogen', 'Helium', 'Lithium', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon', 'Sodium', 'Magnesium',
  'Aluminium', 'Silicon', 'Phosphorus', 'Sulfur', 'Chlorine', 'Potassium', 'Calcium', 'Titanium', 'Iron', 'Copper',
  'Zinc', 'Gallium', 'Bromine', 'Strontium', 'Silver', 'Tin', 'Iodine', 'Caesium', 'Neodymium', 'Tungsten',
  'Platinum', 'Gold', 'Mercury (element)', 'Lead', 'Uranium', 'Plutonium', 'Oganesson'];
async function wikipediaIntros() {
  console.log('Wikipedia lead sections for card lines');
  for (let i = 0; i < LINE_TITLES.length; i += 19) {
    const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', prop: 'extracts|revisions', rvprop: 'ids', exintro: '1', explaintext: '1', exlimit: '20', format: 'json',
      formatversion: '2', redirects: '1', titles: LINE_TITLES.slice(i, i + 19).join('|'),
    });
    await fetchTo('wikipedia', `wikipedia/intros-${i / 19 + 1}.json`, url, {
      validate: b => { const j = JSON.parse(b); return j.query?.pages?.every(p => p.extract && p.extract.length > 200) ? null : 'missing extracts'; },
    });
    await sleep(500);
  }
}

// ---- run ----------------------------------------------------------------------------------
const steps = [['pubchem', pubchem], ['ciaaw', ciaaw], ['nist-ie', nistIE], ['nist-lines', nistLines], ['wikipedia', wikipedia],
  ['codata', codata], ['colour', colour], ['vi-gdpt', viGdpt], ['wikidata', wikidata], ['mendeleev', mendeleev], ['nubase', nubase], ['cod', cod], ['cod-hiT', codHighT], ['vi-gdpt2', viGdpt2],
  ['wikipedia-intros', wikipediaIntros], ['iaea-radii', iaeaRadii]];
fs.mkdirSync(RAW, { recursive: true });
for (const [id, fn] of steps) {
  if (!want(id)) continue;
  try { await fn(); } catch (e) { fail(id, '(step)', e.stack || e); }
  manifest.generated = new Date().toISOString();
  const sorted = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  manifest.files = sorted;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
}
// .gitignore for raw files we must not republish (see LICENCES[*].commit)
const ignore = Object.entries(LICENCES).filter(([, v]) => !v.commit).map(([k]) => `${k}/`);
fs.writeFileSync(path.join(RAW, '.gitignore'), '# Raw dumps without a clear open licence: kept locally, re-fetch with tools/fetch.mjs\n' + ignore.join('\n') + '\n');
console.log(`done: ${Object.keys(manifest.files).length} files in manifest, ${manifest.failures.length} failures`);
if (manifest.failures.length) for (const f of manifest.failures) console.log('  failure:', f.source, f.url.slice(0, 120), f.why);
