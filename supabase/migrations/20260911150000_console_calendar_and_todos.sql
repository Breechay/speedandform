-- Private coach operations: the week's live coaching commitments and a very small
-- per-athlete todo list. These are deliberately NOT athlete prescriptions.
-- A Google Calendar event can be mirrored here without turning calendar logistics
-- into training truth; FORM-authored standing work can sit beside it with explicit
-- provenance.

create table if not exists public.coach_week_items (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  week_starts_on date not null,
  scheduled_on date,
  time_local time,
  duration_minutes smallint check (duration_minutes is null or duration_minutes > 0),
  title text not null,
  kind text not null default 'coached' check (kind in ('coached','independent','support','other')),
  location text,
  status text not null default 'planned' check (status in ('planned','tentative','done','cancelled')),
  source text not null default 'manual' check (source in ('google','form','manual')),
  source_calendar_id text,
  source_event_id text,
  source_url text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_on is null or scheduled_on between week_starts_on and week_starts_on + 6)
);

create unique index if not exists coach_week_items_google_event_idx
  on public.coach_week_items (source_calendar_id, source_event_id)
  where source = 'google' and source_event_id is not null;
create index if not exists coach_week_items_athlete_week_idx
  on public.coach_week_items (athlete_id, week_starts_on, scheduled_on, time_local);

