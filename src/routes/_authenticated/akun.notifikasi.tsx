import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/akun/notifikasi")({
  head: () => ({ meta: [{ title: "Notifikasi — Sudut Gawang" }, { name: "robots", content: "noindex" }] }),
  component: NotifPage,
});

function NotifPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["notifications-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function markAll() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", u.user.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications-full"] });
    qc.invalidateQueries({ queryKey: ["notifications", u.user.id] });
  }

  async function open(n: { id: string; link: string | null; is_read: boolean }) {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      qc.invalidateQueries({ queryKey: ["notifications-full"] });
    }
    if (n.link) navigate({ to: n.link });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-forest">Notifikasi</h2>
        <Button variant="outline" size="sm" onClick={markAll}>
          <CheckCheck className="h-4 w-4 mr-2" /> Tandai semua dibaca
        </Button>
      </div>
      {q.isLoading ? (
        <Skeleton className="h-64" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">Belum ada notifikasi.</div>
      ) : (
        <ul className="divide-y border rounded-lg">
          {q.data.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                className={`w-full text-left p-4 hover:bg-muted transition-colors ${n.is_read ? "opacity-70" : "bg-grass/5"}`}
              >
                <div className="font-medium text-forest text-sm">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("id-ID")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
