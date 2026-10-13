// Roda Mio J: velg casting ring 14 + ban dengan ukuran bisa diganti.
import * as THREE from 'three';
import { MAT, tag } from './parts.js';
import { tireDims } from './data.js';

// Penampang ban (lathe) -> torus "kotak membulat" dengan lebar & tinggi dinding nyata.
function tireGeometry(rimR, outerR, width) {
  const h = outerR - rimR, pts = [];
  pts.push(new THREE.Vector2(rimR - .004, -width * .40));
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + Math.PI * i / N;           // sisi dalam -> tapak -> sisi luar
    const c = Math.cos(a), s = Math.sin(a);
    const r = rimR + h * .45 + h * .55 * Math.sign(c) * Math.pow(Math.abs(c), .55);
    const z = (width / 2) * Math.sign(s) * Math.pow(Math.abs(s), .45);
    pts.push(new THREE.Vector2(r, z));
  }
  pts.push(new THREE.Vector2(rimR - .004, width * .40));
  const g = new THREE.LatheGeometry(pts, 72);
  g.rotateX(Math.PI / 2);                                // sumbu putar = Z (as roda)
  g.computeVertexNormals();
  return g;
}

// Alur tapak sederhana: ring tipis di permukaan tapak.
function treadGeometry(outerR, width) {
  const g = new THREE.TorusGeometry(outerR - .0015, .0022, 4, 90);
  return g;
}

function rimGroup(rimR, rimW, front) {
  const g = new THREE.Group();
  const mat = MAT.rim;
  // barrel + bibir velg
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rimR - .006, rimR - .006, rimW, 48, 1, true), mat);
  barrel.rotation.x = Math.PI / 2; barrel.material.side = THREE.DoubleSide;
  g.add(barrel);
  for (const s of [-1, 1]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR - .002, .0045, 8, 64), mat);
    lip.position.z = s * rimW / 2; g.add(lip);
  }
  // hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, front ? .085 : .07, 24), MAT.alu);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  // 5 palang ganda (gaya casting wheel Mio J)
  const spokeLen = rimR - .05;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    for (const off of [-.11, .11]) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(spokeLen, .013, .012), mat);
      const aa = a + off;
      sp.position.set(Math.cos(aa) * (.045 + spokeLen / 2), Math.sin(aa) * (.045 + spokeLen / 2), 0);
      sp.rotation.z = aa; sp.castShadow = true;
      g.add(sp);
    }
  }
  return g;
}

// Membuat roda. side: 'front' | 'rear'. Mengembalikan group dengan .setTire(id)
export function makeWheel(side) {
  const front = side === 'front';
  const root = new THREE.Group();
  const spin = new THREE.Group(); root.add(spin);
  const rimR = 14 * 25.4 / 2000;
  const rimW = front ? 1.40 * .0254 : 1.60 * .0254;   // 1.40-14 / 1.60-14
  const rim = rimGroup(rimR, rimW, front);
  spin.add(rim);
  tag(rim, front ? 'roda-depan' : 'roda-belakang');

  let tire = null, tread = null;
  root.setTire = (id) => {
    const d = tireDims(id);
    if (tire) { spin.remove(tire); tire.geometry.dispose(); }
    if (tread) { spin.remove(tread); tread.geometry.dispose(); }
    tire = new THREE.Mesh(tireGeometry(rimR, d.outerR, d.width), MAT.rubber);
    tire.castShadow = true;
    tread = new THREE.Mesh(treadGeometry(d.outerR, d.width), MAT.black);
    spin.add(tire, tread);
    tag(tire, front ? 'roda-depan' : 'roda-belakang');
    tag(tread, front ? 'roda-depan' : 'roda-belakang');
    root.userData.dims = d;
    return d;
  };

  // Rem: cakram 190 mm di depan (sisi kiri), tromol di belakang (sisi kanan)
  if (front) {
    const disc = new THREE.Mesh(new THREE.RingGeometry(.055, .095, 48), MAT.metal);
    disc.position.z = .052; disc.material = MAT.metal.clone(); disc.material.side = THREE.DoubleSide;
    for (let i = 0; i < 6; i++) { // lubang cakram (visual)
      const h = new THREE.Mesh(new THREE.CircleGeometry(.007, 12), MAT.black);
      const a = i * Math.PI / 3; h.position.set(Math.cos(a) * .078, Math.sin(a) * .078, .0525);
      spin.add(h);
    }
    spin.add(tag(disc, 'cakram'));
  } else {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.068, .068, .035, 32), MAT.alu);
    drum.rotation.x = Math.PI / 2; drum.position.z = -.055;
    root.add(tag(drum, 'tromol')); // tidak ikut berputar (panel rem)
  }
  root.spin = spin;
  return root;
}
