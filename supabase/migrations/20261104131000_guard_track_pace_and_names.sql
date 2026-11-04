-- The canonical component pace field is seconds per MILE regardless of the
-- repeat distance unit. A 2:04/800 display caused by treating a per-km or
-- per-repeat value as a mile pace must not silently publish again.

create or replace function public.form_guard_session_title()
returns trigger language plpgsql set search_path='pg_catalog','public' as $$
begin
  if lower(btrim(new.title)) ~
    '^(controlled|control|key session|mid[ -]?week aerobic|threshold co|workout|quality|speed day|steady|moderate)$' then
    raise exception 'Session title "%" is too generic. Name the actual work, for example Intro to Speed.',new.title
      using errcode='22023';
  end if;
  return new;
end $$;

create trigger form_session_title_truth
  before insert or update of title on public.planned_session_versions
  for each row execute function public.form_guard_session_title();

create or replace function public.form_guard_track_pace_unit()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public' as $$
declare distance_m numeric; goal_low integer; supported_best numeric;
begin
  if new.role <> 'work' or new.distance is null or new.pace_low_seconds is null
    then return new; end if;
  distance_m := new.distance * case new.distance_unit when 'km' then 1000 else 1609.344 end;
  if distance_m < 600 then return new; end if;

  -- Strongest calibration is the athlete's own observed 600m+ work. No best
  -- record is required: the goal pace is a fallback for first-time athletes.
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
     and t.distance_m=round(distance_m)::integer
  where v.id=new.version_id;

  -- If a known best makes this exceptional speed plausible, let it through.
  if supported_best is not null and
     (new.pace_low_seconds * distance_m / 1609.344) >= supported_best*0.90
  then return new; end if;

  raise exception
    'Track pace unit check: %/mi for %m projects % seconds per rep, far faster than this athlete''s goal pace. Confirm that pace values are seconds per MILE, not per km or rep.',
    to_char(make_interval(secs=>new.pace_low_seconds),'MI:SS'),round(distance_m),
    round(new.pace_low_seconds*distance_m/1609.344)
    using errcode='22023';
end $$;

create trigger form_track_pace_unit_truth
  before insert or update of pace_low_seconds,pace_high_seconds,distance,distance_unit,role,version_id
  on public.planned_session_components
  for each row execute function public.form_guard_track_pace_unit();

comment on function public.form_guard_track_pace_unit() is
  'Blocks extreme 600m+ repeat pace unit mistakes relative to the athlete''s published goal band, unless their own observed best supports the pace. Other speed prescriptions remain coach-selected.';
