do $$
declare
  p_id uuid;
  live public.plan_publications%rowtype;
  live_number integer;
  live_summary text;
  new_v uuid;
  nw uuid;
  ns uuid;
  ow record;
  os record;
  n integer;
  next_number integer;
  new_summary text := 'Oct 6 consolidation: W8 Saturday stays easy to protect the 8-mile ownership ask; late access begins 4 then 6; demanding Thursday work is conditional support, not owed.';
begin
  select id into strict p_id from public.training_plans where slug='race-pace-durability' for update;
  select count(*) into n from public.plan_publications
    where plan_id=p_id and published_at is not null and revoked_at is null;
  if n<>1 then raise exception 'Expected exactly one current RPD publication'; end if;

  select * into strict live from public.plan_publications
    where plan_id=p_id and published_at is not null and revoked_at is null for update;
  select version_number,summary into live_number,live_summary
    from public.training_plan_versions where id=live.plan_version_id;

  if live_summary=new_summary then return; end if;
  if live_number<>9 or live_summary is distinct from
    'Oct 6 observation-system revision: ownership asks stop at 8; late-run durability is separate and smaller; 12 mi at race pace is no longer a mandatory rung. Thursday is support, not owed.'
  then raise exception 'A different RPD revision is current; reconcile before applying v10'; end if;

  select max(version_number)+1 into next_number from public.training_plan_versions where plan_id=p_id;
  insert into public.training_plan_versions(plan_id,version_number,summary,cut_by)
  values(p_id,next_number,new_summary,live.published_by) returning id into new_v;

  for ow in select * from public.training_plan_weeks where version_id=live.plan_version_id order by week_number
  loop
    insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(
      p_id,new_v,ow.week_number,ow.phase,ow.total_distance,
      case when ow.week_number=8
        then 'Build specific volume while protecting the next ownership ask. Saturday stays easy; late access does not begin before eight is asked and absorbed.'
        else ow.intent end
    ) returning id into nw;

    for os in select * from public.training_plan_sessions where plan_week_id=ow.id order by position
    loop
      insert into public.training_plan_sessions(
        plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
        prescribed_distance,distance_unit,asks_rung_value,label
      ) values (
        p_id,new_v,nw,os.day_of_week,
        case when os.day_of_week='THU' and os.role='key' then 'support' else os.role end,
        os.position,
        case
          when ow.week_number=8 and os.day_of_week='SAT' then 'Long run'
          when os.day_of_week='THU' and os.role='key' and os.title not ilike '%if Tuesday absorbed%'
            then os.title || ' · if Tuesday absorbed'
          else os.title end,
        case
          when ow.week_number=8 and os.day_of_week='SAT'
            then 'Keep the long run easy so the eight-mile ownership ask remains the next specific question.'
          when os.day_of_week='THU' and os.role='key'
            then 'Conditional aerobic support only when Tuesday was controlled and recovery is normal. Thursday is earned, not owed.'
          else os.intent end,
        case
          when ow.week_number=8 and os.day_of_week='SAT'
            then '16 miles easy. No automatic race-pace finish. Late-access work begins only after the eight-mile ownership ask has been established and absorbed.'
          when os.day_of_week='THU' and os.role='key'
            then concat_ws(' ', nullif(os.details,''),
              'Run the authored support only when Tuesday was controlled and recovery is normal. If Tuesday was costly, legs are not normal, or hard lower-body / HYROX / racing already consumed the quality budget, run easy or rest. Do not make up skipped support later.')
          else os.details end,
        case when ow.week_number=8 and os.day_of_week='SAT' then 16 else os.prescribed_distance end,
        os.distance_unit,
        os.asks_rung_value,
        case when ow.week_number=8 and os.day_of_week='SAT' then 'Long run' else os.label end
      ) returning id into ns;

      if ow.week_number=8 and os.day_of_week='SAT' then
        insert into public.training_plan_components(
          plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        ) values(ns,1,'work','continuous',16,'mi',null,null,480,null,null,null,null,null,false);
      else
        insert into public.training_plan_components(
          plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        )
        select ns,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
               pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        from public.training_plan_components where plan_session_id=os.id order by position;
      end if;
    end loop;
  end loop;

  if (select count(*) from public.training_plan_weeks where version_id=new_v)<>15
    then raise exception 'RPD v10 incomplete weeks'; end if;
  if (select count(*) from public.training_plan_sessions where version_id=new_v)
     <> (select count(*) from public.training_plan_sessions where version_id=live.plan_version_id)
    then raise exception 'RPD v10 incomplete sessions'; end if;
  if exists(select 1 from public.training_plan_sessions where version_id=new_v and asks_rung_value=12)
    then raise exception 'RPD v10 still has 12-mile ownership ask'; end if;
  if exists(select 1 from public.training_plan_sessions where version_id=new_v and day_of_week='THU' and role='key')
    then raise exception 'RPD v10 still marks Thursday as key'; end if;
  if exists(select 1 from public.plan_assignments where plan_version_id=new_v)
    then raise exception 'RPD v10 must not migrate athlete assignments automatically'; end if;

  update public.plan_publications set revoked_at=now() where id=live.id;
  insert into public.plan_publications(
    plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by,effective_on
  )
  values(p_id,new_v,live.slug,live.starts_on,live.race_on,live.race_name,now(),live.published_by,live.effective_on);
end $$;
