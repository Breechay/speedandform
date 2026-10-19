// Your public profile: what an athlete shows on speedandform.com/people/<slug> and in the app.
// Calls (20261013230000): collective_my_person, collective_update_my_person, collective_remove_my_tag.
// Only the details chosen here appear publicly. A failed save is never reported as "nothing
// changed": the page re-reads and says what is actually saved.
import { getAccessContext, renderDoorway, authErrorMessage } from '/private/auth.js';
import { supabase as sb } from '/private/supabase-client.js';
import { escapeHtml as esc } from '/private/record.js';

const app = document.getElementById('app');
const FIELDS = [
  ['bio', 'About you'], ['instagram', 'Instagram'], ['strava', 'Strava'],
  ['discipline', 'Event'], ['now', 'What you’re training for'], ['best', 'Best time']
];
let me = null;
let lib = null;

async function rpc(name, args = {}) {
  const { data, error } = await sb.rpc(name, args);
  if (error) throw error;
  return data;
}
async function library() {
  if (lib) return lib;
  try { lib = {}; (await (await fetch('/media/library/library.json')).json()).photos.forEach((p) => { lib[p.id] = p; }); } catch { lib = {}; }
  return lib;
}
const fullName = (p, initial) => (initial && p.last_initial ? `${p.first_name} ${p.last_initial}.` : p.first_name);
function fieldValue(key) {
  if (key === 'bio') return me.bio || '';
  if (key === 'instagram') return me.instagram ? `@${me.instagram}` : '';
  if (key === 'strava') return me.strava_url || '';
  if (key === 'discipline') return me.discipline || '';
  if (key === 'now') return me.now?.title ? [me.now.title, me.now.detail].filter(Boolean).join(' · ') : '';
  if (key === 'best') return me.best?.time ? [me.best.event, me.best.time].filter(Boolean).join(' · ') : '';
  return '';
}

async function paint(note = '', cls = '') {
  const shown = new Set(me.public_fields || []);
  const l = await library();
  const row = (key, label) => {
    const editable = key === 'bio' || key === 'instagram' || key === 'strava';
    const value = fieldValue(key);
    let input = '';
    if (key === 'bio') input = `<textarea class="field-textarea" name="bio" maxlength="90" rows="2" placeholder="One line about you">${esc(me.bio || '')}</textarea>`;
    if (key === 'instagram') input = `<input class="field-input" name="instagram" maxlength="31" placeholder="handle" value="${esc(me.instagram || '')}" autocomplete="off">`;
    if (key === 'strava') input = `<input class="field-input" type="url" name="strava_url" placeholder="https://www.strava.com/athletes/…" value="${esc(me.strava_url || '')}" autocomplete="off">`;
    return `<div class="pf-field">
      <span class="field-label">${esc(label)}</span>
      <label class="show"><input type="checkbox" name="show" value="${key}"${shown.has(key) ? ' checked' : ''}${!editable && !value ? ' disabled' : ''}> Show</label>
      ${editable ? `<div class="value">${input}</div>` : `<div class="value">${value ? esc(value) : '<span class="field-hint">Not set yet.</span>'}</div>`}
      ${key === 'bio' && me.bio && !me.bio_confirmed ? '<div class="pf-draft"><span>A suggested line. It stays private until you keep it or rewrite it.</span><button class="button" type="button" data-keep>Use this line</button></div>' : ''}
      ${key === 'bio' ? `<span class="pf-count" data-count>${(me.bio || '').length} / 90</span>` : ''}
    </div>`;
  };
  const tags = me.tags || [];
  app.innerHTML = `
    <p class="eyebrow">Account</p>
    <h1>Your public profile</h1>
    <p class="lede">Only the details you choose appear publicly. Your full plan, workout logs and coach notes stay private.</p>
    <form id="pf">
      <label class="pf-switch"><b>Show my profile</b><input type="checkbox" name="visible"${me.visible ? ' checked' : ''}></label>
      <div class="pf-sec"><p class="eyebrow">Name shown</p><div class="pf-names">
        <label><input type="radio" name="initial" value="0"${me.show_last_initial ? '' : ' checked'}> ${esc(fullName(me, false))}</label>
        ${me.last_initial ? `<label><input type="radio" name="initial" value="1"${me.show_last_initial ? ' checked' : ''}> ${esc(fullName(me, true))}</label>` : ''}
      </div></div>
      <div class="pf-sec"><p class="eyebrow">Details</p>${FIELDS.map(([k, l2]) => row(k, l2)).join('')}</div>
      <div class="pf-sec"><p class="eyebrow">Photos you’re in · ${tags.length}</p>
        ${tags.length ? `<div class="pf-tags">${tags.map((t) => {
          const ph = t.library_id && l[t.library_id];
          const src = ph?.files?.['600'] || ph?.files?.['800'] || '';
          return `<div class="pf-tag">${src ? `<img src="${esc(src)}" alt="${esc(ph.alt || '')}" loading="lazy">` : '<span class="ph" aria-hidden="true"></span>'}
            <span>${t.status === 'requested' ? 'Request sent' : (t.asset_id ? 'Group run photo' : 'Photo')}</span>
            <button class="button" type="button" data-untag="${t.id}">${t.status === 'requested' ? 'Cancel request' : 'Remove me'}</button></div>`;
        }).join('')}</div>` : '<p class="field-hint">No photos yet.</p>'}
      </div>
      <div class="pf-actions">
        <button class="button primary" type="submit">Save</button>
        ${me.visible ? `<a class="button" href="/people/${esc(me.slug)}" target="_blank" rel="noopener">See it as others do ↗</a>` : ''}
      </div>
      <p class="status-message ${cls}" id="pfNote" role="status">${esc(note)}</p>
    </form>`;
}

