-- The working Console roster is presentation state over canonical athletes.
-- Four people existed only in the September 11 design study. Enter them once,
-- by slug, and attach the active coaching administrator without replacing any
-- athlete row that may already exist in another environment.

insert into public.athletes
  (slug, display_name, first_name, home_surface, target_event, goal_label,
   program_name, account_label, active, delivery)
values
  ('marisa',  'Marisa',  'Marisa',  'form', null, 'Build everyday strength',
   'Functional Strength', 'Marisa', true, 'coach'),
  ('valerie', 'Valerie', 'Valerie', 'form', 'Comfortable 5K', 'Establish a comfortable running baseline',
   'Run Development', 'Valerie', true, 'coach'),
  ('rod',     'Rod',     'Rod',     'form', null, 'Strength and physique',
   'Strength & Physique', 'Rod', true, 'coach'),
  ('devin',   'Devin',   'Devin',   'form', null, 'Strength and physique',
   'Strength & Physique', 'Devin', true, 'coach')
on conflict (slug) do nothing;

-- Reuse an existing athlete id when a slug was already present. The migration
-- never relies on a display name and never creates a second coaching identity.
insert into public.athlete_memberships (athlete_id, user_id, role, status)
select a.id, admin.user_id, 'coach', 'active'
  from public.athletes a
  cross join public.coaching_administrators admin
 where a.slug in ('marisa', 'valerie', 'rod', 'devin')
   and admin.status = 'active'
on conflict (athlete_id, user_id, role) do update set status = 'active';

-- Stable relationship facts from the supplied Console study. Proposed times
-- remain explicitly proposed. No prototype completion, measurement or local
-- state is promoted here.
insert into public.athlete_baselines
  (athlete_id, running_history, constraints, strength_schedule, source, authored_by)
select a.id, v.running_history, v.constraints, v.strength_schedule, 'coach_import', admin.user_id
  from (values
    ('marisa',  'Running history not supplied.', null,
      'Once weekly. Wednesday at 4 PM is proposed, not confirmed.'),
    ('valerie', 'Starting running baseline still to establish.', null,
      'Wednesday track relationship; exact continuing schedule is not yet established.'),
    ('rod',     'Running history not supplied.', null,
      'Normally twice weekly: Monday and Friday at 6:30 AM. An extra weekend morning is proposed.'),
    ('devin',   'Running history not supplied.', null,
      'Normally three times weekly. The former Tuesday/Wednesday/Thursday pattern is changing; Friday afternoon and weekend mornings remain proposed.')
  ) as v(slug, running_history, constraints, strength_schedule)
  join public.athletes a on a.slug = v.slug
  cross join lateral (select user_id from public.coaching_administrators where status = 'active' order by created_at limit 1) admin
 where not exists (select 1 from public.athlete_baselines b where b.athlete_id = a.id);

insert into public.coach_private_notes (athlete_id, body, authored_by)
select a.id, v.body, admin.user_id
  from (values
    ('marisa', 'She mentioned her back. Confirm what she means and what she wants to feel stronger doing. Functional strength through the legs, back and core is an initial coaching direction, not a settled prescription.'),
    ('valerie', 'Establish her current running baseline and observe form. Work toward comfortable running; do not fill in a continuous duration or distance until it is measured.'),
    ('rod', 'Focus on body-fat percentage this month. Normally twice weekly; the extra weekend morning is still only a proposal.'),
    ('devin', 'No body-fat measurement is on file. His normal three-session week is changing; Friday afternoon and weekend mornings are still being considered.')
  ) as v(slug, body)
  join public.athletes a on a.slug = v.slug
  cross join lateral (select user_id from public.coaching_administrators where status = 'active' order by created_at limit 1) admin
 where not exists (select 1 from public.coach_private_notes n where n.athlete_id = a.id and n.body = v.body);

-- UI-only state. This table never carries coaching truth.
create table if not exists public.console_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  roster_order uuid[] not null default '{}',
  hidden_athlete_ids uuid[] not null default '{}',
  rail_collapsed boolean not null default false,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.console_preferences enable row level security;
create policy console_preferences_own_read on public.console_preferences
  for select to authenticated using (user_id = auth.uid());
create policy console_preferences_own_insert on public.console_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy console_preferences_own_update on public.console_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.console_preferences to authenticated;

insert into public.console_preferences (user_id, roster_order, hidden_athlete_ids)
select admin.user_id,
       array(select a.id from public.athletes a
              join (values ('marisa',1),('natalie',2),('valerie',3),('rod',4),('jose',5),('hope',6),('devin',7)) v(slug,pos)
                on v.slug = a.slug order by v.pos),
       array(select a.id from public.athletes a where a.slug in ('simon','lisa','marcus') order by a.slug)
  from public.coaching_administrators admin
 where admin.status = 'active'
on conflict (user_id) do update
  set roster_order = excluded.roster_order,
      hidden_athlete_ids = excluded.hidden_athlete_ids,
      updated_at = now();

comment on table public.console_preferences is
  'UI-only presentation state for the Coach Console: roster order, hidden athletes, rail and layout. Never coaching truth.';

