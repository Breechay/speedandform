-- The carries come off. The finish segments carry it, and teach something the
-- repeats never did.
--
-- W7's 2 x 4 and W11's 2 x 5 were authored to close a volume gap between 6 and 8
-- and between 8 and 10. The banded finish blocks close both on their own, and a
-- three-mile finish inside a ten-mile run teaches holding pace when the legs are
-- already gone -- which is the job the race asks for at mile ten and the thing the
-- repeats they replaced never taught.
--
-- Cancelled, not deleted, and the 6 mi and 8 mi repeats they replaced do NOT come
-- back. Both versions stay in history saying what was briefly asked.

do $$
declare n integer;
begin
  update public.planned_sessions ps
     set state = 'cancelled', updated_at = now()
    from public.planned_session_versions v,
         public.athletes a,
         public.training_weeks w
   where v.planned_session_id = ps.id
     and a.id = ps.athlete_id
     and w.id = ps.week_id
     and a.slug in ('hope','jose','marcus')
     and v.title in ('2 x 4 mi at race pace', '2 x 5 mi at race pace')
     and v.version_number = (select max(version_number) from public.planned_session_versions
                              where planned_session_id = ps.id);
  get diagnostics n = row_count;
  raise notice 'cancelled % carry sessions', n;
end $$;

-- ── The ladder, typed ───────────────────────────────────────────────────────
--
-- SUPPORT is the role the model was missing. A two-mile banded finish when the
-- athlete already owns five is in-band continuous work run under fatigue: it carries
-- volume and it does not advance ownership, and it is not a lesser session for that.
-- Without it those blocks fell through every case and typed as nothing.
create or replace function public.campaign_ladder(p_slug text)
returns table (
  week_number smallint,
  title text,
  race_pace_volume numeric,
  reach numeric,
  role text,
  volume_carried numeric,
  duration_carried numeric,
  precondition text
)
language sql stable as $$
  with sessions as (
    select w.week_number, v.title, ps.scheduled_on,
           sum(case when k.pace_low_seconds = 390 and k.pace_high_seconds = 405
                    then coalesce(k.repeat_count, 1) * k.distance else 0 end) as volume,
           max(case when k.pace_low_seconds = 390 and k.pace_high_seconds = 405
                     and k.shape = 'continuous' then k.distance end) as reach,
           max(case when k.pace_low_seconds is null and k.shape = 'continuous'
                    then k.distance end) as continuous_any_pace
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by pv.version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where a.slug = p_slug and ps.state <> 'cancelled'
     group by w.week_number, v.title, ps.scheduled_on
  ),
  running as (
    select *,
           -- What the athlete has carried BEFORE this week, which is what makes a
           -- reach lawful or not.
           coalesce(max(volume) over (order by week_number, scheduled_on
                                      rows between unbounded preceding and 1 preceding), 0) as vol_before,
           coalesce(max(greatest(coalesce(continuous_any_pace,0), coalesce(reach,0)))
                      over (order by week_number, scheduled_on
                            rows between unbounded preceding and 1 preceding), 0) as dur_before,
           coalesce(max(reach) over (order by week_number, scheduled_on
                                     rows between unbounded preceding and 1 preceding), 0) as owned_before
      from sessions
  )
  select week_number, title, volume, reach,
         case
           when reach is null and volume > 0 then 'CARRY'
           when reach is null then 'CEILING'
           when reach > owned_before then 'REACH'
           when reach = owned_before then 'CONFIRM'
           else 'SUPPORT'
         end,
         vol_before, dur_before,
         case
           when reach is null or reach <= owned_before then null
           when vol_before < reach then 'volume ' || vol_before || ' of ' || reach
           when dur_before < reach then 'duration ' || dur_before || ' of ' || reach
           else null
         end
    from running
   order by week_number, scheduled_on;
$$;

comment on function public.campaign_ladder is
  'The rung table for one athlete. SUPPORT is in-band continuous work shorter than what is already owned -- most finish segments -- and carries volume without advancing ownership. Reports; never repairs.';
