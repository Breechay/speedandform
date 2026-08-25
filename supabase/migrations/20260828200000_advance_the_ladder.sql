-- Advancing a rung is a decision, not an inference.
--
-- The checkpoint already carries state: reached, current, proposed, repeated,
-- retired. Nothing could change it from the desk, because the table had a read
-- policy and no write policy. So the ladder was authored once by a migration and
-- then frozen, which made it decoration rather than an instrument.
--
-- Repeating a rung is a first-class state for a reason. Six miles held twice, the
-- second at RPE 7 instead of 8, is stronger evidence than reaching ten once. A
-- rung that stays put because Brice chose to repeat it must not read as a stall.

create policy checkpoints_coach_write on public.mark_checkpoints
  for update to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
