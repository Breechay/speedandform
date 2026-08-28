-- One door for the app, and it opens onto one athlete's plan.
--
-- Gate A gives FORM the dated plan. The app must not get table access to do it:
-- the coaching tables carry private notes, exceptions, attention state, standing
-- confidence, judgments and three other athletes, and RLS keeping the app out of
-- them is a policy away from being wrong. A single feed is a smaller thing to get
-- right and a smaller thing to audit.
--
-- What it returns: the athlete's own dated weeks, their published sessions, and
-- the structured components of the current version of each. Nothing else. No
-- coach note, no exception, no attention item, no confidence, no judgment, no
-- other athlete. The shape is the app's contract, so adding a field is a
-- deliberate act rather than a table gaining a column.
--
-- The backend is authoritative. Anything absent here is absent because it was
-- never authored, and the app renders it as not prescribed. It does not fill a
-- gap with a default, because a plausible default is how "6:30 to 6:45" ends up
-- on a session nobody set a pace for.

create or replace function public.athlete_plan_feed(p_athlete_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  payload jsonb;
begin
  -- The caller must be this athlete. A coach reads the console, not this feed,
  -- so there is exactly one way in and it is the athlete's own membership.
  if not public.is_athlete_member(p_athlete_id) then
    raise exception 'this feed serves an athlete their own plan';
  end if;

  select jsonb_build_object(
    'athlete', (
      select jsonb_build_object(
        'id', a.id, 'first_name', a.first_name, 'display_name', a.display_name,
        'goal_label', a.goal_label, 'target_event', a.target_event)
        from public.athletes a where a.id = p_athlete_id),
    'block', (
      select jsonb_build_object(
        'id', b.id, 'name', b.name, 'total_weeks', b.total_weeks,
        'starts_on', b.starts_on, 'race_on', b.race_on,
        'week_starts_on', b.week_starts_on, 'purpose', b.purpose)
        from public.training_blocks b
       where b.athlete_id = p_athlete_id and b.status = 'active'
       limit 1),
    'weeks', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', w.id, 'week_number', w.week_number,
               'starts_on', w.starts_on, 'ends_on', w.ends_on, 'state', w.state)
             order by w.week_number)
        from public.training_weeks w
        join public.training_blocks b on b.id = w.block_id and b.status = 'active'
       where w.athlete_id = p_athlete_id), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', ps.id, 'week_id', ps.week_id, 'scheduled_on', ps.scheduled_on,
               'day_label', ps.day_label, 'position', ps.position,
               'version', jsonb_build_object(
                 'id', v.id, 'version_number', v.version_number, 'title', v.title,
                 'shape', v.shape, 'intent', v.intent, 'details', v.details,
                 'prescribed_distance', v.prescribed_distance,
                 'distance_unit', v.distance_unit,
                 'prescribed_duration_minutes', v.prescribed_duration_minutes,
                 'pace_low', v.pace_low, 'pace_high', v.pace_high,
                 'rpe_low', v.rpe_low, 'rpe_high', v.rpe_high),
               'components', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'position', c.position, 'role', c.role, 'shape', c.shape,
                          'repeat_count', c.repeat_count,
                          'repeat_minimum', c.repeat_minimum, 'repeat_target', c.repeat_target,
                          'repeat_progression', c.repeat_progression, 'repeat_ceiling', c.repeat_ceiling,
                          'distance', c.distance, 'distance_unit', c.distance_unit,
                          'duration_seconds', c.duration_seconds,
                          'recovery_seconds', c.recovery_seconds, 'recovery_kind', c.recovery_kind,
                          'pace_low', c.pace_low, 'pace_high', c.pace_high,
                          'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high)
                        order by c.position)
                   from public.planned_session_components c
                  where c.version_id = v.id), '[]'::jsonb))
             order by ps.scheduled_on, ps.position)
        from public.planned_sessions ps
        join public.training_weeks w on w.id = ps.week_id
        join public.training_blocks b on b.id = w.block_id and b.status = 'active'
        join lateral (
          select v2.* from public.planned_session_versions v2
           where v2.planned_session_id = ps.id
           order by v2.version_number desc limit 1) v on true
       where ps.athlete_id = p_athlete_id and ps.state = 'published'), '[]'::jsonb),
    -- The app caches this and needs to know when it is stale without diffing.
    'synced_at', to_jsonb(now())
  ) into payload;

  return payload;
end $$;

revoke all on function public.athlete_plan_feed(uuid) from public;
grant execute on function public.athlete_plan_feed(uuid) to authenticated;

comment on function public.athlete_plan_feed(uuid) is
  'The only thing FORM reads from the coaching project. One athlete, their dated weeks, their published sessions and the structured components of each current version. No coach note, exception, attention item, confidence, judgment or other athlete can be reached through it. Absent fields are absent because nobody authored them; the app renders not prescribed and never fills a gap with a default.';

do $$
declare bad integer;
begin
  select count(*) into bad from pg_proc where proname = 'athlete_plan_feed';
  if bad <> 1 then raise exception 'the feed is missing'; end if;
  -- security invoker plus the membership check means RLS still applies and a
  -- coach cannot borrow it to read an athlete they do not have.
  select count(*) into bad from pg_proc where proname = 'athlete_plan_feed' and prosecdef;
  if bad <> 0 then raise exception 'the feed must not be security definer'; end if;
end $$;
