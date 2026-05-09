// ─── Push Notification Manager ───
// يسجل صاحب المكان لاستقبال إشعارات الحجوزات

const API = import.meta.env.VITE_API_URL || 'https://dalilak-backend.onrender.com/api';

/**
 * تحويل مفتاح VAPID من Base64 إلى Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * تسجيل Service Worker للإشعارات
 */
async function registerPushSW() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('⚠️ Push notifications not supported');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
    console.log('✅ Push SW registered');
    return reg;
  } catch (err) {
    console.error('❌ Push SW registration failed:', err);
    return null;
  }
}

/**
 * الاشتراك في Push Notifications
 */
export async function subscribeToPush(token) {
  try {
    // 1. طلب إذن الإشعارات
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('⚠️ Notification permission denied');
      return false;
    }

    // 2. تسجيل Service Worker
    const registration = await registerPushSW();
    if (!registration) return false;

    // 3. جلب مفتاح VAPID العام
    const vapidRes = await fetch(`${API}/auth/vapid-key`);
    const vapidData = await vapidRes.json();
    if (!vapidData.success) {
      console.error('❌ Failed to get VAPID key');
      return false;
    }

    // 4. الاشتراك في Push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
    });

    // 5. إرسال الاشتراك للسيرفر
    const saveRes = await fetch(`${API}/auth/push-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    const saveData = await saveRes.json();
    if (saveData.success) {
      console.log('✅ Push notifications activated!');
      return true;
    }

    console.error('❌ Failed to save push subscription:', saveData.message);
    return false;
  } catch (err) {
    console.error('❌ Push subscription error:', err);
    return false;
  }
}

/**
 * التحقق من حالة الاشتراك
 */
export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/push-sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
