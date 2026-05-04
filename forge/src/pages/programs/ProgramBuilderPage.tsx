import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProgram, createProgram, saveProgram, publishProgram } from '../../api/programs'
import { useProgramStore, startAutosave, stopAutosave } from '../../store/programStore'
import type { Week, Session, Exercise, SetPrescription, ProgressionRule, MovementIntent } from '../../types/program'
import MovementCombobox from '../../components/MovementCombobox'
import ValidationPanel from '../../components/ValidationPanel'
import movementsData from '../../data/movements.json'
import type { Movement } from '../../types/program'

const catalog: Movement[] = movementsData as unknown as Movement[]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const INTENT_OPTIONS: MovementIntent[] = ['Controlled', 'Explosive', 'Steady', 'Accessory']

const INTENT_COLOR: Record<MovementIntent, string> = {
  Controlled: 'var(--color-accent)',
  Explosive:  '#C94F2A',
  Steady:     '#2D6645',
  Accessory:  'var(--color-dim)',
}

function useProgramLocalState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  return React.useState<T>(initial)
}

// ── Shared field label ───────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--font-serif)',
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--color-dim)',
      marginBottom: 5,
    }}>{children}</label>
  )
}

// ── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({ set, onUpdate, onDelete, canDelete }: {
  set: SetPrescription
  onUpdate: (p: Partial<SetPrescription>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const invalid = set.reps === null && set.durationSeconds === null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 1fr 1fr 1fr 24px',
      gap: 6, alignItems: 'center',
      marginBottom: 5,
      padding: invalid ? '4px 6px' : '2px 0',
      background: invalid ? 'rgba(201,79,42,0.05)' : 'transparent',
      borderRadius: 4,
      border: invalid ? '1px solid rgba(201,79,42,0.2)' : '1px solid transparent',
    }}>
      <span style={{
        fontSize: 9, fontFamily: 'var(--font-serif)',
        color: 'var(--color-dim)', textAlign: 'center',
        fontWeight: 700, letterSpacing: '0.06em',
      }}>{set.setNumber}</span>

      {[
        { placeholder: 'Reps', field: 'reps' as const },
        { placeholder: 'lb',   field: 'weightLb' as const },
        { placeholder: 's',    field: 'durationSeconds' as const },
      ].map(({ placeholder, field }) => (
        <input
          key={field}
          className="input"
          style={{ height: 30, fontSize: 13, textAlign: 'center', padding: '0 6px' }}
          type="number"
          min={0}
          placeholder={placeholder}
          value={set[field] ?? ''}
          onChange={e => onUpdate({ [field]: e.target.value !== '' ? Number(e.target.value) : null })}
        />
      ))}

      <button
        onClick={onDelete}
        disabled={!canDelete}
        style={{
          background: 'none', border: 'none',
          cursor: canDelete ? 'pointer' : 'default',
          color: canDelete ? 'var(--color-dim)' : 'transparent',
          fontSize: 14, lineHeight: 1, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >×</button>

      {invalid && (
        <div style={{
          gridColumn: '1 / -1',
          fontSize: 10, color: 'var(--color-error)',
          fontFamily: 'var(--font-serif)', paddingLeft: 26,
          fontStyle: 'italic',
        }}>Needs reps or duration.</div>
      )}
    </div>
  )
}

