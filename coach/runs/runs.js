// LABS · RUNS
//
// Group runs and their photographs, managed on the web. One record with the Running app:
// every write goes through the same tables and functions the app's publisher tools use, so
// what Brice does here shows in the app and on speedandform.com/runs/ without a deploy.
//
// Album contract (FORM-iOS FORM/Collective/FORMCollectiveAlbum.swift), followed in order:
//   1. prepare: orientation applied, metadata dropped, 3000 px long edge, JPEG 0.9
//   2. upload to collective-gallery-drafts at runs/<run>/<asset>.jpg (upsert, one id per file)
//   3. insert the collective_roll_assets row with that same id (a lost response is looked up,
//      never inserted twice)
//   4. collective_album_save_draft(run, expected, items, layout, appearance): versioned
//   5. publish: save, collective_album_stage_paths(run, assets), copy each unstaged source to the
//      path the server names, then collective_album_publish(run, expected)
// Nine photographs at most. A photo with no capture date, or a date that is not the run's
// day (Miami), has to be confirmed before it can be published, as in the app.
//
// Runs: a publisher can create FORM runs and append time, place and cancel changes. A cancel
// is final (the server refuses later changes), so it asks first and says so.
//
// style-src is 'self' on /coach/*: no style="" in markup. Variable values use setProperty.

import { getAccessContext, authErrorMessage } from '/private/auth.js';
import { supabase as sb } from '/private/supabase-client.js';

const ZONE = 'America/New_York';
const DRAFTS = 'collective-gallery-drafts';
const PUBLIC = 'collective-media';
const LIMIT = 9;
const LONG_EDGE = 3000;
const SESSIONS = [
  ['resurrection', 'Resurrection', '600 / 400 / 300 / 200'],
  ['death', 'Death', '600 / 400 / 300 / 200 / 800 / 400'],
  ['speed-demons', 'Speed Demons', '300 / 200 / 100'],
  ['gauntlet', 'Gauntlet', '600 / 400 / 300 / 200 / 150'],
  ['pyramid-intervals', 'Pyramid Intervals', '300 / 400 / 600 / 400 / 300'],
  ['nice-and-easy', 'Nice and Easy', '200 / 800 / 400']
];
const PLACES = {
  'Flamingo Park Track': '11 St & Jefferson Ave, Miami Beach, FL 33139',
  'The Labs': '425 NE 22nd St, Miami, FL 33137'
};
const KIND = { track: 'Track', long_run: 'Long run' };
const LAYOUTS = [['photo_essay', 'Photo essay'], ['cover_story', 'Cover story'], ['sequence', 'Sequence'], ['contact_sheet', 'Contact sheet']];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let me = null;
let runs = [];
let liveCounts = {};
let rollCounts = {};
let selected = null;
let ed = null; // the open album editor

// ------------------------------------------------------------------ time (Miami)

function parts(iso) {
  const d = new Date(iso), o = {};
  new Intl.DateTimeFormat('en-US', { timeZone: ZONE, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    .formatToParts(d).forEach((p) => { o[p.type] = p.value; });
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { wd: o.weekday, day: o.day, mon: o.month, year: o.year, time: `${o.hour}:${o.minute} ${o.dayPeriod || ''}`.trim(), ymd, hm };
}
const today = () => parts(new Date().toISOString()).ymd;
// "2026-10-15" + "06:15" in Miami → an instant. Two passes settle the offset across DST.
function miami(ymd, hm) {
  const [y, m, d] = ymd.split('-').map(Number), [hh, mm] = hm.split(':').map(Number);
  let t = Date.UTC(y, m - 1, d, hh, mm);
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(t).toISOString());
    const [py, pm, pd] = p.ymd.split('-').map(Number), [ph, pmin] = p.hm.split(':').map(Number);
    t += Date.UTC(y, m - 1, d, hh, mm) - Date.UTC(py, pm - 1, pd, ph, pmin);
  }
  return new Date(t).toISOString();
}
function sameMiamiDay(a, b) { return parts(a).ymd === parts(b).ymd; }
function isUpcoming(r) { return r.status !== 'archived' && parts(r.starts_at).ymd >= today(); }
const facts = (r) => (r.group_facts && typeof r.group_facts === 'object' ? r.group_facts : {});
const session = (r) => SESSIONS.find((s) => s[0] === facts(r).workout_session_id);
const albumTitle = (r) => session(r)?.[1] || r.title;
function slugOf(r) {
  const base = Array.from(String(r.title).toLowerCase()).map((c) => (/[\p{L}\p{N}]/u.test(c) ? c : '-')).join('').split('-').filter(Boolean).join('-');
  return r.series_id ? `${base}-${parts(r.starts_at).ymd}` : base;
}

// ------------------------------------------------------------------ server

async function rpc(name, args = {}) {
  const { data, error } = await sb.rpc(name, args);
  if (error) throw error;
  return data;
}
function message(error) {
  const m = String(error?.message || error || '');
  if (m.includes('draft_conflict')) return 'This album changed elsewhere.';
  if (m.includes('withdrawal_in_progress')) return 'An earlier copy is still being removed. Try again in a minute.';
  if (m.includes('not_publisher')) return 'This account can’t publish.';
  if (/cancel/i.test(m)) return 'This run is canceled, so it can’t be changed.';
  return m || 'Something went wrong.';
}

