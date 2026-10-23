-- THE FIVE · future track workouts: versioned athlete-facing Week previews.
-- Preserves all previously published versions and their structured components.
with previews as (
  select (item->>'week')::integer as week_number, item->>'preview' as preview
  from jsonb_array_elements('[{"week":3,"preview":"8 × 200m controlled · 90 sec walk/jog"},{"week":4,"preview":"2 × 10 min steady · 3 min easy jog"},{"week":5,"preview":"5 × 400m smooth · 2 min walk/jog"},{"week":6,"preview":"2 × 12 min steady · 3 min easy jog"},{"week":7,"preview":"6 × 600m controlled · 2:30 easy jog"},{"week":8,"preview":"2 × 15 min steady · 3 min easy jog"},{"week":9,"preview":"4 × 800m controlled · 3 min easy jog"},{"week":10,"preview":"25 min steady, even effort"},{"week":11,"preview":"4 × 1000m strong and smooth · 3 min easy jog"},{"week":12,"preview":"20 min steady · 3 min easy jog · 8 min steady"},{"week":13,"preview":"3 × 1200m controlled · 3 min easy jog"},{"week":14,"preview":"20 min steady · 3 min easy jog · 12 min steady"},{"week":15,"preview":"20 min easy + 4 × 15 sec relaxed strides · 60 sec walk"}]'::jsonb) item
),
current_sessions as (
  select a.slug,ps.id session_id,ps.athlete_id,w.week_number,
         v.id old_version_id,v.version_number,v.title,v.prescribed_distance,
         v.distance_unit,v.prescribed_duration_minutes,v.intent,v.details,
         v.authored_by,v.rpe_low,v.rpe_high,v.pace_low,v.pace_high,v.shape,v.coach_note,
         case when a.slug='kevin' and w.week_number=14
              then '25 min easy + 4 × 15s relaxed strides · walk between'
              else pr.preview end as preview
  from public.planned_sessions ps
  join public.athletes a on a.id=ps.athlete_id
  join public.training_weeks w on w.id=ps.week_id
  join public.training_blocks b on b.id=w.block_id
  join lateral (
    select * from public.planned_session_versions z
    where z.planned_session_id=ps.id
    order by z.version_number desc limit 1
  ) v on true
  join previews pr on pr.week_number=w.week_number
  where b.status='active' and b.starts_on='2026-10-19'
    and a.slug in ('brice','david','sam-reyes','tinius','kevin')
    and w.week_number between 3 and 15
    and ps.state='published' and extract(dow from ps.scheduled_on)=4
    and v.details not like 'Week: %'
),
inserted_versions as (
  insert into public.planned_session_versions (
    athlete_id,planned_session_id,version_number,title,
    prescribed_distance,distance_unit,prescribed_duration_minutes,
    intent,details,change_reason,authored_by,
    rpe_low,rpe_high,pace_low,pace_high,shape,coach_note
  )
  select athlete_id,session_id,version_number+1,title,
         prescribed_distance,distance_unit,prescribed_duration_minutes,
         intent,'Week: '||preview||E'\n'||details,
         'Add complete track prescription to collapsed Week view; no training change',
         authored_by,rpe_low,rpe_high,pace_low,pace_high,shape,coach_note
  from current_sessions
  returning id,planned_session_id
),
copied_components as (
  insert into public.planned_session_components (
    athlete_id,version_id,position,role,shape,repeat_count,
    distance,distance_unit,duration_seconds,recovery_seconds,recovery_kind,
    pace_low,pace_high,rpe_low,rpe_high,repeat_minimum,repeat_target,
    repeat_progression,repeat_ceiling,rpe_source,rpe_default_version,
    pace_low_seconds,pace_high_seconds,counts_toward_mark_id
  )
  select c.athlete_id, nv.id, c.position,c.role,c.shape,c.repeat_count,
         c.distance,c.distance_unit,c.duration_seconds,c.recovery_seconds,c.recovery_kind,
         c.pace_low,c.pace_high,c.rpe_low,c.rpe_high,c.repeat_minimum,c.repeat_target,
         c.repeat_progression,c.repeat_ceiling,c.rpe_source,c.rpe_default_version,
         c.pace_low_seconds,c.pace_high_seconds,c.counts_toward_mark_id
  from inserted_versions nv
  join current_sessions cs on cs.session_id=nv.planned_session_id
  join public.planned_session_components c on c.version_id=cs.old_version_id
  returning id
)
select (select count(*) from inserted_versions) as new_versions,
       (select count(*) from copied_components) as components_copied;
