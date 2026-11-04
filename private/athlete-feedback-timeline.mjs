// Read-only, provenance-preserving feedback index for the authenticated coach.
// Athlete reports, coaching observations and system signals are different facts.
const SOURCES = {
  athlete_reported: 'Athlete reported',
  coach_observed: 'Coach observed',
  system_detected: 'System detected'
};

export function athleteFeedbackTimeline(rows = [], completions = []) {
  const filed = new Map(completions.map(c => [c.id, c]));
  return rows.slice().sort((a, b) =>
    String(b.observed_on || '').localeCompare(String(a.observed_on || '')) ||
    String(b.created_at || '').localeCompare(String(a.created_at || ''))
  ).map(o => ({
    id: o.id, observed_on: o.observed_on, source: o.source,
    source_label: SOURCES[o.source] || 'Unclassified source',
    facet: o.facet, observation: o.observation,
    direction: o.direction || null, supersedes: o.supersedes || null,
    evidence: (o.evidence_completion_ids || []).map(id => ({
      id, filed_at: filed.get(id)?.filed_at || null,
      state: filed.has(id) ? 'linked_in_recent_read' : 'reference_not_loaded'
    }))
  }));
}
