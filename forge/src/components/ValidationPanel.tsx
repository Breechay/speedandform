import { useProgramStore } from '../store/programStore'

export default function ValidationPanel() {
  const { validationResults, setShowValidation, program, saveDraft } = useProgramStore()

  const errors = validationResults.filter((r) => r.severity === 'error')
  const warnings = validationResults.filter((r) => r.severity === 'warning')
  const isValid = errors.length === 0

  const handlePublish = () => {
    if (isValid) {
      // Phase 3: local state only — just mark as Published
      useProgramStore.setState((s) => ({
        program: { ...s.program, status: 'Published' },
        showValidation: false,
      }))
      saveDraft()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(26,23,16,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}
    onClick={() => setShowValidation(false)}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          borderRadius: 12,
          width: 560,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)' }}>
              Validation
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {program.name || 'Untitled program'}
            </p>
          </div>
          <button
            onClick={() => setShowValidation(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-dim)' }}
          >×</button>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          {validationResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>All checks passed.</p>
              <p style={{ fontSize: 13, color: 'var(--color-dim)', marginTop: 4 }}>Program is ready to publish.</p>
            </div>
          ) : (
            <>
              {errors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p className="label-mono" style={{ marginBottom: 8, color: '#D85A30' }}>
                    {errors.length} error{errors.length !== 1 ? 's' : ''} — must fix before publishing
                  </p>
                  {errors.map((r) => (
                    <div key={r.id} style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'rgba(216,90,48,0.06)',
                      borderRadius: 6,
                      marginBottom: 6,
                      borderLeft: '2px solid #D85A30',
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4 }}>{r.message}</p>
                        {r.path && (
                          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginTop: 3 }}>
                            {r.path}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {warnings.length > 0 && (
                <div>
                  <p className="label-mono" style={{ marginBottom: 8, color: 'var(--color-accent)' }}>
                    {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                  </p>
                  {warnings.map((r) => (
                    <div key={r.id} style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'rgba(186,117,23,0.06)',
                      borderRadius: 6,
                      marginBottom: 6,
                      borderLeft: '2px solid var(--color-accent)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4 }}>{r.message}</p>
                        {r.path && (
                          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginTop: 3 }}>
                            {r.path}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-rule)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button className="btn-ghost" onClick={() => setShowValidation(false)}>
            Cancel
          </button>
          {isValid ? (
            <button className="btn-primary" onClick={handlePublish}>
              Publish
            </button>
          ) : warnings.length > 0 && errors.length === 0 ? (
            <button className="btn-primary" onClick={handlePublish}>
              Publish anyway?
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
