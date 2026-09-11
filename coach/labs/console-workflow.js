import { supabase } from '/private/supabase-client.js';
import { saveConsolePreferences } from '/private/data.js';

const COACHING_SLUGS = ['rod', 'devin', 'natalie', 'valerie'];
const DAY = 86400000;
const state = {
  athletes: new Map(),
  weekCache: new Map(),
  todoCache: new Map(),
  tallyCache: new Map(),
  opsAvailable: null,
  tallyAvailable: null,
  activeSlug: null,
  athleteWeekOffset: 0,
  calendarWeekOffset: 0,
  decorating: false
};

const missingRelation = (error) => ['42P01', 'PGRST205'].includes(error?.code);
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

function localISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monday(offset = 0) {
  const now = new Date();
  const copy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - weekday + offset * 7);
  return copy;
}

function addDaysISO(start, amount) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localISO(date);
}

function rangeLabel(start) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(a.getTime() + 6 * DAY);
  const left = a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const right = b.toLocaleDateString(undefined, { month: a.getMonth() === b.getMonth() ? undefined : 'short', day: 'numeric' });
  return `${left}–${right}`;
}

function dayName(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
}

function timeLabel(raw) {
  if (!raw) return '';
  const [hh, mm] = String(raw).slice(0, 5).split(':').map(Number);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour = hh % 12 || 12;
  return `${hour}:${String(mm || 0).padStart(2, '0')} ${suffix}`;
}

function activeSlug() {
  return document.querySelector('.ccAthlete.active')?.dataset.slug || null;
}

async function ensureAthletes() {
  const slugs = [...new Set([...document.querySelectorAll('.ccAthlete[data-slug]')].map((node) => node.dataset.slug).filter(Boolean))];
  const missing = slugs.filter((slug) => !state.athletes.has(slug));
  if (!missing.length) return;
  const { data, error } = await supabase.from('athletes').select('id,slug,first_name').in('slug', missing);
  if (error) throw error;
  (data || []).forEach((athlete) => state.athletes.set(athlete.slug, athlete));
}

async function weekItems(weekStart) {
  if (state.weekCache.has(weekStart)) return state.weekCache.get(weekStart);
  await ensureAthletes();
  const ids = COACHING_SLUGS.map((slug) => state.athletes.get(slug)?.id).filter(Boolean);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('coach_week_items').select('*')
    .in('athlete_id', ids).eq('week_starts_on', weekStart)
    .neq('status', 'cancelled').order('scheduled_on').order('time_local');
  if (error) {
    if (missingRelation(error)) { state.opsAvailable = false; return []; }
    throw error;
  }
  state.opsAvailable = true;
  const rows = data || [];
  state.weekCache.set(weekStart, rows);
  return rows;
}

async function todosFor(athleteId) {
  if (state.todoCache.has(athleteId)) return state.todoCache.get(athleteId);
  const { data, error } = await supabase.from('coach_todos').select('*')
    .eq('athlete_id', athleteId).is('completed_at', null)
    .order('due_on', { ascending: true, nullsFirst: false }).order('position');
  if (error) {
    if (missingRelation(error)) { state.opsAvailable = false; return []; }
    throw error;
  }
  state.opsAvailable = true;
  const rows = data || [];
  state.todoCache.set(athleteId, rows);
  return rows;
}

async function tallyFor(athleteId, weekStart) {
  const key = `${athleteId}:${weekStart}`;
  if (state.tallyCache.has(key)) return state.tallyCache.get(key);
  const { data, error } = await supabase.from('coach_week_tallies').select('*')
    .eq('athlete_id', athleteId).eq('week_starts_on', weekStart).eq('metric', 'running_days').maybeSingle();
  if (error) {
    if (missingRelation(error)) { state.tallyAvailable = false; return null; }
    throw error;
  }
  state.tallyAvailable = true;
  state.tallyCache.set(key, data || null);
  return data || null;
}

function athleteForId(id) {
  return [...state.athletes.values()].find((athlete) => athlete.id === id) || null;
}

function sourceWord(source) {
  if (source === 'google') return 'Google Calendar';
  if (source === 'form') return 'FORM';
  return 'Coach';
}

