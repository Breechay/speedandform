# Speed & Form · Agent Orientation
## Read this after root AGENTS.md · Current operating map · 2026-10-02

This file exists to stop a capable agent from doing locally reasonable work that makes the whole Speed & Form system less coherent.

Root `AGENTS.md` contains detailed surface rules. This document answers a different question:

**What is this company now, where does truth live, and how should an agent decide what to touch?**

## 1. Company picture

Speed & Form is a small athletic practice/studio, not just a website or app.

Current center:
- individualized Run Development;
- living athlete studies;
- Track Thursday and shared long-run mornings;
- FORM as the execution/continuity product;
- Forge as strength execution;
- photography / Archive;
- plans and public tools;
- commercial services;
- a developing real-world network of athletes, coaches, gyms and future host spaces.

North-star product sentence:
**FORM makes training an occasion.**

Shared-long-run sentence:
**Different programs. One long-run morning.**

Physical-space concept:
**FORM House gives the occasion a home.**

Do not flatten these into generic fitness-software, run-club or funnel language.

## 2. Start-of-work protocol

Before meaningful work:

1. Read root `AGENTS.md`.
2. Read `docs/SPEED_AND_FORM_ECOSYSTEM_OPERATING_PLAN_2026-10.md` for current company objectives.
3. Read `docs/roadmap/FORM-ROADMAP.md` for current product/site state relevant to the task.
4. If the task touches operating priorities, read `docs/operations/CONSOLE-CONTRACT.md` and the private Console state.
5. If it touches connected FORM/Forge/Collective behavior, read `docs/FORM_CONNECTED_SURFACES.md`.
6. Read the smallest task-specific canonical brief/study/contract.
7. Check remote main and concurrent branches before changing code.
8. Establish whether the requested surface is source, projection, archive or historical material.
9. Do not revive an older decision merely because it appears in a file.

When documents disagree, prefer:
**explicit current owner instruction → verified current canonical data → newer dated decision in the owning source → older roadmap/history.**

Never resolve a contradiction by guessing.

## 3. Source-of-truth mesh

There is deliberately no single giant database.

| Domain | Owner |
|---|---|
| Athlete future prescription / block / coach decision | FORM Athlete System |
| Running execution evidence | canonical filing / Garmin / approved evidence source |
| Strength execution | Forge |
| Shared morning occurrence / RSVP / attendance | Collective |
| Reusable session / authored target | Vault / canonical session source |
| Photo editorial history | Archive |
| Public study | curated projection of approved evidence |
| Public discovery / offer explanation | speedandform.com |
| Timing / appointments | Calendar |
| Financial truth | Finances |
| Company attention / milestones | Operating Console + current roadmap |
| Durable architecture / decisions | owning repo docs |
| Daily instruction | Daily Operating Brief projection |

Rule:
**change the owning source → read it back → refresh dependent projections.**

Never hand-edit a projection to disagree with its source.

## 4. Operating hats

Use these labels when assigning/reviewing company work:
- COACH
- PRACTICE HOST
- PRODUCT DIRECTOR
- BUILDER / REVIEWER
- CREATIVE DIRECTOR
- COMMERCIAL LEAD
- OPERATOR
- STUDENT / ATHLETE

A task should usually have one primary hat. Do not pretend Brice must wear every hat every day.

## 5. Current October lanes

Public website/community passes 01/02 are in **operate/observe** mode. Do not reopen redesign absent a broken path, stale real-world fact, meaningful usage evidence or explicit owner request.

Primary build lane:
- Shared Mornings occurrence parity;
- host closeout;
- occurrence-keyed Archive;
- Roll → Nine;
- published package.

Additional October lanes:
- Vault target scoring: personal target precision/history, not generic leaderboard gamification;
- Adrian → Forge canonical sync;
- bounded Forge creative assets;
- athlete block horizon / renewal review;
- commercial evidence;
- Bridge Season reconciliation;
- FORM House partner pitch as a prepared opportunity asset, not an active lease commitment.

## 6. Athlete integrity

Never infer:
- a prescription from a group lane;
- attendance from RSVP;
- RSVP from recurring-roster membership;
- coaching relationship end from training-block end;
- a result from a scheduled ask;
- account identity from a similar name;
- a public endorsement from private praise;
- partnership status from using a venue.

