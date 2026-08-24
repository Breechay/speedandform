-- FORM private athlete system · Slice 1 foundation
-- Clean-project migration for pbgsjjegycacodiltbhn.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9-]+$'),
  display_name text not null,
  first_name text not null,
  home_surface text not null check (home_surface in ('website', 'form')),
  target_event text,
  goal_label text,
  program_name text not null,
  account_label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athlete_memberships (
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('athlete', 'coach')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  primary key (athlete_id, user_id, role)
);

create unique index athlete_one_active_owner_idx
  on public.athlete_memberships (athlete_id)
  where role = 'athlete' and status = 'active';

create table public.access_invites (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  email text not null check (email = lower(email)),
  role text not null check (role in ('athlete', 'coach')),
  expires_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (athlete_id, email, role)
);

create table public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  source text not null check (source in ('coach_authored', 'form_program')),
  name text not null,
  block_number smallint not null check (block_number > 0),
  target_event text,
  goal_label text,
  current_week smallint not null default 1 check (current_week > 0),
  total_weeks smallint not null check (total_weeks > 0),
  starts_on date,
  ends_on date,
  status text not null default 'active' check (status in ('draft', 'active', 'complete', 'archived')),
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_active_block_per_athlete_idx
  on public.training_blocks (athlete_id)
  where status = 'active';

create table public.training_weeks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  week_number smallint not null check (week_number >= 0),
  starts_on date,
  ends_on date,
  intent text not null,
  matters_because text not null,
  state text not null default 'planned' check (state in ('planned', 'in_progress', 'complete', 'changed')),
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, week_number)
);

create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  week_id uuid not null references public.training_weeks(id) on delete cascade,
  scheduled_on date,
  day_label text not null,
  position smallint not null check (position > 0),
  state text not null default 'published' check (state in ('draft', 'published', 'completed', 'changed', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, position)
);

create table public.planned_session_versions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null,
  prescribed_distance numeric(6,2),
  distance_unit text check (distance_unit in ('mi', 'km')),
  prescribed_duration_minutes integer check (prescribed_duration_minutes is null or prescribed_duration_minutes >= 0),
  intent text not null,
  details text,
  change_reason text,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (planned_session_id, version_number)
);

create table public.athlete_baselines (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  running_history text not null,
  longest_run numeric(6,2),
  current_frequency smallint,
  constraints text,
  strength_schedule text,
  source text not null default 'athlete' check (source in ('athlete', 'coach_import')),
  authored_by uuid references auth.users(id) on delete set null,
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_completions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  status text not null check (status in ('completed', 'partial', 'changed', 'skipped')),
  actual_distance numeric(6,2) check (actual_distance is null or actual_distance >= 0),
  distance_unit text check (distance_unit in ('mi', 'km')),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  felt text,
  knee_during text,
  knee_after text,
  recovered_next_day boolean,
  athlete_note text,
  strava_url text,
  source text not null default 'athlete' check (source in ('athlete', 'coach_import', 'form')),
  filed_by uuid references auth.users(id) on delete set null,
  filed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (planned_session_id, filed_at)
);

create table public.completion_revisions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  previous_value jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.completion_evidence (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  storage_path text,
  external_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1)
);

create table public.directions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  protected_variable text not null,
  movable_variable text,
  stop_or_change_if text,
  priority_targets jsonb not null default '[]'::jsonb,
  execution_context jsonb not null default '{}'::jsonb,
  athlete_text text not null,
  delivery_state text not null default 'draft' check (delivery_state in ('draft', 'published', 'delivered_externally', 'superseded')),
  delivered_wording text,
  authored_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(priority_targets) = 'array'),
  check (jsonb_array_length(priority_targets) between 1 and 4),
  check (delivery_state <> 'delivered_externally' or delivered_wording is not null)
);

create table public.reads (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  athlete_text text not null,
  question_answered text not null,
  delivery_state text not null default 'draft' check (delivery_state in ('draft', 'published', 'delivered_externally', 'superseded')),
  delivered_wording text,
  authored_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery_state <> 'delivered_externally' or delivered_wording is not null)
);

