import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

// ─── إحداثيات البصرة ───
const BASRA_CENTER = { lat: 30.5081, lng: 47.7835 }

// ─── فئات البحث ───
const SEARCH_TYPES = [
  { id: 'all',        label: 'الكل',      icon: '🗺️', types: ['restaurant', 'cafe'] },
  { id: 'restaurant', label: 'مطاعم',     icon: '🍽️', types: ['restaurant'] },
  { id: 'cafe',       label: 'كافيهات',   icon: '☕', types: ['cafe'] },
]

// ─── نجوم التقييم ───
function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          fontSize: '0.75rem',
          color: i <= Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.2)',
        }}>★</span>
      ))}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>
        ({rating?.toFixed(1)})
      </span>
    </div>
  )
}

// ─── بطاقة المكان في القائمة الجانبية ───
function PlaceListItem({ place, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
        padding: '0.9rem 1rem', cursor: 'pointer', transition: 'all 0.18s',
        background: isSelected ? 'rgba(26,107,69,0.2)' : 'transparent',
        borderRight: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* صورة مصغّرة */}
      <div style={{
        width: '58px', height: '58px', borderRadius: '10px', flexShrink: 0,
        background: 'var(--bg-surface)', overflow: 'hidden',
      }}>
        {place.photos?.[0] ? (
          <img
            src={place.photos[0].getUrl({ maxWidth: 120, maxHeight: 120 })}
            alt={place.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
          }}>
            {place.types?.includes('cafe') ? '☕' : '🍽️'}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)',
          marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{place.name}</p>

        {place.rating && <Stars rating={place.rating} />}

        <p style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          📍 {place.vicinity || 'البصرة، العراق'}
        </p>

        {place.opening_hours && (
          <span style={{
            display: 'inline-block', marginTop: '0.3rem',
            fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
            borderRadius: '99px',
            background: place.opening_hours.isOpen?.()
              ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: place.opening_hours.isOpen?.() ? '#4ade80' : '#f87171',
          }}>
            {place.opening_hours.isOpen?.() ? '● مفتوح' : '● مغلق'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── InfoWindow المخصص (يظهر فوق الـ Marker) ───
function CustomInfoPanel({ place, onClose }) {
  if (!place) return null

  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 220 })

  return (
    <div style={{
      position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      width: 'min(340px, 90vw)', zIndex: 10,
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      animation: 'slideUp 0.25s ease',
    }}>
      {/* صورة المكان */}
      <div style={{ position: 'relative', height: '160px', background: 'var(--bg-surface)' }}>
        {photoUrl ? (
          <img src={photoUrl} alt={place.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
          }}>
            {place.types?.includes('cafe') ? '☕' : '🍽️'}
          </div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(13,31,22,0.9))',
        }} />
        <button onClick={onClose} style={{
          position: 'absolute', top: '8px', left: '8px',
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
          fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-main)',
        }}>✕</button>

        {/* نوع المكان */}
        <span style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'rgba(26,107,69,0.85)', color: '#a8ffcc',
          fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.7rem',
          borderRadius: '99px', backdropFilter: 'blur(8px)',
        }}>
          {place.types?.includes('cafe') ? '☕ كافيه' : '🍽️ مطعم'}
        </span>
      </div>

      {/* معلومات المكان */}
      <div style={{ padding: '1rem 1.2rem' }}>
        <h3 style={{
          fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)',
          marginBottom: '0.4rem',
        }}>{place.name}</h3>

        {place.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Stars rating={place.rating} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({place.user_ratings_total?.toLocaleString()} تقييم)
            </span>
          </div>
        )}

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          📍 {place.vicinity || 'البصرة، العراق'}
        </p>

        {/* حالة الفتح */}
        {place.opening_hours && (
          <div style={{ marginBottom: '0.8rem' }}>
            <span style={{
              fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.7rem',
              borderRadius: '99px',
              background: place.opening_hours.isOpen?.()
                ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: place.opening_hours.isOpen?.() ? '#4ade80' : '#f87171',
            }}>
              {place.opening_hours.isOpen?.() ? '● مفتوح الآن' : '● مغلق الآن'}
            </span>
          </div>
        )}

        {/* التقييم السعري */}
        {place.price_level !== undefined && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
            💰 {'$'.repeat(place.price_level + 1)} {'$'.repeat(4 - place.price_level).split('').map(() => '').join('')}
            <span style={{ opacity: 0.4 }}>{'$'.repeat(4 - place.price_level)}</span>
          </p>
        )}

        {/* زر Google Maps */}
        <a
          href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
          target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            width: '100%', padding: '0.65rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            color: '#fff', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          🗺️ فتح في Google Maps
        </a>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// الصفحة الرئيسية للخريطة
