'use strict';
// GET-only checks against the published site. Never submits forms or runs tracking.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('./share-metadata.cjs'),root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const m=JSON.parse(read('docs/audits/DISCOVERY-MANIFEST-20260916.json'));
const O=s.ORIGIN,out=process.argv[2]||'/tmp/discovery-production.json';
const report={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),pages:[],assets:[],routes:[],attempts:[]};
fs.mkdirSync(path.dirname(out),{recursive:true});
const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
async function request(route,redirect='follow'){return fetch(new URL(route,O),{redirect,headers:{'Cache-Control':'no-cache','User-Agent':'FORM-Discovery-Release-Verification/1.0'},signal:AbortSignal.timeout(20000)});}
async function text(route,status=200){const r=await request(route);assert.equal(r.status,status,route+' HTTP status');assert.equal(new URL(r.url).origin,O);return {r,h:await r.text()};}
async function verifyPage({file,url}){const {r,h}=await text(url);assert.ok((r.headers.get('content-type')||'').includes('text/html'),url+' content type');assert.equal(s.canonical(h,file),url,url+' canonical');assert.ok(!/noindex/i.test(s.meta(h,'robots')+' '+r.headers.get('x-robots-tag')),url+' index eligibility');const local=read(file);for(const k of ['og:title','og:description','og:image'])if(s.meta(local,k))assert.equal(s.meta(h,k),s.meta(local,k),url+' '+k);report.pages.push({url,finalURL:r.url,status:r.status,canonical:url});}
(async()=>{
 let ready=false;
 for(let i=0;i<18;i++){
  try{const {h}=await text('/library');assert.ok(h.includes('data-discovery="'+m.version+'"'));assert.equal(s.meta(h,'og:title'),s.meta(read('library.html'),'og:title'));ready=true;break;}
  catch(e){report.attempts.push({at:new Date().toISOString(),error:e.message});save();if(i<17)await new Promise(r=>setTimeout(r,10000));}
 }
 assert.ok(ready,'Production did not reach the discovery version');
 const queue=[...m.sitemap];await Promise.all(Array.from({length:4},async()=>{while(queue.length){await verifyPage(queue.shift());save();}}));
 for(const file of ['robots.txt','sitemap.xml','search-index.json','css/discovery.css','js/discovery-search.js','css/cream-reading.css']){
  const {r,h}=await text('/'+file);assert.equal(s.sha(h),s.sha(read(file)),file+' published bytes');report.assets.push({file,status:r.status,sha256:s.sha(h)});save();
 }
 for(const route of ['/page-does-not-exist-pass2-20260916','/library/no-such-page-pass2']){const {r,h}=await text(route,404);assert.ok(h.includes('data-discovery="'+m.version+'"'));assert.ok(h.includes('Page not found'));report.routes.push({route,status:r.status});}
 for(const route of ['/app','/app.html']){const r=await request(route,'manual');assert.equal(r.status,301,route+' permanent redirect');assert.equal(new URL(r.headers.get('location'),O).pathname,'/form/');report.routes.push({route,status:r.status,location:r.headers.get('location')});}
 const {r:search,h:searchHTML}=await text('/search?q=hyrox');assert.ok(/noindex/i.test(s.meta(searchHTML,'robots')));assert.ok(searchHTML.includes('discovery-output'));report.routes.push({route:'/search?q=hyrox',status:search.status,robots:s.meta(searchHTML,'robots')});
 const {h:library}=await text('/library');for(const e of JSON.parse(read('search-index.json')))assert.ok(library.includes('href="'+e.url+'"'),e.url+' static link');
 const {h:archive}=await text('/plan-spring-2026');assert.ok(archive.includes('data-discovery-archive'));report.routes.push({route:'/plan-spring-2026',status:200,archiveContext:true});
 report.pages.sort((a,b)=>a.url.localeCompare(b.url));report.finishedAt=new Date().toISOString();report.result='PASS';save();
 console.log(`PASS: ${report.pages.length} live canonical pages, ${report.assets.length} exact public resources, ${report.routes.length} redirect/search/archive/404 checks. No ranking or physical-device claim.`);
})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
