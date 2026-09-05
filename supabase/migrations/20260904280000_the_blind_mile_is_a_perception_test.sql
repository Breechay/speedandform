-- The Blind Mile is a perception test, and it never said so.
--
-- The cell read "The Blind Mile · 2 mi", and an athlete cannot run that. The
-- completeness audit called it a missing work target, which was half right: the
-- session deliberately has no pace, because the whole idea is that the athlete
-- produces race pace without being told what it is. What was missing was not a
-- band. It was the instruction.
--
-- The intent already said the purpose — "calibrate internal half effort so a
-- dead watch or an obscured display does not erase race execution" — but that
-- is why the session exists, not what to do on the day. Now it says both.
--
-- Deliberately no band on the work component. Adding 6:30–6:45 would make the
-- session eligible evidence, put a number in front of the athlete, and destroy
-- the only thing it measures. What comes back is not the time — it is how
-- closely his perception reproduced race pace without feedback.

do $$
declare
  brice uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
begin
  perform set_config('request.jwt.claims',
    format('{"sub":"%s"}', brice), true);

  perform public.revise_session(s.id,
    'The Blind Mile',
    'Calibrate internal half effort so a dead watch or an obscured display does not erase race execution.',
    'The session had no executable instruction. It has no pace on purpose; it needed the rule that makes it runnable.',
    5.43, 'mi', null, null, null, null,
    'Two miles at what you believe 6:30–6:45 feels like. No watch, no splits, no pace on the screen. Look afterwards.')
    from public.planned_sessions s
    join public.athletes a on a.id = s.athlete_id
    join lateral (select v.* from public.planned_session_versions v
                   where v.planned_session_id = s.id
                   order by v.version_number desc limit 1) v on true
   where a.slug in ('jose', 'hope') and v.title = 'The Blind Mile';
end $$;
