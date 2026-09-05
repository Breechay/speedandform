-- The plan tables shipped without row-level security, and every other table here
-- has it.
--
-- Found by testing the thing rather than trusting it: the publication gate was
-- built, verified, and completely bypassable. `public_plan` correctly returns
-- nothing for an unpublished slug — and anyone could read the same rows raw:
--
--     GET /rest/v1/training_plan_sessions?select=title  →  200 [{"title":"Easy"}]
--
-- The anon key is in the client on every page, so that is not a theoretical
-- reader. A future unpublished draft, or a plan revoked on purpose, would have
-- been public the whole time.
--
-- `public_plan` is security definer, so it reads straight past these policies.
-- Publication stays the only public door, which is what it was supposed to be.

alter table public.training_plans            enable row level security;
alter table public.training_plan_versions    enable row level security;
alter table public.training_plan_weeks       enable row level security;
alter table public.training_plan_sessions    enable row level security;
alter table public.training_plan_components  enable row level security;
alter table public.plan_assignments          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['training_plans', 'training_plan_versions', 'training_plan_weeks',
                           'training_plan_sessions', 'training_plan_components', 'plan_assignments']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_coach_all', t);
    execute format($f$
      create policy %I on public.%I for all to authenticated
        using (exists (select 1 from public.athlete_memberships
                        where user_id = auth.uid() and role = 'coach' and status = 'active'))
        with check (exists (select 1 from public.athlete_memberships
                             where user_id = auth.uid() and role = 'coach' and status = 'active'))
    $f$, t || '_coach_all', t);
  end loop;
end $$;

do $$
declare open_tables text;
begin
  select string_agg(c.relname, ', ') into open_tables
    from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
   where c.relkind = 'r' and not c.relrowsecurity
     and (c.relname like 'training_plan%' or c.relname like 'plan_%');
  if open_tables is not null then
    raise exception 'still without row-level security: %', open_tables;
  end if;

  -- The published plan must still read back through the one door that is meant
  -- to be open.
  if public.public_plan('race-pace-durability') is null then
    raise exception 'locking the tables broke the public read';
  end if;
end $$;
