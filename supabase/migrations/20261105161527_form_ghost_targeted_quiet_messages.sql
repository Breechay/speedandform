-- Brice's targeted Halo notes. No message-push, email, or broadcast triggers.
-- Athlete roster identity is retained independently of a claimed auth account.

create table if not exists public.form_ghost_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_key text not null unique,
  template_kind text not null default 'plain'
    check (template_kind in ('plain','thursday_postrun','saturday_invite')),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  action_kind text not null default 'none'
    check (action_kind in ('none', 'open_week', 'view_run')),
  action_date date,
  event_on date,
  publisher_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  archived_at timestamptz,
  quiet boolean not null default true check (quiet)
);

create table if not exists public.form_ghost_recipients (
  message_id uuid not null references public.form_ghost_messages(id),
  athlete_id uuid not null references public.athletes(id),
  selected_at timestamptz not null default now(),
  first_opened_at timestamptz,
  primary key (message_id, athlete_id)
);

create index if not exists form_ghost_recipient_athlete
  on public.form_ghost_recipients (athlete_id, first_opened_at, message_id);

alter table public.form_ghost_messages enable row level security;
alter table public.form_ghost_recipients enable row level security;

revoke all on public.form_ghost_messages from anon, authenticated;
revoke all on public.form_ghost_recipients from anon, authenticated;
grant select on public.form_ghost_messages to authenticated;
grant select on public.form_ghost_recipients to authenticated;
grant update (first_opened_at) on public.form_ghost_recipients to authenticated;

create policy form_ghost_recipient_read on public.form_ghost_recipients
for select to authenticated
using (
  (first_opened_at is null or first_opened_at > now() - interval '7 days')
  and exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = form_ghost_recipients.athlete_id
      and m.user_id=(select auth.uid())
      and m.role='athlete' and m.status='active'
  )
);

create policy form_ghost_recipient_open on public.form_ghost_recipients
for update to authenticated
using (
  first_opened_at is null
  and exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = form_ghost_recipients.athlete_id
      and m.user_id=(select auth.uid())
      and m.role='athlete' and m.status='active'
  )
)
with check (
  first_opened_at is not null
  and exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = form_ghost_recipients.athlete_id
      and m.user_id=(select auth.uid())
      and m.role='athlete' and m.status='active'
  )
);

create policy form_ghost_message_read on public.form_ghost_messages
for select to authenticated
using (
  available_at <= now() and archived_at is null
  and exists (
    select 1 from public.form_ghost_recipients r
    where r.message_id = form_ghost_messages.id
  )
);

-- The user's first tap, not periodic inbox refresh, starts the one-week timer.
-- RLS/column grants let an athlete mark only their own first-open receipt.
create or replace function public.form_ghost_first_open_stamp()
returns trigger language plpgsql security invoker
set search_path = ''
as $function$
begin
  if old.first_opened_at is not null then
    raise exception 'form_ghost_already_opened';
  end if;
  if new.message_id is distinct from old.message_id
    or new.athlete_id is distinct from old.athlete_id
    or new.selected_at is distinct from old.selected_at then
    raise exception 'form_ghost_recipient_immutable';
  end if;
  new.first_opened_at := now();
  return new;
end;
$function$;

create trigger form_ghost_first_open_stamp
before update on public.form_ghost_recipients
for each row execute function public.form_ghost_first_open_stamp();

revoke all on function public.form_ghost_first_open_stamp() from public,anon,authenticated;

-- Named, approved recipients are materialized as a fixed snapshot. A missing
-- person fails the whole migration, preventing accidental partial delivery.
do $seed$
declare
  v_publisher uuid;
  v_track uuid;
  v_long uuid;
  v_count integer;
