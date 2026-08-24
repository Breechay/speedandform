# FORM Athlete System — continuation handoff

Date: 2026-08-24  
Repository: `/Users/breechay/Documents/speedandform`  
Branch: `codex/private-athlete-system`  
Base at start of implementation: `origin/main` / `da12023`  
State: active, unfinished working tree. **Do not reset, clean, stash, or discard it.**

## User intent and locked product decisions

Finish the complete first private coaching slice: secure identity and access, Natalie’s athlete-facing record and session filing, the Coach Desk, coach Direction/Read/Decision objects, private notes, and frozen consented share excerpts.

The binding visual system is **original Graphite**, not the earlier cream/serif mock and not the later Quiet/Bronze/Console/Studio variations. Use:

- near-black background and visibly separated graphite surfaces;
- high-contrast white primary text and readable secondary text;
- lime only for the current action;
- coral for attention and green for established/complete;
- sans serif for the working interface;
- explicit states and plain writing;
- first Coach Desk viewport answers who needs Brice, what they need, the evidence, and the next action.

Latest user feedback: sign-in pages should **not explain themselves**. The sentence “See who needs you, the evidence behind it, and the call that moves the record forward.” was removed from Coach sign-in. The analogous “Open your current week…” sentence was removed from athlete sign-in. Keep necessary error, pending-access, and recovery messages.

## Recovered six-step plan and exact progress

1. **Complete** — audit current site; lock Slice 1 architecture, schema, ownership, routes, and security model.
2. **Complete after interruption recovery** — version-controlled Supabase schema, seed content, RLS, storage rules, and tests. The corrected transactional pgTAP file now declares and runs 17 checks successfully.
3. **Implemented, still needs full final verification** — shared auth, Natalie record, filing, Coach Desk, and share card.
4. **Next** — local functional, responsive, accessibility, and security verification.
5. **Then** — deploy a Netlify preview, verify live magic-link redirects and real flows, then decide whether to merge. Never push directly to `main`; main is live.
6. **Owner-dependent** — link the intended real coach/athlete accounts and finish Apple provider setup when credentials are available. Email magic-link flow is the immediate fallback.

## What exists locally

Primary implementation:

- `athlete/index.html`, `athlete/athlete.js`
- `coach/index.html`, `coach/coach.js`
- `auth/record-callback/index.html`, `auth/record-callback/callback.js`
- `private/auth.js`, `private/data.js`, `private/record.js`, `private/graphite.css`, `private/supabase-client.js`
- `record/index.html`, `record/public.js`
- `_headers` and `netlify.toml` private-route/security changes
- `docs/ATHLETE_RECORD_SLICE1_ARCHITECTURE.md`

Database:

- `supabase/migrations/20260824183000_private_system_foundation.sql`
- `supabase/migrations/20260824183100_seed_slice1.sql`
- `supabase/migrations/20260824183200_completion_ownership.sql`
- `supabase/migrations/20260824183300_coach_access.sql`
- `supabase/migrations/20260824183400_verified_access_claims.sql`
- `supabase/tests/private_system_rls.sql`

Linked Supabase project: `FORM Athlete System`, ref `pbgsjjegycacodiltbhn`, North Virginia. It was intentionally created as a clean project; the paused legacy `Training Phases` project was not modified.

The migrations were pushed during the interrupted task, Graphite auth/coach/athlete screens were exercised against the linked project, and the Supabase redirect allowlist was corrected so the production callback URL preserves `return_to`. Confirm migration/config state read-only before any additional push.

## Available environment and related repositories

