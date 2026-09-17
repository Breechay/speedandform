'use strict';
const protectedBaseline=require('../scripts/protected-site-baseline.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const s=require('../scripts/share-metadata.cjs'),state=require('../scripts/contact-notes-state.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const old=f=>cp.execFileSync('git',['show',protectedBaseline(f,state.manifest.baseCommit)+':'+f],{cwd:ROOT,maxBuffer:20_000_000});
const notes=require('../scripts/field-notes-content.cjs'),{published,route}=require('../scripts/build-contact-notes.cjs');
const ids=h=>[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const resolve=u=>{const r=u.pathname.slice(1);return [r||'index.html',r+'.html',r.replace(/\/$/,'')+'/index.html'].find(f=>fs.existsSync(path.join(ROOT,f))&&fs.statSync(path.join(ROOT,f)).isFile());};
const pages=state.manifest.pages;assert.equal(pages.length,9);assert.equal(published().length,4);
assert.deepEqual(pages.filter(p=>p.beforeSha256).map(p=>p.file).sort(),['404.html','field-notes.html','library.html','search.html']);
for(const row of [...pages,...state.manifest.assets,...state.manifest.integration]){state.verify(row.file,fs.readFileSync(path.join(ROOT,row.file)));if(row.beforeSha256)assert.equal(s.sha(old(row.file)),row.beforeSha256,row.file+' original source');}
const changed=new Set(pages.map(p=>p.file));let preserved=0;
for(const f of cp.execFileSync('git',['ls-tree','-r','--name-only',state.manifest.baseCommit],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.html')&&!changed.has(f))){assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected HTML');preserved++;}
for(const f of ['netlify.toml','robots.txt','_redirects','css/cream-reading.css','css/homepage.css','js/coaching-measurement.js','js/coaching-choice.js','js/homepage-motion.js','css/form-landing.css','js/form-landing.js','css/sculpt-landing.css','js/sculpt-landing.js','track/albums.json','track/media-manifest.json','css/track-gallery.css','js/track-gallery.js','js/guide-tools.js','js/training-tools.js','plans/race-pace-durability/source.js','forge-sculpt/train/data/forge-portal-programs.json'])assert.equal(s.sha(read(f)),s.sha(old(f)),f+' not changed by publishing');
// The public Library keeps every earlier entry and question. Only one new index joins it.
const beforeIndex=JSON.parse(old('search-index.json')),afterIndex=JSON.parse(read('search-index.json'));
assert.equal(afterIndex.length,beforeIndex.length+1);assert.deepEqual(afterIndex.filter(e=>e.url!=='/field-notes'),beforeIndex);
const beforeUrls=[...old('sitemap.xml').toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
const afterUrls=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
assert.equal(afterUrls.length,beforeUrls.length+5);for(const url of beforeUrls)assert.ok(afterUrls.includes(url));
const additions=afterUrls.filter(u=>!beforeUrls.includes(u)).sort();assert.deepEqual(additions,[s.ORIGIN+'/ask/',...published().map(n=>s.ORIGIN+route(n))].sort());
const removeFooter=h=>h.replace('<a href="/field-notes">Field Notes</a><a href="/ask/">Ask Brice</a>','');
for(const f of ['search.html','404.html'])assert.equal(removeFooter(read(f)),old(f).toString(),f+' only the two useful footer routes');
const strip=h=>removeFooter(h).replace(/<script[^>]*id="discovery-schema"[\s\S]*?<\/script>/g,'').replace(/<li><a class="discovery-link" href="\/field-notes">[\s\S]*?<\/li>/g,'').replace('<p class="discovery-question">Just have a question? <a href="/ask/">Ask Brice directly →</a></p>','');
assert.equal(strip(read('library.html')),strip(old('library.html').toString()),'Library additions do not rewrite any old guide description or coaching message');
assert.ok(read('_headers').startsWith(old('_headers').toString()),'Only scoped headers appended');
assert.ok(read('_headers').includes('/field-notes/feed.xml\n  Content-Type: application/rss+xml; charset=utf-8'));
for(const row of pages){const h=read(row.file);assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/<main\b/g)||[]).length,1);assert.equal(new Set(ids(h)).size,ids(h).length);assert.equal(s.canonical(h,row.file),row.url);
 for(const tag of h.matchAll(/(?:href|src)="([^"]+)"/g)){const v=s.attrs(tag[0]),a=v.href||v.src;if(a.startsWith('mailto:')){assert.equal(new URL(a).pathname,'brice@speedandform.com');continue;}const u=new URL(a,row.url);if(u.origin!==s.ORIGIN)continue;const f=resolve(u);assert.ok(f,row.file+' local path '+u.pathname);if(u.hash)assert.ok(ids(read(f)).includes(decodeURIComponent(u.hash.slice(1))),row.file+' local fragment '+u.hash);}
 if(['library.html','search.html','404.html'].includes(row.file))continue;
 assert.ok(h.includes('data-contact-notes="20260917-p6a"')&&h.includes('data-form-reading="20260916"'));
 for(const key of ['og:title','og:description','og:type','og:url','og:locale','og:image','og:image:alt','twitter:card'])assert.ok(s.meta(h,key));
 assert.equal(s.meta(h,'og:image'),s.ORIGIN+s.DEFAULT_IMAGE);assert.equal(s.meta(h,'og:title'),s.meta(h,'twitter:title'));assert.equal(s.meta(h,'description'),s.meta(h,'og:description'));
 assert.ok(h.includes('rel="alternate" type="application/rss+xml"'));assert.ok(!/fonts.googleapis|data-netlify|action="https:|Newsletter signup|Subscribe now|5:50|Hideout/.test(h));
}
for(const n of published()){const h=read('field-notes/'+n.slug+'/index.html');for(const text of n.paragraphs)assert.ok(h.includes(require('../scripts/build-contact-notes.cjs').esc(text)));assert.ok(n.originalNotes.length&&n.revised==='2026-09-17');assert.ok(!h.includes('datePublished'),'No invented first publication date');}
notes.push({slug:'draft-not-published',published:false});assert.equal(published().length,4);notes.pop();
notes.push({...notes[0]});assert.throws(published,/duplicate/);notes.pop();
const feed=read('field-notes/feed.xml');assert.equal((feed.match(/<item>/g)||[]).length,4+JSON.parse(read('track/media-manifest.json')).albums.length);assert.ok(!/pubDate|enclosure|draft-not-published/.test(feed));
const {draft}=require('../js/contact-notes.js');const a=draft('Bonjour José\nHow should I run?',{title:'Easy running',url:'/easy-run'}),u=new URL(a.href);
assert.equal(u.protocol,'mailto:');assert.equal(u.pathname,'brice@speedandform.com');assert.equal(u.searchParams.get('subject'),'Question about Easy running');assert.equal(u.searchParams.get('body'),'About: Easy running\r\nhttps://speedandform.com/easy-run\r\n\r\nBonjour José\r\nHow should I run?');
assert.equal(draft('<b>&? # + %').body,'<b>&? # + %');assert.ok(!draft('Question',{url:'//evil.example',title:'Evil'}).body.includes('evil'));assert.ok(!draft('Question',{url:'https://evil.example',title:'Evil'}).body.includes('evil'));assert.equal(draft(null).body,'');assert.equal(draft('x'.repeat(1000)).body.length,1000);
const bad=draft('Hello',{title:'Subject\r\nBcc: evil@example.com',url:'/easy-run'});assert.ok(!new URL(bad.href).searchParams.get('subject').includes('\n'));assert.equal([...new URL(bad.href).searchParams.keys()].join(','),'subject,body');
const js=read('js/contact-notes.js');assert.ok(!/innerHTML|localStorage|sessionStorage|sendBeacon|XMLHttpRequest|eval\(|method\s*:\s*['"]POST/.test(js));assert.equal((js.match(/fetch\(/g)||[]).length,1);assert.ok(js.includes("fetch('/js/question-contexts.json'"));
const ask=read('ask/index.html');assert.ok(!/<form\b|name="email"|data-sf-event|coaching-measurement/.test(ask));assert.ok(ask.includes('Nothing has been sent')||js.includes('Nothing has been sent'));assert.ok(ask.includes('<noscript>'));
const contexts=JSON.parse(read('js/question-contexts.json'));for(const [key,value] of Object.entries(contexts)){assert.match(key,/^[a-z0-9-]+$/);assert.ok(resolve(new URL(value.url,s.ORIGIN)));assert.ok(!value.url.includes('?'));}
console.log(`PASS: ${pages.length} exact pages; ${preserved} unrelated HTML files unchanged; every prior Library entry, private/commercial boundary, safe local composition, published-only feed, metadata, sources and context links.`);
