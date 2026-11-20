// Wording for the atom place (PARALLEL.md: owned by the "atom" session). English first; Vietnamese
// drafts for moony's review. Numbers are never written here: {placeholders} are filled from the data.
// Keys use the prefix "atom." so they can never collide with another place's keys.
import { STRINGS } from '../i18n.js';

const EN = {
};
const VI = {
};

Object.assign(STRINGS.en, EN);
Object.assign(STRINGS.vi, VI);
export const ATOM_KEYS = Object.keys(EN);
export const ATOM_VI_KEYS = Object.keys(VI);
