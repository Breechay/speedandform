'use strict';
// Direct-route regression: a revoked static plan page must have NO resolvable public URL.
// Source stays in git for history; every route to it must be a forced 404 that wins over the file on disk.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {load,resolve}=require('./lib/redirect-rules.cjs');
const root=path.join(__dirname,'..');
const WITHDRAWN=[{dir:'plans/elijah-nov-11',why:'Elijah Savannah prescription, publication elijah-nov11-half revoked 2026-10-18'}];
const rules=load(path.join(root,'_redirects'));
let n=0;
for(const w of WITHDRAWN){
  const base='/'+w.dir;
  assert(fs.existsSync(path.join(root,w.dir,'index.html')),'historical source must be preserved in git: '+w.dir);
  const variants=[base,base+'/',base+'/index.html',base+'/index.htm',base+'/program.json',base+'.html',base+'/?x=1',base+'?utm=1',base+'//',base+'/INDEX.HTML',base.toUpperCase(),base.replace('elijah','Elijah'),base+'/%69ndex.html','/plans//elijah-nov-11/',base+'/anything/else'];
  // every file physically under the directory must also be blocked by its own path
  for(const f of fs.readdirSync(path.join(root,w.dir))) variants.push(base+'/'+f);
  for(const v of variants){
    const r=resolve(rules,v);
    assert(r,`no rule matches ${v}`);
    assert(r.status===404&&r.force,`${v} -> ${r.from} ${r.status}${r.force?'!':''} (needs forced 404)`);
    assert(r.to==='/404.html',`${v} must serve /404.html`);
    n++;
  }
}
// control: a consented, published page must NOT be caught by the withdrawal rules
for(const ok of ['/plans/race-pace-durability','/plans/elijah-savannah-half/','/plans/']){
  const r=resolve(rules,ok); assert(!r||r.status!==404,`${ok} must not be blocked`);
}
// netlify.toml must not rewrite a withdrawn path (rules in _redirects run first, but keep a single owner)
const toml=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
assert(!/elijah-nov-11/.test(toml),'netlify.toml must not reference elijah-nov-11');
// not reachable from sitemap, search index, or any tracked page link
const tracked=require('child_process').execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const f of tracked){
  if(/^(docs|tests)\//.test(f)||f==='_redirects'||f==='scripts/verify-withdrawn-routes.cjs'||f.startsWith('plans/elijah-nov-11/')) continue;
  if(!/\.(html|js|json|xml|txt|cjs|md|toml)$/.test(f)) continue;
  let t; try{t=fs.readFileSync(path.join(root,f),'utf8');}catch(e){continue;}
  assert(!t.includes('plans/elijah-nov-11'),`${f} references the withdrawn page`);
}
console.log(`revoked-plan-routes-not-served: ${n} route variants force-404, source preserved, no inbound references`);
