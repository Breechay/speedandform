import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../api/auth'

// ── Shared input style ────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  height: 36, width: '100%', padding: '0 12px',
  background: 'var(--color-surface)', border: '1px solid var(--color-rule)',
  borderRadius: 4, fontSize: 14, color: 'var(--color-ink)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11,
  fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--color-dim)', marginBottom: 6,
}

const btnStyle = (loading: boolean): React.CSSProperties => ({
  height: 36, width: '100%', marginTop: 4,
  background: loading ? 'var(--color-dim)' : 'var(--color-accent)',
  color: '#fff', border: 'none', borderRadius: 8,
  fontSize: 13, fontWeight: 500,
  cursor: loading ? 'not-allowed' : 'pointer',
})

// ── Card wrapper ──────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--color-surface)', border: '1px solid var(--color-rule)',
        borderRadius: 8, padding: '36px 32px',
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--color-ink)', marginBottom: 4 }}>Forge</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-dim)' }}>Coach</div>
        </div>
        <div style={{ height: 1, background: 'var(--color-rule)', marginBottom: 24 }} />
        {children}
      </div>
    </div>
  )
}

// ── Set password form (after recovery/invite link) ────────────
function SetPasswordForm() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // Reload the user profile after setting password
      
      const user = await getCurrentUser()
      setUser(user)
      navigate('/forge/roster', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to set password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <p style={{ fontSize: 14, color: 'var(--color-chrome)', marginBottom: 20 }}>
        Set a password for your coach account.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>New password</label>
          <input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)}
            placeholder="8+ characters" required style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')} />
        </div>
        <div>
          <label style={labelStyle}>Confirm password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" required style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')} />
        </div>
        {error && <div style={{ fontSize: 13, color: '#D85A30' }}>{error}</div>}
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'Setting password…' : 'Set password →'}
        </button>
      </form>
    </Card>
  )
}

// ── Main login form ───────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'set-password'>('login')

  // Check if arriving from a Supabase recovery/invite link
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('type=signup')) {
      // Supabase JS will automatically exchange the token from the hash
      // We just need to show the set-password form
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setMode('set-password')
      })
    }
  }, [])

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
    <Card>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="coach@example.com"
            required style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')} />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            required style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')} />
        </div>
        {error && <div style={{ fontSize: 13, color: '#D85A30' }}>{error}</div>}
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </Card>
  )
}
