-- Hope · approved Orlando half-marathon correction, 5 November 2026.
--
-- Preserve every prior prescription and completion.  The six affected live
-- occurrences receive new immutable versions through the normal coach writer;
-- only classification metadata that cannot live on a version is corrected in
-- place.  The already-correct Nov 17 5 x 800m, Nov 22 controlled 15K and race
-- week are deliberately untouched.

set local search_path = public, pg_temp;

select set_config(
  'request.jwt.claims',
  (select jsonb_build_object('sub', id, 'role', 'authenticated')::text
     from auth.users
    where lower(email) = lower('briceikouebe@gmail.com')
    limit 1),
  true
);

do $$
declare
  hope_id constant uuid := '10000000-0000-4000-8000-000000000003';
  changed integer := 0;
begin
  if auth.uid() is null or not public.is_coach_member(hope_id) then
    raise exception 'Hope correction requires Brice coach authority';
  end if;

  if exists (
    select 1 from public.session_completions
     where planned_session_id in (
       '13213d0e-b472-48f0-8acb-706fd9fe3703',
       '883ecf0c-0c72-433c-a123-cacb1639d670',
       'ce0af6f2-2051-40ad-828c-1871a3850fd8',
       'c5d1d7cc-56d5-41a0-a6ae-5ec5e8b7a75c',
       '63ffd9df-264b-4ef7-b157-20624034ed52',
       '65e20843-e2dd-4d3a-8420-18e2a5f6f632'
     )
  ) then
    raise exception 'Hope correction stopped: an affected prescription now has filed evidence';
  end if;

  perform public.write_session_version(
    '13213d0e-b472-48f0-8acb-706fd9fe3703'::uuid,
    'Long Run',
    'Build comfortable endurance while leaving room to adjust to how the body feels.',
    8::numeric, 'mi', null::integer, 3::smallint, 4::smallint,
    'Approved Hope coaching correction 2026-11-05: replace goal-rhythm work with an easy Saturday long run; default 8 miles with a 6–10 mile feel-based range.',
    jsonb_build_array(jsonb_build_object(
      'role','work','shape','continuous','distance',8,'distanceUnit','mi',
      'rpeLow',3,'rpeHigh',4
    )),
    'Run 8 miles easy. Six to ten miles is acceptable based on how you feel. Keep it conversational; no fast finish.'
  );
  update public.planned_sessions
     set role='easy', is_key=false, updated_at=now()
   where id='13213d0e-b472-48f0-8acb-706fd9fe3703' and athlete_id=hope_id;
  changed := changed + 1;

  perform public.write_session_version(
    '883ecf0c-0c72-433c-a123-cacb1639d670'::uuid,
    'Rest',
    'Absorb Saturday and begin the next week recovered.',
    null::numeric, null::text, null::integer, null::smallint, null::smallint,
    'Approved Hope coaching correction 2026-11-05: Sunday is rest after the revised Saturday long run.',
    '[]'::jsonb,
    null::text
  );
  update public.planned_sessions
     set role='rest', is_key=false, updated_at=now()
   where id='883ecf0c-0c72-433c-a123-cacb1639d670' and athlete_id=hope_id;
  changed := changed + 1;

  perform public.write_session_version(
    'ce0af6f2-2051-40ad-828c-1871a3850fd8'::uuid,
    'Goal Rhythm',
    'Reintroduce continuous half-marathon rhythm early enough to recover before the weekend.',
    3::numeric, 'mi', null::integer, 5::smallint, 6::smallint,
    'Approved Hope coaching correction 2026-11-05: replace easy strides with three continuous miles at controlled goal rhythm.',
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',600),
      jsonb_build_object('role','work','shape','continuous','distance',3,'distanceUnit','mi','paceLowSeconds',408,'paceHighSeconds',412,'rpeLow',5,'rpeHigh',6),
      jsonb_build_object('role','cool_down','shape','continuous','durationSeconds',600)
    ),
    'Run 3 miles continuously at 6:48–6:52/mi. Settle in early, stay controlled, and do not press the finish.'
  );
  update public.planned_sessions
     set role='key', is_key=true, updated_at=now()
   where id='ce0af6f2-2051-40ad-828c-1871a3850fd8' and athlete_id=hope_id;
  changed := changed + 1;

  perform public.write_session_version(
    'c5d1d7cc-56d5-41a0-a6ae-5ec5e8b7a75c'::uuid,
    'Easy Run',
    'Keep the legs moving without adding another hard effort before the long run.',
    3::numeric, 'mi', null::integer, 2::smallint, 3::smallint,
    'Approved Hope coaching correction 2026-11-05: move goal-rhythm work earlier and make Saturday easy before the long run.',
    jsonb_build_array(jsonb_build_object(
      'role','work','shape','continuous','distance',3,'distanceUnit','mi',
      'rpeLow',2,'rpeHigh',3
    )),
    'Three miles easy and conversational. Finish with more in reserve.'
  );
  update public.planned_sessions
     set role='easy', is_key=false, updated_at=now()
   where id='c5d1d7cc-56d5-41a0-a6ae-5ec5e8b7a75c' and athlete_id=hope_id;
  changed := changed + 1;

  perform public.write_session_version(
    '63ffd9df-264b-4ef7-b157-20624034ed52'::uuid,
    'Long Run',
    'Build comfortable endurance without turning the weekend into a second quality block.',
    10::numeric, 'mi', null::integer, 3::smallint, 4::smallint,
    'Approved Hope coaching correction 2026-11-05: reduce the weekend long run to approximately ten easy miles after the revised Nov 7 baseline.',
    jsonb_build_array(jsonb_build_object(
      'role','work','shape','continuous','distance',10,'distanceUnit','mi',
      'rpeLow',3,'rpeHigh',4
    )),
    'Ten miles easy and conversational. No fast finish.'
  );
  update public.planned_sessions
     set role='easy', is_key=false, updated_at=now()
   where id='63ffd9df-264b-4ef7-b157-20624034ed52' and athlete_id=hope_id;
  changed := changed + 1;

  perform public.write_session_version(
    '65e20843-e2dd-4d3a-8420-18e2a5f6f632'::uuid,
    'Goal Rhythm',
    'Practice one controlled continuous block as the taper begins.',
    3::numeric, 'mi', null::integer, 5::smallint, 6::smallint,
    'Approved Hope coaching correction 2026-11-05: replace 3 x 1600m with approximately three continuous miles at controlled goal rhythm.',
    jsonb_build_array(
      jsonb_build_object('role','warm_up','shape','continuous','durationSeconds',600),
      jsonb_build_object('role','work','shape','continuous','distance',3,'distanceUnit','mi','paceLowSeconds',408,'paceHighSeconds',412,'rpeLow',5,'rpeHigh',6),
      jsonb_build_object('role','cool_down','shape','continuous','durationSeconds',600)
    ),
    'Run 3 miles continuously at 6:48–6:52/mi. Smooth and even; finish wanting more.'
  );
  update public.planned_sessions
     set role='key', is_key=true, updated_at=now()
   where id='65e20843-e2dd-4d3a-8420-18e2a5f6f632' and athlete_id=hope_id;
  changed := changed + 1;

  if changed <> 6 then
    raise exception 'expected six Hope prescription corrections, got %', changed;
  end if;

  if exists (
    select 1 from public.planned_sessions
     where id in ('13213d0e-b472-48f0-8acb-706fd9fe3703','883ecf0c-0c72-433c-a123-cacb1639d670','c5d1d7cc-56d5-41a0-a6ae-5ec5e8b7a75c','63ffd9df-264b-4ef7-b157-20624034ed52')
       and is_key
  ) then
    raise exception 'support/rest sessions still classified as key';
  end if;
end $$;
