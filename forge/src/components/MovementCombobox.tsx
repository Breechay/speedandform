import { useState, useRef, useEffect, useCallback } from 'react'
import type { Movement } from '../types/program'
import movementsData from '../data/movements.json'

const catalog: Movement[] = movementsData as unknown as Movement[]

function score(m: Movement, q: string): number {
  const name = m.displayName.toLowerCase()
  const id   = m.movementId.toLowerCase()
  if (name === q || id === q)         return 4
  if (name.startsWith(q))             return 3
  if (id.startsWith(q))               return 3
  if (name.includes(q) || id.includes(q)) return 2
  let ci = 0
  for (const ch of name) { if (ch === q[ci]) ci++; if (ci === q.length) return 1 }
  return 0
}

interface Props {
  value: string | null
  onChange: (movementId: string, movement: Movement) => void
  onClear: () => void
  usedMovementIds?: string[]
  disabled?: boolean
}

export default function MovementCombobox({ value, onChange, onClear, usedMovementIds = [], disabled }: Props) {
  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLUListElement>(null)

  const selected = value ? catalog.find(m => m.movementId === value) ?? null : null

  const results = query
    ? catalog.map(m => ({ m, s: score(m, query.toLowerCase()) }))
              .filter(x => x.s > 0)
              .sort((a, b) => b.s - a.s)
              .slice(0, 30)
              .map(x => x.m)
    : catalog.slice(0, 30)

  const isDuplicate = selected
    ? usedMovementIds.filter(id => id === selected.movementId).length > 1
    : false

  const handleSelect = useCallback((m: Movement) => {
    onChange(m.movementId, m)
    setOpen(false)
    setQuery('')
  }, [onChange])

  useEffect(() => { setHighlighted(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[highlighted]) handleSelect(results[highlighted]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  // ── Selected state ──────────────────────────────────────────
  if (selected && !open) {
    return (
      <div>
        <div
          onClick={() => !disabled && setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderRadius: 4,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
            {selected.displayName}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onClear() }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-dim)', fontSize: 14, lineHeight: 1, padding: '0 2px',
              }}
            >×</button>
          )}
        </div>

        {/* Cue preview */}
        {selected.defaultCue && (
          <p style={{
            fontSize: 10, color: 'var(--color-dim)',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            marginTop: 3, paddingLeft: 2,
          }}>"{selected.defaultCue}"</p>
        )}

        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--color-accent)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Already in this session.
            </span>
          </div>
        )}
      </div>
    )
  }

  // ── Search state ────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="input"
        style={{ height: 34, fontSize: 13 }}
        type="text"
        placeholder="Search movements…"
        value={query}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            maxHeight: 280, overflowY: 'auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 50, listStyle: 'none', padding: 0, margin: 0,
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
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                {m.displayName}
              </div>
              {m.defaultCue && (
                <div style={{
                  fontSize: 10, color: 'var(--color-dim)',
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  marginTop: 1,
                }}>"{m.defaultCue}"</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
