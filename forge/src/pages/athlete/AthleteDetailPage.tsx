import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAthlete, useAthleteSessions, useAthletePrograms } from '../../hooks/useForge'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatDuration(s: number | null) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return `${m}m`
}

const SESSION_STATUS_PILL: Record<string, string> = {
  completed: 'pill pill-green',
  planned:   'pill pill-dim',
  skipped:   'pill pill-error',
}

export function AthleteDetailPage() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'sessions' | 'programs'>('sessions')

  const { data: athlete, isLoading } = useAthlete(athleteId ?? '')
  const { data: sessions = [], isLoading: sessionsLoading } = useAthleteSessions(athleteId ?? '')
  const { data: assignments = [] } = useAthletePrograms(athleteId ?? '')

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    )
  }

  const fullName = athlete ? `${athlete.firstName} ${athlete.lastName}` : '—'
  const active = assignments.find((a: any) => a.status === 'active')

  return (
    <div className="page">
      {/* Back + name */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/forge/roster')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-dim)', fontSize: 12,
            fontFamily: 'var(--font-serif)',
            display: 'flex', alignItems: 'center', gap: 5,
            marginBottom: 12, padding: 0,
          }}
        >
          ← Roster
        </button>
        <h1 className="page-title" style={{ marginBottom: 4 }}>{fullName}</h1>
        <p style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)' }}>
          {active
            ? (active as any).program_templates?.name ?? 'Active program'
            : 'No active program'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--color-rule)',
        marginBottom: 28,
      }}>
        {(['sessions', 'programs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t ? 500 : 400,
              color: tab === t ? 'var(--color-ink)' : 'var(--color-dim)',
              borderBottom: `2px solid ${tab === t ? 'var(--color-accent)' : 'transparent'}`,
              marginBottom: -1, transition: 'color 100ms',
              textTransform: 'capitalize',
            }}
          >{t}</button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="card">
          {sessionsLoading && (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          )}
          {!sessionsLoading && sessions.length === 0 && (
            <div className="empty-state">No sessions logged.</div>
          )}
          {sessions.length > 0 && (
            <table className="forge-table">
              <thead>
                <tr><th>Date</th><th>Session</th><th>Duration</th><th>Status</th></tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} style={{ cursor: 'default' }}>
                    <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}>
                      {formatDate(s.scheduledDate)}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--color-ink)' }}>
                      {s.sessionName || s.sessionTemplateId}
                    </td>
                    <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
                      {formatDuration(s.durationSeconds)}
                    </td>
                    <td>
                      <span className={SESSION_STATUS_PILL[s.status] ?? 'pill pill-dim'} style={{ textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Programs tab */}
      {tab === 'programs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-outline" onClick={() => navigate('/forge/programs')}>
              Assign program →
            </button>
          </div>
          <div className="card">
            {assignments.length === 0 ? (
              <div className="empty-state">No programs assigned.</div>
            ) : (
              <table className="forge-table">
                <thead><tr><th>Program</th><th>Started</th><th>Status</th></tr></thead>
                <tbody>
                  {assignments.map((a: any) => (
                    <tr key={a.id} style={{ cursor: 'default' }}>
                      <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                        {a.program_templates?.name ?? '—'}
                      </td>
                      <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
                        {formatDate(a.startDate)}
                      </td>
                      <td>
                        <span className={a.status === 'active' ? 'pill pill-amber' : 'pill pill-dim'} style={{ textTransform: 'capitalize' }}>
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
      )}
    </div>
  )
}
