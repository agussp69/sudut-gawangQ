import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "./products";

const badgeStyle: Record<string, string> = {
  New: "bg-grass text-white",
  Vintage: "bg-forest text-white",
  Limited: "bg-foreground text-white",
};

export function ProductCard({ p }: { p: Product }) {
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-md">
        <img
          src={p.img}
          alt={`${p.name} — ${p.club}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {p.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${badgeStyle[p.badge]}`}>
            {p.badge}
          </span>
        )}
        <button
          aria-label="Wishlist"
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground hover:bg-white hover:text-grass transition-colors"
        >
          <Heart className="h-4 w-4" />
        </button>
        <button className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-2 rounded-md bg-white text-forest text-sm font-semibold py-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-grass hover:text-white">
          <ShoppingBag className="h-4 w-4" /> Add to Cart
        </button>
      </div>
      <div className="pt-4 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {p.club} · {p.season}
        </span>
        <h3 className="text-sm font-semibold text-forest">{p.name}</h3>
        <span className="text-sm font-bold text-foreground">{p.price}</span>
      </div>
    </div>
  );
}
