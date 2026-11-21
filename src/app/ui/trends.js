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
    // a faint line at every other power of ten (log scale), so each line up is ×10
    for (const k of model.y.minor || []) { const yy = G.Y(10 ** k); if (yy != null && yy >= m.t - 1 && yy <= G.base + 1) gGrid.append(S('line', { x1: m.l, x2: G.W - m.r, y1: yy, y2: yy, class: 'patterns-gridline is-minor' })); }
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
  function placeRefs(ix = spatialIndex([], []), taken = []) {
    refBoxes = [];
    for (const tx of gRef.querySelectorAll('.patterns-reflbl')) {
      const yy = +tx.dataset.y, w = tx.getComputedTextLength ? tx.getComputedTextLength() : 160;
      let best = null;
      // along its line, just above or just below it: the spot with the fewest beads, curves and labels in the way
      for (let i = 0; i <= 16; i++) for (const above of [true, false]) {
        const x0 = G.m.l + 6 + ((G.pw - w - 12) * i) / 16;
        const r = above ? { x0, x1: x0 + w, y0: yy - 19, y1: yy - 3 } : { x0, x1: x0 + w, y0: yy + 3, y1: yy + 19 };
        if (r.y1 > G.base - 1) continue;
        let cost = (above ? 0 : 3) + (i === 16 ? 0 : 1);
        const [sn, ss] = segsThrough(ix, r);
        cost += 20 * beadsOver(ix, r, G.r) + 14 * (sn + ss);
        for (const b of taken) if (overlap(r, b)) cost += 200;
        if (!best || cost < best.cost) best = { cost, r, above };
      }
      if (!best) continue;
      tx.setAttribute('x', best.r.x0); tx.setAttribute('text-anchor', 'start'); tx.setAttribute('y', best.above ? yy - 6 : yy + 15);
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

  // ---- geometry for the layout: beads, curves, boxes ------------------------------------------------------
  /** The drawn curves as segments between neighbouring beads (at their final places). */
  function segments() {
    const out = [];
    for (const [key, zs] of model.groups) {
      let prev = 0;
      for (const Z of zs) {
        const ok = !Number.isNaN(to[Z]) && opTo[Z] > 0.5 && model.kindOf(Z) !== 'ancient';
        if (ok && prev) out.push({ x1: G.X(prev), y1: to[prev], x2: G.X(Z), y2: to[Z], a: prev, b: Z, sel: key === model.selKey });
        prev = ok ? Z : 0;
      }
    }
    return out;
  }
  const beadList = () => model.points.filter(p => !Number.isNaN(to[p.Z]) && opTo[p.Z] > 0.5).map(p => ({ Z: p.Z, x: G.X(p.Z), y: to[p.Z] })).sort((a, b) => a.x - b.x);
  /**
   * Beads and curve segments indexed by x, so a candidate box or leader only checks what lies under it (the
   * layout tries thousands of spots; checking all 118 beads for each cost a long frame at every switch).
   */
  function spatialIndex(segs, B) {
    const S = segs.map(sg => Object.assign(sg, { sx0: Math.min(sg.x1, sg.x2), sx1: Math.max(sg.x1, sg.x2) })).sort((a, b) => a.sx0 - b.sx0);
    const span = S.reduce((m, sg) => Math.max(m, sg.sx1 - sg.sx0), 0);
    const lb = (arr, key, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const k = (lo + hi) >> 1; if (arr[k][key] < x) lo = k + 1; else hi = k; } return lo; };
    return { B, S, b0: x => lb(B, 'x', x), s0: x => lb(S, 'sx0', x - span) };
  }
  /** Beads within `pad` of a box (optionally skipping one element). */
  function beadsOver(ix, r, pad, skipZ = 0) {
    let n = 0;
    for (let i = ix.b0(r.x0 - pad); i < ix.B.length && ix.B[i].x < r.x1 + pad; i++) { const b = ix.B[i]; if (b.Z !== skipZ && b.y > r.y0 - pad && b.y < r.y1 + pad) n++; }
    return n;
  }
  /** Curve segments through a box: [plain, of the picked element's line]. */
  function segsThrough(ix, r) {
    let n = 0, sel = 0;
    for (let i = ix.s0(r.x0); i < ix.S.length && ix.S[i].sx0 <= r.x1; i++) { const sg = ix.S[i]; if (sg.sx1 >= r.x0 && segHitsRect(sg, r)) { if (sg.sel) sel++; else n++; } }
    return [n, sel];
  }
  const overlap = (r, b) => Math.min(r.x1, b.x1) > Math.max(r.x0, b.x0) && Math.min(r.y1, b.y1) > Math.max(r.y0, b.y0);
  function segHitsRect(s, r) { // Liang–Barsky clip: does the segment pass through the box?
    let t0 = 0, t1 = 1;
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    for (const [p, q] of [[-dx, s.x1 - r.x0], [dx, r.x1 - s.x1], [-dy, s.y1 - r.y0], [dy, r.y1 - s.y1]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const u = q / p;
      if (p < 0) { if (u > t1) return false; if (u > t0) t0 = u; } else { if (u < t0) return false; if (u < t1) t1 = u; }
    }
    return true;
  }
  function segsCross(a, b) {
    const d = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1);
    if (Math.abs(d) < 1e-9) return false;
    const u = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / d, v = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / d;
    return u > 0 && u < 1 && v > 0 && v < 1;
  }
  function distToSeg(px, py, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = dx * dx + dy * dy || 1;
    const k = clamp(((px - s.x1) * dx + (py - s.y1) * dy) / L, 0, 1);
    return Math.hypot(px - s.x1 - k * dx, py - s.y1 - k * dy);
  }
  /** A leader from a box to a bead: from the box's nearest point to just outside the bead's ring. */
  function leaderTo(r, x, y) {
    const ex = clamp(x, r.x0, r.x1), ey = clamp(y, r.y0, r.y1), dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy);
    if (d < G.r + 7) return null; // the note already touches its bead
    return { x1: ex + (dx / d) * 3, y1: ey + (dy / d) * 3, x2: x - (dx / d) * (G.r + 3.5), y2: y - (dy / d) * (G.r + 3.5) };
  }

  // ---- selection, hover -------------------------------------------------------------------------------
  const yOf = Z => (!Number.isNaN(cur[Z]) && opTo[Z] > 0.5 ? cur[Z] : G.base); // no value: at the axis
  let pinPlace = null; // where the pinned label sits around its bead: { dx, dy, side }
  function placeSel() {
    const Z = model.selZ;
    const ok = Z && !Number.isNaN(cur[Z]) && opTo[Z] > 0.5;
    const hz = hover && hover !== Z && !Number.isNaN(cur[hover]) && opTo[hover] > 0.5 ? hover : 0;
    // while a thumb scrubs, the guide follows the thumb; the picked element waits, dimmed
    const gz = scrubbing && hz ? hz : ok ? Z : 0;
    ring.style.display = ok ? '' : 'none'; guide.style.display = gz ? '' : 'none';
    ring.style.opacity = scrubbing && hz ? '0.35' : '';
    if (ok) { ring.setAttribute('cx', G.X(Z)); ring.setAttribute('cy', cur[Z]); ring.setAttribute('r', G.r + (G.phone ? 4.5 : 5.5)); }
    if (gz) { const x = G.X(gz), y = cur[gz]; guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('y1', y + G.r + 6); guide.setAttribute('y2', G.base); }
    hoverRing.style.display = hz ? '' : 'none';
    if (hz) { hoverRing.setAttribute('cx', G.X(hz)); hoverRing.setAttribute('cy', cur[hz]); hoverRing.setAttribute('r', G.r + 3.5); }
    placeLabel(pin, Z && !G.phone && !scrubbing ? Z : 0, hooks.pinNode, pinPlace);
    pin.classList.toggle('is-none', !!Z && !ok);
    placeLabel(tip, hz && !G.phone && !scrubbing ? hz : 0, hooks.tipNode, null);
    // the hover label never hides the pinned one: it goes below its bead instead
    if (!pin.hidden && !tip.hidden && overlap(boxOf(pin), boxOf(tip))) placeLabel(tip, hz, hooks.tipNode, { below: true });
  }
  const boxOf = el => { const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform) || [0, 0, 0]; return { x0: +m[1], y0: +m[2], x1: +m[1] + (el._size ? el._size[0] : 0), y1: +m[2] + (el._size ? el._size[1] : 0) }; };
  let pinZ = 0, tipZ = 0;
  function placeLabel(el, Z, make, place) {
    if (!Z) { el.hidden = true; if (el === pin) pinZ = 0; else tipZ = 0; return; }
    const was = el === pin ? pinZ : tipZ;
    const fresh = was !== Z || el.dataset.lang !== state.lang;
    if (fresh) { replace(el, make(Z)); el.dataset.lang = state.lang; if (el === pin) pinZ = Z; else tipZ = Z; }
    if (el.hidden) { el.hidden = false; el._size = null; }
    // measured once per content (reading sizes every animation frame would force a layout each frame)
    if (fresh || !el._size || !el._size[0]) el._size = [el.offsetWidth, el.offsetHeight];
    const x = G.X(Z), y = yOf(Z), [w, hh] = el._size;
    let lx, ly, side;
    if (place && place.side) { lx = x + place.dx; ly = y + place.dy; side = place.side; }
    else { side = place && place.below || y - hh - 16 < 4 ? 'below' : 'above'; lx = x - w / 2; ly = side === 'below' ? y + G.r + 10 : y - hh - G.r - 10; }
    lx = clamp(lx, 4, G.W - w - 4);
    el.classList.toggle('is-below', side === 'below'); el.classList.toggle('is-left', side === 'left'); el.classList.toggle('is-right', side === 'right');
    el.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
    // the caret points at the bead: along the bottom or top edge, or on the side facing it
    el.style.setProperty('--caret', side === 'left' || side === 'right' ? `${clamp(y - ly, 10, hh - 10).toFixed(1)}px` : `${clamp(x - lx, 12, w - 12).toFixed(1)}px`);
  }
  /**
   * Where the picked element's label goes: the spot around its bead that covers the fewest beads and curves
   * (its own row's curve counts double), so it never sits on the peaks it is about.
   */
  function layoutPin(ix) {
    pinPlace = null;
    const Z = model.selZ;
    if (!Z || G.phone) return null;
    const has = !Number.isNaN(to[Z]) && opTo[Z] > 0.5, x = G.X(Z), y = has ? to[Z] : G.base;
    placeLabel(pin, Z, hooks.pinNode, null);
    const [w, hh] = pin._size, g = G.r + 11, lim = { x0: 4, x1: G.W - 4, y0: 2, y1: G.H - 4 };
    const cands = [['above', -w / 2, -hh - g, 0], ['above', -w + 26, -hh - g, 5], ['above', -26, -hh - g, 5], ['below', -w / 2, g, 10], ['below', -w + 26, g, 13], ['below', -26, g, 13],
      ['right', g, -hh / 2, 14], ['left', -w - g, -hh / 2, 14], ['above', -w / 2, -hh - g - 26, 18], ['below', -w / 2, g + 26, 22]];
    let best = null;
    for (const [side, dx, dy, pref] of cands) {
      const r = { x0: x + dx, y0: y + dy, x1: x + dx + w, y1: y + dy + hh };
      let cost = pref + 40 * (Math.max(0, lim.x0 - r.x0) + Math.max(0, r.x1 - lim.x1) + Math.max(0, lim.y0 - r.y0) + Math.max(0, r.y1 - lim.y1));
      const [sn, ss] = segsThrough(ix, r);
      cost += 60 * beadsOver(ix, r, G.r, Z) + 40 * sn + 90 * ss;
      if (r.y0 < G.m.t - 3) cost += 45; // the row names along the top stay readable
      if (!best || cost < best.cost) best = { cost, side, dx, dy, r };
    }
    pinPlace = { side: best.side, dx: best.dx, dy: best.dy };
    return best.r;
  }

  // ---- callouts: italic ink notes, placed in clear paper, their leaders never brushing another bead --------
  function layoutNotes(ix, taken) {
    replace(gAnchors); replace(gLeaders);
    const placed = [...taken];
    const els = [...notes.children];
    const lim = { x0: G.m.l + 2, x1: G.W - G.m.r - 2, y0: G.m.t + 2, y1: G.base - 2 };
    const near = G.phone ? [10, 22, 38, 60, 90] : [14, 30, 52, 80, 115, 160];
    const step = G.phone ? 16 : 24, win = G.phone ? [170, 150] : [320, 210];
    model.callouts.forEach((c, i) => {
      const el = els[i];
      if (!el) return;
      // a note about the picked element alone would only repeat its pinned label
      const dup = c.anchors.length === 1 && c.anchors[0] === model.selZ;
      const live = c.anchors.filter(Z => !Number.isNaN(to[Z]) && opTo[Z] > 0.5);
      if (!live.length || dup) { el.hidden = true; return; }
      el.hidden = false;
      // the box hugs its text: a balanced wrap leaves the block at its full max-width, which strands the leader
      el.style.width = '';
      const rg = document.createRange(); rg.selectNodeContents(el);
      el.style.width = `${Math.ceil(rg.getBoundingClientRect().width) + 1}px`;
      const w = el.offsetWidth, hh = el.offsetHeight, anchors = new Set(live);
      // a note about one or two elements points at each; about a whole family, at the one with the clearest view
      const leads = live.length <= 2 ? [live.includes(c.lead) ? c.lead : live[0]] : live.slice(0, 6);
      // phones have no room for two long leaders: one points, and the ink rings mark the other
      const extra = live.length <= 2 && !G.phone ? live.filter(Z => Z !== leads[0]) : [];
      let best = null;
      const score = (r, lead) => {
        let cost = 40 * (Math.max(0, lim.x0 - r.x0) + Math.max(0, r.x1 - lim.x1) + Math.max(0, lim.y0 - r.y0) + Math.max(0, r.y1 - lim.y1));
        if (best && cost >= best.cost) return Infinity;
        for (const b of placed) if (overlap({ x0: r.x0 - 6, y0: r.y0 - 4, x1: r.x1 + 6, y1: r.y1 + 4 }, b)) cost += 600;
        cost += 60 * beadsOver(ix, r, G.r + 2);
        if (best && cost >= best.cost) return Infinity;
        const [sn, ss] = segsThrough(ix, r);
        cost += 40 * sn + 70 * ss;
        for (const Z of [lead, ...extra]) {
          const L = leaderTo(r, G.X(Z), to[Z]);
          if (!L) continue;
          cost += Math.hypot(L.x2 - L.x1, L.y2 - L.y1) * 0.32;
          const lx0 = Math.min(L.x1, L.x2) - G.r - 3, lx1 = Math.max(L.x1, L.x2) + G.r + 3;
          for (let k = ix.b0(lx0); k < ix.B.length && ix.B[k].x <= lx1; k++) { const b = ix.B[k]; if (!anchors.has(b.Z) && distToSeg(b.x, b.y, L) < G.r + 3) cost += 90; } // never seems to point at a neighbour
          for (let k = ix.s0(lx0); k < ix.S.length && ix.S[k].sx0 <= lx1; k++) { const sg = ix.S[k]; if (sg.sx1 >= lx0 && sg.a !== Z && sg.b !== Z && segsCross(L, sg)) cost += 28; }
          for (const b of placed) if (segHitsRect(L, b)) cost += 300;
        }
        return cost;
      };
      for (const lead of leads) {
        const lx = G.X(lead), ly = to[lead];
        const tryAt = (x0, y0, pref) => { const r = { x0, y0, x1: x0 + w, y1: y0 + hh }; const c2 = score(r, lead) + pref; if (!best || c2 < best.cost) best = { cost: c2, r, lead }; };
        for (const dist of near) {
          tryAt(lx - w / 2, ly - dist - hh, 0); tryAt(lx - w / 2, ly + dist, 6);
          tryAt(lx + dist, ly - hh / 2, 3); tryAt(lx - dist - w, ly - hh / 2, 3);
          tryAt(lx + dist * 0.7, ly - dist * 0.7 - hh, 2); tryAt(lx - dist * 0.7 - w, ly - dist * 0.7 - hh, 2);
          tryAt(lx + dist * 0.7, ly + dist * 0.7, 7); tryAt(lx - dist * 0.7 - w, ly + dist * 0.7, 7);
        }
        for (let gx = lx - win[0]; gx <= lx + win[0]; gx += step) for (let gy = ly - win[1]; gy <= ly + win[1]; gy += step) tryAt(gx - w / 2, gy - hh / 2, 10);
      }
      const r = best.r;
      placed.push(r);
      el.style.transform = `translate(${r.x0.toFixed(1)}px, ${r.y0.toFixed(1)}px)`;
      el.style.textAlign = G.X(best.lead) > r.x1 - 2 ? 'right' : 'left'; // the lines lean toward their leader
      for (const Z of [best.lead, ...extra]) {
        const L = leaderTo(r, G.X(Z), to[Z]);
        if (L) gLeaders.append(S('line', { ...L, class: 'patterns-leader', 'data-i': i }));
      }
      // every element the note is about wears a fine ink ring
      for (const Z of live) gAnchors.append(S('circle', { cx: G.X(Z), cy: to[Z], r: G.r + 2.6, class: 'patterns-anchor', 'data-i': i }));
    });
  }
  /** The whole layout, in order of importance: the picked label, the reference labels, then the notes. */
  function layoutAll() {
    const ix = spatialIndex(segments(), beadList());
    const pr = layoutPin(ix);
    const taken = pr ? [{ x0: pr.x0 - 6, y0: pr.y0 - 6, x1: pr.x1 + 6, y1: pr.y1 + 6 }] : [];
    placeRefs(ix, taken);
    for (const r of refBoxes) taken.push({ x0: r.x0 - 4, y0: r.y0 - 3, x1: r.x1 + 4, y1: r.y1 + 4 });
    layoutNotes(ix, taken);
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
    layoutAll();
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
    layoutAll(); revealNotes(tween ? notesK : 1); // the label and the notes make way for each other again
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
    layoutAll();
    if (!tween) { placeBeads(); drawLines(); lineReveal(1); revealNotes(1); }
    placeSel();
  }
  function refreshLabels() { pinZ = 0; tipZ = 0; if (model && G) layoutAll(); placeSel(); }

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
