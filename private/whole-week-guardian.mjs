// Read-only interpretation of one authorized athlete brief. This is a triage
// layer, not an alternate prescription, injury rule or automatic plan editor.
const HIGH_RPE = 7;

export function wholeWeekGuardian(brief) {
  const findings = [];
  const athleteId = brief?.athlete?.id || null;
  const sessions = (brief?.upcoming_sessions || []).filter(s => s.state === 'published');
  const add = (code, owner, severity, message, sources = []) =>
    findings.push({ code, owner, severity, message, sources });

  if (!athleteId || !brief?.read_at) {
    add('source_missing', 'agent', 'unknown', 'Current authorized athlete brief unavailable. Do not certify a plan.', []);
    return { schema_version: 1, athlete_id: athleteId, read_at: brief?.read_at || null,
      findings, checks: { day_collisions: 'unknown', week_story: 'unknown', paired_strength: 'unknown' } };
  }

  const byDay = new Map();
  for (const s of sessions) {
    if (!s.scheduled_on) {
      add('undated_session', 'agent', 'warning', 'A published session has no date; check its owning week.', [s.id]);
      continue;
    }
    const slot = byDay.get(s.scheduled_on) || [];
    slot.push(s);
    byDay.set(s.scheduled_on, slot);
    if (!s.version_id) add('missing_version', 'agent', 'block', 'Published session has no version.', [s.id]);
  }
  for (const [date, day] of byDay) {
    if (day.length > 1) {
      // Double sessions may be deliberate. The guardian asks; it never deletes.
      add('multiple_runs_same_day', 'coach', 'review', `${day.length} published running sessions on ${date}; confirm intentional stacking.`, day.map(s => s.id));
    }
  }

  const hard = sessions.filter(s => s.scheduled_on && (s.is_key || Number(s.rpe_high) >= HIGH_RPE))
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on));
  for (let i = 1; i < hard.length; i++) {
    const previous = hard[i - 1], current = hard[i];
    const spacing = Math.round((Date.parse(`${current.scheduled_on}T12:00:00Z`) -
      Date.parse(`${previous.scheduled_on}T12:00:00Z`)) / 86400000);
    if (spacing <= 1) add('consecutive_key_demands', 'coach', 'review',
      'Key or high-effort runs are on adjacent days; verify the planned purpose and recovery cost.', [previous.id, current.id]);
  }

  if (!brief.current_week) add('current_week_missing', 'agent', 'warning',
    'No current Week was returned; check dates and the active block.', [brief.active_block?.id].filter(Boolean));
  else if (brief.current_week.story_current === false) add('week_story_stale', 'agent', 'maintenance',
    'The Week story is stale. Reauthor against the latest published sessions.', [brief.current_week.id]);

  // A receipt proves only that Forge sent a receipt, not that the coming
  // strength program was fetched or evaluated against run load.
  add('paired_strength_unverified', 'agent', 'unknown',
    'The coming seven-day Forge strength prescription has not been compared.',
    (brief.forge_receipts || []).map(r => r.id).filter(Boolean).slice(0, 5));

  return { schema_version: 1, athlete_id: athleteId, read_at: brief.read_at,
    findings, checks: { day_collisions: 'checked_upcoming_window',
      week_story: brief.current_week ? 'checked_current_week' : 'unknown',
      paired_strength: 'unknown' } };
}
