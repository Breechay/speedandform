import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoster } from '../../hooks/useForge'
import type { RosterAthlete } from '../../api/athletes'

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Active:       { background: 'transparent', color: 'var(--color-accent)',  border: '1px solid var(--color-accent)' },
  Behind:       { background: 'transparent', color: '#D85A30',              border: '1px solid #D85A30' },
  Complete:     { background: 'transparent', color: 'var(--color-dim)',     border: '1px solid var(--color-dim)' },
  'No program': { background: 'transparent', color: 'var(--color-dim)',     border: '1px dashed var(--color-rule)' },
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
      <div style={{
        width: 24, height: 24,
        border: '2.5px solid var(--color-rule)',
        borderTopColor: 'var(--color-accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RosterPage() {
  const navigate = useNavigate()
  const { data: roster = [], isLoading, error } = useRoster()
  const [activeFilter, setActiveFilter] = useState('All')

  // Unique program names for filter pills
  const programs = ['All', ...Array.from(new Set(
    roster.filter(a => a.programName).map(a => a.programName!)
  ))]

  const filtered = activeFilter === 'All'
    ? roster
    : roster.filter(a => a.programName === activeFilter)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)' }}>Roster</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-dim)',
          }}>
            {roster.length} athletes
          </span>
          <button style={{
            height: 36, padding: '0 16px',
            background: 'transparent',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}>
            Add athlete
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {programs.map(p => (
          <button key={p} onClick={() => setActiveFilter(p)} style={{
            height: 30, padding: '0 14px',
            borderRadius: 20,
            border: '1px solid',
            borderColor: activeFilter === p ? 'var(--color-accent)' : 'var(--color-rule)',
            background: activeFilter === p ? 'rgba(186,117,23,0.08)' : 'transparent',
            color: activeFilter === p ? 'var(--color-accent)' : 'var(--color-chrome)',
            fontSize: 13,
            fontWeight: activeFilter === p ? 600 : 400,
            cursor: 'pointer',
          }}>
            {p}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {isLoading ? <Spinner /> : error ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: 'var(--color-dim)' }}>
            Failed to load roster.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Athlete', 'Program', 'Block', 'Last Session', 'This Block', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '0 16px 10px',
                    paddingTop: 16,
                    textAlign: 'left',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-dim)',
                    borderBottom: '1px solid var(--color-rule)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-dim)', fontSize: 14 }}>
                    {roster.length === 0 ? 'No athletes.' : 'No athletes match this filter.'}
                  </div>
                </td></tr>
              ) : filtered.map((a: RosterAthlete) => (
                <tr key={a.athleteId} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}
                    onClick={() => navigate(`/forge/roster/${a.athleteId}`)}
                  >
                    {a.firstName} {a.lastName}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', fontSize: 14, color: 'var(--color-chrome)' }}>
                    {a.programName || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                      {a.blockLabel || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                      {formatDate(a.lastSessionAt)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: a.sessionsTotal > 0 && a.sessionsCompleted >= a.sessionsTotal
                        ? 'var(--color-accent)' : 'var(--color-chrome)',
                      fontWeight: a.sessionsTotal > 0 && a.sessionsCompleted >= a.sessionsTotal ? 500 : 400,
                    }}>
                      {a.sessionsTotal > 0 ? `${a.sessionsCompleted} / ${a.sessionsTotal}` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      ...STATUS_STYLE[a.status],
                    }}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
