import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produk/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const product = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_sizes(size, stock)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (product.isLoading) return <p className="text-muted-foreground">Memuat…</p>;
  if (!product.data) return <p className="text-muted-foreground">Produk tidak ditemukan.</p>;

  return (
    <ProductForm
      initial={product.data as any}
      onSaved={() => navigate({ to: "/admin/produk" })}
    />
  );
}
