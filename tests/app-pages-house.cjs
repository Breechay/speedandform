'use strict';
/* App pages on the house rules (docs/BRAND.md, "App pages"). October 12, 2026.
   Keeps the behavior the Pass 5 tests protected (links, fragments, metadata, structured data, contrast,
   honest preview labels, the sample's validation and data handling) and adds the house checks.
   Only the frozen source hashes were retired: they pinned files that have since changed. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const s=require('../scripts/share-metadata.cjs');
const ROOT=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const ids=t=>[...t.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const visible=h=>h.slice(h.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
function lum(c){const x=c.match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722;}
function contrast(a,b){return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);}
function check(file,o){
  const h=read(file),text=visible(h),route='/'+file.replace(/index\.html$/,'');
  // Structure
  assert.equal((h.match(/<h1\b/g)||[]).length,1,file+': one headline');
  assert.equal((h.match(/<main\b/g)||[]).length,1,file+': one main');
  assert.equal(ids(h).length,new Set(ids(h)).size,file+': unique ids');
  for(const id of o.fragments)assert.ok(ids(h).includes(id),file+': kept public fragment #'+id);
  // Names and the mark
  assert.ok(((h.match(/<title>([^<]*)/)||[])[1]||'').includes(o.name.replace('&','&amp;')),file+': title names the app');
  assert.ok(/class="[^"]*sf-brand[^"]*" href="\/" aria-label="Speed and Form home"><\/a>/.test(h),file+': the SF emblem alone, linking home');
  assert.ok(!o.stray.test(text),file+': no retired product name on the page');
  // Metadata
  assert.equal(s.canonical(h),s.ORIGIN+route,file+': canonical');
  assert.equal(s.meta(h,'og:type'),'website');
  assert.equal(s.meta(h,'og:title'),s.meta(h,'twitter:title'),file+': share titles agree');
  assert.equal(s.meta(h,'description'),s.meta(h,'og:description'),file+': description matches share description');
  assert.equal(s.meta(h,'og:description'),s.meta(h,'twitter:description'));
  assert.ok(s.meta(h,'og:title').includes(o.name),file+': share title names the app');
  const im=s.imageInfo(ROOT,s.meta(h,'og:image'));assert.equal(im.width,1200);assert.equal(im.height,630);assert.ok(im.bytes<500000,file+': share image weight');
  const card=require('../data/public-share.json')[file];assert.ok(card&&card.custom,file+': share card registered as custom art');assert.equal(s.ORIGIN+card.image,s.meta(h,'og:image'));
  // Structured data: valid JSON, plain ampersands, the right app
  const raw=(h.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)||[])[1];assert.ok(raw,file+': structured data present');
  assert.ok(!raw.includes('&amp;'),file+': no HTML entities inside JSON-LD');
  const graph=JSON.parse(raw)['@graph'],app=graph.find(x=>x['@type']==='SoftwareApplication');
  assert.equal(app.name,o.name,file+': structured data names the app');assert.equal(app.downloadUrl,o.store,file+': App Store link');
  // Links: every local path and fragment resolves; every outside link is the app's App Store page
  let storeLinks=0;
  for(const m of h.matchAll(/href="([^"]+)"/g)){const href=s.attrs(m[0]).href;if(/^(mailto:|tel:)/.test(href))continue;
    const u=new URL(href,s.ORIGIN+route);
    if(u.origin!==s.ORIGIN){assert.equal(u.origin+u.pathname,new URL(o.store).origin+new URL(o.store).pathname,file+': outside link '+u);storeLinks++;continue;}
    const r=u.pathname.slice(1),f=[r||'index.html',r+'.html',r.replace(/\/$/,'')+'/index.html',r].find(f=>fs.existsSync(path.join(ROOT,f))&&fs.statSync(path.join(ROOT,f)).isFile());
    assert.ok(f,file+': working local path '+u.pathname);
    if(u.hash&&!/\.(css|js|svg|png|jpg|webp|ico)$/.test(f))assert.ok(ids(read(f)).includes(decodeURIComponent(u.hash.slice(1))),file+': working fragment '+u.pathname+u.hash);}
  assert.ok(storeLinks>=o.minStoreLinks,file+': App Store reachable from the page');
  // Type, motion, reflow
  const sheet=read(o.css),house=sheet.slice(sheet.indexOf('October 12, 2026'));
  assert.ok(house.includes('"Inter Tight"')&&house.includes('"JetBrains Mono"'),o.css+': house typefaces');
  assert.ok(!/fonts\.googleapis|jost-latin/.test(h+house),file+': no outside or retired fonts');
  assert.ok(sheet.includes('prefers-reduced-motion'),o.css+': reduced motion');
  assert.ok(!/overflow(?:-x)?\s*:\s*hidden/.test(sheet),o.css+': do not conceal reflow defects');
  for(const [a,b] of o.contrast)assert.ok(contrast(a,b)>=4.5,o.css+': readable contrast '+a+'/'+b);
  // Honest copy
  for(const t of o.mustSay)assert.ok(h.includes(t),file+': keeps "'+t+'"');
  assert.ok(!o.retired.test(h),file+': retired claims stay out');
  assert.ok(!/plan import|import your (own )?plan|coming soon/i.test(text),file+': unbuilt features are not announced');
  // Page script never stores or sends anything
  const js=read(o.js);assert.ok(!/innerHTML|fetch\(|localStorage|sessionStorage|XMLHttpRequest|sendBeacon|eval\(/.test(js),o.js+': no storage or network');
  return {h,js};
}
module.exports={check};
