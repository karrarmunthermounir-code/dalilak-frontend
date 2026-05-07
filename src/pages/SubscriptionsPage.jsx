import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

// ─── خطط الاشتراك ───
const PLANS = [
  {
    id: 'free_trial',
    name: 'تجربة مجانية',
    nameEn: 'Free Trial',
    price: 0,
    period: 'أول شهر',
    icon: '🎁',
    color: '#5dde8a',
    gradient: 'linear-gradient(135deg, rgba(26,107,69,0.25), rgba(26,107,69,0.08))',
    border: 'rgba(93,222,138,0.5)',
    badge: '🎉 مجاناً!',
    features: [
      { text: 'كل المميزات مفتوحة', ok: true },
      { text: 'إضافة حتى 10 أماكن', ok: true },
      { text: 'صور غير محدودة', ok: true },
      { text: 'قائمة طعام كاملة (منيو)', ok: true },
      { text: 'إضافة عروض وخصومات', ok: true },
      { text: 'إحصائيات تفصيلية كاملة', ok: true },
      { text: 'ظهور مميز في الأعلى', ok: true },
    ],
  },
  {
    id: 'monthly_pro',
    name: 'شهري',
    nameEn: 'Monthly',
    price: 50,
    iqd: 65000,
    period: 'شهر',
    icon: '⭐',
    color: 'var(--color-primary-light)',
    gradient: 'linear-gradient(135deg, var(--color-primary-dark), var(--bg-dark))',
    border: 'rgba(26,107,69,0.5)',
    features: [
      { text: 'كل المميزات مفتوحة', ok: true },
      { text: 'إضافة حتى 10 أماكن', ok: true },
      { text: 'صور غير محدودة', ok: true },
      { text: 'قائمة طعام كاملة (منيو)', ok: true },
      { text: 'إضافة عروض وخصومات', ok: true },
      { text: 'إحصائيات تفصيلية كاملة', ok: true },
      { text: 'ظهور مميز في الأعلى', ok: true },
    ],
  },
  {
    id: 'premium',
    name: 'سنوي',
    nameEn: 'Yearly',
    price: 250,
    iqd: 325000,
    period: 'سنة',
    icon: '💎',
    color: 'var(--color-accent-light)',
    gradient: 'linear-gradient(135deg, rgba(201,151,58,0.15), rgba(201,151,58,0.05))',
    border: 'rgba(201,151,58,0.5)',
    badge: '🔥 وفّر 58%',
    features: [
      { text: 'كل المميزات مفتوحة', ok: true },
      { text: 'إضافة حتى 10 أماكن', ok: true },
      { text: 'صور غير محدودة', ok: true },
      { text: 'قائمة طعام كاملة (منيو)', ok: true },
      { text: 'إضافة عروض وخصومات', ok: true },
      { text: 'إحصائيات تفصيلية كاملة 📊', ok: true },
      { text: 'ظهور مميز في الأعلى 💎', ok: true },
    ],
  },
]

