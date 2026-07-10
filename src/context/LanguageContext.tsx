"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/utils/translations";

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("txpro_lang") as Language | null;
      if (savedLang && ["vi", "en", "zh"].includes(savedLang)) {
        setLanguage(savedLang);
      } else {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("zh")) {
          setLanguage("zh");
          localStorage.setItem("txpro_lang", "zh");
        } else if (browserLang.startsWith("en")) {
          setLanguage("en");
          localStorage.setItem("txpro_lang", "en");
        } else {
          setLanguage("vi");
          localStorage.setItem("txpro_lang", "vi");
        }
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("txpro_lang", lang);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["vi"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