create table public.read_completions (
  read_id uuid not null references public.reads(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  primary key (read_id, completion_id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  decision_type text not null,
  athlete_text text not null,
  rationale text not null,
  effective_on date not null,
  delivery_state text not null default 'published' check (delivery_state in ('draft', 'published', 'delivered_externally', 'superseded')),
  delivered_wording text,
  authored_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery_state <> 'delivered_externally' or delivered_wording is not null)
);

create table public.decision_completions (
  decision_id uuid not null references public.decisions(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  primary key (decision_id, completion_id)
);

create table public.coach_private_notes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  completion_id uuid references public.session_completions(id) on delete set null,
  read_id uuid references public.reads(id) on delete set null,
  decision_id uuid references public.decisions(id) on delete set null,
  body text not null,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athlete_marks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  block_id uuid references public.training_blocks(id) on delete cascade,
  mark_type text not null,
  label text not null,
  current_value numeric(8,2),
  target_value numeric(8,2),
  unit text,
  current_question text not null,
  is_primary boolean not null default true,
  active boolean not null default true,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_primary_mark_per_athlete_idx
  on public.athlete_marks (athlete_id)
  where is_primary and active;

create table public.mark_signals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  label text not null,
  value text not null,
  position smallint not null check (position between 1 and 2),
  unique (mark_id, position)
);

create table public.mark_checkpoints (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  value numeric(8,2) not null,
  label text not null,
  position smallint not null check (position > 0),
  state text not null default 'proposed' check (state in ('reached', 'current', 'proposed', 'repeated', 'retired')),
  unique (mark_id, position)
);

create table public.mark_gate_conditions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  condition_text text not null,
  state text not null default 'unknown' check (state in ('met', 'not_met', 'unknown')),
  position smallint not null check (position between 1 and 4),
  unique (mark_id, position)
);

create table public.movement_reads (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  read_id uuid references public.reads(id) on delete set null,
  marker text not null check (marker in ('heel_light', 'chest_proud', 'wrist_to_hip', 'single_leg_control', 'running_economy')),
  state text not null check (state in ('present', 'available', 'fades', 'developing')),
  cue text not null,
  position smallint not null check (position between 1 and 5),
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (athlete_id, marker)
);

create table public.support_prescriptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  title text not null,
  summary text,
  shared_with_strength_coach boolean not null default false,
  active boolean not null default true,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_items (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  prescription_id uuid not null references public.support_prescriptions(id) on delete cascade,
  purpose text not null,
  movement text not null,
  reason text not null,
  cue text not null,
  dose text not null,
  group_position smallint not null,
  item_position smallint not null,
  unique (prescription_id, group_position, item_position)
);

create table public.coach_tasks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  state text not null check (state in ('needs_you', 'waiting_for_run', 'waiting_for_athlete', 'ready_to_publish', 'plan_changed', 'on_track', 'nothing_needed', 'resolved')),
  title text not null,
  summary text not null,
  waiting_on text,
  priority smallint not null default 50,
  due_on date,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_open_task_per_athlete_idx
  on public.coach_tasks (athlete_id)
  where resolved_at is null;

create table public.coach_task_evidence (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  task_id uuid not null references public.coach_tasks(id) on delete cascade,
  label text not null,
  value text not null,
  position smallint not null,
  unique (task_id, position)
);

create table public.coach_task_actions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  task_id uuid not null references public.coach_tasks(id) on delete cascade,
  label text not null,
  decision_type text not null,
  athlete_text text not null,
  rationale text not null,
  is_primary boolean not null default false,
  position smallint not null,
  unique (task_id, position)
);

