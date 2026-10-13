const ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/public-strength-study';
// Public anon key for the Edge gateway. It conveys no access to private athlete rows.
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZ3NqamVneWNhY29kaWx0YmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTU1ODUsImV4cCI6MjEwMzE3MTU4NX0.SL60dHQ1naXp_3WVJXApDaLo5qLlbG_O-k0eSGmQktU';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Date(value).toLocaleString('en-US', {timeZone:'America/New_York', dateStyle:'medium', timeStyle:'short'});
export function sessionHTML(session) {
  const movements = new Map();
  for (const set of session.sets) {
    const key = set.movement_id;
    if (!movements.has(key)) movements.set(key, {name:set.movement_name, sets:[]});
    movements.get(key).sets.push(set);
  }
  return `<details class="strength-record"><summary>${escape(session.session_name)} · ${escape(date(session.completed_at))} ET</summary>
    <p>Week ${escape(session.week)} · ${session.sets.length} recorded sets${session.prescription_version == null ? ' · Plan version not linked' : ` · Plan version ${escape(session.prescription_version)}`}</p>
    ${[...movements.values()].map(m => `<h4>${escape(m.name)}</h4><ol>${m.sets.map(s => {
      const load = s.weight == null ? 'Load not recorded' : `${escape(s.weight)} ${escape(s.weight_unit || '(unit not recorded)')}`;
      const work = [s.reps == null ? null : `${escape(s.reps)} reps`, s.seconds == null ? null : `${escape(s.seconds)} sec`].filter(Boolean).join(' · ') || 'Reps/time not recorded';
      return `<li>${load} · ${work}</li>`;
    }).join('')}</ol>`).join('')}
    <p class="strength-source">Recorded by Adrian in Strength. Received ${escape(date(session.received_at))} ET. Record ${escape(session.id)}.</p>
  </details>`;
}

export function mountStrengthStudy(root) {
  const study = root.dataset.strengthStudy;
  const count = document.querySelector('[data-strength-session-count]');
  let records = [], total = 0, loading = false, download;
  root.innerHTML = `<h3>Recorded in Strength</h3>
    <p>Completed workouts Adrian shares from the Strength app appear here. These are his recorded sets and loads.</p>
    <p data-status role="status">Checking app records…</p>
    <div class="strength-actions"><button type="button" data-refresh>Refresh</button><button type="button" data-export hidden>Download JSON</button></div>
    <div data-records></div><button type="button" data-more hidden>Show more workouts</button>`;
  const status = root.querySelector('[data-status]');
  const more = root.querySelector('[data-more]');
  const exportButton = root.querySelector('[data-export]');
  async function read(append = false) {
    if (loading) return;
    loading = true;
    root.querySelector('[data-refresh]').disabled = true;
    more.disabled = true;
    try {
      const response = await fetch(`${ENDPOINT}?study=${encodeURIComponent(study)}&offset=${append ? records.length : 0}`, {
        headers:{Authorization:`Bearer ${ANON}`, apikey:ANON}, cache:'no-store', signal:AbortSignal.timeout(12000)
      });
      if (response.status === 404) {
        records = []; total = 0; download = null;
        root.querySelector('[data-records]').replaceChildren();
        more.hidden = exportButton.hidden = true;
        if (count) count.textContent = 'Unavailable';
        status.textContent = 'App records are not published for this study.';
        return;
      }
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (data.status !== 'published' || !Array.isArray(data.sessions) || !Number.isInteger(data.total_sessions)) throw new Error('invalid');
      // IDs deduplicate pages if a new upload arrives between requests.
      records = [...new Map([...(append ? records : []), ...data.sessions].map(s => [s.id,s])).values()];
      total = data.total_sessions;
      download = {...data, offset:0, sessions:records, exported_sessions:records.length};
      const open = new Set([...root.querySelectorAll('details[open]')].map(el => el.dataset.recordId));
      root.querySelector('[data-records]').innerHTML = records.map(sessionHTML).join('');
      root.querySelectorAll('details').forEach((el,i) => { el.dataset.recordId = records[i].id; el.open = open.has(records[i].id); });
      if (count) count.textContent = String(total);
      status.textContent = total ? `${total} app ${total === 1 ? 'session' : 'sessions'}. Showing ${records.length}. Checked ${date(data.checked_at)} ET.` : `No app sessions received yet. Checked ${date(data.checked_at)} ET. Connection and workout sharing must be on in his app.`;
      more.hidden = records.length >= total;
      exportButton.hidden = false;
    } catch {
      // Do not turn a failed read into a zero. Clear stale public evidence on an unconfirmed refresh.
      records = []; download = null;
      root.querySelector('[data-records]').replaceChildren();
      more.hidden = exportButton.hidden = true;
      if (count) count.textContent = 'Unavailable';
      status.textContent = 'App records could not be checked. Try Refresh.';
    } finally {
      loading = false; more.disabled = false;
      root.querySelector('[data-refresh]').disabled = false;
    }
  }
  root.querySelector('[data-refresh]').addEventListener('click', () => read());
  more.addEventListener('click', () => read(true));
  exportButton.addEventListener('click', () => {
    if (!download) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(download,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=`${study}-strength.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  read();
  // Refresh a visible page; preserve expanded workouts while reviewing.
  const timer = setInterval(() => { if (!document.hidden && records.length <= 50) read(); },60000);
  window.addEventListener('pagehide',() => clearInterval(timer),{once:true});
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-strength-study]').forEach(mountStrengthStudy);
