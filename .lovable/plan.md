## Sudut Gawang — Iterasi 1: Fondasi (Auth + DB + Shop & Detail Produk)

Scope iterasi pertama setelah Lovable Cloud aktif. Iterasi berikutnya: Cart → Checkout → Upload Bukti → Tracking → Profil → Admin Panel.

### 1. Aktifkan Lovable Cloud
Provisioning otomatis: Postgres + Auth + Storage. Tidak ada konfigurasi manual.

### 2. Skema Database (migration penuh, siap untuk semua iterasi)
Bikin semua tabel sekaligus agar tidak refactor di iterasi berikutnya, tapi UI iterasi 1 hanya pakai sebagian.

Tabel:
- `profiles` — id (FK auth.users), full_name, phone, avatar_url
- `user_roles` + enum `app_role` (`admin`, `customer`) + fungsi `has_role()` (SECURITY DEFINER) — pola anti-recursion sesuai standar
- `brands` — id, name, slug
- `categories` — id, name, slug (Klub, Timnas, Vintage, Training Kit, Jaket, New Arrival)
- `products` — id, sku, name, slug, brand_id, category_id, club, country, season, description, price (numeric), discount_price, condition (`new`/`vintage`), badge (`new`/`vintage`/`limited`), is_published, thumbnail_url, created_at
- `product_images` — product_id, url, sort_order
- `product_sizes` — product_id, size (S/M/L/XL/XXL), stock
- `addresses` — user_id, label, recipient, phone, province, city, district, postal_code, address, notes
- `wishlist` — user_id, product_id (unique)
- `cart_items` — user_id, product_id, size, quantity
- `orders` — id, order_number (unik, format `SG-YYYYMMDD-XXXXXX`), user_id, subtotal, shipping_cost, total, status (enum: `awaiting_payment`, `awaiting_verification`, `paid`, `processing`, `packed`, `shipped`, `completed`, `rejected`), courier, shipping_address (snapshot jsonb), payment_method (bank), created_at, deadline_at
- `order_items` — order_id, product_id, size, quantity, price (snapshot), name (snapshot)
- `payment_proofs` — order_id, file_url, uploaded_at, status, rejection_reason
- `shipments` — order_id, courier, tracking_number, shipped_at
- `order_status_history` — order_id, status, note, changed_by, changed_at
- `vouchers`, `banners`, `reviews`, `notifications` — struktur dasar (dipakai iterasi lanjutan)

RLS untuk semua tabel + GRANT eksplisit ke `authenticated`/`anon`/`service_role` sesuai aturan. `products`, `product_images`, `product_sizes`, `brands`, `categories`, `banners` → SELECT publik (`anon`). Tabel milik user → kebijakan `auth.uid()`. Tabel admin-only → `has_role(auth.uid(), 'admin')`.

Trigger `handle_new_user` membuat row di `profiles` otomatis saat signup. Trigger `set_order_number` mengisi `order_number` unik. Trigger `audit_order_status` mencatat ke `order_status_history`.

Storage bucket: `payment-proofs` (private, RLS), `product-images` (public).

Seed data: 6 brand, 6 kategori, 12 produk contoh (campur club/national/vintage) dengan gambar yang sudah ada di `src/assets/`.

### 3. Auth (Email + Password)
Route `src/routes/auth.tsx` — tab Login / Register, validasi Zod. `signUp` dengan `emailRedirectTo: window.location.origin`. Layout terproteksi pakai `src/routes/_authenticated/route.tsx` (managed integration). Hook `useAuth` + listener `onAuthStateChange` di `__root.tsx`. Tombol Login di Navbar → `/auth`; jika sudah login tampilkan menu profil + Logout.

Halaman Lupa Password: `/forgot-password` dan `/reset-password` (mandatory pair).

### 4. Halaman Shop (`/shop`)
- Data nyata dari `products` via `createServerFn` dengan publishable client (publik).
- URL state via `validateSearch`: `q`, `category`, `brand`, `condition`, `min`, `max`, `sort`, `page`.
- Layout: sidebar filter (Kategori, Brand, Kondisi, Range Harga) + grid produk 3–4 kolom + sort dropdown + pagination + skeleton + empty state.
- Search bar dengan debounce → update URL.
- Card produk: thumbnail, badge, nama, klub, harga, tombol Wishlist & Tambah ke Keranjang.

### 5. Halaman Detail Produk (`/produk/$slug`)
- Loader fetch produk + images + sizes + related (kategori sama).
- Layout 2 kolom: gallery (thumbnail kiri, main image dengan zoom on hover) | info (nama, klub, musim, harga, badge "Original", pilih ukuran dengan stok, qty, Wishlist, Tambah ke Keranjang, panduan ukuran via Dialog, deskripsi, info pengiriman).
- Section Produk Terkait di bawah.
- Breadcrumb di atas.
- `head()` per produk (title, og:title, og:image dari thumbnail).

### 6. Komponen pendukung
- `Breadcrumb`, `Pagination`, `SkeletonProductCard`, `EmptyState`, `ProductFilters` (Sheet di mobile).
- Toast pakai `sonner` (sudah ada).
- Update `Navbar`: link Shop/Auth/Profile dinamis sesuai sesi.

### 7. SEO & Aksesibilitas
- `head()` per route (title, description, og, canonical).
- Single H1 per halaman, alt text di semua `<img>`, `loading="lazy"` kecuali above-the-fold.

### Di luar scope iterasi 1 (akan dikerjakan setelah disetujui)
Cart page, Wishlist page, Checkout flow, Upload bukti transfer, Tracking, Riwayat, Profil, Address book, Admin panel (Dashboard/Produk/Pesanan/Verifikasi Pembayaran/Resi/Pelanggan/Banner/Voucher/Laporan), notifikasi, voucher logic, review system.

Setujui untuk saya mulai eksekusi iterasi ini?
