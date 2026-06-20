import { ArrowRight, ShieldCheck, Users, Truck } from "lucide-react";
import hero from "@/assets/hero-jersey.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="container-x grid lg:grid-cols-12 gap-10 lg:gap-16 py-16 lg:py-24 items-center">
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-grass" />
            Koleksi 2025 / 26 — Sudah Tiba
          </div>

          <h1 className="text-[40px] sm:text-5xl lg:text-[64px] font-extrabold leading-[1.02] tracking-tight text-forest">
            Jersey Original<br />
            untuk Fans Sejati.<br />
            <span className="text-grass">Dari Rilis Terbaru hingga Vintage.</span>
          </h1>

          <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Temukan jersey sepak bola original dengan kurasi terbaik, dokumentasi
            lengkap, dan pengalaman belanja yang cepat, aman, serta terpercaya.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#products"
              className="group inline-flex items-center gap-2 rounded-md bg-grass px-6 py-3.5 text-sm font-semibold text-white hover:bg-forest transition-colors shadow-[0_8px_24px_-12px_rgba(27,143,77,0.6)]"
            >
              Belanja Sekarang
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#vintage"
              className="inline-flex items-center gap-2 rounded-md border border-forest px-6 py-3.5 text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors"
            >
              Jelajahi Koleksi Vintage
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border max-w-md">
            {[
              { i: ShieldCheck, l: "100% Original" },
              { i: Users, l: "Ribuan Fans" },
              { i: Truck, l: "Kirim Nasional" },
            ].map(({ i: Icon, l }) => (
              <div key={l} className="flex flex-col items-start gap-2">
                <Icon className="h-5 w-5 text-grass" />
                <span className="text-xs font-semibold text-foreground/80">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <div className="relative aspect-[5/6] w-full bg-muted overflow-hidden rounded-lg">
            <img
              src={hero}
              alt="Jersey original Sudut Gawang"
              width={1280}
              height={1280}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Swiss grid overlay */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-l border-white/15 first:border-0" />
              ))}
            </div>
            <div className="absolute top-4 left-4 flex flex-col gap-1 bg-white px-3 py-2 text-[10px] tracking-widest font-bold text-forest">
              <span>SG · 001</span>
              <span className="text-muted-foreground font-medium">HOME / 25-26</span>
            </div>
            <div className="absolute bottom-4 right-4 bg-grass text-white px-3 py-2 text-xs font-bold tracking-wide">
              ORIGINAL ✓
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden md:flex flex-col gap-1 bg-white border border-border rounded-md px-5 py-4 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-1 text-grass">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <span className="text-sm font-bold text-forest">4.9 / 5 — 2.300+ ulasan</span>
          </div>
        </div>
      </div>
    </section>
  );
}
