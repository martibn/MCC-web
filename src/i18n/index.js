import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ca from './ca.json';
import es from './es.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ca: { translation: ca }, es: { translation: es }, en: { translation: en } },
    fallbackLng: 'ca',
    interpolation: { escapeValue: false },
  });

export default i18n;