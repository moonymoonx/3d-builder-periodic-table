// Category colours: varied in hue AND lightness so neighbouring families stay distinguishable
// with common colour-vision deficiencies; colour is never the only cue (legend, labels, sheet).
export const CATEGORY_COLORS = {
  alkali: '#f28e2b',
  'alkaline-earth': '#ffd166',
  transition: '#5aa5ea',
  'post-transition': '#8fd9ec',
  metalloid: '#3fb39b',
  nonmetal: '#a8d672',
  halogen: '#ef9ac4',
  'noble-gas': '#b9a0ec',
  lanthanide: '#e3cfa8',
  actinide: '#c4906a',
};
// "Colour-blind" alternative: Okabe–Ito based, with lightness steps for the extra categories.
export const CATEGORY_COLORS_CB = {
  alkali: '#e69f00',
  'alkaline-earth': '#f0e442',
  transition: '#56b4e9',
  'post-transition': '#a6dcf5',
  metalloid: '#009e73',
  nonmetal: '#7fd6a8',
  halogen: '#cc79a7',
  'noble-gas': '#c5b3e6',
  lanthanide: '#e8d6b4',
  actinide: '#d55e00',
};
export const STATE_COLORS = { solid: '#9fb7e6', liquid: '#3fa7ff', gas: '#ffcf6b', unknown: '#59647d' };
export const PHASE_POS = '#ff9a3c'; // orbital phase +
export const PHASE_NEG = '#3c9dff'; // orbital phase −   (orange/blue: safe for red–green CVD)
