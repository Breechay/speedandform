# FORM public gathering rollover — operations and acceptance

As of November 5, 2026. Owners: Collective / Events (hosted event), Product & Design (Home/Week/Field presentation), Quality & Release (app integrity).

## Owning records

- Hosted public event: `public.collective_runs`; amendments/cancellations: append-only `public.collective_run_changes`.
- Recurrence and future venue: `public.collective_run_series` and append-only `public.collective_run_series_terms`.
- Home/Week event link: `public.form_miami_run_links`. This is **not** an athlete's running prescription.
- Thursday work must already exist in `public.form_miami_publications`; Saturday group distance is deliberately unspecified.
- Holds: private `form_rally_private.publication_holds`, keyed by lane/date. Receipts: `form_rally_private.rollover_receipts`.
- Scheduled job: `cron.job.jobname='form-public-gatherings-rollover'`, running `form_rally_private.rollover_once()` at `0 13,14 * * 4,6` in GMT, with the worker's 9:00–10:59 AM Eastern gate (DST-safe).

## Current defaults

| Lane | Venue | Meet | Start | First automatic target |
| --- | --- | --- | --- | --- |
| Thursday track | Flamingo Park Track, Miami Beach | 5:50 AM | 6:05 AM | Nov 19, after hosted Nov 12 (Nov 12 already published) |
| Saturday long | The Labs, 425 NE 22nd St, Miami | 5:50 AM | 6:00 AM | Nov 14, after hosted Nov 7 |

Existing November 7 Saturday publication and its historical time amendment are preserved; new Saturday terms are effective November 14. Do not rewrite this append-only record. Current holiday confirmation holds: Thursday Nov 26 and Saturday Nov 28.

## Safety contract

1. On the appropriate weekday and after the run time, verify the current published hosted source. A known held current date can bridge a 7–14-day gap via the last verified hosted event. Unknown missing sources stop the publisher.
2. Resolve next-date series and terms in America/New_York, including DST. Verify venue and a registered publisher. Future date held, missing canonical Thursday work, multiple public events, amendments, cancellations, changed venue, or mismatched existing records cause a recorded skip.
3. If an identical future event is already linked, no-op. If an exact existing unlinked event is verified, link once. Otherwise create a public FORM event and its lane/date link atomically.
4. Never alter athlete training sessions, distances, individual pace targets, RSVP/attendance, email queues, messaging, or notification tables as part of the rollover.
5. Race, holiday, travel, weather, host-availability, or venue conflicts must be entered as a private hold **before** the previous Thursday/Saturday rollover. The worker cannot discover an unreported real-world cancellation by itself.

## Hold and release — authorized operations only

```sql
-- Private admin transaction. Substitute the exact lane, date and reason.
insert into form_rally_private.publication_holds(lane,on_date,reason)
values ('saturday', date '2026-12-05', 'Host confirms the venue is unavailable')
on conflict (lane,on_date) do update
set reason=excluded.reason, released_at=null;

-- Release only after host and venue verification, before publication.
update form_rally_private.publication_holds
set released_at=now()
where lane='saturday' and on_date=date '2026-12-05'
  and released_at is null;
```

Never cancel an already public event by deleting or editing `collective_runs`. Use the canonical append-only `collective_run_changes` path and its audience notifications after explicit human confirmation; retroactive deletion is prohibited.

## Check after first scheduled job

```sql
select jobid,jobname,schedule,active,username
from cron.job where jobname='form-public-gatherings-rollover';

select checked_at,lane,source_date,next_date,outcome,run_id,note
from form_rally_private.rollover_receipts
order by checked_at desc limit 12;

select status,return_message,start_time,end_time
from cron.job_run_details
where jobid=(select jobid from cron.job
             where jobname='form-public-gatherings-rollover')
order by start_time desc limit 12;

select lane,on_date,run_id from public.form_miami_run_links
where on_date >= date '2026-11-05'
order by on_date,lane;
```

Success requires source verification, target public record, lane/date link, correct Eastern venue/time, no duplicate, and unchanged athlete email/notification counts. Check signed-in iPhone Home and the public web view separately; SQL state alone is not proof of a mobile refresh. If the cron outcome fails or is skipped unexpectedly, stop and investigate before manual re-publication. Do not run the publisher with simulated future dates outside an explicit `BEGIN; ... ROLLBACK;` dry run.

## Dry-run test record, November 5

- Simulated Sat Nov 7 9:05 ET: creates the Nov 14 public event, then a second invocation returns `already_linked`, both rolled back.
- Simulated Thu Nov 5: returns `already_linked` for Nov 12.
- Simulated Thu Nov 19 and Sat Nov 21: returns `next_date_on_hold` for Thanksgiving.
- Simulated Sat Nov 14 with no current published source: fails closed.
- Simulated Sat Nov 7 8:05 ET: returns `outside_publication_window`.
- Post-test counts: no new Saturday events or Saturday links, zero persisted dry-run receipts, 43 outbox rows with zero pending, and no new FORM notifications.

The first non-simulated job receipt has not yet occurred as of the migration. This document is an operations handoff, not a claim of end-to-end iPhone verification.
