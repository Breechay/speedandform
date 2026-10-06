do $$
declare
  coach_id uuid;
  athlete_rec record;
  sess_rec record;
  ver_rec record;
  new_id uuid;
  next_num integer;
  new_title text;
  new_intent text;
  new_details text;
  reason text;
begin
  select published_by into coach_id
  from public.plan_publications pp
  join public.training_plans tp on tp.id=pp.plan_id
  where tp.slug='race-pace-durability' and pp.revoked_at is null and pp.published_at is not null
  limit 1;

  for athlete_rec in
    select ath.id as athlete_id,ath.slug as athlete_slug
    from public.athletes ath where ath.slug in ('anthony','elijah','simon')
  loop
    if not exists (
      select 1 from public.athlete_observations ao
      where ao.athlete_id=athlete_rec.athlete_id and ao.observation like 'FORM-WEEK-PRIORITY-20261006.%'
    ) then
      insert into public.athlete_observations(
        id,athlete_id,facet,source,observation,direction,observed_on,authored_by
      ) values(
        gen_random_uuid(),athlete_rec.athlete_id,'practice','coach_observed',
        'FORM-WEEK-PRIORITY-20261006. Brice identified an onboarding gap in the October 6 athlete updates: newer athletes have not all been explicitly taught the FORM weekly hierarchy. The primary running session should be protected; Monday / the prior day stays cheap; Thursday or secondary quality is support earned by recovery rather than a workout debt. Hard lower-body strength, HYROX or another demanding session counts against the same support budget. This is a coaching-system clarification, not a pace or fitness judgment.',
        'no_clear_change',date '2026-10-06',coach_id
      );
    end if;
  end loop;

  for sess_rec in
    select ps.*, ath.slug as athlete_slug
    from public.planned_sessions ps
    join public.athletes ath on ath.id=ps.athlete_id
    where ath.slug in ('anthony','elijah','simon')
      and ps.state='published'
      and ps.scheduled_on between date '2026-10-12' and date '2026-11-09'
      and extract(isodow from ps.scheduled_on)=1
  loop
    reason := 'Teach the weekly hierarchy: Monday protects the primary Tuesday session.';
    if exists(select 1 from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id and psv.change_reason=reason) then continue; end if;
    select * into strict ver_rec from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id order by psv.version_number desc limit 1;
    select max(psv.version_number)+1 into next_num from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id;
    new_details := concat_ws(' ',nullif(ver_rec.details,''),'Protect Tuesday: keep this genuinely easy. No bonus intervals, fast finish, make-up mileage or hard lower-body strength before the primary session.');
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
      prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by,
      pace_low,pace_high,shape,coach_note
    ) values(
      ver_rec.athlete_id,sess_rec.id,next_num,ver_rec.title,ver_rec.prescribed_distance,ver_rec.distance_unit,
      ver_rec.prescribed_duration_minutes,ver_rec.intent,new_details,reason,ver_rec.rpe_low,ver_rec.rpe_high,coach_id,
      ver_rec.pace_low,ver_rec.pace_high,ver_rec.shape,ver_rec.coach_note
    ) returning id into new_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
      duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,pace_low_seconds,pace_high_seconds,
      rpe_low,rpe_high,rpe_source,rpe_default_version,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
      counts_toward_mark_id
    )
    select psc.athlete_id,new_id,psc.position,psc.role,psc.shape,psc.repeat_count,psc.distance,psc.distance_unit,
      psc.duration_seconds,psc.recovery_seconds,psc.recovery_kind,psc.pace_low,psc.pace_high,psc.pace_low_seconds,psc.pace_high_seconds,
      psc.rpe_low,psc.rpe_high,psc.rpe_source,psc.rpe_default_version,psc.repeat_minimum,psc.repeat_target,psc.repeat_progression,psc.repeat_ceiling,
      psc.counts_toward_mark_id
    from public.planned_session_components psc where psc.version_id=ver_rec.id order by psc.position;
    update public.planned_sessions set override_reason=coalesce(override_reason,reason) where id=sess_rec.id;
  end loop;

  for sess_rec in
    select ps.*, ath.slug as athlete_slug
    from public.planned_sessions ps
    join public.athletes ath on ath.id=ps.athlete_id
    where ps.state='published' and (
      (ath.slug='anthony' and ps.scheduled_on in (date '2026-10-08',date '2026-10-15',date '2026-10-29')) or
      (ath.slug='simon' and ps.scheduled_on in (date '2026-10-08',date '2026-10-15'))
    )
  loop
    reason := 'Make Thursday support visibly conditional on Tuesday absorption.';
    if exists(select 1 from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id and psv.change_reason=reason) then continue; end if;
    select * into strict ver_rec from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id order by psv.version_number desc limit 1;
    select max(psv.version_number)+1 into next_num from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id;
    new_title := case when ver_rec.title ilike '%if Tuesday absorbed%' then ver_rec.title else ver_rec.title || ' · if Tuesday absorbed' end;
    new_intent := 'Support the week only when the primary Tuesday session is absorbed. Thursday is earned, not owed.';
    new_details := concat_ws(' ',nullif(ver_rec.details,''),'Run the authored quality only when Tuesday was controlled and recovery is normal. If Tuesday was costly, legs are not normal, or hard lower-body / HYROX work already consumed the quality budget, run easy or rest. Do not make up skipped support later.');
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
      prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by,
      pace_low,pace_high,shape,coach_note
    ) values(
      ver_rec.athlete_id,sess_rec.id,next_num,new_title,ver_rec.prescribed_distance,ver_rec.distance_unit,
      ver_rec.prescribed_duration_minutes,new_intent,new_details,reason,ver_rec.rpe_low,ver_rec.rpe_high,coach_id,
      ver_rec.pace_low,ver_rec.pace_high,ver_rec.shape,ver_rec.coach_note
    ) returning id into new_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
      duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,pace_low_seconds,pace_high_seconds,
      rpe_low,rpe_high,rpe_source,rpe_default_version,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
      counts_toward_mark_id
    )
    select psc.athlete_id,new_id,psc.position,psc.role,psc.shape,psc.repeat_count,psc.distance,psc.distance_unit,
      psc.duration_seconds,psc.recovery_seconds,psc.recovery_kind,psc.pace_low,psc.pace_high,psc.pace_low_seconds,psc.pace_high_seconds,
      psc.rpe_low,psc.rpe_high,psc.rpe_source,psc.rpe_default_version,psc.repeat_minimum,psc.repeat_target,psc.repeat_progression,psc.repeat_ceiling,
      psc.counts_toward_mark_id
    from public.planned_session_components psc where psc.version_id=ver_rec.id order by psc.position;
    update public.planned_sessions set override_reason=coalesce(override_reason,reason) where id=sess_rec.id;
  end loop;

  for sess_rec in
    select ps.*
    from public.planned_sessions ps
    join public.athletes ath on ath.id=ps.athlete_id
    where ath.slug='elijah' and ps.state='published'
      and ps.scheduled_on in (date '2026-10-08',date '2026-10-15',date '2026-10-22',date '2026-10-29',date '2026-11-05')
  loop
    reason := 'Teach Thursday as support earned by Tuesday, without increasing the dose.';
    if exists(select 1 from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id and psv.change_reason=reason) then continue; end if;
    select * into strict ver_rec from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id order by psv.version_number desc limit 1;
    select max(psv.version_number)+1 into next_num from public.planned_session_versions psv where psv.planned_session_id=sess_rec.id;
    new_title := case when ver_rec.title ilike 'Support ·%' then ver_rec.title else 'Support · ' || ver_rec.title end;
    new_details := concat_ws(' ',nullif(ver_rec.details,''),'Tuesday owns the main specific question. Keep this support cheap; if Tuesday is not fully absorbed, remove the strides/brisk pieces or run easy. No make-up work.');
    insert into public.planned_session_versions(
      athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
      prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by,
      pace_low,pace_high,shape,coach_note
    ) values(
      ver_rec.athlete_id,sess_rec.id,next_num,new_title,ver_rec.prescribed_distance,ver_rec.distance_unit,
      ver_rec.prescribed_duration_minutes,ver_rec.intent,new_details,reason,ver_rec.rpe_low,ver_rec.rpe_high,coach_id,
      ver_rec.pace_low,ver_rec.pace_high,ver_rec.shape,ver_rec.coach_note
    ) returning id into new_id;
    insert into public.planned_session_components(
      athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
      duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,pace_low_seconds,pace_high_seconds,
      rpe_low,rpe_high,rpe_source,rpe_default_version,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
      counts_toward_mark_id
    )
    select psc.athlete_id,new_id,psc.position,psc.role,psc.shape,psc.repeat_count,psc.distance,psc.distance_unit,
      psc.duration_seconds,psc.recovery_seconds,psc.recovery_kind,psc.pace_low,psc.pace_high,psc.pace_low_seconds,psc.pace_high_seconds,
      psc.rpe_low,psc.rpe_high,psc.rpe_source,psc.rpe_default_version,psc.repeat_minimum,psc.repeat_target,psc.repeat_progression,psc.repeat_ceiling,
      psc.counts_toward_mark_id
    from public.planned_session_components psc where psc.version_id=ver_rec.id order by psc.position;
    update public.planned_sessions set override_reason=coalesce(override_reason,reason) where id=sess_rec.id;
  end loop;
end $$;
