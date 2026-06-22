import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/banner")({
  head: () => ({ meta: [{ title: "Banner — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BannerPage,
});

type Banner = {
  id?: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  is_active: boolean;
  sort_order?: number;
};

function BannerPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner dihapus");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-forest">Banner</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-2" /> Banner Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Banner" : "Banner Baru"}</DialogTitle>
            </DialogHeader>
            <BannerForm
              initial={editing}
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["admin-banners"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-64" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
          Belum ada banner.
        </div>
      ) : (
        <div className="grid gap-3">
          {q.data.map((b) => (
            <Card key={b.id} className="p-3 flex gap-3 items-center">
              <img src={b.image_url} alt="" className="h-20 w-32 object-cover rounded bg-muted" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-forest">{b.title ?? "(Tanpa Judul)"}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {b.is_active ? "Aktif" : "Nonaktif"} • urutan {b.sort_order ?? 0}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(b as Banner); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirm("Hapus banner?") && del.mutate(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerForm({ initial, onDone }: { initial: Banner | null; onDone: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [active, setActive] = useState(initial?.is_active ?? true);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title || null,
        subtitle: subtitle || null,
        image_url: imageUrl,
        link_url: linkUrl || null,
        sort_order: Number(sortOrder) || 0,
        is_active: active,
      };
      if (initial?.id) {
        const { error } = await supabase.from("banners").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Banner disimpan");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label>Judul</Label><Input value={title ?? ""} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Subjudul</Label><Input value={subtitle ?? ""} onChange={(e) => setSubtitle(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>URL Gambar</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
      {imageUrl && <img src={imageUrl} alt="" className="h-32 w-full object-cover rounded bg-muted" />}
      <div className="space-y-1.5"><Label>Link Tujuan</Label><Input value={linkUrl ?? ""} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/shop" /></div>
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="space-y-1.5"><Label>Urutan</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
        <div className="flex items-center gap-2 pb-2">
          <Switch checked={active} onCheckedChange={setActive} id="bactive" /><Label htmlFor="bactive">Aktif</Label>
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={!imageUrl || save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan"}
      </Button>
    </div>
  );
}
