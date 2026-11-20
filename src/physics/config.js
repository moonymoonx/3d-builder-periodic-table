// Electron configurations: parsing (NIST / PubChem notation), aufbau (Madelung) filling,
// exception detection and Slater's-rules effective nuclear charge.
// Pure functions; shared by the app and the node test-suite.

export const L_LETTERS = 'spdfghik';
export const capacity = l => 2 * (2 * l + 1);
export const subshellName = (n, l) => `${n}${L_LETTERS[l]}`;

// Madelung (n + l, then n) order, generated rather than typed.
export const MADELUNG_ORDER = (() => {
  const out = [];
  for (let n = 1; n <= 8; n++) for (let l = 0; l < n && l <= 3; l++) out.push([n, l]);
  out.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
  return out.filter(([n, l]) => n + l <= 8 && !(n === 8));
})();

/** Parse "1s2.2s2.2p2", "[Ar].3d5.4s", "[Rn]7s2 5f14 6d2", "[Rn] 5f12 7s2 (predicted)". */
export function parseConfig(str) {
  if (!str) return null;
  let s = String(str).replace(/\(predicted\)|\(calculated\)|\(estimated\)/gi, '').trim();
  let core = null;
  const m = s.match(/^\[([A-Z][a-z]?)\]/);
  if (m) { core = m[1]; s = s.slice(m[0].length); }
  const subs = [];
  for (const tok of s.split(/[.\s]+/).filter(Boolean)) {
    const t = tok.match(/^(\d+)([spdfghik])(\d*)$/);
    if (!t) throw new Error(`cannot parse configuration token "${tok}" in "${str}"`);
    subs.push({ n: +t[1], l: L_LETTERS.indexOf(t[2]), occ: t[3] === '' ? 1 : +t[3] });
  }
  return { core, subs };
}

/** Expand a parsed configuration into a full subshell map using core definitions
 *  (coreMap: symbol -> parsed config of that noble gas, itself possibly with a core). */
export function expandConfig(parsed, coreMap) {
  const occ = new Map();
  const add = p => {
    if (p.core) {
      const c = coreMap[p.core];
      if (!c) throw new Error('unknown core ' + p.core);
      add(c);
    }
    for (const { n, l, occ: o } of p.subs) occ.set(`${n},${l}`, (occ.get(`${n},${l}`) || 0) + o);
  };
  add(parsed);
  return sortSubshells([...occ.entries()].map(([k, o]) => { const [n, l] = k.split(',').map(Number); return { n, l, occ: o }; }));
}

export const sortSubshells = list => list.slice().sort((a, b) => a.n - b.n || a.l - b.l);
export const electronCount = list => list.reduce((s, x) => s + x.occ, 0);

/** Aufbau prediction for a neutral atom with Z electrons. */
export function madelungConfig(Z) {
  const out = []; let left = Z;
  for (const [n, l] of MADELUNG_ORDER) {
    if (left <= 0) break;
    const o = Math.min(capacity(l), left);
    out.push({ n, l, occ: o }); left -= o;
  }
  return sortSubshells(out);
}

/** Differences between two subshell lists: [{n,l,from,to}] */
export function configDiff(a, b) {
  const key = x => `${x.n},${x.l}`;
  const ma = new Map(a.map(x => [key(x), x.occ])), mb = new Map(b.map(x => [key(x), x.occ]));
  const keys = new Set([...ma.keys(), ...mb.keys()]);
  const out = [];
  for (const k of keys) {
    const from = ma.get(k) || 0, to = mb.get(k) || 0;
    if (from !== to) { const [n, l] = k.split(',').map(Number); out.push({ n, l, from, to }); }
  }
  return out.sort((x, y) => x.n - y.n || x.l - y.l);
}

/** Plain text "3d5 4s1" (or with noble-gas core when coreList given). */
export function formatConfig(list, { core = null, coreSubs = null, sup = false } = {}) {
  const supMap = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const fmtOcc = o => (sup ? String(o).split('').map(c => supMap[c]).join('') : String(o));
  let rest = list;
  let prefix = '';
  if (core && coreSubs) {
    const ck = new Map(coreSubs.map(x => [`${x.n},${x.l}`, x.occ]));
    rest = list.filter(x => ck.get(`${x.n},${x.l}`) !== x.occ);
    prefix = `[${core}]`;
  }
  // display order: by n then l (NIST style)
  const body = sortSubshells(rest).map(x => `${subshellName(x.n, x.l)}${fmtOcc(x.occ)}`).join(' ');
  return (prefix + (prefix && body ? ' ' : '') + body).trim();
}

// ---- Slater's rules (J. C. Slater, Phys. Rev. 36, 57 (1930)) -------------------------------
// Groups in Slater order: (1s)(2s,2p)(3s,3p)(3d)(4s,4p)(4d)(4f)(5s,5p)(5d)(5f)(6s,6p)(6d)(7s,7p)
function slaterGroup(n, l) { return l <= 1 ? `${n}sp` : `${n}${L_LETTERS[l]}`; }
const SLATER_ORDER = ['1sp', '2sp', '3sp', '3d', '4sp', '4d', '4f', '5sp', '5d', '5f', '6sp', '6d', '6f', '7sp', '7d', '8sp'];

/** Shielding constant for one electron in subshell (n,l) of configuration `list` (neutral atom). */
export function slaterShielding(list, n, l) {
  const g = slaterGroup(n, l);
  const gi = SLATER_ORDER.indexOf(g);
  let S = 0;
  for (const x of list) {
    const xg = slaterGroup(x.n, x.l);
    const xi = SLATER_ORDER.indexOf(xg);
    let count = x.occ;
    if (x.n === n && x.l === l) count -= 1; // exclude the electron itself (once, from its own subshell)
    if (count <= 0) continue;
    if (xg === g) S += count * (g === '1sp' ? 0.30 : 0.35);
    else if (xi > gi) continue; // groups to the right do not shield
    else if (l <= 1) {
      if (x.n === n - 1) S += count * 0.85;
      else if (x.n < n - 1) S += count * 1.0;
      else S += count * 0.35; // same n but different group (cannot happen for s/p groups)
    } else S += count * 1.0; // d/f: everything to the left shields fully
  }
  return S;
}
export const slaterZeff = (Z, list, n, l) => Z - slaterShielding(list, n, l);
