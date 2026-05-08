import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IRAQ_GOVERNORATES, removeUserPlace } from '../services/api'

const PLACE_KEY = 'dalilak_my_place'
const TYPE_KEY  = 'dalilak_my_place_type'

const loadPlace = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(PLACE_KEY) || 'null')
    if (!raw) return null
    // دمج images و imageFiles في مصفوفة واحدة imageFiles
    const allImages = [
      ...(raw.imageFiles || []),
      ...(raw.images || []).filter(img => img && img.startsWith('data:')), // فقط Base64
    ]
    return { ...raw, imageFiles: allImages }
  } catch { return null }
}
const savePlace = (p) => localStorage.setItem(PLACE_KEY, JSON.stringify(p))

const compressImage = (file, maxWidth = 800, quality = 0.7) =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

const inp = {
  width: '100%', padding: '0.78rem 1rem', borderRadius: '14px',
  border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'var(--font-main)',
  outline: 'none', boxSizing: 'border-box',
}
const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  borderRadius: '18px', padding: '1.2rem', marginBottom: '1rem',
}

export default function MyPlacePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [place, setPlace]     = useState(loadPlace)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (place && !form) {
      // تأكد من وجود imageFiles دائماً
      setForm({ ...place, imageFiles: place.imageFiles || [] })
    }
  }, [place])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form?.name?.trim()) return alert('اسم المكان مطلوب')
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    savePlace(form)
    localStorage.setItem(TYPE_KEY, form.type || 'مطعم')

    // حدّث المكان في قائمة الأماكن المعروضة بالرئيسية
    try {
      const USER_PLACES_KEY = 'dalilak_user_places'
      const saved    = JSON.parse(localStorage.getItem(USER_PLACES_KEY) || '[]')
      const myId     = form._id || form.id || ''
      const exists   = saved.some(p => (p._id || p.id) === myId)
      const updated  = exists
        ? saved.map(p => (p._id || p.id) === myId ? { ...p, ...form } : p)
        : [form, ...saved]
      localStorage.setItem(USER_PLACES_KEY, JSON.stringify(updated))
    } catch (_) {}

    setPlace(form)
    setEditing(false)
    setSaving(false)
  }

  const handleDelete = () => {
    const myPlace = loadPlace()
    const myId    = myPlace?._id || myPlace?.id || ''

    // امسح من الذاكرة + localStorage (الواجهة الرئيسية)
    if (myId) removeUserPlace(myId)

    // امسح من قائمة أماكن المستخدم (احتياط)
    try {
      const USER_PLACES_KEY = 'dalilak_user_places'
      const saved    = JSON.parse(localStorage.getItem(USER_PLACES_KEY) || '[]')
      const filtered = saved.filter(p => (p._id || p.id) !== myId)
      localStorage.setItem(USER_PLACES_KEY, JSON.stringify(filtered))
    } catch (_) {}

    localStorage.removeItem(PLACE_KEY)
    localStorage.removeItem(TYPE_KEY)
    localStorage.removeItem('dalilak_my_menu')
    localStorage.removeItem('dalilak_table_bookings')
    setPlace(null)
    setForm(null)
    setShowDelete(false)
  }

  const addImage = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const f of files) {
      const c = await compressImage(f)
      setForm(prev => ({ ...prev, imageFiles: [...(prev.imageFiles || []), c] }))
    }
    e.target.value = ''
  }

  const removeImage = (i) =>
    setForm(f => ({ ...f, imageFiles: (f.imageFiles || []).filter((_, x) => x !== i) }))

  if (!isLoggedIn) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem' }}>🔒</div>
        <button onClick={() => navigate('/auth')} style={{ marginTop:'1rem', padding:'0.7rem 1.5rem', borderRadius:'12px', border:'none', background:'var(--color-primary)', color:'#fff', cursor:'pointer', fontFamily:'var(--font-main)' }}>
          تسجيل الدخول
        </button>
      </div>
    </div>
  )

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1rem', position:'sticky', top:0, zIndex:100,
        borderBottom:'1px solid var(--border-color)', backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>🏪 معلومات مكاني</h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>إدارة وتعديل بيانات مكانك</p>
          </div>
          {place && !editing && (
            <button onClick={() => setEditing(true)} style={{
              background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              border:'none', borderRadius:'12px', padding:'0.5rem 1rem',
              color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)',
            }}>✏️ تعديل</button>
          )}
        </div>
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* لا يوجد مكان مضاف بعد */}
        {!place && (
          <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🏪</div>
            <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>لم تضف مكانك بعد</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
              أضف مكانك الآن وابدأ في إدارته من هنا
            </p>
            <button onClick={() => navigate('/admin')} style={{
              padding:'0.85rem 2rem', borderRadius:'14px', border:'none',
              background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
              color:'#fff', fontWeight:800, fontSize:'0.95rem', cursor:'pointer', fontFamily:'var(--font-main)',
            }}>➕ أضف مكانك الآن</button>

            {/* زر تنظيف الأماكن العالقة */}
            <button onClick={() => {
              localStorage.removeItem('dalilak_user_places')
              alert('✅ تم مسح الأماكن العالقة. أعد تحميل الصفحة الرئيسية.')
            }} style={{
              display:'block', margin:'1rem auto 0', background:'none',
              border:'none', color:'var(--text-muted)', fontSize:'0.72rem',
              cursor:'pointer', fontFamily:'var(--font-main)', textDecoration:'underline',
            }}>🗑️ مسح أماكن عالقة من الرئيسية</button>
          </div>
        )}


        {/* عرض المكان بدون تعديل */}
        {place && !editing && (
          <>
            {/* صور المكان */}
            {(place.imageFiles?.length > 0) && (
              <div style={{ ...card }}>
                <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.8rem' }}>📸 صور المكان</h3>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {place.imageFiles.map((img, i) => (
                    <div key={i} style={{ width:'90px', height:'90px', borderRadius:'12px', overflow:'hidden' }}>
                      <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المعلومات الأساسية */}
            <div style={card}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.8rem' }}>📋 المعلومات الأساسية</h3>
              {[
                ['الاسم', place.name],
                ['النوع', place.type],
                ['المحافظة', place.governorate],
                ['العنوان', place.address],
                ['الهاتف', place.phone],
                ['ساعات العمل', place.openHours],
              ].map(([label, val]) => val ? (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid var(--border-color)' }}>
                  <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', textAlign:'left', maxWidth:'60%' }}>{val}</span>
                </div>
              ) : null)}
            </div>

            {/* الوصف */}
            {place.description && (
              <div style={card}>
                <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.5rem' }}>📝 الوصف</h3>
                <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.7 }}>{place.description}</p>
              </div>
            )}

            {/* رابط الموقع */}
            {place.mapLink && (
              <div style={card}>
                <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.5rem' }}>📍 الموقع الجغرافي</h3>
                <a href={place.mapLink} target="_blank" rel="noopener noreferrer" style={{
                  display:'block', padding:'0.6rem 1rem', borderRadius:'10px',
                  background:'rgba(26,107,69,0.12)', border:'1px solid rgba(26,107,69,0.3)',
                  color:'var(--color-primary-light)', fontSize:'0.82rem', fontWeight:600,
                  textDecoration:'none', textAlign:'center',
                }}>🗺️ فتح الموقع على الخريطة</a>
              </div>
            )}

            {/* أزرار الإجراءات */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem', marginTop:'0.5rem' }}>
              <button onClick={() => navigate('/dashboard/menu')} style={{
                padding:'0.85rem', borderRadius:'14px', border:'1px solid var(--border-color)',
                background:'rgba(255,255,255,0.04)', color:'var(--text-primary)',
                fontWeight:700, fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-main)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
              }}>🍴 إدارة قائمة الطعام</button>

              <button onClick={() => setShowDelete(true)} style={{
                padding:'0.85rem', borderRadius:'14px',
                border:'1px solid rgba(200,50,50,0.4)', background:'rgba(200,50,50,0.08)',
                color:'#ff9090', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-main)',
              }}>🗑️ حذف مكاني</button>
            </div>
          </>
        )}

        {/* نموذج التعديل */}
        {place && editing && (
          <>
            {/* الصور */}
            <div style={card}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.8rem' }}>📸 صور المكان</h3>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.6rem' }}>
                {(form?.imageFiles || []).map((img, i) => (
                  <div key={i} style={{ position:'relative', width:'80px', height:'80px', borderRadius:'12px', overflow:'hidden' }}>
                    <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <button onClick={() => removeImage(i)} style={{
                      position:'absolute', top:'2px', right:'2px', background:'rgba(0,0,0,0.7)',
                      border:'none', borderRadius:'50%', width:'22px', height:'22px',
                      color:'#ff9090', fontSize:'0.7rem', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>✕</button>
                  </div>
                ))}
                <label style={{
                  width:'80px', height:'80px', borderRadius:'12px', cursor:'pointer',
                  border:'2px dashed var(--border-color)', background:'rgba(255,255,255,0.02)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  fontSize:'1.5rem', color:'var(--text-muted)',
                }}>
                  ＋
                  <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={addImage} />
                </label>
              </div>
            </div>

            {/* المعلومات */}
            <div style={card}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.8rem' }}>📋 المعلومات الأساسية</h3>
              {[
                { label:'اسم المكان *', key:'name', placeholder:'مثال: مطعم السندباد' },
                { label:'رقم الهاتف', key:'phone', placeholder:'07xxxxxxxxx' },
                { label:'ساعات العمل', key:'openHours', placeholder:'9 ص - 11 م' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:'0.8rem' }}>
                  <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>{f.label}</label>
                  <input style={inp} value={form?.[f.key] || ''} placeholder={f.placeholder} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}

              <div style={{ marginBottom:'0.8rem' }}>
                <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>المحافظة</label>
                <select value={form?.governorate || 'بغداد'} onChange={e => set('governorate', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                  {IRAQ_GOVERNORATES.filter(g => g !== 'الكل').map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:'0.8rem' }}>
                <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>العنوان التفصيلي</label>
                <input style={inp} value={form?.address || ''} placeholder="الحي / الشارع / قرب..." onChange={e => set('address', e.target.value)} />
              </div>
            </div>

            {/* الوصف */}
            <div style={card}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>📝 الوصف</label>
              <textarea style={{ ...inp, resize:'none', minHeight:'90px', lineHeight:1.6 }}
                value={form?.description || ''} placeholder="ماذا يميز مكانك؟..."
                onChange={e => set('description', e.target.value)} />
            </div>

            {/* الموقع الجغرافي */}
            <div style={card}>
              <label style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:700, display:'block', marginBottom:'0.3rem' }}>
                📍 رابط Google Maps
              </label>
              <p style={{ fontSize:'0.71rem', color:'var(--text-muted)', marginBottom:'0.5rem', lineHeight:1.5 }}>
                افتح Google Maps ← ابحث عن مكانك ← اضغط مشاركة ← انسخ الرابط
              </p>
              <input style={{ ...inp, direction:'ltr' }} value={form?.mapLink || ''}
                placeholder="https://maps.google.com/..." onChange={e => set('mapLink', e.target.value)} />
              {form?.mapLink && (
                <a href={form.mapLink} target="_blank" rel="noopener noreferrer" style={{
                  display:'block', marginTop:'0.5rem', fontSize:'0.78rem',
                  color:'var(--color-primary-light)', textDecoration:'none', textAlign:'center',
                }}>🗺️ معاينة الموقع</a>
              )}
            </div>

            {/* أزرار الحفظ */}
            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button onClick={() => setEditing(false)} style={{
                flex:1, padding:'0.8rem', borderRadius:'14px',
                background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                color:'var(--text-muted)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
              }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex:2, padding:'0.8rem', borderRadius:'14px', border:'none',
                background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
                color:'#fff', fontWeight:800, fontSize:'0.95rem',
                cursor: saving ? 'wait' : 'pointer', fontFamily:'var(--font-main)',
              }}>{saving ? '⏳ جاري الحفظ...' : '✅ حفظ التعديلات'}</button>
            </div>
          </>
        )}
      </div>

      {/* نافذة تأكيد الحذف */}
      {showDelete && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
          display:'flex', alignItems:'flex-end', zIndex:2000, backdropFilter:'blur(4px)',
        }}>
          <div style={{
            width:'100%', background:'var(--bg-card)',
            borderRadius:'24px 24px 0 0', padding:'1.5rem',
            paddingBottom:'calc(1.5rem + env(safe-area-inset-bottom))',
          }}>
            <div style={{ fontSize:'3rem', textAlign:'center', marginBottom:'0.8rem' }}>⚠️</div>
            <h3 style={{ textAlign:'center', fontSize:'1.1rem', fontWeight:800, color:'#ff9090', marginBottom:'0.5rem' }}>
              حذف مكانك نهائياً؟
            </h3>
            <p style={{ textAlign:'center', fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1.5rem', lineHeight:1.6 }}>
              سيُحذف المكان وكل بياناته بما فيها قائمة الطعام. لا يمكن التراجع.
            </p>
            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button onClick={() => setShowDelete(false)} style={{
                flex:1, padding:'0.85rem', borderRadius:'14px',
                background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                color:'var(--text-muted)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
              }}>إلغاء</button>
              <button onClick={handleDelete} style={{
                flex:1, padding:'0.85rem', borderRadius:'14px', border:'none',
                background:'rgba(200,50,50,0.9)', color:'#fff',
                fontWeight:800, cursor:'pointer', fontFamily:'var(--font-main)',
              }}>🗑️ نعم، احذف</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
