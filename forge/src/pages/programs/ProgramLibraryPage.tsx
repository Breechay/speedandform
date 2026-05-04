import { useNavigate } from 'react-router-dom'
import { usePrograms, useArchiveProgram, useDuplicateProgram } from '../../hooks/useForge'
import type { ProgramListItem } from '../../api/programs'

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid var(--color-rule)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Draft:     { background: 'rgba(186,117,23,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(186,117,23,0.25)' },
  Published: { background: 'rgba(45,102,69,0.08)',  color: '#2D6645',             border: '1px solid rgba(45,102,69,0.2)' },
  Archived:  { background: 'transparent',            color: 'var(--color-dim)',    border: '1px solid var(--color-rule)' },
}

export function ProgramLibraryPage() {
  const navigate = useNavigate()
  const { data: allPrograms = [], isLoading } = usePrograms()
  const archive = useArchiveProgram()
  const duplicate = useDuplicateProgram()

  const programs = allPrograms.filter(p => !p.isTemplate)
  const templates = allPrograms.filter(p => p.isTemplate)

  function handleDuplicate(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    duplicate.mutate(id, {
      onSuccess: (newId) => navigate(`/forge/programs/${newId}`),
    })
  }

  function handleArchive(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('Archive this program?')) archive.mutate(id)
  }

  function ProgramTable({ items, showAssign }: { items: ProgramListItem[], showAssign: boolean }) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Program', 'Weeks', 'Days/Wk', 'Last Edited', 'Status', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '14px 16px 10px',
                  textAlign: i === 5 ? 'right' : 'left',
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
            {items.length === 0 ? (
              <tr><td colSpan={6}>
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-dim)', fontSize: 14 }}>
                  No programs yet.
                </div>
              </td></tr>
            ) : items.map(p => (
              <tr key={p.id}
                onClick={() => navigate(`/forge/programs/${p.id}`)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>
                  {p.name}
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                    {p.targetWeeks ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                    {p.daysPerWeek ? `${p.daysPerWeek}×` : '—'}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-chrome)' }}>
                    {formatDate(p.updatedAt)}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 9px', borderRadius: 20,
                    fontSize: 11, fontWeight: 500,
                    ...STATUS_STYLE[p.status],
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-rule-light)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {showAssign && p.status === 'Published' && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/forge/programs/${p.id}/assign`) }}
                        style={{ height: 28, padding: '0 10px', background: 'transparent', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Assign →
                      </button>
                    )}
                    <button
                      onClick={e => handleDuplicate(p.id, e)}
                      style={{ height: 28, padding: '0 10px', background: 'transparent', color: 'var(--color-chrome)', border: '1px solid var(--color-rule)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                    >
                      Duplicate
                    </button>
                    {p.status !== 'Archived' && (
                      <button
                        onClick={e => handleArchive(p.id, e)}
                        style={{ height: 28, padding: '0 10px', background: 'transparent', color: 'var(--color-dim)', border: '1px solid var(--color-rule)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)' }}>Programs</h1>
        <button
          onClick={() => navigate('/forge/programs/new')}
          style={{ height: 36, padding: '0 16px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          New program →
        </button>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <ProgramTable items={programs} showAssign />

          {templates.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 14 }}>
                Templates
              </div>
              <ProgramTable items={templates} showAssign={false} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
