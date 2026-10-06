-- Withdraw the unvalidated automatic W7 3x12 default.
-- The publication table allows only one receipt per slug/version, so clone the
-- preceding prescription into a new version rather than reactivate old history.
-- Individual assignments, session versions and completed evidence are untouched.
do $$
declare
  p_id uuid; v6 uuid; new_v uuid; nw uuid; ns uuid;
  live public.plan_publications%rowtype;
  ow record; os record;
  n integer; next_number integer; live_number integer; live_summary text;
  correction_summary text := 'Oct 6 external-review correction: restore v6 prescription; withdraw automatic W7 3x12 default. Individual recovery decisions remain authoritative.';
begin
  select id into strict p_id from public.training_plans where slug='race-pace-durability' for update;
  select count(*) into n from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null;
  if n<>1 then raise exception 'Expected exactly one current RPD publication'; end if;
  select * into strict live from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null for update;
  select version_number,summary into live_number,live_summary from public.training_plan_versions where id=live.plan_version_id;
  if live_summary=correction_summary then return; end if;
  if live_number<>7 or live_summary is distinct from 'Oct 6 cost-lane revision: W7 Thursday 3x12 controlled threshold instead of VO2 5x3.' then
    raise exception 'A different revision is current; reconcile before restoring anything';
  end if;
  select id into strict v6 from public.training_plan_versions where plan_id=p_id and version_number=6;
  if (select count(*) from public.training_plan_weeks where version_id=v6)<>15 then raise exception 'Previous plan is incomplete'; end if;
  select max(version_number)+1 into next_number from public.training_plan_versions where plan_id=p_id;
  insert into public.training_plan_versions(plan_id,version_number,summary,cut_by)
  values(p_id,next_number,correction_summary,live.published_by) returning id into new_v;
  for ow in select * from public.training_plan_weeks where version_id=v6 order by week_number loop
    insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(p_id,new_v,ow.week_number,ow.phase,ow.total_distance,ow.intent) returning id into nw;
    for os in select * from public.training_plan_sessions where plan_week_id=ow.id order by position loop
      insert into public.training_plan_sessions(plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,prescribed_distance,distance_unit,asks_rung_value,label)
      values(p_id,new_v,nw,os.day_of_week,os.role,os.position,os.title,os.intent,os.details,os.prescribed_distance,os.distance_unit,os.asks_rung_value,os.label)
      returning id into ns;
      insert into public.training_plan_components(plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
      select ns,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
      from public.training_plan_components where plan_session_id=os.id order by position;
      if (select to_jsonb(s)-array['id','version_id','plan_week_id'] from public.training_plan_sessions s where s.id=ns)
         is distinct from (to_jsonb(os)-array['id','version_id','plan_week_id']) then
        raise exception 'Session semantics changed during restoration';
      end if;
      if (select jsonb_agg(to_jsonb(c)-array['id','plan_session_id'] order by c.position) from public.training_plan_components c where c.plan_session_id=ns)
         is distinct from (select jsonb_agg(to_jsonb(c)-array['id','plan_session_id'] order by c.position) from public.training_plan_components c where c.plan_session_id=os.id) then
        raise exception 'Component semantics changed during restoration';
      end if;
    end loop;
  end loop;
  if (select count(*) from public.training_plan_sessions where version_id=new_v)
     <> (select count(*) from public.training_plan_sessions where version_id=v6) then raise exception 'Incomplete restored sessions'; end if;
  update public.plan_publications set revoked_at=now() where id=live.id;
  insert into public.plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by,effective_on)
  values(p_id,new_v,live.slug,live.starts_on,live.race_on,live.race_name,now(),live.published_by,live.effective_on);
  if (select count(*) from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null)<>1 then raise exception 'Publication cardinality changed'; end if;
end $$;
