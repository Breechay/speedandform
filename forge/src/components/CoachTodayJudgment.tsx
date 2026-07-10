// Coach-entered stored judgment — one active line on athlete Forge Today.

import { useEffect, useState } from 'react'
import type { CoachJudgment } from '../api/judgments'

interface CoachTodayJudgmentProps {
  athleteAuthId: string
  programId: string
  active: CoachJudgment | null | undefined
  isLoading: boolean
  onSave: (input: {
    text: string
    expiresAt: string | null
    clearAfterNextLift: boolean
  }) => Promise<void>
  onClear: (judgmentId: string) => Promise<void>
  isSaving: boolean
}

export function CoachTodayJudgment({
  athleteAuthId,
  programId,
  active,
  isLoading,
  onSave,
  onClear,
  isSaving,
}: CoachTodayJudgmentProps) {
  const [text, setText] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [clearAfterNextLift, setClearAfterNextLift] = useState(false)

  useEffect(() => {
    if (active) {
      setText(active.text)
      setExpiresAt(active.expiresAt ? active.expiresAt.slice(0, 10) : '')
      setClearAfterNextLift(active.clearAfterNextLift)
    }
  }, [active?.id, active?.text, active?.expiresAt, active?.clearAfterNextLift])

  if (!athleteAuthId) return null

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 4 }}>
          Today judgment
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-chrome)', lineHeight: 1.5, margin: 0 }}>
          One line on Rod&apos;s Forge Today until you replace it, clear it, or it expires. Stored judgment — not a note feed.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {active && (
            <div
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderLeft: '2px solid var(--color-accent)',
                background: 'var(--color-surface)',
              }}
            >
              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 6 }}>
                Live on athlete Today
              </p>
              <p style={{ fontSize: 15, color: 'var(--color-ink)', whiteSpace: 'pre-wrap', margin: 0 }}>{active.text}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {active.clearAfterNextLift && (
                  <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                    Clears after next lift
                  </span>
                )}
                {active.expiresAt && (
                  <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                    Expires {active.expiresAt.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          )}

          <textarea
            className="input"
            rows={3}
            placeholder="Short session today. Main lifts only."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--color-dim)' }}>
              Optional expiry
              <input
                type="date"
                className="input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{ width: 160 }}
              />
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-dim)' }}>
              <input
                type="checkbox"
                checked={clearAfterNextLift}
                onChange={(e) => setClearAfterNextLift(e.target.checked)}
              />
              Clear after next lift
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={isSaving || !text.trim()}
              onClick={() =>
                void onSave({
                  text: text.trim(),
                  expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
                  clearAfterNextLift,
                })
              }
            >
              {active ? 'Replace judgment' : 'Set judgment'}
            </button>
            {active && (
              <button
                className="btn"
                disabled={isSaving}
                onClick={() => void onClear(active.id)}
              >
                Clear from Today
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'var(--color-dim)', marginTop: 12, marginBottom: 0 }}>
            Program: {programId}
          </p>
        </>
      )}
    </div>
  )
}
