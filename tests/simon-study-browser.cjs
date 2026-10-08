'use strict';
// Browser acceptance against the committed, approved public projection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),BASE=(process.env.SIMON_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,''),OUT=process.env.SIMON_QA_OUTPUT||'/tmp/simon-study-qa';
const pub=JSON.parse(fs.readFileSync(path.join(ROOT,'labs/the-two-curves/published-plan.json'),'utf8'));
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
 await page.route(route,r=>mode==='saved'?r.abort():r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mode==='review_required'?{state:'review_required'}:pub)}));
}
async function record(page,name,width,lang,mode='live',screenshot=false){
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await localFiles(page);
 await page.goto(BASE+'/labs/the-two-curves/?lang='+lang+'&unit=km',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(state=>document.querySelector('#planSource')?.dataset.sourceState===state,mode,{timeout:20000});
 assert.equal(await page.locator('#gridPlan .gp-row').count(),5);
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

  const manual=await browser.newPage({viewport:{width:390,height:844}});let calls=0;
  const revised=structuredClone(pub);revised.payload.version.number++;revised.revision='SIMON-003-R'+revised.payload.version.number+'-20261008';
  revised.payload.version.summary='A refreshed description from the approved plan.';
  revised.payload.weeks[1].sessions.find(s=>s.day==='TUE').components.find(c=>c.role==='work').pace_low_seconds=371;
  await manual.route(route,r=>{calls++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(calls===1?pub:revised)});});
  await record(manual,'manual-refresh-before',390,'en');
  await manual.locator('#refreshPlan').click();await manual.waitForFunction(n=>document.querySelector('#planSource').textContent.includes('version '+n),revised.payload.version.number);
  assert.equal(calls,2);assert.equal(await manual.locator('[data-i="s2.p"]').innerText(),revised.payload.version.summary);
  assert.ok((await manual.locator('[data-i="pace.tuesday"]').first().innerText()).includes('3:51–3:52/km'));
  assert.ok((await manual.locator('#gridPlan .gp-row').nth(1).innerText()).includes('3:51–3:52/km'));
  report.cases.push({name:'manual-refresh',result:'Summary, cards and grid changed together from an approved test response'});await manual.close();

  for(const mode of ['saved','review_required']){
   const page=await browser.newPage({viewport:{width:390,height:844}});await mock(page,mode);await record(page,mode,390,'en',mode);
   const before=await page.locator('#gridPlan').innerText();await page.locator('#refreshPlan').click();
   await page.waitForFunction(state=>document.querySelector('#planSource').dataset.sourceState===state,mode);
   assert.equal(await page.locator('#gridPlan').innerText(),before);assert.equal(await page.locator('#refreshPlan').isDisabled(),false);
   await page.close();
  }
  const old=await browser.newPage({viewport:{width:390,height:844}});const earlier=structuredClone(pub);earlier.payload.version.number=4;
  await old.route(route,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(earlier)}));
  await record(old,'older-publication',390,'en','review_required');await old.close();

  const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
  await localFiles(nojs);
  await nojs.goto(BASE+'/labs/the-two-curves/',{waitUntil:'domcontentloaded'});
  assert.equal(await nojs.locator('#gridPlan .gp-row').count(),5);
  assert.ok((await nojs.locator('#plan').innerText()).includes('3:49–3:52/km'));
  assert.ok((await nojs.locator('#plan').innerText()).includes('6 × 20 sec relaxed strides'));
  assert.ok(await nojs.locator('#history').isVisible());assert.equal(await nojs.locator('#refreshPlan').isVisible(),false);
  await nojs.locator('#plan').screenshot({path:path.join(OUT,'no-javascript-plan.png'),scale:'css'});
  report.cases.push({name:'no-javascript',result:'Full saved block, all work components and historical evidence are readable'});await nojs.close();
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
