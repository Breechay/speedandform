-- Run only as the authorized study publisher, never from a browser or app.
-- The single public row contains an allowlisted projection of Brice's FORM record.
-- No athlete IDs, session IDs, raw watch data, freeform athlete notes or private contact data.
-- A plan or receipt is not a medical clearance or a readiness claim.
with bounds as (
 select (now() at time zone 'America/New_York')::date as today,
 date_trunc('week',now() at time zone 'America/New_York')::date as monday
), subject as (
 select id from public.athletes where slug='brice' and active
), block_data as (
 select coalesce(jsonb_agg(jsonb_build_object('name',b.name,'state',b.status,'start',b.starts_on,'end',b.ends_on,'race_on',b.race_on,'goal',b.goal_statement) order by b.starts_on),'[]'::jsonb) as value
 from public.training_blocks b join subject a on a.id=b.athlete_id where b.status in ('active','scheduled')
), run_plan as (
 select coalesce(pl.effective_date,p.scheduled_on) as day,p.position,v.title,v.prescribed_distance as distance,v.distance_unit as unit,v.prescribed_duration_minutes as duration_minutes
 from public.planned_sessions p join subject a on a.id=p.athlete_id
 left join public.athlete_session_placements pl on pl.planned_session_id=p.id
 join lateral (select * from public.planned_session_versions v where v.planned_session_id=p.id order by v.version_number desc limit 1) v on true
 cross join bounds
 where p.state in ('published','completed','changed') and p.withdrawn_at is null and coalesce(pl.effective_date,p.scheduled_on) between monday and monday+13
), strength_plan as (
 select d.scheduled_on as day,d.title,d.forge_program_id as program,d.exercises
 from public.form_training_strength_days d join subject a on a.id=d.athlete_id cross join bounds
 where d.cleared_at is null and d.scheduled_on between monday and monday+13
), days as (
 select monday+i as day from bounds cross join generate_series(0,13) i
), week_data as (
 select jsonb_agg(jsonb_build_object('date',day,'running',coalesce((select jsonb_agg(jsonb_build_object('title',r.title,'distance',r.distance,'unit',r.unit,'duration_minutes',r.duration_minutes) order by r.position) from run_plan r where r.day=days.day),'[]'::jsonb),'strength',coalesce((select jsonb_agg(jsonb_build_object('title',s.title,'program',s.program) order by s.title) from strength_plan s where s.day=days.day),'[]'::jsonb)) order by day) as value from days
), unique_strength as (
 select distinct on (title,program) title,program,exercises from strength_plan order by title,program,day desc
), template_data as (
 select coalesce(jsonb_agg(jsonb_build_object('title',s.title,'program',s.program,'exercises',coalesce((select jsonb_agg(jsonb_build_object('name',x.e->>'name','sets',x.e->'sets','reps',x.e->'reps','per_side',x.e->>'laterality'='perSide') order by x.n) from jsonb_array_elements(case when jsonb_typeof(s.exercises)='array' then s.exercises else '[]'::jsonb end) with ordinality x(e,n)),'[]'::jsonb)) order by title),'[]'::jsonb) as value from unique_strength s
), run_evidence as (
 select c.run_on as day, coalesce(v.title,'Running activity') as title,case when c.actual_distance>0 then 'run' else 'aerobic' end as kind,
 jsonb_build_object('date',c.run_on,'kind',case when c.actual_distance>0 then 'run' else 'aerobic' end,'title',coalesce(v.title,'Running activity'),'distance',c.actual_distance,'unit',case when c.actual_distance>0 then c.distance_unit end,'seconds',c.duration_seconds,'avg_hr',c.avg_heart_rate,'max_hr',c.max_heart_rate,'rpe',c.rpe,'mechanics',case when m.completion_id is not null then jsonb_build_object('cadence',m.cadence_spm,'contact_ms',m.ground_contact_ms,'step_m',m.step_length_m,'vertical_ratio',m.vertical_ratio_pct,'power_w',m.power_w) end) as entry
 from public.session_completions c join subject a on a.id=c.athlete_id left join public.planned_session_versions v on v.id=c.planned_session_version_id left join public.run_mechanics m on m.completion_id=c.id cross join bounds
 where c.run_on between today-27 and today and c.status in ('completed','changed') and (c.actual_distance>0 or (v.title ilike '%elliptical%' and c.duration_seconds>0))
), strength_evidence as (
 select (r.completed_at at time zone 'America/New_York')::date as day,r.session_name as title,'strength' as kind,jsonb_build_object('date',(r.completed_at at time zone 'America/New_York')::date,'kind','strength','title',r.session_name,'sets',r.set_count,'matched_date',d.scheduled_on,'evidence','set receipt') as entry
 from public.forge_strength_receipts r join subject a on a.id=r.athlete_id left join public.form_strength_receipt_fits f on f.receipt_id=r.receipt_id and f.athlete_id=r.athlete_id left join public.form_training_strength_days d on d.id=f.day_id cross join bounds
 where (r.completed_at at time zone 'America/New_York')::date between today-27 and today
 union all
 select c.performed_on,c.session_title,'strength',jsonb_build_object('date',c.performed_on,'kind','strength','title',c.session_title,'seconds',c.duration_seconds,'evidence','duration only')
 from public.coach_strength_duration_completions c join subject a on a.id=c.athlete_id cross join bounds where c.superseded_by_strength_receipt_id is null and c.performed_on between today-27 and today
), evidence_data as (
 select coalesce(jsonb_agg(entry order by day desc,kind,title),'[]'::jsonb) as value from (select * from run_evidence union all select * from strength_evidence) e
)
insert into public.rebuilt_athlete_public_snapshot(singleton,schema_version,checked_at,through_date,published,payload)
select true,1,now(),today,true,jsonb_build_object('blocks',b.value,'weeks',w.value,'strength_templates',t.value,'recent_evidence',e.value,'pace_exposure',coalesce((select payload->'pace_exposure' from public.rebuilt_athlete_public_snapshot where singleton),'{}'::jsonb))
from bounds cross join block_data b cross join week_data w cross join template_data t cross join evidence_data e
where exists(select 1 from subject) and jsonb_array_length(b.value)>0
on conflict (singleton) do update set checked_at=excluded.checked_at,through_date=excluded.through_date,payload=excluded.payload
returning through_date,checked_at,jsonb_array_length(payload->'weeks') as days,jsonb_array_length(payload->'recent_evidence') as records;
