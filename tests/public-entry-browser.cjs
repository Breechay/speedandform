'use strict';
/* Public perimeter smoke/visual audit. Starts from home, menu and gallery anchors.
   All requests stay local to the checked-out repo. Never call a live app or submit data. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://speedandform.com';
const engineName = process.env.SF_MENU_BROWSER || 'chromium';
const out = process.env.SF_MENU_ARTIFACTS || '/tmp/site-menu-review';
fs.mkdirSync(path.join(out, 'entry-pages'), { recursive: true });
const source = [
  fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  fs.readFileSync(path.join(root, 'scripts/site-menu-panel.html'), 'utf8'),
  fs.readFileSync(path.join(root, 'photos/index.html'), 'utf8')
].join('\n');
const internalHrefs = [...source.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)]
  .map(m => m[1]).filter(h => h.startsWith('/') && !h.startsWith('//'));
const routes = [...new Set(internalHrefs.map(h => new URL(h, origin).pathname))]
  .filter(p => !p.startsWith('/assets/') && !p.startsWith('/media/'))
  .sort();
const expected = [
  '/', '/athletes/', '/runs/', '/photos/', '/track/', '/coaching/miami/',
  '/coaching/apply/', '/plans/', '/form/', '/forge-sculpt/', '/thursday',
  '/library', '/contact', '/form-house', '/brand/', '/privacy.html',
  '/athlete/', '/labs/speed-that-endures/'
];
for (const p of expected) assert.ok(routes.includes(p), 'Homepage/menu/footer route: '+p);
function resolveRoute(pathname) {
  const plain = decodeURIComponent(pathname);
  if (plain === '/athletes/' || plain === '/athletes') return 'people/index.html';
  const p = plain.replace(/^\//, '').replace(/\/$/, '');
  const options = p ? [p, p + '/index.html', p + '.html'] : ['index.html'];
  return options.find(f => {
    const target=path.resolve(root,f);
    return target.startsWith(root+path.sep) && fs.existsSync(target) && fs.statSync(target).isFile();
  });
}
for (const p of routes) assert.ok(resolveRoute(p), 'No missing first-hop route: '+p);
const report={engine:engineName,routes,checked:[],issues:[],missing:[],screenshots:[],blockedWrites:[]};
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.mp4':'video/mp4'};
(async()=>{
  const browser=await ({chromium,webkit}[engineName]).launch();
  try{
    const context=await browser.newContext({reducedMotion:'reduce'});
    await context.route('**/*',async route=>{
      const req=route.request(),u=new URL(req.url());
      if(req.method()!=='GET'){report.blockedWrites.push({path:u.pathname,method:req.method()});return route.abort();}
      if(u.origin!==origin)return route.abort();
      const found=resolveRoute(u.pathname);
      if(!found){report.missing.push(u.pathname);return route.fulfill({status:404,body:'Not found'});}
      return route.fulfill({path:path.join(root,found),contentType:mime[path.extname(found)]||'application/octet-stream'});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', e=> report.issues.push({url:page.url(),type:'script',message:e.message}));
    for(const width of [320,390,1024,1440]){
      await page.setViewportSize({width,height:width<=390?844:900});
      for(const route of routes){
        const response=await page.goto(origin+route,{waitUntil:'domcontentloaded'});
        assert.equal(response.status(),200,route+' responds at '+width);
        await page.evaluate(()=>document.fonts.ready);
        const state=await page.evaluate(()=>({
          viewport:innerWidth,root:document.documentElement.scrollWidth,
          body:document.body.scrollWidth,visible:document.body.getBoundingClientRect().height,
          links:[...document.querySelectorAll('a[href]')].length
        }));
        assert.ok(state.visible>100,route+' contains a page at '+width);
        if(state.root>state.viewport+1){
          const offenders=await page.evaluate(()=>[...document.body.querySelectorAll('*')]
            .map(el=>({el,r:el.getBoundingClientRect()}))
            .filter(x=>x.r.width>0 && (x.r.right>innerWidth+2 || x.r.left < -2))
            .slice(0,12).map(x=>({tag:x.el.tagName,className:String(x.el.className).slice(0,110),
              left:Math.round(x.r.left),right:Math.round(x.r.right),text:(x.el.textContent||'').trim().slice(0,45)})));
          report.issues.push({type:'horizontal-overflow',route,width,state,offenders});
        }
        if(route==='/'){
          const seams=await page.evaluate(()=>{
            const paths=[...document.querySelectorAll('.bend-seam-lanes path')];
            const first=paths.filter(p=>!p.classList.contains('bend-seam-b')&&!p.classList.contains('bend-seam-start'));
            const second=paths.filter(p=>p.classList.contains('bend-seam-b'));
            return first.map((p,i)=>{
              const a=p.getPointAtLength(p.getTotalLength()),b=second[i].getPointAtLength(0);
              return Math.hypot(a.x-b.x,a.y-b.y);
            });
          });
          assert.equal(seams.length,9,'Nine continuous lanes');
          assert.ok(seams.every(gap=>gap<0.2),'Bends join without gaps at '+width);
        }
        report.checked.push({route,width,links:state.links});
        if(width===390||width===1440){
          const slug=route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home';
          const file='entry-pages/'+slug+'-'+width+'.png';
          if(route==='/'){
            // Visit each fold before full-page capture so native lazy photographs load.
            const height=await page.evaluate(()=>document.documentElement.scrollHeight);
            for(let y=0;y<height;y+=600){
              await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
              await page.waitForTimeout(80);
            }
            await page.evaluate(()=>Promise.all([...document.querySelectorAll('main img, footer img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{});})));
            await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            await page.waitForTimeout(150);
          }
          await page.screenshot({path:path.join(out,file),animations:'disabled',fullPage:route==='/'});
          report.screenshots.push(file);
        }
      }
    }
    // Manual navigation must establish the origin for subsequent page-driven movement.
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    const sheet=page.locator('[data-world-sheet]');
    await sheet.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await sheet.evaluate(el=>{el.scrollLeft=300;});
    await page.waitForTimeout(80);
    const manual=await sheet.evaluate(el=>el.scrollLeft);
    await page.evaluate(()=>window.scrollBy({top:100,behavior:'instant'}));
    await page.waitForTimeout(180);
    const forward=await sheet.evaluate(el=>el.scrollLeft);
    assert.ok(forward>manual,'Page scroll resumes from the manual carousel position');
    await page.evaluate(()=>window.scrollBy({top:-100,behavior:'instant'}));
    await page.waitForTimeout(180);
    const backward=await sheet.evaluate(el=>el.scrollLeft);
    assert.ok(backward<forward,'Upward page scroll reverses carousel drift');
    assert.ok(Math.abs(backward-manual)<4,'Carousel returns without snapping to its old origin: '+JSON.stringify({manual,forward,backward}));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForTimeout(80);
    const still=await sheet.evaluate(el=>el.scrollLeft);
    await page.evaluate(()=>window.scrollBy({top:100,behavior:'instant'}));
    await page.waitForTimeout(180);
    assert.ok(Math.abs(await sheet.evaluate(el=>el.scrollLeft)-still)<2,'Reduced motion disables automatic drift');
    assert.equal(new Set(report.checked.map(c=>c.route)).size,routes.length,'All first-hop routes inspected');
    assert.equal(report.issues.filter(e=>e.type==='horizontal-overflow').length,0,'No horizontal overflow at any public entrance: '+JSON.stringify(report.issues.filter(e=>e.type==='horizontal-overflow')));
    console.log('PASS: '+routes.length+' direct public homepage/menu/footer routes at 320, 390, 1024 and 1440 pixels in '+engineName+'.');
  }catch(e){report.failure=e.stack;throw e;}
  finally{
    fs.writeFileSync(path.join(out,'entry-pages','report-'+engineName+'.json'),JSON.stringify(report,null,2)+'\n');
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
