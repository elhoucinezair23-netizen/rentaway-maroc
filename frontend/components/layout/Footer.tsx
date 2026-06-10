"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const POPULAR_CITIES = ["Casablanca", "Marrakech", "Agadir", "Tanger", "Oujda"];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-secondary-700 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="bg-white inline-block rounded-lg p-2 mb-4">
              <Image src="/logo.svg" alt="RentaWay Maroc" width={160} height={44} className="h-10 w-auto" />
            </div>
            <p className="text-sm text-gray-300 mt-3 leading-relaxed">
              La plateforme de location de véhicules n°1 au Maroc. Voitures, motos, bateaux et jet-skis dans 27 villes marocaines.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Facebook,  href: "#", label: "Facebook" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Twitter,   href: "#", label: "Twitter" },
                { Icon: Linkedin,  href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-primary-600 flex items-center justify-center transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Véhicules */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
              {t("nav.voitures")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search?category=VOITURE" className="hover:text-primary-400 transition-colors">{t("nav.voitures")}</Link></li>
              <li><Link href="/search?category=MOTO"    className="hover:text-primary-400 transition-colors">{t("categories.motos")}</Link></li>
              <li><Link href="/search?category=BATEAU"  className="hover:text-primary-400 transition-colors">{t("nav.bateaux")}</Link></li>
              <li><Link href="/search?category=JETSKI"  className="hover:text-primary-400 transition-colors">{t("nav.jetskis")}</Link></li>
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
              {t("nav.villes")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {POPULAR_CITIES.map((c) => (
                <li key={c}>
                  <Link href={`/search?city=${encodeURIComponent(c)}`} className="hover:text-primary-400 transition-colors">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">À propos</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/#how-it-works" className="hover:text-primary-400 transition-colors">{t("footer.commentCaMarche")}</Link></li>
              <li><Link href="/rejoindre-en-tant-que-loueur" className="hover:text-primary-400 transition-colors">{t("footer.devenirLoueur")}</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400 transition-colors">{t("footer.contact")}</Link></li>
              <li><Link href="/cgu" className="hover:text-primary-400 transition-colors">{t("footer.cgu")}</Link></li>
              <li><Link href="/confidentialite" className="hover:text-primary-400 transition-colors">{t("footer.confidentialite")}</Link></li>
            </ul>

            <div className="mt-5 space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> contact@rentaway.ma</div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +212 5 22 00 00 00</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Casablanca, Maroc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} RentaWay Maroc. {t("footer.droits")}.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <span className="opacity-70">Paiements sécurisés :</span>
            {["CMI", "Visa", "Mastercard", "PayPal"].map((p) => (
              <span
                key={p}
                className="bg-white/10 border border-white/10 rounded px-2 py-1 font-semibold tracking-wide"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
