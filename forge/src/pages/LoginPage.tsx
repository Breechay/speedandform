import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderRadius: 8,
        padding: '36px 32px',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            Forge
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-dim)',
          }}>
            Coach
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-rule)', marginBottom: 24 }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-dim)',
              marginBottom: 6,
            }}>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="coach@example.com"
              required
              style={{
                height: 36,
                width: '100%',
                padding: '0 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                borderRadius: 4,
                fontSize: 14,
                color: 'var(--color-ink)',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-dim)',
              marginBottom: 6,
            }}>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                height: 36,
                width: '100%',
                padding: '0 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                borderRadius: 4,
                fontSize: 14,
                color: 'var(--color-ink)',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13,
              color: '#D85A30',
              fontFamily: 'var(--font-sans)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 36,
              width: '100%',
              marginTop: 4,
              background: loading ? 'var(--color-dim)' : 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.12s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  )
}
