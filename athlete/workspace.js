import { resolvedStrengthWeek } from './strength-fallback.js';
import { athleteWording, latestAthleteReviewChain } from '../private/review-chain.js';

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
  return /forge|sculpt|strength|physique|runner\s+mass/.test(text) ? 'strength' : 'running';
}

function deliveryProfile(record) {
  const appDelivered = record.athlete?.delivery === 'app';
  const discipline = deliveryKind(record);
  const app = discipline === 'strength' ? 'Forge' : 'FORM';
  return {
    appDelivered,
    discipline,
    app,
    modeLabel: appDelivered ? `${app} app` : 'Coach-managed',
    recordLabel: appDelivered ? app : 'With Brice',
    accountNote: appDelivered
      ? `${app} is the recording channel for completed ${discipline === 'strength' ? 'strength' : 'running'} sessions.`
      : 'Brice is managing completed-work records directly. This website is a read-only reference.'
  };
}

function appName(record) { return deliveryProfile(record).app; }

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
  // A week may retain superseded occurrences for evidence/history. Athlete-facing
  // prescription must only use the live authored occurrence for each day.
  const all = (record.sessionsByWeek?.[week.id] || [])
    .filter((session) => session.state !== 'cancelled' && !session.withdrawn_at);
  return DAY_ORDER.map((day) => all.find((session) => (session.day_label || '').toUpperCase().startsWith(day.slice(0,3)))).filter(Boolean);
}

function sessionCard(record, session) {
  const v = session.currentVersion || {};
  const completion = (record.completions || []).find((item) => item.planned_session_id === session.id);
  const direction = (record.directions || []).find((item) => item.planned_session_id === session.id);
  const directionWords = direction ? athleteWording(direction) : '';
  const distance = v.prescribed_distance ? `${esc(v.prescribed_distance)} ${esc(v.distance_unit || '')}` : '';
  return `<article class="athlete-session${completion ? ' received' : ''}">
    <div class="athlete-session-day"><span>${esc(session.day_label || '')}</span>${completion ? '<small>RECEIVED</small>' : ''}</div>
    <div class="athlete-session-copy"><h3>${esc(v.title || 'Session')}</h3>${distance ? `<b>${distance}</b>` : ''}
      ${(directionWords || v.intent) ? `<p>${esc(directionWords || v.intent)}</p>` : ''}
    </div>
  </article>`;
}

function noPlan(record) {
  const delivery = deliveryProfile(record);
  const copy = delivery.appDelivered
    ? `This account is ready. When Brice publishes training for you, it will appear here. Record completed sessions in ${delivery.app}.`
    : 'Your training is currently managed directly with Brice. When a web block is published for you, it will appear here. No filing is expected on this website.';
  return `<section class="athlete-empty"><p class="eyebrow">Training</p><h2>${delivery.appDelivered ? 'Your next block is not published here yet.' : 'Your training is coach-managed.'}</h2><p>${esc(copy)}</p>
    <div class="athlete-empty-facts" aria-label="Training status">
      <div><span>Delivery</span><b>${esc(delivery.modeLabel)}</b></div>
      <div><span>Training</span><b>Not published here</b></div>
      <div><span>Website</span><b>Read only</b></div>
    </div>
    <a href="mailto:brice@speedandform.com?subject=My%20FORM%20training" class="button">Ask Brice about your training →</a></section>`;
}

function fallbackToday(record, program) {
  return `<section class="athlete-view athlete-today strength-fallback" id="today">
    <div class="athlete-view-head"><div><p class="eyebrow">Development season</p><h2>Your development season is here.</h2></div><span>${esc(program.duration_weeks)} weeks</span></div>
    <div class="fallback-hero"><p>${esc(program.objective)}</p><p>${esc(program.principle)}</p></div>
    <div class="fallback-status" role="note"><strong>Web reference available.</strong><p>This is the coach-authored fallback for ${esc(program.title)}. It does not infer your current Forge week, create a workout receipt, or say anything has synced.</p></div>
    <div class="today-context"><p>${esc(program.weeks?.[0]?.intent || '')}</p><p class="athlete-app-note">Record completed strength sessions in <strong>Forge</strong> when you are using the accepted app workflow. Until then, this web plan remains the readable fallback.</p></div>
    <button class="text-action" type="button" data-athlete-view="plan">Open the 2026 plan →</button>
  </section>`;
}

function reviewNote(record) {
  const { read, direction } = latestAthleteReviewChain(record);
  if (!read) return '';
  const readWords = athleteWording(read);
  const directionWords = direction ? athleteWording(direction) : '';
  const session = direction
    ? (record.sessions || []).find((item) => item.id === direction.planned_session_id)
    : null;
  return `<section class="athlete-review-note" aria-label="Latest coach review">
    <p class="eyebrow">Coach review</p>
    <p>${esc(readWords)}</p>
    ${directionWords ? `<div><span>Next instruction${session?.day_label ? ` · ${esc(session.day_label)}` : ''}</span><strong>${esc(directionWords)}</strong></div>` : ''}
  </section>`;
}

