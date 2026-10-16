// Roda Mio J: velg casting ring 14 (5 palang bercabang) + ban dengan ukuran bisa diganti.
import * as THREE from 'three';
import { MAT, tag } from './parts.js';
import { tireDims } from './data.js';

// Tekstur kembang ban (bump map). Horizontal = keliling, vertikal = lebar ban (profil lathe).
let treadTex = null;
function treadTexture() {
  if (treadTex) return treadTex;
  const W = 2048, H = 256, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
  // dinding ban: guratan halus melingkar
  g.strokeStyle = '#767676'; g.lineWidth = 1;
  for (let y = 4; y < H; y += 9) { if (y > H * .3 && y < H * .7) continue; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // tapak: alur tengah + alur miring berselang (pola ban matic)
  const blocks = 56, bw = W / blocks;
  g.strokeStyle = '#1e1e1e'; g.lineCap = 'round';
  g.lineWidth = 5; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  g.lineWidth = 7;
  for (let i = 0; i < blocks; i++) {
    const x = i * bw;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(x + bw * .15, H / 2 + s * 8);
      g.quadraticCurveTo(x + bw * .55, H / 2 + s * 28, x + bw * .95, H / 2 + s * 52);
      g.stroke();
    }
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + bw * .6, H / 2 - 62); g.lineTo(x + bw * .85, H / 2 - 74); g.stroke();
    g.beginPath(); g.moveTo(x + bw * .1, H / 2 + 62); g.lineTo(x + bw * .35, H / 2 + 74); g.stroke();
    g.lineWidth = 7;
  }
  treadTex = new THREE.CanvasTexture(c);
  treadTex.wrapS = THREE.RepeatWrapping; treadTex.anisotropy = 8;
  return treadTex;
}

// Penampang ban (lathe): dinding membulat dengan tapak agak membulat. Sumbu putar = Z.
function tireGeometry(rimR, outerR, width) {
  const h = outerR - rimR, pts = [];
  const bead = width * 0.36;
  pts.push(new THREE.Vector2(rimR - .006, -bead));
  pts.push(new THREE.Vector2(rimR + .004, -bead - .004));
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + Math.PI * i / N;      // sisi dalam -> tapak -> sisi luar
    const c = Math.cos(a), s = Math.sin(a);
    const r = rimR + h * .42 + h * .58 * Math.pow(Math.abs(c), .62);
    const z = (width / 2) * Math.sign(s) * Math.pow(Math.abs(s), .55);
    pts.push(new THREE.Vector2(r, z));
  }
  pts.push(new THREE.Vector2(rimR + .004, bead + .004));
  pts.push(new THREE.Vector2(rimR - .006, bead));
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.x, p.y)), 128);
  // Lathe memutar di sekitar Y dengan profil (x=r, y=z). Putar supaya sumbu = Z.
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// Profil velg (bibir, flens, drop center) sebagai lathe
function rimShell(rimR, rimW) {
  const w = rimW / 2, pts = [
    [rimR - .022, -w * .55], [rimR - .010, -w * .75], [rimR - .004, -w - .002], [rimR + .010, -w - .004], [rimR + .014, -w + .002],
    [rimR + .002, -w + .006], [rimR - .002, -w * .4], [rimR - .012, -w * .15], [rimR - .012, w * .15], [rimR - .002, w * .4],
    [rimR + .002, w - .006], [rimR + .014, w - .002], [rimR + .010, w + .004], [rimR - .004, w + .002], [rimR - .010, w * .75], [rimR - .022, w * .55],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(pts, 96);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// Satu palang meruncing dari hub ke velg (extrude dengan bevel → tepi halus seperti casting)
function spokeGeometry(r0, r1, w0, w1, t) {
  const s = new THREE.Shape();
  s.moveTo(r0, -w0 / 2); s.lineTo(r1, -w1 / 2); s.lineTo(r1, w1 / 2); s.lineTo(r0, w0 / 2); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: .004, bevelSize: .0035, bevelSegments: 3 });
  g.translate(0, 0, -t / 2);
  return g;
}

