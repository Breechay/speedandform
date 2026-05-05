import { supabase } from '../lib/supabase'

export type FieldRecordKind = 'running' | 'strength'

export interface FieldAthlete {
  id: string
  slug: string
  displayName: string
  disciplines: string[]
  shortLine: string | null
  location: string | null
  cohort: string | null
  shareSessions: 'none' | 'key' | 'all'
  sharePace: boolean
  shareWeights: boolean
}

export interface FieldPost {
  id: string
  athleteId: string
  athleteName: string
  athleteSlug: string
  content: string | null
  imageUrl: string | null
  postedAt: string
  reactions: string[]
  replies: Array<{
    id: string
    athleteName: string
    content: string
    postedAt: string
  }>
}

export interface FieldRecordCard {
  id: string
  kind: FieldRecordKind
  athleteId: string
  athleteName: string
  athleteSlug: string
  sessionLabel: string
  completedAt: string | null
  durationSeconds: number | null
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  topMovements: string[]
  note: string | null
}

function toDisplayName(row: any): string {
  if (row.display_name && typeof row.display_name === 'string') return row.display_name
  const first = row.first_name ?? ''
  const last = row.last_name ?? ''
  const name = `${first} ${last}`.trim()
  if (name) return name
  if (row.slug && typeof row.slug === 'string') return row.slug
  return 'Athlete'
}

async function getAthleteProfilesBase(): Promise<any[]> {
  // Newer shape (field visibility + public profile metadata)
  const modern = await supabase
    .from('athlete_profiles')
    .select('id, slug, display_name, first_name, last_name, disciplines, bio, location, field_cohort, share_sessions, share_pace, share_weights, is_public')
    .eq('is_public', true)
  if (!modern.error) return modern.data ?? []

  // Safety-first fallback:
  // if field visibility columns are unavailable, return no public athletes
  // instead of risking private profile leakage.
  return []
}

export async function getFieldAthletes(cohort?: string): Promise<FieldAthlete[]> {
  const rows = await getAthleteProfilesBase()
  const mapped = rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    displayName: toDisplayName(row),
    disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
    shortLine: row.bio ?? null,
    location: row.location ?? null,
    cohort: row.field_cohort ?? null,
    shareSessions: (row.share_sessions ?? 'none') as 'none' | 'key' | 'all',
    sharePace: !!row.share_pace,
    shareWeights: !!row.share_weights,
  }))
  const filtered = cohort
    ? mapped.filter((a) => (a.cohort ?? '').toLowerCase() === cohort.toLowerCase())
    : mapped
  return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

async function getFieldPostRows(athleteIds: string[]): Promise<any[]> {
  if (athleteIds.length === 0) return []
  const { data, error } = await supabase
    .from('field_posts')
    .select('id, athlete_id, content, image_url, posted_at, deleted_at')
    .in('athlete_id', athleteIds)
    .is('deleted_at', null)
    .order('posted_at', { ascending: false })
    .limit(40)
  if (error) return []
  return data ?? []
}

