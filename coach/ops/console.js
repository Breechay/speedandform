import { supabase } from '/private/supabase-client.js';
import { sendMagicLink, signInWithPassword } from '/private/auth.js';
import { AREAS, escapeHtml as e, safeUrl, sourceState, dateLabel, validateBoard, upcomingAppointments } from './model.mjs?v=1';
import { OPPORTUNITY_CATEGORIES, OPPORTUNITY_STATES, ATHLETIC_LIFE_IDEAS, validateOpportunityFeed, activeOpportunityCount, canApproveOpportunity, canStartOpportunity, opportunityEstimate } from './opportunity-model.mjs?v=1';
const $ = s => document.querySelector(s);
let board=null,user=null,tab='today',area='all',loading=false,authGeneration=0;
let opportunities={available:false,items:[],error:'Not checked'};
const requestedTab=new URLSearchParams(window.location.search).get('tab');
if(['today','runway','areas','opportunities','waiting','sources'].includes(requestedTab))tab=requestedTab;
const closed=i=>['done','cancelled'].includes(i.status);
const statusName=s=>({queued:'Ready',active:'In progress',waiting:'Waiting',done:'Done',cancelled:'Parked'}[s]||s);
const sourceName=s=>({live:'Live records',snapshot:'Checked snapshot',stale:'Check again',conflict:'Needs reconciliation',unavailable:'Unavailable',pending:'Pending',unchecked:'Not checked'}[s]||s);
const checked=v=>v ? new Date(v).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'Not checked';
function message(text,error=false){ $('#message').textContent=text;$('#message').classList.toggle('error',error); }
function refs(item){ return (item.source_refs||[]).map(r=>{ const u=r.url&&safeUrl(r.url);return u?`<a class="ref" href="${e(u)}" target="_blank" rel="noopener">${e(r.label||'Owning source')} ↗</a>`:`<span class="source-note">${e(r.label||r.record_id||'Source recorded')}</span>`; }).join(' '); }
function hat(item){const first=String(item.body||'').split('·')[0].trim();return /^(COACH|PRACTICE HOST|PRODUCT DIRECTOR|BUILDER \/ REVIEWER|CREATIVE DIRECTOR|COMMERCIAL LEAD|OPERATOR|STUDENT \/ ATHLETE)( \/ BUILDER)?$/.test(first)?first:'';}
function meta(item){const h=hat(item);return `<div class="metadata"><span>${e(AREAS[item.area]||item.area)}</span>${h?`<span class="pill focus">${e(h)}</span>`:''}<span class="pill ${item.status==='waiting'?'warning':''}">${e(statusName(item.status))}</span>${item.due_on?`<span>Due ${e(dateLabel(item.due_on))}</span>`:''}${item.actor!=='brice'?`<span>${item.actor==='agent'?'Agent queue':'Other owner'}</span>`:''}</div>`;}
function actions(item){ if(item.kind!=='task')return '';return `<div class="actions">${!closed(item)?`<button type="button" class="done" data-action="done" data-id="${e(item.id)}">Done</button>${item.status!=='waiting'&&item.actor==='brice'&&item.focus_on!==board?.today?`<button type="button" data-action="focus" data-id="${e(item.id)}">Today</button>`:''}`:''}<button type="button" data-action="edit" data-id="${e(item.id)}">Edit</button></div>`;}
function itemMarkup(item){ const stale=item.expires_at&&Date.parse(item.expires_at)<=Date.now();return `<article class="item">${meta(item)}<h3 style="margin-top:10px">${e(item.title)}</h3>${item.body?`<p>${e(item.body)}</p>`:''}${item.next_action?`<p class="owner-note">${e(item.next_action)}</p>`:''}${item.waiting_on&&item.status==='waiting'?`<p class="small">Waiting on ${e(item.waiting_on)}${item.review_on?` · Review ${e(dateLabel(item.review_on))}`:''}</p>`:''}${item.observed_at?`<p class="small">${stale?'Older snapshot. Recheck before acting. ':''}Source checked ${e(checked(item.observed_at))}.</p>`:''}${refs(item)}${actions(item)}</article>`;}
function athleteName(id){return board.athletes.find(a=>a.id===id)?.first_name||'Athlete';}
function appointmentMarkup(a){let when='Time pending';if(a.time_local){const [h,m]=a.time_local.split(':').map(Number);when=`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}return `<div class="appointment"><time>${e(dateLabel(a.scheduled_on,{weekday:'short',month:'short',day:'numeric'}))} · ${e(when)}</time><b>${e(a.title)}</b>${a.note?`<p class="small">${e(a.note)}</p>`:''}<p class="small">${a.source==='google'?'Calendar projection':'Coach agreement'}${a.status==='tentative'?' · Exact time not booked':''}</p></div>`;}
function coachTask(t){return `<article class="item"><div class="metadata"><span>${e(athleteName(t.athlete_id))}</span><span class="pill warning">${e(t.state.replaceAll('_',' '))}</span>${t.due_on?`<span>Review ${e(dateLabel(t.due_on))}</span>`:''}</div><h3 style="margin-top:10px">${e(t.title)}</h3><p>${e(t.summary)}</p>${t.waiting_on?`<p class="small">Waiting on ${e(t.waiting_on)}</p>`:''}<a class="ref" href="/coach/labs/">Open the coaching record ↗</a></article>`;}
function todayView(){
  const priorities=board.priorities;
  const calendar=board.sources.find(s=>s.source_key==='calendar');
  const upcoming=upcomingAppointments(board.appointments,board.today,board.read_at);
  const personal=board.items.filter(i=>i.kind==='context'&&i.area==='training'&&!closed(i));
  const agents=board.items.filter(i=>i.kind==='task'&&i.actor==='agent'&&!closed(i));
  return `<div class="layout"><div><div class="section-head"><h2>The moves that matter</h2><span class="small">At most four</span></div><div>${priorities.length?priorities.map((i,n)=>`<article class="priority"><span class="ordinal">0${n+1}</span><div>${meta(i)}<h3 style="margin-top:10px">${e(i.title)}</h3><p class="finish">${e(i.next_action||i.body)}</p>${i.focus_on&&i.focus_on<board.today?`<p class="small">Carried from ${e(dateLabel(i.focus_on))}. Keep, finish or park it.</p>`:''}${actions(i)}</div></article>`).join(''):'<p class="empty">No priorities have been selected for this day. Choose Today on an open task, or add one below. Nothing is invented to fill the space.</p>'}</div>${agents.length?`<details class="changes"><summary>Agent queue · ${agents.length} open</summary><p class="small">Saved work for the next authorized agent session. This list does not itself run background jobs.</p>${agents.map(itemMarkup).join('')}</details>`:''}</div><aside><section class="side-panel"><div class="section-head"><h2>Next commitments</h2></div>${upcoming.length?upcoming.map(appointmentMarkup).join(''):'<p class="empty">No appointment projection is available for this window. Check Calendar rather than assuming you are free.</p>'}<p class="source-note">${calendar?`Calendar checked ${e(checked(calendar.observed_at))}. ${sourceState(calendar)==='stale'?'This copy needs refreshing.':''}`:'Calendar has not been checked.'} This is a saved projection, not a live free/busy check.</p><a class="ref" href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener">Open Calendar ↗</a></section>${personal.length?`<section class="side-panel"><h2 style="margin-bottom:18px">My training</h2>${personal.map(itemMarkup).join('')}</section>`:''}<section class="side-panel"><h2>Not another list to finish</h2><p class="small">Waiting stays out of your top four. The rest of life stays visible in All areas. Done means the action happened, not that its calendar slot passed.</p></section></aside></div>`;
}
function areasView(){
  const selected=area==='all'?Object.keys(AREAS):[area];
  return `<div class="area-tabs"><button type="button" data-area="all" class="${area==='all'?'active':''}">All</button>${Object.entries(AREAS).map(([k,v])=>`<button type="button" data-area="${k}" class="${area===k?'active':''}">${e(v)}</button>`).join('')}</div><div class="area-grid">${selected.map(k=>{const items=board.items.filter(i=>i.area===k&&!closed(i));return `<section class="panel ${selected.length===1?'wide':''}"><h2 style="margin-bottom:25px">${e(AREAS[k])}</h2>${items.length?items.map(itemMarkup).join(''):'<p class="empty">No open operating items recorded.</p>'}${k==='coaching'?coachingView():''}</section>`;}).join('')}</div><details class="changes"><summary>Recently closed</summary>${board.items.filter(closed).slice().sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,12).map(itemMarkup).join('')||'<p class="empty">No closed items recorded yet.</p>'}</details>`;
}
function coachingView(){return `<h3 class="split-label">Current coach decisions · live FORM records</h3>${board.decisions.map(d=>`<article class="decision"><div class="metadata"><b>${e(athleteName(d.athlete_id))}</b><span>Effective ${e(dateLabel(d.effective_on))}</span><span>${d.delivery_state==='delivered_externally'?'Delivered directly':'Published'}</span></div><p>${e(d.athlete_text)}</p></article>`).join('')||'<p class="empty">No current published decisions returned. This does not mean no assignment exists.</p>'}${board.coach_tasks.length?`<h3 class="split-label">Open coaching gates</h3>${board.coach_tasks.map(coachTask).join('')}`:''}${board.coach_todos.length?`<h3 class="split-label">Dossier to-dos</h3>${board.coach_todos.map(t=>`<div class="item"><b>${e(athleteName(t.athlete_id))}</b><p>${e(t.body)}</p>${t.due_on?`<p class="small">Due ${e(dateLabel(t.due_on))}</p>`:''}</div>`).join('')}`:''}<a class="ref" href="/coach/labs/">Open athlete dossiers ↗</a><p class="source-note">These are existing FORM records, not copied plans. Appointment timing is separate from prescribed work. A new decision does not rewrite completed evidence.</p>`;}

function monday(value){
  const d=new Date(value+'T12:00:00-04:00'), day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day);
  return d;
}
function isoDay(d){return d.toLocaleDateString('en-CA',{timeZone:'America/New_York'});}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00:00-04:00')-new Date(a+'T12:00:00-04:00'))/86400000);}
function horizonState(block){
  if(!block?.ends_on)return {label:'Term not dated',className:'warning'};
  const n=daysBetween(board.today,block.ends_on);
  if(n<0)return {label:'Needs closeout',className:'warning'};
  if(n<=7)return {label:'This week',className:'warning'};
  if(n<=21)return {label:'Ending soon',className:'warning'};
  return {label:'Active',className:''};
}
function runwayView(){
  const start=monday(board.today), weeks=Array.from({length:12},(_,i)=>{const s=addDays(start,i*7),e=addDays(s,6);return {start:isoDay(s),end:isoDay(e),label:s.toLocaleDateString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'})};});
  const tasks=board.items.filter(i=>i.kind==='task'&&!closed(i));
  const dated=tasks.filter(i=>i.due_on||i.review_on||i.focus_on);
  const backlog=tasks.filter(i=>!i.due_on&&!i.review_on&&!i.focus_on).slice().sort((a,b)=>a.priority-b.priority).slice(0,12);
  const cell=(w)=>dated.filter(i=>{const d=i.due_on||i.review_on||i.focus_on;return d>=w.start&&d<=w.end;}).slice(0,6).map(i=>`<button type="button" class="runway-card" data-action="edit" data-id="${e(i.id)}"><span>${e(hat(i)||AREAS[i.area]||i.area)}</span><b>${e(i.title)}</b><small>${i.due_on?'Due ':i.review_on?'Review ':'Focus '}${e(dateLabel(i.due_on||i.review_on||i.focus_on))}</small></button>`).join('');
  const blocks=board.athlete_blocks||[];
  return `<section class="runway-intro"><div><p class="eyebrow">Company runway</p><h2>See the next 12 weeks.</h2><p>Dates come from the operating workspace. Athlete horizons come live from FORM. Scroll sideways like a training plan; click an operating card to edit its next step.</p></div><div class="hat-key"><span>COACH</span><span>PRACTICE HOST</span><span>PRODUCT DIRECTOR</span><span>BUILDER / REVIEWER</span><span>CREATIVE DIRECTOR</span><span>COMMERCIAL LEAD</span><span>OPERATOR</span><span>STUDENT / ATHLETE</span></div></section>
  <div class="runway-scroll" tabindex="0" aria-label="Twelve week company runway"><div class="runway-grid">${weeks.map(w=>`<section class="runway-week"><header><b>WEEK OF</b><span>${e(w.label)}</span></header>${cell(w)||'<p class="empty-mini">Open capacity</p>'}</section>`).join('')}</div></div>
  <div class="runway-split"><section class="panel"><div class="section-head"><h2>Athlete horizons</h2><span class="small">Review at 21 days</span></div>${blocks.length?blocks.map(b=>{const s=horizonState(b);return `<article class="horizon"><div><b>${e(b.first_name||'Athlete')}</b><span class="pill ${s.className}">${e(s.label)}</span></div><p>${e(b.name||'No dated active block')}${b.current_week&&b.total_weeks?` · Week ${e(b.current_week)} of ${e(b.total_weeks)}`:''}</p><small>${b.ends_on?`Ends ${e(dateLabel(b.ends_on,{month:'short',day:'numeric',year:'numeric'}))}`:'No block end date in FORM'}${b.race_on?` · Race ${e(dateLabel(b.race_on))}`:''}</small></article>`;}).join(''):'<p class="empty">No athlete horizon projection returned.</p>'}</section>
  <section class="panel"><div class="section-head"><h2>Undated work</h2><span class="small">Backlog, not today</span></div>${backlog.length?backlog.map(itemMarkup).join(''):'<p class="empty">No undated operating work.</p>'}</section></div>`;
}
function waitingView(){const items=board.items.filter(i=>i.status==='waiting');const tasks=board.coach_tasks.filter(t=>t.state.startsWith('waiting'));return `<div class="layout"><section><div class="section-head"><h2>Someone or something else moves next</h2></div>${items.map(itemMarkup).join('')}${tasks.map(coachTask).join('')}${!items.length&&!tasks.length?'<p class="empty">No waiting items recorded.</p>':''}</section><aside class="side-panel"><h2>Keep the next question small</h2><p>Name who you are waiting for, what they need to supply and when you will check again. A time-pending agreement is not a confirmed clock-time appointment.</p></aside></div>`;}
function sourcesView(){return `<p class="intro" style="margin:26px 0">Know what is live, what was checked and what is still unresolved.</p><div class="source-list">${board.sources.map(s=>{const st=sourceState(s);return `<article class="source"><div><h3>${e(s.label)}</h3><span class="pill ${['stale','conflict','unavailable','pending','unchecked'].includes(st)?'warning':''}">${e(sourceName(st))}</span></div><div><p><b>Owns:</b> ${e(s.authority)}</p><p>${e(s.detail)}</p><p class="small">Checked ${e(checked(s.observed_at))}.${s.source_as_of?` Source data through ${e(checked(s.source_as_of))}.`:' Source data-as-of is not supplied.'}</p><p class="locator">${e(s.locator)}</p></div></article>`;}).join('')}</div><section class="panel"><h2>The write-through rule</h2><p>Change the owning record first. Read it back. Record the receipt here. The brief reads this same workspace, plus fresh evidence from its original connectors. A link or a saved note never proves every destination synchronized.</p><p class="source-note">FORM decisions and coaching tasks are read live. Calendar, Finances, GitHub, Gmail and wearable checks are refreshed by authorized connector work, not by this browser's Refresh button. No bank token, private record or service-role key is embedded in this site.</p></section><details class="changes"><summary>Recent saved changes</summary><ul>${board.changes.map(c=>`<li>${e(c.title||c.label||'Operating record')} · ${e(c.status?statusName(c.status):c.operation.toLowerCase())}<br><span class="small">${e(checked(c.changed_at))} · revision ${e(c.revision||'1')}</span></li>`).join('')}</ul></details>`;}
function opportunityCard(o){
  const task=board.items.find(i=>i.item_key===`athletic-life-${o.id}`);
  const links=(Array.isArray(o.source_refs)?o.source_refs:[]).filter(ref=>ref&&typeof ref==='object').map(ref=>{const url=ref.url&&safeUrl(ref.url);return url?`<a class="ref" href="${e(url)}" target="_blank" rel="noopener">${e(ref.label||'Evidence')} ↗</a>`:`<span class="source-note">${e(ref.label||'Source recorded')}</span>`;}).join(' ');
  const canApprove=canApproveOpportunity(o);
  const canStart=canStartOpportunity(o,opportunities.items);
  return `<article class="opportunity">
    <div class="metadata"><span>${e(OPPORTUNITY_CATEGORIES[o.category]||o.category)}</span><span class="pill ${o.status==='active'?'focus':''}">${e(OPPORTUNITY_STATES[o.status]||o.status)}</span>${o.idea_number?`<span>Idea ${e(o.idea_number)}</span>`:''}${o.review_on?`<span>Review ${e(dateLabel(o.review_on))}</span>`:''}</div>
    <h3>${e(o.title)}</h3><p>${e(o.hypothesis)}</p>
    ${o.next_test?`<p class="owner-note"><b>Smallest test</b> ${e(o.next_test)}</p>`:''}
    <div class="opportunity-facts"><span>${e(opportunityEstimate(o))}</span>${o.beneficiary_note?`<span>${e(o.beneficiary_note)}</span>`:''}</div>
    ${o.approved_at?`<p class="small">Owner approval recorded ${e(checked(o.approved_at))}. Scope: ${e(o.approval_note)}. This does not send, book, spend or publish.</p>`:''}
    ${o.evidence?`<p><b>Observed:</b> ${e(o.evidence)}</p>`:''}${o.learning?`<p><b>Learned:</b> ${e(o.learning)}</p>`:''}${links}
    <div class="actions">
      <button type="button" data-op-action="edit" data-op-id="${e(o.id)}">Edit record</button>
      ${o.status==='candidate'?`<button type="button" data-op-action="approve" data-op-id="${e(o.id)}" ${canApprove?'':'disabled'} title="Complete scope, hours, costs and approval note first">Approve small test</button>`:''}
      ${o.status==='ready'?`<button type="button" data-op-action="start" data-op-id="${e(o.id)}" ${canStart?'':'disabled'}>Start experiment</button>`:''}
      ${o.status==='active'?`<button type="button" data-op-action="complete" data-op-id="${e(o.id)}">Close with learning</button>`:''}
      ${!['completed','parked'].includes(o.status)?`<button type="button" data-op-action="park" data-op-id="${e(o.id)}">Park</button>`:''}
      ${o.status==='parked'?`<button type="button" data-op-action="reopen" data-op-id="${e(o.id)}">Reopen candidate</button>`:''}
      ${!task&&o.status!=='completed'?`<button type="button" data-op-action="task" data-op-id="${e(o.id)}">Create next action</button>`:task?'<span class="small">Linked to the operating action list</span>':''}
    </div>
  </article>`;
}
function opportunitiesView(){
  if(!opportunities.available)return `<div class="layout"><section><h2>Opportunity register unavailable.</h2><p class="intro">${e(opportunities.error)} The rest of the operating workspace still works. No ideas or decisions have been changed.</p></section></div>`;
  const count=activeOpportunityCount(opportunities.items),items=opportunities.items;
  return `<section class="opportunity-intro"><div><h2>Make one thing possible.</h2><p>Capture a possibility, define the smallest real test, estimate the cost, then decide whether it earns time. The register holds decisions; Collective, Archive, FORM, Calendar and communications remain the owners of actual events and records.</p></div><div class="opportunity-capacity"><strong>${count} / 2</strong><span>Active experiments</span></div></section>
    <details class="capture opportunity-capture"><summary>Capture a possibility</summary><form id="opportunity-capture-form">
      <label>Start from the 20 ideas (optional)<select name="idea_number"><option value="">New idea</option>${ATHLETIC_LIFE_IDEAS.map(([title],i)=>`<option value="${i+1}">${String(i+1).padStart(2,'0')} · ${e(title)}</option>`).join('')}</select></label>
      <label>Name it<input name="title" maxlength="240" required placeholder="The specific opportunity"></label>
      <div class="form-grid"><label>Kind<select name="category">${Object.entries(OPPORTUNITY_CATEGORIES).map(([k,v])=>`<option value="${k}">${e(v)}</option>`).join('')}</select></label><label>Review on<input name="review_on" type="date"></label></div>
      <label>What might this make possible?<textarea name="hypothesis" maxlength="4000" rows="3" required placeholder="Who might benefit, and what would change?"></textarea></label>
      <label>First small test<textarea name="next_test" maxlength="3000" rows="2" placeholder="A concrete conversation, invitation, session, or artifact to validate"></textarea></label>
      <p class="small">Saved privately as a candidate. Capturing this does not authorize contact, spending, athlete changes or publication.</p><button type="submit" class="primary">Save candidate</button>
    </form></details>
    <div class="opportunity-list">${items.length?items.map(opportunityCard).join(''):'<p class="empty">No opportunities have been recorded. The 20 ideas are starting points, not automatically active projects.</p>'}</div>
    <p class="source-note">Before real-world action, verify interest and permission, confirm who owns logistics and costs, and create or update the actual record in its owning system. Keep the evidence and the next decision here.</p>`;
}
function render(){
  if(!board)return;
  $('#gate').hidden=true;$('#workspace').hidden=false;$('#refresh').hidden=false;$('#signout').hidden=false;
  $('#date').textContent=dateLabel(board.today,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  $('#page-title').textContent={today:'Today.',runway:'Runway.',areas:'Everything has a place.',waiting:'Waiting.',sources:'What is current?',opportunities:'Opportunities.'}[tab];
  $('#freshness').textContent=`Workspace read ${checked(board.read_at)} ET`;
  $('#waiting-count').textContent=board.items.filter(i=>i.status==='waiting').length+board.coach_tasks.filter(t=>t.state.startsWith('waiting')).length;
  $('#source-count').textContent=board.sources.filter(s=>['stale','conflict','unavailable','pending','unchecked'].includes(sourceState(s))).length||'';
  $('[data-tab][aria-current]')?.removeAttribute('aria-current');$(`[data-tab="${tab}"]`).setAttribute('aria-current','page');
  $('#view').innerHTML=({today:todayView,runway:runwayView,areas:areasView,waiting:waitingView,sources:sourcesView,opportunities:opportunitiesView}[tab])();
  $('.capture:not(.opportunity-capture)')?.toggleAttribute('hidden',tab==='opportunities');
}
async function refresh(){
  if(loading||!user)return;loading=true;$('#refresh').disabled=true;
  const generation=authGeneration;
  try{
    const [operating,opportunity]=await Promise.all([supabase.rpc('operating_console_read',{}),supabase.rpc('athletic_opportunities_read',{})]);
    if(operating.error)throw operating.error;if(generation!==authGeneration)return;
    board=validateBoard(operating.data);
    try {if(opportunity.error)throw opportunity.error;const valid=validateOpportunityFeed(opportunity.data);opportunities={available:true,items:valid.items,error:''};}
    catch {opportunities={available:false,items:[],error:'The private register is not installed or could not be read. Check the database release and coach permissions.'};}
    render();message('');return true;
  }
  catch(err){if(generation!==authGeneration)return;if(!board){$('#gate').hidden=false;$('#workspace').hidden=true;$('#signout').hidden=false;$('#gate-message').textContent='This account could not open the private operating workspace. Use the authorized coach account, or retry if the connection is unavailable.';}else{message('Refresh failed. The last successfully loaded workspace is still shown. Its source timestamps have not changed.',true);}}
  finally{if(generation===authGeneration){loading=false;$('#refresh').disabled=false;}else if(user){loading=false;queueMicrotask(refresh);}}
}
async function sessionChanged(session){
  const next=session?.user||null;
  if(next?.id===user?.id){if(next&&!board&&!loading)await refresh();return;}
  authGeneration++;user=next;board=null;opportunities={available:false,items:[],error:'Not checked'};$('#editor').close();$('#opportunity-editor').close();$('#edit-form').reset();$('#capture-form').reset();message('');$('#view').replaceChildren();$('#workspace').hidden=true;
  $('#gate').hidden=false;$('#refresh').hidden=true;$('#signout').hidden=!user;
  $('#gate-message').textContent=user?'Opening your private workspace.':'Sign in with your existing coach account.';
  if(user&&!loading)await refresh();
}
async function saveItem(item,patch){const {data,error}=await supabase.from('operating_items').update(patch).eq('id',item.id).eq('revision',item.revision).select('id,revision').maybeSingle();if(error)throw error;if(!data)throw new Error('This record changed elsewhere. Refresh and review it before saving again.');const reread=await refresh();if(!reread)throw new Error('Saved on the server, but the workspace could not reload. Refresh before making another change.');return data;}
async function saveOpportunity(item,patch){
  const {data,error}=await supabase.from('athletic_opportunities').update(patch).eq('id',item.id).eq('revision',item.revision).select('id,revision').maybeSingle();
  if(error)throw error;if(!data)throw new Error('This opportunity changed elsewhere. Refresh and review it.');
  const reread=await refresh();
  if(!reread||!opportunities.available||!opportunities.items.some(o=>o.id===data.id&&o.revision===data.revision))
    throw new Error('Saved, but the private opportunity readback did not confirm the new version. Refresh before acting again.');
  return data;
}
function openOpportunityEditor(o){
  const f=$('#opportunity-edit-form');
  for(const key of ['id','revision','title','category','hypothesis','next_test','beneficiary_note','next_action','approval_note','estimated_hours','estimated_cost_usd','review_on','evidence','learning'])f.elements[key].value=o[key]??'';
  f.elements['source_url'].value='';$('#opportunity-edit-message').textContent='';$('#opportunity-editor').showModal();
}
async function opportunityAction(button){
  if(!opportunities.available||!user)return;
  const o=opportunities.items.find(item=>item.id===button.dataset.opId);if(!o)return;
  const action=button.dataset.opAction;
  if(action==='edit'){openOpportunityEditor(o);return;}
  button.disabled=true;
  try{
    if(action==='task'){
      if(board.items.some(i=>i.item_key===`athletic-life-${o.id}`))throw new Error('An operating task already links to this opportunity.');
      const {data,error}=await supabase.from('operating_items').insert({owner_id:user.id,item_key:`athletic-life-${o.id}`,kind:'task',area:'form',actor:'brice',title:`Advance: ${o.title}`.slice(0,240),next_action:o.next_action||o.next_test||'Define the next specific action',source_refs:[{label:'Athletic Life opportunity',record_id:o.id,url:'/coach/ops/?tab=opportunities'}]}).select('id').single();
      if(error)throw error;if(!data)throw new Error('Operating action save not confirmed.');
      if(!await refresh())throw new Error('Operating task saved, but console readback failed. Refresh before retrying.');
      message('Next action saved to the existing operating list. It was not scheduled or performed.');return;
    }
    let patch;
    if(action==='approve'){
      if(!canApproveOpportunity(o))throw new Error('Edit the test, time, direct cost and approval scope first.');
      patch={status:'ready',approved_by:user.id,approved_at:new Date().toISOString()};
    }else if(action==='start'){
      if(!canStartOpportunity(o,opportunities.items))throw new Error('Start requires owner approval and a free experiment slot.');
      patch={status:'active'};
    }else if(action==='complete'){
      if(o.status!=='active')throw new Error('Only a running experiment can be closed as reviewed.');
      if(!o.evidence.trim()||!o.learning.trim()){openOpportunityEditor(o);throw new Error('Record what happened and what you learned, then close the experiment.');}
      patch={status:'completed'};
    }else if(action==='park'){
      if(['completed','parked'].includes(o.status))throw new Error('This is already closed.');
      patch={status:'parked'};
    }else if(action==='reopen'){
      if(o.status!=='parked')throw new Error('Only a parked candidate can reopen.');
      patch={status:'candidate',approved_at:null,approved_by:null};
    }else return;
    await saveOpportunity(o,patch);
    message({approve:'Small test approved. External commitments require their own confirmation.',start:'Experiment started. Nothing external has been sent, booked or published.',complete:'Closed with evidence and learning.',park:'Opportunity parked. Its history is preserved.',reopen:'Reopened as an unapproved candidate.'}[action]);
  }catch(err){message(err.message||'Opportunity not changed.',true);button.disabled=false;}
}
$('#view').addEventListener('click',async event=>{
  const opportunityButton=event.target.closest('button[data-op-action]');if(opportunityButton){await opportunityAction(opportunityButton);return;}
  const areaButton=event.target.closest('[data-area]');if(areaButton){area=areaButton.dataset.area;render();return;}
  const button=event.target.closest('button[data-action]');if(!button||!board)return;
  const item=board.items.find(i=>i.id===button.dataset.id);if(!item)return;
  if(button.dataset.action==='edit'){const f=$('#edit-form');for(const key of ['id','revision','title','next_action','body','status','priority','due_on','waiting_on','review_on','area','actor','focus_on'])f.elements[key].value=item[key]??'';$('#edit-message').textContent='';$('#editor').showModal();return;}
  button.disabled=true;
  try{const patch=button.dataset.action==='done'?{status:'done'}:{focus_on:board.today};await saveItem(item,patch);message(button.dataset.action==='done'?'Saved as done. No appointment, payment or prescription was changed.':'Selected for today. The first four ready items are shown.');}catch(err){message(err.message||'Not saved. Please retry.',true);button.disabled=false;}
});
$('#view').addEventListener('change',ev=>{
  const select=ev.target.closest('#opportunity-capture-form select[name="idea_number"]');if(!select)return;
  const selected=Number(select.value),idea=ATHLETIC_LIFE_IDEAS[selected-1];if(!idea)return;
  const f=select.form;f.elements['title'].value=idea[0];f.elements['category'].value=idea[1];
});
$('#view').addEventListener('submit',async ev=>{
  if(ev.target.id!=='opportunity-capture-form')return;ev.preventDefault();
  if(!user||!opportunities.available)return;
  const f=ev.target,b=f.querySelector('[type=submit]');b.disabled=true;
  try{
    const input={owner_id:user.id,title:f.elements['title'].value.trim(),category:f.elements['category'].value,hypothesis:f.elements['hypothesis'].value.trim(),next_test:f.elements['next_test'].value.trim(),idea_number:f.elements['idea_number'].value?Number(f.elements['idea_number'].value):null,review_on:f.elements['review_on'].value||null};
    if(!input.title||!input.hypothesis)throw new Error('Name the possibility and what it might make possible.');
    const {data,error}=await supabase.from('athletic_opportunities').insert(input).select('id,revision').single();
    if(error)throw error;if(!data)throw new Error('Save not confirmed.');
    if(!await refresh()||!opportunities.items.some(o=>o.id===data.id))throw new Error('Saved, but the register readback failed. Refresh before making another copy.');
    message('Candidate saved privately. Nothing is approved or scheduled.');
  }catch(err){message(err.message||'Candidate not saved.',true);b.disabled=false;}
});
$('.tabs').addEventListener('click',ev=>{const b=ev.target.closest('[data-tab]');if(!b)return;tab=b.dataset.tab;render();});
$('#refresh').addEventListener('click',refresh);
$('#signout').addEventListener('click',async()=>{const {error}=await supabase.auth.signOut();if(error){message('Sign-out failed. Please retry.',true);return;}await sessionChanged(null);});
$('#signin-form').addEventListener('submit',async ev=>{ev.preventDefault();const form=ev.target;const b=form.querySelector('[type=submit]');b.disabled=true;try{if(!form.elements['password'].value)throw new Error('Enter your password, or choose a sign-in link.');await signInWithPassword(form.elements['email'].value,form.elements['password'].value);form.elements['password'].value='';}catch(err){$('#gate-message').textContent=err.message||'Sign-in failed.';}finally{b.disabled=false;}});
$('#magic').addEventListener('click',async()=>{const f=$('#signin-form');if(!f.elements['email'].reportValidity())return;$('#magic').disabled=true;try{await sendMagicLink(f.elements['email'].value,'/coach/ops/');$('#gate-message').textContent='Sign-in link requested. Open it in this browser to return here.';}catch(err){$('#gate-message').textContent=err.message||'Could not request a link.';}finally{$('#magic').disabled=false;}});
$('#capture-form').addEventListener('submit',async ev=>{ev.preventDefault();if(!user||!board)return;const f=ev.target,b=f.querySelector('[type=submit]');b.disabled=true;try{const title=f.elements['title'].value.trim();if(!title)throw new Error('Give the task a concrete title.');const {data,error}=await supabase.from('operating_items').insert({owner_id:user.id,item_key:`capture-${crypto.randomUUID()}`,kind:'task',area:f.elements['area'].value,title,next_action:f.elements['next_action'].value.trim(),actor:f.elements['actor'].value,due_on:f.elements['due_on'].value||null,focus_on:f.elements['focus'].checked?board.today:null,source_refs:[{label:'Owner entered in console'}]}).select('id,revision').single();if(error)throw error;if(!data)throw new Error('Save was not confirmed.');f.reset();const reread=await refresh();message(reread?'Saved to the shared operating workspace.':'Saved on the server. Workspace reload failed; refresh before adding another copy.',!reread);}catch(err){message(err.message||'Not saved.',true);}finally{b.disabled=false;}});
$('#close-editor').addEventListener('click',()=>$('#editor').close());
$('#close-opportunity-editor').addEventListener('click',()=>$('#opportunity-editor').close());
$('#opportunity-edit-form').addEventListener('submit',async ev=>{
  ev.preventDefault();const f=ev.target,b=f.querySelector('[type=submit]');
  const o=opportunities.items.find(item=>item.id===f.elements['id'].value);if(!o)return;
  b.disabled=true;
  try{
    const patch={title:f.elements['title'].value.trim(),category:f.elements['category'].value,hypothesis:f.elements['hypothesis'].value.trim(),next_test:f.elements['next_test'].value.trim(),beneficiary_note:f.elements['beneficiary_note'].value.trim(),next_action:f.elements['next_action'].value.trim(),approval_note:f.elements['approval_note'].value.trim(),estimated_hours:f.elements['estimated_hours'].value===''?null:Number(f.elements['estimated_hours'].value),estimated_cost_usd:f.elements['estimated_cost_usd'].value===''?null:Number(f.elements['estimated_cost_usd'].value),review_on:f.elements['review_on'].value||null,evidence:f.elements['evidence'].value.trim(),learning:f.elements['learning'].value.trim()};
    if(!patch.title||!patch.hypothesis)throw new Error('Name the opportunity and its hypothesis.');
    const changed=['title','category','hypothesis','next_test','beneficiary_note','estimated_hours','estimated_cost_usd','approval_note'].some(k=>patch[k]!==o[k]&&!(typeof patch[k]==='number'&&o[k]!==null&&patch[k]===Number(o[k])));
    if(changed&&o.status==='active')throw new Error('Park the active test and record its outcome before changing the approved scope.');
    if(changed&&o.approved_at){patch.status='candidate';patch.approved_at=null;patch.approved_by=null;}
    const source=f.elements['source_url'].value.trim();if(source){const url=safeUrl(source);if(!url)throw new Error('Use a valid http or https source URL.');patch.source_refs=[...(o.source_refs||[]),{label:'Added source',url}];}
    await saveOpportunity({...o,revision:Number(f.elements['revision'].value)},patch);
    $('#opportunity-editor').close();message(changed&&o.approved_at?'Scope saved as a candidate. A new approval is required.':'Opportunity saved and read back.');
  }catch(err){$('#opportunity-edit-message').textContent=err.message||'Not saved.';}
  finally{b.disabled=false;}
});
$('#edit-form').addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.target,b=f.querySelector('[type=submit]');const item=board?.items.find(i=>i.id===f.elements['id'].value);if(!item)return;b.disabled=true;try{const patch={area:f.elements['area'].value,actor:f.elements['actor'].value,focus_on:f.elements['focus_on'].value||null,title:f.elements['title'].value.trim(),next_action:f.elements['next_action'].value.trim(),body:f.elements['body'].value.trim(),status:f.elements['status'].value,priority:Number(f.elements['priority'].value),due_on:f.elements['due_on'].value||null,waiting_on:f.elements['waiting_on'].value.trim()||null,review_on:f.elements['review_on'].value||null};if(!patch.title)throw new Error('Title is required.');if(patch.status==='waiting'&&!patch.waiting_on)throw new Error('Name who or what you are waiting on.');await saveItem({...item,revision:Number(f.elements['revision'].value)},patch);$('#editor').close();message('Changes saved and read back.');}catch(err){$('#edit-message').textContent=err.message||'Not saved.';}finally{b.disabled=false;}});
supabase.auth.onAuthStateChange((_event,session)=>queueMicrotask(()=>sessionChanged(session)));
const initial=await supabase.auth.getSession();
await sessionChanged(initial.data?.session||null);
if(!user)$('#gate-message').textContent='Sign in with your existing coach account.';
