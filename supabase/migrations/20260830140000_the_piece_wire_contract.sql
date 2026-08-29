-- The keys a filed piece may carry, named once, and enforced.
--
-- write_pieces read `durationSeconds` and ignored everything it did not recognise.
-- A payload sending `duration_seconds` was accepted in full: the reps were stored,
-- their times silently became null, and every consistency factor that reads elapsed
-- time stopped firing without a single error. It cost a proof run that scored 45
-- where the same evidence should have scored 50, and it would have cost real
-- evidence the same way.
--
-- Silently ignoring an unknown key is the defect. A caller who misspells a
-- measurement should be told, not quietly given a filing with a hole in it.
--
-- Compatibility, where it is needed, is an explicit alias with a name. There is no
-- path here by which a key is dropped because nobody thought about it.

create or replace function public.piece_wire_keys()
returns table (key text, kind text)
language sql immutable as $$
  values
    ('kind',            'canonical'),
    ('distance',        'canonical'),
    ('distanceUnit',    'canonical'),
    ('durationSeconds', 'canonical'),
    ('paceSeconds',     'canonical'),
    -- Position is assigned server-side from array order; a caller may send it and
    -- it is accepted and ignored, because the order is the fact and the number is
    -- ours. Named here so that ignoring it is a decision rather than an accident.
    ('position',        'accepted_ignored');
$$;

comment on function public.piece_wire_keys is
  'The complete set of keys a filed piece may carry. Anything else is refused rather than dropped: a caller who misspells a measurement gets an error, not a filing with a hole in it.';

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

  -- Every rejection happens before anything is written, so a bad piece halfway
  -- down cannot leave a session holding half its splits.
  select k into bad
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) as piece,
         jsonb_object_keys(piece) as k
   where k not in (select key from public.piece_wire_keys())
   limit 1;
  if bad is not null then
    raise exception 'Unknown key on a filed piece: %. Accepted keys are %',
      bad, (select string_agg(key, ', ' order by key) from public.piece_wire_keys());
  end if;

  select piece ->> 'kind' into bad
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) as piece
   where coalesce(piece ->> 'kind', '') not in ('warmup', 'rep', 'float', 'cooldown')
   limit 1;
  if bad is not null then
    raise exception 'Unknown piece kind: %', coalesce(bad, 'missing');
  end if;

  -- A rep with neither a distance nor a duration is not evidence of anything. It
  -- would sit in the record looking like a filed interval and answer no question
  -- ever asked of it, which is worse than not being there.
  select piece ->> 'kind' into bad
    from jsonb_array_elements(coalesce(p_pieces, '[]'::jsonb)) as piece
   where piece ->> 'kind' = 'rep'
     and nullif(piece ->> 'distance', '') is null
     and nullif(piece ->> 'durationSeconds', '') is null
   limit 1;
  if bad is not null then
    raise exception 'A filed rep carries a distance, a duration, or both';
  end if;

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

do $$
declare msg text; ok boolean := true;
begin
  -- The exact defect, refused.
  begin
    perform public.write_pieces(gen_random_uuid(), gen_random_uuid(),
      '[{"kind":"rep","distance":1.0,"duration_seconds":389}]'::jsonb);
    ok := false;
  exception when others then null; end;
  if not ok then raise exception 'a snake_case measurement key is still accepted silently'; end if;

  begin
    perform public.write_pieces(gen_random_uuid(), gen_random_uuid(), '[{"kind":"rep"}]'::jsonb);
    ok := false;
  exception when others then null; end;
  if not ok then raise exception 'a rep with no measurement at all is still accepted'; end if;
end $$;
