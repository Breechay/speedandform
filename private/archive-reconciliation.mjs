// Date + weekday + active-block publication, never title similarity, owns the
// successor of an archived duplicate. Multiple active candidates are a hold.
export function publishedDayKey(session) {
  if (!session?.scheduled_on) return null;
  return `${session.scheduled_on}:${String(session.day_label || '').slice(0, 3).toLowerCase()}`;
}

export function uniqueActivePublicationByDay(sessions) {
  const live = new Map();
  for (const session of sessions || []) {
    if (session.state !== 'published' || session.withdrawn_at) continue;
    const key = publishedDayKey(session);
    if (!key) continue;
    if (live.has(key)) {
      throw new Error(`More than one active-block publication exists on ${session.scheduled_on} (${session.day_label}); verify ownership before withdrawing older sessions.`);
    }
    live.set(key, session);
  }
  return live;
}
