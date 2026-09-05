-- One plan, two athletes, and no ambiguity about where a prescription came from.
--
-- Until now Race Pace Durability was the name shared by two independently
-- authored blocks. The method existed as a word. This makes it an object: the
-- plan is authored once, athletes are assigned to it, and every future session
-- an athlete runs points at the plan session it came from.
--
-- Two deliberate differences from the athlete tables, and they are the reason
-- this is a plan rather than a template block:
--
--   · a plan asks a rung VALUE — twelve miles — not a checkpoint id. Checkpoints
--     belong to athletes; the assignment resolves value to that athlete's rung.
--   · a plan declares eligibility as a BOOLEAN — this component can establish —
--     not a mark id. A plan that stored athlete ids would not be a plan.

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  discipline text not null,
  total_weeks integer not null check (total_weeks > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  question text,
  for_whom text,
  entry_volume numeric,
  peak_volume numeric,
  race_pace_low_seconds integer,
  race_pace_high_seconds integer,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.training_plans is
  'An authored FORM plan. The prescription source of truth: athletes are assigned to it, and their sessions point back at its sessions. Not an athlete block and not a template athlete.';

create table if not exists public.training_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  version_number integer not null,
  summary text,
  cut_at timestamptz not null default now(),
  cut_by uuid references auth.users(id) on delete set null,
  unique (plan_id, version_number)
);

comment on table public.training_plan_versions is
  'Append-only. A cut never rewrites an assignment that was made against an earlier version.';

create table if not exists public.training_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  version_id uuid not null references public.training_plan_versions(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  phase text not null check (phase in ('build', 'ask', 'absorb', 'taper', 'race')),
  total_distance numeric,
  intent text,
  unique (version_id, week_number)
);

comment on column public.training_plan_weeks.phase is
  'What the week is for. `ask` is the only phase that puts an ownership question to the athlete; the rest are what make an ask answerable.';

create table if not exists public.training_plan_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  version_id uuid not null references public.training_plan_versions(id) on delete cascade,
  plan_week_id uuid not null references public.training_plan_weeks(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('MON','TUE','WED','THU','FRI','SAT','SUN')),
  role text not null default 'key' check (role in ('key', 'easy', 'support', 'rest')),
  position integer not null default 0,
  title text not null,
  intent text,
  details text,
  prescribed_distance numeric,
  distance_unit text default 'mi',
  asks_rung_value numeric,
  unique (plan_week_id, day_of_week, position)
);

comment on column public.training_plan_sessions.asks_rung_value is
  'The ladder value this session asks about — 5, 6, 8, 12 — expressed as a distance rather than a checkpoint id, because checkpoints belong to athletes. Null for every session that asks nothing, which is most of them.';

create table if not exists public.training_plan_components (
  id uuid primary key default gen_random_uuid(),
  plan_session_id uuid not null references public.training_plan_sessions(id) on delete cascade,
  position integer not null,
  role text not null check (role in ('warm_up', 'work', 'cool_down')),
  shape text not null check (shape in ('continuous', 'repetitions')),
  distance numeric,
  distance_unit text default 'mi',
  duration_seconds integer,
  repeat_count integer,
  pace_low_seconds integer,
  pace_high_seconds integer,
  rpe_low numeric,
  rpe_high numeric,
  recovery_kind text,
  recovery_seconds integer,
  counts_toward_mark boolean not null default false,
  unique (plan_session_id, position)
);

comment on column public.training_plan_components.counts_toward_mark is
  'Whether evidence from this component may answer the plan''s mark. A boolean, not a mark id: the assignment resolves it to the athlete''s own mark. Eligibility, never establishment.';

-- ── the assignment ─────────────────────────────────────────────────────────

create table if not exists public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete restrict,
  plan_version_id uuid not null references public.training_plan_versions(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  starts_at_plan_week integer not null default 1,
  starts_on date,
  notes text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (block_id)
);

comment on table public.plan_assignments is
  'This athlete''s block is an instance of that plan version, joined at that week. An athlete runs an assignment; a plan is what the assignment resolves against.';

-- ── the link that makes it one source rather than two copies ────────────────
--
-- A materialised row is an INSTANCE of a plan session. Without the link the two
-- are just synchronised copies that will drift silently; with it, divergence is
-- queryable and has to be either a deliberate override or a bug.

alter table public.planned_sessions
  add column if not exists plan_session_id uuid
    references public.training_plan_sessions(id) on delete set null,
  add column if not exists override_reason text;

comment on column public.planned_sessions.plan_session_id is
  'The plan session this was resolved from. Null for sessions authored before the plan existed, or authored outside one.';
comment on column public.planned_sessions.override_reason is
  'Null means inherited and regenerable. Text means a coach deliberately made this athlete differ from the plan, and says why. Placement of easy mileage is NOT an override — the plan recommends where the easy miles sit and the athlete may move them.';

