import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/akun/alamat")({
  component: AddressPage,
});

type Address = {
  id: string;
  label: string | null;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  address: string;
  notes: string | null;
  is_default: boolean | null;
};

function AddressPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Address[];
    },
  });

  const save = useMutation({
    mutationFn: async (vals: Partial<Address> & { id?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = { ...vals, user_id: u.user!.id };
      if (vals.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", u.user!.id);
      }
      if (vals.id) {
        const { error } = await supabase.from("addresses").update(payload).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setOpen(false);
      setEditing(null);
      toast.success("Alamat tersimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Alamat dihapus");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-forest">Buku Alamat</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Alamat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Ubah Alamat" : "Alamat Baru"}</DialogTitle>
            </DialogHeader>
            <AddressForm
              initial={editing ?? undefined}
              onSubmit={(vals) => save.mutate({ ...vals, id: editing?.id })}
              loading={save.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          Belum ada alamat tersimpan.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {q.data.map((a) => (
            <div key={a.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-forest">
                    {a.label || "Alamat"} {a.is_default && <span className="text-xs ml-2 text-grass">• Utama</span>}
                  </div>
                  <div className="text-sm mt-1">{a.recipient}</div>
                  <div className="text-xs text-muted-foreground">{a.phone}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(a); setOpen(true); }} className="p-1 hover:text-grass">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove.mutate(a.id)} className="p-1 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {a.address}, {a.district ? a.district + ", " : ""}{a.city}, {a.province} {a.postal_code ?? ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddressForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Address>;
  onSubmit: (vals: Omit<Address, "id">) => void;
  loading?: boolean;
}) {
  const [isDefault, setIsDefault] = useState(!!initial?.is_default);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
          label: String(f.get("label") ?? "") || null,
          recipient: String(f.get("recipient") ?? ""),
          phone: String(f.get("phone") ?? ""),
          province: String(f.get("province") ?? ""),
          city: String(f.get("city") ?? ""),
          district: String(f.get("district") ?? "") || null,
          postal_code: String(f.get("postal_code") ?? "") || null,
          address: String(f.get("address") ?? ""),
          notes: String(f.get("notes") ?? "") || null,
          is_default: isDefault,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="label">Label</Label>
          <Input id="label" name="label" placeholder="Rumah, Kantor..." defaultValue={initial?.label ?? ""} maxLength={50} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="recipient">Nama Penerima *</Label>
          <Input id="recipient" name="recipient" required defaultValue={initial?.recipient ?? ""} maxLength={100} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="phone">No. Telepon *</Label>
        <Input id="phone" name="phone" required defaultValue={initial?.phone ?? ""} maxLength={20} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="province">Provinsi *</Label>
          <Input id="province" name="province" required defaultValue={initial?.province ?? ""} maxLength={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">Kota *</Label>
          <Input id="city" name="city" required defaultValue={initial?.city ?? ""} maxLength={100} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="district">Kecamatan</Label>
          <Input id="district" name="district" defaultValue={initial?.district ?? ""} maxLength={100} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="postal_code">Kode Pos</Label>
          <Input id="postal_code" name="postal_code" defaultValue={initial?.postal_code ?? ""} maxLength={10} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="address">Alamat Lengkap *</Label>
        <Textarea id="address" name="address" required defaultValue={initial?.address ?? ""} maxLength={500} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Catatan</Label>
        <Input id="notes" name="notes" defaultValue={initial?.notes ?? ""} maxLength={200} />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
        Jadikan alamat utama
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan Alamat
      </Button>
    </form>
  );
}
