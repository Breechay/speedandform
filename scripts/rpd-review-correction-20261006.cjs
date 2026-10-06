'use strict';
// One-off, idempotent source correction. Never writes private athlete health data.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const studyPath = 'labs/speed-that-endures/index.html';
const canonPath = 'docs/RACE_PACE_DURABILITY_CANONICAL_v1.md';
const evidencePath = 'docs/studies/SPEED_THAT_ENDURES_W7_20261006.json';
const previewPath = 'data/public-studies/speed-that-endures.json';
const marker = '<!-- RPD EXTERNAL REVIEW CORRECTION 20261006 -->';
const before = fs.readFileSync(studyPath, 'utf8');
if (before.includes(marker)) {
  console.log('RPD review correction already applied.');
  process.exit(0);
}
function once(text, from, to) {
  assert.equal(text.split(from).length - 1, 1, `Expected one source anchor: ${from.slice(0,100)}`);
  return text.replace(from, to);
}
let study = before;
study = once(study,
  'The short floats exposed the reengagement problem we wanted: heavy legs, another decision, another shift of gears.',
  'He reported difficulty restarting, but this session does not isolate its cause. Heat, preparation, accumulated load, pacing and current fitness remain competing explanations.');
study = once(study,
  'and showed that restarting after short recovery is currently harder than the final averages make it look.',
  'and reported difficulty that the final repetition averages do not show.');
study = once(study,
  'The study now has two different eight-mile facts and keeps them separate: eight miles can be accumulated in repetitions, while eight continuous miles remains a future capability ask.',
  'The study keeps a completed result separate from a future question: eight miles were accumulated in repetitions, while eight continuous miles remains untested.');
study = once(study,
  'The progression is still removing places to escape from race pace. W7 shortened the reset to two minutes. Oct 20 removes the reset altogether for eight miles. Pace stays athlete-specific; the next question is duration and reengagement, not speed.',
  'October 20 remains the intended eight-mile continuous checkpoint, subject to each athlete\'s readiness and conditions. Completing October 6 does not oblige the next progression or establish that threshold is the limiter.');
study = once(study,
  '<div class="ev"><div class="d">Oct 08<br/>W7</div><div><b>3 × 12 min threshold · 2 min easy</b><small>Controlled threshold duration before the next threshold step.</small></div></div>',
  '<div class="ev"><div class="d">Oct 08<br/>W7</div><div><b>José: easy recovery</b><small>40 minutes easy, shortened or omitted if not recovered. The automatic 3 × 12 threshold replacement is withdrawn. Other athletes follow their own current coach assignment.</small></div></div>');
