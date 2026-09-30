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
// Assert the retained W3 evidence rather than a summary sentence retired by the W4 publication.
has(study,'2 × 10 threshold work at 6:22 · 6:24','study threshold evidence supports Hope threshold canon');

has(migration,"RPD v5 effective W5 by coach decision","private assignment cutover is explicit");
has(migration,"How far can you hold 6:45–7:00 without it coming apart?","Hope private mark question matches study");
has(migration,"Hope study canon effective W5: race pace 6:45–7:00/mi; threshold 6:20–6:25/mi","Hope future athlete copy names current study canon");
has(migration,"W5 Thursday did not resolve to Threshold 3 × 10 for both athletes","migration proves W5 Thursday");
has(migration,"study-canon 6:45–7:00 / 2 min float","migration proves human-readable W5 Tuesday recovery");

has(connected,'One coaching truth.','connected-surfaces doctrine owns the rule');
has(agents,'Athlete coaching source-of-truth rule','repo agent instructions own the rule');

// Headline copy changes as new evidence is published. Check the retained W5
// record, not a former headline calling the now-completed six-mile step future.
const w5Start = study.indexOf('\n  w5:{');
const w6Start = study.indexOf('\n  w6:{', w5Start);
assert.ok(w5Start >= 0 && w6Start > w5Start, 'retained W5/W6 evidence boundaries exist'); checks++;
const w5 = study.slice(w5Start, w6Start);
has(w5,'Sep 15: both completed 5 mi continuous.','W5 preserves the completed continuous step');
has(w5,'Sep 29: 6 mi continuous remains planned.','W5 preserves what was planned at the time, not a new current prescription');
has(study,'data-key="w4" data-state="filed"','W4 remains a recorded historical result');
has(study,'data-key="w5" data-state="filed"','W5 is filed as its own support session');

const w9Start = study.indexOf('\n  w9:{', w6Start);
assert.ok(w9Start > w6Start, 'retained W6 evidence boundary exists'); checks++;
const w6 = study.slice(w6Start, w9Start);
has(w6,'Sep 29 · W6 · 6 mi continuous · recorded','W6 is now recorded, not reset to planned');
has(w6,'6.00 mi continuous · 39:16.0 · 6:33 /mi','W6 retains the first athlete work-segment output');
has(w6,'6.00 mi continuous · 40:53.8 · 6:49 /mi','W6 retains the second athlete work-segment output');
has(w6,'Oct 06 · 4 × 2 mi / 2:00 floats · same band','W6 retains the next authored step without a faster band');

console.log('PASS:',checks,'athlete study/app source-of-truth checks');
