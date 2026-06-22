import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Package, Users, AlertCircle, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [orders, products, users, pendingVerif, recent] = await Promise.all([
        supabase.from("orders").select("total, status", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "awaiting_verification"),
        supabase
          .from("orders")
          .select("id, order_number, total, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      const revenue = (orders.data ?? [])
        .filter((o) => o.status !== "cancelled" && o.status !== "rejected")
        .reduce((s, o) => s + Number(o.total), 0);
      return {
        totalOrders: orders.count ?? 0,
        revenue,
        products: products.count ?? 0,
        users: users.count ?? 0,
        pendingVerif: pendingVerif.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Total Pesanan", value: stats.data?.totalOrders ?? "—", icon: ShoppingBag },
    { label: "Pendapatan", value: stats.data ? formatIDR(stats.data.revenue) : "—", icon: Wallet },
    { label: "Produk", value: stats.data?.products ?? "—", icon: Package },
    { label: "Pengguna", value: stats.data?.users ?? "—", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {!!stats.data?.pendingVerif && (
        <Link to="/admin/pesanan" search={{ status: "awaiting_verification" } as never}>
          <Card className="p-4 flex items-center gap-3 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <p className="text-sm">
              <span className="font-semibold text-amber-900">{stats.data.pendingVerif}</span> pembayaran menunggu verifikasi.
            </p>
          </Card>
        </Link>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <Icon className="h-4 w-4 text-grass" />
              </div>
              <p className="text-2xl font-extrabold text-forest">{c.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-forest mb-4">Pesanan Terbaru</h2>
        <div className="divide-y">
          {(stats.data?.recent ?? []).map((o) => (
            <Link
              key={o.id}
              to="/admin/pesanan/$orderNumber"
              params={{ orderNumber: o.order_number ?? "" }}
              className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 -mx-2 rounded transition-colors"
            >
              <div>
                <p className="font-mono text-sm font-medium">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatIDR(Number(o.total))}</p>
                <p className="text-xs text-muted-foreground">{o.status}</p>
              </div>
            </Link>
          ))}
          {stats.data?.recent.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Belum ada pesanan.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
