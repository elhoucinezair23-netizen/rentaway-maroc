import Link from "next/link";
import { Car, Bike, Anchor, Waves } from "lucide-react";

const CATEGORIES = [
  {
    href: "/search?category=VOITURE",
    Icon: Car,
    label: "Voitures",
    desc: "Citadines, SUV, luxe",
    count: "500+",
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    href: "/search?category=MOTO",
    Icon: Bike,
    label: "Motos",
    desc: "Scooters, trails, sportives",
    count: "200+",
    color: "from-orange-500 to-orange-700",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    href: "/search?category=BATEAU",
    Icon: Anchor,
    label: "Bateaux",
    desc: "Voiliers, yachts, semi-rigides",
    count: "80+",
    color: "from-cyan-500 to-cyan-700",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
  },
  {
    href: "/search?category=JETSKI",
    Icon: Waves,
    label: "Jet-skis",
    desc: "Solo, duo, puissants",
    count: "60+",
    color: "from-teal-500 to-teal-700",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
];

export function CategoryGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Explorez par catégorie</h2>
          <p className="text-gray-500 mt-2">Choisissez votre mode d&apos;aventure préféré</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(({ href, Icon, label, desc, count, color, bg, text }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className={`${bg} p-8 flex flex-col items-center text-center h-full`}>
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{label}</h3>
                <p className="text-sm text-gray-500 mb-2">{desc}</p>
                <span className={`text-xs font-semibold ${text} bg-white px-3 py-1 rounded-full`}>
                  {count} véhicules
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
