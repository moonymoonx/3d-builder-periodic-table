// Colour of light: wavelength -> sRGB using the CIE 1931 2-degree colour-matching functions
// (table embedded in the data, from the CIE dataset) and the XYZ -> linear sRGB matrix
// (from the W3C CSS Color 4 sample code). Also the "glow" of an emission spectrum.

/** Interpolate the CMF table rows [[lambda, x, y, z], ...] (uniform step). */
export function cmfAt(cmf, lambda) {
  const l0 = cmf[0][0], step = cmf[1][0] - cmf[0][0];
  const t = (lambda - l0) / step;
  const i = Math.floor(t);
  if (i < 0 || i >= cmf.length - 1) return [0, 0, 0];
  const f = t - i, a = cmf[i], b = cmf[i + 1];
  return [a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2]), a[3] + f * (b[3] - a[3])];
}

export const mul3 = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
export const gammaEncode = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** Display colour for a single wavelength. Out-of-gamut spectral colours are desaturated by
 *  adding white until all channels are >= 0, then scaled so the largest channel is 1. */
export function wavelengthToRGB(lambda, cmf, M) {
  const XYZ = cmfAt(cmf, lambda);
  let rgb = mul3(M, XYZ);
  const mn = Math.min(...rgb);
  if (mn < 0) rgb = rgb.map(c => c - mn);
  const mx = Math.max(...rgb);
  if (mx <= 0) return [0, 0, 0];
  // fade at the ends of the visible range so 380 nm / 750 nm look dim, as they appear to the eye
  const Y = XYZ[1];
  const fade = Math.min(1, 0.25 + 3 * Y);
  return rgb.map(c => gammaEncode((c / mx) * fade));
}

/** Approximate perceived colour of a gas-discharge glow: sum the lines' XYZ weighted by their
 *  relative intensities. lines: [[lambda_nm, intensity], ...]. Returns {rgb:[0..1], ok:boolean}. */
export function glowColour(lines, cmf, M) {
  let X = 0, Y = 0, Z = 0, n = 0;
  for (const [lam, I] of lines) {
    if (!(I > 0)) continue;
    const c = cmfAt(cmf, lam);
    X += I * c[0]; Y += I * c[1]; Z += I * c[2]; n++;
  }
  if (!n || Y <= 0) return { rgb: null, ok: false };
  let rgb = mul3(M, [X / Y, 1, Z / Y]);
  const mn = Math.min(...rgb);
  if (mn < 0) rgb = rgb.map(c => c - mn);
  const mx = Math.max(...rgb);
  return { rgb: rgb.map(c => gammaEncode(c / mx)), ok: true };
}

export const toHex = rgb => '#' + rgb.map(c => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')).join('');
