
CREATE OR REPLACE FUNCTION public.place_order(
  p_shipping_address jsonb,
  p_courier text,
  p_shipping_cost numeric,
  p_payment_method text,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, order_number text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_total numeric;
  r record;
  v_price numeric;
  v_stock int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock cart rows
  PERFORM 1 FROM public.cart_items WHERE user_id = v_user FOR UPDATE;

  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Validate stock and compute subtotal
  FOR r IN
    SELECT ci.product_id, ci.size, ci.quantity,
           p.name, p.price, p.discount_price, p.thumbnail_url
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = v_user
  LOOP
    SELECT stock INTO v_stock FROM public.product_sizes
      WHERE product_id = r.product_id AND size = r.size FOR UPDATE;
    IF v_stock IS NULL OR v_stock < r.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % size %', r.name, r.size;
    END IF;
    v_price := COALESCE(r.discount_price, r.price);
    v_subtotal := v_subtotal + (v_price * r.quantity);
  END LOOP;

  v_total := v_subtotal + COALESCE(p_shipping_cost, 0);

  INSERT INTO public.orders (
    user_id, status, subtotal, shipping_cost, total,
    courier, payment_method, shipping_address, notes, deadline_at
  ) VALUES (
    v_user, 'awaiting_payment', v_subtotal, COALESCE(p_shipping_cost, 0), v_total,
    p_courier, p_payment_method, p_shipping_address, p_notes, now() + interval '24 hours'
  ) RETURNING id, public.orders.order_number INTO v_order_id, v_order_number;

  -- Snapshot items + decrement stock
  FOR r IN
    SELECT ci.product_id, ci.size, ci.quantity,
           p.name, p.price, p.discount_price, p.thumbnail_url
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = v_user
  LOOP
    v_price := COALESCE(r.discount_price, r.price);
    INSERT INTO public.order_items (order_id, product_id, name, size, quantity, price, thumbnail_url)
    VALUES (v_order_id, r.product_id, r.name, r.size, r.quantity, v_price, r.thumbnail_url);

    UPDATE public.product_sizes
      SET stock = stock - r.quantity
      WHERE product_id = r.product_id AND size = r.size;
  END LOOP;

  DELETE FROM public.cart_items WHERE user_id = v_user;

  -- Log initial status
  INSERT INTO public.order_status_history (order_id, status, changed_by)
  VALUES (v_order_id, 'awaiting_payment', v_user);

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, numeric, text, text) TO authenticated;

-- Mark payment proof submitted helper: set order status to awaiting_verification
CREATE OR REPLACE FUNCTION public.submit_payment_proof(p_order_id uuid, p_file_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  INSERT INTO public.payment_proofs (order_id, file_url, status) VALUES (p_order_id, p_file_url, 'pending');
  UPDATE public.orders SET status = 'awaiting_verification', updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_status_history (order_id, status, changed_by, note)
  VALUES (p_order_id, 'awaiting_verification', v_user, 'Bukti pembayaran diunggah');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text) TO authenticated;
