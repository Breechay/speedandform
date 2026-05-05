import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAthlete,
  useAthletePrograms,
  useAthleteRunningSessions,
  useAthleteStrengthSessions,
  useCoachNotes,
  useDeleteCoachNote,
  useSaveCoachNote,
} from '../../hooks/useForge'
import { formatDate, formatDistance, formatDuration, formatPace } from '../../utils/format'

type CoachTab = 'sessions' | 'programs' | 'notes'
type SessionFilter = 'all' | 'strength' | 'running'

type CoachSessionItem = {
  id: string
  kind: 'strength' | 'running'
  title: string
  completedAt: string | null
  durationSeconds: number | null
  topMovements: string[]
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
}

export function AthleteDetailPage() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<CoachTab>('sessions')
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all')
  const [noteText, setNoteText] = useState('')
  const [shareWithAthlete, setShareWithAthlete] = useState(false)

  const { data: athlete, isLoading } = useAthlete(athleteId ?? '')
  const { data: assignments = [] } = useAthletePrograms(athleteId ?? '')
  const { data: strengthSessions = [], isLoading: strengthLoading } = useAthleteStrengthSessions(athlete?.authUserId ?? null)
  const { data: runningSessions = [], isLoading: runningLoading } = useAthleteRunningSessions(athlete?.authUserId ?? null)
  const { data: notes = [], isLoading: notesLoading } = useCoachNotes(athlete?.id ?? '')
  const saveNoteMutation = useSaveCoachNote()
  const deleteNoteMutation = useDeleteCoachNote()

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    )
  }

  const fullName = athlete ? `${athlete.firstName} ${athlete.lastName}` : '—'
  const active = assignments.find((a: any) => a.status === 'active')
  const sessionsLoading = strengthLoading || runningLoading
  const units: 'km' | 'mi' = 'km'

  const mergedSessions = useMemo<CoachSessionItem[]>(() => {
    const strengthItems: CoachSessionItem[] = strengthSessions.map((s: any) => ({
      id: s.id,
      kind: 'strength',
      title: s.sessionName,
      completedAt: s.completedAt,
      durationSeconds: s.durationSeconds,
      topMovements: s.topMovements ?? [],
      distanceMeters: null,
      avgPaceSecondsPerKm: null,
    }))

    const runningItems: CoachSessionItem[] = runningSessions.map((r: any) => ({
      id: r.id,
      kind: 'running',
      title: r.sessionType ? r.sessionType.replace('_', ' ') : 'Run',
      completedAt: r.completedAt,
      durationSeconds: r.durationSeconds,
      topMovements: [],
      distanceMeters: r.distanceMeters,
      avgPaceSecondsPerKm: r.avgPaceSecondsPerKm,
    }))

    return [...strengthItems, ...runningItems].sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return tb - ta
    })
  }, [runningSessions, strengthSessions])

  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'all') return mergedSessions
    return mergedSessions.filter((item) => item.kind === sessionFilter)
  }, [mergedSessions, sessionFilter])

  const handleSaveNote = async () => {
    if (!athlete || !noteText.trim()) return
    await saveNoteMutation.mutateAsync({
      athleteId: athlete.id,
      content: noteText.trim(),
      isShared: shareWithAthlete,
    })
    setNoteText('')
    setShareWithAthlete(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!athlete) return
    await deleteNoteMutation.mutateAsync({ noteId, athleteId: athlete.id })
  }

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
        {(['sessions', 'programs', 'notes'] as const).map(t => (
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            {(['all', 'strength', 'running'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSessionFilter(filter)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '0 0 6px',
                  borderBottom: sessionFilter === filter ? '2px solid var(--color-accent)' : '2px solid transparent',
                  color: sessionFilter === filter ? 'var(--color-ink)' : 'var(--color-dim)',
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {!athlete?.authUserId ? (
            <p className="empty-state" style={{ paddingTop: 32 }}>
              Session history available once athlete connects via invite.
            </p>
          ) : sessionsLoading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="empty-state">No sessions logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSessions.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    <span>{formatDate(item.completedAt)}</span>
                    <span>{formatDuration(item.durationSeconds)}</span>
                  </div>
                  {item.kind === 'strength' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {item.topMovements.map((movement) => (
                        <span
                          key={movement}
                          style={{
                            fontSize: 11,
                            color: 'var(--color-dim)',
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--color-rule-light)',
                            padding: '2px 4px',
                            borderRadius: 4,
                          }}
                        >
                          {movement}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {formatDistance(item.distanceMeters, units)} · {formatPace(item.avgPaceSecondsPerKm, units)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Programs tab */}
      {tab === 'programs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-outline" onClick={() => navigate('/forge/programs', { state: { athleteId } })}>
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
                        {a.startDate && (
                          <span style={{ marginLeft: 8, color: 'var(--color-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            Week {Math.max(1, Math.floor((Date.now() - new Date(a.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)}
                          </span>
                        )}
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

      {tab === 'notes' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <textarea
              className="input"
              rows={4}
              placeholder="Note about this session or athlete..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{ width: '100%', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button className="btn btn-primary" onClick={handleSaveNote} disabled={saveNoteMutation.isPending || !noteText.trim()}>
                Save note →
              </button>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-dim)' }}>
              <input type="checkbox" checked={shareWithAthlete} onChange={(e) => setShareWithAthlete(e.target.checked)} />
              Share with athlete
            </label>
          </div>

          {notesLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">No notes yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.map((note: any) => (
                <div key={note.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <p style={{ fontSize: 14, color: 'var(--color-chrome)', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-dim)', fontSize: 16, lineHeight: 1 }}
                      aria-label="Delete note"
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(note.createdAt)}
                    </span>
                    {note.isShared && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--color-accent)',
                          border: '1px solid var(--color-accent-mid)',
                          borderRadius: 999,
                          padding: '1px 6px',
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Shared
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
