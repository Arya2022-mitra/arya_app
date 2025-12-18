import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@public/locales/en/translation.json';
import es from '@public/locales/es/translation.json';
import gu from '@public/locales/gu/translation.json';
import ms from '@public/locales/ms/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      gu: { translation: gu },
      ms: { translation: ms },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
