import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, ShieldCheck, Tag, Star, Image as ImageIcon } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useIsAdmin } from "@/hooks/use-admin";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Sudut Gawang" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pesanan", label: "Pesanan", icon: ShoppingBag, exact: false },
  { to: "/admin/produk", label: "Produk", icon: Package, exact: false },
  { to: "/admin/voucher", label: "Voucher", icon: Tag, exact: false },
  { to: "/admin/banner", label: "Banner", icon: ImageIcon, exact: false },
  { to: "/admin/ulasan", label: "Ulasan", icon: Star, exact: false },
  { to: "/admin/pengguna", label: "Pengguna", icon: Users, exact: false },
] as const;

function AdminLayout() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin === false && pathname !== "/admin/claim") {
      navigate({ to: "/admin/claim" });
    }
  }, [isAdmin, isLoading, pathname, navigate]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container-x py-20 text-center text-muted-foreground">Memuat…</main>
      </>
    );
  }

  if (pathname === "/admin/claim") {
    return (
      <>
        <Navbar />
        <main className="container-x py-10 min-h-[60vh]">
          <Outlet />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Navbar />
      <main className="container-x py-10 min-h-[70vh]">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-7 w-7 text-grass" />
          <h1 className="text-3xl font-extrabold tracking-tight text-forest">Admin Panel</h1>
        </div>
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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
          </aside>
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
