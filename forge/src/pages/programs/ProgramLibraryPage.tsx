import { useNavigate } from 'react-router-dom'

const PROGRAMS = [
  { id: '1', name: 'Forge Accumulation', weeks: 4, daysPerWeek: 4, lastEdited: 'May 2', status: 'Published' },
  { id: '2', name: 'Sprint Base Block', weeks: 6, daysPerWeek: 5, lastEdited: 'Apr 18', status: 'Published' },
  { id: '3', name: 'Power Development', weeks: 5, daysPerWeek: 4, lastEdited: 'Apr 5', status: 'Draft' },
  { id: '4', name: 'Deload Protocol', weeks: 4, daysPerWeek: 3, lastEdited: 'Mar 12', status: 'Archived' },
]

const STATUS_PILL: Record<string, string> = {
  Published: 'pill pill-amber',
  Draft: 'pill pill-dim',
  Archived: 'pill pill-dim',
}

export default function ProgramLibraryPage() {
  const navigate = useNavigate()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', flex: 1 }}>Programs</h1>
        <button className="btn-primary" onClick={() => navigate('/forge/programs/new')}>New program →</button>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr 1fr 140px', padding: '10px 16px', borderBottom: '1px solid var(--color-rule)' }}>
          {['Program', 'Weeks', 'Days/wk', 'Last edited', 'Status', ''].map((h) => (
            <span key={h} className="label-mono">{h}</span>
          ))}
        </div>
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className="table-row"
            style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr 1fr 140px', padding: '12px 16px' }}
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>{p.weeks}w</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>{p.daysPerWeek}d</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>{p.lastEdited}</span>
            <span className={STATUS_PILL[p.status]}>{p.status}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {p.status !== 'Archived' && (
                <button
                  className="btn-ghost"
                  style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/forge/programs/${p.id}`) }}
                >Edit</button>
              )}
              <button
                className="btn-ghost"
                style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/forge/programs/${p.id}/assign`) }}
              >Assign →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
