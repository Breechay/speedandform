-- A plan becomes public by an act, and stops being public by another.
--
-- Every plan table has RLS on and no anon policy, which is correct: a signed-out
-- visitor has no business reading an athlete's prescription. But Race Pace
-- Durability is the method, not an athlete, and the method is the thing being
-- published.
--
-- So publication is a row, following the pattern record_publications already
-- established: an explicit act, revocable, with the dates it was published for.
-- Nothing is public because it exists — only because someone published it.

create table if not exists public.plan_publications (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  plan_version_id uuid not null references public.training_plan_versions(id) on delete cascade,
  slug text not null,
  -- The chronology of the running this publication describes. Authored here, so
  -- the public payload never needs to look at an athlete's calendar to know when
  -- week one began.
  starts_on date not null,
  race_on date,
  race_name text,
  published_at timestamptz,
  revoked_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (slug, plan_version_id)
);

comment on table public.plan_publications is
  'A published plan version, and the dates of the running it describes. Publication is an act: an unpublished or revoked row is not readable by anyone signed out. Carries no athlete reference by design — the public plan is the method, and the method has no athletes in it.';

create index if not exists plan_publication_live_idx
  on public.plan_publications (slug) where published_at is not null and revoked_at is null;

alter table public.plan_publications enable row level security;

drop policy if exists plan_publications_coach_all on public.plan_publications;
create policy plan_publications_coach_all on public.plan_publications
  for all to authenticated
  using (exists (select 1 from public.athlete_memberships
                  where user_id = auth.uid() and role = 'coach' and status = 'active'))
  with check (exists (select 1 from public.athlete_memberships
                       where user_id = auth.uid() and role = 'coach' and status = 'active'));

-- ── THE FIELD's seam, built now and empty on purpose ───────────────────────
--
-- When Hope and José have run this, what appears publicly must be a thing a
-- coach published, not a thing an endpoint could reach. This table is that
-- boundary: it holds only what was deliberately written for publication, it
-- carries no athlete_id, and it records the consent that allowed it.
--
-- Empty until December. The page shows placeholders until there is something
-- true to put here, and inventing a race result on the page whose whole argument
-- is "here are the receipts" is the one unforgivable thing it could do.

