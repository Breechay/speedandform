import { supabase } from '../lib/supabase'

export const ROD_ACCOUNTABILITY_PROGRAM_ID = 'rod_accountability_v1'

export interface IntakeLogRow {
  id: string
  programId: string
  eatenAt: string
  anchor: string | null
  hadProtein: boolean | null
  alcohol: boolean
  text: string
}

export interface WaistCheckInRow {
  id: string
  programId: string
  recordedAt: string
  waistInches: number
  enteredBy: 'coach' | 'athlete'
}

export interface AthleteAccountabilitySnapshot {
  intakeLogs: IntakeLogRow[]
  waistCheckIns: WaistCheckInRow[]
  lastOpenAt: string | null
  strengthSessionsThisWeek: number
  strengthSessionsExpected: number
  proteinDaysThisWeek: number
  alcoholThisWeek: boolean
  daysSinceLastIntake: number
  daysSinceLastOpen: number
  latestWaist: WaistCheckInRow | null
  previousWaist: WaistCheckInRow | null
  watchState: 'OK' | 'WATCH'
  nextSessionLabel: string
}

export type CoachContactState = 'OK' | 'WATCH' | 'ALCOHOL' | 'RETURN' | 'MISSED_SESSION'

export interface CoachPlaybookStatic {
  athletePattern: string
  defaultPosture: string
  doList: string[]
  avoidList: string[]
}

export interface CoachPlaybookBrief {
  contactState: CoachContactState
  statusLabel: string
  whyLines: string[]
  nextMove: string
  coachPosture: string
  suggestedText: string
  staticPlaybook: CoachPlaybookStatic
}

