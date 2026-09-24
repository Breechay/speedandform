'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'labs/the-two-curves');
const A=require(path.join(DIR,'plan-projection.js'));
const pub=JSON.parse(fs.readFileSync(path.join(DIR,'published-plan.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(DIR,'evidence.json'),'utf8'));
const html=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
assert.equal(A.validate(pub),pub);assert.equal(pub.payload.version.number,2);
assert.deepEqual(pub.payload.weeks.map(w=>w.total_distance),[63,67,70,62,52]);
const weeks=pub.payload.weeks,session=(w,day)=>weeks[w-1].sessions.find(s=>s.day===day),work=s=>s.components.find(c=>c.role==='work');
for(let w=1;w<=4;w++){
 const c=work(session(w,'TUE'));assert.equal(c.recovery_seconds,120);assert.equal(c.recovery_kind,'easy');
 assert.equal(c.pace_low_seconds,365);assert.equal(c.pace_high_seconds,373);
 assert.ok(session(w,'TUE').details.includes('Start near 3:52/km'));
}
assert.deepEqual([1,2,3,4].map(w=>[work(session(w,'TUE')).repeat_count,work(session(w,'TUE')).distance]),[[4,1.6],[4,2],[3,3],[2,4]]);
assert.deepEqual([1,2,3,4].map(w=>[work(session(w,'THU')).repeat_count,work(session(w,'THU')).duration_seconds]),[[5,180],[5,180],[4,240],[4,180]]);
assert.equal(session(5,'TUE').role,'easy');assert.equal(session(5,'TUE').distance,8);
assert.equal(session(5,'THU').title,'5K ceiling read');assert.equal(work(session(5,'THU')).distance,5);
assert.equal(work(session(5,'THU')).pace_low_seconds,null);
assert.deepEqual([1,2,3,4,5].map(w=>session(w,'SAT').distance),[18,20,21,16,14]);
assert.ok(weeks.every(w=>w.sessions.length===6&&!w.sessions.some(s=>s.day==='SUN')));
const projected=A.fromPublication(pub);
assert.equal(projected[4].days[1].type,'easy');
assert.ok(projected[0].days[1].en.includes('very easy jog'));
assert.ok(projected[0].days[1].en.includes('Warm-up 20 min'));
assert.ok(A.format(projected[0].days[1].en,'km').includes('3:47–3:52/km'));
assert.ok(A.format(projected[0].days[1].en,'mi').includes('6:05–6:13/mi'));
assert.ok(A.format(projected[0].days[3].en,'km').includes('3:29–3:34/km'));
for(const state of ['review_required','unavailable'])assert.throws(()=>A.validate({...pub,state}));
const bad=structuredClone(pub);bad.payload.weeks[0].total_distance++;assert.throws(()=>A.validate(bad));
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').recorded_work_seconds,1920);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').longest_work_piece_seconds,1200);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').activity_self_report.score,3);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-11').state,'partial_recording_reason_unknown');
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-11').recorded_work_seconds,1297.6);
assert.equal(evidence.coach_report.recent_weekly_volume,null);
assert.equal(evidence.archive.sha256,'f569106fc9659a4b0153edaee668b77bf8cf489a04f5ae7f7e5084257ab2ac61');
assert.ok(html.includes('SIMON_R2_IMPLEMENTED')&&html.includes('scale(.98)')&&html.includes('.reveal{opacity:1'));
assert.ok(html.includes('id="history"')&&html.includes('id="gate"')&&html.includes('STUDY003_SAVED_GRID'));
assert.ok(!html.includes('const B1 = ['),'No independent authored B1');
assert.ok(html.includes('window.FORMSimonPlan.fromPublication'));
assert.ok(html.includes('November 3')||html.includes('Nov 3'));
assert.ok(!html.includes('The next eleven weeks are written'));
const main=html.match(/<script>\s*\(\(\) => \{([\s\S]*?)<\/script>/)?.[0];assert.ok(main);
for(const [,attrs,body]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(attrs.includes('application/ld+json'))JSON.parse(body);else if(body.trim())new vm.Script(body);
}
for(const key of ['hx.m25.p','hx.m11.p','gate.b.p','sc1.p'])assert.ok(html.includes('"'+key+'": ['),'Bilingual copy '+key);
assert.ok(fs.readFileSync(path.join(ROOT,'AGENTS.md'),'utf8').includes('docs/studies/SIMON-STUDY-003.md'));
assert.ok(fs.readFileSync(path.join(ROOT,'docs/roadmap/FORM-ROADMAP.md'),'utf8').includes('Simon evidence revision R2'));
const dump=JSON.stringify(pub);assert.ok(!/simonrobin95|@icloud|marcusballiette|access_invites|athlete_memberships|e8328097/i.test(dump),'No private identity data in public plan');
assert.deepEqual(pub.payload.field,[]);
const report={revision:pub.revision,plan_version:2,weekly_totals_km:[63,67,70,62,52],tests:'passed',history:'old evidence preserved; public source classifications tested',site:'approved publication with visible saved fallback',notes:'Physical iPhone app refresh not tested by this suite'};
const out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
