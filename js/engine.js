// Unit mesin + CVT (swing arm) dan garpu depan Mio J.
import * as THREE from 'three';
import { MAT, extrude, smooth, box, cyl, rod, placeRod, springGeo, tag } from './parts.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// Titik geometri (koordinat rangka/chassis, posisi standar)
export const GEO = {
  pivot: V(-0.125, 0.305),         // pivot mesin ke rangka
  rearAxle: V(-0.63, 0.2498),      // as roda belakang (ban 80/90-14)
  frontAxle: V(0.630, 0.2408),     // as roda depan (ban 70/90-14)
  crown: V(0.415, 0.662),          // segitiga bawah garpu (sumbu kemudi)
  shockTop: V(-0.545, 0.575, 0.10),// dudukan atas shock belakang (rangka)
  shockBot: V(-0.60, 0.295, 0.10), // dudukan bawah shock (bak CVT)
  sliderLen: 0.30,
};
GEO.forkDir = new THREE.Vector3().subVectors(GEO.frontAxle, GEO.crown).normalize(); // ke bawah
GEO.forkLen = GEO.crown.distanceTo(GEO.frontAxle); // ≈0,474 m (bawah garpu) + 0,30 m slider ≈ 0,86 m roda-ke-stang
GEO.shockL0 = GEO.shockTop.distanceTo(GEO.shockBot);

// ---------------- Unit mesin / swing arm ----------------
export function makeEngineUnit() {
  const P = {};
  // Blok mesin + silinder mendatar
  const mesin = new THREE.Group();
  mesin.add(extrude(smooth([[-0.08, 0.335], [-0.13, 0.365], [-0.27, 0.335], [-0.31, 0.245], [-0.25, 0.165], [-0.13, 0.155], [-0.07, 0.215]], 50), 0.17, { bevel: 0.02, mat: MAT.engine, zc: -0.01 }));
  const cylinder = new THREE.Group();
  for (let i = 0; i < 7; i++) { // sirip pendingin
    const fin = box(0.008, 0.12, 0.13, MAT.engine, -0.06 + i * 0.017, 0, 0);
    cylinder.add(fin);
  }
  cylinder.add(box(0.13, 0.085, 0.09, MAT.engine, -0.01, 0, 0));
  cylinder.add(box(0.05, 0.10, 0.11, MAT.alu, 0.075, 0, 0)); // kepala silinder
  cylinder.position.set(-0.005, 0.235, -0.01); cylinder.rotation.z = 0.12;
  mesin.add(cylinder);
  P['mesin'] = mesin;

  // Cover kipas (shroud) sisi kanan
  const kipas = new THREE.Group();
  const sh = cyl(0.082, 0.082, 0.05, MAT.black, 32); sh.rotation.x = Math.PI / 2; sh.position.set(-0.20, 0.25, -0.115);
  kipas.add(sh);
  for (let i = 0; i < 6; i++) kipas.add(box(0.11, 0.006, 0.004, MAT.dark, -0.20, 0.218 + i * 0.012, -0.142));
  kipas.add(box(0.16, 0.10, 0.04, MAT.black, -0.07, 0.235, -0.09));
  P['kipas'] = kipas;

  // Throttle body + injektor
  const inj = new THREE.Group();
  const tb = cyl(0.022, 0.022, 0.06, MAT.alu, 16); tb.rotation.z = Math.PI / 2.4; tb.position.set(-0.04, 0.325, 0.03);
  inj.add(tb, box(0.03, 0.03, 0.03, MAT.black, -0.005, 0.35, 0.03));
  inj.add(rod(V(-0.06, 0.335, 0.04), V(-0.29, 0.385, 0.09), 0.018, MAT.rubber));
  P['injeksi'] = inj;

  // Bak CVT (sisi kiri), dari crank sampai as roda belakang
  P['cvt'] = extrude(smooth([[-0.135, 0.305], [-0.205, 0.33], [-0.45, 0.31], [-0.615, 0.295], [-0.69, 0.245], [-0.66, 0.175], [-0.575, 0.16], [-0.30, 0.155], [-0.155, 0.175], [-0.105, 0.235]], 80), 0.065, { bevel: 0.022, zc: 0.105, mat: MAT.alu });
  // logo / garis CVT
  P['cvt'].add(box(0.30, 0.008, 0.004, MAT.engine, -0.40, 0.235, 0.142));

  // Box filter udara di atas CVT
  P['filter-udara'] = extrude(smooth([[-0.225, 0.335], [-0.235, 0.415], [-0.335, 0.435], [-0.47, 0.405], [-0.48, 0.335]], 40), 0.08, { bevel: 0.015, zc: 0.09, mat: MAT.black });

  // Kick starter
  const kick = new THREE.Group();
  kick.add(rod(V(-0.355, 0.225, 0.145), V(-0.465, 0.275, 0.16), 0.008, MAT.black));
  kick.add(box(0.05, 0.015, 0.03, MAT.rubber, -0.47, 0.277, 0.16));
  P['kick-starter'] = kick;

  // Knalpot (sisi kanan)
  const kn = new THREE.Group();
  const header = new THREE.CatmullRomCurve3([V(0.07, 0.205, -0.01), V(0.055, 0.165, -0.04), V(-0.10, 0.155, -0.10), V(-0.30, 0.175, -0.12), V(-0.42, 0.215, -0.125)]);
  kn.add(new THREE.Mesh(new THREE.TubeGeometry(header, 40, 0.016, 10), MAT.metal));
  const silencer = cyl(0.055, 0.045, 0.40, MAT.black, 24); silencer.rotation.z = Math.PI / 2 - 0.12; silencer.position.set(-0.60, 0.235, -0.135);
  const guard = cyl(0.058, 0.058, 0.26, MAT.chrome, 24, ); guard.scale.set(1, 1, 1); guard.rotation.z = Math.PI / 2 - 0.12; guard.position.set(-0.60, 0.242, -0.15);
  guard.geometry = new THREE.CylinderGeometry(0.06, 0.06, 0.26, 24, 1, true, Math.PI * 0.9, Math.PI * 0.7);
  guard.material = MAT.chrome;
  const tip = cyl(0.02, 0.02, 0.04, MAT.chrome, 16); tip.rotation.z = Math.PI / 2 - 0.12; tip.position.set(-0.815, 0.265, -0.135);
  kn.add(silencer, guard, tip);
  P['knalpot'] = kn;

  for (const [id, o] of Object.entries(P)) tag(o, id);
  return P;
}

