-- Read-only linkage audit. Execute in an authorized private SQL workspace.
-- No personal records or query outputs belong in this repository.
-- Review findings individually; absence of an optional feature isn't failure.

-- 1. Week story freshness in the current US/Eastern coaching week.
select a.id athlete_id, a.slug, w.id week_id, w.starts_on, w.ends_on,
  (w.intent is not null and w.matters_because is not null) story_present,
  coach_audit_private.week_story_is_current(w.id) story_current
from public.training_weeks w
join public.athletes a on a.id=w.athlete_id
where w.starts_on <= (now() at time zone 'America/New_York')::date
  and w.ends_on >= (now() at time zone 'America/New_York')::date
order by a.slug, w.updated_at desc;

-- 2. Only one active weekly focus per athlete and current action week.
-- An absent Halo can mean the feature wasn't authored or enabled.
select r.athlete_id, m.action_date,
  count(*) filter (where m.archived_at is null) active_focus_count,
  count(*) filter (where m.archived_at is not null) archived_count,
  count(*) filter (where r.first_opened_at is not null) already_opened_count
from public.form_ghost_messages m
join public.form_ghost_recipients r on r.message_id=m.id
where m.template_kind='weekly_focus'
group by r.athlete_id, m.action_date
having count(*) filter (where m.archived_at is null)>1;

-- 3. Speed entries must connect to exactly their own athlete's source;
-- version drift is a review item, not permission to rewrite history.
select b.athlete_id, b.identity_key, s.planned_session_id,
  s.planned_session_version_id, latest.id latest_version_id,
  (s.athlete_id <> ps.athlete_id) wrong_athlete,
  (s.planned_session_version_id is distinct from latest.id) version_drift
from public.athlete_speed_record_versions s
join public.athlete_speed_record_benchmarks b on b.id=s.benchmark_id
join public.planned_sessions ps on ps.id=s.planned_session_id
left join lateral (
  select v.id from public.planned_session_versions v
  where v.planned_session_id=ps.id
  order by v.version_number desc limit 1
) latest on true
where s.athlete_id <> ps.athlete_id
  or s.planned_session_version_id is distinct from latest.id;

-- 4. Evaluation axes derive from the same athlete's filed evidence.
-- Audit link completeness here; run form_athlete_evaluation under a genuine
-- athlete/coach authenticated session to verify actually earned movement.
select a.id athlete_id, a.slug,
  (select count(*) from public.athlete_evaluation_revisions r
    where r.athlete_id=a.id) evaluation_revisions,
  (select count(*) from public.athlete_speed_record_versions s
    where s.athlete_id=a.id) speed_links
from public.athletes a
where exists (select 1 from public.training_weeks w where w.athlete_id=a.id)
order by a.slug;