const review = `${marker}
<section class="current-read-v73" id="oct6-review" aria-labelledby="oct6-review-h" data-filed="2026-10-06">
 <div class="cr-head"><span>OCT 06 · REVIEW AMENDMENT</span><h3 id="oct6-review-h">ABSORB<br/><em>THE WORK.</em></h3></div>
 <p class="w4-lede">The first response to today was to replace Thursday's VO₂ session with 3 × 12 minutes at threshold. External review changed that decision: one high-cost workout does not establish a threshold deficit, and more threshold time is not automatically easier to recover from.</p>
 <p class="w4-read-text"><strong>Current decision:</strong> José's October 8 is 40 minutes easy, with permission to shorten or rest. Relaxed strides are optional only when the legs feel normal. There is no threshold or VO₂ session assigned to him that day. Each athlete's current coach assignment overrides the shared calendar.</p>
 <p class="w4-read-text"><strong>October 13, before the result:</strong> review preparation and recovery before starting specific work. No catch-up accelerations to rescue a repetition average. Unexpectedly high early effort means reduce or stop the work, not prove the plan. A controlled repeat after recovery would weaken the threshold-deficit hypothesis; persistent high cost under comparable conditions would reopen the pace and training-load review. Neither outcome identifies a mechanism by itself.</p>
 <p class="w4-read-text"><strong>What remains unresolved:</strong> rising heart rate and stable watch-derived running dynamics do not measure running economy or diagnose the limiting system. Record shoes, conditions, preparation, pace, separate leg and breathing effort, and recovery. October 20 may establish controlled eight-mile execution; it cannot prove that one supporting workout caused improvement.</p>
 <p class="w4-source">The public plan's automatic W7 3 × 12 replacement is withdrawn; the preceding reusable version is restored. This does not restore VO₂ to José's individual assignment. Further changes to the October 13–20 sequence require an explicit coach decision. Source evidence, historical paces and Brice's signature cue are preserved. Research context: <a href="https://physoc.onlinelibrary.wiley.com/doi/10.1113/EP092120" target="_blank" rel="noopener">Hunter et al., 2025</a>.</p>
</section>
`;
study = once(study, '<!-- FORM STUDY W6 · 2026-09-29 · second continuous ask -->', review + '<!-- FORM STUDY W6 · 2026-09-29 · second continuous ask -->');
study = once(study, '<span>CURRENT READ · SEP 29 · W6</span>', '<span>PREVIOUS CONTINUOUS READ · SEP 29 · W6</span>');
const images = text => text.match(/data:image[^\s"'<>]+/g) || [];
assert.deepEqual(images(study), images(before), 'Embedded photographs changed');
for (const time of ['13:24.4','13:27.0','13:26.4','13:24.5','53:42.3','39:16.0','40:53.8']) assert(study.includes(time), `Missing historical evidence ${time}`);
const ids = [...study.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const oldIds = [...before.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
for (const id of oldIds) assert(ids.includes(id), `Removed existing ID ${id}`);
assert.equal(ids.filter(x=>x==='oct6-review').length,1);
fs.writeFileSync(studyPath, study);
let canon = fs.readFileSync(canonPath,'utf8');
canon = once(canon, '**Revision 4. 6 October 2026.**', '**Revision 5. 6 October 2026. External-review correction.**');
canon = once(canon,
 '**W3 2 × 10 → W5 3 × 10 → W7 3 × 12 → W8 2 × 15 → W10 3 × 10 → W13 2 × 8**',
 '**W3 2 × 10 → W5 3 × 10 → W8 2 × 15 → W10 3 × 10 → W13 2 × 8**');
canon = once(canon,
 'W7 now extends the threshold-duration lane instead of adding a separate VO₂ session. October 6 evidence showed race pace remaining mechanically organized while internal cost became very high. The complementary question is whether controlled threshold-duration work can reduce the cost of race pace. Major race-pace asks stay protected by easy + strides on Thursday.',
 'The automatic October 6 W7 threshold replacement is withdrawn. The preceding reusable template is restored, including its original W7 higher-intensity option for appropriately recovered athletes. José does not inherit that option: his October 8 assignment is easy recovery. Existing athlete restrictions and current coach decisions outrank this template.');
canon = once(canon,
 '| **W7** | absorb | 50 | 6/6/5 | 4 × 2 mi @ RP / 2 min float | **Threshold 3 × 12 min / 2 min easy** | 13 easy | 8 | — |',
 '| **W7** | absorb | 50 | 6/6/5 | 4 × 2 mi @ RP / 2 min float | VO₂ 5 × 3 min, only if recovered; otherwise easy | 13 easy | 8 | — |');
canon = once(canon,
 'The Thursday lane also asks whether race pace can become less costly. When an athlete holds the assigned race-pace band but internal cost rises sharply while mechanics and output remain organized, do not automatically add more race-pace or VO₂ work. Develop controlled threshold duration underneath the specific work. W7\'s 3 × 12 minutes is controlled; W8\'s 2 × 15 removes one reset. Progress duration and continuity before speed.',
 'A costly race-pace session prompts review, not an automatic threshold prescription. Separate recorded output, perceived effort, environmental strain, measured economy and physiological capacity. Historical threshold paces are context, not mandatory outputs or validated physiological boundaries. Choose recovery, modest threshold or higher-intensity work from the athlete\'s response and the whole week, not from one watch trace.');
canon = once(canon,
 'Do not force a faster Tuesday float merely because the athlete can run one. A float is recovery while moving. Let it become faster naturally when the athlete can cover more ground without making the following race-pace repetition more expensive.',
 'Recovery pace is not another performance target. Use very easy recoveries; record any walking or stopping honestly. A faster float is a different prescription, not required evidence of progress.');
canon += '\n## October 6 external-review amendment\n\nRevision 4 generalized a threshold-deficit hypothesis and substituted 36 work minutes for 15 without sufficient athlete-specific evidence. That default is withdrawn. Restoring the earlier reusable publication does not overwrite existing athlete history or current individual recovery decisions. No automatic dose change is sent to other athletes. The October 13 decision is prospective: start only when ready; no rescue surges; unexpected high early effort means reduce or stop. The next continuous checkpoint remains conditional and cannot establish treatment causality. Proposed wider October 13–20 reductions remain for explicit coach approval.\n';
fs.writeFileSync(canonPath,canon);
const evidence = JSON.parse(fs.readFileSync(evidencePath,'utf8'));
const protectedEvidence = JSON.stringify([evidence.work_reps,evidence.work_total,evidence.recoveries,evidence.activity,evidence.athlete_report,evidence.coach_mindset_evidence]);
const priorDecision = evidence.study_read.decision;
evidence.study_read.decision = 'October 6 review correction: recovery-first on October 8. The session demonstrates eight broken work miles at high reported effort, not a diagnosed threshold deficit. Six continuous miles remains the latest completed rung; October 20 remains conditional.';
evidence.review_amendment = {date:'2026-10-06',superseded_interpretation:priorDecision,reason:'External reviews identified underdetermined mechanism and accumulated session-load risk.',current_individual_change:'Jose October 8: 40 min easy, shortened or omitted when unrecovered; optional relaxed strides only with normal legs.',generic_change:'Withdraw automatic W7 3 x 12 replacement; restore preceding reusable publication without migrating individual assignments.',future_scope:'No additional October 13–20 dose change is enacted by this source correction.'};
assert.equal(JSON.stringify([evidence.work_reps,evidence.work_total,evidence.recoveries,evidence.activity,evidence.athlete_report,evidence.coach_mindset_evidence]),protectedEvidence);
fs.writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
const preview = JSON.parse(fs.readFileSync(previewPath,'utf8'));
preview.source_sha256=crypto.createHash('sha256').update(study).digest('hex');
preview.latest_support.decision=evidence.study_read.decision;
preview.review_amendment={date:'2026-10-06',source_url:'/labs/speed-that-endures/#oct6-review',status:'Recovery-first individual correction; universal threshold substitution withdrawn.'};
fs.writeFileSync(previewPath,JSON.stringify(preview,null,2)+'\n');
const roadmapPath='docs/roadmap/FORM-ROADMAP.md';
const roadmap=fs.readFileSync(roadmapPath,'utf8');
fs.writeFileSync(roadmapPath,once(roadmap,'# FORM: current state and next actions\n','# FORM: current state and next actions\n\n## October 6 · External-review correction\n\n- The automatic W7 3 × 12 threshold replacement is withdrawn, not defended as a diagnosed physiological need. The preceding reusable publication is restored; athlete assignments are not migrated.\n- José October 8 is versioned easy recovery. Other athletes retain their own current coach gates; private restrictions are not published here. Historical work, bands and signature language are preserved.\n- Study interpretation, dated source, calendar and public preview reviewed together. October 13 decision rules are written before its result; wider fortnight dose changes remain for explicit coach approval.\n- Source checks and actual deploy state belong in this correction\'s PR receipt. Physical-device confirmation remains separate.\n'));
cp.execFileSync(process.execPath,['scripts/build-commercial.cjs'],{stdio:'inherit'});
cp.execFileSync(process.execPath,['tests/public-study-preview.cjs'],{stdio:'inherit'});
console.log('PASS: evidence, photographs, existing anchors and reviewed public projection preserved.');