create table if not exists public.coach_todos (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  body text not null,
  due_on date,
  position smallint not null default 1 check (position > 0),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coach_todos_athlete_open_idx
  on public.coach_todos (athlete_id, completed_at, due_on, position);

alter table public.coach_week_items enable row level security;
alter table public.coach_todos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['coach_week_items','coach_todos'] loop
    execute format('drop policy if exists %I on public.%I', t || '_coach_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_coach_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_coach_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_coach_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_coach_member(athlete_id))', t || '_coach_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_coach_member(athlete_id))', t || '_coach_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_coach_member(athlete_id)) with check (public.is_coach_member(athlete_id))', t || '_coach_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_coach_member(athlete_id))', t || '_coach_delete', t);
  end loop;
end $$;

grant select, insert, update, delete on public.coach_week_items, public.coach_todos to authenticated;

-- Correct the two standing run-development relationships that were left vague
-- in the first roster migration. This changes logistics only; it does not invent
-- a continuous running baseline.
update public.athlete_baselines b
   set strength_schedule = 'Wednesday track · 6:30 AM. Daily 400 m easy practice between coached sessions.',
       updated_at = now()
  from public.athletes a
 where b.athlete_id = a.id and a.slug = 'valerie';

-- The current Natalie brief is the source for the private Console relationship:
-- Wednesday 7:45 plus the nearly-daily ten-minute practice. Historical athlete
-- prescriptions remain untouched.
insert into public.coach_week_items
  (athlete_id, week_starts_on, scheduled_on, time_local, duration_minutes, title, kind, location, status, source, note, created_by)
select a.id, v.week_start, v.on_date, v.at_time, v.minutes, v.title, v.kind, v.location, 'planned', 'form', v.note, admin.user_id
from (values
  ('natalie', date '2026-09-07', null::date, null::time, 10::smallint, '10 min easy · nearly daily', 'independent', null, 'Build habit and endurance. Place the runs around the actual week.'),
  ('natalie', date '2026-09-07', date '2026-09-09', time '07:45', 60::smallint, 'Track', 'coached', 'Flamingo Track, South Beach', null),
  ('natalie', date '2026-09-14', null::date, null::time, 10::smallint, '10 min easy · nearly daily', 'independent', null, 'Build habit and endurance. Place the runs around the actual week.'),
  ('natalie', date '2026-09-14', date '2026-09-16', time '07:45', 60::smallint, 'Track', 'coached', 'Flamingo Track, South Beach', null),
  ('valerie', date '2026-09-07', null::date, null::time, null::smallint, '400 m easy · daily practice', 'independent', null, 'Repeat the movement. Establish the running baseline before extending distance.'),
  ('valerie', date '2026-09-07', date '2026-09-09', time '06:30', 60::smallint, 'Track', 'coached', 'Flamingo Track, South Beach', null),
  ('valerie', date '2026-09-14', null::date, null::time, null::smallint, '400 m easy · daily practice', 'independent', null, 'Repeat the movement. Establish the running baseline before extending distance.'),
  ('valerie', date '2026-09-14', date '2026-09-16', time '06:30', 60::smallint, 'Track', 'coached', 'Flamingo Track, South Beach', null)
) v(slug,week_start,on_date,at_time,minutes,title,kind,location,note)
join public.athletes a on a.slug=v.slug
cross join lateral (select user_id from public.coaching_administrators where status='active' order by created_at limit 1) admin
where not exists (
  select 1 from public.coach_week_items x
  where x.athlete_id=a.id and x.week_starts_on=v.week_start
    and x.scheduled_on is not distinct from v.on_date and x.title=v.title and x.source='form'
);

-- Google Calendar mirror, normalized to the working coaching session rather than
-- commute/protection blocks. The source event id/url remain attached so the
-- Console can say where the appointment came from.
insert into public.coach_week_items
  (athlete_id, week_starts_on, scheduled_on, time_local, duration_minutes, title, kind, location, status, source,
   source_calendar_id, source_event_id, source_url, note, created_by)
select a.id, v.week_start, v.on_date, v.at_time, v.minutes, v.title, 'coached', v.location, 'planned', 'google',
       'briceikouebe@gmail.com', v.event_id, v.event_url, v.note, admin.user_id
from (values
  ('rod',   date '2026-09-07', date '2026-09-07', time '06:30', 60::smallint, 'Strength', 'Panorama Building, Brickell', 'r80uf2np5130c5l4sbavoqjq50_20260907T093000Z', 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MDdUMDkzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes commute; 6:30–7:30 is the working session.'),
  ('rod',   date '2026-09-07', date '2026-09-11', time '06:30', 60::smallint, 'Strength', 'Panorama Building, Brickell', 'r80uf2np5130c5l4sbavoqjq50_20260911T093000Z', 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MTFUMDkzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes commute; 6:30–7:30 is the working session.'),
  ('rod',   date '2026-09-07', date '2026-09-12', time '11:00', 60::smallint, 'Saturday training', 'Panorama Building, Brickell', 'o21q31a3qb0j7fng64br84pha4', 'https://www.google.com/calendar/event?eid=bzIxcTMxYTNxYjBqN2ZuZzY0YnI4NHBoYTQgYnJpY2Vpa291ZWJlQG0&ctz=America/New_York', null),
  ('rod',   date '2026-09-14', date '2026-09-14', time '06:30', 60::smallint, 'Strength', 'Panorama Building, Brickell', 'r80uf2np5130c5l4sbavoqjq50_20260914T093000Z', 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MTRUMDkzMDAwWiBicmljZWlr...','Calendar block includes commute; 6:30–7:30 is the working session.'),
  ('rod',   date '2026-09-14', date '2026-09-18', time '06:30', 60::smallint, 'Strength', 'Panorama Building, Brickell', 'r80uf2np5130c5l4sbavoqjq50_20260918T093000Z', 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MThUMDkzMDAwWiBicmljZWlr...','Calendar block includes commute; 6:30–7:30 is the working session.'),
  ('devin', date '2026-09-07', date '2026-09-08', time '06:30', 60::smallint, 'Strength + core', 'Aria by Margaret Pace Park', '6s5nj5u4p8hqnu4gbq3puju4oc_20260908T101500Z', 'https://www.google.com/calendar/event?eid=NnM1bmo1dTRwOGhxbnU0Z2JxM3B1anU0b2NfMjAyNjA5MDhUMTAxNTAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes the walk; 6:30–7:30 is the working session.'),
  ('devin', date '2026-09-07', date '2026-09-10', time '06:30', 60::smallint, 'Strength + core', 'Aria by Margaret Pace Park', '6s5nj5u4p8hqnu4gbq3puju4oc_20260910T101500Z', 'https://www.google.com/calendar/event?eid=NnM1bmo1dTRwOGhxbnU0Z2JxM3B1anU0b2NfMjAyNjA5MTBUMTAxNTAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes the walk; 6:30–7:30 is the working session.'),
  ('devin', date '2026-09-07', date '2026-09-11', time '13:30', 60::smallint, 'Strength', 'Aria by Margaret Pace Park', 'csmkq7o0buvan04uc5idm535ek', 'https://www.google.com/calendar/event?eid=Y3Nta3E3bzBidXZhbjA0dWM1aWRtNTM1ZWsgYnJpY2Vpa291ZWJlQG0&ctz=America/New_York', null),
  ('devin', date '2026-09-07', date '2026-09-12', time '09:00', 60::smallint, 'Saturday strength', 'Aria by Margaret Pace Park', 'mul7kfjjbm2q6t20njse50f60s', 'https://www.google.com/calendar/event?eid=bXVsN2tmampibTJxNnQyMG5qc2U1MGY2MHMgYnJpY2Vpa291ZWJlQG0&ctz=America/New_York', null),
  ('devin', date '2026-09-14', date '2026-09-15', time '06:30', 60::smallint, 'Strength + core', 'Aria by Margaret Pace Park', '6s5nj5u4p8hqnu4gbq3puju4oc_20260915T101500Z', 'https://www.google.com/calendar/event?eid=NnM1bmo1dTRwOGhxbnU0Z2JxM3B1anU0b2NfMjAyNjA5MTVUMTAxNTAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes the walk; 6:30–7:30 is the working session.'),
  ('devin', date '2026-09-14', date '2026-09-16', time '06:30', 60::smallint, 'Strength + core', 'Aria by Margaret Pace Park', '6s5nj5u4p8hqnu4gbq3puju4oc_20260916T101500Z', 'https://www.google.com/calendar/event?eid=NnM1bmo1dTRwOGhxbnU0Z2JxM3B1anU0b2NfMjAyNjA5MTZUMTAxNTAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes the walk; 6:30–7:30 is the working session.'),
  ('devin', date '2026-09-14', date '2026-09-17', time '06:30', 60::smallint, 'Strength + core', 'Aria by Margaret Pace Park', '6s5nj5u4p8hqnu4gbq3puju4oc_20260917T101500Z', 'https://www.google.com/calendar/event?eid=NnM1bmo1dTRwOGhxbnU0Z2JxM3B1anU0b2NfMjAyNjA5MTdUMTAxNTAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Calendar block includes the walk; 6:30–7:30 is the working session.'),
  ('natalie', date '2026-09-07', date '2026-09-13', time '18:30', 60::smallint, 'Sunday track', null, 'u8rhj2g52gm7rp7mb0vogcm9ps_20260913T223000Z', 'https://www.google.com/calendar/event?eid=dThyaGoyZzUyZ203cnA3bWIwdm9nY205cHNfMjAyNjA5MTNUMjIzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Present on Google Calendar; shown as calendar logistics, not as a replacement for the current Wednesday relationship.'),
  ('natalie', date '2026-09-14', date '2026-09-20', time '18:30', 60::smallint, 'Sunday track', null, 'u8rhj2g52gm7rp7mb0vogcm9ps_20260920T223000Z', 'https://www.google.com/calendar/event?eid=dThyaGoyZzUyZ203cnA3bWIwdm9nY205cHNfMjAyNjA5MjBUMjIzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York', 'Present on Google Calendar; shown as calendar logistics, not as a replacement for the current Wednesday relationship.')
) v(slug,week_start,on_date,at_time,minutes,title,location,event_id,event_url,note)
join public.athletes a on a.slug=v.slug
cross join lateral (select user_id from public.coaching_administrators where status='active' order by created_at limit 1) admin
on conflict (source_calendar_id, source_event_id) where source = 'google' and source_event_id is not null do nothing;

-- One lightweight open list per athlete. These are reminders for the coach, not
-- generated coaching decisions.
insert into public.coach_todos (athlete_id, body, due_on, position, created_by)
select a.id, v.body, v.due_on, v.position, admin.user_id
from (values
  ('rod', 'Friday read: silhouette, core control, load tolerance, adherence.', date '2026-09-11', 1::smallint),
  ('devin', 'Record the first body-fat reading.', date '2026-09-12', 1::smallint),
  ('natalie', 'Review the 10-minute-run routine before extending the morning runs.', date '2026-09-13', 1::smallint),
  ('valerie', 'Establish her continuous running baseline at the next track session.', date '2026-09-16', 1::smallint)
) v(slug,body,due_on,position)
join public.athletes a on a.slug=v.slug
cross join lateral (select user_id from public.coaching_administrators where status='active' order by created_at limit 1) admin
where not exists (select 1 from public.coach_todos t where t.athlete_id=a.id and t.body=v.body and t.completed_at is null);

comment on table public.coach_week_items is
  'Coach-private operational week mirror. Calendar logistics and standing practice only; never the athlete prescription.';
comment on table public.coach_todos is
  'Coach-private lightweight reminders attached to one athlete. Not evidence, observation, read, or decision.';
