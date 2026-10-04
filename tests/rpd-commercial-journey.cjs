/* Real page code with synthetic purchases/auth and locally intercepted assets.
   No external checkout, email, account or entitlement is created. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://speedandform.com';
const out=process.env.SF_QA_ARTIFACTS||'/tmp/sf-commercial-qa';fs.mkdirSync(out,{recursive:true});
const plan=full=>({plan:{slug:'race-pace-durability',name:'Race Pace Durability',discipline:'half_marathon'},running:{starts_on:'2026-08-24',race_on:'2026-12-05'},version:{number:1,cut_at:'2026-09-01'},weeks:Array.from({length:15},(_,i)=>({week_number:i+1,total_distance:full||i<4?45:null,sessions:full||i<4?['MON','TUE','WED','THU','FRI','SAT'].map(day=>({day,label:'SYNTHETIC W'+(i+1)+' '+day,title:'Synthetic fixture only',distance:6,components:[]})):[]}))});
const SDK=`export const supabase={auth:{getSession:async()=>({data:{session:window.__rpdAuth||null},error:null}),getUser:async()=>({data:{user:window.__rpdAuth?.user},error:null}),onAuthStateChange:()=>({}),signInWithOtp:async value=>{window.__rpdOtp=value;return {error:window.__rpdOtpError?{message:window.__rpdOtpError}:null}}},rpc:async()=>({data:0,error:null})};`;
(async()=>{
 const browser=await(process.env.FORM_QA_BROWSER==='webkit'?webkit:chromium).launch();let checks=0;
 const check=(value,message)=>{assert.ok(value,message);checks++;};
 async function make({full=false,blocked=false,auth=null,pending=0,reject=false,restoreMissing=false,campaignBlocked=false,privacy=false,now='2026-09-17T12:00:00-04:00',holdPreview=false}={}){
  const ctx=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),requests=[],errors=[],missing=[];let verifies=0;
  let previewArrived,releasePreview;
  const previewWaiting=new Promise(resolve=>{previewArrived=resolve;});
  const previewHold=new Promise(resolve=>{releasePreview=resolve;});
  await ctx.addInitScript(({blocked,auth,campaignBlocked,privacy,now})=>{
   const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}};
   window.__rpdAuth=auth;
   if(auth)localStorage.setItem('form-private-auth',JSON.stringify(auth));
   if(blocked||campaignBlocked){const write=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){if((blocked&&this===localStorage)||campaignBlocked)throw Error('Synthetic storage restriction');return write.apply(this,args);};}
   if(privacy)Object.defineProperty(navigator,'globalPrivacyControl',{value:true});
  },{blocked,auth,campaignBlocked,privacy,now});
  await ctx.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.pathname==='/private/supabase-client.js')return route.fulfill({contentType:'text/javascript',body:SDK});
   if(u.hostname==='buy.stripe.com')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic checkout destination</title><p>Local checkout boundary only.</p>'});
   if(u.hostname==='pbgsjjegycacodiltbhn.supabase.co'){
    const body=req.postDataJSON();requests.push({path:u.pathname,body});
    if(u.pathname.endsWith('public_plan_preview')){previewArrived();if(holdPreview)await previewHold;return route.fulfill({contentType:'application/json',body:JSON.stringify(plan(false))});}
    if(u.pathname.endsWith('rpd_account_access'))return route.fulfill({contentType:'application/json',body:JSON.stringify({schema:1,user_id:auth?.user.id,mode:full?'purchased':'preview',entitled:full,workspace:'account',plan:body.p_include_plan&&full?plan(true):null})});
    if(u.pathname.endsWith('rpd-entitlement')){
     if(body.action==='verify')verifies++;
     const refused=reject||body.action==='restore'&&restoreMissing,waiting=body.action==='verify'&&verifies<=pending;
     return route.fulfill({status:refused?(body.action==='restore'&&restoreMissing?404:403):waiting?425:200,contentType:'application/json',body:JSON.stringify(refused||waiting?{}:{ok:true,status:'paid',purchase_id:'synthetic-purchase',session_id:'cs_synthetic_fixture',...(body.action==='plan'?{plan:plan(true)}:{})})});
    }
    throw Error('Unexpected synthetic API route '+u.pathname);
   }
   if(u.origin!==origin)return route.abort();
   let f=path.join(root,decodeURIComponent(u.pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f+='.html';
   if(!fs.existsSync(f)){missing.push(u.pathname);return route.fulfill({status:404,body:'Missing'});}
   const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.ico':'image/x-icon'}[path.extname(f)]||'application/octet-stream';
   return route.fulfill({path:f,contentType:type});
  });
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  return{ctx,page,requests,errors,missing,verifies:()=>verifies,setReject:value=>{reject=value;},previewWaiting,releasePreview};
 }
 const noOverflow=async(page,label)=>{
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].map(node=>{const r=node.getBoundingClientRect();return{tag:node.tagName,class:node.className,left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),text:(node.textContent||'').trim().slice(0,64)};}).filter(node=>node.right>innerWidth+1||node.left<0).slice(0,18)}));
  if(layout.scroll>layout.width+1){
   fs.writeFileSync(path.join(out,'rpd-reflow-failure.json'),JSON.stringify({label,...layout},null,2));
   await page.screenshot({path:path.join(out,'rpd-reflow-failure.png'),fullPage:true});
   console.error('RPD reflow failure:',JSON.stringify({label,...layout}));
  }
  check(layout.scroll<=layout.width+1,label+' reflows');
 };
 const shareVisibleWeek=async(page,label)=>{
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__rpdShared=data;}}));
  await page.locator('#shareMobile').click();await page.waitForFunction(()=>Boolean(window.__rpdShared));
  const result=await page.evaluate(()=>({shared:window.__rpdShared,visible:Number(document.querySelector('#range').textContent.match(/\d+/)[0])}));
  const url=new URL(result.shared.url);
  check(Number(url.searchParams.get('week'))===result.visible,label+' shares its visible week');
  check(!['purchase_session','session_id','state','token','code','access_token','refresh_token'].some(key=>url.searchParams.has(key)),label+' share contains no private access reference');
 };
 const readFreeWeeks=async(page)=>{
  check(await page.locator('#range').innerText()==='01 / 15','A fresh phone preview begins at Week1');
  for(const week of [1,2,3,4]){
   if(week>1){await page.locator('#next').click();await page.waitForFunction(week=>Number(document.querySelector('#range').textContent.match(/\d+/)[0])===week,week);}
   check((await page.locator('#curSheet').innerText()).includes('SYNTHETIC W'+week+' '),'Free Week'+week+' prescription can be read before purchase');
  }
 };
 let e=await make({holdPreview:true});
 await e.page.goto(origin+'/plans/race-pace-durability/',{waitUntil:'commit'});await e.previewWaiting;await e.page.locator('#rpdLoading').waitFor();await e.page.evaluate(()=>document.fonts.ready);
 check(await e.page.locator('#rpdLoading').isVisible(),'Held preview announces loading before plan data arrives');
 check(await e.page.locator('#dev').getAttribute('hidden')!==null&&!(await e.page.locator('#dev').isVisible()),'Prototype controls remain statically hidden while preview RPC is unresolved');
 check(await e.page.locator('#dev').evaluate(node=>getComputedStyle(node).display)==='none','Hidden prototype controls override authored flex display');
 check(!(await e.page.locator('body').innerText()).includes('W3 · Build'),'Loading public page exposes no implementation-state labels');
 e.releasePreview();await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false');
 check(await e.page.locator('#dev').count()===0,'Published viewer removes prototype controls after plan resolves');
 check(e.errors.length===0,'Held preview resolves without an uncaught error');await e.ctx.close();
 e=await make();
 const commercial=['/plans/race-pace-durability/support/','/plans/race-pace-durability/thanks/','/plans/race-pace-durability/access/'];
 for(const width of [375,390,430,768,1024,1440]){
  await e.page.setViewportSize({width,height:900});
  for(const route of commercial){await e.page.goto(origin+route);await e.page.evaluate(()=>document.fonts.ready);await noOverflow(e.page,route+' '+width);check(await e.page.locator('h1').count()===1,route+' has one heading');if([390,1440].includes(width))await e.page.screenshot({path:path.join(out,'rpd-'+route.split('/').filter(Boolean).at(-1)+'-'+width+'.png'),fullPage:true});}
 }
 for(const route of commercial){await e.page.setViewportSize({width:390,height:900});await e.page.goto(origin+route);await e.page.evaluate(()=>document.fonts.ready);await e.page.evaluate(()=>{const nodes=[...document.querySelectorAll('h1,h2,h3,p,a,label,input,button,span,strong,summary')];const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const[n,size]of sizes)n.style.setProperty('font-size',size*2+'px','important');});await noOverflow(e.page,route+' 200% text');}
 await e.page.goto(origin+'/plans/race-pace-durability/support/?utm_source=google&utm_medium=cpc&utm_campaign=synthetic_plan_test&utm_content=proof');await e.page.locator('[data-rpd-checkout]').first().click();await e.page.waitForURL('https://buy.stripe.com/**');const checkout=new URL(e.page.url());check(checkout.pathname==='/bJeaEX1YvfNwgMX3Doffy00','Purchase goes to exact approved payment link');check(checkout.searchParams.get('utm_source')==='google','Google source survives checkout');check(checkout.searchParams.get('client_reference_id').includes('c_synthetic_plan_test'),'Campaign is carried into checkout reference');
 await e.page.goto(origin+'/plans/race-pace-durability/');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false');check(!(await e.page.locator('#track').innerText()).includes('SYNTHETIC W5'),'Public preview never contains paid prescription');check(await e.page.locator('#rpdPreviewNote').isVisible(),'Preview gives prerequisite and recovery');await shareVisibleWeek(e.page,'Public preview');await readFreeWeeks(e.page);await e.page.locator('#next').click();await e.page.waitForURL(url=>url.pathname==='/plans/race-pace-durability/support/');check(e.page.url().includes('/support/'),'Week five routes to purchase');check(new URL(e.page.url()).searchParams.get('utm_campaign')==='synthetic_plan_test','Preview-to-purchase preserves campaign');check(e.errors.length===0,'Public offer/preview has no uncaught error');check(e.missing.length===0,'Commercial local assets resolve');await e.ctx.close();
 // October is already beyond the free training weeks on the published calendar.
 // A new visitor still receives the beginning; paid/shared views retain theirs.
 for(const width of [390,1024,1440]){
  e=await make({now:'2026-10-04T12:00:00-04:00'});await e.page.setViewportSize({width,height:900});await e.page.goto(origin+'/plans/race-pace-durability/');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false');
  check(Number((await e.page.locator('#range').innerText()).match(/\d+/)[0])===1,'Late-calendar default preview starts at Week1 at '+width);
  if(width===390)await readFreeWeeks(e.page);else{const content=await e.page.locator('#curSheet').innerText();for(const week of [1,2,3,4])check(content.includes('SYNTHETIC W'+week+' '),'Late-calendar desktop shows free Week'+week+' at '+width);check(await e.page.locator('#curSheet .rpd-lock').count()>0,'Later desktop columns remain locked');}
  check(!(await e.page.locator('#track').innerText()).includes('SYNTHETIC W5'),'Late-calendar preview contains no paid Week5 prescription');check(e.errors.length===0,'Late-calendar preview has no uncaught error');await e.page.screenshot({path:path.join(out,'rpd-preview-late-'+width+'.png'),fullPage:true});await e.ctx.close();
 }
 for(const week of [3,5,12]){
  e=await make({now:'2026-10-04T12:00:00-04:00'});await e.page.goto(origin+'/plans/race-pace-durability/?week='+week);await e.page.waitForFunction(week=>document.documentElement.dataset.rpdEntitled==='false'&&Number(document.querySelector('#range').textContent.match(/\d+/)[0])===week,week);
  check(Number((await e.page.locator('#range').innerText()).match(/\d+/)[0])===week,'Late-calendar explicit Week'+week+' keeps its shared view');
  check((await e.page.locator('#curSheet').innerText()).includes('SYNTHETIC W'+week+' ')===(week<=4),'Shared Week'+week+' exposes prescription only inside free preview');await e.ctx.close();
 }
 for(const width of [390,1024]){
  e=await make({now:'2026-10-04T12:00:00-04:00',full:true,auth:{user:{id:'synthetic-buyer'},access_token:'synthetic-token'}});await e.page.setViewportSize({width,height:900});await e.page.goto(origin+'/plans/race-pace-durability/');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='true');
  check(Number((await e.page.locator('#range').innerText()).match(/\d+/)[0])===6,'Entitled calendar remains at Week6 on October4 at '+width);check((await e.page.locator('#curSheet').innerText()).includes('SYNTHETIC W6 '),'Entitled calendar preserves its current prescription');await e.ctx.close();
 }
 e=await make();await e.page.goto(origin+'/plans/race-pace-durability/?week=5');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false'&&document.querySelector('#range').textContent.includes('05'));await e.page.locator('#curSheet .rpd-mobile-lock').waitFor();check(!(await e.page.locator('#track').innerText()).includes('SYNTHETIC W5'),'Shared paid week is redacted without verified access');await shareVisibleWeek(e.page,'Locked shared week');await e.ctx.close();
 for(const campaignBlocked of [false,true]){
  e=await make({campaignBlocked,privacy:true});await e.page.goto(origin+'/?utm_source=google&utm_medium=cpc&utm_campaign=synthetic_home_plan&utm_content=proof');await e.page.waitForFunction(()=>typeof window.sfCampaignSource==='function');
  await e.page.locator('a[href="/plans/"]').first().click();await e.page.waitForURL('**/plans/?*');check(new URL(e.page.url()).searchParams.get('utm_campaign')==='synthetic_home_plan','Homepage campaign reaches Plans');
  await e.page.locator('a[href^="/plans/race-pace-durability/"]').first().click();await e.page.waitForURL('**/race-pace-durability/**');
  if(!new URL(e.page.url()).pathname.endsWith('/support/')){await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false');await e.page.locator('#pdfMobile').click();await e.page.waitForURL('**/support/?*');}
  check(await e.page.evaluate(()=>window.rpdSource().utm_campaign)==='synthetic_home_plan','Homepage→Plans→RPD keeps original campaign');check(await e.page.evaluate(()=>!document.querySelector('script[data-rpd-ga]')),'GPC suppresses external analytics throughout first-party handoff');
  await e.page.locator('[data-rpd-checkout]').first().click();await e.page.waitForURL('https://buy.stripe.com/**');check(new URL(e.page.url()).searchParams.get('utm_campaign')==='synthetic_home_plan','Full homepage journey reaches checkout with campaign, including blocked storage');await e.ctx.close();
 }
 e=await make({full:true,blocked:true,pending:2});await e.page.goto(origin+'/plans/race-pace-durability/thanks/?session_id=cs_synthetic_fixture');await e.page.locator('#purchaseStatus[data-state=verified]').waitFor();check(e.verifies()===3,'Pending purchase verifies after two delivery delays');check(await e.page.locator('#openPlan').isVisible(),'Paid action waits for verification');check(!e.page.url().includes('session_id='),'Verified return URL is cleaned before analytics');check(await e.page.evaluate(()=>!JSON.stringify(window.dataLayer||[]).includes('cs_synthetic_fixture')),'Checkout bearer stays out of GA4 payloads');await e.page.locator('#openPlan').click();await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='true');check(e.page.url().includes('purchase_session='),'Blocked storage retains private access reference');check(await e.page.evaluate(()=>!document.querySelector('script[data-rpd-ga]')),'Blocked-storage paid viewer does not initialize analytics');check(await e.page.locator('.rpd-print-choices a').count()===2,'Paid viewer exposes both print editions');check(!(await e.page.locator('body').innerText()).includes('$79'),'Paid viewer contains no new purchase pitch');await shareVisibleWeek(e.page,'Verified paid viewer');await e.page.locator('#next').click();await e.page.waitForFunction(()=>document.querySelector('#range').textContent.includes('05'));check((await e.page.locator('#curSheet').innerText()).includes('SYNTHETIC W5'),'Verified paid viewer can navigate full training');await e.page.locator('.rpd-print-choices a').first().click();await e.page.locator('.page').first().waitFor();check(e.page.url().includes('purchase_session='),'Print edition retains verified reference with blocked storage');check((await e.page.locator('#edition').innerText()).includes('SYNTHETIC W15'),'Paid print includes all fifteen weeks');await e.page.screenshot({path:path.join(out,'rpd-print-light-paid.png'),fullPage:true});await e.page.getByRole('link',{name:'Dark',exact:true}).click();await e.page.locator('.page').first().waitFor();check(await e.page.locator('html').getAttribute('data-print-theme')==='dark','Print theme switch preserves paid access');await e.page.screenshot({path:path.join(out,'rpd-print-dark-paid.png'),fullPage:true});check(e.errors.length===0,'Complete paid delivery has no uncaught error');await e.ctx.close();
 e=await make({reject:true});await e.page.goto(origin+'/plans/race-pace-durability/thanks/?session_id=cs_synthetic_fixture');await e.page.locator('#purchaseStatus[data-state=failed]').waitFor();check(!(await e.page.locator('#openPlan').isVisible()),'Rejected entitlement never exposes full plan');check(await e.page.locator('#retryPurchase').isVisible(),'Unconfirmed purchase offers retry');e.setReject(false);await e.page.locator('#retryPurchase').click();await e.page.locator('#purchaseStatus[data-state=verified]').waitFor();check(await e.page.locator('#openPlan').isVisible(),'Explicit retry recovers confirmed access');await e.ctx.close();
 e=await make({full:true,blocked:true,auth:{user:{id:'synthetic-buyer'},access_token:'synthetic-token'}});await e.page.goto(origin+'/plans/race-pace-durability/access/');await e.page.waitForURL('**/race-pace-durability/?purchase_session=*');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='true');check(e.requests.some(r=>r.body.action==='restore'),'Verified sign-in restores paid purchase');check(await e.page.locator('.rpd-print-choices').isVisible(),'Restored buyer receives print delivery');await e.ctx.close();
 e=await make({auth:{user:{id:'synthetic-other'},access_token:'synthetic-token'},restoreMissing:true});await e.page.goto(origin+'/plans/race-pace-durability/access/');await e.page.locator('#accessStatus[data-state=error]').waitFor();check((await e.page.locator('#accessStatus').innerText()).includes('No purchase was found'),'Different signed-in email has an actionable recovery state');check(await e.page.locator('#accessButton').isEnabled(),'Different email can request checkout address link');await e.ctx.close();
 e=await make({auth:{user:{id:'synthetic-other'},access_token:'synthetic-token'}});await e.page.goto(origin+'/plans/race-pace-durability/?purchase_session=cs_synthetic_fixture');await e.page.waitForFunction(()=>document.documentElement.dataset.rpdEntitled==='false');check(!e.requests.some(r=>r.path.endsWith('rpd-entitlement')),'Unrelated signed-in account cannot borrow checkout token');check(!(await e.page.locator('#track').innerText()).includes('SYNTHETIC W5'),'Unrelated account sees only public training');await e.ctx.close();
 e=await make();await e.page.goto(origin+'/plans/race-pace-durability/print.html?theme=light#preview');await e.page.getByText('Full print editions come with the purchased plan.').waitFor();check(await e.page.locator('#printNow').isDisabled(),'Unauthenticated print controls stay disabled');check(e.errors.length===0,'Expected print access gate does not throw');await e.page.goto(origin+'/plans/race-pace-durability/access/');await e.page.evaluate(()=>window.__rpdOtpError='Synthetic internal provider detail');await e.page.locator('#accessEmail').fill('synthetic@example.invalid');await e.page.locator('#accessButton').click();await e.page.locator('#accessStatus[data-state=error]').waitFor();check(!(await e.page.locator('#accessStatus').innerText()).includes('provider detail'),'Link failure hides internal service details');check(await e.page.locator('#accessButton').isEnabled(),'Recovery can retry link failure');await e.page.evaluate(()=>window.__rpdOtpError=null);await e.page.locator('#accessButton').click();await e.page.locator('#accessStatus[data-state=success]').waitFor();const otp=await e.page.evaluate(()=>window.__rpdOtp);check(otp.email==='synthetic@example.invalid'&&otp.options.emailRedirectTo.includes('return_to=%2Fplans%2Frace-pace-durability%2Faccess%2F'),'Restore sends exact secure callback via mocked SDK');check(e.errors.length===0,'Recovery has no uncaught error');await e.ctx.close();
 await browser.close();console.log(`PASS: ${checks} RPD commercial route/reflow/checkout boundary, paid/pending/retry/print, blocked-storage, account isolation and recovery checks. All payment/auth/API traffic synthetic.`);
})().catch(error=>{console.error(error);process.exit(1);});
