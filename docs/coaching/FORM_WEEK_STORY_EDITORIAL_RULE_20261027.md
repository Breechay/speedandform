# FORM · Weekly story editorial rule

Owner: FORM Coaching and athlete-facing FORM iOS
Approved: October 27, 2026
Applies to: Dossier "THIS WEEK", Plan weekly focus, coach preview, and any future consumer of `training_weeks.intent` and `training_weeks.matters_because`.

## What this space is for

An athlete opens the Dossier to understand the *point of the week*. The Week journal already lists the sessions. The weekly story must teach something that the calendar does not: which demand matters, how the easy work supports it, what changed from the surrounding weeks, or what pacing skill the athlete is practising.

The story is not an inventory of weekdays, a motivational slogan, or a second prescription.

## Authoring formula

- **What (`intent`):** One plain sentence grounded in the current published sessions. Name the distinguishing session(s), their relationship, or a meaningful change in training emphasis.
- **Why (`matters_because`):** One plain sentence about the training principle or practical judgment the athlete can use this week. Explain why the sessions and supporting work are arranged this way.
- Usually **20 to 45 words combined**, ideally two sentences. Database ceilings are 100 characters for `intent` and 125 for `matters_because`. Prefer a clear thought over using the full allowance.
- For a race or recovery week, say plainly that work becomes lighter or that the event is scheduled. Do not report an outcome that has not occurred.
- A phase gives the direction, but the actual published sessions determine the words.

Example for Tinius, Speed Reserve Week 2:

> Tuesday's descending repeats and Thursday's shorter track work ask for two kinds of speed.
>
> Wednesday and Saturday stay easy so the hard sessions count without making the whole week a test.

## Rejection rules

Rewrite before saving if the copy:

1. Lists Monday/Tuesday/Thursday/Saturday with semicolons or merely restates session titles already visible in Week.
2. Uses a generic second line such as "Keep Tuesday controlled. Saturday should feel comfortable" without explaining a meaningful principle.
3. Reuses another athlete's story while their sessions, mileage, demands, race, or level differ.
4. Uses em dashes, empty hype, jargon without meaning, coach-admin language, speculative fitness gains, or an unsupported race result.
5. Adds a pace, session, recovery rule, injury decision, or training load that the current prescription has not approved.
6. Claims a Forge strength program is assigned or changed based only on a blueprint.
7. Is stale, even if it sounds polished.

The point is *specific teaching in fewer words*. Every sentence must earn its place.

## Non-negotiable plan-change safeguard

A published running plan edit includes **two linked edits**:

1. Version or change the owning `planned_session` prescription, preserving history and the right athlete/week.
2. Read back the latest *published* sessions and reauthor or explicitly reconfirm **both** `training_weeks.intent` and `matters_because` against the changed week. Review adjacent week/phase wording when the progression changes. Only then mark the weekly story reviewed.

The existing database triggers record session, version, component, exercise and schedule changes in `coach_audit_private.week_story_changes`; `week_story_is_current` must stay false until a later story review. The app must withhold stale weekly explanations, not show them as current. Editing a session never silently certifies the prior story.

A prose-only fix may update the two story fields without changing workouts. An editorial rewrite **never** changes workouts or training doses.

For athletes using both FORM and Forge, any meaningful workload change also triggers the existing paired-program review. Copy-only edits do not manufacture a strength assignment or require a workout change.

## Self-audit, publication and receipt

For every candidate week, compare:

- The correct athlete/block/week and actual latest published session dates, roles, titles, relevant sets, distances, intensity and race status.
- Whether the first line answers *what is distinct this week* and the second answers *why it is arranged this way*.
- Whether the principle matches the phase and neighbouring weeks without asserting an unmeasured adaptation.
- Wordiness, repeated structure, duplicate stories, semicolon schedules, em dashes, internal language, conditional forks and character limits.
- Whether a session revision happened after the source snapshot. Re-read and reconcile any changed week rather than overwriting it from an older draft.

Publish only the reviewed story through the owning week record. Check `story_current=true` after writing and verify the actual authorized athlete feed. Database readback is not proof of an installed iPhone build; signed-in Plan/Dossier device QA remains separately required.

Related rules: [Athlete copy self-audit](../FORM_ATHLETE_COPY_SELF_AUDIT_20261026.md), [Athlete-facing quality standard](FORM_ATHLETE_RELEASE_QUALITY_STANDARD_2026-10-23.md), and FORM iOS plan-story doctrine.

## October 27 editorial release scope

The read-only inventory contained 300 non-fixture active week records across 22 athlete blocks. Three Anthony weeks were unissued, with no published sessions, and must remain blank. The 15-week Walk Fixture was excluded. The copy release targets the other 297 issued weeks and leaves prescriptions, phase revisions, races, completed history, athlete IDs and assignments untouched.

The private FORM iOS repository preserves a week-ID-keyed original-and-replacement snapshot in `docs/coaching/FORM_WEEK_STORY_EDITORIAL_RELEASE_20261027.json` for audit and rollback. Read it as an editorial record, not an executable coaching plan.
