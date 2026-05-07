import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
const TOKEN_KEY = 'dalilak_token'
const USER_KEY  = 'dalilak_user'

// ─── مساعدات localStorage للـ cache ───
const getCachedUser  = () => { try { const s = localStorage.getItem(USER_KEY);  return s ? JSON.parse(s) : null } catch { return null } }
const setCachedUser  = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u))
const clearCache     = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) }
const getToken       = () => localStorage.getItem(TOKEN_KEY)
const setToken       = (t) => localStorage.setItem(TOKEN_KEY, t)

// ─── إحسابة Tier من الاشتراك ───
const calcTier = (sub) => {
  if (!sub?.active) return 'free'
  if (['premium', 'yearly'].includes(sub.planId)) return 'premium'
  if (['pro', 'monthly_pro'].includes(sub.planId)) return 'pro'
  return 'free'
}

// ─── إحسابة هل الاشتراك نشط ───
const isSubActive = (sub) => {
  if (!sub?.expiresAt) return false
  return new Date(sub.expiresAt) > new Date()
}

// ════════════════════════════════
// دوال API المصدّرة
// ════════════════════════════════

export const registerUser = async ({ name, identifier, password, role }) => {
  const res  = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, identifier, password, role }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'خطأ في التسجيل')
  setToken(data.token)
  setCachedUser(data.user)
  return data.user
}

export const loginUser = async ({ identifier, password }) => {
  const res  = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'خطأ في تسجيل الدخول')
  setToken(data.token)
  setCachedUser(data.user)
  return data.user
}

export const activateSubscription = async (planId, planName) => {
  const token = getToken()
  if (!token) throw new Error('غير مسجّل الدخول')
  const res  = await fetch(`${API}/auth/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ planId, planName }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'خطأ في تفعيل الاشتراك')
  return data.subscription
}

export const getStats = async (placeId) => {
  const token = getToken()
  if (!token) return null
  try {
    const res  = await fetch(`${API}/auth/stats/${placeId || ''}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    return data.success ? data.stats : null
  } catch { return null }
}

// ════════════════════════════════
// AuthProvider
// ════════════════════════════════
export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(() => getCachedUser())
  const [subscription, setSubscription] = useState(() => getCachedUser()?.subscription || { active: false, tier: 'free' })
  const [favorites,    setFavorites]    = useState(() => getCachedUser()?.favorites || [])
  const [loading,      setLoading]      = useState(!!getToken()) // يحمّل فقط إذا في token

  // ─── تحديث البيانات من الخادم عند التهيئة ───
  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.user)
          setCachedUser(data.user)
          const sub = data.user.subscription || {}
          const active = isSubActive(sub)
          setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
          setFavorites(data.user.favorites || [])
        } else {
          // Token انتهى أو غير صحيح
          clearCache()
          setUser(null)
          setSubscription({ active: false, tier: 'free' })
        }
      })
      .catch(() => {
        // السيرفر غير متوفر — نستخدم الـ cache
        const cached = getCachedUser()
        if (cached) {
          const sub = cached.subscription || {}
          const active = isSubActive(sub)
          setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
          setFavorites(cached.favorites || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((userData, token) => {
    if (token) setToken(token)
    setCachedUser(userData)
    setUser(userData)
    const sub = userData.subscription || {}
    const active = isSubActive(sub)
    setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
    setFavorites(userData.favorites || [])
  }, [])

  const logout = useCallback(() => {
    clearCache()
    setUser(null)
    setSubscription({ active: false, tier: 'free' })
    setFavorites([])
  }, [])

  const subscribe = useCallback(async (planId, planName) => {
    try {
      const sub = await activateSubscription(planId, planName)
      const active = isSubActive(sub)
      const fullSub = { ...sub, active, tier: active ? calcTier(sub) : 'free' }
      setSubscription(fullSub)
      // تحديث الـ cache
      const cached = getCachedUser()
      if (cached) setCachedUser({ ...cached, subscription: fullSub })
      return fullSub
    } catch (err) {
      console.error('subscribe error:', err)
      return null
    }
  }, [])

  const refreshSubscription = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res  = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        const sub = data.user.subscription || {}
        const active = isSubActive(sub)
        setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
        setCachedUser(data.user)
      }
    } catch {}
  }, [])

  // ─── المفضلة ───
  const toggleFavorite = useCallback(async (placeId) => {
    // تحديث فوري في الـ UI
    setFavorites(prev => {
      const next = prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
      return next
    })

    // حفظ في الخادم
    const token = getToken()
    if (token) {
      try {
        const res  = await fetch(`${API}/auth/favorite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ placeId }),
        })
        const data = await res.json()
        if (data.success) {
          setFavorites(data.favorites)
          const cached = getCachedUser()
          if (cached) setCachedUser({ ...cached, favorites: data.favorites })
        }
      } catch {}
    } else {
      // حفظ محلي فقط إذا لم يسجّل الدخول
      setFavorites(prev => {
        const cached = getCachedUser()
        if (cached) setCachedUser({ ...cached, favorites: prev })
        return prev
      })
    }
  }, [])

  const isFavorite = useCallback((placeId) => favorites.includes(placeId), [favorites])

  // ─── تحديث بيانات المستخدم ───
  const updateUser = useCallback(async (fields) => {
    const token = getToken()
    if (!token) return
    try {
      const res  = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setCachedUser(data.user)
      }
    } catch {}
  }, [])

  const tier = subscription?.tier || 'free'

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      isLoggedIn: !!user,
      subscription, subscribe, refreshSubscription,
      isSubscribed: subscription?.active || false,
      subscriptionTier: tier,
      // المفضلة
      favorites, toggleFavorite, isFavorite,
      // تحديث البيانات
      updateUser,
      // صلاحيات
      isOwner: user?.role === 'owner',
      canEditMenu:       ['pro', 'premium'].includes(tier),
      canAccessAnalytics: tier === 'premium',
      canAddOffers:      ['pro', 'premium'].includes(tier),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
