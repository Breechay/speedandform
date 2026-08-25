-- Her words, not the system's: she said she just wants to finish.
-- Rendered verbatim; never composed from goal_label + target_event.
update public.training_blocks
   set goal_statement = 'Finish the Miami Half Marathon',
       race_on = date '2027-01-31'
 where athlete_id = (select id from public.athletes where slug = 'natalie');
