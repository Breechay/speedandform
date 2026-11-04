-- Track repeat performance is private training evidence, not a leaderboard.
-- A current baseline is the rep-weighted mean of the last three distinct
-- sessions at a distance. Best is the fastest known split or reported mark.
-- All times in this schema are seconds for the stated rep distance.

create table public.athlete_track_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id),
  distance_m integer not null check (distance_m between 100 and 10000),
  observed_on date not null,
  source_kind text not null check (source_kind in ('filed','coach_import','athlete_report')),
  source_key text,
  source_note text,
  planned_session_id uuid references public.planned_sessions(id),
  completion_id uuid references public.session_completions(id),
  rep_count integer not null check (rep_count between 1 and 100),
  average_seconds numeric(9,2) not null check (average_seconds > 0),
  best_rep_seconds numeric(9,2) not null check (best_rep_seconds > 0),
  split_seconds jsonb not null default '[]'::jsonb check (jsonb_typeof(split_seconds)='array'),
  recorded_by uuid,
  created_at timestamptz not null default now(),
  constraint athlete_track_sessions_filed_source check
    ((source_kind='filed') = (completion_id is not null)),
  constraint athlete_track_sessions_best_not_slower_than_average check
    (best_rep_seconds <= average_seconds)
);
create unique index athlete_track_sessions_completion_distance_idx
  on public.athlete_track_sessions(completion_id,distance_m)
  where completion_id is not null;
create unique index athlete_track_sessions_source_idx
  on public.athlete_track_sessions(athlete_id,distance_m,source_key)
  where source_key is not null;
create index athlete_track_sessions_recent_idx
  on public.athlete_track_sessions(athlete_id,distance_m,observed_on desc,created_at desc);

create table public.athlete_track_stats (
  athlete_id uuid not null references public.athletes(id),
  distance_m integer not null check (distance_m between 100 and 10000),
  average_rep_seconds numeric(9,2),
  average_rep_count integer not null default 0,
  average_session_count integer not null default 0,
  average_as_of date,
  best_seconds numeric(9,2),
  best_source text,
  best_as_of date,
  updated_at timestamptz not null default now(),
  primary key(athlete_id,distance_m)
);

alter table public.athlete_track_sessions enable row level security;
alter table public.athlete_track_stats enable row level security;
create policy track_sessions_own_read on public.athlete_track_sessions
  for select to authenticated using
    (public.is_athlete_member(athlete_id) or public.is_coach_member(athlete_id));
create policy track_sessions_manual_insert on public.athlete_track_sessions
  for insert to authenticated with check
    (source_kind <> 'filed' and recorded_by=auth.uid()
     and (public.is_athlete_member(athlete_id) or public.is_coach_member(athlete_id)));
create policy track_stats_own_read on public.athlete_track_stats
  for select to authenticated using
    (public.is_athlete_member(athlete_id) or public.is_coach_member(athlete_id));
revoke all on public.athlete_track_sessions from anon,authenticated;
revoke all on public.athlete_track_stats from anon,authenticated;
grant select,insert on public.athlete_track_sessions to authenticated;
grant select on public.athlete_track_stats to authenticated;

create or replace function coach_performance_private.refresh_track_stats(
  p_athlete_id uuid,p_distance_m integer
) returns void language plpgsql security definer
set search_path='' as $$
declare r record;
begin
  with deduped as (
    select t.*,row_number() over (
      partition by coalesce(t.planned_session_id,t.id)
      order by case when t.source_kind='filed' then 0 else 1 end,t.created_at desc
    ) as one_per_session
    from public.athlete_track_sessions t
    where t.athlete_id=p_athlete_id and t.distance_m=p_distance_m
  ), recent as (
    select d.*,row_number() over(order by d.observed_on desc,d.created_at desc) as recency
    from deduped d where d.one_per_session=1
  ), mean_data as (
    select round(sum(average_seconds*rep_count)/nullif(sum(rep_count),0),2) average_seconds,
           coalesce(sum(rep_count),0)::integer reps,
           count(*)::integer sessions,max(observed_on) last_date
    from recent where recency<=3
  ), best_data as (
    select b.seconds,b.source,b.at_date from (
      select t.best_rep_seconds seconds,t.source_kind source,t.observed_on at_date
      from public.athlete_track_sessions t
      where t.athlete_id=p_athlete_id and t.distance_m=p_distance_m
      union all
      select m.value,m.source,m.measured_at from public.athlete_measurements m
      where m.athlete_id=p_athlete_id and m.value>0
        and m.measurement_type=case p_distance_m
          when 400 then 'reported_best_400m_seconds'
          when 600 then 'reported_best_600m_seconds'
          when 800 then 'reported_best_800m_seconds'
          when 1000 then 'reported_best_1k_seconds'
          when 1600 then 'reported_best_1600m_seconds'
          else 'reported_best_'||p_distance_m::text||'m_seconds' end
    ) b order by b.seconds,b.at_date desc limit 1
  )
  select mean_data.average_seconds,mean_data.reps,mean_data.sessions,mean_data.last_date,
         best_data.seconds best_seconds,best_data.source best_source,best_data.at_date best_date
    into r from mean_data left join best_data on true;

  insert into public.athlete_track_stats as stats
    (athlete_id,distance_m,average_rep_seconds,average_rep_count,average_session_count,
     average_as_of,best_seconds,best_source,best_as_of,updated_at)
  values (p_athlete_id,p_distance_m,r.average_seconds,r.reps,r.sessions,
          r.last_date,r.best_seconds,r.best_source,r.best_date,now())
  on conflict(athlete_id,distance_m) do update set
    average_rep_seconds=excluded.average_rep_seconds,
    average_rep_count=excluded.average_rep_count,
    average_session_count=excluded.average_session_count,
    average_as_of=excluded.average_as_of,
    best_seconds=excluded.best_seconds,best_source=excluded.best_source,
    best_as_of=excluded.best_as_of,updated_at=now();
