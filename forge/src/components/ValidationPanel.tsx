import { useProgramStore } from '../store/programStore'
import type { ValidationResult } from '../types/program'

function ResultRow({ r }: { r: ValidationResult }) {
  const isError = r.severity === 'error'
  return (
    <div style={{
      padding: '10px 14px',
      marginBottom: 6,
      borderRadius: 6,
      background: isError ? 'rgba(201,79,42,0.05)' : 'rgba(140,96,41,0.05)',
      borderLeft: `2px solid ${isError ? 'var(--color-error)' : 'var(--color-accent)'}`,
    }}>
      <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4 }}>{r.message}</p>
      {r.path && (
        <p style={{
          fontSize: 10, color: 'var(--color-dim)',
          fontFamily: 'var(--font-serif)', marginTop: 3,
          letterSpacing: '0.04em',
        }}>{r.path}</p>
      )}
    </div>
  )
}

export default function ValidationPanel() {
  const { validationResults, setShowValidation, program, saveDraft } = useProgramStore()

  const errors   = validationResults.filter(r => r.severity === 'error')
  const warnings = validationResults.filter(r => r.severity === 'warning')
  const isClean  = errors.length === 0

  const handlePublish = () => {
    useProgramStore.setState(s => ({
      program: { ...s.program, status: 'Published' },
      showValidation: false,
    }))
    saveDraft()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,23,16,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={() => setShowValidation(false)}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          borderRadius: 10,
          width: 520, maxHeight: '78vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--color-rule)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontSize: 15, fontWeight: 500,
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-ink)',
            }}>Validation</h2>
            <p style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
              {program.name || 'Untitled program'}
            </p>
          </div>
          <button
            onClick={() => setShowValidation(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-dim)', fontSize: 18, lineHeight: 1, padding: 2,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          {validationResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>✓</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>
                All checks passed.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 4, fontStyle: 'italic' }}>
                Ready to publish.
              </p>
            </div>
          ) : (
            <>
              {errors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-error)', marginBottom: 8,
                  }}>
                    {errors.length} error{errors.length !== 1 ? 's' : ''} — must fix
                  </p>
                  {errors.map(r => <ResultRow key={r.id} r={r} />)}
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-accent)', marginBottom: 8,
                  }}>
                    {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                  </p>
                  {warnings.map(r => <ResultRow key={r.id} r={r} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--color-rule)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button className="btn btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setShowValidation(false)}>
            Cancel
          </button>
          {isClean && (
            <button className="btn btn-primary" style={{ height: 32, fontSize: 12 }} onClick={handlePublish}>
              Publish →
            </button>
          )}
          {!isClean && warnings.length > 0 && errors.length === 0 && (
            <button className="btn btn-outline" style={{ height: 32, fontSize: 12 }} onClick={handlePublish}>
              Publish with warnings
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
