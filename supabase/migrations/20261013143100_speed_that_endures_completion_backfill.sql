-- Backfill the high-confidence Speed That Endures execution records that
-- existed in the Study while FORM native delivery / refresh was unstable.
--
-- Scope is deliberately narrow:
--   Sep 08  · 4 x 2 mi race-pace work, Hope + José
--   Sep 15  · 5 mi continuous race pace, Hope + José
--   Sep 22  · 5 x 1 mi race-pace work, Hope + José
--   Sep 29  · 6 mi continuous race pace, Hope + José
--   Oct 06  · 4 x 2 mi race-pace work, José only
--
-- The paired Sep 10 / 11 threshold read is NOT imported here because the current
-- study record does not resolve an athlete-specific execution date. Historical
-- evidence should under-claim rather than invent a date.
--
-- All rows are coach_import snapshots, linked to the exact immutable session
-- version that was current for the published occurrence. They are not native-app
-- receipts and do not pretend the athletes filed them from the phone.

set local search_path=public,pg_temp;

select set_config(
  'request.jwt.claims',
  (select jsonb_build_object('sub', id)::text
     from auth.users
    where lower(email)=lower('briceikouebe@gmail.com')
    limit 1),
  true
);

create temporary table ste_completion_backfill (
  slug text not null,
  performed_on date not null,
  session_title text not null,
  status text not null,
  actual_distance numeric,
  distance_unit text,
  duration_seconds integer,
  rpe smallint,
  evidence_id text not null,
  athlete_note text not null,
  pieces jsonb not null
) on commit drop;

insert into ste_completion_backfill values
-- Sep 08 · W3 · 4 x 2 mi
(
  'jose', date '2026-09-08', '4 × 2 mi at race pace', 'completed',
  8, 'mi', null, null,
  'study-ste-jose-2026-09-08-race-pace',
  'Backfilled October 13 from the existing Speed That Endures Study W3 record. Work: 4 × 2 mi with displayed average paces 6:42, 6:43, 6:43, 6:43/mi. The study describes the session as hard but controlled. Only the recorded work paces are structured here; no unrecorded warm-up, float or cooldown measurements are invented. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',402),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',403),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',403),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',403)
  )
),
(
  'hope', date '2026-09-08', '4 × 2 mi at race pace', 'completed',
  8, 'mi', null, null,
  'study-ste-hope-2026-09-08-race-pace',
  'Backfilled October 13 from the existing Speed That Endures Study W3 record. Work: 4 × 2 mi with displayed average paces 6:50, 6:50, 6:53, 6:50/mi. No numeric effort was recorded in the study. Only the recorded work paces are structured here; no unrecorded warm-up, float or cooldown measurements are invented. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',410),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',410),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',413),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','paceSeconds',410)
  )
),

-- Sep 15 · W4 · 5 continuous
(
  'jose', date '2026-09-15', '5 mi continuous at race pace', 'completed',
  5, 'mi', 2021, null,
  'study-ste-jose-2026-09-15-continuous-5',
  'Backfilled October 13 from the existing Speed That Endures Study W4 record. Five continuous work miles: 33:40.8, displayed 6:44/mi. Athlete report: breathing controlled, legs tiring, form required attention; he chose not to chase sub-6:40. The integer duration field rounds the recorded 33:40.8 to 2021 seconds. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','rep','distance',5,'distanceUnit','mi','durationSeconds',2021,'paceSeconds',404)
  )
),
(
  'hope', date '2026-09-15', '5 mi continuous at race pace', 'completed',
  5, 'mi', 2058, null,
  'study-ste-hope-2026-09-15-continuous-5',
  'Backfilled October 13 from the existing Speed That Endures Study W4 record. Five continuous work miles: 34:17.9, displayed 6:52/mi. Recorded mile splits: 6:48.9, 6:49.8, 6:53.4, 6:51.7, 6:54.1. The integer duration field rounds the recorded 34:17.9 to 2058 seconds. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','rep','distance',5,'distanceUnit','mi','durationSeconds',2058,'paceSeconds',412)
  )
),