async function loadRuns() {
  const { data, error } = await sb.from('collective_runs_current')
    .select('id,author_kind,kind,series_id,title,visibility,meet_at,starts_at,meet_name,meet_address,group_facts,status')
    .eq('author_kind', 'form').order('starts_at', { ascending: false }).limit(150);
  if (error) throw error;
  runs = (data || []).filter((r) => KIND[r.kind]);
  liveCounts = {}; rollCounts = {};
  try { (await rpc('collective_galleries')).forEach((g) => { liveCounts[g.run_id] = (liveCounts[g.run_id] || 0) + 1; }); } catch { liveCounts = null; }
  try {
    const { data: roll, error: e } = await sb.from('collective_roll_assets').select('run_id').is('deleted_at', null);
    if (e) throw e;
    (roll || []).forEach((a) => { rollCounts[a.run_id] = (rollCounts[a.run_id] || 0) + 1; });
  } catch { rollCounts = null; }
}

// ------------------------------------------------------------------ list

function rowHTML(r) {
  const p = parts(r.starts_at), up = isUpcoming(r), off = r.status === 'cancelled';
  let st = '', cls = '';
  if (up) {
    if (off) st = 'Canceled';
    else if (!r.meet_name) { st = 'Add place'; cls = 'warn'; }
    else st = r.visibility === 'public' ? 'On the site' : 'Members';
  } else if (liveCounts === null) st = 'Photos unknown';
  else if (liveCounts[r.id]) st = `${liveCounts[r.id]} photos · live`;
  else if (rollCounts && rollCounts[r.id]) { st = `Draft · ${rollCounts[r.id]}`; cls = 'act'; }
  else st = 'No photos';
  const sub = up ? `${p.time}${r.meet_name ? ` · ${r.meet_name}` : ''}` : `${p.mon} ${p.day}${session(r) ? ` · ${session(r)[1]}` : ''}`;
  return `<button type="button" class="row${off ? ' off' : ''}${selected === r.id ? ' sel' : ''}" data-run="${r.id}">
    <span class="d">${esc(p.wd)}<b>${esc(p.day)}</b></span>
    <span class="t">${esc(r.title)}<small>${esc(sub)}</small></span>
    <span class="st ${cls}">${esc(st)}</span></button>`;
}
function paintList() {
  const upcoming = runs.filter(isUpcoming).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const past = runs.filter((r) => !isUpcoming(r) && r.status !== 'cancelled');
  $('rows').innerHTML =
    `<p class="grp label">Upcoming</p>${upcoming.length ? upcoming.map(rowHTML).join('') : '<p class="quiet pad">Nothing scheduled. Add the next run.</p>'}` +
    `<p class="grp label">Past</p>${past.length ? past.map(rowHTML).join('') : '<p class="quiet pad">No past runs yet.</p>'}`;
}

// ------------------------------------------------------------------ upcoming run

function paintUpcoming(r) {
  const p = parts(r.starts_at), s = session(r), off = r.status === 'cancelled';
  $('pane').innerHTML = `
    <button type="button" class="back" data-back>‹ Runs</button>
    <div class="head"><div><p class="label">${esc(`${p.wd} ${p.day} ${p.mon} · ${KIND[r.kind]}${off ? ' · Canceled' : ''}`)}</p><h2>${esc(r.title)}</h2>
      <p class="facts">${esc(r.visibility === 'public' ? 'Public: on the site and in the app' : 'Members only: in the app')}</p></div>
      ${r.visibility === 'public' ? `<a class="status" href="/run/${esc(slugOf(r))}/" target="_blank" rel="noopener">Open on the site ↗</a>` : ''}</div>
    <div class="section"><dl class="kv">
      <dt>Meet</dt><dd>${r.meet_at ? esc(parts(r.meet_at).time) : '—'}</dd>
      <dt>Run</dt><dd>${esc(p.time)}</dd>
      <dt>Place</dt><dd>${r.meet_name ? `${esc(r.meet_name)}<br><span class="quiet">${esc(r.meet_address || '')}</span>` : '<span class="st warn">Not set</span>'}</dd>
      ${r.kind === 'track' ? `<dt>Workout</dt><dd>${s ? `${esc(s[1])} <span class="quiet">· ${esc(s[2])}</span>` : '<span class="quiet">Not set</span>'}</dd>` : ''}
      ${Array.isArray(facts(r).distance_miles) ? `<dt>Group offer</dt><dd>${esc(facts(r).distance_miles.join('–'))} mi${facts(r).pace ? ` · ${esc(facts(r).pace)}` : ''}</dd>` : ''}
    </dl></div>
    ${off ? '<div class="banner info"><p>This date is canceled. A canceled date stays canceled; add a new run if plans change.</p></div>' : `
    <div class="acts">
      <button type="button" class="btn" data-act="time">Change time</button>
      <button type="button" class="btn" data-act="place">Change place</button>
      ${r.kind === 'track' ? '<button type="button" class="btn" data-act="workout">Workout</button>' : ''}
      <button type="button" class="btn danger" data-act="cancel">Cancel this date</button>
    </div>`}`;
}

// ------------------------------------------------------------------ sheet (forms)

