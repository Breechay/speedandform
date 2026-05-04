import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAthlete, useAthleteSessions, useAthletePrograms } from '../../hooks/useForge'
import type { SessionInstance, AssignedProgram } from '../../api/athletes'

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid var(--color-rule)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(s: number | null) {
  if (!s) return '—'
  const m = Math.round(s / 60)
  return `${m} min`
}

const SESSION_STATUS_STYLE: Record<string, React.CSSProperties> = {
  completed: { background: 'rgba(45,102,69,0.08)', color: '#2D6645', border: '1px solid rgba(45,102,69,0.2)' },
  planned:   { background: 'rgba(186,117,23,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(186,117,23,0.2)' },
  skipped:   { background: 'transparent', color: 'var(--color-dim)', border: '1px solid var(--color-rule)' },
}

const SESSION_STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  planned: 'Scheduled',
  skipped: 'Skipped',
}

const PROGRAM_STATUS_STYLE: Record<string, React.CSSProperties> = {
  active:    { background: 'rgba(186,117,23,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(186,117,23,0.2)' },
  paused:    { background: 'transparent', color: 'var(--color-dim)', border: '1px solid var(--color-rule)' },
  completed: { background: 'transparent', color: 'var(--color-dim)', border: '1px solid var(--color-rule)' },
}

export function AthleteDetailPage() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'sessions' | 'programs'>('sessions')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const { data: athlete, isLoading: loadingAthlete } = useAthlete(athleteId!)
  const { data: sessions = [], isLoading: loadingSessions } = useAthleteSessions(athleteId!)
  const { data: programs = [], isLoading: loadingPrograms } = useAthletePrograms(athleteId!)

  const activeProgram = programs.find(p => p.status === 'active')

  if (loadingAthlete) return <Spinner />

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
      {/* Back + header */}
      <button onClick={() => navigate('/forge/roster')} style={{
        background: 'none', border: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: 'var(--color-dim)', cursor: 'pointer',
        padding: '0 0 12px', display: 'block',
      }}>
        ← Roster
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>
        {athlete ? `${athlete.firstName} ${athlete.lastName}` : '—'}
      </h1>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)', marginBottom: 24 }}>
        {activeProgram ? activeProgram.programName : 'No active program.'}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rule)', marginBottom: 24 }}>
        {(['sessions', 'programs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            height: 36, padding: '0 16px',
            background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: -1,
            fontSize: 14, fontWeight: tab === t ? 600 : 500,
            color: tab === t ? 'var(--color-ink)' : 'var(--color-dim)',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div>
          {loadingSessions ? <Spinner /> : sessions.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-dim)', fontSize: 14 }}>
              No sessions logged.
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Session', 'Status', 'Duration'].map(h => (
                      <th key={h} style={{
                        padding: '14px 16px 10px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11, fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--color-dim)',
                        borderBottom: '1px solid var(--color-rule)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: SessionInstance) => (
                    <>
                      <tr
                        key={s.id}
                        onClick={() => s.status === 'completed'
                          ? setExpandedSession(expandedSession === s.id ? null : s.id)
                          : undefined}
                        style={{
                          cursor: s.status === 'completed' ? 'pointer' : 'default',
                        }}
                        onMouseEnter={e => { if (s.status === 'completed') e.currentTarget.style.background = 'var(--color-bg)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                            {formatDate(s.scheduledDate)}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>
                          {s.sessionName}
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 9px', borderRadius: 20,
                            fontSize: 11, fontWeight: 500,
                            ...SESSION_STATUS_STYLE[s.status],
                          }}>
                            {SESSION_STATUS_LABEL[s.status]}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                            {formatDuration(s.durationSeconds)}
                          </span>
                        </td>
                      </tr>
                      {expandedSession === s.id && s.exerciseLogs && s.exerciseLogs.length > 0 && (
                        <tr key={`${s.id}-expanded`}>
                          <td colSpan={4} style={{ padding: '0 16px 16px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-rule-light)' }}>
                            <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {s.exerciseLogs.map((ex: any, i: number) => (
                                <div key={i} style={{ paddingLeft: 12, borderLeft: '2px solid var(--color-rule)' }}>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-chrome)', marginBottom: 4 }}>
                                    {ex.movementName || ex.movementId}
                                  </div>
                                  {ex.sets?.map((set: any, j: number) => (
                                    <div key={j} style={{ fontSize: 13, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                                      Set {set.setNumber}: {set.reps ? `${set.reps} reps` : ''}{set.weightLb ? ` @ ${set.weightLb} lb` : ''}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Programs tab */}
      {tab === 'programs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={() => navigate(`/forge/programs`)}
              style={{
                height: 36, padding: '0 16px',
                background: 'transparent', color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}>
              Assign program →
            </button>
          </div>

          {loadingPrograms ? <Spinner /> : programs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-dim)', fontSize: 14 }}>
              No programs assigned.
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Program', 'Status', 'Start Date'].map(h => (
                      <th key={h} style={{
                        padding: '14px 16px 10px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11, fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--color-dim)',
                        borderBottom: '1px solid var(--color-rule)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p: AssignedProgram) => (
                    <tr key={p.id}
                      onClick={() => navigate(`/forge/programs/${p.programTemplateId}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>
                        {p.programName}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 9px', borderRadius: 20,
                          fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                          ...PROGRAM_STATUS_STYLE[p.status],
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                          {formatDate(p.startDate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
