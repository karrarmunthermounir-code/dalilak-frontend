import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPlace, IRAQ_GOVERNORATES } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── ضغط الصورة قبل الحفظ ───
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ──────────────────────────────────────────────
// الثوابت
// ──────────────────────────────────────────────
const TYPES = [
  { key: 'مطعم',  icon: '🍽️', color: 'rgba(26,107,69,0.2)',   border: 'rgba(26,107,69,0.5)',   text: '#4ade80' },
  { key: 'كافيه', icon: '☕',  color: 'rgba(201,151,58,0.15)', border: 'rgba(201,151,58,0.5)',  text: '#fbbf24' },
  { key: 'فندق',  icon: '🏨',  color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.45)', text: '#a5b4fc' },
]

const REST_FEATURES = ['واي فاي','موقف سيارات','صالة عائلية','دليفري','هواء طلق','تكييف','وجبة إفطار','مناسب للأطفال']
const CAFE_FEATURES = ['واي فاي','هواء طلق','تكييف','قهوة مختصة','حلويات','موقف سيارات','مناسب للعمل','موسيقى']
const HOTEL_FEATURES = ['واي فاي','مسبح','سبا','إفطار مجاني','موقف سيارات','خدمة غرف','صالة رياضة','قاعة مؤتمرات']
const REST_MENU_CATS  = ['مشاوي','رئيسية','مشروبات','مقبلات','حلويات','برغر','أسماك','دجاج','سلطات','وجبات سريعة','أخرى']
const CAFE_MENU_CATS  = ['قهوة','مشروبات ساخنة','مشروبات باردة','عصائر','حلويات','كيك','نراكيل','سندويشات','أخرى']
const getMenuCats = (type) => type === 'كافيه' ? CAFE_MENU_CATS : REST_MENU_CATS

const getFeatures = (type) => type === 'فندق' ? HOTEL_FEATURES : type === 'كافيه' ? CAFE_FEATURES : REST_FEATURES

// ──────────────────────────────────────────────
// أنماط
// ──────────────────────────────────────────────
const inp = {
  width: '100%', padding: '0.78rem 1rem', borderRadius: '14px',
  border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'var(--font-main)',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  borderRadius: '18px', padding: '1.2rem', marginBottom: '1rem',
}

// ──────────────────────────────────────────────
// مكوّن حقل
// ──────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
        {label} {required && <span style={{ color: 'var(--color-accent)' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.74rem', color: '#ff9090', marginTop: '0.3rem' }}>⚠ {error}</p>}
    </div>
  )
}

// ──────────────────────────────────────────────
// مكوّن صنف المنيو (للمشتركين)
// ──────────────────────────────────────────────
function MenuItemRow({ item, idx, onChange, onRemove, placeType, onImagePick }) {
  const cats = getMenuCats(placeType)
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '0.9rem', marginBottom: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* اسم + سعر */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input style={inp} value={item.name} placeholder="اسم الصنف *" onChange={e => onChange(idx, 'name', e.target.value)} />
        <input style={inp} type="number" value={item.price} placeholder="السعر (د.ع)" onChange={e => onChange(idx, 'price', e.target.value)} />
      </div>

      {/* التصنيف + حذف */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <select value={item.category} onChange={e => onChange(idx, 'category', e.target.value)}
          style={{ ...inp, cursor: 'pointer', flex: 1 }}>
          <option value="">التصنيف...</option>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        {idx > 0 && (
          <button type="button" onClick={() => onRemove(idx)} style={{
            background: 'rgba(200,50,50,0.15)', border: '1px solid rgba(200,50,50,0.3)',
            color: '#ff9090', borderRadius: '12px', padding: '0 0.8rem',
            cursor: 'pointer', flexShrink: 0,
          }}>✕</button>
        )}
      </div>

      {/* وصف */}
      <input style={{ ...inp, fontSize: '0.82rem', marginBottom: '0.5rem' }} value={item.description}
        placeholder="وصف اختياري..." onChange={e => onChange(idx, 'description', e.target.value)} />

      {/* صورة الصنف */}
      {item.image ? (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '0.3rem' }}>
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '0.3rem' }}>
            <label style={{
              background: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '0.25rem 0.5rem',
              cursor: 'pointer', fontSize: '0.72rem', color: '#fff', fontFamily: 'var(--font-main)',
            }}>
              🔄
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onImagePick(idx, e)} />
            </label>
            <button type="button" onClick={() => onChange(idx, 'image', '')} style={{
              background: 'rgba(200,50,50,0.8)', border: 'none', borderRadius: '8px',
              padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem', color: '#fff',
            }}>🗑️</button>
          </div>
        </div>
      ) : (
        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.8rem', borderRadius: '10px', cursor: 'pointer',
          border: '1px dashed var(--border-color)', background: 'rgba(255,255,255,0.02)',
          marginTop: '0.3rem',
        }}>
          <span style={{ fontSize: '1rem' }}>📸</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-primary-light)', fontFamily: 'var(--font-main)', fontWeight: 600 }}>
            إضافة صورة للصنف
          </span>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onImagePick(idx, e)} />
        </label>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// الصفحة الرئيسية
