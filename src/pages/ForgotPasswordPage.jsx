import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://dalilak-backend.onrender.com'

// ─── إيقاظ السيرفر عند فتح الصفحة (Render free-tier) ───
const wakeUpServer = async () => {
  try {
    await fetch(`${API}/api/ping`, { signal: AbortSignal.timeout(8000) })
  } catch (_) { /* تجاهل الخطأ */ }
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isPhone = (v) => /^07[3-9]\d{8}$/.test(v.replace(/\s/g, ''))

const inp = {
  width: '100%', padding: '0.85rem 1rem 0.85rem 3rem',
  borderRadius: '14px', border: '1px solid var(--border-color)',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  fontSize: '0.95rem', fontFamily: 'var(--font-main)',
  outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  // الخطوات: 1=أدخل المعرف  2=أدخل الكود  3=كلمة مرور جديدة  4=نجاح
  const [step, setStep]           = useState(1)
  const [identifier, setId]       = useState('')
  const [method, setMethod]       = useState('')        // 'email' | 'sms'
  const [otp, setOtp]             = useState(['','','','','',''])
  const [devOtp, setDevOtp]       = useState('')        // كود التطوير
  const [newPass, setNewPass]     = useState('')
  const [confirmPass, setConfirm] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [timer, setTimer]         = useState(0)
  const otpRefs                   = useRef([])

  // إيقاظ السيرفر فور فتح صفحة نسيان كلمة المرور
  useEffect(() => { wakeUpServer() }, [])

  // عداد تنازلي لإعادة الإرسال
  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  // تركيز تلقائي على أول خانة OTP
  useEffect(() => {
    if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 300)
  }, [step])

  const identType = () => {
    if (isEmail(identifier)) return 'email'
    if (isPhone(identifier)) return 'phone'
    return identifier ? 'unknown' : null
  }

  // ── الخطوة 1: طلب OTP ──
  const handleRequestOTP = async () => {
    const t = identType()
    if (!t || t === 'unknown') { setError('أدخل بريد إلكتروني أو رقم هاتف 07xxxxxxxxx'); return }
    setLoading(true); setError('')
    try {
      // timeout 20 ثانية — السيرفر قد يكون نائماً ويحتاج وقتاً للاستيقاظ
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const r = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const d = await r.json()
      if (!d.success) { setError(d.message); return }
      setMethod(d.method)
      if (d.devOtp) setDevOtp(d.devOtp) // وضع التطوير
      setStep(2)
      setTimer(60)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('السيرفر يستيقظ من النوم، انتظر 30 ثانية ثم حاول مرة أخرى ⏳')
      } else {
        setError('تعذّر الاتصال بالسيرفر، تحقق من الإنترنت')
      }
    }
    finally { setLoading(false) }
  }

  // ── تحديث خانات OTP ──
  const handleOtpChange = (i, val) => {
    val = val.replace(/\D/g, '').slice(0, 1)
    const next = [...otp]; next[i] = val; setOtp(next); setError('')
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }
  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  // ── الخطوة 2: تحقق من الكود ──
  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('أدخل الكود المكوّن من 6 أرقام'); return }
    setLoading(true); setError('')
    try {
      // نتحقق مؤقتاً فقط (الخطوة الفعلية تتم عند تغيير كلمة المرور)
      setStep(3)
    } catch { setError('خطأ') }
    finally { setLoading(false) }
  }

  // ── الخطوة 3: تغيير كلمة المرور ──
  const handleReset = async () => {
    if (!newPass || newPass.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); return }
    if (newPass !== confirmPass)         { setError('كلمتا المرور غير متطابقتين'); return }
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp: otp.join(''), newPassword: newPass }),
      })
      const d = await r.json()
      if (!d.success) { setError(d.message); return }
      setStep(4)
    } catch { setError('تعذّر الاتصال بالسيرفر') }
    finally { setLoading(false) }
  }

  const STEPS = [
    { n: 1, label: 'الحساب' },
    { n: 2, label: 'الكود' },
    { n: 3, label: 'كلمة المرور' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,107,69,0.22) 0%, transparent 65%), var(--bg-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', paddingBottom: '6rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🔑</div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900,
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>نسيت كلمة المرور؟</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
            سنرسل لك كود التحقق على هاتفك أو بريدك
          </p>
        </div>

        {/* شريط الخطوات */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.8rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800,
                    background: step >= s.n
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                      : 'rgba(255,255,255,0.07)',
                    color: step >= s.n ? '#fff' : 'var(--text-muted)',
                    border: step === s.n ? '2px solid var(--color-primary-light)' : '2px solid transparent',
                    transition: 'all 0.3s',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize: '0.62rem', color: step >= s.n ? 'var(--color-primary-light)' : 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    height: '2px', flex: 1, marginBottom: '1.2rem',
                    background: step > s.n ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* البطاقة */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '20px', padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>

          {/* ── الخطوة 1: إدخال المعرّف ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                أدخل حسابك
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.4rem', lineHeight: 1.6 }}>
                سنرسل كود التحقق على <strong style={{ color: 'var(--text-secondary)' }}>الإيميل أو الموبايل</strong> المسجّل
              </p>

              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '1.1rem', zIndex: 1,
                }}>
                  {identType() === 'email' ? '📧' : identType() === 'phone' ? '📱' : '🔍'}
                </span>
                <input
                  style={{
                    ...inp,
                    padding: '0.85rem 2.8rem 0.85rem 1rem',
                    borderColor: identType() === 'unknown' ? 'rgba(200,80,80,0.5)' : '',
                  }}
                  placeholder="example@email.com / 07xxxxxxxxx"
                  value={identifier}
                  onChange={e => { setId(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleRequestOTP()}
                />
              </div>

              {identType() && identType() !== 'unknown' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', marginBottom: '1rem' }}>
                  ✓ {identType() === 'email' ? 'بريد إلكتروني صحيح' : 'رقم موبايل عراقي صحيح'}
                </p>
              )}
              {identType() === 'unknown' && identifier && (
                <p style={{ fontSize: '0.75rem', color: '#ff9090', marginBottom: '1rem' }}>
                  ✕ أدخل بريد إلكتروني أو رقم 07xxxxxxxxx
                </p>
              )}

              {error && <div style={errStyle}>{error}</div>}

              <button onClick={handleRequestOTP} disabled={loading} style={btnStyle(loading)}>
                {loading ? '⏳ جاري الإرسال...' : '📨 إرسال الكود'}
              </button>
            </div>
          )}

          {/* ── الخطوة 2: إدخال الكود ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                أدخل كود التحقق
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                أُرسل كود مكوّن من <strong style={{ color: 'var(--text-secondary)' }}>6 أرقام</strong> إلى{' '}
                <strong style={{ color: 'var(--color-accent-light)' }}>
                  {method === 'email' ? identifier : identifier.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')}
                </strong>
              </p>

              {/* وضع التطوير — عرض الكود */}
              {devOtp && (
                <div style={{
                  background: 'rgba(201,151,58,0.12)', border: '1px solid rgba(201,151,58,0.3)',
                  borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-light)' }}>
                    🧪 وضع التطوير — الكود: <strong style={{ fontSize: '1rem', letterSpacing: '4px' }}>{devOtp}</strong>
                  </span>
                </div>
              )}

              {/* خانات OTP */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1.2rem 0', direction: 'ltr' }}
                onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    style={{
                      width: '44px', height: '52px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
                      borderRadius: '12px', border: `2px solid ${digit ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      background: digit ? 'rgba(26,107,69,0.15)' : 'var(--bg-input)',
                      color: 'var(--text-primary)', outline: 'none', transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>

              {error && <div style={errStyle}>{error}</div>}

              <button onClick={handleVerifyOtp} disabled={loading || otp.join('').length < 6}
                style={btnStyle(loading || otp.join('').length < 6)}>
                {loading ? '⏳ جاري التحقق...' : '✓ تحقق من الكود'}
              </button>

              {/* إعادة الإرسال */}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                {timer > 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    إعادة الإرسال بعد <strong style={{ color: 'var(--color-primary-light)' }}>{timer}</strong> ثانية
                  </p>
                ) : (
                  <button onClick={() => { setStep(1); setOtp(['','','','','','']); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)', cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem', fontWeight: 700 }}>
                    🔄 إرسال كود جديد
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── الخطوة 3: كلمة مرور جديدة ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                كلمة مرور جديدة
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.4rem' }}>
                اختر كلمة مرور قوية لحسابك
              </p>

              {/* كلمة المرور */}
              <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ ...inp, padding: '0.85rem 2.8rem 0.85rem 2.8rem' }}
                  placeholder="كلمة المرور الجديدة (6 أحرف+)"
                  value={newPass}
                  onChange={e => { setNewPass(e.target.value); setError('') }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)',
                }}>{showPass ? '🙈' : '👁️'}</button>
              </div>

              {/* تأكيد كلمة المرور */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔑</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{
                    ...inp, padding: '0.85rem 2.8rem 0.85rem 1rem',
                    borderColor: confirmPass && confirmPass !== newPass ? 'rgba(200,80,80,0.5)' : confirmPass && confirmPass === newPass ? 'rgba(93,222,138,0.5)' : '',
                  }}
                  placeholder="تأكيد كلمة المرور"
                  value={confirmPass}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                />
              </div>

              {/* إشارة التطابق */}
              {confirmPass && confirmPass === newPass && (
                <p style={{ fontSize: '0.75rem', color: '#5dde8a', marginBottom: '0.5rem' }}>✓ كلمتا المرور متطابقتان</p>
              )}
              {confirmPass && confirmPass !== newPass && (
                <p style={{ fontSize: '0.75rem', color: '#ff9090', marginBottom: '0.5rem' }}>✕ كلمتا المرور غير متطابقتين</p>
              )}

              {/* قوة كلمة المرور */}
              {newPass && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                    {[1,2,3,4].map(l => {
                      const str = newPass.length >= 12 ? 4 : newPass.length >= 8 ? 3 : newPass.length >= 6 ? 2 : 1
                      return <div key={l} style={{ flex: 1, height: '3px', borderRadius: '99px', transition: 'background 0.3s',
                        background: l <= str ? (str >= 3 ? '#5dde8a' : str === 2 ? '#c9973a' : '#ff9090') : 'rgba(255,255,255,0.1)' }} />
                    })}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: newPass.length >= 12 ? '#5dde8a' : newPass.length >= 8 ? '#c9973a' : '#ff9090' }}>
                    {newPass.length >= 12 ? '🟢 قوية جداً' : newPass.length >= 8 ? '🟡 جيدة' : '🔴 ضعيفة'}
                  </span>
                </div>
              )}

              {error && <div style={errStyle}>{error}</div>}

              <button onClick={handleReset} disabled={loading} style={btnStyle(loading)}>
                {loading ? '⏳ جاري الحفظ...' : '✅ تغيير كلمة المرور'}
              </button>
            </div>
          )}

          {/* ── الخطوة 4: نجاح ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'popIn 0.4s ease' }}>🎉</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                تم تغيير كلمة المرور!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
              </p>
              <button onClick={() => navigate('/auth')} style={{
                width: '100%', padding: '0.9rem', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'var(--font-main)',
              }}>
                🔑 تسجيل الدخول الآن
              </button>
            </div>
          )}

        </div>

        {/* رابط العودة */}
        {step < 4 && (
          <p style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            <button onClick={() => navigate('/auth')} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.82rem',
            }}>
              ← العودة لتسجيل الدخول
            </button>
          </p>
        )}

      </div>
      <style>{`@keyframes popIn { from { transform: scale(0); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  )
}

// ── أنماط مشتركة ──
const errStyle = {
  background: 'rgba(200,60,60,0.15)', border: '1px solid rgba(200,60,60,0.35)',
  borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem',
  color: '#ffaaaa', fontSize: '0.85rem', fontWeight: 600,
}

const btnStyle = (disabled) => ({
  width: '100%', padding: '0.88rem', borderRadius: '14px', border: 'none',
  background: disabled
    ? 'rgba(255,255,255,0.07)'
    : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
  color: disabled ? 'var(--text-muted)' : '#fff',
  fontWeight: 800, fontSize: '0.95rem', cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'var(--font-main)', transition: 'all 0.2s', marginTop: '0.2rem',
})
