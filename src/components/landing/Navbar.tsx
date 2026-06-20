import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links: { label: string; to: string; params?: Record<string, string> }[] = [
  { label: "Shop", to: "/shop" },
  { label: "New Arrival", to: "/shop" },
  { label: "Vintage", to: "/shop" },
  { label: "Klub", to: "/shop" },
  { label: "Timnas", to: "/shop" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate({ to: "/" });
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-grass text-white font-black text-sm">
            SG
          </span>
          <span className="font-extrabold tracking-tight text-forest text-lg">Sudut Gawang</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-foreground/80">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="hover:text-grass transition-colors"
              activeProps={{ className: "text-grass" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 text-foreground">
          <Link to="/shop" aria-label="Search" className="p-2 hover:text-grass transition-colors">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <button aria-label="Wishlist" className="p-2 hover:text-grass transition-colors hidden sm:inline-flex">
            <Heart className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Cart" className="relative p-2 hover:text-grass transition-colors">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:text-grass transition-colors">
                <User className="h-[18px] w-[18px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              aria-label="Login"
              className="p-2 hover:text-grass transition-colors hidden sm:inline-flex"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
          )}

          <button aria-label="Menu" className="p-2 lg:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-white">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="py-2 text-sm font-medium hover:text-grass"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link to="/auth" className="py-2 text-sm font-medium hover:text-grass" onClick={() => setOpen(false)}>
                Masuk / Daftar
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
