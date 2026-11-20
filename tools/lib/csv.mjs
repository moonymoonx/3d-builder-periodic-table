// Minimal RFC-4180 CSV parser + NIST ASD "Excel-safe" cell cleaner (="value").
export function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}
/** NIST ASD wraps values as ="value" to stop spreadsheets from reformatting them. */
export const nistCell = s => (s == null ? '' : String(s).replace(/^="/, '').replace(/"$/, '').trim());

export function csvObjects(text, clean = x => x) {
  const rows = parseCSV(text);
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, clean(r[i] ?? '')])));
}
