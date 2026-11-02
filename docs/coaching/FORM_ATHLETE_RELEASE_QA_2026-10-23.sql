-- FORM / athlete release gate. Read-only. Zero rows is the pass condition.
-- Run against the same active plan that the athlete's signed-in Week will request.
-- This checks data, not the native layout; device screenshots remain separate evidence.
with current_sessions as (
  select a.id athlete_id,a.slug,ps.id session_id,ps.scheduled_on,ps.state,ps.role,ps.is_key,
         v.id version_id,v.title,v.details,v.intent,v.pace_low,v.pace_high,
         coalesce(g.easy_min_seconds_per_mile,420) easy_floor
  from public.planned_sessions ps
  join public.athletes a on a.id=ps.athlete_id
  join public.training_weeks w on w.id=ps.week_id
  join public.training_blocks b on b.id=w.block_id
  join lateral (select * from public.planned_session_versions pv
                where pv.planned_session_id=ps.id order by pv.version_number desc limit 1) v on true
  left join public.athlete_running_guardrails g on g.athlete_id=a.id
  where b.status='active' and ps.state='published'
    and ps.scheduled_on>=current_date
), issues as (
  select 'BLOCK' severity,'EASY_FAST_WORK' code,s.slug,s.scheduled_on,s.title,
         'Fast work pace conflicts with the easy day' detail
  from current_sessions s join public.planned_session_components c on c.version_id=s.version_id
  where s.title ~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)' and c.role='work'
    and least(coalesce(c.pace_low_seconds,public.form_easy_pace_seconds(c.pace_low),99999),
              coalesce(c.pace_high_seconds,public.form_easy_pace_seconds(c.pace_high),99999))<s.easy_floor
    and not (c.duration_seconds is not null and c.duration_seconds<=30
             and coalesce(c.repeat_count,1)<=10 and coalesce(c.recovery_seconds,0)>=30)
  union all
  select 'BLOCK','EASY_LONG_REPEATS',s.slug,s.scheduled_on,s.title,
         'Repeated fast-length pickups are labeled an easy run'
  from current_sessions s join public.planned_session_components c on c.version_id=s.version_id
  where s.title ~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)' and c.role='work'
    and c.shape='repetitions' and coalesce(c.repeat_count,0)>=3
    and coalesce(c.duration_seconds,0)>=45 and coalesce(c.recovery_seconds,0)>0
  union all
  select 'BLOCK','EASY_FAST_HEADER',s.slug,s.scheduled_on,s.title,
         'Session header pace conflicts with easy-day floor'
  from current_sessions s
  where s.title ~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)'
    and least(coalesce(public.form_easy_pace_seconds(s.pace_low),99999),
              coalesce(public.form_easy_pace_seconds(s.pace_high),99999))<s.easy_floor
  union all
  select 'BLOCK','DUPLICATE_DAY',s.slug,s.scheduled_on,max(s.title),
         'Multiple published sessions compete for the same athlete and day'
  from current_sessions s group by s.slug,s.scheduled_on having count(*)>1
  union all
  select 'COPY','PRIVATE_OR_CONDITIONAL_COPY',s.slug,s.scheduled_on,s.title,
         'Internal coaching or recovery conditions appear in athlete details'
  from current_sessions s
  where coalesce(s.intent,'') ~* '(if (recovered|absorbed|ready)|coach gate|intake pending|coach review)'
     or coalesce(s.details,'') ~* '(if (recovered|absorbed|ready)|coach gate|intake pending|coach review|if tuesday is not)'
  union all
  select 'COPY','JARGON_TITLE',s.slug,s.scheduled_on,s.title,
         'Program shorthand leaked into an athlete title'
  from current_sessions s
  where s.title ~* '(HM durability|durable 10K|conditional A.goal|5K development)'
  union all
  select 'COPY','PLACEHOLDER_SESSION_TITLE',s.slug,s.scheduled_on,s.title,
         'Replace an internal category with a plain title that names the actual work'
  from current_sessions s
  where s.title ~* '(midweek aerobic|threshold control|long aerobic|easy aerobic|recovery aerobic|aerobic[[:space:]]*[+][[:space:]]*strides|^[[:space:]]*key session[[:space:]]*$)'
  union all
  select 'BLOCK','QUALITY_WORK_NOT_STRUCTURED',s.slug,s.scheduled_on,s.title,
         'Published quality work has no structured work rows; author the precise repetitions, efforts and recoveries'
  from current_sessions s
  where s.scheduled_on < current_date + interval '21 days'
    and s.title ~* '(threshold|tempo|interval|speed|track|hills|fartlek)'
    and not exists (
      select 1 from public.planned_session_components c
      where c.version_id=s.version_id and c.role='work'
    )
  union all
  select 'COPY','EASY_ROLE_MISLABELED',s.slug,s.scheduled_on,s.title,
         'An easy run is marked key in the plan; verify the Week category'
  from current_sessions s
  where s.role='key' and coalesce(s.is_key,false)
    and s.title ~* '(^|[^[:alpha:]])easy([^[:alpha:]]|$)'
    and s.title !~* '(long[[:space:]]+(run|easy)|strides|race[[:space:]]+pace|tempo|threshold|interval)'
  union all
  select 'BLOCK','DOUBLE_THRESHOLD_FORM_WEEK',t.slug,t.scheduled_on,t.title,
         'Tuesday threshold repeats the linked FORM Thursday threshold; use the coach-approved easy or strides Tuesday instead'
  from current_sessions t
  join current_sessions th on th.athlete_id=t.athlete_id
       and th.scheduled_on=t.scheduled_on + 2
  join public.form_miami_session_links link on link.planned_session_id=th.session_id
       and link.lane='thursday' and not link.paused
  where extract(isodow from t.scheduled_on)=2
    and t.title ~* '(threshold|tempo)'
    and th.title ~* '(threshold|tempo)'
  union all
  select 'COPY','TRACK_PREVIEW_MISSING',s.slug,s.scheduled_on,s.title,
         'Track workout needs an authored Week preview with sets and rests'
  from current_sessions s where (s.title ilike 'THE FIFTH CIRCLE%' or s.title ilike 'FORM Track%')
    and coalesce(s.details,'') not like 'Week: %'
  union all
  select 'BLOCK','THE_FIVE_WEEK_EMPTY',a.slug,w.starts_on,
         'Week ' || w.week_number::text,
         'A visible future week has no published sessions'
  from public.training_weeks w
  join public.training_blocks b on b.id=w.block_id
  join public.athletes a on a.id=b.athlete_id
  where b.status='active' and b.starts_on='2026-10-19'
    and a.slug in ('brice','david','sam-reyes','tinius','kevin')
    and w.starts_on >= current_date
    and not exists (
      select 1 from public.planned_sessions ps
      where ps.week_id=w.id and ps.state='published'
    )
)
select severity,code,slug,scheduled_on,title,detail from issues
order by case severity when 'BLOCK' then 1 else 2 end,slug,scheduled_on,code;