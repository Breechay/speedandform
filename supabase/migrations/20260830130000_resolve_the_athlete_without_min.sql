-- min(uuid) is not a function, and the filing door called it.
--
-- Resolving the caller's athlete used `select count(*), min(athlete_id)`, which
-- fails outright: Postgres has no min() over uuid. Every athlete filing would have
-- errored. It survived the first round of proofs because those ran as a coach, and a
-- coach never reached this line — which is exactly the reason a coach identity
-- cannot stand in for an athlete one when proving an athlete path.

create or replace function public.record_session_from_form(
  p_evidence_id        text,
  p_status             text,
  p_planned_session_id uuid        default null,
  p_actual_distance    numeric     default null,
  p_distance_unit      text        default 'mi',
  p_duration_seconds   integer     default null,
  p_rpe                integer     default null,
  p_athlete_note       text        default null,
  p_symptoms           text        default null,
  p_surface            text        default null,
  p_conditions         text        default null,
  p_filed_at           timestamptz default null,
  p_pieces             jsonb       default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  athlete uuid;
  memberships integer;
  existing public.session_completions;
  new_id uuid;
  session_owner uuid;
begin
  select count(*) into memberships
    from public.athlete_memberships
   where user_id = auth.uid() and role = 'athlete' and status = 'active';

  if memberships = 0 then
    raise exception 'Only an athlete files through this door';
  end if;
  if memberships > 1 then
    raise exception 'This account is an athlete on more than one record';
  end if;

  select athlete_id into athlete
    from public.athlete_memberships
   where user_id = auth.uid() and role = 'athlete' and status = 'active'
   limit 1;

  if coalesce(btrim(p_evidence_id), '') = '' then
    raise exception 'A filing carries the receipt id it came from';
  end if;
  if coalesce(p_status, '') not in ('completed', 'partial', 'changed', 'skipped') then
    raise exception 'Unknown status: %', coalesce(p_status, 'missing');
  end if;
  if p_rpe is not null and (p_rpe < 1 or p_rpe > 10) then
    raise exception 'A reported effort is 1 to 10, not %', p_rpe;
  end if;
  if p_planned_session_id is not null then
    select athlete_id into session_owner from public.planned_sessions where id = p_planned_session_id;
    if session_owner is distinct from athlete then
      raise exception 'That session belongs to a different athlete';
    end if;
  end if;
  if coalesce(p_filed_at, now()) > now() + interval '1 day' then
    raise exception 'A session cannot be filed in the future';
  end if;

  select * into existing from public.session_completions
   where athlete_id = athlete and evidence_id = p_evidence_id;

  if existing.id is not null then
    if p_rpe is not null and existing.rpe is distinct from p_rpe then
      update public.session_completions
         set rpe = p_rpe,
             symptoms = coalesce(p_symptoms, symptoms),
             athlete_note = coalesce(p_athlete_note, athlete_note),
             updated_at = now()
       where id = existing.id;
    elsif p_symptoms is not null or p_athlete_note is not null then
      update public.session_completions
         set symptoms = coalesce(p_symptoms, symptoms),
             athlete_note = coalesce(p_athlete_note, athlete_note),
             updated_at = now()
       where id = existing.id;
    end if;
    return existing.id;
  end if;

  insert into public.session_completions (
    athlete_id, planned_session_id, status, actual_distance, distance_unit,
    duration_seconds, rpe, surface, conditions, athlete_note, symptoms,
    evidence_id, source, filed_by, filed_at
  ) values (
    athlete, p_planned_session_id, p_status, p_actual_distance,
    coalesce(p_distance_unit, 'mi'), p_duration_seconds, p_rpe, p_surface,
    p_conditions, p_athlete_note, p_symptoms,
    p_evidence_id, 'form', auth.uid(), coalesce(p_filed_at, now())
  )
  returning id into new_id;

  perform public.write_pieces(athlete, new_id, p_pieces);
  return new_id;
end;
$$;
