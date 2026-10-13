'use strict';
/* Run in hosted CI. Every request is intercepted; no remote services or writes. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),origin='https://speedandform.com';
const engineName=process.env.SF_MENU_BROWSER||'chromium',out=process.env.SF_MENU_ARTIFACTS||'/tmp/site-menu-review';
const routes=['/','/form/','/forge-sculpt/','/coaching/miami/','/coaching/strength/','/plans/','/library','/library/easy-days/','/labs/speed-that-endures/','/labs/the-durable-frame/','/form/support/','/thursday'];
const report={engine:engineName,checks:[],pageErrors:[],blockedWrites:[],missing:[],physicalDevice:false};
fs.mkdirSync(out,{recursive:true});
function check(label,ok){assert.ok(ok,label);report.checks.push(label);}
function installRouting(context){return context.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(req.method()!=='GET'){report.blockedWrites.push({method:req.method(),path:u.pathname});return route.abort();}
 if(u.origin!==origin)return route.abort();
 const relative=decodeURIComponent(u.pathname).replace(/^\//,'');
 const choices=relative?[relative,relative+'.html',relative.replace(/\/$/,'')+'/index.html']:['index.html'];
 const file=choices.map(f=>path.resolve(root,f)).find(f=>f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile());
 if(!file){report.missing.push(u.pathname);return route.fulfill({status:404,body:'Not found'});}
 const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json','.ico':'image/x-icon','.mp4':'video/mp4'}[path.extname(file)]||'application/octet-stream';
 return route.fulfill({path:file,contentType:type});
 });}
function slug(route){return route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home';}
(async()=>{
 const browser=await ({chromium,webkit}[engineName]).launch();
 let page;
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});await installRouting(context);
  page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.pageErrors.push({url:page.url(),message:e.message}));
  async function visit(route,width=390,zoom=1){
   await page.setViewportSize({width,height:900});const response=await page.goto(origin+route,{waitUntil:'domcontentloaded'});check(route+' returns 200',response.status()===200);
   await page.evaluate(()=>document.fonts.ready);
   if(await page.locator('.sf-public-masthead').count())check(route+' fallback home emblem visible',await page.locator('.sf-public-masthead .sf-brand').evaluate(e=>getComputedStyle(e,'::before').content==='""'&&parseFloat(getComputedStyle(e,'::before').width)>0));
   if(zoom!==1)await page.addStyleTag({content:'html{zoom:'+zoom+'}'});
  }
  async function checkOpen(label,zoom=1){
   const toggle=page.locator('.sf-menu-toggle');check(label+' one menu control',await toggle.count()===1);
   check(label+' named control',await toggle.getAttribute('aria-label')==='Menu');
   const bounds=await toggle.boundingBox();check(label+' control has 44px target',bounds.width>=43.5&&bounds.height>=43.5);
   await toggle.click();await page.waitForFunction(()=>document.querySelector('#site-menu').classList.contains('is-open'));
   await page.waitForFunction(()=>document.activeElement?.classList.contains('sf-menu-close'));
   const state=await page.locator('#site-menu').evaluate(menu=>{
    const panel=menu.querySelector('.sf-menu-panel'),m=menu.getBoundingClientRect(),p=panel.getBoundingClientRect();
    return {parent:menu.parentElement.tagName,top:m.top,bottom:m.bottom,left:p.left,right:p.right,width:p.width,height:p.height,vw:innerWidth,vh:innerHeight,scroll:panel.scrollWidth,client:panel.clientWidth,backgroundInert:[...document.body.children].filter(e=>e!==menu&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)).every(e=>e.inert),focus:document.activeElement?.classList.contains('sf-menu-close'),rootScroll:document.documentElement.scrollWidth,rootWidth:document.documentElement.clientWidth};
   });
   check(label+' direct body placement',state.parent==='BODY');
   check(label+' drawer covers viewport height',Math.abs(state.top)<=2&&Math.abs(state.bottom-state.vh)<=2);
   check(label+' page remains visible beside drawer',state.left>=state.vw*.14);
   if(zoom===1)check(label+' bounded drawer width',state.width<=460.5);
   check(label+' panel fits viewport',state.right<=state.vw+2&&state.height<=state.vh+2);
   check(label+' menu has no horizontal overflow',state.scroll<=state.client+1);
   check(label+' page has no horizontal overflow',state.rootScroll<=state.rootWidth+1);
   check(label+' background unavailable',state.backgroundInert===true);check(label+' focus enters drawer',state.focus);
   const links=page.locator('#site-menu a[href]:not([aria-hidden="true"])');
   await page.keyboard.press('Shift+Tab');check(label+' reverse focus wraps',await links.last().evaluate(e=>e===document.activeElement));
   await page.keyboard.press('Tab');check(label+' forward focus wraps',await page.locator('.sf-menu-close').evaluate(e=>e===document.activeElement));
   const contact=page.locator('.sf-menu-foot a[href="/contact"]');await contact.scrollIntoViewIfNeeded();
   check(label+' Contact reachable',await contact.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+2;}));
   await page.locator('.sf-menu-panel').evaluate(e=>e.scrollTop=0);
   return toggle;
  }
  for(const width of [375,390,768,1440])for(const route of routes){
   await visit(route,width);if(width===390||width===1440)await page.screenshot({path:path.join(out,slug(route)+'-'+width+'-closed.png')});const label=route+' @ '+width;const toggle=await checkOpen(label);
   if(width===390||width===1440)await page.screenshot({path:path.join(out,slug(route)+'-'+width+'-open.png')});
   await page.keyboard.press('Escape');check(label+' Escape closes',await toggle.getAttribute('aria-expanded')==='false');
   check(label+' focus returns',await toggle.evaluate(e=>e===document.activeElement));
   check(label+' background restored',await page.evaluate(()=>[...document.body.children].filter(e=>e.id!=='site-menu'&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)).every(e=>!e.inert)));
   await page.keyboard.press('Space');check(label+' Space reopens',await toggle.getAttribute('aria-expanded')==='true');
   await page.locator('.sf-menu-close').click();check(label+' close button closes',await toggle.getAttribute('aria-expanded')==='false');
  }
  for(const route of routes){await visit(route,390,2);await checkOpen(route+' @ 200%',2);await page.screenshot({path:path.join(out,slug(route)+'-zoom200-open.png')});await page.keyboard.press('Escape');}
  // Navigation and returning must never leave the page inert.
  await visit('/form/');await page.locator('.sf-menu-toggle').click();await page.locator('#site-menu a[href="/forge-sculpt/"]').click();await page.waitForURL(origin+'/forge-sculpt/');
  check('Menu link reaches Strength',await page.locator('h1').innerText()==='Build muscle\nwith a plan.');await page.goBack();check('Back restores page access',await page.evaluate(()=>[...document.body.children].filter(e=>e.id!=='site-menu'&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)).every(e=>!e.inert)));
  // Both hash fallback and JavaScript direct links work away from the homepage.
  await page.goto(origin+'/library#site-menu');await page.waitForFunction(()=>document.querySelector('#site-menu').classList.contains('is-open'));await page.keyboard.press('Escape');
  check('Hash-opened menu closes cleanly',await page.locator('.sf-menu-toggle').getAttribute('aria-expanded')==='false');
  // The normal-motion close retains the mask until its transition completes.
  await page.emulateMedia({reducedMotion:'no-preference'});await visit('/forge-sculpt/');
  await page.evaluate(()=>{scrollTo(0,500);document.querySelector('.sf-menu-toggle').click();});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.sf-menu-panel')).transform==='none');
  const before=await page.evaluate(()=>scrollY);await page.locator('.sf-menu-close').click();
  check('Close animates before hiding',await page.locator('#site-menu').evaluate(e=>e.classList.contains('is-closing')&&getComputedStyle(e).visibility==='visible'));
  await page.waitForFunction(()=>!document.querySelector('#site-menu').classList.contains('is-closing'));
  check('Close preserves scroll position',await page.evaluate(()=>scrollY)===before);
  check('Animated close restores background',await page.evaluate(()=>[...document.body.children].filter(e=>e.id!=='site-menu'&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)).every(e=>!e.inert)));
  // JavaScript-disabled navigation remains available in a dark and paper room.
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812},reducedMotion:'reduce'});await installRouting(nojs);
  const fallback=await nojs.newPage();
  for(const route of ['/form/','/library']){
   await fallback.goto(origin+route);await fallback.locator('.sf-menu-toggle').click();
   check(route+' no-JS drawer opens',await fallback.locator('#site-menu').isVisible());
   await fallback.locator('#site-menu a[href="/coaching/strength/"]').click();await fallback.waitForURL(origin+'/coaching/strength/');
   check(route+' no-JS destination loaded',await fallback.locator('.sf-menu-toggle').count()===1);
  }
  check('Shared assets resolve',!report.missing.some(p=>/sf-menu|site-menu/.test(p)));
  check('No menu script exceptions',!report.pageErrors.some(e=>/sf-menu|site-menu/.test(e.message)));
  console.log('PASS: '+report.checks.length+' shared-menu browser checks in '+engineName+'.');
 }catch(error){report.failure=error.stack;if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