function todayView(record, fallbackProgram) {
  const week = record.currentWeek || record.weeks?.[0] || null;
  if (!week) return fallbackProgram ? fallbackToday(record, fallbackProgram) : noPlan(record);
  const sessions = sessionsForWeek(record, week);
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date()).toUpperCase();
  const today = sessions.find((session) => (session.day_label || '').toUpperCase().startsWith(todayName.slice(0,3)));
  const next = today || sessions.find((session) => !(record.completions || []).some((c) => c.planned_session_id === session.id)) || sessions[0];
  return `<section class="athlete-view athlete-today" id="today">
    <div class="athlete-view-head"><div><p class="eyebrow">Today</p><h2>${today ? 'Your work today.' : 'Your current week.'}</h2></div><span>Week ${esc(week.week_number)}${record.block?.total_weeks ? ` / ${esc(record.block.total_weeks)}` : ''}</span></div>
    ${reviewNote(record)}
    ${next ? `<div class="today-focus">${sessionCard(record, next)}</div>` : '<p class="athlete-muted">No session is authored for today.</p>'}
    <div class="today-context"><p>${esc(week.intent || 'Follow the authored week and keep the easy work easy.')}</p><p class="athlete-app-note">${deliveryProfile(record).appDelivered
      ? `Record completed ${deliveryKind(record) === 'strength' ? 'strength' : 'running'} sessions in <strong>${appName(record)}</strong>. This website is your read-only reference.`
      : 'Brice is managing completed-work records directly. This website is your read-only reference; no filing is expected here.'}</p></div>
    <button class="text-action" type="button" data-athlete-view="plan">See the full week →</button>
  </section>`;
}

function fallbackDay(day) {
  return `<article class="fallback-day"><div class="fallback-day-head"><div><span>${esc(day.weekday)}</span><h3>${esc(day.title)}</h3></div><small>${esc(day.focus)}</small></div>
    <div class="fallback-exercises">${(day.exercises || []).map((exercise) => `<div><span>${esc(exercise.name)}</span><b>${esc(exercise.sets)} × ${esc(exercise.reps)}</b></div>`).join('')}</div></article>`;
}

function fallbackPlanView(program, fallbackWeek) {
  const week = resolvedStrengthWeek(program, fallbackWeek);
  const index = Math.max(0, program.weeks.findIndex((entry) => entry.week === week.week));
  return `<section class="athlete-view athlete-plan strength-fallback" id="plan">
    <div class="plan-title-row"><div><p class="eyebrow">Plan · web fallback</p><h2>Week ${String(week.week).padStart(2, '0')} · ${esc(week.name)}</h2><p>${esc(week.intent)}</p></div>
      <div class="plan-week-nav"><button type="button" data-fallback-week-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous week">‹</button><span>${index + 1} / ${program.weeks.length}</span><button type="button" data-fallback-week-step="1" ${index >= program.weeks.length - 1 ? 'disabled' : ''} aria-label="Next week">›</button></div>
    </div>
    ${week.progression_note ? `<p class="plan-intent">${esc(week.progression_note)}</p>` : ''}
    <div class="plan-summary"><span>${week.days.length} strength sessions</span><span>Record in Forge</span><span>Run week protected</span></div>
    <div class="fallback-days">${week.days.map(fallbackDay).join('')}</div>
    <div class="fallback-rules"><p class="eyebrow">Progression rules</p>${(program.progression_rules || []).map((rule, i) => `<div><b>${String(i + 1).padStart(2, '0')}</b><p>${esc(rule)}</p></div>`).join('')}</div>
    <div class="fallback-status"><strong>Position is not inferred from this page.</strong><p>Past web work remains past work. Opening another week here does not move Forge, create a completion, or fabricate earlier app history.</p>${program.overview_path ? `<a href="${esc(program.overview_path)}">Open the standalone phase overview →</a>` : ''}</div>
  </section>`;
}

function planView(record, shownWeekId, fallbackProgram, fallbackWeek) {
  const weeks = (record.weeks || []).slice().sort((a,b) => a.week_number - b.week_number);
  if (!weeks.length) return fallbackProgram ? fallbackPlanView(fallbackProgram, fallbackWeek) : noPlan(record);
  const week = weeks.find((item) => item.id === shownWeekId) || record.currentWeek || weeks[0];
  const index = weeks.findIndex((item) => item.id === week.id);
  const sessions = sessionsForWeek(record, week);
  const total = sessions.reduce((sum, session) => sum + (Number(session.currentVersion?.prescribed_distance) || 0), 0);
  return `<section class="athlete-view athlete-plan" id="plan">
    <div class="plan-title-row"><div><p class="eyebrow">Plan</p><h2>Week ${esc(week.week_number)}</h2><p>${fmt(week.starts_on)}${week.ends_on ? ` – ${fmt(week.ends_on)}` : ''}</p></div>
      <div class="plan-week-nav"><button type="button" data-week-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous week">‹</button><span>${esc(index + 1)} / ${esc(weeks.length)}</span><button type="button" data-week-step="1" ${index >= weeks.length - 1 ? 'disabled' : ''} aria-label="Next week">›</button></div>
    </div>
    ${week.intent ? `<p class="plan-intent">${esc(week.intent)}</p>` : ''}
    <div class="plan-summary"><span>${sessions.length} sessions</span>${total ? `<span>${Number(total.toFixed(1))} mi planned</span>` : ''}<span>${deliveryProfile(record).appDelivered ? `Record in ${appName(record)}` : 'Managed by Brice'}</span></div>
    <div class="athlete-session-list">${sessions.map((session) => sessionCard(record, session)).join('') || '<p class="athlete-muted">No sessions have been published for this week.</p>'}</div>
    <p class="athlete-readonly">Your prescription is managed by Brice. Browsing another week does not change your current position.</p>
  </section>`;
}

