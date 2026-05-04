import { useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProgram, createProgram, saveProgram } from '../../api/programs'
import { useProgramStore, startAutosave, stopAutosave } from '../../store/programStore'
import type { Week, Session, Exercise, SetPrescription, ProgressionRule, MovementIntent } from '../../types/program'
import MovementCombobox from '../../components/MovementCombobox'
import ValidationPanel from '../../components/ValidationPanel'
import movementsData from '../../data/movements.sample.json'
import type { Movement } from '../../types/program'

const catalog: Movement[] = movementsData as Movement[]

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const INTENT_OPTIONS: MovementIntent[] = ['Controlled', 'Explosive', 'Steady', 'Accessory']

// ─── Abstract cue words ──────────────────────────────────────────────────────
const ABSTRACT_CUE_WORDS = ['engage', 'focus on', 'maintain', 'feel', 'remember']
function isCueTooAbstract(cue: string): boolean {
  const lower = cue.toLowerCase()
  return ABSTRACT_CUE_WORDS.some((w) => lower.includes(w))
}

// ─── Exercise Card ───────────────────────────────────────────────────────────
function ExerciseCard({
  exercise,
  sessionId,
  index,
  usedMovementIds,
}: {
  exercise: Exercise
  sessionId: string
  index: number
  usedMovementIds: string[]
}) {
  const { updateExercise, deleteExercise, addSet, updateSet, deleteSet, updateProgression } = useProgramStore()
  const [progOpenState, setProgOpenState] = useProgramLocalState(false)

  const movement = exercise.movementId
    ? catalog.find((m) => m.movementId === exercise.movementId) ?? null
    : null

  const allSetsUniform = exercise.sets.length > 1 &&
    exercise.sets.every(
      (s) => s.reps === exercise.sets[0].reps &&
             s.weightLb === exercise.sets[0].weightLb &&
             s.durationSeconds === exercise.sets[0].durationSeconds
    )

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-rule)',
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-rule-light)',
        gap: 10,
      }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', minWidth: 20 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>
          {movement?.displayName ?? 'No movement selected'}
        </span>
        <button
          onClick={() => deleteExercise(sessionId, exercise.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dim)', fontSize: 16, padding: '0 4px' }}
          title="Delete exercise"
        >⌫</button>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px' }}>
        {/* Movement selector */}
        <div style={{ marginBottom: 12 }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Movement</label>
          <MovementCombobox
            value={exercise.movementId}
            onChange={(movementId, mov) =>
              updateExercise(sessionId, exercise.id, {
                movementId,
                cue: exercise.cue || mov.defaultCue,
                restSeconds: exercise.restSeconds ?? mov.defaultRestSeconds,
                movementIntent: mov.movementIntent,
              })
            }
            onClear={() => updateExercise(sessionId, exercise.id, { movementId: null, cue: '' })}
            usedMovementIds={usedMovementIds}
          />
        </div>

        {/* Intent + Prime Mover + Rest */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 12 }}>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Intent</label>
            <select
              className="input"
              value={exercise.movementIntent}
              onChange={(e) => updateExercise(sessionId, exercise.id, { movementIntent: e.target.value as MovementIntent })}
            >
              {INTENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Rest (s)</label>
            <input
              className="input"
              type="number"
              min={30}
              max={300}
              placeholder="Default (policy)"
              value={exercise.restSeconds ?? ''}
              onChange={(e) =>
                updateExercise(sessionId, exercise.id, {
                  restSeconds: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div style={{ paddingTop: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={exercise.isPrimeMover}
                onChange={(e) =>
                  updateExercise(sessionId, exercise.id, {
                    isPrimeMover: e.target.checked,
                    restSeconds: e.target.checked && !exercise.restSeconds ? 120 : exercise.restSeconds,
                  })
                }
              />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-chrome)' }}>
                Prime mover
              </span>
            </label>
          </div>
        </div>

        {/* Cue */}
        <div style={{ marginBottom: 14 }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Cue</label>
          <input
            className="input"
            type="text"
            maxLength={60}
            placeholder="Physical cue (optional)"
            value={exercise.cue}
            onChange={(e) => updateExercise(sessionId, exercise.id, { cue: e.target.value })}
          />
          {exercise.cue && isCueTooAbstract(exercise.cue) && (
            <p style={{ fontSize: 11, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
              Cue may be too abstract.
            </p>
          )}
        </div>

        {/* Set prescription table */}
        <div style={{ marginBottom: 10 }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: 6 }}>Sets</label>

          {allSetsUniform ? (
            <div style={{
              padding: '8px 12px',
              background: 'var(--color-bg)',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-chrome)',
              marginBottom: 6,
            }}>
              {exercise.sets.length} sets × {exercise.sets[0].reps ?? '—'} reps
              {exercise.sets[0].weightLb !== null ? ` @ ${exercise.sets[0].weightLb} lb` : ''}
              {exercise.sets[0].durationSeconds ? ` · ${exercise.sets[0].durationSeconds}s` : ''}
              <button
                onClick={() => {/* expand to individual rows — handled by editing any row */}}
                style={{
                  marginLeft: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-mono)',
                }}
              >Edit sets</button>
            </div>
          ) : null}

          {/* Set rows */}
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onUpdate={(patch) => updateSet(sessionId, exercise.id, set.id, patch)}
              onDelete={() => deleteSet(sessionId, exercise.id, set.id)}
              canDelete={exercise.sets.length > 1}
            />
          ))}

          {exercise.sets.length < 8 && (
            <button
              className="btn-ghost"
              style={{ marginTop: 4, fontSize: 12 }}
              onClick={() => addSet(sessionId, exercise.id)}
            >+ Set</button>
          )}
          {exercise.sets.length >= 8 && (
            <p style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              Maximum 8 sets per exercise.
            </p>
          )}
        </div>

        {/* Progression (collapsible) */}
        <button
          onClick={() => setProgOpenState((v: boolean) => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--color-chrome)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            padding: '4px 0',
          }}
        >
          <span>{progOpenState ? '▾' : '▸'}</span>
          Progression
        </button>

        {progOpenState && (
          <ProgressionEditor
            rule={exercise.progression}
            onChange={(rule) => updateProgression(sessionId, exercise.id, rule)}
          />
        )}
      </div>
    </div>
  )
}

