"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const CITIES = [
  { name: "Casablanca", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800", count: 124 },
  { name: "Marrakech",  img: "https://images.unsplash.com/photo-1597212618440-806262de4f0b?w=800", count: 98  },
  { name: "Agadir",     img: "https://images.unsplash.com/photo-1590179068383-b9c69aacebd3?w=800", count: 76  },
  { name: "Tanger",     img: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800", count: 64  },
  { name: "Dakhla",     img: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800", count: 32  },
  { name: "Oujda",      img: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800", count: 41  },
];

export function CitiesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-700">{t("cities.title")}</h2>
          <p className="text-gray-500 mt-2">{t("cities.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {CITIES.map(({ name, img, count }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <Link
                href={`/search?city=${encodeURIComponent(name)}`}
                className="group relative block aspect-[4/3] rounded-2xl overflow-hidden shadow-card hover:shadow-lift transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={img}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="h-4 w-4 text-accent-400" />
                    <h3 className="text-lg lg:text-xl font-bold">{name}</h3>
                  </div>
                  <p className="text-xs lg:text-sm text-gray-200">
                    {count} {t("cities.vehicules")}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
