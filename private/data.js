import { supabase } from './supabase-client.js';

function result(data, error) {
  if (error) throw error;
  return data || [];
}

export async function loadCoachRoster(coachMemberships) {
  const athleteIds = coachMemberships.map((item) => item.athlete_id);
  if (!athleteIds.length) return [];
  const [attentionResponse, markResponse, checkpointResponse, confidenceResponse] = await Promise.all([
    supabase.from('coach_attention').select('*').in('athlete_id', athleteIds)
      .order('priority').order('occurred_at', { ascending: false, nullsFirst: false }),
    supabase.from('athlete_marks').select('*').in('athlete_id', athleteIds).eq('active', true).eq('is_primary', true),
    supabase.from('mark_checkpoints').select('*').in('athlete_id', athleteIds).order('position'),
    supabase.from('mark_standing_confidence').select('*').in('athlete_id', athleteIds)
  ]);
  if (attentionResponse.error) throw attentionResponse.error;
  if (markResponse.error) throw markResponse.error;
  if (checkpointResponse.error) throw checkpointResponse.error;
  const attention = attentionResponse.data || [];
  // Ordered by what actually needs the coach, not by a stored priority column.
  return coachMemberships.map((membership) => {
    const items = attention.filter((item) => item.athlete_id === membership.athlete_id);
    return {
      ...membership.athletes,
      membership,
      attention: items,
      topItem: items[0] || null,
      mark: (() => {
        const mark = markResponse.data?.find((item) => item.athlete_id === membership.athlete_id) || null;
        return mark
          ? {
              ...mark,
              checkpoints: (checkpointResponse.data || []).filter((point) => point.mark_id === mark.id),
              confidence: (confidenceResponse.data || []).find((read) => read.mark_id === mark.id) || null
            }
          : null;
      })()
    };
  });
  // Roster order is stable. Attention sorts the queue, never the navigation:
  // tabs that rearrange themselves whenever an exception opens or closes teach
  // the coach that position means nothing, and the position is how you find
  // someone. The attention is shown on the tab instead of moving it.
}

