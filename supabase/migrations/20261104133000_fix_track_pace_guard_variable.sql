-- A PL/pgSQL variable named distance_m collided with the stats table column.
-- Preserve the existing public trigger and its revoked execution privilege.
create or replace function public.form_guard_track_pace_unit()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public' as $$
declare v_repeat_meters numeric; goal_low integer; supported_best numeric;
begin
  if new.role <> 'work' or new.distance is null or new.pace_low_seconds is null
    then return new; end if;
  v_repeat_meters := new.distance * case new.distance_unit when 'km' then 1000 else 1609.344 end;
  if v_repeat_meters < 600 then return new; end if;

  select b.low_seconds into goal_low
  from public.planned_session_versions v
  join public.planned_sessions ps on ps.id=v.planned_session_id
  join public.training_weeks w on w.id=ps.week_id
  join public.block_pace_bands b on b.block_id=w.block_id
    and b.athlete_id=ps.athlete_id
  where v.id=new.version_id and b.low_seconds>0
    and lower(b.label) in ('goal pace','race work')
  order by case lower(b.label) when 'goal pace' then 0 else 1 end,b.position limit 1;

  if goal_low is null or new.pace_low_seconds >= goal_low*0.65 then return new; end if;

  select t.best_seconds into supported_best
  from public.planned_session_versions v
  join public.athlete_track_stats t on t.athlete_id=v.athlete_id
     and t.distance_m=round(v_repeat_meters)::integer
  where v.id=new.version_id;

  if supported_best is not null and
     (new.pace_low_seconds * v_repeat_meters / 1609.344) >= supported_best*0.90
  then return new; end if;

  raise exception
    'Track pace unit check: %/mi for %m projects % seconds per rep, far faster than this athlete''s goal pace. Confirm that pace values are seconds per MILE, not per km or rep.',
    to_char(make_interval(secs=>new.pace_low_seconds),'MI:SS'),round(v_repeat_meters),
    round(new.pace_low_seconds*v_repeat_meters/1609.344)
    using errcode='22023';
end $$;

revoke all on function public.form_guard_track_pace_unit() from public,anon,authenticated;