function rimGroup(rimR, rimW, front) {
  const g = new THREE.Group();
  const mat = MAT.rim;
  const shell = new THREE.Mesh(rimShell(rimR, rimW), mat); shell.castShadow = true;
  g.add(shell);
  // hub (tromol/boss) — profil lathe
  const hw = front ? .05 : .045;
  const hub = new THREE.Mesh(new THREE.LatheGeometry([
    [.012, -hw], [.034, -hw], [.042, -hw * .8], [.048, -hw * .3], [.048, hw * .3], [.042, hw * .8], [.034, hw], [.012, hw],
  ].map(([r, z]) => new THREE.Vector2(r, z)), 40).rotateX(Math.PI / 2), mat);
  hub.castShadow = true; g.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, hw * 2 + .012, 20).rotateX(Math.PI / 2), MAT.chrome);
  g.add(cap);
  // 5 palang bercabang (Y): menyatu di hub, membelah ke velg
  const geo = spokeGeometry(.04, rimR - .016, .026, .013, .011);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    for (const off of [-.075, .075]) {
      const sp = new THREE.Mesh(geo, mat);
      sp.rotation.z = a + off; sp.castShadow = true;
      // pangkal palang digeser supaya bertemu di hub
      sp.position.set(-Math.cos(a + off) * 0, 0, 0);
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

  const tireMat = new THREE.MeshStandardMaterial({ color: '#16171a', roughness: .88, bumpMap: treadTexture(), bumpScale: 2.2 });
  let tire = null;
  root.setTire = (id) => {
    const d = tireDims(id);
    if (tire) { spin.remove(tire); tire.geometry.dispose(); }
    tire = new THREE.Mesh(tireGeometry(rimR, d.outerR, d.width), tireMat);
    tire.castShadow = tire.receiveShadow = true;
    spin.add(tire);
    tag(tire, front ? 'roda-depan' : 'roda-belakang');
    root.userData.dims = d;
    return d;
  };

  // Rem: cakram 190 mm di depan (sisi kiri), tromol di belakang (sisi kanan)
  if (front) {
    const s = new THREE.Shape();
    s.absarc(0, 0, .095, 0, Math.PI * 2, false);
    const inner = new THREE.Path(); inner.absarc(0, 0, .052, 0, Math.PI * 2, true); s.holes.push(inner);
    for (let i = 0; i < 12; i++) { // lubang cakram
      const a = i * Math.PI / 6, r = i % 2 ? .072 : .081, h = new THREE.Path();
      h.absarc(Math.cos(a) * r, Math.sin(a) * r, .0045, 0, Math.PI * 2, true); s.holes.push(h);
    }
    const discG = new THREE.ExtrudeGeometry(s, { depth: .0035, bevelEnabled: false, curveSegments: 48 });
    const disc = new THREE.Mesh(discG, new THREE.MeshStandardMaterial({ color: '#c7cbd1', roughness: .32, metalness: 1 }));
    disc.position.z = .05; disc.castShadow = true;
    spin.add(tag(disc, 'cakram'));
    // dudukan cakram (5 baut)
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + .3, b = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .008, 10).rotateX(Math.PI / 2), MAT.chrome);
      b.position.set(Math.cos(a) * .046, Math.sin(a) * .046, .054); spin.add(tag(b, 'cakram'));
    }
  } else {
    const drum = new THREE.Mesh(new THREE.LatheGeometry([
      [.02, 0], [.07, 0], [.072, -.006], [.072, -.028], [.06, -.034], [.02, -.034],
    ].map(([r, z]) => new THREE.Vector2(r, z)), 40).rotateX(Math.PI / 2), MAT.alu);
    drum.position.z = -.035; drum.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.07, .012, .008), MAT.black);
    arm.position.set(.06, .06, -.072); arm.rotation.z = .8;
    root.add(tag(drum, 'tromol'), tag(arm, 'tromol')); // tidak ikut berputar (panel rem)
  }
  root.spin = spin;
  return root;
}
