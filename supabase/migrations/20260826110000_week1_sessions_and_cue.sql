-- Brice's edits to week 1, and one cue rewrite.
--
-- Sessions are append-only, so every change is a new version. Week 1 only —
-- weeks 2-8 keep the progression as authored.
--
--   TUE  4 -> 5 mi. "Walk when you want to" removed. The heel cue moves here
--        from Sunday, where it was doing nothing for a speed session.
--   THU  "Support + stairs" -> "Easy + stairs", with the stair duration stated.
--        Duration lives in the instruction because a session carries a distance,
--        not a clock; adding a duration column is a schema decision, not a copy fix.
--   SUN  Instruction reduced to what the session is.
--
-- Cue: "Shoulders back without lifting the ribs" -> "Shoulders down and back."
-- The caveat existed because "shoulders back" alone produces rib flare. "Down"
-- does that work in one word, so the caveat is no longer carrying anything.

do $$
declare
  a_id uuid;
  s record;
begin
  select id into a_id from public.athletes where slug = 'natalie';

  for s in
    select p.id as session_id, p.day_label,
           (select max(v.version_number) from public.planned_session_versions v
             where v.planned_session_id = p.id) as latest,
           (select v.distance_unit from public.planned_session_versions v
             where v.planned_session_id = p.id order by v.version_number desc limit 1) as unit
    from public.planned_sessions p
    join public.training_weeks w on w.id = p.week_id
    where p.athlete_id = a_id and w.week_number = 1
  loop
    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, intent, prescribed_distance, distance_unit)
    values (
      a_id, s.session_id, s.latest + 1,
      case s.day_label
        when 'TUE' then 'Easy'
        when 'THU' then 'Easy + stairs'
        else 'Track' end,
      case s.day_label
        when 'TUE' then 'The shoe can kiss the floor; the heel stays off.'
        when 'THU' then 'Stairs 10–15 minutes after the run. Up only — ride back down.'
        else 'Speedwork.' end,
      case s.day_label
        when 'TUE' then 5.0
        when 'THU' then 3.0
        else 3.0 end,
      coalesce(s.unit, 'mi')
    );
  end loop;
end $$;

update public.movement_reads
   set cue = 'Shoulders down and back.'
 where marker = 'chest_proud'
   and athlete_id = (select id from public.athletes where slug = 'natalie');
