import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { athleteSignIn, athleteSignUp, getAthleteProfile } from '../../api/athleteInvite'
import { useAthleteStore } from '../../store/athleteStore'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#F0EDE6', surface: '#FAFAF7', ink: '#1A1710',
  accent: '#8C6029', dim: '#998F85', rule: '#DDD9D0',
  error: '#C94F2A', chrome: '#6B6660',
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
const inputStyle: React.CSSProperties = {
  height: 38, width: '100%', padding: '0 12px',
  background: C.surface, border: `1px solid ${C.rule}`,
  borderRadius: 4, fontSize: 14, color: C.ink,
  outline: 'none', boxSizing: 'border-box',
}
const btnStyle = (disabled: boolean): React.CSSProperties => ({
  height: 38, width: '100%', marginTop: 8,
  background: disabled ? C.dim : C.accent,
  color: '#fff', border: 'none', borderRadius: 6,
  fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'DM Sans', system-ui, sans-serif",
})
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Georgia, serif',
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: C.dim, marginBottom: 6,
}

function ForgeMark() {
  return (
    <svg width="26" height="20" viewBox="0 0 40 32" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginBottom: 8 }}>
      <rect x="0"    y="20.8" width="5" height="11.2" rx="2.5" fill={C.accent}/>
      <rect x="8.8"  y="17.2" width="5" height="14.8" rx="2.5" fill={C.accent}/>
      <rect x="17.5" y="13.5" width="5" height="18.5" rx="2.5" fill={C.accent}/>
      <rect x="26.3" y="9.9"  width="5" height="22.1" rx="2.5" fill={C.accent}/>
      <rect x="35"   y="6.4"  width="5" height="25.6" rx="2.5" fill={C.accent}/>
    </svg>
  )
}

export function AthleteLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteCode = params.get('invite') ?? ''
  const setAthlete = useAthleteStore(s => s.setAthlete)

  const [mode, setMode] = useState<'checking' | 'login' | 'signup' | 'set-password'>('checking')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Check hash for recovery/invite tokens
  useEffect(() => {
    const hash = window.location.hash
    const p = new URLSearchParams(hash.replace('#', ''))
    const type = p.get('type')
    const accessToken = p.get('access_token')
    const refreshToken = p.get('refresh_token')

    if ((type === 'recovery' || type === 'invite' || type === 'signup') && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      }).then(() => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setMode('set-password')
      }).catch(() => setMode('login'))
    } else {
      setMode('login')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const profile = await athleteSignIn(email, password)
      setAthlete(profile)
      // If came from invite link, redirect to accept
      if (inviteCode) {
        navigate(`/forge/athlete/invite?code=${inviteCode}`, { replace: true })
      } else {
        navigate('/forge/athlete/ledger', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError('Name required.'); return }
    if (password.length < 8) { setError('Password must be 8+ characters.'); return }
    setLoading(true); setError('')
    try {
      const profile = await athleteSignUp(email, password, firstName.trim(), lastName.trim())
      setAthlete(profile)
      if (inviteCode) {
        navigate(`/forge/athlete/invite?code=${inviteCode}`, { replace: true })
      } else {
        navigate('/forge/athlete/ledger', { replace: true })
      }
    } catch (err: any) {
      setError(err.message?.includes('already registered')
        ? 'Email already in use. Sign in instead.'
        : err.message || 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 8) { setError('8+ characters required.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await supabase.auth.updateUser({ password: newPw })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profile = await getAthleteProfile(user.id)
        setAthlete(profile)
        navigate('/forge/athlete/ledger', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set password.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'checking') {
    return (
      <div style={{ ...wrap }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 32 }}>
          {[11, 15, 19, 22, 26].map((h, i) => (
            <div key={i} style={{
              width: 5, height: h, borderRadius: 2.5,
              background: C.accent, transformOrigin: 'bottom',
              animation: `forge-pulse 1s ease-in-out ${i * 80}ms infinite`,
            }} />
          ))}
          <style>{`@keyframes forge-pulse { 0%,100%{opacity:.25;transform:scaleY(.75)} 50%{opacity:1;transform:scaleY(1)} }`}</style>
        </div>
      </div>
    )
  }

  if (mode === 'set-password') {
    return (
      <div style={wrap}>
        <div style={card}>
          <ForgeMark />
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink, marginBottom: 2 }}>Forge</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, color: C.dim, marginBottom: 20 }}>Set your password</div>
          <div style={{ height: 1, background: C.rule, marginBottom: 24 }} />
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input type="password" autoFocus style={inputStyle} value={newPw}
                onChange={e => setNewPw(e.target.value)} placeholder="8+ characters" required
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.rule)} />
            </div>
            <div>
              <label style={labelStyle}>Confirm</label>
              <input type="password" style={inputStyle} value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" required
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.rule)} />
            </div>
            {error && <p style={{ fontSize: 13, color: C.error }}>{error}</p>}
            <button type="submit" style={btnStyle(loading)} disabled={loading}>
              {loading ? 'Setting…' : 'Set password →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <ForgeMark />
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink, marginBottom: 2 }}>Forge</div>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, color: C.dim, marginBottom: 20 }}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </div>
        <div style={{ height: 1, background: C.rule, marginBottom: 24 }} />

        {/* Mode toggle */}
        <div style={{ display: 'flex', marginBottom: 20, background: C.bg, borderRadius: 6, padding: 2 }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, height: 30, border: 'none', cursor: 'pointer', borderRadius: 4,
                fontSize: 12, fontWeight: mode === m ? 500 : 400,
                background: mode === m ? C.surface : 'transparent',
                color: mode === m ? C.ink : C.dim,
                boxShadow: mode === m ? '0 1px 3px rgba(26,23,16,0.08)' : 'none',
                transition: 'all 100ms', fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >{m === 'login' ? 'Sign in' : 'Create account'}</button>
          ))}
        </div>

        <form
          onSubmit={mode === 'signup' ? handleSignup : handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)}
                  required placeholder="First"
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.rule)} />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)}
                  required placeholder="Last"
                  onFocus={e => (e.target.style.borderColor = C.accent)}
                  onBlur={e => (e.target.style.borderColor = C.rule)} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" autoComplete="email" style={inputStyle} value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.rule)} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" style={inputStyle} value={password}
              onChange={e => setPassword(e.target.value)} required
              placeholder={mode === 'signup' ? '8+ characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.rule)} />
          </div>

          {error && <p style={{ fontSize: 13, color: C.error, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading
              ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
              : (mode === 'signup' ? 'Create account →' : 'Sign in →')}
          </button>
        </form>

        {inviteCode && (
          <p style={{
            marginTop: 16, fontSize: 11, color: C.dim,
            fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center',
          }}>
            Invite code <strong style={{ color: C.accent, fontStyle: 'normal' }}>{inviteCode}</strong> will be applied after sign in.
          </p>
        )}
      </div>
    </div>
  )
}
