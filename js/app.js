// Mio J 2014 — konfigurator modifikasi. Scene, UI, simpan & bagikan.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeBike } from './bike.js';
import { MAT, setPaint } from './parts.js';
import { applyStickers, ZONES } from './stickers.js';
import { DEFAULTS, BODY_PRESETS, VELG_PRESETS, FINISH, TIRES, LAMPU, PARTS, SPEC, tireDims } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v; else if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};

// ---------- state ----------
const KEY = 'mioj-config-v1';
const clone = (o) => JSON.parse(JSON.stringify(o));
function loadState() {
  try {
    const h = location.hash.startsWith('#c=') ? JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3))))) : null;
    if (h) return { ...clone(DEFAULTS), ...h };
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) return { ...clone(DEFAULTS), ...s };
  } catch (e) { console.warn('config rusak, pakai default', e); }
  return clone(DEFAULTS);
}
let S = loadState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage penuh (gambar besar) */ } };

// ---------- scene ----------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.minDistance = 1.2; controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.495; controls.target.set(0, 0.5, 0);

const hemi = new THREE.HemisphereLight('#dfe8ff', '#20232a', 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(2.5, 4, 2.5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
scene.add(sun);

const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: '#1a1d22', roughness: .95 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(8, 32, '#2b3038', '#22262c'); grid.position.y = 0.001; scene.add(grid);

const bike = makeBike(scene);
scene.add(bike.root);

const VIEWS = { kiri: [0, 0.7, 3.4], kanan: [0, 0.7, -3.4], depan: [3.2, 0.8, 0], belakang: [-3.2, 0.9, 0], iso: [2.3, 1.25, 2.6] };
function setView(v) { camera.position.set(...VIEWS[v]); controls.target.set(0, 0.5, 0); controls.update(); }
setView('iso');

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas.parentElement);

// ---------- apply state ----------
let stickerMeshes = [];
let stickerJob = 0;
async function applyStickersNow() {
  const job = ++stickerJob;
  bike.chassis.updateMatrixWorld(true);
  const res = await applyStickers(S.stickers, bike.panels, bike.chassis, stickerMeshes);
  if (job !== stickerJob) { res.made.forEach(m => m.parent && m.parent.remove(m)); return; }
  stickerMeshes = res.made;
}
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const stickersLater = debounce(applyStickersNow, 120);

function applyAll({ stickers = true } = {}) {
  setPaint(S.warnaBody, S.finish);
  MAT.dark.color.set(S.warnaSekunder);
  MAT.rim.color.set(S.warnaVelg);
  MAT.seat.color.set(S.warnaJok);
  MAT.spring.color.set(S.warnaPer);
  bike.update({ banDepan: S.banDepan, banBelakang: S.banBelakang, shock: S.shock, forkDrop: S.forkDrop });
  bike.lights.set({ depan: S.lampuDepan, drl: S.drl, belakang: S.lampuBelakang, sein: S.sein, on: S.lampuNyala });
  setNight(S.malam);
  if (stickers) stickersLater();
  renderStance();
  save();
}

function setNight(on) {
  hemi.intensity = on ? 0.05 : 0.6; sun.intensity = on ? 0.08 : 2.2;
  scene.environmentIntensity = on ? 0.12 : 1;
  renderer.toneMappingExposure = on ? 0.9 : 1;
  $('#btn-night').classList.toggle('on', on);
}

// ---------- UI builders ----------
function colorRow(label, key, presets) {
  const input = el('input', { type: 'color', value: S[key], oninput: (e) => { S[key] = e.target.value; applyAll({ stickers: false }); mark(); } });
  const sw = presets ? el('div', { class: 'sw' }, presets.map(([n, c]) =>
    el('button', { title: n, style: `background:${c}`, 'data-c': c, onclick: () => { S[key] = c; input.value = c; applyAll({ stickers: false }); mark(); } }))) : null;
  const mark = () => sw && sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === S[key].toLowerCase()));
  mark();
  return [el('div', { class: 'row' }, el('label', {}, label), input), sw];
}
function seg(options, key, after) {
  const box = el('div', { class: 'seg' });
  const draw = () => { box.replaceChildren(...Object.entries(options).map(([v, n]) =>
    el('button', { class: S[key] === v ? 'on' : '', onclick: () => { S[key] = v; applyAll({ stickers: false }); draw(); after && after(); } }, n))); };
  draw(); return box;
}

