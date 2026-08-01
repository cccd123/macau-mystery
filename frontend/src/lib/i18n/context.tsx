"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { translations, Locale } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "zh-CN",
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  // Restore locale from localStorage on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && translations[saved]) {
        setLocaleState(saved);
      }
    }
  });

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] || translations["en"]?.[key] || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export type { Locale };
export { LOCALE_LABELS } from "./translations";
