// A filed result belongs to the immutable prescription version it names, not
// necessarily the newest plan visible today. Never silently move evidence to
// another version: first explain the discrepancy in coach-only reading space.
export function filingVersionContext(session, completion) {
  const current = session?.currentVersion || null;
  if (!session || !completion?.planned_session_id) return { state: 'unlinked', filed: null, current };
  const versionId = completion.planned_session_version_id;
  if (!versionId) return { state: 'unverified', filed: null, current };
  const filed = (session.versions || []).find((version) => version.id === versionId) || null;
  if (!filed) return { state: 'version_unavailable', filed: null, current };
  if (!current || filed.id === current.id) return { state: 'current', filed, current };
  const newestAt = Date.parse(current.created_at || '');
  const resultAt = Date.parse(completion.filed_at || '');
  const currentExistedAtFiling = Number.isFinite(newestAt) && Number.isFinite(resultAt)
    ? newestAt <= resultAt : null;
  return { state: currentExistedAtFiling === true ? 'older_at_filing' : 'revised_after_filing',
    filed, current, currentExistedAtFiling };
}

function workSummary(version) {
  const work = (version?.components || []).find((part) => part.role === 'work');
  if (!work) return String(version?.title || '').trim();
  const n = work.shape === 'repetitions' ? Number(work.repeat_count || 1) : null;
  let measure = '';
  if (work.distance != null) {
    const raw = Number(work.distance);
    measure = work.distance_unit === 'km' && raw < 1
      ? `${Math.round(raw * 1000)}m` : `${raw} ${work.distance_unit || 'mi'}`;
  } else if (work.duration_seconds != null) measure = `${Math.round(work.duration_seconds / 60)} min`;
  return [n && n > 1 ? `${n} ×` : '', measure].filter(Boolean).join(' ') || String(version?.title || '').trim();
}

export function filingVersionExplanation(context) {
  if (context.state === 'older_at_filing') {
    return `This result was filed against version ${context.filed.version_number} (${workSummary(context.filed)}), `
      + `although version ${context.current.version_number} (${workSummary(context.current)}) had already been authored. `
      + 'Check which workout the athlete actually saw and performed before changing any record.';
  }
  if (context.state === 'revised_after_filing') {
    return `This result belongs to version ${context.filed.version_number} (${workSummary(context.filed)}). `
      + `The current prescription is version ${context.current.version_number} (${workSummary(context.current)}). `
      + 'The original filing remains attached to its earlier version.';
  }
  if (context.state === 'unverified') return 'This filing has no recorded prescription version. Do not assume it matched the current plan.';
  if (context.state === 'version_unavailable') return 'The version named by this filing was not returned. The original prescription needs a source check.';
  return '';
}
