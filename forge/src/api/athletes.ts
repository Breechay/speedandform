import { supabase } from '../lib/supabase'

export interface RosterAthlete {
  athleteId: string
  firstName: string
  lastName: string
  email: string
  assignmentId: string | null
  programTemplateId: string | null
  programName: string | null
  startDate: string | null
  assignmentStatus: 'active' | 'paused' | 'completed' | null
  lastSessionAt: string | null
  sessionsCompleted: number
  sessionsTotal: number
  status: 'Active' | 'Behind' | 'Complete' | 'No program'
  blockLabel: string | null
}

export interface AthleteDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  authUserId: string | null
}

export interface SessionInstance {
  id: string
  sessionName: string
  scheduledDate: string
  status: 'planned' | 'completed' | 'skipped'
  completedAt: string | null
  durationSeconds: number | null
  exerciseLogs: ExerciseLog[]
}

export interface ExerciseLog {
  exerciseId: string
  movementId: string
  movementName: string
  sets: SetLog[]
}

export interface SetLog {
  setNumber: number
  reps: number | null
  weightLb: number | null
  durationSeconds: number | null
}

export interface AssignedProgram {
  id: string
  programTemplateId: string
  programName: string
  status: 'active' | 'paused' | 'completed'
  startDate: string
  updatedAt: string
}

export interface StrengthSessionSummary {
  id: string
  sessionName: string
  completedAt: string
  durationSeconds: number | null
  topMovements: string[]
}

export interface RunningSessionSummary {
  id: string
  sessionType: string
  completedAt: string
  durationSeconds: number | null
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
}

