import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { AthleteProfile } from '../api/athleteInvite'

const C = {
  bg: '#F0EDE6', surface: '#FAFAF7', ink: '#1A1710',
  accent: '#8C6029', dim: '#998F85', rule: '#DDD9D0',
}

function ForgeMark() {
  return (
    <svg width="20" height="16" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="20.8" width="5" height="11.2" rx="2.5" fill={C.accent} />
      <rect x="8.8" y="17.2" width="5" height="14.8" rx="2.5" fill={C.accent} />
      <rect x="17.5" y="13.5" width="5" height="18.5" rx="2.5" fill={C.accent} />
      <rect x="26.3" y="9.9" width="5" height="22.1" rx="2.5" fill={C.accent} />
      <rect x="35" y="6.4" width="5" height="25.6" rx="2.5" fill={C.accent} />
    </svg>
  )
}

interface AthleteLayoutProps {
  athlete: AthleteProfile
  onSignOut: () => void
  children: ReactNode
}

export function AthleteLayout({ athlete, onSignOut, children }: AthleteLayoutProps) {
  const location = useLocation()
  const isAccount = location.pathname === '/forge/athlete/account'
  const isLedger = location.pathname === '/forge/athlete/ledger'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <header
        style={{
          minHeight: 50,
          background: C.surface,
          borderBottom: `1px solid ${C.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 18px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <ForgeMark />
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink }}>
            Form
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/forge/athlete/account" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: isAccount ? C.ink : C.dim,
              borderBottom: isAccount ? `2px solid ${C.accent}` : '2px solid transparent',
              paddingBottom: 5,
            }}>
              Account
            </span>
          </Link>
          <Link to="/forge/athlete/ledger" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: isLedger ? C.ink : C.dim,
              borderBottom: isLedger ? `2px solid ${C.accent}` : '2px solid transparent',
              paddingBottom: 5,
            }}>
              Ledger
            </span>
          </Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.dim }}>
            {athlete.firstName} {athlete.lastName}
          </span>
          <button
            onClick={onSignOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.dim, fontFamily: 'Georgia,serif' }}
          >
            Sign out
          </button>
        </div>
      </header>

      {children}
    </div>
  )
}
