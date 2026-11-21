#!/usr/bin/env node
// Validates data/elements.json and the physics code. Exit code 1 on any FAIL.
//   node tools/validate.mjs            # all checks
//   node tools/validate.mjs --report   # also write data/crosscheck.md (full-table second-source report)
import fs from 'node:fs';
import path from 'node:path';
import * as O from '../src/physics/orbitals.js';
import { nearestNeighbour, coordination, cellVectors, fracToCart } from '../src/physics/lattice.js';
import { subshellName } from '../src/physics/config.js';
import { wavelengthToRGB, glowColour } from '../src/physics/color.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export function runValidation({ report = false, quiet = false } = {}) {
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/elements.json'), 'utf8'));
  const notes = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curated/crosscheck-notes.json'), 'utf8'))).filter(([k]) => !k.startsWith('_')));
  const CC = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/crosscheck.json'), 'utf8'));
  const results = [];
  const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };
  const fails = [];
  const E = sym => D.elements.find(e => e.sym === sym);

  // ---- 1. identity -----------------------------------------------------------------------
  const Zs = D.elements.map(e => e.Z);
  check('118 elements', D.elements.length === 118, `${D.elements.length}`);
  check('unique Z = 1..118', new Set(Zs).size === 118 && Zs.every((z, i) => z === i + 1));
  check('unique symbols', new Set(D.elements.map(e => e.sym)).size === 118);

  // ---- 2. every value carries a known source; nulls carry a reason --------------------------
  const isVal = v => Array.isArray(v) && v.length >= 2 && v.length <= 3 && typeof v[1] === 'string';
  const bad = [];
  let nVals = 0, nPlaceholder = 0, nPred = 0, nNull = 0;
  const visit = (where, v) => {
    nVals++;
    if (!isVal(v)) { bad.push(`${where}: not [value, source]`); return; }
    const [val, src, fl] = v;
    if (!D.sources[src]) bad.push(`${where}: unknown source "${src}"`);
    if (val === null && src !== 'none') bad.push(`${where}: null value without source "none"`);
    if (src === 'none') { nNull++; if (val !== null || !(fl && fl.n)) bad.push(`${where}: "none" needs null value and a reason`); }
    if (src === 'placeholder') nPlaceholder++;
    if (fl && fl.p) nPred++;
    if (fl !== undefined && (typeof fl !== 'object' || Array.isArray(fl))) bad.push(`${where}: flags must be an object`);
  };
  for (const e of D.elements) {
    for (const [k, v] of Object.entries(e.f)) visit(`${e.sym}.f.${k}`, v);
    for (const [k, v] of Object.entries(e.names)) if (v) visit(`${e.sym}.names.${k}`, v);
    for (const [k, v] of Object.entries(e.zeff)) visit(`${e.sym}.zeff.${k}`, v);
    if (e.line) visit(`${e.sym}.line`, e.line);
    for (const [k, v] of Object.entries(e.ph)) {
      if (k === 'trans') v.forEach((t, i) => visit(`${e.sym}.ph.trans${i}`, t.T));
      else visit(`${e.sym}.ph.${k}`, v);
    }
    if (e.lat.kind === 'lattice') for (const p of e.lat.phases) {
      if (p.card) { if (!D.sources[p.src]) bad.push(`${e.sym}.lat.${p.id}: card without a known source`); continue; }
      if (!D.sources[p.cellSrc]) bad.push(`${e.sym}.lat.${p.id}: unknown cell source ${p.cellSrc}`);
      if (!D.sources[p.sitesSrc]) bad.push(`${e.sym}.lat.${p.id}: unknown sites source ${p.sitesSrc}`);
    }
    if (e.lat.defNote) visit(`${e.sym}.lat.defNote`, e.lat.defNote);
    if (!e.lines.none && !D.sources['nist-lines']) bad.push('nist-lines source missing');
  }
  for (const [k, v] of Object.entries(D.constants)) visit(`constants.${k}`, v);
  for (const [k, v] of Object.entries(D.model)) visit(`model.${k}`, v);
  check('every value has a known source key; every null has a reason', bad.length === 0, bad.slice(0, 8).join('; '));

  // ---- 3. units / types / ranges -----------------------------------------------------------
  const unitBad = [];
  const RANGES = { mp: [0.5, 7000], bp: [3, 7000], sub: [300, 7000], density: [5e-5, 30], ie1: [3, 25], ie2: [9, 80], ie3: [15, 160], en: [0.6, 4.1], ea: [-1, 4], rCov: [25, 260], rVdw: [100, 400], aw: [1, 300], abund: [1e-15, 6e5], rNuc: [0.8, 8], halfLife: [1e-12, 1e30] };
  for (const e of D.elements) for (const [k, v] of Object.entries(e.f)) {
    const fd = D.fields[k];
    if (!fd) { unitBad.push(`${e.sym}.${k}: field not declared`); continue; }
    if (v[0] === null) continue;
    if ((fd.kind === 'num' || fd.kind === 'int') && typeof v[0] !== 'number') unitBad.push(`${e.sym}.${k}: expected number, got ${JSON.stringify(v[0])}`);
    if (fd.kind === 'num' && !('unit' in fd)) unitBad.push(`${k}: numeric field without unit`);
    const r = RANGES[k];
    if (r && typeof v[0] === 'number' && (v[0] < r[0] || v[0] > r[1])) unitBad.push(`${e.sym}.${k}=${v[0]} outside ${r}`);
  }
  check('units declared and values in plausible ranges (catches K/°C, pm/Å, g/L mix-ups)', unitBad.length === 0, unitBad.slice(0, 8).join('; '));

  // ---- 4. one category each ------------------------------------------------------------------
  const catBad = D.elements.filter(e => !e.f.cat || !D.categories.includes(e.f.cat[0]));
  check('exactly one known category per element', catBad.length === 0, catBad.map(e => e.sym).join(','));
  check('legend includes reactive nonmetals', D.categories.includes('nonmetal') && D.elements.some(e => e.f.cat[0] === 'nonmetal'));

  // ---- 5. names ------------------------------------------------------------------------------
  const nameBad = D.elements.filter(e => !e.names.en?.[0] || !e.names.vi?.[0]);
  check('every element has an English and a Vietnamese name', nameBad.length === 0, nameBad.map(e => e.sym).join(','));
  check('13 GDPT-2018 Vietnamese names kept as the second name', D.elements.filter(e => e.names.viAlt && e.names.viAlt[1] === 'gdpt').length === 13);
  check('VI names put the IUPAC name first ("sodium · natri", SPEC §3)', D.elements.every(e => e.names.vi[0] === e.names.en[0].toLowerCase()) && E('Na').names.viAlt?.[0] === 'natri');

  // ---- 6. golden values (SPEC §6) -----------------------------------------------------------
  const ga = E('Ga').f.mp[0];
  check('golden: Ga melting point 29.76 °C', (ga - 273.15).toFixed(2) === '29.76', `${ga} K = ${(ga - 273.15).toFixed(2)} °C`);
  const fe = E('Fe').lat.phases.find(p => p.label === 'α-Fe');
  check('golden: α-Fe a = 286.65 pm', fe && fe.cell.a === 286.65 && fe.proto === 'bcc', fe ? `${fe.proto} a=${fe.cell.a}` : 'missing');
  check('golden: Cr [Ar] 3d5 4s1', E('Cr').f.config[0] === '[Ar] 3d5 4s1', E('Cr').f.config[0]);
  const na = E('Na').lines.v || [];
  const hasL = t => na.some(([l]) => Math.abs(l - t) < 0.05);
  check('golden: Na D lines 589.0 / 589.6 nm', hasL(589.0) && hasL(589.6), na.filter(([l]) => l > 588 && l < 590).map(x => x[0]).join(', '));
  check('golden: H ionization energy 13.598 eV', E('H').f.ie1[0].toFixed(3) === '13.598', `${E('H').f.ie1[0]}`);

  // ---- 7. orbital maths for all occupied subshells -----------------------------------------
  const occ = new Set();
  for (const e of D.elements) for (const [n, l] of e.cfg) occ.add(`${n},${l}`);
  const want = new Set(O.OCCUPIED_SUBSHELLS.map(([n, l]) => `${n},${l}`));
  check('19 occupied subshells across all ground states', occ.size === 19 && [...occ].every(k => want.has(k)), [...occ].map(k => subshellName(...k.split(',').map(Number))).join(' '));
  const orbBad = [];
  for (const [n, l] of O.OCCUPIED_SUBSHELLS) {
    for (const Z of [1, 7.3]) {
      const N = O.radialNormIntegral(n, l, Z);
      if (Math.abs(N - 1) > 1e-6) orbBad.push(`${n}${'spdf'[l]} Z=${Z} norm ${N}`);
    }
    const rn = O.countRadialNodes(n, l, 1);
    if (rn !== n - l - 1) orbBad.push(`${n}${'spdf'[l]} radial nodes ${rn} != ${n - l - 1}`);
    for (const m of O.mValues(l)) {
      const a = O.countAngularNodes(l, m);
      if (a.total !== l) orbBad.push(`${O.orbitalLabel(n, l, m)} angular nodes ${a.total} != ${l}`);
      const yn = O.angularNormIntegral(l, m, 160, 320);
      if (Math.abs(yn - 1) > 1e-3) orbBad.push(`${O.orbitalLabel(n, l, m)} |Y|² integral ${yn}`);
    }
  }
  check('orbitals: normalised, n−l−1 radial nodes, l angular nodes (19 subshells, all m)', orbBad.length === 0, orbBad.slice(0, 6).join('; '));
  // orthogonality spot checks (different l, same n; different m)
  const ortho = (l1, m1, l2, m2) => { let s = 0; const nt = 120, np = 240; for (let i = 0; i < nt; i++) { const th = (i + 0.5) * Math.PI / nt; for (let j = 0; j < np; j++) { const ph = (j + 0.5) * 2 * Math.PI / np; s += O.realY(l1, m1, th, ph) * O.realY(l2, m2, th, ph) * Math.sin(th); } } return s * (Math.PI / nt) * (2 * Math.PI / np); };
  check('orbitals: real harmonics orthogonal (spot checks)', [[1, 1, 1, -1], [2, 0, 2, 2], [3, -3, 3, 3], [2, 1, 1, 1]].every(([a, b, c, d]) => Math.abs(ortho(a, b, c, d)) < 1e-6));

  // ---- 8. lattices ---------------------------------------------------------------------------
  const latBad = [];
  const EXPECT = { bcc: [8, a => (a * Math.sqrt(3)) / 2], fcc: [12, a => a / Math.SQRT2], diamond: [4, a => (a * Math.sqrt(3)) / 4], sc: [6, a => a], graphite: [3, null] };
  let nLattice = 0;
  for (const e of D.elements) {
    if (e.lat.kind !== 'lattice') continue;
    nLattice++;
    // temperature sequence: windows contiguous and increasing, last one open to the melting point
    const seq = e.lat.phases.filter(p => p.T).sort((a, b) => a.T[0] - b.T[0]);
    seq.forEach((p, i) => {
      if (i === 0 && p.T[0] !== 0) latBad.push(`${e.sym}: first phase does not start at 0 K`);
      if (i > 0 && Math.abs(seq[i - 1].T[1] - p.T[0]) > 1e-6) latBad.push(`${e.sym}: gap between ${seq[i - 1].id} and ${p.id}`);
      if (i === seq.length - 1 && p.T[1] !== null) latBad.push(`${e.sym}: last phase must run to the melting point`);
      if (p.T[1] !== null && p.T[1] <= p.T[0]) latBad.push(`${e.sym}/${p.id}: empty window`);
    });
    if (seq.length && (e.ph.trans || []).length !== seq.length - 1) latBad.push(`${e.sym}: ${seq.length} phases but ${(e.ph.trans || []).length} transitions`);
    const mpK = e.ph.mp?.[0] ?? e.ph.sub?.[0];
    if (seq.length && mpK && seq[seq.length - 1].T[0] >= mpK) latBad.push(`${e.sym}: last transition above the melting point`);
    for (const p of e.lat.phases) {
      if (p.card) { if (!p.T) latBad.push(`${e.sym}/${p.id}: card phase without temperature window`); continue; }
      const c = p.cell;
      if (!(c.a > 50 && c.b > 50 && c.c > 50)) latBad.push(`${e.sym}/${p.id}: cell lengths not in pm`);
      if (p.sites.some(s => s.some(v => v < 0 || v >= 1))) latBad.push(`${e.sym}/${p.id}: fractional coordinate outside [0,1)`);
      const d = nearestNeighbour(c, p.sites);
      if (Math.abs(d - p.dNN) > 0.01) latBad.push(`${e.sym}/${p.id}: stored dNN ${p.dNN} != ${d}`);
      const ex = EXPECT[p.proto];
      if (ex) {
        const cn = coordination(c, p.sites);
        if (cn !== ex[0]) latBad.push(`${e.sym}/${p.id} ${p.proto}: CN ${cn} != ${ex[0]}`);
        if (ex[1] && Math.abs(d - ex[1](c.a)) > 1e-6 * c.a) latBad.push(`${e.sym}/${p.id}: dNN ${d} != ${ex[1](c.a)}`);
      }
      if (p.proto === 'hcp' || p.proto === 'dhcp') {
        const cn12 = coordination(c, p.sites, 0.13);
        if (cn12 !== 12) latBad.push(`${e.sym}/${p.id} ${p.proto}: ${cn12} neighbours within 13% (expected 12)`);
      }
      // unit sanity: nearest-neighbour distance must be comparable to twice the covalent radius
      // (metals) or twice the van der Waals radius (noble-gas solids)
      const rc = e.f.rCov?.[0], rv = e.f.rVdw?.[0];
      const okC = rc && d / (2 * rc) >= 0.6 && d / (2 * rc) <= 2.0;
      const okV = rv && d / (2 * rv) >= 0.45 && d / (2 * rv) <= 1.3;
      if ((rc || rv) && !okC && !okV) latBad.push(`${e.sym}/${p.id}: dNN ${d.toFixed(1)} pm vs 2·r_cov ${2 * rc} / 2·r_vdW ${2 * rv} pm`);
    }
  }
  check('lattices: pm units, sites in [0,1), coordination + nearest-neighbour geometry, size vs covalent radius', latBad.length === 0, latBad.slice(0, 8).join('; '));
  check('lattices: 84 elements with a drawable measured lattice (SPEC: ≈84)', nLattice === 84, `${nLattice} elements`);
  check('lattices: Z ≥ 100 never made in bulk -> predicted card', D.elements.filter(e => e.Z >= 100).every(e => e.lat.kind === 'predicted'));
  check('lattices: Ra bcc, Ce default γ (fcc), Cm/Bk/Cf dhcp, Es fcc', E('Ra').lat.phases[0].proto === 'bcc' && E('Ra').lat.phases[0].pearson === 'cI2'
    && E('Ce').lat.phases.find(p => p.id === E('Ce').lat.def).proto === 'fcc' && ['Cm', 'Bk', 'Cf'].every(s => E(s).lat.phases?.[0].proto === 'dhcp') && E('Es').lat.phases?.[0].proto === 'fcc');
  const kinds = {};
  for (const e of D.elements) kinds[e.lat.kind] = (kinds[e.lat.kind] || 0) + 1;
  check('every element has a sample-view outcome (lattice or honest card)', D.elements.every(e => ['lattice', 'molecular', 'complex', 'predicted', 'nodata', 'nosolid'].includes(e.lat.kind)), JSON.stringify(kinds));
  check('special cases: He no solid; C & As sublime; Fe α→γ→δ; Sn α↔β; C graphite+diamond',
    E('He').ph.noSolid?.[0] === true && E('C').ph.sub && E('As').ph.sub && E('Fe').ph.trans?.length === 2 && E('Sn').ph.trans?.length === 1
    && E('C').lat.phases.some(p => p.proto === 'graphite') && E('C').lat.phases.some(p => p.proto === 'diamond'));

  // ---- 9. spectra ----------------------------------------------------------------------------
  const lnBad = [];
  let withLines = 0;
  for (const e of D.elements) {
    if (e.lines.none) continue;
    withLines++;
    const v = e.lines.v;
    if (!v.length) lnBad.push(`${e.sym}: empty line list`);
    if (v.some(([l, I]) => l < 380 || l > 750 || I < 0 || I > 1000)) lnBad.push(`${e.sym}: line outside range`);
    if (v.some((x, i) => i && x[0] < v[i - 1][0])) lnBad.push(`${e.sym}: lines not sorted`);
    if (v.length > 8 || e.lines.tr) lnBad.push(`${e.sym}: more than a handful of NIST lines / transition strings (NIST policy)`);
  }
  check('spectra: ≤ 8 NIST lines per element (moony: NIST values only as cited facts), 380–750 nm, sorted', lnBad.length === 0, `${withLines} elements with lines; ${lnBad.slice(0, 5).join('; ')}`);
  const cmf = D.cmfFit.v, M = D.srgb.v;
  const red = wavelengthToRGB(650, cmf, M), green = wavelengthToRGB(530, cmf, M), blue = wavelengthToRGB(450, cmf, M);
  check('colour: 650 nm reddest, 530 nm greenest, 450 nm bluest', red[0] > red[1] && red[0] > red[2] && green[1] > green[0] && green[1] > green[2] && blue[2] > blue[0] && blue[2] > blue[1]);
  const deep = [700, 749].map(l => wavelengthToRGB(l, cmf, M)), nearUV = wavelengthToRGB(385, cmf, M);
  check('colour: the ends keep their hue (700 and 749 nm red, 385 nm violet; the CIE fit\'s tails drift)', deep.every(([r, g, b]) => r > 2 * g && r > 2 * b) && nearUV[2] > nearUV[1] && nearUV[0] > nearUV[1],
    [...deep, nearUV].map(c => c.map(x => x.toFixed(2)).join(',')).join(' / '));
  const naGlow = glowColour(E('Na').lines.v, cmf, M).rgb;
  check('colour: sodium glow is yellow-orange (R ≥ G > B)', naGlow && naGlow[0] >= naGlow[1] && naGlow[1] > naGlow[2], naGlow && naGlow.map(x => x.toFixed(2)).join(','));
  // The lines that look brightest (atom view round 2): neon's orange-red lines, not its near-infrared
  // ones; sodium's D doublet with its 568.8 nm pair, not core-excited lines; hydrogen's Balmer series.
  const shows = (s, ...want) => want.every(w => (E(s).lines.v || []).some(([l]) => Math.abs(l - w) < 0.06));
  check('spectra: the brightest-looking lines (Ne 585.2/614.3/640.2, Na 589.0/589.6/568.8, H 656.3/486.1/434.0, Hg 435.8/546.1)',
    shows('Ne', 585.25, 614.31, 640.22) && shows('Na', 589.0, 589.59, 568.82) && shows('H', 656.28, 486.13, 434.05) && shows('Hg', 435.83, 546.07),
    ['Ne', 'Na', 'H', 'Hg'].map(s => `${s} ${(E(s).lines.v || []).map(x => x[0].toFixed(1)).join(' ')}`).join(' · '));
  // Their glow (CIE 1931 x, y of all the element's lines) against the lamp colours in Wikipedia's
  // "Gas-discharge lamp" table (https://en.wikipedia.org/w/index.php?title=Gas-discharge_lamp&oldid=1351286820).
  const GLOW = { Ne: ['red-orange', (x, y) => x > 0.6 && y > 0.3 && y < 0.4], Na: ['orange-yellow (low-pressure sodium)', (x, y) => x > 0.5 && y > 0.4],
    Ar: ['violet to pale lavender blue', (x, y) => x < 0.3 && y < 0.2], Hg: ['light blue', (x, y) => x < 0.3 && y < 0.3 && y > x],
    He: ['white to orange', (x, y) => x > 0.38 && y > 0.3], H: ['pink to magenta', (x, y) => x > 0.3 && y < 0.25] };
  const glowBad = Object.entries(GLOW).filter(([s, [, ok]]) => !(E(s).lines.glow && ok(...E(s).lines.glow)));
  check('colour: glow of H, He, Ne, Ar, Na, Hg matches the gas-discharge lamp colours (Wikipedia table)', glowBad.length === 0,
    Object.keys(GLOW).map(s => `${s} ${JSON.stringify(E(s).lines.glow)}`).join(' · ') + (glowBad.length ? ' — off: ' + glowBad.map(([s, [w]]) => `${s} (${w})`).join(', ') : ''));

  // ---- 10. second-source cross-check (SPEC: 20 random elements x 5 fields) --------------------
  const TOL = { mp: (a, b) => Math.abs(a - b) <= Math.max(2, 0.01 * a), bp: (a, b) => Math.abs(a - b) <= Math.max(2, 0.01 * a), density: (a, b) => Math.abs(a - b) <= 0.02 * a, ie1: (a, b) => Math.abs(a - b) <= 0.005 * a, aw: (a, b) => Math.abs(a - b) <= 0.001 * a + 0.001 };
  const FIELDS5 = Object.keys(TOL);
  const rand = O.rng32(20261120);
  const pool = D.elements.map(e => e.Z);
  const sample = [];
  while (sample.length < 20) { const i = Math.floor(rand() * pool.length); sample.push(pool.splice(i, 1)[0]); }
  sample.sort((a, b) => a - b);
  const ccRows = [];
  const unexplained = [];
  const judge = (Z, field) => {
    const e = D.elements[Z - 1];
    const prim = e.f[field];
    const pairs = CC.filter(c => c.Z === Z && c.field === field);
    const key = `${e.sym}:${field}`;
    if (!prim || prim[0] === null) return { Z, sym: e.sym, field, status: 'no-primary', note: notes[key] || (prim?.[2]?.n ?? '') };
    // a prediction has no measurement to agree with: sources may differ or there may be only one
    if (prim[2]?.p && !pairs.some(p => TOL[field](p.a[0], p.b[0]))) return { Z, sym: e.sym, field, status: 'predicted', prim, second: pairs[0]?.b, note: notes[key] || prim[2]?.alt || 'predicted / estimated value (no measurement to compare with)' };
    if (!pairs.length) { const why = notes[key] || prim[2]?.alt || ''; return { Z, sym: e.sym, field, status: why ? 'explained' : 'no-second-source', prim, note: why }; }
    // Gas densities: PubChem quotes 0 °C / 1 atm, CRC (mendeleev) quotes 295 K -> compare on the same basis (ideal gas).
    const isGas = e.f.state?.[0] === 'gas';
    const adj = p => (field === 'density' && isGas && p.b[1] === 'mdl-crc' ? p.b[0] * (295 / 273.15) : p.b[0]);
    // A difference inside the stated uncertainty of either value is a match.
    const unc = p => Math.max(p.a[2]?.u || 0, p.b[2]?.u || 0);
    const okPair = pairs.find(p => TOL[field](p.a[0], adj(p)) || Math.abs(p.a[0] - p.b[0]) <= unc(p));
    if (okPair) return { Z, sym: e.sym, field, status: 'match', prim, second: okPair.b };
    const why = notes[key] || prim[2]?.alt || '';
    return { Z, sym: e.sym, field, status: why ? 'explained' : 'MISMATCH', prim, second: pairs[0].b, note: why };
  };
  for (const Z of sample) for (const field of FIELDS5) {
    const r = judge(Z, field);
    ccRows.push(r);
    if (r.status === 'MISMATCH' || (r.status === 'no-second-source' && !r.note) || (r.status === 'no-primary' && !r.note)) unexplained.push(`${r.sym}:${field} ${r.status}`);
  }
  const counts = ccRows.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
  check('cross-check: 20 random elements × 5 fields match a second source or the gap is explained', unexplained.length === 0, `sample Z=${sample.join(',')}; ${JSON.stringify(counts)}; unexplained: ${unexplained.join(', ')}`);

  // ---- 11. bookkeeping -------------------------------------------------------------------------
  const used = new Set();
  const collect = v => { if (isVal(v)) used.add(v[1]); };
  for (const e of D.elements) { Object.values(e.f).forEach(collect); Object.values(e.names).forEach(v => v && collect(v)); Object.values(e.zeff).forEach(collect); }
  check('placeholders are few and tracked in QUESTIONS.md', nPlaceholder <= 40 && fs.readFileSync(path.join(ROOT, 'QUESTIONS.md'), 'utf8').includes('Q1'), `${nPlaceholder} placeholder values`);

  if (report) {
    const all = [];
    for (const e of D.elements) for (const field of FIELDS5) all.push(judge(e.Z, field));
    const fmt = v => (v ? `${v[0]} (${v[1]})` : '—');
    const lines = ['# Cross-check report (generated by tools/validate.mjs --report)', '',
      `Tolerances: mp/bp ±max(2 K, 1 %), density ±2 %, IE ±0.5 %, atomic weight ±0.1 %. Second sources: Wikipedia infobox, mendeleev (CRC), PubChem.`, '',
      `SPEC sample (seed 20261120): Z = ${sample.join(', ')} → ${JSON.stringify(counts)}`, '',
      '| Z | El | field | primary | second source | status | note |', '|---|---|---|---|---|---|---|'];
    for (const r of all.filter(r => r.status !== 'match')) lines.push(`| ${r.Z} | ${r.sym} | ${r.field} | ${fmt(r.prim)} | ${fmt(r.second)} | ${r.status} | ${(r.note || '').replace(/\|/g, '/')} |`);
    const tot = all.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
    lines.splice(4, 0, `Full table (118 × 5): ${JSON.stringify(tot)} — only non-matching rows are listed below.`, '');
    fs.writeFileSync(path.join(ROOT, 'data/crosscheck.md'), lines.join('\n') + '\n');
  }

  for (const r of results) if (!r.ok) fails.push(r);
  if (!quiet) {
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
    console.log(`\nvalues: ${nVals} (null with reason: ${nNull}, predicted/estimated: ${nPred}, placeholders: ${nPlaceholder}); sample-view outcomes: ${JSON.stringify(kinds)}`);
    console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nALL CHECKS PASSED');
  }
  return { results, fails };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { fails } = runValidation({ report: process.argv.includes('--report') });
  process.exit(fails.length ? 1 : 0);
}
