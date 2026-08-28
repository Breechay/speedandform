-- Three comparable 6s inside six weeks mean the paces have gone stale.
--
-- A 6 on a session designed to cost 7 to 8 is excellent evidence: the work was
-- achieved with headroom. It is not an instruction. One 6 changes nothing, because
-- a single good day is a single good day and accelerating a plan on one is how
-- athletes get hurt.
--
-- The progression is deliberately slow:
--   first comparable 6   OUTSTANDING · HEADROOM
--   second               HEADROOM REPEATED
--   third within 6 weeks PACE MAY BE STALE · REVIEW PRESCRIPTION
--
-- Comparable means: at least the authored target dose, on an equivalent quality
-- family, with no symptom exception. A 6 achieved by doing three of six reps is not
-- headroom, it is a shorter session, and counting it would turn the signal into an
-- argument for making work easier.
--
-- The Console recommends a review. It never moves a pace. That distinction is the
-- whole reason this is a signal and not a rule.
create or replace function public.rpe_headroom_signal(p_athlete_id uuid, p_as_of date default current_date)
returns table (
  qualifying_sixes integer,
  most_recent date,
  signal text
)
language sql
stable
security invoker
as $$
with comparable as (
  select ps.scheduled_on as on_date
    from public.session_completions c
    join public.planned_sessions ps on ps.id = c.planned_session_id
    join lateral (
      select pv.id from public.planned_session_versions pv
       where pv.planned_session_id = ps.id order by pv.version_number desc limit 1) v on true
    join lateral (
      select * from public.planned_session_components k
       where k.version_id = v.id and k.role = 'work' order by k.position limit 1) k on true
   where c.athlete_id = p_athlete_id
     and c.status = 'completed'
     and c.rpe = 6
     -- Designed as quality work: it asked for an effort, and 6 sits under it.
     and k.rpe_high is not null and k.rpe_high >= 7
     -- At least the authored dose. A 6 off a short session is not headroom.
     and k.repeat_target is not null
     and (select count(*) from public.session_pieces sp
           where sp.completion_id = c.id and sp.kind = 'rep') >= k.repeat_target
     -- No symptom exception. A quiet session because something hurt is not evidence
     -- that the paces are soft.
     and coalesce(btrim(c.knee_during), '') = ''
     and coalesce(btrim(c.knee_after), '') = ''
     and ps.scheduled_on > (p_as_of - interval '6 weeks')
     and ps.scheduled_on <= p_as_of
)
select count(*)::integer,
       max(on_date),
       case count(*)
         when 0 then null
         when 1 then 'OUTSTANDING · HEADROOM'
         when 2 then 'HEADROOM REPEATED'
         else 'PACE MAY BE STALE · REVIEW PRESCRIPTION'
       end
  from comparable;
$$;

comment on function public.rpe_headroom_signal(uuid, date) is
  'How many comparable RPE 6 sessions sit inside the last six weeks, and what that means. A recommendation to review a prescription, never a pace change: nothing in FORM moves a pace without Brice.';
