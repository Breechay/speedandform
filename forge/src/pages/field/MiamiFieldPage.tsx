import { Link } from 'react-router-dom'
import { useFieldRecordCards, useFieldStream } from '../../hooks/useField'
import { FieldRecordSection, FieldStreamSection } from './FieldSections'

export function MiamiFieldPage() {
  const { data: posts = [], isLoading: postsLoading } = useFieldStream('miami')
  const { data: records = [], isLoading: recordsLoading } = useFieldRecordCards('miami')

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">The Field · Miami</h1>
          <p style={{ marginTop: 4, color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            Stream and record, no ranking.
          </p>
        </div>
        <Link to="/forge/field" className="btn btn-ghost">All Field</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 14 }}>
        <div className="card" style={{ padding: 12 }}>
          <h3 className="eyebrow" style={{ marginBottom: 10 }}>Miami Stream</h3>
          {postsLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : (
            <FieldStreamSection posts={posts} />
          )}
        </div>
        <div className="card" style={{ padding: 12 }}>
          {recordsLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : (
            <FieldRecordSection records={records.slice(0, 24)} title="Miami Record" />
          )}
        </div>
      </div>
    </div>
  )
}
