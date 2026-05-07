import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['مشاوي', 'رئيسية', 'مشروبات', 'مقبلات', 'حلويات', 'برغر', 'أسماك', 'دجاج', 'أخرى']
const MENU_KEY = 'dalilak_my_menu'

const loadMenu = () => {
  try { return JSON.parse(localStorage.getItem(MENU_KEY) || '[]') } catch { return [] }
}
const saveMenu = (m) => localStorage.setItem(MENU_KEY, JSON.stringify(m))

const inp = {
  width:'100%', padding:'0.75rem 0.9rem', borderRadius:'14px',
  border:'1px solid var(--border-color)', background:'var(--bg-input)',
  color:'var(--text-primary)', fontSize:'0.9rem', fontFamily:'var(--font-main)',
  outline:'none', boxSizing:'border-box',
}

export default function MenuManagerPage() {
  const navigate = useNavigate()
  const { isLoggedIn, canEditMenu } = useAuth()
  const [items,    setItems]    = useState(loadMenu)
  const [editing,  setEditing]  = useState(null) // null | index | 'new'
  const [form,     setForm]     = useState({ name:'', price:'', category:'مشاوي', description:'', image:'' })
  const [activeTab, setActiveTab] = useState('all')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setForm({ name:'', price:'', category:'مشاوي', description:'', image:'' })
    setEditing('new')
  }

  const openEdit = (idx) => {
    setForm({ ...items[idx] })
    setEditing(idx)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    const next = [...items]
    if (editing === 'new') next.push({ ...form, id: Date.now().toString() })
    else next[editing] = { ...form }
    setItems(next); saveMenu(next); setEditing(null)
  }

  const handleDelete = (idx) => {
    const next = items.filter((_,i) => i !== idx)
    setItems(next); saveMenu(next)
  }

  const categories = ['all', ...new Set(items.map(i => i.category))]
  const filtered = activeTab === 'all' ? items : items.filter(i => i.category === activeTab)

  if (!isLoggedIn || !canEditMenu) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ textAlign:'center', maxWidth:'340px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔒</div>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.6rem' }}>
            ميزة Pro
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
            إدارة قائمة الطعام متاحة في خطة Pro وما فوق
          </p>
          <button onClick={() => navigate('/subscriptions')} style={{
            width:'100%', padding:'0.85rem', borderRadius:'14px', border:'none',
            background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
            color:'#000', fontWeight:800, fontSize:'1rem', fontFamily:'var(--font-main)', cursor:'pointer',
          }}>
            💎 ترقية الاشتراك
          </button>
          <button onClick={() => navigate('/dashboard')} style={{
            marginTop:'0.8rem', background:'none', border:'none',
            color:'var(--text-muted)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)',
          }}>← لوحة التحكم</button>
        </div>
      </div>
    )
  }

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      {/* Header */}
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1.2rem 1rem',
        borderBottom:'1px solid var(--border-color)',
        position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.8rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)' }}>🍴 قائمة الطعام</h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{items.length} صنف مضاف</p>
          </div>
          <button onClick={openNew} style={{
            background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
            border:'none', borderRadius:'12px', padding:'0.5rem 0.9rem',
            color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)',
          }}>
            ＋ إضافة
          </button>
        </div>

        {/* تبويبات التصنيف */}
        <div style={{ display:'flex', gap:'0.4rem', overflowX:'auto', scrollbarWidth:'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} style={{
              flexShrink:0, padding:'0.35rem 0.85rem', borderRadius:'99px', border:'none',
              fontFamily:'var(--font-main)', fontWeight:700, fontSize:'0.76rem', cursor:'pointer',
              background: activeTab===cat ? 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))' : 'rgba(255,255,255,0.07)',
              color: activeTab===cat ? '#000' : 'var(--text-muted)',
              whiteSpace:'nowrap',
            }}>
              {cat === 'all' ? '🍽️ الكل' : cat}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem 1rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.8rem' }}>🍽️</div>
            <p style={{ fontWeight:600 }}>لا يوجد أصناف بعد</p>
            <button onClick={openNew} style={{
              marginTop:'1rem', background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              border:'none', borderRadius:'12px', padding:'0.6rem 1.5rem',
              color:'#fff', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'var(--font-main)',
            }}>
              ＋ أضف صنفك الأول
            </button>
          </div>
        )}

        {filtered.map((item, idx) => {
          const realIdx = items.findIndex(i => i === item)
          return (
            <div key={realIdx} style={{
              background:'var(--bg-card)', border:'1px solid var(--border-color)',
              borderRadius:'16px', padding:'1rem', marginBottom:'0.8rem',
              display:'flex', gap:'0.8rem', alignItems:'flex-start',
            }}>
              {/* صورة */}
              <div style={{
                width:'64px', height:'64px', borderRadius:'12px', flexShrink:0,
                background: item.image ? 'none' : 'rgba(255,255,255,0.05)',
                overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.8rem',
              }}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                  : '🍽️'
                }
              </div>

              {/* المعلومات */}
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)' }}>{item.name}</p>
                    <span style={{
                      fontSize:'0.65rem', padding:'0.1rem 0.45rem', borderRadius:'99px',
                      background:'rgba(26,107,69,0.2)', color:'var(--color-primary-light)',
                      border:'1px solid rgba(26,107,69,0.3)',
                    }}>{item.category}</span>
                  </div>
                  <span style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--color-accent-light)' }}>
                    {Number(item.price).toLocaleString()} د.ع
                  </span>
                </div>
                {item.description && (
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.3rem', lineHeight:1.5 }}>
                    {item.description}
                  </p>
                )}
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.6rem' }}>
                  <button onClick={() => openEdit(realIdx)} style={{
                    padding:'0.3rem 0.8rem', borderRadius:'8px', border:'1px solid var(--border-color)',
                    background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)',
                    fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                  }}>✏️ تعديل</button>
                  <button onClick={() => handleDelete(realIdx)} style={{
                    padding:'0.3rem 0.8rem', borderRadius:'8px',
                    border:'1px solid rgba(200,50,50,0.3)', background:'rgba(200,50,50,0.08)',
                    color:'#ff9090', fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                  }}>🗑️ حذف</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* نافذة الإضافة/التعديل */}
      {editing !== null && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          display:'flex', alignItems:'flex-end', zIndex:1000,
          backdropFilter:'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div style={{
            width:'100%', maxWidth:'480px', margin:'0 auto',
            background:'var(--bg-card)', borderRadius:'24px 24px 0 0',
            padding:'1.4rem', paddingBottom:'calc(1.4rem + env(safe-area-inset-bottom))',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
              <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>
                {editing === 'new' ? '➕ إضافة صنف' : '✏️ تعديل الصنف'}
              </h3>
              <button onClick={() => setEditing(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.2rem' }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.7rem', marginBottom:'0.7rem' }}>
              <div>
                <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>اسم الصنف *</label>
                <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: كباب غنمي" />
              </div>
              <div>
                <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>السعر (د.ع)</label>
                <input style={inp} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="15000" />
              </div>
            </div>

            <div style={{ marginBottom:'0.7rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>التصنيف</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'0.7rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>الوصف</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="وصف قصير للصنف..." rows={2}
                style={{ ...inp, resize:'none', lineHeight:1.5 }} />
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>رابط الصورة (اختياري)</label>
              <input style={{ ...inp, direction:'ltr' }} value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://..." />
            </div>

            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button onClick={() => setEditing(null)} style={{
                flex:1, padding:'0.8rem', borderRadius:'14px',
                background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                color:'var(--text-muted)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
              }}>إلغاء</button>
              <button onClick={handleSave} style={{
                flex:2, padding:'0.8rem', borderRadius:'14px', border:'none',
                background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
                color:'#fff', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', fontFamily:'var(--font-main)',
              }}>
                {editing === 'new' ? '✅ إضافة' : '✅ حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