begin
  select author_account_id into v_publisher
    from public.collective_runs
   where author_kind='form' and kind='track'
     and (starts_at at time zone 'America/New_York')::date=date '2026-11-05'
   order by created_at desc limit 1;
  if v_publisher is null or not exists (
    select 1 from public.collective_publishers p where p.account_id=v_publisher
  ) then raise exception 'No verified Nov 5 FORM publisher'; end if;

  -- Confirm exact roster matches *before* writing either campaign.
  with wanted(slug) as (values
    ('tinius'),('turner-goetsch'),('saul-licona'),('kevin'),('brice'),
    ('lisa'),('david'),('anthony'),('tyler-odwin'),('matt-alvarez'),
    ('sam-reyes'),('megan-bolan'),('kilton-janvier'),('patrick-stowe'))
  select count(*) into v_count from wanted w join public.athletes a
    on a.slug=w.slug and a.active=true;
  if v_count<>14 then raise exception 'Incomplete Thursday target roster: %',v_count; end if;

  with wanted(slug) as (values
    ('saul-licona'),('tinius'),('brice'),('patrick-stowe'),
    ('ryan-kenneth'),('adrian'))
  select count(*) into v_count from wanted w join public.athletes a
    on a.slug=w.slug and a.active=true;
  if v_count<>6 then raise exception 'Incomplete Saturday target roster: %',v_count; end if;

  insert into public.form_ghost_messages
    (campaign_key,template_kind,title,body,action_kind,action_date,event_on,publisher_id)
  values (
    'form-2026-11-05-thursday-note',
    'thursday_postrun','Good work on Thursday.',
    'Thursday with FORM. Next week''s published session is waiting in your Week.',
    'open_week',date '2026-11-12',date '2026-11-05',v_publisher
  )
  on conflict (campaign_key) do nothing;
  select id into strict v_track from public.form_ghost_messages
   where campaign_key='form-2026-11-05-thursday-note';

  insert into public.form_ghost_messages
    (campaign_key,template_kind,title,body,action_kind,action_date,event_on,publisher_id)
  values (
    'form-2026-11-07-saturday-note',
    'saturday_invite','Saturday, together.',
    'Meet at The Labs at 5:50 AM. Follow the distance and effort in your own plan. See you out there.',
    'view_run',date '2026-11-07',date '2026-11-07',v_publisher
  )
  on conflict (campaign_key) do nothing;
  select id into strict v_long from public.form_ghost_messages
   where campaign_key='form-2026-11-07-saturday-note';

  insert into public.form_ghost_recipients(message_id,athlete_id)
  select v_track,a.id from public.athletes a
   where a.slug in ('tinius','turner-goetsch','saul-licona','kevin',
     'brice','lisa','david','anthony','tyler-odwin','matt-alvarez',
     'sam-reyes','megan-bolan','kilton-janvier','patrick-stowe')
  on conflict do nothing;

  insert into public.form_ghost_recipients(message_id,athlete_id)
  select v_long,a.id from public.athletes a
   where a.slug in ('saul-licona','tinius','brice','patrick-stowe',
     'ryan-kenneth','adrian')
  on conflict do nothing;
end;
$seed$;

