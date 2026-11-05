import { useState, useEffect, useCallback } from 'react';

type Language = 'ar' | 'en';

let currentLanguage: Language = 'ar';
const listeners: Set<() => void> = new Set();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function switchLanguage(lang: Language): void {
  currentLanguage = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  notifyListeners();
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// Initialize document with default language
switchLanguage(currentLanguage);

export function useI18n(): {
  language: Language;
  switchLanguage: (lang: Language) => void;
  t: (keys: Record<Language, string>) => string;
  isRTL: boolean;
} {
  const [language, setLanguage] = useState<Language>(currentLanguage);

  const handleChange = useCallback(() => {
    setLanguage(currentLanguage);
  }, []);

  useEffect(() => {
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, [handleChange]);

  const t = useCallback(
    (keys: Record<Language, string>): string => {
      return keys[language] ?? keys['ar'] ?? '';
    },
    [language]
  );

  return {
    language,
    switchLanguage,
    t,
    isRTL: language === 'ar',
  };
}

export function LanguageSwitcher(): null {
  // This is a helper export; UI components should use useI18n() to build their own switcher.
  // Returning null here as a no-op component; actual switching is done via switchLanguage().
  return null;
}