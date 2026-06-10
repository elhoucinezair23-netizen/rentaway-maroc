"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  ArrowRight, Check, ChevronDown, Star, Users, MapPin, Gift, Percent,
  Shield, BarChart3, Headphones, Car, Bike, Anchor, Waves,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import { CITY_NAMES } from "@/lib/constants/cities";

const CITIES = CITY_NAMES;

// ─── Compteur animé ───────────────────────────────────────────
function AnimatedCounter({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(end * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

// ─── Accordion FAQ ────────────────────────────────────────────
function FaqItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left hover:bg-gray-50 px-2 -mx-2 rounded transition"
      >
        <span className="font-semibold text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`}>
        <p className="text-gray-600 leading-relaxed pr-8">{a}</p>
      </div>
    </div>
  );
}

// ─── Form schema ──────────────────────────────────────────────
const formSchema = z.object({
  agencyName: z.string().min(2, "Nom requis"),
  contactName: z.string().min(2, "Nom requis"),
  city: z.string().min(2, "Sélectionnez une ville"),
  phone: z.string().min(8, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  categories: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
  message: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

const FAQS = [
  {
    q: "Combien coûte l'inscription ?",
    a: "L'inscription est totalement gratuite. Vous bénéficiez de 6 mois sans commission pour les 50 premiers loueurs qui rejoignent la plateforme. Ensuite, nous prélevons 15% uniquement sur les réservations confirmées. Aucun abonnement mensuel.",
  },
  {
    q: "Comment je reçois mes paiements ?",
    a: "Les paiements sont traités de façon sécurisée via notre système. Vous recevez le montant de la location (moins notre commission de 15%) directement sur votre compte bancaire marocain sous 48h après la fin de chaque location.",
  },
  {
    q: "Que se passe-t-il en cas de litige ou dommage ?",
    a: "Notre équipe arbitre tous les litiges dans un délai de 72h. Le dépôt de garantie est conservé pendant 5 jours après la location pour vous protéger. Nous vous demandons des photos horodatées au départ et au retour du véhicule comme preuve.",
  },
  {
    q: "Puis-je refuser une réservation ?",
    a: "Oui, vous pouvez refuser une demande de réservation dans les 2h suivant la demande sans pénalité. Au-delà, un taux de refus élevé affecte votre score de réactivité visible sur votre profil.",
  },
  {
    q: "Comment gérer mes disponibilités ?",
    a: "Votre tableau de bord inclut un calendrier complet par véhicule. Bloquez des dates, définissez des tarifs spéciaux pour les week-ends et les périodes de haute saison en quelques clics.",
  },
  {
    q: "Quels documents dois-je fournir ?",
    a: "Pour les voitures et motos : registre de commerce + attestation d'assurance de vos véhicules. Pour bateaux et jet-skis : en plus, l'autorisation d'exploitation nautique et les certificats de conformité de chaque embarcation.",
  },
];

const TESTIMONIALS = [
  {
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces&q=80",
    name: "Khalid Benali",
    role: "Agence AutoLoc, Marrakech",
    rating: 5,
    text: "Depuis que j'utilise la plateforme, mes réservations ont augmenté de 40%. Le tableau de bord est très simple à utiliser.",
  },
  {
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&crop=faces&q=80",
    name: "Samira Ouali",
    role: "Moto Explore, Agadir",
    rating: 5,
    text: "J'ai mis mes motos en ligne en 10 minutes. Le premier client a réservé le lendemain. Je recommande à toutes les agences.",
  },
  {
    photo: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=300&h=300&fit=crop&crop=faces&q=80",
    name: "Hassan Berrada",
    role: "Nautik Dakhla",
    rating: 4,
    text: "La gestion des réservations de bateaux est devenue simple. Les clients arrivent déjà vérifiés, c'est un vrai gain de temps.",
  },
];

const ADVANTAGES = [
  { icon: <Gift className="w-6 h-6" />, title: "Zéro frais d'inscription", desc: "6 mois offerts pour les 50 premiers loueurs." },
  { icon: <Shield className="w-6 h-6" />, title: "Paiement sécurisé et garanti", desc: "Stripe + virement bancaire sous 48h." },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Dashboard complet", desc: "Stats, calendrier, messages, exports." },
  { icon: <Users className="w-6 h-6" />, title: "Clients vérifiés", desc: "CIN + permis vérifiés à l'inscription." },
  { icon: <Headphones className="w-6 h-6" />, title: "Support 7j/7", desc: "Équipe dédiée en français et arabe." },
  { icon: <MapPin className="w-6 h-6" />, title: "Visibilité nationale", desc: "Présent dans 47 villes du Maroc." },
];

const CATEGORY_OPTIONS = [
  { value: "VOITURE", label: "Voitures", icon: <Car className="w-4 h-4" /> },
  { value: "MOTO", label: "Motos", icon: <Bike className="w-4 h-4" /> },
  { value: "BATEAU", label: "Bateaux", icon: <Anchor className="w-4 h-4" /> },
  { value: "JETSKI", label: "Jet-skis", icon: <Waves className="w-4 h-4" /> },
];

export default function RejoindreLoueurPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);
  const stepsRef = useRef<HTMLElement>(null);

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { categories: [] },
  });

  const selectedCategories = watch("categories");

  function toggleCategory(value: string) {
    const current = selectedCategories || [];
    if (current.includes(value)) {
      setValue("categories", current.filter((c) => c !== value));
    } else {
      setValue("categories", [...current, value]);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await publicApi.loueurSignup(data);
      toast.success("Demande envoyée !");
      setSubmitted(true);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'envoi");
    }
  }

  function scrollToSteps() {
    stepsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ───────────── HERO ───────────── */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1920&q=80"
            alt="Maroc"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-200 px-3 py-1 rounded-full text-sm font-medium mb-6 backdrop-blur">
              <Gift className="w-4 h-4" /> 6 mois gratuits pour les pionniers
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Développez votre activité de location au Maroc
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              La 1<sup>ère</sup> plateforme qui connecte vos véhicules avec 15 000 clients actifs partout au Maroc.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register?role=loueur"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition shadow-lg hover:shadow-xl"
              >
                Créer mon espace loueur — Gratuit 6 mois
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={scrollToSteps}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg transition border border-white/20"
              >
                Voir comment ça marche
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── COMPTEURS ───────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 15000, suffix: "+", label: "Clients actifs", icon: <Users className="w-6 h-6" /> },
            { value: 47, suffix: "", label: "Villes couvertes", icon: <MapPin className="w-6 h-6" /> },
            { value: 6, suffix: " mois", label: "Gratuits pour démarrer", icon: <Gift className="w-6 h-6" /> },
            { value: 15, suffix: "%", label: "Commission seulement", icon: <Percent className="w-6 h-6" /> },
          ].map((c, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                {c.icon}
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900">
                <AnimatedCounter end={c.value} suffix={c.suffix} />
              </div>
              <div className="text-sm text-gray-600 mt-2">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── COMMENT ÇA MARCHE ───────────── */}
      <section ref={stepsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-600">3 étapes simples pour démarrer.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: 1, t: "Inscrivez votre agence", d: "Créez votre profil en 5 minutes. Téléchargez vos documents une seule fois." },
              { n: 2, t: "Publiez vos véhicules", d: "Ajoutez photos, prix et disponibilités. Vos annonces sont en ligne immédiatement." },
              { n: 3, t: "Recevez et gérez vos réservations", d: "Acceptez, refusez, communiquez avec vos clients. Encaissez directement sur votre compte." },
            ].map((s) => (
              <div key={s.n} className="relative bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-8">
                <div className="absolute -top-5 left-8 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-2">{s.t}</h3>
                <p className="text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── AVANTAGES ───────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pourquoi nous rejoindre</h2>
            <p className="text-lg text-gray-600">Des outils pensés pour les agences marocaines.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                  {a.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-gray-600 text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TÉMOIGNAGES ───────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ils nous font confiance</h2>
            <p className="text-lg text-gray-600">Des témoignages d'agences partenaires.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-600">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">« {t.text} »</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Questions fréquentes</h2>
          </div>
          <div className="bg-white rounded-2xl px-6 border border-gray-200">
            {FAQS.map((f, i) => (
              <FaqItem
                key={i}
                q={f.q}
                a={f.a}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FORMULAIRE ───────────── */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyée !</h2>
                <p className="text-gray-600 mb-6">
                  Votre demande a bien été reçue ! Notre équipe vous contacte dans les 24h.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-orange-600 hover:underline font-medium"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Démarrez gratuitement dès aujourd'hui
                  </h2>
                  <p className="text-gray-600">Remplissez le formulaire, on vous rappelle sous 24h.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nom de l'agence *
                      </label>
                      <input
                        {...register("agencyName")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="AutoLoc Marrakech"
                      />
                      {errors.agencyName && <p className="text-xs text-red-600 mt-1">{errors.agencyName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Votre prénom et nom *
                      </label>
                      <input
                        {...register("contactName")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Khalid Benali"
                      />
                      {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ville *
                      </label>
                      <select
                        {...register("city")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="">Sélectionnez une ville</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Téléphone *
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="+212 6 12 34 56 78"
                      />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email professionnel *
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="contact@votre-agence.ma"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégories proposées *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map((opt) => {
                        const checked = selectedCategories?.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleCategory(opt.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                              checked
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.categories && <p className="text-xs text-red-600 mt-1">{errors.categories.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message (optionnel)
                    </label>
                    <textarea
                      {...register("message")}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                      placeholder="Combien de véhicules dans votre flotte, vos questions..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-lg transition shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    En soumettant, vous acceptez d'être recontacté par notre équipe.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
