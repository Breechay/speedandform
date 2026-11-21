-- FORM hosted-gathering rollover, private and quiet.
-- This migration deliberately does NOT schedule pg_cron. Enable only after
-- rollback dry-runs, source review, and quiet-delivery readback.

create schema if not exists form_rally_private;
revoke all on schema form_rally_private from public, anon, authenticated;

create table if not exists form_rally_private.publication_holds (
  lane text not null check (lane in ('thursday', 'saturday')),
  on_date date not null,
  reason text not null check (char_length(btrim(reason)) between 5 and 400),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  primary key (lane, on_date)
);

create table if not exists form_rally_private.rollover_receipts (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  lane text not null check (lane in ('thursday', 'saturday')),
  source_date date not null,
  next_date date not null,
  outcome text not null,
  run_id uuid,
  note text
);
create index if not exists rollover_receipts_latest
  on form_rally_private.rollover_receipts (lane, checked_at desc);

alter table form_rally_private.publication_holds enable row level security;
alter table form_rally_private.rollover_receipts enable row level security;
revoke all on all tables in schema form_rally_private from public, anon, authenticated;
revoke all on all sequences in schema form_rally_private from public, anon, authenticated;

-- An explicit *hold*, not a cancellation of the published athlete workout.
-- Release a held date only after a host confirms the public gathering.
insert into form_rally_private.publication_holds (lane, on_date, reason)
values
  ('thursday', date '2026-11-26', 'Thanksgiving: public host and venue confirmation required'),
  ('saturday', date '2026-11-28', 'Thanksgiving weekend: public host and venue confirmation required')
on conflict (lane, on_date) do nothing;

