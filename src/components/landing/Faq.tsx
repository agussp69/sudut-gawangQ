import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Apakah semua jersey dijamin original?", a: "Ya. Setiap produk yang dijual di Sudut Gawang melalui verifikasi keaslian dan dokumentasi lengkap sebelum dikirim." },
  { q: "Bagaimana cara memilih ukuran yang tepat?", a: "Setiap halaman produk menyediakan size chart detail. Tim kami juga siap membantu via WhatsApp untuk rekomendasi ukuran." },
  { q: "Apakah tersedia retur atau penukaran?", a: "Kami menerima retur dalam 3 hari setelah barang diterima jika ada cacat produksi atau ukuran tidak sesuai." },
  { q: "Berapa lama waktu pengiriman?", a: "Pengiriman Pulau Jawa 1–3 hari kerja, luar Jawa 3–7 hari kerja, tergantung ekspedisi yang dipilih." },
  { q: "Apakah bisa kirim ke seluruh Indonesia?", a: "Bisa. Kami mendukung pengiriman ke seluruh kota di Indonesia dengan berbagai ekspedisi rekanan." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 lg:py-28 bg-muted/40 border-b border-border">
      <div className="container-x grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <span className="text-xs uppercase tracking-widest text-grass font-bold">
            10 / FAQ
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Pertanyaan yang sering ditanyakan.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm">
            Butuh bantuan lain? <a href="#" className="text-grass font-semibold hover:underline">Hubungi kami</a>.
          </p>
        </div>
        <div className="lg:col-span-8">
          <ul className="divide-y divide-border border-y border-border">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-base lg:text-lg font-semibold text-forest">
                      {f.q}
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-border shrink-0 text-forest">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-muted-foreground leading-relaxed max-w-2xl">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
