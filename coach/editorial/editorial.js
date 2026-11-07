import { supabase } from '/private/supabase-client.js';
import { getAccessContext, renderDoorway } from '/private/auth.js';
import { proposeContextualCopy, correctionIssues } from './review-rules.mjs';

const root = document.getElementById('editorialApp');
const PAGE_SIZE = 12;
let offset = 0;
let candidates = [];
let working = false;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

function setStatus(message, error = false) {
  const element = document.getElementById('editorialStatus');
  if (!element) return;
  element.textContent = message;
  element.dataset.error = String(Boolean(error));
}
function currentSelection() {
  return [...root.querySelectorAll('.editorial-entry input[data-approve]:checked')];
}
function updateSelection() {
  const count = currentSelection().length;
  const publish = document.getElementById('editorialPublish');
  if (publish) publish.disabled = working || count === 0 || count > 10;
  setStatus(count ? count + ' selected · maximum 10 per transaction' :
    'Choose each correction after comparing original and proposed copy.');
}
function card(record) {
  const proposal = proposeContextualCopy(record);
  const id = escapeHtml(record.session_id);
  const html = `<article class="editorial-entry" data-session-id="${id}">
    <div class="editorial-entry-heading">
      <div>
        <div class="editorial-person">${escapeHtml(record.athlete_name || record.athlete_slug)} · ${escapeHtml(record.block_name)}</div>
        <h2>${escapeHtml(record.title)}</h2>
        <div class="editorial-date">${escapeHtml(record.scheduled_on)}</div>
      </div>
      <label class="select"><input type="checkbox" data-approve aria-label="Approve correction for ${escapeHtml(record.athlete_name)} on ${escapeHtml(record.scheduled_on)}"> Approve</label>
    </div>
    <div class="editorial-grid">
      <label><span>Session title</span><textarea data-field="title" rows="2"></textarea></label>
      <label><span>Intent athlete sees</span><textarea data-field="intent" rows="3"></textarea></label>
      <label data-wide="true"><span>Execution details</span><textarea data-field="details" rows="4"></textarea></label>
      <label data-wide="true"><span>Reason for this wording change · audit trail</span><textarea data-field="rationale" rows="2"></textarea></label>
    </div>
    <details>
      <summary>Compare source versions and preserved dose</summary>
      <div class="editorial-compare">
        <section><h3>Before the unauthorized edit · original authoring</h3>
          <pre data-original="title"></pre><pre data-original="intent"></pre><pre data-original="details"></pre></section>
        <section><h3>Current copy · awaiting contextual review</h3>
          <pre data-current="title"></pre><pre data-current="intent"></pre><pre data-current="details"></pre></section>
      </div>
      <p class="editorial-note">Only wording may change. The server clones distance, duration, effort, components and exercises, and preserves every previous version. Athlete/device readback is a separate verification.</p>
    </details>
    ${proposal.needsReview.length ? '<p class="editorial-note">A phrase requires a hand-written correction; do not publish an unchanged suggestion.</p>' : ''}
  </article>`;
  const container = document.createElement('div');
  container.innerHTML = html;
  const node = container.firstElementChild;
  for (const field of ['title','intent','details','rationale']) {
    node.querySelector('[data-field="' + field + '"]').value = proposal[field] || '';
    if (field !== 'rationale') {
      node.querySelector('[data-original="' + field + '"]').textContent =
        record['original_' + field] || '—';
      node.querySelector('[data-current="' + field + '"]').textContent =
        record[field] || '—';
    }
  }
  node.querySelector('[data-approve]').addEventListener('change', updateSelection);
  return node;
}

async function readback(items, published) {
  if (!Array.isArray(published) || published.length !== items.length) {
    throw new Error('Saved, but the count of returned publication receipts differs. Do not retry without readback.');
  }
  for (const expected of items) {
    const receipt = published.find(v => v.session_id === expected.session_id);
    if (!receipt?.published_version_id) throw new Error('Saved; receipt missing. Reread before retrying.');
    const { data, error } = await supabase.from('planned_session_versions')
      .select('id,title,intent,details,version_number')
      .eq('planned_session_id', expected.session_id)
      .order('version_number', { ascending:false }).limit(1).maybeSingle();
    if (error) throw new Error('Saved; version readback failed: ' + error.message);
    if (!data || data.id !== receipt.published_version_id ||
      data.title !== expected.title || data.intent !== expected.intent ||
      (data.details || '') !== expected.details) {
      throw new Error('Saved; authoritative version differs from submitted text. Stop and reread; never duplicate the write.');
    }
  }
}