alter table public.training_blocks
  add column if not exists plan_id uuid references public.training_plans(id) on delete set null,
  add column if not exists plan_version_id uuid references public.training_plan_versions(id) on delete set null;


-- ── Race Pace Durability v1 ────────────────────────────────────────────────
do $$
declare
  plan_id uuid; ver_id uuid; wk_id uuid; ses_id uuid;
begin
  insert into public.training_plans
    (slug, name, discipline, total_weeks, status, question, for_whom,
     entry_volume, peak_volume, race_pace_low_seconds, race_pace_high_seconds)
  values ('race-pace-durability', 'Race Pace Durability', 'half_marathon', 15, 'draft',
    'How far can you carry 6:30–6:45 before it comes apart?',
    'A runner already comfortable around 45 miles a week, with enough speed above half-marathon pace that race pace is not the speed problem, durable enough for three meaningful days, already owning about two continuous miles at race pace.',
    45, 60, 390, 405)
  returning id into plan_id;

  insert into public.training_plan_versions (plan_id, version_number, summary)
  values (plan_id, 1,
    'Volume 45 to 60 with peaks at W9 and W11. Specificity broken to continuous: 5, 6 and 8 on Tuesday, then 12 inside the Saturday long run at W12. Four asks. Race pace does not get faster because the athlete succeeds.')
  returning id into ver_id;


  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 1, 'build', 45, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '4 × 1 mi at race pace',
          'Meet the band. Short enough that holding it is a matter of attention, not durability.', 'Under 6:30 is a different session.', 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 1, 4, 390, 405, 'float', 180, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Threshold 3 × 8 min',
          'The ceiling stays where the last block left it.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 480, 3, 375, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 12, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 2, 'build', 48, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '3 × 2 mi at race pace',
          'Twice the rep, the same band. The question is whether 6:45 still feels like 6:45 in the third repetition.', 'Under 6:30 is a different session.', 10, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 3, 390, 405, 'float', 180, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Hills 8 × 45 s + strides',
          'Strength above the pace, bought cheaply.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, rpe_low, rpe_high, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 45, 8, 8, 9, 'easy', 120);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 13, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 13, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 3, 'build', 51, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '4 × 2 mi at race pace',
          'Eight miles of race pace, broken. The most volume at the band so far.', 'Under 6:30 is a different session.', 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 4, 390, 405, 'float', 180, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Threshold 2 × 10 min',
          'Longer at threshold, fewer repetitions.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 600, 2, 375, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 13, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 13, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 4, 'ask', 46, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '5 mi continuous at race pace',
          'The first continuous question. Five miles, unbroken, inside the band — and the week is lighter so the legs answer it rather than the fatigue.', 'Under 6:30 is a different session.', 9, 5)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 5, 390, 405, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 12, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 5, 'build', 53, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '5 × 1 mi at race pace',
          'Back to broken work with a shorter float. Volume returns; the recovery shrinks.', 'Under 6:30 is a different session.', 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 1, 5, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Threshold 4 × 8 min',
          'The largest threshold dose of the block.', null, 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 480, 4, 375, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 15, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 15, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 6, 'ask', 56, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '6 mi continuous at race pace',
          'One mile further than the last answer.', 'Under 6:30 is a different session.', 10, 6)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 6, 390, 405, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 16, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 16, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 7, 'absorb', 50, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '4 × 2 mi at race pace',
          'Familiar work in a lighter week. Nothing new is being asked.', 'Under 6:30 is a different session.', 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 4, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'VO₂ 5 × 3 min',
          'A brief visit well above the pace, so the top does not go quiet.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 180, 5, 350, 360, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 13, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 13, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 8, 'build', 58, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '4 × 2 mi at race pace',
          'The largest broken dose in the block, and the last week before eight continuous.', 'Under 6:30 is a different session.', 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 4, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Threshold 2 × 12 min',
          'The ceiling, held one more time before specificity takes over.', null, 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 720, 2, 375, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run — last 3 at race pace',
          'Finish at the band off thirteen easy miles. Not a test — a rehearsal of the ending.', null, 16, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 13, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 3, 390, 405, true);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 9, 'ask', 60, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '8 mi continuous at race pace',
          'Eight unbroken. The first continuous question in five weeks, and the blocks largest so far.', 'Under 6:30 is a different session.', 12, 8)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 8, 390, 405, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run — last 4 at race pace',
          'The longest day of the block, finished at the band.', null, 17, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 13, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 4, 390, 405, true);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 10, 'absorb', 54, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '3 × 2 mi at race pace',
          'Contact with the band, nothing more. The week is for absorbing eight.', 'Under 6:30 is a different session.', 10, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 3, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Hills 10 × 45 s',
          'Strength above the pace, bought cheaply.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, rpe_low, rpe_high, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 45, 10, 8, 9, 'easy', 120);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 14, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 14, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 11, 'build', 60, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 9, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '4 × 1 mi at race pace',
          'Light and sharp. Saturday is the week.', 'Under 6:30 is a different session.', 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 1, 4, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 9, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 9, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 9, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run — last 6 at race pace',
          'Six at the band after twelve easy. Six is already owned; the question is what twelve miles of fatigue does to it.', null, 18, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 12, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 6, 390, 405, true);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 12, 'ask', 52, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '3 × 1 mi at race pace',
          'Small and quiet. Nothing is proved on Tuesday this week.', 'Under 6:30 is a different session.', 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 1, 3, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 8, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 6, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 7, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, '12 mi continuous at race pace',
          'The blocks closing statement. Twelve unbroken inside the band, three weeks out, off four easy miles.', 'Under 6:30 is a different session.', 16, 12)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 4, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 12, 390, 405, true);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 13, 'taper', 44, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '3 × 2 mi at race pace',
          'Familiar work at a smaller dose.', 'Under 6:30 is a different session.', 10, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 2, 3, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 4, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 4, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'key', 3, 'Threshold 2 × 8 min',
          'A short reminder of the ceiling.', null, 8, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, pace_low_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 480, 2, 375, 'easy', 180);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run',
          'Time on the legs at a pace that costs nothing.', null, 12, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 12, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 14, 'taper', 36, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '3 × 1 mi at race pace',
          'Rhythm, not a test.', 'Under 6:30 is a different session.', 7, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 1200);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'repetitions', 1, 3, 390, 405, 'float', 120, true);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 4, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 4, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'A little mechanical brightness. Relaxed, not fast.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 5, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 5, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Long run — short',
          'Rhythm, not a test. The durability question has already been answered.', null, 10, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 10, 525);

  insert into public.training_plan_weeks (plan_id, version_id, week_number, phase, total_distance, intent)
  values (plan_id, ver_id, 15, 'race', 33.1, null)
  returning id into wk_id;

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'MON', 'easy', 0, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 4, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 4, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'TUE', 'key', 1, '2 × 1 mi at race pace',
          'One touch of the band. Familiar, cheap, and finished wanting more. Deliberately not eligible — this is touching the system, not testing ownership.', 'Under 6:30 is a different session.', 6, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 900);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 1, 2, 390, 405, 'easy', 120);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 3, 'cool_down', 'continuous', 600);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'WED', 'easy', 2, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 3, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 3, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'THU', 'easy', 3, 'Easy with strides',
          'Short and unhurried. Nothing to gain today, something to lose.', null, 4, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 4, 525);

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds, repeat_count, recovery_kind, recovery_seconds)
  values (ses_id, 2, 'work', 'repetitions', 20, 4, 'easy', 60);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'FRI', 'easy', 4, 'Easy',
          'Aerobic base. There is no floor — slower is never wrong.', null, 3, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds)
  values (ses_id, 1, 'work', 'continuous', 3, 525);

  insert into public.training_plan_sessions
    (plan_id, version_id, plan_week_id, day_of_week, role, position, title, intent, details,
     prescribed_distance, asks_rung_value)
  values (plan_id, ver_id, wk_id, 'SAT', 'key', 5, 'Race — 13.1',
          'Thirteen point one, continuous, at the pace this whole block has been learning to carry.', null, 13.1, null)
  returning id into ses_id;

  insert into public.training_plan_components (plan_session_id, position, role, shape, duration_seconds)
  values (ses_id, 1, 'warm_up', 'continuous', 900);

  insert into public.training_plan_components (plan_session_id, position, role, shape, distance, pace_low_seconds, pace_high_seconds, counts_toward_mark)
  values (ses_id, 2, 'work', 'continuous', 13.1, 390, 405, true);