function eventHtml(item, compact = false) {
  const body = `<time>${esc(timeLabel(item.time_local) || (item.scheduled_on ? 'Time open' : 'All week'))}</time>
    <strong>${esc(item.title)}</strong>
    ${item.location && !compact ? `<small>${esc(item.location)}</small>` : ''}
    ${!compact ? `<small>${esc(sourceWord(item.source))}</small>` : ''}`;
  if (item.source === 'google' && item.source_url) {
    return `<a class="ccOpsEvent" data-source="google" data-kind="${esc(item.kind)}" href="${esc(item.source_url)}" target="_blank" rel="noopener">${body}</a>`;
  }
  return `<div class="ccOpsEvent" data-source="${esc(item.source)}" data-kind="${esc(item.kind)}">${body}</div>`;
}

function weekMarkup(slug, weekStart, rows) {
  const athlete = state.athletes.get(slug);
  const mine = rows.filter((row) => row.athlete_id === athlete?.id);
  const standing = mine.filter((row) => !row.scheduled_on);
  const today = localISO(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysISO(weekStart, index);
    const onDay = mine.filter((row) => row.scheduled_on === date);
    return `<div class="ccDay ccOpsDay${date === today ? ' today' : ''}">
      <div class="ccDayName"><span>${esc(dayName(date))}</span><b>${esc(Number(date.slice(8)))}</b></div>
      ${onDay.length ? onDay.map((item) => eventHtml(item)).join('') : '<div class="ccOpsCalendarEmpty">—</div>'}
    </div>`;
  }).join('');
  return `<header><div class="ccWeekHeading"><div><h2>${state.athleteWeekOffset === 0 ? 'This week' : 'Week'}</h2>
      <p>${esc(rangeLabel(weekStart))}</p></div>
      <nav class="ccWeekNav" aria-label="Choose coaching week">
        <button type="button" data-ops-week-step="-1" aria-label="Previous week">←</button>
        <button type="button" data-ops-week-step="1" aria-label="Next week">→</button>
      </nav></div>
      <button class="ccQuiet" type="button" data-open-coaching-calendar>Coaching calendar</button></header>
    ${standing.length ? `<div class="ccOpsAllWeek"><b>All week</b><span>${standing.map((item) => `${esc(item.title)}${item.duration_minutes ? ` · ${esc(item.duration_minutes)} min` : ''}`).join(' · ')}</span><small>${standing.map((item) => esc(sourceWord(item.source))).join(' · ')}</small></div>` : ''}
    <div class="ccDays">${days}</div>
    <div class="ccOpsWeekSource">Calendar appointments are logistics. FORM work stays FORM-authored.</div>`;
}

async function renderAthleteWeek(slug) {
  if (!COACHING_SLUGS.includes(slug)) return;
  const section = document.querySelector('.ccWeek');
  if (!section) return;
  const weekStart = localISO(monday(state.athleteWeekOffset));
  if (section.dataset.opsWeek === `${slug}:${weekStart}`) return;
  const rows = await weekItems(weekStart);
  if (activeSlug() !== slug || !state.opsAvailable) return;
  section.dataset.opsWeek = `${slug}:${weekStart}`;
  section.classList.add('ccOpsWeek');
  section.innerHTML = weekMarkup(slug, weekStart, rows);
  section.querySelectorAll('[data-ops-week-step]').forEach((button) => button.addEventListener('click', () => {
    state.athleteWeekOffset += Number(button.dataset.opsWeekStep);
    section.removeAttribute('data-ops-week');
    renderAthleteWeek(slug).catch(console.error);
  }));
  section.querySelector('[data-open-coaching-calendar]')?.addEventListener('click', openCalendar);
}

