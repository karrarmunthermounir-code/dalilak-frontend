import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPlaceById, postReview } from '../services/api'
import StarRating from '../components/StarRating'
import LoadingSpinner from '../components/LoadingSpinner'
import { sendNativeNotification } from '../utils/notifications'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800'

// ─── مودال الحجز ───
function BookingModal({ place, onClose }) {
  const isHotel  = place.type === 'فندق'
  const isKashta = place.type === 'كشتة'
  const label    = isHotel ? 'غرفة' : isKashta ? 'الكشتة' : 'طاولة'

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '', phone: '', date: today, time: '12:00', guests: 2, notes: ''
  })
  const [step, setStep]   = useState('form') // form | success
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setLoading(true)

    const bookingData = {
      name:      form.name.trim(),
      phone:     form.phone.trim(),
      date:      form.date,
      time:      form.time,
      guests:    form.guests,
      notes:     form.notes,
    }

    let newBooking = null
    const placeId = place._id || place.id || ''
    const API = (import.meta.env.VITE_API_URL || 'https://dalilak-backend.onrender.com') + '/api'

    // أرسل الحجز للسيرفر
    try {
      const res = await fetch(`${API}/places/${placeId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) newBooking = json.data
      }
    } catch (_) {}

    // Fallback: localStorage
    if (!newBooking) {
      newBooking = {
        _id: Date.now().toString(),
        placeId,
        placeName: place.name,
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    }

    // احفظ محلياً أيضاً
    try {
      const BOOKINGS_KEY = 'dalilak_table_bookings'
      const existing = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]')
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([{ ...newBooking, placeName: place.name }, ...existing]))
    } catch (_) {}

    // ─── أرسل واتساب لصاحب المكان فقط إذا كان هو المكان المسجل ───
    try {
      const myPlace  = JSON.parse(localStorage.getItem('dalilak_my_place') || 'null')
      const myId     = myPlace?._id || myPlace?.id || ''
      const bookedId = place._id || place.id || ''

      // مقارنة دقيقة بالـ ID فقط
      if (myPlace && myId && bookedId && myId === bookedId && myPlace.phone) {
        const raw  = myPlace.phone.replace(/[^0-9]/g, '')
        const intl = raw.startsWith('964') ? raw : '964' + raw.replace(/^0/, '')
        const msg  = encodeURIComponent(
          `🔔 حجز جديد في مكانك!\n` +
          `━━━━━━━━━━━━━━━\n` +
          `👤 الاسم: ${form.name}\n` +
          `📞 الهاتف: ${form.phone}\n` +
          `📅 التاريخ: ${form.date}\n` +
          `🕐 الوقت: ${form.time}\n` +
          `👥 الأشخاص: ${form.guests}\n` +
          `${form.notes ? '📝 ملاحظات: ' + form.notes + '\n' : ''}` +
          `━━━━━━━━━━━━━━━\n` +
          `بانتظار تأكيدك من تطبيق دليلك`
        )
        window.open(`https://wa.me/${intl}?text=${msg}`, '_blank')
      }
    } catch (_) {}

    setLoading(false)
    setStep('success')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        width: '100%', maxWidth: '460px',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '20px', overflow: 'hidden',
        animation: 'slideUpModal 0.28s ease',
      }}>
        {/* رأس المودال */}
        <div style={{
          padding: '1.2rem 1.5rem',
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem' }}>
              {isKashta ? '🏕️' : '📅'} حجز {label}
            </p>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{place.name}</h3>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {step === 'success' ? (
            // ─── شاشة الانتظار ───
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.7rem' }}>⏳</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                طلب حجزك وصل!
              </h3>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: '99px', padding: '0.3rem 0.9rem', marginBottom: '0.8rem',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b' }}>
                  🕐 بانتظار تأكيد صاحب المكان
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                سيتواصل معك صاحب <strong style={{ color: 'var(--color-accent-light)' }}>{place.name}</strong>
                {' '}على واتساب أو هاتفك<br/>
                <strong style={{ color: 'var(--text-primary)' }}>{form.phone}</strong>
                {' '}لتأكيد أو إلغاء الحجز.
              </p>
              <div style={{
                background: 'rgba(26,107,69,0.08)', border: '1px solid rgba(26,107,69,0.25)',
                borderRadius: '12px', padding: '0.9rem', textAlign: 'right',
                fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 2,
                marginBottom: '1.2rem',
              }}>
                <div>👤 <strong>{form.name}</strong></div>
                <div>📅 {form.date} — {form.time}</div>
                <div>👥 {form.guests} {isKashta ? 'شخص' : 'أشخاص'}</div>
                {form.notes && <div>📝 {form.notes}</div>}
              </div>
              <button onClick={onClose} style={{
                padding: '0.7rem 2rem',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                fontFamily: 'var(--font-main)',
              }}>حسناً، سأنتظر</button>
            </div>
          ) : (
            // ─── نموذج الحجز ───
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الاسم الكامل *</label>
                  <input
                    required value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="اسمك الكامل"
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>رقم الهاتف *</label>
                  <input
                    required value={form.phone} type="tel"
                    onChange={e => set('phone', e.target.value)}
                    placeholder="07XX XXX XXXX"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>📅 التاريخ</label>
                  <input
                    type="date" required value={form.date} min={today}
                    onChange={e => set('date', e.target.value)}
                    style={{ ...inputStyle, direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>🕐 الوقت</label>
                  <input
                    type="time" required value={form.time}
                    onChange={e => set('time', e.target.value)}
                    style={{ ...inputStyle, direction: 'ltr' }}
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    👥 عدد {isKashta ? 'الأشخاص' : 'الأشخاص على الطاولة'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button type="button"
                      onClick={() => set('guests', Math.max(1, form.guests - 1))}
                      style={counterBtn}>−</button>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '2rem', textAlign: 'center' }}>
                      {form.guests}
                    </span>
                    <button type="button"
                      onClick={() => set('guests', Math.min(30, form.guests + 1))}
                      style={counterBtn}>+</button>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>شخص</span>
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>📝 ملاحظات (اختياري)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder={isHotel ? 'مثلاً: غرفة مشرفة على النهر...' : 'مثلاً: طاولة بالقرب من النافذة...'}
                    rows={3}
                    style={{ ...inputStyle, resize: 'none', height: 'auto' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.85rem',
                background: loading
                  ? 'rgba(26,107,69,0.4)'
                  : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                border: 'none', borderRadius: '12px', color: '#fff',
                fontWeight: 800, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'var(--font-main)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                {loading ? (
                  <><div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                  }} /> جاري تأكيد الحجز...</>
                ) : (
                  <>{isKashta ? '🏕️' : '📅'} تأكيد الحجز</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity:0; transform: translateY(30px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
  borderRadius: '10px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-main)', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
}

const counterBtn = {
  width: '36px', height: '36px', borderRadius: '50%',
  background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
  color: 'var(--text-primary)', fontSize: '1.2rem',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-main)',
}

// ─── مكون معرض الصور ───
function Gallery({ images = [] }) {
  const [current, setCurrent] = useState(0)
  const imgs = images.length > 0 ? images : [FALLBACK_IMG]

  const prev = () => setCurrent((c) => (c - 1 + imgs.length) % imgs.length)
  const next = () => setCurrent((c) => (c + 1) % imgs.length)

  return (
    <div className="gallery">
      <img
        src={imgs[current]}
        alt="صورة المكان"
        className="gallery__main"
        onError={(e) => { e.target.src = FALLBACK_IMG }}
      />
      <div className="gallery__overlay" />

      {/* أزرار التنقل */}
      {imgs.length > 1 && (
        <>
          <button className="gallery__nav-btn gallery__nav-btn--prev" onClick={prev}>‹</button>
          <button className="gallery__nav-btn gallery__nav-btn--next" onClick={next}>›</button>
        </>
      )}

      {/* الصور المصغرة */}
      {imgs.length > 1 && (
        <div className="gallery__thumbs">
          {imgs.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`thumb-${i}`}
              className={`gallery__thumb ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              onError={(e) => { e.target.src = FALLBACK_IMG }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── مكون المنيو ───
function MenuSection({ menu = [], offers = [], menuImage = '' }) {
  const [activeCat, setActiveCat] = useState('الكل')

  // تحديد نوع المنيو: صورة فقط أم أصناف كاملة
  const hasFullMenu = menu.length > 0 && menu.some(m => m.name && m.name !== 'منيو الصور')
  const onlyImage   = !hasFullMenu && (menuImage || menu.find(m => m.menuImage))
  const menuImg     = menuImage || menu.find(m => m.menuImage)?.menuImage

  // العروض النشطة
  const activeOffers = (offers || []).filter(o =>
    o.active && (!o.expiresAt || new Date(o.expiresAt) > new Date())
  )

  if (!hasFullMenu && !menuImg && !activeOffers.length) return null

  const categories = ['الكل', ...new Set(menu.filter(m => m.name && m.name !== 'منيو الصور').map(m => m.category).filter(Boolean))]
  const filtered = activeCat === 'الكل'
    ? menu.filter(m => m.name && m.name !== 'منيو الصور')
    : menu.filter(m => m.category === activeCat && m.name && m.name !== 'منيو الصور')

  return (
    <div className="menu-section">

      {/* ─── العروض النشطة ─── */}
      {activeOffers.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>🎁 العروض والخصومات</h3>
          {activeOffers.map((offer, i) => (
            <div key={i} style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '0.5rem',
              display: 'flex', gap: '0.7rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🏷️</span>
              <div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.15rem' }}>{offer.title}</p>
                {offer.description && <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{offer.description}</p>}
                {offer.expiresAt && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    📅 ينتهي: {new Date(offer.expiresAt).toLocaleDateString('ar-IQ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── صورة المنيو (للمجانيين) ─── */}
      {onlyImage && menuImg && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 className="section-title">🍴 قائمة الطعام</h3>
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}>
            <img
              src={menuImg} alt="قائمة الطعام"
              style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '500px' }}
              onError={e => e.target.style.display='none'}
            />
          </div>
        </div>
      )}

      {/* ─── المنيو الكامل (للمشتركين) ─── */}
      {hasFullMenu && (
        <div>
          <h3 className="section-title">🍴 قائمة الأسعار</h3>

          {categories.length > 2 && (
            <div className="menu-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`menu-cat-btn ${activeCat === cat ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="menu-grid">
            {filtered.map((item, i) => (
              <div key={i} className="menu-item">
                {item.image && (
                  <img src={item.image} alt={item.name}
                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                    onError={e => e.target.style.display='none'}
                  />
                )}
                <div className="menu-item__info">
                  <p className="menu-item__name">{item.name}</p>
                  {item.description && (
                    <p className="menu-item__desc">{item.description}</p>
                  )}
                  {item.category && <p className="menu-item__cat">{item.category}</p>}
                </div>
                <div className="menu-item__price">
                  {Number(item.price).toLocaleString('ar-IQ')} د.ع
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── مكون التقييمات ───
function ReviewsSection({ reviews = [], averageRating = 0, placeId, onNewReview }) {
  const [form, setForm]       = useState({ author: '', rating: 0, comment: '' })
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]     = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.author.trim() || !form.rating) {
      showToast('⚠️ الاسم والتقييم مطلوبان')
      return
    }
    setSubmitting(true)
    try {
      const result = await postReview(placeId, form)
      onNewReview(result)
      setForm({ author: '', rating: 0, comment: '' })
      showToast('✅ تم إضافة تقييمك بنجاح!')
    } catch (err) {
      showToast('❌ فشلت الإضافة، حاول مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ar-IQ', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="reviews-section">
      <h3 className="section-title">💬 التقييمات</h3>

      {/* ملخص التقييم */}
      {reviews.length > 0 && (
        <div className="reviews-summary">
          <div>
            <div className="reviews-avg-number">{averageRating}</div>
            <StarRating rating={averageRating} size={18} />
            <div className="reviews-avg-label">{reviews.length} تقييم</div>
          </div>
          <div style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
            {reviews.length >= 3 ? '🏆 مكان ذو تقييم ممتاز من زوارنا' : 'كن أول من يُشارك تجربته!'}
          </div>
        </div>
      )}

      {/* قائمة التقييمات */}
      {reviews.length > 0 && (
        <div className="reviews-list">
          {reviews.map((rev, i) => (
            <div key={i} className="review-card">
              <div className="review-card__header">
                <div className="review-card__author">
                  <div className="review-avatar">
                    {rev.author?.charAt(0) || '؟'}
                  </div>
                  <div>
                    <div className="review-author-name">{rev.author}</div>
                    <div className="review-date">{formatDate(rev.createdAt)}</div>
                  </div>
                </div>
                <StarRating rating={rev.rating} />
              </div>
              {rev.comment && (
                <p className="review-comment">"{rev.comment}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* نموذج إضافة تقييم */}
      <form className="review-form" onSubmit={handleSubmit}>
        <p className="review-form__title">✍️ أضف تقييمك</p>

        <div className="form-group">
          <label className="form-label">اسمك</label>
          <input
            className="form-input"
            type="text"
            placeholder="أدخل اسمك..."
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">تقييمك</label>
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star-picker__star ${star <= (hovered || form.rating) ? 'active' : ''}`}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setForm({ ...form, rating: star })}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">تعليقك (اختياري)</label>
          <textarea
            className="form-textarea"
            placeholder="شاركنا تجربتك مع هذا المكان..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>

        <button className="submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
      </form>

      {/* Toast إشعار */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ─── الصفحة الرئيسية للتفاصيل ───
export default function PlaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [place, setPlace]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [showBooking, setShowBooking] = useState(false)

  const loadPlace = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPlaceById(id)
      setPlace(data)
    } catch (err) {
      console.error('PlaceDetailPage error:', err)
      setError('تعذّر تحميل بيانات المكان')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadPlace() }, [loadPlace])

  const handleNewReview = (reviewData) => {
    setPlace(prev => ({
      ...prev,
      reviews: reviewData.reviews,
      averageRating: reviewData.averageRating
    }))
  }

  if (loading) return (
    <div style={{ paddingTop: '0' }}>
      <LoadingSpinner text="جاري تحميل بيانات المكان..." />
    </div>
  )

  if (error || !place) return (
    <div style={{ paddingTop: '0' }}>
      <div className="empty-state">
        <div className="empty-state__icon">⚠️</div>
        <p className="empty-state__title">{error || 'المكان غير موجود'}</p>
        <button className="back-btn" onClick={() => navigate('/')} style={{ margin: '1.5rem auto' }}>
          ◀ العودة للرئيسية
        </button>
      </div>
    </div>
  )

  const TYPE_ICON = { 'كافيه': '☕', 'مطعم': '🍽️', 'مزرعة': '🌿' }

  return (
    <div className="detail-page">
      {/* معرض الصور */}
      <Gallery images={place.images} />

      {/* محتوى التفاصيل */}
      <div className="detail-content">

        {/* ─── العمود الرئيسي ─── */}
        <div className="detail-main animate-fadeIn">

          {/* زر العودة */}
          <button className="back-btn" onClick={() => navigate(-1)}>
            ◀ رجوع
          </button>

          {/* رأس الصفحة */}
          <div className="detail-header">
            <div className="detail-header__top">
              <div className="detail-header__badges">
                <span className="detail-type-badge">
                  {TYPE_ICON[place.type]} {place.type}
                </span>
                <span className="detail-type-badge" style={{ background: 'rgba(201,151,58,0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(201,151,58,0.3)' }}>
                  📍 {place.area}
                </span>
              </div>

              {place.averageRating > 0 && (
                <div className="detail-rating">
                  <StarRating rating={place.averageRating} size={18} />
                  <strong>{place.averageRating}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    ({place.reviews?.length || 0} تقييم)
                  </span>
                </div>
              )}
            </div>

            <h1 className="detail-name">{place.name}</h1>
            <p className="detail-desc">{place.description}</p>

            {/* معلومات سريعة */}
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-item__icon">📍</span>
                <div className="meta-item__text">
                  <span className="meta-item__label">العنوان</span>
                  <span className="meta-item__value">{place.address}</span>
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-item__icon">🕐</span>
                <div className="meta-item__text">
                  <span className="meta-item__label">ساعات العمل</span>
                  <span className="meta-item__value">{place.openHours}</span>
                </div>
              </div>
              {place.phone && (
                <div className="meta-item">
                  <span className="meta-item__icon">📞</span>
                  <div className="meta-item__text">
                    <span className="meta-item__label">رقم الهاتف</span>
                    <span className="meta-item__value" style={{ direction: 'ltr', textAlign: 'right' }}>
                      {place.phone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* المنيو + العروض */}
          <MenuSection menu={place.menu || []} offers={place.offers || []} menuImage={place.menuImage || ''} />

          {/* ─── زر الحجز ─── */}
          <div style={{ margin: '1.5rem 0' }}>
            <button
              onClick={() => setShowBooking(true)}
              style={{
                width: '100%', padding: '1rem',
                background: 'linear-gradient(135deg, #c9973a, #a07828)',
                border: 'none', borderRadius: '14px', color: '#fff',
                fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                fontFamily: 'var(--font-main)', transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                boxShadow: '0 4px 20px rgba(201,151,58,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(201,151,58,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(201,151,58,0.35)' }}
            >
              {place.type === 'فندق'  ? '🏨 احجز غرفتك الآن' :
               place.type === 'كافيه' ? '☕ احجز طاولتك الآن' :
               '🍽️ احجز طاولتك الآن'}
            </button>
          </div>

          {/* التقييمات */}
          <ReviewsSection
            reviews={place.reviews}
            averageRating={place.averageRating}
            placeId={id}
            onNewReview={handleNewReview}
          />
        </div>

        {/* ─── العمود الجانبي ─── */}
        <aside className="detail-sidebar">

          {/* الخريطة */}
          <div className="sidebar-card">
            <p className="sidebar-card__title">🗺️ الموقع على الخريطة</p>

            {/* Embed بالاسم والعنوان للدقة */}
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(place.name + ' ' + place.address)}&output=embed&z=15`}
              className="map-frame"
              title={`موقع ${place.name}`}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* زران: الاتجاهات + الفتح */}
            <div style={{ display:'flex', gap:'0.6rem', marginTop:'0.75rem' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
                style={{ flex:1, textAlign:'center' }}
              >
                🗺️ افتح في الخريطة
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + ' ' + place.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
                style={{ flex:1, textAlign:'center', background:'rgba(26,107,69,0.15)', color:'var(--color-primary-light)' }}
              >
                🧭 الاتجاهات
              </a>
            </div>
          </div>

          {/* الميزات */}
          {place.features?.length > 0 && (
            <div className="sidebar-card">
              <p className="sidebar-card__title">✅ المميزات والخدمات</p>
              <div className="features-list">
                {place.features.map((f, i) => (
                  <div key={i} className="feature-item">
                    <span className="feature-item__dot" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── مودال الحجز ─── */}
      {showBooking && (
        <BookingModal place={place} onClose={() => setShowBooking(false)} />
      )}
    </div>
  )
}
