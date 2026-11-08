# FORM Speed Record v1 — isolated production activation (2026-11-08)

The Speed Record v1 tables and authenticated `athlete_speed_record_v1(uuid)` RPC were activated independently in Supabase project `pbgsjjegycacodiltbhn` via applied migration `20261108204337`. **Field v2 remains disabled**: `collective_work_feed_v2(uuid)` is absent, and no Field v2 source migration was deployed.

This branch records the exact migrations already applied to production. It is **not** a request to redeploy them. Reconcile Supabase migration history before merging or replaying them.

## Season-wide schedule and design acceptance (review addition)

The season rail is sourced from each athlete's **published, active training block**. It must not be limited to the 33 pilot benchmark identities. All sessions are individual and version-pinned. A pending result has no fabricated split, time, or pace. The iOS review branch draws only the first filed interval when a session is tapped, with the elapsed clock time inside the original elongated oval. The oval moves counterclockwise from the upper-right straight. The navigation is two rows with a fine underline.

The Nov 8 roster audit of the published plans identified **114 eligible key speed / goal-pace sessions across the 11 Speed-enabled athletes**:

| Athlete | Season speedwork sessions | Selection rule |
| --- | ---: | --- |
| Anthony | 12 | Thursday keys, Nov 5–Jan 21 |
| Brice | 12 | Thursday keys, Nov 5–Jan 21 |
| Megan | 10 | Thursday keys, Nov 5–Jan 21 |
| Patrick | 5 | Thursday keys, Nov 5–Dec 3 |
| Saul | 11 | Thursday keys, Nov 5–Jan 14 |
| Sohel | 7 | His Thursday speed progression, Nov 5–Dec 17 |
| Tinius | 12 | Thursday keys, Nov 5–Jan 21 |
| Turner | 11 | Thursday keys, Nov 5–Jan 21 |
| Elijah | 10 | His Tuesday intervals and tempo, Oct 6–Dec 8 |
| Hope | 11 | Orlando race-pace, faster sessions and the Oct 17 finish, Oct 6–Dec 1 |
| José | 13 | Orlando pace durability and the Nov 7/14 fast-finish long runs, Oct 6–Dec 1 |

Exclude easy-only sessions, races, and race-week events; include fast finishes where the actual title specifies meaningful faster work. This is a read-only projection, not a training-plan edit. In particular, Sohel's revised Nov 5 100 m prescription must never inherit his earlier filed 200 m result: completion evidence stays bound to its filed version.

**Release condition:** the 20261108230700 season migration is currently staged on this PR, not live. Earlier migrations in this PR overlap migrations already applied under different versions in Supabase history. Reconcile that history and verify authorized athlete/coach reads, denied unauthenticated and unauthorized reads, exact-version filing provenance, 11 roster counts, and Debug/Release plus signed-in device before considering a production release.

## Pilot curation

- Exactly 11 athletes with `speed_enabled`; 33 explicit benchmark identities, each matched to an active training block, a published session, and its newest immutable published version.
- 34 version links: one historical filed version for Megan in addition to the newest published revision of the same 1K/600/400 × 2 workout.
- No title inference at runtime, no synthetic splits or distance, no generic Vault import.
- Sohel’s Nov 5 filing still points to an older 4 × 200 m plan version, although the current Nov 5 plan was revised to 10 × 100 m. That ambiguous historical filing was intentionally **not** curated as either result. His verified Nov 12 6 × 200 m prescription is linked.
- Patrick and Turner legitimately have published benchmarks but no filed results for the chosen identities; the UI must show no invented metrics.

