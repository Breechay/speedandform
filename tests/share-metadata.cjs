'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=require('../scripts/share-metadata.cjs');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/audits/SHARE-METADATA-MANIFEST-20260916.json'),'utf8'));
// Pass 1 remains an immutable historical receipt. Later approved edits carry their own exact snapshots.
const dp=path.join(root,'docs/audits/DISCOVERY-MANIFEST-20260916.json');
const later=fs.existsSync(dp)?JSON.parse(fs.readFileSync(dp,'utf8')).changedHtml:[];
const editorial=require('../scripts/guide-state.cjs');
const updates=new Map([...later.map(r=>[r.file,r]),...editorial.latestUpdates]);
for(const [file] of editorial.latestUpdates)editorial.verify(file,fs.readFileSync(path.join(root,file),'utf8'));
assert.deepEqual(manifest.counts,{pages:84,replace:72,preserve:12,excluded:91});
assert.equal(new Set(s.PAGES).size,84);
const required=['og:type','og:title','og:description','og:url','og:site_name','og:locale','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'];
for(const row of manifest.pages){
 const html=fs.readFileSync(path.join(root,row.file),'utf8');
 const update=updates.get(row.file);
 for(const key of required){
  const matches=[...s.head(html).matchAll(/<meta\b[^>]*>/gi)].filter(m=>{const a=s.attrs(m[0]);return (a.property||a.name)===key;});
  assert.equal(matches.length,1,`${row.file}: exactly one ${key}`);
  assert.ok(s.meta(html,key),`${row.file}: nonempty ${key}`);
 }
 assert.equal(s.meta(html,'og:image'),row.image);
 assert.equal(s.meta(html,'twitter:image'),row.image);
 assert.equal(s.meta(html,'og:image:secure_url'),row.image);
 assert.equal(s.meta(html,'og:title'),update?.preview?.title||row.title);
 assert.equal(s.meta(html,'twitter:title'),update?.preview?.title||row.title);
 assert.equal(s.meta(html,'twitter:description'),update?.preview?.description||row.description);
 assert.equal(s.meta(html,'twitter:card'),'summary_large_image');
 assert.equal(s.meta(html,'og:image:alt'),s.meta(html,'twitter:image:alt'));
 assert.equal(s.meta(html,'og:url'),s.canonical(html,row.file));
 assert.equal(s.sha(html.slice(html.toLowerCase().indexOf('</head>'))),update?.bodySha256||row.bodySha256,`${row.file}: body and scripts untouched`);
 // Exact later snapshots can intentionally author metadata outside the original pass-1 formatter.
 // Only a reviewed update carrying this explicit flag may skip transformer idempotence.
 if(!(update&&update.allowShareTransformRewrite) && (row.file!=='search.html'||!update)) assert.equal(s.transform(html,row.file,root),html,`${row.file}: repeat run is a no-op`);
 const info=s.imageInfo(root,row.image);
 assert.equal(String(info.width),s.meta(html,'og:image:width'));
 assert.equal(String(info.height),s.meta(html,'og:image:height'));
 assert.equal(info.type,s.meta(html,'og:image:type'));
 assert.equal(info.sha256,row.imageSha256,`${row.file}: approved image bytes`);
 assert.ok(info.bytes<5_000_000);
 if(row.action==='preserve') assert.equal(row.previousImage,row.image,`${row.file}: dedicated URL unchanged`);
 else assert.equal(row.image,s.ORIGIN+'/og/form-share-20260916.jpg');
 if(row.file==='search.html'&&update) assert.match(s.meta(html,'robots'),/noindex/); else assert.ok(!/noindex/i.test(s.meta(html,'robots')));
}
for(const row of manifest.excluded) assert.equal(s.sha(fs.readFileSync(path.join(root,row.file))),updates.get(row.file)?.afterSha256||row.sha256,`${row.file}: excluded page unchanged or exact later approved source`);
const card=s.imageInfo(root,s.DEFAULT_IMAGE);
assert.equal(card.width,1200);assert.equal(card.height,630);assert.equal(card.type,'image/jpeg');assert.ok(card.bytes<150000);
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const schema=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema['@graph'].find(x=>x['@type']==='WebPage').primaryImageOfPage.url,s.ORIGIN+s.DEFAULT_IMAGE);
assert.throws(()=>s.transform(home.replace('index,follow','noindex,nofollow'),'index.html',root),/noindex/);
assert.throws(()=>s.transform(home.replaceAll(s.ORIGIN+s.DEFAULT_IMAGE,s.ORIGIN+'/og/new-approved-card.jpg'),'index.html',root),/Unexpected dedicated/);
assert.equal(s.transform(home,'coach/index.html',root),home);
const fixture='<script>const example=\'<meta property="og:image" content="do not touch">\';</script>';
const withScript=home.replace('</head>',fixture+'\n</head>');
assert.ok(s.transform(withScript,'index.html',root).includes(fixture));
const duplicate=home.replace('</head>','<meta property="og:image" content="wrong">\n</head>');
assert.equal([...s.head(duplicate).matchAll(/<meta\b[^>]*>/gi)].filter(m=>s.attrs(m[0]).property==='og:image').length,2);
console.log(`PASS: ${manifest.counts.pages} public previews, 72 approved defaults, 12 dedicated cards, ${manifest.counts.excluded} excluded pages, JPEG dimensions, versioned body snapshots, schema consistency, no-op repeat and refusal guards.`);
