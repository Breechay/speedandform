-- The float verdict is computed against the athlete's own easy pace, but that
-- number was never exposed, so a page could show the verdict and not the line it
-- was judged against. Hope's floats read as evidence only next to her 8:48; on
-- their own, 10:01 looks like a slow mile rather than a stopped one.
--
-- No other change. The whole definition is carried forward because a view cannot
-- gain a column any other way, and it may only gain one at the end of the list.

create or replace function public.pace_text_to_seconds(t text)
returns integer language sql immutable as $$
  select case when t is null or position(':' in t) = 0 then null
    else split_part(t, ':', 1)::int * 60 + split_part(t, ':', 2)::int end;
$$;

create or replace view public.session_verdicts
with (security_invoker = true) as
with prescribed as (
  -- The version that was current when the session was filed, not the newest.
  select distinct on (c.id)
    c.id as completion_id, c.athlete_id, c.rpe, c.filed_at,
    public.pace_text_to_seconds(v.pace_low)  as pace_low,
    public.pace_text_to_seconds(v.pace_high) as pace_high,
    v.rpe_low, v.rpe_high, v.title
  from public.session_completions c
  join public.planned_session_versions v on v.planned_session_id = c.planned_session_id
  where v.created_at <= c.filed_at
  order by c.id, v.created_at desc
),
easy as (
  select completion_id, avg(pace_seconds)::int as easy_pace
  from public.session_pieces
  where kind in ('warmup', 'cooldown') and pace_seconds is not null
  group by completion_id
),
reps as (
  select p.completion_id,
         count(*) as total,
         count(*) filter (
           where pr.pace_low is not null
             and p.pace_seconds between pr.pace_low and pr.pace_high
         ) as inside
  from public.session_pieces p
  join prescribed pr on pr.completion_id = p.completion_id
  where p.kind = 'rep' and p.pace_seconds is not null
  group by p.completion_id
),
floats as (
  select p.completion_id,
         count(*) as total,
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
       when pr.rpe between pr.rpe_low and pr.rpe_high then 'inside' else 'outside' end as effort_verdict,
  e.easy_pace
from prescribed pr
left join easy e on e.completion_id = pr.completion_id
left join reps r on r.completion_id = pr.completion_id
left join floats f on f.completion_id = pr.completion_id;

grant select on public.session_verdicts to authenticated;
