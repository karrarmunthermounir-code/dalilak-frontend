import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlaceCard from '../components/PlaceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { usePlaces } from '../hooks/usePlaces'
import { IRAQ_GOVERNORATES } from '../services/api'

export default function HomePage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const searchRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')

  const {
    places, loading, error,
    filter, setFilter,
    gov, setGov,
    sort, setSort,
    geoStatus, requestLocation,
  } = usePlaces()

  // قراءة ?type= من URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const type = params.get('type')
    if (type) setFilter(type)
  }, [location.search]) // eslint-disable-line

  // تبويبات النوع — مبنية من مفاتيح الترجمة
  const TYPE_FILTERS = [
    { key: 'all',    icon: '🗺️', label: t('filter.all')   },
    { key: 'مطعم',  icon: '🍽️', label: t('filter.restaurants') },
    { key: 'كافيه', icon: '☕',  label: t('filter.cafes')  },
    { key: 'فندق',  icon: '🏨', label: t('filter.hotels') },
  ]

  const SORT_OPTIONS = [
    { value: 'rating',    label: t('filter.sort_rating')  },
    { value: 'createdAt', label: t('filter.sort_newest')  },
    { value: 'nearest',   label: t('filter.sort_nearest') },
  ]

  // فلترة البحث
  const displayed = searchQuery.trim()
    ? places.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.governorate?.includes(searchQuery) ||
        p.area?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : places

  const activeKey = filter === 'الكل' ? 'all' : filter

  // عنوان قسم النتائج
  const resultsTitle = () => {
    if (searchQuery.trim()) return `${t('search.results_title')} "${searchQuery}"`
    if (filter === 'الكل') return t('home.all_places')
    const found = TYPE_FILTERS.find(f => f.key === filter)
    const icon = found?.icon || ''
    const label = found?.label || filter
    return `${icon} ${label}${gov !== 'الكل' ? ` ${t('home.in_region')} ${gov}` : ''}`
  }

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh', direction: isRtl ? 'rtl' : 'ltr' }}>

      {/* ══════════ HEADER ══════════ */}
      <header style={{
        background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, var(--bg-dark) 100%)',
        padding: '1rem 1rem 0',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(14px)',
      }}>

        {/* الصف العلوي */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-accent-light)', lineHeight: 1 }}>
              🌴 {t('app.name')}
            </h1>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.12rem' }}>
              {t('app.tagline')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <LanguageSwitcher compact />
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
                border: 'none', borderRadius: '12px', padding: '0.5rem 0.8rem',
                color: '#000', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                fontFamily: 'var(--font-main)', boxShadow: '0 2px 10px rgba(201,151,58,0.3)',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
              ➕ {t('buttons.add')}
            </button>
          </div>
        </div>

        {/* شريط البحث */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <span style={{
            position: 'absolute',
            [isRtl ? 'right' : 'left']: '0.9rem',
            top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', pointerEvents: 'none', color: 'var(--text-muted)',
          }}>🔍</span>
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            style={{
              width: '100%',
              padding: isRtl ? '0.72rem 2.5rem 0.72rem 2.8rem' : '0.72rem 2.8rem 0.72rem 2.5rem',
              borderRadius: '14px', border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.07)', color: 'var(--text-primary)',
              fontSize: '0.9rem', fontFamily: 'var(--font-main)', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border-color)'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '0.8rem',
                top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                width: '22px', height: '22px', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
          )}
        </div>

        {/* تبويبات النوع */}
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollbarWidth: 'none' }}>
          {TYPE_FILTERS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key === 'all' ? 'الكل' : key); setSearchQuery('') }}
              style={{
                flexShrink: 0, padding: '0.45rem 0.95rem', borderRadius: '99px', border: 'none',
                fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', transition: 'all 0.18s',
                background: activeKey === key
                  ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))'
                  : 'rgba(255,255,255,0.07)',
                color: activeKey === key ? '#000' : 'var(--text-secondary)',
                boxShadow: activeKey === key ? '0 2px 10px rgba(201,151,58,0.35)' : 'none',
              }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════ شريط الفلاتر الثانوي ══════════ */}
      <div style={{
        padding: '0.6rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <select
          value={gov}
          onChange={e => setGov(e.target.value)}
          style={{
            flex: 1, padding: '0.5rem 0.7rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-secondary)', fontSize: '0.8rem',
            fontFamily: 'var(--font-main)', fontWeight: 600, cursor: 'pointer', outline: 'none',
          }}>
          {IRAQ_GOVERNORATES.map(g => (
            <option key={g} value={g}>
              {g === 'الكل' ? `📍 ${t('filter.all_govs')}` : g}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={e => { setSort(e.target.value); if (e.target.value === 'nearest') requestLocation?.() }}
          style={{
            flex: 1, padding: '0.5rem 0.7rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-secondary)', fontSize: '0.8rem',
            fontFamily: 'var(--font-main)', fontWeight: 600, cursor: 'pointer', outline: 'none',
          }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {!loading && (
          <div style={{
            background: 'rgba(26,107,69,0.2)', border: '1px solid rgba(26,107,69,0.35)',
            borderRadius: '10px', padding: '0.4rem 0.6rem', textAlign: 'center', flexShrink: 0,
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary-light)', lineHeight: 1 }}>
              {displayed.length}
            </div>
            <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)' }}>{t('filter.results_count')}</div>
          </div>
        )}
      </div>

      {/* حالة GPS */}
      {sort === 'nearest' && geoStatus && geoStatus !== 'granted' && (
        <div style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
          {geoStatus === 'loading' && <span style={{ color: 'var(--color-accent)' }}>{t('search.gps_loading')}</span>}
          {geoStatus === 'denied' && (
            <span style={{ color: '#f87171' }}>
              {t('search.gps_denied')}{' '}
              <button onClick={requestLocation} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-main)' }}>
                {t('search.gps_retry')}
              </button>
            </span>
          )}
        </div>
      )}

      {/* عنوان النتائج */}
      <div style={{ padding: '0.6rem 1rem 0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {resultsTitle()}
        </h2>
        {searchQuery.trim() && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
            {t('search.clear')}
          </button>
        )}
      </div>

      {/* ══════════ قائمة الأماكن ══════════ */}
      <div style={{ padding: '0.4rem 1rem', paddingBottom: '5rem' }}>

        {loading && <LoadingSpinner text={t('loading.places')} />}

        {error && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⚠️</div>
            <p>{t('errors.load_failed')}</p>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {searchQuery ? '🔍' : '📭'}
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchQuery
                ? `${t('search.no_results')} "${searchQuery}"`
                : t('home.empty_title')}
            </p>
            <p style={{ fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {searchQuery ? t('search.no_results_hint') : t('home.empty_hint')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  padding: '0.8rem 1.8rem', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
                  color: '#000', fontWeight: 800, fontSize: '0.9rem',
                  fontFamily: 'var(--font-main)', cursor: 'pointer',
                }}>
                {t('home.add_now')}
              </button>
            )}
          </div>
        )}

        {!loading && !error && displayed.map(p => <PlaceCard key={p._id} place={p} />)}
      </div>
    </main>
  )
}
