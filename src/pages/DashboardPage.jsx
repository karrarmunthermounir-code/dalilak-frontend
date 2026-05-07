import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlaces } from '../hooks/usePlaces'

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '18px',
  padding: '1.2rem',
  marginBottom: '1rem',
}

export default function DashboardPage() {
  const navigate  = useNavigate()
  const { user, isLoggedIn, isSubscribed, subscriptionTier, subscription, canEditMenu, canAddOffers, canAccessAnalytics } = useAuth()
  const { places } = usePlaces()

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ textAlign:'center', maxWidth:'340px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔒</div>
          <h2 style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.6rem' }}>سجّل دخولك أولاً</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1.5rem' }}>للوصول إلى لوحة التحكم، يجب تسجيل الدخول</p>
          <button onClick={() => navigate('/auth', { state:{ from:'/dashboard' } })}
            style={{ width:'100%', padding:'0.85rem', borderRadius:'14px', border:'none', background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))', color:'#fff', fontWeight:700, fontSize:'1rem', fontFamily:'var(--font-main)', cursor:'pointer' }}>
            🔑 تسجيل الدخول
          </button>
          <button onClick={() => navigate('/')} style={{ marginTop:'0.8rem', background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)' }}>
            ← الرئيسية
          </button>
        </div>
      </div>
    )
  }

  const TIER_COLORS = { free:'#94a3b8', pro:'var(--color-primary-light)', premium:'var(--color-accent-light)' }
  const TIER_ICONS  = { free:'🆓', pro:'⭐', premium:'💎' }
  const TIER_LABELS = { free:'مجاني', pro:'مشترك', premium:'مشترك' }

  const menuItems = [
    {
      icon: '🏪', label: 'معلومات مكاني', desc: 'تعديل الاسم، الصور، الوصف',
      path: '/admin', badge: null, locked: false,
    },
    {
      icon: '🍴', label: 'قائمة الطعام (منيو)', desc: 'إضافة وتعديل الأصناف والأسعار',
      path: '/dashboard/menu', badge: 'Pro', locked: !canEditMenu,
    },
    {
      icon: '🎁', label: 'العروض والخصومات', desc: 'أضف خصومات لجذب الزبائن',
      path: '/dashboard/offers', badge: 'Pro', locked: !canAddOffers,
    },
    {
      icon: '📊', label: 'الإحصائيات', desc: 'المشاهدات، النقرات، الزوار',
      path: '/dashboard/analytics', badge: 'Premium', locked: !canAccessAnalytics,
    },
  ]

  const tierColor = TIER_COLORS[subscriptionTier]

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      {/* Header */}
      <header style={{
        background:'linear-gradient(180deg, var(--color-primary-dark) 0%, var(--bg-dark) 100%)',
        padding:'1.4rem 1rem 1.2rem',
        borderBottom:'1px solid var(--border-color)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.2rem' }}>مرحباً 👋</p>
            <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-primary)' }}>{user?.name}</h1>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'0.3rem', marginTop:'0.4rem',
              background:`rgba(255,255,255,0.07)`, border:`1px solid ${tierColor}30`,
              borderRadius:'99px', padding:'0.25rem 0.7rem',
            }}>
              <span style={{ fontSize:'0.8rem' }}>{TIER_ICONS[subscriptionTier]}</span>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color: tierColor }}>
                خطة {TIER_LABELS[subscriptionTier]}
              </span>
            </div>
          </div>
          <button onClick={() => navigate('/subscriptions')} style={{
            background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
            border:'none', borderRadius:'12px', padding:'0.5rem 0.9rem',
            color:'#000', fontWeight:800, fontSize:'0.78rem', cursor:'pointer',
            fontFamily:'var(--font-main)',
          }}>
            ترقية ⚡
          </button>
        </div>

        {/* شريط الاشتراك */}
        {isSubscribed && (
          <div style={{
            marginTop:'1rem', background:'rgba(26,107,69,0.15)',
            border:'1px solid rgba(26,107,69,0.3)', borderRadius:'14px',
            padding:'0.8rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>اشتراكك فعّال</p>
              <p style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--color-primary-light)' }}>
                {subscription?.daysLeft} يوم متبقي
              </p>
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'right' }}>
              <div>ينتهي</div>
              <div style={{ color:'var(--text-secondary)', fontWeight:600 }}>
                {new Date(subscription?.expiresAt).toLocaleDateString('ar-IQ')}
              </div>
            </div>
          </div>
        )}
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* إحصائيات سريعة */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.7rem', marginBottom:'1.2rem' }}>
          {[
            { icon:'👁️', label:'مشاهدات هذا الشهر', value: canAccessAnalytics ? '247' : '---', locked:!canAccessAnalytics },
            { icon:'❤️', label:'في المفضلة', value: canAccessAnalytics ? '38' : '---', locked:!canAccessAnalytics },
            { icon:'📞', label:'نقرات الاتصال', value: canAccessAnalytics ? '14' : '---', locked:!canAccessAnalytics },
            { icon:'⭐', label:'متوسط التقييم', value:'4.3', locked:false },
          ].map((s,i) => (
            <div key={i} style={{
              ...cardStyle, marginBottom:0, textAlign:'center',
              position:'relative', overflow:'hidden',
            }}>
              {s.locked && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(13,31,22,0.85)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  borderRadius:'18px', backdropFilter:'blur(4px)',
                }}>
                  <span style={{ fontSize:'1.2rem' }}>🔒</span>
                  <span style={{ fontSize:'0.65rem', color:'var(--color-accent-light)', marginTop:'0.2rem', fontWeight:700 }}>Premium</span>
                </div>
              )}
              <div style={{ fontSize:'1.5rem', marginBottom:'0.2rem' }}>{s.icon}</div>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* قائمة الخيارات */}
        <h2 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
          إدارة مكانك
        </h2>

        {menuItems.map((item, i) => (
          <div key={i}
            onClick={() => !item.locked ? navigate(item.path) : navigate('/subscriptions')}
            style={{
              ...cardStyle,
              display:'flex', alignItems:'center', gap:'1rem',
              cursor:'pointer', transition:'all 0.18s',
              opacity: item.locked ? 0.75 : 1,
            }}
            onTouchStart={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
            onTouchEnd={e => e.currentTarget.style.background='var(--bg-card)'}
          >
            <div style={{
              width:'48px', height:'48px', borderRadius:'14px', flexShrink:0,
              background: item.locked ? 'rgba(255,255,255,0.05)' : 'rgba(26,107,69,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.4rem',
            }}>
              {item.locked ? '🔒' : item.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)' }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize:'0.62rem', fontWeight:800, padding:'0.1rem 0.45rem',
                    borderRadius:'99px',
                    background: item.badge === 'Premium' ? 'rgba(201,151,58,0.2)' : 'rgba(26,107,69,0.2)',
                    color: item.badge === 'Premium' ? 'var(--color-accent-light)' : 'var(--color-primary-light)',
                    border: item.badge === 'Premium' ? '1px solid rgba(201,151,58,0.4)' : '1px solid rgba(26,107,69,0.4)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>{item.desc}</p>
              {item.locked && (
                <p style={{ fontSize:'0.72rem', color:'var(--color-accent-light)', marginTop:'0.2rem', fontWeight:700 }}>
                  ⚡ ترقّ لتفعيل هذه الميزة
                </p>
              )}
            </div>
            <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>{item.locked ? '↗' : '◀'}</span>
          </div>
        ))}

        {/* إذا لم يكن مشتركاً */}
        {!isSubscribed && (
          <div style={{
            background:'linear-gradient(135deg, rgba(201,151,58,0.1), rgba(201,151,58,0.05))',
            border:'1px solid rgba(201,151,58,0.3)', borderRadius:'18px',
            padding:'1.3rem', marginTop:'0.5rem', textAlign:'center',
          }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💎</div>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'var(--color-accent-light)', marginBottom:'0.4rem' }}>
              فعّل اشتراكك لفتح كل الميزات
            </h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1rem', lineHeight:1.6 }}>
              منيو احترافي • عروض • إحصائيات • ظهور مميز
            </p>
            <button onClick={() => navigate('/subscriptions')} style={{
              background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
              border:'none', borderRadius:'12px', padding:'0.75rem 2rem',
              color:'#000', fontWeight:800, fontSize:'0.9rem',
              fontFamily:'var(--font-main)', cursor:'pointer',
              boxShadow:'0 4px 20px rgba(201,151,58,0.3)',
            }}>
              ابدأ تجربتك المجانية
            </button>
          </div>
        )}

        {/* الخروج */}
        <button onClick={() => { navigate('/'); }} style={{
          width:'100%', marginTop:'1.5rem', padding:'0.8rem',
          background:'transparent', border:'1px solid var(--border-color)',
          borderRadius:'14px', color:'var(--text-muted)', fontSize:'0.85rem',
          cursor:'pointer', fontFamily:'var(--font-main)',
        }}>
          ← العودة للرئيسية
        </button>
      </div>
    </main>
  )
}
