// Material & geometry helpers for the Mio J model.
import * as THREE from 'three';
import { FINISH } from './data.js';

export const MAT = {
  paintL: new THREE.MeshPhysicalMaterial({ color: '#1f4fae', roughness: .32, clearcoat: 1, clearcoatRoughness: .08 }),
  paintR: null, // set below (clone so sides can be highlighted separately)
  paintF: null,
  dark:   new THREE.MeshStandardMaterial({ color: '#22252b', roughness: .55 }),
  black:  new THREE.MeshStandardMaterial({ color: '#141518', roughness: .7 }),
  metal:  new THREE.MeshStandardMaterial({ color: '#b9bec5', roughness: .25, metalness: 1 }),
  alu:    new THREE.MeshStandardMaterial({ color: '#8d939b', roughness: .4, metalness: .8 }),
  engine: new THREE.MeshStandardMaterial({ color: '#5b6068', roughness: .5, metalness: .6 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#111214', roughness: .92 }),
  rim:    new THREE.MeshStandardMaterial({ color: '#1a1b1e', roughness: .35, metalness: .4 }),
  seat:   new THREE.MeshStandardMaterial({ color: '#141414', roughness: .8 }),
  spring: new THREE.MeshStandardMaterial({ color: '#c9cdd3', roughness: .3, metalness: .7 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#e6e8eb', roughness: .08, metalness: 1 }),
  glass:  new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .05, transmission: .6, transparent: true, opacity: .55 }),
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
