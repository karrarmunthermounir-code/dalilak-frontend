import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const WHATSAPP_NUMBER = '9647780400279'
const WHATSAPP_MESSAGE = encodeURIComponent('مرحباً، أحتاج مساعدة في تطبيق دليلك 🌴')

export default function BottomNav() {
  const { pathname, search } = useLocation()
  const { isLoggedIn, isSubscribed, favorites } = useAuth()
  const { t } = useTranslation()
  const typeParam = new URLSearchParams(search).get('type')

  const NAV_ITEMS = [
    { to: '/admin',      icon: '➕',  labelKey: 'nav.add',        isAdd: true },
    { to: '/favorites',  icon: '❤️',  labelKey: 'nav.favorites',  badge: favorites?.length > 0 ? favorites.length : null },
    { to: '/dashboard',  icon: '👤',  labelKey: 'nav.my_account' },
  ]

  const isActive = (item) => {
    if (item.isAdd)    return pathname === '/admin'
    if (item.to === '/') return pathname === '/' && !typeParam
    if (item.to === '/favorites') return pathname === '/favorites'
    if (item.to === '/dashboard') return pathname.startsWith('/dashboard')
    return false
  }

  const homeActive = pathname === '/' && !typeParam

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,22,14,0.97)',
      borderTop: '1px solid var(--border-color)',
      backdropFilter: 'blur(20px)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 500,
      display: 'flex',
    }}>

      {/* ─── 1: الرئيسية — أقصى اليمين ─── */}
      <Link
        to="/"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.18rem', padding: '0.55rem 0.2rem',
          textDecoration: 'none',
          color: homeActive ? 'var(--color-accent-light)' : 'var(--text-muted)',
          transition: 'color 0.18s',
        }}
      >
        <span style={{
          fontSize: '1.3rem', lineHeight: 1,
          filter: homeActive ? 'none' : 'grayscale(0.5) opacity(0.7)',
          transition: 'all 0.18s',
        }}>🏠</span>
        <span style={{ fontSize: '0.6rem', fontWeight: homeActive ? 700 : 500, lineHeight: 1 }}>
          {t('nav.home')}
        </span>
        {homeActive && (
          <div style={{ width: '18px', height: '2px', borderRadius: '99px', background: 'var(--color-accent)' }} />
        )}
      </Link>

      {/* ─── 2: مساعدة واتساب — بجانب الرئيسية ─── */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.18rem', padding: '0.55rem 0.2rem',
          textDecoration: 'none',
          transition: 'color 0.18s',
        }}
      >
        <div style={{
          width: '28px', height: '28px',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', lineHeight: 1,
          boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
          animation: 'waPulse 2.5s infinite',
        }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3C8.82 3 3 8.82 3 16c0 2.68.77 5.18 2.1 7.31L3 29l5.85-2.06A13 13 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm6.38 18.38c-.27.76-1.33 1.38-2.2 1.56-.59.12-1.36.22-3.95-.85-3.32-1.36-5.46-4.72-5.62-4.94-.16-.22-1.32-1.76-1.32-3.35s.84-2.37 1.14-2.7c.27-.3.59-.37.79-.37l.57.01c.18 0 .43-.07.67.51.25.6.86 2.1.93 2.25.08.16.13.34.03.55-.1.2-.15.33-.3.51-.14.18-.3.4-.43.54-.14.14-.29.3-.12.58.17.28.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.29 1.41.28.14.44.12.6-.07.17-.2.7-.82.89-1.1.19-.28.38-.23.64-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.2 1.37z"/>
          </svg>
        </div>
        <span style={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1, textAlign: 'center', color: '#25D366' }}>
          مساعدة
        </span>
      </a>

      {NAV_ITEMS.map((item) => {
        const active = isActive(item)
        const label = item.to === '/dashboard' && isSubscribed
          ? t('nav.subscribed')
          : t(item.labelKey)

        // زر الإضافة — تصميم بارز في المنتصف
        if (item.isAdd) {
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', padding: '0.4rem 0',
              }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
                borderRadius: '16px', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', boxShadow: '0 4px 16px rgba(201,151,58,0.4)',
                marginBottom: '0.15rem',
                transform: active ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: active ? 'var(--color-accent-light)' : 'var(--text-muted)' }}>
                {t(item.labelKey)}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.18rem', padding: '0.55rem 0.2rem',
              textDecoration: 'none',
              color: active ? 'var(--color-accent-light)' : 'var(--text-muted)',
              transition: 'color 0.18s',
            }}>

            <div style={{ position: 'relative' }}>
              <span style={{
                fontSize: '1.3rem', lineHeight: 1,
                filter: active ? 'none' : 'grayscale(0.5) opacity(0.7)',
                transition: 'all 0.18s',
              }}>
                {item.to === '/dashboard' && !isLoggedIn ? '🔒' : item.icon}
              </span>

              {/* badge المفضلة */}
              {item.badge && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-6px',
                  background: '#ef4444', color: '#fff',
                  fontSize: '0.52rem', fontWeight: 800,
                  width: '14px', height: '14px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </div>

            <span style={{ fontSize: '0.6rem', fontWeight: active ? 700 : 500, lineHeight: 1, textAlign: 'center' }}>
              {label}
            </span>

            {active && (
              <div style={{
                width: '18px', height: '2px', borderRadius: '99px',
                background: 'var(--color-accent)',
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