function todoMarkup(rows) {
  return `<div class="ccTodoHead"><h2>Tasks</h2><button type="button" data-add-todo>＋ Add</button></div>
    <div class="ccTodoRows">${rows.length ? rows.map((todo) => `<label class="ccTodoRow">
      <input type="checkbox" data-complete-todo="${esc(todo.id)}">
      <p>${esc(todo.body)}</p>
      ${todo.due_on ? `<time datetime="${esc(todo.due_on)}">${esc(new Date(`${todo.due_on}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</time>` : '<span></span>'}
    </label>`).join('') : '<div class="ccTodoEmpty">Nothing waiting.</div>'}</div>
    <form class="ccTodoAdd" hidden>
      <input name="body" maxlength="240" autocomplete="off" placeholder="What do you need to remember?" required>
      <input name="due" type="date" aria-label="Due date">
      <button type="submit">Keep</button>
    </form>`;
}

async function renderTodos(slug) {
  await ensureAthletes();
  const athlete = state.athletes.get(slug);
  const notes = document.querySelector('.ccNotes');
  if (!athlete || !notes) return;
  let panel = document.querySelector('.ccTodoPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'ccTodoPanel';
    notes.parentNode.insertBefore(panel, notes);
  }
  if (panel.dataset.athleteId === athlete.id) return;
  const rows = await todosFor(athlete.id);
  if (activeSlug() !== slug || !state.opsAvailable) return;
  panel.dataset.athleteId = athlete.id;
  panel.innerHTML = todoMarkup(rows);
  panel.querySelector('[data-add-todo]')?.addEventListener('click', () => {
    const form = panel.querySelector('.ccTodoAdd');
    form.hidden = !form.hidden;
    if (!form.hidden) form.elements.body.focus();
  });
  panel.querySelectorAll('[data-complete-todo]').forEach((checkbox) => checkbox.addEventListener('change', async () => {
    checkbox.disabled = true;
    const { error } = await supabase.from('coach_todos').update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', checkbox.dataset.completeTodo);
    if (error) { checkbox.disabled = false; checkbox.checked = false; return; }
    state.todoCache.delete(athlete.id);
    panel.removeAttribute('data-athlete-id');
    renderTodos(slug).catch(console.error);
  }));
  panel.querySelector('.ccTodoAdd')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = form.elements.body.value.trim();
    if (!body) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const due = form.elements.due.value || null;
    const position = Math.max(0, ...rows.map((row) => Number(row.position || 0))) + 1;
    const { error } = await supabase.from('coach_todos').insert({ athlete_id: athlete.id, body, due_on: due, position });
    if (error) { button.disabled = false; return; }
    state.todoCache.delete(athlete.id);
    panel.removeAttribute('data-athlete-id');
    renderTodos(slug).catch(console.error);
  });
}

async function renderConsistency(slug) {
  if (slug !== 'natalie' && slug !== 'valerie') return;
  await ensureAthletes();
  const athlete = state.athletes.get(slug);
  const card = document.querySelector(slug === 'valerie' ? '.ccBaseline' : '.ccConsistency') || document.querySelector('.ccBaseline,.ccConsistency');
  if (!athlete || !card) return;
  const weekStart = localISO(monday(0));
  const key = `${athlete.id}:${weekStart}`;
  if (card.dataset.opsTally === key) return;
  const tally = await tallyFor(athlete.id, weekStart);
  if (activeSlug() !== slug || state.tallyAvailable === false) return;
  card.dataset.opsTally = key;

  if (slug === 'natalie') {
    const dose = card.querySelector('.ccConsistencyDose strong');
    if (dose) dose.textContent = '10';
    const unit = card.querySelector('.ccConsistencyDose span');
    if (unit) unit.innerHTML = 'min<br>per run';
  }

  const existing = card.querySelector('.ccConsistencyOps');
  if (existing) existing.remove();
  const value = tally?.value ?? null;
  const fact = slug === 'natalie'
    ? 'Coach-supplied baseline: about 4 mi outdoors with stops · 6 mi treadmill is separate evidence.'
    : '400 m easy practice · continuous running baseline still to establish.';
  card.insertAdjacentHTML('beforeend', `<div class="ccConsistencyOps">
    <div class="ccConsistencyOpsHead"><strong>${slug === 'natalie' ? '10 min practice' : '400 m practice'}</strong><span>${esc(rangeLabel(weekStart))} · ${value == null ? 'total not entered' : `${value} running day${value === 1 ? '' : 's'}`}</span></div>
    <div class="ccConsistencyChoices" role="group" aria-label="Running days this week">
      ${Array.from({ length: 8 }, (_, index) => `<button type="button" data-running-days="${index}" class="${value != null && index <= value ? 'on' : ''}" aria-pressed="${value === index}">${index}</button>`).join('')}
    </div>
    <div class="ccConsistencyFact">${esc(fact)}</div>
  </div>`);
  card.querySelectorAll('[data-running-days]').forEach((button) => button.addEventListener('click', async () => {
    const next = Number(button.dataset.runningDays);
    card.querySelectorAll('[data-running-days]').forEach((node) => { node.disabled = true; });
    const { error } = await supabase.from('coach_week_tallies').upsert({
      athlete_id: athlete.id, week_starts_on: weekStart, metric: 'running_days', value: next, updated_at: new Date().toISOString()
    }, { onConflict: 'athlete_id,week_starts_on,metric' });
    if (error) return;
    state.tallyCache.delete(key);
    card.removeAttribute('data-ops-tally');
    renderConsistency(slug).catch(console.error);
  }));
}

function calendarShell() {
  let dialog = document.getElementById('ccCoachingCalendar');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'ccCoachingCalendar';
  dialog.className = 'ccOpsDialog';
  dialog.innerHTML = `<div class="ccOpsDialogInner">
    <header class="ccOpsDialogHead"><div><h2>Coaching calendar</h2><p id="ccCalendarRange"></p></div>
      <div class="ccOpsDialogTools"><button type="button" data-calendar-step="-1" aria-label="Previous week">←</button><button type="button" data-calendar-step="1" aria-label="Next week">→</button><button type="button" data-calendar-close aria-label="Close">×</button></div></header>
    <div id="ccCalendarBody"></div>
  </div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('[data-calendar-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.querySelectorAll('[data-calendar-step]').forEach((button) => button.addEventListener('click', () => {
    state.calendarWeekOffset += Number(button.dataset.calendarStep);
    renderCalendar().catch(console.error);
  }));
  return dialog;
}