- The Supabase CLI is already authenticated on this Mac and this repo is linked to `pbgsjjegycacodiltbhn`. Reuse that authenticated session; never copy service-role keys into source, logs, chat, browser storage, or the handoff.
- Website GitHub remote: `https://github.com/Breechay/speedandform.git`.
- Related native repo: `/Users/breechay/FORM-iOS`, remote `git@github.com:Breechay/FORM-iOS.git`.
- FORM-iOS is currently on `cursor/the-plan-binding-93e5`, four commits ahead of its remote, with an existing modified generated fingerprint file. Treat that checkout as user-owned and dirty: inspect it when Gate A context is required, but do not reset, clean, stash, switch branches, edit, commit, or push it unless the user specifically asks for native implementation.
- The website Slice 1 can finish independently of FORM-iOS. Do not broaden the current deliverable into app sync merely because the native repo is available; use it to verify boundaries and contracts.

## Last interrupted action and recovery

The old task was interrupted immediately after changing `select plan(16)` to `select plan(17)` in `supabase/tests/private_system_rls.sql`. The continuation reran:

```sh
npx --yes supabase@latest db query --linked --file supabase/tests/private_system_rls.sql
```

It completed and returned `ok 17 - Creating an unverified auth row does not consume membership access`, with no pgTAP planning error.

During earlier authenticated QA, a temporary athlete identity briefly claimed Natalie’s seeded imported completion. Cleanup deleted that seed row; the exact row was restored from the checked-in seed migration and verified unclaimed. Before release, make one narrow check that no temporary `form-athlete-qa-*` auth user/invite/membership remains and that the seeded `coach_import` completion still has `filed_by IS NULL`. Do not print secrets or private row bodies.

## Immediate continuation checklist

1. Preserve all current changes. Start with `git status --short --branch`, `git diff --check`, and `git diff --stat`.
2. Confirm linked migration state and run `npx --yes supabase@latest db lint --linked --level warning`.
3. Rerun the 17-check SQL test if the schema or test changes.
4. Run `node --check` on every new JavaScript module.
5. Use a local static server and authenticated test identities to verify:
   - Coach and athlete sign-in screens have no explanatory subtitle.
   - callback accepts PKCE `code` and `token_hash` flows and rejects unsafe `return_to` values;
   - Coach sees only assigned athletes and the explicit decision queue;
   - athlete sees only her own record;
   - athlete can file and correct a session while immutable revision history is created;
   - coach cannot rewrite athlete actuals;
   - Direction, Read, Decision, private note, resolve-task, and frozen share-excerpt flows work;
   - revoked/unpublished excerpts are unavailable anonymously;
   - no browser console errors.
6. Check 390 px and 1440 px layouts, keyboard order, visible focus, dialogs, reduced motion, horizontal overflow, empty/error/pending states, and readable contrast. Stay within the Graphite authority; do not start a new design exploration.
7. Create a Netlify deploy preview from this branch and verify production-style headers, route rewrites, callback redirects, and authenticated flows there.
8. Ask the owner only for genuinely missing account actions: intended Natalie email, any other athlete access emails, and Apple OAuth credentials/provider configuration.
9. Exclude `docs/.DS_Store`. Commit the reviewed working tree, push `codex/private-athlete-system`, and open a draft PR. Do not merge without user approval.

## Claude Code start prompt

> Continue the unfinished FORM Athlete System Slice 1 in `/Users/breechay/Documents/speedandform` on branch `codex/private-athlete-system`. First read `docs/PRIVATE_ATHLETE_SYSTEM_HANDOFF_20260824.md`, `docs/ATHLETE_RECORD_SLICE1_ARCHITECTURE.md`, and the current git status. Do not reset, clean, stash, checkout another branch, or discard any existing changes. Original Graphite is binding. Keep the explanatory subtitles removed from both sign-in screens. Resume at final verification and preview deployment, make safe product/implementation calls autonomously, and stop only for real owner credentials or account-linking details. Never push directly to main.

## Known non-goals for this slice

- FORM iOS identity, historical upload, and app↔site delivery remain behind Gate A.
- No payments UI, messaging system, notifications, video analysis, or strength-coach login/share link.
- Do not create duplicate athlete, profile, planned-session, or completion sources of truth.
