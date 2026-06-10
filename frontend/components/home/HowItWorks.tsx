"use client";

import { motion } from "framer-motion";
import { Search, CreditCard, Car } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const STEP_ICONS = [Search, CreditCard, Car];
const STEP_NUMS = ["01", "02", "03"];
const STEP_TITLE_KEYS = ["howItWorks.step1", "howItWorks.step2", "howItWorks.step3"];
const STEP_DESC_KEYS  = ["howItWorks.step1Desc", "howItWorks.step2Desc", "howItWorks.step3Desc"];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-700">
            {t("howItWorks.title")}
          </h2>
          <p className="text-gray-500 mt-2">Un processus rapide, fluide et sécurisé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* connector */}
          <div
            className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 border-t-2 border-dashed border-primary-200"
            aria-hidden
          />

          {STEP_NUMS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon className="h-10 w-10 text-primary-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-secondary-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-secondary-700">{t(STEP_TITLE_KEYS[i])}</h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto">{t(STEP_DESC_KEYS[i])}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