export interface CoachNote {
  id: string
  content: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

function deriveStatus(row: {
  assignment_status: string | null
  sessions_completed: number
  sessions_total: number
  last_session_at: string | null
}): 'Active' | 'Behind' | 'Complete' | 'No program' {
  if (!row.assignment_status) return 'No program'
  if (row.assignment_status !== 'active') return 'Complete'
  if (row.sessions_total > 0 && row.sessions_completed >= row.sessions_total) return 'Complete'
  // Simple heuristic for "behind": < 70% completion rate when program has started
  if (row.sessions_total > 0 && row.sessions_completed / row.sessions_total < 0.7) {
    // Only "Behind" if we're past the first week
    if (row.last_session_at) {
      const daysSince = (Date.now() - new Date(row.last_session_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince > 7) return 'Behind'
    }
  }
  return 'Active'
}

export async function getRoster(): Promise<RosterAthlete[]> {
  const { data, error } = await supabase
    .from('coach_roster')
    .select('*')

  if (error) throw error
  if (!data) return []

  return data.map((row: any) => {
    // coach_roster view: athlete_id=slug, name=full name, display_name=short name
    const nameParts = (row.name || row.display_name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    return {
    athleteId: row.athlete_id,
    firstName,
    lastName,
    email: row.email || '',
    assignmentId: row.assignment_id,
    programTemplateId: row.program_template_id,
    programName: row.program_name,
    startDate: row.start_date,
    assignmentStatus: row.assignment_status,
    lastSessionAt: row.last_session_at,
    sessionsCompleted: Number(row.sessions_completed) || 0,
    sessionsTotal: Number(row.sessions_total) || 0,
    status: deriveStatus(row),
    blockLabel: null, // derived from program structure in Phase 5
  }
  })
}

export async function getAthlete(athleteId: string): Promise<AthleteDetail> {
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id, first_name, last_name, email, slug')
    .or(`slug.eq.${athleteId},id.eq.${athleteId}`)
    .maybeSingle()

  if (profile) {
    return {
      id: profile.slug ?? profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      authUserId: profile.id,
    }
  }

  const { data, error } = await supabase
    .from('athletes')
    .select('slug, name, display_name, auth_user_id, email')
    .eq('slug', athleteId)
    .single()

  if (error) throw error
  const nameParts = (data.name || '').split(' ')
  return {
    id: data.slug,
    firstName: nameParts[0] || data.display_name || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: data.email || '',
    authUserId: data.auth_user_id ?? null,
  }
}

export async function getAthleteSessions(
  athleteId: string,
  assignmentId?: string
): Promise<SessionInstance[]> {
  let query = supabase
    .from('session_instances')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('scheduled_date', { ascending: false })

  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data) return []

  return data.map((row: any) => ({
    id: row.id,
    sessionName: row.session_name,
    scheduledDate: row.scheduled_date,
    status: row.status,
    completedAt: row.completed_at,
    durationSeconds: row.duration_seconds,
    exerciseLogs: row.exercise_logs || [],
  }))
}

export async function getAthletePrograms(athleteId: string): Promise<AssignedProgram[]> {
  const { data, error } = await supabase
    .from('program_assignments')
    .select(`
      id,
      program_template_id,
      program_templates(name),
      status,
      start_date,
      updated_at
    `)
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((row: any) => ({
    id: row.id,
    programTemplateId: row.program_template_id,
    programName: row.program_templates?.name || 'Unknown program',
    status: row.status,
    startDate: row.start_date,
    updatedAt: row.updated_at,
  }))
}

export async function getAthleteStrengthSessions(
  authUserId: string
): Promise<StrengthSessionSummary[]> {
  const { data, error } = await supabase
    .from('strength_sessions')
    .select(`
      id, session_name, completed_at, duration_seconds,
      set_logs (movement_name, set_index)
    `)
    .eq('athlete_id', authUserId)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) return []
  if (!data) return []

  return data.map((s: any) => {
    const topMovements = Array.from(
      new Map(
        (s.set_logs ?? [])
          .sort((a: any, b: any) => (a.set_index ?? 0) - (b.set_index ?? 0))
          .map((log: any) => [log.movement_name, log.movement_name])
      ).values()
    ).slice(0, 3) as string[]

    return {
      id: s.id,
      sessionName: s.session_name || 'Strength session',
      completedAt: s.completed_at,
      durationSeconds: s.duration_seconds,
      topMovements,
    }
  })
}

export async function getAthleteRunningSessions(
  authUserId: string
): Promise<RunningSessionSummary[]> {
  const { data, error } = await supabase
    .from('running_sessions')
    .select('id, session_type, started_at, completed_at, duration_seconds, distance_meters, avg_pace_seconds_per_km')
    .eq('athlete_id', authUserId)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) return []
  if (!data) return []

  return data.map((r: any) => ({
    id: r.id,
    sessionType: r.session_type,
    completedAt: r.completed_at ?? r.started_at,
    durationSeconds: r.duration_seconds,
    distanceMeters: r.distance_meters,
    avgPaceSecondsPerKm: r.avg_pace_seconds_per_km,
  }))
}

export async function getCoachNotes(athleteId: string): Promise<CoachNote[]> {
  const { data, error } = await supabase
    .from('coach_notes')
    .select('id, content, is_shared, created_at, updated_at')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []).map((row: any) => ({
    id: row.id,
    content: row.content,
    isShared: !!row.is_shared,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function saveCoachNote(
  athleteId: string,
  content: string,
  isShared: boolean
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('coach_notes')
    .insert({
      coach_id: userData.user.id,
      athlete_id: athleteId,
      content,
      is_shared: isShared,
    })

  if (error) throw error
}

export async function deleteCoachNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
}

export async function createAthlete(
  firstName: string,
  lastName: string,
  email: string
): Promise<void> {
  // Get current coach id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  // Create athlete auth account via edge function (backend handles invite email)
  const { error } = await supabase.functions.invoke('create-athlete', {
    body: { firstName, lastName, email, coachId: userData.user.id },
  })

  if (error) {
    if (error.message?.includes('already exists')) {
      throw new Error('An athlete with this email already exists.')
    }
    throw error
  }
}
