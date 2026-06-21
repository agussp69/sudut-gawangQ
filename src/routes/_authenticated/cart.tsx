import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QtyStepper } from "@/components/account/QtyStepper";
import { formatIDR, resolveProductImage } from "@/lib/product-assets";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Keranjang — Sudut Gawang" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

type CartRow = {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price: number | null;
    thumbnail_url: string | null;
  } | null;
  stock: number;
};

function CartPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async (): Promise<CartRow[]> => {
      const { data: items, error } = await supabase
        .from("cart_items")
        .select("id, product_id, size, quantity, product:products(id,name,slug,price,discount_price,thumbnail_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!items?.length) return [];
      // fetch stock per (product, size)
      const rows = await Promise.all(
        items.map(async (it) => {
          const { data: s } = await supabase
            .from("product_sizes")
            .select("stock")
            .eq("product_id", it.product_id)
            .eq("size", it.size)
            .maybeSingle();
          return { ...it, stock: s?.stock ?? 0 } as CartRow;
        }),
      );
      return rows;
    },
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item dihapus");
    },
  });

  const items = cartQuery.data ?? [];
  const subtotal = items.reduce((sum, it) => {
    const price = it.product?.discount_price ?? it.product?.price ?? 0;
    return sum + Number(price) * it.quantity;
  }, 0);

  return (
    <>
      <Navbar />
      <main className="container-x py-10 min-h-[60vh]">
        <h1 className="text-3xl font-extrabold tracking-tight text-forest mb-8">Keranjang</h1>

        {cartQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Keranjang Anda kosong.</p>
            <Link to="/shop" className="mt-4 inline-block">
              <Button>Mulai Belanja</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {items.map((it) => {
                const price = Number(it.product?.discount_price ?? it.product?.price ?? 0);
                const img = resolveProductImage(it.product?.thumbnail_url);
                const outOfStock = it.stock < it.quantity;
                return (
                  <div key={it.id} className="flex gap-4 border border-border rounded-lg p-4">
                    <img src={img} alt={it.product?.name ?? ""} className="h-24 w-24 object-cover rounded-md bg-muted" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/produk/$slug"
                        params={{ slug: it.product?.slug ?? "" }}
                        className="font-semibold text-forest hover:text-grass line-clamp-1"
                      >
                        {it.product?.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">Ukuran: {it.size}</div>
                      <div className="text-sm font-semibold text-forest mt-1">{formatIDR(price)}</div>
                      {outOfStock && (
                        <div className="text-xs text-destructive mt-1">Stok tidak mencukupi (sisa {it.stock})</div>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <QtyStepper
                          value={it.quantity}
                          onChange={(v) => updateQty.mutate({ id: it.id, quantity: v })}
                          max={Math.max(1, it.stock)}
                        />
                        <button
                          onClick={() => removeItem.mutate(it.id)}
                          className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus
                        </button>
                      </div>
                    </div>
                    <div className="text-right font-semibold text-forest">
                      {formatIDR(price * it.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="border border-border rounded-lg p-6 h-fit sticky top-24">
              <h2 className="font-semibold text-forest mb-4">Ringkasan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span className="text-muted-foreground text-xs">Hitung di checkout</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between text-base">
                  <span className="font-semibold text-forest">Estimasi Total</span>
                  <span className="font-bold text-forest">{formatIDR(subtotal)}</span>
                </div>
              </div>
              <Button
                className="w-full mt-6"
                disabled={items.some((i) => i.stock < i.quantity)}
                onClick={() => router.navigate({ to: "/checkout" })}
              >
                Lanjut ke Checkout
              </Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
