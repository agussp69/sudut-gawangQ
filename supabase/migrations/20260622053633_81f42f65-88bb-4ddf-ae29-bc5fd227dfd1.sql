
-- Admin: verify payment
CREATE OR REPLACE FUNCTION public.admin_verify_payment(p_order_id uuid, p_proof_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.payment_proofs SET status='approved', verified_at=now(), verified_by=v_user WHERE id=p_proof_id AND order_id=p_order_id;
  UPDATE public.orders SET status='processing', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'processing',v_user,'Pembayaran diverifikasi');
END; $$;

-- Admin: reject payment
CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_order_id uuid, p_proof_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.payment_proofs SET status='rejected', rejection_reason=p_reason, verified_at=now(), verified_by=v_user WHERE id=p_proof_id AND order_id=p_order_id;
  UPDATE public.orders SET status='awaiting_payment', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'awaiting_payment',v_user,COALESCE('Bukti ditolak: '||p_reason,'Bukti ditolak'));
END; $$;

-- Admin: ship order
CREATE OR REPLACE FUNCTION public.admin_ship_order(p_order_id uuid, p_courier text, p_tracking text)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.shipments(order_id,courier,tracking_number,shipped_at)
  VALUES (p_order_id,p_courier,p_tracking,now())
  ON CONFLICT (order_id) DO UPDATE SET courier=EXCLUDED.courier, tracking_number=EXCLUDED.tracking_number, shipped_at=now();
  UPDATE public.orders SET status='shipped', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'shipped',v_user,'Dikirim via '||p_courier||' resi '||p_tracking);
END; $$;

-- Admin: mark delivered
CREATE OR REPLACE FUNCTION public.admin_mark_delivered(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.orders SET status='delivered', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'delivered',v_user,'Pesanan selesai');
END; $$;

-- Admin: cancel order
CREATE OR REPLACE FUNCTION public.admin_cancel_order(p_order_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); r record;
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  -- restore stock
  FOR r IN SELECT product_id, size, quantity FROM public.order_items WHERE order_id=p_order_id LOOP
    UPDATE public.product_sizes SET stock = stock + r.quantity WHERE product_id=r.product_id AND size=r.size;
  END LOOP;
  UPDATE public.orders SET status='cancelled', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'cancelled',v_user,COALESCE('Dibatalkan: '||p_reason,'Dibatalkan'));
END; $$;

-- Ensure shipments has unique constraint per order
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='shipments_order_id_key') THEN
    ALTER TABLE public.shipments ADD CONSTRAINT shipments_order_id_key UNIQUE (order_id);
  END IF;
END $$;

-- Bootstrap: claim admin role (only works if no admin exists yet)
CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    RAISE EXCEPTION 'Admin already exists';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_user, 'admin') ON CONFLICT DO NOTHING;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ship_order(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_order(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated;
