'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {pages,lessons}=require('../scripts/build-running-lessons.cjs');
const {entries}=require('../scripts/discovery-catalog.cjs');
const {rank,groups}=require('../js/discovery-search.js');
const families=require('../js/library-families.js');
const {render}=require('../scripts/build-guides.cjs');
const share=require('../scripts/share-metadata.cjs');
const index=JSON.parse(fs.readFileSync('search-index.json','utf8'));
assert.equal(index.length,entries.length);
assert.equal(new Set(index.map(e=>e.url)).size,index.length);
const cases=[
 ['what is threshold running','/threshold-training'],['threshold','/threshold-training'],['threshhold','/threshold-training'],
 ['why are my easy runs hard','/library/easy-days/'],['what is VO₂max','/running-terms'],
 ['how fast should my long run be','/long-run-pace'],['how many days a week should i run','/training-week'],
 ['tight hips','/mobility'],['achilles','/pain-map'],['core exercises for runners','/anti-rotation'],
 ['running shoes','/shoes'],['hyrox','/labs/hyrox/'],
 ['six week half marathon plan','/library/6-week-half-marathon-training-plan/'],['8 week plan','/library/8-week-half-marathon-training-plan/']
];
for(const [q,url]of cases)assert.equal(rank(index,q)[0]?.url,url,q);
for(const q of ['submarine','unicorn running pajamas','<script>alert(1)</script>'])assert.deepEqual(rank(index,q),[],q);
assert.ok(!rank([{title:'Fundamentals',keywords:[],description:'General information',url:'/test'}],'mental').length,'word fragments are not words');
const movement=entries.filter(e=>e.category==='movement');
assert.deepEqual(new Set(families.movement.groups.flatMap(g=>g.urls)),new Set(movement.map(e=>e.url)));
for(const e of entries){assert.equal(groups.filter(g=>g[2](e)).length,1,e.url);assert.ok(!/^\/(?:coach|athletes|record|auth|app)(?:\/|$)/.test(e.url),e.url);}
for(const g of pages){
 const h=fs.readFileSync(g.file,'utf8');assert.equal(render(g,h),h,g.file+' deterministic publication');
 const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,g.file+' duplicate fragment');
 for(const [,id]of h.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),g.file+' missing '+id);
 for(const [,json]of h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(json);
 assert.equal(share.canonical(h,g.file),share.ORIGIN+g.route);
 assert.ok(h.includes('tabindex="-1"')&&h.includes('guide-skip'));
 assert.ok(!/<svg|https:\/\/fonts\.googleapis/.test(h),'no unmeasured drawing or external type '+g.file);
 if(g.kind==='Routine'){
  for(const id of ['routine-facts','progress','stop'])assert.ok(ids.includes(id),g.file+' missing '+id);
  assert.ok(h.includes('data-guide-print'));
  assert.equal((h.match(/class="movement-exercise"/g)||[]).length,4);
  assert.equal((h.match(/class="movement-media"/g)||[]).length,4);
  for(let i=1;i<=4;i++)assert.ok(h.includes('href="#exercise-'+i+'"'));
 }
}
assert.equal(lessons.length,9);
for(const g of lessons){const h=fs.readFileSync(g.file,'utf8');assert.equal((h.match(/class="lesson-picture"/g)||[]).length,1,g.file);for(const id of ['this-week','mistakes','fits','check-question'])assert.ok(h.includes('id="'+id+'"'),g.file+' missing '+id);}
const search=fs.readFileSync('search.html','utf8'),library=fs.readFileSync('library.html','utf8');
for(const e of index){assert.ok(search.includes('href="'+e.url+'"'),e.url+' no-JS index');assert.ok(library.includes('href="'+e.url+'"'),e.url+' library');}
for(const kind of ['Lesson','Routine','Shelf'])assert.ok(search.includes('data-library-kind="'+kind+'"'));
assert.ok(search.indexOf('/js/library-families.js')<search.indexOf('/js/discovery-search.js'));
assert.ok(index.some(e=>e.kind==='Routine')&&index.some(e=>e.kind==='Shelf'));
console.log(`PASS: ${pages.length} authored pages, ${cases.length} real search questions, no-JS discovery, public boundaries, stable fragments, routines and lesson sequence.`);
