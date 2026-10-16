// Panel body & rangka Mio J 2014 (x = depan, y = atas dari tanah, z = kiri; meter).
// Proporsi acuan: P 1850 · L 700 · T 1050 · wheelbase 1260 · tinggi jok 745
//   ground clearance 130 · dek pijakan ±250 · ban depan Ø482 · ban belakang Ø500 · garpu ±26°
// Panel dibuat sebagai permukaan loft (penampang superelips disusun sepanjang sumbu),
// supaya lengkungannya halus seperti panel plastik asli, bukan lempengan ekstrusi.
import * as THREE from 'three';
import { MAT, box, rod, tag, skin, spline, stations, seSection, endRound, mesh, spow } from './parts.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// Loft sepanjang sumbu x. sec(x) -> { top, bot, yc?, w, zc?, eu?, evT?, evB? }
// side: 1 = setengah kiri (z ≥ 0), -1 = setengah kanan, 0 = utuh.
export function loftX({ x0, x1, n = 64, ring = 56, sec, side = 0, deform = null }) {
  const [a0, a1] = side ? [-PI / 2, PI / 2] : [0, 2 * PI];
  const rings = stations(n).map(t => {
    const x = x0 + (x1 - x0) * t, S = sec(x);
    const yc = S.yc ?? (S.top + S.bot) / 2;
    const pts = seSection({ ru0: S.w, ru1: S.w, rv0: Math.max(yc - S.bot, 1e-4), rv1: Math.max(S.top - yc, 1e-4),
      eu: S.eu ?? 2.5, ev0: S.evB ?? 2.5, ev1: S.evT ?? 2.5, a0, a1, n: ring });
    return pts.map(([u, v]) => { const p = V(x, yc + v, (S.zc ?? 0) + (side < 0 ? -u : u)); return deform ? deform(p) : p; });
  });
  return skin(rings);
}

// Loft sepanjang sumbu y (untuk tebeng). sec(y) -> { xb, xf, xm, w, euF, euB, ez }. a0..a1 = rentang sudut.
export function loftY({ y0, y1, n = 64, ring = 64, sec, a0 = 0, a1 = 2 * PI }) {
  const rings = stations(n).map(t => {
    const y = y0 + (y1 - y0) * t, S = sec(y);
    const pts = seSection({ ru0: Math.max(S.xm - S.xb, 1e-4), ru1: Math.max(S.xf - S.xm, 1e-4), rv0: S.w, rv1: S.w,
      eu0: S.euB ?? 4, eu1: S.euF ?? 2, ev: S.ez ?? 2.5, a0, a1, n: ring });
    return pts.map(([u, v]) => V(S.xm + u, y, v));
  });
  return skin(rings);
}

// Faktor pembulatan kedua ujung rentang [a, b]
const ends = (x, a, b, ra, rb) => endRound(Math.abs(x - a), ra) * endRound(Math.abs(x - b), rb);

// ---------- Batok (dipakai juga oleh lampu depan) ----------
export const BATOK = {
  x0: 0.205, x1: 0.468,
  top: spline([[0.205, 0.868], [0.24, 0.913], [0.30, 0.944], [0.38, 0.951], [0.44, 0.941], [0.468, 0.926]]),
  bot: spline([[0.205, 0.850], [0.26, 0.836], [0.35, 0.840], [0.42, 0.850], [0.468, 0.862]]),
  w: spline([[0.205, 0.112], [0.25, 0.140], [0.33, 0.142], [0.42, 0.126], [0.468, 0.108]]),
};
export function batokSec(x, k = 1) {
  const f = ends(x, BATOK.x0, BATOK.x1, 0.035, 0.010);
  const top = BATOK.top(x), bot = BATOK.bot(x), yc = bot + 0.42 * (top - bot);
  const g = Math.sqrt(f);
  return { top: yc + (top - yc) * g * k, bot: yc - (yc - bot) * g * k, yc, w: BATOK.w(x) * f * k, eu: 3.6, evT: 1.7, evB: 3.4 };
}
// Hidung batok runcing (V dilihat dari atas) seperti batok Mio J asli: bagian tengah depan ditarik maju & turun
export function batokDeform(p) {
  const t = Math.min(1, Math.max(0, (p.x - 0.30) / 0.17)), q = Math.min(1, Math.abs(p.z) / 0.13);
  const k = t * t * (1 - q ** 1.4);
  p.x += 0.055 * k; p.y -= 0.018 * k;
  return p;
}

