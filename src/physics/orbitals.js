// Hydrogen-like orbitals  psi_nlm(r, theta, phi) = R_nl(r) * Y_lm(theta, phi)
// with REAL spherical harmonics (p_x, d_z2, ...). Distances in Bohr radii (a0); Z is the
// (effective) nuclear charge, so for a many-electron atom this is a labelled approximation.
// Pure functions: used by the app (point clouds, isosurfaces) and by tests/validate.mjs.

export function factorial(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }

/** Generalized Laguerre polynomial L_k^(alpha)(x) (modern normalisation), by recurrence. */
export function laguerre(k, alpha, x) {
  if (k === 0) return 1;
  let L0 = 1, L1 = 1 + alpha - x;
  for (let i = 1; i < k; i++) {
    const L2 = ((2 * i + 1 + alpha - x) * L1 - (i + alpha) * L0) / (i + 1);
    L0 = L1; L1 = L2;
  }
  return L1;
}

export function radialNorm(n, l, Z) {
  return Math.sqrt(Math.pow((2 * Z) / n, 3) * factorial(n - l - 1) / (2 * n * factorial(n + l)));
}

/** R_nl(r), r in a0, result in a0^(-3/2). */
export function radial(n, l, Z, r) {
  const rho = (2 * Z * r) / n;
  return radialNorm(n, l, Z) * Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
}

/** Associated Legendre P_l^m(x), m >= 0, WITHOUT the Condon-Shortley phase. */
export function assocLegendre(l, m, x) {
  let pmm = 1;
  if (m > 0) {
    const s = Math.sqrt(Math.max(0, (1 - x) * (1 + x)));
    let f = 1;
    for (let i = 1; i <= m; i++) { pmm *= f * s; f += 2; }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}

const ylmNormCache = new Map();
function ylmNorm(l, am) {
  const k = l * 16 + am;
  let v = ylmNormCache.get(k);
  if (v === undefined) {
    v = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (factorial(l - am) / factorial(l + am)));
    ylmNormCache.set(k, v);
  }
  return v;
}

/** Real spherical harmonic: m>0 ~ cos(m phi), m<0 ~ sin(|m| phi). Orthonormal on the sphere. */
export function realY(l, m, theta, phi) {
  const am = Math.abs(m);
  const P = assocLegendre(l, am, Math.cos(theta));
  const K = ylmNorm(l, am);
  if (m === 0) return K * P;
  return Math.SQRT2 * K * P * (m > 0 ? Math.cos(m * phi) : Math.sin(am * phi));
}

/** psi at a Cartesian point (a0). */
export function psi(n, l, m, Z, x, y, z) {
  const r = Math.hypot(x, y, z);
  if (r === 0) return l === 0 ? radial(n, 0, Z, 0) * realY(0, 0, 0, 0) : 0;
  return radial(n, l, Z, r) * realY(l, m, Math.acos(Math.max(-1, Math.min(1, z / r))), Math.atan2(y, x));
}

export const ORBITAL_SUFFIX = {
  0: { 0: '' },
  1: { '-1': 'y', 0: 'z', 1: 'x' },
  2: { '-2': 'xy', '-1': 'yz', 0: 'z²', 1: 'xz', 2: 'x²−y²' },
  3: { '-3': 'y(3x²−y²)', '-2': 'xyz', '-1': 'yz²', 0: 'z³', 1: 'xz²', 2: 'z(x²−y²)', 3: 'x(x²−3y²)' },
};
export const orbitalLabel = (n, l, m) => `${n}${'spdf'[l]}${ORBITAL_SUFFIX[l][m] ? '_' + ORBITAL_SUFFIX[l][m] : ''}`;
export const mValues = l => Array.from({ length: 2 * l + 1 }, (_, i) => i - l);

/** <r> for hydrogen-like orbital (a0): (3n^2 - l(l+1)) / (2Z) */
export const meanRadius = (n, l, Z) => (3 * n * n - l * (l + 1)) / (2 * Z);

/** Outer radius that contains essentially all probability (used for grids / sampling). */
export const extentRadius = (n, l, Z) => (2.2 * n * n + 6 * n + 4) / Z;

/** Radial probability CDF table P(r) = int_0^r R^2 r^2 dr on a uniform grid. */
export function radialCDF(n, l, Z, steps = 2048) {
  const rmax = extentRadius(n, l, Z);
  const dr = rmax / steps;
  const cdf = new Float64Array(steps + 1);
  let prev = 0, acc = 0;
  for (let i = 1; i <= steps; i++) {
    const r = i * dr;
    const R = radial(n, l, Z, r);
    const p = R * R * r * r;
    acc += 0.5 * (prev + p) * dr;
    prev = p; cdf[i] = acc;
  }
  return { cdf, dr, rmax, total: acc };
}

/** Radius enclosing fraction f of the radial probability. */
export function radiusForFraction(n, l, Z, f = 0.9) {
  const { cdf, dr, total } = radialCDF(n, l, Z);
  const target = f * total;
  let lo = 0, hi = cdf.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < target) lo = mid; else hi = mid; }
  const t = (target - cdf[lo]) / Math.max(1e-300, cdf[hi] - cdf[lo]);
  return (lo + t) * dr;
}

/** Maximum of Y_lm^2 over the sphere (numerical, cached) for rejection sampling. */
const ymaxCache = new Map();
export function maxY2(l, m) {
  const key = l * 16 + (m + 8);
  if (ymaxCache.has(key)) return ymaxCache.get(key);
  let mx = 0;
  for (let i = 0; i <= 180; i++) for (let j = 0; j < 360; j += 2) {
    const y = realY(l, m, (i * Math.PI) / 180, (j * Math.PI) / 180);
    if (y * y > mx) mx = y * y;
  }
  mx *= 1.02;
  ymaxCache.set(key, mx);
  return mx;
}

