import { supabase } from '/private/supabase-client.js';
const nav=document.querySelector('#nav');
let allowed=false,generation=0;
function render(){
  const existing=document.querySelector('#operating-day-entry');
  if(!allowed){existing?.remove();return;}
  if(!nav||existing)return;
  const link=document.createElement('a');
  link.id='operating-day-entry';link.href='/coach/ops/';link.textContent='My day ↗';
  link.style.cssText='display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;color:inherit;font:inherit;text-decoration:none;white-space:nowrap';
  nav.append(link);
}
async function check(){
  const current=++generation;
  const {data,error}=await supabase.rpc('operating_console_owner');
  if(current!==generation)return;
  allowed=!error&&data===true;render();
}
if(nav){
  new MutationObserver(render).observe(nav,{childList:true});
  supabase.auth.onAuthStateChange(()=>queueMicrotask(check));
  check();
}
