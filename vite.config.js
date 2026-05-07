import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// نسخة التطبيق — غيّرها لإجبار تحديث الـ Cache
const APP_VERSION = '6.0.0'

// عنوان البيكند — يُقرأ من .env أو يستخدم Render URL افتراضياً
const API_BASE = process.env.VITE_API_URL || 'https://dalilak-api.onrender.com'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // إجبار تحديث الـ Service Worker فوراً
      devOptions: { enabled: false },
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'دليلك — الدليل السياحي في العراق',
        short_name: 'دليلك',
        description: 'اكتشف أجمل الكافيهات والمطاعم والكشتات في العراق',
        theme_color: '#1a6b45',
        background_color: '#0d1f17',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-72.png',   sizes: '72x72',   type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-96.png',   sizes: '96x96',   type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-128.png',  sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-144.png',  sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-152.png',  sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-192.png',  sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-384.png',  sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
          { src: '/icons/icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
        categories: ['travel', 'food', 'lifestyle'],
      },
      workbox: {
        // اسم cache جديد يجبر على تنزيل كل شيء من جديد
        cacheId: `dalilak-v${APP_VERSION}`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // لا تخزّن API calls
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/places/],
        // تحديث فوري عند وجود نسخة جديدة
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `unsplash-v${APP_VERSION}`,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
    }),
  ],
  // إضافة رقم النسخة كـ متغير بيئة عشان يظهر في التطبيق
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api':    { target: API_BASE, changeOrigin: true },
      '/places': { target: API_BASE, changeOrigin: true },
    },
  },
  build: {
    // هاش مختلف لكل build يضمن تحديث الملفات
    rollupOptions: {
      output: {
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash].[ext]',
      },
    },
  },
})
