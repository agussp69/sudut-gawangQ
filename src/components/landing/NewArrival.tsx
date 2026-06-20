import { products } from "./products";
import { ProductCard } from "./ProductCard";

export function NewArrival() {
  const items = products.filter((p) => p.badge !== "Vintage").slice(0, 4);
  return (
    <section className="py-20 lg:py-28 border-b border-border">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-grass font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-grass animate-pulse" />
              06 / New Arrival
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Baru tiba di toko.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
