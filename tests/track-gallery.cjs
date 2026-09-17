'use strict';
const contact=require('../scripts/contact-notes-state.cjs');
const current=require('../scripts/current-release-state.cjs');
const protectedBaseline=require('../scripts/protected-site-baseline.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const cfg=JSON.parse(read('track/albums.json')),m=JSON.parse(read('track/media-manifest.json'));
const html=f=>read(f),s=require('../scripts/share-metadata.cjs');
const editorial=require('../scripts/guide-state.cjs');
const old=process.env.GALLERY_BASELINE||'2c966476fe760eee5fb2b7e63ef719862c295ccc';
const original=f=>cp.execFileSync('git',['show',protectedBaseline(f,old)+':'+f],{cwd:ROOT,maxBuffer:10_000_000});
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',old],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
for(const f of files.filter(f=>f.endsWith('.html')&&!['library.html','thursday.html'].includes(f)))if(!editorial.verify(f,read(f)))assert.equal(sha(fs.readFileSync(path.join(ROOT,f))),sha(original(f)),f+' unchanged');
for(const f of ['css/cream-reading.css','css/homepage.css','js/homepage-motion.js','js/coaching-measurement.js','netlify.toml','_redirects','_headers','plans/race-pace-durability/source.js'])if(!current.verify(f,read(f)))assert.equal(sha(fs.readFileSync(path.join(ROOT,f))),sha(original(f)),f+' protected');
const clean=h=>h.replace(/<nav class="site-wayfinding"[\s\S]*?<\/nav>/g,'');
assert.equal(clean(html('thursday.html')),clean(original('thursday.html').toString()),'Only Thursday navigation changes');
assert.ok(html('thursday.html').includes('href="/track/"'),'Gallery discoverable from the actual session page');
const stripLibrary=h=>h.replace(/<script[^>]*id="discovery-schema"[\s\S]*?<\/script>/g,'').replace(/<li><a class="discovery-link" href="\/track\/">[\s\S]*?<\/li>/,'');
if(!editorial.verify('library.html',html('library.html')))assert.equal(stripLibrary(html('library.html')),stripLibrary(original('library.html').toString()),'Existing Library content preserved, one catalog addition');
assert.deepEqual(m.albums.map(a=>a.slug).sort(),cfg.albums.filter(a=>a.published===true).map(a=>a.slug).sort());
let mediaCount=0,assetCount=0;
for(const a of m.albums){
 const source=cfg.albums.find(x=>x.slug===a.slug),route='/track/'+a.slug+'/',h=html('track/'+a.slug+'/index.html');
 assert.ok(source.publicationBasis);assert.equal(a.kind,source.kind);assert.equal(a.date,source.date);
 if(a.kind==='selection')assert.ok(h.includes('Undated selection')&&!h.includes('dateCreated'));
 const keys=['og:image','og:title','og:description','og:image:alt','twitter:image','twitter:card'];
 for(const key of keys)assert.equal([...s.head(h).matchAll(/<meta\b[^>]*>/g)].filter(t=>{const v=s.attrs(t[0]);return(v.name||v.property)===key;}).length,1);
 assert.equal(s.canonical(h),s.ORIGIN+route);assert.equal(s.meta(h,'og:image'),s.ORIGIN+a.share.url);
 assert.ok(!/No signup needed|Downloads are web editions|Silent film\. Play to watch|undefined/.test(h),'Removed UI copy stays removed');
 assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.ok(h.includes('aria-labelledby="viewer-title"'));
 const schema=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.mainEntity.itemListElement.length,a.media.length);
 for(const item of a.media){mediaCount++;const selected=source.media.find(x=>x.id===item.id);
  assert.ok(h.includes('id="frame-'+item.id+'"'));assert.ok(h.includes('href="'+item.full.url+'"'));assert.equal(item.alt,selected.alt);
  assert.equal(sha(fs.readFileSync(path.join(ROOT,selected.source))),selected.sourceSha256,'Original media preserved');
  for(const asset of [item.thumb,item.preview,item.full,item.download].filter(Boolean)){assetCount++;const bytes=fs.readFileSync(path.join(ROOT,asset.url));assert.equal(sha(bytes),asset.sha256);assert.equal(bytes.length,asset.bytes);}
  assert.ok(item.thumb.bytes<200000,'Small preview images');
  if(item.type==='video'){assert.ok(item.silent);assert.ok(item.duration>0);assert.deepEqual(item.posterSelection,Object.fromEntries(['posterTime','posterSource','posterSha256'].filter(k=>k in selected).map(k=>[k,selected[k]])));}
  if(item.download)assert.ok(selected.downloadApproved===true);
 }
 const si=s.imageInfo(ROOT,s.ORIGIN+a.share.url);assert.equal(si.width,1200);assert.equal(si.height,630);assert.equal(si.type,'image/jpeg');
 for(const asset of [a.share,a.photoArchive].filter(Boolean)){assert.equal(sha(fs.readFileSync(path.join(ROOT,asset.url))),asset.sha256);}
 assert.ok(html('track/index.html').includes('href="'+route+'"'));
}
assert.ok(!/\b(?:innerHTML|eval|localStorage|setInterval)\b/.test(read('js/track-gallery.js')),'No unsafe interpolation, tracking store or autoplay timer');
assert.ok(read('css/track-gallery.css').includes('prefers-reduced-motion'));
const index=JSON.parse(read('search-index.json'));assert.ok(index.some(x=>x.url==='/track/'));
assert.ok(read('sitemap.xml').includes('<loc>https://speedandform.com/track/</loc>'));
for(const a of m.albums)assert.ok(read('sitemap.xml').includes('<loc>https://speedandform.com/track/'+a.slug+'/</loc>'));
console.log(`PASS: ${m.albums.length} published album(s), ${mediaCount} selected photographs/films, ${assetCount} exact media representations, metadata, download approval, public discovery and existing HTML/critical-flow boundaries.`);