create table public.coach_admin_status (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  relationship_label text not null,
  payment_state text not null check (payment_state in ('paid', 'due', 'complimentary', 'not_applicable')),
  private_payment_reference text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.record_publications (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  publication_slug text not null,
  revision integer not null check (revision > 0),
  athlete_display_name text not null,
  headline text not null,
  mark_label text not null,
  mark_value text not null,
  summary text not null,
  consent_recorded_at timestamptz not null,
  consent_note text not null,
  published_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (publication_slug, revision)
);

-- Every child repeats athlete_id so policies can stay simple. Composite foreign
-- keys make that repeated identity trustworthy rather than client asserted.
alter table public.training_blocks add unique (id, athlete_id);
alter table public.training_weeks add unique (id, athlete_id);
alter table public.planned_sessions add unique (id, athlete_id);
alter table public.session_completions add unique (id, athlete_id);
alter table public.reads add unique (id, athlete_id);
alter table public.decisions add unique (id, athlete_id);
alter table public.athlete_marks add unique (id, athlete_id);
alter table public.support_prescriptions add unique (id, athlete_id);
alter table public.coach_tasks add unique (id, athlete_id);

alter table public.training_weeks add constraint training_weeks_block_athlete_fk
  foreign key (block_id, athlete_id) references public.training_blocks(id, athlete_id) on delete cascade;
alter table public.planned_sessions add constraint planned_sessions_week_athlete_fk
  foreign key (week_id, athlete_id) references public.training_weeks(id, athlete_id) on delete cascade;
alter table public.planned_session_versions add constraint planned_versions_session_athlete_fk
  foreign key (planned_session_id, athlete_id) references public.planned_sessions(id, athlete_id) on delete cascade;
alter table public.session_completions add constraint completions_session_athlete_fk
  foreign key (planned_session_id, athlete_id) references public.planned_sessions(id, athlete_id) on delete restrict;
alter table public.completion_revisions add constraint completion_revisions_athlete_fk
  foreign key (completion_id, athlete_id) references public.session_completions(id, athlete_id) on delete cascade;
alter table public.completion_evidence add constraint completion_evidence_athlete_fk
  foreign key (completion_id, athlete_id) references public.session_completions(id, athlete_id) on delete cascade;
alter table public.directions add constraint directions_session_athlete_fk
  foreign key (planned_session_id, athlete_id) references public.planned_sessions(id, athlete_id) on delete cascade;
alter table public.mark_signals add constraint mark_signals_athlete_fk
  foreign key (mark_id, athlete_id) references public.athlete_marks(id, athlete_id) on delete cascade;
alter table public.mark_checkpoints add constraint mark_checkpoints_athlete_fk
  foreign key (mark_id, athlete_id) references public.athlete_marks(id, athlete_id) on delete cascade;
alter table public.mark_gate_conditions add constraint mark_gate_conditions_athlete_fk
  foreign key (mark_id, athlete_id) references public.athlete_marks(id, athlete_id) on delete cascade;
alter table public.support_items add constraint support_items_athlete_fk
  foreign key (prescription_id, athlete_id) references public.support_prescriptions(id, athlete_id) on delete cascade;
alter table public.coach_task_evidence add constraint coach_task_evidence_athlete_fk
  foreign key (task_id, athlete_id) references public.coach_tasks(id, athlete_id) on delete cascade;
alter table public.coach_task_actions add constraint coach_task_actions_athlete_fk
  foreign key (task_id, athlete_id) references public.coach_tasks(id, athlete_id) on delete cascade;

-- Identity helpers are the only authorization primitives used by policies.
create or replace function public.is_athlete_member(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = target_athlete_id
      and m.user_id = auth.uid()
      and m.role = 'athlete'
      and m.status = 'active'
  );
$$;

create or replace function public.is_coach_member(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = target_athlete_id
      and m.user_id = auth.uid()
      and m.role = 'coach'
      and m.status = 'active'
  );
$$;

create or replace function public.can_read_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_athlete_member(target_athlete_id)
      or public.is_coach_member(target_athlete_id);
$$;

revoke all on function public.is_athlete_member(uuid) from public;
revoke all on function public.is_coach_member(uuid) from public;
revoke all on function public.can_read_athlete(uuid) from public;
grant execute on function public.is_athlete_member(uuid) to authenticated;
grant execute on function public.is_coach_member(uuid) to authenticated;
grant execute on function public.can_read_athlete(uuid) to authenticated;

create or replace function public.claim_access()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  claimed integer := 0;
begin
  if caller_id is null or caller_email = '' then
    raise exception 'A verified email session is required';
  end if;

  insert into public.profiles (user_id, display_name)
  values (caller_id, coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', split_part(caller_email, '@', 1)))
  on conflict (user_id) do nothing;

  insert into public.athlete_memberships (athlete_id, user_id, role)
  select i.athlete_id, caller_id, i.role
  from public.access_invites i
  where i.email = caller_email
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
  on conflict do nothing;

  get diagnostics claimed = row_count;

  update public.access_invites i
  set claimed_by = caller_id, claimed_at = now()
  where i.email = caller_email
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
    and exists (
      select 1 from public.athlete_memberships m
      where m.athlete_id = i.athlete_id
        and m.user_id = caller_id
        and m.role = i.role
    );

  return claimed;
end;
$$;

revoke all on function public.claim_access() from public;
grant execute on function public.claim_access() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (user_id) do nothing;

  insert into public.athlete_memberships (athlete_id, user_id, role)
  select i.athlete_id, new.id, i.role
  from public.access_invites i
  where i.email = lower(coalesce(new.email, ''))
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
  on conflict do nothing;

  update public.access_invites i
  set claimed_by = new.id, claimed_at = now()
  where i.email = lower(coalesce(new.email, ''))
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
    and exists (
      select 1 from public.athlete_memberships m
      where m.athlete_id = i.athlete_id
        and m.user_id = new.id
        and m.role = i.role
    );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.prevent_immutable_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Published history is append-only';
end;
$$;

create trigger planned_session_versions_immutable
  before update or delete on public.planned_session_versions
  for each row execute function public.prevent_immutable_change();

create or replace function public.audit_completion_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.completion_revisions (athlete_id, completion_id, previous_value, changed_by)
  values (old.athlete_id, old.id, to_jsonb(old), auth.uid());
  return new;
end;
$$;

create trigger session_completion_audit
  before update on public.session_completions
  for each row execute function public.audit_completion_change();

create or replace function public.resolve_coach_task(
  target_task_id uuid,
  target_action_id uuid default null,
  custom_athlete_text text default null,
  custom_rationale text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  task_row public.coach_tasks;
  action_row public.coach_task_actions;
  new_decision_id uuid;
  final_text text;
  final_rationale text;
  final_type text;
begin
  select * into task_row from public.coach_tasks where id = target_task_id for update;
  if task_row.id is null or not public.is_coach_member(task_row.athlete_id) then
    raise exception 'Task not available';
  end if;
  if task_row.resolved_at is not null then
    raise exception 'Task is already resolved';
  end if;

  if target_action_id is not null then
    select * into action_row
    from public.coach_task_actions
    where id = target_action_id and task_id = target_task_id;
    if action_row.id is null then raise exception 'Action not available'; end if;
    final_text := action_row.athlete_text;
    final_rationale := action_row.rationale;
    final_type := action_row.decision_type;
  else
    if nullif(trim(custom_athlete_text), '') is null or nullif(trim(custom_rationale), '') is null then
      raise exception 'Decision wording and rationale are required';
    end if;
    final_text := trim(custom_athlete_text);
    final_rationale := trim(custom_rationale);
    final_type := 'custom';
  end if;

  insert into public.decisions (
    athlete_id, decision_type, athlete_text, rationale, effective_on,
    delivery_state, authored_by, published_at
  ) values (
    task_row.athlete_id, final_type, final_text, final_rationale, current_date,
    'published', auth.uid(), now()
  ) returning id into new_decision_id;

  update public.coach_tasks
  set state = 'resolved', resolved_at = now(), resolved_by = auth.uid(), updated_at = now()
  where id = target_task_id;

  return new_decision_id;
end;
$$;

revoke all on function public.resolve_coach_task(uuid, uuid, text, text) from public;
grant execute on function public.resolve_coach_task(uuid, uuid, text, text) to authenticated;
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.prevent_immutable_change() from public;
revoke all on function public.audit_completion_change() from public;

-- Updated-at triggers.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','athletes','training_blocks','training_weeks','planned_sessions',
    'athlete_baselines','session_completions','directions','reads','decisions',
    'coach_private_notes','athlete_marks','support_prescriptions','coach_tasks','coach_admin_status'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

-- RLS defaults to deny. Policies below are explicit by owner and visibility.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','athletes','athlete_memberships','access_invites','training_blocks','training_weeks',
    'planned_sessions','planned_session_versions','athlete_baselines','session_completions',
    'completion_revisions','completion_evidence','directions','reads','read_completions','decisions',
    'decision_completions','coach_private_notes','athlete_marks','mark_signals','mark_checkpoints',
    'mark_gate_conditions','movement_reads','support_prescriptions','support_items','coach_tasks',
    'coach_task_evidence','coach_task_actions','coach_admin_status','record_publications'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy profiles_select_self on public.profiles for select to authenticated
  using (user_id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy athletes_read_members on public.athletes for select to authenticated
  using (public.can_read_athlete(id));
create policy athletes_coach_update on public.athletes for update to authenticated
  using (public.is_coach_member(id)) with check (public.is_coach_member(id));

create policy memberships_read_related on public.athlete_memberships for select to authenticated
  using (user_id = auth.uid() or public.is_coach_member(athlete_id));

create policy invites_coach_read on public.access_invites for select to authenticated
  using (public.is_coach_member(athlete_id));
create policy invites_coach_insert on public.access_invites for insert to authenticated
  with check (public.is_coach_member(athlete_id) and created_by = auth.uid());
create policy invites_coach_update on public.access_invites for update to authenticated
  using (public.is_coach_member(athlete_id)) with check (public.is_coach_member(athlete_id));
create policy invites_coach_delete on public.access_invites for delete to authenticated
  using (public.is_coach_member(athlete_id));

-- Athlete-safe, coach-authored tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_blocks','training_weeks','planned_sessions','planned_session_versions',
    'directions','reads','decisions','athlete_marks','mark_signals','mark_checkpoints',
    'mark_gate_conditions','movement_reads','support_prescriptions','support_items'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.can_read_athlete(athlete_id))', table_name || '_member_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_coach_member(athlete_id))', table_name || '_coach_insert', table_name);
    if table_name <> 'planned_session_versions' then
      execute format('create policy %I on public.%I for update to authenticated using (public.is_coach_member(athlete_id)) with check (public.is_coach_member(athlete_id))', table_name || '_coach_update', table_name);
      execute format('create policy %I on public.%I for delete to authenticated using (public.is_coach_member(athlete_id))', table_name || '_coach_delete', table_name);
    end if;
  end loop;
end;
$$;

create policy baseline_member_read on public.athlete_baselines for select to authenticated
  using (public.can_read_athlete(athlete_id));
create policy baseline_athlete_insert on public.athlete_baselines for insert to authenticated
  with check (public.is_athlete_member(athlete_id) and authored_by = auth.uid() and source = 'athlete');
create policy baseline_athlete_update on public.athlete_baselines for update to authenticated
  using (public.is_athlete_member(athlete_id))
  with check (public.is_athlete_member(athlete_id) and authored_by = auth.uid() and source = 'athlete');

create policy completions_member_read on public.session_completions for select to authenticated
  using (public.can_read_athlete(athlete_id));
create policy completions_athlete_insert on public.session_completions for insert to authenticated
  with check (public.is_athlete_member(athlete_id) and filed_by = auth.uid() and source = 'athlete');
create policy completions_athlete_update on public.session_completions for update to authenticated
  using (public.is_athlete_member(athlete_id) and filed_by = auth.uid())
  with check (public.is_athlete_member(athlete_id) and filed_by = auth.uid() and source = 'athlete');

create policy completion_revisions_member_read on public.completion_revisions for select to authenticated
  using (public.can_read_athlete(athlete_id));

create policy evidence_member_read on public.completion_evidence for select to authenticated
  using (public.can_read_athlete(athlete_id));
create policy evidence_athlete_insert on public.completion_evidence for insert to authenticated
  with check (
    public.is_athlete_member(athlete_id)
    and created_by = auth.uid()
    and exists (
      select 1 from public.session_completions c
      where c.id = completion_id and c.athlete_id = completion_evidence.athlete_id
    )
  );
create policy evidence_athlete_delete on public.completion_evidence for delete to authenticated
  using (public.is_athlete_member(athlete_id) and created_by = auth.uid());

create policy read_completions_member_read on public.read_completions for select to authenticated
  using (exists (select 1 from public.reads r where r.id = read_id and public.can_read_athlete(r.athlete_id)));
create policy read_completions_coach_insert on public.read_completions for insert to authenticated
  with check (exists (
    select 1 from public.reads r
    join public.session_completions c on c.id = completion_id and c.athlete_id = r.athlete_id
    where r.id = read_id and public.is_coach_member(r.athlete_id)
  ));
create policy read_completions_coach_delete on public.read_completions for delete to authenticated
  using (exists (select 1 from public.reads r where r.id = read_id and public.is_coach_member(r.athlete_id)));

create policy decision_completions_member_read on public.decision_completions for select to authenticated
  using (exists (select 1 from public.decisions d where d.id = decision_id and public.can_read_athlete(d.athlete_id)));
create policy decision_completions_coach_insert on public.decision_completions for insert to authenticated
  with check (exists (
    select 1 from public.decisions d
    join public.session_completions c on c.id = completion_id and c.athlete_id = d.athlete_id
    where d.id = decision_id and public.is_coach_member(d.athlete_id)
  ));
create policy decision_completions_coach_delete on public.decision_completions for delete to authenticated
  using (exists (select 1 from public.decisions d where d.id = decision_id and public.is_coach_member(d.athlete_id)));

-- Coach-only surfaces: no athlete policy exists.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'coach_private_notes','coach_tasks','coach_task_evidence','coach_task_actions','coach_admin_status'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_coach_member(athlete_id))', table_name || '_coach_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_coach_member(athlete_id))', table_name || '_coach_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_coach_member(athlete_id)) with check (public.is_coach_member(athlete_id))', table_name || '_coach_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_coach_member(athlete_id))', table_name || '_coach_delete', table_name);
  end loop;