-- Sep 22 · W5 · 5 x 1 mi, 2:00 floats
(
  'jose', date '2026-09-22', '5 × 1 mi at race pace', 'completed',
  5, 'mi', null, 8,
  'study-ste-jose-2026-09-22-race-pace',
  'Backfilled October 13 from docs/studies/SPEED_THAT_ENDURES_W5_20260922.json. Warm-up 20:00 / 2.39 mi. Exact rep times: 6:38.6, 6:38.7, 6:35.9, 6:40.0, 6:37.9. Floats were 2:00 at displayed paces 9:20, 9:38, 9:31, 9:18/mi. Cooldown 9:59.7 / 1.08 mi. Total source activity 9.32 mi / 1:11:10.7. RPE 8/10. Piece duration fields are whole-second projections of the exact study times; the exact tenths stay in this note. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','warmup','distance',2.39,'distanceUnit','mi','durationSeconds',1200,'paceSeconds',502),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',399,'paceSeconds',399),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',560),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',399,'paceSeconds',399),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',578),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',396,'paceSeconds',396),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',571),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',400,'paceSeconds',400),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',558),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',398,'paceSeconds',398),
    jsonb_build_object('kind','cooldown','distance',1.08,'distanceUnit','mi','durationSeconds',600,'paceSeconds',599)
  )
),
(
  'hope', date '2026-09-22', '5 × 1 mi at race pace', 'completed',
  5, 'mi', null, null,
  'study-ste-hope-2026-09-22-race-pace',
  'Backfilled October 13 from docs/studies/SPEED_THAT_ENDURES_W5_20260922.json. Warm-up 15:00 / 1.76 mi. Exact rep times: 6:42.9, 6:44.0, 6:45.1, 6:47.1, 6:48.9. Floats were 2:00 at displayed paces 8:38, 10:08, 10:11, 10:26/mi. No numeric RPE, cooldown, or full-activity total is assigned because the source did not establish them. Piece duration fields are whole-second projections of the exact study times; the exact tenths stay in this note. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','warmup','distance',1.76,'distanceUnit','mi','durationSeconds',900,'paceSeconds',511),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',403,'paceSeconds',403),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',518),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',404,'paceSeconds',404),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',608),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',405,'paceSeconds',405),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',611),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',407,'paceSeconds',407),
    jsonb_build_object('kind','float','durationSeconds',120,'paceSeconds',626),
    jsonb_build_object('kind','rep','distance',1,'distanceUnit','mi','durationSeconds',409,'paceSeconds',409)
  )
),

-- Sep 29 · W6 · 6 continuous
(
  'jose', date '2026-09-29', '6 mi continuous at race pace', 'completed',
  6, 'mi', 2356, null,
  'study-ste-jose-2026-09-29-continuous-6',
  'Backfilled October 13 from the existing Speed That Endures W6 record. Warm-up 20:00 / 2.31 mi at displayed 8:40/mi. Six continuous work miles: 39:16.0, displayed 6:33/mi. Cooldown 10:01.2 / 1.23 mi at displayed 8:11/mi. Total source activity 9.53 mi / 1:09:17.2. Athlete described the work as doable and the final roughly 0.53 mi as the hardest part; no numeric RPE is assigned. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','warmup','distance',2.31,'distanceUnit','mi','durationSeconds',1200,'paceSeconds',520),
    jsonb_build_object('kind','rep','distance',6,'distanceUnit','mi','durationSeconds',2356,'paceSeconds',393),
    jsonb_build_object('kind','cooldown','distance',1.23,'distanceUnit','mi','durationSeconds',601,'paceSeconds',491)
  )
),
(
  'hope', date '2026-09-29', '6 mi continuous at race pace', 'completed',
  6, 'mi', 2454, null,
  'study-ste-hope-2026-09-29-continuous-6',
  'Backfilled October 13 from the existing Speed That Endures W6 record. Warm-up 20:00 / 2.46 mi at displayed 8:08/mi. Six continuous work miles: 40:53.8, displayed 6:49/mi. Cooldown 10:01.7 / 1.07 mi at displayed 9:25/mi. Total source activity 9.53 mi / 1:10:55.5. Athlete described the session as brutal, with miles three and four hardest; no numeric RPE is assigned. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','warmup','distance',2.46,'distanceUnit','mi','durationSeconds',1200,'paceSeconds',488),
    jsonb_build_object('kind','rep','distance',6,'distanceUnit','mi','durationSeconds',2454,'paceSeconds',409),
    jsonb_build_object('kind','cooldown','distance',1.07,'distanceUnit','mi','durationSeconds',602,'paceSeconds',565)
  )
),

