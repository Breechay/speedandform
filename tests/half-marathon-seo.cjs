'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const share=require('../scripts/share-metadata.cjs'),cards=require('../data/half-marathon-share.json');
const {routes}=require('../scripts/build-half-marathon.cjs');
const origin='https://speedandform.com',root=path.resolve(__dirname,'..');
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
const disallowed=[...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map(m=>m[1]);
const subjects=[...Object.entries(routes).map(([key,route])=>({key,route,file:route.slice(1)+'index.html'})),{key:'calculator',route:'/split-calculator',file:'split-calculator.html'}];
const seen=new Set();
for(const {key,route,file} of subjects){
  const html=fs.readFileSync(path.join(root,file),'utf8'),head=share.head(html),canonical=origin+route;
  const metas=[...head.matchAll(/<meta\b[^>]*>/g)].map(m=>share.attrs(m[0]));
  for(const name of ['description','robots','og:title','og:description','og:url','og:image','og:image:alt','og:image:width','og:image:height','twitter:card','twitter:image','twitter:image:alt'])assert.equal(metas.filter(m=>(m.property||m.name)===name).length,1,file+' duplicate/missing '+name);
  assert.equal((head.match(/<title>/g)||[]).length,1);assert.equal((head.match(/rel="canonical"/g)||[]).length,1);
  assert.equal(share.canonical(html,file),canonical);assert.equal(share.meta(html,'og:url'),canonical);
  assert.ok(!/noindex|nofollow/i.test(share.meta(html,'robots')));assert.ok(share.meta(html,'robots').includes('max-image-preview:large'));
  const image=origin+cards[key].image;assert.equal(share.meta(html,'og:image'),image);assert.equal(share.meta(html,'og:image:secure_url'),image);assert.equal(share.meta(html,'twitter:image'),image);
  assert.equal(share.meta(html,'og:image:alt'),cards[key].alt);assert.equal(share.meta(html,'twitter:image:alt'),cards[key].alt);
  const info=share.imageInfo(root,image);assert.equal(info.width,1200);assert.equal(info.height,630);assert.equal(info.type,'image/jpeg');assert.ok(info.bytes<500000,'Card too heavy');
  assert.equal(share.meta(html,'og:image:type'),info.type);assert.equal(share.meta(html,'og:image:width'),'1200');assert.equal(share.meta(html,'og:image:height'),'630');
  assert.equal(share.meta(html,'twitter:card'),'summary_large_image');assert.equal(share.meta(html,'og:locale'),'en_US');
  assert.ok(!seen.has(image));seen.add(image);
  for(const blocked of disallowed){assert.ok(!route.startsWith(blocked));assert.ok(!cards[key].image.startsWith(blocked));}
  assert.equal(sitemap.split('<loc>'+canonical+'</loc>').length-1,1,file+' sitemap membership');
  if(key!=='calculator'){
    const schema=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@type'],'Article');assert.equal(schema.url,canonical);assert.equal(schema.mainEntityOfPage['@id'],canonical);assert.equal(schema.image.url,image);assert.equal(schema.headline,share.meta(html,'og:title'));assert.equal(schema.datePublished,'2026-10-06');assert.equal(schema.dateModified,'2026-10-06');
  } else assert.equal(share.transform(html,file,root),html,'Existing share builder must preserve calculator card');
}
console.log('PASS: four unique share cards, valid JPEG bytes/dimensions, complete metadata, canonical/schema parity, sitemap and robots checks.');
