// Lampu: depan (standar / LED / projector), bilah LED DRL, belakang, sein. Semua bisa nyala/mati.
import * as THREE from 'three';
import { MAT, extrude, smooth, box, tag } from './parts.js';

const glow = (color, i = 0) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, roughness: .25 });

export function makeLights(scene) {
  const G = { depan: new THREE.Group(), drl: new THREE.Group(), belakang: new THREE.Group(), sein: new THREE.Group() };
  const state = { depan: 'standar', drl: 'none', belakang: 'standar', sein: 'standar', on: true };
  const spot = new THREE.SpotLight('#fff6e0', 0, 6, 0.45, 0.6, 1.2);
  spot.position.set(0.50, 0.93, 0); spot.target.position.set(3, 0, 0);
  const rearGlow = new THREE.PointLight('#ff2a2a', 0, 1.6);
  rearGlow.position.set(-1.05, 0.70, 0);

  // Lensa lampu depan (di batok). Profil: trapesium lancip khas Mio J 2014.
  const headLens = smooth([[0.425, 0.965], [0.472, 0.958], [0.486, 0.915], [0.455, 0.893], [0.42, 0.925]], 40);

  function buildDepan() {
    G.depan.clear();
    const t = state.depan, on = state.on;
    const housing = extrude(headLens, 0.20, { bevel: 0.01, mat: new THREE.MeshStandardMaterial({ color: '#202327', roughness: .4, metalness: .5 }), taper: (x) => 1 - 0.3 * Math.max(0, (x - 0.455) / 0.04) });
    G.depan.add(housing);
    const lens = extrude(headLens.map(([x, y]) => [x + 0.004, y]), 0.205, { bevel: 0.008, mat: MAT.glass, taper: (x) => 1 - 0.3 * Math.max(0, (x - 0.455) / 0.04) });
    G.depan.add(lens);
    if (t === 'standar') {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 10), glow('#ffd98a', on ? 2.2 : 0));
      bulb.position.set(0.468, 0.928, 0); G.depan.add(bulb);
      const refl = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), MAT.chrome);
      refl.position.set(0.462, 0.928, 0); refl.rotation.y = Math.PI / 2; G.depan.add(refl);
      spot.color.set('#ffe2a8'); spot.intensity = on ? 18 : 0;
    } else if (t === 'led') {
      for (const s of [-1, 1]) {
        const chip = box(0.006, 0.02, 0.05, glow('#ffffff', on ? 4 : 0), 0.478, 0.926, s * 0.04);
        G.depan.add(chip);
      }
      const strip = box(0.004, 0.006, 0.15, glow('#e8f4ff', on ? 3 : 0), 0.474, 0.952, 0);
      G.depan.add(strip);
      spot.color.set('#f2f8ff'); spot.intensity = on ? 30 : 0;
    } else { // projector + angel eye
      for (const s of [-1, 1]) {
        const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 24), MAT.chrome);
        proj.rotation.z = Math.PI / 2; proj.position.set(0.47, 0.926, s * 0.045); G.depan.add(proj);
        const lensP = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), glow('#ffffff', on ? 5 : 0));
        lensP.position.set(0.4805, 0.926, s * 0.045); lensP.rotation.y = Math.PI / 2; G.depan.add(lensP);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.003, 8, 32), glow('#7fd3ff', on ? 4 : 0));
        ring.position.set(0.481, 0.926, s * 0.045); ring.rotation.y = Math.PI / 2; G.depan.add(ring);
      }
      spot.color.set('#f6fbff'); spot.intensity = on ? 40 : 0;
    }
    tag(G.depan, 'lampu-depan');
  }

  function buildDrl() {
    G.drl.clear();
    if (state.drl === 'none') return;
    const col = { putih: '#ffffff', biru: '#7fd3ff', kuning: '#ffc23a', merah: '#ff2a2a' }[state.drl];
    // dua bilah mengikuti kontur tebeng depan (V shape)
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const y = 0.80 - t * 0.18;
        const edge = y >= 0.70 ? 0.517 + (0.80 - y) / 0.10 * 0.043 : 0.56 + (0.70 - y) / 0.10 * 0.025;
        const x = edge + 0.024;
        const z = s * (0.025 + t * 0.06);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.006, 8), glow(col, state.on ? 3.5 : 0.15));
      G.drl.add(tube);
    }
    tag(G.drl, 'drl');
  }

  function buildBelakang() {
    G.belakang.clear();
    const t = state.belakang, on = state.on;
    const prof = smooth([[-0.93, 0.715], [-0.975, 0.70], [-0.99, 0.665], [-0.955, 0.645], [-0.90, 0.66]], 40);
    const red = t === 'smoke' ? '#5a0d10' : '#b5121b';
    const lensMat = new THREE.MeshPhysicalMaterial({ color: red, emissive: '#ff1a1a', emissiveIntensity: on ? (t === 'standar' ? 0.8 : 2.2) : 0.0, roughness: .15, clearcoat: 1, transparent: t === 'smoke', opacity: t === 'smoke' ? .9 : 1 });
    G.belakang.add(extrude(prof, 0.19, { bevel: 0.01, mat: lensMat }));
    if (t !== 'standar') { // garis LED
      for (const dy of [0, 0.018]) G.belakang.add(box(0.004, 0.005, 0.15, glow('#ff2020', on ? 5 : 0), -0.988, 0.668 + dy, 0));
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
      // sein depan: di sisi tebeng depan
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), new THREE.MeshPhysicalMaterial({ color: lensCol, emissive: lightCol, emissiveIntensity: on ? 0.6 : 0, roughness: .1, clearcoat: 1 }));
      f.scale.set(1.2, 0.55, 0.6); f.position.set(0.565, 0.72, s * 0.115);
      G.sein.add(f);
      if (t !== 'standar') G.sein.add(box(0.02, 0.006, 0.03, glow(lightCol, on ? 3 : 0), 0.595, 0.72, s * 0.115));
      // sein belakang: di ujung lampu belakang
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 10), new THREE.MeshPhysicalMaterial({ color: lensCol, emissive: lightCol, emissiveIntensity: on ? 0.5 : 0, roughness: .1, clearcoat: 1 }));
      r.scale.set(0.8, 0.6, 1); r.position.set(-0.955, 0.68, s * 0.10);
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
