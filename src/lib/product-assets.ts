// Maps seed filenames stored in DB (e.g. "p1.jpg") to bundled asset URLs.
const modules = import.meta.glob("/src/assets/*.{jpg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const map: Record<string, string> = {};
for (const path in modules) {
  const file = path.split("/").pop()!;
  map[file] = modules[path];
}

export function resolveProductImage(name: string | null | undefined): string {
  if (!name) return map["p1.jpg"] ?? "";
  if (name.startsWith("http") || name.startsWith("/")) return name;
  return map[name] ?? map["p1.jpg"] ?? "";
}

export function formatIDR(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
