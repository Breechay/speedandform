# Coach-only fortnightly audit bridge · October 27, 2026

## What changed

The standing private every-other-Sunday FORM goal audit remains in the `coach_audit_private` schema. The companion migration exposes only authorized, minimal aggregate attention metadata to the signed-in coach's existing `coach_preview_roster()` response:

- `audit_level`: `urgent | review | evidence | clear`
- `audit_count`: count of findings in the latest run
- `audit_reviewed_as_of`: scan date

The coach can request details for one of their authorized athletes via `public.coach_private_audit_findings(p_athlete_id uuid)`. Both endpoints require an active coach membership. The detail endpoint rejects athlete-only and unauthenticated sessions; the public table endpoints have no permissions to read the private audit tables. No private finding text belongs in the public feed or athlete UI.

The native Coach Board change is tracked separately in the FORM-iOS repository. The existing blue circumference remains filed-progress semantics. A short exterior oxblood/bronze/graphite arc and a separate private 'Priority / Review / Check' action lead to the coach's detail sheet. The athlete circle still opens the Week.

## Source-of-truth coaching changes

- Kevin's coach-confirmed Jan 31 Miami Marathon registration is recorded privately and his race card published without inventing an evidence-based pace.
- Elijah's stale Savannah block label is corrected to the Dec 13 Palm Beaches Half.
- Patrick's recent repeated 10-mile-day history is coach-reported, not device-verified. The remaining long-run calendar cannot alone prove inadequate endurance; fuel, recent durability, marathon history and taper stay in the clinical/coaching review.
- Hope's compressed October–December half-marathon build keeps one primary race-specific exposure while replacing stacked Thursday tempos with easy sessions; Nov 10 moves to easy and strides ahead of Saturday's 5-mile goal rhythm. Her race-day 13.1 mi is not inflated by separate warm-up.
- Simon's later Thursday placeholders become individually authored session versions in km-specific displayed details; they are NOT the official weekly communal track workout. Two-week reviews must still revise stale future prescriptions against new evidence, HYROX load and racing priorities.

## Ship gates

1. Apply migrations in filename order and verify `coach_preview_roster()` includes Brice and correct private attention fields only for a coach membership.
2. Verify `coach_private_audit_findings` succeeds for coach+athlete membership, fails for athlete-only / unrelated identities, and anon cannot execute.
3. Run the active plan audit again after coaching changes; don't take an older scan as live truth.
4. Build native FORM from the dashboard PR on a Mac. Test signed-in coach, athlete-only and dual-role accounts, loading/empty/error states, avatar spacing (small and regular devices), Dynamic Type, VoiceOver, dark athlete Week versus fixed paper Coach Board.
5. Test that opening private details never writes session completion or athlete plans and that returning from read-only athlete Week restores the Coach Board.
6. Do NOT say the new rings are on the installed iPhone until the native build ships and signed-in device QA passes. Backend-only updates already feed existing screens that consume their server fields.

The audit is a coaching prompt, not evidence that every flagged athlete is unsafe or behind goal. The coach owns changes to race prescription; copy can be concise without silently increasing load.
