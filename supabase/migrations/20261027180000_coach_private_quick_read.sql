-- Private, read-only quick orientation for the coach's portrait long-press.
-- Existing canonical records only. No duplicate athlete profile or inferred metrics.
-- Deny an athlete's self-view, even when the athlete can read some source tables.

create or replace function public.coach_private_quick_read(p_athlete_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if auth.uid() is null or p_athlete_id is null
     or not coalesce(public.is_coach_member(p_athlete_id), false) then
    raise exception 'Coach-only athlete read refused' using errcode = '42501';
  end if;

  select jsonb_strip_nulls(jsonb_build_object(
    'program', coalesce(active_block.name, nullif(a.program_name, '')),
    'goal', nullif(coalesce(active_block.goal_statement, a.goal_label), ''),
    'pr', mark.best,
    'threshold', pace.value,
    'watch', body_watch.observation,
    'watch_date', body_watch.observed_on,
    'movement', movement.observation,
    'coach_lens', lens.observation,
    'coach_note', private_note.body,
    'latest', latest.completion
  ))
  into result
  from public.athletes a
  left join lateral (
    select b.id, b.name, b.goal_statement
    from public.training_blocks b
    where b.athlete_id = a.id and b.status = 'active'
    order by b.starts_on desc nulls last, b.created_at desc
    limit 1
  ) active_block on true
  left join lateral (
    select concat_ws(' · ', m.label,
      concat(m.current_value::text, ' ', nullif(m.unit, ''))) as best
    from public.athlete_marks m
    where m.athlete_id = a.id and m.active = true
      and m.current_value is not null
      and m.mark_type in ('pr', 'personal_best', 'race_pr')
    order by m.updated_at desc
    limit 1
  ) mark on true
  left join lateral (
    select p.value
    from public.block_pace_bands p
    where p.athlete_id = a.id and p.label ilike 'threshold%'
      and (active_block.id is null or p.block_id = active_block.id)
    order by p.updated_at desc
    limit 1
  ) pace on true
  left join lateral (
    select o.observation, o.observed_on
    from public.athlete_observations o
    where o.athlete_id = a.id and o.facet = 'body'
      and not exists (select 1 from public.athlete_observations newer
        where newer.supersedes = o.id)
    order by o.observed_on desc, o.created_at desc
    limit 1
  ) body_watch on true
  left join lateral (
    select o.observation
    from public.athlete_observations o
    where o.athlete_id = a.id and o.facet = 'mechanics'
      and not exists (select 1 from public.athlete_observations newer
        where newer.supersedes = o.id)
    order by o.observed_on desc, o.created_at desc
    limit 1
  ) movement on true
  left join lateral (
    select o.observation
    from public.athlete_observations o
    where o.athlete_id = a.id and o.facet = 'pattern'
      and not exists (select 1 from public.athlete_observations newer
        where newer.supersedes = o.id)
    order by o.observed_on desc, o.created_at desc
    limit 1
  ) lens on true
  left join lateral (
    select n.body
    from public.coach_private_notes n
    where n.athlete_id = a.id
    order by n.created_at desc
    limit 1
  ) private_note on true
  left join lateral (
    select jsonb_strip_nulls(jsonb_build_object(
      'filed_on', (c.filed_at at time zone 'America/New_York')::date,
      'title', nullif(v.title, ''),
      'rep_paces', nullif(c.rep_paces, ''),
      'distance', c.actual_distance,
      'distance_unit', c.distance_unit,
      'felt', nullif(c.felt, '')
    )) as completion
    from public.session_completions c
    left join public.planned_session_versions v
      on v.id = c.planned_session_version_id
      and v.athlete_id = c.athlete_id
    where c.athlete_id = a.id and c.status = 'completed'
    order by c.filed_at desc, c.id desc
    limit 1
  ) latest on true
  where a.id = p_athlete_id and a.active = true;

  if result is null then
    raise exception 'Athlete unavailable to this coach' using errcode = '42501';
  end if;
  return result;
end;
$function$;

revoke all on function public.coach_private_quick_read(uuid) from public, anon;
grant execute on function public.coach_private_quick_read(uuid) to authenticated;

comment on function public.coach_private_quick_read(uuid) is
  'Coach-member-only, canonical private quick read for native portrait long-press; no athlete access or inferred metrics.';