| Athlete | Date | Curated shape | Published session | Version | Evidence |
| --- | --- | --- | --- | --- | --- |
| anthony | 2026-11-03 | 3 × 1 mi steady | `e7b9eb2e-378b-41d8-aef2-e1a0ac446ffa` | `453ef545-2392-4f84-b270-070203069dd1` | Filed exact version |
| anthony | 2026-11-05 | 1K / 600 / 400 × 2 | `593abc28-3a7e-40a4-b75e-5448819d6c8b` | `fe68d66a-0ea4-4cd2-9162-313dd0b9f283` | Filed exact version |
| anthony | 2026-11-12 | 2 × 10 min | `94982d00-f13a-44be-971b-81108feac505` | `2ab0cfdc-16a2-4da2-99ed-19f9dfd4bae2` | Upcoming/published |
| anthony | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `321aec32-c43b-4ba3-98ba-eac236113cef` | `c346c984-76ad-4970-b23e-5462d1aa68f8` | Upcoming/published |
| brice | 2026-11-05 | 1K / 600 / 400 × 2 | `97a54f0e-ac87-496b-a16b-d4679035111d` | `d882318d-9122-42dd-813a-09a3a2c89353` | Filed exact version |
| brice | 2026-11-12 | 2 × 10 min | `b87d29d4-1ce5-4c48-abd8-fc19f999a953` | `b7e162da-c8ae-4d15-93c6-3ff608fb47c9` | Upcoming/published |
| brice | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `82bdefb0-f8c0-4e66-be01-c8d2a6ac8394` | `e7ec0cc5-e6d6-45a7-8f32-6dfb74e37eba` | Upcoming/published |
| elijah | 2026-11-03 | 3 × 1 mi | `ac90de7b-1d95-4967-b9cb-bc0758b51b50` | `582424d5-c23f-4297-9717-4217ac1e29b7` | Filed exact version |
| elijah | 2026-11-10 | 6 × 1 km | `29cc5adb-2394-4a46-a153-97405b076434` | `229a85ca-f2b5-4316-9bbc-64143a26403e` | Upcoming/published |
| elijah | 2026-11-17 | 30 min continuous tempo | `dde4f66d-4ff5-4e1a-8276-dd88acb74053` | `dbc0fb10-2bc4-4915-9512-5ac0376c6a22` | Upcoming/published |
| hope | 2026-11-04 | 4 × 800 m | `0355a0d6-60ac-4ec7-9216-69b1e142b7db` | `c7f99a66-7bdc-41e8-b970-19dae47dba65` | Filed exact version |
| hope | 2026-11-10 | 3 mi goal effort | `ce0af6f2-2051-40ad-828c-1871a3850fd8` | `2ccc2ee8-5469-4e62-9375-8803f828fc69` | Upcoming/published |
| hope | 2026-11-17 | 5 × 800 m | `87347451-fce2-4c21-8d2d-e6288449b686` | `1ad817b2-2837-437c-9cb1-e9763d36ccd5` | Upcoming/published |
| jose | 2026-11-07 | 14 mi / last 3 goal pace | `1423cf6f-0c99-46ef-a368-4d63f8024758` | `5af2da25-9279-45da-9eb3-1543074b09c7` | Filed exact version |
| jose | 2026-11-10 | 4 mi continuous / goal pace | `985ed293-a149-402a-b5e5-578532b3302f` | `3fc23cc4-b01a-467c-8665-cd4dbb1a1e4c` | Upcoming/published |
| jose | 2026-11-14 | 14 mi / last 5 goal pace | `dc565ad6-001e-4596-aa82-162f31fe780e` | `419f27ac-c70e-4c9d-8566-bc2cd3fe05f0` | Upcoming/published |
| jose | 2026-11-17 | 3 mi continuous / goal pace | `bb275f9a-7001-4816-b35b-ab47409f792d` | `b8a11d7e-8395-40d3-8be8-d74d0567ae73` | Upcoming/published |
| megan-bolan | 2026-11-05 | 1K / 600 / 400 × 2 | `e513f7a5-8c25-47cc-adc1-d95f3c811d44` | `ca4a3a35-a9ab-44c3-8f50-08a756ccd6cc` | Historical filed v: `e892a31a-e5db-469f-a7a8-4f5d2b7befef` |
| megan-bolan | 2026-11-12 | 2 × 10 min | `927f06ec-e328-4647-8b2e-978bb85d0054` | `931aa129-9d99-477d-9ff1-8202706b4d22` | Upcoming/published |
| megan-bolan | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `430bfc79-024d-4b20-9e30-305521060d33` | `598d0c00-6cf7-4756-a258-f3f1c3357655` | Upcoming/published |
| patrick-stowe | 2026-11-12 | 2 × 10 min | `bf6768e4-ff13-4990-84e1-6c8a7ec07247` | `2e8dc1c4-4e5c-4be1-bb1f-8270997931f9` | Upcoming/published |
| patrick-stowe | 2026-11-14 | 14 mi / MP segments | `0326d494-ebb5-48f1-8879-3bcb0f832095` | `4c18d628-59b8-4226-9a12-4603f21cfd44` | Upcoming/published |
| patrick-stowe | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `8694e60e-06d6-44df-abab-d1d0f39e12cd` | `a0ecd154-dbba-4bc9-8b36-da8ca11d0c09` | Upcoming/published |
| saul-licona | 2026-11-05 | 1K / 600 / 400 × 2 | `fb7129bc-e611-4193-a26d-70935da85510` | `e2d4df36-d254-4b93-8479-85156b6a320f` | Filed exact version |
| saul-licona | 2026-11-12 | 2 × 10 min | `ff88d9c2-44b5-4b91-83b0-15909e2ba8dc` | `92df2bfd-3fe4-4919-af8f-425e11cf650d` | Upcoming/published |
| saul-licona | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `815105a3-ba94-4a87-8288-7e5b5fd0d0b8` | `3811914c-b1b8-4092-9977-ed88c161664e` | Upcoming/published |
| sohel | 2026-11-12 | 6 × 200 m | `8fe9e6c2-3a81-4e97-844c-8b8a50648265` | `b10dcb21-9b53-4895-8b6a-70b42828d453` | Upcoming/published |
| sohel | 2026-11-19 | 6 × 1 min changes | `17ae2e24-c1ce-405e-beb1-902d37df38fd` | `9fb67ffa-407c-4c66-bbe7-b09fc21c9aa5` | Upcoming/published |
| tinius | 2026-11-05 | 1K / 600 / 400 × 2 | `c5dd02b4-7160-46d0-b2fe-f69a4947c7db` | `1f42bae9-5c50-4fa7-a8f6-feffa21ec385` | Filed exact version |
| tinius | 2026-11-12 | 2 × 10 min | `a567530d-a36d-4eaa-ba50-ec70addc8b6f` | `09904809-857a-458b-887c-9ea2c3841393` | Upcoming/published |
| tinius | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `783f0e8a-0f34-4315-aad5-695aabb4a186` | `d7ba0ef9-cc50-41e4-b20e-be17dafdd4d9` | Upcoming/published |
| turner-goetsch | 2026-11-12 | 2 × 10 min | `bbfd2806-078e-48ac-a713-5c6dc5b91e96` | `b8524420-ef87-4512-82d8-870a761cb2b9` | Upcoming/published |
| turner-goetsch | 2026-11-19 | 400 / 800 / 1200 / 800 / 400 | `409e4860-1840-46d6-b73a-23a6bba3fbd7` | `0c3035b3-3aae-404f-b3fb-bb89c64f0286` | Upcoming/published |

