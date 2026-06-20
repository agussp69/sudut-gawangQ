const items = [
  "100% Jersey Original",
  "Pengiriman Seluruh Indonesia",
  "Koleksi Terbaru & Vintage",
  "Checkout Aman",
];

export function AnnouncementBar() {
  return (
    <div className="bg-forest text-white text-[11px] sm:text-xs tracking-wide">
      <div className="container-x flex items-center justify-between gap-6 py-2 overflow-hidden">
        <div className="flex items-center gap-6 sm:gap-10 whitespace-nowrap overflow-x-auto no-scrollbar">
          {items.map((i) => (
            <span key={i} className="flex items-center gap-2 shrink-0">
              <span className="inline-block h-1 w-1 rounded-full bg-grass" />
              {i}
            </span>
          ))}
        </div>
        <span className="hidden md:inline opacity-70 shrink-0">ID · IDR</span>
      </div>
    </div>
  );
}
