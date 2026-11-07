# FORM Field v2 response contract

Status: review only. `collective_work_feed_v2` must not be deployed or activated until the independent signed-in authorization and privacy checks pass.

## RPC

`public.collective_work_feed_v2(p_limit integer default 12, p_before timestamptz default null, p_before_id uuid default null)`

The function is additive. It does not replace or alter `collective_work_feed`.

It is executable by `authenticated` only. A caller must also pass the existing roster gate, and every returned post must pass the existing publication permission and revocation checks.

## Row shape

The v2 row preserves the v1 fields and adds `rep_splits`:

| Field | PostgreSQL type | JSON shape |
| --- | --- | --- |
| `id` | `text` | post identifier |
| `first_name` | `text` | athlete first name |
| `session_title` | `text` | filed session title |
| `source_kind` | `text` | for example `run` or `strength` |
| `actual_distance` | `numeric` | nullable filed aggregate distance |
| `distance_unit` | `text` | nullable aggregate unit |
| `duration_seconds` | `integer` | nullable aggregate duration |
| `set_count` | `integer` | nullable Strength set count |
| `movement_summary` | `text[]` | existing compact result tokens |
| `filed_at` | `timestamptz` | filing timestamp, not performance date |
| `city` | `text` | always `null` in this projection |
| `portrait_url` | `text` | nullable, allowlisted local portrait path |
| `rep_splits` | `jsonb` | ordered measured work repetitions, or `[]` |

Each `rep_splits` element is:

```json
{
  "position": 1,
  "distanceMeters": 1000,
  "durationMs": 232400,
  "distanceSource": "filed"
}
```

- `position` is the canonical `session_pieces.position` and determines ordering.
- `distanceMeters` is an integer. It comes from signed correction evidence first, then the filed piece distance. Missing geometry is not invented.
- `durationMs` is an integer derived from exact duration when present.
- `distanceSource` is `signed_correction`, `filed`, or `missing`.
- The array contains every eligible work repetition, including 9, 10, 12 or more reps. The RPC does not truncate it.
- Non-run posts, easy/aggregate-only runs, Strava-timed completions, and posts without trustworthy rep evidence return `[]`.

The response must never include athlete notes, coach notes, symptoms, medical data, Strava URLs, private plans, or location.

## Intended native decoder

The activation change belongs in the existing native Field models, not a parallel store:

1. `FORM/Collective/FORMHomeRunsSurface.swift` — extend `FORMHomeFieldWork` with `repSplits` and a small `Decodable` rep value (`position`, `distanceMeters`, `durationMs`, `distanceSource`). This is the primary FORM Home / Field decoder.
2. `FORM/Collective/FORMAthleteTabShell.swift` — extend `FORMAthleteSharedWork` with the same typed rep value so the athlete tab and authorized Coach Mirror can share the response contract.
3. `FORM/Collective/FORMHomeRunsAdapter.swift` and `FORMAthleteTabShell.loadWork()` — switch from `collective_work_feed` to `collective_work_feed_v2` only after signed-in authorization, opt-out, roster, pagination, and sensitive-field checks pass.

Until that activation PR lands and passes device verification, native clients remain on `collective_work_feed` v1.

## Review and verification

- `node --test tests/form-speed/field_rep_projection_source.test.mjs`
- Apply the migration only to an isolated acceptance database, then run `tests/form-speed/field_rep_projection_contract_test.sql`.
- Independently verify rostered athlete, rostered coach, non-roster, anonymous, opt-out, revoked-post, and 9+ rep cases with signed-in identities.
- Do not deploy this migration to production from this PR.
