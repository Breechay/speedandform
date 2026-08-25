-- The filing transaction validates rather than trusts.
--
-- The law says agent filing and manual filing use the same server-authoritative
-- transaction, which validates coach membership, athlete identity, source,
-- completion fields and ordered session pieces, then writes atomically.
--
-- What shipped checked membership and passed everything else straight through to
-- the column constraints. That is not the same thing: an agent could file pieces
-- belonging to a different athlete, in an order the caller chose, with a kind the
-- table would reject only after several rows had already been written, or attach
-- a completion to a session that belongs to somebody else.
--
-- The agent is the reason this matters. It reads a screenshot and writes what it
-- believes it saw. A path used by something that can be wrong needs to be a path
-- that checks.

create or replace function public.write_pieces(
  p_athlete_id uuid, p_completion_id uuid, p_pieces jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  bad text;
begin
  if jsonb_typeof(coalesce(p_pieces, '[]'::jsonb)) <> 'array' then
    raise exception 'Pieces must be a list';
  end if;

  -- Reject the whole set before writing any of it, so a bad kind halfway down
  -- cannot leave a session holding half its splits.
  select piece ->> 'kind' into bad
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) as piece
   where coalesce(piece ->> 'kind', '') not in ('warmup', 'rep', 'float', 'cooldown')
   limit 1;
  if bad is not null then
    raise exception 'Unknown piece kind: %', coalesce(bad, 'missing');
  end if;

  -- Order is the caller's, but position is ours: a screenshot read out of order
  -- must not produce a session whose splits are numbered out of order.
  insert into public.session_pieces
    (athlete_id, completion_id, position, kind, distance, distance_unit, duration_seconds, pace_seconds)
  select p_athlete_id, p_completion_id,
         (row_number() over (order by ordinality))::smallint,
         piece ->> 'kind',
         nullif(piece ->> 'distance', '')::numeric,
         case when nullif(piece ->> 'distance', '') is null then null
              else coalesce(piece ->> 'distanceUnit', 'mi') end,
         nullif(piece ->> 'durationSeconds', '')::integer,
         nullif(piece ->> 'paceSeconds', '')::integer
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) with ordinality as t(piece, ordinality);
end;
$$;

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
as $$
declare
  new_id uuid;
  session_owner uuid;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'Not your athlete';
  end if;
  if coalesce(p_status, '') not in ('completed', 'partial', 'changed', 'skipped') then
    raise exception 'Unknown status: %', coalesce(p_status, 'missing');
  end if;

  -- A completion may only attach to a session belonging to the same athlete.
  -- Nothing else stops an agent filing Hope's run against Jose's Tuesday.
  if p_planned_session_id is not null then
    select athlete_id into session_owner
      from public.planned_sessions where id = p_planned_session_id;
    if session_owner is distinct from p_athlete_id then
      raise exception 'That session belongs to a different athlete';
    end if;
  end if;

  -- The future is not evidence.
  if coalesce(p_filed_at, now()) > now() + interval '1 day' then
    raise exception 'A session cannot be filed in the future';
  end if;

  insert into public.session_completions (
    athlete_id, planned_session_id, status, actual_distance, distance_unit,
    duration_seconds, rpe, surface, temperature_f, conditions, athlete_note,
    source, filed_by, filed_at
  ) values (
    p_athlete_id, p_planned_session_id, p_status, p_actual_distance,
    coalesce(p_distance_unit, 'mi'), p_duration_seconds, p_rpe, p_surface,
    p_temperature_f, p_conditions, p_athlete_note,
    'coach_import', auth.uid(), coalesce(p_filed_at, now())
  )
  returning id into new_id;

  perform public.write_pieces(p_athlete_id, new_id, p_pieces);
  return new_id;
end;
$$;

revoke all on function public.write_pieces(uuid, uuid, jsonb) from public;
revoke all on function public.file_session(uuid, text, uuid, numeric, text, integer, smallint, text, smallint, text, text, timestamptz, jsonb) from public;
grant execute on function public.file_session(uuid, text, uuid, numeric, text, integer, smallint, text, smallint, text, text, timestamptz, jsonb) to authenticated;
