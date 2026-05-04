import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoster } from '../../hooks/useForge'
import type { RosterAthlete } from '../../api/athletes'

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

export function AssignPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: roster = [], isLoading } = useRoster()

  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(() => {
    // Default to next Monday
    const d = new Date()
    const day = d.getDay()
    const toMonday = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + toMonday)
    return d.toISOString().split('T')[0]
  })
  const [assigning, setAssigning] = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  const filtered = roster.filter(a => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase()
    return !search || name.includes(search.toLowerCase())
  })

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const conflicts = roster.filter(a =>
    selected.includes(a.athleteId) && a.programName
  )

  const handleAssign = async () => {
    if (!id || selected.length === 0) return
    setAssigning(true); setError('')
    try {
      const { assignProgram } = await import('../../api/programs')
      await assignProgram(id, selected, startDate)
      setDone(true)
      setTimeout(() => navigate('/forge/roster'), 1200)
    } catch (err: any) {
      setError(err.message || 'Assignment failed.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/forge/programs')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-dim)', fontSize: 11,
            fontFamily: 'var(--font-serif)',
            display: 'flex', alignItems: 'center', gap: 5,
            marginBottom: 12, padding: 0,
          }}
        >← Programs</button>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Assign program</h1>
        <p style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          Select athletes and a start date.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>

        {/* Athlete selector */}
        <div>
          <FieldLabel>Athletes</FieldLabel>
          <input
            className="input"
            style={{ marginBottom: 8 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="card" style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 8 }}>
            {isLoading && (
              <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            )}
            {!isLoading && filtered.map((a: RosterAthlete) => {
              const isSelected = selected.includes(a.athleteId)
              return (
                <div
                  key={a.athleteId}
                  onClick={() => toggle(a.athleteId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-accent-dim)' : 'transparent',
                    borderBottom: '1px solid var(--color-rule-light)',
                    transition: 'background 80ms',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                    background: isSelected ? 'var(--color-accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 80ms',
                  }}>
                    {isSelected && (
                      <span style={{ color: '#fff', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>✓</span>
                    )}
                  </div>

                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                    {a.firstName} {a.lastName}
                  </span>

                  {a.programName && (
                    <span style={{
                      fontSize: 10, color: 'var(--color-dim)',
                      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    }}>active: {a.programName}</span>
                  )}
                </div>
              )
            })}
            {!isLoading && filtered.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                No athletes.
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <p style={{
              fontSize: 11, color: 'var(--color-dim)',
              fontFamily: 'var(--font-serif)', marginTop: 5,
            }}>
              {selected.length} selected
            </p>
          )}
        </div>

        {/* Start date */}
        <div>
          <FieldLabel>Start date</FieldLabel>
          <input
            className="input"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <p style={{
            fontSize: 10, color: 'var(--color-dim)',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginTop: 4,
          }}>
            Defaults to next Monday. Sessions are scheduled from this date.
          </p>
        </div>

        {/* Conflict warning */}
        {conflicts.length > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-accent-mid)',
            borderRadius: 6,
          }}>
            <p style={{ fontSize: 12, color: 'var(--color-accent)', fontFamily: 'var(--font-serif)' }}>
              {conflicts.length} athlete{conflicts.length !== 1 ? 's' : ''} have an active program. It will be paused.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-error)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <div>
          {done ? (
            <p style={{ fontSize: 13, color: 'var(--color-success)', fontFamily: 'var(--font-serif)' }}>
              Assigned. Redirecting…
            </p>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleAssign}
              disabled={selected.length === 0 || assigning}
            >
              {assigning ? 'Assigning…' : `Assign to ${selected.length > 0 ? selected.length : '—'} athlete${selected.length !== 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
