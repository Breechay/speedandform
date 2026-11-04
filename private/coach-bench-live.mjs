// The Coach bench and Week rail must describe the current published prescription.
// Withdrawn work remains in the immutable record, never in the next-session queue.
export const isPublishedPlanSession = (session) => session?.state === 'published';

// A real unfilled coach hold is visible when nothing replaced it that day.
// Superseded and historical withdrawals do not shadow a published replacement.
export function visibleHeldCoachSessions(sessions, date, coachView) {
  if (!coachView || sessions.some((session) =>
    session.scheduled_on === date && isPublishedPlanSession(session))) return [];
  return sessions.filter((session) =>
    session.scheduled_on === date
    && session.state === 'cancelled'
    && session.withdrawn_at
    && !/^superseded by /i.test(session.withdrawn_reason || ''));
}
