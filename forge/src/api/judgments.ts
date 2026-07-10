import { supabase } from '../lib/supabase'

export interface CoachJudgment {
  id: string
  athleteAuthId: string
  programId: string
  text: string
  isActive: boolean
  expiresAt: string | null
  clearAfterNextLift: boolean
  clearedAt: string | null
  createdAt: string
  updatedAt: string
}

function mapRow(row: Record<string, unknown>): CoachJudgment {
  return {
    id: String(row.id),
    athleteAuthId: String(row.athlete_auth_id),
    programId: String(row.program_id),
    text: String(row.text),
    isActive: !!row.is_active,
    expiresAt: (row.expires_at as string | null) ?? null,
    clearAfterNextLift: !!row.clear_after_next_lift,
    clearedAt: (row.cleared_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function getActiveCoachJudgment(
  athleteAuthId: string,
  programId: string,
): Promise<CoachJudgment | null> {
  const { data, error } = await supabase
    .from('coach_judgments')
    .select(
      'id, athlete_auth_id, program_id, text, is_active, expires_at, clear_after_next_lift, cleared_at, created_at, updated_at',
    )
    .eq('athlete_auth_id', athleteAuthId)
    .eq('program_id', programId)
    .eq('is_active', true)
    .is('cleared_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const row = mapRow(data as Record<string, unknown>)
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= Date.now()) return null
  return row
}

export interface SetCoachJudgmentInput {
  athleteAuthId: string
  programId: string
  text: string
  expiresAt?: string | null
  clearAfterNextLift?: boolean
}

export async function setCoachJudgment(input: SetCoachJudgmentInput): Promise<CoachJudgment> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const trimmed = input.text.trim()
  if (!trimmed) throw new Error('Judgment text is required')

  await supabase
    .from('coach_judgments')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('athlete_auth_id', input.athleteAuthId)
    .eq('program_id', input.programId)
    .eq('is_active', true)

  const { data, error } = await supabase
    .from('coach_judgments')
    .insert({
      coach_id: userData.user.id,
      athlete_auth_id: input.athleteAuthId,
      program_id: input.programId,
      text: trimmed,
      is_active: true,
      expires_at: input.expiresAt ?? null,
      clear_after_next_lift: input.clearAfterNextLift ?? false,
    })
    .select(
      'id, athlete_auth_id, program_id, text, is_active, expires_at, clear_after_next_lift, cleared_at, created_at, updated_at',
    )
    .single()

  if (error || !data) throw error ?? new Error('Failed to save judgment')
  return mapRow(data as Record<string, unknown>)
}

export async function clearCoachJudgment(judgmentId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_judgments')
    .update({
      is_active: false,
      cleared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', judgmentId)

  if (error) throw error
}
