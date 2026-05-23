import React, { createContext, useContext, useState } from 'react';
import T from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('jpLang') || 'gu';
  });

  const toggleLang = () => {
    const next = lang === 'gu' ? 'en' : 'gu';
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
