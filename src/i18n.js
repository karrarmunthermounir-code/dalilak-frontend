import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'

// ─── قراءة اللغة المحفوظة أو الافتراضية ───
const savedLang = localStorage.getItem('dalilak_lang') || 'ar'

// ─── تطبيق الاتجاه على الصفحة ───
export const applyDirection = (lang) => {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

// ─── تطبيق الاتجاه الأولي ───
applyDirection(savedLang)

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
  })

export default i18n
