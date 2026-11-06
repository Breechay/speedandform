-- Run after collective_work_feed_v2 deployment, with signed-in roster/RLS
-- checks performed separately. No actual athlete data is embedded in source.
do $test$
declare definition text;
begin
  definition := pg_get_functiondef(
    'public.collective_work_feed_v2(integer,timestamp with time zone,uuid)'::regprocedure);
  if definition is null
     or strpos(lower(definition),'collective_work_internal.publication_allowed')=0
     or strpos(lower(definition),'public.collective_work_viewer_on_roster')=0
     or strpos(lower(definition),'p.revoked_at is null')=0
     or strpos(lower(definition),'source_completion_id')=0
     or strpos(lower(definition),'rep_splits')=0 then
    raise exception 'Field split projection lost its roster or evidence gate';
  end if;
  if definition ilike '%athlete_note%'
     or definition ilike '%coach_note%'
     or definition ilike '%symptoms%'
     or definition ilike '%strava_url%' then
    raise exception 'A private/sensitive field entered the Field read projection';
  end if;
end;
$test$;

-- Authenticated gates:
-- * A rostered reader sees filed reps for a share-enabled roster athlete.
-- * With the existing work share turned off, the complete post disappears.
-- * A non-roster/anon reader receives no posts, including rep_splits.
-- * An unlinked or revoked post never returns work evidence.
-- * Strength posts and easy aggregate pieces have rep_splits=[] exactly.
-- * Nine-plus reps remain complete and ordered, with no truncation.
