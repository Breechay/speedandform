import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, getCurrentUser } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

// ── Hard-coded palette — no CSS var dependency ────────────────
const C = {
  bg:      '#F0EDE6',
  surface: '#FAFAF7',
  ink:     '#1A1710',
  chrome:  '#6B6358',
  dim:     '#9E978C',
  rule:    '#DDD9D0',
  accent:  '#BA7517',
  error:   '#D85A30',
}

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  background: C.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 16px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
}

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: C.surface,
  border: `1px solid ${C.rule}`,
  borderRadius: 8,
  padding: '36px 32px',
}

const monoLabel: React.CSSProperties = {
  display: 'block',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: C.dim,
  marginBottom: 6,
}

const inputBase: React.CSSProperties = {
  height: 38,
  width: '100%',
  padding: '0 12px',
  background: C.surface,
  border: `1px solid ${C.rule}`,
  borderRadius: 4,
  fontSize: 14,
  color: C.ink,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  height: 38,
  width: '100%',
  marginTop: 8,
  background: disabled ? C.dim : C.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'DM Sans', system-ui, sans-serif",
})

// ── Set Password form ─────────────────────────────────────────
function SetPasswordForm() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('At least 8 characters required.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setDone(true)
      const user = await getCurrentUser()
      setUser(user)
      setTimeout(() => navigate('/forge/roster', { replace: true }), 800)
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Try requesting a new link.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={wrap}>
        <div style={card}>
          <p style={{ fontSize: 16, color: C.accent, fontWeight: 600 }}>Password set. Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: C.ink, marginBottom: 4 }}>Forge</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.dim }}>Coach · Set your password</div>
        </div>
        <div style={{ height: 1, background: C.rule, marginBottom: 24 }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={monoLabel}>New password</label>
            <input
              type="password" autoFocus value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8+ characters" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e  => (e.target.style.borderColor = C.rule)}
            />
          </div>
          <div>
            <label style={monoLabel}>Confirm password</label>
            <input
              type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e  => (e.target.style.borderColor = C.rule)}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: C.error, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Setting password…' : 'Set password →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const setUser  = useAuthStore(s => s.setUser)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [mode, setMode] = useState<'login' | 'set-password' | 'checking'>('checking')

  useEffect(() => {
    // Supabase embeds the token in the URL hash — check if it's a recovery/invite
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if ((type === 'recovery' || type === 'invite' || type === 'signup') && accessToken) {
      // Manually set the session from the tokens in the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      }).then(() => {
        // Clear the tokens from the URL bar
        window.history.replaceState(null, '', window.location.pathname)
        setMode('set-password')
      }).catch(() => setMode('login'))
    } else {
      setMode('login')
    }
  }, [])

  if (mode === 'checking') {
    return (
      <div style={{ ...wrap }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (mode === 'set-password') return <SetPasswordForm />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await signIn(email, password)
      setUser(user)
      navigate('/forge/roster', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: C.ink, marginBottom: 4 }}>Forge</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.dim }}>Coach</div>
        </div>
        <div style={{ height: 1, background: C.rule, marginBottom: 24 }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={monoLabel}>Email</label>
            <input
              type="email" autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="coach@example.com" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e  => (e.target.style.borderColor = C.rule)}
            />
          </div>
          <div>
            <label style={monoLabel}>Password</label>
            <input
              type="password" autoComplete="current-password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e  => (e.target.style.borderColor = C.rule)}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: C.error, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  )
}
