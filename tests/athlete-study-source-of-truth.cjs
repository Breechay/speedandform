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
has(study,"Hope's sat around 6:23","study threshold evidence supports Hope threshold canon");

has(migration,"RPD v5 effective W5 by coach decision","private assignment cutover is explicit");
has(migration,"How far can you hold 6:45–7:00 without it coming apart?","Hope private mark question matches study");
has(migration,"Hope study canon effective W5: race pace 6:45–7:00/mi; threshold 6:20–6:25/mi","Hope future athlete copy names current study canon");
has(migration,"W5 Thursday did not resolve to Threshold 3 × 10 for both athletes","migration proves W5 Thursday");
has(migration,"study-canon 6:45–7:00 / 2 min float","migration proves human-readable W5 Tuesday recovery");

has(connected,'One coaching truth.','connected-surfaces doctrine owns the rule');
has(agents,'Athlete coaching source-of-truth rule','repo agent instructions own the rule');

console.log('PASS:',checks,'athlete study/app source-of-truth checks');
