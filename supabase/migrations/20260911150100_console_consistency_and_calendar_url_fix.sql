-- The prototype's Natalie / Valerie instrument was not another training score.
-- It was one coach-entered weekly fact: how many days the small practice happened.
-- Keep that operational fact private and separate from filed athlete evidence.
create table if not exists public.coach_week_tallies (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  week_starts_on date not null,
  metric text not null check (metric in ('running_days')),
  value smallint not null check (value between 0 and 7),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, week_starts_on, metric)
);

alter table public.coach_week_tallies enable row level security;
drop policy if exists coach_week_tallies_coach_read on public.coach_week_tallies;
drop policy if exists coach_week_tallies_coach_insert on public.coach_week_tallies;
drop policy if exists coach_week_tallies_coach_update on public.coach_week_tallies;
drop policy if exists coach_week_tallies_coach_delete on public.coach_week_tallies;
create policy coach_week_tallies_coach_read on public.coach_week_tallies
  for select to authenticated using (public.is_coach_member(athlete_id));
create policy coach_week_tallies_coach_insert on public.coach_week_tallies
  for insert to authenticated with check (public.is_coach_member(athlete_id));
create policy coach_week_tallies_coach_update on public.coach_week_tallies
  for update to authenticated using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
create policy coach_week_tallies_coach_delete on public.coach_week_tallies
  for delete to authenticated using (public.is_coach_member(athlete_id));
grant select, insert, update, delete on public.coach_week_tallies to authenticated;

-- Two source URLs in the first calendar seed were intentionally corrected here
-- rather than rewriting the earlier migration after it had been committed.
update public.coach_week_items
   set source_url = 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MTRUMDkzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York',
       updated_at = now()
 where source = 'google' and source_event_id = 'r80uf2np5130c5l4sbavoqjq50_20260914T093000Z';

update public.coach_week_items
   set source_url = 'https://www.google.com/calendar/event?eid=cjgwdWYybnA1MTMwYzVsNHNiYXZvcWpxNTBfMjAyNjA5MThUMDkzMDAwWiBicmljZWlrb3VlYmVAbQ&ctz=America/New_York',
       updated_at = now()
 where source = 'google' and source_event_id = 'r80uf2np5130c5l4sbavoqjq50_20260918T093000Z';

comment on table public.coach_week_tallies is
  'Coach-private weekly operational tally. Not an athlete completion, mark, read, or decision.';
