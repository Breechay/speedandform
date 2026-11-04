-- Publication gate shared by the Coach Console and any agent using the
-- canonical version writer. Only objectively invalid typed values are blocked;
-- this does not make coaching judgments or rewrite established sessions.
alter table public.planned_session_versions
  add constraint form_version_rpe_order
  check (rpe_low is null or rpe_high is null or rpe_low <= rpe_high) not valid;
alter table public.planned_session_versions
  add constraint form_version_positive_distance
  check (prescribed_distance is null or prescribed_distance > 0) not valid;
alter table public.planned_session_versions
  add constraint form_version_positive_duration
  check (prescribed_duration_minutes is null or prescribed_duration_minutes > 0) not valid;

alter table public.planned_session_components
  add constraint form_component_rpe_order
  check (rpe_low is null or rpe_high is null or rpe_low <= rpe_high) not valid;
alter table public.planned_session_components
  add constraint form_component_positive_duration
  check (duration_seconds is null or duration_seconds > 0) not valid;

-- All five predicates were checked against the existing production corpus
-- before this migration; validate the history as well as future writes.
alter table public.planned_session_versions validate constraint form_version_rpe_order;
alter table public.planned_session_versions validate constraint form_version_positive_distance;
alter table public.planned_session_versions validate constraint form_version_positive_duration;
alter table public.planned_session_components validate constraint form_component_rpe_order;
alter table public.planned_session_components validate constraint form_component_positive_duration;

comment on constraint form_version_rpe_order on public.planned_session_versions is
 'Future sessions cannot prescribe a reversed RPE range.';
comment on constraint form_version_positive_duration on public.planned_session_versions is
 'A duration explicitly prescribed in minutes must be positive; a distance-based session may leave it null.';
