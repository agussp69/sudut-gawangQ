import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveProductImage, formatIDR } from "@/lib/product-assets";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(["new", "vintage"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});
type ShopSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Shop Jersey Original — Sudut Gawang" },
      {
        name: "description",
        content: "Telusuri koleksi jersey sepak bola original: klub, tim nasional, vintage, dan jaket resmi.",
      },
    ],
  }),
  component: ShopPage,
});

const PAGE_SIZE = 12;

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [qInput, setQInput] = useState(search.q ?? "");

  useEffect(() => {
    setQInput(search.q ?? "");
  }, [search.q]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== (search.q ?? "")) {
        navigate({ search: (prev) => ({ ...prev, q: qInput || undefined }) });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [qInput, search.q, navigate]);

  const filtersQuery = useQuery({
    queryKey: ["filters"],
    queryFn: async () => {
      const [cats, brands] = await Promise.all([
        supabase.from("categories").select("id, name, slug").order("sort_order"),
        supabase.from("brands").select("id, name, slug").order("name"),
      ]);
      return { categories: cats.data ?? [], brands: brands.data ?? [] };
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, slug, club, season, price, discount_price, thumbnail_url, badge, condition, brand:brands(name,slug), category:categories(name,slug)")
        .eq("is_published", true)
        .limit(PAGE_SIZE * 4);

      if (search.q) q = q.ilike("name", `%${search.q}%`);
      if (search.condition) q = q.eq("condition", search.condition);

      if (search.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (search.sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      let rows = data ?? [];
      if (search.category) rows = rows.filter((p: any) => p.category?.slug === search.category);
      if (search.brand) rows = rows.filter((p: any) => p.brand?.slug === search.brand);
      return rows;
    },
  });

  const products = productsQuery.data ?? [];

  function updateSearch(patch: Record<string, string | undefined>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container-x py-10">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-grass font-semibold">Katalog</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-forest mt-2">
              Shop Jersey Original
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Telusuri koleksi lengkap jersey klub, tim nasional, hingga vintage. Semua 100% original dengan
              dokumentasi keaslian.
            </p>
          </header>

          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            {/* Filter sidebar */}
            <aside className="space-y-8">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-forest mb-2 block">
                  Cari
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Cari nama atau klub..."
                    className="pl-9"
                  />
                </div>
              </div>

              <FilterGroup title="Kategori">
                <FilterItem
                  active={!search.category}
                  onClick={() => updateSearch({ category: undefined })}
                  label="Semua kategori"
                />
                {filtersQuery.data?.categories.map((c) => (
                  <FilterItem
                    key={c.slug}
                    active={search.category === c.slug}
                    onClick={() => updateSearch({ category: c.slug })}
                    label={c.name}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Brand">
                <FilterItem
                  active={!search.brand}
                  onClick={() => updateSearch({ brand: undefined })}
                  label="Semua brand"
                />
                {filtersQuery.data?.brands.map((b) => (
                  <FilterItem
                    key={b.slug}
                    active={search.brand === b.slug}
                    onClick={() => updateSearch({ brand: b.slug })}
                    label={b.name}
                  />
                ))}
              </FilterGroup>

              <FilterGroup title="Kondisi">
                <FilterItem
                  active={!search.condition}
                  onClick={() => updateSearch({ condition: undefined })}
                  label="Semua"
                />
                <FilterItem
                  active={search.condition === "new"}
                  onClick={() => updateSearch({ condition: "new" })}
                  label="Baru"
                />
                <FilterItem
                  active={search.condition === "vintage"}
                  onClick={() => updateSearch({ condition: "vintage" })}
                  label="Vintage"
                />
              </FilterGroup>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ search: {} })}
              >
                Reset Filter
              </Button>
            </aside>

            {/* Products */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {productsQuery.isLoading
                    ? "Memuat produk..."
                    : `${products.length} produk ditemukan`}
                </p>
                <Select
                  value={search.sort ?? "newest"}
                  onValueChange={(v) => updateSearch({ sort: v === "newest" ? undefined : v })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="price_asc">Harga Terendah</SelectItem>
                    <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {productsQuery.isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-xl">
                  <p className="text-lg font-semibold text-forest">Tidak ada produk ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p: any) => (
                    <Link
                      key={p.id}
                      to="/produk/$slug"
                      params={{ slug: p.slug }}
                      className="group block"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                        <img
                          src={resolveProductImage(p.thumbnail_url)}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {p.badge && (
                          <Badge className="absolute top-3 left-3 bg-grass text-white border-0 uppercase text-[10px] tracking-wider">
                            {p.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">{p.club} · {p.season}</p>
                        <h3 className="text-sm font-semibold text-forest mt-1 line-clamp-1 group-hover:text-grass transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-sm font-bold text-foreground mt-1">{formatIDR(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-forest mb-3">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterItem({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left text-sm py-1.5 px-2 rounded transition-colors ${
        active ? "bg-grass text-white font-medium" : "text-foreground/80 hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
