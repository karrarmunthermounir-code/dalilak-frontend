import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── كشف نظام التشغيل ───
function detectOS() {
  const ua = navigator.userAgent
  if (/android/i.test(ua))                    return 'android'
  if (/iphone|ipad|ipod/i.test(ua))           return 'ios'
  if (/windows/i.test(ua))                    return 'windows'
  if (/macintosh|mac os x/i.test(ua))         return 'mac'
  if (/linux/i.test(ua))                      return 'linux'
  return 'unknown'
}

// ─── بيانات المنصات ───
const PLATFORMS = [
  {
    id: 'android',
    name: 'Android',
    icon: '🤖',
    color: '#3ddc84',
    darkColor: 'rgba(61,220,132,0.12)',
    border: 'rgba(61,220,132,0.3)',
    badge: null,
    method: 'pwa',
    steps: [
      { icon: '🌐', text: 'افتح الموقع من متصفح Chrome' },
      { icon: '⋮',  text: 'اضغط على قائمة الخيارات (⋮) في الأعلى' },
      { icon: '📲', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
      { icon: '✅', text: 'اضغط "إضافة" وسيظهر أيقونة التطبيق' },
    ],
    link: null, // يُوَلَّد تلقائياً من الموقع الحالي
    btnLabel: '⬇️ تثبيت على Android',
    available: true,
  },
  {
    id: 'ios',
    name: 'iPhone / iPad',
    icon: '🍎',
    color: '#a0aec0',
    darkColor: 'rgba(160,174,192,0.12)',
    border: 'rgba(160,174,192,0.3)',
    badge: null,
    method: 'pwa',
    steps: [
      { icon: '🧭', text: 'افتح الموقع من متصفح Safari' },
      { icon: '⎙',  text: 'اضغط على زر المشاركة (□↑) في الأسفل' },
      { icon: '📲', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
      { icon: '✅', text: 'اضغط "إضافة" وسيظهر التطبيق' },
    ],
    link: null,
    btnLabel: '📱 تعليمات iOS (Safari)',
    available: true,
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: '🪟',
    color: '#00adef',
    darkColor: 'rgba(0,173,239,0.12)',
    border: 'rgba(0,173,239,0.3)',
    badge: null,
    method: 'pwa',
    steps: [
      { icon: '🌐', text: 'افتح الموقع من Chrome أو Edge' },
      { icon: '💾', text: 'اضغط على أيقونة التثبيت (⊞) في شريط العنوان' },
      { icon: '📲', text: 'اختر "تثبيت دليلك"' },
      { icon: '✅', text: 'سيظهر التطبيق في سطح المكتب وقائمة ابدأ' },
    ],
    link: null,
    btnLabel: '💻 تثبيت على Windows',
    available: true,
  },
]

// ─── بطاقة المنصة ───
function PlatformCard({ platform, isDetected, onInstall, expanded, onToggle }) {
  return (
    <div
      style={{
        background: isDetected ? platform.darkColor : 'var(--bg-card)',
        border: `2px solid ${isDetected ? platform.border : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        transition: 'all 0.3s',
        boxShadow: isDetected ? `0 8px 30px ${platform.darkColor}` : 'none',
      }}
    >
      {/* رأس البطاقة */}
      <div style={{ padding: '1.5rem 1.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: platform.darkColor,
          border: `1px solid ${platform.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', flexShrink: 0,
        }}>
          {platform.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {platform.name}
            </h3>
            {isDetected && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.7rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(93,222,138,0.2)', color: '#5dde8a',
                border: '1px solid rgba(93,222,138,0.3)',
              }}>
                ✓ جهازك الحالي
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            {platform.method === 'pwa' ? 'تثبيت PWA — يعمل بدون App Store' : 'تطبيق أصلي'}
          </p>
        </div>

        <button onClick={onToggle} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '1.2rem',
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s',
        }}>▼</button>
      </div>

      {/* الخطوات والزر */}
      {expanded && (
        <div style={{ padding: '0 1.8rem 1.8rem', borderTop: '1px solid var(--border-color)' }}>
          {/* خطوات التثبيت */}
          <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', marginTop: '1.2rem', fontSize: '0.88rem' }}>
            📋 خطوات التثبيت:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {platform.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.9rem',
              }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: platform.darkColor, border: `1px solid ${platform.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800, color: platform.color,
                }}>{i + 1}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{step.text}</span>
              </div>
            ))}
          </div>

          {/* زر التثبيت */}
          <button
            onClick={() => onInstall(platform)}
            style={{
              width: '100%', padding: '0.85rem',
              background: `linear-gradient(135deg, ${platform.color}22, ${platform.color}44)`,
              border: `1px solid ${platform.border}`,
              color: platform.color, borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.95rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = platform.darkColor}
            onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, ${platform.color}22, ${platform.color}44)`}
          >
            {platform.btnLabel}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── الصفحة الرئيسية ───
export default function DownloadPage() {
  const navigate      = useNavigate()
  const [os, setOs]   = useState('unknown')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled]           = useState(false)
  const [expanded, setExpanded]             = useState({})
  const [toast, setToast]                   = useState('')

  useEffect(() => {
    setOs(detectOS())

    // التقاط حدث تثبيت PWA
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    // التحقق من التثبيت
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      showToast('✅ تم تثبيت دليلك بنجاح!')
    })

    // فتح أول بطاقة مطابقة لجهاز المستخدم
    const detectedOS = detectOS()
    const match = PLATFORMS.find(p => p.id === detectedOS)
    if (match) setExpanded({ [match.id]: true })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleInstall = async (platform) => {
    if (platform.id === 'android' || platform.id === 'windows') {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const result = await deferredPrompt.userChoice
        if (result.outcome === 'accepted') {
          showToast('🎉 ممتاز! يتم تثبيت التطبيق...')
          setDeferredPrompt(null)
        }
      } else {
        showToast('💡 ابحث عن زر التثبيت (⊞) في شريط عنوان المتصفح')
      }
    } else if (platform.id === 'ios') {
      showToast('📱 افتح Safari واضغط على زر المشاركة (□↑) ثم "إضافة للشاشة الرئيسية"')
    }
  }

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div style={{ paddingTop: '1rem', minHeight: '100vh' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '50%', transform: 'translateX(50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)', padding: '0.8rem 1.5rem',
          color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem',
          zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          textAlign: 'center', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: '3rem 1.5rem 2rem',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(26,107,69,0.2), transparent 70%)',
      }}>
        <button className="back-btn" onClick={() => navigate('/')} style={{ margin: '0 auto 1.5rem' }}>
          ◀ رجوع
        </button>

        <div style={{ fontSize: '4rem', marginBottom: '0.8rem' }}>📲</div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1.2,
          background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent-light))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.8rem',
        }}>
          حمّل تطبيق دليلك
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.8 }}>
          ثبّت دليلك على جهازك واستمتع بتجربة التطبيق الكاملة —
          سريع، يعمل أوفلاين، وبدون App Store
        </p>

        {/* مميزات سريعة */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {[
            { icon: '⚡', text: 'سريع جداً' },
            { icon: '📶', text: 'يعمل أوفلاين' },
            { icon: '🆓', text: 'مجاني 100%' },
            { icon: '🔒', text: 'آمن وخاص' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem',
              fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600,
            }}>
              {f.icon} {f.text}
            </div>
          ))}
        </div>
      </section>

      {/* البطاقات */}
      <section style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 1.5rem 5rem' }}>

        {/* إشعار الجهاز الحالي */}
        {os !== 'unknown' && (
          <div style={{
            background: 'rgba(26,107,69,0.15)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600,
          }}>
            🔍 تم التعرف على جهازك:
            <strong style={{ color: 'var(--text-primary)' }}>
              {os === 'android' ? '🤖 Android' : os === 'ios' ? '🍎 iOS' : os === 'windows' ? '🪟 Windows' : os}
            </strong>
            — اتبع الخطوات أدناه
          </div>
        )}

        {installed && (
          <div style={{
            background: 'rgba(93,222,138,0.15)', border: '1px solid rgba(93,222,138,0.3)',
            borderRadius: 'var(--radius-md)', padding: '1rem 1.2rem',
            marginBottom: '1.5rem', textAlign: 'center', fontWeight: 700,
            color: '#5dde8a', fontSize: '1rem',
          }}>
            🎉 التطبيق مثبّت بالفعل على جهازك!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {PLATFORMS.map(platform => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              isDetected={os === platform.id}
              onInstall={handleInstall}
              expanded={!!expanded[platform.id]}
              onToggle={() => toggleExpand(platform.id)}
            />
          ))}
        </div>

        {/* ملاحظة */}
        <div style={{
          marginTop: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: '1.2rem 1.5rem',
        }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            💡 ما هو تطبيق PWA؟
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
            PWA (Progressive Web App) تقنية حديثة تحوّل الموقع لتطبيق كامل يعمل 
            على أي جهاز بدون الحاجة لـ App Store أو Play Store. يعمل أوفلاين، 
            يستخدم مساحة أقل، ويحصل على تحديثات تلقائية.
          </p>
        </div>
      </section>
    </div>
  )
}
