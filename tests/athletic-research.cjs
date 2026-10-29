'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'the-athletic-life');
const {render,reports}=require('../scripts/build-athletic-research.cjs');
assert.equal(reports.length,7);
assert.match(fs.readFileSync(path.join(base,'research/sources/the-season.md'),'utf8'),/\]\(https:\/\/selfdeterminationtheory.org\//,'DOCX source hyperlinks survive the reading edition');
for(const r of reports){
 const original=fs.readFileSync(path.join(base,'research',r.original));
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),r.sha256,r.slug+' original integrity');
 const html=fs.readFileSync(path.join(base,'research',r.slug,'index.html'),'utf8');
 assert.match(html,/Independent source report/);assert.ok(html.includes(r.limit.replace(/&/g,'&amp;')));
 assert.match(html,/noindex,follow/,'Original arguments should not masquerade as current search-indexed offers');
 assert.equal((html.match(/<h1>/g)||[]).length,1);
}
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,'brief.md'))).digest('hex'),'e71affb7c9a4474bd51567ba148f0d11fe33cb28424a58f1015e3ca998382ed9','Founding brief is byte-for-byte unchanged');
const sample=render('# Test\n\n## Evidence\n\n<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n| A | B |\n|---|---|\n| one | two |');
assert.doesNotMatch(sample.html,/<script|href="javascript:/);assert.match(sample.html,/scope="col"/);assert.equal(sample.sections.length,2);
const files=['discoveries/index.html','research/index.html','research/assessment/index.html','research/agent-guide/index.html',...reports.map(r=>'research/'+r.slug+'/index.html')];
for(const f of files){const html=fs.readFileSync(path.join(base,f),'utf8');
 for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
  let target=path.join(root,match[1]);if(match[1].endsWith('/'))target=path.join(target,'index.html');assert.ok(fs.existsSync(target)||fs.existsSync(target+'.html')||match[1]==='/athletes/',f+' broken local link '+match[1]);
 }
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+m[1]+'"'),f+' broken anchor '+m[1]);
}
console.log('Athletic Life research: seven original checksums, immutable brief, evidence labels, safe rendering and local links passed.');
