-- Show coach-led FORM strength clients in Brice's authenticated Coach Board.
-- The Coach Board is a coach surface, not an athlete delivery toggle.
-- Preserve delivery='coach' for Devin, Rod, and Marisa. Their lack of running
-- training blocks remains truthful; native UI must offer a dossier/empty state.
-- Still require an active coach membership for every returned athlete.
-- Website-delivered/paused clients (e.g. Natalie) remain excluded.
create or replace function public.coach_preview_roster()
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare payload jsonb;
begin
 if auth.uid() is null then
   raise exception 'A signed-in account is required';
 end if;

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
   and a.active
   and (
      a.delivery='app'
      or (a.delivery='coach' and a.home_surface='form')
   );
 return payload;
end
$function$;

-- Existing grants are retained by CREATE OR REPLACE FUNCTION.
-- Important acceptance:
-- * Signed-in Brice: Devin, Marisa, Rod appear, each has_active_block=false.
-- * Natalie stays out (home_surface='website').
-- * Anonymous denied and athlete-only identities see no unrelated athletes.
-- * No athlete delivery mode, program, training block, or prescription is changed.
