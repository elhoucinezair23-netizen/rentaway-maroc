"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  Menu, X, User, LogOut, LayoutDashboard, ChevronDown,
  Car, Bike, Anchor, Waves, MapPin, Globe, PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

// Labels resolus dynamiquement via t()
const NAV_KEYS = [
  { href: "/search?category=VOITURE", key: "nav.voitures", Icon: Car },
  { href: "/search?category=MOTO",    key: "nav.motos",    Icon: Bike },
  { href: "/search?category=BATEAU",  key: "nav.bateaux",  Icon: Anchor },
  { href: "/search?category=JETSKI",  key: "nav.jetskis",  Icon: Waves },
  { href: "/search",                  key: "nav.villes",   Icon: MapPin },
];

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "ar", flag: "🇲🇦", label: "العربية" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

export function Navbar() {
  const { data: session } = useSession();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ferme le dropdown langue si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const user = session?.user as {
    role?: string;
    name?: string;
    image?: string;
    email?: string;
  } | undefined;

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "LOUEUR"
      ? "/dashboard/agency"
      : "/dashboard/client";

  return (
    <nav
      className={clsx(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-soft border-b border-gray-100"
          : "bg-white border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group" aria-label="RentaWay Maroc">
            <Image
              src="/logo.svg"
              alt="RentaWay Maroc"
              width={170}
              height={46}
              priority
              className="h-10 w-auto transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_KEYS.map(({ href, key, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50/40 rounded-lg transition-colors"
              >
                <Icon className="h-4 w-4" />
                {t(key)}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Changer la langue"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform", langMenuOpen && "rotate-180")} />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lift border border-gray-100 py-1 z-50 animate-fade-in">
                  {LANGUAGES.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => changeLang(code)}
                      className={clsx(
                        "flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left transition-colors",
                        i18n.language === code
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-base">{flag}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || ""}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lift border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Connecté en tant que</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Mon tableau de bord
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">{t("nav.connexion")}</Button>
                </Link>
                <Link href="/rejoindre-en-tant-que-loueur">
                  <Button variant="primary" size="sm">
                    <PlusCircle className="h-4 w-4" />
                    {t("nav.publier")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-lift animate-slide-down flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Image src="/logo.svg" alt="RentaWay" width={140} height={40} className="h-9 w-auto" />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {NAV_KEYS.map(({ href, key, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                >
                  <Icon className="h-4 w-4" />
                  {t(key)}
                </Link>
              ))}

              {/* Language switcher mobile */}
              <div className="pt-3 border-t border-gray-100 mt-3">
                <p className="text-xs text-gray-400 px-3 mb-2 font-medium uppercase tracking-wide">Langue</p>
                <div className="flex gap-2 px-1">
                  {LANGUAGES.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => { changeLang(code); setMobileOpen(false); }}
                      className={clsx(
                        "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-colors",
                        i18n.language === code
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <span className="text-base">{flag}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 mt-3 space-y-2">
                {session ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" fullWidth>Mon tableau de bord</Button>
                    </Link>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" fullWidth>{t("nav.connexion")}</Button>
                    </Link>
                    <Link href="/rejoindre-en-tant-que-loueur" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" fullWidth>
                        <PlusCircle className="h-4 w-4" />
                        {t("nav.publier")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
