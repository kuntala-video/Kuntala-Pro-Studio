'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import en from '@/i18n/en.json';
import bn from '@/i18n/bn.json';

type Language = 'en' | 'bn';
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, bn };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'bn')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('lang', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: keyof Translations, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }, [language]);

  const value = { language, setLanguage, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
