import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/shipping";

const VARIANTS: Record<string, string> = {
  awaiting_payment: "bg-amber-100 text-amber-900 border-amber-200",
  awaiting_verification: "bg-blue-100 text-blue-900 border-blue-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  processing: "bg-indigo-100 text-indigo-900 border-indigo-200",
  packed: "bg-violet-100 text-violet-900 border-violet-200",
  shipped: "bg-cyan-100 text-cyan-900 border-cyan-200",
  completed: "bg-grass/15 text-forest border-grass/30",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`font-medium ${VARIANTS[status] ?? ""}`}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