end;
$$;

create policy publications_coach_all on public.record_publications for all to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
create policy publications_public_read on public.record_publications for select to anon, authenticated
  using (published_at is not null and revoked_at is null);

-- Private completion evidence bucket. Paths begin with the athlete UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-evidence', 'session-evidence', false, 8388608,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy session_evidence_member_read on storage.objects for select to authenticated
  using (
    bucket_id = 'session-evidence'
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );

create policy session_evidence_athlete_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'session-evidence'
    and owner_id = auth.uid()::text
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid()
        and m.role = 'athlete'
        and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );

create policy session_evidence_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'session-evidence' and owner_id = auth.uid()::text);

-- Public API grants remain narrower than RLS and include no coach-private table for anon.
grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon;
grant select on public.record_publications to anon;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.profiles, public.access_invites, public.athlete_baselines,
  public.session_completions, public.completion_evidence, public.training_blocks,
  public.training_weeks, public.planned_sessions, public.planned_session_versions,
  public.directions, public.reads, public.read_completions, public.decisions,
  public.decision_completions, public.coach_private_notes, public.athlete_marks,
  public.mark_signals, public.mark_checkpoints, public.mark_gate_conditions,
  public.movement_reads, public.support_prescriptions, public.support_items,
  public.coach_tasks, public.coach_task_evidence, public.coach_task_actions,
  public.coach_admin_status, public.record_publications to authenticated;
