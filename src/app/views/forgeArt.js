// Art for the forge (Hold a piece · heat it), all made in code and cheap enough for phones:
// a glass vessel that shows only at its edges (Fresnel), soft incandescent glows billboarded around
// every hot atom (one instanced draw), the glowing molten pool, and the "spokes" from one atom to the
// neighbours it touches. Scene units are picometres.
import * as THREE from 'three';

/** Glass: nearly invisible face-on, a soft sheen where you look along it (no CAD wireframe). */
export function glassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color('#ffffff') }, uK: { value: 0.22 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uK; varying vec3 vN; varying vec3 vV;
      void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(uCol, 0.015 + uK * f); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

/**
 * Incandescent glow around each hot atom: one camera-facing soft dot per atom, additive, sharing the
 * atoms' instance matrices and their vibration (so the glow moves with the atom).
 */
export function glowSprites(atoms, seeds, uni) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.setAttribute('aSeed', seeds);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: uni.uTime, uAmp: uni.uAmp, uSize: { value: 100 }, uCol: { value: new THREE.Color() }, uK: { value: 0 } },
    vertexShader: `attribute vec3 aSeed; uniform float uTime; uniform float uAmp; uniform float uSize; varying vec2 vUv;
      void main() {
        vec3 w = vec3(7.1, 8.3, 9.7) + aSeed * 3.0;
        vec3 off = uAmp * vec3(sin(uTime * w.x + aSeed.x * 40.0), sin(uTime * w.y + aSeed.y * 40.0), sin(uTime * w.z + aSeed.z * 40.0));
        vec4 c = modelViewMatrix * instanceMatrix * vec4(off, 1.0);
        c.xy += position.xy * uSize;
        vUv = position.xy * 2.0;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: `uniform vec3 uCol; uniform float uK; varying vec2 vUv;
      void main() { float d = length(vUv); float a = exp(-d * d * 3.2) * (1.0 - smoothstep(0.8, 1.0, d)); gl_FragColor = vec4(uCol, a * uK); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, atoms.instanceMatrix.count);
  mesh.instanceMatrix = atoms.instanceMatrix; // same positions as the atoms
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  return { mesh, mat };
}

/**
 * The molten pool: a low dome over the liquid atoms, glowing in the blackbody colour, with slow
 * convection cells and a brighter meniscus where the surface curves down to the hearth.
 */
export function moltenPool() {
  const uni = { uTime: { value: 0 }, uCol: { value: new THREE.Color() }, uK: { value: 0 } };
  const mat = new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.14, metalness: 0, transparent: true, opacity: 0.97, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec3 uCol; uniform float uK; varying vec3 vWorld;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 p = vWorld * 0.0105;
        float cells = sin(p.x * 1.7 + sin(p.z * 1.3 + uTime * 0.4) + uTime * 0.7) * sin(p.z * 1.9 + sin(p.x * 1.1 - uTime * 0.3) - uTime * 0.55) + 0.4 * sin((p.x - p.z) * 2.6 + p.y + uTime * 1.1);
        float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float meniscus = pow(1.0 - facing, 2.0);
        totalEmissiveRadiance += uCol * uK * (0.74 + 0.1 * cells + 0.45 * meniscus);`);
  };
  // a flat-topped pool whose edge rolls down like a meniscus: y = (1 - r^4)^(1/4), turned on a lathe
  const prof = [];
  for (let i = 0; i <= 30; i++) { const r = Math.min(1, i / 28); prof.push(new THREE.Vector2(r * 0.9999 + 1e-4, Math.pow(Math.max(0, 1 - r ** 4), 1 / 4))); }
  prof.reverse(); prof.push(new THREE.Vector2(1, 0));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), mat);
  mesh.renderOrder = 3;
  mesh.visible = false;
  return { mesh, mat, uni };
}

/** Spokes from one atom to each neighbour it touches (the "8 neighbours" made visible). */
export function spokes() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 6), 3));
  const mat = new THREE.LineBasicMaterial({ color: '#1C1A17', transparent: true, opacity: 0.85, depthTest: false });
  const mesh = new THREE.LineSegments(geo, mat);
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  const dots = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: '#1C1A17', size: 7, sizeAttenuation: false, depthTest: false, transparent: true }));
  dots.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
  dots.renderOrder = 6;
  dots.frustumCulled = false;
  return { mesh, mat, dots };
}
