# FORM future-speed authoring audit — 2026-11-02

## Scope and result

Read-only audit of current **published** future `planned_sessions` (2026-11-02 onward) in the connected FORM Supabase project. The tight quality-workout scope is titles starting Speed, 5K Rhythm, Threshold, Tempo, Interval, Track, VO2, Hill, Fartlek, Sprint, Strides, Mile Repeat, or Repeats. This title classifier is an audit heuristic, not a new session type.

| Finding | Count |
| --- | ---: |
| All published future sessions | 1,227 |
| Published quality-title sessions | 189 |
| Quality sessions with typed work component(s) | 175 |
| Quality sessions without a typed work component | **14** |
| Structured quality sessions whose details contain quantitative `×` notation (possible publisher echo) | **37** |
| True mismatches between pace text and canonical per-mile pace seconds | **0** |
| Reversed stored pace bands or work rows missing distance and duration | **0** |
| Current published Nov 5 source descriptions still containing the old “Two passes” summary | **0** |

The 14 quality sessions without typed work are **six Turner sessions** and **eight Jacob Hackman knee-return sessions**. They are review exceptions; some contain imprecise ranges such as “2 × 8–10 min.” The author must choose an exact measurable work prescription where appropriate. Do **not** synthesize structured work, change duration, or change injury-return constraints by inference.

The 37 detailed `×` descriptions are **candidates for source-copy review**, not 37 confirmed defects: some may contain meaningful instruction. Compare each one against its actual components, preserve useful execution guidance, and remove only repeated volume / split / recovery recaps. The broad search also surfaced other long/easy sessions with the word “speed” in intent; those were excluded from this quality-title count.

## Source and publishing standard

1. **Typed components own the dose**: rep count, distance/duration, target RPE or individualized pace, recovery, warm-up, and cool-down.
2. **Session details own the cue**: posture, rhythm, breathing, controlled finish, and meaningful safety adjustments. Do not duplicate publisher “Week:” recaps or scripted interval tables.
3. **New Speed/Threshold/quality sessions need measurable work parts** in Coach Console. Unchanged anatomy is carried into copy review for session revisions.
4. **Editorial checks run for authored changes** and Plan Exchange imports where the structured work is known; a concise execution cue remains valid.
5. **Never blanket-delete prose or silently interpret a range.** Hand an ambiguous prescription to the coach and retain published history.
6. **Pace storage uses seconds per mile as canonical**; display or input labels must convert or declare units honestly.

## Deployment and residual risk

Guardrail code is proposed in draft PR #431. It must pass CI, be reviewed and merged, and follow the planned release process before it changes production authoring. This UI/import check does **not** cover direct SQL/RPC publishers; a server-side validation at the common write boundary is the remaining defense-in-depth task. The 14 already-published prose-only sessions and 37 review candidates remain unchanged pending a coach decision.

## Source cleanup already completed

The 14 affected Nov 5 athlete source descriptions were manually revised through authenticated Coach Console to the execution cue “Keep the 400m smooth. Finish with another gear available.” Their structured anatomy (six reps, recoveries, personalized targets, warm-up and cool-down) and previous versions were preserved. Turner’s Nov 5 source was already clean and was not re-edited.
