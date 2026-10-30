import { supabase } from '/private/supabase-client.js';
import { sendMagicLink, signInWithPassword } from '/private/auth.js';
import { EDITABLE_FIELDS,normalizePayload,validatePayload,validateWorkbench,escapeHtml as e,safeHttps } from './workbench-model.mjs?v=1';

const $=selector=>document.querySelector(selector);
const form=$('#race-form');
let user=null,feed=null,selected=null,authGeneration=0,busy=false;

function showMessage(value,error=false){$('#message').textContent=value;$('#message').classList.toggle('error',error);}
function gateMessage(value){$('#gate-message').textContent=value;}
function formValues(){
  const values={};
  for(const field of EDITABLE_FIELDS)values[field]=field==='cover_rights_confirmed'
    ?form.elements[field].checked:form.elements[field].value;
  return normalizePayload(values);
}
function setForm(values){
  const v=normalizePayload(values);
  for(const field of EDITABLE_FIELDS){
    if(field==='cover_rights_confirmed')form.elements[field].checked=v[field];
    else form.elements[field].value=v[field]??'';
  }
  form.elements.cover_file.value='';
  updatePreview();
}
function formatDate(value){
  if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Date pending';
  const date=new Date(`${value}T12:00:00Z`);
  return date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
}
function updatePreview(){
  if(!selected)return;
  const d=formValues(),root=$('#preview');
  const cover=safeHttps(d.cover_image_url);
  const official=safeHttps(d.official_url);
  const course=[['Full',d.full_course],['Half',d.half_course]].filter(([,v])=>v);
  const when=d.starts_on===d.ends_on?formatDate(d.starts_on):`${formatDate(d.starts_on)} to ${formatDate(d.ends_on)}`;
  root.innerHTML=`${cover?`<img class="cover" src="${e(cover)}" alt="${e(d.cover_image_alt||'Race cover')}" loading="lazy">`:''}
    <p class="folio">${e(when)}${d.city?' · '+e(d.city):''}</p>
    <h3>${e(d.name||'Race title')}</h3>
    <div class="race-facts"><p class="mini-label">RACE DAY</p>${d.start_time?`<p>${e(d.start_time)}</p>`:''}${d.start_address?`<p>${e(d.start_address)}</p>`:''}${!d.start_time&&!d.start_address?'<p>Details pending confirmation.</p>':''}</div>
    ${official?`<a class="official" href="${e(official)}" target="_blank" rel="noopener"><span>OFFICIAL RACE WEBSITE</span><span aria-hidden="true">↗</span></a>`:''}
    ${d.brief?`<p class="copy">${e(d.brief)}</p>`:''}
    ${d.course_overview||course.length?`<div class="course"><p class="mini-label">THE COURSE</p>${d.course_overview?`<p>${e(d.course_overview)}</p>`:''}${course.map(([label,v])=>`<p><strong>${e(label)}:</strong> ${e(v)}</p>`).join('')}</div>`:''}`;
  root.querySelector('img.cover')?.addEventListener('error',event=>event.currentTarget.remove(),{once:true});
  const dirty=selected&&JSON.stringify(formValues())!==JSON.stringify(normalizePayload(selected.draft||selected.published));
  $('#save').disabled=busy||!dirty;
  $('#publish').disabled=busy||dirty||!selected.draft_revision;
  $('#draft-state').textContent=dirty?'Unsaved changes':selected.draft_revision?'Private draft saved':'Published record';
}
function choose(eventId){
  selected=feed?.events.find(row=>row.event_id===eventId)||null;
  if(!selected){form.reset();$('#preview').replaceChildren();return;}
  $('#event-select').value=selected.event_id;
  setForm(selected.draft||selected.published);
  showMessage(selected.draft_revision
    ?'A private draft is saved. Only publishing changes the athlete calendar.'
    :'You are editing a new private draft based on the published race.');
}
async function load({eventId=null}={}){
  if(!user)return false;
  const {data,error}=await supabase.rpc('coach_race_editorial_workbench_read');
  if(error)throw error;
  feed=validateWorkbench(data);
  const select=$('#event-select');select.replaceChildren();
  for(const row of feed.events){
    const label=`${row.published.starts_on||'Date pending'} · ${row.published.name}${row.draft_revision?' (draft)':''}`;
    select.add(new Option(label,row.event_id));
  }
  const target=eventId||selected?.event_id||new URLSearchParams(location.search).get('event');
  choose(feed.events.some(row=>row.event_id===target)?target:feed.events[0]?.event_id);
  return true;
}
function busyState(value){busy=value;$('#refresh').disabled=value;$('#upload').disabled=value;updatePreview();}

async function sessionChanged(session){
  const next=session?.user||null;
  if(next?.id===user?.id)return;
  const generation=++authGeneration;user=next;feed=null;selected=null;
  $('#workspace').hidden=true;$('#gate').hidden=false;$('#signout').hidden=!user;
  if(!user){gateMessage('Sign in with the coach account connected to FORM.');return;}
  gateMessage('Checking private coach access.');
  try{
    const {data,error}=await supabase.rpc('operating_console_owner');
    if(error||data!==true)throw Error('This account is not an active coaching administrator.');
    if(generation!==authGeneration)return;
    await load();
    if(generation!==authGeneration)return;
    $('#gate').hidden=true;$('#workspace').hidden=false;
  }catch(err){if(generation!==authGeneration)return;gateMessage(`Private workbench unavailable: ${err.message||'Could not load races.'}`);}
}

