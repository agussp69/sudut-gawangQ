import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/account/RatingStars";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ulasan")({
  head: () => ({ meta: [{ title: "Ulasan — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReviewsAdmin,
});

function ReviewsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<number | "all">("all");

  const q = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let qb = supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id, product:products(name,slug), profile:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") qb = qb.eq("rating", filter);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ulasan dihapus");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-forest">Ulasan Produk</h2>
        <div className="flex gap-1">
          {(["all", 5, 4, 3, 2, 1] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                filter === f ? "bg-grass text-white border-grass" : "border-border hover:bg-muted"
              }`}
            >
              {f === "all" ? "Semua" : `${f}★`}
            </button>
          ))}
        </div>
      </div>
      {q.isLoading ? (
        <Skeleton className="h-64" />
      ) : !q.data?.length ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
          Belum ada ulasan.
        </div>
      ) : (
        <div className="space-y-3">
          {q.data.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <RatingStars value={r.rating} />
                    <span className="font-medium text-sm text-forest">
                      {(r.profile as { full_name?: string } | null)?.full_name ?? "Pelanggan"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {(r.product as { name?: string } | null)?.name}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirm("Hapus ulasan?") && del.mutate(r.id)}
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
