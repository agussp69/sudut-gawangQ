import t1 from "@/assets/t1.jpg";
import t2 from "@/assets/t2.jpg";
import t3 from "@/assets/t3.jpg";

const reviews = [
  { n: "Rama A.", c: "Jakarta", r: 5, i: t1, p: "Home Kit Authentic", q: "Original, packing rapi, dan dokumentasi sangat detail. Sudah langganan tiga kali." },
  { n: "Sinta P.", c: "Bandung", r: 5, i: t2, p: "Sky Stripe Limited", q: "Pengiriman cepat dan barang sesuai foto. Bahannya premium, pas di badan." },
  { n: "Bagus W.", c: "Surabaya", r: 5, i: t3, p: "Vintage 1994", q: "Akhirnya nemu jersey impian dari kecil. Kualitas vintage-nya benar-benar terjaga." },
];

export function Reviews() {
  return (
    <section className="py-20 lg:py-28 border-b border-border">
      <div className="container-x">
        <div className="max-w-xl mb-12">
          <span className="text-xs uppercase tracking-widest text-grass font-bold">
            09 / Reviews
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Cerita dari ribuan fans.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <article
              key={r.n}
              className="flex flex-col gap-5 border border-border rounded-md p-7 bg-white hover:border-grass transition-colors"
            >
              <div className="flex items-center gap-1 text-grass text-sm">
                {Array.from({ length: r.r }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-foreground leading-relaxed text-[15px]">"{r.q}"</p>
              <div className="mt-auto flex items-center gap-3 pt-5 border-t border-border">
                <img
                  src={r.i}
                  alt={r.n}
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-forest truncate">{r.n}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {r.c} · {r.p}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
