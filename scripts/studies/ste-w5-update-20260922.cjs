'use strict';
// One-time, exact-source update. It cannot change athlete assignments or future workouts.
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const pagePath = 'labs/speed-that-endures/index.html';
const expectedBlob = '64111021bb29d53daa7cfb9eab4db97280b90b85';
const source = fs.readFileSync(pagePath, 'utf8');
const gitHash = text => { const b = Buffer.from(text); return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex'); };
if (source.includes('id="w5-read"')) { console.log('W5 already present; no files changed.'); process.exit(0); }
assert.equal(gitHash(source), expectedBlob, 'Study changed since review. Reconcile it; do not overwrite.');
let html = source;
function once(oldText, newText) { assert.equal(html.split(oldText).length - 1, 1, 'Expected one anchor: ' + oldText.slice(0,110)); html = html.replace(oldText, newText); }
function oneRegex(pattern, newText) { assert.equal([...html.matchAll(new RegExp(pattern.source, 'g'))].length, 1, 'Expected one regex anchor: ' + pattern); html = html.replace(pattern, () => newText); }
const jTimes = [398.6,398.7,395.9,400.0,397.9];
const hTimes = [402.9,404.0,405.1,407.1,408.9];
const sum = a => Math.round(a.reduce((x,y) => x+y,0)*10)/10;
assert.equal(sum(jTimes),1991.1); assert.equal(sum(hTimes),2028);
assert.equal(Math.round((Math.max(...jTimes)-Math.min(...jTimes))*10)/10,4.1);
assert.equal(Math.round((hTimes[4]-hTimes[0])*10)/10,6);
assert.equal(hTimes.filter(x=>x>=405&&x<=420).length,3);
const w5 = {
 title:'Sep 22 · W5 · 5 × 1 mi / 2:00 floats · recorded',
 q:'How did each athlete distribute five one-mile reps with two-minute floats, between the five- and six-mile continuous runs?',
 pr:'5 × 1 mi · four 2:00 floats · José 6:30–6:45 /mi · Hope 6:45–7:00 /mi',
 prs:'Sep 15: both completed 5 mi continuous. Sep 22: broken support. Sep 29: 6 mi continuous remains planned. Today neither resets nor advances the continuous-distance record. Source: athlete-shared Garmin screenshots and post-run messages dated Sep 22, 2026.',
 j:{
  out:'5 × 1 mi · 33:11.1 work · 6:38.2 /mi work average',
  outs:'Rep times: 6:38.6 · 6:38.7 · 6:35.9 · 6:40.0 · 6:37.9. Spread: 4.1 s. All five inside his band, with no late fade in the recorded rep times. Four 2:00 floats at 9:20 · 9:38 · 9:31 · 9:18 /mi. Warm-up: 20:00, 2.39 mi; cool-down: 9:59.7, 1.08 mi. Garmin total: 9.32 mi, 1:11:10.7. Work-only averages exclude floats, warm-up and cool-down.',
  cost:'8/10 · breathing controlled · legs felt weak',
  costs:'José reported no stops, poor sleep, nutrition being off, difficulty finding rhythm through the on/off pattern, and an uncertain-feeling close. He noticed less time to feel settled with 2:00 rather than 3:00 floats. These are his reports, not an isolated cause or a measured mechanical change.',
  read:'Stable rep times. A demanding session.',
  reads:'The output held while his reported effort was high. Those facts can coexist; the splits do not invalidate the sensation. His first 6:38 led him to try to match it. Brice asked for a more patient opening near 6:45 rather than a faster race-pace target. The separate Garmin threshold chart is a device estimate, not this run’s heart-rate trace or a measurement of running economy.',
  next:'Sep 29 · 6 mi continuous · same band',
  nexts:'The five-mile continuous run is already recorded from Sep 15. Today is support before the planned six, not a five-mile requalification. Sep 24 remains 3 × 10 min threshold. Practice the existing race-pacing instruction without changing the assigned band.',
  effort:'8/10 · reported',limiter:'Legs / finding rhythm · reported',reserve:'Not quantified'
 },
 h:{
  out:'5 × 1 mi · 33:48.0 work · 6:45.6 /mi work average',
  outs:'Rep times: 6:42.9 · 6:44.0 · 6:45.1 · 6:47.1 · 6:48.9. The final rep was 6.0 s slower than the first. The first two were slightly faster than her 6:45–7:00 band; the last three were inside it. Four 2:00 floats at 8:38 · 10:08 · 10:11 · 10:26 /mi. Warm-up: 15:00, 1.76 mi. Cool-down and total activity figures are not visible in the supplied screenshots.',
  cost:'Hard, but not too bad · mentally more doable',
  costs:'Hope said the session went well and felt more manageable mentally. She reported trying to go fast at the start, then remembering Thursday’s coaching and deciding to stay in her range. No numeric effort rating, session heart rate or heart-rate-zone distribution was supplied.',
  read:'A small slowing after a fast opening. Her band remained available.',
  reads:'The rep times slowed in order, but the last three remained inside her assigned band. This is not evidence that she lost access to that band. Her report records a pacing correction and remembered coaching, not a measured physiological mechanism. The useful correction is a more patient opening, not a new pace target.',
  next:'Sep 29 · 6 mi continuous · same band',
  nexts:'Keep Sep 15’s five continuous miles recorded and Sep 29’s six continuous miles planned. Brice asked for better pacing distribution. Sep 24 remains 3 × 10 min threshold: his message specifies a restrained first two reps and staying within the prescribed range on the third, not exceeding it.',
  effort:'Hard, manageable · reported',limiter:'Not isolated',reserve:'Not reported'
 }
};
const splits = values => '<ol class="w4-splits" aria-label="Recorded one-mile rep paces">'+values.map((v,i)=>`<li><small>REP ${i+1}</small><b>${v}</b></li>`).join('')+'</ol>';
const current = `<!-- FORM STUDY W5 · 2026-09-22 · broken support between continuous asks -->
<section class="current-read-v73" id="w5-read" aria-labelledby="w5-h" data-filed="2026-09-22">
 <div class="cr-head"><span>CURRENT READ · SEP 22 · W5</span><h3 id="w5-h">FIVE REPEATS.<br/><em>TWO RESPONSES.</em></h3></div>
 <p class="w4-lede">Both ran five continuous miles last week. Today returned to one-mile repeats with two-minute floats. Six continuous miles remain next week’s planned step.</p>
 <div class="cr-grid w5-sequence" aria-label="The study progression">
  <div><small>SEP 15 · W4 · RECORDED</small><b>5 mi continuous</b><p>José 6:44/mi. Hope 6:52/mi. Each at their own assigned band.</p></div>
  <div><small>SEP 22 · W5 · RECORDED</small><b>5 × 1 mi<br/>2:00 floats</b><p>Broken support between continuous runs. Not another five-mile qualification.</p></div>
  <div class="next"><small>SEP 29 · W6 · PLANNED</small><b>6 mi continuous</b><p>The next continuous step. Same individual bands.</p></div>
 </div>
 <div class="w4-pair">
  <section class="w4-athlete" aria-label="José’s September 22 result">
   <h4>JOSÉ</h4><div class="w4-pace">6:38<span>/mi</span></div>
   <p class="w4-measure">33:11.1 · five one-mile reps · work only</p><p class="w4-band">Assigned band · 6:30–6:45 /mi</p>
   ${splits(['6:39','6:39','6:36','6:40','6:38'])}
   <p class="w4-read-text"><strong>2:00 floats:</strong> 9:20 · 9:38 · 9:31 · 9:18 /mi.</p>
   <p class="w4-read-text">The five rep times stayed within 4.1 seconds. He reported 8/10 effort, controlled breathing, weak-feeling legs and difficulty settling into the repeated changes of pace.</p>
   <blockquote>“Legs felt weak but breathing was definitely in control”<cite>José · post-run report</cite></blockquote>
   <p class="w4-read-text">He reported no stops. A hard sensation and stable output are not contradictory. His first 6:38 became a number he felt he had to match; Brice asked for a more patient opening near 6:45.</p>
  </section>
  <section class="w4-athlete" aria-label="Hope’s September 22 result">
   <h4>HOPE</h4><div class="w4-pace">6:46<span>/mi</span></div>
   <p class="w4-measure">33:48.0 · five one-mile reps · work only</p><p class="w4-band">Assigned band · 6:45–7:00 /mi</p>
   ${splits(['6:43','6:44','6:45','6:47','6:49'])}
   <p class="w4-read-text"><strong>2:00 floats:</strong> 8:38 · 10:08 · 10:11 · 10:26 /mi.</p>
   <p class="w4-read-text">The last rep was six seconds slower than the first. The first two were slightly faster than her band; the last three stayed inside it. This was a small slowing, not a loss of the assigned pace.</p>
   <blockquote>“It was hard but not too bad”<cite>Hope · post-run report</cite></blockquote>
   <p class="w4-read-text">She said it felt more doable mentally. She also recalled Thursday’s coaching and corrected her urge to start fast. The next skill is a calmer opening, not a faster target.</p>
  </section>
 </div>
 <div class="w4-note"><p><strong>What this adds:</strong> stable rep times at high reported effort for José; a small slowing with greater reported mental comfort for Hope. Each response informs pacing without undoing last week’s continuous run.</p><p><strong>What stays:</strong> five continuous miles already recorded on September 15. Six continuous miles planned for September 29. September 24 remains 3 × 10 minutes threshold. No athlete assignment or pace band changes in this update.</p><a class="w4-note-link" href="#note-w5">Read the exact splits, reports and next step →</a></div>
 <details class="note" id="w5-context"><summary>Source detail and limits</summary><div class="note-body"><p>José reported poor sleep and nutrition being off. His comparison of 2:00 with 3:00 floats records how the session felt; the work structure and context also changed, so this is not a controlled recovery-length experiment.</p><p>His Garmin chart showed a faster device-estimated threshold pace with a similar plotted threshold heart rate. That is recorded separately, not treated as this session’s heart-rate trace, a laboratory threshold test or a measured change in running economy.</p><p>Hope’s final screenshot contains coaching messages, not heart-rate statistics. No session heart-rate values or zone distribution are assigned to either athlete from this source set. There is no numeric effort rating for Hope.</p><p>Brice’s Thursday instruction was to open the first two threshold reps with restraint and remain within the prescribed range on the third. It is a coaching instruction, not a result from a session that has not happened yet.</p></div></details>
 <p class="w4-source">Source: athlete-shared Garmin screenshots and selected post-run messages, September 22, 2026. Main rep labels follow Garmin’s rounded pace display; exact lap times are in Lab Notes. Work averages exclude floats, warm-up and cool-down. Two-athlete field observation. Earlier records remain below.</p>
</section>
`;
const originalEvidence = source.match(/const evidence = (\{[\s\S]*?\n\});/);
assert.ok(originalEvidence);
const before = vm.runInNewContext('('+originalEvidence[1]+')', {}, {timeout:1000});
const oldRung = source.match(/<div class="rung now"[\s\S]*?<\/div>\n<\/div>/)[0];
once('<!-- FORM STUDY W4 · 2026-09-15 · published 2026-09-17 -->',current+'<!-- FORM STUDY W4 · 2026-09-15 · published 2026-09-17 -->');
once('CURRENT READ · SEP 15 · W4','PREVIOUS CONTINUOUS READ · SEP 15 · W4');
once('<a class="plan-link" href="#w4-read">Sep 15 · Five miles. No reset. &rarr;</a>','<a class="plan-link" href="#w5-read">Sep 22 · Five repeats. Two responses. &rarr;</a>');
once('<meta content="2026-09-19" property="article:modified_time"/>','<meta content="2026-09-22" property="article:modified_time"/>');
once('"dateModified":"2026-09-19"','"dateModified":"2026-09-22"');
once('<meta content="2026-09-19" itemprop="dateModified"/>','<meta content="2026-09-22" itemprop="dateModified"/>');
once('In progress · updated Sep 19','In progress · updated Sep 22');
once('<span aria-hidden="true" class="today" style="left:13.7%"></span>','<span aria-hidden="true" class="today" style="left:17.9%"></span>');
once('<span class="today-tag" style="left:calc(13.7% + 10px)">Sep 15 · W4</span>','<span class="today-tag" style="left:calc(17.9% + 10px)">Sep 22 · W5</span>');
once('<div class="ev"><div class="d">Sep 22<br/>W5</div><div><b>5 × 1 mi · 2 min float</b><small>Broken support between asks.</small></div></div>','<div class="ev"><div class="d">Sep 22<br/>W5</div><div><b>5 × 1 mi · 2 min float · recorded</b><small>José 6:38/mi · Hope 6:46/mi work averages. Support before six continuous miles.</small></div></div>');
const live = `<div class="live" style="margin-top:72px"><div class="d">Sep 22 · W5 · paired record</div><div><div class="k">Five reps, between the five- and six-mile continuous runs.</div><p>José: 6:38.2/mi work average, stable rep times, reported effort 8/10. Hope: 6:45.6/mi work average, six seconds of slowing, and a more manageable mental experience. Both used four two-minute floats.</p></div><div class="st">Recorded</div></div>
<div class="synth"><div><div class="k">What W5 adds</div><b>Repeated pace, with shorter floats.</b><p>A broken support session. It neither replaces last week’s continuous evidence nor establishes six continuous miles.</p></div><div><div class="k">What the athlete adds</div><b>Output and experience stay together.</b><p>José felt the cost despite steady rep times. Hope described greater mental comfort and a pacing correction after starting fast.</p></div><div><div class="k">What changes next</div><b>A more patient opening.</b><p>The plan stays: 3 × 10 minutes threshold on Sep 24, then six continuous miles on Sep 29. No faster bands and no extra five-mile gate.</p></div></div>`;
oneRegex(/<div class="live" style="margin-top:72px">[^\n]*\n<div class="synth">[^\n]*/,live);
const row = '<button aria-controls="inspect" aria-expanded="false" class="entry" data-key="w5" data-state="filed" id="note-w5"><span class="d">Sep 22 · W5</span><span class="mk">5 × 1 mi</span><span class="q">Two-minute floats: stable rep times for José; a small slowing and more mental comfort for Hope.</span><span class="st">Recorded</span></button>\n';
once('<button aria-controls="inspect" aria-expanded="false" class="entry" data-key="w6" id="note-w6">',row+'<button aria-controls="inspect" aria-expanded="false" class="entry" data-key="w6" id="note-w6">');
once('  w6:{','  w5:'+JSON.stringify(w5,null,2)+',\n  w6:{');
once('    <div class="memory-step"><span>SEP 29 · W6</span>','    <div class="memory-step filed"><span>SEP 22 · W5</span><b>5 × 1</b><small>SUPPORT · RECORDED</small></div>\n    <div class="memory-step"><span>SEP 29 · W6</span>');
oneRegex(/  <div class="memory-athletes">[^\n]*/,'  <div class="memory-athletes"><section><header><b>JOSÉ</b><span>4 RACE-PACE READS</span></header><div class="memory-facts"><span><small>LATEST OUTPUT</small>5 × 1 mi · 6:38.2/mi work average</span><span><small>EFFORT</small>8/10 · reported</span><span><small>REPORTED DIFFICULTY</small>Legs / finding rhythm</span><span><small>RESERVE</small>Not quantified</span></div></section><section><header><b>HOPE</b><span>4 RACE-PACE READS</span></header><div class="memory-facts"><span><small>LATEST OUTPUT</small>5 × 1 mi · 6:45.6/mi work average</span><span><small>EFFORT</small>Hard, manageable · reported</span><span><small>LIMITER</small>Not isolated</span><span><small>RESERVE</small>Not reported</span></div></section></div>');
const css = `\n/* W5 uses the existing study typography and one divider per boundary. */
#w5-read{scroll-margin-top:88px;border-bottom:0;padding-bottom:0}
#w5-read .w4-lede{font-size:clamp(19px,1.7vw,26px);line-height:1.5;max-width:64ch;color:var(--ink-2);margin:0 0 34px}
#w5-read .cr-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:0;border-bottom:0}
#w5-read .w4-source{font-size:14px;line-height:1.6;color:var(--muted);margin:0;padding:22px 0}
#w5-read .w4-note-link{color:var(--lime);display:inline-block;text-underline-offset:5px;margin-top:12px;font-size:16px}
#w5-read .w4-note{border-bottom:0}
#w5-read .note{margin-top:0}
#w5-read .w4-splits b{font-variant-numeric:tabular-nums}
@media(max-width:900px){#w5-read .cr-grid{grid-template-columns:1fr}#w5-read .cr-grid>div{min-width:0;border-right:0;border-top:1px solid var(--line);padding:22px 0}#w5-read .cr-grid>div:first-child{border-top:0}}
`;
once('</style>',css+'</style>');
const after = vm.runInNewContext('('+html.match(/const evidence = (\{[\s\S]*?\n\});/)[1]+')',{}, {timeout:1000});
for (const key of Object.keys(before)) assert.equal(JSON.stringify(after[key]),JSON.stringify(before[key]), 'Historical/future record changed: '+key);
assert.equal(after.w5.j.out,w5.j.out); assert.equal(after.w5.h.out,w5.h.out);
assert.ok(html.includes(oldRung),'Continuous ladder must be unchanged.');
const dataUrls = s=>s.match(/data:image\/[^\s"\)]+/g)||[];
assert.deepEqual(dataUrls(html),dataUrls(source),'Embedded imagery must be byte-identical.');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML ids.');
for(const key of Object.keys(after)) assert.ok(html.includes(`data-key="${key}"`), 'Missing note button: '+key);
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) { if(m[1].includes('application/ld+json')) JSON.parse(m[2]); else if(!/\bsrc=/.test(m[1])) new vm.Script(m[2]); }
assert.ok(!html.includes('174 bpm')); assert.ok(!html.includes('191 bpm'));
assert.ok(!html.includes('5 MI — CURRENT'));
fs.mkdirSync('docs/studies',{recursive:true});
const record={id:'ste-w5-2026-09-22',date:'2026-09-22',sourceFiles:['IMG_7855.png','IMG_7856.png','IMG_7857.png','IMG_7858.png','IMG_7859.png','IMG_7860.png','IMG_7861.png','IMG_7862.png','IMG_7863.png','IMG_7864.png','IMG_7865.png'],sourceType:'User-supplied Garmin screenshots and selected WhatsApp messages; raw chat screenshots are not published.',reviewedSourceBlob:expectedBlob,resultPageBlob:gitHash(html),prescriptionChanges:false,continuousRecord:{lastCompleted:{date:'2026-09-15',miles:5},today:'5 x 1 mi with four 2:00 floats; support',nextPlanned:{date:'2026-09-29',miles:6}},athletes:{jose:{repSeconds:jTimes,floatSeconds:[120,120,120,120],floatPaces:['9:20','9:38','9:31','9:18'],workSeconds:1991.1,workAverageSecondsPerMile:398.22,effortReported:8,noStops:'Athlete-reported',sessionHeartRate:null},hope:{repSeconds:hTimes,floatSeconds:[120,120,120,120],floatPaces:['8:38','10:08','10:11','10:26'],workSeconds:2028,workAverageSecondsPerMile:405.6,effortReported:null,sessionHeartRate:null}},evidence:w5,limits:['Two-athlete descriptive field record, not a controlled comparison.','No new physiological mechanism, measured economy or continuous-distance claim.','No Hope session HR, maximum HR, zone percentages or numeric RPE were supplied.','Garmin threshold trend remains a separate device estimate.','Source correction: W4 five continuous miles were already completed; W6 six continuous miles remain planned.']};
fs.writeFileSync(pagePath,html);
fs.writeFileSync('docs/studies/SPEED_THAT_ENDURES_W5_20260922.json',JSON.stringify(record,null,2)+'\n');
const roadmapPath='docs/roadmap/FORM-ROADMAP.md';
const roadmap=fs.readFileSync(roadmapPath,'utf8');
const heading='## September 22 - Speed That Endures: Week 5 support recorded';
assert.ok(!roadmap.includes(heading),'Roadmap update already exists.');
const note=`${heading}\n\nSeptember 22 Garmin screenshots and athlete messages are recorded on the existing study. **Sep 15: five continuous miles completed. Sep 22: 5 x 1 mile with two-minute floats. Sep 29: six continuous miles planned.** W5 is support, not another five-mile qualification. Individual bands, athlete assignments and future prescriptions are unchanged.\n\nJose: 6:38.2/mi work average, 4.1-second rep spread, reported effort 8/10. Hope: 6:45.6/mi work average, 6.0 seconds of slowing; first two reps slightly faster than her band, final three inside. Hope's HR/zone values are not supplied and are not invented. Garmin threshold context stays a device estimate, not a measured economy claim.\n\nEvidence and exact reviewed/result page hashes: [W5 source record](../studies/SPEED_THAT_ENDURES_W5_20260922.json). The scoped workflow validates arithmetic, preserves every earlier/future evidence object and the continuous ladder, and checks script/metadata syntax before commit. Browser acceptance is recorded in the workflow artifact. Source completion does not assert production deployment or a physical-device test.\n\n- [x] Source-grounded W5 record; prior continuous evidence preserved.\n- [x] No band, assignment or future-session changes.\n- [ ] Verify the new source on production before calling the study live.\n- [ ] Physical iPhone/iPad review.\n\n`;
const firstSection=roadmap.indexOf('\n## '); assert.ok(firstSection>0);
fs.writeFileSync(roadmapPath,roadmap.slice(0,firstSection+1)+note+roadmap.slice(firstSection+1));
console.log(JSON.stringify({checks:'passed',reviewedSourceBlob:expectedBlob,resultPageBlob:gitHash(html),unchangedRecords:Object.keys(before),addedRecord:'w5',continuousLadder:'unchanged',embeddedImages:'byte-identical'},null,2));
