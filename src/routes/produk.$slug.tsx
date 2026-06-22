import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, ShoppingBag, ShieldCheck, Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { resolveProductImage, formatIDR } from "@/lib/product-assets";
import { RatingStars } from "@/components/account/RatingStars";

export const Route = createFileRoute("/produk/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, club, country, season, price, discount_price, badge, condition, thumbnail_url, category_id, brand:brands(name,slug), category:categories(name,slug)",
      )
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { product: data };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Sudut Gawang` : "Produk — Sudut Gawang";
    const desc = p?.description?.slice(0, 155) ?? "Jersey sepak bola original.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-forest">Produk tidak ditemukan</h1>
        <Link to="/shop" className="text-grass underline mt-2 inline-block">
          Kembali ke katalog
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const sizesQuery = useQuery({
    queryKey: ["sizes", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_sizes")
        .select("size, stock")
        .eq("product_id", product.id)
        .order("size");
      return data ?? [];
    },
  });

  const imagesQuery = useQuery({
    queryKey: ["images", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_images")
        .select("url, sort_order")
        .eq("product_id", product.id)
        .order("sort_order");
      return data ?? [];
    },
  });

  const relatedQuery = useQuery({
    queryKey: ["related", product.category_id, product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, club, season, price, thumbnail_url, badge")
        .eq("is_published", true)
        .eq("category_id", product.category_id ?? "")
        .neq("id", product.id)
        .limit(4);
      return data ?? [];
    },
    enabled: !!product.category_id,
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id, profile:profiles(full_name,avatar_url)")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const reviews = reviewsQuery.data ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  async function addToCart() {
    if (!size) return toast.error("Pilih ukuran terlebih dahulu");
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error("Silakan masuk untuk menambah ke keranjang");
      router.navigate({ to: "/auth" });
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from("cart_items")
      .upsert(
        {
          user_id: sess.session.user.id,
          product_id: product.id,
          size,
          quantity: qty,
        },
        { onConflict: "user_id,product_id,size" },
      );
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Ditambahkan ke keranjang");
  }

  async function addToWishlist() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error("Silakan masuk untuk wishlist");
      router.navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase
      .from("wishlist")
      .upsert({ user_id: sess.session.user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
    if (error) return toast.error(error.message);
    toast.success("Disimpan ke wishlist");
  }

  const images = imagesQuery.data ?? [];
  const mainImage = resolveProductImage(images[0]?.url ?? product.thumbnail_url);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container-x py-10">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-grass">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-grass">Shop</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <div>
              <div className="aspect-square overflow-hidden rounded-xl bg-muted relative">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                />
                {product.badge && (
                  <Badge className="absolute top-4 left-4 bg-grass text-white uppercase tracking-wider">
                    {product.badge}
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-grass font-semibold">
                {(product.category as any)?.name ?? ""} · {(product.brand as any)?.name ?? ""}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-forest mt-2">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {product.club} · {product.country} · {product.season}
              </p>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <RatingStars value={avgRating} />
                  <span className="text-sm font-medium text-forest">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviews.length} ulasan)</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <ShieldCheck className="h-5 w-5 text-grass" />
                <span className="text-sm font-semibold text-forest">100% Original — Bergaransi Keaslian</span>
              </div>

              <p className="text-3xl font-extrabold text-foreground mt-6">{formatIDR(product.price)}</p>

              {/* Sizes */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-forest uppercase tracking-wider">Ukuran</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-grass hover:underline">Panduan ukuran</button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Panduan Ukuran Jersey</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm space-y-2">
                        <p><strong>S</strong> · Lebar dada 50cm · Panjang 68cm</p>
                        <p><strong>M</strong> · Lebar dada 53cm · Panjang 71cm</p>
                        <p><strong>L</strong> · Lebar dada 56cm · Panjang 74cm</p>
                        <p><strong>XL</strong> · Lebar dada 59cm · Panjang 76cm</p>
                        <p><strong>XXL</strong> · Lebar dada 62cm · Panjang 78cm</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {sizesQuery.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sizesQuery.data?.map((s) => {
                      const out = s.stock <= 0;
                      const active = size === s.size;
                      return (
                        <button
                          key={s.size}
                          disabled={out}
                          onClick={() => setSize(s.size)}
                          className={`h-11 min-w-12 px-4 rounded-md border text-sm font-semibold transition-all ${
                            out
                              ? "border-border text-muted-foreground line-through cursor-not-allowed"
                              : active
                                ? "border-grass bg-grass text-white"
                                : "border-border hover:border-grass"
                          }`}
                        >
                          {s.size}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Qty + CTA */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-11 w-11 grid place-items-center hover:bg-muted"
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-11 w-11 grid place-items-center hover:bg-muted"
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <Button
                  onClick={addToCart}
                  disabled={adding}
                  size="lg"
                  className="bg-grass hover:bg-grass/90 h-12"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  Tambah ke Keranjang
                </Button>
                <Button onClick={addToWishlist} size="lg" variant="outline" className="h-12 w-12 p-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-grass" />
                Pengiriman ke seluruh Indonesia · Estimasi 2–5 hari kerja
              </div>

              {/* Description */}
              <div className="mt-10 pt-8 border-t border-border">
                <h2 className="text-sm font-semibold text-forest uppercase tracking-wider mb-3">Deskripsi</h2>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Related */}
          {relatedQuery.data && relatedQuery.data.length > 0 && (
            <section className="mt-20">
              <h2 className="text-2xl font-extrabold tracking-tight text-forest mb-6">Produk Terkait</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedQuery.data.map((p) => (
                  <Link
                    key={p.id}
                    to="/produk/$slug"
                    params={{ slug: p.slug }}
                    className="group block"
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                      <img
                        src={resolveProductImage(p.thumbnail_url)}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{p.club}</p>
                    <h3 className="text-sm font-semibold text-forest mt-1 line-clamp-1 group-hover:text-grass">
                      {p.name}
                    </h3>
                    <p className="text-sm font-bold mt-1">{formatIDR(p.price)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-20 pt-10 border-t">
            <h2 className="text-2xl font-extrabold tracking-tight text-forest mb-6">Ulasan Pelanggan</h2>
            {reviewsQuery.isLoading ? (
              <Skeleton className="h-32" />
            ) : reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada ulasan untuk produk ini.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map((r) => {
                  const profile = r.profile as { full_name?: string | null } | null;
                  return (
                    <div key={r.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-grass/10 grid place-items-center font-bold text-grass text-sm">
                          {(profile?.full_name ?? "U")[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-forest">{profile?.full_name ?? "Pelanggan"}</div>
                          <div className="flex items-center gap-2">
                            <RatingStars value={r.rating} size={12} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm mt-3 text-foreground/80">{r.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
