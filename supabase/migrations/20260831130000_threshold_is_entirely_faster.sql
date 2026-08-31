-- The threshold report was catching the race band.
--
-- It selected any band whose FAST edge sat under the target, which is true of the
-- race band by design -- 6:30 is the margin the athlete is allowed to find inside a
-- 6:45 target. A buffer band is one that lies entirely faster than the target, with
-- nothing in it the athlete could run at race pace.

create or replace function public.threshold_derivation()
returns table (slug text, target_pace integer, implied_threshold integer,
               authored_threshold text, delta_seconds integer)
language sql stable as $$
  with authored as (
    select distinct a.slug, a.target_pace_seconds,
           k.pace_low, k.pace_high, k.pace_low_seconds, k.pace_high_seconds
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by pv.version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id
     where k.pace_low_seconds is not null and a.target_pace_seconds is not null
       -- Entirely faster than the target. The race band's slow edge IS the target,
       -- so it is excluded here rather than reported as an under-derived threshold.
       and k.pace_high_seconds < a.target_pace_seconds
  )
  select slug, target_pace_seconds, target_pace_seconds - 30,
         pace_low || '-' || pace_high,
         pace_low_seconds - (target_pace_seconds - 30)
    from authored;
$$;
