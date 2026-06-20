export function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 text-center border-b border-border">
      <div className="container-x flex flex-col items-center gap-8">
        <span className="text-xs uppercase tracking-widest text-grass font-bold">
          12 / Mulai sekarang
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-3xl leading-[1.02]">
          Siap Menambah Koleksi <span className="text-grass">Jersey Original</span>?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#products"
            className="inline-flex items-center gap-2 rounded-md bg-grass px-7 py-4 text-sm font-semibold text-white hover:bg-forest transition-colors"
          >
            Belanja Sekarang
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-md border border-forest px-7 py-4 text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors"
          >
            Lihat Semua Produk
          </a>
        </div>
      </div>
    </section>
  );
}
