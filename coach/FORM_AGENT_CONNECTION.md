# FORM Coach Agent · one athlete, one connected record

**Status (2026-11-10): staged source code, not a deployed or connected tool.**
Do not call any planned edits live until the migration, OAuth configuration,
Edge Function, front-end consent route, and signed-in read/write/consumer QA
have each been verified. See GitHub issue #563.

## Brice's operating rule

Brice runs the coaching program and expects authorized edits to happen quickly.
When he says to change a session, focus or athlete program, carry the work to
the canonical saved version and athlete-facing readback in the same work block
whenever access exists. Do not keep asking him to repeat permission already
given. Do not interpret a legitimate signed-in identity mismatch as a coaching
veto; fix the **coach connector/authorization path** and report any real block.
Never impersonate an athlete or owner, lift service-role secrets into tools,
or bypass membership checks by running privileged database writes.

Training content is **remote data**. A saved and published backend revision
should appear in a compatible athlete app on its next refresh without a new
App Store binary. If an app still shows old data, investigate cache, recipient,
IDs, feature flags, release compatibility and consumer contract. A native
code change remains a separately tested and deliberately batched release.

No routine production deploy for each tiny change: commit/push freely and
batch coherent releases (normally one routine production deploy per work
block). Urgent app-breaking fixes may be separately authorized. A request to
change a workout is approval to save its authorized **data**, not permission
to deploy an unrelated code build.

## The athlete graph

All identifiers flow from `athletes.id` under signed-in active coach
membership. Use `athletes.slug` to resolve one athlete, then verify `id` in
every write, query and readback. A roster name, chat sender, training icon or
duplicate first name is not an identity key.

| Surface | Source of truth / read | After a plan edit |
|---|---|---|
| Training Week + sessions | `training_weeks`, `planned_sessions`, latest `planned_session_versions` + typed `planned_session_components` | Read latest version, full Week, next seven days, bounds and recoveries. Never write a previous cancelled/ghost session. |
| Dossier/Stories | `coach_agent_athlete_brief`, `training_weeks.intent`, `.matters_because`, `athlete_focus_revisions` | Refresh the Week story and any effective focus whose actual prescription is now wrong. Keep original observations/history. |
| Halo weekly messages | `form_ghost_messages` + `form_ghost_recipients` **including archived, unopened and opened**; versioned coach revisions | Audit drafts, approved/sent copy, dates and recipient. With Brice-approved exact wording, update the **same** active weekly-focus message, record old text and verify ID. No duplicate campaign/message. Do not retroactively claim an opened note was never seen. |
| Direction drafts + coach notes | `athlete_direction_drafts`, `coach_messages` | Audit current draft and historical sent note. Preserve historical notes, add a correction only when needed; do not silently mutate an athlete-reported message. |
| Speed / filed results | `athlete_speed_record_benchmarks`, `athlete_speed_record_versions`, filed evidence, `mark_checkpoints` | Verify benchmark links reference the current published session version and real units; data in miles for athletes using miles. Filed ≠ prescribed; no invented splits. |
| Forge strength | `coach_preview_strength_days` dated mirror, then native Forge owning program if available | Review seven-day impact. A FORM mirror read does not certify Forge-native delivery. Preserve approved glute work unless evidence changes. |
| FORM tab evaluation | `athlete_evaluation_revisions`, `form_athlete_evaluation`, `evaluation_feed` | Confirm the Brice coach evaluation, its link to this athlete and all eleven axes/filing-earned steps. Filing adds progress to the coach-authored baseline; neither method silently cancels the other. No made-up points. |
| Athlete iPhone | signed-in athlete-facing Week, Speed, Dossier, Halo, FORM tab; Coach Mirror if supported | Verify actual visible state with athlete context. `sourceReadbackVerified` is not `nativeDeviceVerified`. |

## Connected agent flow (after launch)

