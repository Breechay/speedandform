-- "Can she hold 6:25-6:30?" reads as talking about her to a third party.
-- Brice is presenting his athletes, so the claim is stated the way he would say it
-- out loud: our goal here is to see if...

update public.athlete_marks m
   set claim = case a.slug
         when 'hope'   then 'Our goal here is to see if she can hold 6:25–6:30 for the whole half.'
         when 'jose'   then 'Our goal here is to see if he can go hard and still be fine for the next session.'
         when 'marcus' then 'Our goal here is to see if the treadmill speed shows up outside.'
       end
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug in ('hope', 'jose', 'marcus');
