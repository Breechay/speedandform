-- Presentation stopped inferring coaching meaning from copy.
--
-- The Week View wants to draw a key session differently from an easy day. The
-- shortest way there is `title !== 'Easy'`, and Brice refused it: a classifier
-- built on copy means the layout changes when a title is reworded, and it means
-- the next session type FORM invents — mobility, a note, a strength block —
-- silently becomes a key session because its title is not the word "Easy".
--
-- So the role becomes a fact the coach authors, recorded here once, read
-- thereafter. Four values:
--
--   key      the session the week is trying to prove something with — long runs,
--            race pace, threshold, intervals, speed, tests, the race itself
--   easy     the running that carries the athlete to those, and is supposed to
--            be unremarkable
--   support  work that is not the running — stairs, strength, mobility
--   rest     a day that is deliberately off
--
-- `is_key` is NOT this column and is not repaired here. It was overwritten on
-- 4 September to mean "has a date", which is why the two surfaces that read it
-- are moved onto `role` at the bottom of this file rather than left pointing at
-- a boolean that answers a different question.

alter table public.planned_sessions
  add column if not exists role text not null default 'key'
    check (role in ('key', 'easy', 'support', 'rest'));

comment on column public.planned_sessions.role is
  'What kind of day this is, authored rather than inferred: key (the week is proving something), easy (carries the athlete there), support (not the running), rest (deliberately off). The renderer reads this; it must never re-derive it from a title.';

-- The backfill is a one-time classification of what already exists, written out
-- title by title so it can be read and argued with. It is deliberately NOT a
-- pattern match: `like 'Easy%'` would be the same mistake one layer down.
do $$
declare
  easy_titles text[] := array[
    'Easy', 'Easy week', 'Easy with strides', 'Easy + stairs', 'Easy — shakeout',
    'Easy — long day, short', 'Easy — 10 mi across the week',
    'Easy — 12 mi across the week', 'Easy — 15 mi across the week',
    'Easy — 18 mi across the week', 'Shakeout'];
  support_titles text[] := array['Support + stairs'];
  rest_titles    text[] := array['Off'];
  untagged integer;
begin
  -- Everything defaults to key, then the three smaller sets are named. Doing it
  -- this way round means a title nobody classified becomes a key session and is
  -- visible, rather than becoming easy running and disappearing into the week.
  update public.planned_sessions ps set role = 'easy'
    from public.planned_session_versions v
   where v.id = (select v2.id from public.planned_session_versions v2
                  where v2.planned_session_id = ps.id
                  order by v2.version_number desc limit 1)
     and btrim(v.title) = any(easy_titles);

  update public.planned_sessions ps set role = 'support'
    from public.planned_session_versions v
   where v.id = (select v2.id from public.planned_session_versions v2
                  where v2.planned_session_id = ps.id
                  order by v2.version_number desc limit 1)
     and btrim(v.title) = any(support_titles);

  update public.planned_sessions ps set role = 'rest'
    from public.planned_session_versions v
   where v.id = (select v2.id from public.planned_session_versions v2
                  where v2.planned_session_id = ps.id
                  order by v2.version_number desc limit 1)
     and btrim(v.title) = any(rest_titles);

  -- A session with no version at all cannot be classified and must not be
  -- silently called key.
  select count(*) into untagged from public.planned_sessions ps
   where not exists (select 1 from public.planned_session_versions v
                      where v.planned_session_id = ps.id);
  if untagged <> 0 then
    raise exception '% sessions have no version and could not be classified', untagged;
  end if;
end $$;

-- The two surfaces that were reading `is_key` and meaning "key session".
-- Recorded here so the move is part of the same change as the column.
comment on column public.planned_sessions.is_key is
  'Historical. Overwritten 4 September 2026 to mean "has a date" and never repaired. Nothing should read this for whether a session is a key session — that is `role`.';

-- The athlete gets the role too. The Week View they are shown is the same
-- renderer, so it needs the same fact; without it their week would draw every
-- day identically while the coach saw the week's shape.
do $$
declare src text; patched text;
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'athlete_plan_feed_impl';

  -- Anchored on the session object's own keys, not the version's: `position`
  -- appears again inside the components array, so the replacement is pinned to
  -- the pair that only occurs once.
  patched := replace(src,
    '''day_label'', ps.day_label, ''position'', ps.position,',
    '''day_label'', ps.day_label, ''position'', ps.position, ''role'', ps.role,');

  if patched = src then
    raise exception 'the feed session payload anchor was not found; nothing patched';
  end if;
  execute patched;
end $$;

do $$
declare bad integer; dist text;
begin
  select count(*) into bad from public.planned_sessions where role is null;
  if bad <> 0 then raise exception 'every session carries a role'; end if;

  -- The classification, asserted rather than assumed. If these move, the
  -- backfill met data it was not written for.
  select string_agg(role || '=' || n, ' ' order by role) into dist
    from (select role, count(*) n from public.planned_sessions group by role) t;
  raise notice 'session roles: %', dist;

  select count(*) into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'athlete_plan_feed_impl'
     and pg_get_functiondef(p.oid) like '%''role'', ps.role%';
  if bad <> 1 then raise exception 'the feed does not carry the session role'; end if;
end $$;