-- Single authenticated projection for Halo and its unread dots. A message
-- becomes read only on the user's explicit open, never on inbox fetch.
-- SECURITY DEFINER is narrowly scoped to auth.uid() + active athlete role;
-- underlying Thursday publications are not exposed directly to clients.
create or replace function public.form_ghost_inbox()
returns jsonb language plpgsql stable security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_rec record;
  v_items jsonb := '[]'::jsonb;
  v_body text;
  v_next_title text;
  v_recovery_seconds integer;
  v_recovery_kind text;
  v_next_line text;
  v_filed text;
  v_link_exists boolean;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  for v_rec in
    select msg.*, r.athlete_id, r.first_opened_at
    from public.form_ghost_messages msg
    join public.form_ghost_recipients r on r.message_id=msg.id
    join public.athlete_memberships am
      on am.athlete_id=r.athlete_id and am.user_id=v_user
       and am.role='athlete' and am.status='active'
    where msg.available_at<=now() and msg.archived_at is null
      and (r.first_opened_at is null
           or r.first_opened_at>now()-interval '7 days')
    order by msg.available_at desc, msg.id desc limit 50
  loop
    v_body := v_rec.body;
    if v_rec.template_kind='thursday_postrun' then
      v_filed:=null; v_link_exists:=false;
      select exists (
        select 1 from public.form_miami_session_links l
        where l.lane='thursday' and l.on_date=v_rec.event_on
          and l.athlete_id=v_rec.athlete_id and not l.paused
      ) into v_link_exists;
      select sc.status into v_filed
        from public.form_miami_session_links l
        join public.session_completions sc
          on sc.planned_session_id=l.planned_session_id
         and sc.athlete_id=l.athlete_id
        where l.lane='thursday' and l.on_date=v_rec.event_on
          and l.athlete_id=v_rec.athlete_id and not l.paused
        order by sc.filed_at desc limit 1;

      v_next_title:=null; v_recovery_seconds:=null; v_recovery_kind:=null;
      select p.payload->>'title',
        (select nullif(w->>'recoverySeconds','')::integer
         from jsonb_array_elements(coalesce(p.payload->'components','[]'::jsonb)) w
         where w->>'role'='work' and w ? 'recoverySeconds' limit 1),
        (select w->>'recoveryKind'
         from jsonb_array_elements(coalesce(p.payload->'components','[]'::jsonb)) w
         where w->>'role'='work' and w ? 'recoveryKind' limit 1)
       into v_next_title,v_recovery_seconds,v_recovery_kind
       from public.form_miami_publications p
       where p.lane='thursday' and p.on_date=v_rec.action_date
       order by p.revision desc limit 1;

      if v_next_title is not null then
        v_next_line := 'Next Thursday (' || to_char(v_rec.action_date,'Mon FMDD') || '): '
          || v_next_title;
        if v_recovery_seconds is not null and v_recovery_kind='jog' then
          v_next_line := v_next_line || ' with a '
            || (v_recovery_seconds / 60)::text || ':'
            || lpad((v_recovery_seconds % 60)::text,2,'0') || ' jog';
        end if;
        v_next_line := v_next_line || '. See you on the track.';
      else
        v_next_line := 'The next Thursday session will appear in Week once it is published.';
      end if;

      if v_filed='completed' then
        v_body := 'Your Thursday session is filed. Strong, composed work. ' || v_next_line;
      elsif v_filed='partial' then
        v_body := 'Your Thursday session is saved. Finish filing when you are ready. ' || v_next_line;
      elsif v_link_exists then
        v_body := 'If you ran with us, file your Thursday session when you have a moment. ' || v_next_line;
      else
        v_body := 'Thursday with FORM. ' || v_next_line;
      end if;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id',v_rec.id,'title',v_rec.title,'body',v_body,
      'action_kind',v_rec.action_kind,'action_date',v_rec.action_date,
      'event_on',v_rec.event_on,'available_at',v_rec.available_at,
      'first_opened_at',v_rec.first_opened_at,
      'unread',(v_rec.first_opened_at is null),
      'hide_after',case when v_rec.first_opened_at is null
        then null else v_rec.first_opened_at+interval '7 days' end
    ));
  end loop;
  return v_items;
end;
$function$;

revoke all on function public.form_ghost_inbox() from public, anon, authenticated;
grant execute on function public.form_ghost_inbox() to authenticated;

create or replace function public.form_ghost_mark_opened(p_message uuid)
returns integer language plpgsql security invoker
set search_path = ''
as $function$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  update public.form_ghost_recipients r
   set first_opened_at=now()
   where r.message_id=p_message and r.first_opened_at is null
     and exists (select 1 from public.form_ghost_messages m
       where m.id=r.message_id and m.available_at<=now()
         and m.archived_at is null);
  get diagnostics v_count=row_count;
  return v_count;
end;
$function$;

revoke all on function public.form_ghost_mark_opened(uuid) from public, anon, authenticated;
grant execute on function public.form_ghost_mark_opened(uuid) to authenticated;
