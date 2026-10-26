// FORM Curated · coach-owned occurrence and invitation editor.
// A curator selects occasions. Collective owns the actual time/place/RSVP.
// No recurrence generator, auto-send, athlete plan mutation or attendance inference.

import { getAccessContext, signInWithPassword, sendMagicLink, authErrorMessage } from '/private/auth.js';
import { supabase as sb } from '/private/supabase-client.js';

const $ = (id) => document.getElementById(id);
const safe = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zone = 'America/New_York';
let calendar = {hosts:[],events:[],available_runs:[]};
let athletes = [];

async function rpc(name, args={}) { const { data, error } = await sb.rpc(name,args); if(error) throw error; return data; }
function say(value, error=false) { $('status').textContent=value; $('status').classList.toggle('error',error); }

function miamiParts(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(iso)).map((x)=>[x.type,x.value]));
  return { day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}` };
}
function miamiInstant(day, hm) {
  const [y,m,d] = day.split('-').map(Number), [h,min] = hm.split(':').map(Number);
  let t = Date.UTC(y,m-1,d,h,min);
  for(let i=0;i<3;i++) {
    const p=miamiParts(new Date(t).toISOString());
    const [py,pm,pd]=p.day.split('-').map(Number),[ph,pmin]=p.time.split(':').map(Number);
    t += Date.UTC(y,m-1,d,h,min)-Date.UTC(py,pm-1,pd,ph,pmin);
  }
  if(miamiParts(new Date(t).toISOString()).day!==day) throw new Error('Check that Miami date and time.');
  return new Date(t).toISOString();
}
const label = (iso) => new Intl.DateTimeFormat('en-US',{
  timeZone:zone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'
}).format(new Date(iso));

function render() {
  $('hosts').innerHTML=calendar.hosts.map((h,i)=>`<article class="host"><p class="eyebrow">${String(i+1).padStart(2,'0')} / CURATED</p><b>${safe(h.name)}</b><small>${safe(h.cadence_hint)}</small></article>`).join('');
  const sorted=calendar.events.filter((r)=>r.status==='scheduled');
  $('events').innerHTML=sorted.length?sorted.map((r)=>`<div class="event">
    <span class="date">${safe(label(r.starts_at).split(',')[0])}</span>
    <div><h3>${safe(r.title)}</h3><p>${safe(r.host_slug.toUpperCase())} · ${safe(r.category)} · ${safe(r.cadence.replace('_','-'))} · ${safe(r.meet_name)} · ${safe(label(r.starts_at))}</p></div>
    <span class="count">${r.invitation_count} invited</span>
  </div>`).join(''):'<p class="hint">No future curated events yet. Add only dates you have confirmed.</p>';
  $('availableRuns').innerHTML='<option value="">Choose a published occurrence</option>'+
    calendar.available_runs.map((r)=>`<option value="${safe(r.id)}">${safe(r.title)} · ${safe(label(r.starts_at))}</option>`).join('');
  $('inviteRuns').innerHTML='<option value="">Choose an upcoming event</option>'+
    sorted.map((r)=>`<option value="${safe(r.id)}">${safe(r.title)} · ${safe(label(r.starts_at))}</option>`).join('');
  $('athletes').innerHTML=athletes.map((a)=>`<label class="athlete"><input name="athlete" type="checkbox" value="${safe(a.id)}">${safe(a.display_name)}</label>`).join('') || '<p class="hint">No assigned athletes found.</p>';
}

async function load() {
  calendar=await rpc('form_curated_manage');
  const {data,error}=await sb.from('athletes').select('id,display_name,active').eq('active',true).order('display_name');
  if(error) throw error;
  athletes=data||[];
  render();
  say('Calendar ready. No invitations are sent until you choose recipients.');
}
async function prime() {
  const access=await getAccessContext();
  if(!access.session || !access.coachMemberships.length) {
    $('gate').hidden=false;$('work').hidden=true;return;
  }
  $('gate').hidden=true;$('work').hidden=false;
  await load();
}

$('signin').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=new FormData(e.currentTarget);$('gateStatus').textContent='Signing in…';
  try{await signInWithPassword(f.get('email'),f.get('password'));await prime();}
  catch(err){$('gateStatus').textContent=authErrorMessage(err);}
});
$('magic').addEventListener('click',async()=>{
  const f=new FormData($('signin'));
  try{await sendMagicLink(f.get('email'),'/coach/curated/');$('gateStatus').textContent='Sign-in link sent.';}
  catch(err){$('gateStatus').textContent=authErrorMessage(err);}
});

$('eventForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const starts=miamiInstant(f.get('date'),f.get('start'));
  const meet=f.get('meet')?miamiInstant(f.get('date'),f.get('meet')):null;
  const end=f.get('end')?miamiInstant(f.get('date'),f.get('end')):null;
  if(meet && Date.parse(meet)>Date.parse(starts)) return say('Meet time must be before the start.',true);
  if(end && Date.parse(end)<=Date.parse(starts)) return say('End time must follow the start.',true);
  if(Date.parse(starts)<=Date.now()) return say('Choose a future date.',true);
  const host=calendar.hosts.find((h)=>h.slug===f.get('host'));
  if(!confirm(`Add “${f.get('title')}” to FORM Curated under ${host?.name||f.get('host')} on ${label(starts)}? This will not invite anyone yet.`)) return;
  const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  try {
    await rpc('form_curated_create_event',{
      p_host_slug:f.get('host'),p_title:f.get('title').trim(),p_category:f.get('category'),p_cadence:f.get('cadence'),
      p_starts_at:starts,p_meet_at:meet,p_meet_name:f.get('place').trim(),p_meet_address:f.get('address').trim(),
      p_visibility:f.get('visibility'),p_ends_at:end,p_source_url:f.get('source').trim()||null,p_note:f.get('note').trim()
    });
    e.currentTarget.reset();await load();say('Event created. Choose the athletes you want to invite.');
  } catch(err) {say(`Not added: ${err.message}`,true);} finally {button.disabled=false;}
});

$('linkForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=new FormData(e.currentTarget),item=calendar.available_runs.find((r)=>r.id===f.get('run'));
  if(!item)return;
  if(!confirm(`Include “${item.title}” in FORM Curated? The original run and its RSVP stay unchanged.`))return;
  try{
    await rpc('form_curated_link_run',{p_run_id:item.id,p_host_slug:f.get('host'),p_category:f.get('category'),p_cadence:f.get('cadence')});
    await load();say('The existing occurrence is now in the curated calendar.');
  }catch(err){say(`Not linked: ${err.message}`,true);}
});

$('selectAll').addEventListener('click',()=>document.querySelectorAll('#athletes input').forEach((x)=>{x.checked=true;}));
$('clearAll').addEventListener('click',()=>document.querySelectorAll('#athletes input').forEach((x)=>{x.checked=false;}));
$('inviteForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=new FormData(e.currentTarget),ids=f.getAll('athlete');
  const item=calendar.events.find((r)=>r.id===f.get('run'));
  if(!item || !ids.length) return say('Choose a future event and at least one athlete.',true);
  if(ids.length>100) return say('Invite up to 100 athletes at a time.',true);
  if(!confirm(`Invite ${ids.length} athlete${ids.length===1?'':'s'} to “${item.title}”? They will find it in My FORM.`)) return;
  try {
    const added=await rpc('form_curated_invite',{p_run_id:item.id,p_athlete_ids:ids});
    await load();say(`${added} new invitation${added===1?'':'s'} saved in My FORM. Already-invited athletes were left as they were.`);
  } catch(err) {say(`Not invited: ${err.message}`,true);}
});

prime().catch((err)=>{$('gate').hidden=false;$('work').hidden=true;$('gateStatus').textContent=authErrorMessage(err);});
