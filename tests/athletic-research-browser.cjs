'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=process.env.AR_QA_DIR||'/tmp/athletic-life-qa';fs.mkdirSync(out,{recursive:true});
const routes=['research/','discoveries/','research/assessment/','research/agent-guide/','research/the-season/','research/intelligence-layer/'];
(async()=>{for(const [engineName,engine] of Object.entries(process.env.AR_BROWSER?{[process.env.AR_BROWSER]:{chromium,webkit}[process.env.AR_BROWSER]}:{chromium,webkit})){
 const browser=await engine.launch(),context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='https://speedandform.com')return route.abort();let f=path.join(root,u.pathname);if(u.pathname.endsWith('/'))f=path.join(f,'index.html');if(!fs.existsSync(f))return route.fulfill({status:404,body:'Missing'});const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.woff2':'font/woff2','.webp':'image/webp','.svg':'image/svg+xml'};return route.fulfill({path:f,contentType:types[path.extname(f)]||'text/plain'})});
 for(const route of routes){for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:950});await page.goto('https://speedandform.com/the-athletic-life/'+route);await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),engineName+' overflow '+route+' '+width);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('a.sf-menu-toggle').count(),1);
  if(width===390||width===1440)await page.screenshot({path:path.join(out,engineName+'-'+route.replaceAll('/','-')+width+'.png')});
  if(width===390&&route==='discoveries/'){
   await page.getByText('Contents',{exact:true}).click();await page.locator('aside nav a').first().click();assert.ok(!(await page.locator('aside details').getAttribute('open')));await page.screenshot({path:path.join(out,engineName+'-reading-390.png')});
  }
 }
 // Double text size, with responsive wrapping and table scrolling intact.
 await page.setViewportSize({width:390,height:950});await page.goto('https://speedandform.com/the-athletic-life/'+route);await page.addStyleTag({content:'.ar-prose{font-size:34px}.ar-prose p,.ar-prose li{font-size:inherit}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'large text '+route);
 }
 await page.goto('https://speedandform.com/the-athletic-life/research/');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'al-skip');await page.keyboard.press('Enter');assert.ok((await page.url()).endsWith('#reading'));
 await page.locator('a.sf-menu-toggle').click();assert.ok(await page.locator('#site-menu').isVisible());await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log(engineName+': six pages, five widths, enlarged text, contents, keyboard, shared menu and reduced motion passed');await browser.close();
}})().catch(e=>{console.error(e);process.exit(1)});
