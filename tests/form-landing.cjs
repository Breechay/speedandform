'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const s=require('../scripts/share-metadata.cjs'),state=require('../scripts/form-landing-state.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const old=f=>cp.execFileSync('git',['show',state.manifest.baseCommit+':'+f],{cwd:ROOT,maxBuffer:20_000_000});
const h=read('form/index.html'),ids=t=>[...t.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(s.sha(old('form/index.html')),state.manifest.pages[0].beforeSha256);state.verify('form/index.html',h);
let count=0;for(const f of cp.execFileSync('git',['ls-tree','-r','--name-only',state.manifest.baseCommit],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.html')&&f!=='form/index.html')){assert.equal(s.sha(read(f)),s.sha(old(f)),f+' unchanged by Pass 5A');count++;}
for(const f of ['css/cream-reading.css','css/homepage.css','js/homepage-motion.js','js/coaching-measurement.js','css/track-gallery.css','js/track-gallery.js','track/albums.json','track/media-manifest.json','netlify.toml','_headers','_redirects','robots.txt','sitemap.xml','search-index.json','scripts/discovery-catalog.cjs','plans/race-pace-durability/source.js'])assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected');
assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/<main\b/g)||[]).length,1);assert.equal(ids(h).length,new Set(ids(h)).size);
for(const id of state.manifest.retainedFragments)assert.ok(ids(h).includes(id),'Preserve #'+id);
assert.equal(s.canonical(h),'https://speedandform.com/form/');assert.equal(s.meta(h,'og:type'),'website');assert.equal(s.meta(h,'og:title'),'FORM Running App | Know Today’s Run');
assert.equal(s.transform(h,'form/index.html',ROOT),h);assert.equal(s.meta(h,'og:image'),s.meta(old('form/index.html').toString(),'og:image'));assert.equal(s.meta(h,'description'),s.meta(h,'og:description'));
const schema=JSON.parse(h.match(/id="form-product-schema">([\s\S]*?)<\/script>/)[1]);const app=schema['@graph'].find(x=>x['@type']==='SoftwareApplication');assert.equal(app.name,'FORM: Running Plans');assert.ok(app.downloadUrl.endsWith('/id6761313085'));assert.ok(!app.offers&&!app.aggregateRating&&!app.review,'No invented permanent free offer or review');
const store=new URL(app.downloadUrl);let storeLinks=0;
for(const match of h.matchAll(/href="([^"]+)"/g)){const u=new URL(s.attrs(match[0]).href,s.ORIGIN+'/form/');if(u.origin!==s.ORIGIN){assert.equal(u.origin,store.origin);assert.equal(u.pathname,store.pathname);storeLinks++;continue;}const r=u.pathname.slice(1),f=[r||'index.html',r+'.html',r.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(ROOT,f))&&fs.statSync(path.join(ROOT,f)).isFile());assert.ok(f,'Working local path '+u);if(u.hash)assert.ok(ids(read(f)).includes(u.hash.slice(1)),'Working fragment '+u);}
assert.ok(storeLinks>=4);for(const a of state.manifest.assets)assert.equal(s.sha(fs.readFileSync(path.join(ROOT,a.file))),a.sha256,'Approved asset '+a.file);
assert.ok(h.includes('Design preview')&&h.includes('Example session')&&h.includes('From the App Store listing.'));
assert.ok(!/Your Village|free forever|free for life|automatically improves|AI coach|is a current-release screenshot/.test(h));assert.ok(!/fonts.googleapis|Cormorant|Jost|data-form-reading/.test(h));
const js=read('js/form-landing.js');assert.ok(!/innerHTML|fetch\(|localStorage|setInterval|eval\(/.test(js));assert.ok(js.includes('ArrowRight')&&js.includes('ArrowLeft')&&js.includes('Home')&&js.includes('End'));assert.ok(h.includes('session-tabs')&&h.includes('hidden'));
const css=read('css/form-landing.css');assert.ok(css.includes('prefers-reduced-motion'));assert.ok(!/overflow(?:-x)?\s*:\s*hidden/.test(css));
function lum(c){const x=c.match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722;}
for(const [a,b] of [['f2f4ef','07110f'],['a4afa9','07110f'],['c9ff36','07110f'],['4b554e','efede7'],['4f5952','efede7']])assert.ok((Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)>=4.5,'Readable contrast '+a+'/'+b);
const dm='docs/audits/DISCOVERY-MANIFEST-20260916.json',before=JSON.parse(old(dm).toString()),after=JSON.parse(read(dm));
for(const x of before.untouchedHtml)if(x.file==='form/index.html')x.sha256=state.manifest.pages[0].afterSha256;assert.deepEqual(after,before,'Only product checksum refreshes discovery manifest');
console.log('PASS: one reviewed FORM landing page; '+count+' other HTML sources unchanged; approved assets, source-based preview labeling, current app ID, fragments, schema, contrast and no new network/data layer.');
