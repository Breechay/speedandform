import { supabase } from '/private/supabase-client.js';
import { getSession, signInWithPassword, sendMagicLink, signOut } from '/private/auth.js';
import { compactSpans, markSelection, rotationForDay, validateMethodDraft } from './methods-core.mjs';

const $ = id => document.getElementById(id);
const gate = $('gate'), workspace = $('workspace');
const selection = { start: 0, end: 0 };
let catalog = null, currentKey = null;
const drafts = new Map();
let busy = false;

function status(message, danger = false) {
  $('message').textContent = message;
  $('message').style.color = danger ? '#9c3a2c' : '#4b554c';
}

function miamiDayKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function currentPublished() { return catalog?.methods?.find(method => method.method_key === currentKey); }
function chosenDraft() { return drafts.get(currentKey); }
function draftFrom(row) {
  return {
    statement: row.statement,
    spans: row.spans.map(s => ({ text: s.text, tone: s.tone })),
    font_size: Number(row.font_size),
    muted_gray: Number(row.muted_gray),
    bright_gray: Number(row.bright_gray)
  };
}

function shades(number) {
  const v = Number(number).toString(16).padStart(2, '0').toUpperCase();
  return `#${v}${v}${v}`;
}

function renderPreview() {
  const draft = chosenDraft();
  if (!draft) return;
  const target = $('method-preview');
  target.replaceChildren();
  target.style.fontSize = `${draft.font_size}px`;
  for (const span of draft.spans) {
    const s = document.createElement('span');
    s.style.color = shades(span.tone === 'bright' ? draft.bright_gray : draft.muted_gray);
    s.textContent = span.text;
    target.append(s);
  }
  // Browser preview is user-editable; no HTML is ever parsed from a published quote.
  target.setAttribute('aria-label', draft.statement);
  $('size-value').textContent = `${draft.font_size} pt`;
  $('gray-value').textContent = shades(draft.muted_gray);
  $('white-value').textContent = shades(draft.bright_gray);
}

function renderMeta() {
  const published = currentPublished();
  if (!published) return;
  $('published-date').textContent = 'Published ' + new Date(published.published_at).toLocaleDateString('en-US', { dateStyle: 'medium' });
  const today = rotationForDay(catalog.methods, catalog.pinned_key, miamiDayKey());
  const isToday = today?.method_key === currentKey;
  $('current-display').textContent = isToday ? (catalog.pinned_key ? 'PINNED ON FORM' : 'TODAY ON FORM') : 'EDITOR PREVIEW';
  $('rotation-status').textContent = catalog.pinned_key
    ? `Pinned: ${catalog.methods.find(m => m.method_key === catalog.pinned_key)?.title ?? catalog.pinned_key}.`
    : 'Daily rotation is on. The Method changes at midnight in Miami.';
  $('daily').disabled = !catalog.pinned_key || busy;
  $('pin').disabled = catalog.pinned_key === currentKey || busy;

  const versions = catalog.history.filter(row => row.method_key === currentKey);
  const prior = versions.filter(row => row.id !== published.id);
  $('history-select').replaceChildren(...prior.map(row => new Option(
    `${new Date(row.published_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · ${row.statement.slice(0, 52)}…`,
    row.id
  )));
  $('restore').disabled = !prior.length || busy;
}

function renderDraft() {
  const draft = chosenDraft();
  if (!draft) return;
  $('statement').value = draft.statement;
  $('font-size').value = draft.font_size;
  $('muted-gray').value = draft.muted_gray;
  $('bright-gray').value = draft.bright_gray;
  renderPreview(); renderMeta();
  selection.start = selection.end = 0;
}

function selectMethod(key) {
  if (!catalog?.methods?.some(m => m.method_key === key)) return;
  currentKey = key;
  $('method-select').value = key;
  if (!drafts.has(key)) drafts.set(key, draftFrom(currentPublished()));
  renderDraft(); status('');
}

async function refreshCatalog({ preserveDrafts = false } = {}) {
  const { data, error } = await supabase.rpc('coach_home_methods_editor');
  if (error) throw error;
  if (data?.schema_version !== 1 || !Array.isArray(data.methods)) throw new Error('The Methods editor projection is unavailable.');
  catalog = data;
  catalog.methods.sort((a, b) => a.sort_order - b.sort_order || a.method_key.localeCompare(b.method_key));
  if (!preserveDrafts) drafts.clear();
  $('method-select').replaceChildren(...catalog.methods.map(item => new Option(`${String(item.sort_order).padStart(2, '0')} · ${item.title}`, item.method_key)));
  const key = currentKey && catalog.methods.some(m => m.method_key === currentKey)
    ? currentKey : rotationForDay(catalog.methods, catalog.pinned_key, miamiDayKey())?.method_key;
  if (!key) throw new Error('No approved Method has been published.');
  selectMethod(key);
}

