const markerNames = {
  heel_light: 'Heel light',
  chest_proud: 'Chest proud',
  wrist_to_hip: 'Wrist to hip',
  single_leg_control: 'Single-leg control',
  running_economy: 'Running economy'
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const date = new Date(value.includes?.('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return escapeHtml(value);
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${minutes}:${String(rest).padStart(2, '0')}`;
}

function sessionRows(record, interactive) {
  return record.sessions.map((session) => {
    const version = session.currentVersion || {};
    const completion = record.completions.find((item) => item.planned_session_id === session.id);
    const direction = record.directions.find((item) => item.planned_session_id === session.id);
    const fileControl = interactive
      ? `<div class="session-actions">${completion
        ? `<span class="filed-note">${escapeHtml(completion.status.replace('_', ' '))}</span><button class="file-button" type="button" data-file-session="${session.id}" data-completion-id="${completion.id}">Update your note</button>`
        : `<button class="file-button" type="button" data-file-session="${session.id}">File this session</button>`}</div>`
      : '';
    return `<article class="session-row">
      <span class="session-day">${escapeHtml(session.day_label)}</span>
      <div class="session-copy">
        <b>${escapeHtml(version.title || 'Session')}</b>
        <small>${escapeHtml(direction?.athlete_text || version.intent || '')}</small>
      </div>
      <span class="session-distance">${version.prescribed_distance ? `${escapeHtml(version.prescribed_distance)} ${escapeHtml(version.distance_unit || '')}` : ''}</span>
      ${fileControl}
    </article>`;
  }).join('');
}

function markSection(record) {
  const mark = record.primaryMark;
  if (!mark) return '';
  const checkpoints = mark.checkpoints.map((point) => `<span class="checkpoint ${escapeHtml(point.state)}"><span>${escapeHtml(point.label)}</span></span>`).join('');
  const gates = mark.gates.map((gate) => `<div class="gate-item ${escapeHtml(gate.state)}">${escapeHtml(gate.condition_text)}</div>`).join('');
  const current = mark.current_value ?? '—';
  const target = mark.target_value ? `of ${mark.target_value} ${mark.unit || ''}` : mark.unit || '';
  return `<section class="record-section" id="mark">
    <div class="section-head"><div><p class="eyebrow">The mark</p><h2>${escapeHtml(mark.label)}</h2></div></div>
    <div class="mark-number"><strong>${escapeHtml(current)}</strong><span>${escapeHtml(target)}</span></div>
    <p class="mark-label">The mark is evidence, not a countdown.</p>
    ${checkpoints ? `<div class="checkpoint-track" aria-label="Coach-authored distance checkpoints">${checkpoints}</div>` : ''}
    <div class="question-box"><span>Current coaching question</span><p>${escapeHtml(mark.current_question)}</p></div>
    ${gates ? `<div class="gate-list">${gates}</div><p class="all-four">All four. Repeating a distance is a decision, not a miss.</p>` : ''}
  </section>`;
}

function readSection(record) {
  if (!record.movementReads.length && !record.reads.length) return '';
  const latestRead = record.reads[0];
  const markers = record.movementReads.map((marker) => `<article class="marker-row">
    <div class="marker-top"><span class="marker-name">${escapeHtml(markerNames[marker.marker] || marker.marker)}</span><span class="marker-state ${escapeHtml(marker.state)}">${escapeHtml(marker.state)}</span></div>
    <p class="marker-cue">${escapeHtml(marker.cue)}</p>
  </article>`).join('');
  return `<section class="record-section" id="read">
    <div class="section-head"><div><p class="eyebrow">The read</p><h2>What stays. What develops.</h2></div></div>
    <div class="keep-callout"><strong>KEEP</strong><p>${escapeHtml(latestRead?.athlete_text || 'Protect what already works.')}</p></div>
    <div class="marker-list">${markers}</div>
  </section>`;
}

function supportSection(record) {
  if (!record.support || !record.supportItems.length) return '';
  const purposes = [...new Set(record.supportItems.map((item) => item.purpose))];
  const groups = purposes.map((purpose) => `<div class="support-group">
    <h3>${escapeHtml(purpose)}</h3>
    <div class="support-list">${record.supportItems.filter((item) => item.purpose === purpose).map((item) => `<article class="support-item">
      <div><b>${escapeHtml(item.movement)}</b><small>${escapeHtml(item.cue)} ${escapeHtml(item.reason)}</small></div>
      <span class="support-dose">${escapeHtml(item.dose)}</span>
    </article>`).join('')}</div>
  </div>`).join('');
  return `<section class="record-section" id="support">
    <div class="section-head"><div><p class="eyebrow">Support</p><h2>${escapeHtml(record.support.title)}</h2></div></div>
    <p class="section-summary">${escapeHtml(record.support.summary || '')}</p>
    ${groups}
    <p class="shared-line">${record.support.shared_with_strength_coach ? 'Shared with your strength coach.' : 'Not yet shared with your strength coach.'}</p>
  </section>`;
}

function recordSection(record) {
  const events = [];
  record.completions.forEach((item) => events.push({
    type: 'Filed', date: item.filed_at,
    body: `${item.status[0].toUpperCase()}${item.status.slice(1)}${item.actual_distance ? ` · ${item.actual_distance} ${item.distance_unit || ''}` : ''}${item.athlete_note ? ` — ${item.athlete_note}` : ''}`
  }));
  record.reads.forEach((item) => events.push({ type: 'Read', date: item.published_at || item.created_at, body: item.athlete_text }));
  record.decisions.forEach((item) => events.push({ type: 'Decision', date: item.effective_on, body: item.athlete_text }));
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  const baseline = record.baselines[0];
  return `<section class="record-section" id="record">
    <div class="section-head"><div><p class="eyebrow">The record</p><h2>Where this started.</h2></div></div>
    ${baseline ? `<p class="baseline-copy">${escapeHtml(baseline.running_history)} Longest run ${escapeHtml(baseline.longest_run)} miles. ${escapeHtml(baseline.current_frequency)} touches a week. ${escapeHtml(baseline.constraints)} ${escapeHtml(baseline.strength_schedule)}</p>` : ''}
    <div class="record-list">${events.map((event) => `<article class="record-event">
      <div class="record-event-top"><span class="record-event-type">${escapeHtml(event.type)}</span><time>${formatDate(event.date)}</time></div>
      <p>${escapeHtml(event.body)}</p>
    </article>`).join('') || '<p class="muted">The first filed session begins the record.</p>'}</div>
  </section>`;
}

export function renderAthleteRecord(record, { interactive = false, projection = false } = {}) {
  const athlete = record.athlete;
  const block = record.block;
  const week = record.currentWeek;
  if (!athlete) return '<div class="status-message error">This record is not available.</div>';
  const meta = [athlete.target_event, athlete.goal_label, block ? `Block ${String(block.block_number).padStart(2, '0')}` : null, block ? `Week ${block.current_week} of ${block.total_weeks}` : null].filter(Boolean).join(' · ');
  const state = week?.state === 'in_progress' ? 'On track' : (week?.state || 'Active');
  return `<div class="record-shell${projection ? ' projection' : ''}">
    <section class="record-hero" id="now">
      <div class="record-hero-head"><div><p class="eyebrow">Now</p><h1>${escapeHtml(athlete.display_name)}</h1><p class="record-meta">${escapeHtml(meta)}</p></div><span class="state-pill on_track">${escapeHtml(state)}</span></div>
      ${week ? `<p class="week-intent">${escapeHtml(week.intent)}</p><div class="because"><span>This week matters because</span><p>${escapeHtml(week.matters_because)}</p></div>` : ''}
      <div class="sessions-list record-sessions">${sessionRows(record, interactive)}</div>
    </section>
    ${markSection(record)}
    ${readSection(record)}
    ${supportSection(record)}
    ${recordSection(record)}
    <footer class="account-band"><span>${escapeHtml(athlete.account_label)}</span><span>Private coaching record</span></footer>
  </div>`;
}
