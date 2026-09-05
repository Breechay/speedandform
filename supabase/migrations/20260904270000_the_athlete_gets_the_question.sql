-- The athlete gets the question.
--
-- `athlete_plan_feed` sent the prescription and nothing else: sessions,
-- versions, components. So the two things the plan is actually about — the
-- question this block is asking, and how much of the answer the athlete has
-- already established — physically could not reach the phone. Labs spent a day
-- making them the centre of the athlete-facing plan and the payload had no room
-- for either.
--
-- Additive. Every existing key keeps its name and shape, so a shipped build
-- decodes exactly what it decoded before and ignores the rest.
--
-- ESTABLISHED, not eligible. The value comes from mark_established_value, which
-- reads only components explicitly connected to the mark and only where filed
-- evidence qualified. An athlete is never told they own something because a
-- session was authored; they are told it because they ran it.

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
        'week_starts_on', b.week_starts_on, 'purpose', b.purpose,
        'race_name', b.race_name, 'race_place', b.race_place,
        'goal_statement', b.goal_statement)
        from public.training_blocks b
       where b.athlete_id = p_athlete_id and b.status = 'active'
       limit 1),

    -- The mark. One per athlete by construction: the active primary.
    'mark', (
      select jsonb_build_object(
        'id', m.id,
        'label', m.label,
        'unit', m.unit,
        -- Authored in the second person, because this is the sentence the
        -- athlete reads. Not rewritten at render on either surface.
        'question', m.current_question,
        'target_value', m.target_value,
        -- What filed evidence has established. Null is the honest answer for an
        -- athlete whose block has not proved anything yet.
        'established_value', (select e.established_value
                                from public.mark_established_value e where e.mark_id = m.id),
        'established_at', (select e.established_at
                             from public.mark_established_value e where e.mark_id = m.id),
        'checkpoints', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'value', k.value, 'label', k.label, 'state', k.state, 'position', k.position)
                 order by k.position)
            from public.mark_checkpoints k where k.mark_id = m.id), '[]'::jsonb))
        from public.athlete_marks m
       where m.athlete_id = p_athlete_id and m.active and m.is_primary
       limit 1),

    'weeks', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', w.id, 'week_number', w.week_number,
               'starts_on', w.starts_on, 'ends_on', w.ends_on, 'state', w.state,
               'intent', w.intent)
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
                          'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high,
                          -- Whether this piece can answer the mark. The athlete
                          -- surfaces mark ownership-moving work the way Labs does.
                          'counts_toward_mark', (c.counts_toward_mark_id is not null))
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
         and ps.scheduled_on is not null), '[]'::jsonb),
    'synced_at', to_jsonb(now()),
    'plan_authority', public.coaching_plan_authority_enabled()
  ) into payload;

  return payload;
end $function$;

comment on function public.athlete_plan_feed_impl is
  'The athlete-facing projection of the coach-authored plan: the prescription, the mark it is asking about, what filed evidence has established against it, and the ladder. Dated sessions only. Additive to what shipped builds already decode.';
