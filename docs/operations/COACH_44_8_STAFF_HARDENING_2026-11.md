# Coach 44.8 — Staff hardening acceptance

Status: draft PR #493 acceptance contract; no production authorization. Supplements `COACH_44_8_RESUME_BRIEF.md`.

## Operating doctrine

The Athletic Compound is a conversational, trust-based $400/month whole-person coaching service. Staff is a calm operational orientation, not a new task inbox, a background agent claim, or an athlete-facing provenance lecture. No routine review gates; use new evidence to revise optimal programming.

## Single accountable owner

- **HC / Head Coach:** Brice owns sensitive judgment, athlete relationship and final permissions.
- **PD / Program Design:** prescribed training progression; hands saved plan to FI for representation validation.
- **AI / Athlete Intelligence:** baselines, evidence and chronology; routes findings to PD or HC.
- **AC / Athlete Care:** preferences, practical constraints and check-ins; routes medical/sensitive questions to HC.
- **FI / Filing Integrity:** owns filing → completion → ordered pieces → Week/post/feed payload reconciliation.
- **CE / Collective Experience:** owns feed and community presentation; returns missing source data to FI.
- **QR / Quality & Reliability:** owns version-specific crash, hang, performance and device verification.

One issue has one accountable owner. Any cross-role handoff records source ID, receiving role, reason and state; handoff never implies underlying work completed. Position codes do not imply independently running agents.

## Non-negotiable state rules

1. Unknown, partial, stale, errored or unauthorized source is never zero or healthy. Zero requires a complete successful authorized read.
2. Distinguish requested → queued → action recorded → saved readback → destination delivered → device verified. Each tier needs independent evidence; writing a receipt alone proves none of the downstream tiers.
3. All athlete-scoped reads and writes require the exact athlete ID and authorization. Ignore stale async results after athlete switch, logout or session change. Do not display cross-athlete cached data.
4. Owner-scoped retries must be idempotent and immutable. Conflicting evidence, athlete IDs, versions, units and rep times are rejected.
5. Decision inputs differ from later chronology. Never infer cause or version links from same-day dates.
6. Keep evidence distinctions internal. The athlete feed shows concise workout facts, not verification labels. Issue #494: Sam has ordered mile reps; Hope has aggregate-only 800m stats; Elijah has activity-mile splits in a note. Do not fabricate or mislabel individual repetitions.
7. QR may show app health by version only after a real privacy-minimal diagnostics source exists. Missing metrics are unknown, never “no crashes”; no raw sensitive crash data or routine athlete .ips collection.
8. Consent and explicit opt-outs are respected. No repeated workout descriptions, redundant copy or automatic “pending review” friction.

## Required negative and release tests

- Complete empty versus partial/stale/offline/error source; missing nested relation; unknown must be visible without fabricated counts.
- Signed-in coach versus unrelated coach, athlete-only and anonymous accounts; athlete switch and sign-out midrequest; no cross-owner leak.
- Receipt with missing independent source/destination proof, failed readback, replay key and conflicting retry; no tier inflation.
- Feed cases: Sam four reps, Hope aggregate-only, Elijah activity splits, revoked post, privacy opt-out, missing pieces, malformed units and duplicate filing.
- Signed-in desktop and 320/375/393/430px; long names, large text, overflow, navigation, loading and failure.
- Supabase migrations, RLS, grants, owner isolation and advisors in controlled environment first; focused/full tests, source provenance and Brice approval before deployment.

## Resume rule

At 44.8 restart, compare current main, draft PR #493, actual database schema, and completed 44.7 work. Log the delta and tests. Keep 44.6/44.7 release work and athlete plan mutations outside this draft.
