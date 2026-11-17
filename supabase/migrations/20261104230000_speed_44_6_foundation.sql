-- FORM 44.6 · Speed foundation. Additive: no existing filing, plan or mark is rewritten.
-- Release visibility is data-owned so athlete and Coach Mirror resolve the same tabs.
-- This gate never deletes or changes underlying plans, completions, or measurements.

create table public.athlete_training_tab_access (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  speed_enabled boolean not null default false,
  strength_enabled boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table public.athlete_speed_settings (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  distance_keys integer[] not null default array[100,200,300,400,600,800,1000],
  default_distance_m integer not null default 400,
  pace_unit text,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  constraint speed_keys_not_empty check (cardinality(distance_keys) between 1 and 12),
  constraint speed_default_is_visible check (default_distance_m=any(distance_keys)),
  constraint speed_pace_unit_valid check (pace_unit is null or pace_unit in ('km','mi')),
  constraint speed_keys_allowed check (
    distance_keys <@ array[100,200,300,400,600,800,1000,1609,3000,3219,
                           4828,5000,6437,10000,16093,21098,42195]
  )
);

create or replace function public.speed_settings_keys_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare n integer;
begin
  select count(distinct item.value) into n
  from unnest(new.distance_keys) as item(value);
  if n <> cardinality(new.distance_keys) then
    raise exception 'Speed distance keys must be unique';
  end if;
  return new;
end;
$$;
create trigger speed_settings_keys_guard
  before insert or update on public.athlete_speed_settings
  for each row execute function public.speed_settings_keys_guard();

create table public.athlete_season_pins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  block_id uuid references public.training_blocks(id),
  position integer not null check (position >= 0),
  is_peak boolean not null default false,
  pinned_by uuid,
  pinned_at timestamptz not null default now(),
  unique (athlete_id, completion_id),
  unique (athlete_id, position)
);
create unique index athlete_speed_one_peak_per_season
  on public.athlete_season_pins
  (athlete_id,coalesce(block_id,'00000000-0000-0000-0000-000000000000'::uuid))
  where is_peak;

create or replace function public.speed_pin_matches_athlete()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.session_completions c
                 where c.id = new.completion_id and c.athlete_id = new.athlete_id) then
    raise exception 'Pin must reference this athlete''s completion';
  end if;
  if new.block_id is not null and not exists (
    select 1 from public.training_blocks b
    where b.id = new.block_id and b.athlete_id = new.athlete_id
  ) then
    raise exception 'Season block must belong to this athlete';
  end if;
  return new;
end;
$$;
create trigger speed_pin_athlete_guard
  before insert or update on public.athlete_season_pins
  for each row execute function public.speed_pin_matches_athlete();

-- Only a published immutable version can be linked to a plan or completion.
create table public.vault_sessions (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  family text not null default 'SPEED' check (family in ('SPEED','LONG HOLDS')),
  authored_order integer not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.vault_session_versions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.vault_sessions(id),
  version_number integer not null check (version_number > 0),
  -- Array of blocks, each carrying count, distance, and an authored target band.
  blocks jsonb not null check (jsonb_typeof(blocks) = 'array' and jsonb_array_length(blocks)>0),
  authored_by uuid,
  authored_at timestamptz not null default now(),
  unique (session_id, version_number),
  unique (id, session_id)
);

create or replace function public.speed_vault_blocks_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare b jsonb;
begin
  for b in select value from jsonb_array_elements(new.blocks) loop
    if jsonb_typeof(b)<>'object'
       or coalesce((b->>'reps')::integer,0) not between 1 and 100
       or greatest(coalesce((b->>'distanceMeters')::integer,0),
                   coalesce((b->>'durationSeconds')::integer,0))<=0
       or ((b->>'targetMinMs') is null)<>( (b->>'targetMaxMs') is null )
       or (b->>'targetMinMs')::bigint<0
       or (b->>'targetMinMs')::bigint>(b->>'targetMaxMs')::bigint then
      raise exception 'Invalid Vault block';
    end if;
  end loop;
  return new;
