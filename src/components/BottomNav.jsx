import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const { pathname, search } = useLocation()
  const { isLoggedIn, isSubscribed, favorites } = useAuth()
  const { t } = useTranslation()
  const typeParam = new URLSearchParams(search).get('type')

  const NAV_ITEMS = [
    { to: '/',           icon: '🏠',  labelKey: 'nav.home'       },
    { to: '/?type=مطعم', icon: '🍽️',  labelKey: 'nav.restaurants', filter: 'مطعم' },
    { to: '/admin',      icon: '➕',  labelKey: 'nav.add',        isAdd: true },
    { to: '/favorites',  icon: '❤️',  labelKey: 'nav.favorites',  badge: favorites?.length > 0 ? favorites.length : null },
    { to: '/dashboard',  icon: '👤',  labelKey: 'nav.my_account' },
  ]

  const isActive = (item) => {
    if (item.isAdd)    return pathname === '/admin'
    if (item.filter)   return typeParam === item.filter
    if (item.to === '/') return pathname === '/' && !typeParam
    if (item.to === '/favorites') return pathname === '/favorites'
    if (item.to === '/dashboard') return pathname.startsWith('/dashboard')
    return false
  }

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
