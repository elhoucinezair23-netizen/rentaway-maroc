"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Bike, Anchor, Waves, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const CATEGORIES = [
  {
    href: "/search?category=VOITURE",
    titleKey: "categories.voitures",
    subtitleKey: "categories.voituresSub",
    priceUnit: "jour",
    price: "280",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    Icon: Car,
  },
  {
    href: "/search?category=MOTO",
    titleKey: "categories.motos",
    subtitleKey: "categories.motosSub",
    priceUnit: "jour",
    price: "180",
    img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    Icon: Bike,
  },
  {
    href: "/search?category=BATEAU",
    titleKey: "categories.bateaux",
    subtitleKey: "categories.bateauxSub",
    priceUnit: "heure",
    price: "600",
    img: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80",
    Icon: Anchor,
  },
  {
    href: "/search?category=JETSKI",
    titleKey: "categories.jetskis",
    subtitleKey: "categories.jetskisSub",
    priceUnit: "heure",
    price: "400",
    img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    Icon: Waves,
  },
];

export function CategoriesSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-gray-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-700">{t("categories.title")}</h2>
          <p className="text-gray-500 mt-2">Choisissez la catégorie qui vous fait rêver</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {CATEGORIES.map(({ href, titleKey, subtitleKey, priceUnit, price, img, Icon }, i) => {
            const unitLabel = priceUnit === "heure" ? t("vehicle.heure") : t("vehicle.jour");
            const badge = `${t("categories.des")} ${price} MAD/${unitLabel}`;
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  href={href}
                  className="group relative block aspect-[4/5] lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-card hover:shadow-lift transition-all duration-300 hover:-translate-y-1"
                >
                  <img
                    src={img}
                    alt={t(titleKey)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-primary-700 text-[11px] font-bold shadow">
                    <Icon className="h-3 w-3" />
                    {badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5 text-white">
                    <h3 className="text-lg lg:text-xl font-bold">{t(titleKey)}</h3>
                    <p className="text-xs lg:text-sm text-gray-200">{t(subtitleKey)}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-300 group-hover:text-accent-200">
                      {t("categories.decouvrir")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
