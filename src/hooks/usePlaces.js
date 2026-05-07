import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchPlaces } from '../services/api'

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function usePlaces() {
  const [places,      setPlaces]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filter,      setFilter]      = useState('الكل')
  const [gov,         setGov]         = useState('الكل')
  const [sort,        setSort]        = useState('rating')
  const [userPos,     setUserPos]     = useState(null)
  const [geoStatus,   setGeoStatus]   = useState('idle') // idle | loading | granted | denied
  const posRef = useRef(null)

  // ─── اطلب الموقع فقط عند اختيار "الأقرب إليك" ───
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    if (posRef.current) { return } // عندنا موقع مسبقاً

    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        posRef.current = pos
        setUserPos(pos)
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // عند اختيار "nearest" ابدأ طلب الموقع
  const handleSetSort = useCallback((value) => {
    setSort(value)
    if (value === 'nearest') requestLocation()
  }, [requestLocation])

  const loadPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data = await fetchPlaces({ type: filter, governorate: gov })

      if (sort === 'nearest' && posRef.current) {
        data = data
          .map(p => ({
            ...p,
            _dist: p.location?.lat
              ? getDistanceKm(posRef.current.lat, posRef.current.lng, p.location.lat, p.location.lng)
              : 99999,
          }))
          .sort((a, b) => a._dist - b._dist)
      } else if (sort === 'rating') {
        data = [...data].sort((a, b) => b.averageRating - a.averageRating)
      }

      setPlaces(data)
    } catch {
      setError('تعذّر تحميل الأماكن.')
    } finally {
      setLoading(false)
    }
  }, [filter, gov, sort])

  // أعد تحميل الأماكن عند تغيّر الفلاتر
  useEffect(() => { loadPlaces() }, [loadPlaces])

  // أعد ترتيب الأماكن فور الحصول على الموقع
  useEffect(() => {
    if (geoStatus === 'granted' && sort === 'nearest') loadPlaces()
  }, [geoStatus]) // eslint-disable-line

  return {
    places, loading, error,
    filter, setFilter,
    gov,    setGov,
    sort,   setSort: handleSetSort,
    userPos, geoStatus,
    requestLocation,
  }
}
