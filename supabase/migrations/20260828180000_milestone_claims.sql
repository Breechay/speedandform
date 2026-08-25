-- Brice's correction, two parts.
--
-- Jose's claim was mine, not his. "Can he go hard and still be fine for the next
-- session?" was never authored; the agreement was to focus on the milestones. A
-- claim nobody wrote is a draft with confidence, and it also cannot be settled by
-- one session, which quietly made every session unreadable against it.
--
-- Hope's claim still said 6:25–6:30. That is a 1:24 pace attached to a 1:30 goal.
-- The ladder was already corrected to 6:30–6:45 for buffer; the prose was not.
--
-- All three now carry the same shape: how far can race pace be held in one run.
-- Marcus keeps his outdoor question, but as a condition on which evidence counts
-- rather than as a separate claim. A treadmill six does not answer it. That is a
-- fact about the evidence, not a different goal.

update public.athlete_marks m
   set claim = case a.slug
     when 'hope'   then 'Our goal here is to see how far she can hold 6:30–6:45 in one run.'
     when 'jose'   then 'Our goal here is to see how far he can hold 6:30–6:45 in one run.'
     when 'marcus' then 'Our goal here is to see how far he can hold 6:30–6:45 outside.'
     else m.claim end
  from public.athletes a
 where a.id = m.athlete_id
   and a.slug in ('hope', 'jose', 'marcus');

update public.athlete_marks m
   set current_question = case a.slug
     when 'hope'   then 'How far can she hold 6:30–6:45 without it coming apart?'
     when 'jose'   then 'How far can he hold 6:30–6:45 without it coming apart?'
     when 'marcus' then 'How far can he hold 6:30–6:45 outside?'
     else m.current_question end
  from public.athletes a
 where a.id = m.athlete_id
   and a.slug in ('hope', 'jose', 'marcus');
