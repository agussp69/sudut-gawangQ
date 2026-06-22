import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produk/baru")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  return (
    <ProductForm
      onSaved={() => navigate({ to: "/admin/produk" })}
    />
  );
}
