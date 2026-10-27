# FORM · Biweekly athlete goal review

Owner: FORM Coaching. Established October 26, 2026.
Scope: every **active coached training block** in FORM Athlete System, including running, strength, and HYROX. Events-only members with no coached block are not presumed coached.

## Standard

Every 14 days, make a coach decision about **each athlete against their individual goal**, not just whether the plan is syntactically valid. The review is the $500/month white-glove standard for attention, not a claim that everyone pays the same fee. A quiet athlete and an athlete with a public study receive the same private review.

1. **Goal and date:** Check the confirmed event, distance, realistic target, current phase, block end and race-week placement. An athlete's profile and training block must agree. An event date marked TBD stays unconfirmed until verified.
2. **Evidence and confidence:** Read recorded sessions, actual versus prescribed splits, RPE, recovery, missed/modified work, athlete feedback and relevant external activity. Missing FORM completions mean **missing evidence**, not proof of missed training.
3. **Training earns the goal:** Is there enough goal-specific work, easy support, progressive durability, recovery and a suitable taper? Are intensities and paces explicit where useful? Check the *workout's purpose*, not just its name.
4. **Whole-person load:** Review pain/injury and PT instructions without overriding the clinician, plus concurrent Forge strength, HYROX stations, race travel and competing demands. Use the paired seven-day FORM/Forge review before a meaningful training change.
5. **Choose the next smallest useful change:** Keep / adjust / pause / clarify with the athlete or PT. Record what changed, why, evidence confidence, next test, and the date for follow-up. Never escalate just to satisfy a mileage ladder.
6. **Publication QA:** Check structured components, exact targets, warm-up/cool-down, athlete-friendly wording and the newest version against the signed-in feed. No private coach notes in Week. Do not confuse database publication with an iPhone or Apple release.

## Ahead of events

- Within six weeks of a target race, check the race path **weekly**, even though the complete roster review is biweekly. Examine long-run progression, effort distribution, specificity and taper. A recurring iRUN or FORM Thursday is not an entitlement: replace it when it no longer serves race preparation.
- Within 14 days of a race, verify every scheduled workout, recovery day, the race-day card and any clinical restrictions; no late mileage catch-up or heavy simulation.
- If the goal is not supportable on current evidence, say so, preserve the athlete's health, and choose the honest race strategy. Never manufacture performance certainty.

## What is scheduled

The live Supabase project runs a **private, rules-based snapshot every other Sunday at 21:00 UTC**, beginning **November 1, 2026**. A database cron job runs weekly but only writes on the 14-day anchor. The initial snapshot was run October 26. No extra ChatGPT Automation task is required.

- Source: `supabase/migrations/20261027023504_form_biweekly_coaching_goal_audit.sql` and follow-up `supabase/migrations/20261027023914_form_coaching_audit_recent_pain_signal.sql`
- Cron job: `form-coach-goal-review-fortnightly`
- Private schema: `coach_audit_private`
- Tables: `plan_audit_runs` and `plan_audit_findings`
- Rules currently cover active-block race-day presence, race-card distance, event-name drift, pace-field context, limited marathon long-run runway, three quality days per week, upcoming block end, unknown event date, recently filed pain symptoms, and missing *filed* evidence.
- Findings are **review prompts, not automatic coaching judgments**. The function never modifies plans, sends athlete notifications, exposes private notes, or publishes a workout.

To inspect the latest snapshot as an authorized coach/admin in Supabase SQL:

```sql
select a.display_name, f.severity, f.code, f.event_on, f.detail
from coach_audit_private.plan_audit_findings f
join public.athletes a on a.id=f.athlete_id
where f.run_id=(
  select r.id from coach_audit_private.plan_audit_runs r
  order by r.executed_at desc limit 1
)
order by case f.severity when 'URGENT' then 0 when 'REVIEW' then 1 else 2 end,
         a.display_name, f.code;
```

For the date and coverage:

```sql
select executed_at, reviewed_as_of, athlete_count, finding_count, source
from coach_audit_private.plan_audit_runs
order by executed_at desc limit 5;
```

The snapshot lives in a non-exposed private schema with RLS enabled and no public/authenticated grants. Only authorized admin tooling should query it. Do not place athlete findings or health records in this public repository.

**Operational limitation:** the database job records findings but does not itself read the private multi-system evidence, perform clinical judgment, mark review sign-offs, or send Brice a notification. A human/coach agent must still consume the queue. A later protected Coach Console alert can surface unresolved findings after a privacy review.

## Release distinction

This background scan supplements, but does not replace, `docs/coaching/FORM_ATHLETE_RELEASE_QA_2026-10-23.sql`, the athlete-copy self-audit, and actual signed-in feed/device verification. Resolve race-readiness concerns before changing the athlete's canonical plan. Keep archived/completed prescriptions intact.

## Escalation

- **URGENT:** race-day or active-block structural gap. Check before the next relevant publication; a tentative race must first be confirmed.
- **REVIEW:** requires individual judgment of pace, goal, load, taper, clinical context or event accuracy.
- **EVIDENCE:** request recent execution and recovery observations; do not infer poor adherence from missing sync.

The fortnightly review is complete only when every active coached athlete has an explicit private decision and next follow-up. A successful cron run alone is *not* completion of that coaching review.
