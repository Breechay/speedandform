'use strict';
// Deterministic house typography, using the same local assets as the pages.
// Requires the external Playwright runtime used by render-house-share.cjs.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const cards=require('../data/half-marathon-share.json');
const root=path.resolve(__dirname,'..');
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
(async()=>{
  const options={headless:true};
  if(process.env.CHROMIUM_PATH){options.executablePath=process.env.CHROMIUM_PATH;options.args=['--no-sandbox','--single-process','--no-zygote'];}
  const browser=await chromium.launch(options);
  try {
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    const font=fs.readFileSync(path.join(root,'assets/site/fonts/inter-tight-latin-variable.woff2')).toString('base64');
    const seal=fs.readFileSync(path.join(root,'assets/brand/sf-seal.svg')).toString('base64');
    for(const [key,card] of Object.entries(cards)){
      await page.setContent(`<!doctype html><html><head><style>
        @font-face{font-family:Reading;src:url(data:font/woff2;base64,${font})}
        *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;padding:52px 64px;background:#ece6da;color:#141310;font-family:Reading,Arial,sans-serif}
        header{display:flex;align-items:center;justify-content:space-between;height:50px}.mark{width:103px;height:44px;background:currentColor;mask:url(data:image/svg+xml;base64,${seal}) center/contain no-repeat}
        .label{font-size:18px;font-weight:500;letter-spacing:.13em;color:#5b584f}.main{display:grid;grid-template-columns:650px 1fr;gap:32px;align-items:center;margin-top:64px;height:260px}
        h1{font-size:106px;line-height:.98;font-weight:670;letter-spacing:-.055em;margin:0}.detail{font-size:29px;font-weight:450;line-height:1.55;color:#514d45;margin:15px 0 0}
        footer{border-top:1px solid #bdb6a9;display:flex;justify-content:space-between;padding-top:23px;margin-top:61px;font-size:21px;color:#59554b}.domain{font-weight:550;color:#24221d}
      </style></head><body><header><div class="mark"></div><div class="label">${esc(card.label)}</div></header><div class="main"><h1>${card.headline.map(esc).join('<br>')}</h1><p class="detail">${card.detail.map(esc).join('<br>')}</p></div><footer><span class="domain">speedandform.com</span><span>From the Library</span></footer></body></html>`);
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:path.join(root,card.image),type:'jpeg',quality:91});
      console.log(`${key}: ${card.image} · 1200 × 630`);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
