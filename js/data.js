// Data acuan Yamaha Mio J (2014) — dari spesifikasi publik (oto.com, otomotifnet, brosur).
// Model 3D adalah PERKIRAAN bentuk, bukan CAD resmi Yamaha.

export const SPEC = {
  panjang: 1850, lebar: 700, tinggi: 1050, wheelbase: 1260,
  tinggiJok: 745, groundClearance: 130, berat: 93,
  mesin: '113,7 cc, 4-tak SOHC 2 katup, berpendingin udara, YMJET-FI',
  banDepan: '70/90-14', banBelakang: '80/90-14',
  shockBelakang: 270, // mm (sumber: moladin.com)
  remDepan: 'Cakram 190 mm', remBelakang: 'Tromol',
};

export const DEFAULTS = {
  warnaBody: '#1f4fae',      // biru Mio J
  finish: 'glossy',
  warnaSekunder: '#22252b',  // tebeng dalam, dek
  warnaVelg: '#1a1b1e',
  warnaJok: '#141414',
  warnaPer: '#c9cdd3',
  banDepan: '70/90-14',
  banBelakang: '80/90-14',
  shock: 270,
  forkDrop: 0,
  lampuDepan: 'standar',
  drl: 'none',
  lampuBelakang: 'standar',
  sein: 'standar',
  lampuNyala: true,
  malam: false,
  stickers: [
    { id: 's1', type: 'text', text: 'Mio J', font: 'Barlow Condensed', italic: true, color: '#ffffff', outline: '#0b1d4a', zone: 'kiri', x: 0, y: 0, scale: 1, rot: 0 },
    { id: 's2', type: 'text', text: 'Mio J', font: 'Barlow Condensed', italic: true, color: '#ffffff', outline: '#0b1d4a', zone: 'kanan', x: 0, y: 0, scale: 1, rot: 0 },
  ],
};

export const BODY_PRESETS = [
  ['Biru Mio J', '#1f4fae'], ['Hitam', '#16181c'], ['Putih', '#eef0f3'], ['Merah', '#c3161c'],
  ['Abu Titan', '#5d646e'], ['Kuning', '#f2b705'], ['Tosca', '#0f9d8a'], ['Orange', '#ea6a12'],
  ['Pink', '#e35d9a'], ['Hijau Army', '#4b5a3a'],
];
export const VELG_PRESETS = [
  ['Hitam', '#1a1b1e'], ['Silver', '#b9bec5'], ['Gold', '#c9a227'], ['Merah', '#c3161c'],
  ['Putih', '#eef0f3'], ['Biru', '#1f4fae'],
];
export const FINISH = {
  glossy:  { label: 'Glossy',  roughness: 0.32, metalness: 0.0, clearcoat: 1.0 },
  doff:    { label: 'Doff',    roughness: 0.85, metalness: 0.0, clearcoat: 0.0 },
  metalik: { label: 'Metalik', roughness: 0.35, metalness: 0.55, clearcoat: 1.0 },
  candy:   { label: 'Candy',   roughness: 0.12, metalness: 0.25, clearcoat: 1.0 },
};

// Ukuran ban ring 14. w = lebar tapak (mm), a = aspek (% tinggi dinding / lebar)
export const TIRES = [
  { id: '70/90-14',  w: 70,  a: 90 },
  { id: '80/80-14',  w: 80,  a: 80 },
  { id: '80/90-14',  w: 80,  a: 90 },
  { id: '90/80-14',  w: 90,  a: 80 },
  { id: '90/90-14',  w: 90,  a: 90 },
  { id: '100/70-14', w: 100, a: 70 },
  { id: '100/80-14', w: 100, a: 80 },
  { id: '110/70-14', w: 110, a: 70 },
  { id: '120/70-14', w: 120, a: 70 },
];
export function tireDims(id) {
  const t = TIRES.find(x => x.id === id) || TIRES[0];
  const rim = 14 * 25.4;            // 355,6 mm
  const side = t.w * t.a / 100;     // tinggi dinding ban
  return { ...t, rimR: rim / 2000, side: side / 1000, width: t.w / 1000,
           outerR: (rim / 2 + side) / 1000, diameter: Math.round(rim + 2 * side) };
}

