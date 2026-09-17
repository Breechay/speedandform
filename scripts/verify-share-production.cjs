'use strict';
// Read-only, unauthenticated HTTP verification. Never submits a form or runs page JS.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const s=require('./share-metadata.cjs');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/audits/SHARE-METADATA-MANIFEST-20260916.json'),'utf8'));
const discovery=path.join(root,'docs/audits/DISCOVERY-MANIFEST-20260916.json');
const updates=new Map((fs.existsSync(discovery)?JSON.parse(fs.readFileSync(discovery,'utf8')).changedHtml:[]).map(r=>[r.file,r]));
const cases={
 'index.html':'/', 'library.html':'/library', 'easy-run.html':'/easy-run',
 'threshold.html':'/threshold', 'long-run.html':'/long-run', 'notes.html':'/notes',
 'plans/index.html':'/plans/', 'plans/race-pace-durability/index.html':'/plans/race-pace-durability/',
 'plans/race-pace-durability/support/index.html':'/plans/race-pace-durability/support/',
 'plans/raise-the-ceiling/index.html':'/plans/raise-the-ceiling/',
 'labs/index.html':'/labs/', 'labs/hyrox/index.html':'/labs/hyrox/', 'labs/track/index.html':'/labs/track/',
 'form/index.html':'/form/', 'es/plans/race-pace-durability/index.html':'/es/plans/race-pace-durability/',
 'library/first-half-marathon-goal/index.html':'/library/first-half-marathon-goal/',
 'library/the-two-paces/index.html':'/library/the-two-paces/',
 'library/when-a-week-goes-wrong/index.html':'/library/when-a-week-goes-wrong/',
 'library/why-phases/index.html':'/library/why-phases/'
};
const output=process.argv[2] || '/tmp/share-production.json';
const report={sourceCommit:process.env.GITHUB_SHA || null,startedAt:new Date().toISOString(),origin:s.ORIGIN,attempts:[],pages:[],images:[]};
const write=()=>fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url){
 const res=await fetch(url,{redirect:'follow',headers:{'User-Agent':'FORM-Release-Verification/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
 assert.equal(res.status,200,`${url}: HTTP ${res.status}`);
 assert.equal(new URL(res.url).origin,s.ORIGIN,`${url}: unexpected origin redirect`);
 return res;
}
async function image(url){
 const res=await get(url);const buf=Buffer.from(await res.arrayBuffer());
 const expected=s.imageInfo(root,url);
 assert.equal((res.headers.get('content-type')||'').split(';')[0],expected.type,`${url}: MIME type`);
 assert.equal(s.sha(buf),expected.sha256,`${url}: image bytes differ from tested source`);
 return {url,status:res.status,type:expected.type,width:expected.width,height:expected.height,bytes:buf.length,sha256:s.sha(buf)};
}
async function page(file,route){
 const recorded=manifest.pages.find(p=>p.file===file);assert.ok(recorded);
 const expected={...recorded,title:updates.get(file)?.preview?.title||recorded.title,description:updates.get(file)?.preview?.description||recorded.description};
 const res=await get(s.ORIGIN+route);const html=await res.text();
 assert.ok((res.headers.get('content-type')||'').includes('text/html'));
 const fields={'og:image':expected.image,'og:image:secure_url':expected.image,'twitter:image':expected.image,'twitter:card':'summary_large_image','og:title':expected.title,'twitter:title':expected.title,'og:description':expected.description,'twitter:description':expected.description};
 const local=fs.readFileSync(path.join(root,file),'utf8');
 for(const k of ['og:image:alt','twitter:image:alt','og:image:width','og:image:height','og:image:type','og:url']) fields[k]=s.meta(local,k);
 for(const [key,value] of Object.entries(fields)){
  assert.equal(s.meta(html,key),value,`${route}: ${key}`);
  const count=[...s.head(html).matchAll(/<meta\b[^>]*>/gi)].filter(m=>{const a=s.attrs(m[0]);return (a.property||a.name)===key;}).length;
  assert.equal(count,1,`${route}: duplicate ${key}`);
 }
 return {route,finalUrl:res.url,status:res.status,image:expected.image,title:expected.title,checkedFields:Object.keys(fields).length};
}
(async()=>{
 fs.mkdirSync(path.dirname(output),{recursive:true});
 // Wait for the actual metadata release, not only an image shared by multiple passes.
 let ready=false;
 for(let n=1;n<=24;n++){
  try {await image(s.ORIGIN+s.DEFAULT_IMAGE);await page('index.html','/');await page('library.html','/library');ready=true;break;}
  catch(e){report.attempts.push({attempt:n,at:new Date().toISOString(),error:e.message});write();console.log(`Waiting for production (${n}/24): ${e.message}`);if(n<24)await sleep(15000);}
 }
 assert.ok(ready,'Production did not reach the tested release within the verification window');
 for(const [file,route] of Object.entries(cases)){report.pages.push(await page(file,route));write();}
 for(const url of [...new Set(manifest.pages.map(p=>p.image))]){report.images.push(await image(url));write();}
 report.finishedAt=new Date().toISOString();report.result='PASS';write();
 console.log(`PASS: ${report.pages.length} production pages and ${report.images.length} image URLs match the exact tested source. Native messaging apps not tested.`);
})().catch(e=>{report.result='FAIL';report.error=e.stack;write();console.error(e);process.exitCode=1;});
