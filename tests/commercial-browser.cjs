/* Offline browser checks. Every request is fulfilled locally or explicitly mocked.
   Set PLAYWRIGHT_MODULE / CHROMIUM_PATH only when using an existing runtime. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://speedandform.com';
const routes=['/','/coaching/miami/','/coaching/strength/','/analysis/','/work/','/work/ai-setup/','/work/photo-video/'];
const artifacts=process.env.SF_QA_ARTIFACTS||'/tmp/sf-commercial-qa';fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const engine=process.env.FORM_QA_BROWSER==='webkit'?webkit:chromium;
 const options={headless:true};if(process.env.CHROMIUM_PATH&&engine===chromium){options.executablePath=process.env.CHROMIUM_PATH;options.args=['--no-sandbox','--single-process','--no-zygote'];}
 const browser=await engine.launch(options),context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
 let mode='reject',submissions=[],errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(u.pathname==='/rest/v1/rpc/submit_website_inquiry'){
   const data=request.postDataJSON();submissions.push(data);
   return route.fulfill({status:mode==='accept'?200:503,contentType:'application/json',body:JSON.stringify(mode==='accept'?{accepted:true,submission_id:data.p_submission_id,version:1}:{message:'Temporary failure'})});
  }
  if(u.origin!==origin)return route.abort();
  let f=path.join(root,decodeURIComponent(u.pathname));
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=fs.existsSync(path.join(f,'index.html'))?path.join(f,'index.html'):f+'.html';
  if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f+='.html';
  if(!fs.existsSync(f)){missing.push(u.pathname);return route.fulfill({status:404,body:'Missing'});}
  const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon'}[path.extname(f)]||'application/octet-stream';
  return route.fulfill({path:f,contentType:type});
 });
 for(const width of [375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of routes){
   await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready);
   const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(over,false,route+' overflow at '+width);
   assert.equal(await page.locator('h1').count(),1);
   assert.ok(await page.locator('header .sf-brand').isVisible());
   const button=page.locator(route==='/'?'.hero .begin':'.sf-hero .sf-button');
   assert.ok(await button.isVisible());
   if(route==='/'&&width<=430)assert.ok((await button.boundingBox()).y<650,'Home CTA is in first fold');
   if([390,1440].includes(width)&&['/','/coaching/miami/','/coaching/strength/','/work/photo-video/'].includes(route))
     await page.screenshot({path:path.join(artifacts,(route==='/'?'home':route.split('/').filter(Boolean).join('-'))+'-'+width+'.png')});
  }
 }
 if(process.env.SF_QA_BRAND_BUILD==='1'){
  for(const width of [390,1440])for(const route of ['/library','/strength','/plans/race-pace-durability/','/form/']){
   await page.setViewportSize({width,height:900});await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready);
   const mark=page.locator('.sf-brand').first();assert.ok(await mark.isVisible(),route+' built house identity');
   const box=await mark.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,route+' brand fits at '+width);
  }
 }
 // The plans are available before their methodology, with price and prerequisites together.
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/plans/');
  const plans=await page.locator('.plans').boundingBox(),method=await page.locator('.relationship').boundingBox();
  assert.ok(plans.y<method.y,'Plan selection precedes methodology');
  assert.ok((await page.locator('.plan[data-state=paid]').innerText()).includes('$79 full plan'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Plans fit at '+width);
 }
 // Specific package links carry the visible selection and keyboard focus into the form.
 await page.setViewportSize({width:390,height:900});
 for(const [route,choices] of [
  ['/coaching/miami/',[['both','Ask about Run + Strength'],['run','Ask about Run Development']]],
  ['/coaching/strength/',[['first','Ask about a first session']]]
 ]){
  await page.goto(origin+route);
  for(const [choice,label] of choices){
   await page.getByRole('link',{name:label+' →',exact:true}).click();
   assert.equal(await page.locator('input[name=program]:checked').inputValue(),choice);
   assert.equal(await page.evaluate(()=>document.activeElement.value),choice);
   const box=await page.locator('input[name=program]:checked').boundingBox();
   assert.ok(box.y>=0&&box.y+box.height<=900,'Selected offer is visible after '+label);
  }
  const manual=route.includes('strength')?'block':'remote';
  await page.locator('input[name=program][value='+manual+']').check();
  await page.locator('.sf-hero .sf-button').click();
  assert.equal(await page.locator('input[name=program]:checked').inputValue(),manual,'Neutral CTA preserves manual choice');
 }
 for(const route of routes.filter(r=>!['/','/work/'].includes(r))){
  await page.goto(origin+route);
  const anchor=await page.locator('.sf-hero .sf-text-link').getAttribute('href');
  assert.ok(anchor.startsWith('#'),'Hero comparison stays with this offer');
  assert.equal(await page.locator(anchor).count(),1,'Comparison has a real destination');
 }
 // Large type must remain accessible; no overflow hidden used to conceal it.
 await page.setViewportSize({width:390,height:900});await page.goto(origin+'/coaching/strength/');
 await page.evaluate(()=>{const styles=[...document.querySelectorAll('h1,h2,h3,p,a,label,legend,input,textarea,select,button,summary,li,dt,dd,.sf-price')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);styles.forEach(([e,size])=>e.style.setProperty('font-size',size*2+'px','important'));});
 const textOverflow=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1, nodes:[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.right>innerWidth+1;}).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,80)}))}));
 if(textOverflow.overflow){
  console.log('REFLOW DIAGNOSTIC',await page.evaluate(()=>({viewport:innerWidth,root:document.documentElement.scrollWidth,body:document.body.scrollWidth,internal:[...document.querySelectorAll('body *')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,cls:e.className,client:e.clientWidth,scroll:e.scrollWidth,text:e.textContent.slice(0,90)})).slice(-25)})));
  await page.screenshot({path:path.join(artifacts,'strength-enlarged-failure.png'),fullPage:true});
 }
 assert.equal(textOverflow.overflow,false,'200% text reflows: '+JSON.stringify(textOverflow.nodes));
 // Real form code, rejected receipt, retained values, then accepted retry.
 await page.goto(origin+'/coaching/strength/?utm_source=google&utm_medium=cpc&utm_campaign=strength_test');
 await page.locator('#inquiry-name').fill('QA Example');await page.locator('#inquiry-email').fill('qa@example.invalid');
 await page.locator('#inquiry-location').fill('Edgewater, example gym');await page.locator('#inquiry-goal').fill('I want consistent strength training.');
 await page.locator('.sf-form [type=submit]').click();await page.waitForSelector('.sf-form-status[data-state=error]');
 assert.equal(await page.locator('#inquiry-name').inputValue(),'QA Example');
 assert.ok((await page.locator('.sf-form-status a').getAttribute('href')).includes('qa%40example.invalid'));
 const before=await page.evaluate(()=>window.dataLayer.filter(x=>x[1]==='generate_lead').length);assert.equal(before,0);
 mode='accept';await page.locator('.sf-form [type=submit]').click();await page.waitForSelector('.sf-form-status[data-state=received]');
 assert.equal(submissions.length,2);assert.equal(submissions[0].p_submission_id,submissions[1].p_submission_id);
 assert.equal(submissions[1].p_payload.offer,'strength');assert.equal(submissions[1].p_payload.utm_source,'google');
 assert.equal(await page.evaluate(()=>window.dataLayer.filter(x=>x[1]==='generate_lead').length),1);
 assert.ok(await page.locator('.sf-form [type=submit]').isDisabled());
 const measurement=await page.evaluate(()=>JSON.stringify(window.dataLayer));assert.ok(!measurement.includes('qa@example')&&!measurement.includes('Edgewater'));
 // Visible package choices preserve first-session and remote offer routing.
 for(const [route,choice,expected,label] of [['/coaching/strength/','first','strength-first','Ask about a first session'],['/coaching/miami/','both','both','Ask about Run + Strength'],['/coaching/miami/','remote','remote',null]]){
  await page.goto(origin+route);
  if(label)await page.getByRole('link',{name:label+' →',exact:true}).click();
  else await page.locator('input[name=program][value='+choice+']').check();
  await page.locator('#inquiry-name').fill('Choice QA');await page.locator('#inquiry-email').fill('choice@example.invalid');
  await page.locator('#inquiry-location').fill('Miami');await page.locator('#inquiry-goal').fill('Please explain the selected coaching option.');
  await page.locator('.sf-form [type=submit]').click();await page.waitForSelector('.sf-form-status[data-state=received]');
  assert.equal(submissions.at(-1).p_payload.offer,expected);
 }
 // Existing running intake still completes with the new receiver.
 await page.goto(origin+'/');await page.locator('[data-key=goal] .opt').first().click();
 for(const k of ['days','vol','long'])await page.locator('[data-key='+k+'] .opt').first().click();
 await page.locator('#runningNext').click();await page.locator('[data-key=city] .opt').first().click();
 await page.locator('#em').fill('runner@example.invalid');await page.locator('#nm').fill('Running QA');
 await page.locator('[data-q="2"] [data-next]').click();await page.locator('#sendBtn').click();await page.waitForSelector('#p-done.on');
 assert.equal(submissions.at(-1).p_payload.offer,'run');assert.ok(submissions.at(-1).p_payload.message.includes('Goal'));
 // Privacy suppresses measurement, not operational delivery.
 await page.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
 await page.goto(origin+'/analysis/');assert.equal(await page.evaluate(()=>typeof window.gtag),'undefined');
 // Explicit QA must never create a live record even if a caller invokes the receiver.
 const n=submissions.length;await page.goto(origin+'/analysis/?form_qa=1');
 assert.equal(await page.evaluate(()=>window.sfSubmitInquiry({offer:'analysis'}).then(()=>false,()=>true)),true);assert.equal(submissions.length,n);
 assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: 42 responsive service views; plans order/reflow; package link selection, focus and delivery; 200% type; submission failure, retry, idempotent ID, running intake, accepted-only measurement, privacy, QA write block. No live messages or records.');
})().catch(error=>{console.error(error);process.exit(1)});
