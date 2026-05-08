// ─── Service Worker للإشعارات الفورية ───
// يعمل بشكل مستقل عن التطبيق في الخلفية

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

// استقبل رسالة من التطبيق لإرسال إشعار
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = e.data
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: tag || 'dalilak-notification',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: false,
    })
  }
})

// عند الضغط على الإشعار افتح التطبيق
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        list[0].focus()
        list[0].navigate('/dashboard/my-stats')
      } else {
        clients.openWindow('/dashboard/my-stats')
      }
    })
  )
})
