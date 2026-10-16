// Material & geometry helpers for the Mio J model.
import * as THREE from 'three';
import { FINISH } from './data.js';

export const MAT = {
  paintL: new THREE.MeshPhysicalMaterial({ color: '#1f4fae', roughness: .32, clearcoat: 1, clearcoatRoughness: .04 }),
  paintR: null, // set below (clone so sides can be highlighted separately)
  paintF: null,
  dark:   new THREE.MeshPhysicalMaterial({ color: '#22252b', roughness: .5, clearcoat: .25, clearcoatRoughness: .5 }),
  black:  new THREE.MeshStandardMaterial({ color: '#16171a', roughness: .62 }),
  metal:  new THREE.MeshStandardMaterial({ color: '#b9bec5', roughness: .25, metalness: 1 }),
  alu:    new THREE.MeshStandardMaterial({ color: '#8d939b', roughness: .4, metalness: .8 }),
  engine: new THREE.MeshStandardMaterial({ color: '#6b7079', roughness: .55, metalness: .7 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#111214', roughness: .92 }),
  rim:    new THREE.MeshPhysicalMaterial({ color: '#1a1b1e', roughness: .38, metalness: .5, clearcoat: .8, clearcoatRoughness: .1 }),
  seat:   new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: .62, sheen: .6, sheenRoughness: .5, sheenColor: new THREE.Color('#3a3a3a') }),
  spring: new THREE.MeshStandardMaterial({ color: '#c9cdd3', roughness: .3, metalness: .7 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#e6e8eb', roughness: .08, metalness: 1 }),
  glass:  new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .03, transmission: .9, thickness: .005, transparent: true, opacity: .35 }),
  mirror: new THREE.MeshStandardMaterial({ color: '#cfd8e3', roughness: .02, metalness: 1 }),
};
MAT.paintR = MAT.paintL.clone();
MAT.paintF = MAT.paintL.clone();
export const PAINTS = [MAT.paintL, MAT.paintR, MAT.paintF];

export function setPaint(color, finish) {
  const f = FINISH[finish] || FINISH.glossy;
  for (const m of PAINTS) {
    m.color.set(color); m.roughness = f.roughness; m.metalness = f.metalness; m.clearcoat = f.clearcoat;
  }
}

export function lampMat(color, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .2 });
}

// Extrude a side-view profile (x forward, y up) symmetric around z=zc with total width w.
export function extrude(points, w, { bevel = .02, zc = 0, mat, curveSegs = 12, taper = null } = {}) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const depth = Math.max(w - 2 * bevel, .002);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * .9,
    bevelSegments: 4, curveSegments: curveSegs,
  });
  g.translate(0, 0, zc - depth / 2);
  if (taper) { // scale z about the bike centreline (z=0) as a function of x,y
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * taper(p.getX(i), p.getY(i)));
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Smooth profile: Catmull-Rom through control points, sampled.
export function smooth(pts, n = 60) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  return c.getPoints(n).map(v => [v.x, v.y]);
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
}

export function cyl(r1, r2, len, mat, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, seg), mat);
  m.castShadow = true; return m;
}

// Cylinder spanning from point a to point b (Vector3, in the parent's space).
export function rod(a, b, r, mat, seg = 14) {
  const m = cyl(r, r, 1, mat, seg);
  placeRod(m, a, b);
  return m;
}
const _up = new THREE.Vector3(0, 1, 0);
export function placeRod(m, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  m.scale.set(1, d.length(), 1);
  m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(_up, d.normalize());
}

// Coil spring geometry along +Y, length 1 (scaled later).
export function springGeo(r = .022, turns = 9, wire = .0042) {
  class Helix extends THREE.Curve {
    getPoint(t, out = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2;
      return out.set(Math.cos(a) * r, t - .5, Math.sin(a) * r);
    }
  }
  return new THREE.TubeGeometry(new Helix(), turns * 24, wire, 6, false);
}

// Tag every mesh below obj with a part id (for picking & exploded view).
export function tag(obj, id) {
  obj.userData.partId = id;
  obj.traverse(o => { if (o.isMesh) o.userData.partId = id; });
  return obj;
}

// ---------------- Permukaan halus (loft) ----------------
// Pangkat bertanda: dipakai untuk penampang superelips.
export const spow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

// Interpolasi kubik monoton (Fritsch–Carlson) melalui titik [x, y]. Di luar rentang: nilai ujung.
export function spline(pts) {
  const P = [...pts].sort((a, b) => a[0] - b[0]);
  const n = P.length, xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Pembulatan ujung: 0 tepat di ujung, 1 setelah jarak r dari ujung (profil seperempat elips).
export const endRound = (dist, r) => dist >= r ? 1 : Math.sqrt(Math.max(0, 1 - (1 - dist / r) ** 2));

// Bangun mesh dari deretan cincin (array Vector3, panjang sama). Normal halus, tutup di kedua ujung.
export function skin(rings, { closed = true, caps = true } = {}) {
  const R = rings.length, N = rings[0].length;
  const pos = [], uv = [], idx = [];
  rings.forEach((ring, i) => ring.forEach((p, j) => { pos.push(p.x, p.y, p.z); uv.push(i / (R - 1), j / (closed ? N : N - 1)); }));
  const J = closed ? N : N - 1;
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < J; j++) {
    const a = i * N + j, b = i * N + (j + 1) % N, c = a + N, d = b + N;
    idx.push(a, c, b, b, c, d);
  }
  if (caps) for (const [i, flip] of [[0, true], [R - 1, false]]) {
    const ring = rings[i], cen = new THREE.Vector3();
    ring.forEach(p => cen.add(p)); cen.divideScalar(N);
    const ci = pos.length / 3; pos.push(cen.x, cen.y, cen.z); uv.push(i ? 1 : 0, .5);
    for (let j = 0; j < J; j++) {
      const a = i * N + j, b = i * N + (j + 1) % N;
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  }
  // Pastikan normal menghadap keluar (volume bertanda positif)
  let vol = 0;
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    vol += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
         - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
         + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  if (vol < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Sampel parameter 0..1 lebih rapat di kedua ujung (supaya ujung membulat halus).
export function stations(n) {
  return Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos(Math.PI * i / (n - 1)));
}

// Penampang superelips dengan jari-jari atas/bawah dan kiri/kanan berbeda.
// a0..a1 = rentang sudut (0 = sisi +u, π/2 = sisi +v). Mengembalikan [u, v] titik.
export function seSection({ ru0, ru1, rv0, rv1, eu = 2, ev = 2, eu0 = eu, eu1 = eu, ev0 = ev, ev1 = ev, a0 = 0, a1 = Math.PI * 2, n = 48, closedRange = true }) {
  const out = [], full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const cnt = full ? n : n + (closedRange ? 1 : 0);
  for (let k = 0; k < cnt; k++) {
    const a = a0 + (a1 - a0) * k / (full ? n : n);
    const c = Math.cos(a), s = Math.sin(a);
    out.push([(c >= 0 ? ru1 : ru0) * spow(c, 2 / (c >= 0 ? eu1 : eu0)), (s >= 0 ? rv1 : rv0) * spow(s, 2 / (s >= 0 ? ev1 : ev0))]);
  }
  return out;
}

export function mesh(g, mat) {
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
