'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('./share-metadata.cjs'),state=require('./sculpt-landing-state.cjs');
const ROOT=path.resolve(__dirname,'..'),out=process.argv[2]||'/tmp/sculpt-production.json';
const report={result:'RUNNING',startedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA,pages:[],assets:[]};
function save(){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
async function get(route){const r=await fetch(s.ORIGIN+route,{headers:{'User-Agent':'Sculpt-Release-Verification/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});assert.equal(r.status,200,route);assert.equal(new URL(r.url).origin,s.ORIGIN);return r;}
(async()=>{for(const [route,file] of [['/forge-sculpt/','forge-sculpt/index.html'],['/form/','form/index.html']]){const r=await get(route),h=await r.text(),local=fs.readFileSync(path.join(ROOT,file),'utf8');assert.equal(s.sha(h),s.sha(local),file+' actual public bytes');report.pages.push({url:r.url,status:r.status,sha256:s.sha(h)});save();}
for(const a of state.manifest.assets){const r=await get('/'+a.file),b=Buffer.from(await r.arrayBuffer());assert.equal(s.sha(b),a.sha256,a.file+' actual public bytes');report.assets.push({url:r.url,status:r.status,bytes:b.length,sha256:s.sha(b)});save();}
report.result='PASS';report.finishedAt=new Date().toISOString();save();console.log('PASS: actual public Sculpt and José pages and all eight media/style/font assets.');})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
