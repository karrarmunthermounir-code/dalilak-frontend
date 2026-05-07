import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const OFFERS_KEY = 'dalilak_my_offers'
const loadOffers = () => { try { return JSON.parse(localStorage.getItem(OFFERS_KEY) || '[]') } catch { return [] } }
const saveOffers = (o) => localStorage.setItem(OFFERS_KEY, JSON.stringify(o))

const inp = {
  width:'100%', padding:'0.75rem 0.9rem', borderRadius:'14px',
  border:'1px solid var(--border-color)', background:'var(--bg-input)',
  color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'var(--font-main)',
  outline:'none', boxSizing:'border-box',
}

const OFFER_TYPES = [
  { value:'discount', label:'🏷️ خصم بالنسبة', icon:'%' },
  { value:'bogo',     label:'🎁 اشتر 1 واحصل على 1', icon:'🎁' },
  { value:'fixed',    label:'💰 تخفيض ثابت بالمبلغ', icon:'💰' },
  { value:'free',     label:'⭐ هدية مجانية مع الطلب', icon:'⭐' },
]

export default function OffersPage() {
  const navigate = useNavigate()
  const { isLoggedIn, canAddOffers } = useAuth()
  const [offers,  setOffers]  = useState(loadOffers)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({
    title:'', type:'discount', discount:'', description:'', expiresAt:'', active:true,
  })

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const openNew = () => {
    setForm({ title:'', type:'discount', discount:'', description:'', expiresAt:'', active:true })
    setEditing('new')
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    const next = [...offers]
    if (editing === 'new') next.push({ ...form, id:Date.now().toString(), createdAt:new Date().toISOString() })
    else next[editing] = { ...next[editing], ...form }
    setOffers(next); saveOffers(next); setEditing(null)
  }

  const toggleActive = (idx) => {
    const next = [...offers]
    next[idx] = { ...next[idx], active: !next[idx].active }
    setOffers(next); saveOffers(next)
  }

  const deleteOffer = (idx) => {
    const next = offers.filter((_,i) => i !== idx)
    setOffers(next); saveOffers(next)
  }

  if (!isLoggedIn || !canAddOffers) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ textAlign:'center', maxWidth:'340px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🎁</div>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.6rem' }}>ميزة Pro</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
            إضافة العروض والخصومات متاحة في خطة Pro وما فوق
          </p>
          <button onClick={() => navigate('/subscriptions')} style={{
            width:'100%', padding:'0.85rem', borderRadius:'14px', border:'none',
            background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
            color:'#000', fontWeight:800, fontSize:'1rem', fontFamily:'var(--font-main)', cursor:'pointer',
          }}>💎 ترقية الاشتراك</button>
          <button onClick={() => navigate('/dashboard')} style={{
            marginTop:'0.8rem', background:'none', border:'none', color:'var(--text-muted)',
            fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)',
          }}>← لوحة التحكم</button>
        </div>
      </div>
    )
  }

  const activeCount = offers.filter(o => o.active).length

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1.2rem 1rem',
        borderBottom:'1px solid var(--border-color)',
        position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)' }}>🎁 العروض والخصومات</h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
              {activeCount} عرض فعّال من أصل {offers.length}
            </p>
          </div>
          <button onClick={openNew} style={{
            background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
            border:'none', borderRadius:'12px', padding:'0.5rem 0.9rem',
            color:'#000', fontWeight:800, fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)',
          }}>＋ عرض جديد</button>
        </div>
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* نصيحة */}
        <div style={{
          background:'rgba(201,151,58,0.08)', border:'1px solid rgba(201,151,58,0.2)',
          borderRadius:'14px', padding:'0.8rem 1rem', marginBottom:'1rem',
          display:'flex', gap:'0.6rem', alignItems:'flex-start',
        }}>
          <span style={{ fontSize:'1.1rem', flexShrink:0 }}>💡</span>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6 }}>
            العروض تظهر على بطاقة مكانك وتجذب زبائن أكثر. الأماكن التي لديها عروض تحصل على <strong style={{ color:'var(--color-accent-light)' }}>2.3×</strong> مشاهدات أكثر.
          </p>
        </div>

        {offers.length === 0 && (
          <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.8rem' }}>🎁</div>
            <p style={{ fontWeight:600 }}>لا يوجد عروض حتى الآن</p>
            <p style={{ fontSize:'0.82rem', marginTop:'0.3rem' }}>أضف عرضك الأول لجذب الزبائن</p>
            <button onClick={openNew} style={{
              marginTop:'1rem', padding:'0.65rem 1.5rem', borderRadius:'12px', border:'none',
              background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
              color:'#000', fontWeight:800, cursor:'pointer', fontFamily:'var(--font-main)', fontSize:'0.88rem',
            }}>＋ إضافة أول عرض</button>
          </div>
        )}

        {offers.map((offer, idx) => {
          const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date()
          return (
            <div key={idx} style={{
              background:'var(--bg-card)', border:`1px solid ${offer.active && !isExpired ? 'rgba(201,151,58,0.3)' : 'var(--border-color)'}`,
              borderRadius:'16px', padding:'1rem', marginBottom:'0.8rem',
              opacity: isExpired ? 0.6 : 1,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    <h3 style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--text-primary)' }}>{offer.title}</h3>
                    {offer.active && !isExpired
                      ? <span style={{ fontSize:'0.65rem', padding:'0.1rem 0.45rem', borderRadius:'99px', background:'rgba(93,222,138,0.15)', color:'#5dde8a', border:'1px solid rgba(93,222,138,0.3)', fontWeight:700 }}>فعّال ✓</span>
                      : isExpired
                        ? <span style={{ fontSize:'0.65rem', padding:'0.1rem 0.45rem', borderRadius:'99px', background:'rgba(200,50,50,0.1)', color:'#ff9090', border:'1px solid rgba(200,50,50,0.3)', fontWeight:700 }}>منتهي</span>
                        : <span style={{ fontSize:'0.65rem', padding:'0.1rem 0.45rem', borderRadius:'99px', background:'rgba(255,255,255,0.06)', color:'var(--text-muted)', border:'1px solid var(--border-color)', fontWeight:700 }}>معطّل</span>
                    }
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>
                    {OFFER_TYPES.find(t => t.value === offer.type)?.label}
                    {offer.discount && ` — ${offer.discount}${offer.type === 'discount' ? '%' : ' د.ع'}`}
                  </p>
                  {offer.description && <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:'0.3rem', lineHeight:1.5 }}>{offer.description}</p>}
                  {offer.expiresAt && (
                    <p style={{ fontSize:'0.7rem', color: isExpired ? '#ff9090' : 'var(--text-muted)', marginTop:'0.3rem' }}>
                      📅 ينتهي: {new Date(offer.expiresAt).toLocaleDateString('ar-IQ')}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.6rem' }}>
                <button onClick={() => { setForm({...offer}); setEditing(idx) }} style={{
                  flex:1, padding:'0.35rem', borderRadius:'10px', border:'1px solid var(--border-color)',
                  background:'rgba(255,255,255,0.04)', color:'var(--text-secondary)',
                  fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                }}>✏️ تعديل</button>
                {!isExpired && (
                  <button onClick={() => toggleActive(idx)} style={{
                    flex:1, padding:'0.35rem', borderRadius:'10px',
                    border:`1px solid ${offer.active ? 'rgba(200,50,50,0.3)' : 'rgba(93,222,138,0.3)'}`,
                    background: offer.active ? 'rgba(200,50,50,0.08)' : 'rgba(93,222,138,0.08)',
                    color: offer.active ? '#ff9090' : '#5dde8a',
                    fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                  }}>{offer.active ? '⏸ تعطيل' : '▶ تفعيل'}</button>
                )}
                <button onClick={() => deleteOffer(idx)} style={{
                  padding:'0.35rem 0.7rem', borderRadius:'10px',
                  border:'1px solid rgba(200,50,50,0.2)', background:'rgba(200,50,50,0.06)',
                  color:'#ff9090', fontSize:'0.75rem', cursor:'pointer',
                }}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* نافذة الإضافة/التعديل */}
      {editing !== null && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
          display:'flex', alignItems:'flex-end', zIndex:1000, backdropFilter:'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div style={{
            width:'100%', maxWidth:'480px', margin:'0 auto',
            background:'var(--bg-card)', borderRadius:'24px 24px 0 0',
            padding:'1.4rem', paddingBottom:'calc(1.4rem + env(safe-area-inset-bottom))',
            maxHeight:'90vh', overflowY:'auto',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
              <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>
                {editing === 'new' ? '🎁 إضافة عرض جديد' : '✏️ تعديل العرض'}
              </h3>
              <button onClick={() => setEditing(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.2rem' }}>✕</button>
            </div>

            <div style={{ marginBottom:'0.8rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>عنوان العرض *</label>
              <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: خصم 20% على جميع المشاوي" />
            </div>

            <div style={{ marginBottom:'0.8rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>نوع العرض</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
                {OFFER_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('type', t.value)} style={{
                    padding:'0.6rem', borderRadius:'12px', cursor:'pointer',
                    fontFamily:'var(--font-main)', fontSize:'0.75rem', fontWeight:700, textAlign:'right',
                    border: form.type === t.value ? '2px solid var(--color-accent)' : '1px solid var(--border-color)',
                    background: form.type === t.value ? 'rgba(201,151,58,0.12)' : 'var(--bg-input)',
                    color: form.type === t.value ? 'var(--color-accent-light)' : 'var(--text-muted)',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {(form.type === 'discount' || form.type === 'fixed') && (
              <div style={{ marginBottom:'0.8rem' }}>
                <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>
                  {form.type === 'discount' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (د.ع)'}
                </label>
                <input style={inp} type="number" value={form.discount} onChange={e => set('discount', e.target.value)}
                  placeholder={form.type === 'discount' ? '25' : '5000'} />
              </div>
            )}

            <div style={{ marginBottom:'0.8rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>وصف العرض</label>
              <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="تفاصيل إضافية عن العرض..."
                style={{ ...inp, resize:'none', lineHeight:1.5 }} />
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>تاريخ انتهاء العرض</label>
              <input style={{ ...inp, colorScheme:'dark' }} type="date" value={form.expiresAt}
                onChange={e => set('expiresAt', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>

            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button onClick={() => setEditing(null)} style={{
                flex:1, padding:'0.8rem', borderRadius:'14px',
                background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                color:'var(--text-muted)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
              }}>إلغاء</button>
              <button onClick={handleSave} style={{
                flex:2, padding:'0.8rem', borderRadius:'14px', border:'none',
                background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
                color:'#000', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', fontFamily:'var(--font-main)',
              }}>
                {editing === 'new' ? '✅ نشر العرض' : '✅ حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
