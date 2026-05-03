import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  ProgramTemplate,
  Block,
  Week,
  Session,
  Exercise,
  SetPrescription,
  TreeSelection,
  ValidationResult,

  ProgressionRule,
} from '../types/program'

// ─── ID generator ────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Defaults ────────────────────────────────────────────────────────────────
function defaultSet(setNumber: number): SetPrescription {
  return { id: uid(), setNumber, reps: null, weightLb: null, durationSeconds: null }
}

function defaultExercise(): Exercise {
  return {
    id: uid(),
    movementId: null,
    movementIntent: 'Controlled',
    isPrimeMover: false,
    restSeconds: null,
    cue: '',
    sets: [defaultSet(1)],
    progression: { type: 'None' },
  }
}

function defaultSession(sessionNumber: number): Session {
  return {
    id: uid(),
    name: `Session ${sessionNumber}`,
    dayIndex: null,
    intensityLabel: '',
    exercises: [],
  }
}

function defaultWeek(weekNumber: number): Week {
  return { id: uid(), weekNumber, sessions: [] }
}

function defaultBlock(blockNumber: number): Block {
  return {
    id: uid(),
    name: `Block ${blockNumber}`,
    weeks: [defaultWeek(1)],
  }
}

function emptyProgram(): ProgramTemplate {
  return {
    id: uid(),
    name: '',
    sourceLabel: '',
    targetWeeks: null,
    daysPerWeek: null,
    notes: '',
    status: 'Draft',
    blocks: [defaultBlock(1)],
    lastSaved: null,
  }
}

const STORAGE_KEY = 'forge_program_draft'

