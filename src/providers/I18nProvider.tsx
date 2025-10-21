'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uiStrings, type UILanguage, type UIStrings } from '@/lib/i18n/ui';

type I18nContextValue = {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  strings: UIStrings;
};

const DEFAULT_LANGUAGE: UILanguage = 'nl';
const STORAGE_KEY = 'uiLanguage';

const I18nContext = createContext<I18nContextValue>(null as unknown as I18nContextValue);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<UILanguage>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, strings: uiStrings[language] }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
