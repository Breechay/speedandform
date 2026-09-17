const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const fmt = (value) => {
  if (!value) return '';
  const date = new Date(value.includes?.('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? esc(value) : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function deliveryKind(record) {
  const text = [record.athlete?.delivery, record.athlete?.home_surface, record.athlete?.program_name, record.block?.discipline]
    .filter(Boolean).join(' ').toLowerCase();
  // Strength identity is about the authored program, not whether native Forge
  // receipt delivery has already been proven. Current roster vocabulary includes
  // Runner Mass and Strength & Physique before Forge becomes the confirmed delivery surface.
  return /forge|sculpt|strength|physique|runner\s+mass/.test(text) ? 'strength' : 'running';
}

function appName(record) { return deliveryKind(record) === 'strength' ? 'Forge' : 'FORM'; }

function workspaceNav(view) {
  return `<nav class="athlete-tabs" aria-label="Athlete workspace">
    ${['today','plan','history','account'].map((name) => `<button type="button" data-athlete-view="${name}" class="athlete-tab${view === name ? ' active' : ''}" aria-current="${view === name ? 'page' : 'false'}">${name[0].toUpperCase() + name.slice(1)}</button>`).join('')}
  </nav>`;
}

function identity(record) {
  const athlete = record.athlete;
  const block = record.block;
  const goal = block?.goal_statement || [block?.goal_label, block?.target_event].filter(Boolean).join(' · ');
  return `<header class="athlete-identity">
    <p class="eyebrow">${deliveryKind(record) === 'strength' ? 'Strength development' : 'Run development'}</p>
    <h1>${esc(athlete.display_name)}</h1>
    ${goal ? `<p>${esc(goal)}</p>` : `<p>${esc(athlete.program_name || athlete.account_label || 'Coached training')}</p>`}
  </header>`;
}

function sessionsForWeek(record, week) {
  if (!week) return [];
  const all = record.sessionsByWeek?.[week.id] || [];
  return DAY_ORDER.map((day) => all.find((session) => (session.day_label || '').toUpperCase().startsWith(day.slice(0,3)))).filter(Boolean);
}

function sessionCard(record, session) {
  const v = session.currentVersion || {};
  const completion = (record.completions || []).find((item) => item.planned_session_id === session.id);
  const direction = (record.directions || []).find((item) => item.planned_session_id === session.id);
  const distance = v.prescribed_distance ? `${esc(v.prescribed_distance)} ${esc(v.distance_unit || '')}` : '';
  return `<article class="athlete-session${completion ? ' received' : ''}">
    <div class="athlete-session-day"><span>${esc(session.day_label || '')}</span>${completion ? '<small>RECEIVED</small>' : ''}</div>
    <div class="athlete-session-copy"><h3>${esc(v.title || 'Session')}</h3>${distance ? `<b>${distance}</b>` : ''}
      ${(direction?.athlete_text || v.intent) ? `<p>${esc(direction?.athlete_text || v.intent)}</p>` : ''}
    </div>
  </article>`;
}

function noPlan(record) {
  const app = appName(record);
  return `<section class="athlete-empty"><p class="eyebrow">Training</p><h2>Your next block is not published here yet.</h2><p>This account is ready. When Brice publishes training for you, it will appear here. ${app} remains the place to record completed sessions.</p><a href="mailto:brice@speedandform.com?subject=My%20FORM%20training" class="button">Ask Brice about your training →</a></section>`;
}

function todayView(record) {
  const week = record.currentWeek || record.weeks?.[0] || null;
  if (!week) return noPlan(record);
  const sessions = sessionsForWeek(record, week);
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date()).toUpperCase();
  const today = sessions.find((session) => (session.day_label || '').toUpperCase().startsWith(todayName.slice(0,3)));
  const next = today || sessions.find((session) => !(record.completions || []).some((c) => c.planned_session_id === session.id)) || sessions[0];
  return `<section class="athlete-view athlete-today" id="today">
    <div class="athlete-view-head"><div><p class="eyebrow">Today</p><h2>${today ? 'Your work today.' : 'Your current week.'}</h2></div><span>Week ${esc(week.week_number)}${record.block?.total_weeks ? ` / ${esc(record.block.total_weeks)}` : ''}</span></div>
    ${next ? `<div class="today-focus">${sessionCard(record, next)}</div>` : '<p class="athlete-muted">No session is authored for today.</p>'}
    <div class="today-context"><p>${esc(week.intent || 'Follow the authored week and keep the easy work easy.')}</p><p class="athlete-app-note">Record completed ${deliveryKind(record) === 'strength' ? 'strength' : 'running'} sessions in <strong>${appName(record)}</strong>. This website is your read-only reference.</p></div>
    <button class="text-action" type="button" data-athlete-view="plan">See the full week →</button>
  </section>`;
}

function planView(record, shownWeekId) {
  const weeks = (record.weeks || []).slice().sort((a,b) => a.week_number - b.week_number);
  if (!weeks.length) return noPlan(record);
  const week = weeks.find((item) => item.id === shownWeekId) || record.currentWeek || weeks[0];
  const index = weeks.findIndex((item) => item.id === week.id);
  const sessions = sessionsForWeek(record, week);
  const total = sessions.reduce((sum, session) => sum + (Number(session.currentVersion?.prescribed_distance) || 0), 0);
  return `<section class="athlete-view athlete-plan" id="plan">
    <div class="plan-title-row"><div><p class="eyebrow">Plan</p><h2>Week ${esc(week.week_number)}</h2><p>${fmt(week.starts_on)}${week.ends_on ? ` – ${fmt(week.ends_on)}` : ''}</p></div>
      <div class="plan-week-nav"><button type="button" data-week-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous week">‹</button><span>${esc(index + 1)} / ${esc(weeks.length)}</span><button type="button" data-week-step="1" ${index >= weeks.length - 1 ? 'disabled' : ''} aria-label="Next week">›</button></div>
    </div>
    ${week.intent ? `<p class="plan-intent">${esc(week.intent)}</p>` : ''}
    <div class="plan-summary"><span>${sessions.length} sessions</span>${total ? `<span>${Number(total.toFixed(1))} mi planned</span>` : ''}<span>${appName(record)} delivery</span></div>
    <div class="athlete-session-list">${sessions.map((session) => sessionCard(record, session)).join('') || '<p class="athlete-muted">No sessions have been published for this week.</p>'}</div>
    <p class="athlete-readonly">Your prescription is managed by Brice. Browsing another week does not change your current position.</p>
  </section>`;
}

function historyView(record) {
  const events = [];
  (record.completions || []).forEach((item) => events.push({ date:item.filed_at, type:'Session received', body:[item.actual_distance ? `${item.actual_distance} ${item.distance_unit || ''}` : '', item.athlete_note || ''].filter(Boolean).join(' · ') }));
  (record.reads || []).forEach((item) => events.push({ date:item.published_at || item.created_at, type:'Coach read', body:item.athlete_text }));
  (record.decisions || []).forEach((item) => events.push({ date:item.effective_on, type:'Training change', body:item.athlete_text }));
  events.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  return `<section class="athlete-view athlete-history" id="history"><p class="eyebrow">History</p><h2>What reached your record.</h2>
    <p class="athlete-muted">Planned work and received records stay distinct. No record received does not automatically mean a session was missed.</p>
    ${events.length ? `<div class="athlete-history-list">${events.map((event) => `<article><time>${fmt(event.date)}</time><div><b>${esc(event.type)}</b>${event.body ? `<p>${esc(event.body)}</p>` : ''}</div></article>`).join('')}</div>` : `<div class="athlete-empty compact"><h3>No history has reached this account yet.</h3><p>When ${appName(record)} records or coach-published changes arrive, they will appear here.</p></div>`}
  </section>`;
}

function accountView(record, email) {
  const athlete = record.athlete;
  const block = record.block;
  return `<section class="athlete-view athlete-account" id="account"><p class="eyebrow">Account</p><h2>${esc(athlete.display_name)}</h2>
    <div class="athlete-account-rows">
      <div><span>Signed in as</span><b>${esc(email || 'Not set')}</b></div>
      <div><span>Coaching</span><b>${esc(athlete.account_label || 'FORM athlete')}</b></div>
      <div><span>Training delivery</span><b>${appName(record)}</b></div>
      ${block ? `<div><span>Current block</span><b>Week ${esc(record.currentWeek?.week_number || block.current_week || '—')} of ${esc(block.total_weeks || record.weeks?.length || '—')}</b></div>` : ''}
    </div>
    <div class="athlete-account-actions"><button class="button" id="setPassword" type="button">Set a password</button><button class="button" id="linkApple" type="button" hidden>Link Apple</button><button class="button" id="changeEmail" type="button">Change email</button><a class="button" href="mailto:brice@speedandform.com?subject=FORM%20account%20help">Get help</a><button class="button quiet" id="accountSignOut" type="button">Sign out</button></div>
  </section>`;
}

export function renderAthleteWorkspace(record, { view='today', shownWeekId=null, email='' } = {}) {
  const safeView = ['today','plan','history','account'].includes(view) ? view : 'today';
  const content = safeView === 'plan' ? planView(record, shownWeekId)
    : safeView === 'history' ? historyView(record)
    : safeView === 'account' ? accountView(record, email)
    : todayView(record);
  return `<div class="athlete-workspace">${identity(record)}${workspaceNav(safeView)}<main class="athlete-workspace-main">${content}</main></div>`;
}
