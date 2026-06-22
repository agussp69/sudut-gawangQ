import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatIDR } from "@/lib/product-assets";

export const Route = createFileRoute("/_authenticated/admin/voucher")({
  head: () => ({ meta: [{ title: "Voucher — Admin" }, { name: "robots", content: "noindex" }] }),
  component: VoucherPage,
});

type Voucher = {
  id?: string;
  code: string;
  description?: string | null;
  percent_off?: number | null;
  amount_off?: number | null;
  min_purchase?: number | null;
  quota?: number | null;
  used_count?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
};

function VoucherPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Voucher dihapus");
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("vouchers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vouchers"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-forest">Voucher</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4 mr-2" /> Voucher Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Voucher" : "Voucher Baru"}</DialogTitle>
            </DialogHeader>
            <VoucherForm
              initial={editing}
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-64" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
          Belum ada voucher.
        </div>
      ) : (
        <div className="grid gap-3">
          {q.data.map((v) => (
            <Card key={v.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="font-mono font-bold text-forest">{v.code}</code>
                  <Badge variant={v.is_active ? "default" : "secondary"}>
                    {v.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {v.percent_off ? (
                    <Badge variant="outline">{v.percent_off}%</Badge>
                  ) : v.amount_off ? (
                    <Badge variant="outline">-{formatIDR(v.amount_off)}</Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {v.description ?? "—"} • Terpakai {v.used_count ?? 0}
                  {v.quota ? `/${v.quota}` : ""}
                  {v.min_purchase ? ` • Min ${formatIDR(v.min_purchase)}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={v.is_active}
                  onCheckedChange={(c) => toggle.mutate({ id: v.id, is_active: c })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(v as Voucher);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirm("Hapus voucher?") && del.mutate(v.id)}
                >
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

function VoucherForm({ initial, onDone }: { initial: Voucher | null; onDone: () => void }) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<"percent" | "amount">(
    initial?.percent_off ? "percent" : "amount",
  );
  const [value, setValue] = useState(
    String(initial?.percent_off ?? initial?.amount_off ?? ""),
  );
  const [minPurchase, setMinPurchase] = useState(String(initial?.min_purchase ?? ""));
  const [quota, setQuota] = useState(String(initial?.quota ?? ""));
  const [validUntil, setValidUntil] = useState(
    initial?.valid_until ? initial.valid_until.slice(0, 10) : "",
  );
  const [active, setActive] = useState(initial?.is_active ?? true);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: code.toUpperCase().trim(),
        description: description || null,
        percent_off: type === "percent" ? Number(value) : null,
        amount_off: type === "amount" ? Number(value) : null,
        min_purchase: minPurchase ? Number(minPurchase) : null,
        quota: quota ? Number(quota) : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: active,
      };
      if (initial?.id) {
        const { error } = await supabase.from("vouchers").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vouchers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Voucher disimpan");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Kode</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </div>
      <div className="space-y-1.5">
        <Label>Deskripsi</Label>
        <Input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipe</Label>
          <select
            className="w-full h-10 border rounded-md px-3 text-sm bg-background"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "amount")}
          >
            <option value="percent">Persen (%)</option>
            <option value="amount">Nominal (Rp)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Nilai</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Min. Belanja</Label>
          <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Kuota</Label>
          <Input type="number" value={quota} onChange={(e) => setQuota(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Berlaku Sampai</Label>
        <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={active} onCheckedChange={setActive} id="vactive" />
        <Label htmlFor="vactive">Aktif</Label>
      </div>
      <Button onClick={() => save.mutate()} disabled={!code || !value || save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan"}
      </Button>
    </div>
  );
}
