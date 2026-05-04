import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgram, useAssignProgram, useRoster } from '../../hooks/useForge'
import type { RosterAthlete } from '../../api/athletes'

function nextMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export function AssignPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: program } = useProgram(id)
  const { data: roster = [] } = useRoster()
  const assign = useAssignProgram()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [startDate, setStartDate] = useState(nextMonday())
  const [done, setDone] = useState(false)

  const filtered = roster.filter(a => {
    const name = `${a.firstName} ${a.lastName}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  function toggleAthlete(athleteId: string) {
    setSelected(prev =>
      prev.includes(athleteId) ? prev.filter(id => id !== athleteId) : [...prev, athleteId]
    )
  }

  const conflicts = roster.filter(a =>
    selected.includes(a.athleteId) && a.assignmentStatus === 'active'
  )

  async function handleAssign() {
    if (!id || selected.length === 0) return
    assign.mutate({ programId: id, athleteIds: selected, startDate }, {
      onSuccess: () => {
        setDone(true)
        setTimeout(() => navigate('/forge/roster'), 1500)
      },
    })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
      <button onClick={() => navigate(`/forge/programs/${id}`)} style={{
        background: 'none', border: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: 'var(--color-dim)', cursor: 'pointer',
        padding: '0 0 12px', display: 'block',
      }}>
        ← Program
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 400, color: 'var(--color-ink)', marginBottom: 4 }}>
          {program?.name || '—'}
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-dim)' }}>
          Assign to athletes
        </div>
      </div>

      {done ? (
        <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: '#2D6645', fontFamily: 'var(--font-mono)' }}>
          Program assigned.
        </div>
      ) : (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, padding: '20px 20px' }}>
            {/* Athlete search */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 6 }}>
                Athletes
              </label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search athletes…"
                style={{ height: 36, width: '100%', padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 4, fontSize: 14, color: 'var(--color-ink)', outline: 'none', marginBottom: 8 }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-rule)')}
              />

              {/* Athlete list */}
              <div style={{ border: '1px solid var(--color-rule)', borderRadius: 4, maxHeight: 200, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-dim)' }}>No athletes found.</div>
                ) : filtered.map((a: RosterAthlete) => (
                  <label key={a.athleteId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px',
                    borderBottom: '1px solid var(--color-rule-light)',
                    cursor: 'pointer',
                    background: selected.includes(a.athleteId) ? 'rgba(186,117,23,0.05)' : 'transparent',
                  }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(a.athleteId)}
                      onChange={() => toggleAthlete(a.athleteId)}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--color-ink)', flex: 1 }}>
                      {a.firstName} {a.lastName}
                    </span>
                    {a.programName && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dim)' }}>
                        active: {a.programName}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {selected.length > 0 && (
                <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>
                  {selected.length} selected
                </div>
              )}
            </div>

            {/* Start date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 6 }}>
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ height: 36, padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 4, fontSize: 14, color: 'var(--color-ink)', outline: 'none', width: 180 }}
              />
            </div>

            {/* Conflict warning */}
            {conflicts.length > 0 && (
              <div style={{ padding: '10px 12px', background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)', borderRadius: 4, fontSize: 13, color: 'var(--color-accent)', marginBottom: 16 }}>
                This will pause {conflicts.map(c => c.programName).filter((v, i, a) => a.indexOf(v) === i).join(', ')} for {conflicts.length} {conflicts.length === 1 ? 'athlete' : 'athletes'}.
              </div>
            )}

            <button
              onClick={handleAssign}
              disabled={selected.length === 0 || assign.isPending}
              style={{
                width: '100%', height: 36,
                background: selected.length === 0 ? 'var(--color-dim)' : 'var(--color-accent)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {assign.isPending ? 'Assigning…' : `Assign program →`}
            </button>

            {assign.isError && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#D85A30' }}>
                Assignment failed. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
