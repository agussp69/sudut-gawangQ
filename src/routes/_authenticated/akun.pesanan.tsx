import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatIDR, resolveProductImage } from "@/lib/product-assets";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/akun/pesanan")({
  component: OrdersPage,
});

const FILTERS = [
  { id: "all", label: "Semua", statuses: [] as string[] },
  { id: "awaiting_payment", label: "Belum Bayar", statuses: ["awaiting_payment"] },
  { id: "verify", label: "Verifikasi", statuses: ["awaiting_verification"] },
  { id: "process", label: "Diproses", statuses: ["paid", "processing", "packed"] },
  { id: "shipped", label: "Dikirim", statuses: ["shipped"] },
  { id: "completed", label: "Selesai", statuses: ["completed"] },
];

function OrdersPage() {
  const [filter, setFilter] = useState("all");

  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, items:order_items(name, thumbnail_url, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = FILTERS.find((f) => f.id === filter)!;
  const filtered = q.data?.filter((o) => !active.statuses.length || active.statuses.includes(o.status)) ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-forest mb-4">Pesanan Saya</h2>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {FILTERS.map((f) => <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !filtered.length ? (
          <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2" />
            Belum ada pesanan di kategori ini.
          </div>
        ) : (
          filtered.map((o) => (
            <Link
              key={o.id}
              to="/pesanan/$orderNumber"
              params={{ orderNumber: o.order_number ?? "" }}
              className="block border border-border rounded-lg p-4 hover:border-grass transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</div>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="flex gap-2 mt-2">
                {o.items?.slice(0, 4).map((it, i) => (
                  <img key={i} src={resolveProductImage(it.thumbnail_url)} alt={it.name} className="h-12 w-12 object-cover rounded" />
                ))}
                {o.items && o.items.length > 4 && (
                  <div className="h-12 w-12 grid place-items-center bg-muted rounded text-xs">+{o.items.length - 4}</div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{o.items?.length ?? 0} item</span>
                <span className="font-semibold text-forest">{formatIDR(Number(o.total))}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
