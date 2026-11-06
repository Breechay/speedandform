-- FORM Miami Fall 2026 · season calendar and identity-scoped membership source.
-- Backend-first foundation for the approved B Lanes experience.
-- No athlete memberships are seeded here: an active joined_on requires a
-- separately verified coach decision and an established athlete actor link.
-- The 15 lines are calendar positions, NOT completed training weeks.

create table public.form_seasons (
  id uuid primary key default gen_random_uuid(),
  season_key text not null unique
    check (season_key = lower(season_key) and season_key ~ '^[a-z0-9-]+$'),
  group_label text not null,
  title text not null,
  host_city text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint form_seasons_dates_check check (ends_on >= starts_on)
);

create table public.form_season_phases (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.form_seasons(id) on delete cascade,
  position smallint not null check (position > 0),
  phase_key text not null
    check (phase_key = lower(phase_key) and phase_key ~ '^[a-z0-9-]+$'),
  title text not null,
  starts_on date not null,
  ends_on date not null,
  unique (season_id, position),
  unique (season_id, phase_key),
  constraint form_season_phases_dates_check check (ends_on >= starts_on)
);

create index form_season_phases_calendar_idx
  on public.form_season_phases(season_id, starts_on, ends_on);

-- Separate from athlete_memberships (login), field_group_memberships (host
-- groups), training_blocks (prescriptions) and race entries (intent/results).
create table public.form_season_memberships (
  season_id uuid not null references public.form_seasons(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  membership_role text not null default 'athlete'
    check (membership_role in ('athlete', 'community')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'paused', 'withdrawn')),
  joined_on date,
  privacy_mode text not null default 'private'
    check (privacy_mode in ('private', 'inherit')),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season_id, athlete_id),
  constraint form_season_active_membership_confirmed_check
    check (status <> 'active' or (joined_on is not null and confirmed_at is not null)),
  constraint form_season_withdrawal_state_check
    check (withdrawn_at is null or status = 'withdrawn')
);

create index form_season_memberships_athlete_status_idx
  on public.form_season_memberships(athlete_id, status, season_id);

create trigger form_seasons_updated_at_trigger
before update on public.form_seasons
for each row execute function public.set_updated_at();

create trigger form_season_memberships_updated_at_trigger
before update on public.form_season_memberships
for each row execute function public.set_updated_at();

-- Validate a verified joined_on against its own season, without baking
-- Fall 2026 dates into the general membership schema.
create function public.form_season_membership_date_guard()
returns trigger
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_starts_on date;
  v_ends_on date;
begin
  select s.starts_on, s.ends_on into v_starts_on, v_ends_on
    from public.form_seasons s where s.id = new.season_id;
  if not found then
    raise exception 'season_not_found' using errcode = '23503';
  end if;
  if new.joined_on is not null
     and (new.joined_on < v_starts_on or new.joined_on > v_ends_on) then
    raise exception 'season_join_date_out_of_range' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger form_season_membership_date_guard_trigger
before insert or update of season_id, joined_on
on public.form_season_memberships
for each row execute function public.form_season_membership_date_guard();

revoke all on function public.form_season_membership_date_guard()
  from public, anon, authenticated;

-- A published season and its chapters are a public calendar.
-- Individual membership, joined_on and privacy choices are never public.
alter table public.form_seasons enable row level security;
alter table public.form_season_phases enable row level security;
alter table public.form_season_memberships enable row level security;

revoke all on public.form_seasons, public.form_season_phases,
  public.form_season_memberships from public, anon, authenticated;

grant select on public.form_seasons, public.form_season_phases
  to anon, authenticated;
grant select on public.form_season_memberships to authenticated;
grant all on public.form_seasons, public.form_season_phases,
  public.form_season_memberships to service_role;

create policy form_seasons_public_calendar_read
  on public.form_seasons for select to anon, authenticated
  using (status in ('published', 'closed'));

create policy form_season_phases_public_calendar_read
  on public.form_season_phases for select to anon, authenticated
  using (
    exists (
      select 1 from public.form_seasons s
      where s.id = season_id and s.status in ('published', 'closed')
    )
  );

-- Reuse FORM's canonical Apple-aware athlete and coach access checks.
-- There are intentionally no authenticated write policies.
create policy form_season_memberships_related_read
  on public.form_season_memberships for select to authenticated
  using (public.can_read_athlete(athlete_id));

