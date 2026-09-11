import { supabase } from '/private/supabase-client.js';
import { saveConsolePreferences } from '/private/data.js';

const OPERATING = ['rod', 'devin', 'natalie', 'valerie'];
const state = {
  athletes: new Map(),
  weekRows: new Map(),
  todos: new Map(),
  tallies: new Map(),
  currentSlug: null,
  athleteWeekOffset: 0,
  calendarWeekOffset: 0,
  tablesReady: true,
  tallyReady: true,
  scheduled: false
};

const relationMissing = (error) => ['42P01', 'PGRST205'].includes(error?.code);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

function isoLocal(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function weekMonday(offset = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset * 7);
  return date;
}
function addDays(start, amount) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return isoLocal(date);
}
function rangeLabel(start) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(a); b.setDate(b.getDate() + 6);
  const first = a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const last = b.toLocaleDateString(undefined, { month: a.getMonth() === b.getMonth() ? undefined : 'short', day: 'numeric' });
  return `${first}–${last}`;
}
function dayWord(date) { return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(); }
function timeWord(value) {
  if (!value) return '';
  const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}
function activeSlug() { return document.querySelector('.ccAthlete.active')?.dataset.slug || null; }
function athleteById(id) { return [...state.athletes.values()].find((row) => row.id === id) || null; }
function sourceName(source) { return source === 'google' ? 'Google Calendar' : source === 'form' ? 'FORM' : 'Coach'; }

async function hydrateAthletes() {
  const slugs = [...new Set([...document.querySelectorAll('.ccAthlete[data-slug]')].map((node) => node.dataset.slug))];
  const missing = slugs.filter((slug) => slug && !state.athletes.has(slug));
  if (!missing.length) return;
  const { data, error } = await supabase.from('athletes').select('id,slug,first_name').in('slug', missing);
  if (error) throw error;
  (data || []).forEach((row) => state.athletes.set(row.slug, row));
}

async function loadWeek(start) {
  if (state.weekRows.has(start)) return state.weekRows.get(start);
  await hydrateAthletes();
  const ids = OPERATING.map((slug) => state.athletes.get(slug)?.id).filter(Boolean);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('coach_week_items').select('*')
    .in('athlete_id', ids).eq('week_starts_on', start).neq('status', 'cancelled')
    .order('scheduled_on').order('time_local');
  if (error) {
    if (relationMissing(error)) { state.tablesReady = false; return []; }
    throw error;
  }
  const rows = data || [];
  state.weekRows.set(start, rows);
  return rows;
}

async function loadTodos(athleteId) {
  if (state.todos.has(athleteId)) return state.todos.get(athleteId);
  const { data, error } = await supabase.from('coach_todos').select('*')
    .eq('athlete_id', athleteId).is('completed_at', null)
    .order('due_on', { ascending: true, nullsFirst: false }).order('position');
  if (error) {
    if (relationMissing(error)) { state.tablesReady = false; return []; }
    throw error;
  }
  const rows = data || [];
  state.todos.set(athleteId, rows);
  return rows;
}

async function loadTally(athleteId, start) {
  const key = `${athleteId}:${start}`;
  if (state.tallies.has(key)) return state.tallies.get(key);
  const { data, error } = await supabase.from('coach_week_tallies').select('*')
    .eq('athlete_id', athleteId).eq('week_starts_on', start).eq('metric', 'running_days').maybeSingle();
  if (error) {
    if (relationMissing(error)) { state.tallyReady = false; return null; }
    throw error;
  }
  state.tallies.set(key, data || null);
  return data || null;
}

function itemMarkup(item) {
  const content = `<time>${escapeHtml(timeWord(item.time_local) || 'All week')}</time><strong>${escapeHtml(item.title)}</strong>
    ${item.location ? `<small>${escapeHtml(item.location)}</small>` : ''}<small>${escapeHtml(sourceName(item.source))}</small>`;
  return item.source === 'google' && item.source_url
    ? `<a class="ccOpsEvent" data-source="google" data-kind="${escapeHtml(item.kind)}" href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener">${content}</a>`
    : `<div class="ccOpsEvent" data-source="${escapeHtml(item.source)}" data-kind="${escapeHtml(item.kind)}">${content}</div>`;
}

