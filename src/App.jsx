import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { lazy, Suspense } from 'react'
import BottomNav from './components/BottomNav'

// الصفحات الموجودة
const HomePage           = lazy(() => import('./pages/HomePage'))
const PlaceDetailPage    = lazy(() => import('./pages/PlaceDetailPage'))
const AdminPage          = lazy(() => import('./pages/AdminPage'))
const SubscriptionsPage  = lazy(() => import('./pages/SubscriptionsPage'))
const AuthPage           = lazy(() => import('./pages/AuthPage'))
const DownloadPage       = lazy(() => import('./pages/DownloadPage'))
const MapPage            = lazy(() => import('./pages/MapPage'))

// الصفحات الجديدة
const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const MenuManagerPage    = lazy(() => import('./pages/MenuManagerPage'))
const OffersPage         = lazy(() => import('./pages/OffersPage'))
const AnalyticsPage      = lazy(() => import('./pages/AnalyticsPage'))
const FavoritesPage      = lazy(() => import('./pages/FavoritesPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentFailedPage  = lazy(() => import('./pages/PaymentFailedPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem',
      background: 'var(--bg-dark)',
    }}>
      <div style={{
        width: '44px', height: '44px',
        border: '4px solid rgba(26,107,69,0.15)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>جاري التحميل...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
          minHeight: '100vh',
        }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ─── الصفحات الأساسية ─── */}
              <Route path="/"              element={<HomePage />} />
              <Route path="/place/:id"     element={<PlaceDetailPage />} />
              <Route path="/admin"         element={<AdminPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/auth"          element={<AuthPage />} />
              <Route path="/download"      element={<DownloadPage />} />
              <Route path="/map"           element={<MapPage />} />

              {/* ─── صفحات المنصة الجديدة ─── */}
              <Route path="/favorites"           element={<FavoritesPage />} />
              <Route path="/dashboard"           element={<DashboardPage />} />
              <Route path="/dashboard/menu"      element={<MenuManagerPage />} />
              <Route path="/dashboard/offers"    element={<OffersPage />} />
              <Route path="/dashboard/analytics" element={<AnalyticsPage />} />

              {/* ─── صفحات الدفع ─── */}
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failed"  element={<PaymentFailedPage />} />

              {/* ─── نسيت كلمة المرور ─── */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>

        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
