import { useState } from 'react'
import type { AthleteAccountabilitySnapshot } from '../api/accountability'
import { saveCoachWaistCheckIn } from '../api/accountability'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatRelativeDays(days: number): string {
  if (days >= 99) return 'never'
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function weekAnchorGrid(logs: AthleteAccountabilitySnapshot['intakeLogs']) {
  const weekStart = new Date()
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return DAY_LABELS.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const isFuture = d > today
    const dayLogs = isFuture ? [] : logs.filter((l) => {
      const eaten = new Date(l.eatenAt)
      return eaten.toDateString() === d.toDateString()
    })
    const hasProtein = dayLogs.some((l) => l.hadProtein === true)
    const hasAlcohol = dayLogs.some((l) => l.alcohol)
    const logged = dayLogs.length > 0
    return { label, hasProtein, hasAlcohol, logged, isFuture }
  })
}

interface Props {
  authUserId: string
  snapshot: AthleteAccountabilitySnapshot
  onRefresh: () => void
}

export function AccountabilitySummary({ authUserId, snapshot, onRefresh }: Props) {
  const [waistInput, setWaistInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const grid = weekAnchorGrid(snapshot.intakeLogs)
  const waistDelta =
    snapshot.latestWaist && snapshot.previousWaist
      ? snapshot.latestWaist.waistInches - snapshot.previousWaist.waistInches
      : null

  const handleSaveWaist = async () => {
    const val = parseFloat(waistInput)
    if (!val || val <= 0) {
      setError('Enter waist in inches.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveCoachWaistCheckIn(authUserId, val)
      setWaistInput('')
      onRefresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      border: `1px solid ${snapshot.watchState === 'WATCH' ? 'rgba(201,79,42,0.35)' : 'var(--color-rule)'}`,
      borderRadius: 8,
      padding: '18px 20px',
      marginBottom: 28,
      background: snapshot.watchState === 'WATCH' ? 'rgba(201,79,42,0.04)' : 'var(--color-surface)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{
            fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            fontWeight: 700, color: 'var(--color-dim)', marginBottom: 6,
          }}>
            Accountability
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>
            Week of {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
          padding: '4px 10px', borderRadius: 4,
          background: snapshot.watchState === 'WATCH' ? 'rgba(201,79,42,0.12)' : 'rgba(45,102,69,0.10)',
          color: snapshot.watchState === 'WATCH' ? '#C94F2A' : '#2D6645',
        }}>
          {snapshot.watchState}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 18 }}>
        <Stat label="Sessions" value={`${snapshot.strengthSessionsThisWeek}/${snapshot.strengthSessionsExpected}`} />
        <Stat label="Protein days" value={String(snapshot.proteinDaysThisWeek)} />
        <StatColored
          label="Alcohol"
          value={snapshot.alcoholThisWeek ? 'This week' : 'None'}
          warn={snapshot.alcoholThisWeek}
        />
        <Stat label="Last log" value={formatRelativeDays(snapshot.daysSinceLastIntake)} />
        <Stat label="Last open" value={formatRelativeDays(snapshot.daysSinceLastOpen)} />
        <Stat
          label="Waist"
          value={snapshot.latestWaist ? `${snapshot.latestWaist.waistInches.toFixed(1)}″` : '—'}
          sub={
            waistDelta != null
              ? {
                  text: `${waistDelta > 0 ? '+' : ''}${waistDelta.toFixed(1)}″ vs last`,
                  warn: waistDelta > 0,
                }
              : undefined
          }
        />
      </div>

      <p style={{ fontSize: 11, color: 'var(--color-dim)', marginBottom: 10 }}>
        Next: {snapshot.nextSessionLabel}
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {grid.map((d, i) => (
          <div key={`${d.label}-${i}`} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: 28, borderRadius: 4, marginBottom: 4,
              background: d.isFuture
                ? 'transparent'
                : d.hasProtein
                  ? 'rgba(140,96,41,0.22)'
                  : d.logged
                    ? 'rgba(107,102,96,0.12)'
                    : 'rgba(107,102,96,0.06)',
              border: d.hasAlcohol
                ? '1px solid rgba(201,79,42,0.5)'
                : d.isFuture
                  ? '1px dashed rgba(107,102,96,0.12)'
                  : '1px solid transparent',
              opacity: d.isFuture ? 0.35 : 1,
            }} />
            <span style={{ fontSize: 8, color: 'var(--color-dim)', letterSpacing: '0.06em' }}>{d.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          step="0.1"
          placeholder="Waist ″"
          value={waistInput}
          onChange={(e) => setWaistInput(e.target.value)}
          style={{
            width: 88, height: 32, padding: '0 10px',
            border: '1px solid var(--color-rule)', borderRadius: 6,
            fontSize: 13, background: 'var(--color-bg)',
          }}
        />
        <button
          onClick={handleSaveWaist}
          disabled={saving}
          style={{
            height: 32, padding: '0 14px', border: 'none', borderRadius: 6,
            background: 'var(--color-accent)', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Log waist →'}
        </button>
        {error && <span style={{ fontSize: 11, color: '#C94F2A' }}>{error}</span>}
      </div>
    </div>
  )
}

function StatColored({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, color: warn ? '#C94F2A' : 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>
        {value}
      </p>
    </div>
  )
}

function Stat({ label, value, sub }: {
  label: string
  value: string
  sub?: { text: string; warn: boolean }
}) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-serif)', marginBottom: sub ? 2 : 0 }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: 10,
          color: sub.warn ? '#C94F2A' : '#2D6645',
          fontWeight: 500,
          margin: 0,
        }}>
          {sub.text}
        </p>
      )}
    </div>
  )
}