// Shock belakang: dibuat ulang posisinya setiap update (top & bottom di koordinat chassis)
export function makeRearShock() {
  const g = new THREE.Group();
  const body = cyl(0.019, 0.019, 1, MAT.black, 16);
  const rodM = cyl(0.007, 0.007, 1, MAT.chrome, 10);
  const spring = new THREE.Mesh(springGeo(0.026, 9, 0.0045), MAT.spring);
  const springHolder = new THREE.Group(); springHolder.add(spring);
  const eyeT = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.006, 8, 16), MAT.black);
  const eyeB = eyeT.clone();
  g.add(body, rodM, springHolder, eyeT, eyeB);
  g.update = (top, bot) => {
    const len = top.distanceTo(bot);
    const dir = new THREE.Vector3().subVectors(bot, top).normalize();
    const mid = (a, b, t) => new THREE.Vector3().lerpVectors(a, b, t);
    placeRod(body, top, mid(top, bot, 0.55));
    placeRod(rodM, mid(top, bot, 0.5), bot);
    placeRod(springHolder, mid(top, bot, 0.08), mid(top, bot, 0.88));
    springHolder.scale.set(1, top.distanceTo(bot) * 0.8, 1);
    eyeT.position.copy(top); eyeB.position.copy(bot);
    g.userData.len = len; g.userData.dir = dir;
  };
  return tag(g, 'shock-belakang');
}

// ---------------- Garpu depan ----------------
export function makeFork() {
  const upper = new THREE.Group();    // ikut rangka: tabung dalam (chrome) + segitiga
  const lower = new THREE.Group();    // bergerak naik saat diturunkan: slider + roda + spakbor
  const inner = [];
  for (const s of [-1, 1]) {
    const t = cyl(0.0135, 0.0135, 1, MAT.chrome, 16);
    upper.add(t); inner.push({ mesh: t, z: s * 0.075 });
  }
  // segitiga (bracket) bawah
  const crown = box(0.05, 0.03, 0.19, MAT.dark, GEO.crown.x, GEO.crown.y, 0);
  crown.rotation.z = Math.atan2(GEO.forkDir.x, -GEO.forkDir.y);
  upper.add(crown);
  upper.updateInner = (drop) => {
    for (const { mesh, z } of inner) {
      const a = GEO.crown.clone().setZ(z);
      const b = GEO.crown.clone().addScaledVector(GEO.forkDir, GEO.forkLen - drop - GEO.sliderLen + 0.03).setZ(z);
      placeRod(mesh, a, b);
    }
  };

  // Slider (tabung luar) di ruang roda depan: titik as = (0,0)
  const up = GEO.forkDir.clone().negate();
  for (const s of [-1, 1]) {
    const sl = cyl(0.019, 0.017, GEO.sliderLen, MAT.alu, 16);
    sl.position.copy(up.clone().multiplyScalar(GEO.sliderLen / 2)).setZ(s * 0.075);
    sl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    lower.add(tag(sl, 'shock-depan'));
  }
  upper.children.forEach(c => tag(c, 'shock-depan'));

  // Spakbor depan (busur di atas roda) — dipasang di slider
  const fender = new THREE.Group();
  const shape = new THREE.Shape();
  const R1 = 0.262, R2 = 0.272, a0 = 0.35, a1 = 2.55;
  shape.absarc(0, 0, R2, a0, a1, false);
  shape.absarc(0, 0, R1, a1, a0, true);
  const fg = new THREE.ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3, curveSegments: 40 });
  fg.translate(0, 0, -0.05);
  const fm = new THREE.Mesh(fg, MAT.paintF); fm.castShadow = true;
  fender.add(fm);
  fender.userData.innerR = R1;
  lower.add(tag(fender, 'spakbor-depan'));

  // Kaliper rem (kiri, di belakang slider)
  const cal = box(0.05, 0.075, 0.03, MAT.dark, -0.065, 0.07, 0.06);
  cal.rotation.z = 0.5;
  lower.add(tag(cal, 'kaliper'));

  return { upper, lower, fender };
}

// Hitung sudut swing arm (rad) supaya panjang shock = L. Bisection.
export function solveSwing(Lwant) {
  const P = GEO.pivot, B0 = GEO.shockBot, T = GEO.shockTop;
  const len = (th) => {
    const c = Math.cos(th), s = Math.sin(th);
    const dx = B0.x - P.x, dy = B0.y - P.y;
    const b = V(P.x + dx * c - dy * s, P.y + dx * s + dy * c, B0.z);
    return { L: b.distanceTo(T), b };
  };
  // Arah monoton: cari sisi mana yang memperpanjang shock, lalu bisection.
  let lo = -0.5, hi = 0.5;
  const inc = len(hi).L > len(lo).L;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    const longer = len(m).L > Lwant;
    if (longer === inc) hi = m; else lo = m;
  }
  const th = (lo + hi) / 2;
  return { theta: th, bottom: len(th).b };
}
