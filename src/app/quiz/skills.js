// Skill map for the Socratic quiz: six skills, each at a level 0–5, kept in this browser only
// (localStorage; nothing is sent anywhere). Levels follow SPEC §2:
//   0 not tried yet · 1 has seen it · 2 solves it with a hint · 3 solves it alone ·
//   4 solves harder ones alone · 5 predicts new cases.
// Levels never go down (no punishment); a streak of first-try answers moves them up.
export const SKILLS = ['table', 'categories', 'orbitals', 'trends', 'states', 'crystals'];
export const MAX_LEVEL = 5;
const KEY = 'pt3d.skills.v1';

export const blankSkills = () => Object.fromEntries(SKILLS.map(k => [k, { lvl: 0, streak: 0, right: 0, tries: 0 }]));

export function loadSkills(store = globalThis.localStorage) {
  const out = blankSkills();
  try {
    const raw = JSON.parse(store?.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      for (const k of SKILLS) {
        const s = raw[k];
        if (!s) continue;
        out[k] = {
          lvl: Math.max(0, Math.min(MAX_LEVEL, Math.round(+s.lvl || 0))),
          streak: Math.max(0, Math.round(+s.streak || 0)),
          right: Math.max(0, Math.round(+s.right || 0)),
          tries: Math.max(0, Math.round(+s.tries || 0)),
        };
      }
    }
  } catch { /* private mode or corrupt value: start fresh */ }
  return out;
}
export function saveSkills(sk, store = globalThis.localStorage) {
  try { store?.setItem(KEY, JSON.stringify(sk)); } catch { /* storage blocked: progress lasts for this visit only */ }
}

/**
 * Record one finished question.
 * outcome: 'alone' (right first time), 'helped' (right after the smaller guiding question), 'missed'.
 * tier: 1 recall/find, 2 solve, 3 predict a new case.
 * Returns { from, to } levels.
 */
export function record(sk, skill, tier, outcome) {
  const s = sk[skill];
  const from = s.lvl;
  s.tries++;
  s.lvl = Math.max(s.lvl, 1);
  if (outcome === 'alone') {
    s.right++;
    s.streak++;
    if (tier >= 3 && s.lvl >= 4) s.lvl = 5;                       // predicted a new case after mastering the basics
    else if (tier >= 2 && s.lvl >= 3 && s.streak >= 2) s.lvl = Math.max(s.lvl, 4);
    else if (s.streak >= 2) s.lvl = Math.max(s.lvl, 3);          // two in a row without help = solves alone
    else s.lvl = Math.max(s.lvl, 2);
  } else if (outcome === 'helped') {
    s.streak = 0;
    s.lvl = Math.max(s.lvl, 2);
  } else {
    s.streak = 0;
  }
  return { from, to: s.lvl };
}

/** Tier to ask next for a skill at level lvl. */
export const tierFor = lvl => (lvl <= 2 ? 1 : lvl === 3 ? 2 : 3);

/**
 * Pick the next skill: the least-practised one (lowest level), avoiding the one just asked when
 * there is a choice. rand() in [0,1).
 */
export function pickSkill(sk, last, rand = Math.random) {
  const open = SKILLS.filter(k => sk[k].lvl < MAX_LEVEL);
  const pool = open.length ? open : SKILLS.slice();
  const min = Math.min(...pool.map(k => sk[k].lvl));
  let cands = pool.filter(k => sk[k].lvl === min && k !== last);
  if (!cands.length) cands = pool.filter(k => k !== last);
  if (!cands.length) cands = pool;
  return cands[Math.floor(rand() * cands.length)];
}
