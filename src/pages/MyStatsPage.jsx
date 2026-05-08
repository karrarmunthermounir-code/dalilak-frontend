import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STATS_KEY    = 'dalilak_place_stats'
const BOOKINGS_KEY = 'dalilak_table_bookings'

// بيانات افتراضية للإحصائيات
const defaultStats = () => ({
  views:     Math.floor(Math.random() * 200) + 80,
  calls:     Math.floor(Math.random() * 30)  + 5,
  favorites: Math.floor(Math.random() * 50)  + 10,
  mapClicks: Math.floor(Math.random() * 40)  + 8,
  viewsHistory: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('ar-IQ', { day:'2-digit', month:'2-digit' }),
    views: Math.floor(Math.random() * 40) + 10,
  })),
})

const loadStats    = () => { try { return JSON.parse(localStorage.getItem(STATS_KEY)) || defaultStats() } catch { return defaultStats() } }
const loadBookings = () => { try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]') } catch { return [] } }

const STATUS_COLORS = { pending:'#f59e0b', confirmed:'#22c55e', cancelled:'#ef4444' }
const STATUS_LABELS = { pending:'بانتظار التأكيد', confirmed:'مؤكد', cancelled:'ملغي' }

export default function MyStatsPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [stats,    setStats]    = useState(loadStats)
  const [bookings, setBookings] = useState(loadBookings)
  const [tab,      setTab]      = useState('stats')   // stats | bookings
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    // احفظ الإحصائيات إن لم تكن موجودة
    if (!localStorage.getItem(STATS_KEY)) {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    }
  }, [])

  useEffect(() => {
    setNewCount(bookings.filter(b => b.status === 'pending').length)
  }, [bookings])

  const updateStatus = (id, newStatus) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b)
    setBookings(updated)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated))
    return updated.find(b => b.id === id)
  }

  // إبلاغ الزبون عبر واتساب بعد التأكيد أو الإلغاء
  const notifyCustomer = (booking, status) => {
    if (!booking?.phone) return
    const raw  = booking.phone.replace(/[^0-9]/g, '')
    const intl = raw.startsWith('964') ? raw : '964' + raw.replace(/^0/, '')
    const myPlace = (() => { try { return JSON.parse(localStorage.getItem('dalilak_my_place') || 'null') } catch { return null } })()
    const placeName = myPlace?.name || booking.placeName || 'المكان'
    const msg = status === 'confirmed'
      ? encodeURIComponent(
          `✅ تم تأكيد حجزك!\n` +
          `المكان: ${placeName}\n` +
          `التاريخ: ${booking.date} الساعة ${booking.time}\n` +
          `عدد الأشخاص: ${booking.guests}\n` +
          `――――――――\n` +
          `نتطلع لزيارتك! 😊`
        )
      : encodeURIComponent(
          `❌ نعتذر منك، تم إلغاء حجزك.\n` +
          `المكان: ${placeName}\n` +
          `التاريخ: ${booking.date} الساعة ${booking.time}\n` +
          `――――――――\n` +
          `يمكنك إعادة الحجز في وقت آخر.`
        )
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank')
  }

  // محاكاة حجز جديد (للتجربة)
  const simulateBooking = () => {
    const names  = ['أحمد علي', 'محمد حسن', 'علي كريم', 'سارة محمود', 'فاطمة عباس']
    const times  = ['7:00 م', '7:30 م', '8:00 م', '8:30 م', '9:00 م']
    const newB = {
      id:      Date.now().toString(),
      name:    names[Math.floor(Math.random() * names.length)],
      phone:   '07' + Math.floor(Math.random() * 900000000 + 100000000),
      guests:  Math.floor(Math.random() * 5) + 1,
      time:    times[Math.floor(Math.random() * times.length)],
      date:    new Date().toLocaleDateString('ar-IQ'),
      notes:   '',
      status:  'pending',
    }
    const updated = [newB, ...bookings]
    setBookings(updated)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated))
  }

  if (!isLoggedIn) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <button onClick={() => navigate('/auth')} style={{ padding:'0.7rem 1.5rem', borderRadius:'12px', border:'none', background:'var(--color-primary)', color:'#fff', cursor:'pointer', fontFamily:'var(--font-main)' }}>
        تسجيل الدخول
      </button>
    </div>
  )

  const maxV = Math.max(...stats.viewsHistory.map(d => d.views), 1)

  return (
    <main style={{ background:'var(--bg-dark)', minHeight:'100vh' }}>
      <header style={{
        background:'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding:'1rem', position:'sticky', top:0, zIndex:100,
        borderBottom:'1px solid var(--border-color)', backdropFilter:'blur(12px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.8rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'12px',
            padding:'0.5rem 0.7rem', color:'var(--text-primary)', cursor:'pointer',
          }}>◀</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>📊 إحصائيات مكاني</h1>
            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>آخر 7 أيام</p>
          </div>
          {/* زر محاكاة حجز للاختبار */}
          <button onClick={simulateBooking} style={{
            background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)',
            borderRadius:'10px', padding:'0.4rem 0.7rem',
            color:'#25D366', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
          }}>+ حجز تجريبي</button>
        </div>

        {/* تبويبات */}
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {[
            { key:'stats', label:'📈 الإحصائيات' },
            { key:'bookings', label:`🪑 الحجوزات${newCount > 0 ? ` (${newCount})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, padding:'0.45rem', borderRadius:'10px', border:'none',
              fontFamily:'var(--font-main)', fontWeight:700, fontSize:'0.78rem', cursor:'pointer',
              background: tab === t.key
                ? 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))'
                : 'rgba(255,255,255,0.07)',
              color: tab === t.key ? '#000' : 'var(--text-muted)',
            }}>{t.label}</button>
          ))}
        </div>
      </header>

      <div style={{ padding:'1rem', paddingBottom:'5rem' }}>

        {/* ─── تبويب الإحصائيات ─── */}
        {tab === 'stats' && (
          <>
            {/* بطاقات الأرقام */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.7rem', marginBottom:'1rem' }}>
              {[
                { icon:'👁️', label:'مشاهدات', value:stats.views,     color:'var(--color-primary-light)', bg:'rgba(26,107,69,0.15)' },
                { icon:'📞', label:'نقرات الاتصال', value:stats.calls,     color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
                { icon:'❤️', label:'في المفضلة', value:stats.favorites, color:'#fb7185', bg:'rgba(251,113,133,0.12)' },
                { icon:'📍', label:'نقرات الخريطة', value:stats.mapClicks, color:'var(--color-accent-light)', bg:'rgba(201,151,58,0.12)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background:'var(--bg-card)', border:'1px solid var(--border-color)',
                  borderRadius:'16px', padding:'1rem', textAlign:'center',
                }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.2rem' }}>{s.icon}</div>
                  <div style={{ fontSize:'1.6rem', fontWeight:900, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* رسم بياني */}
            <div style={{
              background:'var(--bg-card)', border:'1px solid var(--border-color)',
              borderRadius:'18px', padding:'1.2rem', marginBottom:'1rem',
            }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'1rem' }}>
                📈 المشاهدات — آخر 7 أيام
              </h3>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'0.4rem', height:'100px', direction:'ltr' }}>
                {stats.viewsHistory.map((d, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem', height:'100%', justifyContent:'flex-end' }}>
                    <span style={{ fontSize:'0.58rem', color:'var(--text-muted)', fontWeight:700 }}>{d.views}</span>
                    <div style={{
                      width:'100%', borderRadius:'5px 5px 0 0',
                      height:`${(d.views / maxV) * 100}%`,
                      background: i === 6
                        ? 'linear-gradient(to top,var(--color-accent),var(--color-accent-light))'
                        : 'linear-gradient(to top,var(--color-primary),var(--color-primary-light))',
                      transition:'height 0.4s ease',
                    }} />
                    <span style={{ fontSize:'0.5rem', color:'var(--text-muted)', textAlign:'center' }}>{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* إحصائيات الحجوزات */}
            <div style={{
              background:'var(--bg-card)', border:'1px solid var(--border-color)',
              borderRadius:'18px', padding:'1.2rem', marginBottom:'1rem',
            }}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.8rem' }}>🪑 ملخص الحجوزات</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
                {[
                  { label:'إجمالي', value:bookings.length, color:'var(--text-primary)' },
                  { label:'مؤكد', value:bookings.filter(b => b.status === 'confirmed').length, color:'#22c55e' },
                  { label:'بانتظار', value:bookings.filter(b => b.status === 'pending').length, color:'#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign:'center', padding:'0.7rem', borderRadius:'12px', background:'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize:'1.3rem', fontWeight:900, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* نصائح */}
            <div style={{
              background:'rgba(26,107,69,0.08)', border:'1px solid rgba(26,107,69,0.2)',
              borderRadius:'16px', padding:'1rem',
            }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--color-primary-light)', marginBottom:'0.7rem' }}>
                💡 نصائح لزيادة الزوار
              </h3>
              {[
                'أضف صوراً جديدة باستمرار لجذب الانتباه',
                'فعّل عروضاً وخصومات في أوقات الذروة',
                'أكمل قائمة الطعام بالأسعار والصور',
                'شارك رابط مكانك على وسائل التواصل',
              ].map((tip, i) => (
                <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.4rem', alignItems:'flex-start' }}>
                  <span style={{ color:'#5dde8a', flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── تبويب الحجوزات ─── */}
        {tab === 'bookings' && (
          <>
            {newCount > 0 && (
              <div style={{
                background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.35)',
                borderRadius:'14px', padding:'0.9rem 1rem', marginBottom:'1rem',
                display:'flex', alignItems:'center', gap:'0.7rem',
              }}>
                <span style={{ fontSize:'1.4rem' }}>🔔</span>
                <div>
                  <p style={{ fontSize:'0.88rem', fontWeight:800, color:'#f59e0b' }}>
                    {newCount} حجز جديد بانتظار تأكيدك
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                    راجع الحجوزات وأكّد أو ألغِ
                  </p>
                </div>
              </div>
            )}

            {bookings.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                <div style={{ fontSize:'3.5rem', marginBottom:'0.8rem' }}>🪑</div>
                <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.4rem' }}>لا يوجد حجوزات بعد</p>
                <p style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                  حين يحجز الزوار طاولة ستظهر هنا
                </p>
                <button onClick={simulateBooking} style={{
                  marginTop:'1rem', padding:'0.7rem 1.5rem', borderRadius:'12px',
                  background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)',
                  color:'#25D366', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)', fontSize:'0.85rem',
                }}>تجربة حجز وهمي</button>
              </div>
            ) : (
              bookings.map(b => (
                <div key={b.id} style={{
                  background:'var(--bg-card)', border:`1px solid ${STATUS_COLORS[b.status]}33`,
                  borderRadius:'16px', padding:'1rem', marginBottom:'0.8rem',
                }}>
                  {/* رأس البطاقة */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.6rem' }}>
                    <div>
                      <p style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--text-primary)' }}>{b.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', direction:'ltr', textAlign:'right' }}>{b.phone}</p>
                    </div>
                    <span style={{
                      fontSize:'0.65rem', fontWeight:800, padding:'0.2rem 0.6rem',
                      borderRadius:'99px', background:`${STATUS_COLORS[b.status]}22`,
                      color:STATUS_COLORS[b.status], border:`1px solid ${STATUS_COLORS[b.status]}44`,
                    }}>{STATUS_LABELS[b.status]}</span>
                  </div>

                  {/* تفاصيل */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.4rem', marginBottom:'0.7rem' }}>
                    {[
                      { icon:'📅', val:b.date },
                      { icon:'🕐', val:b.time },
                      { icon:'👥', val:`${b.guests} أشخاص` },
                    ].map((d, i) => (
                      <div key={i} style={{ textAlign:'center', padding:'0.4rem', borderRadius:'8px', background:'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize:'0.85rem' }}>{d.icon}</div>
                        <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', fontWeight:600 }}>{d.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* أزرار الإجراءات */}
                  {b.status === 'pending' && (
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button onClick={() => {
                        const updated = updateStatus(b.id, 'confirmed')
                        notifyCustomer(updated, 'confirmed')
                      }} style={{
                        flex:1, padding:'0.55rem', borderRadius:'10px', border:'none',
                        background:'rgba(34,197,94,0.15)', color:'#22c55e',
                        fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-main)',
                      }}>✅ تأكيد + إبلاغ الزبون</button>
                      <button onClick={() => {
                        const updated = updateStatus(b.id, 'cancelled')
                        notifyCustomer(updated, 'cancelled')
                      }} style={{
                        flex:1, padding:'0.55rem', borderRadius:'10px', border:'none',
                        background:'rgba(239,68,68,0.12)', color:'#ef4444',
                        fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-main)',
                      }}>❌ إلغاء + إبلاغ الزبون</button>
                    </div>
                  )}
                  {b.status !== 'pending' && (
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <span style={{ flex:1, textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                        تم {b.status === 'confirmed' ? '✅ تأكيد' : '❌ إلغاء'} الحجز
                      </span>
                      <button onClick={() => notifyCustomer(b, b.status)} style={{
                        padding:'0.4rem 0.8rem', borderRadius:'8px', border:'none',
                        background:'rgba(37,211,102,0.12)', color:'#25D366',
                        fontSize:'0.7rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-main)',
                        display:'flex', alignItems:'center', gap:'0.3rem', flexShrink:0,
                      }}>📲 إرسال واتساب</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </main>
  )
}
