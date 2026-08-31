-- A session has a body. A note has nowhere to go, and coaching happens in the notes.
--
-- "Run this one outside, afternoon, don't chase the pace" is the whole session for
-- Marcus, and none of it fits in a band, a rep count or a distance. It has had no
-- home on either side.
--
-- One law, and it is the entire value: the note renders exactly as written. No
-- composer, no language guard, no template, no title, no truncation on the surface
-- that shows it in full. The point is that it sounds like Brice standing next to the
-- athlete, and every layer that "improves" it removes the only thing it was for.

alter table public.planned_session_versions
  add column if not exists coach_note text;

comment on column public.planned_session_versions.coach_note is
  'Brice''s words for this session, rendered verbatim in the app. Never composed, never templated, never rewritten by any guard. Versioned with the session under append-only: editing a note is a new version and the athlete sees the current one. Absent renders nothing at all -- no placeholder, no empty header.';

-- ── Marcus's Thursday ───────────────────────────────────────────────────────
--
-- Correction to an earlier report: Marcus is not missing a threshold session. He has
-- the slot, titled Threshold, carrying no authored work -- which is true of every
-- Speed and Threshold session for all three athletes, 33 of them. His is the one
-- being authored now because he is the one who needs it.
--
-- Kilometres, not miles. A mile of threshold in Miami in September is six minutes of
-- continuous suffering with no exit, and if he bails at 800m the session teaches him
-- he was right to be afraid of it. Four minutes he finishes. Then he finishes six of
-- them, and the record says hard outdoors is survivable.
--
-- Advancement is completion of the full rep count outdoors, never pace. A shortened
-- session repeats rather than progresses.
--
-- Outdoor and the afternoon heat window cannot be typed on a prescription today --
-- there is no facility or time-of-day field on a component, only on a filed receipt.
-- So they live in the note, which is what the note is for.
do $$
declare
  target uuid;
  latest record;
  new_version uuid;
begin
  select ps.id into target
    from public.planned_sessions ps
    join public.athletes a on a.id = ps.athlete_id
    join public.training_weeks w on w.id = ps.week_id
    join public.training_blocks b on b.id = w.block_id and b.status = 'active'
    join lateral (select * from public.planned_session_versions pv
                   where pv.planned_session_id = ps.id
                   order by version_number desc limit 1) v on true
   where a.slug = 'marcus' and w.week_number = 3 and v.title = 'Threshold'
   limit 1;

  if target is null then raise exception 'Marcus has no W3 Threshold slot to author'; end if;

  select * into latest from public.planned_session_versions
   where planned_session_id = target order by version_number desc limit 1;

  insert into public.planned_session_versions
    (athlete_id, planned_session_id, version_number, title, prescribed_distance,
     distance_unit, intent, details, change_reason, authored_by,
     pace_low, pace_high, coach_note)
  values (latest.athlete_id, target, latest.version_number + 1, '4 × 1 km',
          4.0, 'km', latest.intent,
          'Four kilometre repeats with three minutes easy between.',
          'Authored the Thursday slot, which carried a title and no work. Kilometres rather than miles: a mile of threshold in this heat is six minutes with no exit, and a session he bails out of teaches him he was right to avoid it. He advances on completing all four outdoors, not on pace.',
          latest.authored_by, '6:25', '6:30',
          'Run this one outside. Track or road, not the treadmill. Afternoon if you can — the heat is the point, not the pace. Four reps, and if the pace is off because it''s hot, that''s fine. Finishing all four outdoors is the session.')
  returning id into new_version;

  insert into public.planned_session_components
    (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
     pace_low, pace_high, pace_low_seconds, pace_high_seconds,
     recovery_seconds, recovery_kind, rpe_source)
  values (latest.athlete_id, new_version, 1, 'work', 'repetitions', 4, 1.0, 'km',
          '6:25', '6:30', 385, 390, 180, 'easy', 'authored');

  raise notice 'Marcus W3 Thursday authored with a coach note';
end $$;

-- What the console should be able to see: sessions carrying a title and no work.
create or replace function public.sessions_without_anatomy(p_slug text)
returns table (week_number smallint, scheduled_on date, title text)
language sql stable as $$
  select w.week_number, ps.scheduled_on, v.title
    from public.planned_sessions ps
    join public.athletes a on a.id = ps.athlete_id
    join public.training_weeks w on w.id = ps.week_id
    join public.training_blocks b on b.id = w.block_id and b.status = 'active'
    join lateral (select * from public.planned_session_versions pv
                   where pv.planned_session_id = ps.id
                   order by pv.version_number desc limit 1) v on true
    left join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
   where a.slug = p_slug and ps.state <> 'cancelled' and k.id is null
   order by w.week_number, ps.scheduled_on;
$$;

comment on function public.sessions_without_anatomy is
  'Sessions carrying a title and no authored work. The athlete opens these to a name and nothing else. Reports; never fills them -- what a Speed session is made of is coaching only Brice can write.';
