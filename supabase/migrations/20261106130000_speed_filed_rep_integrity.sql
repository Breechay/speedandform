-- FORM 44.7/44.8 · generic Speed evidence integrity (no private athlete fixtures).
-- An independently authorized, audited production data reconciliation ran on
-- 2026-11-06; individual clocks and completion IDs do not belong in this repo.

create or replace function coach_performance_private.track_from_distance_correction()
returns trigger language plpgsql security definer
set search_path='' as $function$
declare affected_completion uuid;
begin
  select p.completion_id into affected_completion
  from public.session_pieces p
  where p.id=coalesce(new.piece_id,old.piece_id);
  if affected_completion is not null then
    perform coach_performance_private.refresh_track_from_completion(affected_completion);
  end if;
  return coalesce(new,old);
end;
$function$;
revoke all on function coach_performance_private.track_from_distance_correction()
  from public,anon,authenticated;
drop trigger if exists track_distance_correction_refresh
  on public.speed_piece_distance_corrections;
create trigger track_distance_correction_refresh
after insert or update or delete on public.speed_piece_distance_corrections
for each row execute function coach_performance_private.track_from_distance_correction();

-- A generic receipt's kind=rep is not proof of a timed track repetition.
-- FORM/athlete filings require a pinned repetitions-shaped work component;
-- coach-imports retain their existing coach-filed provenance. GPS-only
-- Strava timing is excluded from timed marks, regardless of distance.
create or replace function coach_performance_private.refresh_track_from_completion(
  p_completion_id uuid)
returns void language plpgsql security definer set search_path='' as $function$
declare completion_meta record;
begin
  select sc.athlete_id,sc.planned_session_id,sc.planned_session_version_id,
         sc.status,sc.source,sc.timing_source,
         coalesce(ps.scheduled_on,(sc.filed_at at time zone 'America/New_York')::date)
           as observed_on
    into completion_meta
  from public.session_completions sc
  left join public.planned_sessions ps on ps.id=sc.planned_session_id
  where sc.id=p_completion_id;
  if not found then return; end if;

  delete from public.athlete_track_sessions t
  where t.completion_id=p_completion_id and t.source_kind='filed';

  if completion_meta.status in ('completed','partial','changed')
     and completion_meta.source in ('form','athlete','coach_import')
     and completion_meta.timing_source is distinct from 'strava'
     and (completion_meta.source='coach_import' or exists (
       select 1 from public.planned_session_components pc
       where pc.version_id=completion_meta.planned_session_version_id
         and pc.athlete_id=completion_meta.athlete_id
         and pc.role='work' and pc.shape='repetitions'
     )) then
    with candidates as (
      select sp.position,
             coalesce(correction.distance_m::numeric,
               case sp.distance_unit when 'm' then sp.distance
                 when 'km' then sp.distance*1000
                 when 'mi' then sp.distance*1609.344 else null end) as meters,
             coalesce(sp.duration_seconds_exact,sp.duration_seconds::numeric,
               sp.pace_seconds::numeric *
               case sp.distance_unit when 'mi' then sp.distance
                 when 'km' then sp.distance*1000/1609.344
                 when 'm' then sp.distance/1609.344 else null end) as seconds
      from public.session_pieces sp
      left join public.speed_piece_distance_corrections correction
        on correction.piece_id=sp.id and correction.athlete_id=sp.athlete_id
      where sp.completion_id=p_completion_id and sp.athlete_id=completion_meta.athlete_id
        and sp.kind='rep'
    ), classified as (
      select candidate.position,d.distance_m,candidate.seconds
      from candidates candidate cross join lateral (
        select v.distance_m
        from (values(200),(300),(400),(500),(600),(800),(1000),(1200),(1600))
          v(distance_m)
        where abs(candidate.meters-v.distance_m)<=greatest(10,v.distance_m*0.02)
        order by abs(candidate.meters-v.distance_m) limit 1
      ) d
      where candidate.seconds>0 and candidate.seconds<7200
    ), grouped as (
      select distance_m,count(*)::integer rep_count,
             round(avg(seconds),2) avg_seconds,
             round(min(seconds),2) best_seconds,
             jsonb_agg(round(seconds,2) order by position) splits
      from classified group by distance_m
    )
    insert into public.athlete_track_sessions
      (athlete_id,distance_m,observed_on,source_kind,source_key,
       planned_session_id,completion_id,rep_count,average_seconds,
       best_rep_seconds,split_seconds,source_note)
    select completion_meta.athlete_id,g.distance_m,completion_meta.observed_on,'filed',
           'completion:'||p_completion_id::text||':'||g.distance_m::text,
           completion_meta.planned_session_id,p_completion_id,g.rep_count,
           g.avg_seconds,g.best_seconds,g.splits,
           'Filed work-rep evidence (with signed distance overlays when present)'
    from grouped g;
  end if;

  perform coach_performance_private.refresh_track_stats(
    completion_meta.athlete_id,d.distance_m)
  from (values(200),(300),(400),(500),(600),(800),(1000),(1200),(1600)) d(distance_m);
end;
$function$;

