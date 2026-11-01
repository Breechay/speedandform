'use strict';
// Committed study-plan snapshots are kept for builds/CI but must never be served or referenced by a public page.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const redirects=fs.readFileSync(path.join(ROOT,'_redirects'),'utf8').split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
const SNAPSHOTS=['labs/the-two-curves/published-plan.json','labs/the-two-curves/published-plan.js','labs/same-pace-different-problem/plans.json','labs/same-pace-different-problem/plans.js'];
for(const f of SNAPSHOTS){
 assert.ok(fs.existsSync(path.join(ROOT,f)),f+' stays in the repository (not deleted)');
 assert.ok(redirects.some(l=>l.split(/\s+/)[0]==='/'+f&&/\b404!$/.test(l)),f+' is force-404 in _redirects');
}
// no tracked HTML/JS page loads or fetches a snapshot
const tracked=cp.execFileSync('git',['ls-files','-z','--','*.html','*.js','*.cjs','*.mjs'],{cwd:ROOT}).toString().split('\0').filter(Boolean);
// KNOWN OPEN FINDING (not part of this fix): plans/elijah-nov-11 is a separate, noindex static page for Elijah's earlier plan
// (publication elijah-nov11-half, revoked Oct 18). It needs its own decision; it is listed here so the exception is explicit.
const KNOWN_STATIC_PLAN_PAGES=['plans/elijah-nov-11/index.html'];
const allowed=new Set([...KNOWN_STATIC_PLAN_PAGES,...SNAPSHOTS,'tests/simon-study-browser.cjs','tests/simon-study-r2.cjs','tests/study-withdrawal-fallback-browser.cjs','tests/study-snapshots-not-served.cjs','scripts/studies/build-simon-r2.cjs']);
const offenders=[];
for(const f of tracked){
 if(allowed.has(f)||f.startsWith('docs/'))continue;
 const t=fs.readFileSync(path.join(ROOT,f),'utf8');
 if(/same-pace-different-problem\/plans\.(js|json)|the-two-curves\/published-plan\.(js|json)|FORMStudyPlans|FORMSimonPublishedPlan/.test(t))offenders.push(f);
}
assert.deepEqual(offenders,[],'public pages must not reference a committed plan snapshot: '+offenders.join(', '));
// no baked plan blocks in static HTML, and no distinctive plan text from the snapshots anywhere outside the snapshots themselves
cp.execFileSync('node',['scripts/studies/neutralize-baked-study-plans.cjs','--check'],{cwd:ROOT,stdio:'pipe'});
const distinct=new Set();
for(const f of ['labs/same-pace-different-problem/plans.json','labs/the-two-curves/published-plan.json']){
 const j=JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8')),list=j.athletes?Object.values(j.athletes):[j];
 for(const e of list)for(const w of e.payload.weeks)for(const x of w.sessions){if(x.title&&x.title.length>18)distinct.add(x.title);}
}
const leaks=[];
for(const f of tracked){
 if(allowed.has(f)||f.startsWith('docs/')||f.startsWith('tests/'))continue;
 const t=fs.readFileSync(path.join(ROOT,f),'utf8');
 for(const d of distinct)if(t.includes(d))leaks.push(f+': '+d);
}
assert.deepEqual(leaks,[],'plan text from a committed snapshot appears elsewhere in the site: '+leaks.slice(0,3).join(' | '));
console.log(JSON.stringify({result:'passed',snapshots_blocked:SNAPSHOTS.length,distinct_plan_titles_checked:distinct.size,pages_checked:tracked.length}));
