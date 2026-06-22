
-- Iterasi 4: voucher columns + RPCs + notification triggers + review constraint

-- 1. Orders: voucher columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS voucher_id uuid REFERENCES public.vouchers(id),
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

-- 2. Reviews: one review per (user, product); add updated_at
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_user_product_uniq') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_product_uniq UNIQUE (user_id, product_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reviews_rating_chk') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_chk CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

-- 3. RPC: apply_voucher (validation only, returns discount)
CREATE OR REPLACE FUNCTION public.apply_voucher(p_code text, p_subtotal numeric)
RETURNS TABLE(voucher_id uuid, code text, discount numeric)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE v public.vouchers%ROWTYPE; v_discount numeric := 0;
BEGIN
  SELECT * INTO v FROM public.vouchers WHERE upper(code) = upper(p_code) AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kode voucher tidak ditemukan'; END IF;
  IF v.valid_from IS NOT NULL AND now() < v.valid_from THEN RAISE EXCEPTION 'Voucher belum berlaku'; END IF;
  IF v.valid_until IS NOT NULL AND now() > v.valid_until THEN RAISE EXCEPTION 'Voucher kadaluarsa'; END IF;
  IF v.quota IS NOT NULL AND v.used_count >= v.quota THEN RAISE EXCEPTION 'Kuota voucher habis'; END IF;
  IF v.min_purchase IS NOT NULL AND p_subtotal < v.min_purchase THEN
    RAISE EXCEPTION 'Minimum belanja Rp%', v.min_purchase;
  END IF;
  IF v.percent_off IS NOT NULL AND v.percent_off > 0 THEN
    v_discount := round(p_subtotal * v.percent_off / 100.0);
  ELSIF v.amount_off IS NOT NULL AND v.amount_off > 0 THEN
    v_discount := v.amount_off;
  END IF;
  IF v_discount > p_subtotal THEN v_discount := p_subtotal; END IF;
  RETURN QUERY SELECT v.id, v.code, v_discount;
END; $$;

-- 4. RPC: place_order (revised, with voucher)
CREATE OR REPLACE FUNCTION public.place_order(
  p_shipping_address jsonb,
  p_courier text,
  p_shipping_cost numeric,
  p_payment_method text,
  p_notes text DEFAULT NULL,
  p_voucher_code text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, order_number text)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_total numeric;
  v_discount numeric := 0;
  v_voucher_id uuid;
  r record;
  v_price numeric;
  v_stock int;
  vch public.vouchers%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  PERFORM 1 FROM public.cart_items WHERE user_id = v_user FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOR r IN
    SELECT ci.product_id, ci.size, ci.quantity, p.name, p.price, p.discount_price, p.thumbnail_url
    FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = v_user
  LOOP
    SELECT stock INTO v_stock FROM public.product_sizes
      WHERE product_id = r.product_id AND size = r.size FOR UPDATE;
    IF v_stock IS NULL OR v_stock < r.quantity THEN
      RAISE EXCEPTION 'Stok tidak cukup untuk % ukuran %', r.name, r.size;
    END IF;
    v_price := COALESCE(r.discount_price, r.price);
    v_subtotal := v_subtotal + (v_price * r.quantity);
  END LOOP;

  IF p_voucher_code IS NOT NULL AND length(trim(p_voucher_code)) > 0 THEN
    SELECT * INTO vch FROM public.vouchers
      WHERE upper(code) = upper(p_voucher_code) AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Kode voucher tidak ditemukan'; END IF;
    IF vch.valid_from IS NOT NULL AND now() < vch.valid_from THEN RAISE EXCEPTION 'Voucher belum berlaku'; END IF;
    IF vch.valid_until IS NOT NULL AND now() > vch.valid_until THEN RAISE EXCEPTION 'Voucher kadaluarsa'; END IF;
    IF vch.quota IS NOT NULL AND vch.used_count >= vch.quota THEN RAISE EXCEPTION 'Kuota voucher habis'; END IF;
    IF vch.min_purchase IS NOT NULL AND v_subtotal < vch.min_purchase THEN
      RAISE EXCEPTION 'Minimum belanja Rp%', vch.min_purchase;
    END IF;
    IF vch.percent_off IS NOT NULL AND vch.percent_off > 0 THEN
      v_discount := round(v_subtotal * vch.percent_off / 100.0);
    ELSIF vch.amount_off IS NOT NULL AND vch.amount_off > 0 THEN
      v_discount := vch.amount_off;
    END IF;
    IF v_discount > v_subtotal THEN v_discount := v_subtotal; END IF;
    v_voucher_id := vch.id;
    UPDATE public.vouchers SET used_count = used_count + 1 WHERE id = vch.id;
  END IF;

  v_total := v_subtotal + COALESCE(p_shipping_cost, 0) - v_discount;

  INSERT INTO public.orders (
    user_id, status, subtotal, shipping_cost, total,
    courier, payment_method, shipping_address, notes, deadline_at,
    voucher_id, voucher_code, discount_amount
  ) VALUES (
    v_user, 'awaiting_payment', v_subtotal, COALESCE(p_shipping_cost, 0), v_total,
    p_courier, p_payment_method, p_shipping_address, p_notes, now() + interval '24 hours',
    v_voucher_id, CASE WHEN v_voucher_id IS NOT NULL THEN vch.code END, v_discount
  ) RETURNING id, public.orders.order_number INTO v_order_id, v_order_number;

  FOR r IN
    SELECT ci.product_id, ci.size, ci.quantity, p.name, p.price, p.discount_price, p.thumbnail_url
    FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = v_user
  LOOP
    v_price := COALESCE(r.discount_price, r.price);
    INSERT INTO public.order_items (order_id, product_id, name, size, quantity, price, thumbnail_url)
    VALUES (v_order_id, r.product_id, r.name, r.size, r.quantity, v_price, r.thumbnail_url);
    UPDATE public.product_sizes SET stock = stock - r.quantity
      WHERE product_id = r.product_id AND size = r.size;
  END LOOP;

  DELETE FROM public.cart_items WHERE user_id = v_user;

  INSERT INTO public.order_status_history (order_id, status, changed_by)
  VALUES (v_order_id, 'awaiting_payment', v_user);

  RETURN QUERY SELECT v_order_id, v_order_number;
