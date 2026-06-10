import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { I18nProvider } from "@/components/providers/I18nProvider";

export const metadata: Metadata = {
  title: {
    default: "RentaWay Maroc — Louez partout au Maroc en toute confiance",
    template: "%s | RentaWay Maroc",
  },
  description:
    "Louez des voitures, motos, bateaux et jet-skis partout au Maroc. 500+ véhicules dans 27 villes. Agences vérifiées, réservation en ligne sécurisée.",
  keywords: [
    "rentaway maroc",
    "location voiture maroc",
    "location moto maroc",
    "location bateau maroc",
    "jet ski maroc",
    "agence location casablanca",
    "location véhicule marrakech",
  ],
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "RentaWay Maroc",
    description: "La plateforme de location de véhicules n°1 au Maroc",
    locale: "fr_MA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          <I18nProvider>
            {children}
          </I18nProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1f2937",
                color: "#fff",
                borderRadius: "8px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
