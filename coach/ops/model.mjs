export const AREAS = {training:'My training',coaching:'Coaching',money:'Money',form:'FORM',home:'Home & life',learning:'Learning'};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value) {
  try { const u = new URL(String(value), 'https://speedandform.com'); return ['https:','http:'].includes(u.protocol) ? u.href : null; } catch { return null; }
}
export function sourceState(source, now = Date.now()) {
  if (['unavailable','conflict','pending'].includes(source.state)) return source.state;
  if (!source.observed_at) return 'unchecked';
  if (source.expires_at && new Date(source.expires_at).getTime() <= now) return 'stale';
  return source.state;
}
export function priorityCandidates(items,today) {
  return items.filter(i=>i.kind==='task'&&i.actor==='brice'&&['active','queued'].includes(i.status)&&((i.focus_on&&i.focus_on<=today)||(i.due_on&&i.due_on<=today)))
    .sort((a,b)=>Number(b.focus_on===today)-Number(a.focus_on===today)||a.priority-b.priority||(a.due_on||'9999').localeCompare(b.due_on||'9999')||(a.created_at||'').localeCompare(b.created_at||''))
    .slice(0,4);
}
export function validateBoard(data) {
  if (!data || data.schema_version!==1 || !/^\d{4}-\d{2}-\d{2}$/.test(data.today||'')) throw new Error('Unsupported console response.');
  for (const key of ['items','priorities','sources','athletes','decisions','coach_tasks','coach_todos','appointments','changes']) if (!Array.isArray(data[key])) throw new Error('Incomplete console response.');
  return data;
}
export function dateLabel(value,options={month:'short',day:'numeric'}) {
  if (!value) return '';
  const d = new Date(value.length===10 ? `${value}T12:00:00-04:00` : value);
  return Number.isNaN(d.getTime()) ? 'Date unavailable' : d.toLocaleDateString('en-US',{timeZone:'America/New_York',...options});
}

export function upcomingAppointments(rows,today,readAt) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(readAt));
  const localMinute=Number(parts.find(p=>p.type==='hour').value)*60+Number(parts.find(p=>p.type==='minute').value);
  return rows.filter(a=>{
    if(['done','cancelled'].includes(a.status)||!a.scheduled_on||a.scheduled_on<today)return false;
    if(a.scheduled_on>today||!a.time_local)return true;
    const [h,m]=a.time_local.split(':').map(Number);
    // Unknown duration stays visible rather than guessing when the appointment ends.
    return !a.duration_minutes||h*60+m+a.duration_minutes>localMinute;
  }).slice(0,7);
}
