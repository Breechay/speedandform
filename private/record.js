const markerNames = {
  heel_light: 'Heel light',
  chest_proud: 'Chest proud',
  wrist_to_hip: 'Wrist to hip',
  single_leg_control: 'Single leg strength',
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
  if (!value) return '';
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
  const currentNumber = record.currentWeek?.week_number ?? 0;

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
  const longest = sessions.reduce((most, item) => Math.max(most, item.planned), 0);
  // Lime marks the next unfiled session, and nothing else on this screen.
  const nextUp = sessions.find((item) => !item.completion)?.session.id || null;

  // The block as a whole: structure only. No future numbers — she has no reason
  // yet to know what week 7 asks of her.
  const spine = `<div class="spine">${Array.from({ length: total }, (_, position) => {
    const number = position + 1;
    const state = number < currentNumber ? 'past' : (number === currentNumber ? 'now' : 'ahead');
    return `<span class="pip ${state}"></span>`;
  }).join('')}</div>`;

  return `<section class="record-section crop week-grid" id="now">
    <p class="wk-block">Block ${escapeHtml(record.block?.block_number ?? 1)}${record.block?.name ? ` \u00b7 ${escapeHtml(record.block.name)}` : ''}</p>
    <div class="week-head">
      <h2 class="wk-title">Week ${escapeHtml(week?.week_number ?? '')}</h2>
      <div class="wk-move">
        <button class="wk-arrow" type="button" data-week-step="-1" ${index > 0 ? '' : 'disabled'} aria-label="Previous week">\u2039</button>
        <span class="wk-of">of ${escapeHtml(total)}</span>
        <button class="wk-arrow" type="button" data-week-step="1" ${index >= 0 && index < weeks.length - 1 ? '' : 'disabled'} aria-label="Next week">\u203a</button>
      </div>
    </div>
    ${spine}
    <div class="wk-shape">
      <b>${sessions.length}</b><span>runs</span>
      <b>${Number(plannedTotal.toFixed(1))}</b><span>mi</span>
      <b>${Number(longest.toFixed(1))}</b><span>mi long run</span>
    </div>
    ${week?.intent ? `<p class="wk-intent">${escapeHtml(week.intent)}</p>` : ''}
    <div class="week-days">${sessions.map((item) => {
      const filed = Boolean(item.completion);
      const isNext = item.session.id === nextUp;
      const note = item.version.intent || '';
      return `<div class="day${filed ? ' filed' : ''}${isNext ? ' next' : ''}"
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
    <p class="bar-figure"><strong>${escapeHtml(mark.current_value ?? '')}</strong><span class="bar-target">of ${escapeHtml(mark.target_value ?? '')} ${escapeHtml(unit)}</span></p>
    <div class="ladder">
      <div class="ladder-track"><span class="ladder-fill" style="width:${fill}%"></span></div>
      <ol class="rungs">${rungs}</ol>
    </div>
  </section>`;
}

export function gradeSection(record) {
  if (!record.movementReads.length) return '';
  const rows = record.movementReads.slice()
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
    .map((marker) => {
      const rating = Math.max(0, Math.min(5, Number(marker.rating) || 0));
      // Five dashes made the reader count them to learn a number. Print the number.
      const track = rating ? `${rating}<small>/5</small>` : '';
      const work = marker.support_purpose
        ? record.supportItems.filter((item) => item.purpose === marker.support_purpose)
        : [];
      const head = `<span class="focus-cue">${escapeHtml(markerNames[marker.marker] || marker.marker)}</span>
        <span class="focus-score">${track}</span>`;
      if (!work.length) return `<div class="focus-row">${head}</div>`;
      return `<details class="focus-row has-work">
        <summary>${head}</summary>
        <div class="focus-work">${work.map((item) => `<article class="support-item">
          <div><b>${escapeHtml(item.movement)}</b><small>${escapeHtml(item.cue)}</small></div>
          <span class="support-dose">${escapeHtml(item.dose)}</span>
        </article>`).join('')}</div>
      </details>`;
    }).join('');
  return `<section class="record-section" id="read">
    <p class="eyebrow">Areas of focus</p>
    <div class="focus">${rows}</div>
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
      <div class="account-row"><span>Signed in as</span><b>${escapeHtml(email || 'Not set')}</b></div>
      <div class="account-row"><span>Coaching</span><b>${escapeHtml(athlete.account_label)}</b></div>
      ${block ? `<div class="account-row"><span>Block</span><b>Week ${escapeHtml(block.current_week)} of ${escapeHtml(block.total_weeks)}</b></div>` : ''}
    </div>
    <p class="account-note">A link always works. Set a password if you would rather sign in the usual way.</p>
    ${interactive ? `<div class="account-actions"><button class="button" type="button" id="setPassword">Set a password</button><button class="button" type="button" id="linkApple" hidden>Link Apple</button><button class="button" type="button" id="changeEmail">Change email</button><button class="button quiet" type="button" id="accountSignOut">Sign out</button></div>` : ''}
  </section>`;
}

export function renderAthleteRecord(record, { interactive = false, projection = false, email = '', shownWeekId = null } = {}) {
  if (!record.athlete) return '<div class="status-message error">This record is not available.</div>';
  return `<div class="record-shell${projection ? ' projection' : ''}">
    ${whoSection(record)}
    ${weekSection(record, { interactive, shownWeekId })}
    ${markSection(record)}
    ${gradeSection(record)}
    ${supportSection(record)}
    ${recordSection(record)}
    ${accountSection(record, email, interactive)}
  </div>`;
}

function paceText(seconds) {
  if (!seconds && seconds !== 0) return '';
  const value = Math.round(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export const directionWords = {
  supports: 'moves the claim',
  against: 'works against the claim',
  does_not_answer: 'does not answer the claim'
};

// A session, read in the order that decides what it is worth. Recovery sits first
// and largest because it determines whether the session can answer anything;
// splits sit last and quiet because they are the most seductive and the least
// decisive. Hope's 6:19 is the fastest number on either page and the least useful.
export function evidenceSection(record, { interactive = false } = {}) {
  const mark = record.primaryMark;
  if (!mark) return '';
  const verdicts = record.verdicts || [];
  if (!verdicts.length) return '';

  const rows = verdicts.slice()
    .sort((a, b) => new Date(b.filed_at || 0) - new Date(a.filed_at || 0))
    .map((verdict) => {
      const pieces = (record.pieces || []).filter((piece) => piece.completion_id === verdict.completion_id);
      const floats = pieces.filter((piece) => piece.kind === 'float');
      const reps = pieces.filter((piece) => piece.kind === 'rep');
      const easy = verdict.easy_pace;

      // The gap is the evidence. 10:01 alone looks like a slow mile; 10:01 beside
      // her own 8:48 easy is the record of someone who stopped running.
      const gaps = floats.map((piece) => piece.pace_seconds - easy).filter((gap) => Number.isFinite(gap));
      const worst = gaps.length ? Math.max(...gaps) : null;
      const rested = verdict.float_verdict === 'outside';
      const reference = easy && gaps.length
        ? (rested
            ? `up to ${Math.round(worst)}s slower than the ${paceText(easy)} easy either side of it`
            : `inside ${Math.round(Math.max(...gaps.map((gap) => Math.abs(gap))))}s of the ${paceText(easy)} easy either side of it`)
        : '';

      const judgment = (record.judgments || []).find((item) => item.completionIds.includes(verdict.completion_id));
      // Where it happened sits in the header, not in a detail row. For Marcus it
      // decides whether the session can answer his claim at all.
      const completion = (record.completions || []).find((item) => item.id === verdict.completion_id);
      // Provenance, kept closed. The agent reads the screenshot and files the
      // structured session; making Brice re-read the source on every session
      // would undo the translation it was there to do. It opens when a number
      // looks wrong, which is the only time it earns the space.
      const shot = (record.evidenceFiles || []).find((file) => file.completion_id === verdict.completion_id);
      const shotUrl = shot?.url || null;
      const where = [
        completion?.surface,
        completion?.temperature_f ? `${completion.temperature_f}\u00b0` : null,
        completion?.conditions
      ].filter(Boolean).join(' \u00b7 ');
      const effortOff = verdict.effort_verdict === 'outside';

      return `<section class="consoleSession">
        <header class="consoleSession__header">
          <time>${escapeHtml(formatDate(verdict.filed_at))}</time>
          <h2>${escapeHtml(verdict.title || 'Session')}</h2>
        </header>
        ${where ? `<p class="ev-where">${escapeHtml(where)}</p>` : ''}
        <table class="consoleSessionFacts">
          <thead><tr><th></th><th>Asked</th><th>Happened</th></tr></thead>
          <tbody>
            <tr class="consoleSessionFacts__recovery${rested ? ' off' : ''}">
              <th>Recovery</th>
              <td>easy</td>
              <td>
                ${floats.map((piece) => escapeHtml(paceText(piece.pace_seconds))).join(' · ')}
                ${reference ? `<small>${escapeHtml(reference)}</small>` : ''}
              </td>
            </tr>
            <tr class="consoleSessionFacts__effort${effortOff ? ' off' : ''}">
              <th>Effort</th>
              <td>${verdict.rpe_low ? `${escapeHtml(verdict.rpe_low)}–${escapeHtml(verdict.rpe_high)}` : 'not asked'}</td>
              <td>${verdict.rpe ? escapeHtml(verdict.rpe) : ''}</td>
            </tr>
            <tr class="consoleSessionFacts__splits">
              <th>Miles</th>
              <td>${verdict.pace_verdict === 'not prescribed' ? 'not asked' : `${escapeHtml(paceText(verdict.pace_low))}–${escapeHtml(paceText(verdict.pace_high))}`}</td>
              <td>${reps.map((piece) => escapeHtml(paceText(piece.pace_seconds))).join(' · ')}</td>
            </tr>
          </tbody>
        </table>
        ${(completion?.athlete_note || completion?.symptoms) ? `<div class="ins-felt">
          <p class="ins-felt__label">Athlete report</p>
          ${completion?.athlete_note ? `<p class="ins-felt__said">${escapeHtml(completion.athlete_note)}</p>` : ''}
          ${completion?.symptoms ? `<p class="ins-felt__symptoms"><strong>Symptoms</strong> ${escapeHtml(completion.symptoms)}</p>` : ''}
        </div>` : ''}
        ${shot ? `<details class="ev-source" data-completion-id="${escapeHtml(verdict.completion_id)}">
          <summary>Read from</summary>
          <a href="${escapeHtml(shotUrl)}" target="_blank" rel="noopener">
            <img src="${escapeHtml(shotUrl)}" alt="The watch screenshot this session was read from" loading="lazy">
          </a>
        </details>` : ''}
        ${interactive ? `<button class="link-button" type="button" data-correct="${escapeHtml(verdict.completion_id)}">Correct this</button>` : ''}
        ${judgment
          ? `<p class="ev-judgment ${escapeHtml(judgment.direction)}"><span>${escapeHtml(directionWords[judgment.direction])}</span>${escapeHtml(judgment.reason)}</p>`
          : interactive
            ? `<button class="link-button" type="button" data-judge="${escapeHtml(verdict.completion_id)}">Say what this did to the claim</button>`
            : ''}
      </section>`;
    }).join('');

  return rows;
}

const checkpointWords = { reached: 'held', current: 'next', repeated: 'held again', proposed: '', retired: 'retired' };

// Where this is going. Three separate things, deliberately not merged: the ladder
// is proof positions, the block ahead is calendar, and the judgments are belief
// moving over time. Putting distances on a week axis would imply each distance
// happens on a fixed date, and the block repeats rungs and reorders them.
export function progressionSection(record, { interactive = false } = {}) {
  const mark = record.primaryMark;
  if (!mark?.checkpoints?.length) return '';

  // Current and next rung only - quiet factual information
  const current = mark.checkpoints.find((point) => point.state === 'current');
  const next = mark.checkpoints.find((point) => point.state === 'proposed');
  
  let orientation = '';
  if (current || next) {
    orientation = `<div class="consoleOrientation">`;
    if (current) {
      orientation += `<p class="consoleCurrent"><span class="consoleOrientation__label">Current</span> <span class="consoleOrientation__value">${escapeHtml(current.label)} mi</span></p>`;
    } else {
      orientation += `<p class="consoleCurrent"><span class="consoleOrientation__label">Current</span> <button class="consoleOrientation__action" type="button" data-checkpoint-action="choose">CHOOSE CURRENT</button></p>`;
    }
    if (next) {
      orientation += `<p class="consoleNext"><span class="consoleOrientation__label">Next</span> <span class="consoleOrientation__value">${escapeHtml(next.label)} mi</span></p>`;
    }
    orientation += `</div>`;
  }

  // Where repetition lives, now that the ladder carries one rung per capability.
  // Six at effort 8 and six at effort 7 is the entire argument for repeating a
  // rung, and it can only be seen by putting the exposures side by side.
  const exposures = (() => {
    const byDistance = new Map();
    (record.sessions || []).forEach((session) => {
      const version = session.currentVersion;
      const distance = Number(version?.prescribed_distance);
      if (!distance || !/race pace/i.test(version.title || '')) return;
      const done = (record.completions || []).find((item) => item.planned_session_id === session.id);
      if (!byDistance.has(distance)) byDistance.set(distance, []);
      byDistance.get(distance).push({ session, version, done });
    });
    return [...byDistance.entries()]
      .filter(([, list]) => list.length > 1)
      .sort((a, b) => a[0] - b[0])
      .map(([distance, list]) => `<tr>
        <th>${escapeHtml(Number(distance))} mi</th>
        ${list.sort((a, b) => String(a.session.scheduled_on).localeCompare(String(b.session.scheduled_on)))
          .map((item) => `<td class="${item.done ? 'done' : ''}">
            <b>${item.done?.rpe ? `effort ${escapeHtml(item.done.rpe)}` : 'not yet'}</b>
            <span>${escapeHtml(formatDate(item.session.scheduled_on))}</span>
          </td>`).join('')}
      </tr>`).join('');
  })();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (record.sessions || [])
    .filter((session) => session.scheduled_on && session.scheduled_on >= today && session.currentVersion)
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on))
    .slice(0, 3); // Only show next few sessions

  const readings = (record.judgments || []).map((judgment) => `<tr class="${escapeHtml(judgment.direction)}">
    <td class="rd-when">${escapeHtml(formatDate(judgment.created_at))}</td>
    <td class="rd-why">${escapeHtml(judgment.reason)}</td>
    <td class="rd-dir">${escapeHtml(directionWords[judgment.direction])}</td>
  </tr>`).join('');

  let continuation = '';
  if (exposures || upcoming.length || readings) {
    continuation = `<div class="consoleContinuation">`;
    if (exposures) {
      continuation += `<div class="consoleContinuation__section">
        <p class="consoleContinuation__label">Repeated exposures</p>
        <table class="expo"><tbody>${exposures}</tbody></table>
      </div>`;
    }
    if (upcoming.length) {
      continuation += `<div class="consoleContinuation__section">
        <p class="consoleContinuation__label">Coming next</p>
        ${upcoming.map((session) => `<p class="consoleContinuation__session">${escapeHtml(session.currentVersion.title)}<time>${escapeHtml(formatDate(session.scheduled_on))}</time></p>`).join('')}
      </div>`;
    }
    if (readings) {
      continuation += `<div class="consoleContinuation__section">
        <p class="consoleContinuation__label">Judgments over time</p>
        <table class="readings-t"><tbody>${readings}</tbody></table>
      </div>`;
    }
    continuation += `</div>`;
  }

  return `${orientation}${continuation}`;
}
