-- A hand-written revision dropped eligibility.
--
-- write_session_version carries counts_toward_mark_id forward, and the Revise
-- editor restates it on the wire — both built precisely so a revision could not
-- silently un-eligible a component. Then I authored Pressure to Pace and
-- Durability Read by hand in a migration, wrote their component JSON myself, and
-- left it out. Four components across the two athletes stopped being able to
-- answer the mark, and the count went 50 to 46.
--
-- Nothing about the prescriptions changed; the sessions still ask for 8-minute
-- repetitions at 6:30–6:45, and each of those repetitions is a continuous piece
-- inside the band. They are evidence. Restoring the pointer, not re-authoring.
--
-- The lesson is narrow and worth keeping: the guard protects the paths a coach
-- uses. It does not protect a migration that bypasses them.

update public.planned_session_components c
   set counts_toward_mark_id = m.id
  from public.planned_session_versions v,
       public.planned_sessions s,
       public.athletes a,
       public.athlete_marks m,
       lateral (select max(version_number) mx from public.planned_session_versions x
                 where x.planned_session_id = s.id) latest
 where c.version_id = v.id
   and v.planned_session_id = s.id
   and s.athlete_id = a.id
   and m.athlete_id = a.id and m.active and m.is_primary
   and a.slug in ('jose', 'hope')
   and v.version_number = latest.mx
   and c.role = 'work'
   and c.pace_low_seconds = 390
   and c.pace_high_seconds = 405
   and c.counts_toward_mark_id is null;
