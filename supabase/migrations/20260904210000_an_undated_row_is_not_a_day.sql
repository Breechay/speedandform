-- An undated row is not a day, and it was rejecting every week.
--
-- The translator on the phone refuses a whole week if any session in it has no
-- scheduled_on:
--
--     guard let iso = session.scheduledOn, let weekday = weekday(forISO: iso)
--     else { return .rejected(.undatedSession(...)) }
--
-- The feed serves every published session, and the weekly `Across the week`
-- budget rows are published and carry no date by design. So every week of Jose's
-- and Hope's blocks fails translation, the app falls back to its own planner,
-- and the athlete runs FORM's plan while the coach reads his own. Both switches
-- being on and the wiring being correct made that invisible: the failure is a
-- clean fallback, and a clean fallback looks like a working app.
--
-- The budget was already demoted to historical audit context when the easy days
-- were authored by day. It is coach-side bookkeeping about how the easy running
-- was written before it had days, and there is no athlete-facing projection of
-- it — nothing on a phone can render "18 miles, some time this week" as a day.
--
-- So the feed stops sending it. One predicate, no app change, and it takes
-- effect on the build that is already installed.

create or replace function public.athlete_plan_feed_impl(p_athlete_id uuid)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $function$
declare
  payload jsonb;
begin
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
                 'rpe_low', v.rpe_low, 'rpe_high', v.rpe_high, 'coach_note', v.coach_note),
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
       where ps.athlete_id = p_athlete_id and ps.state = 'published'
         -- A day the athlete can stand on. An undated row is a coach's quantity,
         -- and sending one refuses the whole week on the phone.
         and ps.scheduled_on is not null), '[]'::jsonb),
    'synced_at', to_jsonb(now()),
    'plan_authority', public.coaching_plan_authority_enabled()
  ) into payload;

  return payload;
end $function$;

comment on function public.athlete_plan_feed_impl is
  'The athlete-facing projection of the coach-authored plan. Dated sessions only: the translator refuses a week containing an undated session, and the weekly easy budget carries no date by design.';
