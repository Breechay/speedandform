-- READ-ONLY. Exports the CURRENT version of each of Adrian's sessions for the live preflight.
-- Run against the FORM Athlete System and save the result as JSON, e.g. in the SQL editor:
--   "Export" -> JSON, or wrap as: select coalesce(jsonb_agg(t order by scheduled_on), '[]') from ( ...this query... ) t;
-- Then:  node scripts/preflight-structured-strength.mjs adrian-live-versions.json
select ps.scheduled_on,
       ps.day_label,
       v.id            as version_id,
       v.version_number,
       v.title,
       v.shape,
       v.details
  from public.athletes a
  join public.planned_sessions ps on ps.athlete_id = a.id
  join lateral (
    select v2.* from public.planned_session_versions v2
     where v2.planned_session_id = ps.id
     order by v2.version_number desc limit 1) v on true
 where a.slug = 'adrian' and ps.state = 'published' and ps.scheduled_on is not null
 order by ps.scheduled_on;
