import { useState } from 'react'
import { InvitePanel } from '../../components/InvitePanel'
import { useNavigate } from 'react-router-dom'
import { useRoster } from '../../hooks/useForge'
import type { RosterAthlete } from '../../api/athletes'

const DAY_MS = 86_400_000

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function deriveStatus(a: RosterAthlete): 'Active' | 'Behind' | 'Complete' | 'No program' {
  if (!a.programName) return 'No program'
  if (a.sessionsTotal > 0 && a.sessionsCompleted >= a.sessionsTotal) return 'Complete'
  return 'Active'
}

const STATUS_PILL: Record<string, string> = {
  Active:      'pill pill-amber',
  Behind:      'pill pill-error',
  Complete:    'pill pill-green',
  'No program': 'pill pill-dim',
}

export function RosterPage() {
  const navigate = useNavigate()
  const { data: roster = [], isLoading, error } = useRoster()
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const programs = Array.from(new Set(roster.map(r => r.programName).filter(Boolean))) as string[]

  const filtered = roster.filter(a => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (programFilter !== 'All' && a.programName !== programFilter) return false
    return true
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="page-title">Roster</h1>
          <span style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)' }}>
            {roster.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ width: 200, height: 31, fontSize: 13 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-ghost" style={{ height: 33, fontSize: 13 }} onClick={() => setShowInvite(true)}>
            Invite →
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            Add athlete
          </button>
        </div>
      </div>

      {/* Filter pills */}
      {programs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['All', ...programs].map(p => (
            <button
              key={p}
              className={`filter-pill ${programFilter === p ? 'active' : ''}`}
              onClick={() => setProgramFilter(p)}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card">
        {isLoading && (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-error)', fontSize: 13 }}>
            {error.message}
          </div>
        )}

        {!isLoading && !error && (
          <table className="forge-table">
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Program</th>
                <th>Sessions</th>
                <th>Last session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      {search ? 'No results.' : 'No athletes. Add one to get started.'}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(a => {
                const status = deriveStatus(a)
                return (
                  <tr key={a.athleteId} onClick={() => navigate(`/forge/roster/${a.athleteId}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--color-accent-dim)',
                          border: '1px solid var(--color-accent-mid)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--color-accent)',
                          fontFamily: 'var(--font-serif)', letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          {(a.firstName[0] ?? '') + (a.lastName[0] ?? '')}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>
                          {a.firstName} {a.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-chrome)', fontSize: 13 }}>
                      {a.programName ?? '—'}
                    </td>
                    <td>
                      {a.sessionsTotal > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            height: 3, width: 60, background: 'var(--color-rule)',
                            borderRadius: 2, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(100, (a.sessionsCompleted / a.sessionsTotal) * 100)}%`,
                              background: 'var(--color-accent)',
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)' }}>
                            {a.sessionsCompleted}/{a.sessionsTotal}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-dim)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
                      {daysSince(a.lastSessionAt)}
                    </td>
                    <td>
                      <span className={STATUS_PILL[status]}>{status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && <InvitePanel onClose={() => setShowInvite(false)} />}
      {showAdd && <AddAthleteSlider onClose={() => setShowAdd(false)} />}
    </div>
  )
}

// ── Add athlete slider ──────────────────────────────────────────────
function AddAthleteSlider({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { createAthlete: addAthlete } = await import('../../api/athletes')
      await addAthlete(form.first_name, form.last_name, form.email); window.location.reload()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not add athlete.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,16,0.25)', zIndex: 50 }}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-rule)',
        boxShadow: 'var(--shadow-lg)',
        padding: '32px 28px',
        zIndex: 60,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>
            Add athlete
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-dim)', fontSize: 18, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'first_name', label: 'First name', type: 'text' },
            { key: 'last_name',  label: 'Last name',  type: 'text' },
            { key: 'email',      label: 'Email',      type: 'email' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                className="input"
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
              />
            </div>
          ))}

          {error && (
            <p style={{ fontSize: 12, color: 'var(--color-error)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Adding…' : 'Add athlete →'}
          </button>
        </form>
      </div>
    </>
  )
}