function buildWarna() {
  $('#tab-warna').replaceChildren(
    el('h3', {}, 'Warna body'),
    ...colorRow('Warna utama (tebeng, body samping, batok, spakbor depan)', 'warnaBody', BODY_PRESETS),
    el('h3', {}, 'Finishing cat'), seg(Object.fromEntries(Object.entries(FINISH).map(([k, v]) => [k, v.label])), 'finish'),
    el('h3', {}, 'Bagian lain'),
    ...colorRow('Tebeng dalam, cover tengah, buntut', 'warnaSekunder', [['Hitam', '#22252b'], ['Abu', '#5d646e'], ['Putih', '#e9ebee'], ['Carbon', '#2c2f33']]),
    ...colorRow('Velg', 'warnaVelg', VELG_PRESETS),
    ...colorRow('Jok', 'warnaJok', [['Hitam', '#141414'], ['Coklat', '#5a3a22'], ['Merah', '#7d1416'], ['Abu', '#3b3f45']]),
    ...colorRow('Per shock', 'warnaPer', [['Silver', '#c9cdd3'], ['Merah', '#d0161e'], ['Kuning', '#f2c300'], ['Biru', '#1f6bff'], ['Hitam', '#1a1b1e'], ['Gold', '#c9a227']]),
    el('p', { class: 'note' }, 'Warna bisa diganti kapan saja. Semua pilihan tersimpan otomatis di browser ini.'),
  );
}

// ---------- sticker UI ----------
let selSticker = null;
function buildSticker() {
  const list = el('div');
  const draw = () => {
    list.replaceChildren(...S.stickers.map((s, i) => {
      const on = s.id === selSticker;
      const upd = (patch, now) => { Object.assign(s, patch); save(); now ? applyStickersNow() : stickersLater(); };
      const slider = (lbl, key, min, max, step) => el('div', { class: 'row' }, el('label', {}, lbl),
        el('input', { type: 'range', min, max, step, value: s[key], oninput: (e) => upd({ [key]: +e.target.value }) }));
      return el('div', { class: 'stk' + (on ? ' on' : '') },
        el('div', { class: 'hd' },
          el('b', { style: 'cursor:pointer', onclick: () => { selSticker = on ? null : s.id; draw(); } }, (s.type === 'image' ? '🖼 Gambar' : `“${s.text}”`) + ` · ${ZONES[s.zone]?.label || s.zone}`),
          el('button', { onclick: () => { S.stickers.splice(i, 1); save(); applyStickersNow(); draw(); } }, 'Hapus')),
        on ? el('div', {},
          s.type === 'text' ? el('div', {},
            el('div', { class: 'row' }, el('input', { type: 'text', value: s.text, maxlength: 40, oninput: (e) => upd({ text: e.target.value }) })),
            el('div', { class: 'row' }, el('label', {}, 'Font'),
              el('select', { onchange: (e) => upd({ font: e.target.value }, true) }, ['Barlow Condensed', 'Barlow', 'Impact', 'Arial Black', 'Georgia', 'Courier New', 'Brush Script MT']
                .map(f => el('option', { value: f, ...(f === s.font ? { selected: '' } : {}) }, f)))),
            el('div', { class: 'row' }, el('label', {}, 'Warna teks'), el('input', { type: 'color', value: s.color, oninput: (e) => upd({ color: e.target.value }) }),
              el('label', {}, 'Outline'), el('input', { type: 'color', value: s.outline || '#000000', oninput: (e) => upd({ outline: e.target.value }) })),
            el('div', { class: 'row' }, el('label', {}, 'Miring (italic)'), el('input', { type: 'checkbox', ...(s.italic ? { checked: '' } : {}), onchange: (e) => upd({ italic: e.target.checked }, true) })),
          ) : null,
          el('div', { class: 'row' }, el('label', {}, 'Posisi'),
            el('select', { onchange: (e) => upd({ zone: e.target.value, x: 0, y: 0 }, true) }, Object.entries(ZONES).map(([k, z]) => el('option', { value: k, ...(k === s.zone ? { selected: '' } : {}) }, z.label)))),
          slider('Geser maju/mundur', 'x', -1, 1, 0.01), slider('Geser naik/turun', 'y', -1, 1, 0.01),
          slider('Ukuran', 'scale', 0.3, 3, 0.01), slider('Putar', 'rot', -180, 180, 1),
          el('button', { onclick: () => { const c = { ...clone(s), id: 's' + Date.now(), zone: s.zone === 'kiri' ? 'kanan' : s.zone === 'kanan' ? 'kiri' : s.zone }; S.stickers.push(c); save(); applyStickersNow(); draw(); } }, 'Duplikat ke sisi lain'),
        ) : null);
    }));
  };
  const file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml', hidden: '', onchange: (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => { // kecilkan supaya muat di penyimpanan browser
        const k = Math.min(1, 512 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const s = { id: 's' + Date.now(), type: 'image', src: c.toDataURL('image/png'), zone: 'kiri', x: 0, y: 0, scale: 1.4, rot: 0 };
        S.stickers.push(s); selSticker = s.id; save(); applyStickersNow(); draw();
      };
      img.src = r.result;
    };
    r.readAsDataURL(f); e.target.value = '';
  } });
  draw();
  $('#tab-sticker').replaceChildren(
    el('h3', {}, 'Tulisan & sticker'),
    el('div', { class: 'seg' },
      el('button', { onclick: () => { const s = { id: 's' + Date.now(), type: 'text', text: 'TULISAN', font: 'Barlow Condensed', italic: true, color: '#ffffff', outline: '#000000', zone: 'kiri', x: 0, y: 0, scale: 1, rot: 0 }; S.stickers.push(s); selSticker = s.id; save(); applyStickersNow(); draw(); } }, '+ Tulisan'),
      el('button', { onclick: () => file.click() }, '+ Upload gambar (PNG)'), file),
    el('p', { class: 'note' }, 'Klik nama sticker untuk mengatur posisi, ukuran, dan putaran. Untuk logo, pakai PNG dengan latar transparan.'),
    list,
  );
}

