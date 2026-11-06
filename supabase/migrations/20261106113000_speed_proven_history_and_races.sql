-- Add source-backed collegiate history and registered race objectives to the
-- existing invoker-scoped Speed projection. Historical measurements remain
-- deliberately outside the current mark/pace CTEs.

do $migration$
declare
  v_definition text := pg_get_functiondef('public.athlete_speed_feed(uuid)'::regprocedure);
  v_updated text;
begin
  v_updated := replace(
    v_definition,
    E'  vault as (',
    E'  proven as (\n'
    || E'    select coalesce(jsonb_agg(jsonb_build_object(\n'
    || E'      ''id'',m.id,''measurementType'',m.measurement_type,\n'
    || E'      ''event'',m.metadata->>''event'',''mark'',m.metadata->>''time_text'',\n'
    || E'      ''seconds'',m.value,''measuredAt'',m.measured_at,\n'
    || E'      ''meet'',m.metadata->>''meet'',''discipline'',m.metadata->>''discipline'',\n'
    || E'      ''setting'',m.metadata->>''setting'',\n'
    || E'      ''nonstandard'',m.measurement_type=''collegiate_best_xc_7200m_seconds'',\n'
    || E'      ''sourceName'',''TFRRS'',''sourceKey'',m.source,\n'
    || E'      ''sourceURL'',m.metadata->>''source_url'',\n'
    || E'      ''dateSemantics'',m.metadata->>''date_semantics'',\n'
    || E'      ''meetDateEnd'',m.metadata->>''meet_date_end''\n'
    || E'    ) order by m.measured_at,m.measurement_type),''[]''::jsonb) as value\n'
    || E'    from authorized a\n'
    || E'    join public.athlete_measurements m on m.athlete_id=a.id\n'
    || E'    where m.measurement_type like ''collegiate_best_%''\n'
    || E'      and m.value>0 and lower(m.unit) in (''s'',''sec'',''secs'',''second'',''seconds'')\n'
    || E'      and coalesce((m.metadata->>''use_as_current_training_pace'')::boolean,false)=false\n'
    || E'  ),\n'
    || E'  upcoming_races as (\n'
    || E'    select coalesce(jsonb_agg(jsonb_build_object(\n'
    || E'      ''id'',entry.id,''date'',entry.race_on,''name'',event.name,\n'
    || E'      ''city'',event.city,''discipline'',event.discipline,\n'
    || E'      ''entryStatus'',entry.entry_status\n'
    || E'    ) order by entry.race_on,entry.id),''[]''::jsonb) as value\n'
    || E'    from authorized a\n'
    || E'    join public.race_entries entry on entry.athlete_id=a.id\n'
    || E'    join public.race_events event on event.id=entry.event_id\n'
    || E'    where entry.entry_status=''registered'' and entry.race_on is not null\n'
    || E'      and entry.race_on >= (now() at time zone ''America/New_York'')::date\n'
    || E'      and event.discipline=''running''\n'
    || E'  ),\n'
    || E'  vault as ('
  );
  if v_updated = v_definition then
    raise exception 'athlete_speed_feed proven insertion point did not match reviewed source';
  end if;
  v_definition := v_updated;

  v_updated := replace(
    v_definition,
    E'  ''season'',(select value from season),\n  ''vault'',(select value from vault)',
    E'  ''season'',(select value from season),\n'
    || E'  ''proven'',(select value from proven),\n'
    || E'  ''upcomingRaces'',(select value from upcoming_races),\n'
    || E'  ''vault'',(select value from vault)'
  );
  if v_updated = v_definition then
    raise exception 'athlete_speed_feed output insertion point did not match reviewed source';
  end if;

  execute v_updated;
end;
$migration$;

revoke all on function public.athlete_speed_feed(uuid) from public,anon;
grant execute on function public.athlete_speed_feed(uuid) to authenticated;

comment on function public.athlete_speed_feed(uuid) is
  'One RLS-scoped Speed feed for athlete and Coach Mirror. Current marks come from filed reps or approved reference measurements; Proven collegiate history and registered race objectives retain their own source semantics.';