async function renderCalendar() {
  const dialog = calendarShell();
  const weekStart = localISO(monday(state.calendarWeekOffset));
  const rows = await weekItems(weekStart);
  if (!state.opsAvailable) return;
  const body = dialog.querySelector('#ccCalendarBody');
  dialog.querySelector('#ccCalendarRange').textContent = rangeLabel(weekStart);
  const standing = rows.filter((row) => !row.scheduled_on);
  const allWeek = standing.length ? `<div class="ccOpsCalendarAllWeek">${standing.map((item) => {
    const athlete = athleteForId(item.athlete_id);
    return `<span>${esc(athlete?.first_name || '')} · ${esc(item.title)}</span>`;
  }).join('')}</div>` : '';
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysISO(weekStart, index);
    const onDay = rows.filter((row) => row.scheduled_on === date).sort((a, b) => String(a.time_local || '').localeCompare(String(b.time_local || '')));
    return `<section class="ccOpsCalendarDay"><div class="ccOpsCalendarDate"><span>${esc(dayName(date))}</span><b>${esc(Number(date.slice(8)))}</b></div>
      ${onDay.length ? onDay.map((item) => {
        const athlete = athleteForId(item.athlete_id);
        const content = `<time>${esc(timeLabel(item.time_local))}</time><b>${esc(athlete?.first_name || '')}</b><span>${esc(item.title)}</span>${item.location ? `<small>${esc(item.location)}</small>` : ''}<small>${esc(sourceWord(item.source))}</small>`;
        return item.source === 'google' && item.source_url
          ? `<div class="ccOpsCalendarEvent" data-source="google"><a href="${esc(item.source_url)}" target="_blank" rel="noopener">${content}</a></div>`
          : `<div class="ccOpsCalendarEvent" data-source="${esc(item.source)}">${content}</div>`;
      }).join('') : '<div class="ccOpsCalendarEmpty">No coaching</div>'}
    </section>`;
  }).join('');
  body.innerHTML = `${allWeek}<div class="ccOpsCalendar">${days}</div><div class="ccOpsCalendarLegend"><span><i></i>FORM / coach</span><span><i></i>Google Calendar</span></div>`;
}

