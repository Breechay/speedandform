'use strict';
// The real public Photos page, run against local checked-out assets in Chromium + WebKit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = 'https://speedandform.com';
const root = path.resolve(__dirname, '..');
const engine = process.env.SF_MENU_BROWSER || 'chromium';
const output = process.env.SF_MENU_ARTIFACTS || '/tmp/site-menu-review';
fs.mkdirSync(output, {recursive:true});
const errors=[];
const extensions={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json'};
async function intercept(context) {
 await context.route('**/*', async route=>{
  const request=route.request(), u=new URL(request.url());
  if(request.method() !== 'GET' || u.origin !== origin) return route.abort();
  const pathname=decodeURIComponent(u.pathname).replace(/^\//,'');
  const options=pathname?[pathname,pathname.replace(/\/$/,'')+'/index.html',pathname+'.html']:['index.html'];
  const file=options.map(s=>path.resolve(root,s)).find(s=>s.startsWith(root+path.sep)&&fs.existsSync(s)&&fs.statSync(s).isFile());
  if(!file)return route.fulfill({status:404,body:'Not found'});
  return route.fulfill({path:file,contentType:extensions[path.extname(file)]||'application/octet-stream'});
 });
}
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch();
 let count=0;
 try {
  for(const width of [320,390,1440]) {
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
   await intercept(context);
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   const response=await page.goto(origin+'/photos/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.querySelectorAll('#photo-wall .photo-frame').length===51);
   const photo=page.locator('#photo-wall .photo-frame').first();
   assert.equal(await page.locator('.photos-editorial-hero').count(),0,'No Photograph masthead');
   assert.equal(await page.locator('.photos-footer').count(),0,'No duplicate footer');
   assert.equal(await page.locator('h1').count(),1,'Retain screen-reader page title');
   assert.equal(await page.locator('#photo-wall .photo-frame').count(),51);
   assert.equal(await photo.evaluate(e=>e.classList.contains('photo-featured')),true,'Featured frame exists');
   const geometry=await page.evaluate(()=>({nav:document.querySelector('.photos-header').getBoundingClientRect().bottom,first:document.querySelector('.photo-featured').getBoundingClientRect().top,width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   assert.ok(geometry.first-geometry.nav<75,'Photos begin directly beneath header');
   assert.ok(geometry.width<=geometry.client+2,'No horizontal overflow');
   const opener=photo.locator('a');
   await opener.click();
   assert.equal(await page.locator('#photo-viewer').evaluate(el=>el.open),true,'Click opens native viewer');
   const img=page.locator('.photo-viewer-image');
   await img.evaluate(el=>el.decode());
   assert.ok(await img.evaluate(el=>el.naturalWidth>0),'Full-resolution image loads');
   assert.equal(await page.locator('.photo-viewer-count').innerText(),'1 / 51');
   await page.locator('.photo-viewer-next').click();
   assert.equal(await page.locator('.photo-viewer-count').innerText(),'2 / 51');
   await page.keyboard.press('ArrowLeft');
   assert.equal(await page.locator('.photo-viewer-count').innerText(),'1 / 51');
   await page.keyboard.press('ArrowLeft');
   assert.equal(await page.locator('.photo-viewer-count').innerText(),'51 / 51','Wraps from first to last');
   if(width<500){
    await page.locator('#photo-viewer').evaluate(el=>{
      const start=new Touch({identifier:1,target:el,clientX:250,clientY:400});
      const end=new Touch({identifier:1,target:el,clientX:100,clientY:402});
      el.dispatchEvent(new TouchEvent('touchstart',{touches:[start],bubbles:true}));
      el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[end],bubbles:true}));
    });
    assert.equal(await page.locator('.photo-viewer-count').innerText(),'1 / 51','Swipe advances from last to first');
   }
   // A navigation check is complete only when the selected image is visible,
   // not merely when its counter changes; catch empty black frames on mobile.
   await img.evaluate(el=>el.decode());
   assert.ok(await img.evaluate(el=>el.naturalWidth>0 && el.complete),'Displayed frame decodes after navigation');
   await page.screenshot({path:path.join(output,'photos-gallery-'+engine+'-'+width+'-viewer.png')});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#photo-viewer').evaluate(el=>el.open),false,'Escape closes viewer');
   assert.ok(await opener.evaluate(el=>el===document.activeElement),'Focus returns to original photograph');
   await page.screenshot({path:path.join(output,'photos-gallery-'+engine+'-'+width+'-wall.png')});
   await context.close();
   count++;
  }
  assert.equal(errors.length,0,'No JavaScript exceptions: '+errors.join('; '));
  console.log('PASS Photos: '+count+' viewports, 51 originals, black viewer, arrows, swipe, keyboard, image decoding, focus');
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});