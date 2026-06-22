import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { resolveProductImage } from "@/lib/product-assets";

export const Route = createFileRoute("/_authenticated/admin/produk")({
  component: AdminProducts,
});

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const products = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, price, discount_price, is_published, condition, thumbnail_url, brands(name), categories(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("products").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produk dihapus");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Link to="/admin/produk/baru" className="ml-auto">
          <Button><Plus className="h-4 w-4 mr-1" /> Produk Baru</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y">
          {products.isLoading && <p className="p-6 text-sm text-muted-foreground">Memuat…</p>}
          {products.data?.length === 0 && <p className="p-6 text-sm text-muted-foreground">Tidak ada produk.</p>}
          {products.data?.map((p: any) => {
            const img = resolveProductImage(p.thumbnail_url);
            const price = p.discount_price ?? p.price;
            return (
              <div key={p.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 p-3">
                {img ? (
                  <img src={img} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted" />
                )}
                <div className="min-w-0">
                  <Link to="/admin/produk/$id" params={{ id: p.id }} className="font-medium text-sm hover:text-grass truncate block">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.brands?.name ?? "—"} · {p.categories?.name ?? "—"} · {p.condition}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatIDR(Number(price))}</p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.is_published}
                    onCheckedChange={(v) => togglePublished.mutate({ id: p.id, is_published: v })}
                  />
                  <span className="text-xs text-muted-foreground">{p.is_published ? "Aktif" : "Draft"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Hapus "${p.name}"?`)) remove.mutate(p.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