END; $$;

-- 5. Trigger: notify user on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text; v_body text; v_link text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN RETURN NEW; END IF;
  v_link := '/pesanan/' || NEW.order_number;
  CASE NEW.status::text
    WHEN 'awaiting_verification' THEN v_title := 'Bukti pembayaran diterima';
                                      v_body  := 'Pesanan ' || NEW.order_number || ' sedang diverifikasi.';
    WHEN 'processing'            THEN v_title := 'Pembayaran diverifikasi';
                                      v_body  := 'Pesanan ' || NEW.order_number || ' sedang diproses.';
    WHEN 'shipped'               THEN v_title := 'Pesanan dikirim';
                                      v_body  := 'Pesanan ' || NEW.order_number || ' telah dikirim.';
    WHEN 'completed'             THEN v_title := 'Pesanan selesai';
                                      v_body  := 'Terima kasih! Pesanan ' || NEW.order_number || ' telah selesai.';
    WHEN 'cancelled'             THEN v_title := 'Pesanan dibatalkan';
                                      v_body  := 'Pesanan ' || NEW.order_number || ' dibatalkan.';
    ELSE RETURN NEW;
  END CASE;
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (NEW.user_id, v_title, v_body, v_link);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;
CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- 6. Trigger: notify admins when new payment proof uploaded
CREATE OR REPLACE FUNCTION public.notify_admins_new_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order_number text; v_admin uuid;
BEGIN
  SELECT order_number INTO v_order_number FROM public.orders WHERE id = NEW.order_id;
  FOR v_admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (v_admin, 'Bukti pembayaran baru',
            'Pesanan ' || COALESCE(v_order_number,'') || ' menunggu verifikasi.',
            '/admin/pesanan/' || COALESCE(v_order_number,''));
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_admins_proof ON public.payment_proofs;
CREATE TRIGGER trg_notify_admins_proof
  AFTER INSERT ON public.payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_proof();

-- 7. Admin moderation policy for reviews (delete any review)
DROP POLICY IF EXISTS reviews_admin_moderate ON public.reviews;
CREATE POLICY reviews_admin_moderate ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Allow anon read of active vouchers? No — keep authenticated only (already set).

-- 9. Grant for new RPCs
GRANT EXECUTE ON FUNCTION public.apply_voucher(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, numeric, text, text, text) TO authenticated;
