// Panel body & rangka Mio J 2014 (koordinat: x = depan, y = atas, z = kiri; meter; tanah y=0).
// Proporsi dari spesifikasi: P 1850, L 700, T 1050, wheelbase 1260, tinggi jok 745, ground clearance 130.
import * as THREE from 'three';
import { MAT, extrude, smooth, box, rod, tag } from './parts.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export function makeBody() {
  const P = {}; // partId -> Object3D

  // ---------- Tebeng depan (body depan, dicat) ----------
  const frontProfile = smooth([
    [0.30, 0.90], [0.40, 0.925], [0.50, 0.84], [0.56, 0.70], [0.585, 0.60], [0.56, 0.555],
    [0.47, 0.54], [0.40, 0.50], [0.36, 0.44], [0.33, 0.42], [0.325, 0.70],
  ], 80);
  P['body-depan'] = extrude(frontProfile, 0.40, {
    bevel: 0.03, mat: MAT.paintF,
    taper: (x, y) => 1 - 0.42 * clamp((x - 0.34) / 0.26, 0, 1) - 0.12 * clamp((y - 0.80) / 0.12, 0, 1),
  });

  // ---------- Tebeng dalam (leg shield, gelap) ----------
  P['tebeng-dalam'] = extrude(smooth([
    [0.29, 0.88], [0.335, 0.885], [0.345, 0.70], [0.355, 0.47], [0.33, 0.40], [0.29, 0.40], [0.30, 0.70],
  ], 50), 0.38, { bevel: 0.015, mat: MAT.dark, taper: (x, y) => 1 - 0.1 * clamp((y - 0.75) / 0.13, 0, 1) });

  // ---------- Dek / pijakan kaki ----------
  P['dek'] = extrude([[0.31, 0.375], [0.31, 0.34], [-0.03, 0.34], [-0.03, 0.375]], 0.31, { bevel: 0.01, mat: MAT.black });
  // tekstur karet dek (alur)
  for (let i = 0; i < 9; i++) P['dek'].add(box(0.012, 0.004, 0.27, MAT.dark, 0.27 - i * 0.034, 0.377, 0));

  // ---------- Cover bawah dek ----------
  P['cover-bawah'] = extrude(smooth([
    [0.36, 0.42], [0.36, 0.30], [0.30, 0.19], [0.10, 0.145], [-0.06, 0.15], [-0.10, 0.22], [-0.04, 0.34], [0.30, 0.34],
  ], 50), 0.24, { bevel: 0.015, mat: MAT.black, taper: (x, y) => 1 - 0.25 * clamp((0.25 - y) / 0.1, 0, 1) });

  // ---------- Cover tengah (depan jok) ----------
  P['cover-tengah'] = extrude(smooth([
    [0.065, 0.38], [0.085, 0.60], [0.045, 0.70], [-0.02, 0.705], [-0.03, 0.40],
  ], 40), 0.25, { bevel: 0.02, mat: MAT.dark });

  // ---------- Body samping kiri & kanan (dicat) ----------
  const sideProfile = smooth([
    [0.03, 0.40], [0.06, 0.56], [0.03, 0.70], [-0.12, 0.725], [-0.45, 0.735], [-0.78, 0.745],
    [-0.92, 0.725], [-0.955, 0.68], [-0.90, 0.635], [-0.78, 0.60], [-0.60, 0.585], [-0.42, 0.53],
    [-0.26, 0.45], [-0.12, 0.40],
  ], 90);
  const sideTaper = (x, y) => 1 - 0.38 * clamp((-x - 0.35) / 0.62, 0, 1) - 0.18 * clamp((0.06 - x) * 0 + (y - 0.70) / 0.05, 0, 1) * 0.5;
  P['body-kiri'] = extrude(sideProfile, 0.155, { bevel: 0.03, zc: 0.0775, mat: MAT.paintL, taper: sideTaper });
  P['body-kanan'] = extrude(sideProfile, 0.155, { bevel: 0.03, zc: -0.0775, mat: MAT.paintR, taper: sideTaper });

  // ---------- Cover belakang (buntut) ----------
  P['cover-belakang'] = extrude(smooth([
    [-0.84, 0.755], [-0.93, 0.74], [-0.975, 0.70], [-0.95, 0.655], [-0.86, 0.65],
  ], 40), 0.20, { bevel: 0.02, mat: MAT.dark });

  // ---------- Jok ----------
  P['jok'] = extrude(smooth([
    [0.02, 0.715], [-0.01, 0.765], [-0.18, 0.785], [-0.42, 0.775], [-0.56, 0.795],
    [-0.76, 0.79], [-0.80, 0.76], [-0.70, 0.735], [-0.30, 0.725],
  ], 70), 0.29, {
    bevel: 0.035, mat: MAT.seat,
    taper: (x) => 0.78 + 0.22 * clamp((-x) / 0.3, 0, 1) - 0.12 * clamp((-x - 0.62) / 0.18, 0, 1),
  });
  // jahitan jok
  const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.004, 0.004), MAT.dark);
  stitch.position.set(-0.40, 0.785, 0); P['jok'].add(stitch);

  // ---------- Behel ----------
  const behel = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    V(-0.62, 0.755, 0.135), V(-0.80, 0.765, 0.14), V(-0.90, 0.77, 0.10), V(-0.93, 0.775, 0),
    V(-0.90, 0.77, -0.10), V(-0.80, 0.765, -0.14), V(-0.62, 0.755, -0.135),
  ]);
  behel.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.012, 10), MAT.black));
  P['behel'] = behel;

  // ---------- Batok (cover stang + rumah lampu) ----------
  const batok = new THREE.Group();
  batok.add(extrude(smooth([
    [0.235, 0.935], [0.28, 0.995], [0.40, 1.005], [0.465, 0.975], [0.47, 0.90], [0.42, 0.875], [0.26, 0.885],
  ], 60), 0.30, { bevel: 0.025, mat: MAT.paintF, taper: (x) => 1 - 0.35 * clamp((x - 0.30) / 0.17, 0, 1) }));
  // bagian belakang batok (hitam)
  batok.add(extrude(smooth([[0.225, 0.93], [0.27, 0.99], [0.31, 0.985], [0.29, 0.89], [0.245, 0.885]], 30), 0.27, { bevel: 0.015, mat: MAT.black }));
  P['batok'] = batok;

  // ---------- Speedometer ----------
  const speedo = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.055, 40), new THREE.MeshStandardMaterial({ color: '#0c0d10', roughness: .3 }));
  face.position.set(0.272, 0.985, 0); face.rotation.set(0, -Math.PI / 2, 0); face.rotateX(-0.9);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.04, 0.002), new THREE.MeshBasicMaterial({ color: '#ff5a1f' }));
  needle.position.set(0, 0.012, 0.002); face.add(needle);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.004, 8, 40), MAT.chrome); face.add(ring);
  speedo.add(face);
  P['speedometer'] = speedo;

  // ---------- Stang, handgrip, handle rem ----------
  const stang = new THREE.Group();
  stang.add(rod(V(0.325, 0.975, -0.33), V(0.325, 0.975, 0.33), 0.011, MAT.metal));
  for (const s of [-1, 1]) {
    stang.add(rod(V(0.325, 0.975, s * 0.25), V(0.325, 0.975, s * 0.36), 0.017, MAT.rubber));     // grip
    stang.add(rod(V(0.345, 0.985, s * 0.18), V(0.38, 0.982, s * 0.33), 0.006, MAT.alu));         // handle rem
    stang.add(box(0.05, 0.035, 0.05, MAT.black, 0.325, 0.975, s * 0.205));                         // saklar
  }
  P['stang'] = stang;

  // ---------- Spion ----------
  const spion = new THREE.Group();
  for (const s of [-1, 1]) {
    spion.add(rod(V(0.30, 0.99, s * 0.22), V(0.28, 1.03, s * 0.28), 0.006, MAT.black));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 12), MAT.black);
    head.scale.set(0.35, 0.55, 1); head.position.set(0.28, 1.045, s * 0.31); spion.add(head);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), MAT.mirror);
    glass.scale.set(1, 0.55, 1); glass.position.set(0.258, 1.045, s * 0.31); glass.rotation.y = -Math.PI / 2;
    spion.add(glass);
  }
  P['spion'] = spion;

  // ---------- Spakbor belakang + dudukan plat ----------
  const sbb = new THREE.Group();
  sbb.add(extrude(smooth([[-0.78, 0.60], [-0.90, 0.58], [-0.965, 0.50], [-0.955, 0.40], [-0.935, 0.40], [-0.93, 0.50], [-0.88, 0.555], [-0.77, 0.575]], 40), 0.14, { bevel: 0.008, mat: MAT.black }));
  const plate = box(0.004, 0.10, 0.20, new THREE.MeshStandardMaterial({ color: '#111', roughness: .4 }), -0.963, 0.445, 0);
  sbb.add(plate);
  sbb.add(box(0.005, 0.10, 0.2, new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: .5 }), -0.967, 0.445, 0).translateX(-0.0)); // plat (polos)
  P['spakbor-belakang'] = sbb;

  // ---------- Rangka ----------
  const rangka = new THREE.Group();
  rangka.add(rod(V(0.37, 0.86), V(0.43, 0.72), 0.03, MAT.dark));       // head pipe
  const spine = new THREE.CatmullRomCurve3([V(0.40, 0.78), V(0.33, 0.55), V(0.30, 0.31), V(0.15, 0.27), V(-0.02, 0.28), V(-0.10, 0.34)]);
  rangka.add(new THREE.Mesh(new THREE.TubeGeometry(spine, 40, 0.022, 10), MAT.dark));
  for (const s of [-1, 1]) {
    const rail = new THREE.CatmullRomCurve3([V(-0.10, 0.34, s * 0.03), V(-0.20, 0.47, s * 0.10), V(-0.45, 0.60, s * 0.10), V(-0.85, 0.64, s * 0.08)]);
    rangka.add(new THREE.Mesh(new THREE.TubeGeometry(rail, 40, 0.014, 8), MAT.dark));
  }
  rangka.add(rod(V(-0.12, 0.33, -0.10), V(-0.12, 0.33, 0.10), 0.016, MAT.dark)); // dudukan pivot mesin
  P['rangka'] = rangka;

  // ---------- Tangki, bagasi, aki, ECU (tersembunyi di bawah jok) ----------
  P['bagasi'] = box(0.30, 0.13, 0.22, new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: .9 }), -0.30, 0.64, 0);
  P['tangki'] = box(0.20, 0.09, 0.20, new THREE.MeshStandardMaterial({ color: '#3a3f47', roughness: .7 }), -0.62, 0.66, 0);
  P['aki'] = box(0.07, 0.10, 0.11, new THREE.MeshStandardMaterial({ color: '#202225', roughness: .6 }), 0.0, 0.55, 0);
  P['ecu'] = box(0.08, 0.025, 0.06, new THREE.MeshStandardMaterial({ color: '#4a4f57', roughness: .5 }), -0.06, 0.63, 0.06);

  // ---------- Standar tengah & samping ----------
  const st = new THREE.Group();
  for (const s of [-1, 1]) st.add(rod(V(-0.12, 0.30, s * 0.09), V(-0.30, 0.16, s * 0.11), 0.011, MAT.black));
  st.add(rod(V(-0.30, 0.16, -0.11), V(-0.30, 0.16, 0.11), 0.009, MAT.black));
  P['standar-tengah'] = st;
  P['standar-samping'] = rod(V(-0.04, 0.24, 0.12), V(-0.30, 0.20, 0.17), 0.009, MAT.black);

  for (const [id, o] of Object.entries(P)) tag(o, id);
  return P;
}
