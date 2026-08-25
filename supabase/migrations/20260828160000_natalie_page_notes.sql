-- Brice's notes on Natalie's page.
--
-- The week line is his own sentence, but he does not want it on the page. The
-- field stays; this week's copy of it goes. Silence is the default when there is
-- nothing he wants said.
update public.training_weeks
   set intent = null
 where intent = 'Keep easy genuinely easy. Let Sunday answer the distance question.';

-- Wrist to hip is a 4.
update public.movement_reads
   set rating = 4
 where marker = 'wrist_to_hip';
