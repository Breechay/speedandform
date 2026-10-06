do $$
declare
  jose_id uuid;
  coach_id uuid;
  session_id uuid;
  new_version_id uuid;
  next_num integer;
begin
  select id into strict jose_id from public.athletes where slug='jose';
  select published_by into coach_id
  from public.plan_publications pp
  join public.training_plans tp on tp.id=pp.plan_id
  where tp.slug='race-pace-durability' and pp.revoked_at is null and pp.published_at is not null
  limit 1;

  if not exists (
    select 1 from public.athlete_observations
    where athlete_id=jose_id and observation like 'FORM-ENGAGEMENT-20261006.%'
  ) then
    insert into public.athlete_observations(
      id,athlete_id,facet,source,observation,direction,observed_on,authored_by
    ) values(
      gen_random_uuid(),jose_id,'practice','athlete_reported',
      'FORM-ENGAGEMENT-20261006. After receiving the revised October 8–17 plan card, Jose replied positively ("ooo i like that a lot actually"). After noticing the Thursday October 15 continuous threshold he wrote "oh wait that says 20 min continous threshold" and "new challenge acquired." Treat this as engagement and format-preference evidence only. It does not establish readiness, a threshold deficit, or a physiological mechanism. Because he framed the conditional support as a challenge, athlete-facing copy must make the recovery gate visible so enthusiasm does not turn optional work into an obligation.',
      'no_clear_change',date '2026-10-06',coach_id
    );
  end if;

  with targets(scheduled_on,new_title,new_intent,new_details,set_band,reason) as (
    values
      (date '2026-10-15',
       '20 min controlled threshold · if recovered',
       'Aerobic support only if Tuesday was controlled and recovery is normal. Thursday is earned, not owed.',
       'Only if Tuesday was controlled and recovery is normal: 20 minutes easy, 20 minutes at controlled threshold effort, 10 minutes easy. No required pace. Historical 6:15/mi is context, not a target or minimum speed. Start restrained and finish with reserve. If still carrying Tuesday, replace the whole session with 40 minutes easy or rest. No make-up work.',
       false,
       'Make the recovery gate visible after Jose described the conditional threshold as a new challenge.'),
      (date '2026-10-27',
       null,
       'Contact with the current band as support after the eight-mile read. Broken work is a tool, not a required progression.',
       'Use 6:40–6:45/mi. If restart-specific heaviness is again disproportionate, stop quality and finish easy; do not add work to prove the format.',
       true,
       'Hold Jose at the current 6:40–6:45 band and keep broken work provisional.'),
      (date '2026-10-29',
       'Threshold 3 × 10 min · if recovered',
       'Aerobic support after the eight-mile read, only if that work is absorbed. Thursday is not owed.',
       'Run the threshold work only if October 20 and the current week are absorbed normally. If not, run easy or rest. Do not use historical threshold pace as a minimum.',
       false,
       'Make post-checkpoint threshold conditional on recovery.'),
      (date '2026-11-03',
       null,null,
       'Use 6:40–6:45/mi. Light support for Saturday, not a test and not permission to chase the fast edge.',
       true,
       'Hold Jose at the current 6:40–6:45 band.'),
      (date '2026-11-10',
       null,null,
       'Use 6:40–6:45/mi. Small and quiet. No catch-up surges and no need to prove anything before Saturday.',
       true,
       'Hold Jose at the current 6:40–6:45 band.'),
      (date '2026-11-17',
       null,
       'Familiar support only if the November 14 durability work was absorbed normally.',
       'Use 6:40–6:45/mi. If the prior long run is still present in the legs, reduce the touch or run easy. No make-up repetitions.',
       true,
       'Make post-durability support conditional and hold the current band.'),
      (date '2026-11-19',
       'Threshold 2 × 8 min · if recovered',
       'A small aerobic-support touch in the taper only if the prior week is absorbed.',
       'Run controlled threshold only with normal recovery. Otherwise easy. The point is contact, not fitness proof.',
       false,
       'Make taper threshold explicitly conditional.'),
      (date '2026-11-24',
       null,null,
       'Use 6:40–6:45/mi. Rhythm only, no fast edge and no rescue of the average.',
       true,
       'Hold Jose at the current 6:40–6:45 band.'),
      (date '2026-12-01',
       null,null,
       'Use 6:40–6:45/mi. One familiar touch, deliberately cheap, finished wanting more.',
       true,
       'Hold Jose at the current 6:40–6:45 band into race week.')
  ),
  current_versions as (
    select distinct on (ps.id)
      ps.id as target_session_id,
      ps.scheduled_on,
      v.id as old_version_id,
      v.athlete_id,
      v.version_number,
      v.title,
      v.prescribed_distance,
      v.distance_unit,
      v.prescribed_duration_minutes,
      v.intent,
      v.details,
      v.rpe_low,
      v.rpe_high,
      v.pace_low,
      v.pace_high,
      v.shape,
      v.coach_note
    from public.planned_sessions ps
    join public.planned_session_versions v on v.planned_session_id=ps.id
    join targets t on t.scheduled_on=ps.scheduled_on
    where ps.athlete_id=jose_id and ps.state='published'
    order by ps.id,v.version_number desc
  ),
  inserted as (
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
      prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by,
      pace_low,pace_high,shape,coach_note
    )
    select
      cv.athlete_id,cv.target_session_id,cv.version_number+1,
      coalesce(t.new_title,cv.title),
      cv.prescribed_distance,cv.distance_unit,cv.prescribed_duration_minutes,
      coalesce(t.new_intent,cv.intent),
      coalesce(t.new_details,cv.details),
      t.reason,
      cv.rpe_low,cv.rpe_high,coach_id,cv.pace_low,cv.pace_high,cv.shape,cv.coach_note
    from current_versions cv
    join targets t on t.scheduled_on=cv.scheduled_on
    where not exists (
      select 1 from public.planned_session_versions newer
      where newer.planned_session_id=cv.target_session_id and newer.change_reason=t.reason
    )
    returning id,planned_session_id
  )
  insert into public.planned_session_components(
    athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
    duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,pace_low_seconds,pace_high_seconds,
    rpe_low,rpe_high,rpe_source,rpe_default_version,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
    counts_toward_mark_id
  )
  select
    c.athlete_id,i.id,c.position,c.role,c.shape,c.repeat_count,c.distance,c.distance_unit,
    c.duration_seconds,c.recovery_seconds,c.recovery_kind,
    case when t.set_band and c.role='work' and c.pace_low_seconds=390 and c.pace_high_seconds=405
         then public.clock_from_seconds(400) else c.pace_low end,
    c.pace_high,
    case when t.set_band and c.role='work' and c.pace_low_seconds=390 and c.pace_high_seconds=405
         then 400 else c.pace_low_seconds end,
    c.pace_high_seconds,
    c.rpe_low,c.rpe_high,c.rpe_source,c.rpe_default_version,
    c.repeat_minimum,c.repeat_target,c.repeat_progression,c.repeat_ceiling,c.counts_toward_mark_id
  from inserted i
  join current_versions cv on cv.target_session_id=i.planned_session_id
  join targets t on t.scheduled_on=cv.scheduled_on
  join public.planned_session_components c on c.version_id=cv.old_version_id;

  -- Oct 24: familiar easy long run after Oct 20.
  select ps.id into strict session_id
  from public.planned_sessions ps
  where ps.athlete_id=jose_id and ps.state='published' and ps.scheduled_on=date '2026-10-24';
  if not exists (
    select 1 from public.planned_session_versions
    where planned_session_id=session_id
      and change_reason='Protect the Oct 20 read: remove the automatic four-day-later race-pace finish.'
  ) then
    select max(version_number)+1 into next_num from public.planned_session_versions where planned_session_id=session_id;
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,intent,details,change_reason,authored_by
    ) values(
      jose_id,session_id,next_num,'Long run',14,'mi',
      'Absorb the eight-mile checkpoint with familiar easy volume.',
      '14 miles entirely easy. No automatic race-pace finish and no make-up quality. Shorten if October 20 is not fully absorbed.',
      'Protect the Oct 20 read: remove the automatic four-day-later race-pace finish.',coach_id
    ) returning id into new_version_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,distance,distance_unit,pace_low,pace_low_seconds
    ) values(jose_id,new_version_id,1,'work','continuous',14,'mi',public.clock_from_seconds(480),480);
  end if;

  -- Nov 7: first late-access rehearsal is 12 easy + 4 RP.
  select ps.id into strict session_id
  from public.planned_sessions ps
  where ps.athlete_id=jose_id and ps.state='published' and ps.scheduled_on=date '2026-11-07';
  if not exists (
    select 1 from public.planned_session_versions
    where planned_session_id=session_id
      and change_reason='Separate late access from ownership: reduce the first late-run rehearsal to four miles.'
  ) then
    select max(version_number)+1 into next_num from public.planned_session_versions where planned_session_id=session_id;
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,intent,details,change_reason,authored_by
    ) values(
      jose_id,session_id,next_num,'Long run — last 4 at race pace',16,'mi',
      'First late-access rehearsal: can the current band return after twelve easy miles without turning the run into a race?',
      '16 miles total: 12 easy, then 4 miles at 6:40–6:45/mi only if the week is absorbed. Otherwise keep the run easy. This is durability evidence, not a new ownership rung.',
      'Separate late access from ownership: reduce the first late-run rehearsal to four miles.',coach_id
    ) returning id into new_version_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,distance,distance_unit,pace_low,pace_high,pace_low_seconds,pace_high_seconds
    ) values
      (jose_id,new_version_id,1,'work','continuous',12,'mi',public.clock_from_seconds(480),null,480,null),
      (jose_id,new_version_id,2,'work','continuous',4,'mi',public.clock_from_seconds(400),public.clock_from_seconds(405),400,405);
  end if;

  -- Nov 14: 10 easy + 6 RP; no mandatory 12-mile rehearsal.
  select ps.id into strict session_id
  from public.planned_sessions ps
  where ps.athlete_id=jose_id and ps.state='published' and ps.scheduled_on=date '2026-11-14';
  if not exists (
    select 1 from public.planned_session_versions
    where planned_session_id=session_id
      and change_reason='Remove the mandatory 12-mile rehearsal; peak late access at six unless later evidence earns a different athlete-specific dose.'
  ) then
    select max(version_number)+1 into next_num from public.planned_session_versions where planned_session_id=session_id;
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,intent,details,change_reason,authored_by
    ) values(
      jose_id,session_id,next_num,'16 mi total — last 6 at race pace',16,'mi',
      'Peak late-access durability without recreating the half marathon in training.',
      '16 miles total: 10 easy, then 6 miles at 6:40–6:45/mi only if prior work is absorbed. Do not extend to 8, 9, 10 or 12 just to complete a ladder. Any extension requires a later explicit coach decision from the accumulated evidence.',
      'Remove the mandatory 12-mile rehearsal; peak late access at six unless later evidence earns a different athlete-specific dose.',coach_id
    ) returning id into new_version_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,distance,distance_unit,pace_low,pace_high,pace_low_seconds,pace_high_seconds
    ) values
      (jose_id,new_version_id,1,'work','continuous',10,'mi',public.clock_from_seconds(480),null,480,null),
      (jose_id,new_version_id,2,'work','continuous',6,'mi',public.clock_from_seconds(400),public.clock_from_seconds(405),400,405);
  end if;

  update public.planned_sessions
  set override_reason=coalesce(
    override_reason,
    'Oct 6 observation-system revision: current Jose evidence governs support, pace band and late durability.'
  )
  where athlete_id=jose_id and state='published'
    and scheduled_on in (
      date '2026-10-15',date '2026-10-24',date '2026-10-27',date '2026-10-29',
      date '2026-11-03',date '2026-11-07',date '2026-11-10',date '2026-11-14',
      date '2026-11-17',date '2026-11-19',date '2026-11-24',date '2026-12-01'
    );

  if exists (
    select 1
    from public.planned_sessions ps
    join lateral (
      select * from public.planned_session_versions v
      where v.planned_session_id=ps.id order by version_number desc limit 1
    ) v on true
    where ps.athlete_id=jose_id and ps.state='published' and ps.scheduled_on=date '2026-11-14'
      and (v.title ilike '%12%race pace%' or v.details ilike '%final 12%')
  ) then
    raise exception 'Jose Nov 14 still exposes the superseded 12-mile rehearsal';
  end if;
end $$;
