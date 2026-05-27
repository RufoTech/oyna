import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

// Only AZ (default) is bundled statically for instant load.
// EN and RU are loaded on demand via dynamic import when selected.
import translationAZ from './locales/az/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend((language, namespace) => {
      // Handle regional language codes (e.g. en-US -> en, ru-RU -> ru)
      const primaryLang = language.split('-')[0].toLowerCase();
      if (primaryLang === 'az') return Promise.resolve(translationAZ);
      if (primaryLang === 'en') return import('./locales/en/translation.json');
      if (primaryLang === 'ru') return import('./locales/ru/translation.json');
    })
  )
  .init({
    fallbackLng: 'az',
    supportedLngs: ['az', 'en', 'ru'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Prevents visual glitches or app locks during chunk loading
    }
  });

export default i18n;
