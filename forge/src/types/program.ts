// ─── Movement Catalog ───────────────────────────────────────────────────────

export type MovementIntent = 'Controlled' | 'Explosive' | 'Steady' | 'Accessory'

export interface Movement {
  movementId: string
  displayName: string
  muscleGroup: string[]
  defaultCue: string
  defaultRestSeconds: number
  movementIntent: MovementIntent
}

// ─── Set Prescription ────────────────────────────────────────────────────────

export interface SetPrescription {
  id: string
  setNumber: number          // auto-incremented, 1-based
  reps: number | null        // optional if duration set
  weightLb: number | null    // null = unspecified, 0 = bodyweight
  durationSeconds: number | null  // optional if reps set
}

// ─── Progression Rule ────────────────────────────────────────────────────────

export type ProgressionRuleType = 'None' | 'Linear' | 'Double' | 'StepDeload' | 'Fixed'

export interface ProgressionRule {
  type: ProgressionRuleType
  // Linear
  incrementLb?: number
  // Double progression
  repRangeMin?: number
  repRangeMax?: number
  // Step-deload
  progressionWeeks?: number
  deloadPercent?: number
}

// ─── Exercise ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string
  movementId: string | null   // null = not yet selected
  movementIntent: MovementIntent
  isPrimeMover: boolean
  restSeconds: number | null  // null = use policy default
  cue: string
  sets: SetPrescription[]
  progression: ProgressionRule
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  name: string
  dayIndex: number | null     // 0=Mon…6=Sun, null = unset
  intensityLabel: string      // optional, e.g. "Heavy"
  exercises: Exercise[]
}

// ─── Week ────────────────────────────────────────────────────────────────────

export interface Week {
  id: string
  weekNumber: number
  sessions: Session[]
}

// ─── Block ───────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  name: string
  weeks: Week[]
}

// ─── Program Template ────────────────────────────────────────────────────────

export type ProgramStatus = 'Draft' | 'Published' | 'Archived'

export interface ProgramTemplate {
  id: string
  name: string
  sourceLabel: string
  targetWeeks: number | null
  daysPerWeek: number | null
  notes: string
  status: ProgramStatus
  blocks: Block[]
  lastSaved: string | null     // ISO timestamp
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationResult {
  id: string
  severity: ValidationSeverity
  message: string
  path?: string   // e.g. "Block 1 > Week 2 > Session 3"
}

// ─── Tree Selection ──────────────────────────────────────────────────────────

export type SelectionType = 'program' | 'block' | 'week' | 'session'

export interface TreeSelection {
  type: SelectionType
  blockId?: string
  weekId?: string
  sessionId?: string
}
