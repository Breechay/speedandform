'use strict';
// Public GETs only. Tests the published revision, not a preview or branch URL.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('./share-metadata.cjs'),guides=require('./guide-content.cjs'),{VERSION}=require('./build-guides.cjs');
const root=path.resolve(__dirname,'..'),out=process.argv[2]||'/tmp/guides-production.json';
const report={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),pages:[],assets:[],attempts:[]};
fs.mkdirSync(path.dirname(out),{recursive:true});const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
async function request(route){const r=await fetch(new URL(route,s.ORIGIN),{headers:{'User-Agent':'FORM-Guide-Release-Verification/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,route+' HTTP response');assert.equal(new URL(r.url).origin,s.ORIGIN);return r;}
(async()=>{
 let ready=false;for(let i=0;i<18;i++){try{const r=await request(guides[0].route),h=await r.text();assert.ok(h.includes('data-guide="'+VERSION+'"'));assert.equal(s.meta(h,'og:title'),guides[0].title);ready=true;break;}catch(e){report.attempts.push({at:new Date().toISOString(),error:e.message});save();if(i<17)await new Promise(r=>setTimeout(r,10000));}}
 assert.ok(ready,'The approved guide revision has not reached production');
 for(const g of guides){const r=await request(g.route),h=await r.text(),local=fs.readFileSync(path.join(root,g.file),'utf8');assert.ok((r.headers.get('content-type')||'').includes('text/html'));assert.ok(h.includes('data-guide="'+VERSION+'"'));assert.equal(s.canonical(h,g.file),s.ORIGIN+g.route);assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.ok(h.includes('<h1>'+g.heading+'</h1>'));
 for(const k of ['description','og:type','og:title','og:description','og:image','og:image:width','og:image:height','twitter:card','twitter:image','twitter:title','twitter:description'])assert.equal(s.meta(h,k),s.meta(local,k),g.route+' '+k);
 const schema=JSON.parse(h.match(/id="guide-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.deepEqual(schema,JSON.parse(local.match(/id="guide-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]));
 for(const sec of g.sections)assert.ok(h.includes('id="'+sec.id+'"'),g.route+' section '+sec.id);for(let i=1;i<=g.sources.length;i++)assert.ok(h.includes('id="source-'+i+'"'));
 assert.ok(!/Most running problems are mechanical|clear waste products|damage is done to the early aerobic/.test(h));
 report.pages.push({url:r.url,status:r.status,title:g.title,sections:g.sections.length,references:g.sources.length,version:VERSION});save();}
 for(const file of ['css/guide-foundations.css','js/guide-tools.js','css/cream-reading.css']){const r=await request('/'+file),b=Buffer.from(await r.arrayBuffer());assert.equal(s.sha(b),s.sha(fs.readFileSync(path.join(root,file))),file+' actual bytes');report.assets.push({file,status:r.status,sha256:s.sha(b)});save();}
 report.result='PASS';report.finishedAt=new Date().toISOString();save();console.log(`PASS: ${report.pages.length} live guides with article content, source links, metadata and structured data; ${report.assets.length} exact public assets.`);
})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
