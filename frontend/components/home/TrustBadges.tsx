import { Shield, CreditCard, HeadphonesIcon, RefreshCcw } from "lucide-react";

const BADGES = [
  {
    Icon: Shield,
    title: "Agences vérifiées",
    desc: "Toutes nos agences sont vérifiées et approuvées par notre équipe.",
    color: "text-green-600 bg-green-100",
  },
  {
    Icon: CreditCard,
    title: "Paiement sécurisé",
    desc: "Transactions protégées par Stripe. Caution restituée sous 5 jours.",
    color: "text-blue-600 bg-blue-100",
  },
  {
    Icon: HeadphonesIcon,
    title: "Support 24/7",
    desc: "Notre équipe est disponible pour vous accompagner à tout moment.",
    color: "text-primary-600 bg-primary-100",
  },
  {
    Icon: RefreshCcw,
    title: "Annulation flexible",
    desc: "Remboursement 100% si annulation plus de 48h avant le départ.",
    color: "text-purple-600 bg-purple-100",
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Pourquoi nous choisir ?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BADGES.map(({ Icon, title, desc, color }) => (
            <div key={title} className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
