-- Reps and floats become rows.
--
-- "6:31 · 6:28 · 6:30 · 6:27" is a rendering, not a record. A string cannot answer
-- "did every mile sit inside 6:30 to 6:45", and that question gates three things:
-- the site can only colour a whole line rather than mark the rep that missed; the
-- app's race-pace progression is parked on exactly this evidence; and no verdict
-- about a session can be computed rather than typed by hand.
--
-- Surface and conditions come with it. They are the decisive evidence for Marcus's
-- claim and cannot be inferred from a pace.

create table if not exists public.session_pieces (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  position smallint not null check (position > 0),
  kind text not null check (kind in ('warmup', 'rep', 'float', 'cooldown')),
  distance numeric(6,2),
  distance_unit text check (distance_unit in ('mi', 'km', 'm')),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  -- Pace in seconds per mile. Stored rather than derived so a piece measured by the
  -- watch is not silently recomputed from a rounded distance.
  pace_seconds integer check (pace_seconds is null or pace_seconds > 0),
  created_at timestamptz not null default now(),
  unique (completion_id, position)
);

alter table public.session_completions add column if not exists surface text
  check (surface is null or surface in ('outdoor', 'treadmill', 'track'));
alter table public.session_completions add column if not exists conditions text;

comment on table public.session_pieces is
  'One row per warmup, rep, float or cooldown. The formatted split line is a rendering of these.';
comment on column public.session_completions.surface is
  'Decisive for a claim about outdoor transfer. A treadmill completion cannot answer one.';

alter table public.session_pieces enable row level security;

create policy pieces_member_read on public.session_pieces for select to authenticated
  using (public.is_athlete_member(athlete_id) or public.is_coach_member(athlete_id));
create policy pieces_coach_write on public.session_pieces for all to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));

-- The two sessions of 2026-08-25, as pieces. Paces are seconds per mile.
do $$
declare c_id uuid; a_slug text;
begin
  for c_id, a_slug in
    select c.id, a.slug from public.session_completions c
    join public.athletes a on a.id = c.athlete_id
    where a.slug in ('hope', 'jose')
  loop
    insert into public.session_pieces
      (athlete_id, completion_id, position, kind, distance, distance_unit, duration_seconds, pace_seconds)
    select (select athlete_id from public.session_completions where id = c_id),
           c_id, p.pos, p.kind, p.dist, 'mi', p.secs, p.pace
    from (
      select * from (values
        (1, 'warmup', 2.37, 1200, 507),
        (2, 'rep',    1.00,  389, 389), (3, 'float', 0.30, 180, 601),
        (4, 'rep',    1.00,  380, 380), (5, 'float', 0.25, 180, 732),
        (6, 'rep',    1.00,  382, 382), (7, 'float', 0.25, 180, 732),
        (8, 'rep',    1.00,  379, 379),
        (9, 'cooldown', 2.20, 1203, 548)
      ) as h(pos, kind, dist, secs, pace) where a_slug = 'hope'
      union all
      select * from (values
        (1, 'warmup', 2.49, 1200, 482),
        (2, 'rep',    1.00,  391, 391), (3, 'float', 0.36, 180, 494),
        (4, 'rep',    1.00,  388, 388), (5, 'float', 0.35, 180, 510),
        (6, 'rep',    1.00,  390, 390), (7, 'float', 0.36, 180, 506),
        (8, 'rep',    1.00,  387, 387),
        (9, 'cooldown', 1.77, 901, 509)
      ) as j(pos, kind, dist, secs, pace) where a_slug = 'jose'
    ) as p(pos, kind, dist, secs, pace);
  end loop;
end $$;

update public.session_completions c
   set surface = 'track'
  from public.athletes a
 where a.id = c.athlete_id and a.slug in ('hope', 'jose');