// ═══════════════════════════════════════════════════
export default function MapPage() {
  const mapRef        = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef    = useRef([])
  const serviceRef    = useRef(null)

  const [places,      setPlaces]       = useState([])
  const [selected,    setSelected]     = useState(null)
  const [activeType,  setActiveType]   = useState('all')
  const [loading,     setLoading]      = useState(true)
  const [error,       setError]        = useState('')
  const [searchQuery, setSearchQuery]  = useState('')
  const [mapLoaded,   setMapLoaded]    = useState(false)

  // ─── تهيئة الخريطة ───
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      setError('no_key')
      setLoading(false)
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'ar',
      region: 'IQ',
    })

    loader.load().then((google) => {
      const map = new google.maps.Map(mapRef.current, {
        center: BASRA_CENTER,
        zoom: 13,
        mapTypeId: 'roadmap',
        styles: DARK_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        clickableIcons: false,
      })

      mapInstanceRef.current = map
      serviceRef.current = new google.maps.places.PlacesService(map)
      setMapLoaded(true)
      searchNearby(google, map, serviceRef.current, ['restaurant', 'cafe'])
    }).catch(() => {
      setError('load_error')
      setLoading(false)
    })
  }, [])

  // ─── البحث عن الأماكن القريبة ───
  const searchNearby = useCallback((google, map, service, types) => {
    setLoading(true)
    setPlaces([])
    clearMarkers()

    const request = {
      location: BASRA_CENTER,
      radius: 8000,
      type: types,
      keyword: 'بصرة',
    }

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPlaces(results)
        addMarkers(google, map, service, results)
      } else {
        setError('no_results')
      }
      setLoading(false)
    })
  }, [])

  // ─── تغيير الفئة ───
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !serviceRef.current) return
    const w = window.google
    if (!w) return

    const type = SEARCH_TYPES.find(t => t.id === activeType)
    searchNearby(w, mapInstanceRef.current, serviceRef.current, type.types)
    setSelected(null)
  }, [activeType, mapLoaded, searchNearby])

  // ─── إضافة Markers ───
  const addMarkers = (google, map, service, results) => {
    clearMarkers()

    results.forEach((place) => {
      const isCafe = place.types?.includes('cafe')

      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isCafe ? '#c9973a' : '#1a6b45',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      })

      marker.addListener('click', () => {
        // جلب تفاصيل إضافية عند الضغط
        service.getDetails({
          placeId: place.place_id,
          fields: ['name', 'rating', 'user_ratings_total', 'photos',
                   'opening_hours', 'vicinity', 'price_level', 'types', 'place_id'],
        }, (details, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setSelected(details)
          } else {
            setSelected(place)
          }
        })

        map.panTo(place.geometry.location)
        map.setZoom(15)
      })

      markersRef.current.push(marker)
    })
  }

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
  }

  // ─── فلترة البحث النصي ───
  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.vicinity || '').includes(searchQuery)
  )

  // ─── تمييز المكان على الخريطة ───
  const focusPlace = (place) => {
    // Google Maps LatLng object → استخرج lat/lng بالطريقة الصحيحة
    const geo = place.geometry?.location
    if (!geo) return

    const lat = typeof geo.lat === 'function' ? geo.lat() : geo.lat
    const lng = typeof geo.lng === 'function' ? geo.lng() : geo.lng

    setSelected(place)
    mapInstanceRef.current?.panTo({ lat, lng })
    mapInstanceRef.current?.setZoom(16)
  }

  return (
    <div style={{ paddingTop: '0', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>

      {/* شريط العنوان */}
      <div style={{
        padding: '0.8rem 1.2rem', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🗺️ خريطة دليلك — البصرة
          </h1>
          {!loading && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filteredPlaces.length} مكان
            </p>
          )}
        </div>

        {/* فلاتر النوع */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {SEARCH_TYPES.map(type => (
            <button key={type.id} onClick={() => setActiveType(type.id)} style={{
              padding: '0.35rem 0.85rem', border: 'none', borderRadius: '99px',
              fontFamily: 'var(--font-main)', fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', transition: 'all 0.18s',
              background: activeType === type.id
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                : 'var(--bg-surface)',
              color: activeType === type.id ? '#fff' : 'var(--text-secondary)',
            }}>
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─── القائمة الجانبية ─── */}
        <div style={{
          width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)',
          overflowY: 'auto',
        }}>
          {/* بحث */}
          <div style={{ padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مكان..."
                style={{
                  width: '100%', padding: '0.55rem 2.2rem 0.55rem 0.8rem',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-main)', fontSize: '0.85rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* حالة التحميل */}
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '32px', height: '32px', margin: '0 auto 0.8rem',
                border: '3px solid rgba(26,107,69,0.2)', borderTopColor: 'var(--color-primary)',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                جاري جلب الأماكن من Google Maps...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* قائمة الأماكن */}
          {!loading && filteredPlaces.map(place => (
            <PlaceListItem
              key={place.place_id}
              place={place}
              isSelected={selected?.place_id === place.place_id}
              onClick={() => focusPlace(place)}
            />
          ))}

          {/* لا نتائج */}
          {!loading && filteredPlaces.length === 0 && !error && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              لا توجد نتائج
            </div>
          )}
        </div>

        {/* ─── الخريطة ─── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* شاشة خطأ مفتاح API */}
          {error === 'no_key' && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-dark)',
            }}>
              <div style={{
                maxWidth: '440px', textAlign: 'center', padding: '2rem',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '20px',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                  تحتاج مفتاح Google Maps API
                </h2>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
                  padding: '1rem', marginBottom: '1.2rem',
                  fontFamily: 'monospace', fontSize: '0.82rem',
                  color: 'var(--color-accent-light)', textAlign: 'right', lineHeight: 2,
                }}>
                  <p>1. افتح: <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: '#64b5f6' }}>console.cloud.google.com</a></p>
                  <p>2. شغّل: Maps JavaScript API</p>
                  <p>3. شغّل: Places API</p>
                  <p>4. انسخ المفتاح</p>
                  <p>5. ضعه في ملف <strong>.env</strong>:</p>
                  <code style={{ display: 'block', background: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '6px', marginTop: '0.3rem', direction: 'ltr' }}>
                    VITE_GOOGLE_MAPS_API_KEY=AIza...
                  </code>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  المفتاح مجاني حتى 200$ شهرياً (كافي للمشاريع الصغيرة)
                </p>
              </div>
            </div>
          )}

          {/* بانل المكان المحدد */}
          {selected && (
            <CustomInfoPanel place={selected} onClose={() => setSelected(null)} />
          )}

          {/* مؤشر التحميل فوق الخريطة */}
          {loading && mapLoaded && (
            <div style={{
              position: 'absolute', top: '1rem', left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '99px', padding: '0.5rem 1.2rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.82rem', color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(26,107,69,0.3)', borderTopColor: 'var(--color-primary)',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              جاري التحميل...
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── ستايل الخريطة الداكن ───
const DARK_MAP_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#0d1f16' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a8c4b0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1f16' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a3626' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#122a1c' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a6b45' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a2d3d' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a7b8c' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#122a1c' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f2a1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a3626' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a3626' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#c9973a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e8b55d' }] },
]
