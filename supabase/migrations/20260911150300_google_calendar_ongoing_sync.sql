-- Ongoing Google Calendar sync for the private Coach Console.
-- Google remains logistics authority; these rows never become athlete prescriptions.

create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text,
  calendar_id text not null default 'primary',
  calendar_timezone text not null default 'America/New_York',
  refresh_secret_id uuid not null,
  enabled boolean not null default true,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;
revoke all on public.google_calendar_connections from anon, authenticated;

-- Explicit overrides outrank title matching. Series rules also carry the difference
-- between a protected calendar block and the actual working session.
create table if not exists public.google_calendar_event_rules (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  event_id text,
  recurring_event_id text,
  start_offset_minutes smallint not null default 0,
  duration_override_minutes smallint check (duration_override_minutes is null or duration_override_minutes > 0),
  title_override text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (event_id is not null or recurring_event_id is not null)
);
create unique index if not exists google_calendar_event_rules_event_idx
  on public.google_calendar_event_rules(event_id) where event_id is not null;
create unique index if not exists google_calendar_event_rules_series_idx
  on public.google_calendar_event_rules(recurring_event_id) where recurring_event_id is not null;
alter table public.google_calendar_event_rules enable row level security;
revoke all on public.google_calendar_event_rules from anon, authenticated;

-- PostgREST upsert needs a non-partial unique key. NULL pairs remain freely
-- repeatable, so manual/FORM rows are unaffected.
create unique index if not exists coach_week_items_google_identity_idx
  on public.coach_week_items(source_calendar_id, source_event_id);

-- Rod's and Devin's calendar blocks include commute protection. The Console shows
-- the working hour. Natalie is literal. The one Sep 9 event titled Natalie at
-- 6:30 is explicitly Valerie because the authored Console brief establishes
-- Valerie at 6:30 and Natalie at 7:45 that morning.
insert into public.google_calendar_event_rules
  (athlete_id, event_id, recurring_event_id, start_offset_minutes, duration_override_minutes, title_override)
select a.id, v.event_id, v.series_id, v.offset_min, v.duration_min, v.title_override
from (values
  ('rod', null::text, 'r80uf2np5130c5l4sbavoqjq50'::text, 60::smallint, 60::smallint, 'Strength'::text),
  ('devin', null::text, '6s5nj5u4p8hqnu4gbq3puju4oc'::text, 15::smallint, 60::smallint, 'Strength + core'::text),
  ('natalie', null::text, 'u8rhj2g52gm7rp7mb0vogcm9ps'::text, 0::smallint, 60::smallint, 'Sunday track'::text),
  ('valerie', '0ka7pir5upus5j7e3aveaku760'::text, null::text, 0::smallint, 60::smallint, 'Track'::text),
  ('natalie', '7ur851drj3raltuughhl6geod4'::text, null::text, 0::smallint, 60::smallint, 'Track'::text)
) v(slug,event_id,series_id,offset_min,duration_min,title_override)
join public.athletes a on a.slug=v.slug
on conflict do nothing;

-- The browser may see connection status, never tokens or Vault identifiers.
create or replace function public.google_calendar_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, vault
as $$
declare
  uid uuid := auth.uid();
  row public.google_calendar_connections%rowtype;
  runtime_ready boolean;
begin
  if uid is null or not exists (
    select 1 from public.coaching_administrators ca where ca.user_id=uid and ca.status='active'
  ) then
    return jsonb_build_object('connected', false, 'authorized', false);
  end if;

  select * into row from public.google_calendar_connections c where c.user_id=uid;
  select exists(select 1 from vault.secrets where name='google_calendar_client_id')
     and exists(select 1 from vault.secrets where name='google_calendar_client_secret')
    into runtime_ready;

  if row.user_id is null then
    return jsonb_build_object('connected', false, 'authorized', true, 'automatic_ready', runtime_ready);
  end if;

  return jsonb_build_object(
    'connected', true,
    'authorized', true,
    'automatic_ready', runtime_ready,
    'email', row.google_email,
    'calendar_id', row.calendar_id,
    'timezone', row.calendar_timezone,
    'last_synced_at', row.last_synced_at,
    'last_error', row.last_error,
    'enabled', row.enabled
  );
end;
$$;
revoke all on function public.google_calendar_status() from public, anon;
grant execute on function public.google_calendar_status() to authenticated;

