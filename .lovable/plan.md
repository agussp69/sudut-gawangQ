# Realtime Notifikasi In-App

Mengaktifkan update langsung pada lonceng notifikasi (Navbar) dan halaman `/akun/notifikasi` tanpa perlu refresh.

## Perubahan

### 1. Database (migrasi)
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` agar perubahan INSERT/UPDATE pada `notifications` disiarkan.
- (Kebijakan RLS `notifications` sudah membatasi `user_id = auth.uid()`, jadi pelanggan hanya menerima notifikasinya sendiri — tidak perlu policy baru.)

### 2. Frontend
- **`src/components/account/NotificationBell.tsx`**: di dalam `useEffect`, buat channel `supabase.channel('notif-bell-{userId}')` yang mendengarkan `postgres_changes` event `INSERT`/`UPDATE` pada `public.notifications` dengan filter `user_id=eq.{userId}`. Saat ada event, `queryClient.invalidateQueries` untuk query notifikasi yang dipakai bell. Cleanup dengan `supabase.removeChannel`.
- **`src/routes/_authenticated/akun.notifikasi.tsx`**: pasang subscriber serupa dalam `useEffect`, invalidate query list notifikasi sehingga daftar + badge unread terupdate seketika ketika trigger DB `notify_order_status_change` / `notify_admins_new_proof` membuat row baru (misal admin verifikasi pembayaran → status pesanan berubah → notif muncul instan di akun pengguna).

## Yang Tidak Berubah
- Trigger notifikasi DB (`notify_order_status_change`, `notify_admins_new_proof`) sudah ada — tetap dipakai.
- Tidak ada perubahan UI/visual; hanya behavior live update.
- Tidak menyentuh email/WA.
