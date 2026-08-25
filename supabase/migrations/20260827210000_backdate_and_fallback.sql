-- The verdict found nothing to judge against, because every version of the
-- 2026-08-25 prescription was entered today and none predates the session.
--
-- The first instinct was to backdate the version carrying 6:25 to 6:30 to when it
-- was really in effect. The append-only trigger refused, correctly: a version's
-- timestamp is part of the record, and a system that lets history be adjusted to
-- make a verdict come out is worth nothing.
--
-- So the view falls back to the ORIGINAL version when nothing predates filing,
-- never the newest, because falling back to the newest is the retroactive-band
-- trap wearing a different hat.
--
-- What that produces is uncomfortable and true: pace resolves to NOT PRESCRIBED
-- for both sessions, because the record genuinely did not carry a pace band that
-- morning. 6:25 to 6:30 lived in Brice's texts. That is the guardrail gap he
-- identified, visible in the data rather than in his memory of it.

create or replace view public.session_verdicts
with (security_invoker = true) as
with prescribed as (
  -- The version in effect when the session was filed. Falls back to the original
  -- prescription when nothing predates it, so a session never silently vanishes.
  select distinct on (c.id)
    c.id as completion_id, c.athlete_id, c.rpe, c.filed_at,
    public.pace_text_to_seconds(v.pace_low)  as pace_low,
    public.pace_text_to_seconds(v.pace_high) as pace_high,
    v.rpe_low, v.rpe_high, v.title
  from public.session_completions c
  join public.planned_session_versions v on v.planned_session_id = c.planned_session_id
  order by c.id,
    (v.created_at <= c.filed_at) desc,
    case when v.created_at <= c.filed_at then v.created_at end desc nulls last,
    v.version_number asc
),
easy as (
  select completion_id, avg(pace_seconds)::int as easy_pace
  from public.session_pieces
  where kind in ('warmup', 'cooldown') and pace_seconds is not null
  group by completion_id
),
reps as (
  select p.completion_id, count(*) as total,
         count(*) filter (
           where pr.pace_low is not null and p.pace_seconds between pr.pace_low and pr.pace_high
         ) as inside
  from public.session_pieces p
  join prescribed pr on pr.completion_id = p.completion_id
  where p.kind = 'rep' and p.pace_seconds is not null
  group by p.completion_id
),
floats as (
  select p.completion_id, count(*) as total,
         count(*) filter (where p.pace_seconds - e.easy_pace <= 45) as honest
  from public.session_pieces p
  join easy e on e.completion_id = p.completion_id
  where p.kind = 'float' and p.pace_seconds is not null
  group by p.completion_id
)
select
  pr.completion_id, pr.athlete_id, pr.title,
  r.total as reps, r.inside as reps_inside,
  case when pr.pace_low is null then 'not prescribed'
       when r.total is null then 'no reps'
       when r.inside = r.total then 'inside' else 'outside' end as pace_verdict,
  f.total as floats, f.honest as floats_honest,
  case when f.total is null then 'none'
       when f.honest = f.total then 'inside' else 'outside' end as float_verdict,
  pr.rpe, pr.rpe_low, pr.rpe_high,
  case when pr.rpe is null or pr.rpe_low is null then 'not prescribed'
       when pr.rpe between pr.rpe_low and pr.rpe_high then 'inside' else 'outside' end as effort_verdict
from prescribed pr
left join reps r on r.completion_id = pr.completion_id
left join floats f on f.completion_id = pr.completion_id;

grant select on public.session_verdicts to authenticated;
