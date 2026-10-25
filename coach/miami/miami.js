import { getAccessContext, signInWithPassword, sendMagicLink, authErrorMessage } from '/private/auth.js';
import { supabase as sb } from '/private/supabase-client.js';

const $ = (id) => document.getElementById(id);
const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zdate = (iso) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso)).map((x)=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const near = (weekday) => {
  const d = new Date(`${zdate(new Date().toISOString())}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((weekday-d.getUTCDay()+7)%7));
  return d.toISOString().slice(0,10);
};
const fmt = (iso) => new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(iso));
let lane = 'thursday', preview = null, roster = [], availableAthletes = [], daySessions = [], runs = [], prepared = null, editorLoadedKey = '';
const isThursday = () => lane === 'thursday';
function say(msg,error=false){$('status').textContent=msg;$('status').classList.toggle('error',error);}
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw error;return data;}
async function dispatchEmails(){try{const {data,error}=await sb.functions.invoke('form-messages',{body:{action:'dispatch'}});if(error) return 'Email delivery is queued; sender could not be reached.';return data?.sent ? `${data.sent} email${data.sent===1?'':'s'} sent.` : 'In-app messages saved. Eligible emails were checked.';}catch{return 'In-app messages saved. Email dispatch is pending.';}}

function setRow(part={}){
  return `<div class="set">
    <label>REPEATS<input data-part="repeatCount" type="number" min="1" max="30" value="${safe(part.repeatCount ?? 4)}" required></label>
    <label>DISTANCE · M<input data-part="meters" type="number" min="0" max="10000" step="50" value="${safe(part.distance == null ? 400 : Math.round(part.distance*1000))}"></label>
    <label>WORK · SECONDS<input data-part="durationSeconds" type="number" min="0" max="3600" value="${safe(part.durationSeconds ?? '')}" placeholder="Distance reps"></label>
    <label>RECOVERY · SECONDS<input data-part="recoverySeconds" type="number" min="0" max="900" value="${safe(part.recoverySeconds ?? 90)}" required></label>
    <button class="remove" type="button" aria-label="Remove set" title="Remove set">✕</button></div>`;
}
function fillEditor(item){
  const f=$('workoutForm'); const blocks=item?.components||[];
  f.elements.title.value=item?.title||'Speed · Track';
  f.elements.intent.value=item?.intent||'Practice fast, controlled running on the track.';
  f.elements.details.value=item?.details||'';
  f.elements.duration.value=item?.duration||70;
  f.elements.warmup.value=Math.round((blocks.find((b)=>b.role==='warm_up')?.durationSeconds||1200)/60);
  f.elements.cooldown.value=Math.round((blocks.find((b)=>b.role==='cool_down')?.durationSeconds||900)/60);
  $('sets').innerHTML=blocks.filter((b)=>b.role==='work').map(setRow).join('')||setRow();
  $('publish').disabled=true;prepared=null;
}
function workoutPayload(){
  const f=$('workoutForm'); const warm=Number(f.elements.warmup.value||0)*60, cool=Number(f.elements.cooldown.value||0)*60;
  const components=[];
  if(warm>0) components.push({role:'warm_up',shape:'continuous',durationSeconds:warm,rpeLow:2,rpeHigh:3});
  for(const set of $('sets').children){
    const get=(field)=>Number(set.querySelector(`[data-part="${field}"]`).value||0);
    const reps=get('repeatCount'),meters=get('meters'),duration=get('durationSeconds'),recovery=get('recoverySeconds');
    if(!Number.isInteger(reps)||reps<1||reps>30||(!meters&&!duration)||meters>10000||duration>3600||recovery>900)throw new Error('Check set distances, repeats, and recovery.');
    const part={role:'work',shape:'repetitions',repeatCount:reps,recoverySeconds:recovery,recoveryKind:'standing',rpeLow:5,rpeHigh:7};
    if(meters) {part.distance=meters/1000;part.distanceUnit='km';}
    if(duration)part.durationSeconds=duration;
    components.push(part);
  }
  if(cool>0) components.push({role:'cool_down',shape:'continuous',durationSeconds:cool,rpeLow:2,rpeHigh:3});
  return {title:f.elements.title.value.trim(),intent:f.elements.intent.value.trim(),details:f.elements.details.value.trim(),duration:Number(f.elements.duration.value),components};
}
function allowed(r){return Boolean(r.session_id&&r.version_id&&r.state==='published'&&!r.paused&&!r.override&&!r.filed);}
function rosterContent(){
  const editable=roster.filter(allowed);
  $('count').textContent=`${roster.length} SUBSCRIBED`;
  $('roster').innerHTML=roster.map((r)=>{
    const flags=[];if(!r.session_id)flags.push('No linked session');if(r.paused)flags.push('Paused');if(r.override)flags.push('Individual edit');if(r.filed)flags.push('Already filed');if(r.state&&r.state!=='published')flags.push('Not published');
    const dist=r.distance ? `${r.distance} ${r.unit||'mi'}` : '';
    return `<div class="row"><span>${safe(r.name)}<small>${r.mode==='effort'?'Own effort':'Own pace'}</small></span><span>${safe(r.title||'No assigned Saturday session')}${dist?`<small>${safe(dist)}</small>`:''}</span><span class="flag ${flags.length?'':'good'}">${safe(flags.join(' · ')||(isThursday()?'Ready':'Own distance'))}</span></div>`;
  }).join('')||'<p class="hint">No athletes are subscribed yet.</p>';
  if(isThursday())$('publishNote').textContent=`${editable.length} linked and unfinished Weeks can be revised. Individual overrides, filed sessions and unlinked athletes stay unchanged.`;
}
function meetingContent(){
  const r=preview.run;
  $('runState').textContent=r?r.status.toUpperCase():'NO MEETUP';
  $('meeting').innerHTML=r?`<div class="meeting"><h3>${safe(r.title)}</h3><p>${safe(fmt(r.starts_at))} · ${safe(r.meet_name)}</p><p>${safe(r.meet_address)}</p><p class="hint">Attendance is owned by the existing Who’s in RSVP on <a href="/runs/">Runs</a>.</p></div>`
    :`<p class="no-meetup">No FORM ${isThursday()?'Thursday':'Saturday'} meetup is linked here for this date.</p><p class="hint">${isThursday()?'The track workout remains in each athlete’s Week.':'Everyone still has their own prescribed distance. A meetup is optional.'}</p>`;
  const choices=runs.filter((x)=>x.kind===(isThursday()?'track':'long_run')&&x.status==='scheduled'&&zdate(x.starts_at)===$('date').value);
  $('runSelect').innerHTML=`<option value="">Choose a published ${isThursday()?'track':'long run'} occurrence</option>`+choices.map((x)=>`<option value="${safe(x.id)}">${safe(x.title)} · ${safe(fmt(x.starts_at))}</option>`).join('');
  $('linkRun').disabled=!choices.length;
}
function management(){
  const existing=new Set(roster.map((r)=>r.athlete_id));
  const candidates=availableAthletes.filter((a)=>!existing.has(a.id));
  const selectable=daySessions.filter((s)=>existing.has(s.athlete_id));
  $('manage').innerHTML=`<div class="manage-grid"><label>ADD ATHLETE<select id="addAthlete"><option value="">Choose athlete</option>${candidates.map((a)=>`<option value="${safe(a.id)}">${safe(a.display_name)}</option>`).join('')}</select></label>${isThursday()?'<label>TRACK MODE<select id="addMode"><option value="paced">Own pace</option><option value="effort">Own effort</option></select></label>':''}<button id="subscribe" type="button">Subscribe</button></div>`
  + (isThursday()?`<p class="hint">Link one exact Thursday session per athlete and date. Changing this link does not erase a prior session.</p>${roster.map((r)=>`<div class="row"><span>${safe(r.name)}</span><label><select data-link="${safe(r.athlete_id)}"><option value="">Choose dated session</option>${selectable.filter((s)=>s.athlete_id===r.athlete_id).map((s)=>`<option value="${safe(s.id)}" ${s.id===r.session_id?'selected':''}>${safe(s.title)}</option>`).join('')}</select></label><button data-attach="${safe(r.athlete_id)}" type="button">Link</button></div>`).join('')}`:'');
}
async function loadDateSessions(){
  if(!isThursday()){daySessions=[];return;}
  const {data: sessions,error}=await sb.from('planned_sessions').select('id,athlete_id,state').eq('scheduled_on',$('date').value).eq('state','published');
  if(error)throw error;
  if(!sessions?.length){daySessions=[];return;}
  const {data:versions,error:vErr}=await sb.from('planned_session_versions').select('planned_session_id,title,version_number').in('planned_session_id',sessions.map((s)=>s.id)).order('version_number',{ascending:false});
  if(vErr)throw vErr;
  const latest=new Map();(versions||[]).forEach((v)=>{if(!latest.has(v.planned_session_id))latest.set(v.planned_session_id,v.title);});
  daySessions=sessions.map((s)=>({...s,title:latest.get(s.id)||'Session'}));
}
async function loadRuns(){
  const {data,error}=await sb.from('collective_runs_current').select('id,title,author_kind,kind,visibility,starts_at,status,meet_name,meet_address').eq('author_kind','form').order('starts_at',{ascending:false}).limit(150);
  if(!error)runs=data||[];
}
async function load(){
  say('Reading the published calendar…');prepared=null;$('publish').disabled=true;
  const date=$('date').value;
  [preview]=await Promise.all([rpc('form_miami_preview',{p_lane:lane,p_on_date:date}),loadDateSessions(),loadRuns()]);
  roster=preview.roster||[];
  $('practiceTitle').textContent=isThursday()?'FORM Thursday':'FORM Saturday';
  $('practiceIntro').textContent=isThursday()?'One shared workout structure. Individual speed targets remain personal.':'Everyone runs their assigned distance. No meetup unless one is posted.';
  $('sessionPane').hidden=!isThursday();
  $('revision').textContent=preview.publication?`REVISION ${preview.publication.revision}`:'FIRST PUBLICATION';
  const key=`${date}:${lane}:${preview.publication?.revision||0}`;
  if(isThursday()&&editorLoadedKey!==key){
    const source=preview.publication?.payload||roster.find((r)=>allowed(r)&&r.mode==='paced')||roster.find(allowed);
    fillEditor(source);editorLoadedKey=key;
  }
  rosterContent();meetingContent();management();say('Calendar ready.');
}
async function prime(){
  const access=await getAccessContext();if(!access.session||!access.coachMemberships.length){$('gate').hidden=false;$('work').hidden=true;return;}
  $('gate').hidden=true;$('work').hidden=false;
  const {data:athletes,error}=await sb.from('athletes').select('id,display_name,active').eq('active',true).order('display_name');
  if(!error) availableAthletes=athletes||[];
  await load();
}
$('signin').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);$('gateStatus').textContent='Signing in…';try{await signInWithPassword(f.get('email'),f.get('password'));await prime();}catch(err){$('gateStatus').textContent=authErrorMessage(err);}});
$('magic').addEventListener('click',async()=>{const f=new FormData($('signin'));try{await sendMagicLink(f.get('email'),'/coach/miami/');$('gateStatus').textContent='A sign-in link is on its way.';}catch(err){$('gateStatus').textContent=authErrorMessage(err);}});
document.querySelectorAll('[data-lane]').forEach((b)=>b.addEventListener('click',async()=>{lane=b.dataset.lane;document.querySelectorAll('[data-lane]').forEach((v)=>v.setAttribute('aria-pressed',String(v===b)));$('date').value=near(isThursday()?4:6);editorLoadedKey='';try{await load();}catch(e){say(e.message,true);}}));
$('date').value=near(4);
$('date').addEventListener('change',async()=>{editorLoadedKey='';try{await load();}catch(e){say(e.message,true);}});
$('workoutForm').addEventListener('input',()=>{prepared=null;$('publish').disabled=true;});
$('addSet').addEventListener('click',()=>{$('sets').insertAdjacentHTML('beforeend',setRow());prepared=null;$('publish').disabled=true;});
$('sets').addEventListener('click',(e)=>{if(e.target.closest('.remove')){e.target.closest('.set').remove();prepared=null;$('publish').disabled=true;}});
$('preview').addEventListener('click',async()=>{
  try{
    // Reload before signing the expected version set. A stale UI cannot publish.
    preview=await rpc('form_miami_preview',{p_lane:lane,p_on_date:$('date').value});roster=preview.roster||[];
    const payload=workoutPayload();const expected={};const names=[];
    roster.filter(allowed).forEach((r)=>{expected[r.session_id]=r.version_id;names.push(r.name);});
    if(!names.length)throw new Error('No editable linked Thursday sessions on this date.');
    prepared={payload,expected,date:$('date').value};$('publish').disabled=false;rosterContent();
    say(`Ready to update ${names.length} Weeks: ${names.join(', ')}. The individual paces that still fit each rep stay intact.`);
  }catch(err){prepared=null;$('publish').disabled=true;say(err.message,true);}
});
$('workoutForm').addEventListener('submit',async(e)=>{
  e.preventDefault();if(!prepared||prepared.date!==$('date').value)return;
  const count=Object.keys(prepared.expected).length;
  if(!confirm(`Publish this Thursday workout to ${count} athlete Weeks? Completed sessions and individual overrides remain untouched.`))return;
  $('publish').disabled=true;
  try{
    const out=await rpc('form_miami_publish_thursday',{p_on_date:prepared.date,p_payload:prepared.payload,p_expected:prepared.expected});
    editorLoadedKey='';await load();const mail=await dispatchEmails();say(`Published revision ${out.revision} to ${out.updated} athlete Weeks. ${mail}`);
  }catch(err){say(`Not published: ${err.message}`,true);}
});
$('manage').addEventListener('click',async(e)=>{
  const target=e.target.closest('button');if(!target)return;
  try{
    if(target.id==='subscribe'){
      const athlete=$('addAthlete').value;if(!athlete)throw new Error('Choose an athlete.');
      await rpc('form_miami_set_subscription',{p_athlete_id:athlete,p_lane:lane,p_enabled:true,p_mode:isThursday()?$('addMode').value:'effort'});
    }else if(target.dataset.attach){
      const id=target.dataset.attach,session=document.querySelector(`[data-link="${id}"]`)?.value;if(!session)throw new Error('Choose a specific published Thursday session.');
      await rpc('form_miami_set_link',{p_athlete_id:id,p_session_id:session});
    }else return;
    await load();say('Saved. The Week link is ready for the next shared publication.');
  }catch(err){say(err.message,true);}
});
$('linkRun').addEventListener('click',async()=>{
  const id=$('runSelect').value;const item=runs.find((r)=>r.id===id);if(!item)return;
  if(!confirm(`Link ${item.title} to FORM ${lane}? This will notify the subscribed athletes and expose the existing Who’s in RSVP.`))return;
  try{await rpc('form_miami_link_run',{p_lane:lane,p_on_date:$('date').value,p_run_id:id});await load();const mail=await dispatchEmails();say(`Run linked, RSVP available. ${mail}`);}catch(err){say(err.message,true);}
});
$('nudgeForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=new FormData(e.currentTarget),title=f.get('title').trim(),body=f.get('body').trim();
  if(!confirm(`Send “${title}” to ${roster.length} subscribed FORM ${lane} athletes?`))return;
  try{const count=await rpc('form_miami_nudge',{p_lane:lane,p_on_date:$('date').value,p_title:title,p_body:body,p_key:crypto.randomUUID()});e.currentTarget.reset();const mail=await dispatchEmails();say(`Message saved for ${count} athletes. ${mail}`);}catch(err){say(err.message,true);}
});
prime().catch((e)=>{$('gate').hidden=false;$('work').hidden=true;$('gateStatus').textContent=authErrorMessage(e);});
