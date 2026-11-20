// Extract fields from Wikipedia "{{infobox element ...}}" wikitext and parse the numbers we use.

/** All `|key = value` fields of the top-level infobox (value up to the next top-level `|` line). */
export function infoboxFields(wikitext) {
  const out = {};
  // fields start at line beginnings "|name =" ; values may contain templates and refs on one line
  const re = /^\s*\|\s*([^=\n|]+?)\s*=([^\n]*)$/gm;
  let m;
  while ((m = re.exec(wikitext))) {
    const key = m[1].trim();
    // a few infoboxes put two fields on one line: "|crystal structure=x |crystal structure comment=(predicted)"
    let val = m[2];
    const inline = val.match(/^(.*?)\s\|\s*([a-zA-Z][\w ]*?)\s*=(.*)$/);
    if (inline && !/\{\{[^}]*$/.test(inline[1])) {
      out[key] = inline[1].trim();
      out[inline[2].trim()] = inline[3].trim();
    } else out[key] = val.trim();
  }
  return out;
}

/** Remove refs, comments, simple markup; keep the human-readable text. */
export function cleanText(s) {
  if (s == null) return '';
  return String(s)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{nowrap\|([^}]*)\}\}/gi, '$1')
    .replace(/\{\{val\|([^|}]*)\|e=([^|}]*)[^}]*\}\}/gi, '$1e$2')
    .replace(/\{\{(?:chem2|SimpleNuclide)\|([^}]*)\}\}/gi, (_, x) => x.replace(/\|/g, ''))
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/&nbsp;|&thinsp;/g, ' ')
    .replace(/&sim;/g, '~').replace(/&alpha;/g, 'α').replace(/&beta;/g, 'β').replace(/&gamma;/g, 'γ').replace(/&delta;/g, 'δ')
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<\/?(sub|sup|small|span)[^>]*>/gi, '')
    .replace(/−/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract the <ref> citations (raw) of a field, to keep the citation chain. */
export function refsOf(raw, allText) {
  const refs = [];
  for (const m of String(raw || '').matchAll(/<ref(?:\s+name\s*=\s*"?([^">/]+)"?)?\s*(\/>|>([\s\S]*?)<\/ref>)/g)) {
    let body = m[3];
    if (!body && m[1] && allText) {
      const def = allText.match(new RegExp(`<ref\\s+name\\s*=\\s*"?${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?\\s*>([\\s\\S]*?)</ref>`));
      if (def) body = def[1];
    }
    refs.push(summariseCite(body || m[1] || ''));
  }
  return [...new Set(refs.filter(Boolean))];
}
function summariseCite(body) {
  const g = k => { const m = body.match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^|}]*)`)); return m ? cleanText(m[1]) : ''; };
  if (/\{\{\s*cite/i.test(body)) {
    const last = g('last') || g('last1') || g('author') || g('author1');
    const year = (g('date') || g('year')).match(/\d{4}/)?.[0] || '';
    const title = g('title');
    const doi = g('doi');
    return [last, year && `(${year})`, title, doi && `doi:${doi}`].filter(Boolean).join(' ');
  }
  if (/RubberBible(\d+)/i.test(body)) return `CRC Handbook of Chemistry and Physics, ${body.match(/RubberBible(\d+)/i)[1]}th ed.`;
  const url = body.match(/https?:\/\/[^\s\]]+/);
  return url ? url[0] : cleanText(body).slice(0, 120);
}

const PREDICTED = /\b(predicted|extrapolated|estimated|estimate|est\.|calculated|theoretical)\b/i;
export const isPredictedText = s => PREDICTED.test(String(s || ''));

/** First number in a cleaned string, e.g. "white: 317.3" -> 317.3, "325 ± 15" -> 325. */
export function firstNumber(s) {
  const m = cleanText(s).replace(/,(\d{3})/g, '$1').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Parse lattice constants text -> { a,b,c (pm), alpha,beta,gamma (deg), ar, alphaR, ah, ch, cond } */
export function parseLattice(raw) {
  const t = cleanText(raw);
  if (!t) return null;
  const unitScale = u => (u === 'nm' ? 1000 : u === 'Å' || u === 'A' ? 100 : 1);
  const out = { text: t };
  const grab = (re, key, isAngle = false) => {
    const m = t.match(re);
    if (m) out[key] = isAngle ? Number(m[1]) : Number(m[1]) * unitScale(m[2] || 'pm');
  };
  // rhombohedral forms first: a_r / a_h / c_h (subscripts were flattened by cleanText)
  grab(/\ba\s*r\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'ar');
  grab(/\ba\s*h\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'ah');
  grab(/\bc\s*h\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'ch');
  grab(/(?:^|[\s/:])a\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'a');
  grab(/(?:^|[\s/:])b\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'b');
  grab(/(?:^|[\s/:])c\s*=\s*([\d.]+)\s*(pm|nm|Å)/, 'c');
  grab(/α\s*=\s*([\d.]+)\s*°/, 'alpha', true);
  grab(/β\s*=\s*([\d.]+)\s*°/, 'beta', true);
  grab(/γ\s*=\s*([\d.]+)\s*°/, 'gamma', true);
  const cond = t.match(/\(([^()]*(?:°C|K|triple point|t\.p\.|r\.t\.|room temperature|estimated)[^()]*)\)/i);
  if (cond) out.cond = cond[1].trim();
  return out;
}
