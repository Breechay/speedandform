-- RPD v4: distance-authored FORM language for hills, aerobic power and strides.
-- Earlier Plan versions and Hope/Jose W1-W3 occurrences remain untouched.

set local search_path=public,pg_temp;
select set_config('request.jwt.claims','{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}',true);

do $$
declare p_id uuid; old_v uuid; new_v uuid; ow record; os record; nw uuid; ns uuid;
begin
  select p.id,v.id into p_id,old_v from training_plans p join training_plan_versions v on v.plan_id=p.id
   where p.slug='race-pace-durability' and v.version_number=3;
  if p_id is null then raise exception 'RPD v3 missing'; end if;
  if exists(select 1 from training_plan_versions where plan_id=p_id and version_number=4)
    then raise exception 'RPD v4 already exists'; end if;

  insert into training_plan_versions(plan_id,version_number,summary,cut_by)
  values(p_id,4,'Distance-authored FORM language: 200m hills, 800m aerobic power, and 100m strides. Fixed-speed warm-ups remain 15 minutes.',auth.uid())
  returning id into new_v;

  for ow in select * from training_plan_weeks where version_id=old_v order by week_number loop
    insert into training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(p_id,new_v,ow.week_number,ow.phase,ow.total_distance,ow.intent) returning id into nw;
    for os in select * from training_plan_sessions where plan_week_id=ow.id order by position loop
      insert into training_plan_sessions(plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,prescribed_distance,distance_unit,asks_rung_value,label)
      values(p_id,new_v,nw,os.day_of_week,os.role,os.position,os.title,os.intent,os.details,os.prescribed_distance,os.distance_unit,os.asks_rung_value,os.label)
      returning id into ns;
      insert into training_plan_components(plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
      select ns,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
      from training_plan_components where plan_session_id=os.id order by position;
    end loop;
  end loop;

  -- W2: tangible hill distance, gradient-relative intent, no pace target.
  select s.id into ns from training_plan_sessions s join training_plan_weeks w on w.id=s.plan_week_id
   where s.version_id=new_v and w.week_number=2 and s.day_of_week='THU';
  update training_plan_sessions set title='Hills - 8 × 200m uphill',label='Hills',
    intent='Strong, powerful and controlled uphill. Maintain mechanics through the top; do not sprint the first half.',
    details='8 × 200m uphill controlled hard / jog down or about 2 min easy. WU 15 min; CD 10 min.' where id=ns;
  delete from training_plan_components where plan_session_id=ns;
  insert into training_plan_components(plan_session_id,position,role,shape,duration_seconds,distance,distance_unit,repeat_count,rpe_low,rpe_high,recovery_kind,recovery_seconds)
  values(ns,1,'warm_up','continuous',900,null,null,null,null,null,null,null),
        (ns,2,'work','repetitions',null,.2,'km',8,8,9,'jog down',120),
        (ns,3,'cool_down','continuous',600,null,null,null,null,null,null,null);

  -- W7: athlete-relative aerobic power, not a fixed absolute standard.
  select s.id into ns from training_plan_sessions s join training_plan_weeks w on w.id=s.plan_week_id
   where s.version_id=new_v and w.week_number=7 and s.day_of_week='THU';
  update training_plan_sessions set title='5 × 800m controlled hard',label='Aerobic power',
    intent='Controlled, repeatable aerobic power. This supports the durability block rather than replacing it.',
    details='5 × 800m controlled hard / 2 min easy. WU 20 min; CD 10 min.' where id=ns;
  delete from training_plan_components where plan_session_id=ns;
  insert into training_plan_components(plan_session_id,position,role,shape,duration_seconds,distance,distance_unit,repeat_count,recovery_kind,recovery_seconds)
  values(ns,1,'warm_up','continuous',1200,null,null,null,null,null),
        (ns,2,'work','repetitions',null,.8,'km',5,'easy',120),
        (ns,3,'cool_down','continuous',600,null,null,null,null,null);

  -- Recovery strides are a concrete 100m touch with full recovery.
  update training_plan_components c set distance=.1,distance_unit='km',duration_seconds=null,
      recovery_kind=null,recovery_seconds=null
    from training_plan_sessions s join training_plan_weeks w on w.id=s.plan_week_id
   where c.plan_session_id=s.id and s.version_id=new_v
     and w.week_number in (4,6,9,11,12,14,15) and s.day_of_week='THU'
     and c.role='work' and c.shape='repetitions';
  update training_plan_sessions s set
      details='4 × 100m relaxed fast with full walk/jog recovery.'
    from training_plan_weeks w
   where w.id=s.plan_week_id and s.version_id=new_v
     and w.week_number in (4,6,9,11,12,14,15) and s.day_of_week='THU';
end $$;

-- Keep the public component's authored unit. A renderer must never guess it.
create or replace function public.public_plan(p_slug text)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
select jsonb_build_object(
 'plan',jsonb_build_object('slug',pub.slug,'name',p.name,'discipline',p.discipline,'total_weeks',p.total_weeks,'question',p.question,'for_whom',p.for_whom,'entry_volume',p.entry_volume,'peak_volume',p.peak_volume,'race_pace_low_seconds',p.race_pace_low_seconds,'race_pace_high_seconds',p.race_pace_high_seconds),
 'version',jsonb_build_object('number',v.version_number,'summary',v.summary,'cut_at',v.cut_at),
 'running',jsonb_build_object('starts_on',pub.starts_on,'race_on',pub.race_on,'race_name',pub.race_name,'published_at',pub.published_at),
 'weeks',(select coalesce(jsonb_agg(jsonb_build_object('week_number',w.week_number,'phase',w.phase,'total_distance',w.total_distance,'intent',w.intent,
   'sessions',(select coalesce(jsonb_agg(jsonb_build_object('day',s.day_of_week,'role',s.role,'label',s.label,'title',s.title,'intent',s.intent,'details',s.details,'distance',s.prescribed_distance,'asks',s.asks_rung_value,
     'components',(select coalesce(jsonb_agg(jsonb_build_object('role',c.role,'shape',c.shape,'distance',c.distance,'distance_unit',c.distance_unit,'duration_seconds',c.duration_seconds,'repeat_count',c.repeat_count,'pace_low_seconds',c.pace_low_seconds,'pace_high_seconds',c.pace_high_seconds,'rpe_low',c.rpe_low,'rpe_high',c.rpe_high,'recovery_kind',c.recovery_kind,'recovery_seconds',c.recovery_seconds,'counts_toward_mark',c.counts_toward_mark) order by c.position),'[]'::jsonb) from training_plan_components c where c.plan_session_id=s.id)) order by s.position),'[]'::jsonb) from training_plan_sessions s where s.plan_week_id=w.id)) order by w.week_number),'[]'::jsonb) from training_plan_weeks w where w.version_id=v.id),
 'field',(select coalesce(jsonb_agg(jsonb_build_object('name',r.display_name,'entered',r.entered,'established',r.established,'race',r.race_result,'coach_read',r.coach_read) order by r.position),'[]'::jsonb) from plan_result_publications r where r.plan_publication_id=pub.id and r.published_at is not null and r.revoked_at is null))
from plan_publications pub join training_plans p on p.id=pub.plan_id join training_plan_versions v on v.id=pub.plan_version_id
where pub.slug=p_slug and pub.published_at is not null and pub.revoked_at is null;
$$;
revoke all on function public.public_plan(text) from public;
grant execute on function public.public_plan(text) to anon,authenticated;

-- Future Hope/Jose occurrences keep their ids but resolve against v4. Only
-- changed W4+ sessions receive a new occurrence version. W1-W3 are untouched.
do $$
declare new_v uuid; r record; mark_id uuid; parts jsonb;
begin
  select v.id into new_v from training_plan_versions v join training_plans p on p.id=v.plan_id where p.slug='race-pace-durability' and v.version_number=4;
  if exists(select 1 from session_completions c join planned_sessions ps on ps.id=c.planned_session_id join training_weeks w on w.id=ps.week_id join athletes a on a.id=ps.athlete_id where a.slug in ('hope','jose') and w.week_number between 4 and 15)
    then raise exception 'Filed future work exists; refusing v4'; end if;

  update planned_sessions ps set plan_session_id=ns.id
  from athletes a,training_weeks aw,training_plan_sessions os,training_plan_weeks ow,training_plan_sessions ns,training_plan_weeks nw
  where ps.athlete_id=a.id and a.slug in ('hope','jose') and ps.state<>'cancelled' and ps.week_id=aw.id and aw.week_number between 4 and 15
    and os.id=ps.plan_session_id and ow.id=os.plan_week_id and ns.version_id=new_v and nw.id=ns.plan_week_id
    and nw.week_number=ow.week_number and ns.day_of_week=os.day_of_week and ns.position=os.position;

  update plan_assignments pa set plan_version_id=new_v,notes='RPD v4 effective W4: distance-authored aerobic power and strides. W1-W3 history remains unchanged.'
  from athletes a where a.id=pa.athlete_id and a.slug in ('hope','jose') and pa.plan_id=(select id from training_plans where slug='race-pace-durability');
  update training_blocks b set plan_version_id=new_v from athletes a where a.id=b.athlete_id and a.slug in ('hope','jose') and b.status='active' and b.name='Race Pace Durability';

  for r in select ps.id occurrence_id,ps.athlete_id,s.*,w.week_number from planned_sessions ps join athletes a on a.id=ps.athlete_id join training_plan_sessions s on s.id=ps.plan_session_id and s.version_id=new_v join training_plan_weeks w on w.id=s.plan_week_id
    where a.slug in ('hope','jose') and ps.state<>'cancelled' and ((w.week_number=7 and s.day_of_week='THU') or (w.week_number in (4,6,9,11,12,14,15) and s.day_of_week='THU'))
  loop
    select id into mark_id from athlete_marks where athlete_id=r.athlete_id and active and is_primary;
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('role',c.role,'shape',c.shape,'position',c.position,'distance',c.distance,'distanceUnit',c.distance_unit,'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,'countsTowardMarkId',case when c.counts_toward_mark then mark_id end)) order by c.position) into parts from training_plan_components c where c.plan_session_id=r.id;
    perform write_session_version(r.occurrence_id,r.title,r.intent,r.prescribed_distance,r.distance_unit,null,null,null,'RPD v4: distance-authored aerobic power or strides.',parts,r.details);
  end loop;
end $$;

update plan_publications pub set revoked_at=now() from training_plans p where p.id=pub.plan_id and p.slug='race-pace-durability' and pub.revoked_at is null;
insert into plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by)
select p.id,v.id,'race-pace-durability',date '2026-08-24',date '2026-12-05','OUC Half Marathon',now(),auth.uid() from training_plans p join training_plan_versions v on v.plan_id=p.id and v.version_number=4 where p.slug='race-pace-durability';

do $$ declare n int; x jsonb; begin
 select count(*) into n from assignment_drift; if n<>0 then raise exception '% drift rows',n; end if;
 select public_plan('race-pace-durability') into x; if (x->'version'->>'number')::int<>4 then raise exception 'public RPD not v4'; end if;
 if (select count(*) from training_plan_sessions s join training_plan_versions v on v.id=s.version_id join training_plans p on p.id=v.plan_id where p.slug='race-pace-durability' and v.version_number=4)<>90 then raise exception 'v4 incomplete'; end if;
end $$;