-- Guarded in-place Speed projection edits keep all newer Season/Vault logic.
do $migration$
declare
  original text := pg_get_functiondef('public.athlete_speed_feed(uuid)'::regprocedure);
  anchor text := E'and p.kind=''rep''\n       and coalesce(p.duration_seconds_exact,p.duration_seconds::numeric)>0';
  replacement text := E'and p.kind=''rep''\n'
    || E'       and coalesce(p.duration_seconds_exact,p.duration_seconds::numeric)>0\n'
    || E'       and c.timing_source is distinct from ''strava''\n'
    || E'       and (c.source=''coach_import'' or exists (\n'
    || E'         select 1 from public.planned_session_components work\n'
    || E'         where work.version_id=c.planned_session_version_id\n'
    || E'           and work.athlete_id=c.athlete_id\n'
    || E'           and work.role=''work'' and work.shape=''repetitions''\n'
    || E'       ))';
begin
  if original is null then
    raise exception 'Speed projection is missing';
  elsif strpos(original,replacement)>0 then
    null;
  elsif length(original)-length(replace(original,anchor,''))=length(anchor) then
    execute replace(original,anchor,replacement);
  else
    raise exception 'Speed rep evidence gate changed; re-review before migration';
  end if;
end;
$migration$;

do $migration$
declare
  original text := pg_get_functiondef('public.athlete_speed_feed(uuid)'::regprocedure);
  anchor text := E'select sum(case work.distance_unit\n'
    || E'          when ''m'' then work.distance\n'
    || E'          when ''km'' then work.distance*1000\n'
    || E'          when ''mi'' then work.distance*1609.344\n'
    || E'          else null end)\n'
    || E'        from public.session_pieces work\n'
    || E'        where work.completion_id=c.id';
  replacement text := E'select sum(coalesce(correction.distance_m,\n'
    || E'          case work.distance_unit\n'
    || E'            when ''m'' then work.distance\n'
    || E'            when ''km'' then work.distance*1000\n'
    || E'            when ''mi'' then work.distance*1609.344\n'
    || E'            else null end))\n'
    || E'        from public.session_pieces work\n'
    || E'        left join public.speed_piece_distance_corrections correction\n'
    || E'          on correction.piece_id=work.id and correction.athlete_id=c.athlete_id\n'
    || E'        where work.completion_id=c.id';
begin
  if original is null then
    raise exception 'Speed projection is missing';
  elsif strpos(original,replacement)>0 then
    null;
  elsif length(original)-length(replace(original,anchor,''))=length(anchor) then
    execute replace(original,anchor,replacement);
  else
    raise exception 'Speed Season distance sum changed; re-review before migration';
  end if;
end;
$migration$;

-- A coach can reconcile a future legacy time-only filing without substituting
-- an administrator's identity. It binds exactly to the immutable authored
-- repetition slots; missing/mixed/partial/ambiguous geometry is refused.
create or replace function public.reconcile_filed_speed_distances(p_completion_id uuid)
returns integer language plpgsql security definer set search_path='' as $function$
declare
  filing record;
  frozen integer[];
  original_positions integer[];
  n integer;
  inserted integer;
begin
  select c.id,c.athlete_id,c.planned_session_version_id,c.source,c.status
  into filing from public.session_completions c where c.id=p_completion_id;
  if filing.id is null or auth.uid() is null
     or not public.is_coach_member(filing.athlete_id) then
    raise exception 'Not authorized to reconcile this filing' using errcode='42501';
  end if;
  if filing.planned_session_version_id is null or filing.source not in ('form','athlete')
     or filing.status not in ('completed','partial','changed') then
    raise exception 'A completed, pinned athlete filing is required';
  end if;

  select array_agg(round(case pc.distance_unit when 'm' then pc.distance
             when 'km' then pc.distance*1000
             when 'mi' then pc.distance*1609.344 end)::integer order by pc.position,g.n)
  into frozen
  from public.planned_session_components pc
  cross join lateral generate_series(1,least(coalesce(pc.repeat_target,pc.repeat_count,1),100)) g(n)
  where pc.version_id=filing.planned_session_version_id and pc.athlete_id=filing.athlete_id
    and pc.role='work' and pc.shape='repetitions';

  select array_agg(p.position::integer order by p.position),count(*) into original_positions,n
  from public.session_pieces p
  where p.completion_id=p_completion_id and p.athlete_id=filing.athlete_id
    and p.kind='rep' and p.distance is null
    and coalesce(p.duration_seconds_exact,p.duration_seconds::numeric)>0;

  if frozen is null or array_length(frozen,1) is null or n<>array_length(frozen,1)
     or original_positions is distinct from
        (select array_agg(i) from generate_series(1,n) i)
     or array_position(frozen,null) is not null
     or exists (select 1 from public.session_pieces p
                where p.completion_id=p_completion_id and p.kind<>'rep') then
    raise exception 'Cannot safely match filed reps to frozen geometry';
  end if;

  if exists (select 1 from public.session_pieces p
             join public.speed_piece_distance_corrections d on d.piece_id=p.id
             where p.completion_id=p_completion_id
               and d.distance_m<>frozen[p.position]) then
    raise exception 'Existing signed distance conflicts with frozen geometry';
  end if;

  insert into public.speed_piece_distance_corrections
    (athlete_id,piece_id,distance_m,signed_by,source_note)
  select p.athlete_id,p.id,frozen[p.position],auth.uid(),
         'Authenticated coach matched filed rep slots to the pinned session version'
  from public.session_pieces p
  where p.completion_id=p_completion_id and p.athlete_id=filing.athlete_id
    and p.kind='rep' and p.distance is null
  on conflict (piece_id) do nothing;
  get diagnostics inserted = row_count;
  return inserted;
end;
$function$;
revoke all on function public.reconcile_filed_speed_distances(uuid) from public,anon;
grant execute on function public.reconcile_filed_speed_distances(uuid) to authenticated;
