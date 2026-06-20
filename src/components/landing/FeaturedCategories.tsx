import { ArrowUpRight } from "lucide-react";
import club from "@/assets/cat-club.jpg";
import national from "@/assets/cat-national.jpg";
import vintage from "@/assets/cat-vintage.jpg";
import news from "@/assets/cat-new.jpg";
import training from "@/assets/cat-training.jpg";
import jacket from "@/assets/cat-jacket.jpg";

const cats = [
  { t: "Jersey Klub", c: "120+ koleksi", i: club },
  { t: "Jersey Tim Nasional", c: "45+ koleksi", i: national },
  { t: "Jersey Vintage", c: "Langka & ikonik", i: vintage },
  { t: "New Arrival", c: "Rilis 2025/26", i: news },
  { t: "Training Kit", c: "Untuk berlatih", i: training },
  { t: "Jaket", c: "Track & casual", i: jacket },
];

export function FeaturedCategories() {
  return (
    <section className="py-20 lg:py-28 border-b border-border">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-widest text-grass font-bold">
              02 / Kategori
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Pilih jalurmu di lapangan.
            </h2>
          </div>
          <a href="#" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-grass">
            Lihat semua <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {cats.map((c) => (
            <a
              key={c.t}
              href="#"
              className="group relative aspect-[4/5] overflow-hidden bg-muted rounded-md"
            >
              <img
                src={c.i}
                alt={c.t}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between text-white">
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-white">{c.t}</h3>
                  <p className="text-xs opacity-80">{c.c}</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-forest opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