async function unlock() {
  if (busy) return;
  try {
    const session = await getSession();
    if (!session) { gate.hidden = false; workspace.hidden = true; $('gate-status').textContent = 'Sign in with the FORM Coach account.'; return; }
    await refreshCatalog();
    gate.hidden = true; workspace.hidden = false;
  } catch (error) {
    gate.hidden = false; workspace.hidden = true;
    $('gate-status').textContent = error?.message?.includes('active coach')
      ? 'This account is not authorized to publish FORM Methods.'
      : `The editor is not ready: ${error.message}`;
  }
}

function rememberSelection() {
  selection.start = $('statement').selectionStart;
  selection.end = $('statement').selectionEnd;
}

function setBusy(value) {
  busy = value;
  for (const id of ['publish', 'reset', 'daily', 'pin', 'restore']) $(id).disabled = value;
}

$('signin-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  $('gate-status').textContent = 'Signing in…';
  try { await signInWithPassword(form.get('email'), form.get('password')); await unlock(); }
  catch (error) { $('gate-status').textContent = error.message; }
});
$('magic').addEventListener('click', async () => {
  const email = new FormData($('signin-form')).get('email');
  try { await sendMagicLink(email, '/coach/methods/'); $('gate-status').textContent = 'Sign-in link sent. Return to this page after confirming.'; }
  catch (error) { $('gate-status').textContent = error.message; }
});
$('signout').addEventListener('click', () => signOut());
$('method-select').addEventListener('change', event => selectMethod(event.target.value));
for (const eventName of ['select', 'keyup', 'mouseup']) $('statement').addEventListener(eventName, rememberSelection);
$('statement').addEventListener('input', () => {
  const draft = chosenDraft();
  draft.statement = $('statement').value;
  draft.spans = [{ text: draft.statement, tone: 'muted' }];
  renderPreview();
  status('Wording changed. Select the words to bring forward again.');
});
for (const id of ['bright', 'muted']) {
  $(id).addEventListener('mousedown', event => event.preventDefault());
  $(id).addEventListener('click', () => {
    const draft = chosenDraft();
    if (selection.start === selection.end) { status('Select a phrase in the sentence first.', true); return; }
    draft.spans = markSelection(draft.spans, selection.start, selection.end, id);
    renderPreview(); status('Preview updated. Publish when the sentence feels right.');
  });
}
for (const [id, field] of [['font-size', 'font_size'], ['muted-gray', 'muted_gray'], ['bright-gray', 'bright_gray']]) {
  $(id).addEventListener('input', event => { chosenDraft()[field] = Number(event.target.value); renderPreview(); });
}
$('reset').addEventListener('click', () => { drafts.set(currentKey, draftFrom(currentPublished())); renderDraft(); status('Draft discarded. Published Method is unchanged.'); });
$('publish').addEventListener('click', async () => {
  const draft = chosenDraft();
  draft.statement = draft.statement.trim();
  draft.spans = compactSpans(draft.spans);
  const issue = validateMethodDraft(draft);
  if (issue) { status(issue, true); return; }
  if (!window.confirm(`Publish “${currentPublished().title}” to the FORM app?`)) return;
  setBusy(true); status('Publishing…');
  try {
    const { error } = await supabase.rpc('coach_home_method_publish', {
      p_key: currentKey,
      p_expected_edition: currentPublished().id,
      p_statement: draft.statement,
      p_spans: draft.spans,
      p_font_size: draft.font_size,
      p_muted_gray: draft.muted_gray,
      p_bright_gray: draft.bright_gray
    });
    if (error) throw error;
    await refreshCatalog();
    status('Published. The selected Method is now server-owned and available to the app on refresh.');
  } catch (error) { status(`${error.message} Refresh before retrying if someone else changed it.`, true); }
  finally { setBusy(false); renderMeta(); }
});

async function changePin(key) {
  setBusy(true); status('Updating rotation…');
  try {
    const { error } = await supabase.rpc('coach_home_method_pin', { p_key: key });
    if (error) throw error;
    await refreshCatalog({ preserveDrafts: true });
    status(key ? 'This Method is pinned for everyone.' : 'Daily rotation restored.');
  } catch (error) { status(error.message, true); }
  finally { setBusy(false); renderMeta(); }
}
$('pin').addEventListener('click', () => changePin(currentKey));
$('daily').addEventListener('click', () => changePin(null));
$('restore').addEventListener('click', () => {
  const id = $('history-select').value;
  const former = catalog.history.find(item => item.id === id && item.method_key === currentKey);
  if (!former) return;
  drafts.set(currentKey, draftFrom(former)); renderDraft();
  status('Previous version loaded into the preview. Publish to restore it; no live content changed yet.');
});

supabase.auth.onAuthStateChange(() => queueMicrotask(unlock));
unlock();