// Local state hook (simple)
function useProgramLocalState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initial)
  return [state, setState]
}
import React from 'react'

// ─── Set Row ─────────────────────────────────────────────────────────────────
function SetRow({
  set,
  onUpdate,
  onDelete,
  canDelete,
}: {
  set: SetPrescription
  onUpdate: (patch: Partial<SetPrescription>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const invalid = set.reps === null && set.durationSeconds === null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 1fr 1fr 1fr 28px',
      gap: 6,
      alignItems: 'center',
      marginBottom: 6,
      padding: invalid ? '4px 6px' : '0',
      borderRadius: 4,
      background: invalid ? 'rgba(216,90,48,0.06)' : 'transparent',
      border: invalid ? '1px solid rgba(216,90,48,0.3)' : '1px solid transparent',
    }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', textAlign: 'center' }}>
        {set.setNumber}
      </span>
      <input
        className="input"
        style={{ height: 32 }}
        type="number"
        min={1}
        max={50}
        placeholder="Reps"
        value={set.reps ?? ''}
        onChange={(e) => onUpdate({ reps: e.target.value ? Number(e.target.value) : null })}
      />
      <input
        className="input"
        style={{ height: 32 }}
        type="number"
        min={0}
        placeholder="lb"
        value={set.weightLb ?? ''}
        onChange={(e) => onUpdate({ weightLb: e.target.value !== '' ? Number(e.target.value) : null })}
      />
      <input
        className="input"
        style={{ height: 32 }}
        type="number"
        min={0}
        placeholder="Dur (s)"
        value={set.durationSeconds ?? ''}
        onChange={(e) => onUpdate({ durationSeconds: e.target.value ? Number(e.target.value) : null })}
      />
      <button
        onClick={onDelete}
        disabled={!canDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: canDelete ? 'pointer' : 'default',
          color: canDelete ? 'var(--color-dim)' : 'transparent',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >×</button>
      {invalid && (
        <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#D85A30', fontFamily: 'var(--font-mono)', paddingLeft: 30 }}>
          Set must have reps or duration.
        </div>
      )}
    </div>
  )
}

// ─── Progression Editor ──────────────────────────────────────────────────────
function ProgressionEditor({ rule, onChange }: { rule: ProgressionRule; onChange: (r: ProgressionRule) => void }) {
  return (
    <div style={{ padding: '10px 0 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Rule</label>
        <select
          className="input"
          value={rule.type}
          onChange={(e) => onChange({ type: e.target.value as ProgressionRule['type'] })}
        >
          {['None', 'Linear', 'Double', 'StepDeload', 'Fixed'].map((t) => (
            <option key={t} value={t}>{t === 'Double' ? 'Double progression' : t === 'StepDeload' ? 'Step-deload' : t}</option>
          ))}
        </select>
      </div>

      {rule.type === 'Linear' && (
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Increment (lb)</label>
          <input
            className="input"
            type="number"
            value={rule.incrementLb ?? ''}
            onChange={(e) => onChange({ ...rule, incrementLb: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      )}

      {rule.type === 'Double' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Rep min</label>
            <input className="input" type="number" value={rule.repRangeMin ?? ''}
              onChange={(e) => onChange({ ...rule, repRangeMin: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Rep max</label>
            <input className="input" type="number" value={rule.repRangeMax ?? ''}
              onChange={(e) => onChange({ ...rule, repRangeMax: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Increment (lb)</label>
            <input className="input" type="number" value={rule.incrementLb ?? ''}
              onChange={(e) => onChange({ ...rule, incrementLb: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>
      )}

      {rule.type === 'StepDeload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Progression weeks</label>
            <input className="input" type="number" value={rule.progressionWeeks ?? ''}
              onChange={(e) => onChange({ ...rule, progressionWeeks: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Deload %</label>
            <input className="input" type="number" value={rule.deloadPercent ?? ''}
              onChange={(e) => onChange({ ...rule, deloadPercent: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Session Editor (right panel when session selected) ──────────────────────
function SessionEditor({ sessionId }: { sessionId: string }) {
  const program = useProgramStore((s) => s.program)
  const { updateSessionName, updateSessionDayIndex, updateSessionIntensityLabel, addExercise } = useProgramStore()

  // Find session
  let session: Session | null = null
  for (const block of program.blocks)
    for (const week of block.weeks)
      for (const s of week.sessions)
        if (s.id === sessionId) session = s

  if (!session) return <p style={{ color: 'var(--color-dim)', fontSize: 14 }}>Session not found.</p>

  const usedMovementIds = session.exercises.map((e) => e.movementId).filter(Boolean) as string[]

  return (
    <div>
      {/* Session header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Session name</label>
          <input
            className="input"
            maxLength={40}
            value={session.name}
            onChange={(e) => updateSessionName(sessionId, e.target.value)}
          />
        </div>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Day</label>
          <select
            className="input"
            value={session.dayIndex ?? ''}
            onChange={(e) => updateSessionDayIndex(sessionId, e.target.value !== '' ? Number(e.target.value) : null)}
          >
            <option value="">— unset —</option>
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Intensity</label>
          <input
            className="input"
            placeholder="e.g. Heavy"
            value={session.intensityLabel}
            onChange={(e) => updateSessionIntensityLabel(sessionId, e.target.value)}
          />
        </div>
      </div>

      {/* Exercise count indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="label-mono">Exercises ({session.exercises.length}/8)</span>
        {session.exercises.length < 8 ? (
          <button className="btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => addExercise(sessionId)}>
            + Add exercise
          </button>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
            Maximum 8 exercises per session.
          </span>
        )}
      </div>

      {session.exercises.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-dim)', fontSize: 14 }}>No exercises yet.</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => addExercise(sessionId)}>
            + Add exercise
          </button>
        </div>
      ) : (
        session.exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            sessionId={sessionId}
            index={i}
            usedMovementIds={usedMovementIds}
          />
        ))
      )}
    </div>
  )
}

// ─── Program Metadata (right panel when program selected) ────────────────────
function ProgramMetaEditor() {
  const { program, setName, setSourceLabel, setTargetWeeks, setDaysPerWeek, setNotes } = useProgramStore()

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 20 }}>Program details</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Program name *</label>
          <input
            className="input"
            maxLength={60}
            placeholder="e.g. Forge Accumulation Block"
            value={program.name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Source label</label>
          <input
            className="input"
            maxLength={30}
            placeholder="e.g. Custom, Forge"
            value={program.sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Target weeks (4–6)</label>
            <input
              className="input"
              type="number"
              min={4}
              max={6}
              placeholder="4"
              value={program.targetWeeks ?? ''}
              onChange={(e) => setTargetWeeks(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Days per week (3–5)</label>
            <input
              className="input"
              type="number"
              min={3}
              max={5}
              placeholder="4"
              value={program.daysPerWeek ?? ''}
              onChange={(e) => setDaysPerWeek(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>Internal notes</label>
          <textarea
            className="input"
            style={{ height: 100, resize: 'vertical', paddingTop: 8 }}
            maxLength={500}
            placeholder="Not shown to athletes."
            value={program.notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            {program.notes.length}/500
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Left Panel Tree ─────────────────────────────────────────────────────────
function ProgramTree() {
  const {
    program, selection, expandedWeeks,
    select, toggleWeek,
    addBlock, updateBlockName, deleteBlock, duplicateBlock,
    addWeek, deleteWeek, duplicateWeek,
    addSession, updateSessionName, deleteSession, duplicateSession,
  } = useProgramStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Program row */}
      <TreeRow
        label={program.name || 'New program'}
        depth={0}
        selected={selection.type === 'program'}
        onClick={() => select({ type: 'program' })}
        icon="◈"
      />

      {program.blocks.map((block) => (
        <div key={block.id}>
          {/* Block row */}
          <TreeRow
            label={block.name}
            depth={0}
            selected={selection.type === 'block' && selection.blockId === block.id}
            onClick={() => select({ type: 'block', blockId: block.id })}
            icon="▪"
            editable
            onLabelChange={(name) => updateBlockName(block.id, name)}
            actions={[
              { label: 'Add week', onClick: () => addWeek(block.id) },
              { label: 'Duplicate block', onClick: () => duplicateBlock(block.id) },
              { label: 'Delete block', onClick: () => deleteBlock(block.id), destructive: true },
            ]}
            rightLabel={`${block.weeks.length}w`}
          />

          {block.weeks.map((week) => {
            const isExpanded = expandedWeeks.has(week.id)
            return (
              <div key={week.id}>
                {/* Week row */}
                <TreeRow
                  label={`Week ${week.weekNumber}`}
                  depth={1}
                  selected={selection.type === 'week' && selection.weekId === week.id}
                  onClick={() => { select({ type: 'week', blockId: block.id, weekId: week.id }); toggleWeek(week.id) }}
                  icon={isExpanded ? '▾' : '▸'}
                  actions={[
                    { label: 'Add session', onClick: () => addSession(week.id) },
                    { label: 'Duplicate week', onClick: () => duplicateWeek(block.id, week.id) },
                    { label: 'Delete week', onClick: () => deleteWeek(block.id, week.id), destructive: true },
                  ]}
                  rightLabel={`${week.sessions.length}s`}
                />

                {isExpanded && week.sessions.map((session) => (
                  <TreeRow
                    key={session.id}
                    label={session.name}
                    depth={2}
                    selected={selection.type === 'session' && selection.sessionId === session.id}
                    onClick={() => select({ type: 'session', blockId: block.id, weekId: week.id, sessionId: session.id })}
                    icon="·"
                    editable
                    onLabelChange={(name) => updateSessionName(session.id, name)}
                    actions={[
                      { label: 'Duplicate', onClick: () => duplicateSession(session.id) },
                      { label: 'Delete session', onClick: () => deleteSession(session.id), destructive: true },
                    ]}
                    rightLabel={`${session.exercises.length}ex`}
                  />
                ))}

                {isExpanded && (
                  <div
                    onClick={() => addSession(week.id)}
                    style={{
                      paddingLeft: 52,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >+ Add session</div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Add block */}
      <div
        onClick={addBlock}
        style={{
          padding: '8px 16px',
          fontSize: 12,
          color: 'var(--color-accent)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          borderTop: '1px solid var(--color-rule-light)',
          marginTop: 4,
        }}
      >+ Add block</div>
    </div>
  )
}

// ─── Tree Row ─────────────────────────────────────────────────────────────────
function TreeRow({
  label, depth, selected, onClick, icon,
  editable, onLabelChange,
  actions = [],
  rightLabel,
}: {
  label: string
  depth: number
  selected: boolean
  onClick: () => void
  icon: string
  editable?: boolean
  onLabelChange?: (v: string) => void
  actions?: { label: string; onClick: () => void; destructive?: boolean }[]
  rightLabel?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16 + depth * 16,
        paddingRight: 8,
        height: 32,
        cursor: 'pointer',
        background: selected ? 'rgba(186,117,23,0.08)' : 'transparent',
        borderLeft: selected ? '2px solid var(--color-accent)' : '2px solid transparent',
        gap: 6,
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 10, color: selected ? 'var(--color-accent)' : 'var(--color-dim)', minWidth: 10 }}>
        {icon}
      </span>
      {editable && editing ? (
        <input
          autoFocus
          style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-ink)' }}
          value={label}
          onChange={(e) => onLabelChange?.(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: selected ? 'var(--color-ink)' : 'var(--color-chrome)',
            fontWeight: selected ? 500 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onDoubleClick={(e) => { if (editable) { e.stopPropagation(); setEditing(true) } }}
        >
          {label}
        </span>
      )}
      {rightLabel && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
          {rightLabel}
        </span>
      )}
      {actions.length > 0 && (
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-dim)',
              fontSize: 14,
              padding: '2px 4px',
              borderRadius: 3,
              opacity: menuOpen ? 1 : 0.5,
            }}
          >⋯</button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 50,
                minWidth: 150,
                overflow: 'hidden',
              }}
            >
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); a.onClick() }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: a.destructive ? '#D85A30' : 'var(--color-ink)',
                    borderBottom: '1px solid var(--color-rule-light)',
                  }}
                >{a.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProgramBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { program, selection, saveState, saveDraft, runValidation, showValidation } = useProgramStore()
  const supabaseIdRef = useRef<string | null>(id ?? null)
  // On mount: load from Supabase if editing an existing program
  useEffect(() => {
    if (id) {
      getProgram(id)
        .then(p => {
          useProgramStore.setState({ program: p, selection: { type: 'program' } })
          supabaseIdRef.current = id
        })
        .catch(err => console.error('Failed to load program:', err))
    } else {
      // New program — reset store to blank
// new program — store already initializes to empty
    }
    startAutosave()
    return () => stopAutosave()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Save to Supabase (in addition to localStorage)
  const handleSave = useCallback(async () => {
    saveDraft() // localStorage backup
    try {
      const current = useProgramStore.getState().program
      if (supabaseIdRef.current) {
        await saveProgram({ ...current, id: supabaseIdRef.current })
      } else {
        const newId = await createProgram(current)
        supabaseIdRef.current = newId
        navigate(`/forge/programs/${newId}`, { replace: true })
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
  }, [saveDraft, navigate])

  const handleBlur = () => handleSave()

  return (
    <div onBlur={handleBlur} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px - 64px)' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
        paddingBottom: 16,
        borderBottom: '1px solid var(--color-rule)',
      }}>
        <input
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-ink)',
          }}
          placeholder="New program"
          value={program.name}
          onChange={(e) => useProgramStore.getState().setName(e.target.value)}
        />

        {/* Save state indicator */}
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', minWidth: 60, textAlign: 'right' }}>
          {saveState.status === 'saving' ? 'Saving…' : saveState.status === 'saved' ? 'Saved' : ''}
        </span>

        {/* Status badge */}
        <span className={`pill ${program.status === 'Published' ? 'pill-amber' : 'pill-dim'}`}>
          {program.status}
        </span>

        <button className="btn-ghost" onClick={handleSave}>Save draft</button>
        <button
          className="btn-secondary"
          onClick={() => { handleSave(); runValidation() }}
        >Publish</button>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', gap: 24, flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: 280,
          flexShrink: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          borderRadius: 8,
          overflowY: 'auto',
        }}>
          <ProgramTree />
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          borderRadius: 8,
          overflowY: 'auto',
          padding: 24,
        }}>
          {selection.type === 'program' && <ProgramMetaEditor />}
          {selection.type === 'block' && (
            <BlockDetail blockId={selection.blockId!} />
          )}
          {selection.type === 'week' && (
            <WeekDetail weekId={selection.weekId!} />
          )}
          {selection.type === 'session' && selection.sessionId && (
            <SessionEditor sessionId={selection.sessionId} />
          )}
        </div>
      </div>

      {/* Validation panel overlay */}
      {showValidation && <ValidationPanel />}
    </div>
  )
}

function BlockDetail({ blockId }: { blockId: string }) {
  const block = useProgramStore((s) => s.program.blocks.find((b) => b.id === blockId))
  if (!block) return null
  const totalExercises = block.weeks.reduce(
    (sum, w) => sum + w.sessions.reduce((s2, sess) => s2 + sess.exercises.length, 0), 0
  )
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>{block.name}</h2>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
        {block.weeks.length} week{block.weeks.length !== 1 ? 's' : ''} · {totalExercises} exercises total
      </p>
    </div>
  )
}

function WeekDetail({ weekId }: { weekId: string }) {
  const program = useProgramStore((s) => s.program)
  let week: Week | null = null
  for (const block of program.blocks)
    for (const w of block.weeks)
      if (w.id === weekId) week = w
  if (!week) return null
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>Week {week.weekNumber}</h2>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
        {week.sessions.length} session{week.sessions.length !== 1 ? 's' : ''}
      </p>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {week.sessions.map((s) => (
          <div key={s.id} style={{
            padding: '10px 14px',
            background: 'var(--color-bg)',
            borderRadius: 6,
            border: '1px solid var(--color-rule)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{s.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginLeft: 12 }}>
              {s.exercises.length} exercises · {s.dayIndex !== null ? DAY_NAMES[s.dayIndex] : 'Day unset'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
