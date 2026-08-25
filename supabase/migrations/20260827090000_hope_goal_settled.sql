-- Settled by Brice: all three go for sub-1:30. The 1:35 in circulation is out.
update public.training_blocks b
   set goal_label = 'Sub-1:30',
       goal_statement = 'Run 1:30 at Orlando'
  from public.athletes a
 where a.id = b.athlete_id and a.slug in ('hope', 'jose');

update public.athletes set goal_label = 'Sub-1:30' where slug in ('hope', 'jose');
