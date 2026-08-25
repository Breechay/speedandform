-- "Filed" is paperwork language. She ran; she did not file. The queue said
-- "Filed and unanswered", which also names the system's action rather than the
-- state Brice is looking at.

create or replace view public.coach_attention
with (security_invoker = true) as

select
  c.athlete_id,
  'recovery_flag'::text  as kind,
  10                     as priority,
  'Recovery did not settle'::text as title,
  ('The next day was not normal after ' ||
    coalesce(to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), c.status)
  )::text                as summary,
  c.id                   as subject_id,
  'completion'::text     as subject_kind,
  c.filed_at             as occurred_at
from public.session_completions c
where c.recovered_next_day is false

union all

select
  t.athlete_id, 'authored', 15, t.title, t.summary, t.id, 'task', t.created_at
from public.coach_tasks t
where t.resolved_at is null
  and t.state in ('needs_you', 'ready_to_publish', 'plan_changed')

union all

select
  c.athlete_id, 'unread_session', 20,
  'Waiting on your reply',
  (initcap(c.status) ||
    coalesce(' · ' || to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), '')
  )::text,
  c.id, 'completion', c.filed_at
from public.session_completions c
where c.recovered_next_day is distinct from false
  and not exists (
    select 1
    from public.read_completions rc
    join public.reads r on r.id = rc.read_id
    where rc.completion_id = c.id
      and r.delivery_state in ('published', 'delivered_externally')
  )

union all

select
  p.athlete_id, 'missing_direction', 30,
  'No instructions yet',
  (p.day_label || ' is due without instructions')::text,
  p.id, 'planned_session',
  (p.scheduled_on::timestamptz)
from public.planned_sessions p
where p.state = 'published'
  and p.scheduled_on is not null
  and p.scheduled_on <= current_date + 2
  and not exists (select 1 from public.session_completions c where c.planned_session_id = p.id)
  and not exists (
    select 1 from public.directions d
    where d.planned_session_id = p.id
      and d.delivery_state in ('published', 'delivered_externally')
  )

union all

select
  w.athlete_id, 'week_unclosed', 40,
  'Week ' || w.week_number || ' is still open',
  coalesce(w.intent, ''),
  w.id, 'week',
  (w.ends_on::timestamptz)
from public.training_weeks w
where w.state = 'in_progress'
  and w.ends_on is not null
  and w.ends_on < current_date;

grant select on public.coach_attention to authenticated;
