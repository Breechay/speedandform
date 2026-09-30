const fs = require('fs');
const assert = require('assert');

const study = fs.readFileSync('labs/speed-that-endures/index.html','utf8');
const connected = fs.readFileSync('docs/FORM_CONNECTED_SURFACES.md','utf8');
const agents = fs.readFileSync('AGENTS.md','utf8');
const migration = fs.readFileSync('supabase/migrations/20260918103000_rpd_v5_coached_athletes_w5_cutover.sql','utf8');

let checks=0;
const has=(text,needle,msg)=>{assert.ok(text.includes(needle),msg||needle);checks++;};

has(study,'Sep 22<br/>W5</div><div><b>5 × 1 mi · 2 min float</b>','study W5 Tuesday is canonical');
has(study,'Sep 24<br/>W5</div><div><b>3 × 10 min threshold</b>','study W5 Thursday is canonical');
has(study,'Hope is now working at 6:45–7:00','study carries Hope race-pace canon');
has(study,'2 × 10 threshold work at 6:22 · 6:24','study threshold evidence supports Hope threshold canon');

has(migration,"RPD v5 effective W5 by coach decision","private assignment cutover is explicit");
has(migration,"How far can you hold 6:45–7:00 without it coming apart?","Hope private mark question matches study");
has(migration,"Hope study canon effective W5: race pace 6:45–7:00/mi; threshold 6:20–6:25/mi","Hope future athlete copy names current study canon");
has(migration,"W5 Thursday did not resolve to Threshold 3 × 10 for both athletes","migration proves W5 Thursday");
has(migration,"study-canon 6:45–7:00 / 2 min float","migration proves human-readable W5 Tuesday recovery");

has(connected,'One coaching truth.','connected-surfaces doctrine owns the rule');
has(agents,'Athlete coaching source-of-truth rule','repo agent instructions own the rule');

// Check dated evidence records, not retired headline sentences or timeline
// markup. New publication must neither erase history nor turn a completed
// result back into a future prescription to satisfy an older UI assertion.
function evidenceBetween(key,nextKey) {
  const start=study.indexOf(`\n  ${key}:{`);
  const end=study.indexOf(`\n  ${nextKey}:{`,start);
  assert.ok(start>=0&&end>start,`${key} retained evidence boundaries exist`);checks++;
  return study.slice(start,end);
}
const w4=evidenceBetween('w4','w5');
has(w4,'Sep 15 · W4 · 5 mi continuous · recorded','W4 remains recorded');
has(w4,'5.00 mi continuous · 33:40.8 · 6:44 /mi','W4 preserves the first athlete work segment');
has(w4,'5.00 mi continuous · 34:17.9 · 6:52 /mi','W4 preserves the second athlete work segment');

const w5=evidenceBetween('w5','w6');
has(w5,'Sep 22 · W5 · 5 × 1 mi / 2:00 floats · recorded','W5 remains a recorded support session');
has(w5,'Sep 15: both completed 5 mi continuous.','W5 preserves the completed continuous step');
has(w5,'Sep 29: 6 mi continuous remains planned.','W5 preserves what was planned at the time');
has(w5,'5 × 1 mi · 33:11.1 work · 6:38.2 /mi work average','W5 preserves the first athlete work-only output');
has(w5,'5 × 1 mi · 33:48.0 work · 6:45.6 /mi work average','W5 preserves the second athlete work-only output');

const w6=evidenceBetween('w6','w9');
has(w6,'Sep 29 · W6 · 6 mi continuous · recorded','W6 is now recorded, not reset to planned');
has(w6,'6.00 mi continuous · 39:16.0 · 6:33 /mi','W6 preserves the first athlete work segment');
has(w6,'6.00 mi continuous · 40:53.8 · 6:49 /mi','W6 preserves the second athlete work segment');
has(w6,'Oct 06 · 4 × 2 mi / 2:00 floats · same band','W6 preserves the next authored step without a faster band');

console.log('PASS:',checks,'athlete study/app source-of-truth checks');
