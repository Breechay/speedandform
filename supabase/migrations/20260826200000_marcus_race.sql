-- Marcus: West Palm Beach Half, December 13 2026, 1:30.
-- A week later than Hope and Jose's Orlando race, so his block runs one week longer.
do $$
declare a_id uuid; b_id uuid;
begin
  select id into a_id from public.athletes where slug = 'marcus';

  insert into public.training_blocks
    (athlete_id, source, name, block_number, target_event, goal_label, goal_statement,
     total_weeks, starts_on, ends_on, race_on, status)
  values (a_id, 'form_program', 'Half build', 1, 'West Palm Beach Half Marathon',
          'Sub-1:30', 'Run 1:30 at West Palm Beach', 16,
          date '2026-08-23', date '2026-12-13', date '2026-12-13', 'active')
  returning id into b_id;

  update public.athletes
     set target_event = 'West Palm Beach Half', goal_label = 'Sub-1:30'
   where id = a_id;
end $$;
