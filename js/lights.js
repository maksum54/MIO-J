// Lampu: depan (standar / LED / projector), bilah LED DRL, belakang, sein. Semua bisa nyala/mati.
// Bentuk lensa mengikuti permukaan batok & tebeng (loft), bukan benda tempelan.
import * as THREE from 'three';
import { MAT, box, tag, spline, endRound, mesh } from './parts.js';
import { loftX, batokSec, batokDeform, apronPoint } from './body.js';

const glow = (color, i = 0) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, roughness: .25 });
const lensMat = (color, emissive, i, opts = {}) => new THREE.MeshPhysicalMaterial({
  color, emissive, emissiveIntensity: i, roughness: .06, clearcoat: 1, clearcoatRoughness: .03, transmission: .35, thickness: .01, ...opts,
});

// Basis permukaan tebeng di (y, phi): normal keluar, arah "naik" sepanjang permukaan
function apronFrame(y, phi, off = 0) {
  const p = apronPoint(y, phi, off);
  const ty = apronPoint(y + 0.004, phi, off).sub(apronPoint(y - 0.004, phi, off)).normalize();
  const tp = apronPoint(y, phi + 0.01, off).sub(apronPoint(y, phi - 0.01, off)).normalize();
  const n = new THREE.Vector3().crossVectors(tp, ty).normalize();
  if (n.x * Math.cos(phi) + n.z * Math.sin(phi) < 0) n.negate();
  return { p, n, ty, tp };
}

