'use strict';
const protectedBaseline=require('../scripts/protected-site-baseline.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const s=require('../scripts/share-metadata.cjs'),cat=require('../scripts/discovery-catalog.cjs'),search=require('../js/discovery-search.js');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const m=JSON.parse(read('docs/audits/DISCOVERY-MANIFEST-20260916.json'));
const editorial=require('../scripts/guide-state.cjs');
const base=process.env.DISCOVERY_BASELINE||m.baseCommit;
const original=f=>cp.execFileSync('git',['show',protectedBaseline(f,base)+':'+f],{cwd:root,encoding:'utf8',maxBuffer:10000000});
const scripts=h=>(h.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi)||[]).filter(x=>!x.includes('application/ld+json')).join('\n');
const body=h=>h.slice(h.toLowerCase().indexOf('</head>'));
assert.equal(m.searchEntries,cat.entries.length);
const index=JSON.parse(read('search-index.json'));
assert.equal(index.length,cat.entries.length);assert.equal(new Set(index.map(e=>e.url)).size,index.length);
assert.equal(search.rank(index,'hyrox')[0].url,'/labs/hyrox/');
assert.ok(search.rank(index,'why are my easy runs hard').slice(0,3).some(e=>e.url==='/library/easy-days/'));
assert.ok(search.rank(index,'threshhold').some(e=>e.title.includes('Threshold')));
assert.deepEqual(search.rank(index,'zzyyxxxq'),[]);assert.deepEqual(search.rank(index,'the and of'),[]);
assert.equal(search.normalize('JOSÉ'),'jose');
const resolve=url=>{let p=new URL(url,s.ORIGIN).pathname.replace(/^\//,'');return [p,p+'.html',p+'/index.html'].find(f=>fs.existsSync(path.join(root,f))&&fs.statSync(path.join(root,f)).isFile());};
for(const e of index){assert.ok(e.title&&e.description);assert.ok(resolve(e.url),e.url);assert.ok(!/\b(?:5:50|Hideout|free forever|pending approval)\b/i.test(JSON.stringify(e)));assert.ok(!/\/(?:coach|athlete|private|auth|record|adrian|purchase-success|mockup)/.test(e.url));}
assert.ok(!read('robots.txt').includes('Disallow: /assets/'));
assert.ok(!read('sitemap.xml').includes('<lastmod>'),'Do not invent refresh dates');
const locs=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);assert.equal(locs.length,m.sitemap.length);assert.equal(new Set(locs).size,locs.length);
for(const {file,url} of m.sitemap){assert.equal(s.canonical(read(file),file),url);assert.equal([...s.head(read(file)).matchAll(/<link\b[^>]*>/gi)].filter(x=>s.attrs(x[0]).rel==='canonical').length,1,file+' explicit canonical');assert.ok(locs.includes(url));assert.ok(!/noindex/i.test(s.meta(read(file),'robots')));assert.ok(!cat.ARCHIVE.some(r=>url===s.ORIGIN+'/'+r));}
for(const x of ['/plans/','/labs/','/labs/speed-that-endures/','/library/easy-days/','/form/'])assert.ok(locs.includes(s.ORIGIN+x),x);
assert.ok(!locs.some(x=>/\/search$|\/app$|\/adrian/.test(x)));
for(const row of m.untouchedHtml)if(!editorial.verify(row.file,read(row.file)))assert.equal(s.sha(read(row.file)),row.sha256,row.file+' untouched');
for(const row of m.changedHtml){const h=read(row.file),old=original(row.file);assert.equal(s.sha(old),row.beforeSha256,row.file+' baseline');if(editorial.verify(row.file,h))continue;assert.equal(s.sha(h),row.afterSha256,row.file+' approved source');
 if(['library.html','search.html','404.html'].includes(row.file))continue;
 assert.equal(scripts(h),scripts(old),row.file+' scripts unchanged');
 let clean=body(h).replace(/\n?<nav class="site-wayfinding"[\s\S]*?<\/nav>/g,'').replace(/\n?<aside class="discovery-return" data-discovery-archive>[\s\S]*?<\/aside>/g,'');
 if(row.file==='index.html')clean=clean.replace('<a href="/library">Library</a>','<a class="hide-mobile" href="#practice">The method</a>').replace('<a href="/library">Library <span>↗</span></a><a href="/thursday">Run with us <span>↗</span></a>','<a href="/library">Reading <span>↗</span></a>');
 assert.equal(clean,body(old),row.file+' content preserved outside scoped navigation/notice');
}
for(const f of ['css/cream-reading.css','scripts/build-cream-reading.cjs','css/homepage.css','js/homepage-motion.js','js/coaching-measurement.js','plans/race-pace-durability/source.js','netlify.toml'])assert.equal(read(f),original(f),f+' protected');
for(const file of ['library.html','search.html','404.html']){const h=read(file);assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.ok(h.includes('role="search"'));assert.ok(h.includes('for="discovery-query"'));for(const href of ['/library','/plans/','/thursday','/#begin'])assert.ok(h.includes('href="'+href+'"'));for(const a of h.matchAll(/href="(\/[^"#?]*)[^\"]*"/g))assert.ok(resolve(a[1]),file+': '+a[1]);}
const library=read('library.html');for(const e of index)assert.ok(library.includes('href="'+e.url+'"'),e.url+' crawlable without JS');
const schema=JSON.parse(library.match(/id="discovery-schema">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.mainEntity.itemListElement.length,index.length);
assert.equal(s.meta(read('search.html'),'robots'),'noindex,follow');assert.equal(s.meta(read('404.html'),'robots'),'noindex,follow');assert.ok(read('_redirects').startsWith('# Pass 2: verified app alias'));
assert.ok(!read('js/discovery-search.js').includes('innerHTML'),'Search strings must not enter HTML');
console.log(`PASS: ${index.length} search records, ${locs.length} canonical URLs, ${m.changedHtml.length} scoped HTML changes, ${m.untouchedHtml.length} untouched HTML files, preserved article/script/critical-flow sources, valid links, safe search ranking and schema.`);
