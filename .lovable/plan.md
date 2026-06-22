# Iterasi 5 — Payment Gateway & Email Notifikasi

Fokus: otomatisasi pembayaran (tanpa upload bukti manual) + email transaksional supaya customer tidak perlu refresh aplikasi untuk tahu status pesanan.

## 1. Payment Gateway — Midtrans Snap

Dipilih Midtrans (bukan Xendit) karena: dukungan QRIS/VA/e-wallet lengkap untuk pasar ID, Snap.js drop-in checkout (cepat diintegrasikan), sandbox gratis untuk testing.

**Alur baru di checkout:**
1. User pilih metode "Pembayaran Online (Midtrans)" → tetap pakai `place_order` (status awal `awaiting_payment`).
2. Server fn `create_midtrans_transaction(order_id)` memanggil Midtrans Snap API → balikin `snap_token` + `redirect_url`.
3. Frontend buka `window.snap.pay(token, { onSuccess, onPending, onError, onClose })`.
4. Webhook publik `/api/public/midtrans/notification` terima status dari Midtrans → verifikasi signature SHA512 → update `orders.status` (`processing` / `awaiting_payment` / `cancelled`) via `supabaseAdmin`.

**Metode pembayaran manual (transfer bank + upload bukti) tetap dipertahankan** sebagai opsi alternatif — user pilih di checkout.

**Perubahan DB (1 migration):**
- Tambah kolom `orders.payment_gateway` (text), `orders.gateway_order_id` (text, unik), `orders.gateway_transaction_id`, `orders.gateway_payment_type`, `orders.gateway_status_raw` (jsonb), `orders.paid_at` (timestamptz).
- RPC `admin_force_sync_payment(p_order_id)` untuk admin yang mau manual re-check (opsional).

**Secrets yang diminta ke user:**
- `MIDTRANS_SERVER_KEY` (sandbox dulu)
- `MIDTRANS_CLIENT_KEY` (publishable, boleh di-env `VITE_`)
- `MIDTRANS_IS_PRODUCTION` ("false" untuk sandbox)

**File baru:**
- `src/lib/midtrans.functions.ts` — server fn `createSnapTransaction` (protected, `requireSupabaseAuth`).
- `src/routes/api/public/midtrans.notification.ts` — webhook (verifikasi signature, no auth, no PII di response).
- `src/components/checkout/MidtransPaymentButton.tsx` — load Snap.js dari CDN sesuai mode sandbox/production.
- Edit `src/routes/_authenticated/checkout.tsx` — tambah opsi metode "Online Payment".
- Edit `src/routes/_authenticated/pesanan.$orderNumber.tsx` — kalau order pakai gateway & belum paid, tampilkan tombol "Bayar Sekarang" (re-open Snap).

## 2. Email Notifikasi (Lovable Emails)

Tujuan: email otomatis untuk event penting agar customer tidak harus buka app.

**Event yang dikirim:**
- Order confirmed (status → `processing` / `paid`).
- Order shipped (status → `shipped`, include resi + courier).
- Order completed.
- Payment proof rejected (status balik ke `awaiting_payment`).

**Mekanisme:**
- DB trigger `email_on_order_status_change` AFTER UPDATE pada `orders` → panggil `pg_net` HTTP ke server route `/api/public/email/order-status` dengan signature HMAC (`EMAIL_HOOK_SECRET`).
- Server route render React Email template via `@react-email/components`, enqueue ke `auth_emails`/`transactional_emails` pakai `enqueue_email` RPC (sudah di-setup oleh `email_domain--setup_email_infra`).

**Prasyarat (akan dijalankan di awal iterasi):**
- `email_domain--check_email_domain_status` → kalau belum ada, tampilkan dialog setup domain ke user.
- `email_domain--setup_email_infra` setelah domain siap.

**File baru:**
- `src/emails/OrderStatusEmail.tsx` — React Email template.
- `src/routes/api/public/email.order-status.ts` — HMAC-verified enqueue endpoint.
- Migration untuk trigger + secret `EMAIL_HOOK_SECRET`.

**User-facing setting:** `profiles.email_notifications_enabled` (boolean default true) + toggle di `/akun/profil`.

## Out of scope (tunda iterasi berikutnya)
- WhatsApp notifikasi (butuh provider berbayar seperti Fonnte/Wablas).
- Real-time courier rates (RajaOngkir API).
- Recurring subscription / membership.
- Refund otomatis via Midtrans.

## Yang dibutuhkan dari user sebelum mulai
1. Konfirmasi pilih Midtrans (bukan Xendit/Stripe).
2. Akun Midtrans sandbox sudah dibuat di https://dashboard.sandbox.midtrans.com → siap kasih Server Key + Client Key.
3. Domain email (kalau belum) — saya akan munculkan dialog setup.

Setelah disetujui, urutan eksekusi: (1) setup email domain → (2) migration DB → (3) minta secret Midtrans → (4) implementasi server fn + webhook → (5) UI checkout + button bayar → (6) email templates + trigger.