async function openCalendar() {
  state.calendarWeekOffset = 0;
  const dialog = calendarShell();
  await renderCalendar();
  if (state.opsAvailable) dialog.showModal();
}

function addCalendarDoor() {
  const rail = document.querySelector('.ccRail');
  const roster = rail?.querySelector('.ccRoster');
  if (!rail || !roster || rail.querySelector('[data-open-coaching-calendar]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ccRailAction';
  button.setAttribute('data-open-coaching-calendar', '');
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"></rect><path d="M7 3v4M17 3v4M3.5 9.5h17"></path></svg><span>Coaching calendar</span>`;
  roster.insertAdjacentElement('afterend', button);
  button.addEventListener('click', openCalendar);
}

function syncCollapseIcon() {
  const button = document.querySelector('[data-collapse-rail]');
  if (!button) return;
  const collapsed = document.querySelector('.ccApp')?.classList.contains('railCollapsed');
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M${collapsed ? '9 6l6 6-6 6' : '15 6l-6 6 6 6'}"></path></svg>`;
  button.setAttribute('aria-label', collapsed ? 'Expand athlete rail' : 'Collapse athlete rail');
  if (!button.dataset.opsIcon) {
    button.dataset.opsIcon = '1';
    button.addEventListener('click', () => requestAnimationFrame(syncCollapseIcon));
  }
}

async function persistRoster(roster) {
  await ensureAthletes();
  const slugs = [...roster.querySelectorAll('.ccAthlete[data-slug]')].map((node) => node.dataset.slug);
  const ids = slugs.map((slug) => state.athletes.get(slug)?.id).filter(Boolean);
  if (ids.length) await saveConsolePreferences({ roster_order: ids });
}

function bindRosterDrag() {
  const roster = document.querySelector('.ccRoster');
  if (!roster || roster.dataset.opsDrag) return;
  roster.dataset.opsDrag = '1';
  let dragged = null;
  roster.querySelectorAll('.ccAthlete[data-slug]').forEach((item) => {
    item.draggable = true;
    item.addEventListener('dragstart', (event) => {
      dragged = item;
      item.classList.add('ccDragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.dataset.slug || '');
    });
    item.addEventListener('dragend', () => {
      roster.querySelectorAll('.ccAthlete').forEach((node) => node.classList.remove('ccDragging', 'ccDropBefore', 'ccDropAfter'));
      dragged = null;
    });
    item.addEventListener('dragover', (event) => {
      if (!dragged || dragged === item) return;
      event.preventDefault();
      const before = event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2;
      item.classList.toggle('ccDropBefore', before);
      item.classList.toggle('ccDropAfter', !before);
    });
    item.addEventListener('dragleave', () => item.classList.remove('ccDropBefore', 'ccDropAfter'));
    item.addEventListener('drop', (event) => {
      if (!dragged || dragged === item) return;
      event.preventDefault();
      const before = event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2;
      roster.insertBefore(dragged, before ? item : item.nextSibling);
      item.classList.remove('ccDropBefore', 'ccDropAfter');
      persistRoster(roster).catch(console.error);
    });
  });
}

async function renderActiveOps() {
  const slug = activeSlug();
  if (!slug) return;
  if (state.activeSlug !== slug) {
    state.activeSlug = slug;
    state.athleteWeekOffset = 0;
  }
  await ensureAthletes();
  await Promise.all([
    renderAthleteWeek(slug),
    renderTodos(slug),
    renderConsistency(slug)
  ]);
}

function decorate() {
  if (state.decorating) return;
  state.decorating = true;
  queueMicrotask(async () => {
    try {
      addCalendarDoor();
      syncCollapseIcon();
      bindRosterDrag();
      await renderActiveOps();
    } catch (error) {
      if (!missingRelation(error)) console.error('[Coach Console workflow]', error);
    } finally {
      state.decorating = false;
    }
  });
}

new MutationObserver(decorate).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
decorate();
