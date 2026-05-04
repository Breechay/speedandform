import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut as authSignOut } from '../api/auth'

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '–'

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await authSignOut(); setUser(null)
    navigate('/forge/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        height: 50,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-rule)',
        display: 'flex', alignItems: 'center',
        padding: '0 36px', gap: 40,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Wordmark */}
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 13, fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
        }}>Forge</span>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {[['Roster', '/forge/roster'], ['Programs', '/forge/programs']].map(([label, path]) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--color-ink)' : 'var(--color-dim)',
              background: isActive ? 'var(--color-bg)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 100ms',
              letterSpacing: '0.01em',
            })}>{label}</NavLink>
          ))}
        </nav>

        {/* Avatar */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: menuOpen ? 'var(--color-accent)' : 'var(--color-accent-dim)',
              border: '1.5px solid var(--color-accent-mid)',
              color: menuOpen ? '#fff' : 'var(--color-accent)',
              fontSize: 10, fontWeight: 700,
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 120ms',
            }}
          >{initials}</button>

          {menuOpen && (
            <div className="dropdown" style={{ right: 0, top: 38, minWidth: 180 }}>
              {/* Name row */}
              {user && (
                <div style={{
                  padding: '11px 14px 9px',
                  borderBottom: '1px solid var(--color-rule-light)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 1 }}>
                    {user.email}
                  </p>
                </div>
              )}
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/forge/settings') }}>
                Settings
              </button>
              <button className="dropdown-item danger" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
