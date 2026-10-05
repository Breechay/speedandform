set local search_path=public,pg_temp;

select set_config(
  'request.jwt.claims',
  (select jsonb_build_object('sub', id)::text
     from auth.users
    where lower(email)=lower('briceikouebe@gmail.com')
    limit 1),
  true
);

do $$
declare
  v_coach uuid := auth.uid();
  v_athlete uuid;
  v_block uuid;
  v_week uuid;
  v_session uuid;
begin
  if v_coach is null then
    raise exception 'Brice coach identity not found';
  end if;

  select a.id into v_athlete
    from public.athletes a
   where a.slug='brice' and a.active=true;

  if v_athlete is null then
    raise exception 'Brice athlete identity missing';
  end if;

  select tb.id into v_block
    from public.training_blocks tb
   where tb.athlete_id=v_athlete
     and tb.status='active'
     and tb.name='The Rebuilt Athlete · Phase 00'
     and tb.starts_on=date '2026-09-28'
     and tb.ends_on=date '2026-10-04'
   order by tb.created_at desc
   limit 1;

  if v_block is null then
    raise exception 'expected active one-week Rebuilt Athlete block for Sep 28–Oct 4';
  end if;

  if exists (
    select 1 from public.training_weeks tw
     where tw.block_id=v_block and tw.week_number=2
  ) then
    raise exception 'Rebuilt Athlete Week 02 already exists';
  end if;

  update public.training_blocks
     set current_week=2,
         total_weeks=2,
         ends_on=date '2026-10-11',
         goal_statement='Hold the newly reached ~31-mile running load while outdoor running becomes genuinely low aerobic and the body stays fluid, fueled and absorbable.',
         updated_at=now()
   where id=v_block;

  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  ) values (
    v_athlete,v_block,2,date '2026-10-05',date '2026-10-11',
    'Hold volume. Improve aerobic control and keep the movement fluid.',
    'The week succeeds when roughly 31 miles feels ordinary: outdoor running stays low aerobic, treadmill runs stay relaxed, the long run is controlled, and stacked training is deliberately refueled.',
    'planned',v_coach
  ) returning id into v_week;

  v_session := public.author_session(
    v_athlete,v_week,'MON',
    'Treadmill feel run · 5 mi',
    'Start the week by reproducing smooth, organized running without using pace or heart rate as a target.',
    date '2026-10-05',1::smallint,5::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',5,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Treadmill preferred. Run by feel: easy, fluid and restrained. Ignore watch pace and heart-rate targets unless something feels abnormal. Keep enough in reserve for the rest of the week.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'TUE',
    'Outdoor low-aerobic run · 5 mi',
    'Practice true low-aerobic control outdoors without turning the pace into the goal.',
    date '2026-10-06',2::smallint,5::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',5,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Outdoors. Keep the run in the athlete''s current Zone 2 / low-aerobic range as the primary objective. Slow the pace as needed for heat or drift. No pace target and no fast finish.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'THU',
    'Treadmill feel run · 5 mi',
    'Repeat the fluid treadmill state and let the trunk-pelvis system keep organizing through easy repetition.',
    date '2026-10-08',3::smallint,5::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',5,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Treadmill preferred. Go by feel rather than watch pace or heart-rate targets. Keep the run smooth and easy; this is repetition, not a fitness test.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SAT',
    'Easy treadmill run · 6 mi',
    'Add easy volume without spending Sunday''s long-run freshness.',
    date '2026-10-10',4::smallint,6::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',6,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Treadmill preferred. Easy and uneventful. No progression and no need to make the watch agree with the belt. Finish with Sunday still available.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SUN',
    'Outdoor long easy run · 10 mi',
    'Repeat ten miles outdoors while making low-aerobic control the main skill.',
    date '2026-10-11',5::smallint,10::numeric,'mi'::text,null::integer,2::smallint,4::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',7.5,'distanceUnit','mi','rpeLow',2,'rpeHigh',3),
      jsonb_build_object('role','work','shape','continuous','distance',2.5,'distanceUnit','mi','rpeLow',2,'rpeHigh',4)
    ),
    'Outdoors. Keep at least the first 7.5 miles in the athlete''s low-aerobic / Zone 2 range. The final 2.5 miles may become more natural only if movement remains fluid and controlled; there is no requirement to progress and no pace target. Fuel and hydrate normally before and after.'
  );
  update public.planned_sessions set role='key',is_key=true where id=v_session;

  if (
    select count(*)
      from public.planned_sessions ps
     where ps.week_id=v_week and ps.state='published'
  ) <> 5 then
    raise exception 'expected five published Week 02 running sessions';
  end if;

  if (
    select coalesce(sum(pv.prescribed_distance),0)
      from public.planned_sessions ps
      join lateral (
        select v.*
          from public.planned_session_versions v
         where v.planned_session_id=ps.id
         order by v.version_number desc
         limit 1
      ) pv on true
     where ps.week_id=v_week and ps.state='published'
  ) <> 31 then
    raise exception 'expected 31 prescribed miles in Week 02';
  end if;
end $$;
