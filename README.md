# MIO-J — Konfigurator Modifikasi 3D Yamaha Mio J 2014

Lihat tampilan Mio J 2014 setelah dimodifikasi **sebelum membeli sparepart**.

**Buka:** https://maksum54.github.io/MIO-J/

## Fitur
- **Warna body**: ganti kapan saja (preset atau color picker), finishing glossy / doff / metalik / candy. Warna velg, jok, per shock, dan panel hitam juga bisa diganti.
- **Tulisan & sticker**: ketik tulisan (font, warna, outline) atau upload gambar PNG, lalu tempel di body samping kiri/kanan, tebeng depan, atau tebeng dalam. Posisi, ukuran, dan putaran bisa diatur.
- **Ukuran ban** ring 14: 70/90 sampai 120/70, depan dan belakang terpisah.
- **Downsize shockbreaker**: shock belakang 290 sampai 220 mm (standar ±270 mm) dan penurunan shock depan sampai 60 mm. Body ikut turun, dan perkiraan tinggi jok, ground clearance, serta jarak ban ke spakbor ikut berubah.
- **Lampu**: depan (standar / LED / projector + angel eye), bilah LED DRL (putih / ice blue / kuning / merah), lampu belakang LED / smoke, sein LED. Bisa dilihat nyala di mode malam.
- **Sparepart**: 41 komponen. Bisa diklik di model untuk melihat nama dan info, ada *exploded view*, dan daftar per kategori.
- **Simpan**: konsep tersimpan otomatis. Bisa juga simpan beberapa konsep, ambil screenshot PNG, salin ringkasan + daftar belanja, bagikan link, atau download/buka file konsep.

## Catatan penting
- Model 3D ini **perkiraan bentuk** yang disusun dari spesifikasi publik (P 1850 × L 700 × T 1050 mm, wheelbase 1260 mm, tinggi jok 745 mm, ground clearance 130 mm, ban 70/90-14 & 80/90-14, shock belakang ±270 mm). Ini **bukan CAD resmi Yamaha**.
- Angka hasil modifikasi (tinggi jok, ground clearance, jarak ban) adalah perkiraan dari model. Pastikan ukuran sparepart ke bengkel sebelum membeli.

## Jalankan lokal
```bash
python -m http.server 8000
# buka http://localhost:8000
```
Tanpa build step. Memakai Three.js 0.160 dari CDN.

## Struktur
| File | Isi |
|---|---|
| `js/data.js` | Spesifikasi, preset warna, ukuran ban, daftar sparepart |
| `js/body.js` | Panel body, jok, batok, stang, spion, rangka |
| `js/engine.js` | Mesin, CVT, knalpot, shock belakang, garpu depan |
| `js/wheels.js` | Velg, ban (ukuran dinamis), cakram, tromol |
| `js/lights.js` | Lampu depan, DRL, belakang, sein |
| `js/stickers.js` | Tulisan & gambar ditempel ke body (decal) |
| `js/bike.js` | Rakitan, perhitungan stance, exploded view |
| `js/app.js` | Scene, kontrol UI, simpan/bagikan |
