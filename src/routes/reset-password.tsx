import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/landing/Navbar";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Sudut Gawang" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    if (password.length < 6) return toast.error("Password minimal 6 karakter");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password berhasil diubah.");
    navigate({ to: "/auth" });
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-forest text-center">Reset Password</h1>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-8">Masukkan password baru Anda.</p>
          <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border p-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button className="w-full bg-grass hover:bg-grass/90" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
