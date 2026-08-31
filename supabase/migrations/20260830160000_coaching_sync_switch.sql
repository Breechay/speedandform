-- A switch that can actually be thrown while the athletes are holding the phones.
--
-- Gate A's flag lives in UserDefaults on the device. It was described as a way to
-- turn coaching off without shipping a build, and that is simply false: nothing can
-- reach into three phones and change a local default. The first athlete to open the
-- release starts talking to this database, and until now there was no way to stop
-- that except an App Store review cycle.
--
-- So the switch lives here, where it can be thrown in a second, and both doors read
-- it. An athlete cannot route around it because the check is inside the security
-- definer functions that are the only way in.
--
-- Paused is not broken. A paused sync must leave the cached plan readable and leave
-- filed evidence queued on the device, because an athlete who ran this morning has
-- evidence that exists whether or not the server is listening, and losing it to a
-- maintenance window would be the worst possible way to learn that.

create table if not exists public.coaching_sync_state (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  paused_reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

insert into public.coaching_sync_state (id, enabled) values (true, true)
  on conflict (id) do nothing;

-- Every throw of the switch, append only. A maintenance window nobody can
-- reconstruct afterwards is indistinguishable from an outage.
create table if not exists public.coaching_sync_events (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null,
  reason text,
  actor uuid references auth.users(id) on delete set null,
  at timestamptz not null default now()
);

alter table public.coaching_sync_state enable row level security;
alter table public.coaching_sync_events enable row level security;

-- Readable by anyone signed in, so the app can say why it is quiet rather than
-- looking broken. Writable by nobody: the switch is thrown through a function.
create policy sync_state_read on public.coaching_sync_state
  for select to authenticated using (true);
create policy sync_events_read on public.coaching_sync_events
  for select to authenticated using (true);

create trigger coaching_sync_events_immutable
  before update or delete on public.coaching_sync_events
  for each row execute function public.prevent_immutable_change();

create or replace function public.coaching_sync_enabled()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select coalesce((select enabled from public.coaching_sync_state where id), true); $$;

create or replace function public.set_coaching_sync(p_enabled boolean, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Only a coach throws it. There is deliberately no athlete path: an athlete who
  -- could pause their own sync could stop their own evidence reaching the record.
  if not exists (select 1 from public.athlete_memberships
                  where user_id = auth.uid() and role = 'coach' and status = 'active') then
    raise exception 'only a coach changes coaching sync';
  end if;
  if not p_enabled and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'pausing sync carries a reason the athletes can be told';
  end if;

  update public.coaching_sync_state
     set enabled = p_enabled,
         paused_reason = case when p_enabled then null else p_reason end,
         changed_by = auth.uid(), changed_at = now()
   where id;

  insert into public.coaching_sync_events (enabled, reason, actor)
  values (p_enabled, p_reason, auth.uid());
end $$;

revoke all on function public.set_coaching_sync(boolean, text) from public, anon;
grant execute on function public.set_coaching_sync(boolean, text) to authenticated;
grant execute on function public.coaching_sync_enabled() to authenticated;

-- Both doors read it.
--
-- The existing functions are renamed and wrapped rather than retyped, and direct
-- execute on the inner ones is revoked — a switch an athlete can step around by
-- calling the function underneath it is not a switch.
--
-- The error text is stable and prefixed so the app can recognise a pause and keep
-- queueing, rather than treating it as a rejection and discarding evidence that
-- exists whether or not the server is listening.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='athlete_plan_feed'
                and not exists (select 1 from pg_proc q join pg_namespace m on m.oid=q.pronamespace
                                 where m.nspname='public' and q.proname='athlete_plan_feed_impl')) then
    execute 'alter function public.athlete_plan_feed(uuid) rename to athlete_plan_feed_impl';
  end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='record_session_from_form'
                and not exists (select 1 from pg_proc q join pg_namespace m on m.oid=q.pronamespace
                                 where m.nspname='public' and q.proname='record_session_from_form_impl')) then
    execute 'alter function public.record_session_from_form(text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb) rename to record_session_from_form_impl';
  end if;
end $$;

create or replace function public.athlete_plan_feed(p_athlete_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.coaching_sync_enabled() then
    raise exception 'coaching_sync_paused: %',
      coalesce((select paused_reason from public.coaching_sync_state where id), 'sync is paused');
  end if;
  return public.athlete_plan_feed_impl(p_athlete_id);
end $$;

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
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.coaching_sync_enabled() then
    raise exception 'coaching_sync_paused: %',
      coalesce((select paused_reason from public.coaching_sync_state where id), 'sync is paused');
  end if;
  return public.record_session_from_form_impl(
    p_evidence_id, p_status, p_planned_session_id, p_actual_distance, p_distance_unit,
    p_duration_seconds, p_rpe, p_athlete_note, p_symptoms, p_surface, p_conditions,
    p_filed_at, p_pieces);
end $$;

revoke all on function public.athlete_plan_feed_impl(uuid) from public, anon, authenticated;
revoke all on function public.record_session_from_form_impl(text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.athlete_plan_feed(uuid) to authenticated;
grant execute on function public.record_session_from_form(text, text, uuid, numeric, text, integer, integer, text, text, text, text, timestamptz, jsonb) to authenticated;

do $$
declare leaked integer;
begin
  select count(*) into leaked
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('athlete_plan_feed_impl','record_session_from_form_impl')
     and has_function_privilege('authenticated', p.oid, 'execute');
  if leaked > 0 then
    raise exception 'the switch can be stepped around: % inner function(s) still executable', leaked;
  end if;
end $$;
