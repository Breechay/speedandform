
begin;
create or replace function public.coach_preview_roster()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare payload jsonb;
begin
 if auth.uid() is null then raise exception 'A signed-in account is required'; end if;
 select coalesce(jsonb_agg(
   jsonb_build_object(
     'athlete_id',a.id,'slug',a.slug,'display_name',a.display_name,
     'target_event',a.target_event,
     'portrait_path',coalesce(p.avatar_path,a.portrait_path),
     'has_active_block',exists(select 1 from public.training_blocks b where b.athlete_id=a.id and b.status='active'),
     'audit_level',coalesce(attention.audit_level,'clear'),
     'audit_count',coalesce(attention.audit_count,0),
     'audit_reviewed_as_of',attention.reviewed_as_of
   )
   order by case when placement.position is null then 1 else 0 end,
            placement.position nulls last,coalesce(a.attention_position,32767),a.display_name
 ),'[]'::jsonb)
 into payload
 from public.athlete_memberships m
 join public.athletes a on a.id=m.athlete_id
 left join public.collective_people p on p.athlete_id=a.id
 left join public.coach_roster_positions placement
   on placement.coach_user_id=auth.uid() and placement.athlete_id=a.id
 left join lateral (
   select count(*)::int audit_count,
     case when bool_or(f.severity='URGENT') then 'urgent'
          when bool_or(f.severity='REVIEW') then 'review'
          when bool_or(f.severity='EVIDENCE') then 'evidence'
          else 'clear' end audit_level,
     (select r.reviewed_as_of from coach_audit_private.plan_audit_runs r 
      order by r.executed_at desc,r.id desc limit 1) reviewed_as_of
   from coach_audit_private.plan_audit_findings f
   where f.run_id=(select r.id from coach_audit_private.plan_audit_runs r 
                    order by r.executed_at desc,r.id desc limit 1) and f.athlete_id=a.id
 ) attention on true
 where m.user_id=auth.uid() and m.role='coach' and m.status='active'
   and a.active and a.delivery='app';
 return payload;
end
$$;
revoke all on function public.coach_preview_roster() from public,anon;
grant execute on function public.coach_preview_roster() to authenticated;
create or replace function public.coach_private_audit_findings(p_athlete_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare payload jsonb;
begin
 if auth.uid() is null or not exists(
   select 1 from public.athlete_memberships m
   where m.user_id=auth.uid() and m.athlete_id=p_athlete_id
     and m.role='coach' and m.status='active'
 ) then raise exception 'Coach access required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
    'severity',f.severity,'code',f.code,'detail',f.detail,
    'event_on',f.event_on,'reviewed_as_of',r.reviewed_as_of
  ) order by case f.severity when 'URGENT' then 1 when 'REVIEW' then 2 else 3 end,f.event_on),'[]'::jsonb)
 into payload
 from coach_audit_private.plan_audit_findings f
 join coach_audit_private.plan_audit_runs r on r.id=f.run_id
 where r.id=(select id from coach_audit_private.plan_audit_runs order by executed_at desc,id desc limit 1)
   and f.athlete_id=p_athlete_id;
 return payload;
end
$$;
revoke all on function public.coach_private_audit_findings(uuid) from public,anon;
grant execute on function public.coach_private_audit_findings(uuid) to authenticated;
commit;