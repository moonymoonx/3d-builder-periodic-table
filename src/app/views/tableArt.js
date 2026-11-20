// Art for the table, all made in code (no images, no fonts): the rounded porcelain block, the baked
// contact shadows, the studio the glaze reflects (shader code), the atlas of symbols printed on the
// tile glaze, and the selection outline.
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

/** Soft rounded-square shadow (white with alpha falloff), as a canvas. */
export function softRectCanvas(size = 128, inner = 0.28, soft = 0.22) {
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
  return c;
}

/**
 * All contact shadows of the table baked into ONE texture on one plane under the tiles: one blended
 * layer on screen however close the camera gets. (Per-tile shadow quads overlapped 2-4 deep and took
 * half the frame on software renderers when zoomed in.) items: [{x, z, up}], up = how far the tile
 * is lifted (its shadow grows softer and lighter). Re-baked only when the layout or the lifted tile
 * changes.
 */
export function bakeContactShadows({ W, color, opacity, ppu = 40, maxPx = 1536 }) {
  const sprite = softRectCanvas(128), ground = softRectCanvas(128, 0.3, 0.2);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let tex = null;
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat);
  mesh.renderOrder = -2;
  function bake(items) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of items) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const m = 2.4; // room around the table for the soft ground shadow
    x0 -= m; x1 += m; z0 -= m; z1 += m;
    const s = Math.min(ppu, maxPx / (x1 - x0), maxPx / (z1 - z0));
    const cw = Math.ceil((x1 - x0) * s), ch = Math.ceil((z1 - z0) * s);
    if (!tex || canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch;
      if (tex) tex.dispose();
      tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
      mat.map = tex; mat.needsUpdate = true;
    } else ctx.clearRect(0, 0, cw, ch);
    // one very soft shadow under the whole table, then each tile's contact shadow (canvas y = world z)
    ctx.globalAlpha = 0.1;
    ctx.drawImage(ground, s * 0.9, s * 1.1, cw - s * 1.6, ch - s * 1.6);
    for (const p of items) {
      const k = Math.max(0, 1 - p.up * 2.2), size = W * (1.46 + p.up * 1.2) * s;
      ctx.globalAlpha = opacity * k;
      ctx.drawImage(sprite, (p.x + 0.05 - x0) * s - size / 2, (p.z + 0.07 - z0) * s - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
    mesh.scale.set(x1 - x0, 1, z1 - z0);
    mesh.position.set((x0 + x1) / 2, 0.003, (z0 + z1) / 2);
  }
  return { mesh, bake, setFade(f) { mat.opacity = f; mesh.visible = f > 0.002; } };
}

/**
 * The soft studio the tile glaze reflects, computed in the shader (no environment map: it costs no
 * texture reads, which matters on software renderers): warm walls, the paper floor, a long softbox low
 * behind the table (a sheen on the far tile tops) and a key softbox front-left (catchlights on the
 * front bevels). World-space normal n, direction to the eye v, roughness r. Returns reflected light.
 */
export const GLAZE = `
  vec3 glazeStudio(vec3 n, vec3 v, float r) {
    vec3 R = reflect(-v, n);
    float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);
    float soft = 0.05 + 0.45 * r;
    vec3 room = mix(vec3(0.42, 0.39, 0.35), vec3(0.70, 0.66, 0.58), smoothstep(0.05, -0.3, R.y));
    float back = smoothstep(-0.05, 0.3, -R.z) * (1.0 - smoothstep(0.7, 1.0, abs(R.x) / max(1e-3, length(R.xz))));
    float strip = (1.0 - smoothstep(0.1, 0.1 + soft, abs(R.y - 0.57))) * back;
    float key = smoothstep(1.0 - (0.04 + 0.6 * soft), 1.0, dot(R, vec3(-0.6, 0.52, 0.64)));
    return fres * (room + vec3(1.0, 0.97, 0.92) * (strip * 2.0 + key * 4.5));
  }`;

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
