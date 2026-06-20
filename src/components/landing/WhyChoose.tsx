import { ShieldCheck, Camera, Sparkles, Archive, Lock, Truck } from "lucide-react";

const items = [
  { i: ShieldCheck, t: "100% Original", d: "Semua produk dijamin asli dari sumber resmi dan terpercaya." },
  { i: Camera, t: "Foto Asli Produk", d: "Setiap jersey didokumentasikan dengan foto kondisi sebenarnya." },
  { i: Sparkles, t: "Koleksi Terbaru", d: "Rilis musim terkini langsung tersedia di Sudut Gawang." },
  { i: Archive, t: "Vintage Langka", d: "Koleksi klasik dan jersey ikonik yang sulit ditemukan." },
  { i: Lock, t: "Pembayaran Aman", d: "Banyak metode pembayaran dengan enkripsi end-to-end." },
  { i: Truck, t: "Pengiriman Cepat", d: "Dikirim ke seluruh Indonesia dengan ekspedisi terpercaya." },
];

export function WhyChoose() {
  return (
    <section className="py-20 lg:py-28 bg-muted/40 border-b border-border">
      <div className="container-x">
        <div className="max-w-xl mb-12">
          <span className="text-xs uppercase tracking-widest text-grass font-bold">
            03 / Mengapa Kami
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Detail yang tidak pernah kami kompromi.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
          {items.map(({ i: Icon, t, d }) => (
            <div
              key={t}
              className="group bg-white p-8 flex flex-col gap-4 transition-colors hover:bg-forest hover:text-white"
            >
              <span className="grid h-12 w-12 place-items-center rounded-md bg-grass/10 text-grass group-hover:bg-white/15 group-hover:text-white transition-colors">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold group-hover:text-white">{t}</h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed">
                {d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
