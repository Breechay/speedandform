import { Link, useParams } from 'react-router-dom'
import { useFieldAthlete, useFieldRecordCards, useFieldStream } from '../../hooks/useField'
import { FieldRecordSection, FieldStreamSection } from './FieldSections'

export function FieldAthleteProfilePage() {
  const { athleteSlug = '' } = useParams<{ athleteSlug: string }>()
  const { data: athlete, isLoading } = useFieldAthlete(athleteSlug)
  const { data: posts = [], isLoading: postsLoading } = useFieldStream()
  const { data: records = [], isLoading: recordsLoading } = useFieldRecordCards()

  const athletePosts = posts.filter((p) => p.athleteSlug === athleteSlug)
  const athleteRecords = records.filter((r) => r.athleteSlug === athleteSlug)

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 90 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="page">
        <Link to="/forge/field" className="btn btn-ghost" style={{ marginBottom: 12 }}>← Back to Field</Link>
        <div className="card"><div className="empty-state">Athlete profile not found.</div></div>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/forge/field" className="btn btn-ghost" style={{ marginBottom: 12 }}>← Back to Field</Link>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>{athlete.displayName}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {athlete.disciplines.map((d) => (
            <span key={d} className="pill pill-dim">{d}</span>
          ))}
          {athlete.location && <span className="pill pill-dim">{athlete.location}</span>}
          {athlete.cohort && <span className="pill pill-amber">{athlete.cohort}</span>}
        </div>
        {athlete.shortLine && (
          <p style={{ color: 'var(--color-chrome)', fontSize: 14 }}>{athlete.shortLine}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: 14 }}>
        <div className="card" style={{ padding: 12 }}>
          {recordsLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : (
            <FieldRecordSection records={athleteRecords} title="Record" />
          )}
        </div>

        <div className="card" style={{ padding: 12 }}>
          <h3 className="eyebrow" style={{ marginBottom: 10 }}>Posts</h3>
          {postsLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : (
            <FieldStreamSection posts={athletePosts} />
          )}
        </div>
      </div>
    </div>
  )
}
