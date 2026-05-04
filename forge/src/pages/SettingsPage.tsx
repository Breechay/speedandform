import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { updateProfile, updatePassword, signOut } from '../api/auth'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateProfile(firstName, lastName)
      if (newPassword) await updatePassword(newPassword)
      setUser(user ? { ...user, firstName, lastName } : null)
      setSaved(true)
      setNewPassword('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
    navigate('/forge/login', { replace: true })
  }

  const inputStyle: React.CSSProperties = {
    height: 36, width: '100%', padding: '0 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-rule)',
    borderRadius: 4, fontSize: 14,
    color: 'var(--color-ink)', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11, fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: 'var(--color-dim)', marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 28 }}>Settings</h1>

      <div style={{ maxWidth: 480 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, padding: '20px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 18 }}>
            Account
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First name</label>
                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last name</label>
                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input style={{ ...inputStyle, color: 'var(--color-dim)', background: 'var(--color-bg)' }}
                value={user?.email || ''} disabled />
            </div>

            <div style={{ height: 1, background: 'var(--color-rule)', margin: '4px 0' }} />

            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                style={inputStyle}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
              />
            </div>

            {error && <div style={{ fontSize: 13, color: '#D85A30' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type="submit" disabled={saving} style={{
                height: 36, padding: '0 16px',
                background: saving ? 'var(--color-dim)' : 'var(--color-accent)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        <button onClick={handleSignOut} style={{
          height: 36, padding: '0 16px',
          background: 'transparent', color: 'var(--color-dim)',
          border: '1px solid var(--color-rule)', borderRadius: 8,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
