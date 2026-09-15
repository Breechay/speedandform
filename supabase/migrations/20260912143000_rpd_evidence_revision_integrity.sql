-- Race Pace Durability audit follow-up: evidence must remain attached to the
-- prescription that existed when it was filed, and coach corrections must leave
-- a reason on the exact revision rows they create.
--
-- This migration changes no athlete prescription and no mark value deliberately.
-- A preflight comparison on 2026-09-12 showed the version-scoped ownership query
-- returns the same current values for Hope and Jose as the existing view.

-- ── 1. Coach correction reasons belong to the revisions from THIS correction ──
--
-- The previous function captured clock_timestamp() and then tried to find audit
-- rows whose changed_at >= that value. The audit triggers use the column default
-- now(), which is the transaction timestamp, so those rows can be earlier than
-- clock_timestamp() even though they were just inserted. Result: a successful
-- coach correction could leave its revision.reason null.
--
-- Snapshot the pre-existing revision ids instead. After the update / piece
-- replacement, only newly-created revision rows are stamped with this reason.

create or replace function public.correct_session(
  p_completion_id uuid,
  p_reason text,
  p_status text default null,
  p_planned_session_id uuid default null,
  p_actual_distance numeric default null,
  p_duration_seconds integer default null,
  p_rpe smallint default null,
  p_surface text default null,
  p_temperature_f smallint default null,
  p_conditions text default null,
  p_athlete_note text default null,
  p_filed_at timestamptz default null,
  p_pieces jsonb default null
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $fn$
declare
  owner_id uuid;
  existing_revision_ids uuid[] := '{}'::uuid[];
begin
  select athlete_id into owner_id
    from public.session_completions
   where id = p_completion_id;

  if owner_id is null then raise exception 'No such session'; end if;
  if not public.is_coach_member(owner_id) then raise exception 'Not your athlete'; end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'A correction needs a reason. It is what makes the earlier reading legible later.';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
    into existing_revision_ids
    from public.completion_revisions
   where completion_id = p_completion_id;

  -- The planned session is deliberately not settable here. Moving a completion
  -- to a different session changes identity and is refused by the identity guard.
  update public.session_completions
     set status           = coalesce(p_status, status),
         actual_distance  = coalesce(p_actual_distance, actual_distance),
         duration_seconds = coalesce(p_duration_seconds, duration_seconds),
         rpe              = coalesce(p_rpe, rpe),
         surface          = coalesce(p_surface, surface),
         temperature_f    = coalesce(p_temperature_f, temperature_f),
         conditions       = coalesce(p_conditions, conditions),
         athlete_note     = coalesce(p_athlete_note, athlete_note),
         filed_at         = coalesce(p_filed_at, filed_at)
   where id = p_completion_id;

  -- Null means splits were not part of this correction. An empty array means the
  -- correction says there are none. Those are different instructions.
  if p_pieces is not null then
    delete from public.session_pieces where completion_id = p_completion_id;
    perform public.write_pieces(owner_id, p_completion_id, p_pieces);
  end if;

  update public.completion_revisions
     set reason = btrim(p_reason)
   where completion_id = p_completion_id
     and reason is null
     and not (id = any(existing_revision_ids));
end;
$fn$;

-- ── 2. Ownership reads the version that existed when the run was filed ─────
--
-- planned_session_components belong to immutable session versions. The previous
-- view joined a completion to every version of its planned session. A later
-- revision could therefore make old evidence eligible against a prescription the
-- athlete never ran. Select one effective version first: newest version authored
-- no later than the filing timestamp.
--
-- This is still inference. The plan-guided app release must ultimately stamp an
-- explicit planned_session_version_id on the filing receipt; that larger schema
-- change is intentionally not hidden inside this audit repair.

create or replace view public.mark_established_value
with (security_invoker = true) as
select m.id                          as mark_id,
       m.athlete_id,
       max(p.distance)               as established_value,
       max(sc.filed_at)              as established_at,
       count(*)                      as qualifying_segments
from public.session_completions sc
join public.planned_sessions s
  on s.id = sc.planned_session_id
 and s.state <> 'cancelled'
join lateral (
  select v.*
    from public.planned_session_versions v
   where v.planned_session_id = s.id
     and v.created_at <= sc.filed_at
   order by v.version_number desc
   limit 1
) v on true
join public.planned_session_components c
  on c.version_id = v.id
 and c.counts_toward_mark_id is not null
join public.athlete_marks m
  on m.id = c.counts_toward_mark_id
join public.session_pieces p
  on p.completion_id = sc.id
where p.distance is not null
  and p.distance_unit = 'mi'
  and p.pace_seconds is not null
  and c.pace_low_seconds is not null
  and c.pace_high_seconds is not null
  and p.pace_seconds >= c.pace_low_seconds
  and p.pace_seconds <= c.pace_high_seconds
group by m.id, m.athlete_id;

grant select on public.mark_established_value to authenticated;

comment on view public.mark_established_value is
  'What filed evidence has established against a mark. Eligibility is authored on components, and each filing is evaluated only against the newest immutable session version that existed when it was filed. Longest single uninterrupted qualifying piece wins; broken work is never summed.';
