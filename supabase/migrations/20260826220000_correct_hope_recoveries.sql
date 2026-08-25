-- Correction. Hope's recoveries were recorded as "3:00 each, run hard". That is
-- the duration plus a wrong reading. Her Garmin shows 10:01 · 12:12 · 12:12 —
-- she barely ran them, which is why she could hold 6:19, and which is exactly
-- what Brice meant by "recovered a bit too much".
--
-- Jose's 8:14 · 8:30 · 8:26 are his actual easy pace. Those are real floats.
-- So the two sessions differ by whether the recovery was run at all, and the
-- record said the opposite.
--
-- Also records what was asked for, so the page can show asked against done
-- instead of leaving the reader to know the target.

alter table public.planned_session_versions add column if not exists pace_low text;
alter table public.planned_session_versions add column if not exists pace_high text;
alter table public.planned_session_versions add column if not exists shape text;

update public.session_completions c
   set float_paces = '10:01 · 12:12 · 12:12'
  from public.athletes a
 where a.id = c.athlete_id and a.slug = 'hope';

-- Session versions are append-only, so the prescription is a new version.
insert into public.planned_session_versions
  (athlete_id, planned_session_id, version_number, title, shape,
   prescribed_distance, distance_unit, pace_low, pace_high, rpe_low, rpe_high)
select v.athlete_id, v.planned_session_id, v.version_number + 1,
       '4 × 1 mi at race pace',
       '20 min easy, then 4 × 1 mi with 3 min easy between. No stopping.',
       v.prescribed_distance, v.distance_unit, '6:25', '6:30', 7, 8
from public.planned_session_versions v
join public.athletes a on a.id = v.athlete_id
where a.slug in ('hope', 'jose')
  and v.version_number = (
    select max(v2.version_number) from public.planned_session_versions v2
    where v2.planned_session_id = v.planned_session_id
  );

update public.athlete_marks m
   set claim_note = 'Recoveries were too slow — that is rest, not a float. The miles came in under 6:25 because of it.'
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug = 'hope';
