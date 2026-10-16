# Sensasi Ketan Susu — Website UMKM

Website Next.js dengan katalog, keranjang, checkout, pilihan jasa pengiriman lokal, WhatsApp, dan dashboard pengelolaan dasar.

## Fitur yang tersedia
- Desain responsif bernuansa cokelat kopi, krem susu, dan emas lembut.
- Katalog menu awal:
  - Ketan Susu Keju Original — Rp10.000
  - Ketan Susu Cokelat — Rp12.000
- Keranjang dan checkout.
- Pilihan beberapa jasa pengiriman lokal.
- Ongkir manual bila tarif belum dikonfirmasi.
- Tombol WhatsApp admin (nomor awal: 08985751300).
- Dashboard demo untuk mengedit produk, jasa antar, dan pengaturan.
- Supabase client dan skema database awal.

## Penting sebelum produksi
Versi yang disertakan adalah fondasi aplikasi. Dashboard admin saat ini memakai mode demo tanpa autentikasi produksi; kode admin demo yang dimasukkan hanya membuka panel pada sesi/browser, bukan keamanan sungguhan. Jangan mempublikasikan dashboard ini untuk penggunaan nyata sebelum autentikasi Supabase dan API server yang aman ditambahkan.

Pembuatan pesanan ke Supabase dari frontend memerlukan endpoint server-side sebelum produksi. Jangan membuka kebijakan insert/update/delete publik untuk tabel sensitif. `supabase/schema.sql` sengaja tidak membuat kebijakan tulis publik yang tidak aman. Hubungkan alur pemesanan ke API route server yang memvalidasi harga, stok, tarif, total, dan membatasi spam.

## Menjalankan secara lokal
1. Instal Node.js versi LTS.
2. Ekstrak ZIP.
3. Di folder proyek, jalankan:
   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```
4. Buka alamat lokal yang ditampilkan Next.js.

Tanpa Supabase, katalog dan perubahan admin tersimpan di browser lokal (`localStorage`) sebagai mode demo. Data tidak otomatis tersinkron antarperangkat.

## Mengaktifkan Supabase
1. Buat proyek di Supabase.
2. Buka SQL Editor dan jalankan `supabase/schema.sql`.
3. Salin Project URL dan anon/public key ke `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
4. Restart server development.
5. Sebelum produksi, implementasikan autentikasi admin, server-side API untuk perubahan admin dan pesanan, kebijakan RLS berbasis role, dan storage bucket untuk gambar produk.

## Deployment
Deploy ke Vercel atau hosting Next.js lain. Tambahkan environment variables di pengaturan hosting. Pastikan konfigurasi keamanan dan server-side API sudah selesai sebelum menerima pesanan sungguhan.

## Catatan gambar
Gambar contoh memakai URL Unsplash. Ganti dengan foto produk asli milik usaha untuk tampilan yang akurat dan lebih kuat secara komersial.