// ──────────────────────────────────────────────
const empty = {
  name: '', type: 'مطعم', governorate: 'بغداد', address: '',
  description: '', phone: '', openHours: '9:00 ص - 11:00 م',
  features: [], mapLink: '', images: '',
  imageFiles: [], // صور المكان المضغوطة
  menuImage: '', // للمجاني: صورة منيو واحدة
  menu: [{ name: '', price: '', category: '', description: '' }],
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { isLoggedIn, isSubscribed, subscriptionTier } = useAuth()

  const [step,    setStep]    = useState(0) // 0=اختيار النوع 1=المعلومات 2=المنيو 3=نجاح
  const [form,    setForm]    = useState(empty)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleFeature = (feat) =>
    setForm(f => ({ ...f, features: f.features.includes(feat) ? f.features.filter(x => x !== feat) : [...f.features, feat] }))

  const changeMenu = (idx, k, v) =>
    setForm(f => { const m = [...f.menu]; m[idx] = { ...m[idx], [k]: v }; return { ...f, menu: m } })

  const addItem   = () => setForm(f => ({ ...f, menu: [...f.menu, { name: '', price: '', category: '', description: '', image: '' }] }))
  const removeItem = (i) => setForm(f => ({ ...f, menu: f.menu.filter((_, x) => x !== i) }))

  // ── رفع صورة صنف المنيو ──
  const handleMenuImagePick = async (idx, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file, 500, 0.65)
      changeMenu(idx, 'image', compressed)
    } catch { alert('خطأ في معالجة الصورة') }
    e.target.value = ''
  }

  // ── التحقق ──
  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name        = 'اسم المكان مطلوب'
    if (!form.description.trim()) e.description = 'الوصف مطلوب'
    if (!form.address.trim())     e.address     = 'العنوان مطلوب'
    setErrors(e)
    return !Object.keys(e).length
  }

  // ── الإرسال ──
  const handleSubmit = async () => {
    if (!validate()) { setStep(1); return }
    setLoading(true)
    try {
      const images = form.imageFiles.length > 0
        ? [...form.imageFiles]
        : (form.images ? form.images.split('\n').map(s => s.trim()).filter(Boolean) : [])
      if (form.menuImage?.trim()) images.push(form.menuImage.trim())
      if (!images.length) images.push('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800')

      const menuArr = isSubscribed
        ? form.menu.filter(m => m.name.trim()).map(m => ({ ...m, price: Number(m.price) || 0 }))
        : (form.menuImage ? [{ name: 'منيو الصور', menuImage: form.menuImage, category: 'منيو' }] : [])

      const placeData = {
        ...form,
        images,
        menu: menuArr,
        area: form.address,
        ownerId: 'user_local',
        isFeatured: subscriptionTier === 'premium',
        savedAt: Date.now(),
      }
      // addPlace يرجع newPlace مع _id — احفظه كاملاً حتى يشتغل الحذف لاحقاً
      const newPlace = await addPlace(placeData)

      // ─── احفظ newPlace (مع _id) بـ localStorage ───
      localStorage.setItem('dalilak_my_place',      JSON.stringify(newPlace))
      localStorage.setItem('dalilak_my_place_type', form.type)
      setStep(3)
    } catch {
      alert('حدث خطأ. جرب مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  // ════════════════════════════════════════════
  // شريط التقدم المشترك
  // ════════════════════════════════════════════
  const StepBar = ({ current }) => {
    if (current === 0 || current === 3) return null
    return (
      <div style={{ display: 'flex', gap: '0.3rem', padding: '0 1rem' }}>
        {['المعلومات', form.type === 'فندق' ? (isSubscribed ? 'صور الغرف' : 'صورة الغرف') : (isSubscribed ? 'المنيو' : 'صورة المنيو'), 'نشر'].map((label, i) => {
          const n = i + 1
          const active = current === n
          const done   = current > n
          return (
            <button key={n} onClick={() => n < current && setStep(n)} style={{
              flex: 1, padding: '0.45rem 0', borderRadius: '10px', border: 'none',
              fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.72rem', cursor: n < current ? 'pointer' : 'default',
              background: active
                ? 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))'
                : done ? 'rgba(26,107,69,0.25)' : 'rgba(255,255,255,0.06)',
              color: active ? '#000' : done ? 'var(--color-primary-light)' : 'var(--text-muted)',
            }}>
              {done ? '✓' : `${n}.`} {label}
            </button>
          )
        })}
      </div>
    )
  }

  // ════════════════════════════════════════════
  // شاشة: يجب تسجيل الدخول
  // ════════════════════════════════════════════
  if (!isLoggedIn) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center', maxWidth:'320px' }}>
        <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔒</div>
        <h2 style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>سجّل دخولك أولاً</h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:'1.5rem', lineHeight:1.7 }}>
          لإضافة مكانك لدليلك، تحتاج حساب مجاني فقط 👇
        </p>
        <button onClick={() => navigate('/auth', { state:{ from:'/admin' } })} style={{
          width:'100%', padding:'0.85rem', borderRadius:'14px', border:'none',
          background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
          color:'#fff', fontWeight:700, fontSize:'1rem', fontFamily:'var(--font-main)', cursor:'pointer',
        }}>🔑 تسجيل الدخول / إنشاء حساب</button>
        <button onClick={() => navigate('/')} style={{ marginTop:'0.8rem', background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-main)' }}>
          ← الرئيسية
        </button>
      </div>
    </div>
  )

  // ════════════════════════════════════════════
  // شاشة النجاح
  // ════════════════════════════════════════════
  if (step === 3) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center', maxWidth:'340px' }}>
        <div style={{ fontSize:'4rem', marginBottom:'1rem', animation:'pulse 1s ease infinite' }}>🎉</div>
        <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--color-primary-light)', marginBottom:'0.5rem' }}>
          تمت الإضافة بنجاح!
        </h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, marginBottom:'1.5rem' }}>
          مكانك <strong style={{ color:'var(--text-primary)' }}>{form.name}</strong> أصبح في دليلك الآن ✅
        </p>

        {/* ترويج الاشتراك للمجانيين */}
        {!isSubscribed && (
          <div style={{
            background:'rgba(201,151,58,0.1)', border:'1px solid rgba(201,151,58,0.3)',
            borderRadius:'16px', padding:'1rem', marginBottom:'1.2rem', textAlign:'right',
          }}>
            <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--color-accent-light)', marginBottom:'0.4rem' }}>
              💎 فعّل اشتراكك للحصول على:
            </p>
            {['منيو كامل مع أسعار وصور','إحصائيات المشاهدات والاتصالات','ظهور مميز في الأعلى','إضافة عروض وخصومات'].map((f,i) => (
              <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:'0.25rem' }}>
                ✓ {f}
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          <button onClick={() => navigate('/')} style={{
            padding:'0.85rem', borderRadius:'14px', border:'none',
            background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
            color:'#fff', fontWeight:800, fontSize:'0.95rem', fontFamily:'var(--font-main)', cursor:'pointer',
          }}>🗺️ شوف مكانك في الدليل</button>
          {!isSubscribed && (
            <button onClick={() => navigate('/subscriptions')} style={{
              padding:'0.85rem', borderRadius:'14px', border:'none',
              background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
              color:'#000', fontWeight:800, fontSize:'0.95rem', fontFamily:'var(--font-main)', cursor:'pointer',
            }}>💎 اشترك وفعّل المميزات</button>
          )}
          <button onClick={() => { setStep(0); setForm(empty) }} style={{
            padding:'0.7rem', borderRadius:'14px',
            background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
            color:'var(--text-muted)', fontSize:'0.85rem', cursor:'pointer', fontFamily:'var(--font-main)',
          }}>➕ إضافة مكان آخر</button>
        </div>
      </div>
    </div>
  )

  // ════════════════════════════════════════════
  // شاشة: اختيار النوع (الخطوة 0)
  // ════════════════════════════════════════════
  if (step === 0) return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1.4rem 1rem 1.2rem',
        borderBottom:'1px solid var(--border-color)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
          <button onClick={() => navigate('/')} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div>
            <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:'var(--text-primary)' }}>➕ إضافة مكان</h1>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>مجاناً — لا يلزم اشتراك</p>
          </div>
        </div>
      </header>

      <div style={{ padding:'1.5rem 1rem', paddingBottom:'5rem' }}>
        {/* بنر مجاني */}
        <div style={{
          background:'linear-gradient(135deg,rgba(26,107,69,0.15),rgba(26,107,69,0.05))',
          border:'1px solid rgba(26,107,69,0.3)', borderRadius:'18px',
          padding:'1.1rem', marginBottom:'1.5rem', textAlign:'center',
        }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.3rem' }}>🎯</div>
          <p style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--color-primary-light)', marginBottom:'0.3rem' }}>
            أي شخص يمكنه إضافة مكانه مجاناً!
          </p>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6 }}>
            أضف مطعمك أو كافيهك أو فندقك في أقل من دقيقتين
          </p>
        </div>

        <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'1rem', textAlign:'center' }}>
          اختر نوع المكان
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.8rem' }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => { set('type', t.key); set('features', []); setStep(1) }} style={{
              display:'flex', alignItems:'center', gap:'1.2rem',
              padding:'1.2rem', borderRadius:'18px', cursor:'pointer',
              background:t.color, border:`2px solid ${t.border}`,
              fontFamily:'var(--font-main)', textAlign:'right',
              transition:'transform 0.15s, opacity 0.15s',
            }}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
            >
              <span style={{ fontSize:'2.5rem', flexShrink:0 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize:'1.15rem', fontWeight:800, color:t.text }}>{t.key}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
                  {t.key==='مطعم'  && 'مطعم، مشاوي، أسماك، مأكولات...'}
                  {t.key==='كافيه' && 'كافيه، قهوة، حلويات، مشروبات...'}
                  {t.key==='فندق'  && 'فندق، شاليه، استراحة، سكن...'}
                </div>
              </div>
              <span style={{ marginRight:'auto', color:'var(--text-muted)', fontSize:'1.1rem' }}>◀</span>
            </button>
          ))}
        </div>

        {/* مقارنة مجاني/مشترك */}
        <div style={{ marginTop:'1.5rem', ...cardStyle }}>
          <h3 style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.8rem' }}>
            ما الفرق بين المجاني والمشترك؟
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.76rem' }}>
            <div>
              <div style={{ fontWeight:800, color:'var(--text-muted)', marginBottom:'0.4rem' }}>🆓 مجاني</div>
              {['إضافة مكانك','عنوان + وصف','صورة واحدة (منيو/غرف)','ظهور في البحث'].map((f,i) => (
                <div key={i} style={{ color:'var(--text-secondary)', marginBottom:'0.2rem' }}>✓ {f}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight:800, color:'var(--color-accent-light)', marginBottom:'0.4rem' }}>💎 مشترك</div>
              {['كل مميزات المجاني','منيو / صور غرف كاملة','إحصائيات الزوار','ظهور مميز في الأعلى'].map((f,i) => (
                <div key={i} style={{ color:'var(--color-accent-light)', marginBottom:'0.2rem' }}>⭐ {f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )

  // ════════════════════════════════════════════
  // خطوة 1: المعلومات الأساسية
  // ════════════════════════════════════════════
  if (step === 1) return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1rem', position:'sticky', top:0, zIndex:100,
        borderBottom:'1px solid var(--border-color)', backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.8rem' }}>
          <button onClick={() => setStep(0)} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div>
            <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>
              {TYPES.find(t=>t.key===form.type)?.icon} إضافة {form.type}
            </h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>الخطوة 1 من 2</p>
          </div>
        </div>
        <StepBar current={1} />
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        <Field label="اسم المكان" required error={errors.name}>
          <input style={inp} value={form.name} onChange={e => set('name', e.target.value)}
            placeholder={`اسم ${form.type} (مثال: ${form.type==='مطعم'?'مطعم السندباد':form.type==='كافيه'?'كافيه الأمل':'فندق النخيل'})`} />
        </Field>

        <Field label="المحافظة" required>
          <select value={form.governorate} onChange={e => set('governorate', e.target.value)}
            style={{ ...inp, cursor:'pointer' }}>
            {IRAQ_GOVERNORATES.filter(g => g !== 'الكل').map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>

        <Field label="العنوان التفصيلي" required error={errors.address}
          hint="مثال: شارع المنصور، بجانب بنك الرافدين">
          <input style={inp} value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="الحي / الشارع / قرب..." />
        </Field>

        <Field label="وصف المكان" required error={errors.description}
          hint="اكتب وصفاً يشجع الزوار على الزيارة">
          <textarea style={{ ...inp, resize:'none', minHeight:'100px', lineHeight:1.6 }}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="ماذا يميز مكانك؟ ما نوع الطعام؟ ما الأجواء؟..." />
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.7rem' }}>
          <Field label="رقم الهاتف">
            <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="07xxxxxxxxx" inputMode="tel" />
          </Field>
          <Field label="ساعات العمل">
            <input style={inp} value={form.openHours} onChange={e => set('openHours', e.target.value)}
              placeholder="9 ص - 12 م" />
          </Field>
        </div>

        <Field label="رابط Google Maps" hint="افتح Google Maps → ابحث عن مكانك → شارك الرابط">
          <input style={{ ...inp, direction:'ltr' }} value={form.mapLink}
            onChange={e => set('mapLink', e.target.value)} placeholder="https://maps.google.com/..." />
        </Field>

        <Field label="صور المكان" hint="اختر صور من الاستوديو أو الكاميرا">
          {/* عرض الصور المختارة */}
          {form.imageFiles.length > 0 && (
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.6rem' }}>
              {form.imageFiles.map((img, i) => (
                <div key={i} style={{ position:'relative', width:'80px', height:'80px', borderRadius:'12px', overflow:'hidden' }}>
                  <img src={img} alt={`صورة ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => setForm(f => ({ ...f, imageFiles: f.imageFiles.filter((_,x) => x !== i) }))} style={{
                    position:'absolute', top:'2px', right:'2px', background:'rgba(0,0,0,0.7)',
                    border:'none', borderRadius:'50%', width:'22px', height:'22px',
                    color:'#ff9090', fontSize:'0.7rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'1.2rem', borderRadius:'14px', cursor:'pointer',
            border:'2px dashed var(--border-color)', background:'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.3rem' }}>📸</div>
            <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--color-primary-light)' }}>
              {form.imageFiles.length > 0 ? 'إضافة صورة أخرى' : 'اضغط لاختيار صور'}
            </span>
            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>من الاستوديو أو الكاميرا</span>
            <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={async (e) => {
              const files = Array.from(e.target.files || [])
              for (const file of files) {
                const compressed = await compressImage(file)
                setForm(f => ({ ...f, imageFiles: [...f.imageFiles, compressed] }))
              }
              e.target.value = ''
            }} />
          </label>
        </Field>

        {/* المميزات */}
        <Field label={`مميزات ${form.type==='فندق'?'الفندق':'المكان'}`}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
            {getFeatures(form.type).map(feat => (
              <button type="button" key={feat} onClick={() => toggleFeature(feat)} style={{
                padding:'0.4rem 0.85rem', borderRadius:'99px', border:'none',
                fontFamily:'var(--font-main)', fontWeight:600, fontSize:'0.8rem', cursor:'pointer',
                background: form.features.includes(feat) ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                color:      form.features.includes(feat) ? '#fff' : 'var(--text-muted)',
                transition:'all 0.15s',
              }}>
                {form.features.includes(feat) ? '✓ ' : ''}{feat}
              </button>
            ))}
          </div>
        </Field>

        <button type="button" onClick={() => { if (validate()) setStep(2) }} style={{
          width:'100%', padding:'0.9rem', marginTop:'0.5rem', borderRadius:'14px', border:'none',
          background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dark))',
          color:'#fff', fontWeight:800, fontSize:'1rem', fontFamily:'var(--font-main)', cursor:'pointer',
        }}>
          التالي — {form.type === 'فندق' ? (isSubscribed ? 'صور الغرف' : 'صورة الغرف') : (isSubscribed ? 'المنيو' : 'صورة المنيو')} ←
        </button>
      </div>
    </main>
  )

  // ════════════════════════════════════════════
  // خطوة 2: المنيو
  // ════════════════════════════════════════════
  if (step === 2) return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1rem', position:'sticky', top:0, zIndex:100,
        borderBottom:'1px solid var(--border-color)', backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.8rem' }}>
          <button onClick={() => setStep(1)} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div>
            <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>
              {form.type === 'فندق'
                ? (isSubscribed ? '🏨 صور الغرف والمميزات' : '📷 صورة الغرف')
                : (isSubscribed ? '🍴 قائمة الطعام' : '📷 صورة المنيو')}
            </h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>الخطوة 2 من 2</p>
          </div>
        </div>
        <StepBar current={2} />
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* ─── مجاني: صورة واحدة (منيو أو غرف حسب النوع) ─── */}
        {!isSubscribed && (
          <>
            <div style={{
              background:'rgba(201,151,58,0.08)', border:'1px solid rgba(201,151,58,0.2)',
              borderRadius:'16px', padding:'1rem', marginBottom:'1.2rem',
            }}>
              <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--color-accent-light)', marginBottom:'0.3rem' }}>
                📋 خطتك الحالية: مجاني
              </p>
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6 }}>
                {form.type === 'فندق'
                  ? 'يمكنك إضافة صورة واحدة للغرف أو المميزات. للحصول على معرض صور كامل مع وصف كل غرفة وسعرها، اشترك الآن.'
                  : 'يمكنك إضافة صورة واحدة لقائمة طعامك. للحصول على منيو كامل مع الأسعار والأصناف، اشترك الآن.'}
              </p>
              <button onClick={() => navigate('/subscriptions')} style={{
                marginTop:'0.7rem', padding:'0.5rem 1rem', borderRadius:'10px', border:'none',
                background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
                color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-main)',
              }}>🎁 ابدأ التجربة المجانية</button>
            </div>

            <Field label={form.type === 'فندق' ? 'صورة الغرف أو المميزات' : 'صورة المنيو'}>
              {form.menuImage ? (
                <div>
                  <div style={{ borderRadius:'14px', overflow:'hidden', border:'1px solid var(--border-color)' }}>
                    <img src={form.menuImage} alt="صورة" style={{ width:'100%', height:'180px', objectFit:'cover', display:'block' }} />
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
                    <label style={{
                      flex:1, padding:'0.5rem', borderRadius:'10px', textAlign:'center',
                      background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                      color:'var(--text-secondary)', fontSize:'0.78rem', fontWeight:600,
                      cursor:'pointer', fontFamily:'var(--font-main)',
                    }}>
                      🔄 تغيير
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        const compressed = await compressImage(file, 600, 0.65)
                        set('menuImage', compressed)
                      }} />
                    </label>
                    <button onClick={() => set('menuImage', '')} style={{
                      padding:'0.5rem 0.8rem', borderRadius:'10px',
                      background:'rgba(200,50,50,0.08)', border:'1px solid rgba(200,50,50,0.3)',
                      color:'#ff9090', fontSize:'0.78rem', fontWeight:600,
                      cursor:'pointer', fontFamily:'var(--font-main)',
                    }}>🗑️ حذف</button>
                  </div>
                </div>
              ) : (
                <label style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  padding:'1.5rem', borderRadius:'14px', cursor:'pointer',
                  border:'2px dashed var(--border-color)', background:'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ fontSize:'2.2rem', marginBottom:'0.4rem' }}>📸</div>
                  <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--color-primary-light)', marginBottom:'0.2rem' }}>
                    اضغط لاختيار صورة
                  </span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>من الاستوديو أو الكاميرا</span>
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const compressed = await compressImage(file, 600, 0.65)
                    set('menuImage', compressed)
                  }} />
                </label>
              )}
            </Field>
          </>
        )}

        {/* ─── مشترك: منيو كامل (مطعم/كافيه) أو صور غرف (فندق) ─── */}
        {isSubscribed && (
          <>
            <div style={{
              background:'rgba(26,107,69,0.1)', border:'1px solid rgba(26,107,69,0.25)',
              borderRadius:'16px', padding:'0.9rem 1rem', marginBottom:'1.2rem',
              display:'flex', alignItems:'center', gap:'0.7rem',
            }}>
              <span style={{ fontSize:'1.3rem' }}>{form.type === 'فندق' ? '🏨' : '⭐'}</span>
              <div>
                <p style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--color-primary-light)' }}>
                  {form.type === 'فندق' ? 'صور الغرف والمميزات مفعّلة' : 'منيو كامل مفعّل'}
                </p>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                  {form.type === 'فندق' ? 'أضف صور وأوصاف الغرف وأسعارها' : 'أضف أصنافك مع الأسعار والتصنيفات'}
                </p>
              </div>
            </div>

            {/* ─── فندق: صور الغرف ─── */}
            {form.type === 'فندق' ? (
              <>
                <Field label="صور الغرف والمميزات">
                  {form.imageFiles.length > 0 && (
                    <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.6rem' }}>
                      {form.imageFiles.map((img, i) => (
                        <div key={i} style={{ position:'relative', width:'80px', height:'80px', borderRadius:'12px', overflow:'hidden' }}>
                          <img src={img} alt={`غرفة ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          <button onClick={() => setForm(f => ({ ...f, imageFiles: f.imageFiles.filter((_,x) => x !== i) }))} style={{
                            position:'absolute', top:'2px', right:'2px', background:'rgba(0,0,0,0.7)',
                            border:'none', borderRadius:'50%', width:'22px', height:'22px',
                            color:'#ff9090', fontSize:'0.7rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={{
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:'1rem', borderRadius:'14px', cursor:'pointer',
                    border:'2px dashed rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.04)',
                  }}>
                    <div style={{ fontSize:'1.8rem', marginBottom:'0.3rem' }}>🏨</div>
                    <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#a5b4fc' }}>
                      {form.imageFiles.length > 0 ? 'إضافة صورة أخرى' : 'اضغط لاختيار صور الغرف'}
                    </span>
                    <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      for (const file of files) {
                        const compressed = await compressImage(file)
                        setForm(f => ({ ...f, imageFiles: [...f.imageFiles, compressed] }))
                      }
                      e.target.value = ''
                    }} />
                  </label>
                </Field>

                <p style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.7rem', marginTop:'0.3rem' }}>
                  🛏️ أنواع الغرف وأسعارها
                </p>
                {form.menu.map((item, idx) => (
                  <div key={idx} style={{
                    background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.18)',
                    borderRadius:'14px', padding:'0.9rem', marginBottom:'0.6rem',
                  }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
                      <input style={inp} value={item.name} placeholder="نوع الغرفة (مثال: سويت)" onChange={e => changeMenu(idx,'name',e.target.value)} />
                      <input style={inp} type="number" value={item.price} placeholder="السعر/ليلة (د.ع)" onChange={e => changeMenu(idx,'price',e.target.value)} />
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <input style={{ ...inp, flex:1 }} value={item.description} placeholder="وصف الغرفة (سرير كينج، إطلالة، ...)" onChange={e => changeMenu(idx,'description',e.target.value)} />
                      {idx > 0 && (
                        <button type="button" onClick={() => removeItem(idx)} style={{
                          background:'rgba(200,50,50,0.15)', border:'1px solid rgba(200,50,50,0.3)',
                          color:'#ff9090', borderRadius:'12px', padding:'0 0.8rem',
                          cursor:'pointer', flexShrink:0,
                        }}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addItem} style={{
                  width:'100%', padding:'0.7rem', marginBottom:'1rem',
                  borderRadius:'14px', cursor:'pointer', fontFamily:'var(--font-main)',
                  fontWeight:600, fontSize:'0.88rem',
                  background:'rgba(99,102,241,0.08)', border:'1px dashed rgba(99,102,241,0.4)',
                  color:'#a5b4fc',
                }}>
                  ＋ إضافة نوع غرفة آخر
                </button>
              </>
            ) : (
              /* ─── مطعم/كافيه: منيو كامل ─── */
              <>
                {form.menu.map((item, idx) => (
                  <MenuItemRow key={idx} item={item} idx={idx} onChange={changeMenu} onRemove={removeItem} placeType={form.type} onImagePick={handleMenuImagePick} />
                ))}
                <button type="button" onClick={addItem} style={{
                  width:'100%', padding:'0.7rem', marginBottom:'1.2rem',
                  borderRadius:'14px', cursor:'pointer', fontFamily:'var(--font-main)',
                  fontWeight:600, fontSize:'0.88rem',
                  background:'rgba(26,107,69,0.1)', border:'1px dashed var(--color-primary)',
                  color:'var(--color-primary-light)',
                }}>
                  ＋ إضافة صنف آخر
                </button>
                <Field label="صورة إضافية للمنيو (اختياري)">
                  {form.menuImage ? (
                    <div>
                      <div style={{ borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border-color)' }}>
                        <img src={form.menuImage} alt="منيو" style={{ width:'100%', height:'150px', objectFit:'cover', display:'block' }} />
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
                        <label style={{
                          flex:1, padding:'0.4rem', borderRadius:'8px', textAlign:'center',
                          background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)',
                          color:'var(--text-secondary)', fontSize:'0.75rem', fontWeight:600,
                          cursor:'pointer', fontFamily:'var(--font-main)',
                        }}>
                          🔄 تغيير
                          <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return
                            const compressed = await compressImage(file, 600, 0.65)
                            set('menuImage', compressed)
                          }} />
                        </label>
                        <button onClick={() => set('menuImage', '')} style={{
                          padding:'0.4rem 0.6rem', borderRadius:'8px',
                          background:'rgba(200,50,50,0.08)', border:'1px solid rgba(200,50,50,0.3)',
                          color:'#ff9090', fontSize:'0.75rem', cursor:'pointer', fontFamily:'var(--font-main)',
                        }}>🗑️</button>
                      </div>
                    </div>
                  ) : (
                    <label style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                      padding:'0.8rem', borderRadius:'12px', cursor:'pointer',
                      border:'2px dashed var(--border-color)', background:'rgba(255,255,255,0.02)',
                    }}>
                      <span style={{ fontSize:'1.2rem' }}>📸</span>
                      <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--color-primary-light)' }}>اختر صورة المنيو</span>
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        const compressed = await compressImage(file, 600, 0.65)
                        set('menuImage', compressed)
                      }} />
                    </label>
                  )}
                </Field>
              </>
            )}
          </>
        )}

        {/* ملخص */}
        <div style={{ ...cardStyle, marginBottom:'1rem' }}>
          <h4 style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.7rem' }}>📋 ملخص ما ستنشره</h4>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'0.3rem 0.8rem', fontSize:'0.82rem' }}>
            <span style={{ color:'var(--text-muted)' }}>النوع:</span>
            <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{form.type}</span>
            <span style={{ color:'var(--text-muted)' }}>الاسم:</span>
            <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{form.name || '—'}</span>
            <span style={{ color:'var(--text-muted)' }}>المحافظة:</span>
            <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{form.governorate}</span>
            {isSubscribed && form.type !== 'فندق' && (
              <>
                <span style={{ color:'var(--text-muted)' }}>الأصناف:</span>
                <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{form.menu.filter(m=>m.name.trim()).length} صنف</span>
              </>
            )}
            {isSubscribed && form.type === 'فندق' && (
              <>
                <span style={{ color:'var(--text-muted)' }}>أنواع الغرف:</span>
                <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{form.menu.filter(m=>m.name.trim()).length} غرفة</span>
              </>
            )}
          </div>
        </div>

        <button type="button" onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'0.95rem', borderRadius:'14px', border:'none',
          background:'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
          color:'#000', fontWeight:900, fontSize:'1.05rem', fontFamily:'var(--font-main)', cursor:'pointer',
          boxShadow:'0 6px 24px rgba(201,151,58,0.35)', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? '⏳ جاري النشر...' : '🚀 نشر المكان الآن'}
        </button>

        <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.7rem', lineHeight:1.6 }}>
          بالنشر توافق على شروط الاستخدام — مكانك سيظهر فور النشر
        </p>
      </div>
    </main>
  )

  return null
}