end $$;

do $$
declare weeks integer; sessions integer; comps integer; asks numeric[]; tot numeric;
begin
  select count(*) into weeks from public.training_plan_weeks;
  select count(*) into sessions from public.training_plan_sessions;
  select count(*) into comps from public.training_plan_components;
  if weeks <> 15 then raise exception 'expected 15 plan weeks, got %', weeks; end if;
  if sessions <> 90 then raise exception 'expected 90 plan sessions, got %', sessions; end if;

  -- Every week's days must sum to the week's declared total, or the plan says one
  -- thing in its matrix and another in its rows.
  if exists (
    select 1 from public.training_plan_weeks w
      join public.training_plan_sessions s on s.plan_week_id = w.id
     group by w.id, w.total_distance
    having abs(sum(s.prescribed_distance) - w.total_distance) > 0.001)
  then raise exception 'a week does not sum to its declared total'; end if;

  select array_agg(asks_rung_value order by asks_rung_value) into asks
    from public.training_plan_sessions where asks_rung_value is not null;
  if asks <> array[5,6,8,12]::numeric[] then raise exception 'asks are %, expected 5,6,8,12', asks; end if;

  select sum(total_distance) into tot from public.training_plan_weeks;
  raise notice 'Race Pace Durability v1: % weeks, % sessions, % components, % total miles, asks 5/6/8/12',
    weeks, sessions, comps, tot;
end $$;