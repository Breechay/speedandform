'use strict';
// POST-DEPLOY check (read-only GETs). Usage: node scripts/verify-withdrawn-routes.cjs https://<deploy-or-site>
// Exits non-zero if any withdrawn route returns anything but 404. Run on the immutable deploy URL BEFORE publishing, then on production.
const base=(process.argv[2]||'').replace(/\/+$/,'');
if(!/^https:\/\//.test(base)){console.error('usage: node scripts/verify-withdrawn-routes.cjs https://host');process.exit(2);}
const d='/plans/elijah-nov-11';
const paths=[d,d+'/',d+'/index.html',d+'/program.json',d+'.html',d+'/?x=1',d+'/INDEX.HTML',d.replace('elijah','Elijah')+'/','/labs/the-two-curves/published-plan.json','/labs/the-two-curves/published-plan.js','/labs/same-pace-different-problem/plans.json','/labs/same-pace-different-problem/plans.js'];
(async()=>{
  let bad=0;
  for(const p of paths){
    const r=await fetch(base+p,{redirect:'manual',headers:{'cache-control':'no-cache'}});
    const body=await r.text();
    const leak=/Savannah|10K calibration|Ceiling × Durability/i.test(body);
    const ok=r.status===404&&!leak;
    if(!ok)bad++;
    console.log((ok?'ok  ':'FAIL')+' '+r.status+' '+p+(leak?'  (body contains plan text)':'')+(r.headers.get('age')?` age=${r.headers.get('age')}`:''));
  }
  // controls: approved pages still serve
  for(const p of ['/plans/race-pace-durability/','/labs/the-two-curves/']){
    const r=await fetch(base+p,{redirect:'manual'}); const ok=r.status===200; if(!ok)bad++;
    console.log((ok?'ok  ':'FAIL')+' '+r.status+' '+p+' (control, must serve)');
  }
  process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
