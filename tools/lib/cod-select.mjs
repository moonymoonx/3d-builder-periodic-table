// Deterministic choice of Crystallography Open Database entries for element structures.
// Rule: space-group number must match the wanted phase; ambient pressure; not a duplicate or
// retracted entry; then the cell temperature closest to 293 K (explicit temperature preferred
// over unknown), then entries with an R factor, then the newest publication.
export const COD_PHASES = {
  Ga: [{ phase: 'alpha-Ga', sg: [64] }],
  As: [{ phase: 'grey As (A7)', sg: [166] }],
  Se: [{ phase: 'trigonal (grey) Se', sg: [152, 154] }],
  Sb: [{ phase: 'Sb (A7)', sg: [166] }],
  Te: [{ phase: 'trigonal Te', sg: [152, 154] }],
  Bi: [{ phase: 'Bi (A7)', sg: [166] }],
  Sm: [{ phase: 'alpha-Sm (9R)', sg: [166] }],
  U: [{ phase: 'alpha-U', sg: [63] }],
  Np: [{ phase: 'alpha-Np', sg: [62] }],
  Pu: [{ phase: 'alpha-Pu', sg: [11] }],
  Hg: [{ phase: 'alpha-Hg', sg: [166] }],
  In: [{ phase: 'In (A6)', sg: [139] }],
  Sn: [{ phase: 'beta-Sn (white)', sg: [141] }, { phase: 'alpha-Sn (grey)', sg: [227] }],
  Pa: [{ phase: 'alpha-Pa', sg: [139] }],
  Po: [{ phase: 'alpha-Po', sg: [221] }],
  // graphite and lonsdaleite share P6_3/mmc: graphite has c/a ~ 2.7, lonsdaleite ~ 1.6
  C: [{ phase: 'graphite (hexagonal)', sg: [194], check: r => num(r.c) / num(r.a) > 2.2 && num(r.c) / num(r.a) < 3.2 },
    { phase: 'diamond', sg: [227], check: r => num(r.a) < 4 }],
  Si: [{ phase: 'diamond-cubic Si', sg: [227] }],
  Ge: [{ phase: 'diamond-cubic Ge', sg: [227] }],
  // iron above room temperature: windows are the 1-atm stability ranges from our sources
  // (gamma: 912-1394 °C = 1185-1667 K, Wikipedia infobox; delta: 1667 K to the PubChem melting point 1811 K)
  Fe: [{ phase: 'alpha-Fe', sg: [229], window: [250, 330] },
    { phase: 'gamma-Fe', sg: [225], window: [1185.15, 1667.15] },
    { phase: 'delta-Fe', sg: [229], window: [1667.15, 1811] }],
  Am: [{ phase: 'alpha-Am (dhcp)', sg: [194] }],
  Cm: [{ phase: 'alpha-Cm (dhcp)', sg: [194] }],
  Bk: [{ phase: 'alpha-Bk (dhcp)', sg: [194] }],
  Cf: [{ phase: 'alpha-Cf (dhcp)', sg: [194] }],
  Es: [{ phase: 'Es (fcc)', sg: [225] }],
};

const num = v => (v === null || v === undefined || v === '' ? null : Number(v));

export function codCandidates(sym, rows, want) {
  return rows.filter(r => {
    const sg = num(r.sgNumber);
    if (!want.sg.includes(sg)) return false;
    if (r.duplicateof) return false;
    if (r.status && /retract/i.test(r.status)) return false;
    const p = num(r.cellpressure) ?? num(r.diffrpressure);
    if (p !== null && p > 200) return false; // COD pressures are in kPa; keep ambient only
    if (!(num(r.a) > 0)) return false;
    if (want.check && !want.check(r)) return false;
    // local-structure models (XAFS/PDF) are not long-range crystal structures
    if (/local (atomic )?structure/i.test(String(r.title || ''))) return false;
    if (want.window) {
      const T = num(r.celltemp) ?? num(r.diffrtemp);
      if (T === null || T < want.window[0] || T > want.window[1]) return false;
    }
    return true;
  });
}

// An entry without a stated temperature is usually a room-temperature study: rank it as if it
// were 25 K away from 293 K, so explicit 263-318 K entries win but a 100 K entry does not.
const UNKNOWN_T_PENALTY = 25;
export function rankCod(rows, target = 293) {
  const T = r => num(r.celltemp) ?? num(r.diffrtemp);
  return [...rows].sort((x, y) => {
    const tx = T(x), ty = T(y);
    const dx = tx === null ? UNKNOWN_T_PENALTY : Math.abs(tx - target), dy = ty === null ? UNKNOWN_T_PENALTY : Math.abs(ty - target);
    if (dx !== dy) return dx - dy;
    const rx = num(x.Robs) ?? num(x.Rall), ry = num(y.Robs) ?? num(y.Rall);
    if ((rx === null) !== (ry === null)) return rx === null ? 1 : -1;
    return (num(y.year) || 0) - (num(x.year) || 0) || String(x.file).localeCompare(String(y.file));
  });
}

export function selectCod(sym, rows) {
  const out = [];
  for (const want of COD_PHASES[sym] || []) {
    const target = want.window ? (want.window[0] + want.window[1]) / 2 : 293;
    const ranked = rankCod(codCandidates(sym, rows, want), target);
    if (!ranked.length) continue;
    const r = ranked[0];
    const T = num(r.celltemp) ?? num(r.diffrtemp);
    out.push({
      file: String(r.file), phase: want.phase,
      reason: `sg ${r.sg} (#${r.sgNumber}); T=${T ?? 'n/a'} K; ${String(r.authors || '').slice(0, 60)} ${r.year || ''}; ${ranked.length} candidates`,
    });
  }
  return out;
}
