-- Volume is the week, not the row.
--
-- campaign_ladder computed the running best from individual SESSIONS, so week five's
-- six-mile race-pace run and its two-mile finish block counted as 6 and 2 rather than
-- 8 -- and the lint then reported week nine's reach as unmet on volume it had
-- already carried.
--
-- This is the same defect named for the console strip, which renders one anchor
-- session per week and cannot see the second. It turned out to be in the model too,
-- and the lint caught it by disagreeing with a count done by hand. Worth saying: the
-- lint was right to be loud and wrong about the answer.

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
  -- Every session in the week, summed. This is the whole correction.
  weekly as (
    select week_number,
           sum(volume) as week_volume,
           max(greatest(coalesce(continuous_any_pace, 0), coalesce(reach, 0))) as week_longest_continuous,
           max(reach) as week_reach
      from sessions group by week_number
  ),
  carried as (
    select week_number,
           coalesce(max(week_volume) over (order by week_number
                     rows between unbounded preceding and 1 preceding), 0) as vol_before,
           coalesce(max(week_longest_continuous) over (order by week_number
                     rows between unbounded preceding and 1 preceding), 0) as dur_before,
           coalesce(max(week_reach) over (order by week_number
                     rows between unbounded preceding and 1 preceding), 0) as owned_before
      from weekly
  )
  select s.week_number, s.title, s.volume, s.reach,
         case
           when s.reach is null and s.volume > 0 then 'CARRY'
           when s.reach is null then 'CEILING'
           when s.reach > c.owned_before then 'REACH'
           when s.reach = c.owned_before then 'CONFIRM'
           else 'SUPPORT'
         end,
         c.vol_before, c.dur_before,
         case
           when s.reach is null or s.reach <= c.owned_before then null
           when c.vol_before < s.reach then 'volume ' || c.vol_before || ' of ' || s.reach
           when c.dur_before < s.reach then 'duration ' || c.dur_before || ' of ' || s.reach
           else null
         end
    from sessions s join carried c on c.week_number = s.week_number
   order by s.week_number, s.scheduled_on;
$$;
