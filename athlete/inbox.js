import { supabase as sb } from '/private/supabase-client.js';

const $=(id)=>document.getElementById(id);
const escape=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let messages=[];
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw error;return data;}
function paint(){
  const unread=messages.filter((m)=>!m.read_at).length;
  $('inboxCount').hidden=!unread;$('inboxCount').textContent=unread>9?'9+':unread;
  $('inboxEntries').innerHTML=messages.length?messages.map((m)=>{
    const date=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(m.created_at));
    const href=m.href==='/runs/'?'/runs/':'/athlete/';
    return `<article class="inbox-entry ${m.read_at?'':'unread'}" data-id="${escape(m.id)}"><time>${escape(date)}</time><h3>${escape(m.title)}</h3><p>${escape(m.body)}</p><a href="${href}">Open ${href==='/runs/'?'Runs':'My training'}</a></article>`;
  }).join(''):'<p>No updates yet.</p>';
}
async function refresh(){
  const {data:{session}}=await sb.auth.getSession();if(!session)return;
  try{
    messages=await rpc('form_miami_inbox');
    $('inboxOpen').hidden=false;paint();
    $('inboxEmail').checked=await rpc('form_miami_email_preference');
  }catch{/* Older app sessions must continue to work if inbox is unavailable. */}
}
$('inboxOpen').addEventListener('click',async()=>{
  await refresh();$('inboxDialog').showModal();
  // Reading the inbox acknowledges exactly the messages the athlete can see.
  await Promise.allSettled(messages.filter((m)=>!m.read_at).map((m)=>rpc('form_miami_mark_read',{p_notification_id:m.id})));
  messages=messages.map((m)=>({...m,read_at:m.read_at||new Date().toISOString()}));paint();
});
$('inboxClose').addEventListener('click',()=>$('inboxDialog').close());
$('inboxEmail').addEventListener('change',async(e)=>{
  try{await rpc('form_miami_email_preference',{p_enabled:e.target.checked});}catch{e.target.checked=!e.target.checked;}
});
// The athlete workspace already owns sign-in. Check on load and when the tab
// becomes visible again; users should never need to refresh to see a nudge.
refresh();document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
