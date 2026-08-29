-- Field membership is its own permission.
--
-- The Field relay served athlete training data to anyone who asked for about
-- 110 days: no token, no session, no membership check, on read and on write.
-- The group id was compiled into every shipped app, so it was never a secret,
-- and the in-app "invite code" resolved against a hardcoded string on device and
-- reached no server. There was no membership authority at all. Not a weak one.
--
-- This is that authority, and it is deliberately NOT athlete_memberships.
-- Belonging to FORM Miami and being coached by Brice are different facts about
-- different people: fifteen Field members have no coached plan, Natalie has a
-- plan and is not in the Field, and Marcus, Jose and Hope will eventually hold
-- both. Collapsing them would mean claiming a plan joins you to a room, or that
-- leaving a room takes your plan.

create table public.field_groups (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.field_groups (id, name)
values ('form_miami_001', 'FORM Miami')
on conflict (id) do nothing;

create table public.field_group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.field_groups(id) on delete cascade,
  -- The authenticated user, not an email and not a device id. An email is a
  -- string the client can send; this is who the token says they are.
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'removed')),
  -- The legacy iCloud key, kept so existing Field history is not orphaned. It is
  -- a lookup for old local data, never an authorization input.
  legacy_key text,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index field_group_memberships_user_idx
  on public.field_group_memberships (user_id, status);

alter table public.field_groups enable row level security;
alter table public.field_group_memberships enable row level security;

-- You can see the groups you belong to, and the membership rows of groups you
-- belong to. Nothing enumerates a roster you are not in.
create policy field_groups_member_read on public.field_groups
  for select to authenticated using (
    exists (select 1 from public.field_group_memberships m
             where m.group_id = field_groups.id and m.user_id = auth.uid() and m.status = 'active'));

create policy field_memberships_own_read on public.field_group_memberships
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.field_group_memberships mine
                where mine.group_id = group_id and mine.user_id = auth.uid()
                  and mine.status = 'active'));

-- No insert, update or delete policy. Membership is granted by an explicit
-- server path, never by a client asking to join, which is exactly how a
-- hardcoded room code became a membership in the first place.

comment on table public.field_group_memberships is
  'Who belongs to a Field room. Separate from athlete_memberships on purpose: being in FORM Miami and being coached are different facts about different people. Keyed on the authenticated user id, never on an email or a device id the client could send. legacy_key preserves the old iCloud identity for existing history and is never read as authorization.';

-- ── Durable security logging ────────────────────────────────────────────────
--
-- The exposure lasted about 110 days and its volume is unrecoverable, because
-- the host keeps request logs for roughly an hour and has no drain. Reopening
-- Field without somewhere durable to look would mean the next incident is
-- equally unmeasurable. This is that place, and it exists before Field reopens.

create table public.field_access_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  route text not null,
  method text not null,
  -- Null when the request carried no valid token: the interesting case.
  user_id uuid references auth.users(id) on delete set null,
  group_id text,
  outcome text not null check (outcome in ('allowed', 'denied_no_token', 'denied_not_member', 'denied_closed')),
  -- Deliberately absent: IP, user agent, request body, entry contents. This
  -- answers "was there traffic and was it authorized", not "who is this person
  -- and what did they run".
  detail text
);

create index field_access_log_at_idx on public.field_access_log (at desc);
create index field_access_log_outcome_idx on public.field_access_log (outcome, at desc);

alter table public.field_access_log enable row level security;
-- Nobody reads this through the API. It is for the operator, in the dashboard.
-- No select policy exists.

comment on table public.field_access_log is
  'Durable record that a Field request happened and whether it was authorized. Carries no IP, no user agent, no request body and no entry contents: it answers whether there was traffic and whether it was allowed, not who someone is or what they ran. Exists because the previous exposure lasted about 110 days and its volume can never be known.';

do $$
declare bad integer;
begin
  select count(*) into bad from pg_policies
   where schemaname = 'public' and tablename = 'field_group_memberships'
     and cmd in ('INSERT', 'UPDATE', 'DELETE');
  if bad > 0 then raise exception 'a client can grant itself Field membership through % policies', bad; end if;

  select count(*) into bad from pg_policies
   where schemaname = 'public' and tablename = 'field_access_log';
  if bad > 0 then raise exception 'the access log is readable through the API'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Lifecycle. The part that makes a membership auditable rather than merely present.
--
-- Field was open to anyone who knew a URL for a hundred and ten days. What made it
-- unrecoverable afterwards was not the hole itself but that nothing recorded who had
-- been let in, by whom, or when — so the only honest answer to "who had access in
-- June" was that nobody knows. A membership table that cannot answer that question
-- has not fixed the problem, it has moved it.