// ─── نافذة الدفع — ZainCash Real Integration ───
function PaymentModal({ plan, onClose, onConfirm, userInfo }) {
  const [step,    setStep]    = useState('form') // form | loading | error
  const [form,    setForm]    = useState({ name: userInfo?.name || '', phone: '' })
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ─── ZainCash: إنشاء طلب دفع وتحويل للمستخدم ───
  const handleZainCash = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      setError('يرجى ملء الاسم ورقم الهاتف')
      return
    }
    setError('')
    setStep('loading')
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${API_BASE}/api/payment/zaincash/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id === 'monthly_pro' ? 'monthly' : 'yearly',
          name:   form.name,
          phone:  form.phone,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'فشل الاتصال بـ ZainCash')

      // حفظ بيانات الطلب محلياً للرجوع إليها بعد العودة من ZainCash
      sessionStorage.setItem('pending_payment', JSON.stringify({
        orderId: data.orderId,
        planId:  plan.id,
        planName: plan.name,
        demo:    data.demo || false,
      }))

      // تحويل المستخدم لصفحة دفع ZainCash
      window.location.href = data.payUrl
    } catch (err) {
      setError(err.message || 'حدث خطأ. تأكد أن الـ Backend يعمل على port 5000')
      setStep('form')
    }
  }

  // ─── Demo: تفعيل فوري بدون دفع حقيقي ───
  const handleDemo = async () => {
    setStep('loading')
    await new Promise(r => setTimeout(r, 1000))
    onConfirm(plan.id, plan.name)
    onClose()
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.82)',
      display:'flex', alignItems:'flex-end', zIndex:2000, backdropFilter:'blur(8px)',
    }}>
      <div style={{
        width:'100%', maxWidth:'480px', margin:'0 auto',
        background:'var(--bg-card)', borderRadius:'24px 24px 0 0',
        padding:'1.5rem', paddingBottom:'calc(1.5rem + env(safe-area-inset-bottom))',
        maxHeight:'92vh', overflowY:'auto',
      }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
          <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>
            💳 إتمام الاشتراك — {plan.name}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.4rem' }}>✕</button>
        </div>

        {/* بطاقة الخطة */}
        <div style={{
          background: plan.gradient, border:`1px solid ${plan.border}`,
          borderRadius:'16px', padding:'1rem', marginBottom:'1.4rem', textAlign:'center',
        }}>
          <span style={{ fontSize:'2.2rem' }}>{plan.icon}</span>
          <div style={{ fontSize:'1.8rem', fontWeight:900, color:plan.color, margin:'0.3rem 0' }}>
            {plan.price === 0 ? 'مجانًا' : `$${plan.price}`}
          </div>
          {plan.period && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>/ {plan.period}</div>}
          {plan.iqd && (
            <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>
              ≈ <span style={{ color:'var(--color-accent-light)', fontWeight:700 }}>
                {plan.iqd.toLocaleString('ar-IQ')}
              </span> د.ع
            </div>
          )}
        </div>

        {step === 'loading' ? (
          <div style={{ textAlign:'center', padding:'2.5rem 0' }}>
            <div style={{
              width:'50px', height:'50px', borderRadius:'50%',
              border:'4px solid rgba(26,107,69,0.2)',
              borderTopColor:'var(--color-primary)',
              animation:'spin 0.8s linear infinite',
              margin:'0 auto 1rem',
            }} />
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>جاري التواصل مع ZainCash...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <form onSubmit={handleZainCash}>

            {error && (
              <div style={{
                background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:'12px', padding:'0.75rem 1rem', marginBottom:'1rem',
                fontSize:'0.84rem', color:'#f87171',
              }}>⚠️ {error}</div>
            )}

            {/* حقل الاسم */}
            <div style={{ marginBottom:'0.8rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>
                اسمك الكامل
              </label>
              <input
                type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="محمد أحمد" required
                style={{
                  width:'100%', padding:'0.75rem 0.9rem', borderRadius:'14px',
                  border:'1px solid var(--border-color)', background:'var(--bg-input)',
                  color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'var(--font-main)',
                  outline:'none', boxSizing:'border-box',
                }}
              />
            </div>

            {/* حقل الهاتف */}
            <div style={{ marginBottom:'1.2rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>
                رقم هاتفك (ZainCash)
              </label>
              <input
                type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="07xxxxxxxxx" required
                style={{
                  width:'100%', padding:'0.75rem 0.9rem', borderRadius:'14px',
                  border:'1px solid var(--border-color)', background:'var(--bg-input)',
                  color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'var(--font-main)',
                  outline:'none', boxSizing:'border-box', direction:'ltr',
                }}
              />
            </div>

            {/* زر ZainCash الحقيقي */}
            <button type="submit" style={{
              width:'100%', padding:'1rem', borderRadius:'16px', border:'none',
              background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              color:'#fff', fontWeight:800, fontSize:'1rem', fontFamily:'var(--font-main)',
              cursor:'pointer', marginBottom:'0.7rem',
              boxShadow:'0 6px 24px rgba(26,107,69,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
            }}>
              📱 ادفع عبر ZainCash
            </button>

            {/* فاصل */}
            <div style={{ textAlign:'center', margin:'0.6rem 0', color:'var(--text-muted)', fontSize:'0.75rem' }}>
              — أو —
            </div>

            {/* زر Demo للتطوير */}
            <button type="button" onClick={handleDemo} style={{
              width:'100%', padding:'0.8rem', borderRadius:'14px', cursor:'pointer',
              background:'rgba(201,151,58,0.1)', border:'1px solid rgba(201,151,58,0.3)',
              fontFamily:'var(--font-main)', fontWeight:700, fontSize:'0.85rem',
              color:'var(--color-accent-light)',
            }}>
              ⚡ تفعيل تجريبي (Demo — بدون دفع)
            </button>

            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', marginTop:'0.8rem', lineHeight:1.6 }}>
              🔒 ستُحوَّل إلى بوابة ZainCash الآمنة لإتمام الدفع. يُفعَّل اشتراكك تلقائياً بعد النجاح.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── الصفحة الرئيسية ───
export default function SubscriptionsPage() {
  const navigate  = useNavigate()
  const { user, isLoggedIn, isSubscribed, subscriptionTier, subscription, subscribe } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showModal,    setShowModal]    = useState(false)

  const handleSelect = (plan) => {
    if (!isLoggedIn) { navigate('/auth', { state:{ from:'/subscriptions' } }); return }
    if (plan.id === 'free_trial') {
      // تفعيل التجربة المجانية مباشرة (30 يوم)
      subscribe('free_trial', 'تجربة مجانية')
      navigate('/dashboard')
      return
    }
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleConfirm = (planId, planName) => {
    subscribe(planId, planName)
  }

  const handleClose = () => {
    setShowModal(false)
    setSelectedPlan(null)
    if (isSubscribed) navigate('/dashboard')
  }

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      {/* Header */}
      <header style={{
        background:'linear-gradient(180deg,rgba(201,151,58,0.18) 0%,var(--bg-dark) 100%)',
        padding:'1.5rem 1rem 1.2rem',
        borderBottom:'1px solid var(--border-color)',
        textAlign:'center',
      }}>
        <button onClick={() => navigate(-1)} style={{
          position:'absolute', right:'1rem',
          background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
          padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
        }}>✕</button>
        <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🚀</div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--text-primary)', marginBottom:'0.4rem' }}>
          اختر خطتك
        </h1>
        <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', maxWidth:'280px', margin:'0 auto', lineHeight:1.6 }}>
          سجّل مطعمك أو كافيهك وابدأ استقطاب الزبائن
        </p>
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* الاشتراك الفعّال */}
        {isSubscribed && (
          <div style={{
            background:'linear-gradient(135deg,rgba(26,107,69,0.2),rgba(26,107,69,0.05))',
            border:'1px solid rgba(26,107,69,0.4)', borderRadius:'18px',
            padding:'1.2rem', marginBottom:'1.2rem',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.15rem' }}>اشتراكك الحالي</p>
                <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--color-primary-light)' }}>
                  {PLANS.find(p=>p.id===subscriptionTier)?.icon} {PLANS.find(p=>p.id===subscriptionTier)?.name || subscription?.planName}
                </h3>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                  {subscription?.daysLeft} يوم متبقي
                </p>
              </div>
              <button onClick={() => navigate('/dashboard')} style={{
                background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
                border:'none', borderRadius:'12px', padding:'0.5rem 1rem',
                color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-main)',
              }}>
                لوحة التحكم ◀
              </button>
            </div>
          </div>
        )}

        {/* بطاقات الخطط */}
        {PLANS.map((plan) => {
          const isCurrent = isSubscribed && subscriptionTier === plan.id
          return (
            <div key={plan.id} style={{
              background: plan.gradient,
              border: `2px solid ${isCurrent ? plan.color : plan.border}`,
              borderRadius:'20px', padding:'1.3rem',
              marginBottom:'1rem', position:'relative', overflow:'hidden',
            }}>
              {/* شارة */}
              {plan.badge && !isCurrent && (
                <div style={{
                  position:'absolute', top:'12px', left:'12px',
                  background: plan.id==='premium' ? 'rgba(201,151,58,0.9)' : 'rgba(26,107,69,0.9)',
                  color: plan.id==='premium' ? '#000' : '#fff',
                  fontSize:'0.65rem', fontWeight:800, padding:'0.2rem 0.6rem',
                  borderRadius:'99px',
                }}>{plan.badge}</div>
              )}
              {isCurrent && (
                <div style={{
                  position:'absolute', top:'12px', left:'12px',
                  background:'rgba(93,222,138,0.9)', color:'#000',
                  fontSize:'0.65rem', fontWeight:800, padding:'0.2rem 0.6rem',
                  borderRadius:'99px',
                }}>✓ خطتك الحالية</div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <span style={{ fontSize:'1.4rem' }}>{plan.icon}</span>
                    <h3 style={{ fontSize:'1.15rem', fontWeight:900, color:plan.color }}>{plan.name}</h3>
                  </div>
                  <div style={{ marginTop:'0.3rem' }}>
                    <span style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--text-primary)' }}>
                      {plan.price === 0 ? 'مجاني' : `$${plan.price}`}
                    </span>
                    {plan.period && <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginRight:'0.3rem' }}>/ {plan.period}</span>}
                    {plan.iqd && (
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.15rem', direction:'rtl' }}>
                        ≈ <span style={{ color:'var(--color-accent-light)', fontWeight:700 }}>
                          {plan.iqd.toLocaleString('ar-IQ')}
                        </span> د.ع
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* الميزات */}
              <div style={{ marginBottom:'1.1rem' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.4rem' }}>
                    <span style={{ color: f.ok ? '#5dde8a' : 'var(--text-muted)', fontSize:'0.85rem', flexShrink:0 }}>
                      {f.ok ? '✓' : '✗'}
                    </span>
                    <span style={{ fontSize:'0.82rem', color: f.ok ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelect(plan)}
                disabled={isCurrent}
                style={{
                  width:'100%', padding:'0.8rem', borderRadius:'14px', border:'none',
                  background: isCurrent
                    ? 'rgba(93,222,138,0.15)'
                    : plan.id === 'free_trial'
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : plan.id === 'premium'
                        ? 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))'
                        : 'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
                  color: isCurrent ? '#5dde8a' : plan.id==='premium' ? '#000' : '#fff',
                  fontWeight:800, fontSize:'0.95rem', cursor: isCurrent ? 'default' : 'pointer',
                  fontFamily:'var(--font-main)',
                  boxShadow: !isCurrent ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {isCurrent ? '✓ خطتك الحالية'
                 : plan.id === 'free_trial' ? '🎁 ابدأ التجربة المجانية'
                 : `اشترك في ${plan.name}`}
              </button>
            </div>
          )
        })}

        {/* FAQ */}
        <div style={{ marginTop:'0.5rem' }}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.8rem' }}>❓ أسئلة شائعة</h3>
          {[
            { q:'كيف يتم تفعيل الاشتراك؟', a:'بعد الدفع وإدخال رقم العملية، نتحقق ونفعّل حسابك خلال ساعة.' },
            { q:'هل يمكنني الإلغاء؟', a:'نعم، مع ضمان استرداد المبلغ خلال 7 أيام من الاشتراك.' },
            { q:'ما الفرق بين Pro وPremium؟', a:'Premium يضيف الإحصائيات التفصيلية والظهور المميز في الأعلى ووفر 58%.' },
          ].map((faq, i) => (
            <details key={i} style={{ marginBottom:'0.6rem' }}>
              <summary style={{
                padding:'0.8rem 1rem', background:'var(--bg-card)',
                border:'1px solid var(--border-color)', borderRadius:'12px',
                cursor:'pointer', fontSize:'0.85rem', fontWeight:700,
                color:'var(--text-primary)', listStyle:'none',
              }}>
                {faq.q}
              </summary>
              <p style={{
                padding:'0.7rem 1rem', fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.7,
                background:'rgba(255,255,255,0.02)', borderRadius:'0 0 12px 12px',
                border:'1px solid var(--border-color)', borderTop:'none',
              }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {showModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={handleClose}
          onConfirm={handleConfirm}
          userInfo={user}
        />
      )}
    </main>
  )
}
