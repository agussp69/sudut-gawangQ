# Iterasi 4 — Voucher, Review, Banner & Notifikasi

Fokus: melengkapi fitur pendukung yang sudah punya tabel di DB (`vouchers`, `reviews`, `banners`, `notifications`) tapi belum punya UI. Payment gateway & email tetap ditunda.

## 1. Voucher / Diskon

**Admin (`/admin/voucher`)**
- List voucher (code, type, value, min order, usage limit, valid period, active).
- Form create/edit: kode, tipe (`percent` / `fixed`), nilai, min belanja, max diskon, kuota, periode mulai/akhir, status aktif.
- Aksi: aktif/nonaktif & hapus.

**Customer (checkout)**
- Field "Kode Voucher" di step Review checkout, tombol "Terapkan".
- RPC baru `apply_voucher(p_code, p_subtotal)` → return `{ voucher_id, discount }` atau error (kadaluarsa / min belanja / kuota habis).
- Tampilkan baris "Diskon" di ringkasan; total = subtotal + ongkir − diskon.

**RPC `place_order` (revisi)**
- Tambah param `p_voucher_code text` (opsional).
- Validasi & lock voucher (`FOR UPDATE`), hitung diskon, simpan `voucher_id` + `discount_amount` ke `orders`, increment `used_count`.

**Skema tambahan (jika belum ada)**
- Kolom `voucher_id`, `discount_amount` di `orders` — cek dulu, tambahkan via migration kalau belum ada.

## 2. Review Produk

**Customer**
- Di `/pesanan/$orderNumber` saat status `completed`: tombol "Beri Ulasan" per `order_item` yang belum di-review.
- Modal: rating 1–5 + komentar → insert `reviews` (RLS: user hanya boleh review produk dari order miliknya yang `completed`).
- Di `/produk/$slug`: tab/section "Ulasan" — list review (nama, avatar, rating, tanggal, komentar), rata-rata rating + total review di header produk.

**Admin (`/admin/ulasan`)**
- List semua review, filter rating, tombol hapus (moderasi).

## 3. Banner Manager

**Admin (`/admin/banner`)**
- CRUD banner (image_url, title, subtitle, link, position, sort_order, is_active, period).
- Preview banner saat edit.

**Public**
- `Hero` / section landing membaca banner aktif dari DB (server fn publik via publishable client + policy SELECT anon untuk `banners` aktif).
- Fallback ke hero statis jika kosong.

## 4. Notifikasi In-App

**Trigger (DB)**
- Trigger di `orders` (AFTER UPDATE OF status) → insert `notifications` untuk pemilik order dengan title + message sesuai status (pembayaran diverifikasi, dikirim + resi, selesai, ditolak, dibatalkan).
- Trigger di `payment_proofs` (AFTER INSERT) → insert notifikasi ke semua admin (loop `user_roles` role=admin) "Bukti pembayaran baru".

**UI**
- Bell icon di Navbar dengan badge unread count (realtime via Supabase channel ke `notifications` user).
- Dropdown: 10 notifikasi terbaru, klik → mark read + navigate ke link tujuan, tombol "Tandai semua dibaca".
- Halaman `/akun/notifikasi`: list lengkap, pagination sederhana.

## 5. Komponen pendukung
- `VoucherInput`, `RatingStars`, `ReviewList`, `ReviewForm`, `BannerForm`, `NotificationBell`, `NotificationItem`.

## Di luar scope (ditunda)
- Payment gateway (Midtrans/Xendit).
- Notifikasi email & WhatsApp.
- Tarif kurir real-time.
- Dashboard analitik lanjutan (grafik penjualan).

Setujui untuk eksekusi iterasi 4? Atau mau prioritaskan salah satu saja (misal hanya Voucher + Review)?
