import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type Product = {
  id: string;
  name: string;
  club: string;
  season: string;
  price: string;
  img: string;
  badge?: "New" | "Vintage" | "Limited";
};

export const products: Product[] = [
  { id: "1", name: "Home Kit Authentic", club: "Roja FC", season: "2025/26", price: "Rp 1.299.000", img: p1, badge: "New" },
  { id: "2", name: "Away Stripe", club: "Atletico Vela", season: "2025/26", price: "Rp 1.149.000", img: p2, badge: "New" },
  { id: "3", name: "Heritage White", club: "Real Branco", season: "2024/25", price: "Rp 999.000", img: p3 },
  { id: "4", name: "Black & Gold Edition", club: "Lions United", season: "1998", price: "Rp 2.450.000", img: p4, badge: "Vintage" },
  { id: "5", name: "Canary Classic", club: "Amarillo SC", season: "1994", price: "Rp 1.890.000", img: p5, badge: "Vintage" },
  { id: "6", name: "Sky Stripe", club: "Celesta CF", season: "2025/26", price: "Rp 1.349.000", img: p6, badge: "Limited" },
];