-- Native/Coach Mirror read model: actor is obtained from the signed-in
-- request, not a caller-supplied or name-matched roster. No completed-work
-- metric is returned: calendar elapsed time is not filed training.
create function public.form_season_member_context(
  p_season_key text default 'form-miami-fall-2026',
  p_athlete_id uuid default null
)
returns table (
  athlete_id uuid,
  season_id uuid,
  season_key text,
  group_label text,
  season_title text,
  starts_on date,
  ends_on date,
  season_revision integer,
  calendar_state text,
  calendar_week integer,
  total_weeks integer,
  phase_key text,
  phase_title text,
  phase_position smallint,
  joined_on date,
  first_eligible_week integer,
  membership_status text,
  privacy_mode text
)
language sql stable security invoker
set search_path = public, pg_temp
as $$
  with clock as (
    select (now() at time zone 'America/New_York')::date as today
  )
  select
    m.athlete_id, s.id, s.season_key, s.group_label, s.title,
    s.starts_on, s.ends_on, s.revision,
    case
      when clock.today < s.starts_on then 'upcoming'
      when clock.today > s.ends_on then 'closed'
      else 'in_season'
    end,
    case when clock.today between s.starts_on and s.ends_on
      then ((clock.today - s.starts_on) / 7 + 1)
      else null::integer end,
    ((s.ends_on - s.starts_on) / 7 + 1),
    p.phase_key, p.title, p.position,
    m.joined_on,
    ((m.joined_on - s.starts_on) / 7 + 1),
    m.status, m.privacy_mode
  from public.form_season_memberships m
  join public.form_seasons s on s.id = m.season_id
  cross join clock
  left join public.form_season_phases p
    on p.season_id = s.id and clock.today between p.starts_on and p.ends_on
  where s.season_key = p_season_key
    and s.status in ('published', 'closed')
    and m.status = 'active'
    and (
      (p_athlete_id is null and public.is_athlete_member(m.athlete_id))
      or
      (p_athlete_id = m.athlete_id and public.can_read_athlete(m.athlete_id))
    );
$$;

revoke all on function public.form_season_member_context(text, uuid)
  from public, anon;
grant execute on function public.form_season_member_context(text, uuid)
  to authenticated, service_role;

-- Coach-approved common season calendar only. Enrollment is intentionally
-- empty until the 11 effective dates are verified and each actor is linked.
insert into public.form_seasons
  (season_key, group_label, title, host_city, starts_on, ends_on, status, revision)
values
  ('form-miami-fall-2026', 'FORM Miami', 'Fall 2026', 'Miami',
   date '2026-10-19', date '2027-01-31', 'published', 1)
on conflict (season_key) do nothing;

insert into public.form_season_phases
  (season_id, position, phase_key, title, starts_on, ends_on)
select s.id, phase.position, phase.phase_key, phase.title,
  phase.starts_on, phase.ends_on
from public.form_seasons s
cross join (
  values
    (1::smallint, 'base', 'Base', date '2026-10-19', date '2026-11-22'),
    (2::smallint, 'build', 'Build', date '2026-11-23', date '2026-12-27'),
    (3::smallint, 'specific', 'Specific', date '2026-12-28', date '2027-01-24'),
    (4::smallint, 'transition', 'Transition', date '2027-01-25', date '2027-01-31')
) as phase(position, phase_key, title, starts_on, ends_on)
where s.season_key = 'form-miami-fall-2026'
on conflict (season_id, position) do nothing;

do $$
declare v_phase_count integer;
begin
  select count(*) into v_phase_count
  from public.form_season_phases p
  join public.form_seasons s on s.id=p.season_id
  where s.season_key='form-miami-fall-2026';
  if v_phase_count <> 4 then
    raise exception 'fall_2026_phase_calendar_mismatch';
  end if;
  if exists (
    select 1 from public.form_seasons s
    where s.season_key='form-miami-fall-2026'
      and (s.starts_on<>date '2026-10-19'
           or s.ends_on<>date '2027-01-31'
           or s.ends_on-s.starts_on+1<>105)
  ) then
    raise exception 'fall_2026_season_calendar_mismatch';
  end if;
end $$;

comment on function public.form_season_member_context(text, uuid) is
  'Authenticated personal/Coach Mirror Fall season context. Calendar weeks are not completed-work evidence.';
