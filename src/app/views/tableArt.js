// Art for the table, all made in code (no images, no fonts): the rounded porcelain block, the soft
// contact-shadow texture, the atlas of symbols printed on the tile glaze, and the selection outline.
import * as THREE from 'three';

/**
 * A box with rounded edges (radius r), centred at the origin. Built like three.js's
 * RoundedBoxGeometry example (MIT): an odd-segmented unit box whose vertices are pushed onto a
 * rounded shell around an inner box.
 */
export function roundedBox(w, h, d, r, seg = 3) {
  const n = seg * 2 + 1;
  const g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position.array, nrm = g.attributes.normal.array;
  const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const half = 0.5 / n;
  for (let i = 0; i < pos.length; i += 3) {
    p.fromArray(pos, i);
    q.copy(p);
    q.x -= Math.sign(q.x) * half; q.y -= Math.sign(q.y) * half; q.z -= Math.sign(q.z) * half;
    q.normalize();
    pos[i] = inner.x * Math.sign(p.x) + q.x * r;
    pos[i + 1] = inner.y * Math.sign(p.y) + q.y * r;
    pos[i + 2] = inner.z * Math.sign(p.z) + q.z * r;
    nrm[i] = q.x; nrm[i + 1] = q.y; nrm[i + 2] = q.z;
  }
  g.attributes.position.needsUpdate = true;
  g.attributes.normal.needsUpdate = true;
  g.deleteAttribute('uv');
  return g;
}

/** Soft rounded-square shadow (white with alpha falloff) for contact shadows. */
export function softRectTexture(size = 128, inner = 0.28, soft = 0.22) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    // distance from a rounded square of half-size `inner` (in 0..0.5 units)
    const u = Math.abs((x + 0.5) / size - 0.5), v = Math.abs((y + 0.5) / size - 0.5);
    const dx = Math.max(u - inner, 0), dy = Math.max(v - inner, 0);
    const dist = Math.hypot(dx, dy);
    const a = Math.max(0, 1 - dist / soft);
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    img.data[i + 3] = Math.round(255 * a * a * (3 - 2 * a)); // smoothstep falloff
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Atlas of the symbol (and small atomic number) printed on each tile, drawn with the system sans.
 * White on transparent: the shader uses the alpha as ink coverage. cols x rows cells of `cell` px.
 */
export function symbolAtlas(els, { cols = 16, cell = 128, font }) {
  const rows = Math.ceil(els.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * cell; c.height = rows * cell;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  els.forEach((e, i) => {
    const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
    ctx.font = `600 ${Math.round(cell * 0.44)}px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(e.sym, x + cell / 2, y + cell * 0.7);
    ctx.font = `500 ${Math.round(cell * 0.16)}px ${font}`;
    ctx.textAlign = 'left';
    ctx.fillText(String(e.Z), x + cell * 0.1, y + cell * 0.24);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { tex, cols, rows };
}

/** Flat rounded-square outline (selection mark at the base of a tile). */
export function roundedOutline(size, r, width) {
  const shape = new THREE.Shape(), hole = new THREE.Path();
  const rr = (P, s, rad) => {
    const h = s / 2;
    P.moveTo(-h + rad, -h); P.lineTo(h - rad, -h); P.quadraticCurveTo(h, -h, h, -h + rad); P.lineTo(h, h - rad);
    P.quadraticCurveTo(h, h, h - rad, h); P.lineTo(-h + rad, h); P.quadraticCurveTo(-h, h, -h, h - rad); P.lineTo(-h, -h + rad);
    P.quadraticCurveTo(-h, -h, -h + rad, -h);
  };
  rr(shape, size + width, r + width / 2);
  rr(hole, size - width, Math.max(0.01, r - width / 2));
  shape.holes.push(hole);
  const g = new THREE.ShapeGeometry(shape, 6);
  g.rotateX(-Math.PI / 2);
  return g;
}

/** WCAG relative luminance of a hex colour. */
export function luminance(hex) {
  const c = new THREE.Color(hex);
  const lin = [c.r, c.g, c.b]; // THREE.Color stores linear values when colour management is on
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
