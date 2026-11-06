# FORM Miami Fall 2026 · backend source contract v1

**Owner:** Brice · **Review state:** source-authored, migration **not deployed**, signed-in readback **not run**.

Owning issue: [#509](https://github.com/Breechay/speedandform/issues/509). Native original B Lanes direction is separate from the backend source; 44.7 and 44.8 are one release train, Staff/Coach Console is 44.9.

## What the migration owns

- `form_seasons`: public, explicitly published calendar identity and dates. No athlete data.
- `form_season_phases`: four display chapters, independent of an athlete's `training_block_phases`.
- `form_season_memberships`: explicit athlete-season affiliation, pending/active/paused/withdrawn state, verified `joined_on` and private visibility. This is **not** athlete login membership, Field RSVP/attendance, a race entry or a plan assignment.
- `form_season_member_context(p_season_key, p_athlete_id)`: `SECURITY INVOKER` authenticated read for an athlete's own season, or an explicitly targeted Coach Mirror read where existing `can_read_athlete` grants access.

The public calendar can be read even if the Collective roster is empty. The private read returns no row for unverified/pending or withdrawn membership, never a hardcoded pilot array. A guest can use the public season/phase read but cannot enumerate memberships.

## Season calendar and line semantics

| Chapter | Dates | Weeks |
| --- | --- | --- |
| Base | Oct 19–Nov 22, 2026 | 01–05 |
| Build | Nov 23–Dec 27, 2026 | 06–10 |
| Specific | Dec 28, 2026–Jan 24, 2027 | 11–14 |
| Transition | Jan 25–31, 2027 | 15 |

The season contains **15 calendar weeks**. The read model returns `calendar_week`, `total_weeks`, `first_eligible_week`, `phase_key`, `phase_title`, the verified join date and `calendar_state`. It uses the **America/New_York calendar date**, never a possibly stale `training_blocks.current_week`.

Past lanes mean **calendar elapsed**, not sessions completed. The UI must distinguish pre-join weeks from eligible elapsed weeks; it cannot show “done” simply because time passed. No filed-work count, distance or best mark is inferred or stored in this migration. Those values, if added later, must be sourced from canonical filing/measurement records, with missing distance kept unknown.

## Pilot identity and activation

Brice approved exactly these eleven **pilot candidates**: Brice, Tinius, Anthony, José, Hope, Saul, Turner, Patrick, Megan, Sohel and **Tyler Odwin**. Account access is not season enrollment.

**Do not seed active memberships from names, training-block dates or a broad roster query.** Ten have linked athlete-role access at audit. Tyler Odwin has a coaching record but still requires the correct athlete-role account link. Tyler Gattuso must never be substituted.

The migration intentionally creates **no membership rows**. Before a separate enrollment change:

1. Resolve each exact `athletes.id` from canonical records.
2. Verify an actual coach-authorized effective season joined date. The block-start dates in issue #509 are **candidates**, not proven season dates.
3. Resolve Tyler Odwin's actor identity; do not alter account access by name similarity.
4. Record `confirmed_by`, `confirmed_at`, `joined_on` and an explicit `status='active'`; otherwise keep the row absent or pending.
5. Run signed-in own-account, Apple-alias, Coach Mirror, unrelated-account and withdrawn/opt-out readbacks before marking activated.

The source does not change training assignments, race status, Strength entitlements, Collective photo opt-outs or personal performance targets. It does not make a private athlete record public.

## API / rollout acceptance

- **Catalog:** `GET form_seasons` and `form_season_phases` under published-calendar RLS (no membership fields).
- **Private:** `rpc/form_season_member_context` with `p_season_key='form-miami-fall-2026'`; ordinary athlete calls omit `p_athlete_id`. Coach Mirror supplies exact `p_athlete_id` but succeeds only through existing actor permission checks.
- **Empty state:** zero private rows means no verified active season membership, not a failed workout, blank calendar or zero progress.
- **Auth:** existing `is_athlete_member` / `can_read_athlete` preserve canonical Apple linking. No additional SECURITY DEFINER function or app service key.
- **Test:** run `node tests/form-season-source.cjs` for static calendar/source checks. For an isolated in-memory PostgreSQL RLS integration test, install the pinned optional tool with `npm install --no-save --no-package-lock @electric-sql/pglite@0.5.15` and run `node tests/form-season-rls.mjs`. The latter actually applies this migration and exercises anon, athlete A/B, coach, unauthorized, pending, withdrawal, write-denied and join-date cases using test-only actor helpers. It does **not** replace a Supabase environment's real Apple bridge, Auth JWT, PostgREST or security-advisor checks.
- **Deploy:** keep backend deployment, migration readback, native branch, App Store distribution and physical iPhone acceptance separately recorded. This PR is not authorization to deploy or bulk enroll.

**Next after backend verification:** original B Lanes night-track animation/native projection, not One Track, with reduced-motion and physical-device QA. Race dots are private to the athlete's season detail; season finale does not require a race.
