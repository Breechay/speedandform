-- Reference-only marks supplied in the Nov 4 Speed Nine intake.
-- These populate hollow stations and never masquerade as filed Held evidence.
-- The effort date is unknown; measured_at is the screenshot capture date and
-- the source/metadata preserve that limitation.

with supplied(slug,measurement_type,value) as (values
  ('anthony','reported_best_1k_seconds',215::numeric),
  ('anthony','reported_best_mile_seconds',350::numeric),
  ('adrian','reported_best_5k_seconds',1004::numeric),
  ('adrian','reported_best_10k_seconds',2107::numeric),
  ('adrian','reported_best_half_seconds',4614::numeric),
  ('adrian','reported_best_marathon_seconds',10335::numeric),
  ('brice','reported_best_mile_seconds',309::numeric),
  ('saul','reported_best_1k_seconds',215::numeric),
  ('megan-bolan','reported_best_1k_seconds',236::numeric),
  ('elijah','reported_best_1k_seconds',167::numeric)
), author as (
  select user_id from public.coaching_administrators
   where status='active' order by created_at limit 1
)
insert into public.athlete_measurements
  (athlete_id,measurement_type,value,unit,measured_at,method,source,metadata,authored_by)
select a.id,s.measurement_type,s.value,'s',date '2026-11-04',
       'Personal best shown in supplied athlete screenshot',
       'coach_supplied_strava_screenshot_20261104',
       jsonb_build_object('effort_date_known',false,'display_role','reference_only'),
       author.user_id
from supplied s
join public.athletes a on a.slug=s.slug
cross join author
on conflict (athlete_id,measurement_type,measured_at,value,unit) do nothing;
