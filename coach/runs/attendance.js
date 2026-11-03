// LABS · RUNS · ATTENDANCE
//
// The coach's concierge view of one run, on the same server contract as the FORM app
// (docs/migrations/collective/20261102190000_concierge_roster.sql, 20261102200000_concierge_closeout_v2.sql).
// Three facts stay separate and the SERVER owns every write; each action re-reads from it:
//   Coach confirmed  the expected list (a name needs no account, no terms, no RSVP)
//   I'm in           the member's own RSVP (not shown here by name)
//   Witnessed        the closeout: Here / Absent / Unknown for everyone listed, plus the witness line.
// Nobody is ever promoted to Here from either list. A closed run is corrected by appending a reasoned
// correction; the original closeout is never rewritten.
//
// style-src is 'self' on /coach/*: no style="" in markup.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = () => crypto.randomUUID();
const stamp = (iso) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

function explain(error) {
  const m = String(error?.message || error || '');
  if (m.includes('already_on_roster')) return 'That name is already on the list.';
  if (m.includes('roster_changed')) return 'Someone else changed the list. It is refreshed; review it again.';
  if (m.includes('run_already_closed')) return 'This run is closed. Correct it in the attendance record.';
  if (m.includes('run_unavailable')) return 'This run can’t take names.';
  if (m.includes('bad_display_name')) return 'Use 1 to 40 characters.';
  if (m.includes('not_run_operator') || m.includes('not_host')) return 'Only FORM or the run’s host can do this.';
  if (m.includes('unreviewed_rows')) return 'Someone is not marked yet.';
  if (m.includes('walk_in_is_expected')) return 'That person is already listed. Mark them on their own row.';
  if (m.includes('attendance_changed')) return 'Someone corrected this first. Reload the record.';
  if (m.includes('reason_required')) return 'Give a reason.';
  if (m.includes('not_publisher')) return 'Only FORM can correct a closed run.';
  return m || 'Something went wrong.';
}

