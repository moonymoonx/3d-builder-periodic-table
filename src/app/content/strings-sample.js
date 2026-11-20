// Wording for the sample place (PARALLEL.md: owned by the "sample" session). English first; Vietnamese
// drafts for moony's review. Numbers are never written here: {placeholders} are filled from the data.
// Keys use the prefix "sample." so they can never collide with another place's keys.
import { STRINGS } from '../i18n.js';

const EN = {
};
const VI = {
};

Object.assign(STRINGS.en, EN);
Object.assign(STRINGS.vi, VI);
export const SAMPLE_KEYS = Object.keys(EN);
export const SAMPLE_VI_KEYS = Object.keys(VI);
