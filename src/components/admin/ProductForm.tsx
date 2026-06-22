import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

type Size = { size: string; stock: number };

type Initial = {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string | null;
  brand_id?: string | null;
  category_id?: string | null;
  club?: string | null;
  country?: string | null;
  season?: string | null;
  description?: string | null;
  price?: number;
  discount_price?: number | null;
  condition?: "new" | "used" | "vintage";
  thumbnail_url?: string | null;
  is_published?: boolean;
  product_sizes?: Size[];
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ProductForm({ initial, onSaved }: { initial?: Initial; onSaved?: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [brandId, setBrandId] = useState(initial?.brand_id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [club, setClub] = useState(initial?.club ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [season, setSeason] = useState(initial?.season ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(
    initial?.discount_price != null ? String(initial.discount_price) : "",
  );
  const [condition, setCondition] = useState<Initial["condition"]>(initial?.condition ?? "new");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "");
  const [published, setPublished] = useState(initial?.is_published ?? true);
  const [sizes, setSizes] = useState<Size[]>(
    initial?.product_sizes && initial.product_sizes.length > 0
      ? initial.product_sizes
      : [{ size: "M", stock: 0 }],
  );

  const brands = useQuery({
    queryKey: ["brands-all"],
    queryFn: async () => (await supabase.from("brands").select("id,name").order("name")).data ?? [],
  });
  const categories = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug: slug || slugify(name),
        sku: sku || null,
        brand_id: brandId || null,
        category_id: categoryId || null,
        club: club || null,
        country: country || null,
        season: season || null,
        description: description || null,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        condition: condition!,
        thumbnail_url: thumbnailUrl || null,
        is_published: published,
      };
      let productId = initial?.id;
      if (isEdit) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }
      // sync sizes: simple strategy → delete all + insert all
      await supabase.from("product_sizes").delete().eq("product_id", productId!);
      const filteredSizes = sizes.filter((s) => s.size.trim());
      if (filteredSizes.length) {
        const { error: szErr } = await supabase
          .from("product_sizes")
          .insert(filteredSizes.map((s) => ({ product_id: productId!, size: s.size.trim(), stock: Number(s.stock) || 0 })));
        if (szErr) throw szErr;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Produk diperbarui" : "Produk dibuat");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      onSaved?.();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="p-6 space-y-5 max-w-3xl">
      <h2 className="text-xl font-bold text-forest">{isEdit ? "Edit Produk" : "Produk Baru"}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nama Produk</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="otomatis dari nama" />
        </div>
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={sku ?? ""} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Brand</Label>
          <select
            className="w-full h-10 border rounded-md px-3 text-sm bg-background"
            value={brandId ?? ""}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">—</option>
            {brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <select
            className="w-full h-10 border rounded-md px-3 text-sm bg-background"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">—</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Klub</Label>
          <Input value={club ?? ""} onChange={(e) => setClub(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Negara</Label>
          <Input value={country ?? ""} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Musim</Label>
          <Input value={season ?? ""} onChange={(e) => setSeason(e.target.value)} placeholder="2023/2024" />
        </div>
        <div className="space-y-1.5">
          <Label>Kondisi</Label>
          <select
            className="w-full h-10 border rounded-md px-3 text-sm bg-background"
            value={condition}
            onChange={(e) => setCondition(e.target.value as any)}
          >
            <option value="new">Baru</option>
            <option value="used">Bekas</option>
            <option value="vintage">Vintage</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Harga (IDR)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Harga Diskon (opsional)</Label>
          <Input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Gambar (URL atau nama file aset)</Label>
          <Input value={thumbnailUrl ?? ""} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="p1.jpg atau https://…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Deskripsi</Label>
          <Textarea rows={4} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ukuran & Stok</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSizes((s) => [...s, { size: "", stock: 0 }])}
          >
            + Tambah Ukuran
          </Button>
        </div>
        <div className="space-y-2">
          {sizes.map((sz, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                placeholder="S / M / L / XL"
                value={sz.size}
                onChange={(e) => setSizes((arr) => arr.map((x, i) => (i === idx ? { ...x, size: e.target.value } : x)))}
              />
              <Input
                type="number"
                placeholder="stok"
                value={sz.stock}
                onChange={(e) => setSizes((arr) => arr.map((x, i) => (i === idx ? { ...x, stock: Number(e.target.value) } : x)))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSizes((arr) => arr.filter((_, i) => i !== idx))}
              >
                Hapus
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={published} onCheckedChange={setPublished} id="pub" />
        <Label htmlFor="pub" className="cursor-pointer">Publikasikan</Label>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save.mutate()} disabled={!name || !price || save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" onClick={() => onSaved?.()}>Batal</Button>
      </div>
    </Card>
  );
}