export function mountAttendance({ sb, pane, run, onBack }) {
  if (pane._attendance) pane._attendance.abort();
  const ctl = new AbortController(); pane._attendance = ctl;
  const rpc = async (name, args = {}) => { const { data, error } = await sb.rpc(name, args); if (error) throw error; return data; };
  const started = Date.parse(run.starts_at) <= Date.now();
  const s = { roster: null, unavailable: false, history: null, review: null, marks: {}, walkIns: [], witnessed: false, op: uuid(), msg: '', bad: false, editing: null, members: null, corr: null };

  const say = (t, bad = false) => { s.msg = t; s.bad = bad; };
  async function load() {
    try { s.roster = await rpc('collective_concierge_roster', { p_run_id: run.id }); s.unavailable = false; }
    catch (e) { if (/404|PGRST202|Could not find/.test(String(e?.message) + (e?.code || ''))) s.unavailable = true; else throw e; }
    s.history = await rpc('collective_attendance_history_v2', { p_run_id: run.id }).catch(() => []);
    s.closed = s.history.some((h) => h.kind === 'closeout');
    if (started && !s.closed && !s.unavailable) {
      s.review = await rpc('collective_closeout_roster_v2', { run: run.id }).catch(() => null);
    } else s.review = null;
  }

  const keyOf = (r) => (r.participant_id ? `p:${r.participant_id}` : r.account_id);
  function paint() {
    const live = (s.roster || []).filter((r) => r.state === 'expected'), gone = (s.roster || []).filter((r) => r.state !== 'expected');
    const ordered = [...live, ...gone];
    pane.innerHTML = `
      <button type="button" class="back" data-back>‹ Runs</button>
      <div class="head"><div><p class="label">Attendance</p><h2>${esc(run.title)}</h2>
        <p class="facts">Coach confirmed is who you expect. It is not “I’m in”, and it is not who came.</p></div></div>
      ${s.unavailable ? '<div class="section"><p class="quiet">The coach list isn’t available on this server yet.</p></div>' : `
      <div class="section"><h3>Coach confirmed · ${live.length}</h3>
        <ul class="att">${ordered.map((r) => `<li class="${r.state === 'expected' ? '' : 'off'}" data-p="${esc(r.participant_id)}">
          ${s.editing === r.participant_id
            ? `<input type="text" maxlength="40" data-rename-input value="${esc(r.display_name)}"><button type="button" class="btn" data-save-rename>Save</button><button type="button" class="btn ghost" data-cancel-rename>Cancel</button>`
            : `<span class="who">${esc(r.display_name)}</span><small class="quiet">${r.state === 'expected' ? (r.account_id ? 'Coach confirmed · linked to an account' : 'Coach confirmed') : 'Withdrawn'}</small>
               ${s.closed ? '' : `<span class="rowActs"><button type="button" class="pill" data-rename>Rename</button>
               ${r.state === 'expected' ? `${r.account_id ? '' : '<button type="button" class="pill" data-link>Link account</button>'}<button type="button" class="pill" data-withdraw>Withdraw</button>` : '<button type="button" class="pill" data-restore>Restore</button>'}</span>`}`}
        </li>`).join('') || '<li class="quiet">Nobody yet.</li>'}</ul>
        ${s.closed ? '<p class="quiet">This run is closed. Corrections are made in the attendance record below.</p>' : `
        <form class="addForm" data-add><input type="text" name="name" maxlength="40" placeholder="Add a name" aria-label="Add a name" required><button type="submit" class="btn">Add</button></form>
        <p class="quiet">No account needed.</p>`}
        <p class="acts"><button type="button" class="btn" data-refresh>Refresh</button><button type="button" class="btn" data-activity>Activity</button></p>
      </div>`}
      ${s.review ? reviewHTML() : ''}
      ${s.closed ? recordHTML() : ''}
      <p class="note${s.bad ? ' bad' : ''}" role="status">${esc(s.msg)}</p>
      <div id="attSheet"></div>`;
  }

  function reviewHTML() {
    const rows = s.review;
    const unrev = rows.filter((r) => !s.marks[keyOf(r)]).length;
    const can = unrev === 0 && s.witnessed;
    return `<div class="section"><h3>Close the run</h3>
      <p class="quiet">Mark only what you saw. Unknown stays unknown. Nobody is marked Here for you.</p>
      <ul class="att">${rows.map((r) => { const k = keyOf(r), m = s.marks[k]; return `<li data-k="${esc(k)}"><span class="who">${esc(r.name)}</span>
        <small class="quiet">${esc([r.rsvp ? 'I’m in' : '', r.coach_expected ? 'Coach confirmed' : ''].filter(Boolean).join(' · '))}</small>
        <span class="rowActs seg" role="group" aria-label="${esc(r.name)}">${[['present', 'Here'], ['absent', 'Absent'], ['unknown', '?']].map(([v, l]) => `<button type="button" class="pill${m === v ? ' on' : ''}" aria-pressed="${m === v}" data-mark="${v}">${l}</button>`).join('')}</span></li>`; }).join('') || '<li class="quiet">Nobody to review. Add who came.</li>'}
        ${s.walkIns.map((w, i) => `<li><span class="who">${esc(w)}</span><small class="quiet">Walk-in · Here</small><span class="rowActs"><button type="button" class="pill" data-rm-walkin="${i}">Remove</button></span></li>`).join('')}</ul>
      <form class="addForm" data-walkin><input type="text" name="name" maxlength="40" placeholder="Someone who came and isn’t listed" aria-label="Walk-in name"><button type="submit" class="btn">Add</button></form>
      <label class="check"><input type="checkbox" data-witness ${s.witnessed ? 'checked' : ''}> I saw everyone I marked here.</label>
      <p class="acts"><button type="button" class="btn go" data-close ${can ? '' : 'disabled'}>Close the run</button></p>
      ${unrev ? `<p class="quiet">${unrev} not marked yet.</p>` : ''}</div>`;
  }

  function recordHTML() {
    const h = s.history;
    return `<div class="section"><h3>Attendance record</h3>
      <ul class="att rec">${h.map((e, i) => {
        const before = i > 0 ? h[i - 1].names : null;
        let diff = '';
        if (before) { const left = [...before], added = []; e.names.forEach((n) => { const j = left.indexOf(n); if (j >= 0) left.splice(j, 1); else added.push(n); }); diff = `${added.length ? `<br>Added: ${esc(added.join(', '))}` : ''}${left.length ? `<br>Removed: ${esc(left.join(', '))}` : ''}<br><span class="quiet">Before: ${esc(before.join(', '))}</span>`; }
        const rv = e.reviewed || [];
        const grp = (st, l) => { const n = rv.filter((x) => x.state === st).map((x) => x.name); return n.length ? `<br><span class="quiet">${l}: ${esc(n.join(', '))}</span>` : ''; };
        return `<li><span class="who">${e.kind === 'closeout' ? 'Closed · witnessed' : 'Correction'}</span><small class="quiet">${esc(e.actor_name)} · ${esc(stamp(e.at))}</small>
          <span class="rec">${e.reason ? `${esc(e.reason)}<br>` : ''}Here: ${esc(e.names.join(', ') || 'nobody')}${diff}${grp('absent', 'Absent')}${grp('unknown', 'Unknown')}</span></li>`; }).join('')}</ul>
      <p class="acts"><button type="button" class="btn" data-correct>Correct attendance</button></p></div>`;
  }

  function correctSheet() {
    const latest = s.history[s.history.length - 1], original = s.history[0];
    if (!s.corr) s.corr = { here: latest.names.map((n, i) => ({ name: n, id: latest.account_ids[i] || null })), reason: '', op: uuid() };
    const c = s.corr, others = (original.reviewed || []).filter((r) => r.state !== 'present' && !c.here.some((h) => h.name === r.name));
    $sheet().innerHTML = `<div class="section corr"><h3>Correct attendance</h3>
      <p class="quiet">The original record stays. This adds a correction with your reason.</p>
      <ul class="att">${c.here.map((h, i) => `<li><span class="who">${esc(h.name)}</span><span class="rowActs"><button type="button" class="pill" data-c-remove="${i}">Remove</button></span></li>`).join('')}
      ${others.map((r) => `<li><span class="who">${esc(r.name)}</span><small class="quiet">${r.state === 'absent' ? 'Absent' : 'Unknown'}</small><span class="rowActs"><button type="button" class="pill" data-c-add="${esc(r.name)}" data-c-id="${esc(r.account_id || '')}">Mark here</button></span></li>`).join('')}</ul>
      <form class="addForm" data-c-walkin><input type="text" name="name" maxlength="40" placeholder="Someone else who came"><button type="submit" class="btn">Add</button></form>
      <label>Reason<input type="text" maxlength="280" data-c-reason value="${esc(c.reason)}" placeholder="Why this changed"></label>
      <p class="acts"><button type="button" class="btn ghost" data-c-cancel>Cancel</button><button type="button" class="btn go" data-c-save>Save correction</button></p></div>`;
  }
  const $sheet = () => pane.querySelector('#attSheet');

  async function run_(fn, reload = true) {
    try { await fn(); say(''); } catch (e) { say(explain(e), true); }
    if (reload) { try { await load(); } catch (e) { say(explain(e), true); } }
    paint();
  }
  const row = (t) => (s.roster || []).find((r) => r.participant_id === t.closest('[data-p]')?.dataset.p);
  const record = (r, over) => rpc('collective_concierge_record', { p_run_id: run.id, p_name: r.display_name, p_state: r.state, p_participant_id: r.participant_id, p_account_id: r.account_id, p_base_at: r.recorded_at, ...over });

  pane.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('[data-back]')) { e.stopPropagation(); ctl.abort(); onBack(); return; }
    if (t.closest('[data-refresh]')) { await run_(async () => {}); return; }
    if (t.closest('[data-activity]')) {
      try {
        const ev = await rpc('collective_concierge_history', { p_run_id: run.id });
        $sheet().innerHTML = `<div class="section"><h3>Activity</h3><ul class="att">${ev.map((x) => `<li><span class="who">${esc(x.display_name)} · ${x.state === 'expected' ? 'Coach confirmed' : 'Withdrawn'}</span><small class="quiet">${esc(x.actor_name)} · ${esc(stamp(x.recorded_at))}${x.reason ? ` · ${esc(x.reason)}` : ''}</small></li>`).join('') || '<li class="quiet">Nothing yet.</li>'}</ul></div>`;
      } catch (err) { say(explain(err), true); paint(); }
      return;
    }
    const r = t.closest('[data-p]') ? row(t) : null;
    if (r && t.closest('[data-rename]')) { s.editing = r.participant_id; paint(); return; }
    if (t.closest('[data-cancel-rename]')) { s.editing = null; paint(); return; }
    if (r && t.closest('[data-save-rename]')) {
      const name = t.closest('li').querySelector('[data-rename-input]').value.trim();
      s.editing = null; await run_(() => record(r, { p_name: name })); return;
    }
    if (r && t.closest('[data-withdraw]')) { await run_(() => record(r, { p_state: 'withdrawn', p_reason: 'Withdrawn by coach' })); return; }
    if (r && t.closest('[data-restore]')) { await run_(() => record(r, { p_state: 'expected' })); return; }
    if (r && t.closest('[data-link]')) {
      try { s.members = s.members || await rpc('collective_member_names'); } catch { say('Couldn’t load members.', true); paint(); return; }
      $sheet().innerHTML = `<div class="section"><h3>Link ${esc(r.display_name)} to an account</h3><ul class="att">${s.members.map((m) => `<li><span class="who">${esc(`${m.first_name}${m.last_initial ? ` ${m.last_initial}.` : ''}`)}</span><span class="rowActs"><button type="button" class="pill" data-link-pick="${esc(m.account_id)}" data-for="${esc(r.participant_id)}">Link</button></span></li>`).join('')}</ul></div>`;
      return;
    }
    const lp = t.closest('[data-link-pick]');
    if (lp) { const target = (s.roster || []).find((x) => x.participant_id === lp.dataset.for); await run_(() => record(target, { p_account_id: lp.dataset.linkPick })); return; }
    const mk = t.closest('[data-mark]');
    if (mk) { s.marks[t.closest('[data-k]').dataset.k] = mk.dataset.mark; paint(); return; }
    const rw = t.closest('[data-rm-walkin]'); if (rw) { s.walkIns.splice(Number(rw.dataset.rmWalkin), 1); paint(); return; }
    if (t.closest('[data-close]')) {
      const marks = [...s.review.map((r2) => ({ ...(r2.participant_id ? { participant_id: r2.participant_id } : { account_id: r2.account_id }), state: s.marks[keyOf(r2)] })), ...s.walkIns.map((w) => ({ walk_in: w, state: 'present' }))];
      await run_(async () => {
        await rpc('collective_close_run_v2', { run: run.id, op: s.op, marks, witness: true, revision: s.review[0]?.revision ?? '' });
        s.marks = {}; s.walkIns = []; s.witnessed = false; s.op = uuid();
      });
      return;
    }
    if (t.closest('[data-correct]')) { s.corr = null; correctSheet(); return; }
    const cr = t.closest('[data-c-remove]'); if (cr) { s.corr.here.splice(Number(cr.dataset.cRemove), 1); s.corr.reason = $sheet().querySelector('[data-c-reason]').value; correctSheet(); return; }
    const ca = t.closest('[data-c-add]'); if (ca) { s.corr.reason = $sheet().querySelector('[data-c-reason]').value; s.corr.here.push({ name: ca.dataset.cAdd, id: ca.dataset.cId || null }); correctSheet(); return; }
    if (t.closest('[data-c-cancel]')) { s.corr = null; $sheet().innerHTML = ''; return; }
    if (t.closest('[data-c-save]')) {
      const c = s.corr, reason = $sheet().querySelector('[data-c-reason]').value.trim(), latest = s.history[s.history.length - 1];
      if (!reason) { say('Give a reason.', true); paint(); correctSheet(); return; }
      await run_(async () => {
        await rpc('collective_correct_attendance_v2', { p_run_id: run.id, p_op: c.op, p_base: latest.entry_id, p_names: c.here.map((h) => h.name), p_account_ids: c.here.map((h) => h.id), p_reason: reason });
        s.corr = null;
      });
    }
  }, { signal: ctl.signal });
  pane.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, name = (new FormData(f).get('name') || '').toString().trim();
    if (f.matches('[data-add]')) { if (name) await run_(() => rpc('collective_concierge_record', { p_run_id: run.id, p_name: name, p_participant_id: uuid() })); }
    else if (f.matches('[data-walkin]')) {
      if (name && !s.walkIns.some((w) => w.toLowerCase() === name.toLowerCase()) && !s.review.some((r) => r.name.toLowerCase() === name.toLowerCase())) s.walkIns.push(name);
      paint();
    } else if (f.matches('[data-c-walkin]')) {
      if (name && !s.corr.here.some((h) => h.name.toLowerCase() === name.toLowerCase())) { s.corr.reason = $sheet().querySelector('[data-c-reason]').value; s.corr.here.push({ name, id: null }); correctSheet(); }
    }
  }, { signal: ctl.signal });
  pane.addEventListener('change', (e) => { if (e.target.matches('[data-witness]')) { s.witnessed = e.target.checked; paint(); } }, { signal: ctl.signal });

  pane.innerHTML = '<button type="button" class="back" data-back>‹ Runs</button><div class="empty"><p class="quiet">Loading attendance…</p></div>';
  return load().then(paint).catch((err) => { say(explain(err), true); paint(); });
}

export const _test = { explain };
