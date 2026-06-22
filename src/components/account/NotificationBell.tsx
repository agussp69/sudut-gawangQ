import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  if (!user) return null;

  const items = q.data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  async function open(n: { id: string; link: string | null; is_read: boolean }) {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
    }
    if (n.link) navigate({ to: n.link });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 hover:text-grass transition-colors" aria-label="Notifikasi">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 grid place-items-center">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="font-semibold text-sm text-forest">Notifikasi</div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-grass hover:underline inline-flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Tandai dibaca
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Belum ada notifikasi</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left px-3 py-3 border-b last:border-0 hover:bg-muted transition-colors ${
                  n.is_read ? "opacity-70" : "bg-grass/5"
                }`}
              >
                <div className="text-sm font-medium text-forest">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("id-ID")}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="border-t p-2 text-center">
          <Link to="/akun/notifikasi" className="text-xs text-grass hover:underline">
            Lihat semua
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
