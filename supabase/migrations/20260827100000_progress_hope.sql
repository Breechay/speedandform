-- Brice's read: Hope is in better shape than this session showed. It did not go
-- badly because she is behind — it went badly because the prescription had no
-- guardrails on it. So she progresses alongside Jose rather than repeating.
--
-- That distinction is worth recording as a fact. A session that cannot be read
-- because the athlete deviated and one that cannot be read because the coach
-- left it loose are different failures, and only one of them is hers. If the
-- second keeps happening it is a pattern in the prescribing, which is exactly
-- the kind of thing this record exists to surface.

alter table public.session_completions add column if not exists unreadable_because text
  check (unreadable_because is null or unreadable_because in
    ('prescription', 'execution', 'conditions', 'recording'));

comment on column public.session_completions.unreadable_because is
  'Why a session could not answer the question. prescription = it was left too loose. Not a judgement of the athlete.';

update public.session_completions c
   set unreadable_because = 'prescription'
  from public.athletes a
 where a.id = c.athlete_id and a.slug = 'hope';

update public.athlete_marks m
   set next_test = '6–8 miles straight at race pace.',
       claim_note = 'She is in better shape than this session showed. It needed tighter guardrails from me, not more fitness from her.'
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug = 'hope';

update public.athlete_marks m
   set next_test = '6–8 miles straight at race pace.'
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug = 'jose';