// ---------- Tebeng depan (apron) ----------
// Penampang mendatar: belakang hampir rata (tebeng dalam), depan cembung meruncing (hidung).
export const AP = {
  y0: 0.258, y1: 0.885,
  xb: spline([[0.258, 0.268], [0.30, 0.252], [0.55, 0.243], [0.72, 0.250], [0.82, 0.272], [0.885, 0.305]]),
  xf: spline([[0.258, 0.318], [0.33, 0.352], [0.42, 0.405], [0.50, 0.458], [0.58, 0.490], [0.68, 0.500], [0.76, 0.482], [0.83, 0.432], [0.885, 0.360]]),
  w: spline([[0.258, 0.175], [0.33, 0.215], [0.44, 0.205], [0.58, 0.168], [0.70, 0.130], [0.80, 0.098], [0.885, 0.072]]),
};
export function apronSec(y) {
  const f = ends(y, AP.y0, AP.y1, 0.025, 0.05);
  const xb = AP.xb(y), xf = AP.xf(y), xm = xb + 0.026;
  return { xb: xm - (xm - xb) * f, xm, xf: xm + (xf - xm) * f, w: AP.w(y) * f, euF: 1.3, euB: 3.5, ez: 3.0 };
}
// Titik permukaan tebeng depan pada ketinggian y dan sudut phi (0 = depan tengah, +π/2 = sisi kiri)
export function apronPoint(y, phi, off = 0) {
  const S = apronSec(y), c = Math.cos(phi), s = Math.sin(phi);
  const p = (d) => { const q = { xm: S.xm, xf: S.xf + d, xb: S.xb - d, w: S.w + d };
    return V(q.xm + (c >= 0 ? q.xf - q.xm : q.xm - q.xb) * spow(c, 2 / (c >= 0 ? S.euF : S.euB)), y, q.w * spow(s, 2 / S.ez)); };
  return p(off);
}

