"use client";

import { useEffect } from "react";
import "@/lib/i18n"; // initialise i18n côté client
import i18n from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

export function I18nProvider({ children }: Props) {
  useEffect(() => {
    const handleLangChange = (lang: string) => {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    };

    // Appliquer immédiatement la langue courante
    handleLangChange(i18n.language || "fr");

    i18n.on("languageChanged", handleLangChange);
    return () => {
      i18n.off("languageChanged", handleLangChange);
    };
  }, []);

  return <>{children}</>;
}