// ---------- ban & shock ----------
let stanceBox;
function renderStance() {
  if (!stanceBox) return;
  const i = bike.info;
  const warn = [];
  if (i.jarakBanBelakang < 15) warn.push(`Ban belakang hanya ±${Math.max(i.jarakBanBelakang, 0)} mm dari body/spakbor saat diam. Bisa gesek saat shock tertekan.`);
  if (i.jarakBanDepan < 12) warn.push(`Ban depan ±${Math.max(i.jarakBanDepan, 0)} mm dari spakbor depan. Cek kelonggaran / ganti spakbor.`);
  if (i.lebarBelakang >= 100) warn.push('Ban belakang ≥100 mm: pada matic kecil sering perlu cek bak CVT & knalpot (bisa mentok).');
  if (i.lebarDepan >= 90) warn.push('Ban depan ≥90 mm: cek jarak ke garpu & spakbor.');
  if (i.groundClearance < 100) warn.push(`Ground clearance ±${i.groundClearance} mm: rawan mentok polisi tidur.`);
  stanceBox.replaceChildren(
    el('table', {},
      el('tr', {}, el('th', {}, 'Hasil'), el('th', {}, 'Standar'), el('th', {}, 'Sekarang')),
      el('tr', {}, el('td', {}, 'Tinggi jok'), el('td', {}, SPEC.tinggiJok + ' mm'), el('td', { class: 'val' }, i.tinggiJok + ' mm')),
      el('tr', {}, el('td', {}, 'Ground clearance'), el('td', {}, SPEC.groundClearance + ' mm'), el('td', { class: 'val' }, i.groundClearance + ' mm')),
      el('tr', {}, el('td', {}, 'Diameter ban depan'), el('td', {}, tireDims(SPEC.banDepan).diameter + ' mm'), el('td', { class: 'val' }, i.diaDepan + ' mm')),
      el('tr', {}, el('td', {}, 'Diameter ban belakang'), el('td', {}, tireDims(SPEC.banBelakang).diameter + ' mm'), el('td', { class: 'val' }, i.diaBelakang + ' mm')),
      el('tr', {}, el('td', {}, 'Sudut body (nungging +)'), el('td', {}, '0°'), el('td', { class: 'val' }, (i.nungging > 0 ? '+' : '') + i.nungging + '°')),
    ),
    ...warn.map(w => el('p', { class: 'warn' }, '⚠ ' + w)),
  );
}
function buildKaki() {
  const tireSel = (key) => el('select', { onchange: (e) => { S[key] = e.target.value; applyAll(); } },
    TIRES.map(t => el('option', { value: t.id, ...(t.id === S[key] ? { selected: '' } : {}) }, t.id + (t.id === SPEC[key] ? ' (standar)' : ''))));
  const shockVal = el('span', { class: 'val' }, S.shock + ' mm');
  const forkVal = el('span', { class: 'val' }, '-' + S.forkDrop + ' mm');
  stanceBox = el('div');
  $('#tab-kaki').replaceChildren(
    el('h3', {}, 'Ukuran ban (ring 14)'),
    el('div', { class: 'row' }, el('label', {}, 'Ban depan'), tireSel('banDepan')),
    el('div', { class: 'row' }, el('label', {}, 'Ban belakang'), tireSel('banBelakang')),
    el('h3', {}, 'Shockbreaker'),
    el('div', { class: 'row' }, el('label', {}, 'Panjang shock belakang'),
      el('input', { type: 'range', min: 220, max: 290, step: 5, value: S.shock, oninput: (e) => { S.shock = +e.target.value; shockVal.textContent = S.shock + ' mm'; applyAll(); } }), shockVal),
    el('p', { class: 'note' }, `Standar Mio J ±${SPEC.shockBelakang} mm. Ukuran downsize yang umum dijual: 250, 240, 230 mm.`),
    el('div', { class: 'row' }, el('label', {}, 'Turunkan shock depan'),
      el('input', { type: 'range', min: 0, max: 60, step: 5, value: S.forkDrop, oninput: (e) => { S.forkDrop = +e.target.value; forkVal.textContent = '-' + S.forkDrop + ' mm'; applyAll(); } }), forkVal),
    el('h3', {}, 'Dampak ke motor'),
    stanceBox,
    el('p', { class: 'note' }, 'Angka dihitung dari model perkiraan, bukan pengukuran pabrik. Pakai sebagai gambaran, pastikan ukuran ke bengkel sebelum beli.'),
  );
  renderStance();
}

