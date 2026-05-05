import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAthleteStore } from '../../store/athleteStore'
import { getAthleteProfile, athleteSignOut } from '../../api/athleteInvite'
import { supabase } from '../../lib/supabase'
import { AthleteLayout } from '../../components/AthleteLayout'

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
    <AthleteLayout athlete={athlete} onSignOut={handleSignOut}>
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
    </AthleteLayout>
  )
}
