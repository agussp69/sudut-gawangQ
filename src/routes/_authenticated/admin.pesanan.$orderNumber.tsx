import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { COURIERS, getCourier, getBank } from "@/lib/shipping";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pesanan/$orderNumber")({
  component: AdminOrderDetail,
});

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function AdminOrderDetail() {
  const { orderNumber } = Route.useParams();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierId, setCourierId] = useState<string>(COURIERS[0].id);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const order = useQuery({
    queryKey: ["admin-order", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `id, order_number, status, subtotal, shipping_cost, total, courier, payment_method, shipping_address, notes, deadline_at, created_at, user_id,
           order_items(id, name, size, quantity, price, thumbnail_url),
           payment_proofs(id, file_url, status, rejection_reason, created_at),
           shipments(id, courier, tracking_number, shipped_at, delivered_at),
           order_status_history(id, status, note, created_at),
           profiles:profiles!orders_user_id_fkey(full_name, phone)`
        )
        .eq("order_number", orderNumber)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const latestProof = (order.data?.payment_proofs ?? []).slice().sort(
    (a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at),
  )[0];

  async function viewProof() {
    if (!latestProof) return;
    const path = latestProof.file_url;
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 600);
    if (error) {
      toast.error("Gagal membuka bukti");
      return;
    }
    setProofUrl(data.signedUrl);
    window.open(data.signedUrl, "_blank");
  }

  const verify = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_verify_payment", {
        p_order_id: order.data!.id,
        p_proof_id: latestProof.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pembayaran diverifikasi");
      qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_reject_payment", {
        p_order_id: order.data!.id,
        p_proof_id: latestProof.id,
        p_reason: rejectReason || "Tidak valid",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pembayaran ditolak");
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const ship = useMutation({
    mutationFn: async () => {
      const courier = getCourier(courierId)?.name ?? courierId;
      const { error } = await supabase.rpc("admin_ship_order", {
        p_order_id: order.data!.id,
        p_courier: courier,
        p_tracking: trackingNumber.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pesanan dikirim");
      setTrackingNumber("");
      qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markDone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_mark_delivered", { p_order_id: order.data!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pesanan ditandai selesai");
      qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_cancel_order", {
        p_order_id: order.data!.id,
        p_reason: rejectReason || "Dibatalkan admin",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pesanan dibatalkan");
      qc.invalidateQueries({ queryKey: ["admin-order", orderNumber] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (order.isLoading) return <p className="text-muted-foreground">Memuat…</p>;
  if (!order.data) return <p className="text-muted-foreground">Pesanan tidak ditemukan.</p>;

  const o = order.data as any;
  const addr = o.shipping_address as any;
  const bank = o.payment_method ? getBank(o.payment_method) : null;

  return (
    <div className="space-y-6">
      <Link to="/admin/pesanan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-forest">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-lg font-bold">{o.order_number}</p>
          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</p>
        </div>
        <OrderStatusBadge status={o.status} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-forest">Item</h2>
            <div className="divide-y">
              {o.order_items.map((it: any) => (
                <div key={it.id} className="flex items-center gap-3 py-3">
                  {it.thumbnail_url && (
                    <img src={it.thumbnail_url} alt="" className="w-14 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">Ukuran {it.size} · {it.quantity}x</p>
                  </div>
                  <p className="text-sm font-semibold">{formatIDR(Number(it.price) * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatIDR(Number(o.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatIDR(Number(o.shipping_cost))}</span></div>
              <div className="flex justify-between font-bold text-forest"><span>Total</span><span>{formatIDR(Number(o.total))}</span></div>
            </div>
          </Card>

          {latestProof && (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-forest">Bukti Pembayaran</h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{latestProof.status}</span>
              </div>
              <Button variant="outline" size="sm" onClick={viewProof}>
                <ExternalLink className="h-4 w-4 mr-1" /> Lihat Bukti
              </Button>
              {latestProof.rejection_reason && (
                <p className="text-xs text-red-700">Alasan ditolak: {latestProof.rejection_reason}</p>
              )}

              {o.status === "awaiting_verification" && (
                <div className="space-y-2 pt-2 border-t">
                  <Button onClick={() => verify.mutate()} disabled={verify.isPending} className="w-full">
                    Verifikasi & Proses
                  </Button>
                  <Textarea
                    placeholder="Alasan penolakan (opsional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                  />
                  <Button variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending} className="w-full">
                    Tolak Bukti
                  </Button>
                </div>
              )}
            </Card>
          )}

          {(o.status === "processing" || o.status === "packed") && (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold text-forest">Kirim Pesanan</h2>
              <div className="space-y-2">
                <Label>Kurir</Label>
                <select
                  className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                >
                  {COURIERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nomor Resi</Label>
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Masukkan resi" />
              </div>
              <Button
                onClick={() => ship.mutate()}
                disabled={!trackingNumber.trim() || ship.isPending}
                className="w-full"
              >
                Tandai Dikirim
              </Button>
            </Card>
          )}

          {o.status === "shipped" && (
            <Card className="p-5 space-y-3">
              <Button onClick={() => markDone.mutate()} disabled={markDone.isPending} className="w-full">
                Tandai Selesai
              </Button>
            </Card>
          )}

          {(o.status === "awaiting_payment" || o.status === "awaiting_verification" || o.status === "processing") && (
            <Card className="p-5 space-y-2">
              <h2 className="font-semibold text-forest">Batalkan Pesanan</h2>
              <Textarea
                placeholder="Alasan pembatalan"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
              />
              <Button variant="destructive" onClick={() => cancel.mutate()} disabled={cancel.isPending} className="w-full">
                Batalkan & Kembalikan Stok
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-semibold text-forest mb-3">Timeline</h2>
            <OrderTimeline history={o.order_status_history} />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5 space-y-2">
            <h3 className="font-semibold text-sm text-forest">Pelanggan</h3>
            <p className="text-sm">{o.profiles?.full_name ?? "—"}</p>
            {o.profiles?.phone && <p className="text-xs text-muted-foreground">{o.profiles.phone}</p>}
          </Card>
          <Card className="p-5 space-y-1">
            <h3 className="font-semibold text-sm text-forest">Alamat Kirim</h3>
            {addr && (
              <div className="text-sm space-y-0.5">
                <p className="font-medium">{addr.recipient}</p>
                <p className="text-muted-foreground">{addr.phone}</p>
                <p>{addr.address}</p>
                <p className="text-muted-foreground">{addr.district}, {addr.city}, {addr.province} {addr.postal_code}</p>
                {addr.notes && <p className="text-xs italic text-muted-foreground">"{addr.notes}"</p>}
              </div>
            )}
          </Card>
          <Card className="p-5 space-y-1">
            <h3 className="font-semibold text-sm text-forest">Pengiriman</h3>
            <p className="text-sm">{o.courier ?? "—"}</p>
            {o.shipments?.[0] && (
              <p className="font-mono text-xs">{o.shipments[0].tracking_number}</p>
            )}
          </Card>
          <Card className="p-5 space-y-1">
            <h3 className="font-semibold text-sm text-forest">Pembayaran</h3>
            <p className="text-sm">{bank?.name ?? o.payment_method ?? "—"}</p>
            {bank && <p className="font-mono text-xs">{bank.account}</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
