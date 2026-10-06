'use strict';
// Real source, synthetic DOM/URLs/storage. No remote scripts or collectors run.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
function eventTarget(extra={}){
 const handlers={};return Object.assign({handlers,addEventListener:(name,fn)=>(handlers[name]||=[]).push(fn),emit(name,event={}){for(const fn of handlers[name]||[])fn(event);}},extra);
}
function make({url='https://speedandform.com/library/half-marathon-training-plan/',resource='plan',dnt=false,gpc=false,blocked=false,referrer='',store=new Map(),links=[]}={}){
 const u=new URL(url),location={};for(const key of ['href','origin','hostname','pathname','search','hash'])location[key]=u[key];
 const scripts=[],events=[],emitted=[];
 const storage={getItem:key=>{if(blocked)throw Error('Synthetic storage restriction');return store.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('Synthetic storage restriction');store.set(key,String(value));}};
 const week=eventTarget({id:'week-1',open:false,scrollIntoView(){}}),summary=eventTarget();week.querySelector=()=>summary;
  const select=eventTarget({value:''});
  const weekLink=eventTarget({getAttribute:()=> '#week-1'});
 const anchors=links.map(href=>({href:new URL(href,url).href}));
 const document=eventTarget({referrer,documentElement:{getAttribute:()=>resource},head:{appendChild:node=>scripts.push(node)},createElement:()=>({dataset:{}}),querySelector:()=>null,querySelectorAll(selector){if(selector==='a[data-hm-destination]')return anchors;if(selector==='.hm-week')return[week];if(selector==='a[href^="#week-"]')return[weekLink];return[];},getElementById(id){return id==='hm-week'?select:id==='week-1'?week:null;},dispatchEvent:event=>events.push(event.detail)});
 const window=eventTarget({location,sessionStorage:storage,navigator:{doNotTrack:dnt?'1':'0',globalPrivacyControl:gpc},print(){}});
 const context={window,document,URL,URLSearchParams,Date,Set,Object,Array,Number,CustomEvent:class{constructor(name,{detail}){this.type=name;this.detail=detail;}}};vm.createContext(context);
 const run=file=>vm.runInContext(fs.readFileSync(file,'utf8'),context);
 run('js/half-marathon-measurement.js');
 const sent=()=>Array.from(window.dataLayer||[],item=>Array.from(item));
 return{window,document,scripts,store,events,emitted,week,summary,select,weekLink,anchors,run,sent};
}
let e=make();
check(e.scripts.length===1&&e.scripts[0].src==='https://www.googletagmanager.com/gtag/js?id=G-HKG3MXM668','Only the established GA web stream is loaded');
check(!e.window.fbq,'No Meta SDK or queue is introduced');
const config=e.sent().find(row=>row[0]==='config')[2];
check(config.send_page_view===false&&config.allow_google_signals===false&&config.allow_ad_personalization_signals===false,'Explicit page-view and existing privacy flags are configured');
check(e.sent().filter(row=>row[1]==='page_view').length===1,'Collector emits one explicit page view');
e.run('js/half-marathon-measurement.js');check(e.scripts.length===1,'Repeated initialization cannot load a second collector');
e.window.sfHmTrack('hm_resource_view');e.window.sfHmTrack('hm_resource_view');
check(e.sent().filter(row=>row[1]==='hm_resource_view').length===1,'Duplicate resource arrival is suppressed');
for(const privacy of [{dnt:true},{gpc:true}]){
 e=make({...privacy,url:'https://speedandform.com/library/half-marathon-training-plan/?utm_source=google&utm_campaign=half_12',links:['/library/half-marathon-pace-chart/']});
 check(e.scripts.length===0&&e.sent().length===0&&!e.window.sfHmTrack,'DNT/GPC suppress SDK and event initialization');
 check(e.store.get('sf-source:utm_campaign')==='half_12','DNT/GPC retain approved first-party campaign labels');
 check(new URL(e.anchors[0].href).searchParams.get('utm_source')==='google','Source-only navigation remains available under DNT/GPC');
}
for(const url of ['https://preview.example/library/half-marathon-training-plan/','http://localhost:8765/library/half-marathon-training-plan/','https://speedandform.com/coach/private/']){
 e=make({url});check(e.scripts.length===0&&e.sent().length===0,'Non-production hosts and unapproved routes never initialize analytics');
}
for(const suffix of ['?purchase_session=cs_synthetic_fixture','?SESSION_ID=synthetic','?access_token=synthetic','#access_token=synthetic','?other=cs_synthetic_fixture','?other=%63%73_synthetic_fixture','#%61ccess_token=synthetic']){
 e=make({url:'https://speedandform.com/library/half-marathon-training-plan/'+suffix});
 check(e.scripts.length===0&&e.sent().length===0,'Private access URLs never initialize analytics');
 check(e.window.location.href.endsWith(suffix),'Measurement never rewrites a private URL');
}
e=make({url:'https://speedandform.com/library/half-marathon-training-plan/?utm_source=google&utm_medium=cpc&utm_campaign=half_12&utm_content=overview&ref=example.org&utm_term=synthetic-secret&email=synthetic%40example.invalid&pace=6%3A30#week-9',referrer:'https://checkout.stripe.com/c/pay/cs_synthetic_fixture?secret=synthetic'});
e.window.sfHmTrack('hm_week_open',{week:4,unit:'km',interaction:'explicit',email:'synthetic@example.invalid',pace:'6:30',page:'forged',version:'forged'});
const payload=JSON.stringify(e.sent());
check(!payload.includes('synthetic')&&!payload.includes('6:30')&&!payload.includes('week-9')&&!payload.includes('forged'),'Unknown query, fragment, referrer secrets and caller fields never enter payloads');
check(payload.includes('utm_campaign=half_12')&&payload.includes('utm_source=google'),'Approved campaign labels remain attributable');
check(e.sent().find(row=>row[1]==='hm_week_open')[2].page==='plan','Caller cannot override the resource identity');
check(e.sent().find(row=>row[1]==='hm_week_open')[2].page_referrer==='https://checkout.stripe.com/','Referrer query and path are omitted');
for(const label of ['synthetic%40example.invalid','two%20words','https%3A%2F%2Fexample.invalid','cs_synthetic_fixture','x'.repeat(121)]){
 e=make({url:'https://speedandform.com/library/half-marathon-training-plan/?utm_source='+label});
 check(!e.window.sfCampaignSource||!e.window.sfCampaignSource().utm_source,'Unsafe or oversized campaign label is rejected');
}
e=make({store:new Map([['sf-source:utm_source','meta'],['sf-source:utm_campaign','old']]),url:'https://speedandform.com/library/half-marathon-training-plan/?utm_source=google'});
check(e.window.sfCampaignSource().utm_source==='google'&&e.store.get('sf-source:utm_source')==='google','Explicit valid source wins over stored source');
e=make({blocked:true,url:'https://speedandform.com/library/half-marathon-training-plan/?utm_source=google',links:['/library/half-marathon-pace-chart/','https://external.example/','/coach/ops/','/plans/race-pace-durability/?purchase_session=cs_synthetic_fixture','/plans/?utm_source=referral']});
check(new URL(e.anchors[0].href).searchParams.get('utm_source')==='google','Public source continuity works with unavailable storage');
for(const i of [1,2,3])check(!new URL(e.anchors[i].href).searchParams.has('utm_source'),'Private/external link is not decorated');
check(new URL(e.anchors[4].href).searchParams.get('utm_source')==='referral','An explicit destination source is preserved');
const before=e.sent().length;
for(const [name,params] of [['purchase',{}],['generate_lead',{}],['hm_week_open',{week:1,unit:'mi'}],['hm_week_open',{week:13,unit:'mi',interaction:'explicit'}],['hm_week_open',{week:1.5,unit:'mi',interaction:'explicit'}],['hm_week_open',{week:1,unit:'yards',interaction:'explicit'}],['hm_next_step',{destination:'private'}],['hm_units_change',{unit:'yards'}]])e.window.sfHmTrack(name,params);
check(e.sent().length===before,'Unapproved event names, ranges, actions and units are discarded');
e.window.sfHmTrack('hm_print_request',{unit:'mi',email:'synthetic@example.invalid'});check(e.sent().at(-1)[1]==='hm_print_request'&&!JSON.stringify(e.sent().at(-1)).includes('synthetic'),'Valid print request retains only allowlisted fields');
e.window.navigator.globalPrivacyControl=true;const gated=e.sent().length;e.window.sfHmTrack('hm_units_change',{unit:'km'});check(e.sent().length===gated,'Later privacy signal suppresses subsequent events');
for(const resource of ['ready','pace']){
 const path=resource==='ready'?'how-long-to-train-for-a-half-marathon':'half-marathon-pace-chart';e=make({resource,url:'https://speedandform.com/library/'+path+'/'});const n=e.sent().length;e.window.sfHmTrack('hm_week_open',{week:1,unit:'mi',interaction:'explicit'});check(e.sent().length===n,'Non-plan resource cannot emit week opens');e.window.sfHmTrack('hm_print_request',{unit:'mi'});check(e.sent().length===n+(resource==='pace'?1:0),'Chart print is accepted; readiness page cannot invent a print event');
}
// Native disclosure and selector behavior: script/hash opens never count as use.
e=make({url:'https://speedandform.com/library/half-marathon-training-plan/#week-1'});e.run('js/half-marathon-library.js');e.week.emit('toggle');
check(e.week.open&&!e.events.some(event=>event.name==='hm_week_open'),'Shared hash opens the week without a use event');
e.week.open=false;e.summary.emit('click',{isTrusted:false});e.week.open=true;e.week.emit('toggle');
check(!e.events.some(event=>event.name==='hm_week_open'),'Synthetic disclosure open is not measured as deliberate use');
e.week.open=false;e.summary.emit('click',{isTrusted:true});e.week.open=true;e.week.emit('toggle');
check(e.events.filter(event=>event.name==='hm_week_open').length===1,'Trusted native summary click records a deliberate opening');
e.summary.emit('click',{isTrusted:true});e.week.open=false;e.week.emit('toggle');
check(e.events.filter(event=>event.name==='hm_week_open').length===1,'Closing a week is not an opening');
e.select.value='1';e.select.emit('change',{isTrusted:false});e.week.emit('toggle');
check(e.events.filter(event=>event.name==='hm_week_open').length===1,'Programmatic selector change is not measured');
e.select.emit('change',{isTrusted:true});e.week.emit('toggle');
check(e.events.filter(event=>event.name==='hm_week_open').length===2,'Trusted selector selection records one event without toggle duplication');
check(e.sent().filter(row=>row[1]==='hm_week_open').length===2,'Only deliberate events reach the collector');
e.week.open=false;e.weekLink.emit('click',{isTrusted:false});check(!e.week.open,'Synthetic overview click does not force a week open');
e.weekLink.emit('click',{isTrusted:true});e.week.emit('toggle');e.window.emit('hashchange');
check(e.week.open&&e.events.filter(event=>event.name==='hm_week_open').length===3,'Trusted overview week link opens the week and records exactly one use');
check(e.sent().filter(row=>row[1]==='hm_week_open').length===3,'Overview, selector and summary clicks each deliver one use event');
console.log(`PASS: ${checks} resource measurement, source continuity, privacy and deliberate-use checks. No external SDK executed.`);
for(const [resource,slug,max] of [['six','6-week-half-marathon-training-plan',6],['eight','8-week-half-marathon-training-plan',8],['sixteen','16-week-half-marathon-training-plan',16]]){
 e=make({resource,url:'https://speedandform.com/library/'+slug+'/'});
 e.window.sfHmTrack('hm_week_open',{week:max,unit:'mi',interaction:'explicit'});
 e.window.sfHmTrack('hm_week_open',{week:max+1,unit:'mi',interaction:'explicit'});
 check(e.sent().filter(r=>r[1]==='hm_week_open').length===1,'New plan limits reject weeks outside their own schedule');
 check(e.sent().find(r=>r[1]==='hm_week_open')[2].plan!=='none','New plans carry their own plan identity');
 for(const privacy of [{dnt:true},{gpc:true}]){const p=make({resource,url:'https://speedandform.com/library/'+slug+'/',...privacy});check(p.scripts.length===0,'New plan respects privacy preferences');}
}
console.log('PASS: new plan identities, week bounds and privacy gates.');
