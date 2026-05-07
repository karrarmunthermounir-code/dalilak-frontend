import { useTranslation } from 'react-i18next'
import { applyDirection } from '../i18n'

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  const toggleLanguage = () => {
    const next = isAr ? 'en' : 'ar'
    localStorage.setItem('dalilak_lang', next)
    applyDirection(next)
    // إعادة تحميل الصفحة لضمان ترجمة كاملة لجميع المكونات
    window.location.reload()
  }

  if (compact) {
    // نسخة مضغوطة للهيدر
    return (
      <button
        onClick={toggleLanguage}
        title={isAr ? 'Switch to English' : 'التحويل للعربية'}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px',
          padding: '0.35rem 0.6rem',
          color: 'var(--text-secondary)',
          fontWeight: 700,
          fontSize: '0.72rem',
          cursor: 'pointer',
          fontFamily: 'var(--font-main)',
          transition: 'all 0.18s',
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(201,151,58,0.15)'
          e.currentTarget.style.borderColor = 'rgba(201,151,58,0.4)'
          e.currentTarget.style.color = 'var(--color-accent-light)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        🌐 {isAr ? 'EN' : 'عر'}
      </button>
    )
  }

  // نسخة كاملة
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      {['ar', 'en'].map(lang => (
        <button
          key={lang}
          onClick={() => {
            i18n.changeLanguage(lang)
            localStorage.setItem('dalilak_lang', lang)
            applyDirection(lang)
          }}
          style={{
            padding: '0.4rem 0.9rem',
            borderRadius: '10px',
            border: i18n.language === lang
              ? '1px solid rgba(201,151,58,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
            background: i18n.language === lang
              ? 'rgba(201,151,58,0.15)'
              : 'rgba(255,255,255,0.05)',
            color: i18n.language === lang
              ? 'var(--color-accent-light)'
              : 'var(--text-muted)',
            fontWeight: i18n.language === lang ? 800 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            transition: 'all 0.18s',
          }}
        >
          {lang === 'ar' ? '🇮🇶 عربي' : '🇬🇧 English'}
        </button>
      ))}
    </div>
  )
}
