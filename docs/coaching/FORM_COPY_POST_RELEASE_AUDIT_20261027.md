# FORM · Post-release athlete writing audit

Reviewed: October 27, 2026 (Eastern)
Scope: current active FORM athlete blocks, their issued week stories and latest published session text. Walk Fixture excluded.

## Weekly story result

- 22 real active blocks, 300 week rows; 297 have published sessions.
- 297 of 297 week stories match the approved one-paragraph editorial set and pass `coach_audit_private.week_story_is_current`.
- Three Anthony weeks have no published sessions and remain unissued. Fifteen Walk Fixture weeks remain unchanged.
- 50 stories received a second specificity pass after the owner rejected vague wording such as "two kinds of speed".
- Final stories contain no em dashes, semicolon schedule lists, full-copy duplicates or stored newline breaks. Median 25 words, range 20 to 32. Each field remains within its 100/125-character database limit.
- The deployed `athlete_dossier` RPC now joins `intent` and `matters_because` with a space in both `weekly_focus.body` and backward-compatible `focus.body`. The native Dossier one-paragraph normalization is in FORM iOS PR #158, not yet a distributed app build.
- Re-read published sessions, schedules, phases and goal records after the copy write. No non-copy changes or mismatches were detected.

Tinius Week 2 now names the actual skills: Tuesday's descending 1600/800/400 m reps practise controlled pace changes, Thursday's 600s/200s practise quick relaxed steps, and the easy runs leave time to recover and adapt.

## Writing still requiring a separate review

This week-story release did **not** rewrite immutable session versions, strength prescriptions, race status, or phase tables.

1. **Session explanations:** 1,249 current published session entries use 258 distinct `intent` strings. Some are boilerplate, including 71 instances of "Aerobic base. There is no floor — slower is never wrong", 65 of "Monday aerobic practice, coached group anchor", and 50 of "Improve speed endurance and mechanics." These are candidates for a separate session-level editorial revision through the authenticated, append-only version path.
2. **Internal or conditional language:** 71 current session title/intent pairs match shared/cohort/anchor or similar internal phrasing. Four title/intent pairs include `if`, `await` or `pending` language. Review against current coach decisions before changing any actual session or silently removing safety information.
3. **Typography:** 83 session `intent` values contain prose em dashes. Other em dashes in strength `details` separate exercise prescriptions and are not automatically defects.
4. **Phase coverage:** Seven active blocks have no `training_block_phases` rows: Franklin, Iheb, Jacob, Jimmy, Kilton, Matt and Patrick. The Dossier must not invent a phase when none is authored. Versioned phase authoring needs coach review.
5. **Label semantics:** The coach Dossier quick-read calls the training-block goal "CURRENT FOCUS". PR #158 changes that one label to "TRAINING GOAL" to distinguish it from the week story.

## Release boundaries

- Database editorial copy and RPC presentation are applied and read back.
- Standing authoring and change-safeguard rule: [FORM weekly story editorial rule](FORM_WEEK_STORY_EDITORIAL_RULE_20261027.md); cross-app pointer also in `AGENTS.md`.
- Private versioned original and replacement records and the one-paragraph native implementation: `Breechay/FORM-iOS` PR #158.
- No sessions, distances, race records, athlete identity, Forge assignments or completed results were edited. No Apple distribution or signed-in device verification was performed.

## Next gate

Before any session-level copy sweep, reconcile latest structured prescriptions and any external coach/Forge workload, publish changes only as append-only session versions, and re-review their linked weekly stories. Then run the canonical athlete release audit and test Plan/Dossier on a signed-in small and standard iPhone. Do not conflate database freshness with device display verification.
