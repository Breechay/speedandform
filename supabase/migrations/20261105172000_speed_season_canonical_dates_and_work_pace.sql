-- Season labels use the authored session date, not the date a historical import
-- happened to be filed. Pace is calculated from canonical work pieces when
-- those pieces exist; incomplete piece timing remains null instead of silently
-- falling back to whole-activity GPS pace.

do $migration$
declare
  v_definition text := pg_get_functiondef('public.athlete_speed_feed(uuid)'::regprocedure);
  v_updated text;
begin
  v_updated := replace(
    v_definition,
    $old$'completionId',c.id,'date',c.filed_at::date,'title',v.title,$old$,
    $new$'completionId',c.id,'date',coalesce((
        select planned.scheduled_on
        from public.planned_session_versions version
        join public.planned_sessions planned on planned.id=version.planned_session_id
        where version.id=c.planned_session_version_id
      ),c.filed_at::date),'title',v.title,$new$
  );
  if v_updated = v_definition then
    raise exception 'athlete_speed_feed date projection did not match reviewed source';
  end if;
  v_definition := v_updated;

  v_updated := replace(
    v_definition,
    $old$'distance',c.actual_distance,'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,$old$,
    $new$'distance',case when exists (
        select 1 from public.session_pieces work
        where work.completion_id=c.id and work.athlete_id=c.athlete_id and work.kind='rep'
      ) then (
        select sum(case work.distance_unit
          when 'm' then work.distance
          when 'km' then work.distance*1000
          when 'mi' then work.distance*1609.344
          else null end)
        from public.session_pieces work
        where work.completion_id=c.id and work.athlete_id=c.athlete_id and work.kind='rep'
      ) else c.actual_distance end,
      'distanceUnit',case when exists (
        select 1 from public.session_pieces work
        where work.completion_id=c.id and work.athlete_id=c.athlete_id and work.kind='rep'
      ) then 'm' else c.distance_unit end,
      'durationSeconds',case when exists (
        select 1 from public.session_pieces work
        where work.completion_id=c.id and work.athlete_id=c.athlete_id and work.kind='rep'
      ) then (
        select sum(coalesce(work.duration_seconds_exact,work.duration_seconds::numeric))
        from public.session_pieces work
        where work.completion_id=c.id and work.athlete_id=c.athlete_id and work.kind='rep'
      ) else c.duration_seconds end,$new$
  );
  if v_updated = v_definition then
    raise exception 'athlete_speed_feed work-pace projection did not match reviewed source';
  end if;

  execute v_updated;
end;
$migration$;

revoke all on function public.athlete_speed_feed(uuid) from public,anon;
grant execute on function public.athlete_speed_feed(uuid) to authenticated;
