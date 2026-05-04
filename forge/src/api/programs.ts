import { supabase } from '../lib/supabase'
import type { ProgramTemplate, ProgramStatus } from '../types/program'

export interface ProgramListItem {
  id: string
  name: string
  status: ProgramStatus
  targetWeeks: number | null
  daysPerWeek: number | null
  isTemplate: boolean
  updatedAt: string
}

// ── List ─────────────────────────────────────────────────────

export async function getPrograms(): Promise<ProgramListItem[]> {
  const { data, error } = await supabase
    .from('program_templates')
    .select('id, name, status, target_weeks, days_per_week, is_template, updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    targetWeeks: row.target_weeks,
    daysPerWeek: row.days_per_week,
    isTemplate: row.is_template,
    updatedAt: row.updated_at,
  }))
}

// ── Single program (full structure) ──────────────────────────

export async function getProgram(id: string): Promise<ProgramTemplate> {
  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    sourceLabel: data.source_label || '',
    targetWeeks: data.target_weeks,
    daysPerWeek: data.days_per_week,
    defaultRestSeconds: data.default_rest_seconds,
    notes: data.notes || '',
    status: data.status,
    isTemplate: data.is_template,
    blocks: data.structure?.blocks || [],
    lastSaved: data.updated_at,
  }
}

// ── Create ────────────────────────────────────────────────────

export async function createProgram(program: ProgramTemplate): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id: userData.user.id,
      name: program.name || 'Untitled program',
      source_label: program.sourceLabel || null,
      target_weeks: program.targetWeeks,
      days_per_week: program.daysPerWeek,
      default_rest_seconds: (program as any).defaultRestSeconds || null,
      notes: program.notes || null,
      status: 'Draft',
      is_template: false,
      structure: { blocks: program.blocks },
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// ── Save (upsert structure) ───────────────────────────────────

export async function saveProgram(program: ProgramTemplate): Promise<void> {
  const { error } = await supabase
    .from('program_templates')
    .update({
      name: program.name,
      source_label: program.sourceLabel || null,
      target_weeks: program.targetWeeks,
      days_per_week: program.daysPerWeek,
      default_rest_seconds: (program as any).defaultRestSeconds || null,
      notes: program.notes || null,
      structure: { blocks: program.blocks },
    })
    .eq('id', program.id)

  if (error) throw error
}

// ── Publish ───────────────────────────────────────────────────

export async function publishProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from('program_templates')
    .update({ status: 'Published' })
    .eq('id', id)

  if (error) throw error
}

// ── Archive ───────────────────────────────────────────────────

export async function archiveProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from('program_templates')
    .update({ status: 'Archived' })
    .eq('id', id)

  if (error) throw error
}

// ── Duplicate ─────────────────────────────────────────────────

export async function duplicateProgram(id: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data: original, error: fetchError } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id: userData.user.id,
      name: `${original.name} (copy)`,
      source_label: original.source_label,
      target_weeks: original.target_weeks,
      days_per_week: original.days_per_week,
      default_rest_seconds: original.default_rest_seconds,
      notes: original.notes,
      status: 'Draft',
      is_template: false,
      structure: original.structure,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// ── Save as template ──────────────────────────────────────────

export async function saveAsTemplate(id: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data: original, error: fetchError } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id: userData.user.id,
      name: `${original.name} — Template`,
      source_label: original.source_label,
      target_weeks: original.target_weeks,
      days_per_week: original.days_per_week,
      default_rest_seconds: original.default_rest_seconds,
      notes: original.notes,
      status: 'Draft',
      is_template: true,
      structure: original.structure,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// ── Assign ────────────────────────────────────────────────────

export async function assignProgram(
  programId: string,
  athleteIds: string[],
  startDate: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  // Pause any active assignments for selected athletes
  await supabase
    .from('program_assignments')
    .update({ status: 'paused' })
    .in('athlete_id', athleteIds)
    .eq('status', 'active')

  // Create new assignments
  const assignments = athleteIds.map(athleteId => ({
    program_template_id: programId,
    athlete_id: athleteId,
    coach_id: userData.user!.id,
    start_date: startDate,
    status: 'active',
  }))

  const { error } = await supabase
    .from('program_assignments')
    .insert(assignments)

  if (error) throw error
}