// ── Progression editor ───────────────────────────────────────────────────────
function ProgressionEditor({ rule, onChange }: {
  rule: ProgressionRule
  onChange: (r: ProgressionRule) => void
}) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-rule-light)' }}>
      <FieldLabel>Progression</FieldLabel>
      <select
        className="input"
        style={{ height: 32, fontSize: 13, marginBottom: 8 }}
        value={rule.type}
        onChange={e => onChange({ type: e.target.value as ProgressionRule['type'] })}
      >
        <option value="None">None</option>
        <option value="Linear">Linear</option>
        <option value="Double">Double progression</option>
        <option value="StepDeload">Step-deload</option>
        <option value="Fixed">Fixed</option>
      </select>

      {rule.type === 'Linear' && (
        <div>
          <FieldLabel>Increment (lb)</FieldLabel>
          <input className="input" style={{ height: 32 }} type="number"
            value={rule.incrementLb ?? ''}
            onChange={e => onChange({ ...rule, incrementLb: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      )}
      {rule.type === 'Double' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {([['Rep min', 'repRangeMin'], ['Rep max', 'repRangeMax'], ['Increment lb', 'incrementLb']] as const).map(([label, key]) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input className="input" style={{ height: 32 }} type="number"
                value={(rule as any)[key] ?? ''}
                onChange={e => onChange({ ...rule, [key]: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          ))}
        </div>
      )}
      {rule.type === 'StepDeload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([['Progression weeks', 'progressionWeeks'], ['Deload %', 'deloadPercent']] as const).map(([label, key]) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input className="input" style={{ height: 32 }} type="number"
                value={(rule as any)[key] ?? ''}
                onChange={e => onChange({ ...rule, [key]: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Exercise card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, sessionId, index, usedMovementIds }: {
  exercise: Exercise
  sessionId: string
  index: number
  usedMovementIds: string[]
}) {
  const { updateExercise, deleteExercise, addSet, updateSet, deleteSet, updateProgression } = useProgramStore()
  const [showProg, setShowProg] = useProgramLocalState(false)

  const movement = exercise.movementId
    ? catalog.find(m => m.movementId === exercise.movementId) ?? null
    : null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-rule)',
      borderRadius: 8,
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-rule-light)',
      }}>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
          color: 'var(--color-dim)', letterSpacing: '0.08em', minWidth: 18,
        }}>{String(index + 1).padStart(2, '0')}</span>

        {exercise.isPrimeMover && (
          <span style={{
            fontSize: 8, fontFamily: 'var(--font-serif)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--color-accent)', paddingRight: 4,
          }}>Prime</span>
        )}

        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
          {movement?.displayName ?? <span style={{ color: 'var(--color-dim)', fontStyle: 'italic' }}>No movement</span>}
        </span>

        <span style={{
          fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
          color: INTENT_COLOR[exercise.movementIntent],
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{exercise.movementIntent}</span>

        <button
          onClick={() => deleteExercise(sessionId, exercise.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dim)', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
        >×</button>
      </div>

      {/* Card body */}
      <div style={{ padding: 14 }}>
        {/* Movement */}
        <div style={{ marginBottom: 12 }}>
          <FieldLabel>Movement</FieldLabel>
          <MovementCombobox
            value={exercise.movementId}
            onChange={(movementId, mov) => updateExercise(sessionId, exercise.id, {
              movementId,
              cue: exercise.cue || mov.defaultCue,
              restSeconds: exercise.restSeconds ?? (mov as any).defaultRestSeconds ?? null,
              movementIntent: mov.movementIntent,
            })}
            onClear={() => updateExercise(sessionId, exercise.id, { movementId: null, cue: '' })}
            usedMovementIds={usedMovementIds}
          />
        </div>

        {/* Intent + Rest + Prime */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <FieldLabel>Intent</FieldLabel>
            <select className="input" style={{ height: 32, fontSize: 13 }}
              value={exercise.movementIntent}
              onChange={e => updateExercise(sessionId, exercise.id, { movementIntent: e.target.value as MovementIntent })}
            >
              {INTENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Rest (s)</FieldLabel>
            <input className="input" style={{ height: 32, fontSize: 13 }} type="number"
              placeholder="Policy default"
              value={exercise.restSeconds ?? ''}
              onChange={e => updateExercise(sessionId, exercise.id, {
                restSeconds: e.target.value ? Number(e.target.value) : null,
              })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={exercise.isPrimeMover}
                onChange={e => updateExercise(sessionId, exercise.id, { isPrimeMover: e.target.checked })}
                style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }}
              />
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--color-chrome)',
              }}>Prime mover</span>
            </label>
          </div>
        </div>

        {/* Cue */}
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Cue</FieldLabel>
          <input
            className="input"
            style={{ height: 32, fontSize: 13, fontStyle: exercise.cue ? 'normal' : 'italic' }}
            maxLength={60}
            placeholder="Physical cue only — one line."
            value={exercise.cue}
            onChange={e => updateExercise(sessionId, exercise.id, { cue: e.target.value })}
          />
          {exercise.cue && ['engage', 'focus', 'maintain', 'feel', 'try to'].some(w => exercise.cue.toLowerCase().includes(w)) && (
            <p style={{ fontSize: 10, color: 'var(--color-error)', fontFamily: 'var(--font-serif)', marginTop: 3, fontStyle: 'italic' }}>
              Too abstract. Make it physical.
            </p>
          )}
        </div>

        {/* Sets */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <FieldLabel>Sets</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 1fr 1fr 24px', gap: 6, width: 'calc(100% - 40px)' }}>
              {['#', 'Reps', 'lb', 'Dur (s)', ''].map((h, i) => (
                <span key={i} style={{
                  fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--color-dim)', textAlign: 'center',
                }}>{h}</span>
              ))}
            </div>
          </div>

          {exercise.sets.map(set => (
            <SetRow
              key={set.id}
              set={set}
              onUpdate={patch => updateSet(sessionId, exercise.id, set.id, patch)}
              onDelete={() => deleteSet(sessionId, exercise.id, set.id)}
              canDelete={exercise.sets.length > 1}
            />
          ))}

          {exercise.sets.length < 8 ? (
            <button
              onClick={() => addSet(sessionId, exercise.id)}
              style={{
                marginTop: 6, background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--color-accent)',
                fontSize: 12, fontFamily: 'var(--font-serif)',
                padding: '2px 0', letterSpacing: '0.02em',
              }}
            >+ set</button>
          ) : (
            <p style={{ fontSize: 10, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 4, fontStyle: 'italic' }}>Max 8 sets.</p>
          )}
        </div>

        {/* Progression toggle */}
        <button
          onClick={() => setShowProg(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-dim)', fontSize: 11,
            fontFamily: 'var(--font-serif)',
            padding: 0, display: 'flex', alignItems: 'center', gap: 5,
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ fontSize: 9, color: showProg ? 'var(--color-accent)' : 'var(--color-dim)' }}>
            {showProg ? '▾' : '▸'}
          </span>
          Progression
          {exercise.progression.type !== 'None' && (
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
              color: 'var(--color-accent)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginLeft: 4,
            }}>{exercise.progression.type}</span>
          )}
        </button>

        {showProg && (
          <ProgressionEditor
            rule={exercise.progression}
            onChange={rule => updateProgression(sessionId, exercise.id, rule)}
          />
        )}
      </div>
    </div>
  )
}