## Authenticated production readbacks

- Tinius athlete-own: 3 benchmark identities.
- Brice coach: 11 roster records, 33 identities and authored work segments; upcoming entries wherever a linked, latest published key session is still unfiled.
- Anthony account requesting Tinius: `null`; anonymous role: function execute denied.
- Megan filed ladder: one genuine attempt, 7:14/mi weighted work pace, two 1K split durations from actual filed pieces.
- No Field v2 migration or RPC activated.

These are database-role/claim readbacks, **not** signed-in physical-iPhone acceptance of native PR #289.

## Halo and attendance adjacent repairs

- `20261108204957` adds date-aware and filed-key-session visibility to the existing athlete and coach Halo inbox RPCs for `template_kind='weekly_focus'` only.
- `20261108205038` explicitly allows that new approved template kind; existing formats remain allowed. Ten exact Brice-approved weekly-focus bodies were delivered to 10 separate Speed pilot recipients, excluding Brice himself, under `form-2026-11-08-approved-week-focus-<slug>`. These are silent in-app messages; sent/readback evidence is in production.
- Tinius and Anthony own-inbox readbacks returned their exact approved text; Tinius Coach Mirror returned the same ID/body.
- November 12 and November 14 coach-confirmed attendee roster links were associated with nine verified existing public Collective people. The live member-only faces RPC now returns 7 of 8 Thursday portraits and 2 of 3 Saturday portraits. David and Sam still have initials; do not infer or expose a photo.

## Merge/release caution

Backend draft PR #540 contains an **older, duplicate** `20261107100000_speed_record_v1.sql` plus Field v2 schema and must **not be merged as-is**. Before merging any backend source branch, reconcile the Speed migration against the production-applied `20261108204337` version and keep the Field v2 migration out. Native PR #289 still requires signed-in iPhone Speed/Coach Mirror and Debug/Release device acceptance; it is not automatically approved for shipping by these database readbacks.