async function publishSelected() {
  if (working) return;
  const selected = currentSelection();
  if (!selected.length || selected.length > 10) {
    setStatus('Select between 1 and 10 corrections per batch.', true); return;
  }
  const items = [];
  for (const checkbox of selected) {
    const element = checkbox.closest('.editorial-entry');
    const record = candidates.find(x => x.session_id === element.dataset.sessionId);
    if (!record) { setStatus('Current candidate missing. Reload.', true); return; }
    const value = field => element.querySelector('[data-field="' + field + '"]').value.trim();
    const update = {
      session_id: record.session_id,
      expected_version_id: record.expected_version_id,
      title: value('title'),
      intent: value('intent'),
      details: value('details'),
      rationale: value('rationale'),
      approved: true
    };
    const issues = correctionIssues(update, record);
    if (issues.length) {
      setStatus((record.athlete_name || record.athlete_slug) + ' · ' +
        record.scheduled_on + ': ' + issues.join(' '), true);
      element.querySelector('[data-field="title"]').focus();
      return;
    }
    items.push(update);
  }

  working = true;
  document.getElementById('editorialPublish').disabled = true;
  setStatus('Publishing ' + items.length + ' authenticated corrective versions…');
  try {
    const { data, error } = await supabase.rpc('coach_publish_legacy_editorial_corrections', {
      p_items: items
    });
    if (error) throw error;
    await readback(items, data?.published);
    setStatus('Published and version-readback verified: ' + items.length +
      '. Athlete-device confirmation remains separate.');
    offset = 0;
    await reload({ preserveStatus:true });
  } catch (error) {
    setStatus('Publication/readback hold: ' + (error.message || error) +
      ' If a write may have saved, inspect the queue before retrying.', true);
  } finally {
    working = false;
    updateSelection();
  }
}

async function reload({ preserveStatus = false } = {}) {
  const { data, error } = await supabase.rpc('coach_legacy_editorial_queue', {
    p_limit: PAGE_SIZE, p_offset: offset
  });
  if (error) throw error;
  candidates = Array.isArray(data?.items) ? data.items : [];
  const host = document.getElementById('editorialItems');
  host.replaceChildren();
  candidates.forEach(record => host.append(card(record)));
  if (!candidates.length) {
    host.innerHTML = '<div class="editorial-empty">No eligible corrections on this page. If this is the first page, the coach-authored correction queue is clear.</div>';
  }
  document.getElementById('editorialPrev').disabled = offset === 0;
  document.getElementById('editorialNext').disabled = candidates.length < PAGE_SIZE;
  document.getElementById('editorialPosition').textContent =
    'Entries ' + (offset + 1) + '–' + (offset + candidates.length);
  if (!preserveStatus) updateSelection();
}

async function boot() {
  try {
    const access = await getAccessContext();
    if (!access?.session) {
      await renderDoorway(root, { destination:'/coach/editorial/', label:'Coach sign in' });
      return;
    }
    if (!access.coachMemberships?.length) {
      root.innerHTML = '<section class="editorial-hero"><h1>Coach access required.</h1><p>This tool does not permit athlete self-service publication.</p></section>';
      return;
    }
    root.innerHTML = `<section class="editorial-hero">
      <p class="editorial-kicker">Compensating version publication · November 2026</p>
      <h1>Correct the words.<br>Preserve the work.</h1>
      <p>The previous bulk wording edit remains in immutable history. Compare the original and current descriptions before authorizing a new coach-owned version. This is not a training-plan editor: distance, dates, recovery, pace and structured work cannot be changed here.</p>
    </section>
    <div class="editorial-toolbar">
      <div><p id="editorialStatus" class="editorial-status" role="status"></p>
      <small id="editorialPosition" class="editorial-date"></small></div>
      <div class="editorial-actions">
        <button id="editorialPrev" type="button">Previous</button>
        <button id="editorialNext" type="button">Next</button>
        <button id="editorialPublish" type="button" class="primary" disabled>Publish selected →</button>
      </div>
    </div><section id="editorialItems" aria-label="Eligible corrective versions"></section>`;
    document.getElementById('editorialPrev').addEventListener('click',async()=>{
      if (working || offset === 0) return;
      offset = Math.max(0,offset-PAGE_SIZE); await safeReload();
    });
    document.getElementById('editorialNext').addEventListener('click',async()=>{
      if (working || candidates.length < PAGE_SIZE) return;
      offset += PAGE_SIZE; await safeReload();
    });
    document.getElementById('editorialPublish').addEventListener('click',publishSelected);
    await safeReload();
  } catch (error) {
    root.textContent = 'Unable to load authenticated editorial review: ' + (error.message || error);
  }
}
async function safeReload() {
  try { await reload(); }
  catch (error) { setStatus('Unable to load review queue: ' + (error.message || error), true); }
}
boot();