1. Call `get_athlete_coaching_context` for canonical identity, dossier,
   Week, Halo, drafts/notes, evaluation points, Speed links and Forge mirror.
   Then `get_athlete_training_window` for additional dates if needed.
2. Analyze the complete proposed progression and next seven days, the
   athlete's last sessions and their expressed feedback. Exact pace, distance,
   date and unit are required. Preserve current restrictions and Brice's
   individual decisions over generic Method Bible examples.
3. `preview_session_revision` shows an exact typed version and fingerprint.
   Brice's instruction in context can be the authorization when he gave the
   exact prescription; ask once only if the remaining choice materially
   changes it.
4. `commit_session_revision` uses signed-in coach membership, expected latest
   version, SHA-256 preview and idempotent receipt. Recheck the version ID.
   If readback failed, **read first**, never create a duplicate by retry.
5. Recompose the Dossier Week story and focus revision against the new
   schedule. Preview and commit the Week copy once approved. Recheck it.
6. Audit *both* Halo draft/archived/sent copies and recipient state. Preview
   and commit the updated exact **existing** weekly-focus message; use the
   same message ID and a recorded previous/new copy. Read back the body.
   If a message was already opened, acknowledge prior exposure. Do not invent
   a second send to “fix” the first. Where a message is absent, use the normal
   approved publishing workflow; do not fabricate one from a revision tool.
7. Check Speed links, filed record visibility, Forge and FORM evaluation
   axes/points where affected. File only sourced results; never turn a
   prescription into a completed run or arbitrarily increase an evaluation.
8. Reread every changed owner, then check athlete-facing Week/Dossier/Halo,
   and actual released iPhone/Coach Mirror when available. Report factual
   states: previewed → saved → source-verified → consumer-verified →
   native-verified. Missing is **unchecked**, not “done.”

## Connector and security architecture

- Edge Function `supabase/functions/form-coach-agent/index.ts` exposes
  Streamable HTTP MCP at `/functions/v1/form-coach-agent`.
- OAuth 2.1 user flow uses Supabase Auth and `/coach/oauth/consent/`.
  `withSupabase({auth:'user'})` supplies a caller-scoped Supabase client.
  There is no service-role client or agent-selected `actor_id`.
- Every athlete lookup and each author RPC checks active coach membership.
  Plan edits call the **existing** `revise_session` writer through an atomic
  expected-version/idempotency receipt wrapper; no second prescription store.
- Dossier Week and Halo copy writers preserve previous text in private audit
  tables and check the exact previous source. They do not bypass review.
- Context read `coach_agent_athlete_linkage` includes the active and archived
  Halo copies, direction draft, sent notes, focus revisions, Speed version
  links and published evaluation source/display. Coach-only; never expose
  this full projection directly to an athlete token.

## Activation/QA checklist

- [ ] Migration reviewed and applied in a staged/test environment first.
- [ ] OAuth Auth signing keys support asymmetric JWT, server and dynamic client
      registration enabled, consent route hosted and login tested.
- [ ] Tool 401/metadata without token; actual Brice coach OAuth succeeds.
- [ ] Nonmember/athlete accounts cannot list or revise another athlete.
- [ ] Read/write Hope and a second athlete with overlapping first names to
      prove identity isolation; verify previous version unchanged.
- [ ] Repeat same commit once: one new session version and one receipt;
      stale preview rejected.
- [ ] Plan edit → Dossier Week story → focus revision → existing Halo copy,
      with sent/opened history retained and duplicate count unchanged.
- [ ] Check filed Speed mark link and FORM evaluation points as separate
      sourced effects, plus seven-day Forge impact.
- [ ] Test signed-in athlete native Week/Speed/Dossier/Halo/FORM tab, current
      release and cache refresh. Record actual IDs/timestamps privately.
- [ ] Install tool in ChatGPT and verify it appears to a new agent. Only then
      advertise the connection as live.

Do not put athlete names, health reports, personal receipts or authentication
secrets into this public repository. Keep case-specific work in the existing
private coach record and authorized source.
