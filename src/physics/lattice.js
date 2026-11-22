// Crystal lattices: cell vectors from (a,b,c,alpha,beta,gamma), symmetry-fixed prototype sites,
// supercells, nearest-neighbour distances, and the Lindemann vibration model.
// Positions that are NOT fixed by symmetry (As z, U y, Pu sites, ...) come from COD CIFs in the data.

/** Fractional sites of prototypes whose positions are fixed by space-group symmetry. */
export const PROTOTYPES = {
  bcc: { cell: 'cubic', sites: [[0, 0, 0], [0.5, 0.5, 0.5]] },
  fcc: { cell: 'cubic', sites: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]] },
  hcp: { cell: 'hexagonal', sites: [[1 / 3, 2 / 3, 0.25], [2 / 3, 1 / 3, 0.75]] },
  dhcp: { cell: 'hexagonal', sites: [[0, 0, 0], [0, 0, 0.5], [1 / 3, 2 / 3, 0.25], [2 / 3, 1 / 3, 0.75]] },
  diamond: { cell: 'cubic', sites: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]] },
  graphite: { cell: 'hexagonal', sites: [[0, 0, 0.25], [0, 0, 0.75], [1 / 3, 2 / 3, 0.25], [2 / 3, 1 / 3, 0.75]] },
  sc: { cell: 'cubic', sites: [[0, 0, 0]] },
  bct: { cell: 'tetragonal', sites: [[0, 0, 0], [0.5, 0.5, 0.5]] },
};

const rad = d => (d * Math.PI) / 180;

/** Cartesian cell vectors (a along x, b in the xy plane). Lengths in the input unit. */
export function cellVectors({ a, b = a, c = a, alpha = 90, beta = 90, gamma = 90 }) {
  const ca = Math.cos(rad(alpha)), cb = Math.cos(rad(beta)), cg = Math.cos(rad(gamma)), sg = Math.sin(rad(gamma));
  const A = [a, 0, 0];
  const B = [b * cg, b * sg, 0];
  const cx = c * cb;
  const cy = (c * (ca - cb * cg)) / sg;
  const cz = Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy));
  return [A, B, [cx, cy, cz]];
}

export const fracToCart = (V, f) => [0, 1, 2].map(k => f[0] * V[0][k] + f[1] * V[1][k] + f[2] * V[2][k]);

export function cellVolume(cell) {
  const [A, B, C] = cellVectors(cell);
  return Math.abs(A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0]));
}

/** Shortest distance between distinct atoms in the periodic crystal. */
export function nearestNeighbour(cell, sites) {
  const V = cellVectors(cell);
  let best = Infinity;
  const carts = sites.map(s => fracToCart(V, s));
  for (let i = 0; i < sites.length; i++) for (let j = 0; j < sites.length; j++) {
    for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (let w = -1; w <= 1; w++) {
      if (i === j && !u && !v && !w) continue;
      const t = fracToCart(V, [u, v, w]);
      const d = Math.hypot(carts[j][0] + t[0] - carts[i][0], carts[j][1] + t[1] - carts[i][1], carts[j][2] + t[2] - carts[i][2]);
      if (d > 1e-9 && d < best) best = d;
    }
  }
  return best;
}

/** Coordination number: neighbours within (1 + tol) * nearest distance of site 0. */
export function coordination(cell, sites, tol = 0.02) {
  const V = cellVectors(cell);
  const d0 = nearestNeighbour(cell, sites);
  const p0 = fracToCart(V, sites[0]);
  let n = 0;
  for (const s of sites) for (let u = -2; u <= 2; u++) for (let v = -2; v <= 2; v++) for (let w = -2; w <= 2; w++) {
    const p = fracToCart(V, [s[0] + u, s[1] + v, s[2] + w]);
    const d = Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]);
    if (d > 1e-9 && d <= d0 * (1 + tol)) n++;
  }
  return n;
}

/** Atom positions for an n1 x n2 x n3 block of cells, centred on the origin. Adds the boundary
 *  atoms (fractional coordinate 0 also drawn at 1) so the block looks closed. */
export function supercell(cell, sites, n1, n2 = n1, n3 = n1, { closeFaces = true } = {}) {
  const V = cellVectors(cell);
  const out = [];
  const eps = 1e-6;
  for (let i = 0; i < n1 + (closeFaces ? 1 : 0); i++) for (let j = 0; j < n2 + (closeFaces ? 1 : 0); j++) for (let k = 0; k < n3 + (closeFaces ? 1 : 0); k++) {
    for (const s of sites) {
      const f = [s[0] + i, s[1] + j, s[2] + k];
      if (f[0] > n1 + eps || f[1] > n2 + eps || f[2] > n3 + eps) continue;
      out.push(fracToCart(V, f));
    }
  }
  const centre = fracToCart(V, [n1 / 2, n2 / 2, n3 / 2]);
  return out.map(p => [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]]);
}

/** Lindemann model: rms displacement grows like sqrt(T) and reaches ratio*d at the melting point.
 *  ratio ~0.1 is the commonly quoted Lindemann ratio (a model parameter, labelled in the UI). */
