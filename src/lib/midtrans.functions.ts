import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function midtransBaseUrl(isProd: boolean) {
  return isProd ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

export const getMidtransPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    isProduction: (process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true",
  };
});

export const createSnapTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderNumber: string }) => {
    if (!input?.orderNumber || typeof input.orderNumber !== "string") {
      throw new Error("orderNumber is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not configured");
    const isProd = (process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";

    const { supabase, userId } = context;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", data.orderNumber)
      .eq("user_id", userId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) throw new Error("Pesanan tidak ditemukan");
    if (order.status !== "awaiting_payment") {
      throw new Error("Pesanan sudah tidak menunggu pembayaran");
    }

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("name, size, quantity, price")
      .eq("order_id", order.id);
    if (itemsErr) throw itemsErr;

    const itemDetails = (items ?? []).map((it, idx) => ({
      id: `item-${idx}`,
      price: Math.round(Number(it.price)),
      quantity: it.quantity,
      name: `${it.name} (${it.size})`.slice(0, 50),
    }));
    const itemsSubtotal = itemDetails.reduce((s, it) => s + it.price * it.quantity, 0);
    const grossAmount = Math.round(Number(order.total));
    const shipping = Math.round(Number(order.shipping_cost ?? 0));
    const discount = Math.round(Number(order.discount_amount ?? 0));
    const adjustment = grossAmount - itemsSubtotal;
    if (shipping > 0) itemDetails.push({ id: "shipping", price: shipping, quantity: 1, name: `Ongkir (${order.courier ?? "-"})` });
    if (discount > 0) itemDetails.push({ id: "discount", price: -discount, quantity: 1, name: `Diskon ${order.voucher_code ?? ""}`.trim() });
    const computed = itemDetails.reduce((s, it) => s + it.price * it.quantity, 0);
    if (computed !== grossAmount) {
      // rounding correction
      itemDetails.push({ id: "adjustment", price: grossAmount - computed, quantity: 1, name: "Penyesuaian" });
    }

    const addr = (order.shipping_address ?? {}) as Record<string, string>;
    const gatewayOrderId = `${order.order_number}-${Date.now().toString(36)}`;

    const body = {
      transaction_details: { order_id: gatewayOrderId, gross_amount: grossAmount },
      item_details: itemDetails,
      customer_details: {
        first_name: (addr.recipient ?? "Customer").slice(0, 50),
        phone: addr.phone ?? "",
        shipping_address: {
          first_name: (addr.recipient ?? "").slice(0, 50),
          phone: addr.phone ?? "",
          address: (addr.address ?? "").slice(0, 200),
          city: addr.city ?? "",
          postal_code: addr.postal_code ?? "",
          country_code: "IDN",
        },
      },
      callbacks: { finish: `${process.env.SITE_URL ?? ""}/pesanan/${order.order_number}` },
      expiry: { unit: "hour", duration: 24 },
    };

    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const res = await fetch(`${midtransBaseUrl(isProd)}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { token?: string; redirect_url?: string; error_messages?: string[] };
    if (!res.ok || !json.token) {
      const msg = json.error_messages?.join(", ") ?? `Midtrans error (${res.status})`;
      throw new Error(msg);
    }

    // Persist gateway info; use admin client to bypass column update RLS limitations
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        payment_gateway: "midtrans",
        gateway_order_id: gatewayOrderId,
      })
      .eq("id", order.id);

    return { token: json.token, redirectUrl: json.redirect_url ?? null, gatewayOrderId };
  });
