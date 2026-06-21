import { Check, Clock } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW } from "@/lib/shipping";

export function OrderTimeline({
  history,
  currentStatus,
}: {
  history: { status: string; changed_at: string; note?: string | null }[];
  currentStatus: string;
}) {
  const reached = new Set(history.map((h) => h.status));
  reached.add(currentStatus);
  const currentIdx = ORDER_STATUS_FLOW.indexOf(currentStatus as (typeof ORDER_STATUS_FLOW)[number]);

  return (
    <ol className="space-y-4">
      {ORDER_STATUS_FLOW.map((s, idx) => {
        const done = idx <= currentIdx && currentIdx >= 0;
        const isCurrent = idx === currentIdx;
        const entry = history.find((h) => h.status === s);
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  done ? "bg-grass text-white border-grass" : "bg-white text-muted-foreground border-border"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              {idx < ORDER_STATUS_FLOW.length - 1 && (
                <div className={`w-px flex-1 mt-1 ${done ? "bg-grass" : "bg-border"}`} />
              )}
            </div>
            <div className="pb-4">
              <div className={`text-sm font-medium ${isCurrent ? "text-forest" : ""}`}>
                {ORDER_STATUS_LABEL[s]}
              </div>
              {entry && (
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.changed_at).toLocaleString("id-ID")}
                  {entry.note ? ` — ${entry.note}` : ""}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
