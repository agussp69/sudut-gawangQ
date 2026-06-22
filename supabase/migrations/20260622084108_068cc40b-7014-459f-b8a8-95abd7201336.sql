
-- 1) VOUCHERS: restrict SELECT to admins; make voucher RPCs SECURITY DEFINER so users can still apply codes
DROP POLICY IF EXISTS vouchers_read_active ON public.vouchers;
CREATE POLICY vouchers_admin_read ON public.vouchers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER FUNCTION public.apply_voucher(text, numeric) SECURITY DEFINER;
ALTER FUNCTION public.place_order(jsonb, text, numeric, text, text, text) SECURITY DEFINER;
ALTER FUNCTION public.place_order(jsonb, text, numeric, text, text) SECURITY DEFINER;

-- 2) STORAGE: payment-proofs DELETE/UPDATE policies (owner + admin)
CREATE POLICY "Users can update own payment proofs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own payment proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can manage payment proofs"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- 3) REALTIME: enable RLS on realtime.messages, only allow own notification topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own notif topics" ON realtime.messages;
CREATE POLICY "Users subscribe to own notif topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'notif-bell-' || auth.uid()::text
    OR realtime.topic() = 'notif-page-' || auth.uid()::text
  );

-- 4) FUNCTION EXECUTE GRANTS: revoke PUBLIC, grant only to intended roles

-- Trigger / internal functions: not callable via API
REVOKE ALL ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_new_proof() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;

-- has_role used by RLS policies internally; no need for API callers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- User-callable RPCs: authenticated only
REVOKE ALL ON FUNCTION public.submit_payment_proof(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_admin_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated;

REVOKE ALL ON FUNCTION public.apply_voucher(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_voucher(text, numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.place_order(jsonb, text, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, numeric, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.place_order(jsonb, text, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, numeric, text, text) TO authenticated;

-- Admin-only RPCs: still callable by authenticated (function body enforces has_role admin)
REVOKE ALL ON FUNCTION public.admin_reject_payment(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(uuid, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_mark_delivered(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_delivered(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_ship_order(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ship_order(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_cancel_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_verify_payment(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, uuid) TO authenticated;
