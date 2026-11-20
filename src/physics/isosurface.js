// Iso-surface extraction by marching tetrahedra on a cubic grid (each cube split into 6 tetrahedra
// around its main diagonal: no lookup tables, no ambiguous cases). Used for 90 % orbital surfaces.
// grid = { f: Float32Array(N^3), N, L, h } spanning [-L, L]^3 (see orbitals.gridPsi).
// Returns { positions, normals } (Float32Array, xyz per vertex, 3 vertices per triangle) for f = level,
// with normals pointing towards decreasing f (outwards when the inside is f > level).

const CORNERS = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const TETS = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];

export function polygonise(grid, level, sign = 1) {
  const { f, N, L, h } = grid;
  const at = (i, j, k) => sign * f[i + N * (j + N * k)];
  const pos = [], nrm = [];
  const P = new Float64Array(24), G = new Float64Array(24), Vv = new Float64Array(8);
  const grad = (i, j, k, out, o) => {
    const ip = Math.min(i + 1, N - 1), im = Math.max(i - 1, 0), jp = Math.min(j + 1, N - 1), jm = Math.max(j - 1, 0), kp = Math.min(k + 1, N - 1), km = Math.max(k - 1, 0);
    out[o] = at(ip, j, k) - at(im, j, k); out[o + 1] = at(i, jp, k) - at(i, jm, k); out[o + 2] = at(i, j, kp) - at(i, j, km);
  };
  const emit = (a, b) => {
    // point on edge a-b where f = level, with interpolated (negative) gradient as normal
    const t = (level - Vv[a]) / (Vv[b] - Vv[a] || 1e-30);
    pos.push(P[3 * a] + t * (P[3 * b] - P[3 * a]), P[3 * a + 1] + t * (P[3 * b + 1] - P[3 * a + 1]), P[3 * a + 2] + t * (P[3 * b + 2] - P[3 * a + 2]));
    let nx = -(G[3 * a] + t * (G[3 * b] - G[3 * a])), ny = -(G[3 * a + 1] + t * (G[3 * b + 1] - G[3 * a + 1])), nz = -(G[3 * a + 2] + t * (G[3 * b + 2] - G[3 * a + 2]));
    const l = Math.hypot(nx, ny, nz) || 1;
    nrm.push(nx / l, ny / l, nz / l);
  };
  for (let k = 0; k < N - 1; k++) for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
    let any = 0, all = 1;
    for (let c = 0; c < 8; c++) {
      const [di, dj, dk] = CORNERS[c];
      const v = at(i + di, j + dj, k + dk);
      Vv[c] = v;
      if (v > level) any = 1; else all = 0;
    }
    if (!any || all) continue;
    for (let c = 0; c < 8; c++) {
      const [di, dj, dk] = CORNERS[c];
      P[3 * c] = -L + (i + di) * h; P[3 * c + 1] = -L + (j + dj) * h; P[3 * c + 2] = -L + (k + dk) * h;
      grad(i + di, j + dj, k + dk, G, 3 * c);
    }
    for (const t of TETS) {
      const ins = t.filter(c => Vv[c] > level), out = t.filter(c => Vv[c] <= level);
      if (ins.length === 0 || ins.length === 4) continue;
      if (ins.length === 1) { emit(ins[0], out[0]); emit(ins[0], out[1]); emit(ins[0], out[2]); }
      else if (ins.length === 3) { emit(out[0], ins[0]); emit(out[0], ins[1]); emit(out[0], ins[2]); }
      else {
        const [a, b] = ins, [c, d] = out;
        emit(a, c); emit(a, d); emit(b, d);
        emit(a, c); emit(b, d); emit(b, c);
      }
    }
  }
  // orient every triangle so its winding agrees with the (outward) gradient normals
  for (let t = 0; t < pos.length; t += 9) {
    const ax = pos[t + 3] - pos[t], ay = pos[t + 4] - pos[t + 1], az = pos[t + 5] - pos[t + 2];
    const bx = pos[t + 6] - pos[t], by = pos[t + 7] - pos[t + 1], bz = pos[t + 8] - pos[t + 2];
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
    const nx = nrm[t] + nrm[t + 3] + nrm[t + 6], ny = nrm[t + 1] + nrm[t + 4] + nrm[t + 7], nz = nrm[t + 2] + nrm[t + 5] + nrm[t + 8];
    if (cx * nx + cy * ny + cz * nz < 0) {
      for (const arr of [pos, nrm]) for (let k = 0; k < 3; k++) { const tmp = arr[t + 3 + k]; arr[t + 3 + k] = arr[t + 6 + k]; arr[t + 6 + k] = tmp; }
    }
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm) };
}