alter table public.field_group_memberships
  add column if not exists granted_by uuid references auth.users(id) on delete set null,
  add column if not exists granted_reason text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id) on delete set null,
  add column if not exists revoked_reason text;

comment on column public.field_group_memberships.granted_by is
  'Who let this person in. Nullable only for rows created before anyone was asking; every grant made through grant_field_membership carries it.';
comment on column public.field_group_memberships.revoked_at is
  'When access ended. Revoking sets status to removed and stamps this; the row itself stays, because deleting it would erase the fact that the person ever had access — which is the only thing an audit actually needs.';

-- Every grant and every revocation, append only. The memberships table says who has
-- access now; this says who has ever had it, and neither can be edited into agreeing
-- with a more convenient story.
create table if not exists public.field_membership_events (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  user_id uuid not null,
  event text not null check (event in ('granted', 'revoked')),
  actor uuid references auth.users(id) on delete set null,
  reason text,
  at timestamptz not null default now()
);

create index if not exists field_membership_events_user_idx
  on public.field_membership_events (user_id, at desc);

alter table public.field_membership_events enable row level security;

create trigger field_membership_events_immutable
  before update or delete on public.field_membership_events
  for each row execute function public.prevent_immutable_change();

-- Granting and revoking are acts, so they are functions with an actor rather than
-- writes a client can make. There is deliberately no insert, update or delete policy
-- on memberships at all: a client that could write its own membership row is a
-- client that could grant itself access, which is the whole vulnerability again in a
-- new shape.
create or replace function public.grant_field_membership(
  p_group_id text, p_user_id uuid, p_reason text, p_role text default 'member')
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare membership_id uuid;
begin
  if not exists (
    select 1 from public.field_group_memberships
     where group_id = p_group_id and user_id = auth.uid()
       and role = 'admin' and status = 'active') then
    raise exception 'only a group admin grants access to it';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'a grant carries why it was made';
  end if;

  insert into public.field_group_memberships (group_id, user_id, role, status, granted_by, granted_reason)
  values (p_group_id, p_user_id, coalesce(p_role, 'member'), 'active', auth.uid(), p_reason)
  on conflict (group_id, user_id) do update
     set status = 'active', granted_by = auth.uid(), granted_reason = p_reason,
         revoked_at = null, revoked_by = null, revoked_reason = null
  returning id into membership_id;

  insert into public.field_membership_events (group_id, user_id, event, actor, reason)
  values (p_group_id, p_user_id, 'granted', auth.uid(), p_reason);
  return membership_id;
end $$;

-- Revoking never deletes. The person's history stays attached to them, and the fact
-- that they once had access stays true, because an audit that can only see the
-- present cannot answer the question anyone will actually ask.
create or replace function public.revoke_field_membership(
  p_group_id text, p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.field_group_memberships
     where group_id = p_group_id and user_id = auth.uid()
       and role = 'admin' and status = 'active') then
    raise exception 'only a group admin removes access to it';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'a revocation carries why it was made';
  end if;

  update public.field_group_memberships
     set status = 'removed', revoked_at = now(), revoked_by = auth.uid(), revoked_reason = p_reason
   where group_id = p_group_id and user_id = p_user_id;

  insert into public.field_membership_events (group_id, user_id, event, actor, reason)
  values (p_group_id, p_user_id, 'revoked', auth.uid(), p_reason);
end $$;

revoke all on function public.grant_field_membership(text, uuid, text, text) from public, anon;
revoke all on function public.revoke_field_membership(text, uuid, text) from public, anon;
grant execute on function public.grant_field_membership(text, uuid, text, text) to authenticated;
grant execute on function public.revoke_field_membership(text, uuid, text) to authenticated;

-- Retention. An access log kept forever becomes its own liability: it is a record of
-- where people were and when, and the reason it exists — noticing a door left open —
-- stops needing rows older than a season.
create or replace function public.prune_field_access_log()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with gone as (
    delete from public.field_access_log where at < now() - interval '180 days' returning 1)
  select count(*)::integer from gone;
$$;

comment on function public.prune_field_access_log is
  'Drops access-log rows past 180 days. The log exists to notice a door left open, and that job never needs a year of history.';

do $$
declare writable integer; readable integer;
begin
  select count(*) into writable from pg_policies
   where schemaname = 'public' and tablename = 'field_group_memberships'
     and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');
  if writable > 0 then
    raise exception 'a client can write its own Field membership through % policies', writable;
  end if;

  select count(*) into readable from pg_policies
   where schemaname = 'public' and tablename = 'field_access_log' and cmd in ('SELECT', 'ALL');
  if readable > 0 then
    raise exception 'the Field access log is client-readable through % policies', readable;
  end if;
end $$;
