export const COURIERS = [
  { id: "jne-reg", name: "JNE Reguler", cost: 25000, eta: "2-4 hari" },
  { id: "jnt-ez", name: "J&T Express", cost: 23000, eta: "2-3 hari" },
  { id: "sicepat-reg", name: "SiCepat REG", cost: 22000, eta: "2-3 hari" },
  { id: "anteraja", name: "AnterAja", cost: 24000, eta: "2-4 hari" },
] as const;

export const BANKS = [
  { id: "bca", name: "BCA", account: "1234567890", holder: "PT Sudut Gawang" },
  { id: "mandiri", name: "Mandiri", account: "9876543210", holder: "PT Sudut Gawang" },
  { id: "bni", name: "BNI", account: "5544332211", holder: "PT Sudut Gawang" },
] as const;

export type CourierId = (typeof COURIERS)[number]["id"];
export type BankId = (typeof BANKS)[number]["id"];

export function getCourier(id: string) {
  return COURIERS.find((c) => c.id === id);
}
export function getBank(id: string) {
  return BANKS.find((b) => b.id === id);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Menunggu Pembayaran",
  awaiting_verification: "Verifikasi Pembayaran",
  paid: "Pembayaran Diterima",
  processing: "Diproses",
  packed: "Dikemas",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export const ORDER_STATUS_FLOW = [
  "awaiting_payment",
  "awaiting_verification",
  "paid",
  "processing",
  "packed",
  "shipped",
  "completed",
] as const;
