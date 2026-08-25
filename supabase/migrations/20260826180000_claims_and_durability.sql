-- Two things the page cannot be built without.
--
-- 1. DURABILITY. The 4x1 mi was not a rep session. It was 20 minutes easy, then
--    the reps with floats, then a cool-down, run continuous start to finish —
--    later the easy portion grows to 30-60. The continuity is the point, so it
--    has to be a fact and not a sentence in a note.
--
-- 2. THE CLAIM. Each athlete carries one question and one state. Both are plain
--    English in Brice's register, not "advanced / stalled / confounded", which
--    are science words he would never text. He writes the question, he sets the
--    state, and he writes the sentence underneath. None of it is generated.
--
--    working    — this is working
--    no_change  — a real look, nothing moved
--    unclear    — the session could not answer it
--
--    "unclear" is deliberately not a failure state. It is no news, not bad news.

alter table public.athlete_marks add column if not exists claim text;
alter table public.athlete_marks add column if not exists claim_state text
  check (claim_state is null or claim_state in ('working', 'no_change', 'unclear'));
alter table public.athlete_marks add column if not exists claim_note text;

comment on column public.athlete_marks.claim is
  'The question in plain English, written by Brice. Never composed from other fields.';
comment on column public.athlete_marks.claim_state is
  'working | no_change | unclear. unclear means the session could not answer it — no news, not bad news.';

alter table public.session_completions add column if not exists easy_minutes smallint;
alter table public.session_completions add column if not exists continuous boolean;
alter table public.session_completions add column if not exists floats_easy boolean;
alter table public.session_completions add column if not exists float_paces text;
alter table public.session_completions add column if not exists rep_paces text;

comment on column public.session_completions.floats_easy is
  'Whether the recoveries actually stayed easy. This is the evidence, not the rep splits.';
comment on column public.session_completions.continuous is
  'No stopping from warm-up through cool-down. The durability claim rests on this.';

-- The 2026-08-25 sessions, as they actually were.
update public.session_completions c
   set easy_minutes = 20,
       continuous = true,
       floats_easy = case when a.slug = 'jose' then true else false end,
       float_paces = case when a.slug = 'jose' then '8:14 · 8:30 · 8:26' else '3:00 each, run hard' end,
       rep_paces = case when a.slug = 'jose'
         then '6:31 · 6:28 · 6:30 · 6:27' else '6:29 · 6:20 · 6:22 · 6:19' end,
       athlete_note = null
  from public.athletes a
 where a.id = c.athlete_id and a.slug in ('hope', 'jose');

update public.athlete_marks m
   set claim = case a.slug
         when 'hope' then 'Can she hold 6:25–6:30 for a whole half?'
         when 'jose' then 'Can he do a hard session and still be fine for the next one?'
         when 'marcus' then 'Does the treadmill speed show up outside?'
       end,
       claim_state = case a.slug
         when 'hope' then 'unclear'
         when 'jose' then 'working'
         else null
       end,
       claim_note = case a.slug
         when 'hope' then '6:19 is too fast — recovered a bit too much.'
         when 'jose' then 'Easily your best session to date.'
         else null
       end
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug in ('hope', 'jose', 'marcus');
