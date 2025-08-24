
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { getTranslator, Language, TranslationKey } from '../i18n/index.ts';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLanguage = (): Language => {
    const savedLang = localStorage.getItem('gameLanguage') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'pt-br')) {
      return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'pt' ? 'pt-br' : 'en';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('gameLanguage', language);
  }, [language]);
  
  const t = useMemo(() => getTranslator(language), [language]);

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};