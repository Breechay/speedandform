import { Link } from 'react-router-dom'
import { useFieldAthletes, useFieldRecordCards, useFieldStream } from '../../hooks/useField'
import { FieldRecordSection, FieldStreamSection } from './FieldSections'

export function TheFieldPage() {
  const { data: posts = [], isLoading: postsLoading } = useFieldStream()
  const { data: records = [], isLoading: recordsLoading } = useFieldRecordCards()
  const { data: athletes = [], isLoading: athletesLoading } = useFieldAthletes()

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">The Field</h1>
        </div>
        <Link to="/forge/field/miami" className="btn btn-outline">Miami View →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 14 }}>
        <div className="card" style={{ padding: 12 }}>
          <h3 className="eyebrow" style={{ marginBottom: 10 }}>Stream</h3>
          {postsLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : (
            <FieldStreamSection posts={posts} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            {recordsLoading ? (
              <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : (
              <FieldRecordSection records={records.slice(0, 18)} title="Record" />
            )}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <h3 className="eyebrow" style={{ marginBottom: 10 }}>Athletes</h3>
            {athletesLoading ? (
              <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : athletes.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 8px' }}>No public athletes yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {athletes.slice(0, 24).map((athlete) => (
                  <Link
                    key={athlete.id}
                    to={`/forge/field/${athlete.slug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      borderBottom: '1px solid var(--color-rule-light)',
                      paddingBottom: 7,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{athlete.displayName}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                      {athlete.disciplines.length > 0 ? athlete.disciplines.join(' · ') : 'Athlete'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
