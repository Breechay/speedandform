const markerNames = {
  heel_light: 'Heel light',
  chest_proud: 'Chest proud',
  wrist_to_hip: 'Wrist to hip',
  single_leg_control: 'Single leg',
  running_economy: 'Running economy'
};

const gradeStates = {
  holds: 'holds',
  holds_until_tired: 'holds until tired',
  not_yet: 'not yet'
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

const contextLabels = {
  outdoor: 'Outdoor', treadmill: 'Treadmill', track: 'Track',
  with_brice: 'With Brice', independent: 'Independent'
};

// Surface is the purpose for some marks, not metadata, so the record shows it.
function executionTags(direction) {
  const context = direction?.execution_context;
  if (!context || typeof context !== 'object') return '';
  const tags = [context.surface, context.company]
    .filter(Boolean)
    .map((value) => `<span class="execution-tag">${escapeHtml(contextLabels[value] || value)}</span>`);
  if (context.heat_allowance) tags.push(`<span class="execution-tag">${escapeHtml(context.heat_allowance)}</span>`);
  return tags.length ? `<div class="execution-tags">${tags.join('')}</div>` : '';
}

function sessionRows(record, interactive, list = null) {
  return (list || record.sessions).map((session) => {
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
        ${executionTags(direction)}
      </div>
      <span class="session-distance">${version.prescribed_distance ? `${escapeHtml(version.prescribed_distance)} ${escapeHtml(version.distance_unit || '')}` : ''}</span>
      ${fileControl}
    </article>`;
  }).join('');
}

function markSection(record) {
  const mark = record.primaryMark;
  if (!mark) return '';
  const current = Number(mark.current_value);
  const target = Number(mark.target_value);
  const unit = mark.unit || '';
  const points = (mark.checkpoints || []).slice().sort((a, b) => Number(a.value) - Number(b.value));
  const reachedCount = points.filter((point) => Number(point.value) <= current).length;
  const fill = points.length > 1
    ? Math.max(0, Math.min(100, ((reachedCount - 1) / (points.length - 1)) * 100))
    : (Number.isFinite(current) && Number.isFinite(target) && target > 0 ? (current / target) * 100 : 0);
  const rungs = points.map((point) => {
    const value = Number(point.value);
    const reached = value <= current;
    const isNext = !reached && value > current
      && !points.some((other) => Number(other.value) > current && Number(other.value) < value);
    return `<li class="rung${reached ? ' reached' : ''}${isNext ? ' next' : ''}">
      <span class="rung-dot"></span><span class="rung-value">${escapeHtml(point.label || point.value)}</span>
    </li>`;
  }).join('');
  return `<section class="record-section crop mark-crop" id="mark">
    <p class="bar-figure"><strong>${escapeHtml(mark.current_value ?? '—')}</strong><span class="bar-target">of ${escapeHtml(mark.target_value ?? '—')} ${escapeHtml(unit)}</span></p>
    <div class="ladder">
      <div class="ladder-track"><span class="ladder-fill" style="width:${fill}%"></span></div>
      <ol class="rungs">${rungs}</ol>
    </div>
    <p class="bar-label">${escapeHtml(mark.label)}</p>
  </section>`;
}

function gradeSection(record) {
  const grade = gradeHtml(record);
  return grade ? `<section class="record-section crop" id="read"><p class="eyebrow">Movement</p>${grade}</section>` : '';
}

function gradeHtml(record) {
  if (!record.movementReads.length) return '';
  return `<div class="grade">${record.movementReads.map((marker) => `<div class="grade-row ${escapeHtml(marker.state)}">
    <b>${escapeHtml(markerNames[marker.marker] || marker.marker)}</b>
    <span class="grade-state">${escapeHtml(gradeStates[marker.state] || marker.state)}</span>
    <small>${escapeHtml(marker.cue)}</small>
  </div>`).join('')}</div>`;
}

function supportSection(record) {
  if (!record.supportItems.length) return '';
  const purposes = [...new Set(record.supportItems.map((item) => item.purpose))];
  const groups = purposes.map((purpose) => `<div class="support-group">
    <h3>${escapeHtml(purpose)}</h3>
    <div class="support-list">${record.supportItems.filter((item) => item.purpose === purpose).map((item) => `<article class="support-item">
      <div><b>${escapeHtml(item.movement)}</b><small>${escapeHtml(item.cue)}</small></div>
      <span class="support-dose">${escapeHtml(item.dose)}</span>
    </article>`).join('')}</div>
  </div>`).join('');
  return `<section class="record-section" id="support">
    <p class="eyebrow">Support · for your strength coach</p>
    ${groups}
    <p class="shared-line">${record.support?.shared_with_strength_coach ? 'Shared with your strength coach.' : 'Not yet shared with your strength coach.'}</p>
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
    <div class="section-head"><div><p class="eyebrow">History</p></div></div>
    ${baseline ? `<dl class="baseline">
      <div><dt>Before the block</dt><dd>${escapeHtml(baseline.running_history)}</dd></div>
      <div><dt>Longest run</dt><dd>${escapeHtml(baseline.longest_run)} mi</dd></div>
      <div><dt>Frequency</dt><dd>${escapeHtml(baseline.current_frequency)} a week</dd></div>
      <div><dt>Constraints</dt><dd>${escapeHtml(baseline.constraints)}</dd></div>
    </dl>` : ''}
    <div class="record-list">${events.map((event) => `<article class="record-event">
      <div class="record-event-top"><span class="record-event-type">${escapeHtml(event.type)}</span><time>${formatDate(event.date)}</time></div>
      <p>${escapeHtml(event.body)}</p>
    </article>`).join('') || '<p class="muted">The first filed session begins the record.</p>'}</div>
  </section>`;
}


function accountSection(record, email, interactive) {
  const athlete = record.athlete;
  const block = record.block;
  return `<section class="record-section account-section" id="account">
    <div class="section-head"><div><p class="eyebrow">Account</p><h2>${escapeHtml(athlete.display_name)}</h2></div></div>
    <div class="account-rows">
      <div class="account-row"><span>Signed in as</span><b>${escapeHtml(email || '—')}</b></div>
      <div class="account-row"><span>Coaching</span><b>${escapeHtml(athlete.account_label)}</b></div>
      ${block ? `<div class="account-row"><span>Block</span><b>Week ${escapeHtml(block.current_week)} of ${escapeHtml(block.total_weeks)}</b></div>` : ''}
    </div>
    <p class="account-note">You sign in with a link, so there is no password to keep.</p>
    ${interactive ? `<div class="account-actions"><button class="button" type="button" id="changeEmail">Change email</button><button class="button quiet" type="button" id="accountSignOut">Sign out</button></div>` : ''}
  </section>`;
}

export function renderAthleteRecord(record, { interactive = false, projection = false, email = '' } = {}) {
  const athlete = record.athlete;
  if (!athlete) return '<div class="status-message error">This record is not available.</div>';
  const week = record.currentWeek;
  const next = record.nextWeek;
  return `<div class="record-shell${projection ? ' projection' : ''}">
    ${markSection(record)}
    <section class="record-section crop" id="now">
      <p class="eyebrow">This week${week ? ` · ${escapeHtml(week.week_number)} of ${escapeHtml(record.block?.total_weeks ?? '')}` : ''}</p>
      ${week?.intent ? `<p class="week-intent">${escapeHtml(week.intent)}</p>` : ''}
      <div class="sessions-list record-sessions">${sessionRows(record, interactive, record.currentSessions)}</div>
      ${next && record.nextSessions?.length ? `<details class="next-week">
        <summary><span>Next week</span></summary>
        ${next.intent ? `<p class="next-intent">${escapeHtml(next.intent)}</p>` : ''}
        <div class="sessions-list record-sessions">${sessionRows(record, false, record.nextSessions)}</div>
      </details>` : ''}
    </section>
    ${gradeSection(record)}
    ${supportSection(record)}
    ${recordSection(record)}
    ${accountSection(record, email, interactive)}
  </div>`;
}
