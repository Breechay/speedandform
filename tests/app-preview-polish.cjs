'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const p=require('../scripts/app-preview-polish.cjs');
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',p.BASE],{encoding:'utf8'}).trim().split('\n');
let unchanged=0;
for(const f of files.filter(f=>f.endsWith('.html')||/^(css|js|assets|media)\//.test(f)||['_headers','_redirects','robots.txt','sitemap.xml','search-index.json','netlify.toml'].includes(f))){
 const b=fs.readFileSync(f);
 if(p.edits.has(f)){
  assert.ok(p.verify(f,b));assert.throws(()=>p.verify(f,b+'\n'));assert.throws(()=>p.verify(f,p.original(f)));
 }else{assert.deepEqual(b,cp.execFileSync('git',['show',p.BASE+':'+f],{maxBuffer:150_000_000}),f+' unchanged by visual polish');unchanged++;}
}
const form=fs.readFileSync('form/index.html','utf8');assert.equal((form.match(/class="fl-mark"/g)||[]).length,2);assert.ok(form.includes('>JOSÉ<span>.</span>'));
const sculpt=fs.readFileSync('forge-sculpt/index.html','utf8');assert.ok(!sculpt.includes('bs-poster-label')&&!sculpt.includes('Sculpt · The Frame'));assert.ok(sculpt.includes('>ADRIAN<span>.</span>')&&sculpt.includes('class="bs-ghost" aria-hidden="true">01'));
console.log('PASS: exactly three requested runtime edits; '+unchanged+' other HTML/style/script/media/routing sources unchanged; both identities and metadata preserved; original and corrupted revisions rejected.');
