// Small CIF reader: cell, symmetry operators, atom sites; expands sites to the full
// conventional cell by applying every symmetry operator (duplicates merged).
const num = s => { if (s == null) return null; const m = String(s).match(/^-?\d*\.?\d+(?:[eE][-+]?\d+)?/); return m ? Number(m[0]) : null; };

function tokenize(text) {
  const toks = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(';')) { // multi-line text field
      let buf = line.slice(1);
      while (++i < lines.length && !lines[i].startsWith(';')) buf += '\n' + lines[i];
      toks.push({ v: buf, q: true });
      continue;
    }
    const re = /'([^']*)'(?=\s|$)|"([^"]*)"(?=\s|$)|(#.*$)|(\S+)/g;
    let m;
    while ((m = re.exec(line))) {
      if (m[3]) break;
      if (m[1] !== undefined) toks.push({ v: m[1], q: true });
      else if (m[2] !== undefined) toks.push({ v: m[2], q: true });
      else toks.push({ v: m[4], q: false });
    }
  }
  return toks;
}

export function parseCIF(text) {
  const toks = tokenize(text);
  const items = {}; const loops = [];
  for (let i = 0; i < toks.length;) {
    const t = toks[i];
    if (!t.q && /^loop_$/i.test(t.v)) {
      i++; const names = [];
      while (i < toks.length && !toks[i].q && toks[i].v.startsWith('_')) names.push(toks[i++].v.toLowerCase());
      const rows = [];
      while (i < toks.length && !(!toks[i].q && (toks[i].v.startsWith('_') || /^loop_$/i.test(toks[i].v) || /^data_/i.test(toks[i].v)))) {
        const row = [];
        for (let k = 0; k < names.length && i < toks.length; k++) row.push(toks[i++].v);
        rows.push(row);
      }
      loops.push({ names, rows });
    } else if (!t.q && t.v.startsWith('_')) {
      items[t.v.toLowerCase()] = toks[i + 1] ? toks[i + 1].v : null; i += 2;
    } else i++;
  }
  const loopWith = name => loops.find(l => l.names.includes(name));
  const cell = {
    a: num(items._cell_length_a), b: num(items._cell_length_b), c: num(items._cell_length_c),
    alpha: num(items._cell_angle_alpha), beta: num(items._cell_angle_beta), gamma: num(items._cell_angle_gamma),
  };
  const opsLoop = loopWith('_space_group_symop_operation_xyz') || loopWith('_symmetry_equiv_pos_as_xyz');
  const opCol = opsLoop ? opsLoop.names.findIndex(n => n === '_space_group_symop_operation_xyz' || n === '_symmetry_equiv_pos_as_xyz') : -1;
  const ops = opsLoop ? opsLoop.rows.map(r => r[opCol]) : ['x,y,z'];
  const siteLoop = loopWith('_atom_site_fract_x');
  const sites = [];
  if (siteLoop) {
    const col = n => siteLoop.names.indexOf(n);
    for (const r of siteLoop.rows) {
      sites.push({
        label: r[col('_atom_site_label')], type: r[col('_atom_site_type_symbol')] || r[col('_atom_site_label')],
        x: num(r[col('_atom_site_fract_x')]), y: num(r[col('_atom_site_fract_y')]), z: num(r[col('_atom_site_fract_z')]),
        occ: col('_atom_site_occupancy') >= 0 ? num(r[col('_atom_site_occupancy')]) ?? 1 : 1,
      });
    }
  }
  const sg = items['_space_group_name_h-m_alt'] || items['_symmetry_space_group_name_h-m'] || null;
  const sgNumber = num(items._space_group_it_number ?? items._symmetry_int_tables_number);
  const T = num(items._cell_measurement_temperature) ?? num(items._diffrn_ambient_temperature);
  const Z = num(items._cell_formula_units_z);
  const ref = {
    authors: (loopWith('_publ_author_name')?.rows || []).map(r => r[0]).slice(0, 4).join('; '),
    journal: items._journal_name_full || '', year: num(items._journal_year), volume: items._journal_volume || '',
    page: items._journal_page_first || '', doi: items._journal_paper_doi || '', title: (items._publ_section_title || '').replace(/\s+/g, ' ').trim(),
  };
  return { cell, ops, sites, sg, sgNumber, T, Z, ref, codId: items._cod_database_code || null };
}

/** Parse one symmetry operator "-x+1/2, y, z+1/2" -> function(fx,fy,fz) => [x,y,z] */
export function parseOp(op) {
  const parts = op.replace(/\s+/g, '').toLowerCase().split(',');
  if (parts.length !== 3) throw new Error('bad op ' + op);
  const comp = parts.map(p => {
    const c = { x: 0, y: 0, z: 0, t: 0 };
    const terms = p.replace(/-/g, '+-').split('+').filter(Boolean);
    for (const term of terms) {
      const m = term.match(/^(-?)(\d*\.?\d*(?:\/\d+)?)?\*?([xyz])?$/);
      if (!m) throw new Error(`bad term ${term} in ${op}`);
      const sign = m[1] === '-' ? -1 : 1;
      if (m[3]) {
        const k = m[2] ? evalFrac(m[2]) : 1;
        c[m[3]] += sign * k;
      } else c.t += sign * evalFrac(m[2]);
    }
    return c;
  });
  return (x, y, z) => comp.map(c => c.x * x + c.y * y + c.z * z + c.t);
}
function evalFrac(s) { if (s.includes('/')) { const [a, b] = s.split('/'); return Number(a) / Number(b); } return Number(s); }

const wrap = v => { let w = v - Math.floor(v); if (w > 1 - 1e-6) w = 0; return Math.abs(w) < 1e-6 ? 0 : w; };

/** Full conventional-cell fractional positions (deduplicated, sorted). */
export function expandSites(cif, tol = 1e-3) {
  const fns = cif.ops.map(parseOp);
  const out = [];
  for (const s of cif.sites) {
    for (const f of fns) {
      const p = f(s.x, s.y, s.z).map(wrap);
      const dup = out.some(q => {
        const d = [0, 1, 2].map(i => { let e = Math.abs(q[i] - p[i]); return Math.min(e, 1 - e); });
        return d[0] < tol && d[1] < tol && d[2] < tol;
      });
      if (!dup) out.push(p);
    }
  }
  out.sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]);
  return out;
}
