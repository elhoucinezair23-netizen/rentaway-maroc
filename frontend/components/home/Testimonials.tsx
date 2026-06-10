"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Samira Bennani",
    city: "Casablanca",
    rating: 5,
    text: "Réservation ultra simple, voiture impeccable récupérée à l'heure. L'équipe a été très professionnelle. Je recommande à 100% !",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
  },
  {
    name: "Khalid El Fassi",
    city: "Marrakech",
    rating: 5,
    text: "J'ai loué une moto pour explorer l'Atlas. Très bonne machine, propre, papiers en règle. Le support a répondu en 2 minutes par WhatsApp.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
  },
  {
    name: "Hassan Alaoui",
    city: "Agadir",
    rating: 5,
    text: "Excursion en jet-ski à Agadir, un moment inoubliable ! Briefing sécurité parfait, prix transparent, aucune mauvaise surprise.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-700">
            Ce que disent nos clients
          </h2>
          <p className="text-gray-500 mt-2">2000+ avis vérifiés à travers le Maroc</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-lift transition-shadow relative"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-primary-100" />

              <div className="flex items-center gap-3 mb-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-100"
                />
                <div>
                  <p className="font-bold text-secondary-700">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent-400 text-accent-400" />
                ))}
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
