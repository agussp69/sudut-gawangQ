import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { products } from "./products";
import { ProductCard } from "./ProductCard";

export function BestSeller() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="py-20 lg:py-28 bg-muted/40 border-b border-border">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-widest text-grass font-bold">
              05 / Best Seller
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Paling diburu fans.
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Previous"
              onClick={() => scroll(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-forest hover:bg-forest hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next"
              onClick={() => scroll(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-forest hover:bg-forest hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="container-x flex gap-5 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar"
      >
        {[...products, ...products].map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="snap-start shrink-0 w-[70%] sm:w-[42%] lg:w-[24%]"
          >
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
