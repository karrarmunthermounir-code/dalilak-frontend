import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Preferences } from '@capacitor/preferences'
import { subscribeToPush } from '../services/pushNotifications'

const AuthContext = createContext(null)

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
const TOKEN_KEY = 'dalilak_token'
const USER_KEY  = 'dalilak_user'

// ─── تخزين دائم: يحفظ في localStorage + Capacitor Preferences ───
const getCachedUser = () => {
  try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null } catch { return null }
}
const setCachedUser = (u) => {
  const json = JSON.stringify(u)
  localStorage.setItem(USER_KEY, json)
  Preferences.set({ key: USER_KEY, value: json }).catch(() => {})
}
export const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (t) => {
  localStorage.setItem(TOKEN_KEY, t)
  Preferences.set({ key: TOKEN_KEY, value: t }).catch(() => {})
}
const clearCache = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  Preferences.remove({ key: TOKEN_KEY }).catch(() => {})
  Preferences.remove({ key: USER_KEY }).catch(() => {})
}

// ─── استعادة من التخزين الدائم عند فتح التطبيق ───
const restoreFromNativeStorage = async () => {
  try {
    const { value: token } = await Preferences.get({ key: TOKEN_KEY })
    const { value: userJson } = await Preferences.get({ key: USER_KEY })
    if (token && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, token)
    }
    if (userJson && !localStorage.getItem(USER_KEY)) {
      localStorage.setItem(USER_KEY, userJson)
    }
    return { token, user: userJson ? JSON.parse(userJson) : null }
  } catch {
    return { token: null, user: null }
  }
}

