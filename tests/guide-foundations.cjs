'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const s=require('../scripts/share-metadata.cjs'),guides=require('../scripts/guide-content.cjs'),{render}=require('../scripts/build-guides.cjs'),state=require('../scripts/guide-state.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const subsequent=require('../scripts/training-guide-state.cjs');
const base=state.manifest.baseCommit,old=f=>cp.execFileSync('git',['show',base+':'+f],{cwd:ROOT,maxBuffer:20_000_000});
const all=cp.execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
const ids=h=>[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const resolve=url=>{const u=new URL(url,s.ORIGIN),r=u.pathname.slice(1);return [r||'index.html',r+'.html',r.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(ROOT,f))&&fs.statSync(path.join(ROOT,f)).isFile());};
assert.equal(guides.length,4);assert.equal(state.updates.size,5);
for(const row of state.manifest.pages){assert.equal(s.sha(old(row.file)),row.beforeSha256,row.file+' exact pre-edit main');state.verify(row.file,read(row.file));}
let untouched=0;for(const f of all.filter(f=>f.endsWith('.html')&&!state.updates.has(f))){if(subsequent.verify(f,read(f)))continue;assert.equal(s.sha(read(f)),s.sha(old(f)),f+' outside editorial scope');untouched++;}
for(const f of ['css/cream-reading.css','css/discovery.css','css/track-gallery.css','js/track-gallery.js','css/homepage.css','js/homepage-motion.js','js/coaching-measurement.js','scripts/build-cream-reading.cjs','netlify.toml','_headers','_redirects','robots.txt','sitemap.xml','plans/race-pace-durability/source.js','threshold.html','long-run.html'])assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected');
for(const g of guides){
 const h=read(g.file),pageIds=ids(h);assert.equal(pageIds.length,new Set(pageIds).size,g.file+' unique IDs');
 for(const id of state.updates.get(g.file).retainedIds)assert.ok(pageIds.includes(id),'Preserved fragment '+id);
 assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/<main\b/g)||[]).length,1);assert.ok(h.includes('tabindex="-1"'));
 assert.equal(s.canonical(h,g.file),s.ORIGIN+g.route);assert.equal(s.meta(h,'description'),g.description);assert.equal(s.meta(h,'og:description'),g.description);assert.equal(s.meta(h,'og:title'),g.title);assert.equal(s.meta(h,'og:type'),'article');
 assert.equal(s.meta(h,'og:image'),s.meta(old(g.file).toString(),'og:image'));assert.equal(s.meta(h,'twitter:image'),s.meta(h,'og:image'));
 assert.equal(render(g,h),h,'Deterministic page generation');assert.equal(s.transform(h,g.file,ROOT),h,'Approved sharing transform remains a no-op');
 assert.ok(h.includes('data-form-reading="20260916"'));assert.ok(h.includes('/css/cream-reading.css'));assert.ok(!/fonts.googleapis|Cormorant|Jost/.test(h),'No legacy faint font loading');
 const schema=JSON.parse(h.match(/id="guide-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);const a=schema['@graph'].find(x=>x['@type']==='Article');assert.equal(a.headline,g.heading);assert.equal(a.author.name,'Brice Ikouebe');assert.equal(a.dateModified,'2026-09-17');assert.ok(!a.datePublished,'Do not invent original publication date');assert.deepEqual(a.citation,g.sources.map(x=>x[2]));assert.ok(!h.includes('FAQPage')&&!h.includes('MedicalWebPage'));
 for(const u of h.matchAll(/href="([^"]+)"/g)){const url=new URL(s.attrs(u[0]).href,s.ORIGIN+g.route);if(url.origin!==s.ORIGIN)continue;const f=resolve(url);assert.ok(f,g.file+' local '+u[1]);if(url.hash){const source=url.pathname===g.route?h:read(f);assert.ok(ids(source).includes(decodeURIComponent(url.hash.slice(1))),g.file+' fragment '+u[1]);}}
 for(let i=1;i<=g.sources.length;i++)assert.ok(h.includes('href="#source-'+i+'"')&&h.includes('id="source-'+i+'"'),'Visible inline source '+i);
 assert.ok(!/Most running problems are mechanical|clear waste products|gluteus medius.{0,90}weak|damage is done to the early aerobic|Tempo run and threshold run describe the same zone|High shoulders also compress/.test(h),'Retired unsupported claims');
 assert.ok(h.includes('href="/#begin"'),'Contextual coaching route');
}
const entries=require('../scripts/discovery-catalog.cjs').entries,prior=JSON.parse(old('search-index.json')),index=JSON.parse(read('search-index.json'));
assert.equal(index.length,prior.length);assert.deepEqual(index.map(x=>x.url),prior.map(x=>x.url));
const changedURLs=new Set([...guides.map(x=>x.route),...require('../scripts/training-guide-content.cjs').map(x=>x.route)]);for(const e of index)if(!changedURLs.has(e.url))assert.deepEqual(e,prior.find(x=>x.url===e.url),'Unrelated discovery record '+e.url);
const oldLib=old('library.html').toString(),newLib=read('library.html');
const removeReviewed=h=>h.replace(/<script[^>]*id="discovery-schema"[\s\S]*?<\/script>/g,'').replace(/<li><a class="discovery-link" href="\/(?:easy-run|threshold-training|long-run-pace|running-form-errors|training-week|strength|recovery|fueling)">[\s\S]*?<\/li>/g,'');
assert.equal(removeReviewed(newLib),removeReviewed(oldLib),'Only the eight reviewed catalog labels and matched ItemList change');
assert.equal(15+3*6+2*2+10,47);assert.equal(5+20+5,30);assert.equal(10+40+10,60);assert.equal(160*1.05,168);
assert.ok(!/fetch\(|localStorage|innerHTML|eval\(/.test(read('js/guide-tools.js')),'No tracking, uploads, or unsafe HTML');
assert.ok(read('js/guide-tools.js').includes('visibilitychange')&&read('js/guide-tools.js').includes('60000'));
console.log(`PASS: four guides, five exact HTML snapshots, ${untouched} unchanged HTML pages, protected tools/media/purchase sources, preserved fragments, source citations, metadata/schema, and deterministic builds.`);
