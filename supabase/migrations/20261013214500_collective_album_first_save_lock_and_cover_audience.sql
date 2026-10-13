-- Applied to production Oct 13, 2026 (Brice approved). Two corrections from the media review.
--
-- 1. Two editors saving the first draft (expected = 0) at the same time could both pass the
--    version check because no draft row existed to lock. Take the per-run album lock first.
--    The six-argument overload calls this one, so both are covered.
CREATE OR REPLACE FUNCTION public.collective_album_save_draft(run uuid, expected integer, items jsonb, layout text, appearance text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare current_v int; next_v int;
begin
  if not public.collective_is_publisher() then raise exception 'not_publisher'; end if;
  perform public.collective_album_lock(run);
  perform public.collective_album_check_items(run, items);
  select d.version into current_v from public.collective_album_drafts d where d.run_id = run for update;
  if coalesce(current_v, 0) <> coalesce(expected, -1) then raise exception 'draft_conflict'; end if;
  next_v := coalesce(current_v, 0) + 1;
  insert into public.collective_album_drafts as d (run_id, version, items, layout, appearance, updated_by, updated_at)
  values (run, next_v, items, layout, appearance, auth.uid(), clock_timestamp())
  on conflict (run_id) do update set version = next_v, items = excluded.items, layout = excluded.layout,
    appearance = excluded.appearance, updated_by = auth.uid(), updated_at = clock_timestamp();
  return next_v;
end $function$;

-- 2. Series covers had no audience or withdrawal check: a members-only run's cover, or a
--    withdrawn photo, could be returned to anyone. Same rule as collective_album().
CREATE OR REPLACE FUNCTION public.collective_series_covers()
 RETURNS TABLE(series_id text, run_id uuid, asset uuid, path text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select c.series_id, c.run_id, c.asset, e->>'path'
    from public.collective_series_cover_picks c
    join public.collective_runs r on r.id = c.run_id
    join public.collective_album_state s on s.run_id = c.run_id and not s.taken_down
    join public.collective_album_revisions v on v.run_id = s.run_id and v.revision = s.live_revision
    cross join lateral jsonb_array_elements(v.items) e
   where (e->>'asset')::uuid = c.asset and e->>'path' is not null
     and not public.collective_media_path_withdrawn(e->>'path')
     and ((r.author_kind = 'form' and r.visibility = 'public') or public.collective_is_member())
$function$;
