import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'

const TYPE_ICON  = { 'كافيه':'☕', 'مطعم':'🍽️', 'كشتة':'🏕️', 'فندق':'🏨' }
const TYPE_COLOR = {
  'كافيه': { bg:'rgba(201,151,58,0.15)', color:'#e8b55d', border:'rgba(201,151,58,0.3)' },
  'مطعم':  { bg:'rgba(26,107,69,0.2)',   color:'#4ade80', border:'rgba(26,107,69,0.4)' },
  'فندق':  { bg:'rgba(99,102,241,0.15)', color:'#a5b4fc', border:'rgba(99,102,241,0.35)' },
}
const FALLBACK  = 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600&q=75'

function optimizeImg(url) {
  if (!url) return FALLBACK
  if (url.includes('unsplash.com') && !url.includes('w=')) return url + (url.includes('?') ? '&' : '?') + 'w=600&q=75&auto=format'
  return url
}

export default function PlaceCard({ place }) {
  const navigate   = useNavigate()
  const { t }      = useTranslation()
  const { isFavorite, toggleFavorite, isLoggedIn } = useAuth()
  const [imgLoaded, setImgLoaded] = useState(false)

  const imgSrc    = optimizeImg(place.images?.[0])
  const typeStyle = TYPE_COLOR[place.type] || TYPE_COLOR['مطعم']
  const isFav     = isFavorite(place._id)

  // هل يوجد عروض نشطة؟
  const hasOffer = place.offers?.some(o => o.active && (!o.expiresAt || new Date(o.expiresAt) > new Date()))
  const activeOffer = place.offers?.find(o => o.active && (!o.expiresAt || new Date(o.expiresAt) > new Date()))

  const typeLabel = place.type === 'مطعم'  ? t('filter.restaurant')
                  : place.type === 'كافيه' ? t('filter.cafe')
                  : place.type === 'فندق'  ? t('filter.hotel')
                  : place.type

  const handleFav = (e) => {
    e.stopPropagation()
    if (!isLoggedIn) { navigate('/auth'); return }
    toggleFavorite(place._id)
  }

  return (
    <article
      onClick={() => navigate(`/place/${place._id}`)}
      style={{
        background:'var(--bg-card)', borderRadius:'18px', overflow:'hidden',
        border:`1px solid ${place.isFeatured ? 'rgba(201,151,58,0.4)' : 'var(--border-color)'}`,
        boxShadow: place.isFeatured ? '0 4px 24px rgba(201,151,58,0.15)' : '0 2px 16px rgba(0,0,0,0.35)',
        cursor:'pointer', transition:'transform 0.18s, box-shadow 0.18s',
        marginBottom:'1rem', WebkitTapHighlightColor:'transparent', userSelect:'none',
      }}
      onTouchStart={e => e.currentTarget.style.transform='scale(0.985)'}
      onTouchEnd={e   => e.currentTarget.style.transform='scale(1)'}
    >
      {/* ─── الصورة ─── */}
      <div style={{ position:'relative', height:'200px', overflow:'hidden', background:'var(--bg-surface)' }}>
        {!imgLoaded && (
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(90deg,#1a3626 25%,#1e3d2c 50%,#1a3626 75%)',
            backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite',
          }} />
        )}
        <img
          src={imgSrc} alt={place.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', opacity:imgLoaded?1:0, transition:'opacity 0.35s' }}
          onError={e => { e.target.src=FALLBACK }} onLoad={() => setImgLoaded(true)}
          loading="lazy" decoding="async"
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(13,31,22,0.85))' }} />

        {/* شارة مميز */}
        {place.isFeatured && (
          <div style={{
            position:'absolute', top:0, right:0, left:0,
            background:'linear-gradient(90deg,rgba(201,151,58,0.9),rgba(201,151,58,0.6))',
            padding:'0.2rem 0.8rem', fontSize:'0.65rem', fontWeight:800,
            color:'#000', textAlign:'center', letterSpacing:'0.05em',
          }}>⭐ مكان مميز</div>
        )}

        {/* شارة عرض */}
        {hasOffer && (
          <div style={{
            position:'absolute', bottom:'42px', right:'10px',
            background:'rgba(239,68,68,0.9)', backdropFilter:'blur(4px)',
            color:'#fff', fontSize:'0.65rem', fontWeight:800,
            padding:'0.2rem 0.6rem', borderRadius:'99px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          }}>
            🎁 {activeOffer?.type === 'discount' ? `خصم ${activeOffer.discount}%` : activeOffer?.title?.slice(0,15) || 'عرض خاص'}
          </div>
        )}

        {/* شارة النوع */}
        <span style={{
          position:'absolute', top: place.isFeatured ? '28px' : '10px', right:'10px',
          background:typeStyle.bg, color:typeStyle.color,
          border:`1px solid ${typeStyle.border}`, backdropFilter:'blur(8px)',
          fontSize:'0.75rem', fontWeight:700, padding:'0.25rem 0.7rem', borderRadius:'99px',
        }}>
          {TYPE_ICON[place.type]} {typeLabel}
        </span>

        {/* زر المفضلة */}
        <button
          onClick={handleFav}
          style={{
            position:'absolute', top: place.isFeatured ? '28px' : '10px', left:'10px',
            background: isFav ? 'rgba(251,113,133,0.9)' : 'rgba(0,0,0,0.45)',
            border:'none', borderRadius:'50%', width:'34px', height:'34px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'1rem', backdropFilter:'blur(8px)',
            transition:'all 0.2s', boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* التقييم */}
        {place.averageRating > 0 && (
          <span style={{
            position:'absolute', top: place.isFeatured ? '28px' : '10px', left:'52px',
            background:'rgba(201,151,58,0.9)', color:'#000',
            fontSize:'0.78rem', fontWeight:800, padding:'0.25rem 0.6rem', borderRadius:'99px',
          }}>★ {place.averageRating}</span>
        )}

        {/* الاسم */}
        <h3 style={{
          position:'absolute', bottom:'10px', right:'12px', left:'12px',
          fontSize:'1.05rem', fontWeight:800, color:'#fff',
          textShadow:'0 1px 4px rgba(0,0,0,0.8)',
        }}>{place.name}</h3>
      </div>

      {/* ─── المعلومات ─── */}
      <div style={{ padding:'0.9rem 1rem', display:'flex', flexDirection:'column', gap:'0.55rem' }}>

        <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
          <span>📍</span>
          <span>{place.area || place.address}</span>
          {place.governorate && (
            <span style={{ marginRight:'auto', color:'var(--text-muted)', fontSize:'0.75rem' }}>{place.governorate}</span>
          )}
        </div>

        <p style={{
          fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:1.55,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>{place.description}</p>

        {/* ميزات + زر */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.2rem' }}>
          {place.features?.slice(0,3).map((f,i) => (
            <span key={i} style={{
              background:'rgba(255,255,255,0.06)', color:'var(--text-muted)',
              fontSize:'0.7rem', padding:'0.2rem 0.55rem',
              borderRadius:'99px', border:'1px solid rgba(255,255,255,0.08)',
            }}>{f}</span>
          ))}
          <button
            onClick={e => { e.stopPropagation(); navigate(`/place/${place._id}`) }}
            style={{
              marginRight:'auto',
              background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              color:'#fff', border:'none', borderRadius:'12px',
              padding:'0.45rem 1rem', fontSize:'0.82rem', fontWeight:700,
              cursor:'pointer', fontFamily:'var(--font-main)',
            }}
          >
            {t('buttons.details')} ◀
          </button>
        </div>

        {/* عرض بارز إذا وجد */}
        {hasOffer && activeOffer && (
          <div style={{
            background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
            borderRadius:'10px', padding:'0.5rem 0.7rem',
            display:'flex', alignItems:'center', gap:'0.4rem',
          }}>
            <span style={{ fontSize:'0.85rem' }}>🎁</span>
            <span style={{ fontSize:'0.76rem', color:'#fca5a5', fontWeight:700 }}>{activeOffer.title}</span>
          </div>
        )}
      </div>
    </article>
  )
}
