import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { Upload, Copy, Truck, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { formatIDR, resolveProductImage } from "@/lib/product-assets";
import { BANKS } from "@/lib/shipping";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/account/RatingStars";
import { MidtransPaymentButton } from "@/components/checkout/MidtransPaymentButton";

export const Route = createFileRoute("/_authenticated/pesanan/$orderNumber")({
  head: ({ params }) => ({
    meta: [{ title: `Pesanan ${params.orderNumber} — Sudut Gawang` }, { name: "robots", content: "noindex" }],
  }),
  component: OrderDetail,
});

function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return "Kedaluwarsa";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${h}j ${m}m ${s}d`;
}

function OrderDetail() {
  const { orderNumber } = Route.useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const q = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      if (!order) throw notFound();
      const [items, history, proofs, shipment, myReviews] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id),
        supabase.from("order_status_history").select("*").eq("order_id", order.id).order("changed_at"),
        supabase.from("payment_proofs").select("*").eq("order_id", order.id).order("uploaded_at", { ascending: false }),
        supabase.from("shipments").select("*").eq("order_id", order.id).maybeSingle(),
        supabase.from("reviews").select("product_id").eq("user_id", order.user_id),
      ]);
      const reviewedSet = new Set((myReviews.data ?? []).map((r) => r.product_id));
      return {
        order,
        items: items.data ?? [],
        history: history.data ?? [],
        proofs: proofs.data ?? [],
        shipment: shipment.data,
        reviewedSet,
      };
    },
  });

  const countdown = useCountdown(q.data?.order.status === "awaiting_payment" ? q.data.order.deadline_at : null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !q.data) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Maks 2MB");
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      const path = `${u.user!.id}/${q.data.order.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (error) throw error;
      const { error: rpcErr } = await supabase.rpc("submit_payment_proof", {
        p_order_id: q.data.order.id,
        p_file_url: path,
      });
      if (rpcErr) throw rpcErr;
      toast.success("Bukti pembayaran diunggah");
      qc.invalidateQueries({ queryKey: ["order", orderNumber] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (q.isLoading) return <><Navbar /><div className="container-x py-10"><Skeleton className="h-96" /></div></>;
  if (!q.data) return null;

  const { order, items, history, proofs, shipment, reviewedSet } = q.data;
  const isMidtrans = order.payment_gateway === "midtrans" || order.payment_method === "Midtrans";
  const bank = !isMidtrans ? BANKS.find((b) => b.name === order.payment_method) : null;
  const addr = order.shipping_address as { recipient?: string; phone?: string; address?: string; city?: string; province?: string; postal_code?: string } | null;
  const latestProof = proofs[0];

  return (
    <>
      <Navbar />
      <main className="container-x py-10 min-h-[60vh]">
        <div className="mb-6">
          <Link to="/akun/pesanan" className="text-sm text-grass hover:underline">← Kembali ke daftar pesanan</Link>
          <div className="mt-2 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-forest">Pesanan {order.order_number}</h1>
              <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("id-ID")}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {order.status === "awaiting_payment" && (
              <div className="border-2 border-amber-200 bg-amber-50/50 rounded-lg p-5">
                <h2 className="font-semibold text-forest mb-2">Selesaikan Pembayaran</h2>
                {countdown && (
                  <p className="text-sm text-amber-900 mb-3">Sisa waktu: <span className="font-bold tabular-nums">{countdown}</span></p>
                )}
                {bank && (
                  <div className="bg-white border rounded-md p-4">
                    <div className="text-xs text-muted-foreground">Transfer ke</div>
                    <div className="font-semibold text-forest">{bank.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-lg font-mono">{bank.account}</code>
                      <button onClick={() => { navigator.clipboard.writeText(bank.account); toast.success("Disalin"); }} className="text-grass hover:text-forest">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">a.n. {bank.holder}</div>
                    <div className="mt-3 pt-3 border-t flex justify-between">
                      <span className="text-sm">Jumlah Transfer</span>
                      <span className="font-bold text-forest">{formatIDR(Number(order.total))}</span>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onUpload} className="hidden" />
                  <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full">
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Unggah Bukti Transfer
                  </Button>
                </div>
              </div>
            )}

            {latestProof && (
              <div className="border rounded-lg p-5">
                <h2 className="font-semibold text-forest mb-2">Bukti Pembayaran</h2>
                <div className="flex items-center gap-3">
                  <Badge variant={latestProof.status === "approved" ? "default" : latestProof.status === "rejected" ? "destructive" : "secondary"}>
                    {latestProof.status === "approved" ? "Disetujui" : latestProof.status === "rejected" ? "Ditolak" : "Menunggu Verifikasi"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Diunggah {new Date(latestProof.uploaded_at).toLocaleString("id-ID")}
                  </span>
                </div>
                {latestProof.rejection_reason && (
                  <p className="text-sm text-destructive mt-2">Alasan: {latestProof.rejection_reason}</p>
                )}
              </div>
            )}

            {shipment?.tracking_number && (
              <div className="border rounded-lg p-5">
                <h2 className="font-semibold text-forest mb-2 flex items-center gap-2"><Truck className="h-5 w-5" />Pengiriman</h2>
                <div className="text-sm">Kurir: <span className="font-medium">{shipment.courier}</span></div>
                <div className="text-sm">No. Resi: <code className="font-mono">{shipment.tracking_number}</code></div>
              </div>
            )}

            <div className="border rounded-lg p-5">
              <h2 className="font-semibold text-forest mb-3">Item</h2>
              <div className="divide-y">
                {items.map((it) => {
                  const canReview = order.status === "completed" && it.product_id && !reviewedSet.has(it.product_id);
                  return (
                    <div key={it.id} className="flex gap-3 py-3 items-center">
                      <img src={resolveProductImage(it.thumbnail_url)} alt="" className="h-14 w-14 object-cover rounded" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">Ukuran {it.size} • {it.quantity} pcs</div>
                        {canReview && (
                          <ReviewButton
                            productId={it.product_id!}
                            onDone={() => qc.invalidateQueries({ queryKey: ["order", orderNumber] })}
                          />
                        )}
                        {order.status === "completed" && it.product_id && reviewedSet.has(it.product_id) && (
                          <div className="text-xs text-grass mt-1">✓ Sudah diulas</div>
                        )}
                      </div>
                      <div className="text-sm font-semibold">{formatIDR(Number(it.price) * it.quantity)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border rounded-lg p-5">
              <h2 className="font-semibold text-forest mb-2">Status Pesanan</h2>
              <OrderTimeline history={history} currentStatus={order.status} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border rounded-lg p-5 text-sm space-y-1">
              <div className="font-semibold text-forest mb-2">Alamat Pengiriman</div>
              {addr && (
                <>
                  <div>{addr.recipient} — {addr.phone}</div>
                  <div className="text-muted-foreground">{addr.address}, {addr.city}, {addr.province} {addr.postal_code ?? ""}</div>
                </>
              )}
            </div>
            <div className="border rounded-lg p-5 text-sm space-y-2">
              <div className="font-semibold text-forest mb-2">Ringkasan</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatIDR(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ongkir ({order.courier})</span><span>{formatIDR(Number(order.shipping_cost))}</span></div>
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-semibold text-forest">Total</span>
                <span className="font-bold text-forest">{formatIDR(Number(order.total))}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ReviewButton({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("reviews")
      .insert({ user_id: u.user!.id, product_id: productId, rating, comment: comment || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Ulasan dikirim. Terima kasih!");
    setOpen(false);
    onDone();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-grass hover:underline mt-1"
      >
        <Star className="h-3 w-3" /> Beri Ulasan
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Beri Ulasan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Rating</div>
              <RatingStars value={rating} size={28} onChange={setRating} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Komentar (opsional)</div>
              <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Bagaimana pengalaman Anda dengan produk ini?" />
            </div>
            <Button onClick={submit} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Kirim Ulasan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
