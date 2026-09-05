-- A session should say what it is before it says how far.
--
-- `2 × 10 min` makes a runner decode the workout before they know what kind of
-- work they are looking at. Every session gets an authored label — GENERAL
-- AEROBIC, RACE PACE, THRESHOLD, LONG RUN — so the architecture of a week is
-- legible before any number is read.
--
-- Authored, never inferred. A renderer that decided Tuesday was race pace
-- because it is Tuesday would be wrong the first time a plan moved its key days,
-- and one that decided from pace bands would be re-deriving coaching intent from
-- arithmetic — the thing this whole model has been removing. The label is a
-- fact on the session, and every surface reads the same one.

alter table public.training_plan_sessions
  add column if not exists label text;

comment on column public.training_plan_sessions.label is
  'What kind of session this is, in the coach''s words — GENERAL AEROBIC, RACE PACE, THRESHOLD, HILLS, VO₂, RECOVERY + STRIDES, LONG RUN, LONG RUN · RACE PACE FINISH, RACE. Authored on the session and read by every surface. Never inferred from the weekday or from the pace band.';

-- Written out title by title rather than as a pattern, so the classification can
-- be read and argued with, and so an unlabelled session fails loudly below
-- instead of quietly becoming something it is not.
update public.training_plan_sessions set label = case
  when title = 'Easy'                              then 'General aerobic'
  when title = 'Easy with strides'                 then 'Recovery + strides'
  when title like '%at race pace'                  then 'Race pace'
  when title like '%continuous at race pace'       then 'Race pace'
  when title like 'Threshold %'                    then 'Threshold'
  when title like 'Hills %'                        then 'Hills'
  when title like 'VO₂ %'                          then 'VO₂'
  when title like 'Long run — last%'               then 'Long run · race pace finish'
  when title like 'Long run%'                      then 'Long run'
  when title like 'Race%'                          then 'Race'
end;

-- The two that are neither easy nor a named workout: W12's Saturday is a long
-- run that finishes with the block's closing question, and W15's is the race.
update public.training_plan_sessions
   set label = 'Long run · race pace finish'
 where title = '12 mi continuous at race pace';

do $$
declare missing text; n integer;
begin
  select string_agg(distinct title, ' | ') into missing
    from public.training_plan_sessions where label is null;
  if missing is not null then
    raise exception 'these sessions have no authored label: %', missing;
  end if;

  select count(distinct label) into n from public.training_plan_sessions;
  raise notice '% distinct labels across % sessions', n,
    (select count(*) from public.training_plan_sessions);
end $$;

-- The public payload carries it, so the published page reads the same fact.
create or replace function public.public_plan(p_slug text)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'plan', jsonb_build_object(
      'slug', pub.slug, 'name', p.name, 'discipline', p.discipline,
      'total_weeks', p.total_weeks, 'question', p.question, 'for_whom', p.for_whom,
      'entry_volume', p.entry_volume, 'peak_volume', p.peak_volume,
      'race_pace_low_seconds', p.race_pace_low_seconds,
      'race_pace_high_seconds', p.race_pace_high_seconds),
    'version', jsonb_build_object(
      'number', v.version_number, 'summary', v.summary, 'cut_at', v.cut_at),
    'running', jsonb_build_object(
      'starts_on', pub.starts_on, 'race_on', pub.race_on,
      'race_name', pub.race_name, 'published_at', pub.published_at),
    'weeks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week_number', w.week_number, 'phase', w.phase,
        'total_distance', w.total_distance, 'intent', w.intent,
        'sessions', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'day', s.day_of_week, 'role', s.role, 'label', s.label,
            'title', s.title, 'intent', s.intent, 'details', s.details,
            'distance', s.prescribed_distance, 'asks', s.asks_rung_value,
            'components', (
              select coalesce(jsonb_agg(jsonb_build_object(
                'role', c.role, 'shape', c.shape, 'distance', c.distance,
                'duration_seconds', c.duration_seconds, 'repeat_count', c.repeat_count,
                'pace_low_seconds', c.pace_low_seconds, 'pace_high_seconds', c.pace_high_seconds,
                'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high,
                'recovery_kind', c.recovery_kind, 'recovery_seconds', c.recovery_seconds,
                'counts_toward_mark', c.counts_toward_mark)
                order by c.position), '[]'::jsonb)
              from training_plan_components c where c.plan_session_id = s.id))
            order by s.position), '[]'::jsonb)
          from training_plan_sessions s where s.plan_week_id = w.id))
        order by w.week_number), '[]'::jsonb)
      from training_plan_weeks w where w.version_id = v.id),
    'field', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', r.display_name, 'entered', r.entered,
        'established', r.established, 'race', r.race_result,
        'coach_read', r.coach_read) order by r.position), '[]'::jsonb)
      from plan_result_publications r
      where r.plan_publication_id = pub.id
        and r.published_at is not null and r.revoked_at is null))
  from plan_publications pub
  join training_plans p on p.id = pub.plan_id
  join training_plan_versions v on v.id = pub.plan_version_id
 where pub.slug = p_slug and pub.published_at is not null and pub.revoked_at is null;
$$;

revoke all on function public.public_plan(text) from public;
grant execute on function public.public_plan(text) to anon, authenticated;

do $$
declare payload jsonb; labelled integer;
begin
  select public_plan('race-pace-durability') into payload;
  select count(*) into labelled from jsonb_array_elements(payload->'weeks') w,
       jsonb_array_elements(w->'sessions') s where s->>'label' is not null;
  if labelled <> 90 then raise exception 'only % of 90 sessions carry a label publicly', labelled; end if;
  if payload::text ~* '(athlete_id|jose|hope|marcus)' then
    raise exception 'the public payload contains something athlete-specific'; end if;
end $$;
