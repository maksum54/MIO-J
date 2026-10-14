// Panel body & rangka Mio J 2014 (x = depan, y = atas dari tanah, z = kiri; meter).
// Proporsi acuan: P 1850 · L 700 · T 1050 · wheelbase 1260 · tinggi jok 745
//   ground clearance 130 · dek pijakan ±250 · ban depan Ø482 · ban belakang Ø500 · garpu ±26°
import * as THREE from 'three';
import { MAT, extrude, smooth, box, rod, tag } from './parts.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
// Peluruhan elips: 1 di tengah rentang, 0 di ujung
const ell = (t) => Math.sqrt(Math.max(0, 1 - clamp(t, -1, 1) ** 2));

export function makeBody() {
  const P = {};

  // ---------- Tebeng depan (apron): lebar di bawah lutut, menyempit ke atas, ada paruh ----------
  const apron = smooth([
    [0.285, 0.845], [0.355, 0.87], [0.45, 0.82], [0.505, 0.72], [0.505, 0.60],
    [0.475, 0.52], [0.405, 0.44], [0.345, 0.35], [0.29, 0.27], [0.265, 0.30],
    [0.25, 0.55], [0.255, 0.75],
  ], 110);
  P['body-depan'] = extrude(apron, 0.40, {
    bevel: 0.035, mat: MAT.paintF, curveSegs: 14,
    taper: (x, y) => {
      const up = clamp((y - 0.55) / 0.32, 0, 1);
      const dn = clamp((0.42 - y) / 0.18, 0, 1);
      return clamp(1 - 0.44 * up * up - 0.30 * dn * dn, 0.25, 1);
    },
  });

  // ---------- Tebeng dalam (leg shield, gelap) ----------
  P['tebeng-dalam'] = extrude(smooth([
    [0.245, 0.80], [0.30, 0.81], [0.305, 0.55], [0.295, 0.32], [0.255, 0.27], [0.225, 0.32], [0.235, 0.58],
  ], 60), 0.36, { bevel: 0.02, mat: MAT.dark, taper: (x, y) => clamp(1 - 0.3 * clamp((y - 0.6) / 0.22, 0, 1), .5, 1) });

  // ---------- Dek pijakan kaki (tinggi ±0.25) ----------
  P['dek'] = extrude([[0.27, 0.265], [0.27, 0.225], [-0.055, 0.225], [-0.055, 0.265]], 0.30, { bevel: 0.012, mat: MAT.black });
  for (let i = 0; i < 8; i++) P['dek'].add(box(0.014, 0.005, 0.26, MAT.dark, 0.235 - i * 0.035, 0.268, 0));

  // ---------- Cover bawah dek ----------
  P['cover-bawah'] = extrude(smooth([
    [0.30, 0.235], [0.30, 0.165], [0.24, 0.148], [0.06, 0.145], [-0.06, 0.16], [-0.10, 0.225], [-0.05, 0.235],
  ], 50), 0.235, { bevel: 0.018, mat: MAT.black, taper: (x, y) => clamp(1 - 0.32 * clamp((0.24 - y) / 0.09, 0, 1), .5, 1) });

  // ---------- Cover tengah (antara dek dan jok) ----------
  P['cover-tengah'] = extrude(smooth([
    [0.09, 0.27], [0.115, 0.50], [0.075, 0.655], [-0.005, 0.665], [-0.02, 0.30],
  ], 50), 0.235, { bevel: 0.025, mat: MAT.dark, taper: (x, y) => clamp(0.72 + 0.28 * ell((y - 0.45) / 0.22), .6, 1) });

  // ---------- Body samping: menggembung di atas CVT, mengecil ke ekor ----------
  const sideProfile = smooth([
    [0.075, 0.30], [0.10, 0.47], [0.065, 0.62], [-0.08, 0.675], [-0.35, 0.685], [-0.62, 0.675],
    [-0.82, 0.655], [-0.90, 0.615], [-0.86, 0.575], [-0.72, 0.545], [-0.52, 0.505],
    [-0.30, 0.455], [-0.12, 0.395], [-0.02, 0.315],
  ], 110);
  const sideTaper = (x, y) => {
    const rear = clamp((-x - 0.34) / 0.56, 0, 1);
    const top = clamp((y - 0.60) / 0.09, 0, 1);
    const bot = clamp((0.38 - y) / 0.10, 0, 1);
    return clamp(1 - 0.52 * rear * rear - 0.22 * top * top - 0.30 * bot * bot, 0.2, 1);
  };
  P['body-kiri'] = extrude(sideProfile, 0.185, { bevel: 0.035, zc: 0.0925, mat: MAT.paintL, curveSegs: 14, taper: sideTaper });
  P['body-kanan'] = extrude(sideProfile, 0.185, { bevel: 0.035, zc: -0.0925, mat: MAT.paintR, curveSegs: 14, taper: sideTaper });

  // ---------- Cover belakang / ekor ----------
  P['cover-belakang'] = extrude(smooth([
    [-0.815, 0.665], [-0.90, 0.655], [-0.945, 0.615], [-0.925, 0.575], [-0.845, 0.58], [-0.80, 0.615],
  ], 50), 0.175, { bevel: 0.022, mat: MAT.dark, taper: (x) => clamp(1 - 0.42 * clamp((-x - 0.84) / 0.11, 0, 1), .3, 1) });

  // ---------- Jok: cekung untuk pengendara, naik di boncengan ----------
  P['jok'] = extrude(smooth([
    [0.085, 0.655], [0.03, 0.715], [-0.06, 0.735], [-0.22, 0.722], [-0.34, 0.70],
    [-0.47, 0.715], [-0.63, 0.745], [-0.76, 0.74], [-0.80, 0.70], [-0.70, 0.665], [-0.30, 0.655],
  ], 110), 0.285, {
    bevel: 0.04, mat: MAT.seat, curveSegs: 14,
    taper: (x) => 0.72 + 0.28 * ell((x + 0.18) / 0.42) - 0.18 * clamp((-x - 0.62) / 0.16, 0, 1),
  });
  P['jok'].add(box(0.60, 0.004, 0.004, MAT.dark, -0.34, 0.742, 0));

  // ---------- Behel ----------
  const behel = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    V(-0.60, 0.712, 0.125), V(-0.78, 0.735, 0.128), V(-0.885, 0.742, 0.09), V(-0.915, 0.748, 0),
    V(-0.885, 0.742, -0.09), V(-0.78, 0.735, -0.128), V(-0.60, 0.712, -0.125),
  ]);
  behel.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0115, 10), MAT.black));
  P['behel'] = behel;

  // ---------- Batok (cover stang + rumah lampu) ----------
  const batok = new THREE.Group();
  batok.add(extrude(smooth([
    [0.215, 0.86], [0.255, 0.925], [0.35, 0.955], [0.45, 0.945], [0.475, 0.895], [0.42, 0.845], [0.245, 0.83],
  ], 70), 0.285, { bevel: 0.03, mat: MAT.paintF, curveSegs: 14, taper: (x) => clamp(1 - 0.34 * clamp((x - 0.28) / 0.16, 0, 1), .45, 1) }));
  batok.add(extrude(smooth([[0.205, 0.855], [0.245, 0.92], [0.29, 0.918], [0.275, 0.835], [0.225, 0.828]], 40), 0.255, { bevel: 0.018, mat: MAT.black }));
  P['batok'] = batok;

  // ---------- Speedometer ----------
  const speedo = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.05, 40), new THREE.MeshStandardMaterial({ color: '#0b0c0f', roughness: .3 }));
  face.position.set(0.255, 0.912, 0); face.rotation.set(0, -Math.PI / 2, 0); face.rotateX(-0.95);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.036, 0.002), new THREE.MeshBasicMaterial({ color: '#ff5a1f' }));
  needle.position.set(0, 0.01, 0.002); face.add(needle);
  face.add(new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.004, 8, 40), MAT.chrome));
  speedo.add(face);
  P['speedometer'] = speedo;

  // ---------- Stang, grip, handle rem ----------
  const stang = new THREE.Group();
  stang.add(rod(V(0.30, 0.895, -0.315), V(0.30, 0.895, 0.315), 0.011, MAT.metal));
  for (const s of [-1, 1]) {
    stang.add(rod(V(0.30, 0.895, s * 0.24), V(0.30, 0.895, s * 0.345), 0.017, MAT.rubber));
    stang.add(rod(V(0.325, 0.905, s * 0.17), V(0.36, 0.90, s * 0.315), 0.006, MAT.alu));
    stang.add(box(0.05, 0.033, 0.048, MAT.black, 0.30, 0.895, s * 0.195));
  }
  P['stang'] = stang;

  // ---------- Spion ----------
  const spion = new THREE.Group();
  for (const s of [-1, 1]) {
    spion.add(rod(V(0.275, 0.91, s * 0.21), V(0.265, 0.985, s * 0.27), 0.006, MAT.black));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 12), MAT.black);
    head.scale.set(0.38, 0.55, 1); head.position.set(0.263, 1.00, s * 0.295); spion.add(head);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), MAT.mirror);
    glass.scale.set(1, 0.55, 1); glass.position.set(0.243, 1.00, s * 0.295); glass.rotation.y = -Math.PI / 2;
    spion.add(glass);
  }
  P['spion'] = spion;

  // ---------- Spakbor belakang + dudukan plat ----------
  const sbb = new THREE.Group();
  sbb.add(extrude(smooth([
    [-0.74, 0.545], [-0.845, 0.535], [-0.92, 0.475], [-0.915, 0.375], [-0.875, 0.36], [-0.875, 0.45],
    [-0.82, 0.505], [-0.73, 0.52],
  ], 50), 0.135, { bevel: 0.01, mat: MAT.black }));
  sbb.add(box(0.004, 0.095, 0.185, new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: .5 }), -0.918, 0.405, 0));
  P['spakbor-belakang'] = sbb;

  // ---------- Rangka ----------
  const rangka = new THREE.Group();
  rangka.add(rod(V(0.315, 0.83), V(0.36, 0.70), 0.028, MAT.dark));
  rangka.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    [V(0.33, 0.75), V(0.29, 0.55), V(0.255, 0.32), V(0.12, 0.255), V(-0.03, 0.26), V(-0.115, 0.315)]), 40, 0.022, 10), MAT.dark));
  for (const s of [-1, 1]) {
    rangka.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
      [V(-0.115, 0.315, s * 0.03), V(-0.22, 0.43, s * 0.105), V(-0.46, 0.55, s * 0.10), V(-0.84, 0.60, s * 0.075)]), 40, 0.014, 8), MAT.dark));
  }
  rangka.add(rod(V(-0.125, 0.305, -0.095), V(-0.125, 0.305, 0.095), 0.016, MAT.dark));
  P['rangka'] = rangka;

  // ---------- Benda di bawah jok ----------
  P['bagasi'] = box(0.30, 0.115, 0.21, new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: .9 }), -0.28, 0.565, 0);
  P['tangki'] = box(0.19, 0.085, 0.19, new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: .7 }), -0.585, 0.60, 0);
  P['aki'] = box(0.065, 0.095, 0.105, new THREE.MeshStandardMaterial({ color: '#202225', roughness: .6 }), 0.02, 0.47, 0);
  P['ecu'] = box(0.075, 0.025, 0.055, new THREE.MeshStandardMaterial({ color: '#4a4f57', roughness: .5 }), -0.05, 0.545, 0.055);

  // ---------- Standar ----------
  const st = new THREE.Group();
  for (const s of [-1, 1]) st.add(rod(V(-0.13, 0.285, s * 0.085), V(-0.315, 0.155, s * 0.105), 0.011, MAT.black));
  st.add(rod(V(-0.315, 0.155, -0.105), V(-0.315, 0.155, 0.105), 0.009, MAT.black));
  P['standar-tengah'] = st;
  P['standar-samping'] = rod(V(-0.05, 0.225, 0.115), V(-0.30, 0.185, 0.16), 0.009, MAT.black);

  for (const [id, o] of Object.entries(P)) tag(o, id);
  return P;
}
