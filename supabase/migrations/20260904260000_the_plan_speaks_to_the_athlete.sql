-- The plan speaks to the athlete.
--
-- Every athlete-facing sentence was written about them rather than to them:
-- "How far can he hold 6:30–6:45 without it coming apart?" is a coach describing
-- an athlete to himself. The same words in the second person are the question the
-- athlete is actually being asked, and this Plan is going onto their phone.
--
-- Stored, not transformed at render. A display layer that rewrites authored
-- prose is a second author nobody can see, and the pronoun is part of what was
-- written. `claim_note` is left alone where it is genuinely a note to the coach
-- — Hope's is about how Brice writes her guardrails, not something she reads.

update public.athlete_marks
   set current_question = 'How far can you hold 6:30–6:45 without it coming apart?',
       claim            = 'Our goal here is to see how far you can hold 6:30–6:45 in one run.'
 where active and athlete_id in (select id from public.athletes where slug in ('jose', 'hope'));

update public.athlete_marks
   set current_question = 'How far can you hold 6:30–6:45 outside?',
       claim            = 'Our goal here is to see how far you can hold 6:30–6:45 outside.'
 where active and athlete_id in (select id from public.athletes where slug = 'marcus');

update public.athlete_marks
   set current_question = 'Can five miles settle normally enough to progress without changing your movement?'
 where active and athlete_id in (select id from public.athletes where slug = 'natalie');