create or replace function form_rally_private.rollover_once(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, form_rally_private
as $function$
declare
  v_day date := (p_now at time zone 'America/New_York')::date;
  v_minute integer := extract(hour from p_now at time zone 'America/New_York')::integer * 60
                    + extract(minute from p_now at time zone 'America/New_York')::integer;
  v_lane text;
  v_kind text;
  v_series_id text;
  v_target date;
  v_series public.collective_run_series%rowtype;
  v_term public.collective_run_series_terms%rowtype;
  v_source public.collective_runs%rowtype;
  v_existing public.collective_runs%rowtype;
  v_count integer;
  v_current_hold boolean;
  v_target_hold boolean;
  v_run_id uuid;
  v_status text;
  v_note text;
  v_author uuid;
  v_start timestamptz;
  v_meet timestamptz;
begin
  -- The cron invokes twice per operating day to straddle DST, but only the
  -- 09:00-10:59 Eastern publication window is allowed to mutate public state.
  if extract(isodow from v_day)::integer = 4 then
    v_lane := 'thursday'; v_kind := 'track'; v_series_id := 'track-thursday';
  elsif extract(isodow from v_day)::integer = 6 then
    v_lane := 'saturday'; v_kind := 'long_run'; v_series_id := 'form-saturday-long-run';
  else
    return jsonb_build_object('outcome', 'wrong_weekday', 'on_date', v_day);
  end if;
  if v_minute < 540 or v_minute > 659 then
    return jsonb_build_object('outcome', 'outside_publication_window', 'lane', v_lane, 'on_date', v_day);
  end if;

  v_target := v_day + 7;
  perform pg_advisory_xact_lock(hashtext('form_rally_' || v_lane)::bigint);

  -- No platform-wide messaging trigger is involved. A calendar/race/host
  -- exception is a private explicit hold, rather than a fabricated run.
  select exists (
    select 1 from form_rally_private.publication_holds h
    where h.lane=v_lane and h.on_date=v_target and h.released_at is null
  ) into v_target_hold;
  if v_target_hold then
    v_status := 'next_date_on_hold';
    v_note := 'No public gathering is created for a held future date';
  end if;

  if v_status is null then
    select * into v_series from public.collective_run_series
    where id=v_series_id and kind=v_kind and time_zone='America/New_York';
    if not found or nullif(btrim(v_series.meet_name),'') is null
       or nullif(btrim(v_series.meet_address),'') is null then
      v_status := 'series_missing_or_changed';
    end if;
  end if;

  if v_status is null then
    select * into v_term from public.collective_run_series_terms
    where series_id=v_series_id and effective_from<=v_target
    order by effective_from desc, issued_at desc limit 1;
    if not found then v_status := 'no_effective_series_terms'; end if;
  end if;

  -- A canceled event, venue change, or an unexpected already-published event
  -- must be reconciled by a human; do not issue a duplicate invitation.
  if v_status is null then
    select count(*) into v_count from public.collective_runs r
    where r.kind=v_kind and r.author_kind='form' and r.visibility='public'
      and (r.starts_at at time zone 'America/New_York')::date=v_target;
    if v_count > 1 then v_status := 'multiple_future_public_runs'; end if;
  end if;

  if v_status is null then
    select * into v_existing from public.collective_runs r
    where r.kind=v_kind and r.author_kind='form' and r.visibility='public'
      and (r.starts_at at time zone 'America/New_York')::date=v_target
    limit 1;
    if found then
      if v_existing.meet_name<>v_series.meet_name
        or v_existing.meet_address<>v_series.meet_address then
        v_status := 'future_venue_conflict';
      elsif exists (select 1 from public.collective_run_changes c
        where c.run_id=v_existing.id and c.kind in ('cancelled','place','time')) then
        v_status := 'future_run_amended_or_cancelled';
      elsif exists (select 1 from public.form_miami_run_links l
        where l.lane=v_lane and l.on_date=v_target and l.run_id=v_existing.id) then
        v_status := 'already_linked'; v_run_id:=v_existing.id;
      else
        -- Do not silently adopt an event with different terms.
        v_meet := ((v_target::timestamp + make_interval(mins=>v_term.meet_minute))
                   at time zone v_series.time_zone);
        v_start := ((v_target::timestamp + make_interval(mins=>v_term.run_minute))
                    at time zone v_series.time_zone);
        if v_existing.meet_at is distinct from v_meet
          or v_existing.starts_at is distinct from v_start
          or v_existing.series_id is distinct from v_series_id then
          v_status := 'future_event_requires_reconciliation';
        else
          v_status := 'link_existing'; v_run_id:=v_existing.id;
        end if;
      end if;
    elsif exists (select 1 from public.form_miami_run_links l
      where l.lane=v_lane and l.on_date=v_target) then
      v_status := 'orphan_future_link';
    end if;
  end if;

  if v_status is null or v_status='link_existing' then
    select exists (select 1 from form_rally_private.publication_holds h
      where h.lane=v_lane and h.on_date=v_day and h.released_at is null)
      into v_current_hold;

    -- Today's run is the only source of permission to roll forward.
    -- On an explicitly held date, allow the last legitimate hosted edition
    -- within 14 days to carry the recurrence across the holiday gap.
    select r.* into v_source from public.collective_runs r
    left join public.form_miami_run_links l on l.run_id=r.id
    where r.kind=v_kind and r.author_kind='form' and r.visibility='public'
      and r.meet_name=v_series.meet_name
      and r.meet_address=v_series.meet_address
      and (
        ((r.starts_at at time zone 'America/New_York')::date=v_day)
        or (v_current_hold and (r.starts_at at time zone 'America/New_York')::date
           between v_day-14 and v_day-7)
      )
      and (v_lane='saturday' or l.lane='thursday')
      and not exists (select 1 from public.collective_run_changes c
        where c.run_id=r.id and c.kind in ('cancelled','place'))
    order by r.starts_at desc limit 1;
    if not found then
      v_status := 'no_verified_current_or_held_prior_run';
    elsif not exists (select 1 from public.collective_publishers p
      where p.account_id=v_source.author_account_id) then
      v_status := 'publisher_authorization_missing';
    else
      v_author:=v_source.author_account_id;
    end if;
  end if;

  -- A Thursday gathering may only advertise an already published canonical
  -- workout. Never create a plan publication in this worker.
  if (v_status is null or v_status='link_existing') and v_lane='thursday'
    and not exists (select 1 from public.form_miami_publications p
      where p.lane='thursday' and p.on_date=v_target)
  then
    v_status:='no_canonical_thursday_workout';
  end if;

  if v_status is null then
    v_meet := ((v_target::timestamp + make_interval(mins=>v_term.meet_minute))
               at time zone v_series.time_zone);
    v_start := ((v_target::timestamp + make_interval(mins=>v_term.run_minute))
                at time zone v_series.time_zone);
    insert into public.collective_runs
      (author_kind,author_account_id,kind,series_id,title,visibility,
       meet_at,starts_at,meet_name,meet_address,group_facts)
    values ('form',v_author,v_kind,v_series_id,
      case when v_lane='thursday' then 'FORM Thursday' else 'FORM Long Run' end,
      'public',v_meet,v_start,v_series.meet_name,v_series.meet_address,'{}'::jsonb)
    returning id into v_run_id;
    v_status:='created';
  end if;

  if v_status in ('created','link_existing') then
    insert into public.form_miami_run_links(lane,on_date,run_id,linked_by)
    values(v_lane,v_target,v_run_id,v_author);
    if v_status='link_existing' then v_status:='linked_existing'; end if;
  end if;

  insert into form_rally_private.rollover_receipts
    (lane,source_date,next_date,outcome,run_id,note)
    values (v_lane,v_day,v_target,v_status,v_run_id,v_note);
  return jsonb_build_object('outcome',v_status,'lane',v_lane,
    'source_date',v_day,'next_date',v_target,'run_id',v_run_id);
end;
$function$;

revoke all on function form_rally_private.rollover_once(timestamptz)
  from public, anon, authenticated;