// ─── إحسابة Tier من الاشتراك ───
const calcTier = (sub) => {
  if (!sub?.active) return 'free'
  if (['premium', 'yearly'].includes(sub.planId)) return 'premium'
  if (['pro', 'monthly_pro'].includes(sub.planId)) return 'premium' // كل المميزات مفتوحة
  if (['free_trial'].includes(sub.planId)) return 'premium' // التجربة المجانية = كل المميزات
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

// ════════════════════════════════════════════════
// ─── استعادة كاملة لبيانات المستخدم من السيرفر ───
// ════════════════════════════════════════════════
const restoreAllData = async (token, userData) => {
  try {
    const res = await fetch(`${API}/auth/my-data`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
    const json = await res.json()
    if (!json.success) return null

    // ─── استعادة أماكن المستخدم ───
    if (json.places && json.places.length > 0) {
      // حفظ المكان الأول كـ "مكاني" (التوافق مع الكود القديم)
      localStorage.setItem('dalilak_my_place', JSON.stringify(json.places[0]))
      localStorage.setItem('dalilak_my_place_type', json.places[0].type || 'مطعم')
      console.log(`✅ تم استعادة ${json.places.length} مكان من السيرفر`)
    }

    return json
  } catch (err) {
    console.warn('restoreAllData error:', err.message)
    return null
  }
}

// ════════════════════════════════
// AuthProvider
// ════════════════════════════════
export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(() => getCachedUser())
  const [subscription, setSubscription] = useState(() => getCachedUser()?.subscription || { active: false, tier: 'free' })
  const [favorites,    setFavorites]    = useState(() => getCachedUser()?.favorites || [])
  const [loading,      setLoading]      = useState(true) // دائماً true بالبداية لحد ما نسترجع الجلسة

  // ─── استعادة الجلسة + تحديث من الخادم ───
  useEffect(() => {
    const init = async () => {
      // 1. استعادة من التخزين الدائم (Capacitor Preferences / SharedPreferences)
      const restored = await restoreFromNativeStorage()
      
      // 2. قراءة البيانات المستعادة
      const cachedUser = restored.user || getCachedUser()
      const token = restored.token || getToken()

      if (cachedUser) {
        setUser(cachedUser)
        const sub = cachedUser.subscription || {}
        const active = isSubActive(sub)
        setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
        setFavorites(cachedUser.favorites || [])
      }

      if (!token) {
        setLoading(false)
        return
      }

      // 3. استعادة كاملة من السيرفر (بيانات + أماكن + إعدادات)
      try {
        const fullData = await restoreAllData(token, cachedUser)
        
        if (fullData?.user) {
          setUser(fullData.user)
          setCachedUser(fullData.user)
          const sub = fullData.user.subscription || {}
          const active = isSubActive(sub)
          setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
          setFavorites(fullData.user.favorites || [])

          // ─── تفعيل إشعارات Push تلقائياً لأصحاب الأماكن ───
          if (fullData.user.role === 'owner') {
            subscribeToPush(token).catch(() => {})
          }
        } else if (!cachedUser) {
          // Token غير صحيح ولا يوجد cache
          clearCache()
          setUser(null)
          setSubscription({ active: false, tier: 'free' })
        }
      } catch {
        // السيرفر غير متوفر — نبقى على الـ cache
      }
      
      setLoading(false)
    }

    init()
  }, [])

  const login = useCallback(async (userData, token) => {
    if (token) setToken(token)
    setCachedUser(userData)
    setUser(userData)
    const sub = userData.subscription || {}
    const active = isSubActive(sub)
    setSubscription({ ...sub, active, tier: active ? calcTier(sub) : 'free' })
    setFavorites(userData.favorites || [])

    // ─── استعادة كاملة لبيانات المستخدم من السيرفر ───
    if (token) {
      const fullData = await restoreAllData(token, userData)
      if (fullData?.user) {
        setUser(fullData.user)
        setCachedUser(fullData.user)
        const s = fullData.user.subscription || {}
        const a = isSubActive(s)
        setSubscription({ ...s, active: a, tier: a ? calcTier(s) : 'free' })
        setFavorites(fullData.user.favorites || [])
      }
    }

    // ─── تفعيل إشعارات Push تلقائياً لأصحاب الأماكن ───
    if (userData.role === 'owner' && token) {
      subscribeToPush(token).catch(() => {})
    }
  }, [])

  const logout = useCallback(() => {
    clearCache()
    // امسح بيانات المكان المحلية أيضاً
    localStorage.removeItem('dalilak_my_place')
    localStorage.removeItem('dalilak_my_place_type')
    localStorage.removeItem('dalilak_my_menu')
    localStorage.removeItem('dalilak_table_bookings')
    setUser(null)
    setSubscription({ active: false, tier: 'free' })
    setFavorites([])
  }, [])

  const subscribe = useCallback(async (planId, planName) => {
    // 1. تفعيل محلي فوري (يعمل حتى لو السيرفر نايم)
    const DURATIONS = { free_trial: 30, monthly_pro: 30, pro: 30, premium: 365, yearly: 365 }
    const days = DURATIONS[planId] || 30
    const now = new Date()
    const expiresAt = new Date(now.getTime() + days * 864e5)
    const localSub = {
      planId, planName, status: 'active',
      activatedAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
      active: true, tier: 'premium', daysLeft: days,
    }
    setSubscription(localSub)
    const cached = getCachedUser()
    if (cached) setCachedUser({ ...cached, subscription: localSub })

    // 2. محاولة المزامنة مع السيرفر (بالخلفية)
    try {
      const sub = await activateSubscription(planId, planName)
      if (sub) {
        const active = isSubActive(sub)
        const fullSub = { ...sub, active, tier: active ? calcTier(sub) : 'free' }
        setSubscription(fullSub)
        if (cached) setCachedUser({ ...cached, subscription: fullSub })
        return fullSub
      }
    } catch (err) {
      console.warn('subscribe sync error (using local):', err)
    }
    
    return localSub
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

  // ─── حفظ الإعدادات في السيرفر ───
  const updateSettings = useCallback(async (settings) => {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`${API}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      })
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
      updateUser, updateSettings,
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
