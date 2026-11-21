// The patterns chart, porcelain & ink (STYLE.md): one property against the number of protons, drawn as an
// SVG figure on the paper, like a plate in an illustrated science book. Each element is a small glazed bead
// in its family pigment (striped when the value is predicted); lines join the dots across each row of the
// table (or down each column); the selected element wears the verdigris ring and its row is drawn in ink.
// Two or three callouts in italic ink point at what the data shows ("Each row starts big…").
// Motion (STYLE.md §7): beads ripple left→right by atomic number when the chart appears or changes
// (650 ms, 250 ms stagger), then the lines are drawn in like a pen stroke; reduced motion makes it instant.
// The chart knows nothing about elements' meaning: places/patterns.js gives it a model.
import { h, replace } from '../dom.js';
import { animate } from '../engine.js';
import { state } from '../state.js';
import { motion } from '../../design/tokens.js';

const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs, text) {
  const el = document.createElementNS(NS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  if (text != null) el.textContent = text;
  return el;
}
const N = 118;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const easeInOut = d => (d < 0.5 ? 4 * d ** 3 : 1 - (-2 * d + 2) ** 3 / 2);
/** A darker shade of a pigment (the bead's rim), like the tiles' sides (38 % darker, STYLE.md §3). */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.round(clamp(c * k, 0, 255)).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
function lighten(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.round(c + (255 - c) * k).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/**
 * hooks: onPick(Z) a tap or click picks an element; onScrub(Z|null, x, y) a thumb slides along the chart
 * (phones: the place shows a loupe); pinNode(Z) -> the node shown pinned over the selected bead (desktop),
 * tipNode(Z) -> the hover label.
 */
export function createChart(hooks) {
  const svg = S('svg', { class: 'patterns-svg', role: 'img', focusable: 'false' });
  const defs = S('defs');
  const gBands = S('g', { class: 'patterns-bands' }), gGrid = S('g', { class: 'patterns-grid' }), gRef = S('g', { class: 'patterns-refs' });
  const gLines = S('g', { class: 'patterns-lines' }), gAnchors = S('g', { class: 'patterns-anchors' }), gLeaders = S('g', { class: 'patterns-leaders' });
  const gPoints = S('g', { class: 'patterns-points' }), gSel = S('g', { class: 'patterns-sel' });
  const gX = S('g', { class: 'patterns-xaxis' });
  svg.append(defs, gBands, gGrid, gRef, gX, gLines, gAnchors, gLeaders, gPoints, gSel);
  // a fine diagonal hatch over predicted values (the same "striped: predicted" as the table)
  const hatch = S('pattern', { id: 'patterns-hatch', width: 3.2, height: 3.2, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  hatch.append(S('rect', { width: 1.3, height: 3.2, fill: 'rgba(28,26,23,0.55)' }));
  defs.append(hatch);
  const notes = h('div', { class: 'patterns-notes' });
  const tip = h('div', { class: 'patterns-tip', hidden: true, 'aria-hidden': 'true' });
  const pin = h('div', { class: 'patterns-pin', hidden: true });
  const plot = h('div', { class: 'patterns-plot' }, svg, notes, pin, tip);

  // one bead per element, created once and moved
  const beads = [], cur = new Float32Array(N + 1).fill(NaN), from = new Float32Array(N + 1), to = new Float32Array(N + 1).fill(NaN);
  const op = new Float32Array(N + 1), opFrom = new Float32Array(N + 1), opTo = new Float32Array(N + 1);
  for (let Z = 1; Z <= N; Z++) {
    const g = S('g', { class: 'patterns-bead', 'data-z': Z, opacity: 0 });
    g.append(S('circle', { r: 4 }), S('circle', { r: 4, class: 'patterns-bead__hatch', fill: 'url(#patterns-hatch)' }));
    gPoints.append(g); beads[Z] = g;
  }
  const ring = S('circle', { class: 'patterns-ring', r: 9 }), guide = S('line', { class: 'patterns-guide' }), hoverRing = S('circle', { class: 'patterns-hover', r: 8 });
  gSel.append(guide, hoverRing, ring);

  let model = null, G = null, tween = null, hover = 0, scrubbing = false, drawK = 1, notesK = 1, lineEls = new Map();
  const grads = new Map();
  function gradFor(hex) {
    if (grads.has(hex)) return grads.get(hex);
    const id = `patterns-g${grads.size}`;
    const g = S('radialGradient', { id, cx: '38%', cy: '32%', r: '72%' });
    g.append(S('stop', { offset: '0%', 'stop-color': lighten(hex, 0.55) }), S('stop', { offset: '45%', 'stop-color': hex }), S('stop', { offset: '100%', 'stop-color': shade(hex, 0.7) }));
    defs.append(g); grads.set(hex, `url(#${id})`);
    return grads.get(hex);
  }

  // ---- geometry ----------------------------------------------------------------------------------------
  function geometry() {
    const W = Math.max(280, plot.clientWidth), H = Math.max(200, plot.clientHeight);
    const phone = W < 560;
    // the left margin fits the longest tick label (13 px tabular figures)
    const chars = Math.max(1, ...model.y.ticks.map(tk => String(tk.label).length));
    const m = { l: Math.max(30, Math.ceil(chars * 7.1) + 14), r: phone ? 10 : 18, t: phone ? 22 : 28, b: (phone ? 36 : 42) + (model && model.ancient ? (phone ? 24 : 30) : 0) };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const y = model.y;
    const lin = v => m.t + (1 - (v - y.min) / (y.max - y.min)) * ph;
    const Y = y.log ? v => (v > 0 ? lin(Math.log10(v)) : null) : lin;
    return { W, H, m, pw, ph, phone, X: Z => m.l + ((Z - 0.5) / N) * pw, Y, r: phone ? 2.7 : 4.4, base: m.t + ph, ancientY: m.t + ph + (phone ? 17 : 21) };
  }

  // ---- static layers: bands, grid, reference lines, x axis ------------------------------------------
  function drawFrame() {
    svg.setAttribute('viewBox', `0 0 ${G.W} ${G.H}`);
    svg.setAttribute('width', G.W); svg.setAttribute('height', G.H);
    replace(gBands); replace(gGrid); replace(gRef); replace(gX);
    const { m } = G;
    const half = G.pw / N / 2; // a row's band runs from half a step before its first element to after its last
    model.rows.forEach((r, i) => {
      const xa = G.X(r.z0) - half, xb = G.X(r.z1) + half;
      if (i % 2 === 1) gBands.append(S('rect', { x: xa, y: m.t, width: xb - xa, height: G.ph, class: 'patterns-band' }));
      const wide = xb - xa > (G.phone ? 46 : 58);
      gBands.append(S('text', { x: (xa + xb) / 2, y: m.t - (G.phone ? 7 : 9), class: 'patterns-rowlbl' + (r.sel ? ' is-sel' : ''), 'text-anchor': 'middle' }, wide ? r.label : r.short));
    });
    for (const tk of model.y.ticks) {
      const yy = model.y.log ? G.Y(10 ** tk.v) : G.Y(tk.v);
      if (yy == null || yy < m.t - 1 || yy > G.base + 1) continue;
      gGrid.append(S('line', { x1: m.l, x2: G.W - m.r, y1: yy, y2: yy, class: 'patterns-gridline' + (tk.base ? ' is-base' : '') }));
      gGrid.append(S('text', { x: m.l - 8, y: yy + 4.5, 'text-anchor': 'end', class: 'patterns-tick' }, tk.label));
    }
    for (const rf of model.ref || []) {
      const yy = G.Y(rf.y);
      if (yy == null || yy < m.t || yy > G.base) continue;
      gRef.append(S('line', { x1: m.l, x2: G.W - m.r, y1: yy, y2: yy, class: 'patterns-refline' }));
      if (!G.phone) gRef.append(S('text', { x: G.W - m.r - 4, y: yy - 6, 'text-anchor': 'end', class: 'patterns-reflbl', 'data-y': yy }, rf.label)); // phones: in the key
    }
    const xy = G.base + (model.ancient ? (G.phone ? 24 : 30) : 0);
    for (const Z of model.xTicks) gX.append(S('text', { x: G.X(Z), y: xy + (G.phone ? 15 : 18), 'text-anchor': 'middle', class: 'patterns-tick' }, String(Z)));
    // the x axis, plain name first and the jargon after it: "Number of protons · atomic number →"
    if (model.xTitle) {
      const tt = S('text', { x: G.W - m.r, y: xy + (G.phone ? 30 : 35), 'text-anchor': 'end', class: 'patterns-xtitle' });
      tt.append(S('tspan', null, model.xTitle[0]), S('tspan', { class: 'patterns-xtitle__cap' }, ` · ${model.xTitle[1]} →`));
      gX.append(tt);
    }
    if (model.ancient) { // a band under the axis for the elements known since ancient times (no year)
      gX.append(S('line', { x1: m.l, x2: G.W - m.r, y1: G.ancientY - (G.phone ? 10 : 12), y2: G.ancientY - (G.phone ? 10 : 12), class: 'patterns-gridline is-faint' }));
      gX.append(S('text', { x: G.W - m.r, y: G.ancientY + 4, 'text-anchor': 'end', class: 'patterns-tick is-ancient' }, model.ancient));
    }
  }
  /** Reference-line labels ("room temperature") sit where no bead is in the way. */
  let refBoxes = [];
  function placeRefs() {
    refBoxes = [];
    for (const tx of gRef.querySelectorAll('.patterns-reflbl')) {
      const yy = +tx.dataset.y, w = tx.getComputedTextLength ? tx.getComputedTextLength() : 160;
      const cands = [G.W - G.m.r - 4 - w, G.m.l + 6];
      for (let i = 1; i < 8; i++) cands.push(G.m.l + (G.pw * i) / 8 - w / 2);
      let best = null;
      for (const x0 of cands) {
        if (x0 < G.m.l + 2 || x0 + w > G.W - G.m.r) continue;
        const r = { x0, x1: x0 + w, y0: yy - 20, y1: yy - 2 };
        let hits = 0;
        for (let Z = 1; Z <= N; Z++) { if (Number.isNaN(to[Z]) || opTo[Z] < 0.5) continue; const x = G.X(Z); if (x > r.x0 - G.r && x < r.x1 + G.r && to[Z] > r.y0 - G.r && to[Z] < r.y1 + G.r) hits++; }
        if (!best || hits < best.hits) best = { hits, r };
      }
      if (!best) continue;
      tx.setAttribute('x', best.r.x0); tx.setAttribute('text-anchor', 'start');
      refBoxes.push(best.r);
    }
  }

  // ---- beads and lines --------------------------------------------------------------------------------
  function targetsFor() {
    const out = new Float32Array(N + 1).fill(NaN);
    for (const p of model.points) {
      const yy = p.kind === 'ancient' ? G.ancientY : G.Y(p.y);
      if (yy != null && Number.isFinite(yy)) out[p.Z] = clamp(yy, G.m.t - 6, G.H);
    }
    return out;
  }
  function styleBeads() {
    const byZ = new Map(model.points.map(p => [p.Z, p]));
    for (let Z = 1; Z <= N; Z++) {
      const p = byZ.get(Z), g = beads[Z];
      if (!p) continue;
      const [c, hatchC] = g.children;
      const r = G.r * (p.kind === 'sub' ? 1.1 : 1);
      c.setAttribute('r', r); hatchC.setAttribute('r', r);
      if (p.kind === 'sub') { c.setAttribute('fill', 'var(--card)'); c.setAttribute('stroke', shade(p.color, 0.55)); c.setAttribute('stroke-width', G.phone ? 1.3 : 1.7); }
      else { c.setAttribute('fill', gradFor(p.color)); c.setAttribute('stroke', shade(p.color, 0.62)); c.setAttribute('stroke-width', G.phone ? 0.6 : 0.8); }
      hatchC.style.display = p.pred ? '' : 'none';
    }
  }
  function placeBeads() {
    const x = G.X;
    for (let Z = 1; Z <= N; Z++) {
      const g = beads[Z];
      if (Number.isNaN(cur[Z]) || op[Z] <= 0.001) { g.setAttribute('opacity', 0); continue; }
      g.setAttribute('transform', `translate(${x(Z).toFixed(1)},${cur[Z].toFixed(1)})`);
      g.setAttribute('opacity', op[Z].toFixed(3));
    }
  }
  function drawLines() {
    const mode = model.lineMode;
    const keep = new Set();
    for (const [key, zs] of model.groups) {
      let d = '', pen = false;
      for (const Z of zs) {
        if (Number.isNaN(cur[Z]) || Number.isNaN(to[Z]) || opTo[Z] < 0.5 || model.kindOf(Z) === 'ancient') { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${G.X(Z).toFixed(1)},${cur[Z].toFixed(1)}`; pen = true;
      }
      keep.add(key);
      let p = lineEls.get(key);
      if (!p) { p = S('path', { class: 'patterns-line' }); lineEls.set(key, p); gLines.append(p); }
      p.setAttribute('d', d || 'M0,0');
      p.style.display = d ? '' : 'none';
      p.classList.toggle('is-sel', key === model.selKey);
      p.classList.toggle('is-col', mode === 'group');
    }
    for (const [key, p] of lineEls) if (!keep.has(key)) { p.remove(); lineEls.delete(key); }
    // the selected row or column is drawn last, over the others
    const sp = lineEls.get(model.selKey);
    if (sp) gLines.append(sp);
  }
  function lineReveal(k) { // the pen stroke: each line drawn in from its left end
    for (const p of lineEls.values()) {
      if (k >= 1) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; continue; }
      const L = p.getTotalLength ? p.getTotalLength() : 0;
      p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = String(L * (1 - easeInOut(k)));
    }
  }

  // ---- selection, hover -------------------------------------------------------------------------------
  const yOf = Z => (!Number.isNaN(cur[Z]) && opTo[Z] > 0.5 ? cur[Z] : G.base); // no value: at the axis
  function placeSel() {
    const Z = model.selZ;
    const ok = Z && !Number.isNaN(cur[Z]) && opTo[Z] > 0.5;
    ring.style.display = ok ? '' : 'none'; guide.style.display = ok ? '' : 'none';
    if (ok) {
      const x = G.X(Z), y = cur[Z];
      ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', G.r + (G.phone ? 4.5 : 5.5));
      guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('y1', y + G.r + 6); guide.setAttribute('y2', G.base);
    }
    const hz = hover && hover !== Z && !Number.isNaN(cur[hover]) && opTo[hover] > 0.5 ? hover : 0;
    hoverRing.style.display = hz ? '' : 'none';
    if (hz) { hoverRing.setAttribute('cx', G.X(hz)); hoverRing.setAttribute('cy', cur[hz]); hoverRing.setAttribute('r', G.r + 3.5); }
    placeLabel(pin, Z && !G.phone && !scrubbing ? Z : 0, hooks.pinNode);
    pin.classList.toggle('is-none', !!Z && !ok);
    placeLabel(tip, hz && !G.phone && !scrubbing ? hz : 0, hooks.tipNode);
    // a pinned label never sits under the hover label
    if (!pin.hidden && !tip.hidden) {
      const a = pin.getBoundingClientRect(), b = tip.getBoundingClientRect();
      if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) pin.style.visibility = 'hidden'; else pin.style.visibility = '';
    } else pin.style.visibility = '';
  }
  let pinZ = 0, tipZ = 0;
  function placeLabel(el, Z, make, yAt = null) {
    if (!Z) { el.hidden = true; if (el === pin) pinZ = 0; else tipZ = 0; return; }
    const was = el === pin ? pinZ : tipZ;
    const fresh = was !== Z || el.dataset.lang !== state.lang;
    if (fresh) { replace(el, make(Z)); el.dataset.lang = state.lang; if (el === pin) pinZ = Z; else tipZ = Z; }
    if (el.hidden) { el.hidden = false; el._size = null; }
    // measured once per content (reading sizes every animation frame would force a layout each frame)
    if (fresh || !el._size || !el._size[0]) el._size = [el.offsetWidth, el.offsetHeight];
    const x = G.X(Z), y = yAt ?? yOf(Z), [w, hh] = el._size;
    const below = y - hh - 16 < 4;
    el.classList.toggle('is-below', below);
    const lx = clamp(x - w / 2, 4, G.W - w - 4);
    el.style.transform = `translate(${lx.toFixed(1)}px, ${(below ? y + 14 : y - hh - 14).toFixed(1)}px)`;
    el.style.setProperty('--caret', `${(x - lx).toFixed(1)}px`);
  }

  // ---- callouts: italic ink notes, placed clear of the beads and of each other ---------------------------
  /** Where the pinned label will rest (desktop), so notes keep clear of it. */
  function pinRect() {
    const Z = model.selZ;
    if (!Z || G.phone) return null;
    placeLabel(pin, Z, hooks.pinNode, Number.isNaN(to[Z]) || opTo[Z] < 0.5 ? G.base : to[Z]);
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(pin.style.transform);
    return m ? { x0: +m[1], y0: +m[2], x1: +m[1] + pin.offsetWidth, y1: +m[2] + pin.offsetHeight } : null;
  }
  function layoutNotes() {
    replace(gAnchors); replace(gLeaders);
    const boxes = [];
    // obstacles: the beads (at their final places), the reference labels and the pinned label
    for (const p of model.points) { const y = to[p.Z]; if (!Number.isNaN(y)) boxes.push({ x0: G.X(p.Z) - G.r - 3, x1: G.X(p.Z) + G.r + 3, y0: y - G.r - 3, y1: y + G.r + 3, w: 70 }); }
    for (const r of refBoxes) boxes.push({ x0: r.x0 - 4, x1: r.x1 + 4, y0: r.y0 - 2, y1: r.y1 + 4, w: 600 }); // text never over text
    const pr = pinRect();
    if (pr) boxes.push({ x0: pr.x0 - 6, x1: pr.x1 + 6, y0: pr.y0 - 6, y1: pr.y1 + 10, w: 600 });
    const placed = [];
    const els = [...notes.children];
    const lim = { x0: G.m.l + 2, x1: G.W - G.m.r - 2, y0: G.m.t + 2, y1: G.base - 2 };
    model.callouts.forEach((c, i) => {
      const el = els[i];
      if (!el) return;
      const lx = G.X(c.lead), ly = to[c.lead];
      // a note about the picked element alone would only repeat its pinned label
      const dup = c.anchors.length === 1 && c.anchors[0] === model.selZ;
      if (Number.isNaN(ly) || dup) { el.hidden = true; return; }
      el.hidden = false;
      const w = el.offsetWidth, hh = el.offsetHeight;
      let best = null;
      for (const dist of G.phone ? [12, 26, 44, 70, 100] : [16, 34, 60, 96, 140]) {
        for (const [ax, ay] of [[0, -1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]]) {
          const cx = lx + ax * (dist + w / 2) * (ax ? 1 : 0), cy = ly + ay * (dist + hh / 2) * (ay ? 1 : 0);
          const bx0 = ax === 0 ? lx - w / 2 : ax > 0 ? lx + dist : lx - dist - w;
          const by0 = ay === 0 ? ly - hh / 2 : ay > 0 ? ly + dist : ly - dist - hh;
          const r = { x0: bx0, y0: by0, x1: bx0 + w, y1: by0 + hh };
          let cost = dist * 0.9 + (ay > 0 ? 6 : 0) + (ax !== 0 && ay !== 0 ? 4 : 0);
          // keep inside the plot
          const out = Math.max(0, lim.x0 - r.x0) + Math.max(0, r.x1 - lim.x1) + Math.max(0, lim.y0 - r.y0) + Math.max(0, r.y1 - lim.y1);
          cost += out * 40;
          for (const b of boxes) { const ox = Math.min(r.x1, b.x1) - Math.max(r.x0, b.x0), oy = Math.min(r.y1, b.y1) - Math.max(r.y0, b.y0); if (ox > 0 && oy > 0) cost += b.w; }
          for (const b of placed) { const ox = Math.min(r.x1 + 6, b.x1) - Math.max(r.x0 - 6, b.x0), oy = Math.min(r.y1 + 4, b.y1) - Math.max(r.y0 - 4, b.y0); if (ox > 0 && oy > 0) cost += 400 + ox * oy; }
          if (!best || cost < best.cost) best = { cost, r, cx, cy };
        }
      }
      const r = best.r;
      placed.push(r);
      el.style.transform = `translate(${r.x0.toFixed(1)}px, ${r.y0.toFixed(1)}px)`;
      // a leader from the note's nearest edge to the bead it is about
      const ex = clamp(lx, r.x0, r.x1), ey = clamp(ly, r.y0, r.y1);
      const dx = lx - ex, dy = ly - ey, d = Math.hypot(dx, dy);
      if (d > G.r + 8) gLeaders.append(S('line', { x1: ex + (dx / d) * 3, y1: ey + (dy / d) * 3, x2: lx - (dx / d) * (G.r + 3), y2: ly - (dy / d) * (G.r + 3), class: 'patterns-leader', 'data-i': i }));
      // every element the note is about wears a fine ink ring
      for (const Z of c.anchors) if (!Number.isNaN(to[Z])) gAnchors.append(S('circle', { cx: G.X(Z), cy: to[Z], r: G.r + 2.6, class: 'patterns-anchor', 'data-i': i }));
    });
  }
  function revealNotes(k) {
    const els = [...notes.children];
    els.forEach((el, i) => { const ki = clamp(k * (els.length + 1) - i, 0, 1); el.style.opacity = ki.toFixed(3); });
    for (const n of [...gLeaders.children, ...gAnchors.children]) { const i = +n.dataset.i; n.style.opacity = clamp(k * (els.length + 1) - i, 0, 1).toFixed(3); }
  }

  // ---- model in, motion out ---------------------------------------------------------------------------------
  /** mode: 'enter' (beads rise from the baseline, then lines and notes), 'morph' (beads move), 'none'. */
  function set(next, mode = 'morph') {
    const prev = model;
    model = next;
    pinZ = 0; tipZ = 0; // the labels show the new pattern's values
    model.kindOf = (() => { const k = new Map(next.points.map(p => [p.Z, p.kind])); return Z => k.get(Z); })();
    G = geometry();
    svg.setAttribute('aria-label', next.label || '');
    drawFrame();
    styleBeads();
    const tg = targetsFor();
    if (tween) { tween(); tween = null; }
    for (let Z = 1; Z <= N; Z++) {
      const has = !Number.isNaN(tg[Z]);
      from[Z] = mode === 'enter' || Number.isNaN(cur[Z]) ? (has ? G.base + 6 : NaN) : cur[Z];
      opFrom[Z] = mode === 'enter' ? 0 : op[Z];
      to[Z] = has ? tg[Z] : (Number.isNaN(cur[Z]) ? NaN : cur[Z]);
      opTo[Z] = has ? 1 : 0;
      if (mode === 'enter' && has) cur[Z] = from[Z];
    }
    replace(notes, ...next.callouts.map(c => h('p', { class: 'patterns-note' + (c.strong ? ' is-strong' : '') }, c.text)));
    placeRefs();
    layoutNotes();
    const reduced = state.reduced || mode === 'none' || !prev && mode !== 'enter';
    if (reduced) {
      for (let Z = 1; Z <= N; Z++) { cur[Z] = to[Z]; op[Z] = opTo[Z]; }
      placeBeads(); drawLines(); lineReveal(1); revealNotes(1); placeSel();
      return;
    }
    const dur = motion.lens / 1000, stag = motion.lensStagger / motion.lens;
    const lineDur = mode === 'enter' ? 0.55 : 0, notesDur = 0.45;
    let t = 0;
    drawK = mode === 'enter' ? 0 : 1; notesK = 0;
    if (mode === 'enter') lineReveal(0);
    revealNotes(0);
    tween = animate(dt => {
      t += dt;
      const k = Math.min(1, t / dur);
      for (let Z = 1; Z <= N; Z++) {
        if (Number.isNaN(to[Z])) continue;
        const d = easeInOut(clamp((k - (Z / N) * stag) / (1 - stag), 0, 1));
        cur[Z] = Number.isNaN(from[Z]) ? to[Z] : from[Z] + (to[Z] - from[Z]) * d;
        op[Z] = opFrom[Z] + (opTo[Z] - opFrom[Z]) * (mode === 'enter' ? Math.min(1, d * 3) : d);
      }
      placeBeads(); drawLines();
      if (mode === 'enter') { drawK = clamp((t - dur * 0.6) / lineDur, 0, 1); lineReveal(drawK); }
      notesK = clamp((t - dur * (mode === 'enter' ? 0.9 : 0.55)) / notesDur, 0, 1); revealNotes(notesK);
      placeSel();
      if (k >= 1 && drawK >= 1 && notesK >= 1) { tween = null; lineReveal(1); return false; }
      return true;
    });
  }
  /** Only the selection (or the line highlight) changed: no ripple. */
  function select(Z, selKey, rows) {
    if (!model) return;
    model.selZ = Z; model.selKey = selKey;
    if (rows) { model.rows = rows; drawFrameRows(); }
    drawLines();
    layoutNotes(); revealNotes(tween ? notesK : 1); // notes make way for the new pinned label
    placeSel();
  }
  function drawFrameRows() {
    const lbls = gBands.querySelectorAll('.patterns-rowlbl');
    model.rows.forEach((r, i) => { if (lbls[i]) lbls[i].classList.toggle('is-sel', !!r.sel); });
  }
  function relayout() {
    if (!model) return;
    G = geometry();
    drawFrame();
    styleBeads();
    const tg = targetsFor();
    for (let Z = 1; Z <= N; Z++) { to[Z] = tg[Z]; if (!tween) { cur[Z] = tg[Z]; op[Z] = opTo[Z]; } }
    placeRefs();
    layoutNotes();
    if (!tween) { placeBeads(); drawLines(); lineReveal(1); revealNotes(1); }
    placeSel();
  }
  function refreshLabels() { pinZ = 0; tipZ = 0; placeSel(); }

  // ---- pointer: hover and click on desktop, thumb-scrub on phones -------------------------------------
  function zAt(clientX, clientY) {
    if (!model || !G) return 0;
    const r = svg.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    if (x < G.m.l - 10 || x > G.W - G.m.r + 10 || y < G.m.t - 18 || y > G.H) return 0;
    const z0 = clamp(Math.round(((x - G.m.l) / G.pw) * N + 0.5), 1, N);
    for (let d = 0; d <= 3; d++) for (const z of [z0 - d, z0 + d]) if (z >= 1 && z <= N && !Number.isNaN(to[z]) && opTo[z] > 0.5) return z;
    return 0;
  }
  function setHover(Z) { if (Z !== hover) { hover = Z; placeSel(); } }
  plot.addEventListener('pointermove', ev => {
    if (ev.pointerType === 'touch') { if (scrubbing) { const Z = zAt(ev.clientX, ev.clientY); setHover(Z); hooks.onScrub(Z, ev.clientX, ev.clientY); } return; }
    if (ev.target.closest('.patterns-pin')) return;
    const Z = zAt(ev.clientX, ev.clientY);
    plot.style.cursor = Z ? 'pointer' : '';
    setHover(Z);
  });
  plot.addEventListener('pointerleave', ev => { if (ev.pointerType !== 'touch') setHover(0); });
  plot.addEventListener('pointerdown', ev => {
    if (ev.pointerType !== 'touch' || ev.target.closest('.patterns-pin')) return;
    scrubbing = true;
    try { plot.setPointerCapture(ev.pointerId); } catch { /* not capturable */ }
    const Z = zAt(ev.clientX, ev.clientY); setHover(Z); hooks.onScrub(Z, ev.clientX, ev.clientY);
  });
  const endScrub = (ev, cancel) => {
    if (!scrubbing) return;
    scrubbing = false;
    const Z = cancel ? 0 : zAt(ev.clientX, ev.clientY);
    setHover(0); hooks.onScrub(null);
    if (Z) hooks.onPick(Z);
  };
  plot.addEventListener('pointerup', ev => { if (ev.pointerType === 'touch') endScrub(ev, false); });
  plot.addEventListener('pointercancel', ev => endScrub(ev, true));
  plot.addEventListener('click', ev => {
    if (ev.pointerType === 'touch' || scrubbing || ev.target.closest('.patterns-pin')) return;
    const Z = zAt(ev.clientX, ev.clientY);
    if (Z) hooks.onPick(Z);
  });

  return { el: plot, set, select, relayout, refreshLabels, get model() { return model; }, screenOf: Z => (G && !Number.isNaN(cur[Z]) ? { x: G.X(Z), y: cur[Z] } : null) };
}
