'use strict';
/* Shared menu coverage and regeneration. No historical page snapshots. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {collect,transformHtml}=require('../scripts/build-site-menu.cjs');
const files=collect(root),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const required=['index.html','form/index.html','forge-sculpt/index.html','coaching/miami/index.html','coaching/strength/index.html','analysis/index.html','plans/index.html','library.html','search.html','404.html','library/easy-days/index.html','labs/speed-that-endures/index.html','thursday.html','form/support/index.html','form/privacy/index.html','form/terms/index.html','forge-sculpt/support/index.html','forge-sculpt/privacy/index.html','forge-sculpt/terms/index.html'];
for(const file of required)assert.ok(files.includes(file),'Shared menu covers '+file);
assert.equal(new Set(files).size,files.length,'Each source is projected once');
assert.ok(files.length>=100,'Most of the reviewed public site is covered');
const privatePath=/^(?:coach(?:\/|\.html)|athletes?(?:\/|\.html)|auth\/|record(?:\/|\.html)|private\/|forge-app\/|forge-sculpt\/train\/|mockup|design-review\/|docs\/|tests\/|assets\/)/;
const noindexExceptions=new Set(['search.html','404.html',...['form','forge-sculpt'].flatMap(app=>['support','privacy','terms'].map(page=>app+'/'+page+'/index.html'))]);
const fragment=read('scripts/site-menu-panel.html').trim();
assert.ok(fragment.includes('id="site-menu"'),'One canonical shared panel');
const count=(s,re)=>[...s.matchAll(re)].length;
// Track HTML ancestry without interpreting script/template-string contents.
function menuParent(html){
 const source=html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi,'');
 const stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of source.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  const tag=m[1].toLowerCase(),token=m[0];
  if(token.startsWith('</')){const i=stack.lastIndexOf(tag);if(i>=0)stack.length=i;continue;}
  if(/\bid=["']site-menu["']/.test(token))return stack.at(-1);
  if(!voids.has(tag)&&!token.endsWith('/>'))stack.push(tag);
 }
 return null;
}
const expected=['/coaching/miami/','/coaching/strength/','/analysis/','/form/','/forge-sculpt/','/plans/','/thursday','/runs/','/people/','/library','/labs/','/contact'];
for(const file of files){
 assert.ok(!privatePath.test(file),'Private/app execution routes excluded: '+file);
 const html=read(file);
 const robots=[...html.matchAll(/<meta\b[^>]*>/gi)].filter(m=>/\bname=["']robots["']/i.test(m[0])).map(m=>m[0]).join('');
 assert.ok(!/noindex/i.test(robots)||noindexExceptions.has(file),'Unlisted surfaces excluded: '+file);
 assert.equal(count(html,/\bid=["']site-menu["']/g),1,file+': one drawer');
 assert.equal(count(html,/\bclass=["'][^"']*\bsf-menu-toggle\b[^"']*["']/g),1,file+': one Menu control');
 assert.equal(menuParent(html),'body',file+': drawer is a direct body child');
 assert.ok(/aria-controls=["']site-menu["']/.test(html),file+': control names its drawer');
 assert.ok(/href=["']#site-menu["']/.test(html),file+': no-JavaScript link');
 assert.equal(count(html,/<link\b[^>]*href=["']\/css\/sf-menu\.css\?v=20261013-shared["'][^>]*>/g),1,file+': current shared style once');
 assert.equal(count(html,/<script\b[^>]*src=["']\/js\/sf-menu\.js\?v=20261013-shared["'][^>]*>/g),1,file+': current shared script once');
 assert.ok(html.includes(fragment),file+': canonical menu content');
 assert.equal(transformHtml(html,file),html,file+': regeneration is idempotent');
 for(const href of expected)assert.ok(fragment.includes('href="'+href+'"'),'Menu target: '+href);
}
for(const file of ['coach/index.html','coach/ops/index.html','athlete/index.html','athletes/index.html','auth/app-signin/index.html','record/index.html','forge-app/index.html','forge-sculpt/train/index.html','plans/devin-week-01/index.html','labs/devin/index.html','plans/race-pace-durability/thanks/index.html','plans/race-pace-durability/access/index.html'])assert.ok(!files.includes(file),'Execution/private route remains outside menu projection: '+file);
const js=read('js/sf-menu.js');assert.ok(js.includes('Escape')&&js.includes('Tab')&&js.includes('inert'),'Keyboard and modal isolation remain supported');
console.log(`PASS: ${files.length} shared-menu pages; coverage, private exclusions, one canonical drawer, direct-body placement, no-JS links and idempotent regeneration.`);
