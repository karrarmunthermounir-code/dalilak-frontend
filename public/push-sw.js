// ─── Push Notification Service Worker ───
// يعمل بالخلفية لاستقبال إشعارات الحجوزات

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'دليلك', body: event.data.text() };
  }

  const options = {
    body: data.body || 'إشعار جديد',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-72.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || 'dalilak-notification',
    renotify: true,
    requireInteraction: true,
    data: data.data || {},
    actions: [
      { action: 'open', title: '📋 فتح التطبيق' },
      { action: 'dismiss', title: '❌ إغلاق' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 دليلك', options)
  );
});

// عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا التطبيق مفتوح، ركّز عليه
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا مو مفتوح، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
