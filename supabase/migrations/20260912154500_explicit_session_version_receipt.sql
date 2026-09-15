-- A filed session must be able to name the exact immutable prescription the
-- athlete saw. Timestamp inference remains only for legacy/browser history.

alter table public.session_completions
  add column if not exists planned_session_version_id uuid;

alter table public.planned_session_versions
  add constraint planned_session_versions_receipt_identity_key
  unique (id, planned_session_id, athlete_id);

alter table public.session_completions
  add constraint completion_version_requires_session
  check (planned_session_version_id is null or planned_session_id is not null),
  add constraint form_planned_completion_requires_version
  check (source <> 'form' or planned_session_id is null or planned_session_version_id is not null),
  add constraint completions_version_session_athlete_fk
  foreign key (planned_session_version_id, planned_session_id, athlete_id)
  references public.planned_session_versions(id, planned_session_id, athlete_id)
  on delete restrict;

comment on column public.session_completions.planned_session_version_id is
  'Immutable prescription receipt: the exact planned_session_versions row rendered when this completion was filed. New FORM planned filings require it; legacy/browser rows may remain null.';

-- Backfill only where the historical timestamp can identify a version that
-- already existed when the filing happened. Older coach imports that predate
-- their reconstructed authored version stay null rather than inventing history.
-- This is metadata repair, not an athlete correction, so do not create audit
-- revisions or move updated_at while filling it.
alter table public.session_completions disable trigger session_completion_audit;
alter table public.session_completions disable trigger session_completions_set_updated_at;

update public.session_completions sc
   set planned_session_version_id = (
     select v.id
       from public.planned_session_versions v
      where v.planned_session_id = sc.planned_session_id
        and v.created_at <= sc.filed_at
      order by v.version_number desc
      limit 1
   )
 where sc.planned_session_id is not null
   and sc.planned_session_version_id is null
   and exists (
     select 1
       from public.planned_session_versions v
      where v.planned_session_id = sc.planned_session_id
        and v.created_at <= sc.filed_at
   );

alter table public.session_completions enable trigger session_completions_set_updated_at;
alter table public.session_completions enable trigger session_completion_audit;

create or replace function public.protect_completion_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
begin
  if auth.uid() is not null then
    if new.athlete_id <> old.athlete_id
      or new.planned_session_id is distinct from old.planned_session_id
      or new.planned_session_version_id is distinct from old.planned_session_version_id
      or new.source <> old.source
      or (
        new.filed_by is distinct from old.filed_by
        and not (old.filed_by is null and old.source = 'coach_import' and new.filed_by = auth.uid())
      )
    then
      raise exception 'Completion ownership cannot be changed';
    end if;
  end if;
  return new;
end;
$fn$;

-- Replace the old signature rather than leaving an overload that PostgREST could
-- resolve ambiguously. Existing named callers remain source-compatible because
-- the new version argument is trailing and optional, but a planned FORM filing
-- now refuses to proceed unless that exact version is supplied.
drop function if exists public.record_session_from_form(
  text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb
);
drop function if exists public.record_session_from_form_impl(
  text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb
);

create function public.record_session_from_form_impl(
  p_evidence_id text,
  p_status text,
  p_planned_session_id uuid default null,
  p_actual_distance numeric default null,
  p_distance_unit text default 'mi',
  p_duration_seconds integer default null,
  p_rpe integer default null,
  p_athlete_note text default null,
  p_symptoms text default null,
  p_surface text default null,
  p_conditions text default null,
  p_filed_at timestamptz default null,
  p_pieces jsonb default '[]'::jsonb,
  p_planned_session_version_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $fn$
declare
  athlete uuid;
  memberships integer;
  existing public.session_completions;
  new_id uuid;
  session_owner uuid;
  version_owner uuid;
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

  if p_planned_session_id is null then
    if p_planned_session_version_id is not null then
      raise exception 'A session version cannot be filed without its planned session';
    end if;
  else
    if p_planned_session_version_id is null then
      raise exception 'A planned FORM filing must carry the exact session version it rendered';
    end if;

    select athlete_id into session_owner
      from public.planned_sessions
     where id = p_planned_session_id;
    if session_owner is distinct from athlete then
      raise exception 'That session belongs to a different athlete';
    end if;

    select athlete_id into version_owner
      from public.planned_session_versions
     where id = p_planned_session_version_id
       and planned_session_id = p_planned_session_id;
    if version_owner is distinct from athlete then
      raise exception 'That session version does not belong to this athlete and session';
    end if;
  end if;

  if coalesce(p_filed_at, now()) > now() + interval '1 day' then
    raise exception 'A session cannot be filed in the future';
  end if;

  select * into existing
    from public.session_completions
   where athlete_id = athlete and evidence_id = p_evidence_id;

  if existing.id is not null then
    if existing.planned_session_id is distinct from p_planned_session_id
       or existing.planned_session_version_id is distinct from p_planned_session_version_id then
      raise exception 'That receipt already belongs to a different prescription';
    end if;

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
    athlete_id, planned_session_id, planned_session_version_id,
    status, actual_distance, distance_unit, duration_seconds, rpe,
    surface, conditions, athlete_note, symptoms,
    evidence_id, source, filed_by, filed_at
  ) values (
    athlete, p_planned_session_id, p_planned_session_version_id,
    p_status, p_actual_distance, coalesce(p_distance_unit, 'mi'),
    p_duration_seconds, p_rpe, p_surface, p_conditions,
    p_athlete_note, p_symptoms, p_evidence_id, 'form', auth.uid(),
    coalesce(p_filed_at, now())
  ) returning id into new_id;

  perform public.write_pieces(athlete, new_id, p_pieces);
  return new_id;
