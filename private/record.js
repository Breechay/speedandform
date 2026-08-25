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

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// One component, both surfaces. What Brice sees in the middle of his desk is
// literally what she sees when she signs in — same markup, same data, so the
// two can never drift apart by being maintained separately.
export function weekSection(record, { interactive = false, shownWeekId = null } = {}) {
  const weeks = (record.weeks || []).slice().sort((a, b) => a.week_number - b.week_number);
  const total = record.block?.total_weeks || weeks.length || 1;
  const week = weeks.find((entry) => entry.id === shownWeekId) || record.currentWeek || weeks[0] || null;
  const all = week ? (record.sessionsByWeek?.[week.id] || []) : [];
  const index = week ? weeks.findIndex((entry) => entry.id === week.id) : -1;

  // Only days with work. An empty Wednesday is not a thing to look at.
  const sessions = DAY_ORDER
    .map((label) => all.find((entry) => (entry.day_label || '').toUpperCase().startsWith(label.slice(0, 3))))
    .filter(Boolean)
    .map((session) => {
      const version = session.currentVersion || {};
      const completion = record.completions.find((entry) => entry.planned_session_id === session.id);
      return { session, version, completion,
        planned: Number(version.prescribed_distance) || 0,
        actual: Number(completion?.actual_distance) || 0 };
    });

  const plannedTotal = sessions.reduce((sum, item) => sum + item.planned, 0);
  const actualTotal = sessions.reduce((sum, item) => sum + item.actual, 0);
  const longest = sessions.reduce((most, item) => Math.max(most, item.planned), 0);

  return `<section class="record-section crop week-grid" id="now">
    <p class="wk-block">Block ${escapeHtml(record.block?.block_number ?? 1)}${record.block?.name ? ` \u00b7 ${escapeHtml(record.block.name)}` : ''}</p>
    <div class="week-head">
      <h2 class="wk-title">Week ${escapeHtml(week?.week_number ?? '\u2014')}</h2>
      <div class="wk-move">
        <button class="wk-arrow" type="button" data-week-step="-1" ${index > 0 ? '' : 'disabled'} aria-label="Previous week">\u2039</button>
        <span class="wk-of">of ${escapeHtml(total)}</span>
        <button class="wk-arrow" type="button" data-week-step="1" ${index >= 0 && index < weeks.length - 1 ? '' : 'disabled'} aria-label="Next week">\u203a</button>
      </div>
    </div>
    <div class="wk-shape">
      <b>${sessions.length}</b><span>runs</span>
      <b>${Number(plannedTotal.toFixed(1))}</b><span>mi</span>
      <b>${Number(longest.toFixed(1))}</b><span>longest</span>
      ${actualTotal > 0 ? `<em>${Number(actualTotal.toFixed(1))} done</em>` : ''}
    </div>
    ${week?.intent ? `<p class="wk-intent">${escapeHtml(week.intent)}</p>` : ''}
    <div class="week-days">${sessions.map((item) => {
      const filed = Boolean(item.completion);
      const note = item.version.intent || '';
      return `<div class="day${filed ? ' filed' : ''}"
        ${interactive
          ? `data-file-session="${item.session.id}"${item.completion ? ` data-completion-id="${item.completion.id}"` : ''}`
          : `data-write="direction" data-subject="${escapeHtml(item.session.id)}"`}
        role="button" tabindex="0">
        <span class="day-name">${escapeHtml(item.session.day_label)}</span>
        <span class="day-figure">${escapeHtml(filed ? item.actual : item.planned)}<i>mi</i></span>
        <span class="day-title">${escapeHtml(item.version.title || '')}</span>
        ${note ? `<p class="day-note">${escapeHtml(note)}</p>` : `<p class="day-add">${interactive ? 'Log it' : 'Add instructions'}</p>`}
      </div>`;
    }).join('')}</div>
  </section>`;
}


