import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/akun/profil")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .eq("id", u.user!.id)
        .maybeSingle();
      if (error) throw error;
      return { ...data!, email: u.user!.email };
    },
  });

  useEffect(() => {
    async function load() {
      const path = profileQ.data?.avatar_url;
      if (!path) return setAvatarUrl(null);
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarUrl(data?.signedUrl ?? null);
    }
    load();
  }, [profileQ.data?.avatar_url]);

  const save = useMutation({
    mutationFn: async (vals: { full_name: string; phone: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: vals.full_name, phone: vals.phone })
        .eq("id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil disimpan");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password diperbarui"),
    onError: (e: Error) => toast.error(e.message),
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Maks 2MB");
    const { data: u } = await supabase.auth.getUser();
    const ext = file.name.split(".").pop();
    const path = `${u.user!.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { error: upErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", u.user!.id);
    if (upErr) return toast.error(upErr.message);
    toast.success("Foto profil diperbarui");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  if (profileQ.isLoading) return <Skeleton className="h-64 w-full" />;
  const p = profileQ.data!;

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-forest mb-4">Foto Profil</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden grid place-items-center text-2xl font-bold text-forest">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              (p.full_name?.[0] ?? "U").toUpperCase()
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Unggah Foto
          </Button>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save.mutate({
            full_name: String(f.get("full_name") ?? ""),
            phone: String(f.get("phone") ?? ""),
          });
        }}
      >
        <h2 className="text-lg font-semibold text-forest">Informasi Akun</h2>
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input value={p.email ?? ""} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="full_name">Nama Lengkap</Label>
          <Input id="full_name" name="full_name" defaultValue={p.full_name ?? ""} required maxLength={100} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">No. Telepon</Label>
          <Input id="phone" name="phone" defaultValue={p.phone ?? ""} maxLength={20} />
        </div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
        </Button>
      </form>

      <form
        className="space-y-4 border-t pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const pw = String(f.get("password") ?? "");
          if (pw.length < 6) return toast.error("Minimal 6 karakter");
          changePassword.mutate(pw);
          e.currentTarget.reset();
        }}
      >
        <h2 className="text-lg font-semibold text-forest">Ganti Password</h2>
        <div className="grid gap-2">
          <Label htmlFor="password">Password Baru</Label>
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        <Button type="submit" variant="outline" disabled={changePassword.isPending}>
          Perbarui Password
        </Button>
      </form>
    </div>
  );
}
