import { Search, BadgeCheck, ClipboardCheck, Camera, PackageCheck } from "lucide-react";

const steps = [
  { i: Search, t: "Seleksi Produk", d: "Kurasi dari sumber resmi & terpercaya." },
  { i: BadgeCheck, t: "Verifikasi Keaslian", d: "Diperiksa berdasarkan kode & detail material." },
  { i: ClipboardCheck, t: "Quality Check", d: "Setiap detail dicek sebelum dijual." },
  { i: Camera, t: "Dokumentasi", d: "Foto asli kondisi produk." },
  { i: PackageCheck, t: "Siap Dikirim", d: "Dikemas aman & dikirim ke seluruh Indonesia." },
];

export function AuthenticityTimeline() {
  return (
    <section className="py-20 lg:py-28 bg-forest text-white border-b border-border">
      <div className="container-x">
        <div className="max-w-xl mb-14">
          <span className="text-xs uppercase tracking-widest text-grass font-bold">
            08 / Authenticity
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Lima langkah, satu jaminan: original.
          </h2>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 rounded-md overflow-hidden">
          {steps.map(({ i: Icon, t, d }, idx) => (
            <li key={t} className="bg-forest p-6 flex flex-col gap-3 relative">
              <span className="text-[10px] font-bold tracking-widest text-grass">
                STEP {String(idx + 1).padStart(2, "0")}
              </span>
              <Icon className="h-6 w-6 text-grass" />
              <h3 className="text-base font-bold text-white">{t}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
