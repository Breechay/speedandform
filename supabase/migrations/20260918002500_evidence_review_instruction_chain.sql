-- Evidence -> coach review -> next instruction, kept as three distinct facts.
-- This migration is additive. Existing reads, directions, completions and prescription
-- versions are not rewritten.

alter table public.directions
  add column if not exists based_on_read_id uuid references public.reads(id) on delete restrict;

create index if not exists directions_based_on_read_id_idx
  on public.directions (based_on_read_id)
  where based_on_read_id is not null;

create or replace function public.publish_review_and_direction(
  p_athlete_id uuid,
  p_completion_ids uuid[],
  p_read_athlete_text text,
  p_question_answered text,
  p_planned_session_id uuid,
  p_direction_athlete_text text,
  p_protected_variable text,
  p_movable_variable text default null,
  p_stop_or_change_if text default null,
  p_priority_targets jsonb default '[]'::jsonb,
  p_execution_context jsonb default '{}'::jsonb,
  p_delivery_state text default 'published',
  p_read_delivered_wording text default null,
  p_direction_delivered_wording text default null,
  p_existing_read_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_user uuid := auth.uid();
  v_read_id uuid;
  v_direction_id uuid;
  v_completion_count integer;
begin
  if v_user is null then
    raise exception 'Sign in before publishing coaching.';
  end if;
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'Only this athlete''s coach can publish coaching.';
  end if;
  if p_existing_read_id is null then
    if coalesce(cardinality(p_completion_ids), 0) = 0 then
      raise exception 'A review must point at the evidence it reviewed.';
    end if;
    if nullif(btrim(coalesce(p_read_athlete_text, '')), '') is null
       or nullif(btrim(coalesce(p_question_answered, '')), '') is null then
      raise exception 'A review needs both athlete wording and the question it answered.';
    end if;
  end if;
  if nullif(btrim(coalesce(p_direction_athlete_text, '')), '') is null
     or nullif(btrim(coalesce(p_protected_variable, '')), '') is null then
    raise exception 'The next instruction needs athlete wording and the thing being protected.';
  end if;
  if p_delivery_state not in ('published', 'delivered_externally') then
    raise exception 'This action publishes coaching; delivery state must be published or delivered externally.';
  end if;
  if p_delivery_state = 'delivered_externally'
     and (nullif(btrim(coalesce(p_read_delivered_wording, '')), '') is null
       or nullif(btrim(coalesce(p_direction_delivered_wording, '')), '') is null) then
    raise exception 'External delivery must preserve the exact wording that was delivered.';
  end if;

  if p_existing_read_id is null then
    select count(distinct c.id)
      into v_completion_count
      from public.session_completions c
     where c.id = any(p_completion_ids)
       and c.athlete_id = p_athlete_id;

    if v_completion_count <> cardinality(p_completion_ids) then
      raise exception 'Every reviewed completion must belong to this athlete.';
    end if;
  else
    select r.id into v_read_id
      from public.reads r
     where r.id = p_existing_read_id
       and r.athlete_id = p_athlete_id
       and r.delivery_state in ('published', 'delivered_externally');
    if v_read_id is null then
      raise exception 'The existing review is not a published review for this athlete.';
    end if;
  end if;

  if not exists (
    select 1
      from public.planned_sessions s
     where s.id = p_planned_session_id
       and s.athlete_id = p_athlete_id
       and coalesce(s.state, '') <> 'cancelled'
       and s.withdrawn_at is null
  ) then
    raise exception 'The next instruction must point at a live session for this athlete.';
  end if;

  if p_existing_read_id is null then
    insert into public.reads (
      athlete_id, athlete_text, question_answered, delivery_state,
      delivered_wording, authored_by, published_at
    ) values (
      p_athlete_id, btrim(p_read_athlete_text), btrim(p_question_answered),
      p_delivery_state, p_read_delivered_wording, v_user, now()
    ) returning id into v_read_id;

    insert into public.read_completions (read_id, completion_id)
    select v_read_id, completion_id
      from unnest(p_completion_ids) completion_id;
  end if;

  insert into public.directions (
    athlete_id, planned_session_id, protected_variable, movable_variable,
    stop_or_change_if, priority_targets, execution_context, athlete_text,
    delivery_state, delivered_wording, authored_by, published_at,
    based_on_read_id
  ) values (
    p_athlete_id, p_planned_session_id, btrim(p_protected_variable),
    nullif(btrim(coalesce(p_movable_variable, '')), ''),
    nullif(btrim(coalesce(p_stop_or_change_if, '')), ''),
    coalesce(p_priority_targets, '[]'::jsonb),
    coalesce(p_execution_context, '{}'::jsonb),
    btrim(p_direction_athlete_text), p_delivery_state,
    p_direction_delivered_wording, v_user, now(), v_read_id
  ) returning id into v_direction_id;

  return jsonb_build_object('read_id', v_read_id, 'direction_id', v_direction_id);
end;
$fn$;

revoke all on function public.publish_review_and_direction(
  uuid, uuid[], text, text, uuid, text, text, text, text, jsonb, jsonb, text, text, text, uuid
) from public, anon;

grant execute on function public.publish_review_and_direction(
  uuid, uuid[], text, text, uuid, text, text, text, text, jsonb, jsonb, text, text, text, uuid
) to authenticated;
