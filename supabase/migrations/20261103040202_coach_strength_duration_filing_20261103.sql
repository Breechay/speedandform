-- Coach-attested strength duration: separate from runs and immutable Forge receipts.
-- This does not create or impersonate a native Forge session/set log.
create table public.coach_strength_duration_completions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  strength_day_id uuid not null references public.form_training_strength_days(id),
  session_title text not null check (length(btrim(session_title)) between 1 and 120),
  performed_on date not null,
  duration_seconds integer not null check (duration_seconds between 1 and 43200),
  duration_source text not null check (
    duration_source in ('garmin_elapsed', 'athlete_reported', 'coach_observed')
  ),
  private_note text,
  filed_by uuid not null references auth.users(id),
  filed_at timestamptz not null default now(),
  superseded_by_strength_receipt_id text
    references public.forge_strength_receipts(receipt_id),
  constraint coach_strength_duration_one_per_day unique (strength_day_id),
  constraint coach_strength_duration_note_limit check (
    private_note is null or length(private_note) <= 2000
  )
);

create index coach_strength_duration_athlete_day
  on public.coach_strength_duration_completions(athlete_id, performed_on desc);

alter table public.coach_strength_duration_completions enable row level security;
revoke all on public.coach_strength_duration_completions from public, anon, authenticated;
grant select on public.coach_strength_duration_completions to authenticated;
create policy coach_strength_duration_member_read
  on public.coach_strength_duration_completions for select to authenticated
  using (public.is_coach_member(athlete_id));

-- An entry in the Collective field has exactly one immutable owning receipt.
alter table public.collective_work_posts
  add column source_coach_strength_duration_id uuid
  references public.coach_strength_duration_completions(id) on delete cascade;
alter table public.collective_work_posts
  drop constraint collective_work_one_source;
alter table public.collective_work_posts
  add constraint collective_work_one_source check (
    (source_completion_id is not null)::integer
    + (source_strength_receipt_id is not null)::integer
    + (source_coach_strength_duration_id is not null)::integer = 1
  );
alter table public.collective_work_posts
  add constraint collective_work_coach_strength_duration_unique
  unique (source_coach_strength_duration_id);

-- Same consent and roster gates as native Forge receipts; no unverified
-- movement/sets are added to this temporary duration-only entry.
create function collective_work_internal.publish_coach_strength_duration(
  rec public.coach_strength_duration_completions
) returns void
language plpgsql security definer set search_path = ''
as $function$
declare
  consent record;
  athlete_first text;
begin
  update public.collective_work_posts
     set revoked_at = now()
   where source_coach_strength_duration_id = rec.id
     and revoked_at is null;

  if rec.superseded_by_strength_receipt_id is not null then return; end if;
  select nullif(btrim(a.first_name), '') into athlete_first
    from public.athletes a where a.id = rec.athlete_id;
  if athlete_first is null then return; end if;

  for consent in
    select c.user_id
      from public.collective_work_consents c
     where c.athlete_id = rec.athlete_id
       and c.enabled and c.granted_at <= rec.filed_at
       and collective_work_internal.is_roster_athlete(c.athlete_id)
       and exists (
         select 1 from public.athlete_memberships m
          where m.athlete_id = c.athlete_id
            and m.user_id = c.user_id
            and m.role = 'athlete' and m.status = 'active'
       )
     order by c.user_id limit 1
  loop
    insert into public.collective_work_posts (
      source_coach_strength_duration_id, source_kind,
      athlete_id, owner_user_id, group_id, first_name,
      session_title, duration_seconds, set_count,
      movement_summary, filed_at, revoked_at
    ) values (
      rec.id, 'strength', rec.athlete_id, consent.user_id, null,
      athlete_first, rec.session_title, rec.duration_seconds,
      null, null, rec.filed_at, null
    )
    on conflict (source_coach_strength_duration_id) do update set
      athlete_id = excluded.athlete_id,
      owner_user_id = excluded.owner_user_id,
      first_name = excluded.first_name,
      session_title = excluded.session_title,
      duration_seconds = excluded.duration_seconds,
      set_count = null,
      movement_summary = null,
      filed_at = excluded.filed_at,
      revoked_at = null;
  end loop;
end;
$function$;

revoke all on function collective_work_internal.publish_coach_strength_duration(
  public.coach_strength_duration_completions
) from public, anon, authenticated;

create function collective_work_internal.sync_coach_strength_duration()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  perform collective_work_internal.publish_coach_strength_duration(new);
  return new;
end;
$function$;

