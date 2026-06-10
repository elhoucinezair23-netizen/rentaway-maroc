"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export function Newsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Veuillez saisir un email valide");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast.success("Merci ! Vous êtes inscrit.");
    }, 600);
  }

  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-14 lg:py-20 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md mb-6">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            {t("newsletter.title")}
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Inscrivez-vous à notre newsletter pour ne rien manquer.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                disabled={done}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-70"
              />
            </div>
            <button
              type="submit"
              disabled={loading || done}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary-700 hover:bg-secondary-800 active:scale-[0.97] text-white text-sm font-semibold transition disabled:opacity-70"
            >
              {done ? (
                <>
                  <Check className="h-4 w-4" /> Inscrit
                </>
              ) : (
                <>
                  {t("newsletter.button")} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-white/70">
            {t("newsletter.spam")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