// ── Session editor ───────────────────────────────────────────────────────────
function SessionEditor({ sessionId }: { sessionId: string }) {
  const program = useProgramStore(s => s.program)
  const { updateSessionName, updateSessionDayIndex, updateSessionIntensityLabel, addExercise } = useProgramStore()

  let session: Session | null = null
  for (const block of program.blocks)
    for (const week of block.weeks)
      for (const s of week.sessions)
        if (s.id === sessionId) session = s

  if (!session) return null

  const usedMovementIds = session.exercises.map(e => e.movementId).filter(Boolean) as string[]
  const hasErrors = session.exercises.some(e => e.sets.some(s => s.reps === null && s.durationSeconds === null))

  return (
    <div>
      {/* Session fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <FieldLabel>Session name</FieldLabel>
          <input className="input" style={{ height: 34 }} maxLength={40}
            value={session.name}
            onChange={e => updateSessionName(sessionId, e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Day</FieldLabel>
          <select className="input" style={{ height: 34, fontSize: 13 }}
            value={session.dayIndex ?? ''}
            onChange={e => updateSessionDayIndex(sessionId, e.target.value !== '' ? Number(e.target.value) : null)}
          >
            <option value="">— unset —</option>
            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Intensity label</FieldLabel>
          <input className="input" style={{ height: 34 }} placeholder="e.g. Heavy"
            value={session.intensityLabel}
            onChange={e => updateSessionIntensityLabel(sessionId, e.target.value)}
          />
        </div>
      </div>

      {/* Exercise count + add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: hasErrors ? 'var(--color-error)' : 'var(--color-dim)',
        }}>
          Exercises {session.exercises.length}/8
          {session.exercises.length < 4 && session.exercises.length > 0 && (
            <span style={{ color: 'var(--color-error)' }}> · needs {4 - session.exercises.length} more</span>
          )}
        </span>
        {session.exercises.length < 8 && (
          <button className="btn btn-outline" style={{ height: 30, fontSize: 12 }} onClick={() => addExercise(sessionId)}>
            + Exercise
          </button>
        )}
      </div>

      {session.exercises.length === 0 ? (
        <div style={{
          padding: '40px 0', textAlign: 'center',
          border: '1px dashed var(--color-rule)',
          borderRadius: 8,
        }}>
          <p style={{ color: 'var(--color-dim)', fontSize: 13, fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: 12 }}>
            No exercises.
          </p>
          <button className="btn btn-primary" onClick={() => addExercise(sessionId)}>
            + Add exercise
          </button>
        </div>
      ) : (
        session.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            sessionId={sessionId}
            index={i}
            usedMovementIds={usedMovementIds}
          />
        ))
      )}
    </div>
  )
}

// ── Program meta editor ──────────────────────────────────────────────────────
function ProgramMetaEditor() {
  const { program, setName, setSourceLabel, setTargetWeeks, setDaysPerWeek, setNotes } = useProgramStore()

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{
        fontSize: 9, fontFamily: 'var(--font-serif)', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--color-dim)', marginBottom: 20,
      }}>Program details</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <FieldLabel>Program name *</FieldLabel>
          <input className="input" maxLength={60}
            placeholder="e.g. Forge Accumulation Block"
            value={program.name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Source label</FieldLabel>
          <input className="input" maxLength={30}
            placeholder="e.g. Brice, Custom"
            value={program.sourceLabel}
            onChange={e => setSourceLabel(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>Target weeks (4–6)</FieldLabel>
            <input className="input" type="number" min={4} max={6}
              value={program.targetWeeks ?? ''}
              onChange={e => setTargetWeeks(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <FieldLabel>Days per week (3–5)</FieldLabel>
            <input className="input" type="number" min={3} max={5}
              value={program.daysPerWeek ?? ''}
              onChange={e => setDaysPerWeek(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Internal notes</FieldLabel>
          <textarea className="input" style={{ height: 90 }} maxLength={500}
            placeholder="Not shown to athletes."
            value={program.notes}
            onChange={e => setNotes(e.target.value)}
          />
          <p style={{ fontSize: 10, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)', marginTop: 3, textAlign: 'right' }}>
            {program.notes.length}/500
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Tree row ─────────────────────────────────────────────────────────────────
function TreeRow({ label, depth, selected, onClick, expanded, editable, onLabelChange, actions = [], meta }: {
  label: string
  depth: number
  selected: boolean
  onClick: () => void
  expanded?: boolean
  editable?: boolean
  onLabelChange?: (v: string) => void
  actions?: { label: string; onClick: () => void; danger?: boolean }[]
  meta?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        paddingLeft: 12 + depth * 14,
        paddingRight: 8, height: 34,
        cursor: 'pointer',
        background: selected ? 'var(--color-accent-dim)' : 'transparent',
        borderLeft: `2px solid ${selected ? 'var(--color-accent)' : 'transparent'}`,
        gap: 6, position: 'relative',
        transition: 'background 80ms',
      }}
    >
      {/* Expand chevron or indent dot */}
      <span style={{
        fontSize: 8, color: selected ? 'var(--color-accent)' : 'var(--color-dim)',
        minWidth: 10, textAlign: 'center', lineHeight: 1,
      }}>
        {expanded !== undefined ? (expanded ? '▾' : '▸') : '·'}
      </span>

      {/* Label */}
      {editable && editing ? (
        <input
          autoFocus
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, fontSize: 12, background: 'transparent',
            border: 'none', outline: 'none',
            color: 'var(--color-ink)', fontFamily: 'var(--font-sans)',
          }}
          value={label}
          onChange={e => onLabelChange?.(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => e.key === 'Enter' && setEditing(false)}
        />
      ) : (
        <span
          style={{
            flex: 1, fontSize: 12,
            color: selected ? 'var(--color-ink)' : 'var(--color-chrome)',
            fontWeight: selected ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onDoubleClick={e => { if (editable) { e.stopPropagation(); setEditing(true) } }}
        >{label}</span>
      )}

      {/* Meta count */}
      {meta && (
        <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--color-dim)', flexShrink: 0 }}>
          {meta}
        </span>
      )}

      {/* Actions menu */}
      {actions.length > 0 && (
        <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-dim)', fontSize: 13, padding: '1px 3px',
              borderRadius: 3, lineHeight: 1, opacity: menuOpen ? 1 : 0.6,
            }}
          >⋯</button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                onClick={() => setMenuOpen(false)}
              />
              <div className="dropdown" style={{ right: 0, top: '100%', zIndex: 50, minWidth: 140 }}>
                {actions.map(a => (
                  <button
                    key={a.label}
                    className={`dropdown-item${a.danger ? ' danger' : ''}`}
                    onClick={() => { setMenuOpen(false); a.onClick() }}
                  >{a.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Program tree ─────────────────────────────────────────────────────────────
function ProgramTree() {
  const {
    program, selection, expandedWeeks,
    select, toggleWeek,
    addBlock, updateBlockName, deleteBlock, duplicateBlock,
    addWeek, deleteWeek, duplicateWeek,
    addSession, updateSessionName, deleteSession, duplicateSession,
  } = useProgramStore()

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Program root */}
      <TreeRow
        label={program.name || 'New program'}
        depth={0}
        selected={selection.type === 'program'}
        onClick={() => select({ type: 'program' })}
        meta={`${program.blocks.reduce((n, b) => n + b.weeks.length, 0)}w`}
      />

      {program.blocks.map(block => (
        <div key={block.id}>
          <TreeRow
            label={block.name}
            depth={0}
            selected={selection.type === 'block' && selection.blockId === block.id}
            onClick={() => select({ type: 'block', blockId: block.id })}
            editable
            onLabelChange={name => updateBlockName(block.id, name)}
            meta={`${block.weeks.length}w`}
            actions={[
              { label: 'Add week',       onClick: () => addWeek(block.id) },
              { label: 'Duplicate',      onClick: () => duplicateBlock(block.id) },
              { label: 'Delete block',   onClick: () => deleteBlock(block.id), danger: true },
            ]}
          />

          {block.weeks.map(week => {
            const isExpanded = expandedWeeks.has(week.id)
            return (
              <div key={week.id}>
                <TreeRow
                  label={`Week ${week.weekNumber}`}
                  depth={1}
                  selected={selection.type === 'week' && selection.weekId === week.id}
                  onClick={() => { select({ type: 'week', blockId: block.id, weekId: week.id }); toggleWeek(week.id) }}
                  expanded={isExpanded}
                  meta={`${week.sessions.length}s`}
                  actions={[
                    { label: 'Add session',  onClick: () => addSession(week.id) },
                    { label: 'Duplicate',    onClick: () => duplicateWeek(block.id, week.id) },
                    { label: 'Delete week',  onClick: () => deleteWeek(block.id, week.id), danger: true },
                  ]}
                />

                {isExpanded && week.sessions.map(session => (
                  <TreeRow
                    key={session.id}
                    label={session.name}
                    depth={2}
                    selected={selection.type === 'session' && selection.sessionId === session.id}
                    onClick={() => select({ type: 'session', blockId: block.id, weekId: week.id, sessionId: session.id })}
                    editable
                    onLabelChange={name => updateSessionName(session.id, name)}
                    meta={`${session.exercises.length}ex`}
                    actions={[
                      { label: 'Duplicate',      onClick: () => duplicateSession(session.id) },
                      { label: 'Delete session', onClick: () => deleteSession(session.id), danger: true },
                    ]}
                  />
                ))}

                {isExpanded && (
                  <button
                    onClick={() => addSession(week.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      paddingLeft: 12 + 2 * 14 + 16, paddingTop: 4, paddingBottom: 4,
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: 'var(--color-accent)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >+ session</button>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Add block */}
      <button
        onClick={addBlock}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '8px 12px',
          background: 'none',
          border: 'none', borderTop: '1px solid var(--color-rule-light)',
          cursor: 'pointer', marginTop: 6,
          fontSize: 11, color: 'var(--color-accent)',
          fontFamily: 'var(--font-serif)',
        }}
      >+ block</button>
    </div>
  )
}

// ── Block/Week detail panels ─────────────────────────────────────────────────
function BlockDetail({ blockId }: { blockId: string }) {
  const block = useProgramStore(s => s.program.blocks.find(b => b.id === blockId))
  if (!block) return null
  const totalEx = block.weeks.reduce((n, w) => n + w.sessions.reduce((m, s) => m + s.exercises.length, 0), 0)
  return (
    <div>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-serif)', color: 'var(--color-ink)', marginBottom: 8 }}>{block.name}</p>
      <p style={{ fontSize: 12, color: 'var(--color-dim)', fontFamily: 'var(--font-serif)' }}>
        {block.weeks.length} week{block.weeks.length !== 1 ? 's' : ''} · {totalEx} exercises
      </p>
    </div>
  )
}

function WeekDetail({ weekId }: { weekId: string }) {
  const program = useProgramStore(s => s.program)
  let week: Week | null = null
  for (const b of program.blocks) for (const w of b.weeks) if (w.id === weekId) week = w
  if (!week) return null
  return (
    <div>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-serif)', color: 'var(--color-ink)', marginBottom: 16 }}>
        Week {week.weekNumber}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {week.sessions.map(s => (
          <div key={s.id} style={{
            padding: '11px 14px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-rule)',
            borderRadius: 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>{s.name}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--color-dim)', marginLeft: 10 }}>
              {s.exercises.length}ex · {s.dayIndex !== null ? DAY_NAMES[s.dayIndex] : 'Day unset'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main builder page ────────────────────────────────────────────────────────
export default function ProgramBuilderPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { program, selection, saveState, saveDraft, runValidation, showValidation, resetDraft } = useProgramStore()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Load existing program from Supabase when editing
  useEffect(() => {
    if (id && id !== 'new') {
      getProgram(id).then(prog => {
        useProgramStore.setState(s => ({
          program: {
            ...s.program,
            id: prog.id,
            name: prog.name,
            sourceLabel: prog.sourceLabel,
            targetWeeks: prog.targetWeeks,
            daysPerWeek: prog.daysPerWeek,
            notes: prog.notes ?? '',
            status: prog.status,
            blocks: prog.blocks ?? [],
            lastSaved: prog.lastSaved,
          }
        }))
      }).catch(console.error)
    } else if (!id || id === 'new') {
      resetDraft()
    }
  }, [id])

  useEffect(() => {
    startAutosave()
    return () => stopAutosave()
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      if (id && id !== 'new') {
        await saveProgram(program)
      } else {
        const newId = await createProgram(program)
        navigate(`/forge/programs/${newId}`, { replace: true })
      }
      saveDraft()
    } catch (e) {
      console.error(e)
      saveDraft()
    } finally {
      setSaving(false)
    }
  }, [id, program, navigate, saveDraft])

  const handlePublish = useCallback(async () => {
    const errors = runValidation()
    const hasErrors = errors.filter(r => r.severity === 'error').length > 0
    if (hasErrors) return // ValidationPanel already shown
    setPublishing(true)
    try {
      await handleSave()
      if (id && id !== 'new') await publishProgram(id)
      useProgramStore.setState(s => ({ program: { ...s.program, status: 'Published' }, showValidation: false }))
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(false)
    }
  }, [id, handleSave, runValidation])

  const handleBlur = useCallback(() => {
    handleSave()
  }, [handleSave])

  return (
    <div onBlur={handleBlur} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 50px)' }}>

      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 36px', height: 52,
        borderBottom: '1px solid var(--color-rule)',
        gap: 12, flexShrink: 0,
        background: 'var(--color-surface)',
      }}>
        <button
          onClick={() => navigate('/forge/programs')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-dim)', fontSize: 11,
            fontFamily: 'var(--font-serif)',
            padding: '0 8px 0 0',
            borderRight: '1px solid var(--color-rule)',
            marginRight: 4,
          }}
        >← Programs</button>

        {/* Program name — inline edit */}
        <input
          style={{
            flex: 1, fontSize: 14, fontWeight: 500,
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--color-ink)', fontFamily: 'var(--font-sans)',
          }}
          placeholder="New program"
          value={program.name}
          onChange={e => useProgramStore.getState().setName(e.target.value)}
        />

        {/* Save state */}
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-serif)',
          color: 'var(--color-dim)', minWidth: 50,
          fontStyle: 'italic',
        }}>
          {saveState.status === 'saving' ? 'Saving…' : saveState.status === 'saved' ? 'Saved' : ''}
        </span>

        {/* Status pill */}
        <span className={`pill ${program.status === 'Published' ? 'pill-amber' : 'pill-dim'}`}>
          {program.status}
        </span>

        <button className="btn btn-ghost" style={{ height: 30, fontSize: 12 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          className="btn btn-primary"
          style={{ height: 30, fontSize: 12 }}
          disabled={publishing}
          onClick={handlePublish}
        >
          {publishing ? 'Publishing…' : 'Publish →'}
        </button>
      </div>

      {/* ── Two-panel layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: tree */}
        <div style={{
          width: 240, flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-rule)',
          overflowY: 'auto',
          paddingTop: 8,
        }}>
          <ProgramTree />
        </div>

        {/* Right: editor */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 32px',
          background: 'var(--color-bg)',
        }}>
          {selection.type === 'program'  && <ProgramMetaEditor />}
          {selection.type === 'block'    && selection.blockId   && <BlockDetail blockId={selection.blockId} />}
          {selection.type === 'week'     && selection.weekId    && <WeekDetail weekId={selection.weekId} />}
          {selection.type === 'session'  && selection.sessionId && <SessionEditor sessionId={selection.sessionId} />}
        </div>
      </div>

      {showValidation && <ValidationPanel />}
    </div>
  )
}
