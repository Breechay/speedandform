# Handoff — Claude session, 30 August

Read Codex's handoff first. This file covers only what **this** session changed, and
one mistake it made in a shared repository.

## Codex stopped mid-flight

Codex hit its usage limit while compiling the iOS callback flow and never ran its
own checkpoint. This session ran that checkpoint for it. Its uncommitted work built
clean and its 13 Coaching tests passed, so it is committed at `93f20731` on
`release/39.4-athlete-coaching` **attributed to Codex in the message** — the
coaching auth/callback flow, `FORMSessionUploadQueueStore` (upsert replaces a
receipt in place and preserves filed order), and the log-surface changes.

Its last stated position: **the Supabase Auth callback URL is not configured and the
real magic-link redirect is unverified.** That is where tomorrow starts.

## Repository state

| | |
|---|---|
| speedandform | `main` — see `git log`, latest commit is the pause migration |
| FORM-iOS | `release/39.4-athlete-coaching` @ `93f20731` — **39.4 (7)**, includes Codex's work |
| FORM-iOS | `form-coaching-integration` @ `c7d57fe2` |
| FORM-iOS | remote main `904b8753` — **deliberately untouched** |
| fallback archive | `~/Library/Developer/Xcode/Archives/FORM-39.4-6-privacy.xcarchive` — verified, **do not upload** |

## Live state, read at handoff

- **Coaching sync: PAUSED** — `coaching_sync_state.enabled = false`, reason
  "Paused until the 39.4 (7) end-to-end athlete walk passes."
- Active athlete memberships: **0**. No Hope/José/Marcus membership exists.
- Protected administrators: **1 active**, 1 row total (`coaching_administrators`).
- Disposable identities: **0**. No `auth.users` row on `example.invalid` survives.
- One unclaimed invite: `natalie.ramirez03@gmail.com`. It predates both sessions and
  is a real person, **not a fixture** — do not delete it.
- Disposable fixtures remaining: **0** (the athlete proof ran inside a rolled-back transaction).
- Field relay: still closed. The four `field_*` tables are the authenticated
  replacement schema, not the switch.

## Preserved, still dirty on purpose

`relay/api/field/*.js`, `relay/.gitignore`, `relay/api/_lib/`,
`Packages/FORMMovementKit/.../FORMFilm.swift` and the generated build fingerprint
were dirty before either session started and were left that way, as Codex's
checkpoint asked.

## A mistake to know about

Commit `5d9df6a` carries three migrations this session did **not** write:

- `20260830170000_account_deletion_requests.sql`
- `20260830180000_protected_coaching_administrators.sql`
- `20260830190000_coaching_access_identity.sql`

They are Codex's, applied to production, swept in by a `git add -A -- supabase`
while they were uncommitted. The files themselves are unmodified and git now matches
production, which is what Codex's checkpoint asked for — but the commit message
claims work it did not do. History was not rewritten: the branch is pushed and Codex
is working against it, and a rewrite would be worse than a wrong message.

A filename collision followed: this session's pause migration was first written as
`20260830170000_pause_until_the_walk_passes.sql`, the same version as Codex's
deletion migration. It was renamed to `20260830200000`. **Check for timestamp
collisions before applying anything tomorrow.**

## What this session shipped

**Server-side sync switch.** `coaching_sync_state` + append-only
`coaching_sync_events`. Both doors read it: `athlete_plan_feed` and
`record_session_from_form` are now thin wrappers, the originals renamed to `*_impl`
with execute **revoked from `authenticated`** — a switch an athlete can call around
is not a switch. Verified: 0 inner functions executable.

The device flag (`form_gate_a_enabled`) is **not** remotely controllable and was
wrongly described that way earlier. It defaults **on** in the release branch.

**Piece wire contract.** `piece_wire_keys()` names the accepted set; unknown keys are
refused rather than dropped; a rep with neither distance nor duration is refused;
`position` is accepted-and-ignored *by name*. Swift `Piece` is typed, with tests
proving it emits exactly those keys.

**Hope's plan.** SAT 2026-08-29, 12 mi strictly easy, RPE 5–6; Sunday rest. Version 1
still says 9 mi on a Sunday. `planned_session_moves` holds the dates, her reason
("To hit 45 for the week.") and Brice's decision ("Go for 12. Rest Sunday.") in
separate fields. No rung moved, no confidence written.

**Console.** Duplicate dose line suppressed when the title already states it.
Account controls (`#setPassword`, `#linkApple`) rendered — they were bound the whole
time and never displayed.

**Race finish parsing.** `FORMRaceFinishClock` reads a finish against its distance.
José's stored `1:32` is **quarantined, not rewritten**; Results shows
"Needs review · did you mean 1:32:00?" and `likelyIntendedFinishSecs` has no call
site that writes.

## Not done

- The end-to-end athlete walk through the actual app. Everything is proven at the
  RPC and unit layer; **nothing has run through the app against a live account.**
- Account deletion is still device-side only in FORM. Codex's
  `account_deletion_requests` migration is applied — this session did not wire the
  app to it.
- Archive for 39.4 (7).
- Netlify quota. Two clean checks today, one 503 reported between them.
- Privacy-policy and App Store disclosure text.

## Verified in code, for submission

- No service-role key or Supabase secret in shipped source (publishable key only).
- No RPE, symptom, token or magic-link value reaches a log.
- Account deletion clears coaching Keychain tokens and the plan cache — necessary,
  **not sufficient**; the server-side request path is unwired.

## Where tomorrow starts

1. Configure the Supabase Auth callback URL (Codex's unfinished step; the CLI does
   not expose it, so it needs the dashboard).
2. Finish and verify the real magic-link redirect into FORM.
3. Then the disposable athlete walk, app to server to Console.

Sync stays paused until that walk passes. Field stays closed. No real memberships.

## Test baseline

`2701 tests · 19 unique failing · same 19 as the pre-session baseline · zero new.`
