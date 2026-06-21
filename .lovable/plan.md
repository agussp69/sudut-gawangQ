## Iterasi 2 — Customer Flow End-to-End

Fokus: melengkapi alur pelanggan dari keranjang sampai pelacakan pesanan, plus profil & alamat. Admin panel ditunda ke iterasi 3.

### 1. Keranjang (`/cart`) — protected
- Server fn `getCart` (requireSupabaseAuth) → join `cart_items` + `products` + `product_sizes` (cek stok).
- UI: tabel item (gambar, nama, ukuran, harga, qty stepper, hapus), ringkasan (subtotal, estimasi ongkir placeholder, total), tombol "Lanjut ke Checkout".
- Mutasi: `updateCartItem`, `removeCartItem`, `clearCart`.
- Badge jumlah item di Navbar (realtime via query invalidation setelah add-to-cart).
- Empty state dengan CTA ke `/shop`.

### 2. Alamat Pengiriman (`/akun/alamat`) — protected
- CRUD `addresses` (label, penerima, telp, provinsi, kota, kecamatan, kode pos, alamat, catatan, is_default).
- Dipakai di checkout sebagai pilihan alamat tersimpan + form alamat baru.

### 3. Checkout (`/checkout`) — protected, multi-step
Step 1 — Alamat: pilih alamat tersimpan / tambah baru.
Step 2 — Pengiriman: pilih kurir (JNE Reg / J&T / SiCepat / AnterAja) + tarif flat per kurir (hard-coded di iterasi ini, gateway tarif real iterasi berikutnya).
Step 3 — Pembayaran: pilih bank (BCA, Mandiri, BNI) — info rekening ditampilkan.
Step 4 — Review & Place Order: ringkasan item, alamat, kurir, total. Tombol "Buat Pesanan".

Server fn `createOrder` (requireSupabaseAuth):
- Validasi stok per item.
- Snapshot harga & nama produk ke `order_items`.
- Insert `orders` (status `awaiting_payment`, `deadline_at = now()+24h`, shipping_address snapshot jsonb, payment_method).
- Kurangi stok (`product_sizes.stock`).
- Kosongkan `cart_items` user.
- Return `order_number`.
- Redirect ke `/pesanan/$orderNumber`.

### 4. Detail Pesanan & Upload Bukti (`/pesanan/$orderNumber`) — protected
- Server fn `getOrder` (owner-only via RLS).
- Tampilan: nomor order, status badge, countdown deadline pembayaran, ringkasan item, alamat, total, info rekening tujuan.
- Komponen `UploadProof`: input file (jpg/png/pdf, max 2MB) → upload ke bucket `payment-proofs` (path `{user_id}/{order_id}/{timestamp}.ext`) → insert `payment_proofs` → update `orders.status = 'awaiting_verification'`.
- Tampilkan bukti yang sudah diupload + status (pending / rejected dengan alasan / approved).
- Timeline status visual (Menunggu Pembayaran → Verifikasi → Diproses → Dikemas → Dikirim → Selesai) dari `order_status_history`.
- Jika `shipments` ada: tampilkan kurir + nomor resi + tombol "Lacak Resi" (link eksternal).

### 5. Riwayat Pesanan (`/akun/pesanan`) — protected
- List semua order user (terbaru dulu) dengan filter status (tab: Semua, Menunggu Bayar, Diproses, Dikirim, Selesai).
- Card: order_number, tanggal, total, status badge, thumbnail item, CTA "Lihat Detail".

### 6. Profil (`/akun/profil`) — protected
- Edit `full_name`, `phone`, `avatar_url` (upload ke `product-images` bucket folder `avatars/` atau bucket baru `avatars` — pakai bucket baru publik).
- Ganti password via `supabase.auth.updateUser({ password })`.

### 7. Wishlist (`/akun/wishlist`) — protected
- List produk dari `wishlist` join `products`. Hapus item, pindah ke cart.
- Tombol heart di ProductCard & detail produk → toggle wishlist (insert/delete).

### 8. Layout Akun
- Pathless route `_authenticated/akun.tsx` dengan sidebar (Profil, Alamat, Pesanan, Wishlist, Logout) + `<Outlet />`.
- Semua route akun ada di bawah `_authenticated/`.

### 9. Storage buckets (migration)
- `payment-proofs` — private. RLS: user bisa insert/select file di folder `{auth.uid()}/`, admin bisa select semua.
- `avatars` — public. RLS: user insert/update/delete di folder `{auth.uid()}/`.

### 10. Komponen pendukung
- `OrderStatusBadge`, `OrderTimeline`, `QtyStepper`, `AddressForm`, `AddressCard`, `BankInfoCard`, `CountdownTimer`, `FileDropzone`.
- Update Navbar: badge cart count, dropdown user dengan link Profil / Pesanan / Wishlist / Logout.

### 11. SEO & UX
- Semua route akun: `noindex` via `head()`.
- Toast sukses/error konsisten via `sonner`.
- Optimistic update untuk qty cart & wishlist toggle.
- Loading skeleton untuk semua list.

### Di luar scope iterasi 2 (ditunda)
- Admin panel (Dashboard, manajemen produk/kategori/brand, verifikasi pembayaran, input resi, manajemen user, banner, voucher, laporan).
- Voucher/diskon logic.
- Review system.
- Tarif kurir real-time (RajaOngkir/Biteship).
- Notifikasi email & in-app.
- Payment gateway.

Setujui untuk eksekusi iterasi 2?
