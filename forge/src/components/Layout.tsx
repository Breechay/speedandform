import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Topbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 52,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-rule)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: 32,
      }}>
        {/* Wordmark */}
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-ink)',
          letterSpacing: '0.04em',
        }}>FORGE</span>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[['Roster', '/forge/roster'], ['Programs', '/forge/programs']].map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              style={({ isActive }) => ({
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? 'var(--color-ink)' : 'var(--color-chrome)',
                background: isActive ? 'var(--color-bg)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 120ms',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Avatar menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
            }}
          >BC</button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 40,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              minWidth: 160,
              overflow: 'hidden',
              zIndex: 50,
            }}>
              {[['Settings', '/forge/settings'], ['Sign out', '/forge/login']].map(([label, path]) => (
                <button
                  key={label}
                  onClick={() => { setMenuOpen(false); navigate(path) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: label === 'Sign out' ? '#D85A30' : 'var(--color-ink)',
                    borderBottom: label === 'Settings' ? '1px solid var(--color-rule-light)' : 'none',
                  }}
                >{label}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
