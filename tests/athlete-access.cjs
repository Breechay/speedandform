'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('private/plan-access.js','utf8');
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function harness({user=null, mode='preview', workspace='account', planPage=false, guestPurchase=false, failure=null}={}) {
 const store = new Map();
 if(user) store.set('form-private-auth',JSON.stringify({user:{id:user},access_token:'fixture-token'}));
 if(guestPurchase) store.set('rpd_purchase_session','cs_synthetic');
 const storage={getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,String(v)),removeItem:key=>store.delete(key)};
 const listeners={}; const calls=[]; let accountCalls=0;
 const plan={plan:{slug:'race-pace-durability'},weeks:Array.from({length:15},(_,i)=>({week_number:i+1,sessions:mode!=='preview'||i<4?[{day:'MON',label:'SYNTHETIC'}]:[]}))};
 const sb={auth:{
  getSession:async()=>({data:{session:JSON.parse(storage.getItem('form-private-auth'))},error:null}),
  getUser:async()=>({data:{user:failure==='user'?null:{id:user}},error:failure==='user'?new Error('invalid'):null}),
  onAuthStateChange:callback=>{listeners.auth=callback;return {data:{subscription:{unsubscribe(){}}}}}
 },rpc:async()=>({data:0,error:null})};
 const context={console,Map,Set,Error,JSON,Promise,URL,URLSearchParams,Date,AbortController,CustomEvent:class{constructor(type){this.type=type}},
  localStorage:storage,location:{href:'https://review.invalid/',search:'',reload(){}},history:{state:null,replaceState(){}},
  window:{addEventListener:(name,fn)=>{listeners[name]=fn;}},
  document:{hidden:false,getElementById:id=>planPage&&id==='viewport'?{}:null,addEventListener:(name,fn)=>{listeners[name]=fn},dispatchEvent:e=>listeners[e.type]?.(e)},
  setTimeout,clearTimeout,__sdk:sb,
  fetch:async(url,options)=>{
   const body=JSON.parse(options.body);calls.push({url,body,options});
   if(url.endsWith('rpd_account_access')){
    accountCalls++;
    if(failure==='network')return {ok:false,status:503,json:async()=>({})};
    return {ok:true,json:async()=>({schema:1,user_id:user,mode,entitled:failure==='contradiction'?false:mode!=='preview',workspace,plan:body.p_include_plan&&mode!=='preview'?plan:null})};
   }
   if(url.endsWith('rpd-entitlement'))return {ok:false,status:503,json:async()=>({})};
   if(url.endsWith('public_plan_preview'))return {ok:true,json:async()=>plan};
   throw Error('Unexpected request');
  }
 };
 const code=source.replace(/export (class|function) /g,'$1 ').replace("import('/private/supabase-client.js')","Promise.resolve({supabase:__sdk})")+'\n;globalThis.test={resolvePlanAccess,accountDestination};';
 vm.createContext(context);vm.runInContext(code,context);
 return {...context.test,calls,storage,listeners,getAccountCalls:()=>accountCalls};
}
(async()=>{
 for(const role of [
  {user:'coach',mode:'coach',workspace:'coach',label:'Console',href:'/coach/labs/'},
  {user:'athlete',mode:'assigned',workspace:'athlete',label:'My training',href:'/athlete/'},
  {user:'buyer',mode:'purchased',label:'My plan',href:'/plans/race-pace-durability/'},
  {user:'stranger',mode:'preview',label:'Account',href:'/athlete/'}
 ]){
  const h=harness({...role,planPage:true});const first=h.resolvePlanAccess();
  ok(first===h.resolvePlanAccess(),'Same page shares one permission request');
  const access=await first;const route=h.accountDestination(access);
  ok(route.label===role.label && route.href===role.href,role.user+': authoritative destination');
  ok(access.entitled===(role.mode!=='preview'),role.user+': correct permission');
  ok(h.getAccountCalls()===1,role.user+': one account RPC');
  ok(h.calls.filter(c=>c.url.endsWith('rpd_account_access')).every(c=>JSON.stringify(c.body)==='{"p_include_plan":true}'),'No browser-supplied athlete ID or permission');
 }
 const guest=harness();ok((await guest.resolvePlanAccess()).mode==='preview'&&guest.calls.length===0,'Anonymous homepage needs no backend call');
 for(const failure of ['network','user','contradiction']){
  const h=harness({user:'coach',mode:'coach',planPage:true,guestPurchase:true,failure});
  await assert.rejects(h.resolvePlanAccess());checks++;
  ok(!h.calls.some(c=>c.url.endsWith('public_plan_preview')),'Failed known access never silently downgrades to preview');
  ok(!h.calls.some(c=>c.url.endsWith('rpd-entitlement')),'Previous guest purchase cannot replace failed account authorization');
 }
 const gp=harness({guestPurchase:true,planPage:true});await assert.rejects(gp.resolvePlanAccess());checks++;
 ok(!gp.calls.some(c=>c.url.endsWith('public_plan_preview')),'Failed purchase verification is not an offer to pay again');
 const h=harness({user:'coach',mode:'coach',guestPurchase:true});await h.resolvePlanAccess();
 h.storage.removeItem('form-private-auth');h.listeners.auth('SIGNED_OUT',null);
 ok(h.storage.getItem('rpd_purchase_session')===null,'Sign-out clears legacy purchase token');
 ok(!(await h.resolvePlanAccess()).entitled,'Fresh request after sign-out no longer grants account access');
 const sql=fs.readFileSync('supabase/migrations/20260917190000_rpd_account_access.sql','utf8');
 ok(sql.includes("set search_path = ''")&&sql.includes('security definer'),'RPC has fixed empty search path');
 ok(sql.includes('from public, anon, authenticated')&&sql.includes('to authenticated, service_role'),'Only intended roles execute account RPC');
 ok(sql.includes('email_confirmed_at is not null')&&sql.includes('banned_until'),'Verified, nonbanned identity required');
 ok(sql.includes("'requested', 'processing', 'completed'"),'Deletion takes precedence');
 ok(!sql.includes('user_metadata')&&!sql.includes('cs_live'),'No user-editable role metadata or live purchase token in authorization');
 const gate=fs.readFileSync('plans/race-pace-durability/gate.js','utf8');
 ok(!gate.includes('verifyPurchase')&&gate.includes('resolvePlanAccess()'),'Gate consumes same access result as data source');
 ok(gate.includes("head.classList.contains('rpd-locked-head')"),'Lock observer does not rewrite itself indefinitely');
 const page=fs.readFileSync('plans/race-pace-durability/plan.js','utf8');
 ok(page.includes('if (!accessActive) return;')&&page.includes('!accessActive || !direction'),'Stale render handlers cannot restore cleared content');
 const home=fs.readFileSync('index.html','utf8');ok(home.includes('data-form-account')&&home.includes('/private/account-navigation.js'),'Homepage account navigation connected');
 const auth=fs.readFileSync('private/auth.js','utf8');ok(auth.includes("'rpd_purchase_session', 'rpd_purchase_verified_at', 'form-last-workspace'"),'Shared sign-out clears prior account hints');
 console.log('PASS:',checks,'account/access checks');
})().catch(error=>{console.error(error);process.exitCode=1;});