let sheetSubmit = null;
function openSheet(title, body, onSubmit, saveLabel = 'Save') {
  $('sheetTitle').textContent = title;
  $('sheetBody').innerHTML = body;
  $('sheetNote').textContent = ''; $('sheetNote').className = 'note';
  $('sheetSave').textContent = saveLabel; $('sheetSave').disabled = false;
  sheetSubmit = onSubmit;
  $('sheet').showModal();
  $('sheetBody').querySelector('input,select,button')?.focus();
}
function closeSheet() { $('sheet').close(); sheetSubmit = null; }
$('sheetClose').addEventListener('click', closeSheet);
$('sheetCancel').addEventListener('click', closeSheet);
$('sheetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!sheetSubmit) return;
  const note = $('sheetNote');
  $('sheetSave').disabled = true; note.className = 'note'; note.textContent = 'Saving…';
  try { await sheetSubmit(new FormData($('sheetForm'))); closeSheet(); await refresh(); }
  catch (err) { note.className = 'note bad'; note.textContent = message(err); $('sheetSave').disabled = false; }
});
$('sheetBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (!b) return;
  const group = b.closest('.choices');
  group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const hidden = group.nextElementSibling;
  if (hidden?.type === 'hidden') hidden.value = b.dataset.pick;
  if (b.dataset.place) { $('fPlaceName').value = b.dataset.place; $('fPlaceAddr').value = PLACES[b.dataset.place]; }
  if (b.dataset.kind) $('trackOnly').hidden = b.dataset.pick !== 'track';
});

async function change(r, row) {
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('collective_run_changes').insert({ run_id: r.id, issued_by: user.id, ...row });
  if (error) throw error;
}
async function detail(r, groupFacts) {
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('collective_run_details').insert({ run_id: r.id, issued_by: user.id, group_facts: groupFacts });
  if (error) throw error;
}
const placeButtons = () => `<div class="choices">${Object.keys(PLACES).map((n) => `<button type="button" data-pick="${esc(n)}" data-place="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join('')}</div><input type="hidden">`;

function act(kind, r) {
  const p = parts(r.starts_at);
  if (kind === 'time') {
    openSheet('Change time', `<div class="fields">
      <label>Date<input type="date" name="date" required value="${p.ymd}"></label><span></span>
      <label>Meet<input type="time" name="meet" value="${r.meet_at ? parts(r.meet_at).hm : ''}"></label>
      <label>Run<input type="time" name="run" required value="${p.hm}"></label></div>`,
    async (f) => {
      const starts = miami(f.get('date'), f.get('run'));
      const meet = f.get('meet') ? miami(f.get('date'), f.get('meet')) : null;
      if (meet && Date.parse(meet) > Date.parse(starts)) throw new Error('The meet time has to be before the run.');
      await change(r, { kind: 'time', starts_at: starts, meet_at: meet });
    });
  } else if (kind === 'place') {
    openSheet('Change place', `${placeButtons()}<div class="fields">
      <label class="wide">Place<input type="text" id="fPlaceName" name="name" required value="${esc(r.meet_name || '')}"></label>
      <label class="wide">Address<input type="text" id="fPlaceAddr" name="address" required value="${esc(r.meet_address || '')}"></label></div>`,
    async (f) => change(r, { kind: 'place', meet_name: f.get('name').trim(), meet_address: f.get('address').trim() }));
  } else if (kind === 'workout') {
    const cur = facts(r).workout_session_id || '';
    openSheet('Workout', `<div class="fields"><label class="wide">Session<select name="session">
      <option value="">Not set</option>${SESSIONS.map((s) => `<option value="${s[0]}"${s[0] === cur ? ' selected' : ''}>${esc(s[1])} · ${esc(s[2])}</option>`).join('')}</select></label></div>
      <p class="quiet">Shown on the run page and in the app. The album takes this name.</p>`,
    async (f) => detail(r, { workout_session_id: f.get('session') || null }));
  } else if (kind === 'cancel') {
    openSheet(`Cancel ${p.wd} ${p.mon} ${p.day}?`, `<p>Everyone sees it as canceled, in the app and on the site. A canceled date can’t be brought back; add a new run instead.</p>`,
      async () => change(r, { kind: 'cancelled' }), 'Cancel this date');
  }
}

