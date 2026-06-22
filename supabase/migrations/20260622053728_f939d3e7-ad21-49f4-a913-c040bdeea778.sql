
CREATE OR REPLACE FUNCTION public.admin_mark_delivered(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_user, 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.orders SET status='completed', updated_at=now() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,status,changed_by,note) VALUES (p_order_id,'completed',v_user,'Pesanan selesai');
END; $$;
