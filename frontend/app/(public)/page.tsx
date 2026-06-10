import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { CitiesSection } from "@/components/home/CitiesSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";

export const metadata: Metadata = {
  title: "RentaWay Maroc — Louez partout au Maroc en toute confiance",
  description:
    "Réservez une voiture, moto, bateau ou jet-ski au Maroc. 500+ véhicules dans 27 villes. Agences vérifiées, paiement sécurisé.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <FeaturedVehicles />
      <CitiesSection />
      <HowItWorks />
      <Testimonials />
      <Newsletter />
    </div>
  );
}
