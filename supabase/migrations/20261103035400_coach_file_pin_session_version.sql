-- Preserve the immutable prescription version on coach-filed results.
-- Previously file_session saved planned_session_id but omitted the version id.
-- Collective work publishing intentionally requires the exact version,
-- so completed coach imports silently failed to reach the member feed.
-- No broad historical backfill: past plans may have changed after filing.
create or replace function public.file_session(
  p_athlete_id          uuid,
  p_status              text,
  p_planned_session_id  uuid        default null,
  p_actual_distance     numeric     default null,
  p_distance_unit       text        default 'mi',
  p_duration_seconds    integer     default null,
  p_rpe                 smallint    default null,
  p_surface             text        default null,
  p_temperature_f       smallint    default null,
  p_conditions          text        default null,
  p_athlete_note        text        default null,
  p_filed_at            timestamptz default null,
  p_pieces              jsonb       default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  new_id uuid;
  session_owner uuid;
  session_version uuid;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'Not your athlete';
  end if;
  if coalesce(p_status, '') not in ('completed', 'partial', 'changed', 'skipped') then
    raise exception 'Unknown status: %', coalesce(p_status, 'missing');
  end if;

  -- Ownership is checked before the version lookup. A version must
  -- belong to this exact athlete and planned session, not merely share a title.
  if p_planned_session_id is not null then
    select athlete_id into session_owner
      from public.planned_sessions where id = p_planned_session_id;
    if session_owner is distinct from p_athlete_id then
      raise exception 'That session belongs to a different athlete';
    end if;

    select v.id into session_version
      from public.planned_session_versions v
     where v.planned_session_id = p_planned_session_id
       and v.athlete_id = p_athlete_id
     order by v.version_number desc, v.created_at desc, v.id desc
     limit 1;
  end if;

  -- The future is not evidence.
  if coalesce(p_filed_at, now()) > now() + interval '1 day' then
    raise exception 'A session cannot be filed in the future';
  end if;

  insert into public.session_completions (
    athlete_id, planned_session_id, planned_session_version_id, status,
    actual_distance, distance_unit, duration_seconds, rpe, surface,
    temperature_f, conditions, athlete_note, source, filed_by, filed_at
  ) values (
    p_athlete_id, p_planned_session_id, session_version, p_status,
    p_actual_distance, coalesce(p_distance_unit, 'mi'),
    p_duration_seconds, p_rpe, p_surface, p_temperature_f, p_conditions,
    p_athlete_note, 'coach_import', auth.uid(), coalesce(p_filed_at, now())
  )
  returning id into new_id;

  perform public.write_pieces(p_athlete_id, new_id, p_pieces);
  return new_id;
end;
$function$;

revoke all on function public.file_session(
  uuid, text, uuid, numeric, text, integer, smallint,
  text, smallint, text, text, timestamptz, jsonb
) from public, anon;
grant execute on function public.file_session(
  uuid, text, uuid, numeric, text, integer, smallint,
  text, smallint, text, text, timestamptz, jsonb
) to authenticated;
