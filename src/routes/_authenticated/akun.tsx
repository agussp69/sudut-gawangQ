import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { User, MapPin, Package, Heart, Bell, LogOut } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/akun")({
  head: () => ({ meta: [{ title: "Akun Saya — Sudut Gawang" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

const NAV = [
  { to: "/akun/profil", label: "Profil", icon: User },
  { to: "/akun/alamat", label: "Alamat", icon: MapPin },
  { to: "/akun/pesanan", label: "Pesanan", icon: Package },
  { to: "/akun/wishlist", label: "Wishlist", icon: Heart },
  { to: "/akun/notifikasi", label: "Notifikasi", icon: Bell },
] as const;

function AccountLayout() {
  const router = useRouter();
  const { pathname } = useLocation();
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.navigate({ to: "/" });
  }
  return (
    <>
      <Navbar />
      <main className="container-x py-10 min-h-[60vh]">
        <h1 className="text-3xl font-extrabold tracking-tight text-forest mb-8">Akun Saya</h1>
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active ? "bg-grass/10 text-forest font-medium" : "text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-left text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </aside>
          <section>
            <Outlet />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
