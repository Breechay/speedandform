-- Connected studies: the approved template, dated app sessions and public plan
-- must agree. No private observations are selected by the public wrappers.
-- Publication is explicit. Template edits alone do not publish private work.
begin;
alter table public.plan_publications add column if not exists effective_on date;
comment on column public.plan_publications.effective_on is 'First dated session covered by this publication; older performed history remains pinned.';
create or replace function public.connected_study_plan(p_slug text)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare pub public.plan_publications%rowtype; b public.training_blocks%rowtype;
 a public.athletes%rowtype; v public.training_plan_versions%rowtype; problem text; payload jsonb; native_unit text;
begin
 if p_slug not in ('simon','elijah') or p_slug is null then return jsonb_build_object('state','unavailable'); end if;
 select * into a from public.athletes where slug=p_slug;
 select * into b from public.training_blocks where athlete_id=a.id and status='active' order by created_at desc limit 1;
 select p.* into pub from public.plan_publications p where p.plan_id=b.plan_id and p.published_at is not null and p.revoked_at is null order by p.published_at desc limit 1;
 if pub.id is null then return jsonb_build_object('state','unavailable','message','No approved public plan.'); end if;
 select * into v from public.training_plan_versions where id=pub.plan_version_id;
 if b.plan_version_id is distinct from pub.plan_version_id or b.race_on is distinct from pub.race_on
 or b.starts_on is distinct from pub.starts_on
 or not exists(select 1 from public.plan_assignments pa where pa.block_id=b.id and pa.athlete_id=a.id and pa.plan_version_id=pub.plan_version_id and pa.starts_on=pub.starts_on)
 then problem:='assignment'; end if;
 -- History remains attached to the version that was actually delivered.
 -- Compare only current/future dates, not past sessions rewritten retrospectively.
 if problem is null and exists(
  select 1 from public.training_plan_sessions s join public.training_plan_weeks tw on tw.id=s.plan_week_id
  left join public.training_weeks w on w.block_id=b.id and w.week_number=tw.week_number
  left join public.planned_sessions ps on ps.week_id=w.id and ps.plan_session_id=s.id and ps.state in ('published','completed','changed')
  left join lateral(select x.* from public.planned_session_versions x where x.planned_session_id=ps.id order by x.version_number desc limit 1)sv on true
  where s.version_id=pub.plan_version_id
   and pub.starts_on+(tw.week_number-1)*7+array_position(array['MON','TUE','WED','THU','FRI','SAT','SUN'],s.day_of_week)-1 >= greatest((now() at time zone 'America/New_York')::date,coalesce(pub.effective_on,pub.starts_on))
   and (ps.id is null or ps.scheduled_on is distinct from (pub.starts_on+(tw.week_number-1)*7+array_position(array['MON','TUE','WED','THU','FRI','SAT','SUN'],s.day_of_week)-1)
    or (sv.title,sv.intent,sv.details,sv.prescribed_distance,sv.distance_unit,ps.role,ps.is_key) is distinct from (s.title,s.intent,nullif(btrim(s.details),''),s.prescribed_distance,s.distance_unit,s.role,s.role='key')
    or (select jsonb_agg(jsonb_build_array(c.role,c.shape,c.repeat_count,c.distance,c.distance_unit,c.duration_seconds,c.recovery_seconds,c.recovery_kind,c.pace_low_seconds,c.pace_high_seconds,c.rpe_low,c.rpe_high,c.counts_toward_mark_id is not null) order by c.position) from public.planned_session_components c where c.version_id=sv.id)
       is distinct from (select jsonb_agg(jsonb_build_array(c.role,c.shape,c.repeat_count,c.distance,case when c.distance is null then null else c.distance_unit end,c.duration_seconds,c.recovery_seconds,c.recovery_kind,c.pace_low_seconds,c.pace_high_seconds,c.rpe_low,c.rpe_high,c.counts_toward_mark) order by c.position) from public.training_plan_components c where c.plan_session_id=s.id))
 ) then problem:='prescription'; end if;
 if problem is null and exists(select 1 from public.planned_sessions ps join public.training_weeks w on w.id=ps.week_id
 where w.block_id=b.id and ps.state='published' and ps.scheduled_on >= greatest((now() at time zone 'America/New_York')::date,coalesce(pub.effective_on,pub.starts_on))
 and not exists(select 1 from public.training_plan_sessions s where s.id=ps.plan_session_id and s.version_id=pub.plan_version_id)) then problem:='session_set'; end if;
 if problem is not null then return jsonb_build_object('state','review_required','message','A coaching update is awaiting matched publication. The saved plan is not confirmed current.'); end if;
 select s.distance_unit into native_unit from public.training_plan_sessions s where s.version_id=v.id and s.prescribed_distance is not null limit 1;
 payload:=public.public_plan(pub.slug);
 return jsonb_build_object('state','published','schema_version',1,'athlete_slug',p_slug,'revision',upper(p_slug)||'-V'||v.version_number,
 'distance_unit',native_unit,'pace_seconds_unit','mi','payload',payload,'effective_on',pub.effective_on,'checked_at',now());
