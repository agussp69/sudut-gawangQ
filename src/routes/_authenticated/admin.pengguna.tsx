import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pengguna")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  const grant = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Akses admin dicabut");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden">
      <div className="divide-y">
        {users.isLoading && <p className="p-6 text-sm text-muted-foreground">Memuat…</p>}
        {users.data?.map((u) => {
          const isAdmin = u.roles.includes("admin");
          return (
            <div key={u.id} className="flex items-center justify-between p-4 gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name ?? "Tanpa nama"}</p>
                <p className="text-xs text-muted-foreground">{u.phone ?? "—"} · daftar {new Date(u.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && <span className="text-xs px-2 py-1 rounded bg-grass/10 text-forest font-medium">Admin</span>}
                {isAdmin ? (
                  <Button variant="outline" size="sm" onClick={() => revoke.mutate(u.id)}>
                    <ShieldOff className="h-4 w-4 mr-1" /> Cabut
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => grant.mutate(u.id)}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Jadikan Admin
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
