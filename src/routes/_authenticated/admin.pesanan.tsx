import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Card } from "@/components/ui/card";
import { z } from "zod";

const search = z.object({
  status: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/admin/pesanan")({
  validateSearch: search,
  component: AdminOrders,
});

const TABS: { id: string; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "awaiting_payment", label: "Menunggu Bayar" },
  { id: "awaiting_verification", label: "Verifikasi" },
  { id: "processing", label: "Diproses" },
  { id: "shipped", label: "Dikirim" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Batal" },
];

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function AdminOrders() {
  const { status } = Route.useSearch();
  const active = status ?? "all";

  const orders = useQuery({
    queryKey: ["admin-orders", active],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("id, order_number, status, total, courier, created_at, user_id, profiles:profiles!orders_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (active !== "all") q = q.eq("status", active as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to="/admin/pesanan"
            search={t.id === "all" ? {} : { status: t.id }}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              active === t.id ? "bg-forest text-white" : "hover:bg-muted text-foreground/70"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {orders.isLoading && <p className="p-6 text-sm text-muted-foreground">Memuat…</p>}
          {orders.data?.length === 0 && <p className="p-6 text-sm text-muted-foreground">Tidak ada pesanan.</p>}
          {orders.data?.map((o: any) => (
            <Link
              key={o.id}
              to="/admin/pesanan/$orderNumber"
              params={{ orderNumber: o.order_number }}
              className="grid grid-cols-[1fr_auto] gap-4 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="text-sm text-foreground/80 truncate">
                  {o.profiles?.full_name ?? "—"} · {o.courier ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatIDR(Number(o.total))}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
