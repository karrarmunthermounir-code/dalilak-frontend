import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, registerUser, loginUser } from '../context/AuthContext'

// ─── تحقق من البريد الإلكتروني ───
const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
// ─── تحقق من رقم الموبايل العراقي ───
const isPhone = (val) => /^07[3-9]\d{8}$/.test(val.replace(/\s/g, ''))

export default function AuthPage() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { login }   = useAuth()
  const { t }       = useTranslation()
  const from        = location.state?.from || '/'

  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    name: '', identifier: '', password: '', confirmPassword: ''
  })
  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  // ─── تحقق من نوع المُعرّف ───
  const identifierType = () => {
    if (!form.identifier) return null
    if (isEmail(form.identifier)) return 'email'
    if (isPhone(form.identifier)) return 'phone'
    return 'unknown'
  }

  const validate = () => {
    if (mode === 'register' && !form.name.trim())
      return t('auth.errors.name_required')
    if (!form.identifier.trim())
      return t('auth.errors.identifier_required')
    const itype = identifierType()
    if (itype === 'unknown')
      return t('auth.errors.invalid_identifier')
    if (!form.password)
      return t('auth.errors.password_required')
    if (form.password.length < 6)
      return t('auth.errors.password_short')
    if (mode === 'register' && form.password !== form.confirmPassword)
      return t('auth.errors.passwords_mismatch')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      let userData
      if (mode === 'login') {
        userData = await loginUser({ identifier: form.identifier.trim(), password: form.password })
      } else {
        userData = await registerUser({
          name: form.name.trim(),
          identifier: form.identifier.trim(),
          password: form.password
        })
      }

      login(userData)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
    setForm({ name: '', identifier: '', password: '', confirmPassword: '' })
  }

  const itype = identifierType()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,107,69,0.25) 0%, transparent 65%), var(--bg-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', paddingTop: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌴</div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 900,
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{t('app.name')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {t('app.tagline')}
          </p>
        </div>

        {/* البطاقة */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          {/* تبويب تسجيل دخول / حساب جديد */}
          <div style={{
            display: 'flex', gap: '0', marginBottom: '2rem',
            background: 'var(--bg-dark)', borderRadius: 'var(--radius-full)',
            padding: '4px',
          }}>
            {[
              { key: 'login',    label: `🔑 ${t('auth.login_title')}` },
              { key: 'register', label: `✨ ${t('auth.register_title')}` },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setMode(tab.key); setError(''); setForm({ name:'', identifier:'', password:'', confirmPassword:'' }) }}
                style={{
                  flex: 1, padding: '0.6rem 1rem', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-main)', fontWeight: 700,
                  fontSize: '0.88rem', transition: 'all 0.25s',
                  background: mode === tab.key
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                    : 'transparent',
                  color: mode === tab.key ? '#fff' : 'var(--text-muted)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* الاسم (عند التسجيل فقط) */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">{t('auth.full_name')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>👤</span>
                  <input className="form-input" style={{ paddingRight:'2.8rem' }}
                    placeholder="مثال: محمد أحمد" value={form.name}
                    onChange={e => set('name', e.target.value)} />
                </div>
              </div>
            )}

            {/* البريد الإلكتروني أو رقم الموبايل */}
            <div className="form-group">
              <label className="form-label">{t('auth.email_or_phone')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>
                  {itype === 'email' ? '📧' : itype === 'phone' ? '📱' : '🔍'}
                </span>
                <input className="form-input"
                  style={{
                    paddingRight: '2.8rem',
                    direction: itype === 'email' || itype === 'phone' ? 'ltr' : 'rtl',
                    textAlign: 'right',
                    borderColor: itype === 'unknown' ? 'rgba(200,80,80,0.5)' : '',
                  }}
                  placeholder="example@email.com / 07xxxxxxxxx"
                  value={form.identifier}
                  onChange={e => set('identifier', e.target.value)}
                  inputMode={isPhone(form.identifier) ? 'numeric' : 'email'}
                />
              </div>
              {/* مؤشر النوع */}
              {itype && itype !== 'unknown' && (
                <p style={{ fontSize:'0.75rem', color:'var(--color-primary-light)', marginTop:'0.35rem' }}>
                  ✓ {itype === 'email' ? 'بريد إلكتروني صحيح' : 'رقم موبايل عراقي صحيح'}
                </p>
              )}
              {itype === 'unknown' && form.identifier && (
                <p style={{ fontSize:'0.75rem', color:'#ff9090', marginTop:'0.35rem' }}>
                  ✕ أدخل بريد إلكتروني أو رقم 07xxxxxxxxx
                </p>
              )}
            </div>

            {/* كلمة المرور */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>{t('auth.password')}</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => navigate('/forgot-password')} style={{
                    background: 'none', border: 'none', color: 'var(--color-accent-light)',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-main)', padding: 0,
                  }}>
                    🔑 نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>🔒</span>
                <input className="form-input"
                  type={showPass ? 'text' : 'password'}
                  style={{ paddingRight:'2.8rem', paddingLeft:'2.8rem', direction:'ltr' }}
                  placeholder="6 أحرف على الأقل"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
                <button type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:'1rem',
                    color:'var(--text-muted)',
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">{t('auth.confirm_password')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'1.1rem' }}>🔑</span>
                  <input className="form-input"
                    type={showPass ? 'text' : 'password'}
                    style={{
                      paddingRight:'2.8rem', direction:'ltr',
                      borderColor: form.confirmPassword && form.confirmPassword !== form.password ? 'rgba(200,80,80,0.5)' : '',
                    }}
                    placeholder="أعد كتابة كلمة المرور"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                  />
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p style={{ fontSize:'0.75rem', color:'#ff9090', marginTop:'0.35rem' }}>✕ كلمتا المرور غير متطابقتين</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p style={{ fontSize:'0.75rem', color:'var(--color-primary-light)', marginTop:'0.35rem' }}>✓ كلمتا المرور متطابقتان</p>
                )}
              </div>
            )}

            {/* رسالة الخطأ */}
            {error && (
              <div style={{
                background:'rgba(200,60,60,0.15)', border:'1px solid rgba(200,60,60,0.35)',
                borderRadius:'var(--radius-md)', padding:'0.75rem 1rem',
                marginBottom:'1.2rem', color:'#ffaaaa', fontSize:'0.88rem', fontWeight:600,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* زر الإرسال */}
            <button className="submit-btn" type="submit" disabled={loading}
              style={{ fontSize:'1rem', padding:'0.85rem', marginTop:'0.5rem' }}>
              {loading
                ? `⏳ ${t('loading.default')}`
                : mode === 'login' ? `🔑 ${t('auth.login_title')}` : `🚀 ${t('auth.register_title')}`
              }
            </button>
          </form>

          {/* رابط التبديل */}
          <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.88rem', color:'var(--text-muted)' }}>
            {mode === 'login' ? t('auth.no_account') + ' ' : t('auth.have_account') + ' '}
            <button onClick={switchMode} style={{
              background:'none', border:'none', color:'var(--color-accent-light)',
              fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)', fontSize:'0.88rem',
            }}>
              {mode === 'login' ? t('auth.register_link') : t('auth.login_link')}
            </button>
          </p>
        </div>

        {/* تخطي */}
        <p style={{ textAlign:'center', marginTop:'1.2rem' }}>
          <button onClick={() => navigate('/')} style={{
            background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer',
            fontFamily:'var(--font-main)', fontSize:'0.82rem',
          }}>
            {t('buttons.back_home')} ←
          </button>
        </p>

      </div>
    </div>
  )
}