create table if not exists public.plan_result_publications (
  id uuid primary key default gen_random_uuid(),
  plan_publication_id uuid not null references public.plan_publications(id) on delete cascade,
  display_name text not null,
  position smallint not null default 1,
  entered text,
  established text,
  race_result text,
  coach_read text,
  consent_recorded_at timestamptz not null,
  consent_note text,
  published_at timestamptz,
  revoked_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.plan_result_publications is
  'What an athlete agreed to have said publicly about their running of a plan. Deliberately holds no athlete_id and is never derived from an assignment: the public page cannot reach a private record even by accident, because the join does not exist.';

alter table public.plan_result_publications enable row level security;

drop policy if exists plan_results_coach_all on public.plan_result_publications;
create policy plan_results_coach_all on public.plan_result_publications
  for all to authenticated
  using (exists (select 1 from public.athlete_memberships
                  where user_id = auth.uid() and role = 'coach' and status = 'active'))
  with check (exists (select 1 from public.athlete_memberships
                       where user_id = auth.uid() and role = 'coach' and status = 'active'));

-- ── the public read ────────────────────────────────────────────────────────
--
-- One function, security definer, and it builds its payload explicitly from the
-- plan tables. Not `select *`: every field a visitor receives is named here, so
-- a column added to training_plans tomorrow cannot become public by accident.

create or replace function public.public_plan(p_slug text)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'plan', jsonb_build_object(
      'slug', pub.slug,
      'name', p.name,
      'discipline', p.discipline,
      'total_weeks', p.total_weeks,
      'question', p.question,
      'for_whom', p.for_whom,
      'entry_volume', p.entry_volume,
      'peak_volume', p.peak_volume,
      'race_pace_low_seconds', p.race_pace_low_seconds,
      'race_pace_high_seconds', p.race_pace_high_seconds),
    'version', jsonb_build_object(
      'number', v.version_number,
      'summary', v.summary,
      'cut_at', v.cut_at),
    'running', jsonb_build_object(
      'starts_on', pub.starts_on,
      'race_on', pub.race_on,
      'race_name', pub.race_name,
      'published_at', pub.published_at),
    'weeks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week_number', w.week_number,
        'phase', w.phase,
        'total_distance', w.total_distance,
        'intent', w.intent,
        'sessions', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'day', s.day_of_week,
            'role', s.role,
            'title', s.title,
            'intent', s.intent,
            'details', s.details,
            'distance', s.prescribed_distance,
            'asks', s.asks_rung_value,
            'components', (
              select coalesce(jsonb_agg(jsonb_build_object(
                'role', c.role, 'shape', c.shape, 'distance', c.distance,
                'duration_seconds', c.duration_seconds, 'repeat_count', c.repeat_count,
                'pace_low_seconds', c.pace_low_seconds, 'pace_high_seconds', c.pace_high_seconds,
                'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high,
                'recovery_kind', c.recovery_kind, 'recovery_seconds', c.recovery_seconds,
                'counts_toward_mark', c.counts_toward_mark)
                order by c.position), '[]'::jsonb)
              from training_plan_components c where c.plan_session_id = s.id))
            order by s.position), '[]'::jsonb)
          from training_plan_sessions s where s.plan_week_id = w.id))
        order by w.week_number), '[]'::jsonb)
      from training_plan_weeks w where w.version_id = v.id),
    -- THE FIELD. Only what was published, and only while it is published.
    'field', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', r.display_name, 'entered', r.entered,
        'established', r.established, 'race', r.race_result,
        'coach_read', r.coach_read) order by r.position), '[]'::jsonb)
      from plan_result_publications r
      where r.plan_publication_id = pub.id
        and r.published_at is not null and r.revoked_at is null))
  from plan_publications pub
  join training_plans p on p.id = pub.plan_id
  join training_plan_versions v on v.id = pub.plan_version_id
 where pub.slug = p_slug
   and pub.published_at is not null
   and pub.revoked_at is null;
$$;

comment on function public.public_plan is
  'The published method, for anyone. Returns nothing for a slug that is unpublished or revoked. Every field is named explicitly rather than selected wholesale, so a new column cannot become public by being added.';

revoke all on function public.public_plan(text) from public;
grant execute on function public.public_plan(text) to anon, authenticated;

-- ── publish it ─────────────────────────────────────────────────────────────
insert into public.plan_publications
  (plan_id, plan_version_id, slug, starts_on, race_on, race_name, published_at)
select p.id, v.id, 'race-pace-durability', date '2026-08-24', date '2026-12-05',
       'OUC Half Marathon', now()
  from training_plans p
  join training_plan_versions v on v.plan_id = p.id and v.version_number = 1
 where p.slug = 'race-pace-durability'
on conflict (slug, plan_version_id) do nothing;

update public.training_plans set status = 'published' where slug = 'race-pace-durability';

do $$
declare payload jsonb; n integer;
begin
  select public_plan('race-pace-durability') into payload;
  if payload is null then raise exception 'the published plan does not read back'; end if;
  if jsonb_array_length(payload->'weeks') <> 15 then
    raise exception 'public payload has % weeks', jsonb_array_length(payload->'weeks'); end if;
  if jsonb_array_length(payload->'field') <> 0 then
    raise exception 'THE FIELD is not empty and nothing has been published to it'; end if;

  -- Nothing athlete-shaped may appear in a public payload.
  if payload::text ~* '(athlete_id|assignment|override|completion|observation|jose|hope|marcus|natalie|simon)' then
    raise exception 'the public payload contains something athlete-specific';
  end if;

  -- An unpublished slug returns nothing at all.
  if public_plan('no-such-plan') is not null then raise exception 'an unknown slug returned a payload'; end if;

  select count(*) into n from plan_publications where published_at is not null and revoked_at is null;
  raise notice 'published: % live plan publication(s)', n;
end $$;
