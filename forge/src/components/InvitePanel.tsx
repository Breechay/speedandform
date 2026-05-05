import { useState, useEffect } from 'react'
import { createInviteCode, getCoachInvites, deleteInvite } from '../api/athleteInvite'
import { useAuthStore } from '../store/authStore'
import type { InviteCode } from '../api/athleteInvite'

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86_400_000)
  if (days > 0) return `${days}d left`
  const hours = Math.floor(diff / 3_600_000)
  return `${hours}h left`
}

interface Props {
  onClose: () => void
}

export function InvitePanel({ onClose }: Props) {
  const { user } = useAuthStore()
  const [invites, setInvites]   = useState<InviteCode[]>([])
  const [loading, setLoading]   = useState(true)
  const [label,   setLabel]     = useState('')
  const [slug,    setSlug]      = useState('')
  const [creating, setCreating] = useState(false)
  const [copied,  setCopied]    = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getCoachInvites(user.id).then(setInvites).finally(() => setLoading(false))
  }, [user])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      const inv = await createInviteCode(user.id, {
        label: label.trim() || undefined,
        athleteSlug: slug.trim() || undefined,
      })
      setInvites(prev => [inv, ...prev])
      setLabel(''); setSlug('')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteInvite(id)
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/forge/athlete/invite?code=${code}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,16,0.25)', zIndex: 50 }}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-rule)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 60,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-rule)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-serif)', color: 'var(--color-ink)' }}>
              Invite athletes
            </h2>
            <p style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
              Each code is single-use, valid 7 days.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dim)', fontSize: 18 }}>×</button>
        </div>

        {/* Create new */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-rule)', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{
                display: 'block', fontFamily: 'var(--font-serif)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 5,
              }}>Label (optional)</label>
              <input
                className="input" style={{ height: 34 }}
                placeholder="e.g. Marcus W"
                value={label}
                onChange={e => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label style={{
                display: 'block', fontFamily: 'var(--font-serif)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 5,
              }}>Athlete slug (optional)</label>
              <input
                className="input" style={{ height: 34 }}
                placeholder="e.g. marcus (links existing profile)"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating}
              style={{ alignSelf: 'flex-start', height: 34, fontSize: 13 }}
            >
              {creating ? 'Generating…' : 'Generate code →'}
            </button>
          </div>
        </div>

        {/* Invite list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <div className="spinner" />
            </div>
          )}

          {!loading && invites.length === 0 && (
            <p style={{
              textAlign: 'center', color: 'var(--color-dim)', fontSize: 12,
              fontFamily: 'var(--font-serif)', fontStyle: 'italic', padding: '24px 0',
            }}>No active invites.</p>
          )}

          {invites.map(inv => {
            const isExpired = new Date(inv.expiresAt) < new Date()
            const isUsed = !!inv.usedBy
            return (
              <div key={inv.id} style={{
                padding: '12px 14px',
                background: isUsed || isExpired ? 'transparent' : 'var(--color-bg)',
                border: '1px solid var(--color-rule)',
                borderRadius: 7,
                marginBottom: 8,
                opacity: isUsed || isExpired ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  {/* Code */}
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 18, fontWeight: 700,
                    color: isUsed || isExpired ? 'var(--color-dim)' : 'var(--color-accent)',
                    letterSpacing: '0.2em',
                  }}>{inv.code}</span>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!isUsed && !isExpired && (
                      <button
                        onClick={() => handleCopy(inv.code)}
                        style={{
                          height: 26, padding: '0 10px',
                          background: copied === inv.code ? 'var(--color-accent-dim)' : 'transparent',
                          border: '1px solid var(--color-rule)',
                          borderRadius: 4, cursor: 'pointer',
                          fontSize: 11, color: copied === inv.code ? 'var(--color-accent)' : 'var(--color-chrome)',
                          fontFamily: 'var(--font-serif)',
                          transition: 'all 120ms',
                        }}
                      >{copied === inv.code ? 'Copied ✓' : 'Copy link'}</button>
                    )}
                    <button
                      onClick={() => handleDelete(inv.id)}
                      style={{
                        height: 26, width: 26,
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--color-dim)',
                        fontSize: 14, lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >×</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {inv.label && (
                    <span style={{ fontSize: 12, color: 'var(--color-ink)', fontWeight: 500 }}>
                      {inv.label}
                    </span>
                  )}
                  {inv.athleteSlug && (
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--color-dim)' }}>
                      → {inv.athleteSlug}
                    </span>
                  )}
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10, fontFamily: 'var(--font-serif)',
                    color: isUsed ? 'var(--color-success)' : isExpired ? 'var(--color-error)' : 'var(--color-dim)',
                  }}>
                    {isUsed ? 'Used ✓' : timeUntil(inv.expiresAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
