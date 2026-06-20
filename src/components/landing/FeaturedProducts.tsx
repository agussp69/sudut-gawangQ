import { products } from "./products";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts() {
  return (
    <section id="products" className="py-20 lg:py-28 border-b border-border">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-widest text-grass font-bold">
              04 / Featured
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Produk pilihan tim kurator kami.
            </h2>
          </div>
          <a href="#" className="hidden sm:inline-flex text-sm font-semibold text-forest hover:text-grass">
            Lihat katalog →
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