function buildLampu() {
  $('#tab-lampu').replaceChildren(
    el('div', { class: 'row' }, el('label', {}, 'Lampu menyala'), el('input', { type: 'checkbox', ...(S.lampuNyala ? { checked: '' } : {}), onchange: (e) => { S.lampuNyala = e.target.checked; applyAll({ stickers: false }); } })),
    el('div', { class: 'row' }, el('label', {}, 'Mode malam (biar nyala lampu kelihatan)'), el('input', { type: 'checkbox', ...(S.malam ? { checked: '' } : {}), onchange: (e) => { S.malam = e.target.checked; applyAll({ stickers: false }); } })),
    el('h3', {}, 'Lampu depan'), seg(LAMPU.depan, 'lampuDepan'),
    el('h3', {}, 'Bilah LED / DRL (tebeng depan)'), seg(LAMPU.drl, 'drl'),
    el('h3', {}, 'Lampu belakang'), seg(LAMPU.belakang, 'lampuBelakang'),
    el('h3', {}, 'Lampu sein'), seg(LAMPU.sein, 'sein'),
    el('p', { class: 'note' }, 'Ganti lampu ke LED: cek kapasitas kiprok/aki. Lampu sein LED biasanya butuh flasher (relay) LED. Warna lampu depan selain putih/kuning dan lampu belakang selain merah melanggar aturan lalu lintas.'),
  );
}

// ---------- sparepart ----------
function buildPart() {
  const byKat = {};
  for (const [id, p] of Object.entries(PARTS)) (byKat[p.kat] ||= []).push([id, p]);
  $('#tab-part').replaceChildren(
    el('p', { class: 'note' }, `${Object.keys(PARTS).length} komponen. Klik baris untuk menyorot part di model, atau klik langsung part di model 3D. Tombol "Exploded view" di atas memisahkan semua sparepart.`),
    ...Object.entries(byKat).flatMap(([k, rows]) => [
      el('h3', {}, k),
      el('table', {}, rows.map(([id, p]) => el('tr', { class: 'click', onclick: () => showPart(id) }, el('td', {}, p.nama), el('td', { style: 'color:var(--mute)' }, p.mod || '–')))),
    ]),
  );
}