function loadFromStorage(): ProgramTemplate | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(program: ProgramTemplate) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(program))
  } catch {
    // storage full or unavailable — silently ignore
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────
function validate(program: ProgramTemplate): ValidationResult[] {
  const results: ValidationResult[] = []
  const r = (id: string, severity: ValidationResult['severity'], message: string, path?: string) =>
    results.push({ id, severity, message, path })

  // Program name
  if (!program.name.trim()) r('name', 'error', 'Program name is required.')

  // Total weeks across all blocks
  const totalWeeks = program.blocks.reduce((sum, b) => sum + b.weeks.length, 0)
  if (totalWeeks < 4 || totalWeeks > 6)
    r('duration', 'error', `Duration must be 4–6 weeks. Currently ${totalWeeks}.`)

  // Empty blocks/weeks
  program.blocks.forEach((block) => {
    if (block.weeks.length === 0)
      r(`block-empty-${block.id}`, 'error', `No weeks in "${block.name}".`, block.name)

    block.weeks.forEach((week) => {
      const weekPath = `${block.name} › Week ${week.weekNumber}`

      if (week.sessions.length === 0)
        r(`week-empty-${week.id}`, 'error', `No sessions found in ${weekPath}.`, weekPath)

      // Sessions per week: 3–5
      if (week.sessions.length > 0 && (week.sessions.length < 3 || week.sessions.length > 5))
        r(
          `sessions-per-week-${week.id}`,
          'error',
          `Sessions per week must be 3–5. ${weekPath} has ${week.sessions.length}.`,
          weekPath
        )

      // Duplicate dayIndex within a week
      const dayIndexes = week.sessions.map((s) => s.dayIndex).filter((d) => d !== null)
      const seen = new Set<number>()
      dayIndexes.forEach((d) => {
        if (d !== null) {
          if (seen.has(d))
            r(
              `dup-day-${week.id}-${d}`,
              'error',
              `Duplicate day in ${weekPath}: two sessions share the same day.`,
              weekPath
            )
          seen.add(d)
        }
      })

      week.sessions.forEach((session) => {
        const sessionPath = `${weekPath} › ${session.name}`

        // Exercise count: 4–8
        if (session.exercises.length < 4 || session.exercises.length > 8)
          r(
            `exercise-count-${session.id}`,
            'error',
            `Each session must have 4–8 exercises. "${session.name}" has ${session.exercises.length}.`,
            sessionPath
          )

        // Prime mover presence (warning)
        const hasPrimeMover = session.exercises.some((e) => e.isPrimeMover)
        if (!hasPrimeMover && session.exercises.length > 0)
          r(
            `prime-mover-${session.id}`,
            'warning',
            `No prime mover set in "${session.name}".`,
            sessionPath
          )

        session.exercises.forEach((exercise) => {
          const exPath = `${sessionPath} › Exercise`

          // Movement must be selected
          if (!exercise.movementId)
            r(`movement-${exercise.id}`, 'error', `An exercise in "${session.name}" has no movement selected.`, exPath)

          // At least one set
          if (exercise.sets.length === 0)
            r(`sets-${exercise.id}`, 'error', `Each exercise must have at least one set. (${session.name})`, exPath)

          // Each set must have reps or duration
          exercise.sets.forEach((set) => {
            if (set.reps === null && set.durationSeconds === null)
              r(
                `set-nil-${set.id}`,
                'error',
                `Set ${set.setNumber} in "${session.name}" must have reps or duration.`,
                exPath
              )
          })
        })
      })
    })
  })

  return results
}

// ─── Store types ─────────────────────────────────────────────────────────────
interface SaveState {
  status: 'idle' | 'saving' | 'saved'
  lastSaved: string | null
}

interface ProgramBuilderState {
  program: ProgramTemplate
  selection: TreeSelection
  expandedWeeks: Set<string>   // week ids that are expanded
  showValidation: boolean
  validationResults: ValidationResult[]
  saveState: SaveState

  // Program metadata
  setName: (name: string) => void
  setSourceLabel: (v: string) => void
  setTargetWeeks: (v: number | null) => void
  setDaysPerWeek: (v: number | null) => void
  setNotes: (v: string) => void

  // Tree selection
  select: (sel: TreeSelection) => void

  // Week expand/collapse — only one expanded at a time
  toggleWeek: (weekId: string) => void
  expandWeek: (weekId: string) => void

  // Blocks
  addBlock: () => void
  updateBlockName: (blockId: string, name: string) => void
  deleteBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void

  // Weeks
  addWeek: (blockId: string) => void
  deleteWeek: (blockId: string, weekId: string) => void
  duplicateWeek: (blockId: string, weekId: string) => void

  // Sessions
  addSession: (weekId: string) => void
  updateSessionName: (sessionId: string, name: string) => void
  updateSessionDayIndex: (sessionId: string, dayIndex: number | null) => void
  updateSessionIntensityLabel: (sessionId: string, label: string) => void
  deleteSession: (sessionId: string) => void
  duplicateSession: (sessionId: string) => void

  // Exercises
  addExercise: (sessionId: string) => void
  updateExercise: (sessionId: string, exerciseId: string, patch: Partial<Exercise>) => void
  deleteExercise: (sessionId: string, exerciseId: string) => void

  // Sets
  addSet: (sessionId: string, exerciseId: string) => void
  updateSet: (sessionId: string, exerciseId: string, setId: string, patch: Partial<SetPrescription>) => void
  deleteSet: (sessionId: string, exerciseId: string, setId: string) => void

  // Progression
  updateProgression: (sessionId: string, exerciseId: string, rule: ProgressionRule) => void

  // Persistence
  saveDraft: () => void
  loadDraft: () => void
  resetDraft: () => void

  // Validation & publish
  runValidation: () => ValidationResult[]
  setShowValidation: (show: boolean) => void
}

// ─── Helper to mutate sessions deep in the tree ────────────────────────────────
function mutateSessions(
  blocks: Block[],
  sessionId: string,
  fn: (session: Session, sessions: Session[], week: Week) => void
): Block[] {
  return blocks.map((block) => ({
    ...block,
    weeks: block.weeks.map((week) => {
      const idx = week.sessions.findIndex((s) => s.id === sessionId)
      if (idx === -1) return week
      const sessions = [...week.sessions]
      fn(sessions[idx], sessions, week)
      return { ...week, sessions }
    }),
  }))
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useProgramStore = create<ProgramBuilderState>()(
  subscribeWithSelector((set, get) => ({
    program: loadFromStorage() ?? emptyProgram(),
    selection: { type: 'program' },
    expandedWeeks: new Set<string>(),
    showValidation: false,
    validationResults: [],
    saveState: { status: 'idle', lastSaved: null },

    // ── Metadata ──
    setName: (name) => set((s) => ({ program: { ...s.program, name } })),
    setSourceLabel: (sourceLabel) => set((s) => ({ program: { ...s.program, sourceLabel } })),
    setTargetWeeks: (targetWeeks) => set((s) => ({ program: { ...s.program, targetWeeks } })),
    setDaysPerWeek: (daysPerWeek) => set((s) => ({ program: { ...s.program, daysPerWeek } })),
    setNotes: (notes) => set((s) => ({ program: { ...s.program, notes } })),

    // ── Selection ──
    select: (selection) => set({ selection }),

    // ── Week expand (only one at a time) ──
    toggleWeek: (weekId) =>
      set((s) => {
        const next = new Set<string>()
        if (!s.expandedWeeks.has(weekId)) next.add(weekId)
        return { expandedWeeks: next }
      }),
    expandWeek: (weekId) => set({ expandedWeeks: new Set([weekId]) }),

    // ── Blocks ──
    addBlock: () =>
      set((s) => {
        const blockNumber = s.program.blocks.length + 1
        const newBlock = defaultBlock(blockNumber)
        return { program: { ...s.program, blocks: [...s.program.blocks, newBlock] } }
      }),

    updateBlockName: (blockId, name) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => (b.id === blockId ? { ...b, name } : b)),
        },
      })),

    deleteBlock: (blockId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.filter((b) => b.id !== blockId),
        },
      })),

    duplicateBlock: (blockId) =>
      set((s) => {
        const idx = s.program.blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return s
        const original = s.program.blocks[idx]
        const dupe: Block = {
          ...original,
          id: uid(),
          name: `${original.name} (copy)`,
          weeks: original.weeks.map((w) => ({
            ...w,
            id: uid(),
            sessions: w.sessions.map((sess) => ({
              ...sess,
              id: uid(),
              exercises: sess.exercises.map((ex) => ({
                ...ex,
                id: uid(),
                sets: ex.sets.map((set) => ({ ...set, id: uid() })),
              })),
            })),
          })),
        }
        const blocks = [...s.program.blocks]
        blocks.splice(idx + 1, 0, dupe)
        return { program: { ...s.program, blocks } }
      }),

    // ── Weeks ──
    addWeek: (blockId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => {
            if (b.id !== blockId) return b
            const weekNumber = b.weeks.length + 1
            const newWeek = defaultWeek(weekNumber)
            return { ...b, weeks: [...b.weeks, newWeek] }
          }),
        },
      })),

    deleteWeek: (blockId, weekId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) =>
            b.id !== blockId ? b : { ...b, weeks: b.weeks.filter((w) => w.id !== weekId) }
          ),
        },
      })),

    duplicateWeek: (blockId, weekId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => {
            if (b.id !== blockId) return b
            const idx = b.weeks.findIndex((w) => w.id === weekId)
            if (idx === -1) return b
            const original = b.weeks[idx]
            const dupe: Week = {
              ...original,
              id: uid(),
              weekNumber: b.weeks.length + 1,
              sessions: original.sessions.map((sess) => ({
                ...sess,
                id: uid(),
                exercises: sess.exercises.map((ex) => ({
                  ...ex,
                  id: uid(),
                  sets: ex.sets.map((set) => ({ ...set, id: uid() })),
                })),
              })),
            }
            const weeks = [...b.weeks]
            weeks.splice(idx + 1, 0, dupe)
            return { ...b, weeks }
          }),
        },
      })),

    // ── Sessions ──
    addSession: (weekId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => ({
            ...b,
            weeks: b.weeks.map((w) => {
              if (w.id !== weekId) return w
              const sessionNumber = w.sessions.length + 1
              return { ...w, sessions: [...w.sessions, defaultSession(sessionNumber)] }
            }),
          })),
        },
      })),

    updateSessionName: (sessionId, name) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.name = name
          }),
        },
      })),

    updateSessionDayIndex: (sessionId, dayIndex) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.dayIndex = dayIndex
          }),
        },
      })),

    updateSessionIntensityLabel: (sessionId, label) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.intensityLabel = label
          }),
        },
      })),

    deleteSession: (sessionId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => ({
            ...b,
            weeks: b.weeks.map((w) => ({
              ...w,
              sessions: w.sessions.filter((sess) => sess.id !== sessionId),
            })),
          })),
        },
      })),

    duplicateSession: (sessionId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: s.program.blocks.map((b) => ({
            ...b,
            weeks: b.weeks.map((w) => {
              const idx = w.sessions.findIndex((sess) => sess.id === sessionId)
              if (idx === -1) return w
              const original = w.sessions[idx]
              const dupe: Session = {
                ...original,
                id: uid(),
                name: `${original.name} (copy)`,
                exercises: original.exercises.map((ex) => ({
                  ...ex,
                  id: uid(),
                  sets: ex.sets.map((set) => ({ ...set, id: uid() })),
                })),
              }
              const sessions = [...w.sessions]
              sessions.splice(idx + 1, 0, dupe)
              return { ...w, sessions }
            }),
          })),
        },
      })),

    // ── Exercises ──
    addExercise: (sessionId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            if (session.exercises.length >= 8) return
            session.exercises = [...session.exercises, defaultExercise()]
          }),
        },
      })),

    updateExercise: (sessionId, exerciseId, patch) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, ...patch } : ex
            )
          }),
        },
      })),

    deleteExercise: (sessionId, exerciseId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.filter((ex) => ex.id !== exerciseId)
          }),
        },
      })),

    // ── Sets ──
    addSet: (sessionId, exerciseId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.map((ex) => {
              if (ex.id !== exerciseId || ex.sets.length >= 8) return ex
              const setNumber = ex.sets.length + 1
              return { ...ex, sets: [...ex.sets, defaultSet(setNumber)] }
            })
          }),
        },
      })),

    updateSet: (sessionId, exerciseId, setId, patch) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex
              return {
                ...ex,
                sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
              }
            })
          }),
        },
      })),

    deleteSet: (sessionId, exerciseId, setId) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.map((ex) => {
              if (ex.id !== exerciseId || ex.sets.length <= 1) return ex
              const sets = ex.sets
                .filter((set) => set.id !== setId)
                .map((set, i) => ({ ...set, setNumber: i + 1 }))
              return { ...ex, sets }
            })
          }),
        },
      })),

    // ── Progression ──
    updateProgression: (sessionId, exerciseId, rule) =>
      set((s) => ({
        program: {
          ...s.program,
          blocks: mutateSessions(s.program.blocks, sessionId, (session) => {
            session.exercises = session.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, progression: rule } : ex
            )
          }),
        },
      })),

    // ── Persistence ──
    saveDraft: () => {
      const program = { ...get().program, lastSaved: new Date().toISOString() }
      set({ program, saveState: { status: 'saving', lastSaved: program.lastSaved } })
      saveToStorage(program)
      setTimeout(() => {
        set({ saveState: { status: 'saved', lastSaved: program.lastSaved } })
      }, 400)
    },

    loadDraft: () => {
      const loaded = loadFromStorage()
      if (loaded) set({ program: loaded })
    },

    resetDraft: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({ program: emptyProgram(), selection: { type: 'program' } })
    },

    // ── Validation ──
    runValidation: () => {
      const results = validate(get().program)
      set({ validationResults: results, showValidation: true })
      return results
    },

    setShowValidation: (show) => set({ showValidation: show }),
  }))
)

// ─── Autosave: every 30 seconds ──────────────────────────────────────────────
let autosaveTimer: ReturnType<typeof setInterval> | null = null

export function startAutosave() {
  if (autosaveTimer) return
  autosaveTimer = setInterval(() => {
    useProgramStore.getState().saveDraft()
  }, 30_000)
}

export function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer)
    autosaveTimer = null
  }
}
