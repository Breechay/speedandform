# FORM 44.6 · Speed release contract

**Owner override · Brice · November 4, 2026**

The approved design is `FORM_Speed_Tab_44_6.zip` / `SPEED_TAB_44_6_HANDOFF.md`.
This document supersedes the *per-athlete rollout flag* in `START_HERE_CHAT.md`.
It does not alter the approved screens, spacing, geometry, words or motion.

## Release

- **Speed is the standard fourth tab for every athlete in 44.6.** The bar is
  FORM · Week · Races · Speed. No FORM Core allowlist, tier, eligibility or
  coach-only activation. A new athlete with no plan or results sees empty
  lanes, the track, the distance strip, relevant Next and the Vault.
- This is a release decision, **not permission to expose a half-built tab**.
  44.6 is not live until the completed native release passes device QA and
  publication. No unfinished state is pushed to current athletes.
- Coach Mirror reads the exact same `athlete_speed_feed` as the athlete.
  Read-only means no Start, File Times, timer or Setup writes.
- The tab never names FORM Core. It is an internal participation cohort, not
  a leaderboard or access tier.

## Data boundary

- Only confirmed, filed `session_pieces` and signed corrections count as
  **Held** and **Best**. A reported GPS/Strava best or the separate
  `athlete_track_stats` coaching baseline from open PR #460 is **not** a Speed
  mark. The latter remains private programming reference, not a second source
  for this tab.
- The nearest-km/mile key must honor source units. An authored 1600m effort
  is not a mile mark. Never infer an exact 100/200m from GPS best efforts.
- Version Vault sessions; attempts remain the original completions; protect
  cross-athlete times with RLS. `Cleared` exposes public faces only.
- Published athlete Week prescriptions must not be revised or re-linked by
  matching a title. Link an exact, authored version with coach provenance.
- A missing rep distance is a known 44.5 gap: native timed Speed receipts and
  some coach pieces lack it. Resolve before 44.6 release. Historical repairs
  append and retain original notes.
- Draft/proposed Thursdays in the October 30 progression are not themselves
  published athlete prescriptions or authorized Vault targets. Populate the
  Vault after reading their current signed version. Never seed guessed bands.

## Implementation handoff

1. Land and verify the additive server foundation in this PR; **do not apply
   SQL directly to production from a review branch**.
2. Reconcile 44.5's exact shipped iOS SHA, PR #55's unmerged local Vault
   scorer, the open coach baseline PR #460 and distance inheritance.
3. Build Coach, pure geometry/marks tests, native Speed shell, Vault/result,
   preview, timer in the approved small PR order. Keep the native Speed tab
   off current *shipped versions* until the finished 44.6 binary goes out;
   do **not** add a per-athlete rollout gate in that binary.
4. Verify the seven `golden/held_best.json` cases and all approved 15 screens,
   Coach Mirror read-only, zero-evidence athlete, offline and VoiceOver.

**FORM copy rule:** Show more. Say less. No new explanatory text, tips,
leaderboards, badges or copy outside the handoff's approved strings.