export const LAMPU = {
  depan: { standar: 'Standar (halogen)', led: 'LED putih', projector: 'LED projector + angel eye' },
  drl: { none: 'Tanpa', putih: 'Bilah LED putih', biru: 'Bilah LED ice blue', kuning: 'Bilah LED kuning', merah: 'Bilah LED merah' },
  belakang: { standar: 'Standar', led: 'LED merah terang', smoke: 'LED lensa smoke' },
  sein: { standar: 'Standar amber', led: 'LED amber', clear: 'LED lensa bening' },
};

// Katalog sparepart. pos = keterangan lokasi; mod = catatan modifikasi umum.
export const PARTS = {
  'body-depan':      { nama: 'Tebeng / body depan', kat: 'Body', ket: 'Cover depan berwarna, dudukan lampu sein depan.', mod: 'Bisa dicat ulang, wrapping, atau ditempel sticker.' },
  'tebeng-dalam':    { nama: 'Tebeng dalam (leg shield)', kat: 'Body', ket: 'Panel di depan kaki pengendara.', mod: 'Sering dicat hitam doff / carbon wrap.' },
  'dek':             { nama: 'Dek / pijakan kaki', kat: 'Body', ket: 'Lantai pijakan kaki.', mod: 'Bisa dipasang karpet dek / alas aluminium.' },
  'cover-bawah':     { nama: 'Cover bawah dek', kat: 'Body', ket: 'Penutup bagian bawah rangka di bawah dek.', mod: '' },
  'body-kiri':       { nama: 'Body samping kiri', kat: 'Body', ket: 'Panel samping di bawah jok (sisi kiri).', mod: 'Area utama striping/sticker.' },
  'body-kanan':      { nama: 'Body samping kanan', kat: 'Body', ket: 'Panel samping di bawah jok (sisi kanan).', mod: 'Area utama striping/sticker.' },
  'cover-tengah':    { nama: 'Cover tengah', kat: 'Body', ket: 'Cover di depan jok, di atas dek.', mod: '' },
  'cover-belakang':  { nama: 'Cover belakang (buntut)', kat: 'Body', ket: 'Penutup bagian ekor di belakang jok.', mod: '' },
  'batok':           { nama: 'Batok kepala (cover stang)', kat: 'Body', ket: 'Rumah lampu depan dan speedometer.', mod: 'Bisa dicat / ganti lampu LED.' },
  'spakbor-depan':   { nama: 'Spakbor depan', kat: 'Body', ket: 'Pelindung cipratan roda depan.', mod: 'Cek lebar bila pakai ban depan besar.' },
  'spakbor-belakang':{ nama: 'Spakbor belakang + dudukan plat', kat: 'Body', ket: 'Pelindung roda belakang & dudukan plat nomor.', mod: 'Ban besar / shock pendek berisiko gesek.' },
  'jok':             { nama: 'Jok', kat: 'Body', ket: 'Panjang ±791 mm, lebar ±290 mm (sumber: otomotifnet).', mod: 'Jok custom / press / kulit jok.' },
  'behel':           { nama: 'Behel (pegangan belakang)', kat: 'Body', ket: 'Pegangan penumpang.', mod: '' },
  'rangka':          { nama: 'Rangka (pipa baja bulat)', kat: 'Rangka', ket: 'Rangka underbone pipa bulat.', mod: '' },
  'stang':           { nama: 'Stang + handgrip + handle rem', kat: 'Kemudi', ket: 'Setang kemudi, grip, tuas rem kiri/kanan.', mod: 'Ganti handgrip / handle rem CNC.' },
  'spion':           { nama: 'Spion kiri & kanan', kat: 'Kemudi', ket: 'Kaca spion.', mod: 'Spion model tomok / CNC.' },
  'speedometer':     { nama: 'Speedometer', kat: 'Kelistrikan', ket: 'Panel instrumen di batok.', mod: '' },
  'lampu-depan':     { nama: 'Lampu depan', kat: 'Kelistrikan', ket: 'Standar bohlam halogen di batok kepala.', mod: 'Upgrade LED / projector (cek daya & regulasi).' },
  'sein-depan':      { nama: 'Lampu sein depan', kat: 'Kelistrikan', ket: 'Sein kiri-kanan di tebeng depan.', mod: 'Ganti bohlam LED (butuh flasher LED).' },
  'drl':             { nama: 'Bilah LED (DRL)', kat: 'Kelistrikan', ket: 'Aksesoris tambahan, tidak ada di versi standar.', mod: 'Pasang di tebeng depan.' },
  'lampu-belakang':  { nama: 'Lampu belakang + sein belakang', kat: 'Kelistrikan', ket: 'Stop lamp dan sein belakang.', mod: 'Stop lamp LED / lensa smoke.' },
  'aki':             { nama: 'Aki (baterai)', kat: 'Kelistrikan', ket: 'Posisi digambarkan perkiraan.', mod: '' },
  'ecu':             { nama: 'ECU (YMJET-FI)', kat: 'Kelistrikan', ket: 'Pengatur injeksi. Posisi perkiraan.', mod: '' },
  'tangki':          { nama: 'Tangki bensin', kat: 'Mesin', ket: 'Di bawah jok. Posisi perkiraan.', mod: '' },
  'bagasi':          { nama: 'Bagasi bawah jok', kat: 'Body', ket: 'Volume ±8,1 liter (sumber: otomotifnet).', mod: '' },
  'mesin':           { nama: 'Mesin 113,7 cc (blok & silinder)', kat: 'Mesin', ket: 'Silinder tunggal mendatar, SOHC 2 katup, pendingin udara.', mod: 'Bore up, porting (di luar cakupan visual).' },
  'kipas':           { nama: 'Cover kipas / shroud', kat: 'Mesin', ket: 'Penutup kipas pendingin mesin.', mod: '' },
  'injeksi':         { nama: 'Throttle body + injektor', kat: 'Mesin', ket: 'Sistem bahan bakar YMJET-FI.', mod: '' },
  'filter-udara':    { nama: 'Box filter udara', kat: 'Mesin', ket: 'Saringan udara di atas CVT.', mod: 'Filter racing / open filter.' },
  'cvt':             { nama: 'Bak CVT (V-belt, roller, pulley)', kat: 'Penggerak', ket: 'Transmisi otomatis V-belt.', mod: 'Roller, per CVT, cover CVT custom.' },
  'kick-starter':    { nama: 'Kick starter', kat: 'Penggerak', ket: 'Engkol starter.', mod: '' },
  'knalpot':         { nama: 'Knalpot', kat: 'Mesin', ket: 'Leher knalpot + silencer standar.', mod: 'Knalpot racing (cek SNI/kebisingan).' },
  'shock-depan':     { nama: 'Shock depan (teleskopik)', kat: 'Kaki-kaki', ket: 'Suspensi depan teleskopik.', mod: 'Bisa diturunkan (downsize) beberapa cm.' },
  'shock-belakang':  { nama: 'Shock belakang (tunggal)', kat: 'Kaki-kaki', ket: 'Panjang standar ±270 mm (sumber: moladin.com).', mod: 'Downsize 250/240 mm, per warna-warni.' },
  'roda-depan':      { nama: 'Velg + ban depan', kat: 'Kaki-kaki', ket: 'Ring 14, ban standar 70/90-14.', mod: 'Upsize ban, velg racing.' },
  'roda-belakang':   { nama: 'Velg + ban belakang', kat: 'Kaki-kaki', ket: 'Ring 14, ban standar 80/90-14.', mod: 'Upsize ban, velg racing.' },
  'cakram':          { nama: 'Piringan cakram depan', kat: 'Rem', ket: 'Diameter ±190 mm.', mod: 'Piringan model daisy / floating.' },
  'kaliper':         { nama: 'Kaliper rem depan', kat: 'Rem', ket: 'Kaliper rem hidrolik.', mod: 'Kaliper aftermarket + bracket.' },
  'tromol':          { nama: 'Rem tromol belakang', kat: 'Rem', ket: 'Rem tromol di hub roda belakang.', mod: '' },
  'standar-tengah':  { nama: 'Standar tengah', kat: 'Rangka', ket: 'Standar dua kaki.', mod: '' },
  'standar-samping': { nama: 'Standar samping', kat: 'Rangka', ket: 'Standar satu kaki (kiri).', mod: '' },
};
