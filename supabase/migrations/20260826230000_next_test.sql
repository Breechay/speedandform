-- What would move the claim next. Written by Brice, one line, never generated.
-- This is the answer to "what do we work on" and "how do we get more sure" —
-- and it is a prescription, so it belongs to him.
alter table public.athlete_marks add column if not exists next_test text;

update public.athlete_marks m
   set next_test = case a.slug
     when 'jose'   then '6–8 miles straight at race pace. He is nearly there.'
     when 'hope'   then 'Same session again, with the recoveries actually run easy.'
     when 'marcus' then 'Goal-pace miles closed outside, with the conditions written down.'
   end
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug in ('hope', 'jose', 'marcus');