async function paintAthleteWeek(slug) {
  if (!OPERATING.includes(slug)) return;
  const section = document.querySelector('.ccWeek');
  const athlete = state.athletes.get(slug);
  if (!section || !athlete) return;
  const start = isoLocal(weekMonday(state.athleteWeekOffset));
  const token = `${slug}:${start}`;
  if (section.dataset.opsWeek === token) return;
  const rows = (await loadWeek(start)).filter((row) => row.athlete_id === athlete.id);
  if (!state.tablesReady || activeSlug() !== slug) return;
  const standing = rows.filter((row) => !row.scheduled_on);
  const today = isoLocal(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const items = rows.filter((row) => row.scheduled_on === date);
    return `<div class="ccDay ccOpsDay${date === today ? ' today' : ''}"><div class="ccDayName"><span>${dayWord(date)}</span><b>${Number(date.slice(8))}</b></div>
      ${items.length ? items.map(itemMarkup).join('') : '<div class="ccOpsCalendarEmpty">—</div>'}</div>`;
  }).join('');
  section.dataset.opsWeek = token;
  section.classList.add('ccOpsWeek');
  section.innerHTML = `<header><div class="ccWeekHeading"><div><h2>${state.athleteWeekOffset === 0 ? 'This week' : 'Week'}</h2><p>${escapeHtml(rangeLabel(start))}</p></div>
      <nav class="ccWeekNav"><button type="button" data-ops-week="-1" aria-label="Previous week">←</button><button type="button" data-ops-week="1" aria-label="Next week">→</button></nav></div>
      <button class="ccQuiet" type="button" data-open-coaching-calendar>Coaching calendar</button></header>
    ${standing.length ? `<div class="ccOpsAllWeek"><b>All week</b><span>${standing.map((row) => `${escapeHtml(row.title)}${row.duration_minutes ? ` · ${row.duration_minutes} min` : ''}`).join(' · ')}</span><small>${standing.map((row) => sourceName(row.source)).join(' · ')}</small></div>` : ''}
    <div class="ccDays">${days}</div><div class="ccOpsWeekSource">Calendar appointments are logistics. FORM work stays FORM-authored.</div>`;
  section.querySelectorAll('[data-ops-week]').forEach((button) => button.addEventListener('click', () => {
    state.athleteWeekOffset += Number(button.dataset.opsWeek);
    section.removeAttribute('data-ops-week');
    paintAthleteWeek(slug).catch(console.error);
  }));
  section.querySelector('[data-open-coaching-calendar]')?.addEventListener('click', openCalendar);
}

