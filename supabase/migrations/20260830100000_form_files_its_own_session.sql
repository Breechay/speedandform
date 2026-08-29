-- FORM sends what happened. This decides what it means.
--
-- file_session is the coach's path and requires is_coach_member, so an athlete
-- cannot file their own run through it at all; it also stamps source as
-- 'coach_import' and declares p_rpe as smallint, which PostgREST cannot resolve
-- against the integer a JSON number arrives as. The same smallint mistake made every
-- confidence Override uncallable until this week.
--
-- So the app gets its own door, and the door enforces the division of labour: the
-- app sends raw facts and nothing else. No classification, no verdict, no
-- confidence. If the phone ever formed an opinion there would be two evaluators in
-- the world and no way to reconcile them, which is the whole reason the Console's
-- numbers can be trusted at all.
--
-- Objective evidence goes up the moment the session closes. The reported effort
-- usually arrives later, because the athlete is asked afterwards and may not answer
-- at once — so this is idempotent on the app's own receipt id: the first call files
-- the run, a later call with the same id attaches the effort without rewriting
-- anything else, and a changed value is a correction that keeps what it replaced.

alter table public.session_completions
  add column if not exists evidence_id text,
  add column if not exists symptoms text;

comment on column public.session_completions.evidence_id is
  'The app''s own receipt identifier. Idempotency key: a retried upload attaches to the same filing rather than creating a second one.';
comment on column public.session_completions.symptoms is
  'What the athlete reported feeling wrong, kept apart from athlete_note on purpose. Coach attention; never an automatic confidence penalty.';

create unique index if not exists session_completions_evidence_idx
  on public.session_completions (athlete_id, evidence_id)
  where evidence_id is not null;

create or replace function public.record_session_from_form(
  p_athlete_id         uuid,
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
  existing public.session_completions;
  new_id uuid;
  session_owner uuid;
begin
  -- The athlete files their own; a coach may file on their behalf.
  if not (public.is_athlete_member(p_athlete_id) or public.is_coach_member(p_athlete_id)) then
    raise exception 'Not your session to file';
  end if;
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
    if session_owner is distinct from p_athlete_id then
      raise exception 'That session belongs to a different athlete';
    end if;
  end if;
  if coalesce(p_filed_at, now()) > now() + interval '1 day' then
    raise exception 'A session cannot be filed in the future';
  end if;

  select * into existing from public.session_completions
   where athlete_id = p_athlete_id and evidence_id = p_evidence_id;

  if existing.id is not null then
    -- The effort arriving after the run is the ordinary case, not a correction.
    -- Everything else about the filing is left exactly as it was: this call is not
    -- a chance to quietly restate the objective evidence.
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
    p_athlete_id, p_planned_session_id, p_status, p_actual_distance,
    coalesce(p_distance_unit, 'mi'), p_duration_seconds, p_rpe, p_surface,
    p_conditions, p_athlete_note, p_symptoms,
    p_evidence_id, 'form', auth.uid(), coalesce(p_filed_at, now())
  )
  returning id into new_id;

  perform public.write_pieces(p_athlete_id, new_id, p_pieces);
  return new_id;
end;
$$;

revoke all on function public.record_session_from_form(uuid, text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb) from public, anon;
grant execute on function public.record_session_from_form(uuid, text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb) to authenticated;

comment on function public.record_session_from_form is
  'The app''s filing door. Raw facts only: no classification, no verdict, no confidence — those are computed here and nowhere else. Idempotent on the app''s receipt id so objective evidence can go up immediately and the reported effort can follow whenever the athlete answers.';

-- Smallint on an RPC parameter is a call PostgREST cannot resolve. The coach's path
-- has the same defect and would fail the moment anything called it with a JSON
-- number, so it is widened here too rather than left as a trap for the next caller.
do $$
declare bad text;
begin
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ')
    into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('record_session_from_form')
     and pg_get_function_identity_arguments(p.oid) like '%smallint%';
  if bad is not null then raise exception 'smallint parameters survive on: %', bad; end if;
end $$;
