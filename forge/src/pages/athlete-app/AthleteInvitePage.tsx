import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { lookupInviteCode, acceptInvite } from '../../api/athleteInvite'
import { useAthleteStore } from '../../store/athleteStore'
import { supabase } from '../../lib/supabase'
import type { InviteLookup } from '../../api/athleteInvite'

const C = {
  bg: '#F0EDE6', surface: '#FAFAF7', ink: '#1A1710',
  accent: '#8C6029', dim: '#998F85', rule: '#DDD9D0',
  error: '#C94F2A', success: '#2D6645', chrome: '#6B6660',
  accentDim: 'rgba(140,96,41,0.10)', accentMid: 'rgba(140,96,41,0.22)',
}

export function AthleteInvitePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const athlete = useAthleteStore(s => s.athlete)

  const [code,     setCode]     = useState(params.get('code')?.toUpperCase() ?? '')
  const [invite,   setInvite]   = useState<InviteLookup | null>(null)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState<'enter-code' | 'confirm' | 'done'>('enter-code')

  // Auto-lookup if code came from URL
  useEffect(() => {
    if (params.get('code') && athlete) {
      handleLookup(params.get('code')!)
    }
  }, [athlete])

  const handleLookup = async (codeVal?: string) => {
    const c = (codeVal ?? code).toUpperCase().trim()
    if (!c || c.length < 6) { setError('Enter a 6-character code.'); return }
    setLoading(true); setError('')
    try {
      const result = await lookupInviteCode(c)
      if (result.isExpired) { setError('This invite has expired. Ask your coach for a new one.'); return }
      if (result.isUsed)    { setError('This invite has already been used.'); return }
      setInvite(result)
      setStep('confirm')
    } catch {
      setError('Code not found. Check with your coach.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invite || !athlete) return
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in.')
      await acceptInvite(invite.id, user.id, invite.coachId, invite.athleteSlug)
      setStep('done')
      setTimeout(() => navigate('/forge/athlete/ledger', { replace: true }), 1800)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite.')
    } finally {
      setLoading(false)
    }
  }

  const wrap: React.CSSProperties = {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 16px', fontFamily: "'DM Sans', system-ui, sans-serif",
  }
  const card: React.CSSProperties = {
    width: '100%', maxWidth: 400,
    background: C.surface, border: `1px solid ${C.rule}`,
    borderRadius: 8, padding: '36px 32px',
  }

  // Not signed in — redirect to login with code
  if (!athlete) {
    return (
      <div style={wrap}>
        <div style={card}>
          <p style={{ fontSize: 14, color: C.ink, marginBottom: 16 }}>
            Sign in to accept your invite.
          </p>
          <button
            onClick={() => navigate(`/forge/athlete/login${code ? `?invite=${code}` : ''}`)}
            style={{
              height: 38, width: '100%', background: C.accent, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >Sign in →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={card}>
        {/* Mark */}
        <svg width="26" height="20" viewBox="0 0 40 32" fill="none"
          xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginBottom: 8 }}>
          <rect x="0" y="20.8" width="5" height="11.2" rx="2.5" fill={C.accent}/>
          <rect x="8.8" y="17.2" width="5" height="14.8" rx="2.5" fill={C.accent}/>
          <rect x="17.5" y="13.5" width="5" height="18.5" rx="2.5" fill={C.accent}/>
          <rect x="26.3" y="9.9" width="5" height="22.1" rx="2.5" fill={C.accent}/>
          <rect x="35" y="6.4" width="5" height="25.6" rx="2.5" fill={C.accent}/>
        </svg>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink, marginBottom: 2 }}>Forge</div>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, color: C.dim, marginBottom: 20 }}>
          {step === 'done' ? 'Connected.' : 'Accept invite'}
        </div>
        <div style={{ height: 1, background: C.rule, marginBottom: 24 }} />

        {/* Step: enter code */}
        {step === 'enter-code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: C.dim }}>
              Enter the 6-character code from your coach.
            </p>
            <input
              autoFocus
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{
                height: 52, width: '100%', padding: '0 16px',
                background: C.bg, border: `1.5px solid ${C.rule}`,
                borderRadius: 6, fontSize: 28, fontWeight: 700,
                color: C.ink, outline: 'none', letterSpacing: '0.3em',
                textAlign: 'center', fontFamily: 'Georgia, serif',
                boxSizing: 'border-box',
              }}
              placeholder="––––––"
            />
            {error && <p style={{ fontSize: 13, color: C.error }}>{error}</p>}
            <button
              onClick={() => handleLookup()}
              disabled={loading || code.length < 6}
              style={{
                height: 38, background: code.length >= 6 ? C.accent : C.dim,
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 600, cursor: code.length >= 6 ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >{loading ? 'Looking up…' : 'Continue →'}</button>
          </div>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && invite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '14px 16px',
              background: C.accentDim,
              border: `1px solid ${C.accentMid}`,
              borderRadius: 6,
            }}>
              <p style={{ fontSize: 9, fontFamily: 'Georgia,serif', color: C.dim, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Invite from
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
                {invite.label ?? 'Your coach'}
              </p>
              {invite.athleteSlug && (
                <p style={{ fontSize: 12, color: C.dim, fontFamily: 'Georgia,serif', marginTop: 4 }}>
                  Linked profile: {invite.athleteSlug}
                </p>
              )}
            </div>

            <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>
              Accepting this invite will add you to their roster. Your training sessions and programs will be visible to your coach.
            </p>

            {error && <p style={{ fontSize: 13, color: C.error }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setStep('enter-code'); setInvite(null) }}
                style={{
                  flex: 1, height: 38, background: 'transparent',
                  border: `1px solid ${C.rule}`, borderRadius: 6,
                  fontSize: 13, color: C.chrome, cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >Back</button>
              <button
                onClick={handleAccept}
                disabled={loading}
                style={{
                  flex: 2, height: 38,
                  background: loading ? C.dim : C.accent,
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >{loading ? 'Connecting…' : 'Accept invite →'}</button>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 15, fontWeight: 500, color: C.ink, fontFamily: 'Georgia,serif' }}>
              Connected.
            </p>
            <p style={{ fontSize: 12, color: C.dim, fontFamily: 'Georgia,serif', marginTop: 6, fontStyle: 'italic' }}>
              Redirecting…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
