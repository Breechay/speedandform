'use strict';
// Browser acceptance against the committed, approved public projection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),BASE=(process.env.SIMON_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,''),OUT=process.env.SIMON_QA_OUTPUT||'/tmp/simon-study-qa';
const pub=JSON.parse(fs.readFileSync(path.join(ROOT,'labs/the-two-curves/published-plan.json'),'utf8'));
const summaryTranslation=require('../scripts/studies/simon-study-copy.cjs')['s2.p'];
fs.mkdirSync(OUT,{recursive:true});
const report={origin:BASE,revision:pub.revision,cases:[],scope:'Browser emulation. Not a physical iPhone or a native-app test.'};
const route='**/rest/v1/rpc/study_003_plan';
async function localFiles(page){
 if(process.env.SIMON_QA_LOCAL_FILES!=='1')return;
 await page.route(BASE+'/**',async r=>{
  const pathname=decodeURIComponent(new URL(r.request().url()).pathname);
  let file=path.resolve(ROOT,'.'+pathname);
  if(!file.startsWith(ROOT+path.sep))return r.fulfill({status:404,body:'Not found'});
  try{
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   const ext=path.extname(file),types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
   return r.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(file)});
  }catch{return r.fulfill({status:404,body:'Not found'});}
 });
}
async function mock(page,mode='live'){
 await page.route(route,r=>{
  if(mode==='unverified-network')return r.abort();
  if(mode==='unverified-http500')return r.fulfill({status:500,contentType:'application/json',body:'{"message":"boom"}'});
  if(mode==='unverified-malformed')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:'published',payload:{plan:{slug:'simon-ceiling-durability-01'}}})});
  if(mode==='unverified-garbage')return r.fulfill({status:200,contentType:'application/json',body:'not json'});
  if(mode==='unverified-unknown-state')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:'maybe'})});
  if(mode==='unavailable')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:'unavailable',message:'No approved public plan.',payload:pub.payload})});   // a stray payload must never be shown
  if(mode==='review_required')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:'review_required'})});
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(pub)});
 });
}
// Withdrawal-safe rule: in every non-live mode the page shows NO plan content at all.
const DOSE_STRINGS=['3:49–3:52','3:33–3:38','3:50–3:53','6:08–6:13','5:43–5:51','relaxed strides','Warm-up 20','Cooldown 10','Plan snapshot','Lighter week','8 km to 10 km'];   // plan-only strings (the editorial history legitimately quotes other paces)
async function recordNoPlan(page,name,mode,state,lang='en'){
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await localFiles(page);
 await page.goto(BASE+'/labs/the-two-curves/?lang='+lang+'&unit=km',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(st=>document.querySelector('#planSource')?.dataset.sourceState===st,state,{timeout:20000});
 assert.equal(await page.locator('#gridPlan .gp-row').count(),0,name+': no plan rows');
 assert.equal((await page.locator('#gridPlan').innerText()).trim(),'',name+': plan grid is empty');
 for(const key of ['s2.p','tr1.p','tr2.p','tr3.p','pace.easy','pace.tuesday','pace.thursday'])assert.equal((await page.locator('[data-i="'+key+'"]').first().innerText()).trim(),'',name+': '+key+' is blank');
 assert.equal((await page.locator('#statusTxt').innerText()).trim(),'',name+': no block status without a verified publication');
 const visible=await page.locator('body').innerText();
 for(const s of DOSE_STRINGS)assert.ok(!visible.includes(s),name+': plan text "'+s+'" must not be visible');
 const G=require('../labs/shared/publication-gate.js');
 assert.equal((await page.locator('#planSource').innerText()).trim(),G.message(state==='refreshing'?'checking':state,lang),name+': honest status message');
 assert.ok(await page.locator('#history').isVisible()&&await page.locator('#gate').isVisible(),name+': the editorial study is untouched');
 assert.ok(await page.locator('#refreshPlan').isVisible()&&!(await page.locator('#refreshPlan').isDisabled()),name+': retry is available');
 assert.deepEqual(errors,[],name+': script errors');
 report.cases.push({name,state,result:'No plan content shown'});
 console.log('PASS '+name);
}
async function record(page,name,width,lang,mode='live',screenshot=false){
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await localFiles(page);
 await page.goto(BASE+'/labs/the-two-curves/?lang='+lang+'&unit=km',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(state=>document.querySelector('#planSource')?.dataset.sourceState===state,mode,{timeout:20000});
 assert.equal(await page.locator('#gridPlan .gp-row').count(),5);
 assert.equal(await page.locator('[data-i="s2.p"]').innerText(),lang==='fr'?summaryTranslation[1]:pub.payload.version.summary);
 assert.equal(await page.locator('#summaryLanguage').isVisible(),false,'Known approved summary needs no language fallback');
 const row=page.locator('#gridPlan .gp-row');
 assert.ok((await row.nth(0).textContent()).includes(lang==='fr'?'Plan archivé':'Plan snapshot'));
 assert.ok((await row.nth(1).innerText()).includes('3:49–3:52/km'));
 assert.ok((await row.nth(1).innerText()).includes('3:33–3:38/km'));
 assert.ok((await row.nth(3).innerText()).includes('3:50–3:53/km'));
 assert.ok((await row.nth(3).innerText()).includes('6 × 20 sec'));
 assert.ok((await row.nth(4).innerText()).includes('4 × 20 sec'));
 assert.ok((await page.locator('[data-i="pace.tuesday"]').first().innerText()).includes('3:49–3:52/km'));
 assert.ok((await page.locator('[data-i="pace.thursday"]').innerText()).includes('3:33–3:38/km'));
 assert.ok(await page.locator('#history').isVisible());assert.ok(await page.locator('#gate').isVisible());
 assert.ok(await page.locator('.fig img').evaluate(e=>e.complete&&e.naturalWidth>0));
 assert.ok(await page.locator('.mast__logo').evaluate(e=>getComputedStyle(e,'::before').maskImage!=='none'&&e.getBoundingClientRect().width>0));
 const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
 assert.ok(overflow<=2,name+': horizontal overflow '+overflow);
 const plan=await page.locator('#plan').innerText(),observation=await page.locator('#observation-led').innerText();
 assert.ok(!/absorbed|absorption|working.development|ceiling maintenance|race prediction|quality budget|separated gates/i.test(plan+'\n'+observation));
 assert.ok(observation.includes(lang==='fr'?'Adapter la semaine à ta récupération.':'Adjust the week to how you recover.'));
 assert.ok((await row.nth(4).innerText()).includes(lang==='fr'?'8 km à 10 km ou repose-toi':'8 km to 10 km or rest'));
 assert.ok(await page.locator('#refreshPlan').isVisible());assert.equal(await page.locator('#refreshPlan').isDisabled(),false);
 assert.ok((await page.locator('#gate').innerText()).includes(lang==='fr'?'accord':'confirmation'));
 if(screenshot){
  await page.locator('#plan').screenshot({path:path.join(OUT,name+'-plan.png'),scale:'css'});
  await page.locator('#observation-led').screenshot({path:path.join(OUT,name+'-recovery.png'),scale:'css'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(OUT,name+'-top.png'),scale:'css'});
 }
 assert.deepEqual(errors,[],name+': script errors');
 report.cases.push({name,width,language:lang,source:await page.locator('#planSource').getAttribute('data-source-state'),overflow_px:overflow});
 console.log('PASS '+name);
}
async function main(){
 let launch={};
 if(process.env.CHROMIUM_PACKAGE){
  const imported=await import(process.env.CHROMIUM_PACKAGE),chromium=imported.default||imported;
  // Single-process builds exit when one browser.newPage context is closed.
  launch={executablePath:await chromium.executablePath(),args:chromium.args.filter(x=>x!=='--single-process'),headless:true};
 }else if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await playwright.chromium.launch(launch);
 try{
  for(const width of [375,390,430,768,1024,1440]){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});await mock(page);
   await record(page,'chromium-en-'+width,width,'en','live',[390,1440].includes(width));await page.close();
  }
  const fr=await browser.newPage({viewport:{width:390,height:844}});await mock(fr);await record(fr,'chromium-fr-390',390,'fr','live',true);
  await fr.locator('[data-unit="mi"]').click();await fr.waitForFunction(()=>document.querySelector('#gridPlan').textContent.includes('6:08–6:13/mi'));
  assert.ok((await fr.locator('[data-i="pace.tuesday"]').first().innerText()).includes('6:08–6:13/mi'));
  assert.ok((await fr.locator('[data-i="pace.thursday"]').innerText()).includes('5:43–5:51/mi'));
  await fr.locator('[data-lang="en"]').click();await fr.waitForFunction(()=>document.documentElement.lang==='en');
  assert.ok((await fr.locator('#gridPlan').innerText()).includes('very easy jog'));
  report.cases.push({name:'language-and-unit-switch',result:'passed'});await fr.close();

  for(const language of ['en','fr']){
  const manual=await browser.newPage({viewport:{width:390,height:844}});let calls=0;
  const revised=structuredClone(pub);revised.payload.version.number++;revised.revision='SIMON-003-R'+revised.payload.version.number+'-20261008';
  revised.payload.version.summary='A refreshed description from the approved plan.';
  revised.payload.weeks[1].sessions.find(s=>s.day==='TUE').components.find(c=>c.role==='work').pace_low_seconds=371;
  await manual.route(route,r=>{calls++;return calls===3?r.abort():r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(calls===1?pub:revised)});});
  await record(manual,'manual-refresh-before-'+language,390,language);
  await manual.locator('#refreshPlan').click();await manual.waitForFunction(n=>document.querySelector('#planSource').textContent.includes('version '+n),revised.payload.version.number);
  assert.equal(calls,2);assert.equal(await manual.locator('[data-i="s2.p"]').innerText(),revised.payload.version.summary);
  assert.equal(await manual.locator('[data-i="s2.p"]').getAttribute('lang'),'en');
  assert.equal(await manual.locator('#summaryLanguage').isVisible(),language==='fr');
  if(language==='fr'){
   assert.equal(await manual.locator('#summaryLanguage').innerText(),'Description du bloc en anglais');
   await manual.locator('[data-lang="en"]').click();
   await manual.waitForFunction(()=>document.documentElement.lang==='en');
   assert.equal(await manual.locator('#summaryLanguage').isVisible(),false);
   assert.equal(await manual.locator('[data-i="s2.p"]').innerText(),revised.payload.version.summary);
   await manual.locator('[data-lang="fr"]').click();
   await manual.waitForFunction(()=>document.documentElement.lang==='fr');
   assert.equal(await manual.locator('#summaryLanguage').isVisible(),true);
   await manual.locator('#summaryLanguage').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-80));
   await manual.screenshot({path:path.join(OUT,'refreshed-french-summary.png'),scale:'css'});
   assert.ok((await manual.locator('[data-i="pace.tuesday"]').first().innerText()).includes('3:51–3:52/km'));
   assert.ok((await manual.locator('#gridPlan .gp-row').nth(1).innerText()).includes('3:51–3:52/km'));
   await manual.locator('#refreshPlan').click();
   await manual.waitForFunction(()=>document.querySelector('#planSource').dataset.sourceState==='unverified');
   // A later check that cannot be verified REMOVES the plan: it is not retained from the earlier success.
   assert.equal((await manual.locator('[data-i="s2.p"]').innerText()).trim(),'','A failed later check removes the summary');
   assert.equal(await manual.locator('#gridPlan .gp-row').count(),0,'A failed later check removes the grid');
   assert.equal(await manual.locator('#summaryLanguage').isVisible(),false);
  }
  if(language==='en'){
   assert.ok((await manual.locator('[data-i="pace.tuesday"]').first().innerText()).includes('3:51–3:52/km'));
   assert.ok((await manual.locator('#gridPlan .gp-row').nth(1).innerText()).includes('3:51–3:52/km'));
  }
  report.cases.push({name:'manual-refresh-'+language,result:'Current summary, cards and grid refreshed together; unmatched French translation uses labeled current English; a later unverifiable check removes the plan'});await manual.close();
  }

  // Every state that is not a verified "published" response shows no plan (revoked, awaiting update, unverifiable).
  for(const [mode,state] of [['unavailable','unavailable'],['review_required','review_required'],['unverified-network','unverified'],['unverified-http500','unverified'],['unverified-malformed','unverified'],['unverified-garbage','unverified'],['unverified-unknown-state','unverified']]){
   const page=await browser.newPage({viewport:{width:390,height:844}});await mock(page,mode);await recordNoPlan(page,mode,mode,state);
   await page.locator('#refreshPlan').click();await page.waitForFunction(st=>document.querySelector('#planSource').dataset.sourceState===st,state);
   assert.equal(await page.locator('#gridPlan .gp-row').count(),0,mode+': still nothing after a retry');
   await page.close();
  }
  // French wording for the same states
  for(const [mode,state] of [['unavailable','unavailable'],['unverified-network','unverified']]){
   const page=await browser.newPage({viewport:{width:390,height:844}});await mock(page,mode);await recordNoPlan(page,'fr-'+mode,mode,state,'fr');await page.close();
  }
  // WITHDRAWAL MID-SESSION: the plan is on screen from a verified response; the next check says unavailable; everything disappears.
  for(const after of ['unavailable','review_required','abort']){
   const page=await browser.newPage({viewport:{width:390,height:844}});let n=0;
   await page.route(route,r=>{n++;if(n===1)return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(pub)});
     if(after==='abort')return r.abort();return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state:after})});});
   await record(page,'withdrawal-before-'+after,390,'en','live');
   assert.equal(await page.locator('#gridPlan .gp-row').count(),5);
   await page.locator('#refreshPlan').click();
   const expect=after==='abort'?'unverified':after;
   await page.waitForFunction(st=>document.querySelector('#planSource').dataset.sourceState===st,expect);
   assert.equal(await page.locator('#gridPlan .gp-row').count(),0,'withdrawal ('+after+') removes the grid');
   const visible=await page.locator('body').innerText();for(const x of DOSE_STRINGS)assert.ok(!visible.includes(x),'withdrawal ('+after+') removes "'+x+'"');
   assert.equal((await page.locator('[data-i="s2.p"]').innerText()).trim(),'');
   report.cases.push({name:'withdrawal-'+after,result:'Verified plan on screen, then removed on the next check'});console.log('PASS withdrawal-'+after);
   await page.close();
  }

  const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
  await localFiles(nojs);
  await nojs.goto(BASE+'/labs/the-two-curves/',{waitUntil:'domcontentloaded'});
  assert.equal(await nojs.locator('#gridPlan .gp-row').count(),0);
  const nojsText=await nojs.locator('body').innerText();
  for(const x of DOSE_STRINGS)assert.ok(!nojsText.includes(x),'no-JS page must not contain plan text "'+x+'"');
  assert.ok(nojsText.includes('Turn on JavaScript'),'no-JS visitors are told why no plan is shown');
  assert.ok(await nojs.locator('#history').isVisible());assert.equal(await nojs.locator('#refreshPlan').isVisible(),false);
  await nojs.locator('#plan').screenshot({path:path.join(OUT,'no-javascript-plan.png'),scale:'css'});
  report.cases.push({name:'no-javascript',result:'No plan content without script; the editorial study and historical evidence stay readable'});await nojs.close();
  const zoom=await browser.newPage({viewport:{width:768,height:1024}});await mock(zoom);await record(zoom,'zoom-base',768,'en');
  await zoom.addStyleTag({content:'body{zoom:2}'});
  await zoom.locator('#plan').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY));
  // Capture the viewport: Chromium can repeat tiles in full-section images
  // when CSS zoom creates a very tall clipping rectangle.
  await zoom.screenshot({path:path.join(OUT,'text-zoom-200.png'),scale:'css'});
  const zoomGeometry=await zoom.evaluate(()=>({viewport_px:innerWidth,document_width_px:document.documentElement.scrollWidth,plan_width_px:document.querySelector('#plan').getBoundingClientRect().width}));
  report.cases.push({name:'200-percent-css-zoom',result:'Plan viewport screenshot recorded; not a full-page zoom accessibility assertion',geometry:zoomGeometry});await zoom.close();
 }finally{await browser.close();}
 if(process.env.SIMON_QA_WEBKIT!=='0'){
  const webkit=await playwright.webkit.launch();
  try{const page=await webkit.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2});await mock(page);await record(page,'webkit-phone-fr',390,'fr','live',true);}finally{await webkit.close();}
 }else report.cases.push({name:'webkit',result:'Not run in this environment; browser binary unavailable'});
 report.result='passed';fs.writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
