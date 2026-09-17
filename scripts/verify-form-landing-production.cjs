'use strict';
// Read-only verification of the public URL and exact released bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('./share-metadata.cjs'),state=require('./form-landing-state.cjs');
const ROOT=path.resolve(__dirname,'..'),out=process.argv[2]||'/tmp/form-landing-production.json';
const report={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),pages:[],assets:[],attempts:[]};
fs.mkdirSync(path.dirname(out),{recursive:true});const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
async function get(route){const r=await fetch(new URL(route,s.ORIGIN),{headers:{'User-Agent':'FORM-Product-Release-Verification/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,route+' HTTP response');assert.equal(new URL(r.url).origin,s.ORIGIN);return r;}
(async()=>{
 let ready=false;for(let i=0;i<12;i++){try{const r=await get('/form/'),h=await r.text();assert.ok(h.includes('data-form-landing="'+state.manifest.version+'"'));ready=true;break;}catch(e){report.attempts.push({at:new Date().toISOString(),error:e.message});save();if(i<11)await new Promise(r=>setTimeout(r,10000));}}
 assert.ok(ready,'Reviewed FORM page has not reached production');
 const r=await get('/form/'),h=await r.text(),local=fs.readFileSync(path.join(ROOT,'form/index.html'),'utf8');
 assert.equal(s.sha(h),s.sha(local),'Exact public FORM HTML');assert.equal(s.canonical(h),s.ORIGIN+'/form/');
 for(const key of ['description','og:title','og:description','og:image','og:image:width','og:image:height','twitter:card','twitter:title','twitter:description','twitter:image'])assert.equal(s.meta(h,key),s.meta(local,key),key);
 report.pages.push({url:r.url,status:r.status,version:state.manifest.version,sha256:s.sha(h)});save();
 for(const a of state.manifest.assets){const r=await get('/'+a.file),b=Buffer.from(await r.arrayBuffer());assert.equal(s.sha(b),a.sha256,'Exact public '+a.file);report.assets.push({url:r.url,status:r.status,bytes:b.length,sha256:s.sha(b)});save();}
 report.result='PASS';report.finishedAt=new Date().toISOString();save();console.log('PASS: exact live FORM page, metadata and three public assets.');
})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
