// Screen-space HTML labels (>= 14 px) with greedy overlap culling: higher priority wins,
// then nearer to the camera. Nothing is ever drawn overlapping.
import { toScreen } from './engine.js';

export class LabelLayer {
  constructor(root) { this.root = root; this.items = []; this.enabled = true; }
  add({ pos, text, sub = '', cls = '', priority = 0, anchor = 'bottom', data = null }) {
    const el = document.createElement('div');
    el.className = 'lbl ' + cls;
    const it = { el, pos, priority, anchor, data, w: 0, h: 0, visible: false, text: null, sub: null, cls };
    this.setText(it, text, sub);
    this.root.append(el);
    this.items.push(it);
    return it;
  }
  setText(it, text, sub = '') {
    if (it.text === text && it.sub === sub) return;
    it.text = text; it.sub = sub;
    it.el.textContent = text;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; it.el.append(s); }
    it.w = 0;
  }
  setClass(it, cls) { if (it.cls !== cls) { it.cls = cls; it.el.className = 'lbl ' + cls; it.w = 0; } }
  clear() { for (const it of this.items) it.el.remove(); this.items = []; }
  hideAll() { for (const it of this.items) if (it.visible) { it.el.style.visibility = 'hidden'; it.visible = false; } }
  update() {
    if (!this.enabled) { this.hideAll(); return; }
    const W = window.innerWidth, H = window.innerHeight;
    const cand = [];
    for (const it of this.items) {
      if (it.priority < 0) { if (it.visible) { it.el.style.visibility = 'hidden'; it.visible = false; } continue; }
      const s = toScreen(it.pos, it.s || (it.s = {}));
      if (!s || s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) { if (it.visible) { it.el.style.visibility = 'hidden'; it.visible = false; } continue; }
      if (!it.w) { it.w = it.el.offsetWidth || 24; it.h = it.el.offsetHeight || 18; }
      cand.push(it);
    }
    cand.sort((a, b) => b.priority - a.priority || a.s.z - b.s.z);
    const placed = [];
    const pad = 3;
    for (const it of cand) {
      const x = it.s.x - it.w / 2;
      const y = it.anchor === 'center' ? it.s.y - it.h / 2 : it.s.y - it.h - 4;
      const r = { x0: x - pad, y0: y - pad, x1: x + it.w + pad, y1: y + it.h + pad };
      let hit = false;
      for (const p of placed) if (r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0) { hit = true; break; }
      if (hit) { if (it.visible) { it.el.style.visibility = 'hidden'; it.visible = false; } continue; }
      placed.push(r);
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      if (!it.visible) { it.el.style.visibility = 'visible'; it.visible = true; }
    }
  }
}