end $$;

create or replace function coach_performance_private.refresh_track_from_completion(
  p_completion_id uuid
) returns void language plpgsql security definer
set search_path='' as $$
declare completion_meta record;
begin
  select sc.athlete_id,sc.planned_session_id,sc.status,
         coalesce(ps.scheduled_on,(sc.filed_at at time zone 'America/New_York')::date) observed_on
    into completion_meta from public.session_completions sc
    left join public.planned_sessions ps on ps.id=sc.planned_session_id
    where sc.id=p_completion_id;
  if not found then return; end if;

  delete from public.athlete_track_sessions t
   where t.completion_id=p_completion_id and t.source_kind='filed';
  if completion_meta.status in ('completed','partial','changed') then
    with candidates as (
      select sp.position,
             sp.distance*case sp.distance_unit when 'mi' then 1609.344 else 1000 end meters,
             coalesce(sp.duration_seconds_exact,sp.duration_seconds::numeric,
               sp.pace_seconds::numeric*sp.distance*
                 case sp.distance_unit when 'mi' then 1 else 1000.0/1609.344 end) seconds
      from public.session_pieces sp
      where sp.completion_id=p_completion_id and sp.kind='rep'
        and sp.distance>0 and sp.distance_unit in ('mi','km')
    ), classified as (
      select candidate.position,d.distance_m,candidate.seconds
      from candidates candidate cross join lateral (
        select v.distance_m from (values(200),(300),(400),(500),(600),(800),(1000),(1200),(1600)) v(distance_m)
        where abs(candidate.meters-v.distance_m)<=greatest(10,v.distance_m*0.02)
        order by abs(candidate.meters-v.distance_m) limit 1
      ) d
      where candidate.seconds>0 and candidate.seconds < 7200
    ), grouped as (
      select distance_m,count(*)::integer rep_count,round(avg(seconds),2) avg_seconds,
             round(min(seconds),2) best_seconds,jsonb_agg(round(seconds,2) order by position) splits
      from classified group by distance_m
    )
    insert into public.athlete_track_sessions
      (athlete_id,distance_m,observed_on,source_kind,source_key,planned_session_id,
       completion_id,rep_count,average_seconds,best_rep_seconds,split_seconds,source_note)
    select completion_meta.athlete_id,g.distance_m,completion_meta.observed_on,'filed',
           'completion:'||p_completion_id::text||':'||g.distance_m::text,
           completion_meta.planned_session_id,p_completion_id,g.rep_count,g.avg_seconds,g.best_seconds,g.splits,
           'Derived from filed rep pieces; recovery and easy segments excluded'
    from grouped g;
  end if;
  perform coach_performance_private.refresh_track_stats(completion_meta.athlete_id,d.distance_m)
    from (values(200),(300),(400),(500),(600),(800),(1000),(1200),(1600)) d(distance_m);
end $$;

create or replace function coach_performance_private.track_from_piece_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform coach_performance_private.refresh_track_from_completion(new.completion_id);
  return new;
end $$;
create trigger track_piece_filing_refresh after insert or update on public.session_pieces
  for each row execute function coach_performance_private.track_from_piece_trigger();

create or replace function coach_performance_private.track_from_completion_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform coach_performance_private.refresh_track_from_completion(new.id);
  return new;
end $$;
create trigger track_completion_status_refresh
  after insert or update of status,planned_session_id on public.session_completions
  for each row execute function coach_performance_private.track_from_completion_trigger();

create or replace function coach_performance_private.track_from_sample_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform coach_performance_private.refresh_track_stats(coalesce(new.athlete_id,old.athlete_id),
    coalesce(new.distance_m,old.distance_m));
  return coalesce(new,old);
