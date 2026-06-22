import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, MapPin, Truck, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";
import { COURIERS, BANKS } from "@/lib/shipping";
import { formatIDR, resolveProductImage } from "@/lib/product-assets";
import { VoucherInput, type AppliedVoucher } from "@/components/account/VoucherInput";
import { AddressForm } from "./akun.alamat";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Sudut Gawang" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

const STEPS = ["Alamat", "Pengiriman", "Pembayaran", "Konfirmasi"];

function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [courierId, setCourierId] = useState<string>(COURIERS[0].id);
  const [bankId, setBankId] = useState<string>(BANKS[0].id);
  const [openAddr, setOpenAddr] = useState(false);
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);

  const cartQ = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, product_id, size, quantity, product:products(id,name,slug,price,discount_price,thumbnail_url)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addrQ = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      if (data?.length && !addressId) setAddressId(data.find((a) => a.is_default)?.id ?? data[0].id);
      return data ?? [];
    },
  });

  const saveAddr = useMutation({
    mutationFn: async (vals: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("addresses").insert({ ...vals, user_id: u.user!.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setOpenAddr(false);
      toast.success("Alamat ditambahkan");
    },
  });

  const courier = COURIERS.find((c) => c.id === courierId)!;
  const bank = BANKS.find((b) => b.id === bankId)!;
  const items = cartQ.data ?? [];
  const subtotal = items.reduce(
    (s, it) => s + Number(it.product?.discount_price ?? it.product?.price ?? 0) * it.quantity,
    0,
  );
  const discount = voucher?.discount ?? 0;
  const total = Math.max(0, subtotal + courier.cost - discount);
  const selectedAddress = addrQ.data?.find((a) => a.id === addressId);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) throw new Error("Pilih alamat terlebih dahulu");
      const { data, error } = await supabase.rpc("place_order", {
        p_shipping_address: selectedAddress as unknown as never,
        p_courier: courier.name,
        p_shipping_cost: courier.cost,
        p_payment_method: bank.name,
        p_notes: null,
        p_voucher_code: voucher?.code ?? null,
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Pesanan berhasil dibuat");
      router.navigate({ to: "/pesanan/$orderNumber", params: { orderNumber: res!.order_number } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cartQ.isLoading) return <><Navbar /><div className="container-x py-10"><Skeleton className="h-64" /></div></>;

  if (!items.length) {
    return (
      <>
        <Navbar />
        <main className="container-x py-16 text-center min-h-[50vh]">
          <p className="text-muted-foreground mb-4">Keranjang Anda kosong.</p>
          <Link to="/shop"><Button>Mulai Belanja</Button></Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-x py-10 min-h-[60vh]">
        <h1 className="text-3xl font-extrabold tracking-tight text-forest mb-8">Checkout</h1>

        <ol className="flex items-center gap-2 mb-8 text-xs font-medium overflow-x-auto">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 shrink-0">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full ${
                  i <= step ? "bg-grass text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i <= step ? "text-forest" : "text-muted-foreground"}>{s}</span>
              {i < STEPS.length - 1 && <span className="w-8 h-px bg-border" />}
            </li>
          ))}
        </ol>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            {step === 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-forest flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Alamat Pengiriman
                  </h2>
                  <Dialog open={openAddr} onOpenChange={setOpenAddr}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Alamat Baru</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Alamat Baru</DialogTitle></DialogHeader>
                      <AddressForm onSubmit={(v) => saveAddr.mutate(v as unknown as Record<string, unknown>)} loading={saveAddr.isPending} />
                    </DialogContent>
                  </Dialog>
                </div>

                {addrQ.isLoading ? (
                  <Skeleton className="h-40" />
                ) : !addrQ.data?.length ? (
                  <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    Belum ada alamat. Tambahkan alamat baru untuk melanjutkan.
                  </div>
                ) : (
                  <RadioGroup value={addressId ?? ""} onValueChange={setAddressId} className="space-y-3">
                    {addrQ.data.map((a) => (
                      <label
                        key={a.id}
                        className="flex gap-3 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-grass has-[:checked]:bg-grass/5"
                      >
                        <RadioGroupItem value={a.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="font-medium text-forest">
                            {a.label || "Alamat"} {a.is_default && <span className="text-xs text-grass ml-2">• Utama</span>}
                          </div>
                          <div className="text-sm">{a.recipient} — {a.phone}</div>
                          <div className="text-sm text-muted-foreground">
                            {a.address}, {a.district ? a.district + ", " : ""}{a.city}, {a.province} {a.postal_code ?? ""}
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                )}
                <Button disabled={!addressId} onClick={() => setStep(1)}>Lanjut</Button>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-forest flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Pilih Kurir
                </h2>
                <RadioGroup value={courierId} onValueChange={setCourierId} className="space-y-2">
                  {COURIERS.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer has-[:checked]:border-grass has-[:checked]:bg-grass/5">
                      <RadioGroupItem value={c.id} />
                      <div className="flex-1">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">Estimasi {c.eta}</div>
                      </div>
                      <div className="font-semibold text-forest">{formatIDR(c.cost)}</div>
                    </label>
                  ))}
                </RadioGroup>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)}>Kembali</Button>
                  <Button onClick={() => setStep(2)}>Lanjut</Button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-forest flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Metode Pembayaran
                </h2>
                <p className="text-sm text-muted-foreground">Transfer manual — Anda akan diberikan info rekening setelah pesanan dibuat.</p>
                <RadioGroup value={bankId} onValueChange={setBankId} className="space-y-2">
                  {BANKS.map((b) => (
                    <label key={b.id} className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer has-[:checked]:border-grass has-[:checked]:bg-grass/5">
                      <RadioGroupItem value={b.id} />
                      <div className="flex-1">
                        <div className="font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">a.n. {b.holder}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                  <Button onClick={() => setStep(3)}>Lanjut</Button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-forest">Konfirmasi Pesanan</h2>
                <div className="border rounded-lg p-4 space-y-1 text-sm">
                  <div className="font-medium text-forest">{selectedAddress?.recipient} — {selectedAddress?.phone}</div>
                  <div className="text-muted-foreground">
                    {selectedAddress?.address}, {selectedAddress?.city}, {selectedAddress?.province} {selectedAddress?.postal_code ?? ""}
                  </div>
                </div>
                <div className="border rounded-lg p-4 text-sm">
                  <div>Kurir: <span className="font-medium">{courier.name}</span> ({formatIDR(courier.cost)})</div>
                  <div>Bank: <span className="font-medium">{bank.name}</span></div>
                </div>
                <div className="border rounded-lg divide-y">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-3 p-3">
                      <img src={resolveProductImage(it.product?.thumbnail_url)} alt="" className="h-14 w-14 object-cover rounded" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{it.product?.name}</div>
                        <div className="text-xs text-muted-foreground">Ukuran {it.size} • {it.quantity} pcs</div>
                      </div>
                      <div className="text-sm font-semibold">{formatIDR(Number(it.product?.discount_price ?? it.product?.price ?? 0) * it.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Kembali</Button>
                  <Button onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}>
                    {placeOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Buat Pesanan
                  </Button>
                </div>
              </section>
            )}
          </div>

          <aside className="border rounded-lg p-6 h-fit sticky top-24 text-sm space-y-2">
            <h2 className="font-semibold text-forest mb-2">Ringkasan</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({items.length} item)</span><span>{formatIDR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatIDR(courier.cost)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-grass"><span>Diskon ({voucher?.code})</span><span>-{formatIDR(discount)}</span></div>
            )}
            <div className="pt-2">
              <VoucherInput
                subtotal={subtotal}
                applied={voucher}
                onApply={setVoucher}
                onClear={() => setVoucher(null)}
              />
            </div>
            <div className="border-t pt-3 flex justify-between text-base">
              <span className="font-semibold text-forest">Total</span>
              <span className="font-bold text-forest">{formatIDR(total)}</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
