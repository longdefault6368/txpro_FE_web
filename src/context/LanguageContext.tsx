"use client";

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { Language, translations } from "@/utils/translations";

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LANG_STORAGE_KEY = "txpro_lang";
const LANG_CHANGE_EVENT = "txpro_lang_change";
const VALID_LANGUAGES: readonly Language[] = ["vi", "en", "zh"];

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "vi";
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
    if (saved && VALID_LANGUAGES.includes(saved)) return saved;
  } catch {
    // Storage may be unavailable in restricted contexts.
  }
  return "vi";
}

function getServerLanguage(): Language {
  return "vi";
}

function subscribeLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => { };
  const handle = () => onStoreChange();
  window.addEventListener("storage", handle);
  window.addEventListener(LANG_CHANGE_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(LANG_CHANGE_EVENT, handle);
  };
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useSyncExternalStore(subscribeLanguage, getStoredLanguage, getServerLanguage);

  const changeLanguage = useCallback((lang: Language) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore storage write errors in restricted contexts.
      }
      window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
      window.dispatchEvent(new Event("storage"));
    }
  }, []);

  const t = useCallback(
    (key: string): string => translations[language]?.[key] || translations["vi"]?.[key] || key,
    [language]
  );

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
