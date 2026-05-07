import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PaymentFailedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reason   = params.get('reason')

  const reasons = {
    no_token:      'لم يصل رمز التحقق من ZainCash.',
    invalid_token: 'رمز التحقق غير صالح أو منتهي الصلاحية.',
    error:         'حدث خطأ أثناء معالجة الدفع.',
  }

  return (
    <main style={{
      minHeight:'100vh', background:'var(--bg-dark)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem',
    }}>
      <div style={{ textAlign:'center', maxWidth:'380px' }}>

        <div style={{
          width:'90px', height:'90px', borderRadius:'50%', margin:'0 auto 1.5rem',
          background:'rgba(239,68,68,0.12)', border:'2px solid rgba(239,68,68,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'2.8rem',
        }}>
          ❌
        </div>

        <h1 style={{
          fontSize:'1.6rem', fontWeight:900,
          color:'var(--text-primary)', marginBottom:'0.5rem',
        }}>
          فشلت عملية الدفع
        </h1>

        <p style={{
          color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, marginBottom:'0.7rem',
        }}>
          {reason && reasons[reason]
            ? reasons[reason]
            : 'تم إلغاء عملية الدفع أو حدث خطأ غير متوقع.'}
        </p>

        <p style={{
          color:'var(--text-muted)', fontSize:'0.82rem', lineHeight:1.7, marginBottom:'2rem',
        }}>
          لم يتم خصم أي مبلغ من رصيدك. يمكنك المحاولة مجدداً.
        </p>

        <button
          onClick={() => navigate('/subscriptions')}
          style={{
            width:'100%', padding:'1rem', borderRadius:'16px', border:'none',
            background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
            color:'#fff', fontWeight:800, fontSize:'1rem', cursor:'pointer',
            fontFamily:'var(--font-main)',
            boxShadow:'0 6px 24px rgba(26,107,69,0.3)',
            marginBottom:'0.7rem',
          }}
        >
          🔄 حاول مرة أخرى
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
      </div>
    </main>
  )
}
