'use strict';
// Withdrawal-safe fallback for the shared study pages (Simon + Elijah). Run against a static server or with SIMON_QA_LOCAL_FILES=1.
// Rule: plan content appears ONLY from a live response verified as "published". A committed snapshot is never a fallback.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),BASE=(process.env.SIMON_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,'');
const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'labs/same-pace-different-problem/plans.json'),'utf8'));   // TEST FIXTURE ONLY (never served as a fallback)
const route='**/rest/v1/rpc/paired_study_plans';
const G=require('../labs/shared/publication-gate.js');
// plan-only strings per athlete, taken from the fixture itself so the check cannot rot
const allText=a=>{const p=fixture.athletes[a].payload;return [p.running.race_name,...p.weeks.flatMap(w=>w.sessions.map(x=>x.title))].filter(Boolean);};
// strings unique to this athlete's plan (a title shared with the other athlete's still-published plan would be a false alarm)
const strings=a=>{const other=new Set(allText(a==='simon'?'elijah':'simon'));return allText(a).filter(t=>t.length>12&&!other.has(t)).slice(0,5);};
const pages=[{url:'/labs/same-pace-different-problem/',athletes:['simon','elijah']},{url:'/plans/elijah-savannah-half/',athletes:['elijah']}];
const published=fixture, with_=(simon,elijah)=>({schema_version:1,athletes:{simon,elijah}});
const modes={
 'both-published':{body:published,state:{simon:'published',elijah:'published'}},
 'simon-unavailable':{body:with_({state:'unavailable'},fixture.athletes.elijah),state:{simon:'unavailable',elijah:'published'}},
 'elijah-unavailable':{body:with_(fixture.athletes.simon,{state:'unavailable'}),state:{simon:'published',elijah:'unavailable'}},
 'both-unavailable':{body:with_({state:'unavailable'},{state:'unavailable'}),state:{simon:'unavailable',elijah:'unavailable'}},
 'simon-review-required':{body:with_({state:'review_required'},fixture.athletes.elijah),state:{simon:'review_required',elijah:'published'}},
 'network-failure':{abort:true,state:{simon:'unverified',elijah:'unverified'}},
 'http-500':{status:500,body:{message:'boom'},state:{simon:'unverified',elijah:'unverified'}},
 'garbage':{raw:'not json',state:{simon:'unverified',elijah:'unverified'}},
 'unknown-state':{body:with_({state:'maybe'},{state:'maybe'}),state:{simon:'unverified',elijah:'unverified'}},
 // a withdrawn entry that still carries a payload must be refused outright (the whole read is unverifiable)
 'leaked-payload':{body:with_({state:'unavailable',payload:fixture.athletes.simon.payload},fixture.athletes.elijah),state:{simon:'unverified',elijah:'unverified'}}
};
async function install(page,mode){
 await page.addInitScript(()=>{const real=Date.now;window.__skew=0;Date.now=()=>real()+window.__skew;});
 const requested=[];page.on('request',r=>requested.push(r.url()));
 await page.route(route,r=>{
  const m=typeof mode==='function'?mode():modes[mode];
  if(m.abort)return r.abort();
  return r.fulfill({status:m.status||200,contentType:'application/json',body:m.raw!==undefined?m.raw:JSON.stringify(m.body)});
 });
 return requested;
}
async function settle(page,athlete){
 await page.waitForFunction(a=>{const e=document.querySelector('[data-cs-plan="'+a+'"]');return e&&(e.querySelector('.cs-plan')||(e.querySelector('.cs-state')&&e.querySelector('.cs-state').dataset.planState!=='checking'));},athlete,{timeout:20000});
}
async function assertAthlete(page,athlete,expected,label){
 const box=page.locator('[data-cs-plan="'+athlete+'"]');
 const body=await page.locator('body').innerText();
 if(expected==='published'){
  assert.ok(await box.locator('.cs-plan').count()>0,label+': '+athlete+' plan shown from the verified response');
  assert.ok(strings(athlete).some(s=>body.includes(s)),label+': '+athlete+' plan text is visible when published');
 }else{
  assert.equal(await box.locator('.cs-plan').count(),0,label+': '+athlete+' shows NO plan ('+expected+')');
  assert.equal(await box.locator('.cs-state').getAttribute('data-plan-state'),expected,label+': '+athlete+' state');
  assert.equal((await box.locator('.cs-state').innerText()).trim(),G.message(expected,'en'),label+': '+athlete+' message');
  for(const s of strings(athlete))assert.ok(!body.includes(s),label+': '+athlete+' plan text "'+s+'" must not be visible');
  const race=page.locator('[data-cs-race="'+athlete+'"]');if(await race.count())assert.equal((await race.innerText()).trim(),'—',label+': no race date from a snapshot');
  const ver=page.locator('[data-cs-version="'+athlete+'"]');if(await ver.count())assert.equal((await ver.innerText()).trim(),'',label+': no version from a snapshot');
 }
}
async function main(){
 const browser=await playwright.chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const cases=[];
 try{
  for(const pg of pages)for(const mode of Object.keys(modes)){
   const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const requested=await install(page,mode);
   await page.goto(BASE+pg.url,{waitUntil:'domcontentloaded'});
   for(const a of pg.athletes)await settle(page,a);
   for(const a of pg.athletes)await assertAthlete(page,a,modes[mode].state[a],pg.url+' '+mode);
   assert.equal(await page.evaluate(()=>typeof window.FORMStudyPlans),'undefined','no committed plan object is loaded');
   assert.ok(!requested.some(u=>/\/(plans\.(js|json)|published-plan\.(js|json))(\?|$)/.test(u)),'no committed snapshot is requested');
   assert.deepEqual(errors,[],pg.url+' '+mode+': script errors');
   cases.push(pg.url+' '+mode);console.log('PASS '+pg.url+' '+mode);await page.close();
  }
  // The journal (separate, editorially approved records) stays readable on the Elijah page whatever the plan state
  {const page=await browser.newPage({viewport:{width:390,height:844}});await install(page,'both-unavailable');await page.goto(BASE+'/plans/elijah-savannah-half/',{waitUntil:'domcontentloaded'});await settle(page,'elijah');
   assert.ok((await page.locator('[data-cs-journal]').innerText()).trim().length>40,'the approved journal remains readable');console.log('PASS journal stays readable');await page.close();}
  // WITHDRAWAL MID-SESSION: verified plans are on screen; the next check says unavailable / unverifiable; they disappear.
  for(const after of ['both-unavailable','simon-unavailable','network-failure']){
   const page=await browser.newPage({viewport:{width:390,height:844}});let current='both-published';
   await install(page,()=>modes[current]);
   await page.goto(BASE+'/labs/same-pace-different-problem/',{waitUntil:'domcontentloaded'});
   for(const a of ['simon','elijah']){await settle(page,a);await assertAthlete(page,a,'published','before '+after);}
   current=after;
   await page.evaluate(()=>{window.__skew=60000;window.dispatchEvent(new Event('focus'));});   // beyond the 30 s read throttle
   await page.waitForFunction(()=>!document.querySelector('[data-cs-plan="simon"] .cs-plan')||!document.querySelector('[data-cs-plan="elijah"] .cs-plan'),null,{timeout:20000});
   for(const a of ['simon','elijah'])await assertAthlete(page,a,modes[after].state[a],'after '+after);
   console.log('PASS withdrawal mid-session → '+after);cases.push('withdrawal '+after);await page.close();
  }
 }finally{await browser.close();}
 console.log(JSON.stringify({result:'passed',cases:cases.length}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
