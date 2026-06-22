import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
};

function mapStatus(notif: MidtransNotification): { newStatus: string | null; paid: boolean; note: string } {
  const ts = notif.transaction_status;
  const fraud = notif.fraud_status ?? "accept";
  if ((ts === "capture" && fraud === "accept") || ts === "settlement") {
    return { newStatus: "processing", paid: true, note: `Pembayaran berhasil via ${notif.payment_type ?? "Midtrans"}` };
  }
  if (ts === "pending") {
    return { newStatus: "awaiting_payment", paid: false, note: "Menunggu pembayaran (Midtrans)" };
  }
  if (ts === "deny" || ts === "cancel" || ts === "expire" || ts === "failure") {
    return { newStatus: "cancelled", paid: false, note: `Pembayaran ${ts} (Midtrans)` };
  }
  return { newStatus: null, paid: false, note: ts };
}

export const Route = createFileRoute("/api/public/midtrans/notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) return new Response("Not configured", { status: 500 });

        let notif: MidtransNotification;
        try {
          notif = (await request.json()) as MidtransNotification;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const expected = createHash("sha512")
          .update(`${notif.order_id}${notif.status_code}${notif.gross_amount}${serverKey}`)
          .digest("hex");
        if (expected !== notif.signature_key) {
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .select("id, status, order_number")
          .eq("gateway_order_id", notif.order_id)
          .maybeSingle();
        if (error || !order) {
          return new Response("Order not found", { status: 404 });
        }

        const { newStatus, paid, note } = mapStatus(notif);

        const update: Record<string, unknown> = {
          gateway_transaction_id: notif.transaction_id ?? null,
          gateway_payment_type: notif.payment_type ?? null,
          gateway_status_raw: notif as unknown as Record<string, unknown>,
        };
        if (paid) update.paid_at = new Date().toISOString();

        // Avoid downgrading a completed/shipped order back to processing
        const lockedStatuses = ["shipped", "completed"];
        if (newStatus && !lockedStatuses.includes(order.status as string)) {
          // Only move forward; don't bounce paid -> awaiting_payment if already processing/paid
          const movingBackToWaiting =
            newStatus === "awaiting_payment" && order.status !== "awaiting_payment";
          if (!movingBackToWaiting) {
            update.status = newStatus;
          }
        }

        const { error: updErr } = await supabaseAdmin.from("orders").update(update).eq("id", order.id);
        if (updErr) return new Response("Update failed", { status: 500 });

        if (update.status && update.status !== order.status) {
          await supabaseAdmin.from("order_status_history").insert({
            order_id: order.id,
            status: update.status as string,
            note,
          });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