export async function getFieldStream(cohort?: string): Promise<FieldPost[]> {
  const athletes = await getFieldAthletes(cohort)
  const athleteById = new Map(athletes.map((a) => [a.id, a]))
  const postRows = await getFieldPostRows(athletes.map((a) => a.id))
  if (postRows.length === 0) return []

  const postIds = postRows.map((p: any) => p.id)
  const [{ data: reactionRows }, { data: replyRows }] = await Promise.all([
    supabase.from('field_reactions').select('post_id, reaction_type').in('post_id', postIds),
    supabase.from('field_replies').select('id, post_id, athlete_id, content, posted_at, deleted_at').in('post_id', postIds).is('deleted_at', null),
  ])

  const repliesByPost = new Map<string, any[]>()
  for (const row of replyRows ?? []) {
    const next = repliesByPost.get(row.post_id) ?? []
    next.push(row)
    repliesByPost.set(row.post_id, next)
  }

  const reactionByPost = new Map<string, Set<string>>()
  for (const row of reactionRows ?? []) {
    const next = reactionByPost.get(row.post_id) ?? new Set<string>()
    next.add(row.reaction_type)
    reactionByPost.set(row.post_id, next)
  }

  return postRows.map((row: any) => {
    const athlete = athleteById.get(row.athlete_id)
    const replies = (repliesByPost.get(row.id) ?? [])
      .sort((a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime())
      .slice(0, 3)
      .map((reply: any) => {
        const replyAthlete = athleteById.get(reply.athlete_id)
        return {
          id: reply.id,
          athleteName: replyAthlete?.displayName ?? 'Athlete',
          content: reply.content,
          postedAt: reply.posted_at,
        }
      })

    return {
      id: row.id,
      athleteId: row.athlete_id,
      athleteName: athlete?.displayName ?? 'Athlete',
      athleteSlug: athlete?.slug ?? '',
      content: row.content ?? null,
      imageUrl: row.image_url ?? null,
      postedAt: row.posted_at,
      reactions: Array.from(reactionByPost.get(row.id) ?? []),
      replies,
    }
  })
}

export async function getFieldRecordCards(cohort?: string): Promise<FieldRecordCard[]> {
  const athletes = await getFieldAthletes(cohort)
  if (athletes.length === 0) return []
  const athleteById = new Map(athletes.map((a) => [a.id, a]))
  const athleteIds = athletes.map((a) => a.id)

  const [{ data: runningRows }, { data: strengthRows }] = await Promise.all([
    supabase
      .from('running_sessions')
      .select('id, athlete_id, session_type, completed_at, started_at, duration_seconds, distance_meters, avg_pace_seconds_per_km, note')
      .in('athlete_id', athleteIds)
      .order('completed_at', { ascending: false })
      .limit(80),
    supabase
      .from('strength_sessions')
      .select('id, athlete_id, session_name, completed_at, started_at, duration_seconds, note, set_logs (movement_name, set_index)')
      .in('athlete_id', athleteIds)
      .order('completed_at', { ascending: false })
      .limit(80),
  ])

  const runningCards: FieldRecordCard[] = (runningRows ?? []).map((row: any) => {
    const athlete = athleteById.get(row.athlete_id)
    const canShowPace = !!athlete?.sharePace
    return {
      id: row.id,
      kind: 'running',
      athleteId: row.athlete_id,
      athleteName: athlete?.displayName ?? 'Athlete',
      athleteSlug: athlete?.slug ?? '',
      sessionLabel: row.session_type ? String(row.session_type).replace('_', ' ') : 'Run',
      completedAt: row.completed_at ?? row.started_at,
      durationSeconds: row.duration_seconds ?? null,
      distanceMeters: row.distance_meters ?? null,
      avgPaceSecondsPerKm: canShowPace ? row.avg_pace_seconds_per_km ?? null : null,
      topMovements: [],
      note: row.note ?? null,
    }
  })

  const strengthCards: FieldRecordCard[] = (strengthRows ?? []).map((row: any) => {
    const athlete = athleteById.get(row.athlete_id)
    const topMovements = Array.from(
      new Map(
        (row.set_logs ?? [])
          .sort((a: any, b: any) => (a.set_index ?? 0) - (b.set_index ?? 0))
          .map((log: any) => [log.movement_name, log.movement_name]),
      ).values(),
    ).slice(0, 3) as string[]

    return {
      id: row.id,
      kind: 'strength',
      athleteId: row.athlete_id,
      athleteName: athlete?.displayName ?? 'Athlete',
      athleteSlug: athlete?.slug ?? '',
      sessionLabel: row.session_name ?? 'Strength',
      completedAt: row.completed_at ?? row.started_at,
      durationSeconds: row.duration_seconds ?? null,
      distanceMeters: null,
      avgPaceSecondsPerKm: null,
      topMovements,
      note: row.note ?? null,
    }
  })

  return [...runningCards, ...strengthCards]
    .sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return tb - ta
    })
    .slice(0, 80)
}

export async function getFieldAthleteBySlug(slug: string): Promise<FieldAthlete | null> {
  const athletes = await getFieldAthletes()
  return athletes.find((a) => a.slug === slug) ?? null
}