const ROD_COACH_PLAYBOOK_STATIC: CoachPlaybookStatic = {
  athletePattern:
    'Responds to presence. Falls apart solo. Shame turns one missed day into a lost week.',
  defaultPosture:
    'Brief. Factual. Forward-facing. Do not ask for the whole story.',
  doList: [
    'Point to the next fixed action',
    'Keep protein as the floor',
    'Treat alcohol as containment, not confession',
    'Text only when the dashboard shows drift',
  ],
  avoidList: [
    '"How\'s it going?"',
    'Long advice',
    'Autopsy after alcohol',
    'New goals after a good week',
    'Making him explain himself before returning',
  ],
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function daysBetween(from: string | null, to: Date = new Date()): number {
  if (!from) return 99
  const ms = to.getTime() - new Date(from).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function proteinDaysInWeek(logs: IntakeLogRow[], weekStart: Date): number {
  const daysWithProtein = new Set<string>()
  for (const log of logs) {
    if (log.hadProtein !== true) continue
    const eaten = new Date(log.eatenAt)
    if (eaten < weekStart) continue
    const key = eaten.toISOString().slice(0, 10)
    daysWithProtein.add(key)
  }
  return daysWithProtein.size
}

export function deriveWatchState(snapshot: Omit<AthleteAccountabilitySnapshot, 'watchState'>): 'OK' | 'WATCH' {
  // 99 = no history — fresh athlete. No history ≠ drift.
  const hasIntakeHistory = snapshot.daysSinceLastIntake < 99
  const hasOpenHistory = snapshot.daysSinceLastOpen < 99
  if (hasIntakeHistory && snapshot.daysSinceLastIntake >= 2) return 'WATCH'
  if (hasOpenHistory && snapshot.daysSinceLastOpen >= 2) return 'WATCH'
  if (snapshot.alcoholThisWeek) return 'WATCH'
  // Missed session only flags Fri+ — earlier in the week is still on track
  if (
    snapshot.strengthSessionsExpected > 0
    && snapshot.strengthSessionsThisWeek < snapshot.strengthSessionsExpected
  ) {
    const now = new Date()
    if (now.getDay() >= 5) return 'WATCH'
  }
  return 'OK'
}

export function deriveNextFixedPoint(at: Date = new Date()): string {
  const weekday = at.getDay()
  // Mon–Thu → Friday; Fri–Sun → Monday (Rod's fixed coached sessions).
  if (weekday >= 1 && weekday <= 4) return 'Friday 6:15'
  return 'Monday 6:15'
}

export function deriveCoachContactState(snapshot: AthleteAccountabilitySnapshot): CoachContactState {
  const hasIntakeHistory = snapshot.daysSinceLastIntake < 99
  const hasOpenHistory = snapshot.daysSinceLastOpen < 99
  const silence =
    (hasIntakeHistory && snapshot.daysSinceLastIntake >= 2)
    || (hasOpenHistory && snapshot.daysSinceLastOpen >= 2)
  const missedSession = snapshot.strengthSessionsThisWeek < snapshot.strengthSessionsExpected
  const weekday = new Date().getDay()

  if (snapshot.alcoholThisWeek && silence && missedSession) return 'RETURN'
  if (missedSession && weekday >= 5) return 'MISSED_SESSION'
  if (snapshot.alcoholThisWeek) return 'ALCOHOL'
  if (snapshot.watchState === 'WATCH') return 'WATCH'
  return 'OK'
}

/** @deprecated Prefer deriveCoachContactState + CoachPlaybook component props */
export function deriveCoachPlaybook(snapshot: AthleteAccountabilitySnapshot): CoachPlaybookBrief {
  const contactState = deriveCoachContactState(snapshot)
  const missedSession = snapshot.strengthSessionsThisWeek < snapshot.strengthSessionsExpected
  const nextFixedPoint = deriveNextFixedPoint()

  const whyLines: string[] = []
  if (snapshot.daysSinceLastIntake < 99 && snapshot.daysSinceLastIntake >= 2) {
    whyLines.push(`No intake log · ${snapshot.daysSinceLastIntake}d`)
  }
  if (snapshot.daysSinceLastOpen < 99 && snapshot.daysSinceLastOpen >= 2) {
    whyLines.push(`App silent · ${snapshot.daysSinceLastOpen}d`)
  }
  if (snapshot.proteinDaysThisWeek < 3) {
    whyLines.push(`Protein days: ${snapshot.proteinDaysThisWeek}`)
  }
  if (snapshot.alcoholThisWeek) {
    whyLines.push('Alcohol this week')
  }
  if (missedSession) {
    whyLines.push(`Sessions: ${snapshot.strengthSessionsThisWeek}/${snapshot.strengthSessionsExpected}`)
  }
  whyLines.push(`Next: ${nextFixedPoint}`)

  const byState: Record<CoachContactState, Pick<CoachPlaybookBrief, 'nextMove' | 'coachPosture' | 'suggestedText'>> = {
    OK: {
      nextMove: 'Stay out of the way unless drift shows up.',
      coachPosture: 'Brief. No new goals after a good week.',
      suggestedText: 'Good week. Repeat it.',
    },
    WATCH: {
      nextMove: 'Text once. Ask for protein only.',
      coachPosture: 'One ask. No autopsy.',
      suggestedText: 'Send me first protein today. Nothing else.',
    },
    ALCOHOL: {
      nextMove: 'Contain the next 24 hours. No reset speech.',
      coachPosture: 'Forward-facing. No story request.',
      suggestedText: 'Logged. Water, protein, next session.',
    },
    RETURN: {
      nextMove: 'Make re-entry cheap. Point to Monday.',
      coachPosture: "Don't make him explain before returning.",
      suggestedText: "You don't owe the whole explanation. Show up Monday.",
    },
    MISSED_SESSION: {
      nextMove: 'Point to the next fixed appointment.',
      coachPosture: 'No lecture. The schedule does the work.',
      suggestedText: 'Friday stays.',
    },
  }

  const dynamic = byState[contactState]

  return {
    contactState,
    statusLabel: contactState === 'OK' ? snapshot.watchState : contactState,
    whyLines,
    ...dynamic,
    staticPlaybook: ROD_COACH_PLAYBOOK_STATIC,
  }
}

export async function getAthleteAccountability(
  authUserId: string,
  programId = 'rod_accountability_v1'
): Promise<AthleteAccountabilitySnapshot> {
  const weekStart = startOfWeek(new Date())

  const [intakeRes, waistRes, stateRes, strengthRes] = await Promise.all([
    supabase
      .from('intake_logs')
      .select('id, program_id, eaten_at, anchor, had_protein, alcohol, text')
      .eq('athlete_id', authUserId)
      .eq('program_id', programId)
      .gte('eaten_at', weekStart.toISOString())
      .order('eaten_at', { ascending: false }),
    supabase
      .from('waist_check_ins')
      .select('id, program_id, recorded_at, waist_inches, entered_by')
      .eq('athlete_id', authUserId)
      .eq('program_id', programId)
      .order('recorded_at', { ascending: false })
      .limit(10),
    supabase
      .from('athlete_app_state')
      .select('last_open_at')
      .eq('athlete_id', authUserId)
      .maybeSingle(),
    supabase
      .from('strength_sessions')
      .select('id, completed_at')
      .eq('athlete_id', authUserId)
      .gte('completed_at', weekStart.toISOString()),
  ])

  const intakeLogs: IntakeLogRow[] = (intakeRes.data ?? []).map((r: any) => ({
    id: r.id,
    programId: r.program_id,
    eatenAt: r.eaten_at,
    anchor: r.anchor,
    hadProtein: r.had_protein,
    alcohol: !!r.alcohol,
    text: r.text ?? '',
  }))

  const waistCheckIns: WaistCheckInRow[] = (waistRes.data ?? []).map((r: any) => ({
    id: r.id,
    programId: r.program_id,
    recordedAt: r.recorded_at,
    waistInches: r.waist_inches,
    enteredBy: r.entered_by,
  }))

  const { data: allIntakeRecent } = await supabase
    .from('intake_logs')
    .select('eaten_at')
    .eq('athlete_id', authUserId)
    .order('eaten_at', { ascending: false })
    .limit(1)

  const lastIntakeAt = allIntakeRecent?.[0]?.eaten_at ?? null
  const lastOpenAt = stateRes.data?.last_open_at ?? null
  const alcoholThisWeek = intakeLogs.some((l) => l.alcohol)
  const proteinDaysThisWeek = proteinDaysInWeek(intakeLogs, weekStart)
  const strengthSessionsThisWeek = strengthRes.data?.length ?? 0

  const partial = {
    intakeLogs,
    waistCheckIns,
    lastOpenAt,
    strengthSessionsThisWeek,
    strengthSessionsExpected: 2,
    proteinDaysThisWeek,
    alcoholThisWeek,
    daysSinceLastIntake: daysBetween(lastIntakeAt),
    daysSinceLastOpen: daysBetween(lastOpenAt),
    latestWaist: waistCheckIns[0] ?? null,
    previousWaist: waistCheckIns[1] ?? null,
    nextSessionLabel: deriveNextFixedPoint(),
  }

  return {
    ...partial,
    watchState: deriveWatchState(partial),
  }
}

export async function saveCoachWaistCheckIn(
  authUserId: string,
  waistInches: number,
  programId = 'rod_accountability_v1'
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { error } = await supabase.from('waist_check_ins').insert({
    athlete_id: authUserId,
    program_id: programId,
    recorded_at: new Date().toISOString(),
    waist_inches: waistInches,
    entered_by: 'coach',
  })
  if (error) throw error
}
