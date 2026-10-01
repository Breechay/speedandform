/* Deterministic screenshot of the house share card. Requires an external Playwright runtime. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const options={headless:true};
 if(process.env.CHROMIUM_PATH){options.executablePath=process.env.CHROMIUM_PATH;options.args=['--no-sandbox','--single-process','--no-zygote'];}
 const browser=await chromium.launch(options),page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 const font=fs.readFileSync(path.join(root,'assets/site/fonts/inter-tight-latin-variable.woff2')).toString('base64');
 const seal=fs.readFileSync(path.join(root,'assets/brand/sf-seal.svg')).toString('base64');
 await page.setContent(`<style>@font-face{font-family:House;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#283c32;color:#f2ecdd;font-family:House,Arial,sans-serif;padding:62px 72px}.mark{width:150px;height:58px;background:currentColor;mask:url(data:image/svg+xml;base64,${seal}) center/contain no-repeat}h1{font-size:100px;font-weight:740;line-height:1.01;letter-spacing:-.05em;margin:68px 0 64px}p{font-size:28px;line-height:1.5;color:#bdc7b8;margin:0}</style><div class="mark"></div><h1>Run better.<br>Feel stronger.</h1><p>Running &amp; strength coaching with Brice. Miami + online.</p>`);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(root,'og/speed-and-form-20261001.jpg'),type:'jpeg',quality:90});
 await browser.close();console.log('Rendered 1200 × 630 forest-and-chalk house share card.');
})().catch(e=>{console.error(e);process.exit(1)});