async function paintTodos(slug) {
  const notes = document.querySelector('.ccNotes');
  const athlete = state.athletes.get(slug);
  if (!notes || !athlete) return;
  let panel = document.querySelector('.ccTodoPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'ccTodoPanel';
    notes.parentNode.insertBefore(panel, notes);
  }
  if (panel.dataset.athlete === athlete.id) return;
  const rows = await loadTodos(athlete.id);
  if (!state.tablesReady || activeSlug() !== slug) return;
  panel.dataset.athlete = athlete.id;
  panel.innerHTML = `<div class="ccTodoHead"><h2>Tasks</h2><button type="button" data-todo-add>＋ Add</button></div>
    <div class="ccTodoRows">${rows.length ? rows.map((row) => `<label class="ccTodoRow"><input type="checkbox" data-todo-done="${escapeHtml(row.id)}"><p>${escapeHtml(row.body)}</p>${row.due_on ? `<time>${escapeHtml(new Date(`${row.due_on}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</time>` : '<span></span>'}</label>`).join('') : '<div class="ccTodoEmpty">Nothing waiting.</div>'}</div>
    <form class="ccTodoAdd" hidden><input name="body" maxlength="240" placeholder="What do you need to remember?" required><input name="due" type="date" aria-label="Due date"><button type="submit">Keep</button></form>`;

  const add = panel.querySelector('.ccTodoAdd');
  panel.querySelector('[data-todo-add]').addEventListener('click', () => { add.hidden = !add.hidden; if (!add.hidden) add.elements.body.focus(); });
  panel.querySelectorAll('[data-todo-done]').forEach((box) => box.addEventListener('change', async () => {
    box.disabled = true;
    const { error } = await supabase.from('coach_todos').update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', box.dataset.todoDone);
    if (error) { box.checked = false; box.disabled = false; return; }
    state.todos.delete(athlete.id);
    panel.removeAttribute('data-athlete');
    paintTodos(slug).catch(console.error);
  }));
  add.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = add.elements.body.value.trim();
    if (!body) return;
    const button = add.querySelector('button[type="submit"]'); button.disabled = true;
    const position = Math.max(0, ...rows.map((row) => Number(row.position || 0))) + 1;
    const { error } = await supabase.from('coach_todos').insert({ athlete_id: athlete.id, body, due_on: add.elements.due.value || null, position });
    if (error) { button.disabled = false; return; }
    state.todos.delete(athlete.id);
    panel.removeAttribute('data-athlete');
    paintTodos(slug).catch(console.error);
  });
}

async function paintConsistency(slug) {
  if (!['natalie', 'valerie'].includes(slug)) return;
  const athlete = state.athletes.get(slug);
  const card = document.querySelector(slug === 'natalie' ? '.ccConsistency' : '.ccBaseline');
  if (!athlete || !card) return;
  const start = isoLocal(weekMonday());
  const token = `${athlete.id}:${start}`;
  if (card.dataset.opsTally === token) return;
  const tally = await loadTally(athlete.id, start);
  if (!state.tallyReady || activeSlug() !== slug) return;
  card.dataset.opsTally = token;
  if (slug === 'natalie') {
    const number = card.querySelector('.ccConsistencyDose strong'); if (number) number.textContent = '10';
    const unit = card.querySelector('.ccConsistencyDose span'); if (unit) unit.innerHTML = 'min<br>per run';
  }
  card.querySelector('.ccConsistencyOps')?.remove();
  const value = tally?.value ?? null;
  const fact = slug === 'natalie'
    ? 'Coach-supplied baseline: about 4 mi outdoors with stops · 6 mi treadmill is separate evidence.'
    : '400 m easy practice · continuous running baseline still to establish.';
  card.insertAdjacentHTML('beforeend', `<div class="ccConsistencyOps"><div class="ccConsistencyOpsHead"><strong>${slug === 'natalie' ? '10 min practice' : '400 m practice'}</strong><span>${escapeHtml(rangeLabel(start))} · ${value == null ? 'total not entered' : `${value} running day${value === 1 ? '' : 's'}`}</span></div>
    <div class="ccConsistencyChoices">${Array.from({ length: 8 }, (_, n) => `<button type="button" data-days="${n}" class="${value != null && n <= value ? 'on' : ''}" aria-pressed="${value === n}">${n}</button>`).join('')}</div><div class="ccConsistencyFact">${escapeHtml(fact)}</div></div>`);
  card.querySelectorAll('[data-days]').forEach((button) => button.addEventListener('click', async () => {
    const value = Number(button.dataset.days);
    card.querySelectorAll('[data-days]').forEach((node) => { node.disabled = true; });
    const { error } = await supabase.from('coach_week_tallies').upsert({ athlete_id: athlete.id, week_starts_on: start, metric: 'running_days', value, updated_at: new Date().toISOString() }, { onConflict: 'athlete_id,week_starts_on,metric' });
    if (error) return;
    state.tallies.delete(token);
    card.removeAttribute('data-ops-tally');
    paintConsistency(slug).catch(console.error);
  }));
}

function ensureCalendarDialog() {
  let dialog = document.getElementById('ccCoachingCalendar');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'ccCoachingCalendar'; dialog.className = 'ccOpsDialog';
  dialog.innerHTML = `<div class="ccOpsDialogInner"><header class="ccOpsDialogHead"><div><h2>Coaching calendar</h2><p id="ccCalendarRange"></p></div><div class="ccOpsDialogTools"><button data-calendar-step="-1" aria-label="Previous week">←</button><button data-calendar-step="1" aria-label="Next week">→</button><button data-calendar-close aria-label="Close">×</button></div></header><div id="ccCalendarBody"></div></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('[data-calendar-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-calendar-step]').forEach((button) => button.addEventListener('click', () => { state.calendarWeekOffset += Number(button.dataset.calendarStep); paintCalendar().catch(console.error); }));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  return dialog;
}

async function paintCalendar() {
  const dialog = ensureCalendarDialog();
  const start = isoLocal(weekMonday(state.calendarWeekOffset));
  const rows = await loadWeek(start);
  if (!state.tablesReady) return;
  dialog.querySelector('#ccCalendarRange').textContent = rangeLabel(start);
  const standing = rows.filter((row) => !row.scheduled_on);
  const allWeek = standing.length ? `<div class="ccOpsCalendarAllWeek">${standing.map((row) => `<span>${escapeHtml(athleteById(row.athlete_id)?.first_name || '')} · ${escapeHtml(row.title)}</span>`).join('')}</div>` : '';
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const events = rows.filter((row) => row.scheduled_on === date).sort((a, b) => String(a.time_local || '').localeCompare(String(b.time_local || '')));
    return `<section class="ccOpsCalendarDay"><div class="ccOpsCalendarDate"><span>${dayWord(date)}</span><b>${Number(date.slice(8))}</b></div>${events.length ? events.map((row) => {
      const athlete = athleteById(row.athlete_id);
      const inside = `<time>${escapeHtml(timeWord(row.time_local))}</time><b>${escapeHtml(athlete?.first_name || '')}</b><span>${escapeHtml(row.title)}</span>${row.location ? `<small>${escapeHtml(row.location)}</small>` : ''}<small>${escapeHtml(sourceName(row.source))}</small>`;
      return `<div class="ccOpsCalendarEvent" data-source="${escapeHtml(row.source)}">${row.source === 'google' && row.source_url ? `<a href="${escapeHtml(row.source_url)}" target="_blank" rel="noopener">${inside}</a>` : inside}</div>`;
    }).join('') : '<div class="ccOpsCalendarEmpty">No coaching</div>'}</section>`;
  }).join('');
  dialog.querySelector('#ccCalendarBody').innerHTML = `${allWeek}<div class="ccOpsCalendar">${days}</div><div class="ccOpsCalendarLegend"><span><i></i>FORM / coach</span><span><i></i>Google Calendar</span></div>`;
}
async function openCalendar() {
  state.calendarWeekOffset = 0;
  const dialog = ensureCalendarDialog();
  await paintCalendar();
  if (state.tablesReady && !dialog.open) dialog.showModal();
}