end;
$$;
create trigger speed_vault_blocks_guard
  before insert on public.vault_session_versions
  for each row execute function public.speed_vault_blocks_guard();

create or replace function public.speed_vault_immutable()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'Vault versions are immutable; create a new version';
end;
$$;
create trigger speed_vault_version_immutable
  before update or delete on public.vault_session_versions
  for each row execute function public.speed_vault_immutable();

alter table public.planned_session_versions
  add column vault_session_version_id uuid references public.vault_session_versions(id);
alter table public.session_completions
  add column vault_session_version_id uuid references public.vault_session_versions(id),
  add column timing_source text check (timing_source in (
    'stopwatch','lap','timer','watch','strava','text'
  ));

-- Legacy published versions and filed completions are not rewritten to link
-- the Vault. A signed link points at the immutable authored version instead.
create table public.speed_plan_vault_links (
  plan_version_id uuid primary key references public.planned_session_versions(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  vault_version_id uuid not null references public.vault_session_versions(id),
  linked_by uuid not null,
  source_note text not null check (length(trim(source_note)) > 0),
  linked_at timestamptz not null default now()
);
create table public.speed_completion_vault_links (
  completion_id uuid primary key references public.session_completions(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  vault_version_id uuid not null references public.vault_session_versions(id),
  linked_by uuid not null,
  source_note text not null check (length(trim(source_note)) > 0),
  linked_at timestamptz not null default now()
);
create or replace function public.speed_vault_link_ownership()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name='speed_plan_vault_links' then
    if not exists (select 1 from public.planned_session_versions v
                   where v.id=new.plan_version_id and v.athlete_id=new.athlete_id) then
      raise exception 'Vault plan link has the wrong athlete';
    end if;
  elsif not exists (select 1 from public.session_completions c
                    where c.id=new.completion_id and c.athlete_id=new.athlete_id) then
    raise exception 'Vault completion link has the wrong athlete';
  end if;
  return new;
end;
$$;
create trigger speed_plan_vault_link_guard
  before insert on public.speed_plan_vault_links
  for each row execute function public.speed_vault_link_ownership();
create trigger speed_completion_vault_link_guard
  before insert on public.speed_completion_vault_links
  for each row execute function public.speed_vault_link_ownership();
create trigger speed_plan_vault_link_immutable
  before update or delete on public.speed_plan_vault_links
  for each row execute function public.speed_vault_immutable();
create trigger speed_completion_vault_link_immutable
  before update or delete on public.speed_completion_vault_links
  for each row execute function public.speed_vault_immutable();

-- Append-only corrections preserve the original filed piece and its provenance.
-- Use only where a coach has resolved an exact prescribed distance against the
-- filed evidence (e.g. a watch recorded a rep's time but no distance).
create table public.speed_piece_distance_corrections (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  piece_id uuid not null unique references public.session_pieces(id) on delete cascade,
  distance_m integer not null check (distance_m > 0),
  signed_by uuid not null,
  source_note text not null check (length(trim(source_note)) > 0),
  signed_at timestamptz not null default now()
);
create or replace function public.speed_piece_correction_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.session_pieces p
    where p.id = new.piece_id and p.athlete_id = new.athlete_id
      and p.kind = 'rep' and p.distance is null
  ) then
    raise exception 'Correction must reference a distance-free rep of this athlete';
  end if;
  return new;
end;
$$;
create trigger speed_piece_correction_athlete_guard
  before insert on public.speed_piece_distance_corrections
  for each row execute function public.speed_piece_correction_guard();
create trigger speed_piece_correction_immutable
  before update or delete on public.speed_piece_distance_corrections
  for each row execute function public.speed_vault_immutable();

create index speed_pieces_completion_position on public.session_pieces(completion_id, position);
create index speed_completions_athlete_recent on public.session_completions(athlete_id, filed_at desc)
  where status in ('completed','partial','changed');
create index speed_season_pins_order on public.athlete_season_pins(athlete_id, position);

-- Exposed tables are closed by default. No athlete sees another's times.
alter table public.athlete_speed_settings enable row level security;
alter table public.athlete_training_tab_access enable row level security;
alter table public.athlete_season_pins enable row level security;
alter table public.vault_sessions enable row level security;
alter table public.vault_session_versions enable row level security;
alter table public.speed_piece_distance_corrections enable row level security;
alter table public.speed_plan_vault_links enable row level security;
alter table public.speed_completion_vault_links enable row level security;

create policy speed_settings_read on public.athlete_speed_settings
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy speed_settings_coach_insert on public.athlete_speed_settings
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and updated_by = auth.uid());
create policy speed_settings_coach_update on public.athlete_speed_settings
  for update to authenticated using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id) and updated_by = auth.uid());

