-- A long run is what the week asks.
--
-- is_key was backfilled from "does this session carry a pace band", which was
-- the inference the surfaces were already making. It is wrong at the edges in
-- exactly one direction: a plain long run has no band and is unmistakably what
-- the week is asking of the athlete, and so is a hills-and-strides session.
-- Neither was flagged, so on a Friday the bench had no NEXT KEY to show while
-- Sunday sat two days away.
--
-- The honest line is not "has a band" but "has a day". Every dated session in
-- this plan is authored work the athlete is asked to do. The one thing that is
-- not is the weekly easy budget, which carries no date precisely because it is a
-- quantity spread across the week rather than a session.

update public.planned_sessions set is_key = true  where scheduled_on is not null and is_key = false;
update public.planned_sessions set is_key = false where scheduled_on is null and is_key = true;

comment on column public.planned_sessions.is_key is
  'Whether this session is what the week is asking of the athlete. Stored, not inferred: the weekly easy budget carries a pace ceiling and is not key, and a long run carries no band and is.';
