// Staff is a read-only lens over existing authorized sources, not a task engine.
export function staffSnapshot(board, filing, roster) {
  const items = Array.isArray(board?.items) ? board.items : [];
  const open = items.filter(x => x.kind === 'task' && !['done', 'cancelled'].includes(x.status));
  const agentQueue = open.filter(x => x.actor === 'agent');
  const coachQueue = Array.isArray(board?.coach_tasks) ? board.coach_tasks : [];
  const athletes = roster?.available && Array.isArray(roster.athletes) ? roster.athletes : null;
  const weekExceptions = athletes?.filter(x => ['needs_review', 'missing_week'].includes(x.state)) ?? null;
  const filings = filing?.available && Array.isArray(filing.filings) ? filing.filings : null;
  const filingExceptions = filings?.filter(x =>
    ['missing_source_post', 'post_revoked', 'sharing_not_enabled', 'no_linked_account', 'before_sharing_enabled', 'privacy_conflict', 'unmatched_filing'].includes(x.feed_state) || x.week_state === 'unmatched_filing') ?? null;
  const sources = Array.isArray(board?.sources) ? board.sources : [];
  const incompleteSources = sources.filter(x => ['stale', 'conflict', 'unavailable', 'pending', 'unchecked'].includes(x.state || x.status));
  const done = items.filter(x => x.status === 'done').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 5);
  return {agentQueue, coachQueue, weekExceptions, filingExceptions, incompleteSources, done};
}
