// hook لإدارة إشعارات الجهاز (Web Push Notifications)

let swReg = null

// سجّل الـ Service Worker عند أول استخدام
const registerSW = async () => {
  if (swReg) return swReg
  if (!('serviceWorker' in navigator)) return null
  try {
    swReg = await navigator.serviceWorker.register('/sw-notifications.js')
    return swReg
  } catch { return null }
}

// اطلب إذن الإشعارات من المستخدم
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// أرسل إشعاراً على جهاز المستخدم
export const sendNativeNotification = async ({ title, body, tag }) => {
  const granted = await requestNotificationPermission()
  if (!granted) return

  // محاولة عبر Service Worker أولاً (يعمل حتى لو التطبيق مغلق)
  const reg = await registerSW()
  if (reg) {
    reg.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: tag || 'dalilak',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
    })
  } else {
    // fallback: إشعار مباشر بدون SW
    new Notification(title, { body, icon: '/icons/icon-192x192.png', dir: 'rtl' })
  }
}
