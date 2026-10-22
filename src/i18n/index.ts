import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import fr from './locales/fr.json';
import en from './locales/en.json';

/**
 * To add a language (e.g. Arabic): create locales/ar.json with the same keys,
 * add it to `resources` and to SUPPORTED_APP_LANGS (plus `dir: 'rtl'` handling
 * in App.tsx via LANG_DIR).
 */
export const resources = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

export type AppLang = keyof typeof resources;
export const SUPPORTED_APP_LANGS: AppLang[] = ['fr', 'en'];
export const LANG_DIR: Record<string, 'ltr' | 'rtl'> = { fr: 'ltr', en: 'ltr', ar: 'rtl' };

export const APP_LANG_STORAGE_KEY = 'elamir.appLang';

export function getStoredAppLang(): AppLang | null {
  try {
    const v = localStorage.getItem(APP_LANG_STORAGE_KEY);
    return v && (SUPPORTED_APP_LANGS as string[]).includes(v) ? (v as AppLang) : null;
  } catch {
    return null;
  }
}

const initial: AppLang = getStoredAppLang() ?? 'fr';

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

dayjs.locale(initial);
document.documentElement.lang = initial;

/** Instant switch (no reload) + persistence. */
export function setAppLanguage(lang: AppLang, persist = true) {
  void i18n.changeLanguage(lang);
  dayjs.locale(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = LANG_DIR[lang] ?? 'ltr';
  if (persist) {
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }
}

export default i18n;