export async function loadAttentionFor(athleteId) {
  const { data, error } = await supabase.from('coach_attention').select('*')
    .eq('athlete_id', athleteId).order('priority').order('occurred_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function loadAthleteRecord(athleteId, { coach = false } = {}) {
  const queries = [
    supabase.from('athletes').select('*').eq('id', athleteId).single(),
    supabase.from('training_blocks').select('*').eq('athlete_id', athleteId).eq('status', 'active').maybeSingle(),
    supabase.from('training_weeks').select('*').eq('athlete_id', athleteId).order('week_number', { ascending: false }),
    supabase.from('planned_sessions').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('planned_session_versions').select('*').eq('athlete_id', athleteId).order('version_number', { ascending: false }),
    supabase.from('planned_session_components').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('athlete_baselines').select('*').eq('athlete_id', athleteId).order('captured_at', { ascending: false }),
    supabase.from('session_completions').select('*').eq('athlete_id', athleteId).order('filed_at', { ascending: false }),
    supabase.from('directions').select('*').eq('athlete_id', athleteId).in('delivery_state', ['published', 'delivered_externally']).order('published_at', { ascending: false }),
    supabase.from('reads').select('*').eq('athlete_id', athleteId).in('delivery_state', ['published', 'delivered_externally']).order('published_at', { ascending: false }),
    supabase.from('decisions').select('*').eq('athlete_id', athleteId).in('delivery_state', ['published', 'delivered_externally']).order('effective_on', { ascending: false }),
    supabase.from('athlete_marks').select('*').eq('athlete_id', athleteId).eq('active', true).order('is_primary', { ascending: false }),
    supabase.from('mark_signals').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('mark_checkpoints').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('mark_gate_conditions').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('movement_reads').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('support_prescriptions').select('*').eq('athlete_id', athleteId).eq('active', true).maybeSingle(),
    supabase.from('support_items').select('*').eq('athlete_id', athleteId).order('group_position').order('item_position'),
    // The three mechanical verdicts, and the pieces they were computed from. The
    // easy pace matters as much as the verdict: 10:01 is only evidence of resting
    // next to her own 8:48.
    supabase.from('session_verdicts').select('*').eq('athlete_id', athleteId),
    supabase.from('session_pieces').select('*').eq('athlete_id', athleteId).order('position'),
    supabase.from('mark_standing_judgments').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: false }),
    supabase.from('mark_judgment_completions').select('*'),
    supabase.from('mark_confidence_reads').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: false }),
    supabase.from('mark_confidence_completions').select('*'),
    supabase.from('completion_evidence').select('*').eq('athlete_id', athleteId).order('created_at'),
    // What confidence.v1 proposes and nobody has answered yet. Never a standing
    // score: the Console shows it as a number to review, and only a decision writes.
    supabase.from('mark_open_confidence_proposal').select('*').eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
  ];

  if (coach) {
    queries.push(
      supabase.from('coach_tasks').select('*').eq('athlete_id', athleteId).is('resolved_at', null).maybeSingle(),
      supabase.from('coach_task_evidence').select('*').eq('athlete_id', athleteId).order('position'),
      supabase.from('coach_task_actions').select('*').eq('athlete_id', athleteId).order('position'),
      supabase.from('coach_private_notes').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: false }),
      supabase.from('coach_admin_status').select('*').eq('athlete_id', athleteId).maybeSingle()
    );
  }

  const responses = await Promise.all(queries);
  responses.forEach(({ error }) => { if (error) throw error; });

  const [
    athleteResponse, blockResponse, weeksResponse, sessionsResponse, versionsResponse,
    componentsResponse, baselinesResponse, completionsResponse, directionsResponse, readsResponse,
    decisionsResponse, marksResponse, signalsResponse, checkpointsResponse,
    gatesResponse, movementResponse, supportResponse, supportItemsResponse,
    verdictsResponse, piecesResponse, judgmentsResponse, judgmentLinksResponse,
    confidenceResponse, confidenceLinksResponse, evidenceFilesResponse, proposalResponse,
    taskResponse, evidenceResponse, actionsResponse, privateNotesResponse, adminResponse
  ] = responses;

  const components = result(componentsResponse.data, componentsResponse.error);
  const versions = result(versionsResponse.data, versionsResponse.error)
    .map((version) => ({
      ...version,
      components: components.filter((item) => item.version_id === version.id)
        .sort((a, b) => a.position - b.position)
    }));
  const sessions = result(sessionsResponse.data, sessionsResponse.error).map((session) => ({
    ...session,
    versions: versions.filter((version) => version.planned_session_id === session.id),
    currentVersion: versions.find((version) => version.planned_session_id === session.id) || null
  }));

  const marks = result(marksResponse.data, marksResponse.error).map((mark) => ({
    ...mark,
    signals: result(signalsResponse.data, signalsResponse.error).filter((item) => item.mark_id === mark.id),
    checkpoints: result(checkpointsResponse.data, checkpointsResponse.error).filter((item) => item.mark_id === mark.id),
    gates: result(gatesResponse.data, gatesResponse.error).filter((item) => item.mark_id === mark.id),
    evidence_surface_requirement: mark.evidence_surface_requirement || 'any'
  }));

  const task = taskResponse?.data || null;
  const weeks = result(weeksResponse.data, weeksResponse.error);
  // "Current" is the week in progress, or the one today falls inside — not the
  // highest week number, which becomes week 8 the moment a block is authored ahead.
  const today = new Date().toISOString().slice(0, 10);
  const currentWeek =
    weeks.find((week) => week.state === 'in_progress')
    || weeks.find((week) => week.starts_on && week.ends_on && week.starts_on <= today && today <= week.ends_on)
    || weeks.slice().sort((a, b) => a.week_number - b.week_number).find((week) => week.state !== 'complete')
    || weeks[0] || null;
  const nextWeek = currentWeek
    ? weeks.filter((week) => week.week_number > currentWeek.week_number)
        .sort((a, b) => a.week_number - b.week_number)[0] || null
    : null;
  return {
    athlete: athleteResponse.data,
    block: blockResponse.data,
    weeks,
    currentWeek,
    nextWeek,
    // Sessions belong to a week. Rendering them unfiltered puts the whole block
    // on one screen the moment more than one week exists.
    currentSessions: currentWeek ? sessions.filter((item) => item.week_id === currentWeek.id) : sessions,
    sessionsByWeek: weeks.reduce((map, week) => {
      map[week.id] = sessions.filter((item) => item.week_id === week.id);
      return map;
    }, {}),
    nextSessions: nextWeek ? sessions.filter((item) => item.week_id === nextWeek.id) : [],
    sessions,
    baselines: result(baselinesResponse.data, baselinesResponse.error),
    completions: result(completionsResponse.data, completionsResponse.error),
    directions: result(directionsResponse.data, directionsResponse.error),
    reads: result(readsResponse.data, readsResponse.error),
    decisions: result(decisionsResponse.data, decisionsResponse.error),
    marks,
    primaryMark: marks.find((mark) => mark.is_primary) || marks[0] || null,
    movementReads: result(movementResponse.data, movementResponse.error),
    support: supportResponse.data,
    supportItems: result(supportItemsResponse.data, supportItemsResponse.error),
    verdicts: result(verdictsResponse.data, verdictsResponse.error),
    confidenceReads: result(confidenceResponse.data, confidenceResponse.error).map((read) => ({
      ...read,
      completionIds: result(confidenceLinksResponse.data, confidenceLinksResponse.error)
        .filter((link) => link.read_id === read.id).map((link) => link.completion_id)
    })),
    evidenceFiles: await signEvidence(result(evidenceFilesResponse.data, evidenceFilesResponse.error)),
    // The newest proposal nobody has answered. One per mark by construction, so the
    // primary mark's is the one the instrument shows.
    confidenceProposal: result(proposalResponse.data, proposalResponse.error)[0] || null,
    pieces: result(piecesResponse.data, piecesResponse.error),
    judgments: result(judgmentsResponse.data, judgmentsResponse.error).map((judgment) => ({
      ...judgment,
      completionIds: result(judgmentLinksResponse.data, judgmentLinksResponse.error)
        .filter((link) => link.judgment_id === judgment.id).map((link) => link.completion_id)
    })),
    task,
    taskEvidence: task ? result(evidenceResponse?.data, evidenceResponse?.error).filter((item) => item.task_id === task.id) : [],
    taskActions: task ? result(actionsResponse?.data, actionsResponse?.error).filter((item) => item.task_id === task.id) : [],
    privateNotes: result(privateNotesResponse?.data, privateNotesResponse?.error),
    adminStatus: adminResponse?.data || null
  };
}

