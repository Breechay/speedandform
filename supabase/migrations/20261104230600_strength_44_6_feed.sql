-- FORM 44.6 Strength is a read projection, not a new progression or receipt owner.
-- Only an authorized athlete or their coach can inspect this result.
-- The current workout remains the first unfiled authored day, even when its date has passed.

create or replace function public.athlete_strength_feed(p_athlete_id uuid)
returns jsonb
language sql stable security definer
set search_path = public, pg_temp as $$
with
authorized as (
  select a.id, a.first_name from public.athletes a
   where a.id = p_athlete_id and public.can_read_athlete(a.id)
),
current_program as (
  select d.forge_program_id
    from public.form_training_strength_days d join authorized a on a.id=d.athlete_id
   where d.cleared_at is null
   order by d.authored_at desc, d.scheduled_on desc, d.id desc
   limit 1
),
preference as (
  select coalesce(p.weight_unit,'lb') as weight_unit
    from authorized a
    left join public.athlete_strength_preferences p on p.athlete_id=a.id
),
authored as (
  select d.id,d.athlete_id,d.forge_program_id,d.scheduled_on,
         d.session_key,d.title,d.exercises,
         (regexp_match(d.session_key,'^w([0-9]+)d([0-9]+)$'))[1]::int as week_number,
         (regexp_match(d.session_key,'^w([0-9]+)d([0-9]+)$'))[2]::int as day_index
    from public.form_training_strength_days d
    join authorized a on a.id=d.athlete_id
    join current_program p on p.forge_program_id=d.forge_program_id
   where d.cleared_at is null
),
positioned as (
  select d.*,r.receipt_id,r.completed_at
    from authored d
    left join lateral (
      select r.receipt_id,r.completed_at
        from public.forge_strength_receipts r
       where r.athlete_id=d.athlete_id
         and r.program_id=d.forge_program_id
         and r.plan_week_number=d.week_number
         and r.plan_day_index=d.day_index
         and r.completed_at is not null
       order by r.completed_at desc,r.receipt_id desc
       limit 1
    ) r on true
),
next_authored as (
  select * from positioned where receipt_id is null
   order by scheduled_on,session_key,id limit 1
),
last_receipt as (
  select max(r.completed_at) as completed_at
    from public.forge_strength_receipts r
    join authorized a on a.id=r.athlete_id
    join current_program p on p.forge_program_id=r.program_id
   where r.completed_at is not null
),
week_groups as (
  select week_number, min(scheduled_on) as first_day,
         count(*)::int as planned_count,
         count(receipt_id)::int as filed_count
    from positioned
   where week_number is not null
   group by week_number
),
weeks as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id','week-'||w.week_number,
    'date',w.first_day,
    'scheme','WEEK '||lpad(w.week_number::text,2,'0'),
    'completedSessions',w.filed_count,
    'plannedSessions',w.planned_count,
    'position',case when w.filed_count=w.planned_count then 'completed'
                    when w.week_number=(select min(week_number) from week_groups
                                        where filed_count<planned_count) then 'current'
                    else 'ahead' end
  ) order by w.week_number),'[]'::jsonb) as value from week_groups w
),
lifts as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',coalesce(nullif(e.elem->>'movement_id',''),nullif(e.elem->>'name',''),'movement-'||e.ordinality),
    'name',coalesce(e.elem->>'name',''),
    'lastLoad',(
      select round(case when (select weight_unit from preference)='kg'
                        then (s.elem->>'weight')::numeric/2.2046226218
                        else (s.elem->>'weight')::numeric end)::integer
        from public.forge_strength_receipts r
        cross join lateral jsonb_array_elements(
          case when jsonb_typeof(r.native_payload->'sets')='array'
               then r.native_payload->'sets' else '[]'::jsonb end
        ) as s(elem)
       where r.athlete_id=p.athlete_id
         and r.program_id=p.forge_program_id
         and r.completed_at is not null
         and (s.elem->>'movementId')=e.elem->>'movement_id'
         and s.elem->>'weight' ~ '^[0-9]+([.][0-9]+)?$'
       order by r.completed_at desc,(s.elem->>'setIndex')::integer desc
       limit 1
    ),
    'scheme',case when e.elem ? 'sets' and e.elem ? 'reps'
               then e.elem->>'sets'||' × '||e.elem->>'reps' else null end
  ) order by e.ordinality),'[]'::jsonb) as value
  from next_authored p
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(p.exercises)='array' then p.exercises else '[]'::jsonb end
  ) with ordinality e(elem,ordinality)
)
select jsonb_build_object(
  'athleteId',a.id,
  'athleteName',coalesce(a.first_name,'Athlete'),
  'hasProgram',exists(select 1 from authored),
  'programId',(select forge_program_id from current_program),
  'unit',(select weight_unit from preference),
  'filedSessions',(select count(*) from positioned where receipt_id is not null),
  'plannedSessions',(select count(*) from authored),
  'nextDate',(select scheduled_on from next_authored),
  'nextTitle',(select title from next_authored),
  'canResume',false,
  'lastCompletedAt',(select completed_at from last_receipt),
  'weeks',(select value from weeks),
  'lifts',(select value from lifts)
) from authorized a;
$$;

revoke all on function public.athlete_strength_feed(uuid) from public,anon;
grant execute on function public.athlete_strength_feed(uuid) to authenticated;

comment on function public.athlete_strength_feed(uuid) is
  'Read-only 44.6 Strength position. Uses authored strength days and matched canonical receipts; Never advances from calendar date or creates marks. Authorization verified for athlete and coach.';
