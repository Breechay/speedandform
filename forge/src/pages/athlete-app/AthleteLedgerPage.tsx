import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { athleteSignOut, getAthleteProfile } from '../../api/athleteInvite'
import { supabase } from '../../lib/supabase'
import { useAthleteStore } from '../../store/athleteStore'
import { AthleteLayout } from '../../components/AthleteLayout'

const C = {
  surface: '#FAFAF7',
  ink: '#1A1710',
  accent: '#8C6029',
  dim: '#998F85',
  rule: '#DDD9D0',
}

type StrengthSession = {
  id: string
  session_name: string
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  set_logs?: Array<{ movement_name: string; set_index: number }>
}

type RunningSession = {
  id: string
  session_type: string
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  distance_meters: number | null
  avg_pace_seconds_per_km: number | null
}

type LedgerItem = {
  id: string
  kind: 'strength' | 'running'
  name: string
  completedAt: string | null
  durationSeconds: number | null
  movements: string[]
  distanceMeters: number | null
  avgPacePerKm: number | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  if (hours < 1) return `${mins} min`
  return `${hours}h ${mins}m`
}

function formatDistance(distanceMeters: number | null, units: 'km' | 'mi') {
  if (!distanceMeters || distanceMeters <= 0) return '—'
  if (units === 'mi') {
    return `${(distanceMeters / 1609.344).toFixed(1)} mi`
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`
}

function formatPace(avgPaceSecondsPerKm: number | null, units: 'km' | 'mi') {
  if (!avgPaceSecondsPerKm || avgPaceSecondsPerKm <= 0) return '—'
  const secPerUnit = units === 'mi' ? avgPaceSecondsPerKm * 1.609344 : avgPaceSecondsPerKm
  const mins = Math.floor(secPerUnit / 60)
  const secs = Math.round(secPerUnit % 60).toString().padStart(2, '0')
  return `${mins}:${secs} /${units}`
}

export function AthleteLedgerPage() {
  const navigate = useNavigate()
  const { athlete, setAthlete, setLoading } = useAthleteStore()
  const [items, setItems] = useState<LedgerItem[]>([])
  const [filter, setFilter] = useState<'all' | 'strength' | 'running'>('all')
  const [units, setUnits] = useState<'km' | 'mi'>('km')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/forge/athlete/login', { replace: true })
        return
      }

      try {
        const profile = await getAthleteProfile(session.user.id)
        setAthlete(profile)

        // Best effort units preference. Default is km when signal is unavailable.
        const { data: unitPref } = await supabase
          .from('athlete_profiles')
          .select('preferred_units')
          .eq('id', session.user.id)
          .maybeSingle()

        if (unitPref?.preferred_units === 'mi') {
          setUnits('mi')
        }

        const { data: strengthSessions } = await supabase
          .from('strength_sessions')
          .select(`
            id, session_name, started_at, completed_at, duration_seconds,
            set_logs (movement_name, set_index)
          `)
          .eq('athlete_id', session.user.id)
          .order('completed_at', { ascending: false })
          .limit(50)

        const { data: runningSessions } = await supabase
          .from('running_sessions')
          .select('id, session_type, started_at, completed_at, duration_seconds, distance_meters, avg_pace_seconds_per_km')
          .eq('athlete_id', session.user.id)
          .order('completed_at', { ascending: false })
          .limit(50)

        const safeStrength = (strengthSessions ?? []) as StrengthSession[]
        const safeRunning = (runningSessions ?? []) as RunningSession[]

        const strengthItems: LedgerItem[] = safeStrength.map((s) => {
          const orderedDistinct = Array.from(
            new Map(
              (s.set_logs ?? [])
                .sort((a, b) => (a.set_index ?? 0) - (b.set_index ?? 0))
                .map((log) => [log.movement_name, log.movement_name]),
            ).values(),
          ).slice(0, 3)

          return {
            id: s.id,
            kind: 'strength',
            name: s.session_name || 'Strength session',
            completedAt: s.completed_at ?? s.started_at,
            durationSeconds: s.duration_seconds,
            movements: orderedDistinct,
            distanceMeters: null,
            avgPacePerKm: null,
          }
        })

        const runningItems: LedgerItem[] = safeRunning.map((r) => ({
          id: r.id,
          kind: 'running',
          name: r.session_type ? r.session_type.replace('_', ' ') : 'Run',
          completedAt: r.completed_at ?? r.started_at,
          durationSeconds: r.duration_seconds,
          movements: [],
          distanceMeters: r.distance_meters,
          avgPacePerKm: r.avg_pace_seconds_per_km,
        }))

        const merged = [...strengthItems, ...runningItems].sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0
          return tb - ta
        })

        setItems(merged)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    })
  }, [navigate, setAthlete, setLoading])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.kind === filter)
  }, [filter, items])

  const handleSignOut = async () => {
    await athleteSignOut()
    setAthlete(null)
    navigate('/forge/athlete/login', { replace: true })
  }

  if (!athlete) {
    return null
  }

  return (
    <AthleteLayout athlete={athlete} onSignOut={handleSignOut}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 400, color: C.ink, marginBottom: 16 }}>
          Ledger
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          {(['all', 'strength', 'running'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '0 0 6px',
                borderBottom: filter === tab ? `2px solid ${C.accent}` : '2px solid transparent',
                color: filter === tab ? C.ink : C.dim,
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: 80, color: C.dim, fontSize: 14, fontStyle: 'italic' }}>
            No sessions yet. Sessions logged in the app appear here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((item) => (
              <div key={`${item.kind}-${item.id}`} style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 6 }}>
                  {item.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, color: C.dim, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>{formatDate(item.completedAt)}</span>
                  <span>{formatDuration(item.durationSeconds)}</span>
                </div>
                {item.kind === 'strength' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {item.movements.map((movement) => (
                      <span key={movement} style={{ fontSize: 11, color: C.dim, fontFamily: "'JetBrains Mono', monospace", background: 'var(--color-rule-light)', padding: '2px 4px', borderRadius: 4 }}>
                        {movement}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: C.dim, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDistance(item.distanceMeters, units)} · {formatPace(item.avgPacePerKm, units)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AthleteLayout>
  )
}
