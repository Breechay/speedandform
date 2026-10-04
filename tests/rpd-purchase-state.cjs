'use strict';
// Synthetic browser state only. No payment, email, entitlement or API write.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const flush=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));};
function environment({query='',storageBlocked=false,user=null}={}){
 const nodes=new Map(),values=new Map(),timers=new Map();let timerId=0;
 const events={},requests=[],replacements=[];
 const element=id=>{if(!nodes.has(id))nodes.set(id,{id,hidden:false,disabled:false,textContent:'',value:'',dataset:{},href:'',addEventListener:(type,callback)=>{events[id+':'+type]=callback;}});return nodes.get(id);};
 const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>{if(storageBlocked)throw Error('Storage blocked');values.set(key,String(value));},removeItem:key=>values.delete(key)};
 if(user)values.set('form-private-auth',JSON.stringify({user:{id:user},access_token:'synthetic-token'}));
 const location={origin:'https://review.invalid',search:query,href:'https://review.invalid/plans/race-pace-durability/'+query,replace:value=>replacements.push(value),reload(){}};
 const context={URL,URLSearchParams,Date,Promise,Map,Set,Error,JSON,AbortController,console,localStorage:storage,location,
  history:{state:null,replaceState:(_state,_title,value)=>replacements.push(value)},CustomEvent:class{constructor(type){this.type=type;}},
  document:{getElementById:element,addEventListener(){},dispatchEvent(){},hidden:false},
  setTimeout:(callback,ms)=>{const id=++timerId;timers.set(id,{callback,ms});if(ms<5000)queueMicrotask(callback);return id;},clearTimeout:id=>timers.delete(id),
  window:{location,addEventListener(){},rpdTrack:{purchase:value=>{context.tracked=(context.tracked||0)+1;context.trackedId=value;}}},
  fetch:async(url,options)=>{requests.push({url,options,body:JSON.parse(options.body)});return context.respond(requests.length,requests.at(-1));},
  respond:()=>({ok:true,status:200,json:async()=>({ok:true,status:'paid',purchase_id:'synthetic-purchase',session_id:'cs_synthetic_fixture'})})
 };
 vm.createContext(context);
 return{context,nodes,values,timers,requests,replacements,events,element};
}
const run=(env,file,transform=code=>code)=>vm.runInContext(transform(fs.readFileSync(file,'utf8')),env.context);
(async()=>{
 const thanks='plans/race-pace-durability/thanks/thanks.js';
 let e=environment();run(e,thanks);await flush();check(e.requests.length===0,'Missing checkout reference never requests verification');check(e.element('openPlan').hidden,'Missing reference never exposes full plan');check(e.element('purchaseStatus').dataset.state==='failed','Missing reference provides recovery state');
 e=environment({query:'?session_id=cs_synthetic_fixture',storageBlocked:true});run(e,thanks);await flush();check(e.element('purchaseStatus').dataset.state==='verified','Blocked storage cannot turn paid verification into failure');check(e.element('openPlan').href.includes('purchase_session=cs_synthetic_fixture'),'Verified private reference remains on full-plan link');check(!e.element('purchaseNext').hidden,'Paid start guidance waits for verification');check(e.context.tracked===1,'Purchase event emitted after paid verification only');check(e.context.trackedId==='synthetic-purchase','Analytics receive opaque purchase ID, never checkout bearer');
 e=environment({query:'?session_id=cs_synthetic_fixture'});e.context.respond=n=>({ok:n>2,status:n>2?200:425,json:async()=>n>2?{ok:true,status:'paid'}:{}});run(e,thanks);await flush();check(e.requests.length===3,'Pending webhook record retries then resolves');check(e.element('purchaseStatus').dataset.state==='verified','Pending record can become paid');
 e=environment({query:'?session_id=cs_synthetic_fixture'});e.context.respond=()=>({ok:false,status:403,json:async()=>({})});run(e,thanks);await flush();check(e.requests.length===1,'Revoked or rejected access stops polling');check(e.element('openPlan').hidden,'Rejected access never exposes paid action');check(!e.element('retryPurchase').hidden,'Rejected access keeps a clear retry');check(!e.context.tracked,'Rejected verification never records a purchase');e.context.respond=()=>({ok:true,status:200,json:async()=>({ok:true,status:'paid'})});await e.events['retryPurchase:click']();await flush();check(e.element('purchaseStatus').dataset.state==='verified','Explicit retry can recover confirmed paid access');
 const planSource='private/plan-access.js';
 for(const blocked of [false,true]){
  e=environment({query:'?purchase_session=cs_synthetic_fixture&utm_source=google',storageBlocked:blocked});e.context.document.getElementById=()=>null;
  const code=code=>code.replace(/export (class|function) /g,'$1 ')+ '\n;globalThis.resolveFixture=resolvePlanAccess;';run(e,planSource,code);const result=await e.context.resolveFixture();check(result.entitled&&result.session_id==='cs_synthetic_fixture','Anonymous verified purchase returns its exact private reference');check(e.replacements.length===(blocked?0:1),'URL reference removed only after storage retains it');if(!blocked)check(e.replacements[0].includes('utm_source=google'),'URL cleanup preserves campaign source');
 }
 e=environment({query:'?purchase_session=cs_synthetic_fixture',user:'synthetic-stranger'});e.context.document.getElementById=()=>null;e.context.__sdk={auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-stranger'},access_token:'synthetic-token'}}}),getUser:async()=>({data:{user:{id:'synthetic-stranger'}}}),onAuthStateChange:()=>({})},rpc:async()=>({})};e.context.respond=()=>({ok:true,status:200,json:async()=>({schema:1,user_id:'synthetic-stranger',mode:'preview',entitled:false,workspace:'account'})});run(e,planSource,code=>code.replace(/export (class|function) /g,'$1 ').replace("import('/private/supabase-client.js')","Promise.resolve({supabase:__sdk})")+'\n;globalThis.resolveFixture=resolvePlanAccess;');check(!(await e.context.resolveFixture()).entitled,'Signed-in unrelated account cannot borrow anonymous buyer hint');check(!e.requests.some(r=>r.url.endsWith('rpd-entitlement')),'Account-first path never substitutes checkout verification');
 const access='plans/race-pace-durability/access/access.js';
 const sdk=user=>({auth:{getSession:async()=>({data:{session:user?{user:{id:user},access_token:'synthetic-token'}:null}}),signInWithOtp:async()=>({error:null})}});
 e=environment({storageBlocked:true});e.context.supabase=sdk('synthetic-buyer');run(e,access,code=>code.replace(/^import .*\n/,''));await flush();check(e.replacements[0]?.includes('purchase_session=cs_synthetic_fixture'),'Restore reaches plan even when storage is blocked');
 e=environment();e.context.supabase=sdk('synthetic-other');e.context.respond=()=>({ok:false,status:404,json:async()=>({})});run(e,access,code=>code.replace(/^import .*\n/,''));await flush();check(e.element('accessStatus').textContent.includes('No purchase was found'),'Unmatched signed-in email is a recoverable state');check(!e.element('accessButton').disabled,'Unmatched email can request correct sign-in link');
 // Transport outages cannot masquerade as an unmatched purchase or grant access.
 for(const failure of ['network','http','unpaid']){
  e=environment();e.context.supabase=sdk('synthetic-buyer');
  e.context.respond=()=>{if(failure==='network')throw Error('Synthetic network outage');return{ok:failure==='unpaid',status:failure==='unpaid'?200:503,json:async()=>failure==='unpaid'?{ok:true,status:'pending',session_id:'cs_synthetic_unverified'}:{}};};
  run(e,access,code=>code.replace(/^import .*\n/,''));await flush();
  check(e.element('accessStatus').dataset.state==='error','Restore '+failure+' has an actionable error');
  check(e.element('accessStatus').textContent.includes(failure==='unpaid'?'No purchase was found':'couldn’t check'),'Transport failures and unmatched/unpaid purchases stay distinct');
  check(e.replacements.length===0&&!e.values.has('rpd_purchase_session'),'Restore '+failure+' never redirects or remembers unverified access');
  check(!e.element('accessButton').disabled,'Restore '+failure+' keeps email recovery available');
  check(e.requests[0].options.signal instanceof AbortSignal&&e.requests[0].options.cache==='no-store','Restore request is abortable and never cached');
  e.context.respond=()=>({ok:true,status:200,json:async()=>({ok:true,status:'paid',session_id:'cs_synthetic_fixture'})});await e.context.restore();await flush();
  check(e.replacements.some(value=>value.includes('purchase_session=cs_synthetic_fixture')),'Restore '+failure+' can retry into verified access');
 }
 e=environment();e.context.supabase=sdk(null);e.context.supabase.auth.signInWithOtp=async()=>({error:Error('internal SMTP provider credential error')});run(e,access,code=>code.replace(/^import .*\n/,''));await flush();e.element('accessEmail').value='synthetic@example.invalid';await e.events['accessForm:submit']({preventDefault(){}});check(!e.element('accessStatus').textContent.includes('SMTP'),'Auth service detail is not shown to customer');check(!e.element('accessButton').disabled,'Failed link send remains retryable');
 e=environment();e.context.supabase=sdk(null);run(e,access,code=>code.replace(/^import .*\n/,''));await flush();e.element('accessEmail').value='synthetic@example.invalid';await e.events['accessForm:submit']({preventDefault(){}});check(e.element('accessButton').disabled,'Successful link send enters cooldown');const cooldown=[...e.timers.values()].find(t=>t.ms===60000);check(Boolean(cooldown),'Successful link send has a bounded resend cooldown');cooldown.callback();check(!e.element('accessButton').disabled,'Successful send can be resent after cooldown');
 const approved=JSON.parse(fs.readFileSync('data/public-studies/speed-that-endures.json','utf8'));const offer=fs.readFileSync('plans/race-pace-durability/support/index.html','utf8');
 check(approved.latest_completed.date==='2026-09-29'&&approved.latest_completed.distance_mi===6,'Purchase proof requires current approved 6-mile projection review');check(offer.includes('On September 29, Hope and José both completed six continuous miles'),'Purchase proof matches approved projection');check(!offer.includes('<section hidden'),'Retired repeated offer sections removed');check(offer.includes('/plans/race-pace-durability/access/'),'Offer exposes purchase recovery');
 console.log(`PASS: ${checks} paid verification, pending/retry, storage resilience, account precedence, restore, OTP recovery and approved proof checks. All requests synthetic.`);
})().catch(error=>{console.error(error);process.exit(1);});
