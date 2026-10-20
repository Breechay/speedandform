/* A study update must review both acquisition projections before release. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {snapshot:s,renderHomeEvidence,coachingExample}=require('../scripts/public-study-preview.cjs');
const source=fs.readFileSync(s.source_path,'utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),s.source_sha256,'Study changed: review latest completed ask, conclusion, race results and both public previews. Update the approved projection and source hash together.');
assert.ok(source.includes('id="'+s.source_url.split('#')[1]+'"'),'Recorded source anchor exists');
assert.ok(Date.parse(s.latest_completed.date+'T23:59:59Z')<Date.now(),'Latest milestone must be completed, not an upcoming ask');
assert.ok(['scheduled','completed'].includes(s.next_distance_ask.state),'Distance ask has an explicit publication state');
assert.ok(s.next_distance_ask.date>s.latest_completed.date,'Later individual ask remains separate from the paired benchmark');
if(s.next_distance_ask.state==='completed'){
 const result=s.latest_jose_completion;
 assert.ok(result,'Completed individual ask requires a sourced result');
 assert.equal(s.next_distance_ask.date,result.date);
 assert.ok(source.includes(s.next_distance_ask.work_time),'Completed ask time must exist in the study');
 assert.ok(s.next_distance_ask.interpretation,'Preserve cost/recovery interpretation');
}
assert.match(renderHomeEvidence(),/<svg class="home-link-arrow"/,'Generated study link retains an SVG arrow on mobile');
const seconds=t=>t.split(':').reduce((n,v)=>n*60+Number(v),0);
for(const a of s.athletes){
 assert.ok(source.includes(a.work_time),'Work time exists in the approved public study');
 assert.ok(Math.abs(seconds(a.work_time)/s.latest_completed.distance_mi-seconds(a.work_pace))<1,'Work average retains source precision');
 assert.ok(Math.abs(seconds(a.previous_half_net_time)/13.1094-seconds(a.previous_half_pace))<1,'Prior race pace agrees with half-marathon time');
}
const home=fs.readFileSync('index.html','utf8'),run=fs.readFileSync('coaching/miami/index.html','utf8'),inquiry=fs.readFileSync('coaching/apply/index.html','utf8');
assert.match(home,/You can hit the pace\.<br>Can you hold it\?/,'Study question survives the short homepage');
assert.match(home,/Hope and José are working on that question\./,'Real named athletes remain');
assert.match(home,/>6 miles</,'The completed continuous distance remains explicit');
assert.match(home,/href="\/labs\/speed-that-endures\/"/,'Study remains directly accessible');
assert.ok(source.includes(s.latest_completed.date),'Dated study evidence remains in its owning source');
assert.ok(run.includes('href="/coaching/apply/"'),'Coaching leads to real separate inquiry');
assert.ok(inquiry.includes('class="questionnaire"'),'Application workflow remains functional');
assert.ok(!run.includes('href="/labs/speed-that-endures/"'),'Offer does not grow study cross-sell');
assert.ok(!run.split('<!-- Shared site menu -->')[0].includes('href="/analysis/"'),'Offer does not cross-sell analysis');
assert.match(home,/<section class="home-entry home-bend-only"/,'Visual signature bend remains');
assert.ok(!run.includes('http-equiv="refresh"'));
assert.ok(!fs.readFileSync('netlify.toml','utf8').includes('from = "/coaching/miami"'));
assert.ok(!home.includes('A training milestone. Not a race prediction.'),'Full study owns caveats; homepage is a photographic entrance');
console.log('PASS: canonical study keeps full evidence; focused home keeps measured result and source link; coaching inquiry remains functional.');