function historyView(record, fallbackProgram) {
  const events = [];
  (record.completions || []).forEach((item) => events.push({ date:item.filed_at, type:'Session received', body:[item.actual_distance ? `${item.actual_distance} ${item.distance_unit || ''}` : '', item.athlete_note || ''].filter(Boolean).join(' · ') }));
  (record.reads || []).forEach((item) => events.push({ date:item.published_at || item.created_at, type:'Coach review', body:athleteWording(item) }));
  (record.directions || []).forEach((item) => events.push({ date:item.published_at || item.created_at, type:'Next instruction', body:athleteWording(item) }));
  (record.decisions || []).forEach((item) => events.push({ date:item.effective_on, type:'Training change', body:item.athlete_text }));
  events.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  const empty = fallbackProgram
    ? `<div class="athlete-empty compact"><h3>No Forge history has reached this account yet.</h3><p>The three-week web fallback is available under Plan, but web-delivered work is not backfilled as a Forge receipt.</p></div>`
    : `<div class="athlete-empty compact"><h3>No history has reached this account yet.</h3><p>${deliveryProfile(record).appDelivered
      ? `When ${appName(record)} records or coach-published changes arrive, they will appear here.`
      : 'When Brice publishes a review, instruction, change, or received record, it will appear here.'}</p></div>`;
  return `<section class="athlete-view athlete-history" id="history"><p class="eyebrow">History</p><h2>What reached your record.</h2>
    <p class="athlete-muted">Planned work and received records stay distinct. No record received does not automatically mean a session was missed.</p>
    ${events.length ? `<div class="athlete-history-list">${events.map((event) => `<article><time>${fmt(event.date)}</time><div><b>${esc(event.type)}</b>${event.body ? `<p>${esc(event.body)}</p>` : ''}</div></article>`).join('')}</div>` : empty}
  </section>`;
}

function accountView(record, email, fallbackProgram) {
  const athlete = record.athlete;
  const block = record.block;
  const delivery = deliveryProfile(record);
  return `<section class="athlete-view athlete-account" id="account"><p class="eyebrow">Account</p><h2>${esc(athlete.display_name)}</h2>
    <div class="athlete-account-rows">
      <div><span>Signed in as</span><b>${esc(email || 'Not set')}</b></div>
      <div><span>Coaching</span><b>${esc(athlete.account_label || 'FORM athlete')}</b></div>
      <div><span>Delivery</span><b>${esc(delivery.modeLabel)}</b></div>
      <div><span>Completed work</span><b>${esc(delivery.recordLabel)}</b></div>
      ${block ? `<div><span>Current block</span><b>Week ${esc(record.currentWeek?.week_number || block.current_week || '—')} of ${esc(block.total_weeks || record.weeks?.length || '—')}</b></div>` : ''}
      ${fallbackProgram ? `<div><span>Web reference</span><b>${esc(fallbackProgram.title)} · ${esc(fallbackProgram.duration_weeks)} weeks</b></div>` : ''}
    </div>
    <p class="athlete-readonly">${esc(delivery.accountNote)}${fallbackProgram ? ' A web fallback is available; it does not claim Forge receipt delivery or infer your native position.' : ''}</p>
    <div class="athlete-account-actions"><button class="button" id="setPassword" type="button">Set a password</button><button class="button" id="linkApple" type="button" hidden>Link Apple</button><button class="button" id="changeEmail" type="button">Change email</button><a class="button" href="mailto:brice@speedandform.com?subject=FORM%20account%20help">Get help</a><button class="button quiet" id="accountSignOut" type="button">Sign out</button></div>
  </section>`;
}

export function renderAthleteWorkspace(record, { view='today', shownWeekId=null, email='', fallbackProgram=null, fallbackWeek=1 } = {}) {
  const safeView = ['today','plan','history','account'].includes(view) ? view : 'today';
  const content = safeView === 'plan' ? planView(record, shownWeekId, fallbackProgram, fallbackWeek)
    : safeView === 'history' ? historyView(record, fallbackProgram)
    : safeView === 'account' ? accountView(record, email, fallbackProgram)
    : todayView(record, fallbackProgram);
  return `<div class="athlete-workspace">${identity(record)}${workspaceNav(safeView)}<main class="athlete-workspace-main">${content}</main></div>`;
}
