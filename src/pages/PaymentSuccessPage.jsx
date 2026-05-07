import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PaymentSuccessPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { subscribe, isLoggedIn } = useAuth()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [planName, setPlanName] = useState('')

  useEffect(() => {
    const activate = async () => {
      try {
        const orderId = params.get('orderId')
        const isDemo  = params.get('demo') === 'true'
        const token   = params.get('token')

        // استرجاع بيانات الطلب المحفوظة في sessionStorage
        const pendingRaw = sessionStorage.getItem('pending_payment')
        const pending    = pendingRaw ? JSON.parse(pendingRaw) : null

        // الحصول على planId و planName
        const planId   = params.get('plan') || pending?.planId   || 'monthly_pro'
        const planName = pending?.planName || (planId === 'premium' ? 'Premium' : 'Pro شهري')

        // تفعيل الاشتراك (Demo أو بعد callback من ZainCash)
        if (isLoggedIn) {
          await subscribe(planId, planName)
          setPlanName(planName)
        }

        sessionStorage.removeItem('pending_payment')
        setStatus('success')
      } catch (err) {
        console.error('Payment activation error:', err)
        setStatus('error')
      }
    }

    activate()
  }, []) // eslint-disable-line

  if (status === 'loading') {
    return (
      <main style={{
        minHeight:'100vh', background:'var(--bg-dark)',
        display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem',
      }}>
        <div style={{
          width:'56px', height:'56px', borderRadius:'50%',
          border:'4px solid rgba(26,107,69,0.2)', borderTopColor:'var(--color-primary)',
          animation:'spin 0.8s linear infinite',
        }} />
        <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>جاري تفعيل اشتراكك...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main style={{
        minHeight:'100vh', background:'var(--bg-dark)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem',
      }}>
        <div style={{ textAlign:'center', maxWidth:'360px' }}>
          <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>⚠️</div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--text-primary)', marginBottom:'0.5rem' }}>
            تعذّر تفعيل الاشتراك
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, marginBottom:'1.5rem' }}>
            لم نتمكن من التحقق من الدفع تلقائياً. إذا تم خصم المبلغ، تواصل مع الدعم وأرسل رقم الطلب.
          </p>
          <button
            onClick={() => navigate('/subscriptions')}
            style={{
              background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              border:'none', borderRadius:'14px', padding:'0.9rem 2rem',
              color:'#fff', fontWeight:800, fontSize:'1rem', cursor:'pointer', fontFamily:'var(--font-main)',
            }}
          >
            العودة للاشتراكات
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight:'100vh', background:'var(--bg-dark)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem',
    }}>
      <div style={{ textAlign:'center', maxWidth:'380px' }}>

        {/* أيقونة النجاح */}
        <div style={{
          width:'100px', height:'100px', borderRadius:'50%', margin:'0 auto 1.5rem',
          background:'linear-gradient(135deg,rgba(93,222,138,0.2),rgba(26,107,69,0.1))',
          border:'2px solid rgba(93,222,138,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'3rem',
          animation:'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}>
          🎉
        </div>

        <h1 style={{
          fontSize:'1.7rem', fontWeight:900,
          color:'var(--color-primary-light)', marginBottom:'0.5rem',
        }}>
          تم تفعيل الاشتراك!
        </h1>

        {planName && (
          <div style={{
            display:'inline-block',
            background:'rgba(26,107,69,0.15)', border:'1px solid rgba(26,107,69,0.3)',
            borderRadius:'99px', padding:'0.3rem 1rem', marginBottom:'1rem',
            fontSize:'0.85rem', fontWeight:700, color:'var(--color-primary-light)',
          }}>
            ✓ {planName}
          </div>
        )}

        <p style={{
          color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, marginBottom:'2rem',
        }}>
          مبروك! اشتراكك فعّال الآن. يمكنك البدء في إضافة أماكنك والاستفادة من جميع مزايا الخطة.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width:'100%', padding:'1rem', borderRadius:'16px', border:'none',
            background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
            color:'#fff', fontWeight:800, fontSize:'1rem', cursor:'pointer',
            fontFamily:'var(--font-main)',
            boxShadow:'0 6px 24px rgba(26,107,69,0.35)',
            marginBottom:'0.7rem',
          }}
        >
          🚀 انتقل للوحة التحكم
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            width:'100%', padding:'0.8rem', borderRadius:'14px',
            background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
            color:'var(--text-muted)', fontWeight:700, fontSize:'0.9rem',
            cursor:'pointer', fontFamily:'var(--font-main)',
          }}
        >
          العودة للصفحة الرئيسية
        </button>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </main>
  )
}