export async function fileSession(payload, evidenceFile = null) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before filing a session.');

  const { data: completion, error } = await supabase
    .from('session_completions')
    .insert({
      athlete_id: payload.athleteId,
      planned_session_id: payload.plannedSessionId || null,
      status: payload.status,
      actual_distance: payload.actualDistance || null,
      distance_unit: payload.distanceUnit || 'mi',
      duration_seconds: payload.durationSeconds || null,
      felt: payload.felt || null,
      knee_during: payload.kneeDuring || null,
      knee_after: payload.kneeAfter || null,
      recovered_next_day: payload.recoveredNextDay,
      athlete_note: payload.athleteNote || null,
      strava_url: payload.stravaUrl || null,
      source: 'athlete',
      filed_by: user.id
    })
    .select('*')
    .single();
  if (error) throw error;

  if (evidenceFile) await uploadEvidence(payload.athleteId, completion.id, evidenceFile, user.id);
  return completion;
}

export async function updateCompletion(completionId, payload) {
  const { data, error } = await supabase
    .from('session_completions')
    .update({
      status: payload.status,
      actual_distance: payload.actualDistance || null,
      distance_unit: payload.distanceUnit || 'mi',
      duration_seconds: payload.durationSeconds || null,
      felt: payload.felt || null,
      knee_during: payload.kneeDuring || null,
      knee_after: payload.kneeAfter || null,
      recovered_next_day: payload.recoveredNextDay,
      athlete_note: payload.athleteNote || null,
      strava_url: payload.stravaUrl || null
    })
    .eq('id', completionId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function uploadEvidence(athleteId, completionId, file, userId) {
  const extension = String(file.name || 'evidence').split('.').pop().replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const path = `${athleteId}/${userId}/${completionId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('session-evidence').upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await supabase.from('completion_evidence').insert({
    athlete_id: athleteId,
    completion_id: completionId,
    storage_path: path,
    created_by: userId
  });
  if (error) throw error;
}

export async function resolveCoachTask(taskId, actionId = null, custom = null) {
  const { data, error } = await supabase.rpc('resolve_coach_task', {
    target_task_id: taskId,
    target_action_id: actionId,
    custom_athlete_text: custom?.athleteText || null,
    custom_rationale: custom?.rationale || null
  });
  if (error) throw error;
  return data;
}

export async function addPrivateNote(athleteId, body) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { data, error } = await supabase.from('coach_private_notes').insert({
    athlete_id: athleteId,
    body: String(body || '').trim(),
    authored_by: user.id
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function createDirection(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { data, error } = await supabase.from('directions').insert({
    athlete_id: payload.athleteId,
    planned_session_id: payload.plannedSessionId,
    protected_variable: payload.protectedVariable,
    movable_variable: payload.movableVariable || null,
    stop_or_change_if: payload.stopOrChangeIf || null,
    priority_targets: payload.priorityTargets,
    execution_context: payload.executionContext || {},
    athlete_text: payload.athleteText,
    delivery_state: payload.deliveryState || 'published',
    delivered_wording: payload.deliveredWording || null,
    authored_by: user.id,
    published_at: new Date().toISOString()
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function createRead(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { data, error } = await supabase.from('reads').insert({
    athlete_id: payload.athleteId,
    athlete_text: payload.athleteText,
    question_answered: payload.questionAnswered,
    delivery_state: payload.deliveryState || 'published',
    delivered_wording: payload.deliveredWording || null,
    authored_by: user.id,
    published_at: new Date().toISOString()
  }).select('*').single();
  if (error) throw error;
  if (payload.completionIds?.length) {
    const { error: linkError } = await supabase.from('read_completions').insert(
      payload.completionIds.map((completionId) => ({ read_id: data.id, completion_id: completionId }))
    );
    if (linkError) throw linkError;
  }
  return data;
}

export async function publishRecordExcerpt(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { data: previous, error: previousError } = await supabase
    .from('record_publications')
    .select('revision')
    .eq('publication_slug', payload.publicationSlug)
    .order('revision', { ascending: false })
    .limit(1);
  if (previousError) throw previousError;
  const revision = (previous?.[0]?.revision || 0) + 1;
  const { data, error } = await supabase.from('record_publications').insert({
    athlete_id: payload.athleteId,
    publication_slug: payload.publicationSlug,
    revision,
    athlete_display_name: payload.athleteDisplayName,
    headline: payload.headline,
    mark_label: payload.markLabel,
    mark_value: payload.markValue,
    summary: payload.summary,
    consent_recorded_at: payload.consentRecordedAt,
    consent_note: payload.consentNote,
    published_at: new Date().toISOString(),
    created_by: user.id
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function loadPublication(slug) {
  const { data, error } = await supabase
    .from('record_publications')
    .select('athlete_display_name, headline, mark_label, mark_value, summary, publication_slug, revision, published_at')
    .eq('publication_slug', slug)
    .not('published_at', 'is', null)
    .is('revoked_at', null)
    .order('revision', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Sign-in is passwordless, so there is no password to change. The email is the
// identity, and Supabase confirms a change from the new address before it
// takes effect.
export async function changeEmail(nextEmail, returnTo = '/athlete/') {
  const normalized = String(nextEmail || '').trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('Enter a valid email address.');
  const { error } = await supabase.auth.updateUser(
    { email: normalized },
    { emailRedirectTo: `${window.location.origin}/auth/record-callback/?return_to=${encodeURIComponent(returnTo)}` }
  );
  if (error) throw error;
  return normalized;
}

// Authoring a key session. Until now this only happened in SQL migrations, which
// meant every Tuesday cost a deploy. A session is a planned_session plus its first
// version; revising it appends a version rather than editing one, so the band a
// verdict was judged against is still there after the band moves.
export async function authorSession(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before authoring a session.');

  const { data: session, error: sessionError } = await supabase
    .from('planned_sessions')
    .insert({
      athlete_id: payload.athleteId,
      week_id: payload.weekId,
      scheduled_on: payload.scheduledOn || null,
      day_label: payload.dayLabel,
      position: payload.position,
      state: payload.state || 'published',
      created_by: user.id
    })
    .select('*')
    .single();
  if (sessionError) throw sessionError;

  const version = await writeVersion(session.id, payload, 1, user.id);
  return { ...session, versions: [version], currentVersion: version };
}

export async function reviseSession(plannedSessionId, payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before revising a session.');
  if (!payload.changeReason) throw new Error('A revision needs a reason. It is the part that is still legible in six weeks.');

  // Ask for the highest version rather than counting: a concurrent revision would
  // make a count wrong, and the unique constraint would reject the write anyway.
  const { data: latest, error: latestError } = await supabase
    .from('planned_session_versions')
    .select('version_number')
    .eq('planned_session_id', plannedSessionId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;

  return writeVersion(plannedSessionId, payload, (latest?.version_number || 0) + 1, user.id);
}

async function writeVersion(plannedSessionId, payload, versionNumber, userId) {
  const { data, error } = await supabase
    .from('planned_session_versions')
    .insert({
      athlete_id: payload.athleteId,
      planned_session_id: plannedSessionId,
      version_number: versionNumber,
      title: payload.title,
      prescribed_distance: payload.prescribedDistance || null,
      distance_unit: payload.prescribedDistance ? (payload.distanceUnit || 'mi') : null,
      prescribed_duration_minutes: payload.prescribedDurationMinutes || null,
      intent: payload.intent,
      details: payload.details || null,
      rpe_low: payload.rpeLow || null,
      rpe_high: payload.rpeHigh || null,
      change_reason: payload.changeReason || null,
      authored_by: userId
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Filing for an athlete. Same record as their own filing, marked coach_import so
// the source of a number is never in doubt. Pieces carry the splits the verdict
// reads; without them a session has a distance and no evidence.
export async function fileForAthlete(payload, pieces = [], evidenceFile = null) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before filing.');

  // Through the RPC, not a direct insert. The coach insert policy is gone, so a
  // session and its pieces arrive together or not at all, and an agent filing
  // from a screenshot goes through exactly the same door.
  const { data: completionId, error } = await supabase.rpc('file_session', {
    p_athlete_id: payload.athleteId,
    p_status: payload.status,
    p_planned_session_id: payload.plannedSessionId || null,
    p_actual_distance: payload.actualDistance || null,
    p_distance_unit: payload.distanceUnit || 'mi',
    p_duration_seconds: payload.durationSeconds || null,
    p_rpe: payload.rpe || null,
    p_surface: payload.surface || null,
    p_temperature_f: payload.temperatureF || null,
    p_conditions: payload.conditions || null,
    p_athlete_note: payload.athleteNote || null,
    p_filed_at: payload.filedAt || null,
    p_pieces: pieces
  });
  if (error) throw error;

  if (evidenceFile) await uploadEvidence(payload.athleteId, completionId, evidenceFile, user.id);
  return { id: completionId };
}

// Editing a filed session. The audit trigger snapshots the previous values into
// completion_revisions, so a correction never destroys what was there before.
// Splits are replaced wholesale rather than diffed: a re-read of a screenshot is
// a new reading of the whole session, not an edit to one number.
export async function editFiledSession(completionId, payload, pieces = null) {
  // A correction always carries why. The audit trigger fires on the write and
  // cannot see a sentence the caller never sent, so the reason travels with the
  // change and is stamped onto every revision the change produced.
  if (!String(payload.reason || '').trim()) {
    throw new Error('A correction needs a reason. It is what makes the earlier reading legible later.');
  }
  const { error } = await supabase.rpc('correct_session', {
    p_completion_id: completionId,
    p_reason: payload.reason.trim(),
    p_status: payload.status || null,
    p_actual_distance: payload.actualDistance || null,
    p_duration_seconds: payload.durationSeconds || null,
    p_rpe: payload.rpe || null,
    p_surface: payload.surface || null,
    p_temperature_f: payload.temperatureF || null,
    p_conditions: payload.conditions || null,
    p_athlete_note: payload.athleteNote || null,
    p_filed_at: payload.filedAt || null,
    // null leaves the splits alone; an empty array says there are none.
    p_pieces: pieces
  });
  if (error) throw error;
}

// Brice's judgment of what a session did to the claim. The mechanical verdicts
// inform it; they never make it. Amending writes a new judgment naming the one it
// replaces, so the earlier reading stays legible.
export async function judgeClaim(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before judging.');
  if (!String(payload.reason || '').trim()) throw new Error('A judgment needs your reason.');

  const { data: judgment, error } = await supabase
    .from('mark_judgments')
    .insert({
      athlete_id: payload.athleteId,
      mark_id: payload.markId,
      direction: payload.direction,
      reason: payload.reason.trim(),
      supersedes: payload.supersedes || null,
      authored_by: user.id
    })
    .select('*')
    .single();
  if (error) throw error;

  if (payload.completionIds?.length) {
    const { error: linkError } = await supabase.from('mark_judgment_completions').insert(
      payload.completionIds.map((completionId) => ({ judgment_id: judgment.id, completion_id: completionId }))
    );
    if (linkError) throw linkError;
  }
  return judgment;
}

// Moving a rung. Advancing is Brice's call, never derived from a session landing
// in a band: an advance has to be earned, and a repeat is a decision he made.
// A rung moves two lawful ways: an authored progression rule fires on structured
// evidence, or Brice decides. Both are recorded, permanently, in an append only
// ledger beside the checkpoint. The current state is on the row; how it got there
// is in the ledger.
//
// Automatic movements are idempotent by construction. The unique index on
// (checkpoint, evidence, rule, rule version) makes a replayed filing a no-op, so
// FORM's offline queue retrying an upload cannot advance a rung twice.
const CHECKPOINT_SOURCES = ['automatic', 'coach', 'override'];
const CHECKPOINT_DECISIONS = ['advance', 'repeatDose', 'reduce', 'replace', 'hold'];

export async function moveCheckpoint(checkpointId, state, provenance = {}) {
  const { source, decision = 'advance', reason, evidenceCompletionId, ruleId, ruleVersion } = provenance;
  if (!CHECKPOINT_SOURCES.includes(source)) {
    throw new Error('A rung cannot move without saying what moved it.');
  }
  if (!CHECKPOINT_DECISIONS.includes(decision)) {
    throw new Error('A rung moves by advance, repeatDose, reduce, replace or hold.');
  }
  if (!String(reason || '').trim()) {
    throw new Error('A rung that moves records why.');
  }
  if (source === 'automatic' && !(evidenceCompletionId && ruleId && ruleVersion)) {
    throw new Error('An automatic advance names its evidence and the rule version that fired.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: before, error: readError } = await supabase
    .from('mark_checkpoints').select('id, athlete_id, mark_id, state')
    .eq('id', checkpointId).single();
  if (readError) throw readError;

  // The ledger first. If the movement is a replay the unique index rejects it and
  // the checkpoint is never touched, which is what makes reprocessing safe.
  const { error: ledgerError } = await supabase.from('mark_checkpoint_movements').insert({
    athlete_id: before.athlete_id,
    mark_id: before.mark_id,
    checkpoint_id: checkpointId,
    source,
    decision,
    previous_state: before.state,
    resulting_state: state,
    evidence_completion_id: evidenceCompletionId || null,
    rule_id: ruleId || null,
    rule_version: ruleVersion || null,
    reason: String(reason).trim(),
    moved_by: source === 'automatic' ? null : (user?.id || null)
  });
  if (ledgerError) {
    // 23505 is the idempotency index doing its job: this filing already moved
    // this rung through this rule. Not an error, and not a second movement.
    if (ledgerError.code === '23505') return { moved: false, reason: 'already applied' };
    throw ledgerError;
  }

  const { error } = await supabase
    .from('mark_checkpoints')
    .update({
      state,
      source,
      moved_at: new Date().toISOString(),
      moved_by: source === 'automatic' ? null : (user?.id || null),
      evidence_completion_id: evidenceCompletionId || null
    })
    .eq('id', checkpointId);
  if (error) throw error;
  return { moved: true };
}

// The bucket is private, so a stored path is not something a browser can render.
// Signed for an hour: long enough to read a session, short enough that a copied
// URL is not a standing key to an athlete's record.
async function signEvidence(rows) {
  if (!rows.length) return [];
  const paths = rows.filter((row) => row.storage_path).map((row) => row.storage_path);
  if (!paths.length) return rows;
  const { data, error } = await supabase.storage.from('session-evidence').createSignedUrls(paths, 3600);
  if (error) return rows;
  const byPath = new Map((data || []).map((item) => [item.path, item.signedUrl]));
  return rows.map((row) => ({ ...row, url: row.external_url || byPath.get(row.storage_path) || null }));
}

// Brice's confidence that the athlete gets the goal on the day, if this path
// continues. Authored, never calculated. It carries the reason and what would
// change it next, because a percentage travelling alone is the black box this was
// meant to avoid wearing a coach's name.
export async function setConfidence(payload) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before setting confidence.');
  const score = Number(payload.score);
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error('Confidence is a whole number from 0 to 100.');
  if (!String(payload.reason || '').trim()) throw new Error('A confidence needs your reason.');
  if (!String(payload.nextEvidence || '').trim()) throw new Error('Name the next thing that could change it.');

  const { data: read, error } = await supabase
    .from('mark_confidence_reads')
    .insert({
      athlete_id: payload.athleteId,
      mark_id: payload.markId,
      score,
      reason: payload.reason.trim(),
      next_evidence: payload.nextEvidence.trim(),
      intervene_if: String(payload.interveneIf || '').trim() || null,
      supersedes: payload.supersedes || null,
      authored_by: user.id
    })
    .select('*')
    .single();
  if (error) throw error;

  if (payload.completionIds?.length) {
    const { error: linkError } = await supabase.from('mark_confidence_completions').insert(
      payload.completionIds.map((completionId) => ({ read_id: read.id, completion_id: completionId }))
    );
    if (linkError) throw linkError;
  }
  return read;
}

// Whether the ladder is trusted to answer how far has become believable. Setting
// it to unknown changes no rung: the doubted rung stays exactly where it is, and
// so does everything under it, which is the point. Recorded append-only, because
// who stopped trusting a number is the thing the erasure destroyed.
export async function setEstablishedProofState(markId, state, reason) {
  if (!['derived', 'unknown'].includes(state)) throw new Error('Established proof is derived or unknown.');
  if (!String(reason || '').trim()) throw new Error('Say why the ladder is no longer answering.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before correcting established proof.');

  const { data: mark, error: readError } = await supabase
    .from('athlete_marks').select('id, athlete_id, established_proof_state').eq('id', markId).single();
  if (readError) throw readError;

  const { error: ledgerError } = await supabase.from('mark_proof_state_changes').insert({
    athlete_id: mark.athlete_id, mark_id: mark.id,
    previous_state: mark.established_proof_state, resulting_state: state,
    reason: String(reason).trim(), changed_by: user.id
  });
  if (ledgerError) throw ledgerError;

  const { error } = await supabase.from('athlete_marks')
    .update({ established_proof_state: state }).eq('id', markId);
  if (error) throw error;
  return { state };
}

// Proof coverage is not confidence. It is the furthest distance Brice has
// established, over the mark's target. Derived from authored checkpoint state
// only: a completion at eight miles proves nothing until he says it does.
export function proofCoverage(mark) {
  const target = Number(mark?.target_value);
  if (!target) return null;
  const established = (mark.checkpoints || [])
    .filter((point) => point.state === 'reached' || point.state === 'repeated')
    .reduce((furthest, point) => Math.max(furthest, Number(point.value) || 0), 0);
  return { established, target, percent: Math.round((established / target) * 100) };
}
