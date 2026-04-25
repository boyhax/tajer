import React, { createContext, useState, useEffect, useContext } from 'react';
import { LocalizedString } from '../types';

interface LanguageContextType {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  t: (ls: LocalizedString | string | any) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (ls) => typeof ls === 'string' ? ls : (ls?.en || '')
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem('kuzama_lang');
    return (saved as 'en' | 'ar') || 'en';
  });

  const setLang = (l: 'en' | 'ar') => {
    setLangState(l);
    localStorage.setItem('kuzama_lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (ls: LocalizedString | string | any): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[lang] || ls['en'] || '';
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
