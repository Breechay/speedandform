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
  v_mon_w3 uuid;
  v_tue_w3 uuid;
  v_completion uuid;
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

  select b.id into v_block
    from public.training_blocks b
   where b.athlete_id=v_athlete
     and b.status='active'
     and b.name='The Rebuilt Athlete · Phase 00'
     and b.starts_on=date '2026-09-28'
   order by b.updated_at desc
   limit 1;

  if v_block is null then
    raise exception 'expected active Rebuilt Athlete block beginning 28 Sep 2026';
  end if;

  if not exists (
    select 1 from public.training_blocks b
     where b.id=v_block
       and b.current_week=2
       and b.total_weeks=2
       and b.ends_on=date '2026-10-11'
  ) then
    raise exception 'active Rebuilt Athlete block changed; reconcile before authoring automaticity block';
  end if;

  if exists (
    select 1 from public.training_weeks w
     where w.block_id=v_block and w.week_number between 3 and 6
  ) then
    raise exception 'Rebuilt Athlete Weeks 03-06 already exist';
  end if;

  update public.training_blocks
     set current_week=3,
         total_weeks=6,
         ends_on=date '2026-11-08',
         goal_statement='Retrain automatic faster running without forcing pace: Monday extends relaxed time, Tuesday repeats 3 x 1 mile by feel, and Saturday keeps easy durability underneath it.',
         updated_at=now()
   where id=v_block;

  -- Week 03 is the entry/read week. Monday and Tuesday already happened before
  -- this block was authored; the linked coach-import filings below preserve what
  -- was actually done rather than rewriting the sessions as successful prescriptions.
  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  ) values (
    v_athlete,v_block,3,date '2026-10-12',date '2026-10-18',
    'Read the first faster exposures, then keep Saturday easy.',
    'This week establishes the difference between pace that requires attention and pace that appears while the athlete stays fluid. No pace or heart-rate target is required.',
    'planned',v_coach
  ) returning id into v_week;

  v_session := public.author_session(
    v_athlete,v_week,'MON',
    'Longer rhythm · 2 × 10 min',
    'Spend longer in a quicker rhythm without using pace or heart rate as the target.',
    date '2026-10-12',1::smallint,null::numeric,'mi'::text,40::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',1200,'rpeLow',2,'rpeHigh',3),
      jsonb_build_object('role','work','shape','repetitions','repeatCount',2,'durationSeconds',600,'recoverySeconds',120,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Twenty minutes relaxed first. Then two ten-minute quicker blocks with two minutes easy between. No pace target. If breathing or attention turns the rhythm into a grind, shorten the work instead of forcing it.'
  );
  v_mon_w3 := v_session;
  update public.planned_sessions set role='support',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'TUE',
    'Mile repeats · 3 × 1 mi',
    'Let the same relaxed effort show what pace is available today.',
    date '2026-10-13',2::smallint,3::numeric,'mi'::text,null::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','repetitions','repeatCount',3,'distance',1,'distanceUnit','mi','recoverySeconds',150,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Three one-mile repeats with 2:30 easy recovery. No pace target and no heart-rate target. Start each mile by feel. Fluidity wins; do not speed up a later rep just because an earlier split was fast.'
  );
  v_tue_w3 := v_session;
  update public.planned_sessions set role='key',is_key=true where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SAT',
    'Long easy · 8 mi',
    'Keep the durability floor while the faster work stays small.',
    date '2026-10-17',3::smallint,8::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',8,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Easy and continuous. No fast finish. Let pace emerge from relaxed running and keep enough reserve that Monday can ask its question.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  -- Week 04: start the three-week automaticity progression with short repeatable work.
  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  ) values (
    v_athlete,v_block,4,date '2026-10-19',date '2026-10-25',
    'Make quicker running repeatable before making it longer.',
    'Monday asks whether four short exposures stay fluid. Tuesday keeps the mile-repeat question unchanged. Saturday stays easy.',
    'planned',v_coach
  ) returning id into v_week;

  v_session := public.author_session(
    v_athlete,v_week,'MON',
    'Longer rhythm · 4 × 4 min',
    'Practice quicker running that stays fluid enough to repeat.',
    date '2026-10-19',1::smallint,null::numeric,'mi'::text,42::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',1200,'rpeLow',2,'rpeHigh',3),
      jsonb_build_object('role','work','shape','repetitions','repeatCount',4,'durationSeconds',240,'recoverySeconds',120,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Twenty minutes relaxed first. Four four-minute quicker reps with two minutes easy. No pace or heart-rate target. The rep ends before fluid running turns into grinding.'
  );
  update public.planned_sessions set role='support',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'TUE',
    'Mile repeats · 3 × 1 mi',
    'Repeat the same internal effort and observe what pace appears.',
    date '2026-10-20',2::smallint,3::numeric,'mi'::text,null::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','repetitions','repeatCount',3,'distance',1,'distanceUnit','mi','recoverySeconds',150,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Three one-mile repeats with 2:30 easy recovery. No pace target. Keep the effort around the same relaxed 4–5 out of 10. Read the split after the mile; do not run toward a number.'
  );
  update public.planned_sessions set role='key',is_key=true where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SAT',
    'Long easy · 8 mi',
    'Keep the longer-run chassis stable while the speed question changes.',
    date '2026-10-24',3::smallint,8::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',8,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Easy and continuous. No fast finish and no makeup mileage.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  -- Week 05: extend Monday, hold Tuesday's test constant.
  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  ) values (
    v_athlete,v_block,5,date '2026-10-26',date '2026-11-01',
    'Extend the time spent in the fluid gear without changing the Tuesday question.',
    'A longer Monday only matters if the same relaxed movement returns. Tuesday remains three miles of repeated observation, not a pace test.',
    'planned',v_coach
  ) returning id into v_week;

  v_session := public.author_session(
    v_athlete,v_week,'MON',
    'Longer rhythm · 3 × 6 min',
    'Stay in the quicker rhythm longer while keeping it automatic.',
    date '2026-10-26',1::smallint,null::numeric,'mi'::text,42::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',1200,'rpeLow',2,'rpeHigh',3),
      jsonb_build_object('role','work','shape','repetitions','repeatCount',3,'durationSeconds',360,'recoverySeconds',120,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Twenty minutes relaxed first. Three six-minute quicker reps with two minutes easy. No pace or heart-rate target. Keep the same fluidity standard used in Week 04.'
  );
  update public.planned_sessions set role='support',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'TUE',
    'Mile repeats · 3 × 1 mi',
    'Let repeated exposure move the pace while the effort stays the same.',
    date '2026-10-27',2::smallint,3::numeric,'mi'::text,null::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','repetitions','repeatCount',3,'distance',1,'distanceUnit','mi','recoverySeconds',150,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Three one-mile repeats with 2:30 easy recovery. No pace target. Do not chase the first 5:xx when it appears; repeat the feeling instead.'
  );
  update public.planned_sessions set role='key',is_key=true where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SAT',
    'Long easy · 9 mi',
    'Add one easy mile only after the first two weeks stay absorbable.',
    date '2026-10-31',3::smallint,9::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',9,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Easy and continuous. No fast finish. This is durability under the speed work, not another quality session.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  -- Week 06: return to the original 2 x 10 question after two weeks of shorter exposure.
  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  ) values (
    v_athlete,v_block,6,date '2026-11-02',date '2026-11-08',
    'Return to two ten-minute blocks and see whether they now require less attention.',
    'The progression succeeds if duration becomes more automatic. A faster clock is welcome only when it arrives at the same relaxed effort.',
    'planned',v_coach
  ) returning id into v_week;

  v_session := public.author_session(
    v_athlete,v_week,'MON',
    'Longer rhythm · 2 × 10 min',
    'Revisit the original longer rhythm after repeated shorter exposure.',
    date '2026-11-02',1::smallint,null::numeric,'mi'::text,43::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',1200,'rpeLow',2,'rpeHigh',3),
      jsonb_build_object('role','work','shape','repetitions','repeatCount',2,'durationSeconds',600,'recoverySeconds',150,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Twenty minutes relaxed first. Two ten-minute quicker blocks with 2:30 easy between. No pace or heart-rate target. The comparison is how much attention and breathing the same duration now requires.'
  );
  update public.planned_sessions set role='support',is_key=false where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'TUE',
    'Mile repeats · 3 × 1 mi',
    'Keep the mile-repeat observation unchanged for a third week.',
    date '2026-11-03',2::smallint,3::numeric,'mi'::text,null::integer,4::smallint,5::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','repetitions','repeatCount',3,'distance',1,'distanceUnit','mi','recoverySeconds',150,'recoveryKind','easy','rpeLow',4,'rpeHigh',5)
    ),
    'Three one-mile repeats with 2:30 easy recovery. No pace target. 5:40/mi is a direction for later, not a split to force today. Keep the run fluid enough that another rep would not require grinding.'
  );
  update public.planned_sessions set role='key',is_key=true where id=v_session;

  v_session := public.author_session(
    v_athlete,v_week,'SAT',
    'Long easy · 10 mi',
    'Return to ten easy miles with the speed block still leaving durability intact.',
    date '2026-11-07',3::smallint,10::numeric,'mi'::text,null::integer,2::smallint,3::smallint,
    jsonb_build_array(
      jsonb_build_object('role','work','shape','continuous','distance',10,'distanceUnit','mi','rpeLow',2,'rpeHigh',3)
    ),
    'Easy and continuous. No fast finish. Finish with the sense that the speed work and the long run can coexist.'
  );
  update public.planned_sessions set role='easy',is_key=false where id=v_session;

  -- File the two already-performed entry sessions through the coach-authorized
  -- transaction. They are coach imports, not fabricated native-app receipts.
  v_completion := public.file_session(
    v_athlete,'changed',v_mon_w3,5.27::numeric,'mi',2213,null,null,null,null,
    'Started with 20:00 / 2.67 mi relaxed at 7:29/mi. Intended a longer 2 x 10 structure, but breathing and attentional cost rose in the first faster block, so the remaining work was shortened into smaller 400 m / 800 m exposures. Finished feeling strong. Garmin Forerunner 965 activity 24695858512: 5.27 mi, 36:53, average HR 159, max HR 187. Exact shorter-rep split times were not filed.',
    null,
    jsonb_build_array(
      jsonb_build_object('kind','warmup','distance',2.67,'distanceUnit','mi','durationSeconds',1200,'paceSeconds',449)
    )
  );

  v_completion := public.file_session(
    v_athlete,'completed',v_tue_w3,3.00::numeric,'mi',1236,null,null,null,null,
    'Started expecting an easy run; the legs settled near 7:00/mi without a pace plan. Completed 3 x 1 mi in 7:05, 6:40 and 6:48. The second mile was probably excitement. The third was deliberately relaxed to stay comfortable and complete the distance. Athlete estimated the effort around 4–5/10. Garmin Forerunner 965 activity 24707711118: average HR 159, max HR 181.',
    null,
    jsonb_build_array(
      jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',425,'paceSeconds',425),
      jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',400,'paceSeconds',400),
      jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',408,'paceSeconds',408)
    )
  );

  if (
    select count(*) from public.training_weeks w
     where w.block_id=v_block and w.week_number between 3 and 6
  ) <> 4 then
    raise exception 'expected four newly authored Rebuilt Athlete weeks';
  end if;

  if (
    select count(*)
      from public.planned_sessions ps
      join public.training_weeks w on w.id=ps.week_id
     where w.block_id=v_block
       and w.week_number between 3 and 6
       and ps.state='published'
  ) <> 12 then
    raise exception 'expected twelve published sessions across Weeks 03-06';
  end if;

  if (
    select count(*)
      from public.session_completions sc
     where sc.planned_session_id in (v_mon_w3,v_tue_w3)
       and sc.source='coach_import'
  ) <> 2 then
    raise exception 'expected two coach-import entry filings';
  end if;
end $$;
