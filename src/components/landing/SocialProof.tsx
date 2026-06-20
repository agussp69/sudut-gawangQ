const stats = [
  { v: "10.000+", l: "Pelanggan Puas" },
  { v: "5.000+", l: "Jersey Terjual" },
  { v: "4.9 / 5", l: "Rating Pelanggan" },
  { v: "100%", l: "Produk Original" },
];

export function SocialProof() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="container-x grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className={`flex flex-col gap-1 py-8 px-4 ${i % 2 === 1 ? "border-l lg:border-l-0" : ""}`}
          >
            <span className="text-3xl lg:text-4xl font-extrabold text-forest tracking-tight">
              {s.v}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {s.l}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