export function makeLights(scene) {
  const G = { depan: new THREE.Group(), drl: new THREE.Group(), belakang: new THREE.Group(), sein: new THREE.Group() };
  const state = { depan: 'standar', drl: 'none', belakang: 'standar', sein: 'standar', on: true };
  const spot = new THREE.SpotLight('#fff6e0', 0, 6, 0.45, 0.6, 1.2);
  spot.position.set(0.48, 0.89, 0); spot.target.position.set(3, 0, 0);
  const rearGlow = new THREE.PointLight('#ff2a2a', 0, 1.6);
  rearGlow.position.set(-1.02, 0.62, 0);

  // Lampu depan: mangkuk & lensa mengikuti ujung depan batok
  const HX0 = 0.436, HX1 = 0.488;
  const headSec = (k, x1, r) => (x) => {
    const s = batokSec(0.44, k), f = endRound(Math.abs(x - x1), r);
    const g = Math.sqrt(f);
    return { ...s, top: s.yc + (s.top - s.yc) * g, bot: s.yc - (s.yc - s.bot) * g, w: s.w * f };
  };

  function buildDepan() {
    G.depan.clear();
    const t = state.depan, on = state.on;
    const reflMat = t === 'standar' ? MAT.chrome : new THREE.MeshStandardMaterial({ color: '#15171b', roughness: .35, metalness: .6 });
    G.depan.add(mesh(loftX({ x0: HX0, x1: 0.474, n: 16, ring: 64, sec: headSec(0.80, 0.474, 0.012), deform: batokDeform }), reflMat));
    G.depan.add(mesh(loftX({ x0: HX0, x1: HX1, n: 24, ring: 72, sec: headSec(0.86, HX1, 0.034), deform: batokDeform }),
      lensMat('#ffffff', '#ffffff', 0, { transparent: true, opacity: .32, transmission: .9, roughness: .02 })));
    if (t === 'standar') {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 10), glow('#ffd98a', on ? 3 : 0));
      bulb.position.set(0.466, 0.892, 0); G.depan.add(bulb);
      spot.color.set('#ffe2a8'); spot.intensity = on ? 18 : 0;
    } else if (t === 'led') {
      for (const s of [-1, 1]) G.depan.add(box(0.004, 0.018, 0.045, glow('#ffffff', on ? 4 : 0), 0.474, 0.888, s * 0.035));
      G.depan.add(box(0.004, 0.005, 0.15, glow('#e8f4ff', on ? 3 : 0), 0.472, 0.908, 0));
      spot.color.set('#f2f8ff'); spot.intensity = on ? 30 : 0;
    } else { // projector + angel eye
      for (const s of [-1, 1]) {
        const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 24), MAT.chrome);
        proj.rotation.z = Math.PI / 2; proj.position.set(0.468, 0.889, s * 0.043); G.depan.add(proj);
        const lensP = new THREE.Mesh(new THREE.CircleGeometry(0.016, 24), glow('#ffffff', on ? 5 : 0));
        lensP.position.set(0.4785, 0.889, s * 0.043); lensP.rotation.y = Math.PI / 2; G.depan.add(lensP);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.0025, 8, 32), glow('#7fd3ff', on ? 4 : 0));
        ring.position.set(0.479, 0.889, s * 0.043); ring.rotation.y = Math.PI / 2; G.depan.add(ring);
      }
      spot.color.set('#f6fbff'); spot.intensity = on ? 40 : 0;
    }
    // isi lampu ikut maju ke hidung batok yang runcing
    G.depan.children.slice(2).forEach(o => batokDeform(o.position));
    tag(G.depan, 'lampu-depan');
  }

  function buildDrl() {
    G.drl.clear();
    if (state.drl === 'none') return;
    const col = { putih: '#ffffff', biru: '#7fd3ff', kuning: '#ffc23a', merah: '#ff2a2a' }[state.drl];
    // dua bilah mengikuti kontur depan tebeng (bentuk V)
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, y = 0.80 - t * 0.20;
        pts.push(apronPoint(y, s * (0.10 + t * 0.32), 0.004));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.0055, 8), glow(col, state.on ? 3.5 : 0.15));
      G.drl.add(tube);
    }
    tag(G.drl, 'drl');
  }

  // Lampu belakang: baji di ujung ekor
  const TT = spline([[-0.968, 0.616], [-0.93, 0.641], [-0.885, 0.652]]);
  const TB = spline([[-0.968, 0.596], [-0.93, 0.590], [-0.885, 0.598]]);
  const tailSec = (x) => {
    const f = endRound(Math.abs(x + 0.968), 0.02) * endRound(Math.abs(x + 0.885), 0.006);
    return { top: TT(x), bot: TB(x), w: (0.036 + 0.05 * (x + 0.968) / 0.083) * f, eu: 2.4, evT: 2.6, evB: 2.6 };
  };
  function buildBelakang() {
    G.belakang.clear();
    const t = state.belakang, on = state.on;
    const red = t === 'smoke' ? '#3a0a0c' : '#b5121b';
    G.belakang.add(mesh(loftX({ x0: -0.885, x1: -0.968, n: 24, ring: 48, sec: tailSec }),
      lensMat(red, '#ff1a1a', on ? (t === 'standar' ? 0.9 : 2.2) : 0, { transmission: 0 })));
    if (t !== 'standar') { // garis LED
      for (const dy of [0, 0.014]) G.belakang.add(box(0.004, 0.004, 0.08, glow('#ff2020', on ? 5 : 0), -0.963, 0.600 + dy, 0));
    }
    rearGlow.intensity = on ? (t === 'standar' ? 0.5 : 1.4) : 0;
    tag(G.belakang, 'lampu-belakang');
  }

  function buildSein() {
    G.sein.clear();
    const t = state.sein, on = state.on;
    const lensCol = t === 'clear' ? '#e8eef5' : '#ff9a1a';
    const lightCol = t === 'standar' ? '#ffa31a' : '#ffb000';
    for (const s of [-1, 1]) {
      // sein depan: lensa runcing di bahu atas tebeng depan
      const { p, n, ty, tp } = apronFrame(0.765, s * 0.80, 0.001);
      const f = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), lensMat(lensCol, lightCol, on ? 0.6 : 0));
      const b = new THREE.Vector3().crossVectors(ty, n).normalize();
      f.matrixAutoUpdate = true;
      f.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(b, ty, n));
      f.rotateOnAxis(new THREE.Vector3(0, 0, 1), -s * 0.45); f.scale.set(0.062, 0.017, 0.007); f.position.copy(p);
      G.sein.add(f);
      if (t !== 'standar') { const c = box(0.01, 0.004, 0.03, glow(lightCol, on ? 3 : 0), 0, 0, 0); c.position.copy(p).addScaledVector(n, 0.004); c.quaternion.copy(f.quaternion); G.sein.add(c); }
      // sein belakang: di sisi lampu belakang
      const r = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), lensMat(lensCol, lightCol, on ? 0.5 : 0));
      r.scale.set(0.03, 0.011, 0.012); r.position.set(-0.905, 0.607, s * 0.072); r.rotation.y = s * 0.35;
      G.sein.add(r);
    }
    tag(G.sein, 'sein-depan');
  }

  const api = {
    groups: G, spot, rearGlow,
    set(patch) { Object.assign(state, patch); buildDepan(); buildDrl(); buildBelakang(); buildSein(); },
    state,
  };
  api.set({});
  return api;
}