For active coached athletes, review block horizons:
- within 21 days: ENDING SOON;
- within 7 days: THIS WEEK;
- no dated current block: UNKNOWN TERM.

These mean review next block / renewal / transition. They do not terminate service.

## 7. Shared-practice integrity

Run owns the gathering.
Session/Vault owns the workout/target.
Athlete Week owns private prescription.
Archive owns the photographic afterlife.

One occurrence can have multiple participation lanes. Lanes coordinate people; they do not rewrite private training.

The Easy Long Run lane is first-class. Do not let public group pressure silently make it faster.

## 8. Product restraint

Do build things Brice will use to coach, host, document, review or sell the actual practice.

Default wait:
- generic social feed;
- follows;
- global leaderboards;
- attendance/reliability scores;
- broad member DMs;
- member-created event marketplace;
- public athlete dossiers;
- automatic coaching interpretation presented as coach judgment;
- features added only because competitors have them.

Vault target scoring is an exception only in its approved form:
**authored target → attempt → raw precision → personal history → next attempt.**

## 9. Public/commercial restraint

Running remains the primary public identity.

Keep free tools genuinely useful.
One primary CTA per surface.
Use contextual coaching bridges, not identical funnel blocks.
No scarcity theater.
Do not hard-code volatile roster counts everywhere.
Do not publish private athlete/network context.

FORM House is currently an intentional shareable partner concept at `/form-house`, noindex. No site, partner, lease or capital commitment is implied.

## 10. Evidence and release

A commit is not a deployment.
A deployment is not a device check.
A scheduled task is not completed work.
Elapsed time is not evidence.
A screenshot/report is not automatically a canonical result.

After relevant work, record:
- what changed;
- owning source;
- evidence;
- blocker if any;
- tested commit;
- deployment state;
- physical-device state when relevant;
- next action.

Prefer one current checklist over many overlapping ones.

## 11. Staleness rule

Do not leave stale state silently active.

When you encounter stale material:
- if clearly superseded and safe to park, mark it superseded/cancelled in its owning operating source;
- if historical, label it historical rather than deleting useful evidence;
- if unresolved, state the conflict and next verification;
- never rewrite completed history to match current plans.

Daily Brief, Sunday Company Review and Monthly Company Reset are the recurring freshness mechanisms. Do not create duplicate reminders for work the Console/roadmap can surface.

## 12. Repositories

`Breechay/speedandform`
- public website;
- plans / Labs / studies;
- Operating Console web surface;
- Supabase migrations for this web/coach system;
- company operating docs.

`Breechay/FORM-iOS`
- native FORM implementation;
- Collective implementation/branches;
- FORM product direction;
- active Shared Mornings/Archive branch work;
- recurring-practice and network ledgers.

Do not assume `main` is the active implementation branch for every native feature. Establish branch truth before editing/releasing.

## 13. Important current documents

Company:
- `docs/SPEED_AND_FORM_ECOSYSTEM_OPERATING_PLAN_2026-10.md`
- `docs/operations/CONSOLE-CONTRACT.md`
- `docs/FORM_CONNECTED_SURFACES.md`
- `docs/partnerships/FORM_HOUSE_VISION_2026-10.md`

FORM-iOS active Shared Mornings branch:
- `docs/FORM_SHARED_MORNINGS_ARCHIVE_CONTRACT_V1.md`
- `docs/next/SATURDAY_LONG_RUN_PRACTICE_2026-10-03.md`
- `docs/next/RECURRING_PRACTICE_ROSTER.md`
- `docs/next/PRACTICE_NETWORK_ASSETS.md`
- `docs/next/VAULT_TARGET_SCORING_BRIEF.md`

Task-specific athlete study documents remain authoritative for their scoped study decisions.

## 14. Before stopping

Ask:
1. Did I improve the owning source or merely patch a projection?
2. Did I preserve athlete/history evidence?
3. Did I accidentally create a second source of truth?
4. Did I update the current roadmap/receipt if the state materially changed?
5. Did I distinguish code, deployment and device evidence?
6. Did I leave one clear next action?
7. Is anything I touched now stale somewhere else?

If #7 is yes, reconcile it before calling the pass complete or explicitly record the blocker.
