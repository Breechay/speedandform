-- One creation path, enforced rather than agreed.
--
-- The law says agent filing and manual filing use the same machinery, so there is
-- never a second kind of session that behaves differently. That was true only by
-- convention: the browser went through one function, and an agent writing SQL
-- directly could skip the pieces, skip source = 'coach_import', and produce a
-- session that looked filed and carried no evidence.
--
-- These functions are the path. The coach insert policy is dropped at the end, so
-- there is no longer a way around them. A session and its pieces now arrive
-- together or not at all.
--
-- correct_session also carries the reason. completion_revisions gained the column
-- but nothing could fill it: the audit trigger fires on the write and cannot see
-- a sentence the caller never sent. Stamping it here, in the same transaction as
-- the change it explains, is the only place it can be true.

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
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'Not your athlete';
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

create or replace function public.write_pieces(
  p_athlete_id uuid, p_completion_id uuid, p_pieces jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.session_pieces
    (athlete_id, completion_id, position, kind, distance, distance_unit, duration_seconds, pace_seconds)
  select p_athlete_id, p_completion_id,
         (row_number() over ())::smallint,
         piece ->> 'kind',
         nullif(piece ->> 'distance', '')::numeric,
         case when nullif(piece ->> 'distance', '') is null then null
              else coalesce(piece ->> 'distanceUnit', 'mi') end,
         nullif(piece ->> 'durationSeconds', '')::integer,
         nullif(piece ->> 'paceSeconds', '')::integer
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) as piece;
end;
$$;

create or replace function public.correct_session(
  p_completion_id       uuid,
  p_reason              text,
  p_status              text        default null,
  p_planned_session_id  uuid        default null,
  p_actual_distance     numeric     default null,
  p_duration_seconds    integer     default null,
  p_rpe                 smallint    default null,
  p_surface             text        default null,
  p_temperature_f       smallint    default null,
  p_conditions          text        default null,
  p_athlete_note        text        default null,
  p_filed_at            timestamptz default null,
  p_pieces              jsonb       default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  changed_since timestamptz := clock_timestamp();
begin
  select athlete_id into owner_id from public.session_completions where id = p_completion_id;
  if owner_id is null then raise exception 'No such session'; end if;
  if not public.is_coach_member(owner_id) then raise exception 'Not your athlete'; end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'A correction needs a reason. It is what makes the earlier reading legible later.';
  end if;

  -- The planned session is deliberately not settable here. Moving a completion to
  -- a different session is a change of identity, and the identity guard refuses it.
  update public.session_completions
     set status          = coalesce(p_status, status),
         actual_distance = coalesce(p_actual_distance, actual_distance),
         duration_seconds= coalesce(p_duration_seconds, duration_seconds),
         rpe             = coalesce(p_rpe, rpe),
         surface         = coalesce(p_surface, surface),
         temperature_f   = coalesce(p_temperature_f, temperature_f),
         conditions      = coalesce(p_conditions, conditions),
         athlete_note    = coalesce(p_athlete_note, athlete_note),
         filed_at        = coalesce(p_filed_at, filed_at)
   where id = p_completion_id;

  -- Null means the splits were not part of this correction. An empty array means
  -- the correction says there are none. Those are different instructions.
  if p_pieces is not null then
    delete from public.session_pieces where completion_id = p_completion_id;
    perform public.write_pieces(owner_id, p_completion_id, p_pieces);
  end if;

  -- Every revision this correction produced, completion and pieces alike, carries
  -- the same sentence.
  update public.completion_revisions
     set reason = btrim(p_reason)
   where completion_id = p_completion_id
     and changed_at >= changed_since
     and reason is null;
end;
$$;

revoke all on function public.write_pieces(uuid, uuid, jsonb) from public;
revoke all on function public.file_session(uuid, text, uuid, numeric, text, integer, smallint, text, smallint, text, text, timestamptz, jsonb) from public;
revoke all on function public.correct_session(uuid, text, text, uuid, numeric, integer, smallint, text, smallint, text, text, timestamptz, jsonb) from public;
grant execute on function public.file_session(uuid, text, uuid, numeric, text, integer, smallint, text, smallint, text, text, timestamptz, jsonb) to authenticated;
grant execute on function public.correct_session(uuid, text, text, uuid, numeric, integer, smallint, text, smallint, text, text, timestamptz, jsonb) to authenticated;

-- No way around the path. Coach filing and coach correction now happen only
-- through the functions above, which is what makes the law a law.
drop policy if exists completions_coach_insert on public.session_completions;
drop policy if exists completions_coach_update on public.session_completions;
