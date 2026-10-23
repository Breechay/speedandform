-- Athlete-facing coach preview must never carry private coach notes.
-- Coach Board and immutable version history remain unchanged.
CREATE OR REPLACE FUNCTION public.coach_preview_plan_feed(p_athlete_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'A signed-in account is required';
  end if;
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'Coach preview is not authorized for this athlete';
  end if;
  if not public.coaching_sync_enabled() then
    raise exception 'coaching_sync_paused: %',
      coalesce((select paused_reason from public.coaching_sync_state where id), 'sync is paused');
  end if;

  select jsonb_build_object(
    'athlete', (
      select jsonb_build_object(
        'id', a.id, 'first_name', a.first_name, 'display_name', a.display_name,
        'goal_label', a.goal_label, 'target_event', a.target_event,
        'group_runs', a.group_runs)
      from public.athletes a where a.id=p_athlete_id),
    'block', (
      select jsonb_build_object(
        'id', b.id, 'name', b.name, 'total_weeks', b.total_weeks,
        'starts_on', b.starts_on, 'race_on', b.race_on,
        'week_starts_on', b.week_starts_on, 'purpose', b.purpose,
        'race_name', b.race_name, 'race_place', b.race_place,
        'goal_statement', b.goal_statement)
      from public.training_blocks b
      where b.athlete_id=p_athlete_id and b.status='active'
      limit 1),
    'weeks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'week_number', w.week_number,
        'starts_on', w.starts_on, 'ends_on', w.ends_on, 'state', w.state,
        'intent', w.intent,
        'total_distance', (
          select tpw.total_distance
          from public.plan_assignments pa
          join public.training_plan_weeks tpw
            on tpw.plan_id=pa.plan_id
           and tpw.version_id=pa.plan_version_id
          where pa.athlete_id=p_athlete_id
            and pa.block_id=w.block_id
            and tpw.week_number=pa.starts_at_plan_week + ((w.starts_on-pa.starts_on)/7)
          order by pa.assigned_at desc
          limit 1))
        order by w.week_number)
      from public.training_weeks w
      join public.training_blocks b on b.id=w.block_id and b.status='active'
      where w.athlete_id=p_athlete_id), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ps.id, 'week_id', ps.week_id, 'scheduled_on', ps.scheduled_on,
        'day_label', ps.day_label, 'position', ps.position, 'role', ps.role, 'is_key', ps.is_key,
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
            'distance', c.distance,
                          'distance_unit', case when c.distance > 0 then c.distance_unit
                                                else coalesce(v.distance_unit, c.distance_unit) end,
            'duration_seconds', c.duration_seconds,
            'recovery_seconds', c.recovery_seconds, 'recovery_kind', c.recovery_kind,
            'pace_low', case
                            when c.pace_low_seconds is null then c.pace_low
                            when c.distance > 0 and c.distance_unit is not null and v.distance_unit is not null
                              and c.distance_unit <> v.distance_unit then c.pace_low
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'km'
                              then public.clock_from_seconds(round(c.pace_low_seconds::numeric / 1.609344)::integer)
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'mi'
                              then public.clock_from_seconds(c.pace_low_seconds)
                            else c.pace_low end,
                          'pace_high', case
                            when c.pace_high_seconds is null then c.pace_high
                            when c.distance > 0 and c.distance_unit is not null and v.distance_unit is not null
                              and c.distance_unit <> v.distance_unit then c.pace_high
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'km'
                              then public.clock_from_seconds(round(c.pace_high_seconds::numeric / 1.609344)::integer)
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'mi'
                              then public.clock_from_seconds(c.pace_high_seconds)
                            else c.pace_high end,
                          'pace_low_seconds', c.pace_low_seconds,
                          'pace_high_seconds', c.pace_high_seconds,
            'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high,
            'counts_toward_mark', (c.counts_toward_mark_id is not null))
            order by c.position)
          from public.planned_session_components c
          where c.version_id=v.id), '[]'::jsonb))
        order by ps.scheduled_on, ps.position)
      from public.planned_sessions ps
      join public.training_weeks w on w.id=ps.week_id
      join public.training_blocks b on b.id=w.block_id and b.status='active'
      join lateral (
        select v2.* from public.planned_session_versions v2
        where v2.planned_session_id=ps.id
        order by v2.version_number desc limit 1
      ) v on true
      where ps.athlete_id=p_athlete_id
        and ps.state='published'
        and ps.scheduled_on is not null), '[]'::jsonb),
    'synced_at', to_jsonb(now()),
    'plan_authority', true
  ) into payload;

  return payload;
end;
$function$
;
