import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/landing/Navbar";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Lupa Password — Sudut Gawang" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    if (!email) return toast.error("Masukkan email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Tautan reset password telah dikirim ke email Anda.");
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-forest text-center">Lupa Password</h1>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-8">
            Masukkan email Anda dan kami akan kirim tautan reset.
          </p>
          <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border p-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button className="w-full bg-grass hover:bg-grass/90" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Tautan Reset"}
            </Button>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:text-grass">
              Kembali ke halaman masuk
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
