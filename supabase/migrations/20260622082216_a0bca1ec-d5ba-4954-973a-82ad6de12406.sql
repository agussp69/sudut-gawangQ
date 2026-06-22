
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_gateway text,
  ADD COLUMN IF NOT EXISTS gateway_order_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text,
  ADD COLUMN IF NOT EXISTS gateway_payment_type text,
  ADD COLUMN IF NOT EXISTS gateway_status_raw jsonb,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_gateway_order_id ON public.orders(gateway_order_id);
