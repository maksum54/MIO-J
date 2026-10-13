// Rakitan Mio J: chassis + swing arm (mesin/CVT/roda belakang) + garpu depan + roda depan.
// Hitung stance (pitch & tinggi) dari panjang shock, penurunan garpu, dan ukuran ban.
import * as THREE from 'three';
import { MAT, tag } from './parts.js';
import { makeBody } from './body.js';
import { makeEngineUnit, makeRearShock, makeFork, solveSwing, GEO } from './engine.js';
import { makeWheel } from './wheels.js';
import { makeLights } from './lights.js';
import { SPEC } from './data.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// Titik referensi (koordinat chassis) untuk perhitungan dampak modifikasi
const SEAT_PT = V(-0.30, 0.775);
// Sisi bawah body / spakbor di atas roda belakang
const REAR_ARCH = [V(-0.42, 0.53), V(-0.52, 0.555), V(-0.62, 0.575), V(-0.72, 0.59), V(-0.80, 0.60), V(-0.88, 0.555), V(-0.93, 0.50)];

export function makeBike(scene) {
  const root = new THREE.Group();      // posisi di dunia
  const chassis = new THREE.Group();   // body + rangka (pitch & tinggi)
  root.add(chassis);

  const body = makeBody();
  const eng = makeEngineUnit();
  const swing = new THREE.Group();     // unit mesin berayun di pivot
  const swingInner = new THREE.Group();
  swing.position.copy(GEO.pivot);
  swingInner.position.copy(GEO.pivot).negate();
  swing.add(swingInner);
  chassis.add(swing);

  for (const o of Object.values(body)) chassis.add(o);
  for (const o of Object.values(eng)) swingInner.add(o);

  // Roda belakang ikut swing arm
  const rearWheel = makeWheel('rear');
  rearWheel.position.copy(GEO.rearAxle);
  swingInner.add(rearWheel);

  // Shock belakang (diposisikan ulang tiap update)
  const shock = makeRearShock();
  chassis.add(shock);

  // Garpu depan
  const fork = makeFork();
  chassis.add(fork.upper);
  const frontWheel = makeWheel('front');
  fork.lower.add(frontWheel);
  chassis.add(fork.lower);

  // Lampu
  const lights = makeLights(scene);
  for (const g of Object.values(lights.groups)) chassis.add(g);
  chassis.add(lights.spot, lights.spot.target, lights.rearGlow);

  // ---- daftar objek per part (untuk klik & exploded view) ----
  const objects = {};
  const reg = (id, o) => { (objects[id] ||= []).push(o); };
  for (const [id, o] of Object.entries(body)) reg(id, o);
  for (const [id, o] of Object.entries(eng)) reg(id, o);
  reg('shock-belakang', shock);
  reg('roda-belakang', rearWheel); reg('roda-depan', frontWheel);
  reg('shock-depan', fork.upper); reg('shock-depan', fork.lower);
  reg('lampu-depan', lights.groups.depan); reg('drl', lights.groups.drl);
  reg('lampu-belakang', lights.groups.belakang); reg('sein-depan', lights.groups.sein);

  // Arah exploded (koordinat parent masing-masing)
  const EXPLODE = {
    'body-kiri': [0, 0.08, 0.45], 'body-kanan': [0, 0.08, -0.45], 'body-depan': [0.40, 0.05, 0],
    'tebeng-dalam': [0.18, 0.20, 0], 'batok': [0.12, 0.38, 0], 'speedometer': [0.05, 0.55, 0],
    'stang': [0.03, 0.22, 0], 'spion': [0.02, 0.30, 0], 'jok': [0, 0.38, 0], 'behel': [-0.10, 0.40, 0],
    'cover-tengah': [0, 0.25, 0.25], 'cover-belakang': [-0.30, 0.25, 0], 'cover-bawah': [0, -0.08, 0.35],
    'dek': [0, 0.12, 0.30], 'spakbor-belakang': [-0.35, -0.05, 0], 'bagasi': [0, 0.26, 0.22],
    'tangki': [-0.08, 0.22, -0.26], 'aki': [0.05, 0.22, -0.30], 'ecu': [0, 0.30, 0.35],
    'rangka': [0, 0, 0], 'standar-tengah': [0, -0.10, 0.30], 'standar-samping': [0, -0.05, 0.35],
    'mesin': [0, -0.05, -0.20], 'kipas': [0, 0, -0.38], 'injeksi': [0.05, 0.18, 0.10],
    'cvt': [0, 0, 0.40], 'filter-udara': [0, 0.20, 0.38], 'kick-starter': [0, -0.05, 0.50],
    'knalpot': [-0.15, -0.05, -0.50], 'shock-belakang': [0, 0.12, 0.28],
    'roda-belakang': [-0.40, 0, 0], 'roda-depan': [0.30, 0, 0],
    'lampu-depan': [0.30, 0.42, 0], 'drl': [0.55, 0.15, 0], 'lampu-belakang': [-0.32, 0.18, 0], 'sein-depan': [0.30, 0.08, 0],
  };
  const exploders = [];
  for (const [id, list] of Object.entries(objects)) {
    const d = EXPLODE[id]; if (!d) continue;
    for (const o of list) {
      if (o === fork.upper || o === fork.lower || o === shock) continue; // diatur oleh stance
      exploders.push({ o, base: o.position.clone(), dir: V(...d) });
    }
  }
  let explodeT = 0, explodeTarget = 0;

  // Titik terendah nyata (vertex) dari part bawah: cover bawah, standar, knalpot, CVT
  const UNDER_PARTS = ['cover-bawah', 'standar-tengah', 'knalpot', 'cvt'];
  function lowestY(roots) {
    let m = Infinity;
    for (const r of roots) { r.updateMatrixWorld(true); r.traverse(o => {
      if (!o.isMesh) return;
      const p = o.geometry.attributes.position, e = o.matrixWorld.elements;
      for (let i = 0; i < p.count; i++) {
        const y = e[1] * p.getX(i) + e[5] * p.getY(i) + e[9] * p.getZ(i) + e[13];
        if (y < m) m = y;
      }
    }); }
    return m;
  }

  // ---- stance ----
  const cfg = { banDepan: '70/90-14', banBelakang: '80/90-14', shock: SPEC.shockBelakang, forkDrop: 0 };
  let ref = null; // nilai standar untuk delta
  const info = {};

  function update(patch = {}) {
    Object.assign(cfg, patch);
    const df = frontWheel.setTire(cfg.banDepan);
    const dr = rearWheel.setTire(cfg.banBelakang);

    // Rear: shock length -> swing angle
    const Lwant = GEO.shockL0 - (SPEC.shockBelakang - cfg.shock) / 1000;
    const sol = solveSwing(Lwant);
    swing.rotation.z = sol.theta;
    shock.update(GEO.shockTop, sol.bottom);
    const c = Math.cos(sol.theta), s = Math.sin(sol.theta);
    const rx = GEO.rearAxle.x - GEO.pivot.x, ry = GEO.rearAxle.y - GEO.pivot.y;
    const Ar = V(GEO.pivot.x + rx * c - ry * s, GEO.pivot.y + rx * s + ry * c);

    // Front: fork drop
    const Af = GEO.crown.clone().addScaledVector(GEO.forkDir, GEO.forkLen - cfg.forkDrop / 1000);
    fork.lower.position.copy(Af);
    fork.upper.updateInner(cfg.forkDrop / 1000);

    // Pitch & tinggi supaya kedua ban menyentuh tanah
    const dx = Af.x - Ar.x, dy = Af.y - Ar.y, k = df.outerR - dr.outerR;
    const A = Math.hypot(dx, dy), alpha = Math.atan2(dy, dx);
    const phi = Math.asin(THREE.MathUtils.clamp(k / A, -1, 1)) - alpha;
    const h = df.outerR - (Af.x * Math.sin(phi) + Af.y * Math.cos(phi));
    chassis.rotation.z = phi;
    chassis.position.set(0, h, 0);
    const midX = ((Af.x + Ar.x) / 2) * Math.cos(phi) - ((Af.y + Ar.y) / 2) * Math.sin(phi);
    chassis.position.x = -midX;

    // Info: tinggi jok, ground clearance, jarak ban
    chassis.updateMatrixWorld(true);
    const wy = (p) => p.clone().applyMatrix4(chassis.matrix).y;
    const seatY = wy(SEAT_PT), underY = lowestY(UNDER_PARTS.flatMap(id => objects[id] || []));
    const rearGap = Math.min(...REAR_ARCH.map(p => p.distanceTo(Ar))) - dr.outerR;
    const frontGap = fork.fender.userData.innerR - df.outerR;
    if (!ref) ref = { seatY, underY, rearGap, frontGap, phi };
    Object.assign(info, {
      tinggiJok: Math.round(SPEC.tinggiJok + (seatY - ref.seatY) * 1000),
      groundClearance: Math.round(SPEC.groundClearance + (underY - ref.underY) * 1000),
      jarakBanBelakang: Math.round(rearGap * 1000),
      jarakBanDepan: Math.round(frontGap * 1000),
      nungging: +(THREE.MathUtils.radToDeg(phi - ref.phi)).toFixed(1),
      diaDepan: df.diameter, diaBelakang: dr.diameter,
      lebarDepan: df.w, lebarBelakang: dr.w,
    });
    // posisi dasar exploded perlu disegarkan untuk objek yang bergeser
    return info;
  }

  function setExplode(on) { explodeTarget = on ? 1 : 0; }
  function tick(dt, spinWheels = false) {
    if (explodeT !== explodeTarget) {
      explodeT += Math.sign(explodeTarget - explodeT) * Math.min(Math.abs(explodeTarget - explodeT), dt * 1.8);
      const e = explodeT * explodeT * (3 - 2 * explodeT);
      for (const x of exploders) x.o.position.copy(x.base).addScaledVector(x.dir, e);
      shock.visible = fork.upper.visible = true;
    }
    if (spinWheels) { frontWheel.spin.rotation.z -= dt * 2; rearWheel.spin.rotation.z -= dt * 2; }
  }

  // Panel yang bisa diberi sticker
  const panels = { 'body-kiri': body['body-kiri'], 'body-kanan': body['body-kanan'], 'body-depan': body['body-depan'], 'tebeng-dalam': body['tebeng-dalam'] };

  return { root, chassis, objects, update, info, setExplode, tick, lights, panels, get exploding() { return explodeT > 0.001; } };
}