-- Oct 06 · W7 · José only. Hope remained on recovery hold; no result is invented.
(
  'jose', date '2026-10-06', '4 × 2 mi at race pace', 'completed',
  8, 'mi', null, 10,
  'study-ste-jose-2026-10-06-race-pace',
  'Backfilled October 13 from docs/studies/SPEED_THAT_ENDURES_W7_20261006.json. Warm-up 20:00 / 2.26 mi at displayed 8:51/mi. Exact 2 mi reps: 13:24.4, 13:27.0, 13:26.4, 13:24.5. Three 2:00 floats: 0.21 mi at 9:35/mi, 0.19 mi at 10:23/mi, 0.14 mi at 14:18/mi. Cooldown 10:00.4 / 1.01 mi at 9:55/mi. Work total 8 mi / 53:42.3. Total source activity 11.81 mi / 1:29:42.7. RPE 10/10. Piece durations use whole seconds; exact tenths remain in this note. This is a coach import, not a native FORM receipt.',
  jsonb_build_array(
    jsonb_build_object('kind','warmup','distance',2.26,'distanceUnit','mi','durationSeconds',1200,'paceSeconds',531),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','durationSeconds',804,'paceSeconds',402),
    jsonb_build_object('kind','float','distance',0.21,'distanceUnit','mi','durationSeconds',120,'paceSeconds',575),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','durationSeconds',807,'paceSeconds',403),
    jsonb_build_object('kind','float','distance',0.19,'distanceUnit','mi','durationSeconds',120,'paceSeconds',623),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','durationSeconds',806,'paceSeconds',403),
    jsonb_build_object('kind','float','distance',0.14,'distanceUnit','mi','durationSeconds',120,'paceSeconds',858),
    jsonb_build_object('kind','rep','distance',2,'distanceUnit','mi','durationSeconds',805,'paceSeconds',402),
    jsonb_build_object('kind','cooldown','distance',1.01,'distanceUnit','mi','durationSeconds',600,'paceSeconds',595)
  )
);

do $$
declare
  v_coach uuid := auth.uid();
  r record;
  v_athlete uuid;
  v_session uuid;
  v_version uuid;
  v_matches integer;
  v_completion uuid;
begin
  if v_coach is null then
    raise exception 'Brice coach identity not found';
  end if;

  for r in select * from ste_completion_backfill order by performed_on, slug loop
    select a.id into v_athlete
      from public.athletes a
     where a.slug=r.slug and a.active=true;

    if v_athlete is null then
      raise exception 'active athlete % not found', r.slug;
    end if;

    if not public.is_coach_member(v_athlete) then
      raise exception 'coach membership missing for %', r.slug;
    end if;

    select count(*) into v_matches
      from public.planned_sessions ps
      join lateral (
        select pv.*
          from public.planned_session_versions pv
         where pv.planned_session_id=ps.id
         order by pv.version_number desc
         limit 1
      ) latest on true
     where ps.athlete_id=v_athlete
       and ps.scheduled_on=r.performed_on
       and ps.state='published'
       and latest.title=r.session_title;

    if v_matches <> 1 then
      raise exception 'expected one published % session for % on %, found %',
        r.session_title, r.slug, r.performed_on, v_matches;
    end if;

    select ps.id, latest.id
      into v_session, v_version
      from public.planned_sessions ps
      join lateral (
        select pv.*
          from public.planned_session_versions pv
         where pv.planned_session_id=ps.id
         order by pv.version_number desc
         limit 1
      ) latest on true
     where ps.athlete_id=v_athlete
       and ps.scheduled_on=r.performed_on
       and ps.state='published'
       and latest.title=r.session_title;

    -- Exact rerun is a no-op. A different existing filing for the same planned
    -- occurrence is a conflict to review, never something this migration overwrites.
    if exists (
      select 1 from public.session_completions sc
       where sc.athlete_id=v_athlete and sc.evidence_id=r.evidence_id
    ) then
      continue;
    end if;

    if exists (
      select 1 from public.session_completions sc
       where sc.athlete_id=v_athlete and sc.planned_session_id=v_session
    ) then
      raise exception 'planned session % for % already has a completion under another evidence id',
        v_session, r.slug;
    end if;

    insert into public.session_completions(
      athlete_id, planned_session_id, planned_session_version_id,
      status, actual_distance, distance_unit, duration_seconds, rpe,
      athlete_note, source, filed_by, filed_at, evidence_id
    ) values (
      v_athlete, v_session, v_version,
      r.status, r.actual_distance, r.distance_unit, r.duration_seconds, r.rpe,
      r.athlete_note, 'coach_import', v_coach, now(), r.evidence_id
    )
    returning id into v_completion;

    perform public.write_pieces(v_athlete, v_completion, r.pieces);
  end loop;

  if (
    select count(*)
      from public.session_completions sc
     where sc.evidence_id like 'study-ste-%'
  ) < 9 then
    raise exception 'expected at least nine Speed That Endures backfill rows';
  end if;
end $$;
