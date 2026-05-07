import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, getStats } from '../context/AuthContext'

const StatCard = ({ icon, label, value, change, color = 'var(--color-primary-light)' }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: '16px', padding: '1rem', textAlign: 'center',
  }}>
    <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value?.toLocaleString()}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
    {change !== undefined && (
      <div style={{ fontSize: '0.68rem', fontWeight: 700, marginTop: '0.3rem', color: change >= 0 ? '#5dde8a' : '#ff9090' }}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% هذا الأسبوع
      </div>
    )}
  </div>
)

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, canAccessAnalytics } = useAuth()
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    if (isLoggedIn) {
      const placeId = user?.businessId || user?.id || 'default'
      getStats(placeId).then(s => {
        if (s) setStats(s)
      })
    }
  }, [isLoggedIn, user])

  if (!isLoggedIn || !canAccessAnalytics) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>ميزة Premium</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.8rem', lineHeight: 1.6 }}>
            الإحصائيات التفصيلية متاحة في خطة Premium فقط
          </p>
          <div style={{ background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: '14px', padding: '0.9rem', marginBottom: '1.2rem', textAlign: 'right' }}>
            {['عدد المشاهدات اليومية', 'نقرات الاتصال والخريطة', 'إحصائيات المفضلة', 'رسوم بيانية تفاعلية', 'تقارير أسبوعية'].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                {f} <span style={{ color: '#5dde8a' }}>✓</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/subscriptions')} style={{
            width: '100%', padding: '0.85rem', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))',
            color: '#000', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-main)', cursor: 'pointer',
          }}>💎 ترقية إلى Premium</button>
          <button onClick={() => navigate('/dashboard')} style={{
            marginTop: '0.8rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-main)',
          }}>← لوحة التحكم</button>
        </div>
      </div>
    )
  }

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <header style={{
        background: 'linear-gradient(180deg,var(--color-primary-dark),var(--bg-dark))',
        padding: '1.2rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px',
            padding: '0.5rem 0.7rem', color: 'var(--text-primary)', cursor: 'pointer',
          }}>◀</button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>📊 الإحصائيات</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>آخر تحديث: اليوم</p>
          </div>
        </div>

        {/* فلتر الفترة */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[{ v: 'week', l: 'أسبوع' }, { v: 'month', l: 'شهر' }, { v: 'year', l: 'سنة' }].map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)} style={{
              padding: '0.35rem 1rem', borderRadius: '99px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.78rem',
              background: period === p.v ? 'linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))' : 'rgba(255,255,255,0.07)',
              color: period === p.v ? '#000' : 'var(--text-muted)',
            }}>{p.l}</button>
          ))}
        </div>
      </header>

      <div style={{ padding: '1rem', paddingBottom: '5rem' }}>

        {stats && (
          <>
            {/* بطاقات الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.2rem' }}>
              <StatCard icon="👁️" label="إجمالي المشاهدات"  value={stats.views}     change={12}  color="var(--color-primary-light)" />
              <StatCard icon="🖱️" label="نقرات على المكان"   value={stats.clicks}    change={8}   color="var(--color-accent-light)" />
              <StatCard icon="❤️"  label="في المفضلة"         value={stats.favorites} change={-3}  color="#fb7185" />
              <StatCard icon="📞" label="نقرات الاتصال"      value={stats.bookings}  change={22}  color="#a78bfa" />
            </div>

            {/* رسم بياني بسيط */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '18px', padding: '1.2rem', marginBottom: '1rem',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                📈 المشاهدات — آخر 7 أيام
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: '100px', direction: 'ltr' }}>
                {stats.viewsHistory.map((d, i) => {
                  const maxV = Math.max(...stats.viewsHistory.map(x => x.views))
                  const pct  = (d.views / maxV) * 100
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{d.views}</span>
                      <div style={{
                        width: '100%', borderRadius: '6px 6px 0 0',
                        height: `${pct}%`,
                        background: i === 6
                          ? 'linear-gradient(to top,var(--color-accent),var(--color-accent-light))'
                          : 'linear-gradient(to top,var(--color-primary),var(--color-primary-light))',
                        transition: 'height 0.3s ease',
                      }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center' }}>{d.date.slice(0,5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* توزيع المصادر */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '18px', padding: '1.2rem', marginBottom: '1rem',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.9rem' }}>🗂️ مصادر الزوار</h3>
              {[
                { label: 'بحث داخل دليلك', pct: 52, color: 'var(--color-primary)' },
                { label: 'مشاركات خارجية', pct: 28, color: 'var(--color-accent)' },
                { label: 'تصفّح التصنيفات', pct: 13, color: '#a78bfa' },
                { label: 'خريطة الأماكن',   pct:  7, color: '#fb7185' },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* نصائح لتحسين الأداء */}
            <div style={{
              background: 'rgba(26,107,69,0.08)', border: '1px solid rgba(26,107,69,0.2)',
              borderRadius: '16px', padding: '1rem',
            }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary-light)', marginBottom: '0.7rem' }}>
                💡 نصائح لزيادة مشاهداتك
              </h3>
              {[
                'أضف صوراً عالية الجودة (الأماكن ذات 5+ صور تحصل على 3× مشاهدات)',
                'فعّل عروض وخصومات لجذب الزبائن الجدد',
                'أضف قائمة الطعام الكاملة مع الأسعار والصور',
                'رُدّ على التقييمات لبناء الثقة',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#5dde8a', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
