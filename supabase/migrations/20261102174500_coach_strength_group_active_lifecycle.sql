-- The approved Glute Priority activation sets member rows to active, then
-- promotes their group. The original group lifecycle allowed draft/ready/
-- retired but not active, so the final write was rejected even after the
-- member status updates succeeded. Extend only this enum-like check; do not
-- weaken any coach-membership RLS policies or rewrite any group data.
alter table public.coach_strength_groups
  drop constraint coach_strength_groups_status_check;
alter table public.coach_strength_groups
  add constraint coach_strength_groups_status_check
  check (status = any (array['draft'::text,'ready'::text,'active'::text,'retired'::text]));
