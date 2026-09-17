'use strict';
// Read-only live verification. No sign-in, payment, email or athlete writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),ORIGIN='https://speedandform.com';
const API='https://pbgsjjegycacodiltbhn.supabase.co',KEY='sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
const out=process.argv[2]||'/tmp/athlete-access-production.json';
const report={sourceCommit:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),assets:[],pages:[],checks:[],attempts:[]};
fs.mkdirSync(path.dirname(out),{recursive:true});
const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(route){const r=await fetch(ORIGIN+route,{headers:{'Cache-Control':'no-cache','User-Agent':'FORM-Access-Acceptance/1.0'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,route+' HTTP status');assert.equal(new URL(r.url).origin,ORIGIN);return r;}
async function rpc(name,body,token){return fetch(API+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}
(async()=>{
 const first='private/plan-access.js',expected=sha(fs.readFileSync(path.join(ROOT,first)));
 let ready=false;
 for(let i=0;i<18;i++){
  try{assert.equal(sha(await(await get('/'+first)).text()),expected);ready=true;break;}
  catch(e){report.attempts.push({at:new Date().toISOString(),error:e.message});save();if(i<17)await new Promise(r=>setTimeout(r,10000));}
 }
 assert.ok(ready,'Reviewed access code has not reached production');
 for(const file of [first,'private/account-navigation.js','private/auth.js','plans/race-pace-durability/source.js','plans/race-pace-durability/plan.js','plans/race-pace-durability/gate.js','plans/race-pace-durability/access.css']){
  const r=await get('/'+file),bytes=Buffer.from(await r.arrayBuffer());
  assert.equal(sha(bytes),sha(fs.readFileSync(path.join(ROOT,file))),'Exact deployed asset '+file);
  report.assets.push({url:r.url,sha256:sha(bytes),status:r.status});save();
 }
 for(const [route,file] of [['/','index.html'],['/plans/race-pace-durability/','plans/race-pace-durability/index.html']]){
  const r=await get(route),html=await r.text(),local=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.ok(html.includes('data-form-account')&&html.includes('/private/account-navigation.js'),'Account navigation in served HTML');
  for(const module of ['private/account-navigation.js',...(route==='/'?[]:['plans/race-pace-durability/access.css'])])assert.ok(html.includes('/'+module));
  const canonical=html.match(/rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  assert.equal(canonical,ORIGIN+route);
  if(route!=='/')assert.ok(html.includes('id="rpdLoading"')&&html.includes('id="pdfMobile" hidden'),'Access state integrated into deployed viewer');
  // Hosting may rewrite email links. Report, rather than invent, HTML parity.
  report.pages.push({url:r.url,status:r.status,canonical,sha256:sha(html),exactHTML:sha(html)===sha(local)});save();
 }
 const preview=await rpc('public_plan_preview',{p_slug:'race-pace-durability'});
 assert.equal(preview.status,200);const plan=await preview.json();
 assert.equal(plan.weeks.length,15);
 assert.ok(plan.weeks.filter(w=>w.week_number<=4).every(w=>w.sessions.length>0));
 assert.ok(plan.weeks.filter(w=>w.week_number>4).every(w=>w.sessions.length===0));
 report.checks.push('Actual anonymous preview includes Weeks 1-4 and no future prescription');
 for(const [name,body,token] of [['rpd_account_access',{p_include_plan:true},null],['rpd_account_access',{p_include_plan:true},'forged-token'],['public_plan',{p_slug:'race-pace-durability'},null]]){
  const r=await rpc(name,body,token);assert.ok([401,403,404].includes(r.status),name+' denies unauthorized requests');
  report.checks.push({endpoint:name,credential:token?'invalid token':'anonymous',status:r.status});
 }
 report.result='PASS';report.finishedAt=new Date().toISOString();save();
 console.log('PASS: seven exact deployed assets, both integrated HTML pages and four live server boundaries.');
})().catch(e=>{report.result='FAIL';report.error=e.stack;save();console.error(e);process.exitCode=1;});
