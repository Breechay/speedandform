-- The plan can be turned off without turning off the evidence.
--
-- `coaching_sync_state.enabled` closes both doors at once. That is the right blunt
-- instrument for "stop talking to the phones", and the wrong one for "the new plan
-- renderer is misbehaving" — reaching for it there would also stop filed evidence
-- reaching the record, which is the one direction that has been working.
--
-- So the seam that lets a server-authored prescription become what the athlete
-- actually runs gets its own switch, on the row that already says what is on. Two
-- columns, one reader, one setter. No flag framework: the next switch, if there ever
-- is one, is another column here.
--
-- It defaults OFF, and it stays off until a coached athlete has been walked
-- end-to-end. A default of true would mean the first database to run this migration
-- hands plan authority to a renderer nobody has watched.

alter table public.coaching_sync_state
  add column if not exists plan_authority_enabled boolean not null default false,
  add column if not exists plan_authority_reason  text;

comment on column public.coaching_sync_state.plan_authority_enabled is
  'Whether a server-authored prescription is what the athlete runs. Independent of `enabled`: evidence upload is unaffected by this switch, and disabling it returns the app to its own local planner rather than silencing it.';
comment on column public.coaching_sync_state.plan_authority_reason is
  'Why plan authority is off, in words an athlete could be told. Required to disable, cleared on enable.';

-- The event log now carries two switches, so it has to say which one moved. Existing
-- rows are all the sync switch by construction — this column post-dates the other.
alter table public.coaching_sync_events
  add column if not exists control text not null default 'sync'
    check (control in ('sync', 'plan_authority'));

comment on column public.coaching_sync_events.control is
  'Which switch this event is about. `sync` opens and closes both doors; `plan_authority` decides only whether the server prescription outranks the app''s own planner.';

-- Note the coalesce default, which deliberately differs from its sibling: a missing
-- sync row means sync is ON, and a missing plan-authority value means plan authority
-- is OFF. Each falls the safe way for what it governs.
create or replace function public.coaching_plan_authority_enabled()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select coalesce((select plan_authority_enabled from public.coaching_sync_state where id), false); $$;

comment on function public.coaching_plan_authority_enabled is
  'Whether server-authored prescriptions currently outrank the app''s local planner. Absent state means no.';

create or replace function public.set_plan_authority(p_enabled boolean, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Same guard as the sync switch, for the same reason: an athlete who could grant
  -- themselves plan authority could decide which plan they are running.
  if not exists (select 1 from public.athlete_memberships
                  where user_id = auth.uid() and role = 'coach' and status = 'active') then
    raise exception 'only a coach changes plan authority';
  end if;
  if not p_enabled and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'withdrawing plan authority carries a reason the athletes can be told';
  end if;

  update public.coaching_sync_state
     set plan_authority_enabled = p_enabled,
         plan_authority_reason = case when p_enabled then null else p_reason end,
         changed_by = auth.uid(), changed_at = now()
   where id;

  insert into public.coaching_sync_events (enabled, reason, actor, control)
  values (p_enabled, p_reason, auth.uid(), 'plan_authority');
end $$;

revoke all on function public.set_plan_authority(boolean, text) from public, anon;
grant execute on function public.set_plan_authority(boolean, text) to authenticated;
grant execute on function public.coaching_plan_authority_enabled() to authenticated;

-- It travels on the door that is already open.
--
-- A separate RPC would be a second call the app has to make, a second thing that can
-- fail, and a window where the plan and the permission to use it disagree. Patched in
-- rather than retyped, for the reason the note migration gives: the payload is sixty
-- lines of hand-built jsonb and retyping it to add one key is how a field goes
-- missing somewhere else.
do $$
declare src text; patched text;
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'athlete_plan_feed_impl';

  patched := replace(src,
    '''synced_at'', to_jsonb(now())',
    '''synced_at'', to_jsonb(now()),
    ''plan_authority'', public.coaching_plan_authority_enabled()');

  if patched = src then
    raise exception 'the feed payload anchor was not found; nothing patched';
  end if;
  execute patched;
end $$;

-- What this migration must not have done.
do $$
declare bad integer;
begin
  -- The filing door does not consult plan authority. If it ever does, evidence stops
  -- when the renderer is paused, which is the exact coupling this switch exists to break.
  select count(*) into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('record_session_from_form', 'record_session_from_form_impl')
     and pg_get_functiondef(p.oid) like '%plan_authority%';
  if bad <> 0 then raise exception 'the filing door must not read plan authority'; end if;

  -- It ships off.
  select count(*) into bad from public.coaching_sync_state where plan_authority_enabled;
  if bad <> 0 then raise exception 'plan authority must ship disabled'; end if;

  -- And the feed carries it.
  select count(*) into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'athlete_plan_feed_impl'
     and pg_get_functiondef(p.oid) like '%plan_authority%';
  if bad <> 1 then raise exception 'the feed does not carry plan authority'; end if;
end $$;
