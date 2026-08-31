-- The note has to reach the phone, or it is a note to nobody.
--
-- coach_note is on the version but the plan feed did not carry it, so the athlete
-- would open a session and see the anatomy without the words that explain why they
-- are running it. Patched into the existing payload rather than retyped, because the
-- feed is sixty lines of hand-built jsonb and retyping it to add one key is how a
-- field goes missing somewhere else.

do $$
declare src text; patched text;
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'athlete_plan_feed_impl';

  patched := replace(src,
    '''rpe_low'', v.rpe_low, ''rpe_high'', v.rpe_high',
    '''rpe_low'', v.rpe_low, ''rpe_high'', v.rpe_high, ''coach_note'', v.coach_note');

  if patched = src then
    raise exception 'the feed payload anchor was not found; nothing patched';
  end if;
  execute patched;
end $$;
