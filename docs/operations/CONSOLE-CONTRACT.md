# Operating Console: one place to get oriented

September 30, 2026. Entry: `/coach/ops/`. The athlete workspace remains `/coach/labs/`.

## What the console owns

The console owns operating tasks, priority selections, waiting/review dates and source-check receipts. It does not become a second athlete plan, bank ledger or calendar. The first screen has at most four actionable owner tasks. Agent work is a separate queue, not an implied background job. Waiting items never fill the top four.

`operating_items`, `operating_sources` and `operating_changes` are private, owner-scoped records in the existing FORM Athlete System. There are no private seeds in this repository. The web shell uses the existing coach session, with an additional active-administrator owner check. A second personal/native account does not acquire access merely because it belongs to the same person; use the existing authorized web coach account or an explicit account-linking process.

## Shared reader

Browser: `supabase.rpc('operating_console_read', {})` through `/private/supabase-client.js`.

Authorized assistant/server: discover the Supabase connector, select the FORM Athlete System project, resolve the current user's existing active coaching-administrator identity, then call:

```sql
select public.operating_console_read(:authorized_owner_id, :local_date);
```

The date is America/New_York. Never guess another user's identity, enumerate private accounts to gain access, or send service-role credentials to a browser. A connector's authorized database session can supply the verified owner; browser callers cannot supply someone else's ID to bypass access checks.

The response includes `schema_version`, `read_at`, `today`, owned items, up to four priorities, source freshness, current active athletes, published and externally delivered decisions, open coaching tasks/to-dos, appointment projections and the latest change receipts. Missing/failed reads are errors, not an empty life or proof no plan exists.

## Who owns each kind of truth

| Kind of fact | Owning source | Console/brief behavior |
|---|---|---|
| Coached athlete prescription | Existing FORM assignment and effective coach decision | Read the decision, including `delivered_externally`. A newer restriction overrides old templates. Do not infer native delivery from a saved row. |
| Reported or measured athlete evidence | Existing observations/completions and source evidence | Preserve source, date and the version performed. A calendar slot passing is not completion. |
| Personal training prescription | Current active Rebuilt Athlete Study week | Read the active index and authored page. Old metadata or a frozen automation recipe does not override the newest explicit decision. |
| Confirmed appointment time | Google Calendar | Check real availability before booking. Record the event ID and read-back receipt. |
| Agreed daypart without a clock time | Current coach decision and `coach_week_items` | `time_local = NULL`, `status = tentative`, named daypart in title/note. Never turn availability into a booked start. |
| Money amount and settlement | Finances provider data | Keep posted/pending and unknown balance age explicit. No family support as business revenue. |
| User-supplied money attribution | Finances financial memories | Preserve provider sender, amounts and status. Verify the corrected projection after saving. |
| Implementation and publication | Repository + actual deploy/build receipt | A branch, local build or migration is not a published website or shipped native build. |
| Roadmap milestones | Existing canonical project roadmap | Operating tasks are next actions, not a replacement milestone database. |
| Email replies | Connected Gmail thread | A previous brief saying “no reply” is not a current inbox read. |
| Day priorities and open loops | `operating_items` | Shared by this page and the scheduled brief. Keep owner selection and completed work. |

## The read / change / verify loop

1. Read this contract and the shared workspace first. Inspect the source registry and unresolved conflicts.
2. Read the actual owning source when a task depends on it. Do not substitute a previous brief, remembered schedule or repository snapshot for a current source.
3. Make only the authorized change in the owning record. For a scheduling correction, preserve authored session content. For a coaching change, preserve completed evidence and use the existing assignment/decision system.
4. Read back the destination. Record its ID, source version/commit, observed time and actual result. A saved note is not a synchronization receipt.
5. Refresh the private console projection and the brief from the same records. Mark partial failures explicitly. Never label a queued correction done because it was discussed.

## Daily brief write-back

Each authorized daily run reads current Calendar, FORM, Study and relevant Finances/inbox/wearable evidence, then refreshes the existing private source snapshots. Do not create a parallel brief-shaped database. Use stable `item_key` and `source_key` values and preserve ownership.

Update source checks only for sources actually read. `observed_at` means when the source was checked; `source_as_of` means the source's own data cutoff. A check today does not establish that a balance is today's balance. Use `expires_at` to signal another check is needed. Only canonical FORM rows are live in every browser refresh; the browser's Refresh button does not fetch Gmail, banking, Calendar or GitHub.

Choose at most four ready owner actions using real deadlines, leverage and existing owner selections. Save their `focus_on` selections before producing the brief so the page and message agree. Keep agent repair work and blocked items separate. Do not automatically repeat an old workout because its completion is unknown; ask for the missing outcome or keep that uncertainty visible. Do not reopen finished tasks from an older brief.

Use optimistic updates with the previously read `revision`; a conflict requires a fresh read and reconciliation. Direct connector writes should apply the same comparison. Read back saves. Triggers append revision history and prevent owner/identity changes. Do not delete history to make the workspace appear clean.

## Writing records

Operational tasks use `kind=task`, an area, concrete title/finish condition, actor (`brice`, `agent`, `other`), state (`queued`, `active`, `waiting`, `done`, `cancelled`), priority, optional real due date, focus date, waiting-on and review date. `cancelled` is displayed as Parked. Waiting requires a named missing input. Context and receipt records use their corresponding kind; no financial or health data is embedded in static assets.

Existing coaching gates stay in `coach_tasks`; do not make an operating duplicate just to show them. Existing meetings project through `coach_week_items` with the source event ID. Before inserting, check for the same source ID. Never claim all calendars synchronized because several rows were imported.

The user can capture, edit, move between areas/actors, select a focus date, mark done, or park an operating item. A Done click changes only that operating item. It does not pay a bill, send a message, publish a workout, clear a medical restriction or cancel an appointment.

## Cross-repository rule

The site repository owns this shell and contract. The FORM Athlete System owns canonical coaching records. Resolve the current native integration handoff before using native main as the newest truth. Increments and other personal tools may consume this workspace later; repository access alone is not an integration. Do not duplicate project milestones or copy private operating facts into a public repository.

## Release and limits

New public shell only; existing athlete dossiers and legacy authoring routes stay intact. The two September 30 operating migrations install private storage, audit/version checks and the shared reader, then a narrowly scoped owner-check wrapper. No app build is required. An initial permission test caught an existing helper's restricted execute grant; the follow-up migration fixed the wrapper without exposing the helper to arbitrary browser calls.

Run `node --test tests/operating-console.test.mjs` and syntax checks. See `CONSOLE-ACCEPTANCE-20260930.md` for actual checks and open acceptance items. Use one batched site release. Do not buy credits or silently change deployment settings. A production receipt and browser/physical-device validation are separate claims.


## Runway projection · October 2

The console now includes a **Runway** view so company work can be scanned like a training plan instead of only as a task list.

Runway rules:
- operating items remain the project/milestone source;
- active athlete blocks remain FORM Athlete System truth;
- the view projects 12 horizontally scrollable weeks;
- dated operating items appear in the week containing due/review/focus date;
- undated work stays in a separate backlog;
- athlete horizons come live from active training blocks;
- THIS WEEK means block end within 7 days; ENDING SOON within 21 days; missing active block dates remain explicit;
- a block end is a review trigger, not automatic coaching-service termination;
- the UI may show hats as thinking-mode vocabulary, but hats do not create another ownership database.

The browser does not invent missing dates to make the runway look full. Open capacity is allowed.
