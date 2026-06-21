import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatIDR, resolveProductImage } from "@/lib/product-assets";

export const Route = createFileRoute("/_authenticated/akun/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product:products(id,name,slug,price,discount_price,thumbnail_url,club)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wishlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Dihapus dari wishlist");
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-forest mb-4">Wishlist</h2>
      {q.isLoading ? (
        <Skeleton className="h-40" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2" />
          <p>Wishlist kosong.</p>
          <Link to="/shop" className="mt-4 inline-block"><Button>Telusuri Produk</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {q.data.map((w) => (
            <div key={w.id} className="border rounded-lg overflow-hidden group">
              <Link to="/produk/$slug" params={{ slug: w.product?.slug ?? "" }} className="block aspect-[4/5] bg-muted overflow-hidden">
                <img src={resolveProductImage(w.product?.thumbnail_url)} alt={w.product?.name ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </Link>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">{w.product?.club}</div>
                <Link to="/produk/$slug" params={{ slug: w.product?.slug ?? "" }} className="font-medium text-forest line-clamp-1 hover:text-grass">
                  {w.product?.name}
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-forest">{formatIDR(Number(w.product?.discount_price ?? w.product?.price ?? 0))}</span>
                  <button onClick={() => remove.mutate(w.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
