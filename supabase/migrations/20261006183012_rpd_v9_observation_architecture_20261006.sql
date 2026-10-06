do $$
declare
  p_id uuid; live public.plan_publications%rowtype; live_number integer; live_summary text;
  new_v uuid; nw uuid; ns uuid; ow record; os record; n integer; next_number integer;
  new_summary text := 'Oct 6 observation-system revision: ownership asks stop at 8; late-run durability is separate and smaller; 12 mi at race pace is no longer a mandatory rung. Thursday is support, not owed.';
begin
  select id into strict p_id from public.training_plans where slug='race-pace-durability' for update;
  select count(*) into n from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null;
  if n<>1 then raise exception 'Expected exactly one current RPD publication'; end if;
  select * into strict live from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null for update;
  select version_number,summary into live_number,live_summary from public.training_plan_versions where id=live.plan_version_id;

  if live_summary=new_summary then return; end if;
  if live_number<>8 or live_summary is distinct from 'Oct 6 external-review correction: restore v6 prescription; withdraw automatic W7 3x12 default. Individual recovery decisions remain authoritative.' then
    raise exception 'A different RPD revision is current; reconcile before applying v9';
  end if;

  select max(version_number)+1 into next_number from public.training_plan_versions where plan_id=p_id;
  insert into public.training_plan_versions(plan_id,version_number,summary,cut_by)
  values(p_id,next_number,new_summary,live.published_by) returning id into new_v;

  for ow in select * from public.training_plan_weeks where version_id=live.plan_version_id order by week_number loop
    insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(
      p_id,new_v,ow.week_number,
      case when ow.week_number=12 then 'build' else ow.phase end,
      case when ow.week_number=9 then 57 when ow.week_number=11 then 58 else ow.total_distance end,
      case
        when ow.week_number=9 then 'Eight continuous is the week''s main question. Saturday stays easy so the ask can be interpreted and absorbed.'
        when ow.week_number=11 then 'Introduce late access with a modest race-pace finish. This is durability under prior running, not a new ownership rung.'
        when ow.week_number=12 then 'Peak late access without recreating the race. Six late miles are the authored dose; any extension belongs to an athlete-specific decision.'
        else ow.intent
      end
    ) returning id into nw;

    for os in select * from public.training_plan_sessions where plan_week_id=ow.id order by position loop
      insert into public.training_plan_sessions(
        plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
        prescribed_distance,distance_unit,asks_rung_value,label
      ) values (
        p_id,new_v,nw,os.day_of_week,os.role,os.position,
        case
          when ow.week_number=9 and os.day_of_week='SAT' then 'Long run'
          when ow.week_number=11 and os.day_of_week='SAT' then 'Long run — last 4 at race pace'
          when ow.week_number=12 and os.day_of_week='SAT' then 'Long run — last 6 at race pace'
          else os.title
        end,
        case
          when ow.week_number=9 and os.day_of_week='SAT' then 'Keep the long run easy so Tuesday remains the week''s specific question.'
          when ow.week_number=11 and os.day_of_week='SAT' then 'First late-access rehearsal: four at the band after twelve easy. This is a durability question, not a new ownership rung.'
          when ow.week_number=12 and os.day_of_week='SAT' then 'Peak late-access rehearsal without recreating the race. Six at the band after ten easy; extension is athlete-specific and evidence-gated.'
          else os.intent
        end,
        case
          when ow.week_number=9 and os.day_of_week='SAT' then '14 miles easy. No automatic race-pace finish. Late specific work requires its own purpose and a coach decision.'
          when ow.week_number=11 and os.day_of_week='SAT' then '16 miles total: 12 easy, then the final 4 miles at your race-pace band if the week is absorbed. Otherwise keep it easy.'
          when ow.week_number=12 and os.day_of_week='SAT' then '16 miles total: 10 easy, then the final 6 miles at your race-pace band if recovered. Do not extend to eight or more just to complete a ladder.'
          else os.details
        end,
        case
          when ow.week_number=9 and os.day_of_week='SAT' then 14
          when ow.week_number=11 and os.day_of_week='SAT' then 16
          else os.prescribed_distance
        end,
        os.distance_unit,
        case when ow.week_number=12 and os.day_of_week='SAT' then null else os.asks_rung_value end,
        case
          when ow.week_number=9 and os.day_of_week='SAT' then 'Long run'
          when ow.week_number in (11,12) and os.day_of_week='SAT' then 'Long run · race pace finish'
          else os.label
        end
      ) returning id into ns;

      if ow.week_number=9 and os.day_of_week='SAT' then
        insert into public.training_plan_components(
          plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        ) values(ns,1,'work','continuous',14,'mi',null,null,480,null,null,null,null,null,false);
      elsif ow.week_number=11 and os.day_of_week='SAT' then
        insert into public.training_plan_components(
          plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        ) values
          (ns,1,'work','continuous',12,'mi',null,null,480,null,null,null,null,null,false),
          (ns,2,'work','continuous',4,'mi',null,null,390,405,null,null,null,null,false);
      elsif ow.week_number=12 and os.day_of_week='SAT' then
        insert into public.training_plan_components(
          plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        ) values
          (ns,1,'work','continuous',10,'mi',null,null,480,null,null,null,null,null,false),
          (ns,2,'work','continuous',6,'mi',null,null,390,405,null,null,null,null,false);
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

  if (select count(*) from public.training_plan_weeks where version_id=new_v)<>15 then raise exception 'RPD v9 incomplete weeks'; end if;
  if (select count(*) from public.training_plan_sessions where version_id=new_v)
     <> (select count(*) from public.training_plan_sessions where version_id=live.plan_version_id) then raise exception 'RPD v9 incomplete sessions'; end if;
  if exists(select 1 from public.training_plan_sessions where version_id=new_v and asks_rung_value=12) then raise exception 'RPD v9 still has 12-mile ask'; end if;
  if exists(select 1 from public.plan_assignments where plan_version_id=new_v) then raise exception 'RPD v9 must not migrate athletes automatically'; end if;

  update public.plan_publications set revoked_at=now() where id=live.id;
  insert into public.plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by,effective_on)
  values(p_id,new_v,live.slug,live.starts_on,live.race_on,live.race_name,now(),live.published_by,live.effective_on);
end $$;
