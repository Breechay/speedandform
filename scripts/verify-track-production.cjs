'use strict';
// GET-only release receipt. No emails, payments, signups or analytics.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('./share-metadata.cjs'),root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const m=JSON.parse(read('track/media-manifest.json')),O=s.ORIGIN;
const output=process.argv[2]||'/tmp/gallery-production.json';
const report={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),pages:[],assets:[],attempts:[]};
const save=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
async function get(route){const r=await fetch(new URL(route,O),{headers:{'User-Agent':'FORM-Gallery-Release-Verification/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,route+' HTTP');assert.equal(new URL(r.url).origin,O);return r;}
(async()=>{
 let ready=false;
 for(let n=0;n<18;n++){
  try{const r=await get('/track/media-manifest.json');assert.equal(s.sha(await r.text()),s.sha(read('track/media-manifest.json')));ready=true;break;}
  catch(e){report.attempts.push(e.message);save();if(n<17)await new Promise(r=>setTimeout(r,10000));}
 }
 assert.ok(ready,'Production did not reach the reviewed gallery');
 for(const route of ['/track/',...m.albums.map(a=>'/track/'+a.slug+'/')]){
  const h=await(await get(route)).text(),local=read(route.slice(1)+'index.html');
  assert.ok(h.includes('data-track-gallery="20260917-p3b"'));
  assert.equal(s.canonical(h),O+route);
  for(const k of ['og:image','og:title','og:description','og:image:alt','og:image:width','og:image:height','twitter:image','twitter:card'])assert.equal(s.meta(h,k),s.meta(local,k),route+' '+k);
  assert.ok(!/No signup needed|Downloads are web editions|Silent film\. Play to watch/.test(h));
  const album=m.albums.find(a=>route==='/track/'+a.slug+'/');
  if(album){for(const item of album.media)assert.ok(h.includes('href="'+item.full.url+'"'));assert.ok(h.includes(album.photoArchive.url));}
  report.pages.push({route,status:200,canonical:O+route,image:s.meta(h,'og:image')});save();
 }
 const assets=new Map();
 for(const a of m.albums){for(const asset of [a.share,a.photoArchive,...a.media.flatMap(i=>[i.thumb,i.preview,i.full,i.download])].filter(Boolean))assets.set(asset.url,asset);}
 for(const f of ['css/track-gallery.css','js/track-gallery.js','track/media-manifest.json'])assets.set('/'+f,{sha256:s.sha(read(f))});
 for(const [url,asset] of assets){const r=await get(url),bytes=Buffer.from(await r.arrayBuffer());assert.equal(s.sha(bytes),asset.sha256,url+' exact bytes');
  const ext=path.extname(url),mime=r.headers.get('content-type')||'';
  if(ext==='.jpg')assert.ok(mime.includes('image/jpeg'));
  if(ext==='.mp4')assert.ok(mime.includes('video/mp4'));
  if(ext==='.zip')assert.ok(mime.includes('application/zip'));
  report.assets.push({url,status:r.status,bytes:bytes.length,sha256:asset.sha256,type:mime});save();
 }
 report.result='PASS';report.finishedAt=new Date().toISOString();save();
 console.log(`PASS: ${report.pages.length} actual gallery pages and ${report.assets.length} exact public resources, including film and photo ZIP.`);
})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
