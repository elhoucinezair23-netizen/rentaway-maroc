import type { VehicleCategory } from "@/types";

export const CATEGORY_FALLBACK: Record<VehicleCategory, string> = {
  VOITURE: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
  MOTO:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  BATEAU:  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
  JETSKI:  "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800",
};

export const GENERIC_FALLBACK =
  "https://placehold.co/800x600/1D3557/E63946?text=RentaWay";

export const AVATAR_FALLBACK = (name?: string) => {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `https://placehold.co/100x100/E63946/ffffff?text=${encodeURIComponent(initials)}`;
};