revoke all on function collective_work_internal.sync_coach_strength_duration()
  from public, anon, authenticated;

create trigger collective_work_coach_strength_duration_published
after insert or update of superseded_by_strength_receipt_id
on public.coach_strength_duration_completions
for each row execute function collective_work_internal.sync_coach_strength_duration();

-- A true native Forge receipt, if received later and published under the
-- athlete's existing consent, supersedes the temporary duration-only card.
-- It does not rewrite the original coach-attested evidence.
create function collective_work_internal.reconcile_native_strength_duration()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if new.completed_at is null or new.submitted_by is null then return new; end if;
  if not exists (
    select 1 from public.collective_work_posts p
     where p.source_strength_receipt_id = new.receipt_id
       and p.revoked_at is null
  ) then return new; end if;

  update public.coach_strength_duration_completions m
     set superseded_by_strength_receipt_id = new.receipt_id
   where m.athlete_id = new.athlete_id
     and m.performed_on = (new.completed_at at time zone 'America/New_York')::date
     and lower(btrim(m.session_title)) = lower(btrim(new.session_name))
     and m.superseded_by_strength_receipt_id is null;
  return new;
end;
$function$;

revoke all on function collective_work_internal.reconcile_native_strength_duration()
  from public, anon, authenticated;

create trigger zz_collective_work_native_supersedes_coach_strength_duration
after insert or update of athlete_id, completed_at, submitted_by, session_name
on public.forge_strength_receipts
for each row execute function collective_work_internal.reconcile_native_strength_duration();

-- Only an active coach can create a manual duration filing; the server stamps
-- its identity and immutable assignment title. Retry is idempotent and a
-- contradictory second filing is rejected, never silently overwritten.
create function public.coach_file_strength_duration(
  p_athlete_id uuid,
  p_strength_day_id uuid,
  p_duration_seconds integer,
  p_duration_source text default 'athlete_reported',
  p_private_note text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $function$
declare
  d public.form_training_strength_days%rowtype;
  existing public.coach_strength_duration_completions%rowtype;
  new_id uuid;
begin
  if auth.uid() is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Active coach membership required' using errcode = '42501';
  end if;

  select * into d from public.form_training_strength_days
   where id = p_strength_day_id
     and athlete_id = p_athlete_id
     and cleared_at is null;
  if not found then raise exception 'Active strength assignment not found'; end if;
  if d.scheduled_on > (now() at time zone 'America/New_York')::date then
    raise exception 'Future strength work cannot be marked complete';
  end if;
  if p_duration_seconds is null or p_duration_seconds not between 1 and 43200 then
    raise exception 'Duration must be between 1 second and 12 hours';
  end if;
  if p_duration_source not in ('garmin_elapsed', 'athlete_reported', 'coach_observed') then
    raise exception 'Unknown duration evidence source';
  end if;
  if p_private_note is not null and length(p_private_note) > 2000 then
    raise exception 'Private note exceeds 2000 characters';
  end if;

  if exists (
    select 1 from public.forge_strength_receipts r
     where r.athlete_id = p_athlete_id
       and lower(btrim(r.session_name)) = lower(btrim(d.title))
       and (r.completed_at at time zone 'America/New_York')::date = d.scheduled_on
       and r.submitted_by is not null
  ) then
    raise exception 'Native Forge receipt already exists; do not file a duplicate';
  end if;

  insert into public.coach_strength_duration_completions (
    athlete_id, strength_day_id, session_title, performed_on,
    duration_seconds, duration_source, private_note, filed_by
  ) values (
    p_athlete_id, d.id, d.title, d.scheduled_on,
    p_duration_seconds, p_duration_source, p_private_note, auth.uid()
  ) on conflict (strength_day_id) do nothing returning id into new_id;

  if new_id is not null then return new_id; end if;
  select * into existing
    from public.coach_strength_duration_completions
   where strength_day_id = d.id;
  if existing.athlete_id is distinct from p_athlete_id
     or existing.duration_seconds is distinct from p_duration_seconds
     or existing.duration_source is distinct from p_duration_source
     or existing.private_note is distinct from p_private_note
     or existing.superseded_by_strength_receipt_id is not null then
    raise exception 'Strength day already filed differently; correction requires review';
  end if;
  return existing.id;
end;
$function$;

revoke all on function public.coach_file_strength_duration(
  uuid, uuid, integer, text, text
) from public, anon;
grant execute on function public.coach_file_strength_duration(
  uuid, uuid, integer, text, text
) to authenticated;