function newRun() {
  const next = new Date(); next.setDate(next.getDate() + ((4 - next.getDay() + 7) % 7 || 7));
  const ymd = parts(next.toISOString()).ymd;
  openSheet('New run', `
    <div class="choices"><button type="button" data-pick="track" data-kind="1" aria-pressed="true">Track</button><button type="button" data-pick="long_run" data-kind="1" aria-pressed="false">Long run</button></div><input type="hidden" name="kind" value="track">
    <div class="fields">
      <label class="wide">Name<input type="text" name="title" required maxlength="80" value="Track Thursday"></label>
      <label>Date<input type="date" name="date" required value="${ymd}"></label><span></span>
      <label>Meet<input type="time" name="meet" value="06:00"></label>
      <label>Run<input type="time" name="run" required value="06:15"></label>
      <div class="wide">${placeButtons()}</div>
      <label class="wide">Place<input type="text" id="fPlaceName" name="name" required value="Flamingo Park Track"></label>
      <label class="wide">Address<input type="text" id="fPlaceAddr" name="address" required value="${esc(PLACES['Flamingo Park Track'])}"></label>
      <div class="wide" id="trackOnly"><label>Workout<select name="session"><option value="">Not set</option>${SESSIONS.map((s) => `<option value="${s[0]}">${esc(s[1])} · ${esc(s[2])}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" name="series" checked> Part of the Track Thursday series</label></div>
      <label class="check wide"><input type="checkbox" name="members"> Members only (not on the website)</label>
    </div>`,
  async (f) => {
    const kind = f.get('kind'), title = f.get('title').trim();
    const starts = miami(f.get('date'), f.get('run'));
    const meet = f.get('meet') ? miami(f.get('date'), f.get('meet')) : null;
    if (meet && Date.parse(meet) > Date.parse(starts)) throw new Error('The meet time has to be before the run.');
    if (Date.parse(starts) < Date.now()) throw new Error('That time has already passed.');
    const name = f.get('name')?.trim(), address = f.get('address')?.trim();
    if (!name || !address) throw new Error('Add the place and its address.');
    const { data: { user } } = await sb.auth.getUser();
    const groupFacts = kind === 'track' && f.get('session') ? { workout_session_id: f.get('session') } : {};
    const { error } = await sb.from('collective_runs').insert({
      author_kind: 'form', author_account_id: user.id, kind, title,
      series_id: kind === 'track' && f.get('series') ? 'track-thursday' : null,
      visibility: f.get('members') ? 'members' : 'public',
      meet_at: meet, starts_at: starts, meet_name: name, meet_address: address, group_facts: groupFacts
    });
    if (error) throw error;
  }, 'Add run');
}

// ------------------------------------------------------------------ album editor

// The EXIF capture time (DateTimeOriginal), read in Miami time as the app does.
function exifTaken(buffer) {
  const v = new DataView(buffer);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return null;
  let off = 2;
  while (off + 4 < v.byteLength) {
    const marker = v.getUint16(off), size = v.getUint16(off + 2);
    if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
      const t = off + 10, le = v.getUint16(t) === 0x4949;
      const u16 = (o) => v.getUint16(t + o, le), u32 = (o) => v.getUint32(t + o, le);
      const ifd = (o) => { const n = u16(o), out = {}; for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; out[u16(e)] = e; } return out; };
      const ifd0 = ifd(u32(4));
      if (!ifd0[0x8769]) return null;
      const exif = ifd(u32(ifd0[0x8769] + 8));
      const e = exif[0x9003] || exif[0x9004];
      if (!e) return null;
      const at = u32(e + 8); let s = '';
      for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(t + at + i));
      const m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
      return m ? miami(`${m[1]}-${m[2]}-${m[3]}`, `${m[4]}:${m[5]}`) : null;
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    off += 2 + size;
  }
  return null;
}
async function prepare(file) {
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error(/heic|heif/i.test(file.type + file.name) ? 'This browser can’t read HEIC. Use Safari, or export as JPEG.' : 'Not a photo this browser can read.'); }
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('Couldn’t prepare the photo.'))), 'image/jpeg', 0.9));
  let taken = null;
  try { taken = exifTaken(await file.slice(0, 256 * 1024).arrayBuffer()); } catch { taken = null; }
  return { blob, w, h, taken };
}
// A camera ZIP: unpacked in the browser, bounded.
async function unzip(file) {
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((f) => !f.dir && !f.name.includes('__MACOSX') && /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name));
  if (entries.length > 300) throw new Error('That ZIP has more than 300 photos. Split it.');
  const out = [];
  for (const e of entries) {
    const blob = await e.async('blob');
    if (blob.size > 60 * 1024 * 1024) continue;
    out.push(new File([blob], e.name.split('/').pop(), { type: /png$/i.test(e.name) ? 'image/png' : /hei[cf]$/i.test(e.name) ? 'image/heic' : 'image/jpeg' }));
  }
  return out;
}

function needsConfirm(a, run) {
  if (a.needs_date) return true;
  return a.taken_at ? !sameMiamiDay(a.taken_at, run.starts_at) : true;
}

async function openAlbum(run) {
  ed = { run, roll: [], items: [], layout: 'photo_essay', appearance: 'cream', version: 0, live: null, takenDown: false,
    thumbs: {}, uploads: [], status: '', statusClass: '', conflict: false, saveTimer: null, retry: 0, optOuts: undefined, publishing: false };
  $('pane').innerHTML = '<button type="button" class="back" data-back>‹ Runs</button><div class="empty"><p class="quiet">Loading the album…</p></div>';
  try {
    const [rollRes, draft] = await Promise.all([
      sb.from('collective_roll_assets').select('*').eq('run_id', run.id).is('deleted_at', null).order('created_at'),
      rpc('collective_album_draft', { run: run.id })
    ]);
    if (rollRes.error) throw rollRes.error;
    ed.roll = (rollRes.data || []).filter((a) => a.kind !== 'film');
    const d = Array.isArray(draft) ? draft[0] : draft;
    if (d) {
      ed.items = (d.items || []).filter((i) => ed.roll.some((a) => a.id === i.asset));
      ed.layout = d.layout || 'photo_essay'; ed.appearance = d.appearance || 'cream';
      ed.version = d.version || 0; ed.live = d.live_revision; ed.takenDown = !!d.taken_down;
    }
  } catch (err) {
    $('pane').innerHTML = `<button type="button" class="back" data-back>‹ Runs</button><div class="banner"><p>Couldn’t load this album. ${esc(message(err))}</p><button type="button" class="btn" data-reopen>Try again</button></div>`;
    return;
  }
  rpc('collective_photo_opt_outs', { p_run_id: run.id }).then((rows) => { ed.optOuts = rows || []; paintAlbumHead(); }).catch(() => { ed.optOuts = null; paintAlbumHead(); });
  await signThumbs(ed.roll);
  paintAlbum();
}
async function signThumbs(list) {
  const want = list.filter((a) => !ed.thumbs[a.id]);
  if (!want.length) return;
  const { data } = await sb.storage.from(DRAFTS).createSignedUrls(want.map((a) => a.draft_path), 3600);
  (data || []).forEach((s, i) => { if (s.signedUrl) ed.thumbs[want[i].id] = s.signedUrl; });
}

function paintAlbumHead() {
  if (!ed || !$('albumHead')) return;
  const r = ed.run, p = parts(r.starts_at);
  const opt = ed.optOuts === undefined ? 'checking photo opt-outs…'
    : ed.optOuts === null ? 'photo opt-outs can’t be loaded'
    : ed.optOuts.length ? `opted out of photos: ${ed.optOuts.map((o) => `${o.first_name}${o.last_initial ? ` ${o.last_initial}.` : ''}`).join(', ')}`
    : 'no photo opt-outs';
  const liveLine = ed.live && !ed.takenDown ? `Live · revision ${ed.live}` : ed.takenDown ? 'Taken down' : 'Not published';
  $('albumHead').innerHTML = `<div><p class="label">${esc(`${p.wd} ${p.day} ${p.mon} ${p.year} · Album`)}</p><h2>${esc(albumTitle(r))}</h2>
    <p class="facts">${esc([r.meet_name, opt].filter(Boolean).join(' · '))}</p></div>
    <div><p class="status${ed.statusClass ? ` ${ed.statusClass}` : ''}" id="saveStatus">${esc(ed.status || liveLine)}</p>
    ${ed.live && !ed.takenDown && r.visibility === 'public' ? `<a class="status" href="/run/${esc(slugOf(r))}/" target="_blank" rel="noopener">Open on the site ↗</a>` : ''}</div>`;
}

function paintAlbum() {
  const r = ed.run;
  const inAlbum = ed.items.map((i) => ed.roll.find((a) => a.id === i.asset)).filter(Boolean);
  const out = ed.roll.filter((a) => !ed.items.some((i) => i.asset === a.id));
  const blocked = inAlbum.filter((a) => needsConfirm(a, r));
  const cell = (a, n) => {
    const flag = needsConfirm(a, r);
    const isIn = n > 0;
    return `<div class="cell">
      <button type="button" class="ph${isIn ? '' : ' out'}${n === 1 ? ' cover' : ''}" data-toggle="${a.id}" draggable="${isIn}" data-asset="${a.id}"
        aria-pressed="${isIn}" aria-label="${isIn ? `Photo ${n} of ${inAlbum.length}${n === 1 ? ', cover' : ''}. Take out of the album` : 'Put in the album'}">
        ${ed.thumbs[a.id] ? `<img src="${esc(ed.thumbs[a.id])}" alt="" loading="lazy">` : ''}
        <span class="k">${isIn ? n : 'Out'}</span>${n === 1 ? '<span class="cv">COVER</span>' : ''}${flag ? '<span class="flag">DATE?</span>' : ''}</button>
      <div class="cellActs">
        ${isIn && n > 1 ? `<button type="button" data-cover="${a.id}">Make cover</button><button type="button" data-move="${a.id}" data-by="-1">Earlier</button>` : ''}
        ${isIn && n < inAlbum.length ? `<button type="button" data-move="${a.id}" data-by="1">Later</button>` : ''}
        ${flag ? `<button type="button" data-confirm="${a.id}">Confirm it’s from this run</button>` : ''}
      </div></div>`;
  };
  $('pane').innerHTML = `
    <button type="button" class="back" data-back>‹ Runs</button>
    <div class="head" id="albumHead"></div>
    ${ed.conflict ? `<div class="banner"><p>This draft changed elsewhere. Your edit isn’t saved.</p><button type="button" class="btn" data-conflict="theirs">Load the latest</button><button type="button" class="btn" data-conflict="mine">Keep mine</button></div>` : ''}
    <div class="tools">
      <label><span class="label">Layout</span><select id="layout">${LAYOUTS.map(([v, t]) => `<option value="${v}"${v === ed.layout ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <label><span class="label">Page</span><select id="appearance"><option value="cream"${ed.appearance === 'cream' ? ' selected' : ''}>Cream</option><option value="dark"${ed.appearance === 'dark' ? ' selected' : ''}>Dark</option></select></label>
    </div>
    <label class="drop" id="drop"><span><b>Drop photos, a folder or a camera ZIP</b> · or choose files</span><span class="mono">Tap a photo to put it in or take it out · ${LIMIT} at most</span>
      <input type="file" id="files" multiple accept="image/jpeg,image/png,image/heic,image/heif,image/webp,.zip,application/zip"></label>
    <div class="uploads" id="uploads"></div>
    <div class="grid" id="grid">${ed.roll.length ? [...inAlbum.map((a, i) => cell(a, i + 1)), ...out.map((a) => cell(a, 0))].join('') : '<p class="quiet">No photos yet. Drop the shoot here.</p>'}</div>
    <div class="foot"><span class="s"><b>${inAlbum.length} in the album</b> of ${ed.roll.length}${blocked.length ? ` · <span class="st warn">${blocked.length} need${blocked.length === 1 ? 's' : ''} a date</span>` : ''} · nothing is public until you publish</span>
      <span class="footActs">${ed.live && !ed.takenDown ? `<button type="button" class="btn danger" id="takeDown"${ed.publishing ? ' disabled' : ''}>Take down</button>` : ''}${ed.live && ed.takenDown ? `<button type="button" class="btn" id="putBackUp"${ed.publishing ? ' disabled' : ''}>Put back up</button>` : ''}<button type="button" class="btn go" id="publish"${!inAlbum.length || blocked.length || ed.conflict || ed.publishing ? ' disabled' : ''}>${ed.live && !ed.takenDown ? 'Publish changes' : 'Publish to app and site'}</button></span></div>`;
  paintAlbumHead(); paintUploads();
}
function paintUploads() {
  const box = $('uploads'); if (!box) return;
  box.innerHTML = ed.uploads.filter((u) => u.state !== 'done').map((u) => `<div class="up${u.state === 'failed' ? ' failed' : ''}">
    <span>${esc(u.file.name)} · ${u.state === 'failed' ? esc(u.error) : u.state === 'preparing' ? 'preparing' : 'uploading'}</span>
    ${u.state === 'failed' ? `<span><button type="button" data-retry="${u.id}">Try again</button> <button type="button" data-dismiss="${u.id}">Dismiss</button></span>` : ''}</div>`).join('');
}
function setStatus(text, cls = '') { ed.status = text; ed.statusClass = cls; const s = $('saveStatus'); if (s) { s.textContent = text; s.className = `status${cls ? ` ${cls}` : ''}`; } }

// One identity per file, kept across retries: the same object path and the same roll row.
async function uploadOne(u) {
  const run = ed.run;
  try {
    u.state = 'preparing'; paintUploads();
    const prep = u.prep || (u.prep = await prepare(u.file));
    u.state = 'uploading'; paintUploads();
    const path = `runs/${run.id}/${u.id}.jpg`;
    const up = await sb.storage.from(DRAFTS).upload(path, prep.blob, { upsert: true, contentType: 'image/jpeg', cacheControl: 'no-cache' });
    if (up.error) throw up.error;
    const row = { id: u.id, run_id: run.id, draft_path: path, width: prep.w, height: prep.h, taken_at: prep.taken,
      needs_date: !prep.taken || !sameMiamiDay(prep.taken, run.starts_at) };
    let saved = null;
    const ins = await sb.from('collective_roll_assets').insert(row).select().single();
    if (ins.error) {
      const found = await sb.from('collective_roll_assets').select('*').eq('id', u.id).eq('run_id', run.id).maybeSingle();
      if (found.error || !found.data) throw ins.error;
      saved = found.data;
    } else saved = ins.data;
    ed.thumbs[saved.id] = URL.createObjectURL(prep.blob);
    if (!ed.roll.some((a) => a.id === saved.id)) ed.roll.push(saved);
    u.state = 'done';
  } catch (err) { u.state = 'failed'; u.error = message(err); }
}
async function addFiles(fileList) {
  if (!ed) return;
  let files = [];
  for (const f of fileList) {
    if (/\.zip$/i.test(f.name) || f.type === 'application/zip') {
      try { files.push(...await unzip(f)); } catch (err) { ed.uploads.push({ id: crypto.randomUUID(), file: f, state: 'failed', error: message(err) }); }
    } else if (/^image\//.test(f.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name)) files.push(f);
  }
  const batch = files.map((file) => ({ id: crypto.randomUUID(), file, state: 'waiting' }));
  ed.uploads.push(...batch); paintUploads();
  const queue = batch.slice();
  await Promise.all([0, 1, 2].map(async () => { while (queue.length) { await uploadOne(queue.shift()); } }));
  paintAlbum();
}

function scheduleSave() {
  clearTimeout(ed.saveTimer); ed.retry = 0;
  setStatus('Not saved yet');
  ed.saveTimer = setTimeout(save, 700);
}
async function save() {
  if (!ed || ed.conflict) return false;
  setStatus('Saving…');
  try {
    ed.version = await rpc('collective_album_save_draft', { run: ed.run.id, expected: ed.version, items: ed.items, layout: ed.layout, appearance: ed.appearance });
    const t = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());
    setStatus(`Saved ${t}`, 'good');
    return true;
  } catch (err) {
    if (String(err?.message).includes('draft_conflict')) { ed.conflict = true; setStatus('Not saved', 'bad'); paintAlbum(); return false; }
    const waits = [3000, 8000, 20000];
    if (ed.retry < waits.length) { setStatus('Not saved yet. Trying again…', 'bad'); ed.saveTimer = setTimeout(save, waits[ed.retry++]); }
    else setStatus('Not saved. Check the connection; your edit stays here.', 'bad');
    return false;
  }
}
async function resolveConflict(keepMine) {
  const mine = { items: ed.items, layout: ed.layout, appearance: ed.appearance };
  const run = ed.run;
  await openAlbum(run);
  if (keepMine && ed) {
    ed.items = mine.items.filter((i) => ed.roll.some((a) => a.id === i.asset));
    ed.layout = mine.layout; ed.appearance = mine.appearance;
    paintAlbum(); await save();
  }
}
async function publish() {
  if (!ed || ed.publishing) return;
  ed.publishing = true; paintAlbum();
  try {
    clearTimeout(ed.saveTimer);
    if (!(await save())) throw new Error(ed.conflict ? 'This album changed elsewhere.' : 'Couldn’t save the draft, so nothing was published.');
    setStatus('Preparing the public copies…');
    const rows = await rpc('collective_album_stage_paths', { run: ed.run.id, assets: ed.items.map((i) => i.asset) });
    for (const c of rows || []) {
      if (c.staged || !c.source_path) continue;
      const { error } = await sb.storage.from(c.source_bucket).copy(c.source_path, c.path, { destinationBucket: PUBLIC });
      if (error && !/exist|409|duplicate/i.test(String(error.message || error.statusCode))) throw error;
    }
    setStatus('Publishing…');
    ed.live = await rpc('collective_album_publish', { run: ed.run.id, expected: ed.version });
    ed.takenDown = false;
    setStatus('Live in the app and on the site', 'good');
    await loadRuns(); paintList();
  } catch (err) {
    setStatus(`${message(err)} Your draft is safe.`, 'bad');
  } finally { ed.publishing = false; paintAlbum(); }
}

// Take down / Put back up, as the app does (FORMCollectiveAlbum.takeDown / putBackUp). The edit,
// the roll and every revision stay; only the public album is hidden.
async function drainWithdrawals(runID) {
  try {
    const claimed = await rpc('collective_media_claim_withdrawals', { run: runID }) || [];
    const done = [];
    const byBucket = {};
    claimed.forEach((c) => { (byBucket[c.bucket] = byBucket[c.bucket] || []).push(c); });
    for (const [bucket, rows] of Object.entries(byBucket)) {
      const owned = new Set(((await rpc('collective_media_withdrawals_still_claimed', { ids: rows.map((r) => r.id), claim_tokens: rows.map((r) => r.claim_token) })) || []).map((o) => o.id));
      const current = rows.filter((r) => owned.has(r.id));
      if (!current.length) continue;
      const { error } = await sb.storage.from(bucket).remove(current.map((r) => r.path));
      if (!error) done.push(...current.map((r) => r.id));
    }
    if (done.length) await rpc('collective_media_withdrawals_done', { ids: done });
  } catch { /* the server worker finishes anything left */ }
}
async function takeDown() {
  const run = ed.run;
  const served = await rpc('collective_album_take_down', { run: run.id }) || [];
  ed.takenDown = true;
  // A legacy public file has no private source: park it before its public copy goes.
  for (const p of served) {
    if (p.park_to) await sb.storage.from(PUBLIC).copy(p.path, p.park_to, { destinationBucket: DRAFTS }).catch(() => {});
  }
  await drainWithdrawals(run.id);
  setStatus('Taken down. Hidden in the app and on the site.', 'good');
  await loadRuns(); paintList(); paintAlbum();
}
async function putBackUp() {
  if (!ed || ed.publishing) return;
  ed.publishing = true; paintAlbum();
  const isAlbumCopy = (path) => { const s = path.split('/'); return s.length === 4 && s[0] === 'runs' && s[2] === 'a'; };
  const copy = async (bucket, from, to) => {
    const { error } = await sb.storage.from(bucket).copy(from, to, { destinationBucket: PUBLIC });
    if (error && !/exist|409|duplicate/i.test(String(error.message || error.statusCode))) throw error;
  };
  try {
    setStatus('Preparing the public copies…');
    for (const c of (await rpc('collective_album_stage_paths', { run: ed.run.id, assets: null })) || []) {
      if (!c.staged && c.source_path) await copy(c.source_bucket, c.source_path, c.path);
    }
    for (const p of (await rpc('collective_album_public_paths', { run: ed.run.id })) || []) {
      if (!p.staged && !isAlbumCopy(p.path) && p.source_path) await copy(p.source_bucket, p.source_path, p.path);
    }
    await rpc('collective_album_put_back_up', { run: ed.run.id });
    ed.takenDown = false;
    setStatus('Back up in the app and on the site', 'good');
    await loadRuns(); paintList();
  } catch (err) {
    setStatus(String(err?.message || '').includes('withdrawal_in_progress')
      ? 'An earlier copy is still being removed. It stays hidden; try again in a minute.'
      : 'Couldn’t put it back up. It stays hidden; try again.', 'bad');
  } finally { ed.publishing = false; paintAlbum(); }
}
function confirmTakeDown() {
  openSheet('Take this album down?', '<p>It disappears from the app and the site right away. Your edit, the photos and every version stay here, and you can put it back up.</p>',
    async () => { try { await takeDown(); } catch { throw new Error('Couldn’t take it down. The album is unchanged.'); } }, 'Take it down');
}

// ------------------------------------------------------------------ events

function select(id) {
  selected = id; ed = null;
  const r = runs.find((x) => x.id === id);
  paintList();
  $('wrap').classList.add('editing');
  if (!r) return;
  if (isUpcoming(r)) paintUpcoming(r); else openAlbum(r);
}
document.addEventListener('click', async (e) => {
  const t = e.target;
  const row = t.closest('[data-run]'); if (row) { select(row.dataset.run); return; }
  if (t.closest('[data-back]')) { $('wrap').classList.remove('editing'); selected = null; ed = null; paintList(); return; }
  if (t.closest('#newRun')) { newRun(); return; }
  const a = t.closest('[data-act]'); if (a) { act(a.dataset.act, runs.find((r) => r.id === selected)); return; }
  if (t.closest('[data-reopen]')) { select(selected); return; }
  if (!ed) return;
  const tog = t.closest('[data-toggle]');
  if (tog) {
    const id = tog.dataset.toggle, i = ed.items.findIndex((x) => x.asset === id);
    if (i >= 0) ed.items.splice(i, 1);
    else if (ed.items.length >= LIMIT) { setStatus(`Nine at most. Take one out first.`, 'bad'); return; }
    else ed.items.push({ asset: id, focal_x: 0.5, focal_y: 0.5, fit: false });
    paintAlbum(); scheduleSave(); return;
  }
  const cov = t.closest('[data-cover]');
  if (cov) { const i = ed.items.findIndex((x) => x.asset === cov.dataset.cover); ed.items.unshift(...ed.items.splice(i, 1)); paintAlbum(); scheduleSave(); return; }
  const mv = t.closest('[data-move]');
  if (mv) {
    const i = ed.items.findIndex((x) => x.asset === mv.dataset.move), j = i + Number(mv.dataset.by);
    if (i >= 0 && j >= 0 && j < ed.items.length) { [ed.items[i], ed.items[j]] = [ed.items[j], ed.items[i]]; paintAlbum(); scheduleSave(); }
    return;
  }
  const cf = t.closest('[data-confirm]');
  if (cf) {
    const a = ed.roll.find((x) => x.id === cf.dataset.confirm);
    const fields = { needs_date: false, taken_at: ed.run.starts_at };
    const { error } = await sb.from('collective_roll_assets').update(fields).eq('id', a.id);
    if (error) { setStatus(`Couldn’t confirm the date. ${message(error)}`, 'bad'); return; }
    Object.assign(a, fields); paintAlbum(); return;
  }
  const rt = t.closest('[data-retry]');
  if (rt) { const u = ed.uploads.find((x) => x.id === rt.dataset.retry); if (u?.file && u.state === 'failed') { await uploadOne(u); paintAlbum(); } return; }
  const dm = t.closest('[data-dismiss]');
  if (dm) { ed.uploads = ed.uploads.filter((x) => x.id !== dm.dataset.dismiss); paintUploads(); return; }
  const cfl = t.closest('[data-conflict]'); if (cfl) { await resolveConflict(cfl.dataset.conflict === 'mine'); return; }
  if (t.closest('#publish')) { publish(); return; }
  if (t.closest('#takeDown')) { confirmTakeDown(); return; }
  if (t.closest('#putBackUp')) { putBackUp(); }
});
document.addEventListener('change', (e) => {
  if (!ed) return;
  if (e.target.id === 'layout') { ed.layout = e.target.value; scheduleSave(); }
  if (e.target.id === 'appearance') { ed.appearance = e.target.value; scheduleSave(); }
  if (e.target.id === 'files') { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }
});
document.addEventListener('dragover', (e) => {
  const drop = e.target.closest?.('#drop'); if (drop) { e.preventDefault(); drop.classList.add('over'); }
  const ph = e.target.closest?.('.ph[draggable=true]'); if (ph && dragging) e.preventDefault();
});
document.addEventListener('dragleave', (e) => { e.target.closest?.('#drop')?.classList.remove('over'); });
let dragging = null;
document.addEventListener('dragstart', (e) => { const ph = e.target.closest?.('.ph[draggable=true]'); if (ph) { dragging = ph.dataset.asset; ph.classList.add('drag'); } });
document.addEventListener('dragend', () => { dragging = null; });
document.addEventListener('drop', async (e) => {
  const drop = e.target.closest?.('#drop');
  if (drop) {
    e.preventDefault(); drop.classList.remove('over');
    const files = [];
    const items = Array.from(e.dataTransfer.items || []);
    const walk = async (entry) => {
      if (entry.isFile) files.push(await new Promise((ok, no) => entry.file(ok, no)));
      else if (entry.isDirectory) {
        const reader = entry.createReader();
        let batch;
        do { batch = await new Promise((ok, no) => reader.readEntries(ok, no)); for (const c of batch) await walk(c); } while (batch.length);
      }
    };
    if (items.length && items[0].webkitGetAsEntry) { for (const it of items) { const en = it.webkitGetAsEntry(); if (en) await walk(en); } }
    else files.push(...Array.from(e.dataTransfer.files || []));
    addFiles(files); return;
  }
  const ph = e.target.closest?.('.ph[draggable=true]');
  if (ph && dragging && ed) {
    e.preventDefault();
    const from = ed.items.findIndex((x) => x.asset === dragging), to = ed.items.findIndex((x) => x.asset === ph.dataset.asset);
    if (from >= 0 && to >= 0 && from !== to) { const [it] = ed.items.splice(from, 1); ed.items.splice(to, 0, it); paintAlbum(); scheduleSave(); }
  }
});
window.addEventListener('beforeunload', (e) => {
  if (ed && (/Not saved|Saving/.test(ed.status) || ed.uploads.some((u) => ['waiting', 'preparing', 'uploading'].includes(u.state)))) { e.preventDefault(); e.returnValue = ''; }
});

async function refresh() {
  await loadRuns(); paintList();
  if (selected) { const r = runs.find((x) => x.id === selected); if (r && isUpcoming(r)) paintUpcoming(r); }
}

async function boot() {
  try {
    const access = await getAccessContext();
    if (!access.session) { location.href = '/coach/console/'; return; }
    me = access.session.user;
    if (!(await rpc('collective_is_publisher'))) {
      $('rows').innerHTML = '<p class="quiet pad">This account can’t publish runs or photos.</p>'; return;
    }
    await refresh();
  } catch (err) {
    $('rows').innerHTML = `<p class="pad">Couldn’t open Runs. ${esc(authErrorMessage ? authErrorMessage(err) : message(err))}</p><p class="pad"><button type="button" class="pill" data-reload>Try again</button></p>`;
  }
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-reload]')) location.reload(); });
window.FORM_RUNS = { miami, exifTaken, slugOf, needsConfirm, state: () => ed };
boot();
