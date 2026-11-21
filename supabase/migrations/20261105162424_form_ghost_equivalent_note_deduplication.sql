create or replace function form_rally_private.enqueue_due_ghost(
  p_now timestamptz default now()
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog,public,form_rally_private
as $function$
declare
  v_day date := (p_now at time zone 'America/New_York')::date;
  v_minute integer := extract(hour from p_now at time zone 'America/New_York')::integer*60
                    + extract(minute from p_now at time zone 'America/New_York')::integer;
  v_lane text;
  v_kind text;
  v_series text;
  v_target date;
  v_source public.collective_runs%rowtype;
  v_future public.collective_runs%rowtype;
  v_key text;
  v_title text;
  v_body text;
  v_template text;
  v_action text;
  v_message uuid;
  v_count integer;
  v_status text;
begin
  if extract(isodow from v_day)::integer=4 then
    v_lane:='thursday'; v_kind:='track'; v_series:='track-thursday';
  elsif extract(isodow from v_day)::integer=6 then
    v_lane:='saturday'; v_kind:='long_run'; v_series:='form-saturday-long-run';
  else
    return jsonb_build_object('status','not_operating_day');
  end if;
  if v_minute<555 or v_minute>659 then
    return jsonb_build_object('status','outside_quiet_postrun_window','lane',v_lane);
  end if;
  v_target:=v_day+7;
  perform pg_advisory_xact_lock(hashtext('form_ghost_'||v_lane)::bigint);

  if exists (select 1 from form_rally_private.publication_holds h
       where h.lane=v_lane and h.on_date=v_target and h.released_at is null) then
    v_status:='future_on_hold';
  end if;

  if v_status is null then
    select r.* into v_future from public.form_miami_run_links l
      join public.collective_runs r on r.id=l.run_id
      where l.lane=v_lane and l.on_date=v_target
        and r.kind=v_kind and r.author_kind='form' and r.visibility='public'
        and r.series_id=v_series
        and not exists (select 1 from public.collective_run_changes c
          where c.run_id=r.id and c.kind in ('cancelled','place','time'));
    if not found then v_status:='next_public_event_missing_or_amended'; end if;
  end if;

  if v_status is null and v_lane='thursday' and not exists (
    select 1 from public.form_miami_publications p
      where p.lane='thursday' and p.on_date=v_target
  ) then
    v_status:='next_thursday_workout_missing';
  end if;

  if v_status is null then
    select r.* into v_source from public.collective_runs r
     left join public.form_miami_run_links l on l.run_id=r.id
     where r.kind=v_kind and r.author_kind='form' and r.visibility='public'
       and (r.starts_at at time zone 'America/New_York')::date=v_day
       and (v_lane='saturday' or (l.lane='thursday' and l.on_date=v_day))
       and r.meet_name=(select meet_name from public.collective_run_series where id=v_series)
       and r.meet_address=(select meet_address from public.collective_run_series where id=v_series)
       and not exists (select 1 from public.collective_run_changes c
         where c.run_id=r.id and c.kind in ('cancelled','place'))
     order by r.created_at desc limit 1;
    if not found then v_status:='current_hosted_source_missing_or_cancelled'; end if;
  end if;

  if v_status is null and not exists (
    select 1 from public.collective_publishers p
      where p.account_id=v_source.author_account_id
  ) then
    v_status:='publisher_not_verified';
  end if;

  if v_status is null then
    select count(*) into v_count from form_rally_private.ghost_audience ga
       join public.athletes a on a.id=ga.athlete_id and a.active
      where ga.lane=v_lane and ga.active;
    if v_count=0 then v_status:='empty_audience'; end if;
  end if;

  -- An owner-authored note for this occurrence and its *next* dated session
  -- already fulfills the contract. In particular, do not duplicate the
  -- separately seeded November 5 Thursday note.
  if v_status is null and exists (
    select 1 from public.form_ghost_messages m
    where m.event_on=v_day and m.action_date=v_target
      and m.archived_at is null
      and m.template_kind=case when v_lane='thursday'
        then 'thursday_postrun' else 'saturday_invite' end
  ) then
    v_status:='equivalent_note_already_prepared';
  end if;

  if v_status is null then
    v_key:='form-'||v_day::text||'-'||v_lane||'-postrun';
    if v_lane='thursday' then
      v_template:='thursday_postrun';
      v_title:='Good work on Thursday.';
      v_body:='Thursday with FORM. Your next published session is in Week.';
      v_action:='open_week';
    else
      v_template:='saturday_invite';
      v_title:='Next Saturday, together.';
      v_body:='Meet at '||v_future.meet_name||' at '
        ||to_char(v_future.meet_at at time zone 'America/New_York','FMHH12:MI AM')
        ||'. We start at '
        ||to_char(v_future.starts_at at time zone 'America/New_York','FMHH12:MI AM')
        ||'. Follow the distance and effort in your own plan. See you out there.';
      v_action:='view_run';
    end if;

    insert into public.form_ghost_messages
      (campaign_key,template_kind,title,body,action_kind,action_date,event_on,publisher_id)
    values(v_key,v_template,v_title,v_body,v_action,v_target,v_day,v_source.author_account_id)
    on conflict (campaign_key) do nothing;
    select m.id into v_message from public.form_ghost_messages m
      where m.campaign_key=v_key;

    insert into public.form_ghost_recipients(message_id,athlete_id)
    select v_message,ga.athlete_id from form_rally_private.ghost_audience ga
    join public.athletes a on a.id=ga.athlete_id and a.active
     where ga.lane=v_lane and ga.active
    on conflict (message_id,athlete_id) do nothing;
    select count(*) into v_count from public.form_ghost_recipients r
      where r.message_id=v_message;
    v_status:='prepared_quiet_message';
  else
    v_count:=0;
  end if;

  insert into form_rally_private.ghost_automation_receipts
    (lane,source_date,next_date,status,message_id,recipient_count)
    values(v_lane,v_day,v_target,v_status,v_message,v_count);
  return jsonb_build_object('status',v_status,'lane',v_lane,
    'source_date',v_day,'next_date',v_target,
    'message_id',v_message,'recipient_count',v_count);
end;
$function$;
revoke all on function form_rally_private.enqueue_due_ghost(timestamptz)
from public,anon,authenticated;
