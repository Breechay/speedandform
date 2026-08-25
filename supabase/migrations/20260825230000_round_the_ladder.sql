-- Brice: 8 instead of 7.5, 10 instead of 9, 12 instead of 10.5.
-- Ladder becomes 3 · 5 · 6 · 8 · 10 · 12 · 13.1.
--
-- The Tuesday long runs are what reach these marks, so weeks 5-7 move with them.
-- Sessions are append-only, so each change is a new version rather than an edit.

update public.mark_checkpoints c
   set value = v.new_value, label = v.new_label
  from (values (7.5, 8.0, '8'), (9.0, 10.0, '10'), (10.5, 12.0, '12')) as v(old_value, new_value, new_label)
 where c.value = v.old_value
   and c.athlete_id = (select id from public.athletes where slug = 'natalie');

insert into public.planned_session_versions
  (athlete_id, planned_session_id, version_number, title, intent, prescribed_distance, distance_unit)
select v.athlete_id, v.planned_session_id, v.version_number + 1, v.title, v.intent,
       case v.prescribed_distance when 7.5 then 8.0 when 9.0 then 10.0 when 10.5 then 12.0 end,
       v.distance_unit
from public.planned_session_versions v
join public.planned_sessions p on p.id = v.planned_session_id
where v.athlete_id = (select id from public.athletes where slug = 'natalie')
  and p.day_label = 'TUE'
  and v.prescribed_distance in (7.5, 9.0, 10.5)
  and v.version_number = (
    select max(v2.version_number) from public.planned_session_versions v2
    where v2.planned_session_id = v.planned_session_id
  );