function calendarDoor() {
  const roster = document.querySelector('.ccRoster');
  const rail = document.querySelector('.ccRail');
  if (!roster || !rail || rail.querySelector('.ccRailAction')) return;
  const button = document.createElement('button');
  button.className = 'ccRailAction'; button.type = 'button';
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"></rect><path d="M7 3v4M17 3v4M3.5 9.5h17"></path></svg><span>Coaching calendar</span>`;
  roster.insertAdjacentElement('afterend', button);
  button.addEventListener('click', openCalendar);
}

function collapseIcon() {
  const button = document.querySelector('[data-collapse-rail]');
  if (!button) return;
  const collapsed = document.querySelector('.ccApp')?.classList.contains('railCollapsed') || false;
  const key = collapsed ? 'closed' : 'open';
  if (button.dataset.opsCollapse === key) return;
  button.dataset.opsCollapse = key;
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}"></path></svg>`;
  button.setAttribute('aria-label', collapsed ? 'Expand athlete rail' : 'Collapse athlete rail');
  if (!button.dataset.opsCollapseBound) {
    button.dataset.opsCollapseBound = '1';
    button.addEventListener('click', () => requestAnimationFrame(collapseIcon));
  }
}

async function persistRoster(roster) {
  await hydrateAthletes();
  const ids = [...roster.querySelectorAll('.ccAthlete[data-slug]')].map((node) => state.athletes.get(node.dataset.slug)?.id).filter(Boolean);
  if (ids.length) await saveConsolePreferences({ roster_order: ids });
}
function bindDrag() {
  const roster = document.querySelector('.ccRoster');
  if (!roster || roster.dataset.dragBound) return;
  roster.dataset.dragBound = '1';
  let moving = null;
  roster.querySelectorAll('.ccAthlete[data-slug]').forEach((item) => {
    item.draggable = true;
    item.addEventListener('dragstart', (event) => { moving = item; item.classList.add('ccDragging'); event.dataTransfer.effectAllowed = 'move'; });
    item.addEventListener('dragend', () => { roster.querySelectorAll('.ccAthlete').forEach((node) => node.classList.remove('ccDragging', 'ccDropBefore', 'ccDropAfter')); moving = null; });
    item.addEventListener('dragover', (event) => { if (!moving || moving === item) return; event.preventDefault(); const before = event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2; item.classList.toggle('ccDropBefore', before); item.classList.toggle('ccDropAfter', !before); });
    item.addEventListener('dragleave', () => item.classList.remove('ccDropBefore', 'ccDropAfter'));
    item.addEventListener('drop', (event) => { if (!moving || moving === item) return; event.preventDefault(); const before = event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2; roster.insertBefore(moving, before ? item : item.nextSibling); persistRoster(roster).catch(console.error); });
  });
}

async function paint() {
  await hydrateAthletes();
  calendarDoor(); collapseIcon(); bindDrag();
  const slug = activeSlug();
  if (!slug) return;
  if (slug !== state.currentSlug) { state.currentSlug = slug; state.athleteWeekOffset = 0; }
  await Promise.all([paintAthleteWeek(slug), paintTodos(slug), paintConsistency(slug)]);
}
function schedulePaint() {
  if (state.scheduled) return;
  state.scheduled = true;
  requestAnimationFrame(async () => {
    state.scheduled = false;
    try { await paint(); } catch (error) { if (!relationMissing(error)) console.error('[Console workflow]', error); }
  });
}
new MutationObserver(schedulePaint).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
schedulePaint();
