-- 44.6 Vault attempt. An attempt is an ordinary filed completion that points at
-- the exact immutable Vault version. It rides the one filing door
-- (record_session_from_form), so Week, Speed and the feed see it exactly once.
-- Only an athlete files for themselves; Mirror and coaches have no door here.
-- Rep times arrive in tenths; the whole-second piece stays the receipt and the
-- exact value is stored beside it.

create or replace function public.file_vault_attempt(
  p_evidence_id text,
  p_vault_version_id uuid,
  p_reps_ms integer[],
  p_timing_source text default 'timer',
  p_filed_at timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $fn$
declare
  athlete uuid;
  athlete_memberships integer;
  completion uuid;
  filed_athlete uuid;
  filed_version uuid;
  filed_timing_source text;
  expected integer;
  stored_reps_ms integer[];
  pieces jsonb;
  distances integer[];
begin
  select count(*), min(athlete_id)
    into athlete_memberships, athlete
    from public.coaching_athlete_memberships();
  if athlete_memberships = 0 then
    raise exception 'Only an athlete files through this door';
  end if;
  if athlete_memberships <> 1 then
    raise exception 'This account is an athlete on more than one record';
  end if;
  if p_timing_source not in ('stopwatch','lap','timer','text') then
    raise exception 'Unknown timing source: %', p_timing_source;
  end if;

  select array_agg((b.block->>'distanceMeters')::integer order by b.ord, rep.rep)
    into distances
    from public.vault_session_versions v
    cross join lateral jsonb_array_elements(v.blocks) with ordinality as b(block, ord)
    cross join lateral generate_series(1, (b.block->>'reps')::integer) as rep(rep)
   where v.id = p_vault_version_id;
  if distances is null then raise exception 'Unknown Vault version'; end if;
  expected := array_length(distances, 1);
  if coalesce(array_length(p_reps_ms, 1), 0) <> expected then
    raise exception 'A Vault attempt carries one time per rep (expected %)', expected;
  end if;
  if exists (select 1 from unnest(p_reps_ms) t where t is null or t <= 0) then
    raise exception 'Every rep time is a positive number of milliseconds';
  end if;

  select jsonb_agg(jsonb_build_object(
           'kind', 'rep',
           'distance', distances[i],
           'distanceUnit', 'm',
           'durationSeconds', round(p_reps_ms[i] / 1000.0)::integer
         ) order by i)
    into pieces
    from generate_series(1, expected) as i;

  completion := public.record_session_from_form(
    p_evidence_id, 'completed', null, null, 'm', null, null, null, null, null, null,
    p_filed_at, pieces, null
  );

  -- record_session_from_form is idempotent on (athlete, evidence_id). Lock the
  -- canonical receipt before attaching Vault evidence so a retry cannot move an
  -- attempt to another version, athlete, source, or set of exact rep times.
  select c.athlete_id, c.vault_session_version_id, c.timing_source
    into filed_athlete, filed_version, filed_timing_source
    from public.session_completions c
   where c.id = completion
   for update;
  select array_agg(round(coalesce(p.duration_seconds_exact,
                                  p.duration_seconds::numeric) * 1000)::integer
                   order by p.position)
    into stored_reps_ms
    from public.session_pieces p
   where p.completion_id = completion and p.kind = 'rep';

  if filed_athlete is distinct from athlete then
    raise exception 'That receipt belongs to a different athlete';
  end if;
  if filed_version is not null and filed_version is distinct from p_vault_version_id then
    raise exception 'That receipt already belongs to a different Vault version';
  end if;
  if filed_timing_source is not null and filed_timing_source is distinct from p_timing_source then
    raise exception 'That receipt already carries a different timing source';
  end if;
  if filed_version is not null and stored_reps_ms is distinct from p_reps_ms then
    raise exception 'That receipt already carries different rep times';
  end if;

  update public.session_pieces p
     set duration_seconds_exact = round(p_reps_ms[p.position] / 1000.0, 2)
   where p.completion_id = completion and p.kind = 'rep'
     and filed_version is null;
  update public.session_completions
     set vault_session_version_id = p_vault_version_id,
         timing_source = p_timing_source
   where id = completion and athlete_id = athlete
     and vault_session_version_id is null;
  return completion;
end;
$fn$;

revoke all on function public.file_vault_attempt(text, uuid, integer[], text, timestamptz) from public, anon;
grant execute on function public.file_vault_attempt(text, uuid, integer[], text, timestamptz) to authenticated;
