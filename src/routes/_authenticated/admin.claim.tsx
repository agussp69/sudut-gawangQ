import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/use-admin";

export const Route = createFileRoute("/_authenticated/admin/claim")({
  component: ClaimAdminPage,
});

function ClaimAdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

  const claim = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("claim_admin_role");
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["is-admin"] });
      toast.success("Selamat, kamu sekarang admin!");
      navigate({ to: "/admin" });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal mengklaim peran admin"),
  });

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-8 text-center space-y-4">
        <ShieldCheck className="h-12 w-12 text-grass mx-auto" />
        <h1 className="text-2xl font-extrabold tracking-tight text-forest">Akses Admin</h1>
        {isAdmin ? (
          <>
            <p className="text-sm text-muted-foreground">Kamu sudah memiliki akses admin.</p>
            <Button onClick={() => navigate({ to: "/admin" })} className="w-full">Buka Dashboard</Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Belum ada admin pada toko ini. Klaim peran admin sekarang untuk mulai mengelola Sudut Gawang.
            </p>
            <Button onClick={() => claim.mutate()} disabled={claim.isPending} className="w-full">
              {claim.isPending ? "Memproses…" : "Klaim Admin"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Jika sudah ada admin, hubungi admin yang ada untuk mendapatkan akses.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
