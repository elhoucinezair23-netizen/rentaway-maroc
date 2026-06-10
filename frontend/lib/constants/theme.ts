/**
 * Design tokens — RentaWay Maroc
 * Source de vérité pour les couleurs, typographies et espacements.
 * Synchronisé avec tailwind.config.ts.
 */

export const BRAND = {
  name: "RentaWay",
  region: "MAROC",
  fullName: "RentaWay Maroc",
  tagline: "Louez partout au Maroc en toute confiance",
} as const;

export const COLORS = {
  primary: "#E63946",
  secondary: "#1D3557",
  accent: "#F4A261",
  bgLight: "#F8F9FA",
  bgWhite: "#FFFFFF",
  textDark: "#212529",
  textMuted: "#6C757D",
  success: "#2DC653",
  danger: "#E63946",
  border: "#E9ECEF",
} as const;

export const FONTS = {
  sans: "Inter, sans-serif",
  arabic: "Cairo, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const RADIUS = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  pill: "9999px",
} as const;

export const SHADOWS = {
  soft: "0 4px 16px rgba(15, 23, 42, 0.06)",
  card: "0 8px 24px rgba(15, 23, 42, 0.08)",
  lift: "0 16px 40px rgba(15, 23, 42, 0.12)",
} as const;

export type BrandColor = keyof typeof COLORS;
