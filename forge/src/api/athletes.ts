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

  return data.map((row: any) => ({
    athleteId: row.athlete_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
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
  }))
}

export async function getAthlete(athleteId: string): Promise<AthleteDetail> {
  const { data, error } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, email')
    .eq('id', athleteId)
    .single()

  if (error) throw error
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
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
