import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAthleteStore } from '../../store/athleteStore'
import { getAthleteProfile, athleteSignOut } from '../../api/athleteInvite'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#F0EDE6', surface: '#FAFAF7', ink: '#1A1710',
  accent: '#8C6029', dim: '#998F85', rule: '#DDD9D0',
  accentDim: 'rgba(140,96,41,0.10)', accentMid: 'rgba(140,96,41,0.22)',
  chrome: '#6B6660',
}

export function AthleteDashboard() {
  const navigate = useNavigate()
  const { athlete, setAthlete, setLoading } = useAthleteStore()

  // Bootstrap session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate('/forge/athlete/login', { replace: true }); return }
      try {
        const profile = await getAthleteProfile(session.user.id)
        setAthlete(profile)
      } catch {
        navigate('/forge/athlete/login', { replace: true })
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const handleSignOut = async () => {
    await athleteSignOut()
    setAthlete(null)
    navigate('/forge/athlete/login', { replace: true })
  }

  if (!athlete) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 32 }}>
          {[11, 15, 19, 22, 26].map((h, i) => (
            <div key={i} style={{
              width: 5, height: h, borderRadius: 2.5, background: C.accent,
              transformOrigin: 'bottom',
              animation: `forge-pulse 1s ease-in-out ${i * 80}ms infinite`,
            }} />
          ))}
          <style>{`@keyframes forge-pulse{0%,100%{opacity:.25;transform:scaleY(.75)}50%{opacity:1;transform:scaleY(1)}}`}</style>
        </div>
      </div>
    )
  }

  const hasInvite = !athlete.slug  // no slug = not yet connected to a coach

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        height: 50, background: C.surface,
        borderBottom: `1px solid ${C.rule}`,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <svg width="20" height="16" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0"    y="20.8" width="5" height="11.2" rx="2.5" fill={C.accent}/>
            <rect x="8.8"  y="17.2" width="5" height="14.8" rx="2.5" fill={C.accent}/>
            <rect x="17.5" y="13.5" width="5" height="18.5" rx="2.5" fill={C.accent}/>
            <rect x="26.3" y="9.9"  width="5" height="22.1" rx="2.5" fill={C.accent}/>
            <rect x="35"   y="6.4"  width="5" height="25.6" rx="2.5" fill={C.accent}/>
          </svg>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink }}>
            Forge
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: C.dim }}>
            {athlete.firstName} {athlete.lastName}
          </span>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.dim, fontFamily: 'Georgia,serif' }}
          >Sign out</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>

        {/* No coach connected yet */}
        {hasInvite ? (
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 400, color: C.ink, marginBottom: 8 }}>
              {athlete.firstName}.
            </h1>
            <p style={{ fontSize: 13, color: C.dim, marginBottom: 32, lineHeight: 1.6 }}>
              Account created. Enter your invite code to connect with your coach and access your program.
            </p>

            {/* Enter invite code CTA */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.rule}`,
              borderRadius: 10, padding: '24px 22px',
              marginBottom: 16,
            }}>
              <p style={{
                fontFamily: 'Georgia,serif', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: C.dim, marginBottom: 10,
              }}>Connect to coach</p>
              <p style={{ fontSize: 13, color: C.chrome, marginBottom: 16, lineHeight: 1.5 }}>
                Your coach will send you a 6-character code. Enter it below to join their roster.
              </p>
              <button
                onClick={() => navigate('/forge/athlete/invite')}
                style={{
                  height: 38, padding: '0 20px',
                  background: C.accent, color: '#fff',
                  border: 'none', borderRadius: 6,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >Enter invite code →</button>
            </div>

            <p style={{ fontSize: 11, color: C.dim, fontFamily: 'Georgia,serif', fontStyle: 'italic', textAlign: 'center' }}>
              Don't have a code yet? Ask your coach to generate one from their roster.
            </p>
          </div>
        ) : (
          /* Connected — show basic state */
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 400, color: C.ink, marginBottom: 8 }}>
              {athlete.firstName}.
            </h1>
            <p style={{ fontSize: 13, color: C.dim, marginBottom: 32 }}>
              Connected to your coach's roster.
            </p>

            <div style={{
              background: C.accentDim,
              border: `1px solid ${C.accentMid}`,
              borderRadius: 10, padding: '20px 22px',
            }}>
              <p style={{
                fontFamily: 'Georgia,serif', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: C.accent, marginBottom: 8,
              }}>Status</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>
                Roster active · {athlete.slug ?? athlete.email}
              </p>
              <p style={{ fontSize: 12, color: C.dim, fontFamily: 'Georgia,serif', marginTop: 6, fontStyle: 'italic' }}>
                Your coach can see your sessions and assign programs. iOS app sync coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
