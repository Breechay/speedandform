// src/components/CoachPlaybook.tsx
// speedandform · Rod coach dashboard component
//
// Coach Playbook: state-aware field notes on how to engage this athlete.
// Not generic tips. Specific posture, specific suggested texts by state.
//
// Placement: AthleteDetailPage, below AccountabilitySummary,
//            only when activeProgram includes rod_accountability_v1
//
// State values: "OK" | "WATCH" | "ALCOHOL" | "RETURN" | "MISSED_SESSION"
// Derived by deriveWatchState() in accountability.ts

import { useState, type CSSProperties } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type CoachState = "OK" | "WATCH" | "ALCOHOL" | "RETURN" | "MISSED_SESSION";

interface CoachPlaybookProps {
  state: CoachState;
  athleteName: string;         // "Rod" — first name only
  nextFixedPoint: string;      // e.g. "Monday 6:15"
  proteinDays: number;
  sessionsMissed: number;
  alcoholFlagged: boolean;
  daysSilent: number;          // days since last app open
  onSaveNote?: (note: string) => void;
  notes?: string[];             // private coach notes, most recent first
}

// ── State config ─────────────────────────────────────────────────────────────
// Each state has: posture summary, do/avoid lists, suggested texts (pick one)

const STATE_CONFIG: Record<CoachState, {
  label: string;
  labelColor: string;
  posture: string;
  do: string[];
  avoid: string[];
  texts: string[];
}> = {
  OK: {
    label: "OK",
    labelColor: "#8B7355",       // accent — muted warm
    posture: "Good week. Don't over-engage. Let the rhythm hold itself.",
    do: [
      "Acknowledge briefly at the session",
      "Keep the same structure next week",
      "Note what specifically went well for your own record",
    ],
    avoid: [
      "Over-praising — Rod may turn praise into overcommitment",
      "Adding new goals after a good week",
      "Expanding the program structure",
    ],
    texts: [
      "Good week. Repeat it.",
      "Keep it boring. Monday and Friday stay.",
    ],
  },

  WATCH: {
    label: "WATCH",
    labelColor: "#C4953A",       // amber
    posture: "Drift starting. One ask only. Do not request the whole story.",
    do: [
      "Text once — ask for one protein only",
      "Point to the next fixed session",
      "Wait for his reply before sending anything else",
    ],
    avoid: [
      '"How\'s it going?" — invites hiding',
      "Long advice or check-in lists",
      "Asking what happened or why logs dropped",
    ],
    texts: [
      "Send me first protein today. Nothing else.",
      "Protein before noon. Keep Friday.",
      "You alive? Thumbs up or down on protein today.",
    ],
  },

  ALCOHOL: {
    label: "ALCOHOL",
    labelColor: "#C4953A",       // amber
    posture: "Alcohol logged. Containment, not confession. Point forward only.",
    do: [
      "Acknowledge the log was received — no more",
      "Name the next fixed action: protein, then session",
      "Treat it as a known variable, not a failure",
    ],
    avoid: [
      'Asking "What happened?" — triggers shame spiral',
      "Autopsy of the drinking",
      "Disappointment tone, even subtle",
      "Cancelling or rescheduling the session",
    ],
    texts: [
      "Logged. Water, protein, next session.",
      "No reset speech. Protein before noon and keep Friday.",
      "Copy that. Drink a glass of water now. See you Friday 6:15.",
    ],
  },

  RETURN: {
    label: "RETURN",
    labelColor: "#8B4513",       // deep amber-red
    posture: "He's been gone. Make re-entry cheap. One sentence, no debt.",
    do: [
      "Name only the next fixed point — the session",
      "Let the session itself be the re-entry, not a conversation",
      "If he shows up, treat it as normal — don't reference the absence",
    ],
    avoid: [
      "Asking him to explain himself before returning",
      "Referencing what was missed",
      "Making re-entry emotionally expensive",
      "New rules or new structure at re-entry",
    ],
    texts: [
      "You don't owe the whole explanation. Show up Monday.",
      "Monday 6:15. We restart from the first set.",
      "Monday stays. That's all.",
    ],
  },

  MISSED_SESSION: {
    label: "MISSED SESSION",
    labelColor: "#8B4513",
    posture: "Session missed. Name the next one. Nothing else.",
    do: [
      "Text once — name the next fixed session only",
      "Keep the next session on calendar as-is",
      "At next session, train normally — no reference to the miss",
    ],
    avoid: [
      "Asking why he missed",
      "Offering to reschedule or 'make it up'",
      "Increasing volume next session to compensate",
    ],
    texts: [
      "Friday stays.",
      "Next fixed point is Friday 6:15.",
      "No catch-up. Friday 6:15.",
    ],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CoachPlaybook({
  state,
  athleteName: _athleteName,
  nextFixedPoint,
  proteinDays: _proteinDays,
  sessionsMissed: _sessionsMissed,
  alcoholFlagged: _alcoholFlagged,
  daysSilent: _daysSilent,
  onSaveNote,
  notes = [],
}: CoachPlaybookProps) {
  const config = STATE_CONFIG[state];
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setSelectedText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function saveNote() {
    if (!noteInput.trim()) return;
    onSaveNote?.(noteInput.trim());
    setNoteInput("");
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>COACH PLAYBOOK</span>
        <span style={{ ...styles.stateChip, color: config.labelColor }}>
          {config.label}
        </span>
      </div>

      <div style={styles.divider} />

      {/* Athlete pattern — fixed, always visible */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>ATHLETE PATTERN</span>
        <p style={styles.patternText}>
          Responds to presence. Falls apart solo.
          Shame turns one missed day into a lost week.
          One bad night can become three weeks off if re-entry is expensive.
        </p>
      </div>

      <div style={styles.divider} />

      {/* Current posture */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>POSTURE NOW</span>
        <p style={styles.postureText}>{config.posture}</p>
      </div>

      {/* Do / Avoid */}
      <div style={styles.doAvoidRow}>
        <div style={styles.doCol}>
          <span style={styles.sectionLabel}>DO</span>
          <ul style={styles.list}>
            {config.do.map((item, i) => (
              <li key={i} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>
        <div style={styles.avoidCol}>
          <span style={styles.sectionLabel}>AVOID</span>
          <ul style={styles.list}>
            {config.avoid.map((item, i) => (
              <li key={i} style={{ ...styles.listItem, color: "#9A8B7A" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Next fixed point */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>NEXT FIXED POINT</span>
        <p style={styles.fixedPoint}>{nextFixedPoint}</p>
        <p style={styles.fixedPointSub}>
          The session is the intervention. Text supports it; it does not replace it.
        </p>
      </div>

      <div style={styles.divider} />

      {/* Suggested texts */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>SUGGESTED TEXT</span>
        <p style={styles.textNote}>
          Pick one. Send once. Wait.
        </p>
        <div style={styles.textOptions}>
          {config.texts.map((text, i) => (
            <button
              key={i}
              style={{
                ...styles.textOption,
                ...(selectedText === text ? styles.textOptionSelected : {}),
              }}
              onClick={() => copyText(text)}
            >
              <span style={styles.textOptionQuote}>"{text}"</span>
              <span style={styles.textOptionCopy}>
                {selectedText === text && copied ? "Copied" : "Copy"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      {/* Big principle */}
      <div style={styles.principle}>
        <span style={styles.principleText}>
          Brief. Factual. Forward-facing. No autopsy.
        </span>
      </div>

      <div style={styles.divider} />

      {/* Private coach notes */}
      <div style={styles.section}>
        <div style={styles.notesHeader}>
          <span style={styles.sectionLabel}>COACHING NOTES</span>
          <button
            style={styles.notesToggle}
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? "Hide" : `Show${notes.length > 0 ? ` (${notes.length})` : ""}`}
          </button>
        </div>

        {showNotes && (
          <>
            {notes.length === 0 && (
              <p style={styles.emptyNotes}>No notes yet.</p>
            )}
            {notes.map((note, i) => (
              <div key={i} style={styles.noteRow}>
                <span style={styles.noteBullet}>—</span>
                <span style={styles.noteText}>{note}</span>
              </div>
            ))}
            <div style={styles.noteInputRow}>
              <input
                style={styles.noteInput}
                placeholder="Add a coaching note..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNote()}
              />
              <button
                style={styles.noteSave}
                onClick={saveNote}
                disabled={!noteInput.trim()}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// Matches speedandform's monospaced, cream-and-gold aesthetic

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
    background: "#F5F2EC",
    border: "0.5px solid rgba(139, 115, 85, 0.18)",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px 12px",
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "2px",
    color: "rgba(74, 60, 44, 0.5)",
  },
  stateChip: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "1.6px",
  },
  divider: {
    height: 0.5,
    background: "rgba(139, 115, 85, 0.12)",
    margin: "0 20px",
  },
  section: {
    padding: "14px 20px",
  },
  sectionLabel: {
    display: "block",
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "1.4px",
    color: "rgba(74, 60, 44, 0.42)",
    marginBottom: 6,
  },
  patternText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "rgba(74, 60, 44, 0.7)",
    margin: 0,
  },
  postureText: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.6,
    color: "#4A3C2C",
    margin: 0,
  },
  doAvoidRow: {
    display: "flex",
    gap: 0,
    padding: "14px 20px",
  },
  doCol: {
    flex: 1,
    paddingRight: 16,
  },
  avoidCol: {
    flex: 1,
    paddingLeft: 16,
    borderLeft: "0.5px solid rgba(139, 115, 85, 0.12)",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  listItem: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "rgba(74, 60, 44, 0.75)",
    paddingLeft: 10,
    position: "relative" as const,
    marginBottom: 2,
  },
  fixedPoint: {
    fontSize: 18,
    fontWeight: 700,
    color: "#8B7355",
    margin: "0 0 4px",
    letterSpacing: "-0.3px",
  },
  fixedPointSub: {
    fontSize: 10,
    color: "rgba(74, 60, 44, 0.45)",
    margin: 0,
    lineHeight: 1.5,
  },
  textNote: {
    fontSize: 10,
    color: "rgba(74, 60, 44, 0.45)",
    margin: "0 0 10px",
  },
  textOptions: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  textOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "rgba(139, 115, 85, 0.06)",
    border: "0.5px solid rgba(139, 115, 85, 0.15)",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
  textOptionSelected: {
    background: "rgba(139, 115, 85, 0.13)",
    border: "0.5px solid rgba(139, 115, 85, 0.35)",
  },
  textOptionQuote: {
    fontSize: 11,
    color: "#4A3C2C",
    lineHeight: 1.5,
    flex: 1,
  },
  textOptionCopy: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "1px",
    color: "#8B7355",
    marginLeft: 12,
    flexShrink: 0,
  },
  principle: {
    padding: "12px 20px",
    background: "rgba(139, 115, 85, 0.05)",
  },
  principleText: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(74, 60, 44, 0.6)",
    letterSpacing: "0.3px",
  },
  notesHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  notesToggle: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "1px",
    color: "#8B7355",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  emptyNotes: {
    fontSize: 10,
    color: "rgba(74, 60, 44, 0.35)",
    margin: "0 0 10px",
  },
  noteRow: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
  },
  noteBullet: {
    fontSize: 11,
    color: "rgba(74, 60, 44, 0.35)",
    flexShrink: 0,
  },
  noteText: {
    fontSize: 11,
    color: "rgba(74, 60, 44, 0.7)",
    lineHeight: 1.6,
  },
  noteInputRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: 11,
    fontFamily: "inherit",
    background: "rgba(139, 115, 85, 0.06)",
    border: "0.5px solid rgba(139, 115, 85, 0.2)",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#4A3C2C",
    outline: "none",
  },
  noteSave: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "1px",
    fontFamily: "inherit",
    background: "#8B7355",
    color: "#F5F2EC",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
  },
};