-- Service-only token storage. Provider refresh tokens never enter a public table.
create or replace function public.google_calendar_store_connection(
  p_user_id uuid,
  p_google_email text,
  p_refresh_token text,
  p_calendar_id text default 'primary',
  p_timezone text default 'America/New_York'
) returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  sid uuid;
begin
  if p_refresh_token is null or length(p_refresh_token) < 10 then
    raise exception 'A provider refresh token is required.';
  end if;
  select refresh_secret_id into sid from public.google_calendar_connections where user_id=p_user_id;
  if sid is null then
    sid := vault.create_secret(p_refresh_token, 'google_calendar_refresh_' || p_user_id::text,
      'Google Calendar offline refresh token for the private Coach Console');
  else
    perform vault.update_secret(sid, p_refresh_token,
      'google_calendar_refresh_' || p_user_id::text,
      'Google Calendar offline refresh token for the private Coach Console');
  end if;

  insert into public.google_calendar_connections
    (user_id, google_email, calendar_id, calendar_timezone, refresh_secret_id, enabled, connected_at, updated_at, last_error)
  values
    (p_user_id, p_google_email, coalesce(nullif(p_calendar_id,''),'primary'), coalesce(nullif(p_timezone,''),'America/New_York'), sid, true, now(), now(), null)
  on conflict (user_id) do update set
    google_email=excluded.google_email,
    calendar_id=excluded.calendar_id,
    calendar_timezone=excluded.calendar_timezone,
    refresh_secret_id=excluded.refresh_secret_id,
    enabled=true,
    updated_at=now(),
    last_error=null;
end;
$$;
revoke all on function public.google_calendar_store_connection(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.google_calendar_store_connection(uuid,text,text,text,text) to service_role;

create or replace function public.google_calendar_refresh_token(p_user_id uuid)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select s.decrypted_secret
    from public.google_calendar_connections c
    join vault.decrypted_secrets s on s.id=c.refresh_secret_id
   where c.user_id=p_user_id and c.enabled=true
   limit 1
$$;
revoke all on function public.google_calendar_refresh_token(uuid) from public, anon, authenticated;
grant execute on function public.google_calendar_refresh_token(uuid) to service_role;

-- Runtime secrets live in Vault. The user adds the two Google OAuth values once;
-- the cron key is generated here and never exposed to the browser.
do $$
begin
  if not exists (select 1 from vault.secrets where name='google_calendar_sync_cron_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),
      'google_calendar_sync_cron_key', 'Authenticates the internal Calendar cron invocation');
  end if;
end $$;

create or replace function public.google_calendar_runtime_secrets()
returns jsonb
language sql
security definer
set search_path = vault
as $$
  select jsonb_build_object(
    'client_id', max(decrypted_secret) filter (where name='google_calendar_client_id'),
    'client_secret', max(decrypted_secret) filter (where name='google_calendar_client_secret'),
    'cron_key', max(decrypted_secret) filter (where name='google_calendar_sync_cron_key')
  ) from vault.decrypted_secrets
$$;
revoke all on function public.google_calendar_runtime_secrets() from public, anon, authenticated;
grant execute on function public.google_calendar_runtime_secrets() to service_role;

create or replace function public.disconnect_google_calendar()
returns void
language plpgsql
security definer
set search_path = public, auth, vault
as $$
declare sid uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.coaching_administrators ca where ca.user_id=auth.uid() and ca.status='active'
  ) then raise exception 'Coach access required'; end if;
  select refresh_secret_id into sid from public.google_calendar_connections where user_id=auth.uid();
  delete from public.google_calendar_connections where user_id=auth.uid();
  if sid is not null then delete from vault.secrets where id=sid; end if;
end;
$$;
revoke all on function public.disconnect_google_calendar() from public, anon;
grant execute on function public.disconnect_google_calendar() to authenticated;

-- Cron is installed after the Edge Function exists. Calling this function twice
-- simply replaces the same named job.
create or replace function public.install_google_calendar_sync_cron()
returns bigint
language plpgsql
security definer
set search_path = public, vault, cron, net
as $$
declare job_id bigint;
begin
  select cron.schedule(
    'form-google-calendar-sync',
    '*/10 * * * *',
    $job$
      select net.http_post(
        url := 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/google-calendar-sync',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'x-calendar-sync-key',(select decrypted_secret from vault.decrypted_secrets where name='google_calendar_sync_cron_key')
        ),
        body := '{"action":"sync-all"}'::jsonb,
        timeout_milliseconds := 10000
      );
    $job$
  ) into job_id;
  return job_id;
end;
$$;
revoke all on function public.install_google_calendar_sync_cron() from public, anon, authenticated;
grant execute on function public.install_google_calendar_sync_cron() to service_role;
