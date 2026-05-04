import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--font-serif)',
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--color-dim)', marginBottom: 6,
    }}>{children}</label>
  )
}

export function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName,  setLastName]  = useState(user?.lastName ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      // Update coach_profiles
      const { error: profileErr } = await supabase
        .from('coach_profiles')
        .update({ first_name: firstName, last_name: lastName })
        .eq('id', user?.id)

      if (profileErr) throw profileErr

      // Update password if provided
      if (newPassword) {
        if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
        if (pwErr) throw pwErr
        setNewPassword('')
      }

      setUser(user ? { ...user, firstName, lastName } : null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ maxWidth: 440 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Account section */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid var(--color-rule-light)',
            }}>
              <p style={{
                fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--color-dim)',
              }}>Account</p>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel>First name</FieldLabel>
                  <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <FieldLabel>Last name</FieldLabel>
                  <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  className="input"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
                <p style={{
                  fontSize: 10, color: 'var(--color-dim)',
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginTop: 4,
                }}>Email cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Password section */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid var(--color-rule-light)',
            }}>
              <p style={{
                fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--color-dim)',
              }}>Password</p>
            </div>

            <div style={{ padding: 18 }}>
              <FieldLabel>New password</FieldLabel>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              <p style={{
                fontSize: 10, color: 'var(--color-dim)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginTop: 4,
              }}>Minimum 8 characters.</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{
              fontSize: 12, color: 'var(--color-error)',
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              marginBottom: 14,
            }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && (
              <span style={{
                fontSize: 12, color: 'var(--color-success)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              }}>Saved.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
