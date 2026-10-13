// Sticker / tulisan: dirender ke canvas lalu diproyeksikan ke permukaan body (DecalGeometry).
import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

// Zona tempel. Koordinat lokal chassis (x depan, y atas, z kiri). rx/ry = jangkauan geser (m).
export const ZONES = {
  kiri:  { part: 'body-kiri',  label: 'Body samping kiri',  c: [-0.42, 0.635], rx: 0.40, ry: 0.09, dir: 'side+' },
  kanan: { part: 'body-kanan', label: 'Body samping kanan', c: [-0.42, 0.635], rx: 0.40, ry: 0.09, dir: 'side-' },
  depan: { part: 'body-depan', label: 'Tebeng depan',       c: [0.0, 0.63],    rx: 0.13, ry: 0.15, dir: 'front' },
  dalam: { part: 'tebeng-dalam', label: 'Tebeng dalam',     c: [0.0, 0.66],    rx: 0.14, ry: 0.16, dir: 'back' },
};

const imgCache = new Map();
function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  imgCache.set(src, p); return p;
}

async function stickerCanvas(s) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (s.type === 'image' && s.src) {
    const img = await loadImage(s.src);
    const k = 512 / Math.max(img.width, img.height);
    c.width = Math.max(8, Math.round(img.width * k)); c.height = Math.max(8, Math.round(img.height * k));
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const H = 160, font = `${s.italic ? 'italic ' : ''}700 ${H}px "${s.font || 'Barlow Condensed'}", sans-serif`;
  await document.fonts.load(font).catch(() => {});
  ctx.font = font;
  const text = s.text || ' ';
  const w = Math.ceil(ctx.measureText(text).width) + 60;
  c.width = Math.min(2048, w); c.height = H + 50;
  ctx.font = font; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  if (s.outline) { ctx.strokeStyle = s.outline; ctx.lineWidth = 16; ctx.strokeText(text, c.width / 2, c.height / 2); }
  ctx.fillStyle = s.color || '#fff'; ctx.fillText(text, c.width / 2, c.height / 2);
  return c;
}

const ray = new THREE.Raycaster();

// Tempel semua sticker. panels: partId -> mesh/group, chassis: Object3D (frame lokal zona).
export async function applyStickers(list, panels, chassis, old = []) {
  for (const m of old) { m.parent && m.parent.remove(m); m.geometry.dispose(); m.material.map && m.material.map.dispose(); m.material.dispose(); }
  const made = [], failed = [];
  chassis.updateMatrixWorld(true);
  for (const s of list) {
    const z = ZONES[s.zone]; if (!z) continue;
    const panel = panels[z.part];
    const mesh = panel && (panel.isMesh ? panel : panel.children.find(o => o.isMesh));
    if (!mesh) { failed.push(s.id); continue; }
    const lx = z.c[0] + (s.x || 0) * z.rx, ly = z.c[1] + (s.y || 0) * z.ry;
    let o, d;
    if (z.dir === 'side+') { o = new THREE.Vector3(lx, ly, 0.8); d = new THREE.Vector3(0, 0, -1); }
    else if (z.dir === 'side-') { o = new THREE.Vector3(lx, ly, -0.8); d = new THREE.Vector3(0, 0, 1); }
    else if (z.dir === 'front') { o = new THREE.Vector3(1.2, ly, (s.x || 0) * z.rx); d = new THREE.Vector3(-1, 0, 0); }
    else { o = new THREE.Vector3(-0.2, ly, (s.x || 0) * z.rx); d = new THREE.Vector3(1, 0, 0); }
    o.applyMatrix4(chassis.matrixWorld); d.transformDirection(chassis.matrixWorld);
    ray.set(o, d);
    const hit = ray.intersectObject(mesh, false)[0];
    if (!hit) { failed.push(s.id); continue; }
    const n = hit.face.normal.clone().transformDirection(mesh.matrixWorld);
    if (n.dot(d) > 0) n.negate();

    const canvas = await stickerCanvas(s);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const h = 0.07 * (s.scale || 1), w = h * canvas.width / canvas.height;

    const m4 = new THREE.Matrix4().lookAt(hit.point.clone().add(n), hit.point, new THREE.Vector3(0, 1, 0));
    const q = new THREE.Quaternion().setFromRotationMatrix(m4)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(s.rot || 0)));
    const geo = new DecalGeometry(mesh, hit.point, new THREE.Euler().setFromQuaternion(q), new THREE.Vector3(w, h, 0.09));
    // ke ruang lokal panel supaya ikut bergerak (exploded view)
    geo.applyMatrix4(new THREE.Matrix4().copy(mesh.matrixWorld).invert());
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, depthWrite: false, roughness: .35,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const dm = new THREE.Mesh(geo, mat);
    dm.userData.partId = mesh.userData.partId; dm.userData.stickerId = s.id;
    mesh.add(dm);
    made.push(dm);
  }
  return { made, failed };
}
