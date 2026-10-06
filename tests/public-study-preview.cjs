/* A study update must review both acquisition projections before release. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {snapshot:s,renderHomeEvidence,coachingExample}=require('../scripts/public-study-preview.cjs');
const source=fs.readFileSync(s.source_path,'utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),s.source_sha256,'Study changed: review latest completed ask, conclusion, race results and both public previews. Update the approved projection and source hash together.');
assert.ok(source.includes('id="'+s.source_url.split('#')[1]+'"'),'Recorded source anchor exists');
assert.ok(Date.parse(s.latest_completed.date+'T23:59:59Z')<Date.now(),'Latest milestone must be completed, not an upcoming ask');
assert.equal(s.next_distance_ask.state,'scheduled');
assert.ok(s.next_distance_ask.date>s.latest_completed.date,'Scheduled ask remains separate from completed evidence');
const seconds=t=>t.split(':').reduce((n,v)=>n*60+Number(v),0);
for(const a of s.athletes){
 assert.ok(source.includes(a.work_time),'Work time exists in the approved public study');
 assert.ok(Math.abs(seconds(a.work_time)/s.latest_completed.distance_mi-seconds(a.work_pace))<1,'Work average retains source precision');
 assert.ok(Math.abs(seconds(a.previous_half_net_time)/13.1094-seconds(a.previous_half_pace))<1,'Prior race pace agrees with half-marathon time');
}
const home=fs.readFileSync('index.html','utf8'),run=fs.readFileSync('coaching/miami/index.html','utf8');
assert.ok(home.includes(renderHomeEvidence()),'Homepage uses the approved current projection');
// Both public coaching entries keep the homepage intake. The standalone room links to the owning study rather than duplicating observations.
assert.ok(run.includes('href="/#begin"'));
assert.ok(run.includes('href="/labs/speed-that-endures/"'));
assert.ok(home.includes('<a href="#begin"><span>01 / Coaching'));
assert.ok(!run.includes('http-equiv="refresh"'));
assert.ok(!fs.readFileSync('netlify.toml','utf8').includes('from = "/coaching/miami"'));
assert.ok(home.includes('A training milestone. Not a race prediction.'));
console.log('PASS: public study/current homepage and running example remain in sync; future asks and prior race baselines stay distinct.');
