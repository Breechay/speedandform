import { useNavigate } from 'react-router-dom'

const ATHLETES = [
  { id: '1', name: 'Marcus Webb', program: 'Forge Accumulation', block: 'Block A · W3', lastSession: 'May 1', thisBlock: '9 / 12', status: 'Active' },
  { id: '2', name: 'Priya Nair', program: 'Sprint Base', block: 'Block B · W1', lastSession: 'May 2', thisBlock: '3 / 4', status: 'Active' },
  { id: '3', name: 'Daniel Torres', program: 'Forge Accumulation', block: 'Block A · W2', lastSession: 'Apr 28', thisBlock: '4 / 8', status: 'Behind' },
  { id: '4', name: 'Aisha Kamara', program: '—', block: '—', lastSession: 'Never', thisBlock: '—', status: 'No program' },
  { id: '5', name: 'Jake Mullen', program: 'Sprint Base', block: 'Block A · W4', lastSession: 'May 3', thisBlock: '12 / 12', status: 'Complete' },
]

const STATUS_PILL: Record<string, string> = {
  Active: 'pill pill-amber',
  Behind: 'pill pill-coral',
  Complete: 'pill pill-dim',
  'No program': 'pill pill-dim',
}

export default function RosterPage() {
  const navigate = useNavigate()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', flex: 1 }}>Roster</h1>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginRight: 12 }}>
          {ATHLETES.length} athletes
        </span>
        <button className="btn-secondary">Add athlete</button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['All', 'Forge Accumulation', 'Sprint Base'].map((p, i) => (
          <button
            key={p}
            className={i === 0 ? 'pill pill-active' : 'pill pill-dim'}
            style={{ cursor: 'pointer', border: 'none' }}
          >{p}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--color-rule)' }}>
          {['Athlete', 'Program', 'Block', 'Last session', 'This block', 'Status'].map((h) => (
            <span key={h} className="label-mono">{h}</span>
          ))}
        </div>
        {ATHLETES.map((a) => (
          <div
            key={a.id}
            className="table-row"
            style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1fr', padding: '12px 16px' }}
            onClick={() => navigate(`/forge/roster/${a.id}`)}
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>{a.name}</span>
            <span style={{ fontSize: 14, color: 'var(--color-chrome)' }}>{a.program}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>{a.block}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>{a.lastSession}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: a.thisBlock === '12 / 12' ? 'var(--color-accent)' : 'var(--color-chrome)' }}>
              {a.thisBlock}
            </span>
            <span className={STATUS_PILL[a.status]}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
