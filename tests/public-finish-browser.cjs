/* Current public journey. All network traffic is locally served or mocked.
   Protect readable folds, reflow, dated facts and the real inquiry state machine. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://speedandform.com';
const out=process.env.SF_QA_ARTIFACTS||'/tmp/sf-commercial-qa';
const routes=['/','/analysis/','/coaching/strength/','/contact','/form-house','/form-house/contact','/thursday','/form/'];
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const engine=process.env.FORM_QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch(),context=await browser.newContext({reducedMotion:'reduce'});
 let accept=false,submissions=[],errors=[],missing=[];
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.pathname==='/rest/v1/collective_public_runs')return route.fulfill({contentType:'application/json',body:JSON.stringify([{title:'Track Thursday',starts_at:new Date(Date.now()+86400000).toISOString(),meet_at:new Date(Date.now()+85500000).toISOString(),meet_name:'Flamingo Park Track',meet_address:'11 St & Jefferson Ave',group_facts:{level:'All levels',meet_point:'Bench by the bleachers'},status:'scheduled'}])});
  if(u.pathname==='/rest/v1/rpc/submit_website_inquiry'){
   const data=req.postDataJSON();submissions.push(data);
   return route.fulfill({status:accept?200:503,contentType:'application/json',body:JSON.stringify(accept?{accepted:true,submission_id:data.p_submission_id,version:1}:{message:'Temporary failure'})});
  }
  if(u.origin!==origin)return route.abort();
  let f=path.join(root,decodeURIComponent(u.pathname));
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=fs.existsSync(path.join(f,'index.html'))?path.join(f,'index.html'):f+'.html';
  if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f+='.html';
  if(!fs.existsSync(f)){missing.push(u.pathname);return route.fulfill({status:404,body:'Missing'});}
  const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.ico':'image/x-icon'}[path.extname(f)]||'application/octet-stream';
  return route.fulfill({path:f,contentType:type});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const noOverflow=async(label)=>{
  const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,70)})).slice(0,12)}));
  if(state.scroll>state.width+1)await page.screenshot({path:path.join(out,'reflow-failure.png'),fullPage:true});
  assert.ok(state.scroll<=state.width+1,label+' '+JSON.stringify(state));
 };
 for(const width of [375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of routes){
   await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready);
   await noOverflow(route+' @ '+width);
   assert.equal(await page.locator('h1').count(),1,route+' has one focal heading');
   assert.ok(await page.locator('header .sf-brand').isVisible(),route+' home door');
   if([390,1440].includes(width))await page.screenshot({path:path.join(out,(route.replaceAll('/','-').replace(/^-|-$/g,'')||'home')+'-'+width+'.png'),fullPage:true});
  }
 }
 // The photograph has one owned shade; inherited legacy gradients must not stack.
 // Save text-free backgrounds and text geometry for rendered contrast review.
 for(const [width,height]of [[390,844],[1440,800],[1920,1080]]){
  await page.setViewportSize({width,height});await page.goto(origin+'/');await page.evaluate(()=>document.fonts.ready);
  const finish=await page.evaluate(()=>({overlay:getComputedStyle(document.querySelector('.sf-home-hero-immersive'),'::before').content,bottom:parseFloat(getComputedStyle(document.querySelector('.home-hero-immersive-inner')).paddingBottom)}));
  assert.equal(finish.overlay,'none','No inherited shade over the current photograph');
  assert.ok(finish.bottom>=42,'The opening facts have deliberate bottom space');
  await noOverflow('Home photograph @ '+width+'x'+height);
  const name='home-hero-'+width+'x'+height;
  await page.locator('.sf-home-hero-immersive').screenshot({path:path.join(out,name+'.png')});
  const samples=await page.evaluate(()=>{
   const hero=document.querySelector('.sf-home-hero-immersive').getBoundingClientRect(),result=[];
   for(const e of document.querySelectorAll('.hero-kicker,h1,.home-hero-intro,.home-proof-facts dt,.home-proof-facts dd,.home-contact')){
    const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);const style=getComputedStyle(node.parentElement);
     for(const r of range.getClientRects())if(r.width&&r.height)result.push({text:node.textContent.trim(),x:r.x-hero.x,y:r.y-hero.y,width:r.width,height:r.height,color:style.color,large:parseFloat(style.fontSize)>=24});
    }
   }return result;
  });
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(samples));
  await page.locator('.hero-copy').evaluate(e=>e.style.visibility='hidden');
  await page.locator('.header').evaluate(e=>e.style.visibility='hidden');
  await page.locator('.sf-home-hero-immersive').screenshot({path:path.join(out,name+'-background.png')});
 }
 // Every fold is readable even without arrival/observer classes.
 await page.goto(origin+'/');
 assert.equal(await page.locator('.home-evidence-result dt').first().innerText(),'6 miles');
 for(const selector of ['.hero-copy','.home-entry h2','.home-evidence h2','.home-also-grid','.intake-copy']){
  assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).opacity),'1',selector+' never hidden');
 }
 assert.ok(await page.getByRole('link',{name:/Follow the study/}).isVisible());
 assert.equal(await page.locator('.home-entry-grid a').first().getAttribute('href'),'#begin');
 // Keyboard service selection, a full inquiry, rejection, retained answer, accepted retry.
 await page.goto(origin+'/?utm_source=google&utm_medium=cpc&utm_campaign=qa');
 await page.locator('#coachingChoiceTrigger').focus();await page.keyboard.press('Enter');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#coachingChoiceTrigger').getAttribute('aria-expanded'),'false');
 await page.locator('[data-key=goal] .opt').filter({hasText:'Run longer'}).click();
 await page.locator('[data-key=days] .opt').filter({hasText:/^3$/}).click();
 await page.locator('[data-key=vol] .opt').filter({hasText:'10–20 mi'}).click();
 await page.locator('[data-key=long] .opt').filter({hasText:'4–6 mi'}).click();
 await page.locator('#runningNext').click();
 await page.locator('[data-key=city] .opt').filter({hasText:/^Miami$/}).click();
 await page.locator('#em').fill('qa@example.invalid');await page.locator('#nm').fill('QA Example');
 await page.locator('[data-q="2"] [data-next]').click();
 await page.locator('#sendBtn').click();await page.locator('#sendErr').waitFor({state:'visible'});
 assert.ok(await page.locator('#rRows').innerText().then(s=>s.includes('qa@example.invalid')));
 assert.equal(submissions.length,1,'One request on first send');
 accept=true;await page.locator('#sendBtn').click();await page.locator('#p-done').waitFor({state:'visible'});
 assert.equal(submissions.length,2);assert.equal(submissions[0].p_submission_id,submissions[1].p_submission_id,'Retry keeps the same request identity');
 assert.equal(submissions[1].p_payload.utm_source,'google');
 // The existing upload limits are material product information.
 await page.goto(origin+'/analysis/');assert.equal(await page.locator('#analysis-video').getAttribute('accept'),'video/*');
 assert.match(await page.locator('.upload-meta').innerText(),/10 MB/);
 // Home and conversation pages reflow at 200% text rather than clipping.
 for(const route of routes.filter(r=>r!=='/form/')){
  await page.setViewportSize({width:390,height:900});await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('h1,h2,h3,p,a,label,input,textarea,button,span,strong,dt,dd')];const sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size]of sizes)e.style.setProperty('font-size',size*2+'px','important');});
  await noOverflow(route+' 200% text');
 }
 // Real confirmed gathering remains separate from an unpublished workout.
 await page.goto(origin+'/thursday');await page.evaluate(()=>window.FORM_THURSDAY_READY);
 assert.equal(await page.locator('#thu-gathering-status').innerText(),'Gathering confirmed');
 assert.equal(await page.locator('#thu-session-name').innerText(),'Workout to be confirmed');
 assert.deepEqual(errors,[],'No uncaught page errors');assert.deepEqual([...new Set(missing)],[],'Local resources resolve');
 await browser.close();
 console.log('PASS: 48 route/width views, 16 full-page captures, three photograph aspect ratios with contrast-review captures, readable folds, keyboard selection, inquiry reject/retry/receipt, upload limits, 200% reflow and gathering/workout separation. No live writes.');
})().catch(e=>{console.error(e);process.exit(1);});
