#!/usr/bin/env node
// Builds ./index.html — ONE self-contained offline page:
//   * three.js r170 (node_modules/three/build/three.module.min.js) inlined, wrapped in an IIFE
//   * our ES modules (src/app/main.js and everything it imports) bundled in dependency order
//   * data/elements.json embedded as ONE <script type="application/json" id="pt-data"> block
//   * CSS inlined; no fonts, images, models or network requests at runtime
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rel = p => path.relative(ROOT, p);
const MAX_BYTES = 2 * 1024 * 1024;

// ---- three.js ---------------------------------------------------------------------------
function wrapThree() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'), 'utf8'));
  if (pkg.version !== '0.170.0') throw new Error(`expected three@0.170.0, found ${pkg.version}`);
  const src = fs.readFileSync(path.join(ROOT, 'node_modules/three/build/three.module.min.js'), 'utf8');
  const m = src.match(/export\s*\{([^}]*)\}\s*;?\s*$/);
  if (!m) throw new Error('three.module.min.js: export list not found');
  const body = src.slice(0, m.index);
  if (/\bimport\s*[{*(]|import\.meta/.test(body)) throw new Error('three.module.min.js has imports; cannot inline as IIFE');
  const pairs = m[1].split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const p = s.split(/\s+as\s+/);
    return p.length === 2 ? `${p[1]}:${p[0]}` : `${p[0]}:${p[0]}`;
  });
  return { code: `const __THREE=(()=>{${body}\nreturn{${pairs.join(',')}};})();`, version: pkg.version };
}

// ---- tiny ES-module bundler (for our own code only) ----------------------------------------
function bundle(entry) {
  const mods = new Map();
  const order = [];
  const visit = (abs, stack = []) => {
    if (mods.has(abs)) {
      if (stack.includes(abs)) throw new Error('circular import: ' + [...stack, abs].map(rel).join(' -> '));
      return mods.get(abs);
    }
    const rec = { id: `__m${mods.size}`, abs };
    mods.set(abs, rec);
    let src = fs.readFileSync(abs, 'utf8');
    const header = [];
    src = src.replace(/^import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm, (all, what, spec) => {
      what = what.trim();
      let target;
      if (spec === 'three') target = '__THREE';
      else if (spec.startsWith('.')) target = visit(path.resolve(path.dirname(abs), spec), [...stack, abs]).id;
      else throw new Error(`${rel(abs)}: unsupported import "${spec}"`);
      const ns = what.match(/^\*\s+as\s+(\w+)$/);
      if (ns) header.push(`const ${ns[1]}=${target};`);
      else if (/^\{[\s\S]*\}$/.test(what)) header.push(`const {${what.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean).map(s => s.replace(/\s+as\s+/, ':')).join(',')}}=${target};`);
      else throw new Error(`${rel(abs)}: unsupported import form "${what}"`);
      return '';
    });
    if (/^\s*import\s/m.test(src)) throw new Error(`${rel(abs)}: unparsed import statement`);
    const exportsList = [];
    src = src.replace(/^export\s+(async\s+function\*?|function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (all, kw, name) => { exportsList.push(name); return `${kw} ${name}`; });
    src = src.replace(/^export\s*\{([^}]*)\};?/gm, (all, list) => {
      for (const s of list.split(',').map(x => x.trim()).filter(Boolean)) { const p = s.split(/\s+as\s+/); exportsList.push(p.length === 2 ? `${p[1]}:${p[0]}` : p[0]); }
      return '';
    });
    if (/^export\s/m.test(src)) throw new Error(`${rel(abs)}: unsupported export form`);
    rec.code = `const ${rec.id}=(()=>{\n${header.join('\n')}\n${src}\nreturn{${exportsList.join(',')}};\n})();`;
    order.push(rec);
    return rec;
  };
  visit(path.resolve(entry));
  return order.map(r => `// ${rel(r.abs)}\n${r.code}`).join('\n');
}

// Conservative minifier: drop full-line comments, JSDoc blocks, indentation and blank lines.
function squeezeJS(code) {
  const out = [];
  let inDoc = false;
  for (let line of code.split('\n')) {
    const t = line.trim();
    if (inDoc) { if (t.endsWith('*/')) inDoc = false; continue; }
    if (t.startsWith('/**') || (t.startsWith('/*') && !t.includes('*/'))) { if (!t.endsWith('*/')) inDoc = true; continue; }
    if (t.startsWith('//') || t === '') continue;
    out.push(t);
  }
  return out.join('\n');
}
const squeezeCSS = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};:,>])\s*/g, '$1').replace(/;}/g, '}').trim();

// ---- assemble -------------------------------------------------------------------------------
const three = wrapThree();
const appJS = squeezeJS(bundle(path.join(ROOT, 'src/app/main.js')));
for (const [re, why] of [[/\bfetch\s*\(/, 'fetch()'], [/XMLHttpRequest/, 'XMLHttpRequest'], [/\bimport\s*\(/, 'dynamic import'], [/new\s+WebSocket/, 'WebSocket'], [/navigator\.sendBeacon/, 'sendBeacon']]) {
  if (re.test(appJS)) throw new Error(`app code must not use ${why} (offline page, nothing fetched at runtime)`);
}
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/elements.json'), 'utf8'));
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { /* not a git checkout */ }
data.build = { date: new Date().toISOString().slice(0, 10), commit, three: three.version };
const dataJSON = JSON.stringify(data).replace(/</g, '\\u003c');
const css = squeezeCSS(fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8'));
const template = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
const js = `${three.code}\n${appJS}`.replace(/<\/script/gi, '<\\/script');
const html = template
  .replace('/*__CSS__*/', () => css)
  .replace('__DATA__', () => dataJSON)
  .replace('/*__JS__*/', () => js);
if (/__DATA__|__CSS__|__JS__/.test(html)) throw new Error('template placeholder not replaced');
if (/<(link|img|iframe|source|video|audio)\b[^>]*\b(src|href)\s*=\s*["']?https?:/i.test(html.replace(dataJSON, ''))) throw new Error('external resource reference in HTML');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
const bytes = Buffer.byteLength(html);
const kb = n => `${(n / 1024).toFixed(0)} KB`;
console.log(`index.html: ${kb(bytes)} (three ${kb(three.code.length)}, app ${kb(appJS.length)}, data ${kb(dataJSON.length)}, css ${kb(css.length)})`);
if (bytes > MAX_BYTES) { console.error(`FAIL: index.html is ${bytes} bytes > 2 MB (SPEC). Record in DECISIONS.md if unavoidable.`); process.exit(1); }
