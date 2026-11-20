// Design tokens: the ONE source of truth for colour, type, space, motion and the 3D look (STYLE.md).
// Read by the app (3D materials, lights, printed tile labels) and by tools/build.mjs, which writes them
// as CSS custom properties (:root { --paper: … }) at the top of the inlined stylesheet. Pure data: no DOM.

export const color = {
  paper: '#F5F0E6', paperDeep: '#ECE5D8', card: '#FBF8F2',
  ink: '#1C1A17', ink2: '#57524B', ink3: '#857E73',
  line: 'rgba(28,26,23,0.12)', lineStrong: 'rgba(28,26,23,0.22)',
  verdigris: '#0E6B62', verdigrisSoft: 'rgba(14,107,98,0.10)', verdigrisHover: '#0B5A52',
  ember: '#B93E12',
  kiln: '#15100C', kilnText: '#F2E8DA', kilnText2: '#B9AC9C',
  shadow: '#2A2016',
};

// Family glazes: muted mineral pigments; ink symbols reach >= 6.7:1 on every one (STYLE.md §3).
export const pigment = {
  alkali: '#E8955A', 'alkaline-earth': '#EBC55E', transition: '#8FA9CF', 'post-transition': '#A9CBD6', metalloid: '#7FC0A8',
  nonmetal: '#B5D27F', halogen: '#E39BBA', 'noble-gas': '#B7A6DA', lanthanide: '#DCC6A0', actinide: '#C9967C',
};
// Colour-blind-safe alternative (Okabe–Ito hues, lightened for paper and ink symbols).
export const pigmentCB = {
  alkali: '#E69F00', 'alkaline-earth': '#F0E442', transition: '#56B4E9', 'post-transition': '#A9D7F2', metalloid: '#3FB38F',
  nonmetal: '#A8E0C9', halogen: '#E2A1C9', 'noble-gas': '#CBBBE9', lanthanide: '#EFDFB5', actinide: '#E58C5E',
};
// heat map: ink symbols on solid 8.7:1, light symbols on liquid 5:1, ink on gas 7.8:1; 'unknown' is a blank paper tone
export const stateColor = { solid: '#AEB8C8', liquid: '#2A6FAE', gas: '#E0A33A', unknown: '#E6DFD2' };
export const phaseInk = { plus: '#C8501E', minus: '#2C5DB0' };

export const font = {
  serif: '"Iowan Old Style", Charter, "Palatino Linotype", Palatino, "Noto Serif", Georgia, serif',
  serifVi: '"Noto Serif", "Palatino Linotype", Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif',
};
// [size px, line-height px] desktop / phone
export const type = {
  display: [56, 60, 40, 44], title: [30, 36, 24, 30], lead: [20, 30, 18, 27],
  body: [16, 25, 16, 24], label: [14, 20, 14, 20], caption: [13, 18, 13, 18],
};
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 };
export const radius = { chip: 10, card: 16, pill: 999 };
export const elevation = {
  paper: '0 1px 2px rgba(28,26,23,0.06), 0 8px 24px rgba(28,26,23,0.08)',
  float: '0 2px 4px rgba(28,26,23,0.06), 0 16px 40px rgba(28,26,23,0.14)',
};

// Motion (ms unless noted). Camera durations are seconds (OrbitRig.flyTo).
export const motion = {
  tap: 90, hover: 160, cardIn: 280, cardOut: 200, lens: 650, lensStagger: 250, counter: 300, kiln: 600, parallaxFollow: 300,
  glide: 0.9, dive: 1.4, back: 0.9,
  ease: 'cubic-bezier(.2,.8,.2,1)', easeIn: 'cubic-bezier(.4,0,1,1)', easeInOut: 'cubic-bezier(.65,0,.35,1)',
  parallaxMaxDeg: 1.2,
};

// 3D: daylight studio (STYLE.md §6).
export const light = {
  sky: '#FFF7EC', ground: '#D9CFC0', hemi: 0.95,
  key: '#FFF1DE', keyIntensity: 2.0, keyPos: [-9, 22, 14],
  rim: '#DCE6F5', rimIntensity: 0.5, rimPos: [10, 8, -16],
  exposure: 1.0,
};
export const tile = {
  width: 0.86, thickness: 0.36, bevel: 0.055, sideDarken: 0.38, topRoughness: 0.16, sideRoughness: 0.34,
  hoverLift: 0.07, selectLift: 0.26, shadowOpacity: 0.5,
  // glaze: how strongly the tiles reflect the soft studio (tableArt.js GLAZE); tintJitter: each tile's
  // glaze a touch different, like handmade ware
  glaze: 0.6, tintJitter: 0.05,
};

const kebab = s => s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase(); // ink2 -> ink-2, kilnText2 -> kiln-text-2
/** CSS custom properties for every token (written by tools/build.mjs before the stylesheet). */
export function cssVars() {
  const v = [];
  for (const [k, x] of Object.entries(color)) v.push(`--${kebab(k)}:${x}`);
  for (const [k, x] of Object.entries(pigment)) v.push(`--pig-${k}:${x}`);
  for (const [k, x] of Object.entries(stateColor)) v.push(`--state-${k}:${x}`);
  v.push(`--font-serif:${font.serif}`, `--font-serif-vi:${font.serifVi}`, `--font-sans:${font.sans}`);
  for (const [k, [d, dl, p, pl]] of Object.entries(type)) v.push(`--t-${k}:${d}px`, `--lh-${k}:${dl}px`, `--t-${k}-phone:${p}px`, `--lh-${k}-phone:${pl}px`);
  for (const [k, x] of Object.entries(space)) v.push(`--s${k}:${x}px`);
  for (const [k, x] of Object.entries(radius)) v.push(`--r-${k}:${x}px`);
  for (const [k, x] of Object.entries(elevation)) v.push(`--elev-${k}:${x}`);
  v.push(`--ease:${motion.ease}`, `--ease-in:${motion.easeIn}`, `--ease-in-out:${motion.easeInOut}`);
  for (const k of ['tap', 'hover', 'cardIn', 'cardOut', 'counter', 'kiln']) v.push(`--d-${kebab(k)}:${motion[k]}ms`);
  return `:root{${v.join(';')}}`;
}
