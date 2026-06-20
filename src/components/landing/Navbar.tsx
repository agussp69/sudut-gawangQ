import { useEffect, useState } from "react";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";

const links = ["Shop", "New Arrival", "Vintage", "Club", "National Team", "About", "Contact"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-grass text-white font-black text-sm">
            SG
          </span>
          <span className="font-extrabold tracking-tight text-forest text-lg">
            Sudut Gawang
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-foreground/80">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="hover:text-grass transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 hover:after:w-full after:bg-grass after:transition-all"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 text-foreground">
          <button aria-label="Search" className="p-2 hover:text-grass transition-colors">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Wishlist" className="p-2 hover:text-grass transition-colors hidden sm:inline-flex">
            <Heart className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Cart" className="relative p-2 hover:text-grass transition-colors">
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-grass text-[10px] font-bold text-white">
              2
            </span>
          </button>
          <button aria-label="Login" className="p-2 hover:text-grass transition-colors hidden sm:inline-flex">
            <User className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label="Menu"
            className="p-2 lg:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-white">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l}
                href="#"
                className="py-2 text-sm font-medium hover:text-grass"
                onClick={() => setOpen(false)}
              >
                {l}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