export function makeBody() {
  const P = {};

  // ---------- Tebeng depan (apron) + tebeng dalam ----------
  const wrap = 0.42; // seberapa jauh cat depan membungkus ke samping
  P['body-depan'] = mesh(loftY({ y0: AP.y0, y1: AP.y1, n: 72, ring: 72, sec: apronSec, a0: -(PI / 2 + wrap), a1: PI / 2 + wrap }), MAT.paintF);
  P['tebeng-dalam'] = mesh(loftY({ y0: AP.y0 + 0.004, y1: AP.y1 - 0.006, n: 56, ring: 40,
    sec: (y) => { const s = apronSec(y); return { ...s, xb: s.xb, xf: s.xm + (s.xf - s.xm) * 0.25, w: s.w * 0.985 }; },
    a0: PI / 2 + wrap - 0.05, a1: 3 * PI / 2 - wrap + 0.05 }), MAT.dark);
  // Lubang kunci kontak di tebeng dalam
  const key = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 24), MAT.chrome);
  key.rotation.z = PI / 2; key.position.set(0.250, 0.70, -0.07); P['tebeng-dalam'].add(key);
  // Gantungan barang
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 16, PI), MAT.black);
  hook.position.set(0.247, 0.60, 0); hook.rotation.set(0, PI / 2, PI); P['tebeng-dalam'].add(hook);

  // Emblem garpu tala Yamaha di tengah tebeng depan
  const emb = new THREE.Mesh(new THREE.CircleGeometry(0.022, 32), MAT.chrome);
  emb.position.copy(apronPoint(0.66, 0, 0.0015)); emb.rotation.y = PI / 2; emb.material = MAT.metal; P['body-depan'].add(emb);

  // ---------- Dek pijakan kaki (tinggi ±0.25) ----------
  P['dek'] = mesh(loftX({ x0: 0.272, x1: -0.065, n: 30, ring: 40, sec: (x) => {
    const f = ends(x, 0.272, -0.065, 0.02, 0.02);
    return { top: 0.264, bot: 0.212, w: 0.152 * Math.sqrt(f), eu: 6, evT: 7, evB: 3 };
  } }), MAT.black);
  for (let i = 0; i < 9; i++) { // karet alur pijakan
    const r = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.24, 4, 8), MAT.rubber);
    r.rotation.x = PI / 2; r.position.set(0.24 - i * 0.033, 0.265, 0); P['dek'].add(r);
  }

  // ---------- Cover bawah dek ----------
  const cbBot = spline([[0.30, 0.175], [0.25, 0.152], [0.10, 0.145], [-0.05, 0.158], [-0.11, 0.215]]);
  P['cover-bawah'] = mesh(loftX({ x0: 0.300, x1: -0.110, n: 40, ring: 40, sec: (x) => {
    const f = ends(x, 0.30, -0.11, 0.05, 0.05);
    return { top: 0.236, bot: cbBot(x), w: 0.128 * f, eu: 3.5, evT: 6, evB: 2.6 };
  } }), MAT.black);

  // ---------- Cover tengah (antara dek dan jok) ----------
  const ctF = spline([[0.262, 0.07], [0.32, 0.105], [0.45, 0.118], [0.58, 0.098], [0.665, 0.05]]);
  P['cover-tengah'] = mesh(loftY({ y0: 0.262, y1: 0.668, n: 40, ring: 40, sec: (y) => {
    const f = ends(y, 0.262, 0.668, 0.01, 0.03);
    return { xb: -0.02, xm: 0.0, xf: ctF(y) * f + 0.0 * (1 - f), w: (0.112 - 0.02 * Math.max(0, (y - 0.5) / 0.17)) * Math.sqrt(f), euF: 2.6, euB: 3, ez: 3.2 };
  } }), MAT.dark);

  // ---------- Body samping: menggembung di atas CVT, mengecil & naik ke ekor ----------
  const SB = {
    x0: 0.108, x1: -0.905,
    top: spline([[0.108, 0.600], [0.075, 0.652], [0.02, 0.668], [-0.30, 0.680], [-0.62, 0.672], [-0.80, 0.657], [-0.88, 0.636], [-0.905, 0.618]]),
    bot: spline([[0.108, 0.300], [0.03, 0.302], [-0.06, 0.335], [-0.14, 0.392], [-0.30, 0.452], [-0.52, 0.503], [-0.72, 0.543], [-0.85, 0.570], [-0.905, 0.588]]),
    w: spline([[0.108, 0.098], [0.04, 0.120], [-0.12, 0.146], [-0.36, 0.153], [-0.58, 0.138], [-0.78, 0.104], [-0.905, 0.072]]),
  };
  const sideSec = (x) => {
    const f = ends(x, SB.x0, SB.x1, 0.035, 0.025);
    const top = SB.top(x), bot = SB.bot(x), yc = bot + 0.66 * (top - bot);
    return { top, bot: yc - (yc - bot) * (0.6 + 0.4 * f), yc, w: SB.w(x) * f, eu: 2.4, evT: 5.5, evB: 2.0 };
  };
  P['body-kiri'] = mesh(loftX({ x0: SB.x0, x1: SB.x1, n: 90, ring: 48, sec: sideSec, side: 1 }), MAT.paintL);
  P['body-kanan'] = mesh(loftX({ x0: SB.x0, x1: SB.x1, n: 90, ring: 48, sec: sideSec, side: -1 }), MAT.paintR);
  // Garis lipatan (character line) samping: list tipis gelap mengikuti bentuk body
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const x = -0.08 - i * 0.026, S = sideSec(x);
      const y = S.bot + (S.yc - S.bot) * 0.25 + 0.004;
      // jarak z permukaan pada ketinggian y (penampang superelips bawah, eksponen 2)
      const v = (S.yc - y) / (S.yc - S.bot), z = S.w * Math.sqrt(Math.max(0, 1 - v * v)) ** (2 / S.eu);
      pts.push(V(x, y, s * (z + 0.0015)));
    }
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0028, 6), MAT.dark);
    P[s > 0 ? 'body-kiri' : 'body-kanan'].add(line);
  }

  // ---------- Cover belakang / ekor ----------
  const cbTop = spline([[-0.955, 0.615], [-0.90, 0.648], [-0.84, 0.662], [-0.79, 0.668]]);
  const cbB = spline([[-0.955, 0.588], [-0.90, 0.578], [-0.84, 0.585], [-0.79, 0.60]]);
  P['cover-belakang'] = mesh(loftX({ x0: -0.79, x1: -0.955, n: 30, ring: 40, sec: (x) => {
    const f = ends(x, -0.79, -0.955, 0.01, 0.02);
    return { top: cbTop(x), bot: cbB(x), w: (0.040 + 0.05 * (x + 0.955) / 0.165) * f, eu: 2.6, evT: 3, evB: 2.4 };
  } }), MAT.dark);

  // ---------- Jok: cekung untuk pengendara, naik di boncengan ----------
  const JT = spline([[0.092, 0.668], [0.05, 0.706], [-0.04, 0.731], [-0.20, 0.724], [-0.34, 0.704], [-0.46, 0.714], [-0.62, 0.743], [-0.74, 0.745], [-0.80, 0.722]]);
  const JW = spline([[0.092, 0.06], [0.02, 0.112], [-0.14, 0.145], [-0.46, 0.146], [-0.66, 0.130], [-0.80, 0.098]]);
  const seatSec = (x) => {
    const f = ends(x, 0.092, -0.805, 0.05, 0.04), bot = 0.664, yc = bot + 0.012;
    return { top: yc + (JT(x) - yc) * Math.sqrt(f), bot: yc - 0.012 * Math.sqrt(f), yc, w: JW(x) * f, eu: 3.4, evT: 2.8, evB: 3 };
  };
  P['jok'] = mesh(loftX({ x0: 0.092, x1: -0.805, n: 90, ring: 56, sec: seatSec }), MAT.seat);
  // Jahitan / list pinggir jok
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const x = 0.05 - i * 0.021, S = seatSec(x); pts.push(V(x, S.yc + 0.004, s * (S.w + 0.0008))); }
    P['jok'].add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.0022, 5), MAT.dark));
  }
  // Pangkal jok (alas plastik)
  P['jok'].add(mesh(loftX({ x0: 0.085, x1: -0.795, n: 40, ring: 32, sec: (x) => {
    const f = ends(x, 0.085, -0.795, 0.05, 0.04);
    return { top: 0.672, bot: 0.656, w: JW(x) * f * 0.98, eu: 3.4, evT: 3, evB: 3 };
  } }), MAT.black));

  // ---------- Behel ----------
  const behel = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    V(-0.58, 0.700, 0.132), V(-0.70, 0.716, 0.137), V(-0.82, 0.735, 0.128), V(-0.895, 0.746, 0.085), V(-0.918, 0.75, 0),
    V(-0.895, 0.746, -0.085), V(-0.82, 0.735, -0.128), V(-0.70, 0.716, -0.137), V(-0.58, 0.700, -0.132),
  ]);
  behel.add(mesh(new THREE.TubeGeometry(curve, 96, 0.0125, 12), MAT.black));
  for (const s of [-1, 1]) behel.add(rod(V(-0.60, 0.70, s * 0.132), V(-0.60, 0.665, s * 0.125), 0.011, MAT.black));
  P['behel'] = behel;

  // ---------- Batok (cover stang + rumah lampu) ----------
  const batok = new THREE.Group();
  batok.add(mesh(loftX({ x0: BATOK.x0, x1: BATOK.x1, n: 64, ring: 72, sec: (x) => batokSec(x), deform: batokDeform }), MAT.paintF));
  // Panel instrumen hitam di belakang atas
  batok.add(mesh(loftX({ x0: 0.200, x1: 0.300, n: 24, ring: 40, sec: (x) => {
    const s = batokSec(x), f = ends(x, 0.2, 0.3, 0.02, 0.03);
    return { ...s, top: s.top + 0.004 * f, bot: s.yc - 0.004, w: s.w * (0.93 + 0.08 * f) };
  } }), MAT.black));
  P['batok'] = batok;

  // ---------- Speedometer ----------
  const speedo = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.046, 48), new THREE.MeshStandardMaterial({ color: '#0b0c0f', roughness: .25 }));
  face.position.set(0.248, 0.917, 0); face.rotation.set(0, -PI / 2, 0); face.rotateX(-0.95);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.034, 0.002), new THREE.MeshBasicMaterial({ color: '#ff5a1f' }));
  needle.position.set(0, 0.01, 0.002); needle.rotation.z = 0.9; face.add(needle);
  for (let i = 0; i < 9; i++) { // garis skala
    const a = -2.2 + i * 0.55, t = new THREE.Mesh(new THREE.PlaneGeometry(0.0025, 0.008), new THREE.MeshBasicMaterial({ color: '#d8dde5' }));
    t.position.set(Math.sin(a) * 0.036, Math.cos(a) * 0.036, 0.001); t.rotation.z = -a; face.add(t);
  }
  face.add(new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.004, 8, 48), MAT.chrome));
  const glassD = new THREE.Mesh(new THREE.CircleGeometry(0.047, 48), MAT.glass); glassD.position.z = 0.004; face.add(glassD);
  speedo.add(face);
  P['speedometer'] = speedo;

  // ---------- Stang, grip, handle rem ----------
  const stang = new THREE.Group();
  stang.add(rod(V(0.30, 0.895, -0.30), V(0.30, 0.895, 0.30), 0.011, MAT.metal));
  for (const s of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0165, 0.11, 24), MAT.rubber);
    grip.rotation.x = PI / 2; grip.position.set(0.30, 0.895, s * 0.29); stang.add(grip);
    for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0176, 0.0016, 6, 24), MAT.rubber); r.position.set(0.30, 0.895, s * (0.25 + i * 0.013)); stang.add(r); }
    stang.add(mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 24).rotateX(PI / 2).translate(0.30, 0.895, s * 0.348), MAT.black));
    // handle rem
    const lever = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.14, 4, 10), MAT.alu);
    lever.rotation.set(PI / 2, 0, 0); lever.rotateZ(s * 0.18); lever.position.set(0.336, 0.902, s * 0.258); stang.add(lever);
    // rumah saklar & master rem
    const sw = mesh(loftX({ x0: 0.33, x1: 0.27, n: 14, ring: 24, sec: (x) => ({ top: 0.92, bot: 0.872, w: 0.026 * endRound(Math.min(x - 0.27, 0.33 - x), 0.012), zc: s * 0.200, eu: 3, evT: 3, evB: 3 }) }), MAT.black);
    stang.add(sw);
  }
  P['stang'] = stang;

  // ---------- Spion ----------
  const spion = new THREE.Group();
  for (const s of [-1, 1]) {
    spion.add(rod(V(0.282, 0.925, s * 0.205), V(0.27, 0.985, s * 0.262), 0.0065, MAT.black));
    const head = mesh(loftX({ x0: 0.285, x1: 0.245, n: 18, ring: 40, sec: (x) => {
      const f = ends(x, 0.285, 0.245, 0.006, 0.03);
      return { top: 1.033, bot: 0.968, w: 0.062 * f, zc: s * 0.30, eu: 3.2, evT: 2.8, evB: 2.8 };
    } }), MAT.black);
    spion.add(head);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.03, 40), MAT.mirror);
    glass.scale.set(1.95, 1.0, 1); glass.position.set(0.2848, 1.0005, s * 0.30); glass.rotation.y = PI / 2;
    // kaca menghadap pengendara (belakang)
    glass.rotation.y = -PI / 2; glass.position.x = 0.2442;
    spion.add(glass);
  }
  P['spion'] = spion;

  // ---------- Spakbor belakang + dudukan plat ----------
  const sbb = new THREE.Group();
  const sbT = spline([[-0.93, 0.47], [-0.90, 0.53], [-0.84, 0.545], [-0.73, 0.55]]);
  sbb.add(mesh(loftX({ x0: -0.73, x1: -0.93, n: 24, ring: 32, sec: (x) => {
    const f = ends(x, -0.73, -0.93, 0.01, 0.01);
    return { top: sbT(x), bot: sbT(x) - 0.028, w: 0.068 * f, eu: 4, evT: 2.5, evB: 4 };
  } }), MAT.black));
  sbb.add(box(0.012, 0.13, 0.11, MAT.black, -0.915, 0.42, 0));
  const plate = box(0.004, 0.105, 0.20, new THREE.MeshStandardMaterial({ color: '#141414', roughness: .45, metalness: .3 }), -0.924, 0.41, 0);
  plate.rotation.z = -0.12; sbb.add(plate);
  const plateTxt = box(0.002, 0.07, 0.17, new THREE.MeshStandardMaterial({ color: '#eceff2', roughness: .4, metalness: .2 }), -0.927, 0.41, 0);
  plateTxt.rotation.z = -0.12; plateTxt.scale.set(1, 0.18, 1); sbb.add(plateTxt);
  // reflektor merah
  const refl = box(0.006, 0.02, 0.06, new THREE.MeshPhysicalMaterial({ color: '#a3070f', roughness: .1, clearcoat: 1 }), -0.921, 0.488, 0);
  sbb.add(refl);
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
