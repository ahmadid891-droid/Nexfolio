# Checklist Deploy Proyek Demo (Laravel + MySQL + React) ke Hostinger

> Panduan **generik** untuk meng-deploy **proyek Anda sendiri** (bukan Nexfolio) ke subdomain Hostinger.
> Setiap proyek demo adalah aplikasi terpisah dengan **file sendiri** dan **`.env` sendiri** — JANGAN
> pernah menyalin/menimpa `.env` antar proyek.

## ⚠️ Aturan Emas
- Unggah **file proyek yang bersangkutan** (hasil kerja Anda), bukan file Nexfolio.
- Setiap proyek punya **`.env` unik**: `APP_KEY` baru + kredensial **DB demo sendiri** + `APP_URL` subdomainnya.
- Setiap proyek butuh **1 database MySQL terpisah** di hPanel.
- Blokir `.env`/`vendor`/`storage` via `.htaccess` di root (pakai template yang sama).
- PHP versi proyek harus didukung (disarankan 8.3, sesuaikan kebutuhan proyek).

---

## Langkah 1 — Siapkan paket upload (di komputer Anda)
1. Masuk folder proyek Laravel.
2. Jalankan agar dependensi produksi bersih:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
3. (Jika ada frontend) build dulu, lalu hasil build taruh di folder `public` sesuai konvensi proyek.
4. Bersihkan hal yang tidak perlu agar hemat kuota disk (17,44 GB):
   - Hapus `node_modules/` (tidak diunggah).
   - Bersihkan `storage/logs/*.log` lama.
   - Hapus folder cache dev bila ada.
5. Zip folder proyek (exclude `node_modules`, `.git`, `storage/framework/cache/*` dsb).

## Langkah 2 — Buat subdomain di hPanel
1. hPanel → **Domains → Subdomains** → **Create Subdomain**.
2. Isi contoh: `demo-namaproyek` pada `domain.com`.
   → terbentuk document root, mis. `public_html/demo-namaproyek`.
3. Catat URL final, mis. `https://demo-namaproyek.domain.com`.

## Langkah 3 — Upload & extract
1. hPanel → **File Manager** → masuk folder root subdomain.
2. Upload zip → **Extract** di folder tersebut (isi proyek langsung di root, **bukan** di subfolder `namaproyek`).
3. Pastikan struktur: `public_html/demo-namaproyek/{app,config,public,...}`.

## Langkah 4 — Buat database
1. hPanel → **Databases → MySQL Databases**.
2. Buat **DB baru** (mis. `user_demo1`) + **user baru** + beri akses (biasanya ALL / semua privilege).
3. Catat nama DB, user, password.

## Langkah 5 — Isi `.env` proyek
1. Di root proyek, pastikan `.env` ada (jika belum, salin dari `.env.example` proyek tersebut).
2. Isi minimal:
   ```ini
   APP_NAME=Demo Proyek
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=<GENERATE BARU — jangan pakai punya proyek lain>
   APP_URL=https://demo-namaproyek.domain.com

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=user_demo1
   DB_USERNAME=user_demo1
   DB_PASSWORD=<password DB demo>

   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=true
   QUEUE_CONNECTION=database
   CACHE_STORE=database
   ```
3. Generate key: jika ada SSH, jalankan `php artisan key:generate`; tanpa SSH, generate key via
   `php -r "echo base64_encode(random_bytes(32));"` lalu tempel ke `APP_KEY` sebagai
   `base64:<hasil>`.
4. Isi konfigurasi lain sesuai kebutuhan proyek (email, dsb.) — **jangan menyalin dari proyek lain**.

## Langkah 6 — Migrasi & seed
- Dengan SSH Hostinger (disarankan):
  ```bash
  php artisan migrate --force
  php artisan db:seed --force   # bila butuh data contoh
  php artisan storage:link
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```
- **Tanpa SSH**: jalankan langkah artisan via cara alternatif sesuai penyedia (atau lakukan
  import DB manual: export `.sql` dari lokal → import lewat phpMyAdmin — khusus jika struktur sudah dibuat).

## Langkah 7 — `.htaccess` root (wajib)
- Letakkan di root proyek (folder subdomain) — lihat template:
  `htaccess-production.txt` (dari folder `deploy/`).
- Sesuaikan komentar **Force HTTPS** bila SSL aktif.
- Pastikan akses ke `.env`, `vendor`, `storage` diblokir.

## Langkah 8 — PHP version & izin
1. hPanel → **PHP → PHP Version / MultiPHP** → set folder subdomain ke **8.3** (atau sesuai proyek).
2. Pastikan `storage/` dan `bootstrap/cache/` writable (File Manager → Permission, mis. 755/775 sesuai keperluan).

## Langkah 9 — Tes
1. Buka `https://demo-namaproyek.domain.com` → harus tampil aplikasi.
2. Tes halaman utama, login (jika ada), dan fitur inti demo.
3. Pastikan tidak ada error di `storage/logs/laravel.log`.

## Langkah 10 — Hubungkan ke Nexfolio
1. Login Nexfolio → **Kelola Produk** → Edit produk yang sesuai.
2. Isi **Demo URL** = URL subdomain demo (`https://demo-namaproyek.domain.com`).
3. Badge **"Coba Demo"** & tombol **"Akses Demo Gratis"** otomatis muncul di Beranda/detail produk.

---

## Catatan Kapasitas
- **Kuota disk 17,44 GB**: 1 Laravel demo ±100–300MB. Hemat: tanpa `node_modules`, log dibersihkan.
- **Jumlah DB**: cek limit paket di hPanel (umumnya ±10) — 1 demo = 1 DB.
- **Keamanan demo**: jangan pakai data/kredensial asli; set `APP_DEBUG=false`.
