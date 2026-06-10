"use client";

import { motion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { ShieldCheck, Star, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[640px] md:min-h-[720px] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0 bg-secondary-700">
        <img
          src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1920"
          alt="Paysage marocain"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary-900/70 via-secondary-800/55 to-secondary-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6">
            <Star className="h-3.5 w-3.5 text-accent-400 fill-accent-400" />
            Plus de 2000 clients satisfaits — Note 4.8/5
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            {t("hero.title")}
            <span className="block mt-2 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400 bg-clip-text text-transparent">
              {t("hero.subtitle")}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-200 max-w-2xl mx-auto">
            Voitures · Motos · Bateaux · Jet-skis
            <span className="block mt-1 text-sm text-gray-300">
              {t("hero.description")}
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <SearchBar variant="hero" />
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-200"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent-400" /> Paiement sécurisé</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent-400" /> 27 villes</span>
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-accent-400" /> Agences vérifiées</span>
          <span className="flex items-center gap-1.5">✓ Annulation gratuite 24h avant</span>
        </motion.div>
      </div>
    </section>
  );
}
