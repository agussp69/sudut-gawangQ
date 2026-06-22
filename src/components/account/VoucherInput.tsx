import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, X, Loader2 } from "lucide-react";
import { formatIDR } from "@/lib/product-assets";

export type AppliedVoucher = { code: string; discount: number };

export function VoucherInput({
  subtotal,
  applied,
  onApply,
  onClear,
}: {
  subtotal: number;
  applied: AppliedVoucher | null;
  onApply: (v: AppliedVoucher) => void;
  onClear: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("apply_voucher", {
      p_code: code.trim(),
      p_subtotal: subtotal,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    const row = data?.[0];
    if (!row) return toast.error("Voucher tidak valid");
    onApply({ code: row.code, discount: Number(row.discount) });
    toast.success(`Voucher diterapkan: -${formatIDR(Number(row.discount))}`);
    setCode("");
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 border border-grass/40 bg-grass/5 rounded-md p-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="h-4 w-4 text-grass shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-forest truncate">{applied.code}</div>
            <div className="text-xs text-muted-foreground">Hemat {formatIDR(applied.discount)}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Hapus voucher"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Kode voucher"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="h-9"
      />
      <Button type="button" variant="outline" size="sm" onClick={apply} disabled={loading || !code.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terapkan"}
      </Button>
    </div>
  );
}
