import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrograms } from '../../hooks/useForge'
import type { ProgramListItem as ProgramRow } from '../../api/programs'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_PILL: Record<string, string> = {
  Published: 'pill pill-amber',
  Draft:     'pill pill-dim',
  Archived:  'pill pill-dim',
}

function ProgramRow({ p, onAction }: {
  p: ProgramRow
  onAction: (action: string, id: string) => void
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <tr style={{ position: 'relative' }}>
      <td>
        <button
          onClick={() => navigate(`/forge/programs/${p.id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 14, fontWeight: 500, color: 'var(--color-ink)',
            textAlign: 'left',
          }}
        >{p.name || 'Untitled'}</button>
        
      </td>
      <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
        {p.targetWeeks ? `${p.targetWeeks}w` : '—'}
      </td>
      <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
        {p.daysPerWeek ? `${p.daysPerWeek}d` : '—'}
      </td>
      <td style={{ color: 'var(--color-dim)', fontSize: 12, fontFamily: 'var(--font-serif)' }}>
        {formatDate(p.updatedAt)}
      </td>
      <td><span className={STATUS_PILL[p.status] ?? 'pill pill-dim'}>{p.status}</span></td>
      <td style={{ width: 40 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-dim)', fontSize: 16, padding: '2px 6px',
              borderRadius: 4, lineHeight: 1,
            }}
          >⋯</button>
          {open && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
              <div className="dropdown" style={{ right: 0, top: '100%', zIndex: 50 }}>
                {p.status !== 'Archived' && (
                  <button className="dropdown-item" onClick={() => { setOpen(false); navigate(`/forge/programs/${p.id}`) }}>
                    Edit
                  </button>
                )}
                <button className="dropdown-item" onClick={() => { setOpen(false); navigate(`/forge/programs/${p.id}/assign`) }}>
                  Assign →
                </button>
                <button className="dropdown-item" onClick={() => { setOpen(false); onAction('duplicate', p.id) }}>
                  Duplicate
                </button>
                {p.status !== 'Archived' && (
                  <button className="dropdown-item danger" onClick={() => { setOpen(false); onAction('archive', p.id) }}>
                    Archive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export function ProgramLibraryPage() {
  const navigate = useNavigate()
  const { data: programs = [], isLoading, refetch } = usePrograms()

  const handleAction = async (action: string, id: string) => {
    const { archiveProgram, duplicateProgram } = await import('../../api/programs')
    if (action === 'archive') { await archiveProgram(id); refetch() }
    if (action === 'duplicate') { await duplicateProgram(id); refetch() }
  }

  const active   = programs.filter(p => p.status !== 'Archived')
  const archived = programs.filter(p => p.status === 'Archived')

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Programs</h1>
        <button className="btn btn-primary" onClick={() => navigate('/forge/programs/new')}>
          New program →
        </button>
      </div>

      <div className="card">
        {isLoading && (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        {!isLoading && active.length === 0 && (
          <div className="empty-state">
            No programs. Build one.
          </div>
        )}

        {active.length > 0 && (
          <table className="forge-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Weeks</th>
                <th>Days/wk</th>
                <th>Edited</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(p => (
                <ProgramRow key={p.id} p={p} onAction={handleAction} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {archived.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Archived</p>
          <div className="card">
            <table className="forge-table">
              <thead>
                <tr>
                  <th>Program</th><th>Weeks</th><th>Days/wk</th><th>Edited</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {archived.map(p => <ProgramRow key={p.id} p={p} onAction={handleAction} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
