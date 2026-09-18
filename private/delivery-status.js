export function deliveryOverviewFor(athlete, {
  athleteMemberships = [], invites = [], assignments = [], blocks = [],
  formReceipts = [], forgeReceipts = [], now = Date.now()
} = {}) {
  const activeMembership = athleteMemberships.find((item) =>
    item.role === 'athlete' && item.status === 'active');
  const openInvite = invites.find((item) => item.role === 'athlete'
    && !item.claimed_at
    && (!item.expires_at || new Date(item.expires_at).getTime() > now));
  const assignment = assignments.slice().sort((a, b) =>
    String(b.assigned_at || '').localeCompare(String(a.assigned_at || '')))[0] || null;
  const block = blocks.find((item) => item.status === 'active') || blocks[0] || null;
  const words = [athlete?.program_name, athlete?.account_label].filter(Boolean).join(' ').toLowerCase();
  const strength = /forge|sculpt|strength|physique|runner\s+mass/.test(words);
  const hasWebFallback = athlete?.slug === 'adrian' && /runner\s+mass/.test(words);

  const accountState = activeMembership ? 'linked' : openInvite ? 'invited' : 'not_linked';
  const accountLabel = activeMembership ? 'Account linked' : openInvite ? 'Invite pending' : 'No athlete account';

  const trainingState = assignment ? 'assigned_plan' : block ? 'coach_block' : hasWebFallback ? 'web_fallback' : 'not_published';
  const trainingLabel = assignment ? 'Assigned plan'
    : block ? (block.name || 'Coach-authored block')
    : hasWebFallback ? 'Web fallback'
    : 'No private plan';

  const recordingTarget = strength && (athlete?.delivery === 'app' || hasWebFallback)
    ? 'Forge'
    : athlete?.delivery === 'app' ? 'FORM' : 'Coach direct';
  const nativeReceipt = recordingTarget === 'Forge'
    ? forgeReceipts.slice().sort((a, b) => String(b.received_at || '').localeCompare(String(a.received_at || '')))[0] || null
    : recordingTarget === 'FORM'
      ? formReceipts.slice().sort((a, b) => String(b.filed_at || '').localeCompare(String(a.filed_at || '')))[0] || null
      : null;
  const receiptState = recordingTarget === 'Coach direct' ? 'not_required' : nativeReceipt ? 'proven' : 'not_proven';
  const receiptLabel = receiptState === 'proven' ? 'Native receipt proven'
    : receiptState === 'not_required' ? 'Native receipt not required'
    : 'Native receipt not yet proven';

  return {
    accountState, accountLabel, trainingState, trainingLabel,
    recordingTarget, receiptState, receiptLabel,
    hasWebFallback, assignment, block, nativeReceipt
  };
}