create policy training_tab_access_read on public.athlete_training_tab_access
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy training_tab_access_coach_insert on public.athlete_training_tab_access
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and updated_by = auth.uid());
create policy training_tab_access_coach_update on public.athlete_training_tab_access
  for update to authenticated using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id) and updated_by = auth.uid());

create policy speed_pins_read on public.athlete_season_pins
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy speed_pins_coach_insert on public.athlete_season_pins
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and pinned_by = auth.uid());
create policy speed_pins_coach_update on public.athlete_season_pins
  for update to authenticated using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id) and pinned_by = auth.uid());
create policy speed_pins_coach_delete on public.athlete_season_pins
  for delete to authenticated using (public.is_coach_member(athlete_id));

create policy speed_vault_read on public.vault_sessions
  for select to authenticated using (
    published or public.is_active_coaching_administrator() or exists (
      select 1
      from public.athlete_memberships membership
      join public.athlete_training_tab_access access on access.athlete_id=membership.athlete_id
      where membership.user_id=auth.uid()
        and membership.role='athlete' and membership.status='active'
        and access.speed_enabled
    )
  );
create policy speed_vault_versions_read on public.vault_session_versions
  for select to authenticated using (
    exists (select 1 from public.vault_sessions s
            where s.id = session_id)
  );
create policy speed_vault_coach_insert on public.vault_sessions
  for insert to authenticated with check (public.is_active_coaching_administrator());
create policy speed_vault_coach_update on public.vault_sessions
  for update to authenticated using (public.is_active_coaching_administrator())
  with check (public.is_active_coaching_administrator());
create policy speed_vault_version_coach_insert on public.vault_session_versions
  for insert to authenticated with check (
    public.is_active_coaching_administrator() and authored_by = auth.uid());

create policy speed_piece_correction_read on public.speed_piece_distance_corrections
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy speed_piece_correction_coach_insert on public.speed_piece_distance_corrections
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and signed_by = auth.uid());

create policy speed_plan_vault_link_read on public.speed_plan_vault_links
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy speed_plan_vault_link_coach_insert on public.speed_plan_vault_links
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and linked_by = auth.uid());
create policy speed_completion_vault_link_read on public.speed_completion_vault_links
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy speed_completion_vault_link_coach_insert on public.speed_completion_vault_links
  for insert to authenticated with check (
    public.is_coach_member(athlete_id) and linked_by = auth.uid());

revoke all on public.athlete_speed_settings, public.athlete_training_tab_access,
  public.athlete_season_pins,
  public.vault_sessions, public.vault_session_versions,
  public.speed_piece_distance_corrections, public.speed_plan_vault_links,
  public.speed_completion_vault_links from anon;
grant select on public.athlete_speed_settings, public.athlete_training_tab_access,
  public.athlete_season_pins,
  public.vault_sessions, public.vault_session_versions,
  public.speed_piece_distance_corrections, public.speed_plan_vault_links,
  public.speed_completion_vault_links to authenticated;
grant insert, update on public.athlete_speed_settings, public.athlete_training_tab_access,
  public.athlete_season_pins,
  public.vault_sessions to authenticated;
grant delete on public.athlete_season_pins to authenticated;
grant insert on public.vault_session_versions, public.speed_piece_distance_corrections
  ,public.speed_plan_vault_links,public.speed_completion_vault_links to authenticated;