function summaryText() {
  const lines = [
    'Konfigurasi modifikasi Yamaha Mio J 2014',
    `Warna body: ${S.warnaBody} (${FINISH[S.finish].label})`,
    `Warna velg: ${S.warnaVelg} · jok: ${S.warnaJok} · per shock: ${S.warnaPer}`,
    `Ban depan: ${S.banDepan}${S.banDepan === SPEC.banDepan ? ' (standar)' : ''}`,
    `Ban belakang: ${S.banBelakang}${S.banBelakang === SPEC.banBelakang ? ' (standar)' : ''}`,
    `Shock belakang: ${S.shock} mm${S.shock === SPEC.shockBelakang ? ' (standar)' : ` (turun ${SPEC.shockBelakang - S.shock} mm)`}`,
    `Shock depan: ${S.forkDrop ? 'diturunkan ' + S.forkDrop + ' mm' : 'standar'}`,
    `Lampu depan: ${LAMPU.depan[S.lampuDepan]} · DRL: ${LAMPU.drl[S.drl]}`,
    `Lampu belakang: ${LAMPU.belakang[S.lampuBelakang]} · Sein: ${LAMPU.sein[S.sein]}`,
    `Sticker/tulisan: ${S.stickers.length} buah` + (S.stickers.filter(s => s.type === 'text').length ? ' (' + S.stickers.filter(s => s.type === 'text').map(s => `"${s.text}"`).join(', ') + ')' : ''),
    `Perkiraan: tinggi jok ${bike.info.tinggiJok} mm, ground clearance ${bike.info.groundClearance} mm`,
  ];
  const buy = [];
  if (S.banDepan !== SPEC.banDepan) buy.push(`Ban depan ${S.banDepan}`);
  if (S.banBelakang !== SPEC.banBelakang) buy.push(`Ban belakang ${S.banBelakang}`);
  if (S.shock !== SPEC.shockBelakang) buy.push(`Shock belakang ${S.shock} mm`);
  if (S.forkDrop) buy.push(`Jasa turun shock depan ${S.forkDrop} mm`);
  if (S.lampuDepan !== 'standar') buy.push(LAMPU.depan[S.lampuDepan]);
  if (S.drl !== 'none') buy.push(LAMPU.drl[S.drl]);
  if (S.lampuBelakang !== 'standar') buy.push('Lampu belakang ' + LAMPU.belakang[S.lampuBelakang]);
  if (S.sein !== 'standar') buy.push('Sein ' + LAMPU.sein[S.sein] + ' + flasher LED');
  if (S.warnaBody.toLowerCase() !== DEFAULTS.warnaBody) buy.push('Cat ulang / wrapping body');
  if (S.stickers.length) buy.push('Cetak sticker/cutting');
  if (buy.length) lines.push('', 'Daftar belanja:', ...buy.map(b => '- ' + b));
  return lines.join('\n');
}

function shareURL() {
  const lite = { ...S, stickers: S.stickers.filter(s => s.type !== 'image') }; // gambar tidak muat di link
  return location.origin + location.pathname + '#c=' + btoa(unescape(encodeURIComponent(JSON.stringify(lite))));
}

function buildSimpan() {
  const out = el('textarea', { readonly: '', style: 'width:100%;height:230px;background:#0f1215;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:12px' }, summaryText());
  const msg = el('p', { class: 'note' });
  const slots = el('div');
  const SL = 'mioj-slots-v1';
  const drawSlots = () => {
    const all = JSON.parse(localStorage.getItem(SL) || '{}');
    slots.replaceChildren(...Object.keys(all).map(n => el('div', { class: 'row' }, el('label', {}, n),
      el('button', { onclick: () => { S = { ...clone(DEFAULTS), ...all[n] }; rebuildAll(); } }, 'Buka'),
      el('button', { onclick: () => { delete all[n]; localStorage.setItem(SL, JSON.stringify(all)); drawSlots(); } }, 'Hapus'))));
  };
  drawSlots();
  const nameIn = el('input', { type: 'text', placeholder: 'Nama konsep, mis. "Biru ceper"' });
  $('#tab-simpan').replaceChildren(
    el('h3', {}, 'Simpan konsep'),
    el('div', { class: 'row' }, nameIn, el('button', { onclick: () => {
      const n = nameIn.value.trim() || ('Konsep ' + new Date().toLocaleString('id-ID'));
      const all = JSON.parse(localStorage.getItem(SL) || '{}'); all[n] = clone(S);
      try { localStorage.setItem(SL, JSON.stringify(all)); msg.textContent = 'Tersimpan: ' + n; } catch { msg.textContent = 'Gagal simpan: penyimpanan browser penuh (kurangi sticker gambar).'; }
      drawSlots();
    } }, 'Simpan')),
    slots,
    el('h3', {}, 'Ringkasan & daftar belanja'),
    out,
    el('div', { class: 'seg', style: 'margin-top:6px' },
      el('button', { onclick: async () => { await navigator.clipboard.writeText(out.value); msg.textContent = 'Ringkasan disalin.'; } }, 'Salin ringkasan'),
      el('button', { onclick: async () => { await navigator.clipboard.writeText(shareURL()); msg.textContent = 'Link disalin. Sticker gambar tidak ikut di link.'; } }, 'Salin link konsep'),
      el('button', { onclick: () => { const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })), download: 'mioj-konsep.json' }); a.click(); } }, 'Download file'),
      el('button', { onclick: () => { const f = el('input', { type: 'file', accept: '.json', onchange: async (e) => { try { S = { ...clone(DEFAULTS), ...JSON.parse(await e.target.files[0].text()) }; rebuildAll(); } catch { msg.textContent = 'File tidak valid.'; } } }); f.click(); } }, 'Buka file')),
    msg,
  );
}

