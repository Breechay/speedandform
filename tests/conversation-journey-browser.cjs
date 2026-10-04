/* Buyer and partner conversations. Every request is locally served, mocked or
   blocked: this acceptance test never contacts an inquiry or analytics provider. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://speedandform.com';
const out=process.env.SF_QA_ARTIFACTS||'/tmp/sf-commercial-qa';
const surfaces=['/analysis/','/coaching/strength/','/contact','/form-house','/form-house/contact','/form-house/mornings/','/plans/'];
const conversations=['/contact','/form-house/contact','/coaching/strength/'];
const fixture={name:'QA Prospect',email:'prospect@example.invalid',message:'I want to talk about a useful next step.'};
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
 const engine=process.env.FORM_QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch(),context=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'});
 const submissions=[],errors=[],missing=[];
 let reply={status:503,success:true},timeoutRoutes=0;
 await context.addInitScript(()=>{
  // A local collector lets us inspect what would be measured, without a tag or
  // request. Shorten only the inquiry's exact deadline when a test enables it.
  window.dataLayer=[];
  const timer=window.setTimeout.bind(window),fetch=window.fetch.bind(window);
  window.setTimeout=function(callback,delay,...args){return timer(callback,window.__qaShortDeadline&&delay===12000?80:delay,...args)};
  window.fetch=function(input,options){
   const url=typeof input==='string'?input:input&&input.url;
   if(window.__qaShortDeadline&&/^https:\/\/formsubmit\.co\/ajax\//.test(url||'')&&options&&options.signal){
    options.signal.addEventListener('abort',()=>{window.__qaInquiryAborted=true},{once:true});
   }
   return fetch(input,options);
  };
 });
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname==='formsubmit.co'){
   assert.equal(req.method(),'POST','Only a deliberately mocked inquiry can reach the relay route');
   submissions.push({url:req.url(),body:req.postData()||'',contentType:req.headers()['content-type']||''});
   const current={...reply};
   if(current.timeout){
    timeoutRoutes++;
    // Bounded delay: the genuine fetch signal must abort before this reply.
    await pause(300);
    try{return await route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'})}catch(_){return}
   }
   return route.fulfill({status:current.status,contentType:'application/json',body:JSON.stringify({success:current.success})});
  }
  if(url.origin!==origin)return route.abort();
  let file=path.join(root,decodeURIComponent(url.pathname));
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=fs.existsSync(path.join(file,'index.html'))?path.join(file,'index.html'):file+'.html';
  if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){missing.push(url.pathname);return route.fulfill({status:404,body:'Missing local fixture'})}
  const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.json':'application/json','.ico':'image/x-icon','.mp4':'video/mp4'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({path:file,contentType:type});
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 async function visit(route){await page.goto(origin+route);await page.evaluate(()=>document.fonts.ready)}
 async function noOverflow(label){
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,60)}))}));
  if(dimensions.scroll>dimensions.width+1)await page.screenshot({path:path.join(out,'conversation-reflow-failure.png'),fullPage:true});
  assert.ok(dimensions.scroll<=dimensions.width+1,label+' '+JSON.stringify(dimensions));
 }
 const leadEvents=()=>page.evaluate(()=>window.dataLayer.filter(item=>item&&item.event==='generate_lead'));
 async function fill(form){
  await form.locator('[name="name"]').fill(fixture.name);
  await form.locator('[name="email"]').fill(fixture.email);
  await form.locator('[name="message"]').fill(fixture.message);
 }
 async function recovered(form,button,original){
  await form.locator('[data-inquiry-status],.status').getByRole('link',{name:'Email Brice',exact:true}).waitFor({state:'visible'});
  assert.equal(await form.locator('[name="name"]').inputValue(),fixture.name);
  assert.equal(await form.locator('[name="email"]').inputValue(),fixture.email);
  assert.equal(await form.locator('[name="message"]').inputValue(),fixture.message);
  assert.equal(await button.isEnabled(),true,'Rejected or timed-out send becomes usable');
  assert.equal(await button.innerText(),original,'Send label restored');
  assert.equal(await form.getAttribute('aria-busy'),null,'Busy state cleared');
  assert.equal(await form.locator('.done').count(),0,'No success UI for an unconfirmed send');
  const fallback=decodeURIComponent(await form.locator('.status a').getAttribute('href'));
  assert.ok(fallback.includes(fixture.message),'Email fallback carries the note');
  assert.doesNotMatch(fallback,/utm_|gclid|gbraid|wbraid|_honey|_replyto/,'Fallback omits tracking and provider fields');
 }

 // A customer with normal motion preferences must see the inquiry immediately.
 // Finishing an entrance animation cannot be a dependency for usable forms.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1440,height:900});
 for(const route of ['/analysis/','/coaching/strength/','/contact','/form-house/contact']){
  await visit(route);
  const form=page.locator(route==='/form-house/contact'?'#house-form':'.form-side form');
  const state=await form.evaluate(element=>{
   const style=getComputedStyle(element);
   return {opacity:style.opacity,animation:style.animationName,visibility:style.visibility};
  });
  assert.equal(state.opacity,'1',route+' inquiry is readable with normal motion preferences');
  assert.equal(state.animation,'none',route+' inquiry does not depend on an entrance animation');
  assert.equal(state.visibility,'visible',route+' inquiry is visible');
  assert.equal(await form.locator('[name="name"]').isVisible(),true,route+' name field is usable');
  assert.equal(await form.locator('[name="email"]').isVisible(),true,route+' email field is usable');
 }
 await page.emulateMedia({reducedMotion:'reduce'});

 // Each room keeps one focal heading and readable horizontal reflow. These are
 // local screenshots of the current source, not publication receipts.
 for(const width of [375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of surfaces){
   await visit(route);await noOverflow(route+' @ '+width);
   assert.equal(await page.locator('h1').count(),1,route+' has one focal heading');
   assert.equal(await page.locator('header .sf-brand').isVisible(),true,route+' public identity');
   if([390,1440].includes(width))await page.screenshot({path:path.join(out,'journey-'+route.replace(/^\/+|\/+$/g,'').replaceAll('/','-')+'-'+width+'.png'),fullPage:true});
  }
 }
 for(const route of ['/form-house/mornings/','/plans/']){
  await page.setViewportSize({width:390,height:900});await visit(route);
  await page.evaluate(()=>{
   const nodes=[...document.querySelectorAll('h1,h2,h3,p,a,label,input,textarea,button,span,strong,small,b,dt,dd,summary,li')];
   const sizes=nodes.map(element=>[element,parseFloat(getComputedStyle(element).fontSize)]);
   for(const [element,size]of sizes)element.style.setProperty('font-size',size*2+'px','important');
  });
  await noOverflow(route+' @ 390px / 200% text');
  await page.screenshot({path:path.join(out,'journey-'+route.replace(/^\/+|\/+$/g,'').replaceAll('/','-')+'-390-text-200.png'),fullPage:true});
 }
 await visit('/form-house/mornings/');
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,follow','Unbooked host concept stays intentional');
 assert.equal(await page.getByRole('link',{name:'Talk about hosting',exact:true}).getAttribute('href'),'/form-house/contact?experience=morning');
 assert.match(await page.locator('.detail').innerText(),/proposed experience/i,'Venue/date/access are still proposals');
 await visit('/form-house');assert.ok(await page.locator('a[href="/form-house/mornings/"]').count(),'FORM House leads to the morning concept');
 await visit('/plans/');
 assert.ok(await page.locator('a[href="/plans/race-pace-durability/"]').count(),'Plans leads to the actual preview');
 assert.ok(await page.locator('main').innerText().then(text=>text.includes('$79')),'Price stays visible on the shelf');

 // The gradient remains in the text-free screenshot. JSON is measured in CSS
 // pixels and paired with a 1x screenshot for conservative rendered contrast.
 for(const route of ['/analysis/','/coaching/strength/'])for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await visit(route);
  const intro=page.locator('.intro'),name='service-'+(route.startsWith('/analysis')?'analysis':'strength')+'-'+width;
  assert.equal(await intro.locator('.intro-image img').isVisible(),true,'Original practice photograph visible');
  await intro.screenshot({path:path.join(out,name+'.png')});
  const samples=await page.evaluate(()=>{
   const frame=document.querySelector('.intro').getBoundingClientRect(),copy=document.querySelector('.intro-copy'),result=[];
   const walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode()){
    if(!node.textContent.trim())continue;
    const style=getComputedStyle(node.parentElement);
    if(style.visibility==='hidden'||style.display==='none')continue;
    const range=document.createRange();range.selectNodeContents(node);
    const fontSize=parseFloat(style.fontSize),fontWeight=parseFloat(style.fontWeight)||400;
    for(const rectangle of range.getClientRects())if(rectangle.width&&rectangle.height)result.push({text:node.textContent.trim(),x:rectangle.x-frame.x,y:rectangle.y-frame.y,width:rectangle.width,height:rectangle.height,color:style.color,fontSize,fontWeight,large:fontSize>=24||(fontSize>=18.6667&&fontWeight>=700)});
   }
   return result;
  });
  assert.ok(samples.length>0,'Contrast captures contain real text');
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(samples));
  await page.locator('.intro-copy > *').evaluateAll(elements=>elements.forEach(element=>element.style.visibility='hidden'));
  await intro.screenshot({path:path.join(out,name+'-background.png')});
 }

 // Native constraint validation does not reject whitespace. Require meaningful
 // required fields, then prove both HTTP rejection and false receipt recovery.
 for(const route of conversations){
  await visit(route+'?utm_source=google&utm_medium=cpc&utm_campaign=conversation_qa&gclid=qa-click');
  const form=page.locator('form[data-conversation-inquiry]'),button=form.locator('button[type="submit"]');
  assert.equal(await form.count(),1,route+' uses the shared conversation contract');
  const original=await button.innerText(),before=submissions.length;
  await fill(form);await form.locator('[name="name"]').fill('   ');await button.click();
  assert.equal(submissions.length,before,'Whitespace name does not send');
  await form.locator('[name="name"]').fill(fixture.name);await form.locator('[name="message"]').fill(' \n ');await button.click();
  assert.equal(submissions.length,before,'Whitespace note does not send');
  assert.equal((await leadEvents()).length,0,'Invalid input is not a lead');
  await form.locator('[name="message"]').fill(fixture.message);
  reply={status:503,success:true};await button.click();await recovered(form,button,original);
  assert.equal(submissions.length,before+1,'HTTP failure produces one attempt');
  assert.equal((await leadEvents()).length,0,'HTTP failure is not a lead');
  reply={status:200,success:false};await button.click();await recovered(form,button,original);
  assert.equal(submissions.length,before+2,'False success receipt produces one attempt');
  assert.equal((await leadEvents()).length,0,'False provider receipt is not a lead');
  reply={status:200,success:true};
  await button.evaluate(element=>{element.click();element.click()});
  await form.locator('.done').waitFor({state:'visible'});
  assert.equal(submissions.length,before+3,'Double activation accepts exactly one retry');
  assert.match(await form.locator('.done').innerText(),/reply to prospect@example\.invalid/i);
  assert.match(await form.locator('.done').innerText(),/call|meet/i,'Reply opens the real next conversation');
  assert.equal(await form.getAttribute('aria-busy'),null);
  const events=await leadEvents();assert.equal(events.length,1,'Accepted send has one measured lead');
  assert.deepEqual(Object.keys(events[0]).sort(),['event','form_id','service','source_path']);
  const measured=JSON.stringify(events);
  for(const privateValue of Object.values(fixture))assert.ok(!measured.includes(privateValue),'No inquiry PII in the lead event');
  assert.match(submissions.at(-1).body,/google/,'Campaign context follows the outbound inquiry');

  await visit(route+'?form_qa=1');
  const qaForm=page.locator('form[data-conversation-inquiry]');await fill(qaForm);
  const qaBefore=submissions.length;await qaForm.locator('button[type="submit"]').click();
  assert.equal(submissions.length,qaBefore,'QA form never sends');
  assert.match(await qaForm.locator('.status').innerText(),/not sent/i);
  assert.equal((await leadEvents()).length,0,'QA does not generate a lead');
 }

 // Test a real AbortController deadline with only the deadline accelerated.
 // No 12-second blocking wait and no mocked success after an aborted request.
 await visit('/contact');
 const timedForm=page.locator('form[data-conversation-inquiry]'),timedButton=timedForm.locator('button[type="submit"]');
 const timedLabel=await timedButton.innerText();await fill(timedForm);
 await page.evaluate(()=>{window.__qaShortDeadline=true});reply={status:200,success:true,timeout:true};
 const timeoutBefore=submissions.length;await timedButton.click();await recovered(timedForm,timedButton,timedLabel);
 assert.equal(await page.evaluate(()=>window.__qaInquiryAborted),true,'Deadline actually aborts the fetch signal');
 assert.equal(submissions.length,timeoutBefore+1);assert.equal(timeoutRoutes,1);
 assert.equal((await leadEvents()).length,0,'Timeout is not a lead');
 await pause(350);assert.equal(await timedForm.locator('.done').count(),0,'Late mocked response cannot turn timeout into success');
 await page.evaluate(()=>{window.__qaShortDeadline=false});reply={status:200,success:true};
 await timedButton.click();await timedForm.locator('.done').waitFor({state:'visible'});
 assert.equal(submissions.length,timeoutBefore+2,'Recovered timeout has one usable retry');
 assert.equal((await leadEvents()).length,1);

 // Privacy controls suppress measurement without blocking the conversation.
 for(const privacy of ['doNotTrack','globalPrivacyControl']){
  await visit('/contact');await page.evaluate(key=>Object.defineProperty(navigator,key,{configurable:true,value:key==='doNotTrack'?'1':true}),privacy);
  const privateForm=page.locator('form[data-conversation-inquiry]');await fill(privateForm);
  await privateForm.locator('button[type="submit"]').click();await privateForm.locator('.done').waitFor({state:'visible'});
  assert.equal((await leadEvents()).length,0,privacy+' suppresses the lead event');
 }

 // A query parameter alone cannot announce an accepted attachment inquiry.
 await visit('/analysis/?sent=1&receipt=not-a-submission');
 assert.equal(await page.locator('#analysis-form [name="name"]').count(),1,'False URL receipt retains the form');
 assert.equal(await page.getByRole('heading',{name:'Submitted.',exact:true}).count(),0);
 assert.equal(new URL(page.url()).searchParams.has('sent'),false,'Unverified receipt removed from the address');
 const analysis=page.locator('#analysis-form'),analysisButton=analysis.locator('button[type="submit"]');
 await fill(analysis);
 const nativeBefore=submissions.length;
 await analysis.locator('[name="name"]').fill('   ');await analysisButton.click();
 assert.equal(submissions.length,nativeBefore,'Native whitespace name does not send');
 await analysis.locator('[name="name"]').fill(fixture.name);await analysis.locator('[name="message"]').fill(' \n ');await analysisButton.click();
 assert.equal(submissions.length,nativeBefore,'Native whitespace note does not send');
 await analysis.locator('[name="message"]').fill(fixture.message);
 await page.locator('#analysis-video').setInputFiles([
  {name:'clip-one.mp4',mimeType:'video/mp4',buffer:Buffer.alloc(6*1024*1024)},
  {name:'clip-two.mp4',mimeType:'video/mp4',buffer:Buffer.alloc(6*1024*1024)}
 ]);
 assert.match(await page.locator('#status').innerText(),/10 MB total/i,'Upload limit is aggregate');
 assert.equal(await page.locator('#analysis-video').evaluate(element=>element.validity.valid),false);
 await analysisButton.click();assert.equal(submissions.length,nativeBefore,'Oversized clips cannot post');
 assert.equal(await analysisButton.isEnabled(),true,'Oversized upload keeps a usable form');
 assert.equal(await analysis.locator('[name="message"]').inputValue(),fixture.message);
 await page.locator('#analysis-video').setInputFiles([]);
 assert.equal(await page.locator('#analysis-video').evaluate(element=>element.validity.valid),true,'Removing clips clears upload error');
 await page.locator('#analysis-video').setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('not a video')});
 assert.match(await page.locator('#status').innerText(),/Choose video files/i);
 await page.locator('#analysis-video').setInputFiles([]);

 // Observe the native handoff after its real submit handler without leaving the
 // local fixture. The provider itself is intentionally never exercised here.
 assert.equal((await analysis.getAttribute('method')).toLowerCase(),'post');
 assert.equal(await analysis.getAttribute('enctype'),'multipart/form-data');
 assert.match(await analysis.getAttribute('action'),/^https:\/\/formsubmit\.co\//);
 await analysis.evaluate(form=>form.addEventListener('submit',event=>{event.preventDefault();window.__qaNativeSubmission={next:form.querySelector('[name="_next"]').value,pending:JSON.parse(sessionStorage.getItem('sf-analysis-pending-v1')),replyTo:form.querySelector('[name="_replyto"]').value}}, {once:true}));
 await analysisButton.click();
 const handoff=await page.evaluate(()=>window.__qaNativeSubmission);
 assert.ok(handoff&&handoff.pending&&handoff.pending.token,'Native handoff owns a recent local receipt token');
 assert.deepEqual(Object.keys(handoff.pending).sort(),['at','token'],'Receipt storage contains no contact details');
 assert.equal(handoff.replyTo,fixture.email,'Provider reply goes to the submitted email');
 assert.equal(new URL(handoff.next).searchParams.get('receipt'),handoff.pending.token);
 assert.equal(submissions.length,nativeBefore,'Native handoff observation never sends');
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 assert.equal(await analysisButton.isEnabled(),true,'Back navigation resets native send state');
 await visit('/analysis/?sent=1&receipt='+encodeURIComponent(handoff.pending.token));
 assert.equal(await page.getByRole('heading',{name:'Submitted.',exact:true}).isVisible(),true,'Matching recent local receipt acknowledged');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('sf-analysis-pending-v1')),null,'Receipt consumed once');
 await visit('/analysis/?sent=1&receipt='+encodeURIComponent(handoff.pending.token));
 assert.equal(await page.locator('#analysis-form [name="name"]').count(),1,'Consumed receipt cannot announce a second success');
 await page.evaluate(()=>sessionStorage.setItem('sf-analysis-pending-v1',JSON.stringify({token:'expired-test',at:Date.now()-31*60*1000})));
 await visit('/analysis/?sent=1&receipt=expired-test');
 assert.equal(await page.locator('#analysis-form [name="name"]').count(),1,'Old receipt cannot announce success');
 await visit('/analysis/?form_qa=1');await fill(page.locator('#analysis-form'));
 const nativeQaBefore=submissions.length;await page.locator('#analysis-form button[type="submit"]').click();
 assert.equal(submissions.length,nativeQaBefore,'Native QA never sends');
 assert.match(await page.locator('#status').innerText(),/not sent/i);

 assert.deepEqual(errors,[],'No uncaught page errors');assert.deepEqual([...new Set(missing)],[],'Local resources resolve');
 fs.writeFileSync(path.join(out,'conversation-journey-receipt.json'),JSON.stringify({engine:process.env.FORM_QA_BROWSER||'chromium',routeWidthViews:42,fullPageCaptures:14,textReflowCaptures:2,serviceContrastCaptures:4,mockedRelayAttempts:submissions.length,liveWrites:0},null,2));
 await browser.close();
 console.log('PASS: 42 room/width views; morning and Plans 200% reflow; 14 full-page and four service photograph contrast captures; whitespace, HTTP/false-receipt, duplicate activation, retry, privacy and AbortController recovery; native Analysis aggregate 10MB guard, QA and one-use recent receipt. No live writes.');
})().catch(error=>{console.error(error);process.exit(1)});
