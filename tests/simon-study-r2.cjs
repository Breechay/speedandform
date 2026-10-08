'use strict';
// The filename remains stable for existing release commands. This contract
// follows the approved R4 doses through later copy-only publications.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'labs/the-two-curves');
const A=require(path.join(DIR,'plan-projection.js'));
const publicCopy=require('../scripts/studies/simon-study-copy.cjs');
const pub=JSON.parse(fs.readFileSync(path.join(DIR,'published-plan.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(DIR,'evidence.json'),'utf8'));
const html=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
assert.equal(A.validate(pub),pub);
assert.ok(pub.payload.version.number>=5,'Current copy revision must be published');
assert.equal(pub.revision,'SIMON-V'+pub.payload.version.number,'Revision matches the approved publication version');
assert.deepEqual(pub.payload.weeks.map(w=>w.total_distance),[63,64,66,57,48]);
const weeks=pub.payload.weeks,session=(w,day)=>weeks[w-1].sessions.find(s=>s.day===day),work=s=>s.components.find(c=>c.role==='work');
assert.deepEqual([1,2,3,4].map(w=>[work(session(w,'TUE')).repeat_count,work(session(w,'TUE')).distance]),[[4,1.6],[4,2],[3,3],[2,3]]);
assert.deepEqual([1,2,3,4].map(w=>[work(session(w,'TUE')).pace_low_seconds,work(session(w,'TUE')).pace_high_seconds]),[[365,373],[368,373],[368,373],[370,375]]);
for(let w=1;w<=4;w++){
 assert.equal(work(session(w,'TUE')).recovery_seconds,120);
 assert.equal(work(session(w,'TUE')).recovery_kind,'easy');
}
assert.deepEqual([1,2,3].map(w=>[work(session(w,'THU')).repeat_count,work(session(w,'THU')).duration_seconds]),[[5,180],[4,180],[3,240]]);
assert.deepEqual([1,2,3].map(w=>[work(session(w,'THU')).pace_low_seconds,work(session(w,'THU')).pace_high_seconds]),[[336,346],[343,351],[343,351]]);
for(let w=1;w<=3;w++)assert.equal(work(session(w,'THU')).recovery_seconds,120);
for(const [w,day,count] of [[4,'THU',6],[5,'TUE',4]]){
 const s=session(w,day),parts=s.components.filter(c=>c.role==='work');
 assert.equal(s.role,'support');assert.equal(s.distance,8);
 assert.equal(parts.length,2,'The easy run and strides are separate work components');
 assert.equal(parts[1].repeat_count,count);assert.equal(parts[1].duration_seconds,20);assert.equal(parts[1].recovery_seconds,60);
}
assert.equal(work(session(5,'THU')).distance,5);
assert.equal(work(session(5,'THU')).pace_low_seconds,null);
assert.deepEqual([1,2,3,4,5].map(w=>session(w,'SAT').distance),[18,18,19,16,12]);
assert.ok(weeks.every(w=>w.sessions.length===6&&!w.sessions.some(s=>s.day==='SUN')));

const projected=A.fromPublication(pub),copy=A.currentCopy(pub);
const knownSummary=A.summaryCopy(pub,publicCopy['s2.p']);
assert.deepEqual(knownSummary.values,[pub.payload.version.summary,publicCopy['s2.p'][1]]);
assert.equal(knownSummary.frenchFallback,false,'The approved French summary matches its English source');
assert.equal(projected[0].snapshot,true,'Earlier prescription stays visibly a plan snapshot');
assert.equal(projected[3].name.en,'Lighter week');assert.equal(projected[3].name.fr,'Semaine allégée');
assert.equal(projected[4].days[1].type,'easy');
assert.equal(copy['s2.en'],pub.payload.version.summary,'English block description is canonical');
assert.ok(A.format(projected[1].days[1].en,'km').includes('3:49–3:52/km'));
assert.ok(A.format(projected[1].days[1].en,'mi').includes('6:08–6:13/mi'));
assert.ok(A.format(projected[3].days[1].en,'km').includes('3:50–3:53/km'));
assert.ok(A.format(projected[1].days[3].en,'km').includes('3:33–3:38/km'));
assert.ok(A.format(projected[1].days[3].en,'mi').includes('5:43–5:51/mi'));
assert.ok(projected[1].days[3].en.includes('leaves you tired, run easy or rest'));
assert.ok(projected[1].days[3].fr.includes('te laisse fatigué, cours facilement ou repose-toi'));
assert.ok(projected[3].days[3].en.includes('6 × 20 sec relaxed strides'));
assert.ok(projected[3].days[3].en.includes('Keep HYROX and leg training light'));
assert.ok(projected[3].days[3].fr.includes('travail des jambes légers'));
assert.ok(A.format(projected[2].days[5].en).includes('Use 18 km if'));
assert.ok(A.format(projected[2].days[5].fr).includes('Garde 18 km si'));
for(const week of [3,4]){
 assert.ok(projected[week].days[4].en.includes('Take the day off'));
 assert.ok(projected[week].days[4].fr.includes('jour de repos'));
}
assert.ok(A.format(projected[4].days[5].en).includes('Only if recovered from the 5K'));
assert.ok(A.format(projected[4].days[5].en).includes('8 km to 10 km or rest'));
assert.ok(A.format(projected[4].days[5].fr).includes('8 km à 10 km ou repose-toi'));
assert.ok(A.format(projected[4].days[5].en,'mi').includes('4.97 mi to 6.21 mi or rest'));
assert.ok(projected[4].days[1].fr.includes('4 × 20 sec d’accélérations souples'));
assert.ok(projected[0].days[1].en.includes('Warm-up 20 min'));
assert.ok(projected[0].days[1].en.includes('Cooldown 10 min'));
assert.ok(A.format(copy['pace.tuesday'][0]).includes('3:49–3:52/km'));
assert.ok(A.format(copy['tr1.p'][0]).includes('3:50–3:53/km'));

// A later approved copy version is allowed. Its summary and pace cards must
// follow the new payload, rather than staying pinned to the saved R2 text.
const later=structuredClone(pub);later.payload.version.number++;
later.payload.version.summary='Updated coach description.';
later.payload.weeks[1].sessions.find(s=>s.day==='TUE').components.find(c=>c.role==='work').pace_low_seconds=371;
assert.equal(A.currentCopy(later)['s2.en'],'Updated coach description.');
assert.deepEqual(A.summaryCopy(later,publicCopy['s2.p']),{values:['Updated coach description.','Updated coach description.'],frenchFallback:true},'A new summary cannot reuse the old French translation');
assert.deepEqual(A.summaryCopy(later,['Updated coach description.','Description du coach actualisée.']),{values:['Updated coach description.','Description du coach actualisée.'],frenchFallback:false},'A matching new translation can be used');
const sameSummary=structuredClone(pub);sameSummary.payload.version.number++;
assert.equal(A.summaryCopy(sameSummary,publicCopy['s2.p']).frenchFallback,false,'An unchanged summary retains its paired translation across versions');
assert.ok(A.format(A.currentCopy(later)['pace.tuesday'][0]).includes('3:51–3:52/km'));
for(const state of ['review_required','unavailable'])assert.throws(()=>A.validate({...pub,state}));
const old=structuredClone(pub);old.payload.version.number=2;assert.throws(()=>A.validate(old));
const bad=structuredClone(pub);bad.payload.weeks[0].total_distance++;assert.throws(()=>A.validate(bad));

assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').recorded_work_seconds,1920);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').longest_work_piece_seconds,1200);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-25').activity_self_report.score,3);
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-11').state,'partial_recording_reason_unknown');
assert.equal(evidence.sessions.find(s=>s.date==='2026-03-11').recorded_work_seconds,1297.6);
assert.equal(evidence.coach_report.recent_weekly_volume,null);
assert.equal(evidence.archive.sha256,'f569106fc9659a4b0153edaee668b77bf8cf489a04f5ae7f7e5084257ab2ac61');
assert.ok(html.includes('scale(.98)')&&html.includes('.reveal{opacity:1'));
assert.ok(html.includes('id="history"')&&html.includes('id="gate"')&&html.includes('STUDY003_SAVED_GRID'));
assert.ok(!html.includes('const B1 = ['),'No independent authored plan array');
assert.ok(html.includes('window.FORMSimonPlan.currentCopy'));
assert.ok(html.includes('id="refreshPlan"')&&html.includes("addEventListener('click',refreshApprovedPublication)"));
const plan=html.slice(html.indexOf('<!-- 02 PLAN -->'),html.indexOf('<!-- 03',html.indexOf('<!-- 02 PLAN -->')));
const observation=html.match(/<section\b[^>]*id="observation-led"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert.ok(observation&&observation.includes('Adjust the week to how you recover.'));
const panel=require('../scripts/studies/simon-study-panel.cjs')();
const banned=/absorbed|absorption|working.development|ceiling maintenance|race prediction|not established half|quality budget|separated gates/i;
for(const [name,copy] of Object.entries({plan,observation,panel,bilingual:JSON.stringify(publicCopy)}))assert.ok(!banned.test(copy),name+': current athlete copy is plain');
assert.ok(publicCopy['obs.p'][1].includes('cours facilement jeudi ou repose-toi'));
assert.ok(plan.includes('6 × 20 sec relaxed strides'),'Saved/no-JS grid includes strides');
assert.ok(html.includes('data-study-revision="'+pub.revision+'"'));
for(const [,attrs,body]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(attrs.includes('application/ld+json'))JSON.parse(body);else if(body.trim())new vm.Script(body);
}
const build=require('../scripts/studies/build-simon-r2.cjs');
assert.equal(build.render(html,pub),html,'Repeating the publication build is idempotent');
const futureBuild=build.render(html,later);
const futureT=JSON.parse(futureBuild.slice(futureBuild.indexOf('const T = ')+10,futureBuild.indexOf('const MON = ')).trim().replace(/;$/,''));
assert.deepEqual(futureT['s2.p'],['Updated coach description.','Updated coach description.'],'A later saved build also avoids a stale French description');
assert.equal(publicCopy['s2.p'][0],pub.payload.version.summary,'Building a later publication never rewrites the translation source');
assert.equal(build.render(futureBuild,later),futureBuild,'Future-summary fallback build is idempotent');
assert.deepEqual(Object.keys(pub).sort(),['state','revision','distance_unit','schema_version','pace_seconds_unit','payload'].sort());
assert.ok(!/simonrobin95|@icloud|access_invites|athlete_memberships|readback_note|weekly.workload|feels.heavier/i.test(JSON.stringify(pub)),'No private intake data in the public plan');
assert.deepEqual(pub.payload.field,[]);
const report={revision:pub.revision,plan_version:pub.payload.version.number,weekly_totals_km:weeks.map(w=>w.total_distance),tests:'passed',scope:'Approved publication, plain bilingual copy, current pace summaries, full component projection and preserved historical evidence. No physical-device claim.'};
const out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
