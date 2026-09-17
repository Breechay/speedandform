'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {guides,render,VERSION}=require('../scripts/build-training-guides.cjs'),state=require('../scripts/training-guide-state.cjs'),s=require('../scripts/share-metadata.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const old=f=>cp.execFileSync('git',['show',state.manifest.baseCommit+':'+f],{cwd:ROOT,maxBuffer:20_000_000});
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',state.manifest.baseCommit],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
const ids=h=>[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const resolve=u=>{const r=u.pathname.slice(1);return [r||'index.html',r+'.html',r.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(ROOT,f))&&fs.statSync(path.join(ROOT,f)).isFile());};
assert.equal(guides.length,4);assert.equal(state.updates.size,5);
for(const row of state.manifest.pages){assert.equal(s.sha(old(row.file)),row.beforeSha256,row.file+' exact baseline');state.verify(row.file,read(row.file));}
let untouched=0;for(const f of files.filter(f=>f.endsWith('.html')&&!state.updates.has(f))){assert.equal(s.sha(read(f)),s.sha(old(f)),f+' outside Pass 4B');untouched++;}
for(const f of ['css/cream-reading.css','css/guide-foundations.css','js/guide-tools.js','scripts/build-guides.cjs','scripts/guide-content.cjs','docs/audits/GUIDES-MANIFEST-20260917.json','docs/audits/FOUNDATION-GUIDES-20260917.md','css/discovery.css','js/discovery-search.js','css/track-gallery.css','js/track-gallery.js','track/albums.json','track/media-manifest.json','css/homepage.css','js/homepage-motion.js','js/coaching-measurement.js','netlify.toml','_headers','_redirects','robots.txt','sitemap.xml','plans/race-pace-durability/source.js'])assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected');
for(const g of guides){
 const h=read(g.file);assert.equal(render(g,h),h,'Deterministic '+g.file);assert.ok(h.includes('data-guide="'+VERSION+'"'));
 assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/<main\b/g)||[]).length,1);assert.equal(ids(h).length,new Set(ids(h)).size);
 assert.equal(s.canonical(h,g.file),s.ORIGIN+g.route);assert.equal(s.meta(h,'description'),g.description);assert.equal(s.meta(h,'og:title'),g.title);assert.equal(s.meta(h,'twitter:description'),g.description);assert.equal(s.meta(h,'og:image'),s.meta(old(g.file).toString(),'og:image'));
 assert.equal(s.transform(h,g.file,ROOT),h,'Idempotent image transform');
 const schema=JSON.parse(h.match(/id="guide-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),a=schema['@graph'].find(x=>x['@type']==='Article');assert.equal(a.headline,g.heading);assert.deepEqual(a.citation,g.sources.map(x=>x[2]));assert.ok(!a.datePublished&&!h.includes('MedicalWebPage'));
 for(const id of state.updates.get(g.file).retainedIds)assert.ok(ids(h).includes(id),'Preserved '+id);
 for(const tag of h.matchAll(/href="([^"]+)"/g)){const u=new URL(s.attrs(tag[0]).href,s.ORIGIN+g.route);if(u.origin!==s.ORIGIN)continue;const f=resolve(u);assert.ok(f,g.file+' link '+u);if(u.hash)assert.ok(ids(read(f)).includes(decodeURIComponent(u.hash.slice(1))),g.file+' fragment '+u.hash);}
 for(let i=1;i<=g.sources.length;i++)assert.ok(h.includes('href="#source-'+i+'"')&&h.includes('id="source-'+i+'"'),g.file+' source '+i);
 assert.ok(!/Running fitness collapses when structure collapses|two anchor sessions are non-negotiable|running fasted in the morning is fine for most|without adding to the load|48 hours after the session, not during it/i.test(h),'Retired universal claims');
}
const prior=JSON.parse(old('search-index.json')),index=JSON.parse(read('search-index.json')),routes=guides.map(g=>g.route);
assert.deepEqual(index.map(e=>e.url),prior.map(e=>e.url),'Same discovery addresses');for(const e of index)if(!routes.includes(e.url))assert.deepEqual(e,prior.find(p=>p.url===e.url),'Unrelated search entry '+e.url);
const strip=h=>h.replace(/<script[^>]*id="discovery-schema"[\s\S]*?<\/script>/g,'').replace(/<li><a class="discovery-link" href="\/(?:training-week|strength|recovery|fueling)">[\s\S]*?<\/li>/g,'');
assert.equal(strip(read('library.html')),strip(old('library.html').toString()),'Only four Library entries change');
const {calculate}=require('../js/training-tools.js');
assert.deepEqual(calculate({minutes:90,portion:25,count:2,drink:25}),{total:75,perHour:50,minutes:90});
assert.equal(calculate({minutes:120,portion:30,count:1.5,drink:15}).perHour,30);
assert.equal(calculate({minutes:60,portion:0,count:0,drink:0}).total,0);
for(const key of ['minutes','portion','count','drink'])for(const value of ['',null,undefined,NaN,Infinity,-1,'<script>']){const o={minutes:90,portion:25,count:2,drink:25};o[key]=value;assert.equal(calculate(o).field,key,'Reject invalid '+key);}
assert.equal(calculate({minutes:361,portion:25,count:2,drink:25}).field,'minutes');
assert.equal(calculate({minutes:15,portion:100,count:40,drink:1000}).perHour,20000,'Arithmetic does not falsely cap a high amount');
assert.ok(!/fetch\(|localStorage|innerHTML|eval\(/.test(read('js/training-tools.js')),'No external storage or unsafe rendering');
assert.ok(read('fueling.html').includes('<noscript>'));assert.ok(read('training-week.html').includes('data-kind="key"'));assert.ok(read('css/training-guides.css').includes('prefers-reduced-motion'));
console.log(`PASS: four training guides, five exact HTML snapshots, ${untouched} other HTML sources unchanged, four catalog descriptions, source links, metadata, deterministic builds and validated fueling arithmetic.`);