end $$;
create trigger track_sample_refresh after insert or update or delete on public.athlete_track_sessions
  for each row execute function coach_performance_private.track_from_sample_trigger();

create or replace function coach_performance_private.track_from_measurement_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
declare dist integer; row_data record;
begin
  for row_data in select coalesce(new.athlete_id,old.athlete_id) athlete_id,
                         coalesce(new.measurement_type,old.measurement_type) measurement_type loop
    dist:=case row_data.measurement_type
      when 'reported_best_400m_seconds' then 400
      when 'reported_best_600m_seconds' then 600
      when 'reported_best_800m_seconds' then 800
      when 'reported_best_1k_seconds' then 1000
      when 'reported_best_1600m_seconds' then 1600 else null end;
    if dist is not null then
      perform coach_performance_private.refresh_track_stats(row_data.athlete_id,dist);
    end if;
  end loop;
  return coalesce(new,old);
end $$;
create trigger track_best_measurement_refresh
  after insert or update or delete on public.athlete_measurements
  for each row execute function coach_performance_private.track_from_measurement_trigger();

-- Existing athlete records are preserved. An empty stat is explicitly unknown.
insert into public.athlete_track_stats(athlete_id,distance_m)
select a.id,d.distance_m from public.athletes a
cross join (values(400),(600),(800),(1000)) d(distance_m)
on conflict do nothing;
do $$ declare r record; begin
  for r in select distinct completion_id from public.session_pieces loop
    perform coach_performance_private.refresh_track_from_completion(r.completion_id);
  end loop;
  for r in select a.id athlete_id,d.distance_m from public.athletes a
    cross join (values(400),(600),(800),(1000)) d(distance_m) loop
    perform coach_performance_private.refresh_track_stats(r.athlete_id,r.distance_m);
  end loop;
end $$;

-- Core is an internal participation roster, separate from the performance
-- reference cohort (which has a deliberately fixed cohort key).
create table coach_performance_private.core_members (
  athlete_id uuid primary key references public.athletes(id),
  sort_order smallint not null unique,
  context_label text,
  added_at timestamptz not null default now()
);
revoke all on coach_performance_private.core_members from public,anon,authenticated;
insert into coach_performance_private.core_members
  (athlete_id,sort_order,context_label)
select a.id,core.sort_order,'Coach-selected FORM Core · November 4, 2026'
from (values
  ('patrick-stowe',1),('adrian',2),('brice',3),('jose',4),('hope',5),('tinius',6),
  ('sohel',7),('megan-bolan',8),('turner-goetsch',9),('sam-reyes',10),
  ('sam-pawlowski',11),('anthony',12)
) core(slug,sort_order) join public.athletes a on a.slug=core.slug
on conflict (athlete_id) do update
set sort_order=excluded.sort_order,context_label=excluded.context_label;

-- Hope's first reference is preserved as a screenshot-sourced observation.
-- Her Garmin called the repeats 0.50 mi: close enough to 800 m for coaching,
-- but the original split timing and distance approximation remain explicit.
insert into public.athlete_track_sessions
  (athlete_id,distance_m,observed_on,source_kind,source_key,source_note,
   planned_session_id,rep_count,average_seconds,best_rep_seconds,split_seconds,recorded_by)
values
  ('10000000-0000-4000-8000-000000000003',800,'2026-11-04',
   'coach_import','hope-2026-11-04-garmin-4x800',
   'Garmin screenshot: four 0.50 mi repeats approximating 800 m, 3:00 recoveries; warm-up recorded separately. Athlete reports good mechanics, steady hips, glute propulsion. Not verified.',
   '0355a0d6-60ac-4ec7-9216-69b1e142b7db',4,170.58,168.40,
   '[172.7,168.4,169.8,171.4]'::jsonb,
   '79d1520c-7c7c-4cd2-bd31-229a3cc56158')
on conflict (athlete_id,distance_m,source_key) where source_key is not null do nothing;

comment on table public.athlete_track_sessions is
  'Private track-session evidence. A coached screenshot and a filed completion stay distinct, with a session key for deduplication in the rolling baseline.';
comment on table public.athlete_track_stats is
  'Private coach/athlete read model. Average is last three sessions, weighted by number of reps; best may be a non-verified reported mark. Neither is an automatic prescription.';
revoke all on function coach_performance_private.refresh_track_stats(uuid,integer) from public,anon,authenticated;
revoke all on function coach_performance_private.refresh_track_from_completion(uuid) from public,anon,authenticated;
revoke all on function coach_performance_private.track_from_piece_trigger() from public,anon,authenticated;
revoke all on function coach_performance_private.track_from_completion_trigger() from public,anon,authenticated;
revoke all on function coach_performance_private.track_from_sample_trigger() from public,anon,authenticated;
revoke all on function coach_performance_private.track_from_measurement_trigger() from public,anon,authenticated;