export function lindemannRms(T, Tm, dNN, ratio = 0.1) {
  if (!(Tm > 0) || !(T > 0)) return 0;
  return ratio * dNN * Math.sqrt(Math.min(T, Tm) / Tm);
}

/** Root-mean-square speed of a gas particle, sqrt(3RT/M), M in g/mol -> m/s. R passed in (CODATA). */
export const rmsSpeed = (T, M, R) => Math.sqrt((3 * R * T) / (M / 1000));

// ---- a small piece of a molecular or complex crystal (sample view) ---------------------------------------
/** The piece (lat.pieces, from a COD entry) shown at temperature T in kelvin, or null. A piece's T is
 *  [from, to]; to = null runs up to the melting point. */
export function pieceAt(e, T) {
  const list = e.lat && e.lat.pieces;
  if (!list || !list.length || T == null) return null;
  return list.find(p => T >= p.T[0] && (p.T[1] == null || T < p.T[1])) || null;
}

/**
 * Whole molecules (perMol atoms each; 1 = single atoms) cut from a block of cells, nearest the centre first
 * (in the cube sense), so the piece is a rough cube of about `want` atoms. Molecules are found once in the
 * cell, with periodic images: atoms closer than `cut` (pm) belong to one molecule. Returns positions in pm,
 * centred, with the crystal's z axis as the scene's up (as the lattices are drawn), and the molecules' size.
 */
export function pieceAtoms(piece, perMol, cut, want) {
  const V = cellVectors(piece.cell), S = piece.sites;
  const cart = f => fracToCart(V, f);
  // 1. molecules in one cell: lists of [site, image offset]; each site belongs to one molecule
  const mols = [], used = new Array(S.length).fill(false);
  for (let s0 = 0; s0 < S.length; s0++) {
    if (used[s0]) continue;
    used[s0] = true;
    const mol = [[s0, [0, 0, 0]]];
    for (let q = 0; q < mol.length && perMol > 1; q++) {
      const [s, o] = mol[q];
      for (let j = 0; j < S.length; j++) {
        if (used[j]) continue;
        let hit = null;
        for (let a = -1; a <= 1 && !hit; a++) for (let b = -1; b <= 1 && !hit; b++) for (let c = -1; c <= 1 && !hit; c++) {
          const d = cart([S[j][0] + a - S[s][0], S[j][1] + b - S[s][1], S[j][2] + c - S[s][2]]);
          if (Math.hypot(d[0], d[1], d[2]) < cut) hit = [o[0] + a, o[1] + b, o[2] + c];
        }
        if (hit) { used[j] = true; mol.push([j, hit]); }
      }
    }
    // its centre back inside the cell
    const fc = [0, 1, 2].map(k => mol.reduce((t, [j, o]) => t + S[j][k] + o[k], 0) / mol.length);
    const sh = fc.map(Math.floor);
    mols.push({ atoms: mol.map(([j, o]) => [0, 1, 2].map(k => S[j][k] + o[k] - sh[k])), fc: fc.map((v, k) => v - sh[k]) });
  }
  const sizes = mols.map(m => m.atoms.length);
  // 2. tile the cell's molecules over a block large enough for a cube of `want` atoms
  const vol = Math.abs(V[0][0] * (V[1][1] * V[2][2] - V[1][2] * V[2][1]) - V[0][1] * (V[1][0] * V[2][2] - V[1][2] * V[2][0]) + V[0][2] * (V[1][0] * V[2][1] - V[1][1] * V[2][0]));
  const L = Math.cbrt((want * vol) / S.length);
  const m = V.map(v => Math.ceil(L / Math.hypot(...v)) + 1);
  const o = cart([0.5, 0.5, 0.5]);
  const all = [];
  for (let i = -m[0]; i < m[0]; i++) for (let j = -m[1]; j < m[1]; j++) for (let k = -m[2]; k < m[2]; k++) {
    for (const ml of mols) {
      const c = cart([ml.fc[0] + i, ml.fc[1] + j, ml.fc[2] + k]);
      all.push({ ml, t: [i, j, k], d: Math.max(Math.abs(c[0] - o[0]), Math.abs(c[1] - o[1]), Math.abs(c[2] - o[2])) });
    }
  }
  all.sort((p, q) => p.d - q.d);
  // whole shells only (every molecule as near as the farthest one kept, within 1 pm): a clean cube with no
  // stragglers sticking out of one face; stop at about `want` atoms (at most 20 % over)
  let cnt = 0, k = 0;
  while (k < all.length) {
    let j = k, c = cnt;
    while (j < all.length && all[j].d - all[k].d < 1) { c += all[j].ml.atoms.length; j++; }
    if (c > want * 1.2 && cnt > 0) break;
    k = j; cnt = c;
    if (cnt >= want) break;
  }
  const pts = [];
  for (const { ml, t } of all.slice(0, k)) for (const f of ml.atoms) { const p = cart([f[0] + t[0], f[1] + t[1], f[2] + t[2]]); pts.push([p[0], p[2], p[1]]); }
  const cen = [0, 1, 2].map(q => pts.reduce((s, p) => s + p[q], 0) / pts.length);
  return { pts: pts.map(p => p.map((v, q) => v - cen[q])), sizes };
}
