-- The five sessions an athlete could not have run.
--
-- The completeness audit found four with no target at all and two whose opening
-- block was an unlabelled duration. Brice asked me to make these as a coaching
-- partner rather than bring them back as questions, so these are decisions and
-- they are all reversible through the same revision path.
--
-- Each is derived from what this block already establishes about this athlete —
-- race pace 6:30–6:45, threshold ≈6:15, easy 8:45 or slower — rather than from a
-- textbook. Nothing here is faster than a number the block already contains a
-- reason for.

do $$
declare
  brice uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
  reason text;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s"}', brice), true);

  -- ── HILLS + STRIDES ──────────────────────────────────────────────────────
  -- A twelve-second hill has no pace; asking for one would be theatre. Effort is
  -- the instrument, and the two halves want different efforts: the hills are
  -- hard and the strides are fast, which is not the same thing. RPE 8–9 on the
  -- hill, 7–8 on the stride, and the rule says the part people get wrong —
  -- strides are relaxed speed, and a stride run as an effort is a sixth hill.
  reason := 'The session had no target of any kind. A twelve-second hill has no pace, so effort is the instrument — and the hills and the strides want different efforts.';
  perform public.revise_session(s.id, 'Hills + strides', null, reason,
    5.02, 'mi', null, null, null,
    '[{"role":"warm_up","shape":"continuous","position":1,"durationSeconds":1500},
      {"role":"work","shape":"repetitions","position":2,"durationSeconds":12,"repeatCount":8,
       "recoveryKind":"standing","recoverySeconds":180,"rpeLow":8,"rpeHigh":9},
      {"role":"work","shape":"repetitions","position":3,"durationSeconds":20,"repeatCount":4,
       "recoveryKind":"easy","recoverySeconds":60,"rpeLow":7,"rpeHigh":8},
      {"role":"cool_down","shape":"continuous","position":4,"durationSeconds":780}]'::jsonb,
    'Hard up the hill, walk down, start each one rested. The strides are relaxed speed, not effort — a stride run hard is a ninth hill.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id order by v.version_number desc limit 1) v on true
   where a.slug in ('jose','hope') and v.title = 'Hills + strides';

  -- ── VO₂ INTERVALS ────────────────────────────────────────────────────────
  -- "Raise the ceiling the half is run just beneath." The ceiling is threshold,
  -- ≈6:15. Three-minute repetitions sit above it: 5:50–6:00 is twenty seconds a
  -- mile faster than threshold and thirty-five faster than race pace. Fast
  -- enough to be a different system, slow enough that five of them are
  -- repeatable — which is what a ceiling session has to be.
  reason := 'The session had no target. Derived from this block''s own threshold of about 6:15 rather than a textbook: three-minute repetitions sit above threshold, not at it.';
  perform public.revise_session(s.id, 'VO₂ intervals', null, reason,
    6.29, 'mi', null, null, null,
    '[{"role":"warm_up","shape":"continuous","position":1,"durationSeconds":1200},
      {"role":"work","shape":"repetitions","position":2,"durationSeconds":180,"repeatCount":5,
       "paceLowSeconds":350,"paceHighSeconds":360,"recoveryKind":"jog","recoverySeconds":150},
      {"role":"cool_down","shape":"continuous","position":3,"durationSeconds":600}]'::jsonb,
    'If the fifth is slower than the first, the first was too fast.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id order by v.version_number desc limit 1) v on true
   where a.slug in ('jose','hope') and v.title = 'VO₂ intervals';

  -- ── VO₂ TOUCH ────────────────────────────────────────────────────────────
  -- "Volume is cut; speed is not." Same band as the intervals, two weeks out,
  -- three reps instead of five. The strides after it keep their own effort.
  reason := 'The session had no target. Same band as the VO₂ intervals it maintains — the intent says volume is cut and speed is not, so the pace does not move.';
  perform public.revise_session(s.id, 'VO₂ touch', null, reason,
    4.61, 'mi', null, null, null,
    '[{"role":"warm_up","shape":"continuous","position":1,"durationSeconds":1200},
      {"role":"work","shape":"repetitions","position":2,"durationSeconds":120,"repeatCount":3,
       "paceLowSeconds":350,"paceHighSeconds":360,"recoveryKind":"standing","recoverySeconds":180},
      {"role":"work","shape":"repetitions","position":3,"durationSeconds":20,"repeatCount":4,
       "recoveryKind":"easy","recoverySeconds":60,"rpeLow":7,"rpeHigh":8},
      {"role":"cool_down","shape":"continuous","position":4,"durationSeconds":600}]'::jsonb,
    'Two weeks out. Sharp, short, and finished long before it costs anything.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id order by v.version_number desc limit 1) v on true
   where a.slug in ('jose','hope') and v.title = 'VO₂ touch';

  -- ── PRESSURE TO PACE ─────────────────────────────────────────────────────
  -- "Preserve half pace after consequential non-threshold cost." The opening
  -- thirty minutes is the cost, and it was an unlabelled duration — so an
  -- athlete would have run it easy and the session would have measured nothing.
  -- Steady, 7:15–7:30: costly enough to matter, well clear of threshold, so the
  -- race-pace work that follows is genuinely arriving on tired legs.
  reason := 'The opening thirty minutes was an unlabelled duration, so it would have been run easy and the session would have measured nothing. It is the cost the name refers to: steady, not easy, and deliberately not threshold.';
  perform public.revise_session(s.id, 'Pressure to Pace', null, reason,
    8.72, 'mi', null, null, null,
    '[{"role":"work","shape":"continuous","position":1,"durationSeconds":1800,
       "paceLowSeconds":435,"paceHighSeconds":450},
      {"role":"work","shape":"repetitions","position":2,"durationSeconds":480,"repeatCount":3,
       "paceLowSeconds":390,"paceHighSeconds":405,"recoveryKind":"float","recoverySeconds":120},
      {"role":"cool_down","shape":"continuous","position":3,"durationSeconds":600}]'::jsonb,
    'The first thirty minutes are the point. Arrive at race pace already tired.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id order by v.version_number desc limit 1) v on true
   where a.slug in ('jose','hope') and v.title = 'Pressure to Pace';

  -- ── DURABILITY READ ──────────────────────────────────────────────────────
  -- "A standardised late-half read, at lower cost than the session that built
  -- it." Same steady band, twenty minutes instead of thirty, two race-pace
  -- pieces instead of three. Standardised means it must be repeatable and
  -- comparable — which it cannot be if the opening block is left to
  -- interpretation.
  reason := 'Same fix as Pressure to Pace, and it matters more here: a read that is meant to be standardised cannot have an opening block left to interpretation. Twenty minutes at the same steady band, which is the lower cost the intent asks for.';
  perform public.revise_session(s.id, 'Durability Read', null, reason,
    6.12, 'mi', null, null, null,
    '[{"role":"work","shape":"continuous","position":1,"durationSeconds":1200,
       "paceLowSeconds":435,"paceHighSeconds":450},
      {"role":"work","shape":"repetitions","position":2,"durationSeconds":480,"repeatCount":2,
       "paceLowSeconds":390,"paceHighSeconds":405,"recoveryKind":"jog","recoverySeconds":120},
      {"role":"cool_down","shape":"continuous","position":3,"durationSeconds":600}]'::jsonb,
    'Run it the same way every time. It is a measurement, not a workout.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id order by v.version_number desc limit 1) v on true
   where a.slug in ('jose','hope') and v.title = 'Durability Read';
end $$;