end $$;
revoke all on function public.connected_study_plan(text) from public,anon,authenticated;
grant execute on function public.connected_study_plan(text) to service_role;

create or replace function public.study_003_plan() returns jsonb language sql stable security definer set search_path=''
as $$ select public.connected_study_plan('simon') $$;
create or replace function public.paired_study_plans() returns jsonb language sql stable security definer set search_path=''
as $$ select jsonb_build_object('schema_version',1,'athletes',jsonb_build_object('simon',public.connected_study_plan('simon'),'elijah',public.connected_study_plan('elijah'))) $$;
revoke all on function public.study_003_plan() from public;
revoke all on function public.paired_study_plans() from public;
grant execute on function public.study_003_plan(),public.paired_study_plans() to anon,authenticated,service_role;

-- An explicitly authorized publication also delivers future sessions. It never
-- credits a completion, rewrites a past day, or publishes private filings.
create or replace function public.publish_connected_study_plan(p_slug text,p_expected_version integer,p_effective_on date,p_race_on date,p_race_name text,p_race_place text,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare a public.athletes%rowtype; pa public.plan_assignments%rowtype; b public.training_blocks%rowtype;
 t public.training_plans%rowtype; v public.training_plan_versions%rowtype; s record; old public.planned_sessions%rowtype;
 wid uuid; sid uuid; mid uuid; parts jsonb; dt date; n integer:=0; seen uuid[]:='{}'; result jsonb;
begin
 if p_slug is null or p_slug not in ('elijah','simon') or nullif(btrim(p_reason),'') is null then raise exception 'Explicit study and publication reason required'; end if;
 select * into a from public.athletes where slug=p_slug;
 if not public.is_coach_member(a.id) then raise exception 'Only the athlete coach may publish'; end if;
 if p_effective_on < (now() at time zone 'America/New_York')::date then raise exception 'Do not rewrite past sessions'; end if;
 select x.* into pa from public.plan_assignments x join public.training_blocks bx on bx.id=x.block_id and bx.status='active' where x.athlete_id=a.id order by x.assigned_at desc limit 1 for update of x;
 if pa.starts_at_plan_week is distinct from 1 then raise exception 'Nonstandard plan offset requires explicit review'; end if;
 select * into b from public.training_blocks where id=pa.block_id for update;
 select * into t from public.training_plans where id=pa.plan_id;
 select * into v from public.training_plan_versions where id=pa.plan_version_id;
 if v.version_number is distinct from p_expected_version then raise exception 'Assignment changed during review'; end if;
 if p_effective_on is null or p_race_on is null or p_race_name is null or p_race_on < p_effective_on then raise exception 'Valid calendar required'; end if;
 if exists(select 1 from public.planned_sessions ps join public.training_weeks w on w.id=ps.week_id where w.block_id=b.id and ps.scheduled_on>=p_effective_on and (ps.override_reason is not null or exists(select 1 from public.session_completions c where c.planned_session_id=ps.id))) then raise exception 'Future overrides or filed evidence require manual review'; end if;
 select id into mid from public.athlete_marks where athlete_id=a.id and active and is_primary limit 1;
 for s in select x.*,w.week_number from public.training_plan_sessions x join public.training_plan_weeks w on w.id=x.plan_week_id where x.version_id=v.id
 order by w.week_number,(x.title ilike 'Race%') desc,x.position loop
  dt:=pa.starts_on+(s.week_number-pa.starts_at_plan_week)*7+array_position(array['MON','TUE','WED','THU','FRI','SAT','SUN'],s.day_of_week)-1;
  if dt<p_effective_on then continue; end if;
  select id into wid from public.training_weeks where block_id=b.id and week_number=s.week_number;
  if wid is null then raise exception 'Missing assigned week %',s.week_number; end if;
  -- Normal updates retain dated-session identity. Race-date corrections retain
  -- race identity first, then remaining slots are matched without reusing IDs.
  select ps.* into old from public.planned_sessions ps join lateral(select title from public.planned_session_versions q where q.planned_session_id=ps.id order by version_number desc limit 1)q on true
   where ps.week_id=wid and ps.state='published' and not (ps.id=any(seen))
     and ((s.title ilike 'Race%' and q.title ilike 'Race%') or (s.title not ilike 'Race%' and q.title not ilike 'Race%' and (ps.day_label=s.day_of_week or ps.position=s.position)))
   order by (ps.plan_session_id=s.id) desc,(ps.day_label=s.day_of_week) desc limit 1;
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('role',c.role,'shape',c.shape,'distance',c.distance,'distanceUnit',c.distance_unit,'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,'countsTowardMarkId',case when c.counts_toward_mark then mid else null end)) order by c.position),'[]'::jsonb) into parts from public.training_plan_components c where c.plan_session_id=s.id;
  if exists(select 1 from public.training_plan_components c where c.plan_session_id=s.id and c.counts_toward_mark) and mid is null then raise exception 'Mark eligibility requires an existing athlete mark'; end if;
  if old.id is null then
   sid:=public.author_session(a.id,wid,s.day_of_week,s.title,s.intent,dt,null,s.prescribed_distance,s.distance_unit,null,null,null,parts,s.details);
  else
   sid:=old.id;
   if old.scheduled_on is distinct from dt then
    insert into public.planned_session_moves(athlete_id,planned_session_id,from_date,to_date,from_day_label,to_day_label,coach_decision,moved_by) values(a.id,sid,old.scheduled_on,dt,old.day_label,s.day_of_week,p_reason,auth.uid());
   end if;
   perform public.revise_session(sid,s.title,s.intent,p_reason,s.prescribed_distance,s.distance_unit,null,null,null,parts,s.details);
  end if;
  -- Use a temporary high slot to avoid collisions while race week is reordered.
  update public.planned_sessions set scheduled_on=dt,day_label=s.day_of_week,position=(100+s.position)::smallint,role=s.role,is_key=s.role='key',plan_session_id=s.id,updated_at=now() where id=sid;
  seen:=array_append(seen,sid); n:=n+1;
 end loop;
 if exists(select 1 from public.planned_sessions ps join public.training_weeks w on w.id=ps.week_id where w.block_id=b.id and ps.state='published' and ps.scheduled_on>=p_effective_on and not(ps.id=any(seen))) then raise exception 'Unmatched future sessions require explicit withdrawal'; end if;
 update public.planned_sessions ps set position=x.position::smallint from public.training_plan_sessions x where ps.id=any(seen) and x.id=ps.plan_session_id;
 update public.training_weeks w set intent=tw.intent from public.training_plan_weeks tw where w.block_id=b.id and tw.version_id=v.id and tw.week_number=w.week_number and w.starts_on>=p_effective_on;
 update public.training_blocks set plan_version_id=v.id,name=t.name,race_on=p_race_on,race_name=p_race_name,race_place=p_race_place,target_event=p_race_name||' · '||p_race_place,goal_label=a.goal_label,updated_at=now() where id=b.id;
 update public.plan_publications set revoked_at=now() where plan_id=t.id and revoked_at is null;
 insert into public.plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by,effective_on) values(t.id,v.id,t.slug,pa.starts_on,p_race_on,p_race_name||' · '||p_race_place,now(),auth.uid(),p_effective_on);
 result:=public.connected_study_plan(p_slug);
 if result->>'state'<>'published' then raise exception 'Publication parity failed: %',result; end if;
 return jsonb_build_object('state','published','athlete',p_slug,'version',v.version_number,'future_sessions',n,'effective_on',p_effective_on);
end $$;
revoke all on function public.publish_connected_study_plan(text,integer,date,date,text,text,text) from public,anon;
grant execute on function public.publish_connected_study_plan(text,integer,date,date,text,text,text) to authenticated,service_role;
commit;
