do $$
declare
  coach_id uuid;
  rec record;
begin
  select published_by into coach_id
  from public.plan_publications pp
  join public.training_plans tp on tp.id=pp.plan_id
  where tp.slug='race-pace-durability' and pp.revoked_at is null and pp.published_at is not null
  limit 1;

  for rec in select id,slug from public.athletes where slug in ('simon','elijah','anthony') loop
    if not exists (
      select 1 from public.athlete_observations
      where athlete_id=rec.id and observation like 'FORM-OCT6-SCREENSHOT-INTAKE.%'
    ) then
      insert into public.athlete_observations(
        id,athlete_id,facet,source,observation,direction,observed_on,authored_by
      ) values(
        gen_random_uuid(),rec.id,'practice','coach_observed',
        'FORM-OCT6-SCREENSHOT-INTAKE. Brice supplied an October 6 athlete update through screenshots/messages. Preserve the source as coaching evidence, but do not invent exact lap values, readiness, a physiological mechanism or a prescription change from an untranscribed image. The current canonical plan remains authoritative. Exact execution details and the next-day response should be filed when transcribed; the immediate system-level action from this intake is the protect-the-primary-session / earned-support teaching update.',
        'no_clear_change',date '2026-10-06',coach_id
      );
    end if;
  end loop;

  select id,slug into rec from public.athletes where slug='tinius';
  if not exists (
    select 1 from public.athlete_observations
    where athlete_id=rec.id and observation like 'TINIUS-LOAD-SCREENSHOT-20261006.%'
  ) then
    insert into public.athlete_observations(
      id,athlete_id,facet,source,observation,direction,observed_on,authored_by
    ) values(
      gen_random_uuid(),rec.id,'capacity','athlete_reported',
      'TINIUS-LOAD-SCREENSHOT-20261006. Tinius supplied an October 6 screenshot of the loads he is currently working with. Use the reported loads as Week 1 calibration context rather than as max values. The Durable Frame program can now be authored without a max test: record actual load, reps and RIR in the first comparable exposures, then progress only by the authored rep-range rule. Exact structured load values belong in the strength receipt / program record when transcribed, not in a guessed observation.',
      'no_clear_change',date '2026-10-06',coach_id
    );
  end if;
end $$;
