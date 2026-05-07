import { useTranslation } from 'react-i18next'
import { IRAQ_GOVERNORATES } from '../services/api'

export default function FilterBar({
  activeGov, onGov,
  activeSort, onSort,
  geoStatus, requestLocation,
}) {
  const { t } = useTranslation()

  const SORT_OPTIONS = [
    { value: 'rating',    label: `⭐ ${t('filter.highest_rating')}` },
    { value: 'nearest',   label: `📍 ${t('filter.nearest')}` },
    { value: 'createdAt', label: `🕐 ${t('filter.newest')}` },
  ]

  const selStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-secondary)',
    padding: '0.5rem 0.7rem',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontFamily: 'var(--font-main)',
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    outline: 'none',
  }

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <select value={activeGov} onChange={e => onGov(e.target.value)} style={selStyle}>
          {IRAQ_GOVERNORATES.map(gov => (
            <option key={gov} value={gov}>
              {gov === 'الكل' ? `📍 ${t('filter.all_govs')}` : gov}
            </option>
          ))}
        </select>

        <select
          value={activeSort}
          onChange={e => { onSort(e.target.value); if (e.target.value === 'nearest') requestLocation?.() }}
          style={selStyle}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* حالة الموقع */}
      {activeSort === 'nearest' && (
        <div style={{ marginTop: '0.5rem' }}>
          {geoStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--color-accent)' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid rgba(201,151,58,0.3)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              {t('loading.default')}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {geoStatus === 'granted' && (
            <p style={{ fontSize: '0.75rem', color: '#4ade80' }}>✅ {t('filter.nearest')}</p>
          )}
          {geoStatus === 'denied' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#f87171' }}>❌ {t('errors.load_failed')}</p>
              <button onClick={requestLocation} style={{
                padding: '0.25rem 0.7rem', background: 'rgba(201,151,58,0.15)',
                border: '1px solid rgba(201,151,58,0.4)', borderRadius: '99px',
                color: 'var(--color-accent)', fontSize: '0.72rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-main)',
              }}>🔄 {t('errors.try_again')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
