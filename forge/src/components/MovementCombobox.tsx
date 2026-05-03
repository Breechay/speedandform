import { useState, useRef, useEffect, useCallback } from 'react'
import type { Movement } from '../types/program'
import movementsData from '../data/movements.sample.json'

const catalog: Movement[] = movementsData as Movement[]

// ─── Ranking ─────────────────────────────────────────────────────────────────
function score(movement: Movement, query: string): number {
  const q = query.toLowerCase()
  const name = movement.displayName.toLowerCase()
  const id = movement.movementId.toLowerCase()
  if (name === q || id === q) return 4
  if (name.startsWith(q) || id.startsWith(q)) return 3
  if (name.includes(q) || id.includes(q)) return 2
  // character-order fuzzy
  let ci = 0
  for (const ch of name) {
    if (ch === q[ci]) ci++
    if (ci === q.length) return 1
  }
  return 0
}

interface MovementComboboxProps {
  value: string | null
  onChange: (movementId: string, movement: Movement) => void
  onClear: () => void
  usedMovementIds?: string[]
  disabled?: boolean
}

export default function MovementCombobox({
  value,
  onChange,
  onClear,
  usedMovementIds = [],
  disabled,
}: MovementComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = value ? catalog.find((m) => m.movementId === value) ?? null : null

  const results = query
    ? catalog
        .map((m) => ({ m, s: score(m, query) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.m)
    : catalog.slice(0, 40)

  const isDuplicate = selected
    ? usedMovementIds.filter((id) => id === selected.movementId).length > 1
    : false

  const handleSelect = useCallback(
    (movement: Movement) => {
      onChange(movement.movementId, movement)
      setOpen(false)
      setQuery('')
    },
    [onChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[highlighted]) handleSelect(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  // Scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  if (selected && !open) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderRadius: 4,
            cursor: disabled ? 'default' : 'pointer',
          }}
          onClick={() => !disabled && setOpen(true)}
        >
          <span style={{ flex: 1, fontSize: 14, color: 'var(--color-ink)', fontWeight: 500 }}>
            {selected.displayName}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-dim)',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >×</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
            {selected.movementId}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-dim)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--color-dim)' }}>
            {selected.muscleGroup.join(', ')}
          </span>
        </div>
        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              Already in this session.
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="input"
        type="text"
        placeholder="Search movements…"
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            zIndex: 50,
            listStyle: 'none',
            padding: 0,
            margin: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {results.map((m, i) => (
            <li
              key={m.movementId}
              onMouseDown={() => handleSelect(m)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === highlighted ? 'var(--color-bg)' : 'transparent',
                borderBottom: '1px solid var(--color-rule-light)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>
                {m.displayName}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
                  {m.movementId}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-dim)' }}>
                  {m.muscleGroup.join(', ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