// ---------- tabs ----------
const BUILD = { warna: buildWarna, sticker: buildSticker, kaki: buildKaki, lampu: buildLampu, part: buildPart, simpan: buildSimpan };
let curTab = 'warna';
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  curTab = b.dataset.tab;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== 'tab-' + curTab);
  BUILD[curTab]();
}));
function rebuildAll() { applyAll(); applyStickersNow(); BUILD[curTab](); }

// ---------- picking ----------
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let highlighted = [];
function clearHighlight() {
  for (const { m, e, i } of highlighted) { m.emissive && m.emissive.copy(e); m.emissiveIntensity = i; }
  highlighted = [];
}
function highlight(id) {
  clearHighlight();
  const seen = new Set();
  for (const root of bike.objects[id] || []) root.traverse(o => {
    if (!o.isMesh || o.userData.partId !== id || o.userData.stickerId) return;
    const m = o.material; if (seen.has(m) || !m.emissive) return; seen.add(m);
    highlighted.push({ m, e: m.emissive.clone(), i: m.emissiveIntensity });
    m.emissive.set('#3f8cff'); m.emissiveIntensity = 0.55;
  });
  clearTimeout(highlight.t); highlight.t = setTimeout(clearHighlight, 1600);
}
function showPart(id) {
  const p = PARTS[id]; if (!p) return;
  highlight(id);
  const box = $('#part-info');
  box.hidden = false;
  box.replaceChildren(
    el('button', { class: 'x', onclick: () => { box.hidden = true; } }, '×'),
    el('div', { class: 'k' }, p.kat), el('h4', {}, p.nama), el('p', {}, p.ket),
    p.mod ? el('p', {}, el('b', {}, 'Modifikasi: '), p.mod) : null,
  );
}
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObject(bike.root, true).find(h => h.object.userData.partId && h.object.visible);
  return hit ? hit.object.userData.partId : null;
}
let down = null;
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const id = pick(e); if (id) showPart(id); else $('#part-info').hidden = true;
});
const tip = $('#tip');
canvas.addEventListener('pointermove', e => {
  if (e.buttons) { tip.hidden = true; return; }
  const id = pick(e);
  if (!id) { tip.hidden = true; canvas.style.cursor = ''; return; }
  const r = canvas.getBoundingClientRect();
  tip.hidden = false; tip.textContent = PARTS[id]?.nama || id;
  tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top + 10) + 'px';
  canvas.style.cursor = 'pointer';
});

// ---------- top buttons ----------
let exploded = false;
$('#btn-explode').addEventListener('click', (e) => { exploded = !exploded; bike.setExplode(exploded); e.target.classList.toggle('on', exploded); });
$('#btn-night').addEventListener('click', () => { S.malam = !S.malam; applyAll({ stickers: false }); if (curTab === 'lampu') buildLampu(); });
$('#btn-reset').addEventListener('click', () => { if (confirm('Kembalikan semua ke Mio J 2014 standar warna biru?')) { S = clone(DEFAULTS); history.replaceState(null, '', location.pathname); rebuildAll(); } });
$('#btn-shot').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = el('a', { href: canvas.toDataURL('image/png'), download: 'mio-j-modif.png' }); a.click();
});
document.querySelectorAll('#views button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

// ---------- loop ----------
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  bike.tick(dt);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
resize();
applyAll();
applyStickersNow();
buildWarna();
loop();
window.__mioj = { bike, scene, camera, get state() { return S; } }; // untuk debug