$('#event-select').addEventListener('change',event=>choose(event.target.value));
form.addEventListener('input',updatePreview);
form.addEventListener('change',updatePreview);

form.addEventListener('submit',async event=>{
  event.preventDefault();if(!selected||busy)return;
  const id=selected.event_id;
  const {payload,errors}=validatePayload(formValues(),{eventId:id});
  if(errors.length){showMessage(errors[0],true);return;}
  busyState(true);
  try{
    const {data,error}=await supabase.rpc('coach_race_editorial_save_draft',{
      p_event_id:id,p_expected_revision:selected.draft_revision,p_payload:payload
    });
    if(error)throw error;
    if(!Number.isInteger(data)||data<=selected.draft_revision)throw Error('Draft save not confirmed.');
    await load({eventId:id});
    if(selected.draft_revision!==data||JSON.stringify(normalizePayload(selected.draft))!==JSON.stringify(payload))
      throw Error('Draft saved, but readback differed. Review before publishing.');
    showMessage('Private draft saved and read back. Athletes still see the previously published race.');
  }catch(err){showMessage(err.message||'Save failed. Refresh before trying again.',true);}
  finally{busyState(false);}
});

$('#publish').addEventListener('click',async()=>{
  if(!selected||!selected.draft_revision||busy)return;
  const id=selected.event_id;
  if(JSON.stringify(formValues())!==JSON.stringify(normalizePayload(selected.draft))){
    showMessage('Save the current edits before publishing.',true);return;
  }
  const {errors}=validatePayload(selected.draft,{publish:true,eventId:id});
  if(errors.length){showMessage(errors[0],true);return;}
  if(!window.confirm(`Publish the saved race information for ${selected.draft.name}? Athletes will see it on their next refresh.`))return;
  busyState(true);
  try{
    const {data,error}=await supabase.rpc('coach_race_editorial_publish_draft',{
      p_event_id:id,p_expected_revision:selected.draft_revision
    });
    if(error)throw error;
    if(data?.event_id!==id)throw Error('Publication response was not confirmed.');
    await load({eventId:id});
    if(selected.draft_revision!==0)throw Error('Publication happened, but a draft remains. Review server state.');
    showMessage('Published and read back. V2 app clients receive the new information when Races refreshes.');
  }catch(err){showMessage(err.message||'Publish not confirmed. Refresh and review before retrying.',true);}
  finally{busyState(false);}
});

$('#upload').addEventListener('click',async()=>{
  if(!selected||busy)return;
  const file=form.elements.cover_file.files[0];
  if(!file){showMessage('Choose a photograph first.',true);return;}
  if(!form.elements.cover_rights_confirmed.checked){showMessage('Confirm the image rights before uploading.',true);return;}
  if(!form.elements.cover_image_alt.value.trim()){showMessage('Describe what this photograph shows.',true);return;}
  const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  if(!extensions[file.type]||file.size>5*1024*1024){showMessage('Use a JPEG, PNG or WebP image under 5 MB.',true);return;}
  busyState(true);
  try{
    const path=`races/${selected.event_id}/${crypto.randomUUID()}.${extensions[file.type]}`;
    const storage=supabase.storage.from('collective-media');
    const {error}=await storage.upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
    if(error)throw error;
    form.elements.cover_image_url.value=storage.getPublicUrl(path).data.publicUrl;
    form.elements.cover_file.value='';
    showMessage('Image uploaded. Save the private draft, then publish to display it in FORM.');
  }catch(err){showMessage(err.message||'Image upload failed.',true);}
  finally{busyState(false);}
});

$('#remove-cover').addEventListener('click',()=>{
  form.elements.cover_image_url.value='';form.elements.cover_image_alt.value='';
  form.elements.cover_rights_confirmed.checked=false;updatePreview();
});
$('#refresh').addEventListener('click',async()=>{
  if(busy||!user)return;
  if(selected&&JSON.stringify(formValues())!==JSON.stringify(normalizePayload(selected.draft||selected.published))&&
      !window.confirm('Discard unsaved edits and reload the server record?'))return;
  try{await load();showMessage('Loaded the latest race records.');}
  catch(err){showMessage(err.message||'Refresh failed.',true);}
});
$('#signout').addEventListener('click',async()=>{const {error}=await supabase.auth.signOut();if(error)showMessage(error.message,true);});
$('#signin-form').addEventListener('submit',async event=>{
  event.preventDefault();const f=event.target,b=f.querySelector('[type=submit]');b.disabled=true;
  try{if(!f.elements.password.value)throw Error('Enter your password or choose a sign-in link.');
    await signInWithPassword(f.elements.email.value,f.elements.password.value);f.elements.password.value='';}
  catch(err){gateMessage(err.message||'Sign-in failed.');}finally{b.disabled=false;}
});
$('#magic').addEventListener('click',async()=>{
  const f=$('#signin-form');if(!f.elements.email.reportValidity())return;
  $('#magic').disabled=true;
  try{await sendMagicLink(f.elements.email.value,'/coach/races/');gateMessage('Check your email for the private sign-in link.');}
  catch(err){gateMessage(err.message||'Link request failed.');}
  finally{$('#magic').disabled=false;}
});
supabase.auth.onAuthStateChange((_event,session)=>queueMicrotask(()=>sessionChanged(session)));
const initial=await supabase.auth.getSession();
await sessionChanged(initial.data?.session||null);
