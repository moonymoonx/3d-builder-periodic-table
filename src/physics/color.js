// Colour of light: wavelength -> sRGB using the analytic multi-lobe Gaussian fit to the CIE 1931 2°
// colour-matching functions (Wyman, Sloan & Shirley 2013; coefficients carried in the data as cmfFit)
// and the XYZ -> linear sRGB matrix (W3C CSS Color 4). No CIE table is embedded.

/** fit = { x: [[amp, mu, tau1, tau2], ...], y: [...], z: [...] }; g = exp(-tau^2 (l - mu)^2 / 2). */
export function cmfAt(fit, lambda) {
  const lobe = terms => {
    let s = 0;
    for (const [a, mu, t1, t2] of terms) {
      const t = lambda < mu ? t1 : t2;
      const d = lambda - mu;
      s += a * Math.exp(-0.5 * t * t * d * d);
    }
    return s;
  };
  return [lobe(fit.x), lobe(fit.y), lobe(fit.z)];
}

export const mul3 = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
export const gammaEncode = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** The hue is read no further out than these: real monochromatic light keeps one hue beyond ~650 nm and
 *  below ~420 nm (the CIE 1931 spectral locus stays near x = 0.73 and x = 0.17 there), but the analytic
 *  fit's tails drift because its x̄ falls off faster than its ȳ: deep red turned olive, then green (749 nm
 *  came out #008946), and the violet end teal. At 400 and 680 nm the fit still gives a clean violet and
 *  red. (Found by the atom session, PROPOSALS-atom.md #1.) */
export const HUE_VIOLET = 400, HUE_RED = 680;

/** Display colour for one wavelength. Spectral colours lie outside sRGB: white is added until all
 *  channels are >= 0, then the colour is scaled so its largest channel is 1 and dimmed at the ends
 *  of the visible range, where the eye is barely sensitive (the brightness follows the wavelength
 *  itself; the hue is held at HUE_VIOLET / HUE_RED beyond them). */
export function wavelengthToRGB(lambda, fit, M) {
  const XYZ = cmfAt(fit, Math.min(HUE_RED, Math.max(HUE_VIOLET, lambda)));
  let rgb = mul3(M, XYZ);
  const mn = Math.min(...rgb);
  if (mn < 0) rgb = rgb.map(c => c - mn);
  const mx = Math.max(...rgb);
  if (mx <= 0) return [0, 0, 0];
  const fade = Math.min(1, 0.25 + 3 * Math.max(0, cmfAt(fit, lambda)[1]));
  return rgb.map(c => gammaEncode((c / mx) * fade));
}

/** Approximate colour of a gas-discharge glow: the lines' XYZ summed with their relative intensities.
 *  lines: [[lambda_nm, intensity], ...]. Returns {rgb: [0..1] | null, ok}.
 *  Not shown in the app: with only the 8 strongest lines it contradicts known lamp colours (neon came out
 *  green, strontium blue; DECISIONS.md, merge review of view-atom). Kept for the validator's sodium check. */
export function glowColour(lines, fit, M) {
  let X = 0, Y = 0, Z = 0, n = 0;
  for (const [lam, I] of lines) {
    if (!(I > 0)) continue;
    const c = cmfAt(fit, lam);
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
