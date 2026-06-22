import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createSnapTransaction, getMidtransPublicConfig } from "@/lib/midtrans.functions";
import { toast } from "sonner";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (r: unknown) => void;
          onPending?: (r: unknown) => void;
          onError?: (r: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

async function loadSnap(clientKey: string, isProduction: boolean): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.snap) return;
  const src = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-midtrans="snap"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Gagal memuat Snap.js")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.midtrans = "snap";
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Snap.js"));
    document.head.appendChild(s);
  });
}

export function MidtransPaymentButton({
  orderNumber,
  onPaid,
  className,
  label = "Bayar Sekarang",
}: {
  orderNumber: string;
  onPaid?: () => void;
  className?: string;
  label?: string;
}) {
  const createTx = useServerFn(createSnapTransaction);
  const getCfg = useServerFn(getMidtransPublicConfig);
  const [loading, setLoading] = useState(false);
  const cfgRef = useRef<{ clientKey: string; isProduction: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    getCfg()
      .then((cfg) => {
        if (!alive) return;
        cfgRef.current = cfg;
        if (cfg.clientKey) void loadSnap(cfg.clientKey, cfg.isProduction).catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [getCfg]);

  async function handlePay() {
    setLoading(true);
    try {
      const cfg = cfgRef.current ?? (await getCfg());
      cfgRef.current = cfg;
      if (!cfg.clientKey) throw new Error("Client key Midtrans belum dikonfigurasi");
      await loadSnap(cfg.clientKey, cfg.isProduction);
      const tx = await createTx({ data: { orderNumber } });
      if (!window.snap) throw new Error("Snap belum siap, coba lagi");
      window.snap.pay(tx.token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil");
          onPaid?.();
        },
        onPending: () => {
          toast.info("Pembayaran sedang diproses");
          onPaid?.();
        },
        onError: () => toast.error("Pembayaran gagal"),
        onClose: () => {},
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handlePay} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}
