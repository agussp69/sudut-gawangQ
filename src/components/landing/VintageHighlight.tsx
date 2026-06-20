import { ArrowRight } from "lucide-react";
import img from "@/assets/vintage-editorial.jpg";

export function VintageHighlight() {
  return (
    <section id="vintage" className="py-20 lg:py-28 border-b border-border">
      <div className="container-x grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-6 order-2 lg:order-1">
          <div className="relative aspect-[5/4] overflow-hidden rounded-md bg-muted">
            <img
              src={img}
              alt="Koleksi vintage Sudut Gawang"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
          <span className="text-xs uppercase tracking-widest text-grass font-bold">
            07 / Vintage Collection
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.02]">
            Legenda Tak<br />
            <span className="italic font-light">Pernah</span> Pudar.
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-lg leading-relaxed">
            Eksplorasi koleksi jersey klasik dan langka yang membawa kembali
            momen-momen ikonik sepak bola dunia — dari final yang tak terlupakan
            hingga musim ajaib yang ditulis dalam sejarah.
          </p>
          <a
            href="#"
            className="group inline-flex items-center self-start gap-2 rounded-md bg-forest px-6 py-3.5 text-sm font-semibold text-white hover:bg-grass transition-colors"
          >
            Lihat Koleksi Vintage
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