function changesFromForm(form) {
  const f = new FormData(form);
  return {
    visible: f.get('visible') === 'on',
    show_last_initial: f.get('initial') === '1',
    public_fields: f.getAll('show'),
    bio: String(f.get('bio') || '').trim(),
    instagram: String(f.get('instagram') || '').trim().replace(/^@/, ''),
    strava_url: String(f.get('strava_url') || '').trim()
  };
}
// The server has what we sent? Compares every field we wrote, the bio's confirmation included.
function matches(saved, c) {
  const same = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
  return saved.visible === c.visible && saved.show_last_initial === c.show_last_initial && same(saved.public_fields, c.public_fields)
    && (saved.bio || '') === c.bio && (!c.bio || saved.bio_confirmed === true)
    && (saved.instagram || '') === c.instagram && (saved.strava_url || '') === c.strava_url;
}
async function save(c, okNote) {
  if (c.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(c.instagram)) return paint('That Instagram handle doesn’t look right.', 'error');
  if (c.strava_url && !/^https:\/\/(www\.)?strava\.com\/athletes\/[0-9]+\/?$/.test(c.strava_url)) return paint('Paste the strava.com/athletes/… link from your Strava profile.', 'error');
  const note = document.getElementById('pfNote'); if (note) { note.className = 'status-message'; note.textContent = 'Saving…'; }
  try {
    me = await rpc('collective_update_my_person', { changes: c });
    paint(okNote || 'Saved.', 'success');
  } catch {
    try {
      const fresh = await rpc('collective_my_person');
      if (fresh) me = fresh;
      if (fresh && matches(fresh, c)) paint(okNote || 'Saved.', 'success');
      else paint('That didn’t save. What you see is what’s saved now.', 'error');
    } catch {
      paint('Couldn’t confirm whether that saved. Check your connection, then reload.', 'error');
    }
  }
}

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'pf') return;
  e.preventDefault();
  save(changesFromForm(e.target));
});
document.addEventListener('input', (e) => {
  if (e.target.name === 'bio') { const c = document.querySelector('[data-count]'); if (c) c.textContent = `${e.target.value.length} / 90`; }
});
document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-keep]')) {
    const c = changesFromForm(document.getElementById('pf'));
    c.bio = me.bio; if (!c.public_fields.includes('bio')) c.public_fields.push('bio');
    save(c, 'Your line is saved.');
    return;
  }
  const un = e.target.closest('[data-untag]');
  if (un) {
    un.disabled = true;
    try { await rpc('collective_remove_my_tag', { tag: un.dataset.untag }); }
    catch { /* re-read decides */ }
    try { me = await rpc('collective_my_person'); } catch { /* keep */ }
    const gone = !(me.tags || []).some((t) => t.id === un.dataset.untag);
    paint(gone ? 'Removed. The photo stays; your name is off it.' : 'That didn’t go through. Try again.', gone ? 'success' : 'error');
  }
});

(async function boot() {
  try {
    const access = await getAccessContext();
    if (!access.session) { document.body.classList.add('auth-only'); await renderDoorway(app, { destination: '/athlete/profile/', label: 'Athlete sign in' }); return; }
    me = await rpc('collective_my_person');
    if (!me) {
      app.innerHTML = '<p class="eyebrow">Account</p><h1>Your public profile</h1><p class="lede">You don’t have a public profile yet. Once it’s set up, you decide what shows.</p><p><a class="button" href="/athlete/">Back to my training</a></p>';
      return;
    }
    paint();
  } catch (err) {
    app.innerHTML = `<p class="status-message error">Couldn’t open your profile. ${esc(authErrorMessage(err))}</p>`;
  }
}());
window.FORM_PROFILE = { state: () => me };