export function whoSection(record) {
  const athlete = record.athlete;
  const block = record.block;
  const goal = block?.goal_statement || [block?.goal_label, block?.target_event].filter(Boolean).join(' \u00b7 ') || null;
  let orient = '';
  if (block?.race_on) {
    const race = new Date(`${block.race_on}T12:00:00`);
    const today = new Date();
    const weeksOut = Math.max(0, Math.round((race - today) / (7 * 24 * 60 * 60 * 1000)));
    const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(race);
    orient = `<span class="who-date">${escapeHtml(date)}</span><span class="who-out"><b>${weeksOut}</b> weeks out</span>`;
  }
  return `<header class="who">
    <h1>${escapeHtml(athlete.display_name)}</h1>
    ${goal ? `<p class="who-goal">${escapeHtml(goal)}${orient}</p>` : ''}
  </header>`;
}

export function markSection(record) {
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

export function gradeSection(record) {
  if (!record.movementReads.length) return '';
  const groups = [
    { state: 'not_yet', label: 'Not yet' },
    { state: 'holds_until_tired', label: 'Holds until tired' },
    { state: 'holds', label: 'Holds' }
  ].map((group) => {
    const items = record.movementReads.filter((marker) => marker.state === group.state);
    if (!items.length) return '';
    return `<div class="mv-group ${escapeHtml(group.state)}">
      <span class="mv-state">${escapeHtml(group.label)}</span>
      <span class="mv-names">${items.map((marker) => escapeHtml(markerNames[marker.marker] || marker.marker)).join(', ')}</span>
    </div>`;
  }).join('');
  return `<section class="record-section" id="read">
    <p class="eyebrow">Movement</p>
    <div class="movement">${groups}</div>
  </section>`;
}

export function supportSection(record) {
  if (!record.supportItems.length) return '';
  const purposes = [...new Set(record.supportItems.map((item) => item.purpose))];
  const groups = purposes.map((purpose) => `<div class="support-group">
    <h3>${escapeHtml(purpose)}</h3>
    <div class="support-list">${record.supportItems.filter((item) => item.purpose === purpose).map((item) => `<article class="support-item">
      <div><b>${escapeHtml(item.movement)}</b><small>${escapeHtml(item.cue)}</small></div>
      <span class="support-dose">${escapeHtml(item.dose)}</span>
    </article>`).join('')}</div>
  </div>`).join('');
  const count = record.supportItems.length;
  return `<section class="record-section" id="support">
    <details class="support-drawer">
      <summary><span class="eyebrow">Support · for your strength coach</span><span class="support-count">${escapeHtml(count)}</span></summary>
      ${groups}
      <p class="shared-line">${record.support?.shared_with_strength_coach ? 'Shared with your strength coach.' : 'Not yet shared with your strength coach.'}</p>
    </details>
  </section>`;
}

export function recordSection(record, { limit = 0 } = {}) {
  const events = [];
  record.completions.forEach((item) => events.push({
    type: item.status.charAt(0).toUpperCase() + item.status.slice(1), date: item.filed_at,
    body: `${item.actual_distance ? `${item.actual_distance} ${item.distance_unit || ''}` : ''}${item.athlete_note ? `${item.actual_distance ? ' \u2014 ' : ''}${item.athlete_note}` : ''}`
  }));
  record.reads.forEach((item) => events.push({ type: 'Reply', date: item.published_at || item.created_at, body: item.athlete_text }));
  record.decisions.forEach((item) => events.push({ type: 'Change', date: item.effective_on, body: item.athlete_text }));
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  const shown = limit ? events.slice(0, limit) : events;
  if (!shown.length) return '';
  return `<section class="record-section" id="record">
    <p class="eyebrow">History</p>
    <div class="record-list">${shown.map((event) => `<article class="record-event">
      <time>${escapeHtml(formatDate(event.date))}</time>
      <span class="event-type ${escapeHtml(event.type.toLowerCase())}">${escapeHtml(event.type)}</span>
      <p>${escapeHtml(event.body)}</p>
    </article>`).join('')}</div>
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

export function renderAthleteRecord(record, { interactive = false, projection = false, email = '', shownWeekId = null } = {}) {
  if (!record.athlete) return '<div class="status-message error">This record is not available.</div>';
  return `<div class="record-shell${projection ? ' projection' : ''}">
    ${whoSection(record)}
    ${weekSection(record, { interactive, shownWeekId })}
    ${markSection(record)}
    ${supportSection(record)}
    ${recordSection(record)}
    ${accountSection(record, email, interactive)}
  </div>`;
}