end;
$fn$;

create function public.record_session_from_form(
  p_evidence_id text,
  p_status text,
  p_planned_session_id uuid default null,
  p_actual_distance numeric default null,
  p_distance_unit text default 'mi',
  p_duration_seconds integer default null,
  p_rpe integer default null,
  p_athlete_note text default null,
  p_symptoms text default null,
  p_surface text default null,
  p_conditions text default null,
  p_filed_at timestamptz default null,
  p_pieces jsonb default '[]'::jsonb,
  p_planned_session_version_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $fn$
begin
  if not public.coaching_sync_enabled() then
    raise exception 'coaching_sync_paused: %',
      coalesce((select paused_reason from public.coaching_sync_state where id), 'sync is paused');
  end if;
  return public.record_session_from_form_impl(
    p_evidence_id, p_status, p_planned_session_id, p_actual_distance, p_distance_unit,
    p_duration_seconds, p_rpe, p_athlete_note, p_symptoms, p_surface, p_conditions,
    p_filed_at, p_pieces, p_planned_session_version_id
  );
end;
$fn$;

grant execute on function public.record_session_from_form(
  text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb, uuid
) to authenticated;

-- Evidence interpretation prefers the explicit receipt. Legacy rows that could
-- not be backfilled keep the timestamp fallback they already had.
create or replace view public.mark_established_value
with (security_invoker = true) as
select m.id as mark_id,
       m.athlete_id,
       max(p.distance) as established_value,
       max(sc.filed_at) as established_at,
       count(*) as qualifying_segments
from public.session_completions sc
join public.planned_sessions s
  on s.id = sc.planned_session_id
 and s.state <> 'cancelled'
join lateral (
  select v.*
    from public.planned_session_versions v
   where (sc.planned_session_version_id is not null and v.id = sc.planned_session_version_id)
      or (sc.planned_session_version_id is null
          and v.planned_session_id = s.id
          and v.created_at <= sc.filed_at)
   order by (v.id = sc.planned_session_version_id) desc, v.version_number desc
   limit 1
) v on true
join public.planned_session_components c
  on c.version_id = v.id
 and c.counts_toward_mark_id is not null
join public.athlete_marks m on m.id = c.counts_toward_mark_id
join public.session_pieces p on p.completion_id = sc.id
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
  'What filed evidence has established against a mark. New FORM filings use the explicit immutable planned_session_version_id receipt; legacy rows may fall back to the newest version that existed when filed. Broken work is never summed.';

create or replace view public.session_verdicts
with (security_invoker = true) as
with prescribed as (
  select c.id as completion_id,
         c.athlete_id,
         c.rpe,
         c.filed_at,
         public.pace_text_to_seconds(v.pace_low) as pace_low,
         public.pace_text_to_seconds(v.pace_high) as pace_high,
         v.rpe_low,
         v.rpe_high,
         v.title
    from public.session_completions c
    join lateral (
      select pv.*
        from public.planned_session_versions pv
       where (c.planned_session_version_id is not null and pv.id = c.planned_session_version_id)
          or (c.planned_session_version_id is null
              and pv.planned_session_id = c.planned_session_id
              and pv.created_at <= c.filed_at)
       order by (pv.id = c.planned_session_version_id) desc, pv.version_number desc
       limit 1
    ) v on true
), easy as (
  select completion_id, avg(pace_seconds)::integer as easy_pace
    from public.session_pieces
   where kind in ('warmup', 'cooldown') and pace_seconds is not null
   group by completion_id
), reps as (
  select p.completion_id,
         count(*) as total,
         count(*) filter (
           where pr.pace_low is not null
             and p.pace_seconds >= pr.pace_low
             and p.pace_seconds <= pr.pace_high
         ) as inside
    from public.session_pieces p
    join prescribed pr on pr.completion_id = p.completion_id
   where p.kind = 'rep' and p.pace_seconds is not null
   group by p.completion_id
), floats as (
  select p.completion_id,
         count(*) as total,
         count(*) filter (where (p.pace_seconds - e.easy_pace) <= 45) as honest
    from public.session_pieces p
    join easy e on e.completion_id = p.completion_id
   where p.kind = 'float' and p.pace_seconds is not null
   group by p.completion_id
)
select pr.completion_id,
       pr.athlete_id,
       pr.title,
       r.total as reps,
       r.inside as reps_inside,
       case
         when pr.pace_low is null then 'not prescribed'::text
         when r.total is null then 'no reps'::text
         when r.inside = r.total then 'inside'::text
         else 'outside'::text
       end as pace_verdict,
       f.total as floats,
       f.honest as floats_honest,
       case
         when f.total is null then 'none'::text
         when f.honest = f.total then 'inside'::text
         else 'outside'::text
       end as float_verdict,
       pr.rpe,
       pr.rpe_low,
       pr.rpe_high,
       case
         when pr.rpe is null or pr.rpe_low is null then 'not prescribed'::text
         when pr.rpe >= pr.rpe_low and pr.rpe <= pr.rpe_high then 'inside'::text
         else 'outside'::text
       end as effort_verdict,
       e.easy_pace
  from prescribed pr
  left join easy e on e.completion_id = pr.completion_id
  left join reps r on r.completion_id = pr.completion_id
  left join floats f on f.completion_id = pr.completion_id;

grant select on public.session_verdicts to authenticated;
