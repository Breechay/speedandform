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
             where m.group_id = id and m.user_id = auth.uid() and m.status = 'active'));

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
