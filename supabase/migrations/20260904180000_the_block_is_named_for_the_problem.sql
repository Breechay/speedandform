-- The block is named for the problem it solves.
--
-- "Half build" names an event category. It says what race is at the end and
-- nothing about what the fifteen weeks are for, which means every half-marathon
-- block anyone ever authors carries the same name and none of them says anything.
--
-- What Hope and José are actually doing has a name: how much race pace can they
-- carry before it comes apart. Speed above race pace already exists — both of
-- them run materially faster than 6:45. Threshold is maintained rather than
-- emphasised. The progression is broken race-pace work, then longer continuous
-- race-pace work, then longer race-pace finishes inside the long run. Ownership
-- is literally a durability measure.
--
-- This renames. It does not reinterpret: no session, component, week, mark or
-- checkpoint changes. The label is naming what the existing progression already
-- was.
--
-- Marcus is deliberately not renamed. His block carries the same goal and a mark
-- asking the same question with an outdoor qualifier, so he may well be a third
-- application of this method — but that is a coaching judgment, not a rename
-- this migration is entitled to make.

update public.training_blocks
   set name = 'Race Pace Durability'
 where status = 'active'
   and athlete_id in (select id from public.athletes where slug in ('jose', 'hope'));
