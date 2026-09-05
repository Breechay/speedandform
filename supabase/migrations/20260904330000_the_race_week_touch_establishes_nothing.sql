-- The race-week touch establishes nothing, and my repair said it did.
--
-- The previous migration restored eligibility by tagging every untagged work
-- component at 6:30–6:45 — which is the same shape-matching heuristic the whole
-- eligibility model exists to abolish, applied by me, one migration after
-- writing that a component counts because someone said it counts.
--
-- It caught W15 Tuesday's `3 × 5 min at race pace`, which Brice ruled explicitly
-- must not move the ladder: race week is touching the system, not testing
-- ownership. Three five-minute repetitions cannot establish a continuous
-- distance and should never have been able to claim one.
--
-- It also caught the two cancelled Tuesdays. Harmless — mark_established_value
-- excludes cancelled prescriptions — but they are withdrawn work and should not
-- be pointing at a mark.

update public.planned_session_components c
   set counts_toward_mark_id = null
  from public.planned_session_versions v,
       public.planned_sessions s
 where c.version_id = v.id
   and v.planned_session_id = s.id
   and c.counts_toward_mark_id is not null
   and (s.scheduled_on = date '2026-12-01' or s.state = 'cancelled');
