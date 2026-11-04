'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import T from './i18n';

const LanguageContext = createContext();

// The language button cycles through these; each language's `lang_toggle` label names the next one
const LANGS = ['gu', 'hi', 'en'];

// Locale for dates and numbers in charts
export const localeFor = (lang) => ({ gu: 'gu-IN', hi: 'hi-IN' }[lang] || 'en-IN');

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('jpLang');
    return LANGS.includes(saved) ? saved : 'gu';
  });

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const toggleLang = () => {
    const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
    setLang(next);
    localStorage.setItem('jpLang', next);
  };

  const t = (key) => (T[lang] && T[lang][key] !== undefined ? T[lang][key] : T.en[key] || key);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
