import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { usePlaces } from '../hooks/usePlaces'
import PlaceCard from '../components/PlaceCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { favorites, isLoggedIn } = useAuth()
  const { places, loading } = usePlaces()

  const favoritePlaces = places.filter(p => favorites.includes(p._id))

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, var(--bg-dark) 100%)',
        padding: '1.4rem 1rem 1rem',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px',
            padding: '0.5rem 0.7rem', color: 'var(--text-primary)', cursor: 'pointer',
          }}>◀</button>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              ❤️ أماكني المفضلة
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {favoritePlaces.length} مكان محفوظ
            </p>
          </div>
        </div>
      </header>

      <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
        {loading && <LoadingSpinner text="جاري التحميل..." />}

        {!loading && !isLoggedIn && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              سجّل دخولك
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              لعرض أماكنك المفضلة على جميع أجهزتك
            </p>
            <button onClick={() => navigate('/auth')} style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              border: 'none', borderRadius: '14px', padding: '0.85rem 2rem',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              fontFamily: 'var(--font-main)', cursor: 'pointer',
            }}>
              🔑 تسجيل الدخول
            </button>
          </div>
        )}

        {!loading && isLoggedIn && favoritePlaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤍</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              قائمتك فارغة
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              اضغط على ❤️ في أي مكان لحفظه هنا
            </p>
            <button onClick={() => navigate('/')} style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              border: 'none', borderRadius: '14px', padding: '0.85rem 2rem',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              fontFamily: 'var(--font-main)', cursor: 'pointer',
            }}>
              🗺️ استكشف الأماكن
            </button>
          </div>
        )}

        {!loading && favoritePlaces.length > 0 && (
          <div>
            {favoritePlaces.map(p => <PlaceCard key={p._id} place={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}
