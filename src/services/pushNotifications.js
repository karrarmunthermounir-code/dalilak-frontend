// ─── FCM Push Notifications via Capacitor ───
// يسجل صاحب المكان لاستقبال إشعارات Android الحقيقية (مثل واتساب)

import { Capacitor } from '@capacitor/core';

const API = (import.meta.env.VITE_API_URL || 'https://dalilak-backend.onrender.com') + '/api';

/**
 * تسجيل إشعارات FCM عبر Capacitor Push Notifications
 * يعمل فقط على Android (لا يعمل على المتصفح)
 */
export async function subscribeToPush(token) {
  // إذا مو على Android، لا تسوي شي
  if (!Capacitor.isNativePlatform()) {
    console.log('⚠️ Push: Not on native platform, skipping FCM');
    return false;
  }

  try {
    // Dynamic import لتجنب أخطاء على المتصفح
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. طلب إذن الإشعارات
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('⚠️ Push: Permission denied');
      return false;
    }

    // 2. التسجيل للحصول على FCM token
    await PushNotifications.register();

    // 3. استقبال التوكن وإرساله للسيرفر
    PushNotifications.addListener('registration', async (fcmData) => {
      console.log('✅ FCM Token:', fcmData.value);

      // إرسال التوكن للسيرفر
      try {
        await fetch(`${API}/auth/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fcmToken: fcmData.value }),
        });
        console.log('✅ FCM token saved to server');
      } catch (err) {
        console.error('❌ Failed to save FCM token:', err);
      }
    });

    // 4. خطأ في التسجيل
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ FCM Registration error:', error);
    });

    // 5. استقبال إشعار وهو التطبيق مفتوح
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 Push received (foreground):', notification);
      // لا نعرض شي — الإشعار يظهر تلقائياً في شريط الإشعارات
    });

    // 6. الضغط على الإشعار
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Push action:', action);
      // يمكن التوجيه لصفحة الحجوزات
      if (action.notification?.data?.type === 'booking') {
        window.location.hash = '#/dashboard/my-stats';
      }
    });

    return true;
  } catch (err) {
    console.error('❌ Push subscription error:', err);
    return false;
  }
}

/**
 * التحقق من حالة الاشتراك
 */
export async function isPushSubscribed() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.checkPermissions();
    return perm.receive === 'granted';
  } catch {
    return false;
  }
}
