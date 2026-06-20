import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";

const cols = [
  { t: "Navigasi", l: ["Shop", "New Arrival", "Vintage", "Klub", "Timnas", "About"] },
  { t: "Bantuan", l: ["FAQ", "Cara Pesan", "Size Guide", "Retur", "Lacak Pesanan", "Kontak"] },
  { t: "Pembayaran", l: ["Transfer Bank", "Virtual Account", "QRIS", "E-Wallet", "Kartu Kredit"] },
  { t: "Ekspedisi", l: ["JNE", "J&T", "SiCepat", "Anteraja", "GoSend", "GrabExpress"] },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="container-x py-16 lg:py-20 grid grid-cols-2 lg:grid-cols-6 gap-10">
        <div className="col-span-2 flex flex-col gap-5">
          <a href="#" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-grass text-white font-black">
              SG
            </span>
            <span className="font-extrabold tracking-tight text-lg">Sudut Gawang</span>
          </a>
          <p className="text-white/70 text-sm max-w-xs leading-relaxed">
            Destinasi terpercaya untuk jersey sepak bola original — dari rilis
            terbaru hingga koleksi vintage langka.
          </p>
          <div className="flex items-center gap-2">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 hover:bg-grass hover:border-grass transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.t} className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-widest text-white font-bold">
              {c.t}
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-white/70">
              {c.l.map((i) => (
                <li key={i}>
                  <a href="#" className="hover:text-grass transition-colors">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Sudut Gawang. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
