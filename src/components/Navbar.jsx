import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location        = useLocation()
  const navigate        = useNavigate()
  const { user, logout, isLoggedIn } = useAuth()
  const path            = location.pathname
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  // أغلق القائمة عند الضغط خارجها
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const links = [
    { to: '/',              label: 'الرئيسية' },
    { to: '/map',           label: '🗺️ الخريطة' },
    { to: '/subscriptions', label: '💎 الاشتراكات' },
    { to: '/admin',         label: '➕ أضف مكانك' },
    { to: '/download',      label: '📲 حمّل التطبيق' },
  ]

  const handleLogout = () => {
    logout()
    setDropOpen(false)
    navigate('/')
  }

  return (
    <nav className="navbar">
      {/* الشعار */}
      <Link to="/" className="navbar__logo">
        🌴 <span>دليلك</span>
      </Link>

      {/* روابط التنقل */}
      <ul className="navbar__links">
        {links.map(lnk => (
          <li key={lnk.to}>
            <Link to={lnk.to} style={{ color: path === lnk.to ? 'var(--color-accent)' : '' }}>
              {lnk.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* قسم المستخدم */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
        {isLoggedIn ? (
          /* ─── قائمة المستخدم ─── */
          <div ref={dropRef} style={{ position:'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                background:'rgba(26,107,69,0.2)', border:'1px solid var(--border-color)',
                borderRadius:'var(--radius-full)', padding:'0.4rem 0.9rem 0.4rem 0.5rem',
                cursor:'pointer', color:'var(--text-primary)', fontFamily:'var(--font-main)',
                fontWeight:600, fontSize:'0.88rem', transition:'all 0.2s',
              }}
            >
              {/* أفاتار */}
              <div style={{
                width:'32px', height:'32px', borderRadius:'50%',
                background:'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:800, fontSize:'0.9rem', flexShrink:0,
              }}>
                {user.avatar}
              </div>
              <span style={{ maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.name.split(' ')[0]}
              </span>
              <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', transition:'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>

            {/* القائمة المنسدلة */}
            {dropOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', left:0,
                background:'var(--bg-card)', border:'1px solid var(--border-color)',
                borderRadius:'var(--radius-lg)', minWidth:'180px', overflow:'hidden',
                boxShadow:'0 16px 40px rgba(0,0,0,0.4)', zIndex:9999,
                animation:'fadeIn 0.15s ease',
              }}>
                {/* معلومات المستخدم */}
                <div style={{
                  padding:'1rem', borderBottom:'1px solid var(--border-color)',
                  background:'rgba(0,0,0,0.1)',
                }}>
                  <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:'0.92rem', marginBottom:'0.2rem' }}>
                    {user.name}
                  </p>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', direction:'ltr', textAlign:'right' }}>
                    {user.identifier}
                  </p>
                </div>

                {/* روابط */}
                {[
                  { icon:'➕', label:'أضف مكانك', to:'/admin' },
                  { icon:'💎', label:'الاشتراكات', to:'/subscriptions' },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    onClick={() => setDropOpen(false)}
                    style={{
                      display:'flex', alignItems:'center', gap:'0.7rem',
                      padding:'0.75rem 1rem', color:'var(--text-secondary)',
                      fontSize:'0.88rem', fontWeight:600, textDecoration:'none',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}

                <div style={{ borderTop:'1px solid var(--border-color)' }}>
                  <button onClick={handleLogout} style={{
                    display:'flex', alignItems:'center', gap:'0.7rem', width:'100%',
                    padding:'0.75rem 1rem', background:'transparent', border:'none',
                    color:'#ff9090', fontSize:'0.88rem', fontWeight:600, cursor:'pointer',
                    fontFamily:'var(--font-main)', textAlign:'right',
                    transition:'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(200,60,60,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <span>🚪</span> تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── زر تسجيل الدخول ─── */
          <Link to="/auth" style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            color: '#fff', borderRadius: 'var(--radius-full)',
            padding: '0.45rem 1.2rem', fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            🔑 دخول
          </Link>
        )}
      </div>
    </nav>
  )
}