/** Deterministic PRNG (mulberry32) so screenshots and tests are reproducible. */
export function rng32(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample `count` points from |psi_nlm|^2. Returns {pos: Float32Array(3*count) in a0, sign: Int8Array}. */
export function sampleOrbital(n, l, m, Z, count, rand = rng32(n * 100 + l * 10 + m + 7)) {
  const { cdf, dr, total } = radialCDF(n, l, Z, 1024);
  const pos = new Float32Array(count * 3);
  const sign = new Int8Array(count);
  const ymax = maxY2(l, m);
  for (let i = 0; i < count; i++) {
    // radius by inverse CDF
    const u = rand() * total;
    let lo = 0, hi = cdf.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
    const r = (lo + (u - cdf[lo]) / Math.max(1e-300, cdf[hi] - cdf[lo])) * dr;
    // direction by rejection from uniform sphere
    let ct, ph, y;
    for (let k = 0; k < 10000; k++) {
      ct = 2 * rand() - 1; ph = 2 * Math.PI * rand();
      y = realY(l, m, Math.acos(ct), ph);
      if (rand() * ymax <= y * y) break;
    }
    const st = Math.sqrt(1 - ct * ct);
    pos[3 * i] = r * st * Math.cos(ph);
    pos[3 * i + 1] = r * st * Math.sin(ph);
    pos[3 * i + 2] = r * ct;
    const R = radial(n, l, Z, r);
    sign[i] = R * y >= 0 ? 1 : -1;
  }
  return { pos, sign };
}

/** Sample psi on a cubic grid of N^3 points spanning [-L, L]^3 (a0). */
export function gridPsi(n, l, m, Z, N, L) {
  const f = new Float32Array(N * N * N);
  const h = (2 * L) / (N - 1);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    f[i + N * (j + N * k)] = psi(n, l, m, Z, -L + i * h, -L + j * h, -L + k * h);
  }
  return { f, N, L, h };
}

/** psi level such that the region |psi| > level holds fraction p of the probability (grid estimate). */
export function isoLevelForFraction(grid, p = 0.9) {
  const vals = Float64Array.from(grid.f, v => v * v);
  let total = 0;
  for (const v of vals) total += v;
  vals.sort();
  let acc = 0;
  for (let i = vals.length - 1; i >= 0; i--) {
    acc += vals[i];
    if (acc >= p * total) return Math.sqrt(vals[i]);
  }
  return 0;
}

/** The 19 subshells occupied in ground-state atoms Z = 1..118 (checked against data by the validator). */
export const OCCUPIED_SUBSHELLS = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [4, 3],
  [5, 0], [5, 1], [5, 2], [5, 3], [6, 0], [6, 1], [6, 2], [7, 0], [7, 1],
];

// ---- numerical checks used by tests and the validator -------------------------------------
export function radialNormIntegral(n, l, Z = 1, steps = 20000) {
  const rmax = extentRadius(n, l, Z) * 1.6;
  const h = rmax / steps;
  let s = 0;
  for (let i = 0; i <= steps; i++) {
    const r = i * h; const R = radial(n, l, Z, r);
    const w = i === 0 || i === steps ? 1 : i % 2 ? 4 : 2;
    s += w * R * R * r * r;
  }
  return (s * h) / 3;
}
export function countRadialNodes(n, l, Z = 1, steps = 40000) {
  const rmax = extentRadius(n, l, Z) * 1.6;
  let nodes = 0, prev = radial(n, l, Z, rmax / steps);
  for (let i = 2; i <= steps; i++) {
    const v = radial(n, l, Z, (i * rmax) / steps);
    if (Math.abs(v) < 1e-14) continue; // far tail underflow
    if ((v > 0) !== (prev > 0)) nodes++;
    prev = v;
  }
  return nodes;
}
/** Angular nodes = nodal cones (zeros of P_l^|m| in theta) + nodal planes (zeros of cos/sin(m phi) in [0, pi)). */
export function countAngularNodes(l, m, steps = 20000) {
  const am = Math.abs(m);
  let cones = 0;
  let prev = assocLegendre(l, am, Math.cos(1e-6));
  for (let i = 1; i <= steps; i++) {
    const th = 1e-6 + (i * (Math.PI - 2e-6)) / steps;
    const v = assocLegendre(l, am, Math.cos(th));
    if ((v > 0) !== (prev > 0) && Math.abs(v) > 1e-12) cones++;
    if (Math.abs(v) > 1e-12) prev = v;
  }
  let planes = 0;
  if (am > 0) {
    const g = ph => (m > 0 ? Math.cos(m * ph) : Math.sin(am * ph));
    const off = 1e-4; // start just off a possible node
    let p = g(off);
    for (let i = 1; i <= steps; i++) {
      const ph = off + (i * Math.PI) / steps;
      const v = g(ph);
      if ((v > 0) !== (p > 0)) planes++;
      p = v;
    }
  }
  return { cones, planes, total: cones + planes };
}
/** Integral of Y_lm^2 over the sphere (should be 1). */
export function angularNormIntegral(l, m, nt = 400, np = 800) {
  let s = 0;
  const dt = Math.PI / nt, dp = (2 * Math.PI) / np;
  for (let i = 0; i < nt; i++) {
    const th = (i + 0.5) * dt;
    const st = Math.sin(th);
    for (let j = 0; j < np; j++) { const y = realY(l, m, th, (j + 0.5) * dp); s += y * y * st; }
  }
  return s * dt * dp;
}
