/* Brand kit rasters, PDF and zip. Run after build-brand-kit.cjs whenever the kit or the brand page changes:
     PLAYWRIGHT_MODULE=/path/to/playwright node scripts/render-brand-kit.cjs
   Needs Playwright (Chromium), qpdf and zip. Not part of the Netlify build: the results are committed. */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),kit=path.join(root,'assets/brand/kit'),origin='https://speedandform.com',tmp=fs.mkdtempSync('/tmp/sf-kit-');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const fontCss=`@font-face{font-family:"Inter Tight";src:url("${origin}/assets/site/fonts/inter-tight-latin-variable.woff2") format("woff2");font-weight:100 900}@font-face{font-family:"JetBrains Mono";src:url("${origin}/assets/site/fonts/jetbrains-mono-latin-400-normal.woff2") format("woff2");font-weight:400}`;
async function serve(context){await context.route('**/*',route=>{const u=new URL(route.request().url());
  if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',headers:{'access-control-allow-origin':'*'},body:fontCss});
  if(u.origin!==origin)return route.abort();
  if(u.pathname==='/__kit-blank')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>kit</title>'});
  let f=path.join(root,decodeURIComponent(u.pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f+='.html';
  if(!fs.existsSync(f))return route.fulfill({status:404,body:''});
  return route.fulfill({path:f,contentType:types[path.extname(f)]||'application/octet-stream',headers:{'access-control-allow-origin':'*'}});});}
const out=rel=>{const f=path.join(kit,rel);fs.mkdirSync(path.dirname(f),{recursive:true});return f;};
(async()=>{
  const browser=await chromium.launch();
  const shot=async({url,html,width,height,scale=1,file,transparent=false,type='png',hide})=>{const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale,reducedMotion:'reduce'});await serve(context);const page=await context.newPage();
    if(url)await page.goto(origin+url,{waitUntil:'load'});else{await page.goto(origin+'/__kit-blank');await page.setContent(html,{waitUntil:'load'});}
    if(hide)await page.addStyleTag({content:hide+'{visibility:hidden!important}'});
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
    await page.screenshot({path:out(file),type,omitBackground:transparent,clip:{x:0,y:0,width,height},...(type==='jpeg'?{quality:90}:{})});await context.close();};
  const bare=(inner,w,h)=>`<body style="margin:0;background:transparent"><div style="width:${w}px;height:${h}px">${inner}</div></body>`;
  const svg=rel=>fs.readFileSync(path.join(kit,rel),'utf8').replace('<svg ','<svg style="display:block;width:100%;height:100%" ');
  // Emblem and bend, no background.
  await shot({html:bare(svg('emblem/sf-emblem-bone.svg'),2048,744),width:2048,height:744,file:'emblem/sf-emblem-bone.png',transparent:true});
  await shot({html:bare(svg('emblem/sf-emblem-ink.svg'),2048,744),width:2048,height:744,file:'emblem/sf-emblem-ink.png',transparent:true});
  await shot({html:bare(svg('bend/the-bend-bone.svg'),3000,1659),width:3000,height:1659,file:'bend/the-bend-bone.png',transparent:true});
  // Avatar: the cloth image squared on the emblem.
  await shot({html:`<body style="margin:0"><div style="width:1080px;height:1080px;background:url('${origin}/assets/brand/page/sf-cloth.jpg') no-repeat;background-size:1737.6px 1303.2px;background-position:-330px -223.2px"></div></body>`,width:1080,height:1080,file:'avatar/sf-avatar-cloth.jpg',type:'jpeg'});
  // Templates: a preview with the placeholder text, and blanks to set type on elsewhere.
  const t='/assets/brand/kit/templates/';
  await shot({url:t+'story-9x16.html',width:1080,height:1920,scale:.5,file:'templates/story-9x16.png'});
  await shot({url:t+'story-9x16.html',width:1080,height:1920,file:'templates/story-9x16-blank.png',hide:'.copy'});
  await shot({url:t+'invite-4x5.html',width:1080,height:1350,scale:.5,file:'templates/invite-4x5.png'});
  await shot({url:t+'invite-4x5.html',width:1080,height:1350,file:'templates/invite-4x5-blank.png',hide:'.copy'});
  await shot({url:t+'pdf-cover-letter.html',width:816,height:1056,file:'templates/pdf-cover-letter.png'});
  await shot({url:t+'email-header.html',width:600,height:200,scale:2,file:'templates/email-header.png'});
  // Guidelines PDF: one page per fold of the brand page, each page exactly the size of its fold.
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});await serve(context);const page=await context.newPage();
  await page.goto(origin+'/brand/',{waitUntil:'load'});await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'html,body{background:#0d0f0e!important}html,body,main,[data-kit-page],[data-kit-page]>section{width:1440px!important;max-width:none!important;margin:0!important}.sf-home-hero-immersive,.home-hero-immersive-inner{min-height:900px!important}img{content-visibility:visible}'});
  await page.evaluate(()=>document.querySelectorAll('img[loading]').forEach(i=>i.loading='eager'));
  const count=await page.locator('[data-kit-page]').count(),parts=[];
  for(let i=0;i<count;i++){
    await page.evaluate(n=>{const all=[...document.querySelectorAll('[data-kit-page]')];document.querySelectorAll('.skip-link,footer').forEach(e=>e.style.display='none');document.querySelector('.header').style.display=n===0?'':'none';all.forEach((e,j)=>e.style.display=j===n?'':'none');},i);
    await page.waitForLoadState('networkidle');await page.waitForTimeout(200);
    const h=Math.ceil(await page.evaluate(n=>document.querySelectorAll('[data-kit-page]')[n].getBoundingClientRect().height,i));
    const f=path.join(tmp,`p${String(i).padStart(2,'0')}.pdf`);await page.pdf({path:f,width:'1440px',height:h+'px',printBackground:true,pageRanges:'1'});parts.push(f);}
  await context.close();await browser.close();
  const pdf=out('speed-and-form-brand.pdf');execFileSync('qpdf',['--empty','--pages',...parts,'--',pdf]);
  // Zip: everything except the PDF, which is offered on its own.
  const zip=out('speed-and-form-kit.zip');if(fs.existsSync(zip))fs.unlinkSync(zip);
  execFileSync('zip',['-r','-X','-q',zip,'README.txt','emblem','bend','avatar','templates','tokens'],{cwd:kit});
  console.log('Brand kit rendered: '+count+' PDF pages, '+(fs.statSync(pdf).size/1e6).toFixed(2)+' MB PDF, '+(fs.statSync(zip).size/1e6).toFixed(2)+' MB zip.');
})();
